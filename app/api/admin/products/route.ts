import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { createProductSchema } from '@/lib/validations';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

/**
 * POST /api/admin/products
 * Creates a new product
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication required';
    if (message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (message === 'Admin access required') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Connect to database
    await connectDB();

    // Parse and validate request body
    const body = await request.json();
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
        { status: 404 }
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
