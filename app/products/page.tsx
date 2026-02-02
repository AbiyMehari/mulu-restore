'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { addToCart as addToCartStorage } from '@/lib/cart';

type Product = {
  _id: string;
  title: string;
  slug: string;
  price: number;
  stockQuantity?: number;
  images?: unknown;
  category?: { name?: string; slug?: string } | null;
};

function getFirstImage(images: any): string {
  if (!Array.isArray(images) || images.length === 0) return '';
  const first = images[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object' && typeof first.url === 'string') return first.url;
  return '';
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const eur = useMemo(
    () => (amountCents: number) =>
      ((amountCents ?? 0) / 100).toLocaleString('en-IE', { style: 'currency', currency: 'EUR' }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/products', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const data = (await res.json().catch(() => ({}))) as { items?: Product[] };
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (cancelled) return;
        setItems([]);
        setError('Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (p: Product) => {
    addToCartStorage({ productId: p._id, title: p.title, price: p.price }, 1);
    setAddedToCart(p._id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Mulu ReStore Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-green-800">
                Mulu ReStore
              </span>
            </Link>
            <div className="flex gap-6">
              <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors font-medium">
                Products
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-green-700 transition-colors">
                Cart
              </Link>
              <Link href="/auth/login" className="text-gray-700 hover:text-green-700 transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-100 to-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Our Products
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Curated vintage and restored furniture
          </p>
          <p className="text-lg text-gray-600">
            Sustainable, one-of-a-kind items that connect the past and present
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">Loading products...</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No products available</p>
              <Link
                href="/"
                className="text-green-700 hover:text-green-800 font-medium mt-4 inline-block"
              >
                Return to home
              </Link>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((p) => {
                const image = getFirstImage(p.images);
                const stock = typeof p.stockQuantity === 'number' ? p.stockQuantity : null;
                const outOfStock = stock !== null && stock <= 0;
                const justAdded = addedToCart === p._id;

                return (
                  <div
                    key={p._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 flex flex-col"
                  >
                    <Link
                      href={`/products/${p.slug}`}
                      className="block flex-1"
                    >
                      <div className="bg-gray-100 aspect-square relative overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-16 h-16"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{p.title}</h3>
                        <div className="text-2xl font-bold text-green-700 mb-2">
                          {eur(p.price ?? 0)}
                        </div>
                        {p.category?.name && (
                          <div className="text-sm text-gray-600 mb-2">
                            {p.category.name}
                          </div>
                        )}
                        {stock !== null && stock > 0 && (
                          <div className="text-sm text-gray-500">
                            In stock: {stock}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-4 pt-0">
                      {outOfStock ? (
                        <div className="text-red-600 text-sm font-medium mb-2">Out of stock</div>
                      ) : null}
                      {justAdded && (
                        <div className="text-green-600 text-sm font-medium mb-2">✓ Added to cart!</div>
                      )}
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        disabled={outOfStock}
                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                          outOfStock
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-700 text-white hover:bg-green-800 shadow-md hover:shadow-lg'
                        }`}
                      >
                        {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
