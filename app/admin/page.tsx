import Link from 'next/link';

export default function AdminPage() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <p style={{ marginBottom: '1.5rem' }}>You are signed in as admin.</p>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/admin/products">Products</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/admin/categories">Categories</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/admin/orders">Orders</Link>
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <Link href="/admin/users">Users</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

