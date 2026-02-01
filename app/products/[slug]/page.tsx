import Link from 'next/link';
import { headers } from 'next/headers';
import AddToCartButton from './AddToCartButton';

type ProductDetail = {
  title: string;
  price: number;
  images: string[];
  stockQuantity?: number;
  description: string;
  condition?: string;
  category?: { name: string; slug: string } | null;
};

type ProductListItem = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  images: string[];
};

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const base = `${protocol}://${host}`;

  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch(`${base}/api/products/${params.slug}`, { cache: 'no-store' });

  if (res.status === 404) {
    return (
      <div>
        <Link href="/products">← Back to Products</Link>
        <h1 style={{ marginTop: '1rem' }}>Product</h1>
        <p>Product not found</p>
      </div>
    );
  }

  if (!res.ok) {
    return (
      <div>
        <Link href="/products">← Back to Products</Link>
        <h1 style={{ marginTop: '1rem' }}>Product</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load product</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { item?: ProductDetail };
  const item = data.item;

  if (!item) {
    return (
      <div>
        <Link href="/products">← Back to Products</Link>
        <h1 style={{ marginTop: '1rem' }}>Product</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load product</p>
      </div>
    );
  }

  const images = Array.isArray(item.images) ? item.images : [];
  const firstImage = images[0];
  const stock = typeof item.stockQuantity === 'number' ? item.stockQuantity : 0;

  // Get a stable productId without changing the public detail API shape
  const listRes = await fetch(`${base}/api/products`, { cache: 'no-store' });
  const listData = listRes.ok ? ((await listRes.json().catch(() => ({}))) as { items?: ProductListItem[] }) : {};
  const listItems = Array.isArray(listData.items) ? listData.items : [];
  const matching = listItems.find((p) => p.slug === params.slug);
  const productId = matching?._id || params.slug;

  return (
    <div>
      <Link href="/products">← Back to Products</Link>

      <h1 style={{ marginTop: '1rem' }}>{item.title}</h1>

      <div style={{ marginTop: '1rem' }}>
        <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{eur.format((item.price ?? 0) / 100)}</div>
        <div style={{ marginTop: '0.25rem', color: stock <= 0 ? '#b91c1c' : '#374151' }}>
          {stock <= 0 ? 'Out of stock' : `In stock: ${stock}`}
        </div>
        <AddToCartButton
          productId={productId}
          title={item.title}
          price={item.price ?? 0}
          stockQuantity={stock}
          slug={params.slug}
          image={firstImage}
        />
        <div style={{ marginTop: '0.25rem', color: '#374151' }}>
          <strong>Condition:</strong> {item.condition ?? '—'}
        </div>
        <div style={{ marginTop: '0.25rem', color: '#374151' }}>
          <strong>Category:</strong> {item.category?.name ?? '—'}
        </div>
      </div>

      <h2 style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>Images</h2>
      {images.length === 0 ? (
        <p>No images.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {images.map((src, idx) => (
            <img
              key={`${src}-${idx}`}
              src={src}
              alt={`${item.title} image ${idx + 1}`}
              style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>Description</h2>
      <p style={{ whiteSpace: 'pre-wrap' }}>{item.description || '—'}</p>
    </div>
  );
}
