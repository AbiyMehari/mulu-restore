'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images?: unknown;
  category?: { name?: string; slug?: string } | null;
};

type StoredCartItem = {
  productId: string;
  title: string;
  price: number; // cents
  qty: number;
  // keep compatibility with existing cart pages/provider
  quantity?: number;
};

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') return value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return value
    .map((v) => (v && typeof v === 'object' ? (v as any).url : undefined))
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eur = useMemo(
    () => (amountCents: number) =>
      ((amountCents ?? 0) / 100).toLocaleString('en-IE', { style: 'currency', currency: 'EUR' }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const data = (await res.json().catch(() => ({}))) as { items?: Product[] };
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (cancelled) return;
        setItems([]);
        setError('Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (p: Product) => {
    try {
      const raw = window.localStorage.getItem('mulu_cart');
      const parsed = raw ? JSON.parse(raw) : [];
      const existing: StoredCartItem[] = Array.isArray(parsed) ? parsed : [];

      const idx = existing.findIndex((x) => x && typeof x === 'object' && (x as any).productId === p._id);
      if (idx === -1) {
        const next: StoredCartItem[] = [
          ...existing,
          { productId: p._id, title: p.title, price: p.price, qty: 1, quantity: 1 },
        ];
        window.localStorage.setItem('mulu_cart', JSON.stringify(next));
        return;
      }

      const cur = existing[idx];
      const currentQty = typeof (cur as any).qty === 'number' ? (cur as any).qty : typeof (cur as any).quantity === 'number' ? (cur as any).quantity : 0;
      const nextQty = Math.max(0, Math.floor(currentQty)) + 1;

      const next = existing.slice();
      next[idx] = { ...cur, title: p.title, price: p.price, qty: nextQty, quantity: nextQty };
      window.localStorage.setItem('mulu_cart', JSON.stringify(next));
    } catch {
      // If storage is unavailable, we silently ignore (per requirements: safe parse/write)
    }
  };

  return (
    <div>
      <h1>Products</h1>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {loading ? <p>Loading…</p> : null}
      {!loading && !error && items.length === 0 ? <p>No products available</p> : null}

      <div
        style={{
          marginTop: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {items.map((p) => {
          const images = normalizeImages(p.images);
          const image = images[0];
          return (
            <div
              key={p._id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <Link href={`/products/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ background: '#f3f4f6', aspectRatio: '4 / 3' }}>
                  {image ? (
                    <img
                      src={image}
                      alt={p.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : null}
                </div>
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{p.title}</div>
                  <div style={{ color: '#111827' }}>{eur(p.price ?? 0)}</div>
                  <div style={{ marginTop: '0.25rem', color: '#374151' }}>{p.category?.name ?? '—'}</div>
                </div>
              </Link>

              <div style={{ padding: '0 0.75rem 0.75rem' }}>
                <button type="button" onClick={() => addToCart(p)} style={{ padding: '0.5rem 0.75rem' }}>
                  Add to cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
