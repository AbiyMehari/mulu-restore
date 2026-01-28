import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Product from '@/models/Product';

/**
 * GET /api/products
 * Returns paginated list of active, non-deleted products
 * No authentication required
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Validate pagination parameters
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const skip = (pageNumber - 1) * limitNumber;

    // Build query filter
    const filter: any = {
      isActive: true,
      isDeleted: false,
    };

    // Add category filter if provided
    if (category) {
      filter.category = category;
    }

    // Add search filter if provided (search in title and descriptions)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { fullDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .select('-fullDescription') // Exclude full description from list
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return NextResponse.json({
      products,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
