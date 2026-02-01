import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

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
  const decrementedByProductId: Record<string, number> = {};
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
      if (!title) {
        return NextResponse.json({ error: 'Invalid item: title is required' }, { status: 400 });
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

    // Build order line-item snapshot
    const items = requestedItems.map((it) => ({
      product: new mongoose.Types.ObjectId(it.productId),
      title: it.title,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
    }));

    const totalAmount = requestedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);

    // Validate products exist/active/not-deleted and have enough stock.
    const ids = requestedItems.map((it) => new mongoose.Types.ObjectId(it.productId));
    const products = await Product.find({
      _id: { $in: ids },
      isDeleted: false,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .select('_id title stockQuantity')
      .lean();

    const byId = new Map<string, { title?: string; stockQuantity?: number }>();
    for (const p of products as any[]) {
      const id = typeof p._id === 'string' ? p._id : p._id?.toString?.() ?? '';
      if (id) byId.set(id, { title: p.title, stockQuantity: p.stockQuantity });
    }

    for (const it of requestedItems) {
      const p = byId.get(it.productId);
      if (!p) {
        // Product missing, deleted, or inactive (non-orderable)
        return NextResponse.json({ error: 'Invalid product', productId: it.productId }, { status: 400 });
      }
      const titleForMsg = p.title || it.title || 'item';
      const stockQty = typeof p.stockQuantity === 'number' ? p.stockQuantity : -1;
      if (stockQty < it.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${titleForMsg}` }, { status: 409 });
      }
    }

    // Best-effort transaction: if unsupported, fall back to atomic updates + rollback.
    const tryTransaction = async () => {
      const session = await mongoose.startSession();
      try {
        let createdId: string | null = null;
        await session.withTransaction(async () => {
          // Atomically decrement stock inside the transaction as well.
          for (const it of requestedItems) {
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
          createdId = order?.[0]?._id?.toString?.() ?? null;
        });

        if (!createdId) {
          throw new Error('TRANSACTION_FAILED: order not created');
        }
        return createdId;
      } finally {
        session.endSession();
      }
    };

    try {
      const createdId = await tryTransaction();
      return NextResponse.json({ item: { _id: createdId } }, { status: 201 });
    } catch (err) {
      // If it's a stock error inside the transaction, return 409.
      if (err instanceof Error && err.message.startsWith('INSUFFICIENT_STOCK:')) {
        const id = err.message.split(':')[1] || '';
        const titleForMsg = byId.get(id)?.title || requestedByProductId.get(id)?.title || 'item';
        return NextResponse.json({ error: `Insufficient stock for ${titleForMsg}` }, { status: 409 });
      }
      // If transactions aren't supported, we fall back below.
      const msg = err instanceof Error ? err.message : String(err);
      const looksLikeNoTransactions =
        /Transaction numbers are only allowed|replica set member|Transaction is not supported|IllegalOperation/i.test(msg);
      if (!looksLikeNoTransactions) {
        throw err;
      }
    }

    // Fallback: Prevent overselling by atomically decrementing stock for each item.
    for (const it of requestedItems) {
      const productId = it.productId;
      const quantity = it.quantity;

      const updated = await Product.findOneAndUpdate(
        {
          _id: productId,
          isDeleted: false,
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
          stockQuantity: { $gte: quantity },
        },
        { $inc: { stockQuantity: -quantity } },
        { new: true }
      );

      if (!updated) {
        const rollback = Object.entries(decrementedByProductId).map(([id, qty]) =>
          Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } })
        );
        await Promise.allSettled(rollback);
        const titleForMsg = byId.get(productId)?.title || requestedByProductId.get(productId)?.title || 'item';
        return NextResponse.json({ error: `Insufficient stock for ${titleForMsg}` }, { status: 409 });
      }

      decrementedByProductId[productId] = (decrementedByProductId[productId] ?? 0) + quantity;
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
    // Best-effort rollback if we decremented stock but failed later (e.g., Order.create error).
    try {
      const rollback = Object.entries(decrementedByProductId).map(([id, qty]) =>
        Product.updateOne({ _id: id }, { $inc: { stockQuantity: qty } })
      );
      if (rollback.length > 0) await Promise.allSettled(rollback);
    } catch (rollbackError) {
      console.error('Failed to rollback stock decrement:', rollbackError);
    }
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

