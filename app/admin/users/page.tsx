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
      <div>
        <h1>Users</h1>
        <p style={{ color: '#b91c1c' }}>{err.error || 'Failed to load users'}</p>
      </div>
    );
  }

  const data = (await res.json().catch(() => ({}))) as { items?: UserItem[] };
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div>
      <h1>Users</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: 900, marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Email</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }} colSpan={4}>
                No users yet.
              </td>
            </tr>
          ) : (
            items.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{u.email}</td>
                <td style={{ padding: '0.75rem' }}>{u.role}</td>
                <td style={{ padding: '0.75rem' }}>{u.name || '—'}</td>
                <td style={{ padding: '0.75rem' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
