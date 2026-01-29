'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NewProductPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<'vintage' | 'restored' | 'used'>('vintage');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const images = imagesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const priceCents = Math.round(parseFloat(price || '0') * 100);
    const body = {
      title,
      slug,
      price: priceCents,
      stockQuantity: parseInt(stock || '0', 10),
      categoryId: categoryId || undefined,
      condition,
      shortDescription,
      fullDescription,
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
      setSubmitting(false);
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
            step="0.01"
            min="0"
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
          <label style={labelStyle}>Category ID</label>
          <input
            type="text"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as 'vintage' | 'restored' | 'used')}
            style={inputStyle}
          >
            <option value="vintage">Vintage</option>
            <option value="restored">Restored</option>
            <option value="used">Used</option>
          </select>
        </div>
        <div style={formStyle}>
          <label style={labelStyle}>Short description</label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
            style={inputStyle}
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
          <Link href="/admin/products" style={{ padding: '0.5rem 1rem' }}>
            Cancel
          </Link>
        </div>
      </form>
      {message?.type === 'success' && (
        <p style={{ marginTop: '1rem' }}>
          <Link href="/admin/products">Back to Products</Link>
        </p>
      )}
    </div>
  );
}
