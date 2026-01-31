'use client';

import { useRouter } from 'next/navigation';

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const onDelete = async () => {
    const ok = window.confirm('Delete this product?');
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        window.alert(data.error || 'Failed to delete product');
        return;
      }

      router.refresh();
    } catch (err) {
      console.error('Failed to delete product:', err);
      window.alert('Request failed.');
    }
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      style={{
        padding: '0.25rem 0.5rem',
        background: '#b91c1c',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      Delete
    </button>
  );
}
