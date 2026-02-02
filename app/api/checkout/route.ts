import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getStripe } from '@/lib/stripe';
import { getBaseUrl, STRIPE_SECRET_KEY } from '@/config/stripe';

export const runtime = 'nodejs';

type CreateCheckoutBody = {
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
 * POST /api/checkout
 * Create Stripe Checkout Session (guest checkout)
 */
export async function POST(request: NextRequest) {
  const decrementedByProductId: Record<string, number> = {};
  let createdOrderId: string | null = null;

  try {
    // Fail fast if Stripe isn't configured (avoid creating/cancelling orders unnecessarily).
    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.includes('...')) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local (use a real test key, not sk_test_...).' },
        { status: 500 }
      );
    }

    await connectDB();

    const body = (await request.json().catch(() => null)) as CreateCheckoutBody | null;
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

    const requestedByProductId = new Map<
      string,
      {
        productId: string;
        title: string;
        unitPrice: number;
        quantity: number;
      }
    >();

    for (const raw of body.items) {
      if (!raw || typeof raw !== 'object') {
        return NextResponse.json({ error: 'Invalid item: expected object' }, { status: 400 });
      }
      const r = raw as any;

      const productId = asTrimmedString(r.productId);
      const title = asTrimmedString(r.title);
      const unitPriceRaw = asNumber(r.unitPrice);
      const quantityRaw = asNumber(r.quantity);

      const unitPrice = Number.isFinite(unitPriceRaw) ? Math.max(0, Math.round(unitPriceRaw)) : NaN;
      const quantity = Number.isFinite(quantityRaw) ? Math.max(0, Math.floor(quantityRaw)) : NaN;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return NextResponse.json({ error: 'Invalid item: productId is required' }, { status: 400 });
      }
      if (!Number.isFinite(quantity) || quantity < 1) {
        return NextResponse.json({ error: 'Invalid item: quantity must be >= 1' }, { status: 400 });
      }
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: 'Invalid item: unitPrice is required' }, { status: 400 });
      }

      const existing = requestedByProductId.get(productId);
      if (!existing) {
        requestedByProductId.set(productId, { productId, title, unitPrice, quantity });
      } else {
        requestedByProductId.set(productId, {
          productId,
          title: existing.title || title,
          unitPrice: typeof existing.unitPrice === 'number' ? existing.unitPrice : unitPrice,
          quantity: existing.quantity + quantity,
        });
      }
    }

    const requestedItems = Array.from(requestedByProductId.values());
    if (requestedItems.length === 0) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }

    // Validate products exist/active/not-deleted and have enough stock.
    // Also canonicalize title/unitPrice from the DB (do not trust client price).
    const ids = requestedItems.map((it) => new mongoose.Types.ObjectId(it.productId));
    const products = await Product.find({
      _id: { $in: ids },
      isDeleted: false,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .select('_id title price stockQuantity')
      .lean();

    const byId = new Map<string, { title?: string; stockQuantity?: number; price?: number }>();
    for (const p of products as any[]) {
      const id = typeof p._id === 'string' ? p._id : p._id?.toString?.() ?? '';
      if (id) byId.set(id, { title: p.title, stockQuantity: p.stockQuantity, price: p.price });
    }

    const canonicalRequestedItems = requestedItems.map((it) => {
      const p = byId.get(it.productId);
      return {
        ...it,
        title: (p?.title as string) || it.title || 'Item',
        unitPrice: typeof p?.price === 'number' ? Math.max(0, Math.round(p.price)) : it.unitPrice,
      };
    });

    // Build order line-item snapshot
    const items = canonicalRequestedItems.map((it) => ({
      product: new mongoose.Types.ObjectId(it.productId),
      title: it.title,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    }));

    const totalAmount = canonicalRequestedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

    for (const it of canonicalRequestedItems) {
      const p = byId.get(it.productId);
      if (!p) {
        return NextResponse.json({ error: 'Invalid product', productId: it.productId }, { status: 400 });
      }
      const titleForMsg = p.title || it.title || 'item';
      const stockQty = typeof p.stockQuantity === 'number' ? p.stockQuantity : -1;
      if (stockQty < it.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${titleForMsg}` }, { status: 409 });
      }
    }

    const tryTransaction = async () => {
      const session = await mongoose.startSession();
      try {
        let orderId: string | null = null;
        await session.withTransaction(async () => {
          for (const it of canonicalRequestedItems) {
            const updated = await Product.findOneAndUpdate(
              {
                _id: it.productId,
                isDeleted: false,
                $or: [{ isActive: true }, { isActive: { $exists: false } }],
                stockQuantity: { $gte: it.quantity },
              },
              { $inc: { stockQuantity: -it.quantity } },
              { new: true, session }
            );
            if (!updated) {
              throw new Error(`INSUFFICIENT_STOCK:${it.productId}`);
            }
          }

          const order = await Order.create(
            [
              {
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
              },
            ],
            { session }
          );
          orderId = order?.[0]?._id?.toString?.() ?? null;
        });

        if (!orderId) throw new Error('TRANSACTION_FAILED: order not created');
        return orderId;
      } finally {
        session.endSession();
      }
    };

    try {
      createdOrderId = await tryTransaction();
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('INSUFFICIENT_STOCK:')) {
        const id = err.message.split(':')[1] || '';
        const titleForMsg = byId.get(id)?.title || requestedByProductId.get(id)?.title || 'item';
        return NextResponse.json({ error: `Insufficient stock for ${titleForMsg}` }, { status: 409 });
      }
      const msg = err instanceof Error ? err.message : String(err);
      const looksLikeNoTransactions =
        /Transaction numbers are only allowed|replica set member|Transaction is not supported|IllegalOperation/i.test(msg);
      if (!looksLikeNoTransactions) {
        throw err;
      }
    }

    // Fallback if transactions aren't supported
    if (!createdOrderId) {
      for (const it of canonicalRequestedItems) {
        const updated = await Product.findOneAndUpdate(
          {
            _id: it.productId,
            isDeleted: false,
            $or: [{ isActive: true }, { isActive: { $exists: false } }],
            stockQuantity: { $gte: it.quantity },
          },
          { $inc: { stockQuantity: -it.quantity } },
          { new: true }
        );

        if (!updated) {
          const rollback = Object.entries(decrementedByProductId).map(([id, qty]) =>
            Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } })
          );
          await Promise.allSettled(rollback);
          const titleForMsg = byId.get(it.productId)?.title || requestedByProductId.get(it.productId)?.title || 'item';
          return NextResponse.json({ error: `Insufficient stock for ${titleForMsg}` }, { status: 409 });
        }

        decrementedByProductId[it.productId] = (decrementedByProductId[it.productId] ?? 0) + it.quantity;
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
      createdOrderId = order._id.toString();
    }

    if (!STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe secret key (STRIPE_SECRET_KEY) is missing' }, { status: 500 });
    }

    let stripe: ReturnType<typeof getStripe>;
    try {
      stripe = getStripe();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'STRIPE_SECRET_KEY is not set') {
        return NextResponse.json({ error: 'Stripe secret key (STRIPE_SECRET_KEY) is missing' }, { status: 500 });
      }
      throw e;
    }
    const baseUrl = getBaseUrl(request);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: canonicalRequestedItems.map((it) => ({
        quantity: it.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: it.unitPrice,
          product_data: { name: it.title || 'Item' },
        },
      })),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      customer_email: email,
      client_reference_id: createdOrderId,
      metadata: {
        orderId: createdOrderId,
        userId: 'guest',
      },
    });

    if (session?.id && createdOrderId) {
      await Order.updateOne({ _id: createdOrderId }, { $set: { stripeSessionId: session.id } }).catch(() => {});
    }

    if (!session?.url) {
      return NextResponse.json({ error: 'Failed to start checkout' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);

    // Best-effort rollback if we created an order and/or decremented stock but failed later.
    try {
      if (createdOrderId) {
        const order = await Order.findById(createdOrderId).select('items').lean();
        if (order && Array.isArray((order as any).items)) {
          const rollback = (order as any).items.map((it: any) =>
            Product.updateOne({ _id: it.product }, { $inc: { stockQuantity: it.quantity } })
          );
          await Promise.allSettled(rollback);
        } else {
          const rollback = Object.entries(decrementedByProductId).map(([id, qty]) =>
            Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } })
          );
          if (rollback.length > 0) await Promise.allSettled(rollback);
        }
        await Order.updateOne({ _id: createdOrderId }, { $set: { status: 'cancelled' } }).catch(() => {});
      } else {
        const rollback = Object.entries(decrementedByProductId).map(([id, qty]) =>
          Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } })
        );
        if (rollback.length > 0) await Promise.allSettled(rollback);
      }
    } catch (rollbackError) {
      console.error('Failed to rollback checkout creation:', rollbackError);
    }

    const rawMsg =
      (error as any)?.raw && typeof (error as any).raw.message === 'string' ? String((error as any).raw.message) : '';
    const type = typeof (error as any)?.type === 'string' ? String((error as any).type) : '';

    // Avoid echoing secrets back to the client.
    const looksLikeAuth = type === 'StripeAuthenticationError' || /Invalid API Key provided/i.test(rawMsg);
    const safeMessage = looksLikeAuth
      ? 'Invalid Stripe API key. Check STRIPE_SECRET_KEY in .env.local and restart the dev server.'
      : rawMsg || (error instanceof Error ? error.message : '') || 'Failed to create checkout session';

    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}

