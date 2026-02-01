import { NextResponse } from 'next/server';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
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

/**
 * GET /api/admin/dashboard
 * Admin dashboard KPIs + recent activity
 */
export async function GET() {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const revenueStatuses = ['paid', 'processing', 'shipped', 'completed'];

    const [totalOrders, totalProducts, totalCustomers, revenueAgg, recent] = await Promise.all([
      Order.countDocuments({}),
      Product.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { status: { $in: revenueStatuses } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id createdAt status totalAmount user guestEmail shippingAddress')
        .populate('user', 'email')
        .lean(),
    ]);

    const totalRevenue = Array.isArray(revenueAgg) && revenueAgg.length > 0 ? Number(revenueAgg[0]?.totalRevenue ?? 0) : 0;

    const recentOrders = (Array.isArray(recent) ? recent : []).map((o: any) => {
      const id = typeof o._id === 'string' ? o._id : o._id?.toString?.() ?? o._id;
      const customerEmail =
        (typeof o?.user?.email === 'string' && o.user.email) ||
        (typeof o?.guestEmail === 'string' && o.guestEmail) ||
        (typeof o?.shippingAddress?.email === 'string' && o.shippingAddress.email) ||
        '';

      return {
        _id: id,
        createdAt: o.createdAt,
        status: typeof o.status === 'string' ? o.status : 'pending',
        totalAmount: typeof o.totalAmount === 'number' ? o.totalAmount : 0,
        customerEmail,
      };
    });

    return NextResponse.json(
      {
        totalOrders: typeof totalOrders === 'number' ? totalOrders : 0,
        totalRevenue,
        totalProducts: typeof totalProducts === 'number' ? totalProducts : 0,
        totalCustomers: typeof totalCustomers === 'number' ? totalCustomers : 0,
        recentOrders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

