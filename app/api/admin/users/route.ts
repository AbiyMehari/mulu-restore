import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

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
 * GET /api/admin/users
 * List all users (admin)
 */
export async function GET() {
  const authResponse = await ensureAdmin();
  if (authResponse) return authResponse;

  try {
    await connectDB();

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select('_id email role name createdAt')
      .lean();

    const items = users.map((u: any) => ({
      _id: typeof u._id === 'string' ? u._id : u._id?.toString?.() ?? u._id,
      email: u.email,
      role: u.role,
      name: u.name,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

