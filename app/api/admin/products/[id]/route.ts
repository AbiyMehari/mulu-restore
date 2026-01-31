import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import { createProductSchema } from '@/lib/validations';
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
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/products/:id
 * Update a product (admin)
 *
 * Note: We validate against `createProductSchema` (same as POST /api/admin/products).
 */
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!validateObjectId(id)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
  }

  try {
    await connectDB();

    let body = await request.json();

    // Normalize client field names to schema
    if ((body as any).stockQuantity !== undefined) {
      (body as any).stock = (body as any).stockQuantity;
      delete (body as any).stockQuantity;
    }
    if ((body as any).shortDescription !== undefined) {
      (body as any).descriptionShort = (body as any).shortDescription;
      delete (body as any).shortDescription;
    }
    if ((body as any).fullDescription !== undefined) {
      (body as any).description = (body as any).fullDescription;
      delete (body as any).fullDescription;
    }
    if (Array.isArray((body as any).images) && (body as any).images.every((x: unknown) => typeof x === 'string')) {
      (body as any).images = (body as any).images.map((url: string) => ({ url }));
    }

    const validatedData = createProductSchema.parse(body);

    // Verify category exists
    if (!mongoose.Types.ObjectId.isValid(validatedData.categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const category = await Category.findById(validatedData.categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const update: any = {
      title: validatedData.title,
      slug: validatedData.slug,
      price: validatedData.price,
      currency: validatedData.currency,
      stockQuantity: validatedData.stock,
      category: validatedData.categoryId,
      images: validatedData.images?.map((img) => img.url) || [],
      shortDescription: validatedData.descriptionShort || '',
      fullDescription: validatedData.description || '',
      condition: validatedData.condition,
      attributes: validatedData.attributes || {},
      dimensions: validatedData.dimensions || {},
      shipping: {
        pickupOnly: validatedData.shipping?.pickupOnly ?? false,
        shippingPossible: validatedData.shipping?.shippingPossible ?? false,
        shippingNotes: validatedData.shipping?.shippingNotes,
      },
      isActive: validatedData.isActive,
    };

    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true }
    ).populate('category', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ item: product }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }

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

