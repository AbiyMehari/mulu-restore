import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Category';

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];

  // string[]
  if (typeof value[0] === 'string') {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }

  // { url: string }[]
  return value
    .map((v) => (v && typeof v === 'object' ? (v as any).url : undefined))
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
}

/**
 * GET /api/products
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;

    const pageRaw = searchParams.get('page');
    const limitRaw = searchParams.get('limit');
    const sortRaw = (searchParams.get('sort') || '').trim().toLowerCase();

    const pageParsed = pageRaw ? parseInt(pageRaw, 10) : NaN;
    const limitParsed = limitRaw ? parseInt(limitRaw, 10) : NaN;

    const page = Number.isFinite(pageParsed) ? Math.max(1, pageParsed) : 1;
    const limit = Number.isFinite(limitParsed) ? Math.min(100, Math.max(1, limitParsed)) : 20;
    const skip = (page - 1) * limit;

    let sort: Record<string, 1 | -1> = { createdAt: -1 }; // default newest
    if (sortRaw === 'oldest' || sortRaw === 'createdat_asc' || sortRaw === 'created_at_asc') {
      sort = { createdAt: 1 };
    }
    if (sortRaw === 'newest' || sortRaw === 'createdat_desc' || sortRaw === 'created_at_desc') {
      sort = { createdAt: -1 };
    }

    const filter = {
      isDeleted: false,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .select('_id title slug price images category')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const items = products.map((p: any) => ({
      _id: typeof p._id === 'string' ? p._id : p._id?.toString?.() ?? p._id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      images: normalizeImages(p.images),
      category:
        p.category && typeof p.category === 'object'
          ? { name: p.category?.name, slug: p.category?.slug }
          : null,
    }));

    return NextResponse.json({ items, total, page, limit }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}
