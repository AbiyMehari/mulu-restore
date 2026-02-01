'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCart } from '@/app/providers/CartProvider';

type StoredCartItem = {
  productId: string;
  title: string;
  price: number; // cents
  quantity: number;
};

const STORAGE_KEY = 'mulu_cart';

function readStoredCart(): StoredCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const items: StoredCartItem[] = [];
    for (const x of parsed) {
      if (!x || typeof x !== 'object') continue;
      const it = x as any;
      const productId = typeof it.productId === 'string' ? it.productId : '';
      const title = typeof it.title === 'string' ? it.title : '';
      const price = typeof it.price === 'number' ? it.price : Number(it.price);
      const quantity = typeof it.quantity === 'number' ? it.quantity : Number(it.quantity);
      if (!productId || !title || !Number.isFinite(price) || !Number.isFinite(quantity)) continue;
      items.push({
        productId,
        title,
        price: Math.max(0, Math.round(price)),
        quantity: Math.max(1, Math.floor(quantity)),
      });
    }
    return items;
  } catch {
    return [];
  }
}

export default function CartPage() {
  const router = useRouter();
  const { items, addItem, removeItem, updateQty, clearCart, totalItems, totalAmount } = useCart();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  useEffect(() => {
    // Step 24 requirement: read localStorage on mount (safe parse).
    // Also keep the CartProvider in sync in case other pages wrote directly to localStorage.
    const stored = readStoredCart();
    if (stored.length === 0) return;
    if (items.length > 0) return;
    clearCart();
    for (const it of stored) {
      addItem({ productId: it.productId, title: it.title, price: it.price }, it.quantity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDec = (productId: string, currentQty: number) => {
    updateQty(productId, Math.max(1, (currentQty || 1) - 1));
  };

  const onInc = (productId: string, currentQty: number) => {
    updateQty(productId, Math.max(1, (currentQty || 1) + 1));
  };

  const onClear = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    clearCart();
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/products">← Back to Products</Link>
      </div>

      <h1>Cart</h1>

      {items.length === 0 ? (
        <div style={{ marginTop: '0.75rem' }}>
          <p>Your cart is empty.</p>
          <Link href="/products">Go to products</Link>
        </div>
      ) : (
        <>
          <div style={{ marginTop: '1rem' }}>
            {items.map((it) => {
              const lineTotal = (it.price || 0) * (it.quantity || 0);
              return (
                <div
                  key={it.productId}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{it.title}</div>
                      <div style={{ color: '#374151', marginTop: '0.25rem' }}>{eur.format((it.price ?? 0) / 100)} each</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button type="button" onClick={() => onDec(it.productId, it.quantity)} style={{ padding: '0.25rem 0.5rem' }}>
                        −
                      </button>
                      <input
                        value={it.quantity}
                        readOnly
                        inputMode="numeric"
                        style={{ width: 64, padding: '0.25rem 0.5rem' }}
                      />
                      <button type="button" onClick={() => onInc(it.productId, it.quantity)} style={{ padding: '0.25rem 0.5rem' }}>
                        +
                      </button>
                    </div>

                    <div style={{ minWidth: 120, textAlign: 'right', fontWeight: 600 }}>
                      {eur.format(lineTotal / 100)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(it.productId)}
                      style={{ padding: '0.25rem 0.5rem', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 6 }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 700, gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div>
                  <strong>Total items:</strong> {totalItems()}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Total amount:</strong> {eur.format(totalAmount() / 100)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" onClick={onClear} style={{ padding: '0.5rem 0.75rem' }}>
                  Clear cart
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  disabled={items.length === 0}
                  style={{ padding: '0.5rem 0.75rem' }}
                >
                  Go to checkout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
