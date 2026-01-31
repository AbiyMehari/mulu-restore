'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<'new' | 'excellent' | 'good' | 'fair'>('new');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await res.json();
        const items: Category[] = data.items ?? [];
        setCategories(
          items.filter((cat) => {
            const name = (cat.name ?? '').trim().toLowerCase();
            const slug = (cat.slug ?? '').trim().toLowerCase();
            return name !== 'storage' && slug !== 'storage';
          })
        );
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const images = imagesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url }));

    // UI enters EUR, API expects integer cents
    const euroAmount = Number(price || '0');
    const priceInCents = Number.isFinite(euroAmount) ? Math.max(0, Math.round(euroAmount * 100)) : 0;

    // `createProductSchema` expects condition: 'vintage' | 'restored' | 'used'.
    // Keep the UI options the same, but map them to the API enum.
    const conditionForApi: 'vintage' | 'restored' | 'used' =
      condition === 'new' ? 'restored' : condition === 'excellent' ? 'restored' : condition === 'good' ? 'used' : 'vintage';

    const body = {
      title,
      slug,
      price: priceInCents,
      stock: parseInt(stock || '0', 10),
      categoryId,
      condition: conditionForApi,
      descriptionShort: shortDescription,
      description: fullDescription,
      images,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to create product' });
        setSubmitting(false);
        return;
      }

      setMessage({ type: 'success', text: 'Product created successfully.' });
      router.push('/admin/products');
    } catch (err) {
      setMessage({ type: 'error', text: 'Request failed.' });
      setSubmitting(false);
    }
  };

  const formStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem' };
  const inputStyle = { width: '100%', maxWidth: '400px', padding: '0.5rem' };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/admin/products">← Back to Products</Link>
      </div>
      <h1>New Product</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', marginTop: '1rem' }}>
        <div style={formStyle}>
          <label style={labelStyle}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Price (EUR)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Stock</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={loadingCategories}
            style={inputStyle}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as 'new' | 'excellent' | 'good' | 'fair')}
            style={inputStyle}
          >
            <option value="new">New</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Short description</label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
            rows={2}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Full description</label>
          <textarea
            value={fullDescription}
            onChange={(e) => setFullDescription(e.target.value)}
            required
            rows={4}
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Images (one URL per line)</label>
          <textarea
            value={imagesText}
            onChange={(e) => setImagesText(e.target.value)}
            rows={3}
            placeholder="https://..."
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        {message && (
          <div
            style={{
              marginBottom: '1rem',
              color: message.type === 'error' ? '#b91c1c' : '#15803d',
            }}
          >
            {message.text}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
            {submitting ? 'Saving...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
