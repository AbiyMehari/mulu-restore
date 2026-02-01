import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { requireAuth } from '@/lib/auth';

/**
 * GET /api/orders/:id
 * Order detail for authenticated user
 */
export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = context.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    await connectDB();

    const order = await Order.findOne({ _id: id, user: user.id })
      .select('_id status currency totalAmount items createdAt shippingAddress')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const item = {
      _id: typeof order._id === 'string' ? order._id : order._id?.toString?.() ?? order._id,
      status: typeof (order as any).status === 'string' ? (order as any).status : 'pending',
      currency: typeof (order as any).currency === 'string' ? (order as any).currency : 'EUR',
      totalAmount: typeof (order as any).totalAmount === 'number' ? (order as any).totalAmount : 0,
      createdAt: (order as any).createdAt,
      items: Array.isArray((order as any).items)
        ? (order as any).items.map((it: any) => ({
            title: it.title,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
          }))
        : [],
      shippingAddress: (order as any).shippingAddress
        ? {
            fullName: (order as any).shippingAddress.fullName,
            email: (order as any).shippingAddress.email,
            street: (order as any).shippingAddress.street,
            city: (order as any).shippingAddress.city,
            postalCode: (order as any).shippingAddress.postalCode,
            country: (order as any).shippingAddress.country,
          }
        : null,
    };

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error('Error loading order:', error);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}

