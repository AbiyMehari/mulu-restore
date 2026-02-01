import Link from 'next/link';
import { headers } from 'next/headers';

type ProductListItem = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
  category?: { name: string; slug: string } | null;
};

export default async function ProductsPage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const base = `${protocol}://${host}`;

  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch(`${base}/api/products`, { cache: 'no-store' });
  if (!res.ok) {
    return (
      <div>
        <h1>Products</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load products</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { items?: ProductListItem[] };
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div>
      <h1>Products</h1>

      {items.length === 0 ? <p>No products available</p> : null}

      <div
        style={{
          marginTop: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {items.map((p) => {
          const image = Array.isArray(p.images) ? p.images[0] : undefined;
          return (
            <Link
              key={p._id}
              href={`/products/${p.slug}`}
              style={{
                display: 'block',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
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
                <div style={{ color: '#111827' }}>{eur.format((p.price ?? 0) / 100)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
