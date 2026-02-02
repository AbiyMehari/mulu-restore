import { cookies } from 'next/headers';

type UserItem = {
  _id: string;
  email: string;
  role: string;
  name?: string;
  createdAt: string;
};

export default async function AdminUsersPage() {
  const cookieStore = await cookies();

  const res = await fetch('http://localhost:3000/api/admin/users', {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Users</h1>
        <p className="text-red-600">{err.error || 'Failed to load users'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { items?: UserItem[] };
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Users</h1>
        <div className="w-24 h-1 bg-green-700"></div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={4}>
                    No users yet.
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
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
