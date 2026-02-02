import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import DeleteButton from './DeleteButton';

export default async function AdminProductsPage() {
  const cookieStore = await cookies();
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = headersList.get('x-forwarded-proto') || 'http';
  const base = `${protocol}://${host}`;
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  const res = await fetch(`${base}/api/admin/products`, {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
        <p className="text-red-600">{err.error || 'Failed to load products'}</p>
      </div>
    );
  }

  const { items = [] } = await res.json();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
          <div className="w-24 h-1 bg-green-700"></div>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl"
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (EUR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={6}>
                    No products yet. Add one to get started.
                  </td>
                </tr>
              ) : (
                items.map((item: { _id: string; title: string; price: number; stockQuantity: number; category?: { name: string }; isActive: boolean }) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.price != null ? eur.format(item.price / 100) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.stockQuantity ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category?.name ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/admin/products/${item._id}/edit`}
                        className="text-green-700 hover:text-green-800 font-medium mr-4 transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={item._id} />
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
