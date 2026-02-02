'use client';

import Link from 'next/link';
import Nav from '@/app/components/Nav';
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

      const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);
      const objectIds = ids.filter(isObjectId);
      const slugIds = ids.filter((x) => !isObjectId(x));

      const next: Record<string, number | null> = {};

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
    if (window.confirm('Clear all items from cart?')) {
      clearCart();
      setItems([]);
    }
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <Nav />

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-100 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-lg text-gray-600">Review your items before checkout</p>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Notices */}
          {notice && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
              {notice}
            </div>
          )}
          {stockNote && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg mb-4">
              {stockNote}
            </div>
          )}

          {/* Empty Cart */}
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start adding items to your cart to see them here.</p>
              <Link
                href="/products"
                className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="divide-y divide-gray-200">
                  {items.map((it) => {
                    const lineTotal = (it.price || 0) * (it.quantity || 0);
                    const stock = stockById[it.productId];
                    const outOfStock = typeof stock === 'number' && stock <= 0;
                    const atMax = typeof stock === 'number' && it.quantity >= stock;
                    return (
                      <div key={it.productId} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{it.title}</h3>
                            <div className="text-gray-600 mb-2">
                              {eur.format((it.price ?? 0) / 100)} each
                            </div>
                            {typeof stock === 'number' ? (
                              <div className={`text-sm ${outOfStock ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {outOfStock ? 'No longer available' : `In stock: ${stock}`}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">Checking stock…</div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                type="button"
                                onClick={() => onDec(it.productId, it.quantity)}
                                className="px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors font-semibold"
                              >
                                −
                              </button>
                              <input
                                value={it.quantity}
                                readOnly
                                inputMode="numeric"
                                className="w-16 px-3 py-2 text-center border-x border-gray-300 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => onInc(it.productId, it.quantity)}
                                disabled={atMax || outOfStock}
                                className={`px-3 py-2 font-semibold transition-colors ${
                                  atMax || outOfStock
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                title={atMax ? 'Max stock reached' : undefined}
                              >
                                +
                              </button>
                            </div>

                            {/* Line Total */}
                            <div className="text-lg font-bold text-gray-900 min-w-[100px] text-right">
                              {eur.format(lineTotal / 100)}
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => onRemove(it.productId)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals and Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="space-y-2">
                    <div className="text-lg">
                      <span className="font-semibold text-gray-700">Total items:</span>{' '}
                      <span className="text-gray-900 font-bold">{totals.totalItems}</span>
                    </div>
                    <div className="text-2xl">
                      <span className="font-semibold text-gray-700">Total amount:</span>{' '}
                      <span className="text-green-700 font-bold">{eur.format(totals.totalAmount / 100)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={onClear}
                      className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Clear Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/auth/login?callbackUrl=/checkout')}
                      disabled={items.length === 0}
                      className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Go to Checkout
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
