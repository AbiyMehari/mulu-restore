'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clearCart, readCart, removeFromCart, setCartQuantity, type CartItem, writeCart } from '@/lib/cart';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // Step 24 requirement: read localStorage on mount (safe parse).
    // Also normalize immediately so duplicates disappear after refresh.
    let rawCount = 0;
    let hadRaw = false;
    try {
      const raw = window.localStorage.getItem('mulu_cart');
      hadRaw = Boolean(raw && raw.trim().length > 0);
      const parsed = raw ? JSON.parse(raw) : [];
      rawCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      hadRaw = true;
      rawCount = 0;
    }

    const normalized = readCart();
    writeCart(normalized);
    setItems(normalized);
    if (hadRaw && rawCount > normalized.length) {
      setNotice('Duplicate cart items were merged.');
    }

    const onUpdate = () => setItems(readCart());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mulu_cart') onUpdate();
    };

    window.addEventListener('mulu_cart_updated', onUpdate);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('mulu_cart_updated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const onDec = (productId: string, currentQty: number) => {
    const nextQty = Math.max(1, (currentQty || 1) - 1);
    const updated = setCartQuantity(productId, nextQty);
    setItems(updated);
  };

  const onInc = (productId: string, currentQty: number) => {
    const nextQty = Math.max(1, (currentQty || 1) + 1);
    const updated = setCartQuantity(productId, nextQty);
    setItems(updated);
  };

  const onClear = () => {
    clearCart();
    setItems([]);
  };

  const onRemove = (productId: string) => {
    const updated = removeFromCart(productId);
    setItems(updated);
  };

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const totalAmount = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
    return { totalItems, totalAmount };
  }, [items]);

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/products">← Back to Products</Link>
      </div>

      <h1>Cart</h1>

      {notice ? <div style={{ marginTop: '0.5rem', color: '#374151' }}>{notice}</div> : null}

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
                      onClick={() => onRemove(it.productId)}
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
                  <strong>Total items:</strong> {totals.totalItems}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Total amount:</strong> {eur.format(totals.totalAmount / 100)}
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
