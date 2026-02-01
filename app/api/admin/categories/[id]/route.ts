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

/**
 * DELETE /api/admin/categories/:id
 * Delete a category (admin)
 */
export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
  }

  try {
    await connectDB();

    const inUse = await Product.exists({ category: id, isDeleted: false });
    if (inUse) {
      return NextResponse.json({ error: 'Category is in use' }, { status: 409 });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

