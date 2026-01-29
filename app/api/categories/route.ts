import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Category from '@/models/Category';

/**
 * GET /api/categories
 * Returns all categories sorted by name ascending
 */
export async function GET() {
  try {
    await connectDB();
    const items = await Category.find({})
      .select('_id name slug')
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
