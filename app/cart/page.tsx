'use client';

import Link from 'next/link';
import { useCart } from '@/app/providers/CartProvider';

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, totalItems, totalAmount } = useCart();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const onDec = (productId: string, currentQty: number) => {
    updateQty(productId, Math.max(0, currentQty - 1));
  };

  const onInc = (productId: string, currentQty: number) => {
    updateQty(productId, currentQty + 1);
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/products">← Back to Products</Link>
      </div>

      <h1>Cart</h1>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
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
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.title}
                        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                    ) : null}
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {it.slug ? (
                          <Link href={`/products/${it.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {it.title}
                          </Link>
                        ) : (
                          it.title
                        )}
                      </div>
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
                        onChange={(e) => updateQty(it.productId, Number(e.target.value))}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 600 }}>
              <div>
                <div>
                  <strong>Total items:</strong> {totalItems()}
                </div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Total amount:</strong> {eur.format(totalAmount() / 100)}
                </div>
              </div>

              <button type="button" onClick={clearCart} style={{ padding: '0.5rem 0.75rem' }}>
                Clear cart
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
