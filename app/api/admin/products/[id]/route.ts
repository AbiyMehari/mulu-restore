import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';

async function ensureAdmin() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication required';
    if (message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (message === 'Admin access required') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

function validateObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/admin/products/:id
 * Fetch one product (admin)
 */
export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!validateObjectId(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    await connectDB();

    const item = await Product.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('category', 'name slug')
      .lean();
    if (!item) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!validateObjectId(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    await connectDB();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};

    if ('title' in (body as any)) {
      if (typeof (body as any).title !== 'string' || !(body as any).title.trim()) {
        return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
      }
      update.title = (body as any).title.trim();
    }

    if ('slug' in (body as any)) {
      if (typeof (body as any).slug !== 'string' || !(body as any).slug.trim()) {
        return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
      }
      update.slug = (body as any).slug.trim();
    }

    if ('price' in (body as any)) {
      const price = (body as any).price;
      if (typeof price !== 'number' || !Number.isFinite(price) || !Number.isInteger(price) || price < 0) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      update.price = price;
    }

    if ('currency' in (body as any)) {
      const currency = (body as any).currency;
      if (typeof currency !== 'string' || !currency.trim()) {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
      }
      // Product model currently only supports EUR
      if (currency.trim() !== 'EUR') {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
      }
      update.currency = currency.trim();
    }

    if ('stockQuantity' in (body as any)) {
      const stockQuantity = (body as any).stockQuantity;
      if (typeof stockQuantity !== 'number' || !Number.isFinite(stockQuantity) || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
        return NextResponse.json({ error: 'Invalid stockQuantity' }, { status: 400 });
      }
      update.stockQuantity = stockQuantity;
    }

    if ('categoryId' in (body as any)) {
      const categoryId = (body as any).categoryId;
      if (typeof categoryId !== 'string' || !categoryId.trim() || !mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
      }
      const category = await Category.findById(categoryId.trim());
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
      update.category = categoryId.trim();
    }

    if ('condition' in (body as any)) {
      const condition = (body as any).condition;
      if (condition !== 'vintage' && condition !== 'restored' && condition !== 'used') {
        return NextResponse.json({ error: 'Invalid condition' }, { status: 400 });
      }
      update.condition = condition;
    }

    if ('shortDescription' in (body as any)) {
      const shortDescription = (body as any).shortDescription;
      if (typeof shortDescription !== 'string') {
        return NextResponse.json({ error: 'Invalid shortDescription' }, { status: 400 });
      }
      update.shortDescription = shortDescription;
    }

    if ('fullDescription' in (body as any)) {
      const fullDescription = (body as any).fullDescription;
      if (typeof fullDescription !== 'string') {
        return NextResponse.json({ error: 'Invalid fullDescription' }, { status: 400 });
      }
      update.fullDescription = fullDescription;
    }

    if ('images' in (body as any)) {
      const images = (body as any).images;
      if (!Array.isArray(images)) {
        return NextResponse.json({ error: 'Invalid images' }, { status: 400 });
      }
      const urls: string[] = [];
      for (const img of images) {
        if (!img || typeof img !== 'object' || typeof (img as any).url !== 'string') {
          return NextResponse.json({ error: 'Invalid images' }, { status: 400 });
        }
        const url = (img as any).url.trim();
        if (url) urls.push(url);
      }
      update.images = urls;
    }

    if ('isActive' in (body as any)) {
      const isActive = (body as any).isActive;
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'Invalid isActive' }, { status: 400 });
      }
      update.isActive = isActive;
    }

    if ('shipping' in (body as any)) {
      const shipping = (body as any).shipping;
      if (!shipping || typeof shipping !== 'object') {
        return NextResponse.json({ error: 'Invalid shipping' }, { status: 400 });
      }

      if ('pickupOnly' in shipping) {
        if (typeof (shipping as any).pickupOnly !== 'boolean') {
          return NextResponse.json({ error: 'Invalid shipping.pickupOnly' }, { status: 400 });
        }
        update['shipping.pickupOnly'] = (shipping as any).pickupOnly;
      }
      if ('shippingPossible' in shipping) {
        if (typeof (shipping as any).shippingPossible !== 'boolean') {
          return NextResponse.json({ error: 'Invalid shipping.shippingPossible' }, { status: 400 });
        }
        update['shipping.shippingPossible'] = (shipping as any).shippingPossible;
      }
      if ('shippingNotes' in shipping) {
        if ((shipping as any).shippingNotes != null && typeof (shipping as any).shippingNotes !== 'string') {
          return NextResponse.json({ error: 'Invalid shipping.shippingNotes' }, { status: 400 });
        }
        update['shipping.shippingNotes'] = (shipping as any).shippingNotes;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true }
    ).populate('category', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ item: product });
  } catch (error) {
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json({ error: 'Product with this slug already exists' }, { status: 409 });
    }

    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/products/:id
 * Soft delete a product (admin)
 */
export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!validateObjectId(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    await connectDB();

    const product = await Product.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

