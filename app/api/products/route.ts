import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

/**
 * GET /api/products
 * No authentication required
 */
export async function GET() {
  try {
    await connectDB();

    const filter = {
      isActive: true,
      isDeleted: false,
    };

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .select('_id title slug price images category')
      .sort({ createdAt: -1 })
      .lean();

    const items = products.map((p: any) => ({
      _id: typeof p._id === 'string' ? p._id : p._id?.toString?.() ?? p._id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      images: Array.isArray(p.images) ? p.images : [],
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
