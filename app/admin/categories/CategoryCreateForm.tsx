'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CategoryCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Failed to create category',
        });
        return;
      }

      setMessage({ type: 'success', text: 'Category created successfully.' });
      setName('');
      setSlug('');
      router.refresh();
    } catch (err) {
      console.error('Failed to create category:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: '520px' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      {message ? (
        <div style={{ marginBottom: '0.75rem', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
          {message.text}
        </div>
      ) : null}

      <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
        {submitting ? 'Saving...' : 'Create Category'}
      </button>
    </form>
  );
}

