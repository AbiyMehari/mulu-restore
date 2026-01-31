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

    const item = await Product.findById(id).populate('category', 'name slug').lean();
    if (!item) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/products/:id
 * Update a product (admin)
 *
 * Note: We validate against `createProductSchema` because the current admin edit UI
 * sends the full set of fields rather than partial updates.
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
    if (body.stockQuantity !== undefined) {
      body.stock = body.stockQuantity;
      delete body.stockQuantity;
    }
    if (body.shortDescription !== undefined) {
      body.descriptionShort = body.shortDescription;
      delete body.shortDescription;
    }
    if (body.fullDescription !== undefined) {
      body.description = body.fullDescription;
      delete body.fullDescription;
    }
    if (Array.isArray(body.images) && body.images.every((x: unknown) => typeof x === "string")) {
      body.images = body.images.map((url: string) => ({ url }));
    }

    const validatedData = createProductSchema.parse(body);

    // Verify category exists
    if (!mongoose.Types.ObjectId.isValid(validatedData.categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    const category = await Category.findById(validatedData.categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 400 });
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

    const product = await Product.findByIdAndUpdate(id, update, { new: true })
      .populate('category', 'name slug');

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ item: product });
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
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

