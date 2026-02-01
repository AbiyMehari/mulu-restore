import { cookies } from 'next/headers';

type OrderItem = {
  _id: string;
  user?: { email?: string };
  totalAmount: number;
  currency?: string;
  status?: string;
  createdAt: string;
};

export default async function AdminOrdersPage() {
  const cookieStore = await cookies();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch('http://localhost:3000/api/admin/orders', {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div>
        <h1>Orders</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load orders'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { items?: OrderItem[] };
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div>
      <h1>Orders</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 1000, marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Order ID</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>User Email</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={5}>
                No orders yet.
              </td>
            </tr>
          ) : (
            items.map((o) => (
              <tr key={o._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{o._id}</td>
                <td style={{ padding: '0.75rem' }}>{o.user?.email ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {typeof o.totalAmount === 'number' ? eur.format(o.totalAmount / 100) : '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>{o.status ?? '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
