'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { clearCart, readCart, removeFromCart, setCartQuantity, type CartItem, writeCart } from '@/lib/cart';

function normalizeCartItems(raw: unknown): { items: CartItem[]; invalidRemoved: boolean; duplicatesMerged: boolean } {
  if (!Array.isArray(raw)) return { items: [], invalidRemoved: false, duplicatesMerged: false };

  const byId = new Map<string, CartItem>();
  let invalidRemoved = false;
  let duplicatesMerged = false;

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      invalidRemoved = true;
      continue;
    }
    const e = entry as any;
    const productId = typeof e.productId === 'string' ? e.productId.trim() : '';
    if (!productId) {
      invalidRemoved = true;
      continue;
    }

    const title = typeof e.title === 'string' && e.title.trim() ? e.title.trim() : 'Untitled item';
    const priceNum = typeof e.price === 'number' ? e.price : Number(e.price);
    const price = Number.isFinite(priceNum) ? Math.max(0, Math.round(priceNum)) : 0;

    const qtyNum = typeof e.quantity === 'number' ? e.quantity : typeof e.qty === 'number' ? e.qty : Number(e.quantity ?? e.qty);
    const quantity = Number.isFinite(qtyNum) ? Math.max(1, Math.floor(qtyNum)) : 1;

    const existing = byId.get(productId);
    if (!existing) {
      byId.set(productId, { productId, title, price, quantity });
      continue;
    }

    duplicatesMerged = true;
    byId.set(productId, {
      productId,
      title: title || existing.title,
      price: Number.isFinite(price) ? price : existing.price,
      quantity: (existing.quantity || 0) + quantity,
    });
  }

  return { items: Array.from(byId.values()), invalidRemoved, duplicatesMerged };
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [stockById, setStockById] = useState<Record<string, number | null>>({});
  const [stockNote, setStockNote] = useState<string | null>(null);
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // Safe load + normalize localStorage("mulu_cart") so bad/legacy shapes can't crash the page.
    let parsed: unknown = [];
    let hadRaw = false;
    try {
      const raw = window.localStorage.getItem('mulu_cart');
      hadRaw = Boolean(raw && raw.trim().length > 0);
      parsed = raw ? JSON.parse(raw) : [];
    } catch {
      hadRaw = true;
      parsed = [];
    }

    const { items: normalized, invalidRemoved, duplicatesMerged } = normalizeCartItems(parsed);
    // Always write back normalized cart so future reads are safe/consistent.
    writeCart(normalized);
    setItems(normalized);

    if (hadRaw && (invalidRemoved || duplicatesMerged)) {
      if (invalidRemoved) {
        setNotice('Some invalid cart items were removed.');
      } else if (duplicatesMerged) {
        setNotice('Duplicate cart items were merged.');
      }
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

  useEffect(() => {
    let cancelled = false;
    async function loadStock() {
      setStockNote(null);
      const ids = Array.from(new Set(items.map((it) => it.productId))).filter(Boolean);
      if (ids.length === 0) {
        setStockById({});
        return;
      }

      // Try to resolve stock using the public products list (ObjectId-based cart ids),
      // and fall back to slug-detail for non-ObjectId ids.
      const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);
      const objectIds = ids.filter(isObjectId);
      const slugIds = ids.filter((x) => !isObjectId(x));

      const next: Record<string, number | null> = {};

      // Page through products until we find all objectIds (cart is small).
      if (objectIds.length > 0) {
        const remaining = new Set(objectIds);
        let page = 1;
        const limit = 100;
        while (remaining.size > 0 && page <= 50) {
          const res = await fetch(`/api/products?page=${page}&limit=${limit}`, { cache: 'no-store' });
          if (!res.ok) break;
          const data = (await res.json().catch(() => ({}))) as { items?: any[] };
          const list = Array.isArray(data.items) ? data.items : [];
          if (list.length === 0) break;
          for (const p of list) {
            const id = typeof p?._id === 'string' ? p._id : '';
            if (!id || !remaining.has(id)) continue;
            next[id] = typeof p.stockQuantity === 'number' ? p.stockQuantity : null;
            remaining.delete(id);
          }
          page += 1;
        }
        for (const id of remaining) next[id] = null;
      }

      // Slug-based fallback
      for (const slug of slugIds) {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
          if (!res.ok) {
            next[slug] = null;
            continue;
          }
          const data = (await res.json().catch(() => ({}))) as any;
          const stock = typeof data?.item?.stockQuantity === 'number' ? data.item.stockQuantity : null;
          next[slug] = stock;
        } catch {
          next[slug] = null;
        }
      }

      if (cancelled) return;
      setStockById(next);

      // Clamp quantities to stock, and remove items with stock 0
      let changed = false;
      for (const it of readCart()) {
        const stock = next[it.productId];
        if (typeof stock === 'number') {
          if (stock <= 0) {
            removeFromCart(it.productId);
            changed = true;
            continue;
          }
          if (it.quantity > stock) {
            setCartQuantity(it.productId, stock);
            changed = true;
          }
        }
      }
      if (changed) {
        setItems(readCart());
        setStockNote('Some cart quantities were adjusted to match current stock.');
      }
    }

    loadStock();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((x) => `${x.productId}:${x.quantity}`).join('|')]);

  const onDec = (productId: string, currentQty: number) => {
    const nextQty = Math.max(1, (currentQty || 1) - 1);
    const updated = setCartQuantity(productId, nextQty);
    setItems(updated);
  };

  const onInc = (productId: string, currentQty: number) => {
    const stock = stockById[productId];
    const maxQty = typeof stock === 'number' ? stock : Infinity;
    const nextQty = Math.min(maxQty, Math.max(1, (currentQty || 1) + 1));
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
      {stockNote ? <div style={{ marginTop: '0.5rem', color: '#b91c1c' }}>{stockNote}</div> : null}

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
              const stock = stockById[it.productId];
              const outOfStock = typeof stock === 'number' && stock <= 0;
              const atMax = typeof stock === 'number' && it.quantity >= stock;
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
                      {typeof stock === 'number' ? (
                        <div style={{ marginTop: '0.25rem', color: outOfStock ? '#b91c1c' : '#374151' }}>
                          {outOfStock ? 'No longer available' : `In stock: ${stock}`}
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.25rem', color: '#6b7280' }}>Checking stock…</div>
                      )}
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
                      <button
                        type="button"
                        onClick={() => onInc(it.productId, it.quantity)}
                        disabled={atMax || outOfStock}
                        style={{ padding: '0.25rem 0.5rem', opacity: atMax || outOfStock ? 0.6 : 1 }}
                        title={atMax ? 'Max stock reached' : undefined}
                      >
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
