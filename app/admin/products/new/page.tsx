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
        const data = (await res.json()) as { items?: Category[] };
        setCategories(data.items ?? []);
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

    const euroAmount = Number(price || '0');
    const priceInCents = Number.isFinite(euroAmount) ? Math.max(0, Math.round(euroAmount * 100)) : 0;

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

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="text-green-700 hover:text-green-800 font-medium mb-4 inline-block transition-colors"
        >
          ← Back to Products
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">New Product</h1>
          <div className="w-24 h-1 bg-green-700"></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
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
              placeholder="e.g. Vintage Oak Sideboard"
            />
          </div>

          {/* Slug */}
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
              placeholder="e.g. vintage-oak-sideboard"
            />
          </div>

          {/* Price and Stock */}
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
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          {/* Category and Condition */}
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
                disabled={loadingCategories}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">{loadingCategories ? 'Loading categories...' : 'Select a category'}</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Condition
              </label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as 'new' | 'excellent' | 'good' | 'fair')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
              >
                <option value="new">New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Short Description *
            </label>
            <textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y"
              placeholder="Brief description of the product..."
            />
          </div>

          {/* Full Description */}
          <div>
            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Full Description *
            </label>
            <textarea
              id="fullDescription"
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y"
              placeholder="Detailed description of the product..."
            />
          </div>

          {/* Images */}
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
              Images (one URL per line)
            </label>
            <textarea
              id="images"
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={4}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-y font-mono text-sm"
            />
            <p className="mt-2 text-sm text-gray-500">
              Enter image URLs, one per line. These will be used as product images.
            </p>
          </div>

          {/* Message */}
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

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Product'}
            </button>
            <Link
              href="/admin/products"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
