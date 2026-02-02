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
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-700 hover:shadow-lg transition-shadow">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
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
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-red-600">{err.error || 'Failed to load dashboard'}</p>
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <div className="w-24 h-1 bg-green-700"></div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard label="Total Orders" value={totalOrders} />
        <KpiCard label="Total Revenue" value={eur.format(totalRevenue / 100)} />
        <KpiCard label="Total Products" value={totalProducts} />
        <KpiCard label="Total Customers" value={totalCustomers} />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={5}>
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {o.customerEmail || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        o.status === 'paid' ? 'bg-green-100 text-green-800' :
                        o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {o.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {typeof o.totalAmount === 'number' ? eur.format(o.totalAmount / 100) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="text-green-700 hover:text-green-800 font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
