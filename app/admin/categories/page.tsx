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
      const res = await fetch('/api/admin/categories', {
        cache: 'no-store',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      const data =
        contentType.includes('application/json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

      if (!res.ok) {
        setItems([]);
        const errText =
          typeof (data as any)?.error === 'string'
            ? (data as any).error
            : typeof data === 'string'
              ? data
              : '';
        const short = errText.replace(/\s+/g, ' ').trim().slice(0, 200);
        setLoadError(short || `Failed to load categories (${res.status})`);
        return;
      }

      setItems(Array.isArray((data as any)?.items) ? (data as any).items : []);
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

  const onDelete = async (id: string) => {
    setMessage(null);
    const ok = window.confirm('Delete this category?');
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const contentType = res.headers.get('content-type') || '';
      const data =
        contentType.includes('application/json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

      if (!res.ok) {
        const errText =
          typeof (data as any)?.error === 'string'
            ? (data as any).error
            : typeof data === 'string'
              ? data
              : '';
        const short = errText.replace(/\s+/g, ' ').trim().slice(0, 200);
        setMessage({ type: 'error', text: short || `Failed (${res.status})` });
        return;
      }

      setMessage({ type: 'success', text: 'Category deleted.' });
      await loadCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });

      const contentType = res.headers.get('content-type') || '';
      const data =
        contentType.includes('application/json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
      if (!res.ok) {
        const errText =
          typeof (data as any)?.error === 'string'
            ? (data as any).error
            : typeof data === 'string'
              ? data
              : '';
        const short = errText.replace(/\s+/g, ' ').trim().slice(0, 200);
        setMessage({ type: 'error', text: short || `Failed (${res.status})` });
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Categories</h1>
        <div className="w-24 h-1 bg-green-700"></div>
      </div>

      {/* Create Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Category</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              placeholder="e.g. Sideboards"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              placeholder="e.g. sideboards"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-green-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Create'}
          </button>
        </form>
      </div>

      {/* Loading/Error States */}
      {loading && <p className="text-gray-600 mb-4">Loading…</p>}
      {!loading && loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {loadError}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!loading && items.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan={3}>
                    No categories yet.
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.slug}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => onDelete(c._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Delete
                      </button>
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
