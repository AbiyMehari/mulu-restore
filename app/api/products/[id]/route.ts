import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

/**
 * GET /api/products/:slug
 * Public product detail by slug (no auth)
 */
export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    await connectDB();

    // Note: the dynamic segment folder is named [id], but the value is treated as the product slug.
    const slug = context.params.id;

    const product = await Product.findOne({ slug, isActive: true, isDeleted: false })
      .populate('category', 'name slug')
      .select('title price images fullDescription condition category')
      .lean();

    if (!product) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        item: {
          title: product.title,
          price: product.price,
          images: Array.isArray((product as any).images) ? (product as any).images : [],
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

