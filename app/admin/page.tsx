import Link from 'next/link';
import { cookies } from 'next/headers';

type DashboardResponse = {
  totalOrders: number;
  totalRevenue: number; // cents
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Array<{
    _id: string;
    createdAt: string;
    status?: string;
    totalAmount: number;
    customerEmail?: string;
  }>;
};

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: '1rem',
        minWidth: 180,
        background: '#fff',
      }}
    >
      <div style={{ color: '#6b7280', fontSize: 14 }}>{label}</div>
      <div style={{ marginTop: '0.35rem', fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch('http://localhost:3000/api/admin/dashboard', {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div>
        <h1>Dashboard</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as Partial<DashboardResponse>;
  const totalOrders = typeof data.totalOrders === 'number' ? data.totalOrders : 0;
  const totalRevenue = typeof data.totalRevenue === 'number' ? data.totalRevenue : 0;
  const totalProducts = typeof data.totalProducts === 'number' ? data.totalProducts : 0;
  const totalCustomers = typeof data.totalCustomers === 'number' ? data.totalCustomers : 0;
  const recentOrders = Array.isArray(data.recentOrders) ? data.recentOrders : [];

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
        <KpiCard label="Orders" value={totalOrders} />
        <KpiCard label="Revenue" value={eur.format(totalRevenue / 100)} />
        <KpiCard label="Products" value={totalProducts} />
        <KpiCard label="Customers" value={totalCustomers} />
      </div>

      <h2 style={{ marginTop: '2rem' }}>Recent Orders</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 1000, marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Date</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Customer</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Link</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.length === 0 ? (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={5}>
                No orders yet.
              </td>
            </tr>
          ) : (
            recentOrders.map((o) => (
              <tr key={o._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                <td style={{ padding: '0.75rem' }}>{o.customerEmail || '—'}</td>
                <td style={{ padding: '0.75rem' }}>{o.status || 'pending'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {typeof o.totalAmount === 'number' ? eur.format(o.totalAmount / 100) : '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <Link href={`/admin/orders/${o._id}`}>View</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

