'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { addToCart as addToCartStorage } from '@/lib/cart';

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images?: unknown;
  category?: { name?: string; slug?: string } | null;
};

function getFirstImage(images: any): string {
  if (!Array.isArray(images) || images.length === 0) return '';
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof first.url === 'string') return first.url;
  return '';
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
    addToCartStorage({ productId: p._id, title: p.title, price: p.price }, 1);
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
          const image = getFirstImage(p.images);
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
