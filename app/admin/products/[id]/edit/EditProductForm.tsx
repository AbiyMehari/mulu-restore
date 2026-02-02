'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number; // cents
  currency: string;
  stockQuantity: number;
  category?: { _id: string; name: string; slug: string };
  condition: 'very_good' | 'good' | 'okay';
  shortDescription: string;
  fullDescription: string;
  images: string[];
  isActive: boolean;
  shipping?: { pickupOnly: boolean; shippingPossible: boolean; shippingNotes?: string };
};

export default function EditProductForm({ product, categories }: { product: Product; categories: Category[] }) {
  const router = useRouter();

  const initialCategoryId = (product.category as any)?._id ?? '';
  const [title, setTitle] = useState(product.title ?? '');
  const [slug, setSlug] = useState(product.slug ?? '');
  const [priceEur, setPriceEur] = useState(product.price != null ? (product.price / 100).toFixed(2) : '0.00');
  const [currency, setCurrency] = useState(product.currency ?? 'EUR');
  const [stockQuantity, setStockQuantity] = useState(String(product.stockQuantity ?? 0));
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [condition, setCondition] = useState<Product['condition']>(product.condition ?? 'very_good');
  const [shortDescription, setShortDescription] = useState(product.shortDescription ?? '');
  const [fullDescription, setFullDescription] = useState(product.fullDescription ?? '');
  const [imagesText, setImagesText] = useState(Array.isArray(product.images) ? product.images.join('\n') : '');
  const [isActive, setIsActive] = useState(Boolean(product.isActive));
  const [pickupOnly, setPickupOnly] = useState(Boolean(product.shipping?.pickupOnly));
  const [shippingPossible, setShippingPossible] = useState(Boolean(product.shipping?.shippingPossible));
  const [shippingNotes, setShippingNotes] = useState(product.shipping?.shippingNotes ?? '');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const images = useMemo(() => {
    return imagesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
  }, [imagesText]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const euroAmount = Number(priceEur || '0');
    const price = Number.isFinite(euroAmount) ? Math.max(0, Math.round(euroAmount * 100)) : 0;
    const stock = parseInt(stockQuantity || '0', 10);

    const body = {
      title: title.trim(),
      slug: slug.trim(),
      price,
      currency: currency.trim(),
      stockQuantity: Number.isFinite(stock) ? Math.max(0, stock) : 0,
      categoryId: categoryId,
      condition,
      shortDescription,
      fullDescription,
      images,
      isActive,
      shipping: {
        pickupOnly,
        shippingPossible,
        shippingNotes: shippingNotes.trim() || undefined,
      },
    };

    try {
      const res = await fetch(`/api/admin/products/${product._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed (${res.status})` });
        return;
      }

      setMessage({ type: 'success', text: 'Product updated.' });
      router.push('/admin/products');
    } catch (err) {
      console.error('Failed to update product:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem' };
  const inputStyle = { width: '100%', maxWidth: '520px', padding: '0.5rem' };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: '650px' }}>
      <div style={formStyle}>
        <label style={labelStyle}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required style={inputStyle} />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Price (EUR)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={priceEur}
          onChange={(e) => setPriceEur(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Currency</label>
        <input value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle} />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Stock</label>
        <input
          type="number"
          min="0"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required style={inputStyle}>
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Condition</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value as Product['condition'])} style={inputStyle}>
          <option value="very_good">Very good</option>
          <option value="good">Good</option>
          <option value="okay">Okay</option>
        </select>
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Short description</label>
        <textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          rows={2}
          required
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Full description</label>
        <textarea
          value={fullDescription}
          onChange={(e) => setFullDescription(e.target.value)}
          rows={5}
          required
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={formStyle}>
        <label style={labelStyle}>Images (one URL per line)</label>
        <textarea
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          rows={4}
          placeholder="https://..."
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={formStyle}>
        <label style={{ ...labelStyle, fontWeight: 600 }}>Shipping</label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" checked={pickupOnly} onChange={(e) => setPickupOnly(e.target.checked)} />
            Pickup only
          </label>
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" checked={shippingPossible} onChange={(e) => setShippingPossible(e.target.checked)} />
            Shipping possible
          </label>
        </div>
        <textarea
          value={shippingNotes}
          onChange={(e) => setShippingNotes(e.target.value)}
          rows={2}
          placeholder="Shipping notes (optional)"
          style={{ ...inputStyle, width: '100%' }}
        />
      </div>

      <div style={formStyle}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>{message.text}</div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <Link href="/admin/products" style={{ padding: '0.5rem 1rem' }}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

