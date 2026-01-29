import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '200px',
          padding: '1.5rem',
          borderRight: '1px solid #e5e7eb',
        }}
      >
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '0.75rem' }}>
              <Link href="/admin">Dashboard</Link>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <Link href="/admin/products">Products</Link>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <Link href="/admin/categories">Categories</Link>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <Link href="/admin/orders">Orders</Link>
            </li>
            <li style={{ marginBottom: '0.75rem' }}>
              <Link href="/admin/users">Users</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: '1.5rem' }}>{children}</main>
    </div>
  );
}
