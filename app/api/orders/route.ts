import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';

type CreateOrderBody = {
  email?: unknown;
  fullName?: unknown;
  street?: unknown;
  city?: unknown;
  postalCode?: unknown;
  country?: unknown;
  phone?: unknown;
  items?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * POST /api/orders
 * Guest checkout order creation (no auth)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json().catch(() => null)) as CreateOrderBody | null;
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }

    const email = asTrimmedString(body.email).toLowerCase();
    const fullName = asTrimmedString(body.fullName);
    const street = asTrimmedString(body.street);
    const city = asTrimmedString(body.city);
    const postalCode = asTrimmedString(body.postalCode);
    const country = asTrimmedString(body.country);
    const phone = asTrimmedString(body.phone);

    if (!email || !fullName || !street || !city || !postalCode || !country) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }

    const items = [];
    let totalAmount = 0;

    for (const raw of body.items) {
      if (!raw || typeof raw !== 'object') {
        return NextResponse.json({ error: 'Validation error' }, { status: 400 });
      }
      const r = raw as any;

      const productId = asTrimmedString(r.productId);
      const title = asTrimmedString(r.title);
      const unitPriceRaw = asNumber(r.unitPrice);
      const quantityRaw = asNumber(r.quantity);

      const unitPrice = Number.isFinite(unitPriceRaw) ? Math.max(0, Math.round(unitPriceRaw)) : NaN;
      const quantity = Number.isFinite(quantityRaw) ? Math.max(0, Math.floor(quantityRaw)) : NaN;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json({ error: 'Validation error' }, { status: 400 });
      }
      if (!title) {
        return NextResponse.json({ error: 'Validation error' }, { status: 400 });
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: 'Validation error' }, { status: 400 });
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Validation error' }, { status: 400 });
      }

      items.push({
        product: new mongoose.Types.ObjectId(productId),
        title,
        unitPrice,
        quantity,
      });

      totalAmount += unitPrice * quantity;
    }

    const order = await Order.create({
      guestEmail: email,
      status: 'pending',
      currency: 'EUR',
      totalAmount,
      items,
      shippingAddress: {
        fullName,
        email,
        phone: phone || undefined,
        street,
        city,
        postalCode,
        country,
      },
    });

    return NextResponse.json({ item: { _id: order._id.toString() } }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

