import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { createProductSchema } from '@/lib/validations';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

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

/**
 * GET /api/admin/products
 * List all products (admin)
 */
export async function GET(request: NextRequest) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const q = (searchParams.get('q') ?? '').trim();
    const pageRaw = searchParams.get('page');
    const limitRaw = searchParams.get('limit');

    const pageParsed = pageRaw ? parseInt(pageRaw, 10) : NaN;
    const limitParsed = limitRaw ? parseInt(limitRaw, 10) : NaN;

    const page = Number.isFinite(pageParsed) ? Math.max(1, pageParsed) : 1;
    const limit = Number.isFinite(limitParsed) ? Math.min(200, Math.max(1, limitParsed)) : 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { slug: regex }];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return NextResponse.json({ items, total });
  } catch (error) {
    console.error('Error listing products:', error);
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 });
  }
}

/**
 * POST /api/admin/products
 * Creates a new product (admin)
 */
export async function POST(request: NextRequest) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

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
    if (Array.isArray(body.images) && body.images.every((x: unknown) => typeof x === 'string')) {
      body.images = body.images.map((url: string) => ({ url }));
    }

    const validatedData = createProductSchema.parse(body);

    // Verify category exists
    if (!mongoose.Types.ObjectId.isValid(validatedData.categoryId)) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const category = await Category.findById(validatedData.categoryId);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      );
    }

    // Map API field names to model field names
    const productData: any = {
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
      isDeleted: false,
      viewCount: 0,
    };

    // Create product
    const product = await Product.create(productData);

    // Populate category for response
    await product.populate('category', 'name slug');

    return NextResponse.json(
      { item: product },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    // Handle Mongoose duplicate key error (e.g., duplicate slug)
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
