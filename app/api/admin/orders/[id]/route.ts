import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema } from 'mongoose';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';

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

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number },
    unitPrice: { type: Number },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'EUR' },
    status: { type: String, required: true, default: 'pending' },
  },
  { timestamps: true }
);

const Order = (mongoose.models.Order as mongoose.Model<any>) || mongoose.model('Order', OrderSchema);

/**
 * GET /api/admin/orders/:id
 * Get a single order (admin)
 */
export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    await connectDB();

    const order = await Order.findById(id)
      .populate('user', 'email')
      .populate('items.product', 'title')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const item = {
      _id: typeof order._id === 'string' ? order._id : order._id?.toString?.() ?? order._id,
      user: { email: order.user?.email },
      status: order.status,
      currency: order.currency,
      totalAmount: order.totalAmount,
      items: Array.isArray(order.items)
        ? order.items.map((it: any) => ({
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            product: it.product
              ? {
                  _id:
                    typeof it.product._id === 'string'
                      ? it.product._id
                      : it.product._id?.toString?.() ?? it.product._id,
                  title: it.product.title,
                }
              : undefined,
          }))
        : [],
      createdAt: order.createdAt,
    };

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    console.error('Error loading order:', error);
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/orders/:id
 * Update order status only (admin)
 */
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  const id = context.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const status = body && typeof (body as any).status === 'string' ? (body as any).status : '';

  const allowedStatuses = ['pending', 'paid', 'shipped', 'cancelled'] as const;
  if (!allowedStatuses.includes(status as any)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    await connectDB();

    const updated = await Order.findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .select('_id status')
      .lean();

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        item: {
          _id: typeof updated._id === 'string' ? updated._id : updated._id?.toString?.() ?? updated._id,
          status: updated.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

