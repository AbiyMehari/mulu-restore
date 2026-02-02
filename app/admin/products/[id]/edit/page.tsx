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
  condition: 'very_good' | 'good' | 'okay';
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
  const [condition, setCondition] = useState<'very_good' | 'good' | 'okay'>('very_good');
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
        setCondition(item.condition ?? 'very_good');
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

  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <Link href="/admin/products" className="text-green-700 hover:text-green-800 transition-colors">
            ← Back to Products
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Edit Product</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <div className="mb-4">
          <Link href="/admin/products" className="text-green-700 hover:text-green-800 transition-colors">
            ← Back to Products
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Edit Product</h1>
        <p className="text-red-600">Product not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/products" className="text-green-700 hover:text-green-800 transition-colors">
          ← Back to Products
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Product</h1>
        <div className="w-24 h-1 bg-green-700"></div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (EUR) *
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Condition *
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              >
                <option value="very_good">Very good</option>
                <option value="good">Good</option>
                <option value="okay">Okay</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Short description *
            </label>
            <textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y"
            />
          </div>

          <div>
            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Full description *
            </label>
            <textarea
              id="fullDescription"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              required
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y"
            />
          </div>

          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
              Images (one URL per line)
            </label>
            <textarea
              id="images"
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={4}
              placeholder="https://..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y font-mono text-sm"
            />
          </div>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/products"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

