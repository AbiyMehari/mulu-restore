import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import Category from '@/models/Category';

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
 * GET /api/admin/categories
 * List all categories (admin)
 */
export async function GET() {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  try {
    await connectDB();
    const items = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error listing categories:', error);
    return NextResponse.json({ error: 'Failed to list categories' }, { status: 500 });
  }
}

/**
 * POST /api/admin/categories
 * Create a category (admin)
 */
export async function POST(request: NextRequest) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const name = typeof (body as any).name === 'string' ? (body as any).name.trim() : '';
    const slug = typeof (body as any).slug === 'string' ? (body as any).slug.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const item = await Category.create({ name, slug });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    // Handle Mongoose duplicate key error (e.g., duplicate slug)
    if (error instanceof Error && (error as any).code === 11000) {
      return NextResponse.json({ error: 'Category with this slug already exists' }, { status: 409 });
    }

    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
