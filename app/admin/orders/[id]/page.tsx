import Link from 'next/link';
import { cookies, headers } from 'next/headers';

type OrderItem = {
  _id: string;
  user?: { email?: string };
  status?: string;
  currency?: string;
  totalAmount: number;
  items: Array<{
    quantity: number;
    unitPrice: number;
    product?: { _id: string; title: string };
  }>;
  createdAt: string;
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const base = `${protocol}://${host}`;
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch(`${base}/api/admin/orders/${params.id}`, {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (res.status === 404) {
    return (
      <div>
        <Link href="/admin/orders">← Back to Orders</Link>
        <h1 style={{ marginTop: '1rem' }}>Order</h1>
        <p>Order not found</p>
      </div>
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div>
        <Link href="/admin/orders">← Back to Orders</Link>
        <h1 style={{ marginTop: '1rem' }}>Order</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load order'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { item?: OrderItem };
  const item = data.item;

  if (!item) {
    return (
      <div>
        <Link href="/admin/orders">← Back to Orders</Link>
        <h1 style={{ marginTop: '1rem' }}>Order</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load order</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/orders">← Back to Orders</Link>

      <h1 style={{ marginTop: '1rem' }}>Order</h1>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Order ID:</strong> {item._id}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Customer email:</strong> {item.user?.email ?? '—'}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Status:</strong> {item.status ?? '—'}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Total:</strong>{' '}
          {typeof item.totalAmount === 'number' ? eur.format(item.totalAmount / 100) : '—'}
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Created:</strong> {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
        </div>
      </div>

      <h2 style={{ marginBottom: '0.75rem' }}>Items</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 1000 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Product title</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Qty</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Unit price</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(item.items) && item.items.length > 0 ? (
            item.items.map((it, idx) => (
              <tr key={`${it.product?._id ?? 'product'}-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{it.product?.title ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>{it.quantity ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {typeof it.unitPrice === 'number' ? eur.format(it.unitPrice / 100) : '—'}
                </td>
              </tr>
            ))
          ) : (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={3}>
                No items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
