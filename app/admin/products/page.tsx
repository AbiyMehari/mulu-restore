import Link from 'next/link';
import { cookies, headers } from 'next/headers';

export default async function AdminProductsPage() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const base = `${protocol}://${host}`;

  const res = await fetch(`${base}/api/admin/products`, {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div>
        <h1>Products</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load products'}</p>
      </div>
    );
  }

  const { items = [], total = 0 } = await res.json();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Products</h1>
        <Link
          href="/admin/products/new"
          style={{
            padding: '0.5rem 1rem',
            background: '#000',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Add Product
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Price</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Stock</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={6}>
                No products yet. Add one to get started.
              </td>
            </tr>
          ) : (
            items.map((item: { _id: string; title: string; price: number; stockQuantity: number; category?: { name: string }; isActive: boolean }) => (
              <tr key={item._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{item.title}</td>
                <td style={{ padding: '0.75rem' }}>{item.price != null ? (item.price / 100).toFixed(2) : '—'}</td>
                <td style={{ padding: '0.75rem' }}>{item.stockQuantity ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>{item.category?.name ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>{item.isActive ? 'Active' : 'Inactive'}</td>
                <td style={{ padding: '0.75rem' }}>
                  <Link href={`/admin/products/${item._id}`}>Edit</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
