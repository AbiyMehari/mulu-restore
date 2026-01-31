'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type ProductItem = {
  _id: string;
  title: string;
  slug: string;
  price: number; // cents
  stockQuantity: number;
  category?: { _id: string; name: string; slug: string };
  condition: 'vintage' | 'restored' | 'used';
  shortDescription: string;
  fullDescription: string;
  images?: string[];
};

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<'vintage' | 'restored' | 'used'>('vintage');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [imagesText, setImagesText] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      setMessage(null);

      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`, { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ]);

        if (productRes.status === 404) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!productRes.ok) {
          const data = await productRes.json().catch(() => ({}));
          setMessage({ type: 'error', text: data.error || `Failed to load product (${productRes.status})` });
          setLoading(false);
          return;
        }

        const productData = await productRes.json().catch(() => ({}));
        const item: ProductItem = productData.item;

        setTitle(item.title ?? '');
        setSlug(item.slug ?? '');
        setPrice(item.price != null ? (item.price / 100).toFixed(2) : '');
        setStockQuantity(String(item.stockQuantity ?? 0));
        setCategoryId(item.category?._id ?? '');
        setCondition(item.condition ?? 'vintage');
        setShortDescription(item.shortDescription ?? '');
        setFullDescription(item.fullDescription ?? '');
        setImagesText(Array.isArray(item.images) ? item.images.join('\n') : '');

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json().catch(() => ({}));
          setCategories(Array.isArray(categoriesData.items) ? categoriesData.items : []);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to load:', err);
        setMessage({ type: 'error', text: 'Failed to load product.' });
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const images = imagesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((url) => ({ url }));

    const euroAmount = Number(price || '0');
    const priceInCents = Number.isFinite(euroAmount) ? Math.max(0, Math.round(euroAmount * 100)) : 0;
    const stock = parseInt(stockQuantity || '0', 10);

    const body = {
      title,
      slug,
      price: priceInCents,
      stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
      categoryId,
      condition,
      descriptionShort: shortDescription,
      description: fullDescription,
      images,
    };

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const text = data.details ? 'Validation error' : data.error || `Failed (${res.status})`;
        setMessage({ type: 'error', text });
        setSubmitting(false);
        return;
      }

      router.push('/admin/products');
    } catch (err) {
      console.error('Failed to update product:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
      setSubmitting(false);
    }
  };

  const formStyle = { marginBottom: '1rem' };
  const labelStyle = { display: 'block', marginBottom: '0.25rem' };
  const inputStyle = { width: '100%', maxWidth: '400px', padding: '0.5rem' };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin/products">← Back to Products</Link>
        </div>
        <h1>Edit Product</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin/products">← Back to Products</Link>
        </div>
        <h1>Edit Product</h1>
        <p>Not found</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/admin/products">← Back to Products</Link>
      </div>

      <h1>Edit Product</h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', marginTop: '1rem' }}>
        <div style={formStyle}>
          <label style={labelStyle}>Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
        </div>

        <div style={formStyle}>
          <label style={labelStyle}>Slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required style={inputStyle} />
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
          <select value={condition} onChange={(e) => setCondition(e.target.value as any)} style={inputStyle}>
            <option value="vintage">Vintage</option>
            <option value="restored">Restored</option>
            <option value="used">Used</option>
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
          <div style={{ marginBottom: '1rem', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
            {message.text}
          </div>
        )}

        <button type="submit" disabled={submitting} style={{ padding: '0.5rem 1rem' }}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

