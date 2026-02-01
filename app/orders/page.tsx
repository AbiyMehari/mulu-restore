import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type OrderListItem = {
  _id: string;
  status?: string;
  currency?: string;
  totalAmount?: number;
  createdAt?: string;
};

export default async function MyOrdersPage() {
  const cookieStore = await cookies();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch('http://localhost:3000/api/orders/me', {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (res.status === 401) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent('/orders')}`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div>
        <h1>My Orders</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load orders'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { items?: OrderListItem[] };
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div>
      <h1>My Orders</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 1000, marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Link</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={4}>
                No orders yet.
              </td>
            </tr>
          ) : (
            items.map((o) => (
              <tr key={o._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                <td style={{ padding: '0.75rem' }}>{o.status || 'pending'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {typeof o.totalAmount === 'number' ? eur.format(o.totalAmount / 100) : '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <Link href={`/orders/${o._id}`}>View</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

