import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';
import '@/models/Category';

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  }
  return value
    .map((v) => (v && typeof v === 'object' ? (v as any).url : undefined))
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
}

/**
 * GET /api/products/:slug
 * Public product detail by slug (no auth)
 */
export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    await connectDB();

    // Note: the dynamic segment folder is named [id], but the value is treated as the product slug.
    const slug = context.params.id;

    const product = await Product.findOne({
      slug,
      isDeleted: false,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .populate('category', 'name slug')
      .select('title price stockQuantity images fullDescription condition category')
      .lean();

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        item: {
          title: product.title,
          price: product.price,
          stockQuantity: typeof (product as any).stockQuantity === 'number' ? (product as any).stockQuantity : 0,
          images: normalizeImages((product as any).images),
          description: (product as any).fullDescription,
          condition: (product as any).condition,
          category: (product as any).category
            ? { name: (product as any).category.name, slug: (product as any).category.slug }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error loading product:', error);
    return NextResponse.json({ error: 'Failed to load product' }, { status: 500 });
  }
}

