import Link from 'next/link';
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
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Orders</h1>
        <p className="text-red-600">{err.error || 'Failed to load orders'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { items?: OrderItem[] };
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Orders</h1>
        <div className="w-24 h-1 bg-green-700"></div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={6}>
                    No orders yet.
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{o._id.slice(-8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.user?.email ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {typeof o.totalAmount === 'number' ? eur.format(o.totalAmount / 100) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        o.status === 'paid' ? 'bg-green-100 text-green-800' :
                        o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        o.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {o.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}
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
