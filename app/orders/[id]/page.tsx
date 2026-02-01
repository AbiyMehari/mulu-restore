import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type OrderDetail = {
  _id: string;
  status?: string;
  currency?: string;
  totalAmount?: number;
  createdAt?: string;
  items?: Array<{ title?: string; unitPrice?: number; quantity?: number }>;
  shippingAddress?: { fullName?: string; email?: string } | null;
};

export default async function MyOrderDetailPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch(`http://localhost:3000/api/orders/${params.id}`, {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (res.status === 401) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/orders/${params.id}`)}`);
  }

  if (res.status === 404) {
    return (
      <div>
        <h1>Order</h1>
        <p>Order not found.</p>
        <Link href="/orders">← Back to My Orders</Link>
      </div>
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div>
        <h1>Order</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load order'}</p>
        <Link href="/orders">← Back to My Orders</Link>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { item?: OrderDetail };
  const item = data.item;
  if (!item?._id) {
    return (
      <div>
        <h1>Order</h1>
        <p>Order not found.</p>
        <Link href="/orders">← Back to My Orders</Link>
      </div>
    );
  }

  const items = Array.isArray(item.items) ? item.items : [];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/orders">← Back to My Orders</Link>
      </div>

      <h1>Order</h1>
      <div style={{ marginTop: '1rem' }}>
        <div>
          <strong>Order ID:</strong> {item._id}
        </div>
        <div style={{ marginTop: '0.25rem' }}>
          <strong>Status:</strong> {item.status || 'pending'}
        </div>
        <div style={{ marginTop: '0.25rem' }}>
          <strong>Total:</strong> {typeof item.totalAmount === 'number' ? eur.format(item.totalAmount / 100) : '—'}
        </div>
        <div style={{ marginTop: '0.25rem' }}>
          <strong>Created:</strong> {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
        </div>
      </div>

      <h2 style={{ marginTop: '1.5rem' }}>Items</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.75rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Product</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Qty</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Unit price</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={3}>
                No items.
              </td>
            </tr>
          ) : (
            items.map((it, idx) => (
              <tr key={`${item._id}-${idx}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{it.title || '—'}</td>
                <td style={{ padding: '0.75rem' }}>{typeof it.quantity === 'number' ? it.quantity : '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {typeof it.unitPrice === 'number' ? eur.format(it.unitPrice / 100) : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

