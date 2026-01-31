import CategoryCreateForm from './CategoryCreateForm';
import { cookies, headers } from 'next/headers';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default async function AdminCategoriesPage() {
  const cookieStore = await cookies();
  const h = await headers();
  const host = h.get('host');

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    (host ? `http://${host}` : 'http://localhost:3000');

  const res = await fetch(`${baseUrl}/api/admin/categories`, {
    cache: 'no-store',
    headers: { Cookie: cookieStore.toString() },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return (
      <div>
        <h1>Categories</h1>
        <p style={{ color: '#b91c1c' }}>
          Failed to load categories ({res.status})
        </p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{text}</pre>
      </div>
    );
  }

  const data = (await res.json()) as { items?: Category[] };
  const items = data.items ?? [];

  return (
    <div>
      <h1>Categories</h1>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <CategoryCreateForm />
      </div>

      <table
        style={{
          width: '100%',
          maxWidth: 700,
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
              Name
            </th>
            <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
              Slug
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={2} style={{ padding: '0.75rem' }}>
                No categories yet.
              </td>
            </tr>
          ) : (
            items.map((c) => (
              <tr key={c._id}>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                  {c.name}
                </td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                  {c.slug}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
