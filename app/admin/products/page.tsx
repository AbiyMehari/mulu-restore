import Link from 'next/link';

export default function AdminProductsPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Products</h1>
        <Link
          href="/admin/products/new"
          style={{
            padding: '0.5rem 1rem',
            background: '#000',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          Add Product
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Price</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Stock</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '0.75rem' }} colSpan={5}>
              No products yet. Add one to get started.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
