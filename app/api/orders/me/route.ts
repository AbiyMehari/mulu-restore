import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/orders/me
 * List orders for the authenticated user
 */
export async function GET() {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const orders = await Order.find({ user: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id status currency totalAmount createdAt')
      .lean();

    const items = (Array.isArray(orders) ? orders : []).map((o: any) => ({
      _id: typeof o._id === 'string' ? o._id : o._id?.toString?.() ?? o._id,
      status: typeof o.status === 'string' ? o.status : 'pending',
      currency: typeof o.currency === 'string' ? o.currency : 'EUR',
      totalAmount: typeof o.totalAmount === 'number' ? o.totalAmount : 0,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error listing my orders:', error);
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}

