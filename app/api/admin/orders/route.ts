import { NextResponse } from 'next/server';
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
 * GET /api/admin/orders
 * List all orders (admin)
 */
export async function GET() {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .select('_id user guestEmail shippingAddress items totalAmount currency status createdAt')
      .populate('user', 'email')
      .populate('items.product', 'title')
      .lean();

    const items = orders.map((o: any) => {
      // Get customer email from user (if logged in) or guestEmail/shippingAddress.email (if guest)
      const customerEmail = 
        o.user?.email || 
        o.guestEmail || 
        o.shippingAddress?.email || 
        null;

      return {
        _id: typeof o._id === 'string' ? o._id : o._id?.toString?.() ?? o._id,
        user: { email: customerEmail },
        totalAmount: o.totalAmount,
        currency: o.currency,
        status: o.status,
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error listing orders:', error);
    return NextResponse.json({ error: 'Failed to list orders' }, { status: 500 });
  }
}

