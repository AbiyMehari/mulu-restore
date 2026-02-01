'use client';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

import { useEffect, useState } from 'react';

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setItems([]);
        setLoadError(data.error || `Failed to load categories (${res.status})`);
        return;
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setItems([]);
      setLoadError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed (${res.status})` });
        setSubmitting(false);
        return;
      }

      setMessage({ type: 'success', text: 'Category created.' });
      setName('');
      setSlug('');
      await loadCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Categories</h1>

      <form onSubmit={onSubmit} style={{ maxWidth: 500, marginTop: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Add Category</h2>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
            placeholder="e.g. Sideboards"
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem' }}>Slug</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
            placeholder="e.g. sideboards"
          />
        </div>

        {message && (
          <div style={{ marginBottom: '0.75rem', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
          {submitting ? 'Saving...' : 'Create'}
        </button>
      </form>

      {loading ? <p>Loading…</p> : null}
      {!loading && loadError ? <p style={{ color: '#b91c1c' }}>{loadError}</p> : null}

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
          {!loading && items.length === 0 ? (
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
