'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { readCart } from '@/lib/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
  const [stockById, setStockById] = useState<Record<string, number | null>>({});
  const [items, setItems] = useState<Array<{ productId: string; title: string; price: number; quantity: number }>>([]);

  // Read cart from localStorage
  useEffect(() => {
    const cart = readCart();
    setItems(cart);
  }, []);

  // Listen for cart updates
  useEffect(() => {
    const onUpdate = () => setItems(readCart());
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mulu_cart') onUpdate();
    };
    window.addEventListener('mulu_cart_updated', onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('mulu_cart_updated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Load stock for current cart items
  useEffect(() => {
    let cancelled = false;
    async function loadStock() {
      const ids = Array.from(new Set(items.map((it) => it.productId))).filter(Boolean);
      if (ids.length === 0) {
        setStockById({});
        return;
      }

      const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);
      const objectIds = ids.filter(isObjectId);
      const slugIds = ids.filter((x) => !isObjectId(x));

      const next: Record<string, number | null> = {};

      if (objectIds.length > 0) {
        const remaining = new Set(objectIds);
        let page = 1;
        const limit = 100;
        while (remaining.size > 0 && page <= 50) {
          const res = await fetch(`/api/products?page=${page}&limit=${limit}`, { cache: 'no-store' });
          if (!res.ok) break;
          const data = (await res.json().catch(() => ({}))) as { items?: any[] };
          const list = Array.isArray(data.items) ? data.items : [];
          if (list.length === 0) break;
          for (const p of list) {
            const id = typeof p?._id === 'string' ? p._id : '';
            if (!id || !remaining.has(id)) continue;
            next[id] = typeof p.stockQuantity === 'number' ? p.stockQuantity : null;
            remaining.delete(id);
          }
          page += 1;
        }
        for (const id of remaining) next[id] = null;
      }

      for (const slug of slugIds) {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
          if (!res.ok) {
            next[slug] = null;
            continue;
          }
          const data = (await res.json().catch(() => ({}))) as any;
          next[slug] = typeof data?.item?.stockQuantity === 'number' ? data.item.stockQuantity : null;
        } catch {
          next[slug] = null;
        }
      }

      if (cancelled) return;
      setStockById(next);
    }

    loadStock();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Germany');

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    street?: string;
    city?: string;
    postalCode?: string;
  }>({});

  const orderPayload = useMemo(() => {
    return {
      email: email.trim(),
      fullName: fullName.trim(),
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      country: country.trim() || 'Germany',
      phone: phone.trim() || undefined,
      items: items.map((it) => ({
        productId: it.productId,
        title: it.title,
        unitPrice: it.price,
        quantity: it.quantity,
      })),
    };
  }, [email, fullName, street, city, postalCode, country, phone, items]);

  const validate = () => {
    const errors: {
      name?: string;
      email?: string;
      street?: string;
      city?: string;
      postalCode?: string;
    } = {};

    if (!fullName.trim()) errors.name = 'Full name is required';
    const emailTrimmed = email.trim();
    const emailLooksValid = /^\S+@\S+\.\S+$/.test(emailTrimmed);
    if (!emailTrimmed || !emailLooksValid) errors.email = 'Valid email required';
    if (!street.trim()) errors.street = 'Required';
    if (!city.trim()) errors.city = 'Required';
    if (!postalCode.trim()) errors.postalCode = 'Required';

    return errors;
  };

  const currentErrors = useMemo(() => validate(), [fullName, email, street, city, postalCode]);
  const stockProblems = useMemo(() => {
    const problems: string[] = [];
    for (const it of items) {
      const stock = stockById[it.productId];
      if (typeof stock === 'number' && stock >= 0 && it.quantity > stock) {
        problems.push(it.productId);
      }
    }
    return problems;
  }, [items, stockById]);

  const totalItems = useMemo(() => items.reduce((sum, it) => sum + (it.quantity || 0), 0), [items]);
  const totalAmount = useMemo(() => items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0), [items]);

  const canPay = items.length > 0 && Object.keys(currentErrors).length === 0 && !submitting && stockProblems.length === 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMessage({ type: 'error', text: 'Please fill all required fields.' });
      return;
    }

    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Your cart is empty.' });
      return;
    }

    // Re-validate against latest stock before placing the order.
    for (const it of items) {
      const stock = stockById[it.productId];
      if (typeof stock === 'number') {
        if (stock <= 0) {
          setMessage({ type: 'error', text: `Insufficient stock for ${it.title}` });
          return;
        }
        if (it.quantity > stock) {
          setMessage({ type: 'error', text: `Insufficient stock for ${it.title}` });
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409) {
          setMessage({ type: 'error', text: data?.error || 'Out of stock' });
          return;
        }
        setMessage({ type: 'error', text: data?.error || 'Order could not be placed. Please try again.' });
        return;
      }

      const url = data?.url;
      if (!url || typeof url !== 'string') {
        setMessage({ type: 'error', text: 'Order could not be placed. Please try again.' });
        return;
      }

      // Redirect to Stripe Checkout
      window.location.assign(url);
    } catch (err) {
      console.error('Checkout failed:', err);
      setMessage({ type: 'error', text: 'Order could not be placed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
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
                <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-12">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some items to your cart before checkout.</p>
            <Link
              href="/products"
              className="inline-block bg-green-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <Link href="/products" className="text-gray-700 hover:text-green-700 transition-colors">
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
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-100 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-lg text-gray-600">Complete your order</p>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Shipping & Contact Form */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping & Contact</h2>

              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full name *
                  </label>
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  />
                  {fieldErrors.name && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.name}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  />
                  {fieldErrors.email && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.email}</div>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                    Street *
                  </label>
                  <input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                  />
                  {fieldErrors.street && (
                    <div className="mt-1 text-sm text-red-600">{fieldErrors.street}</div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    />
                    {fieldErrors.city && (
                      <div className="mt-1 text-sm text-red-600">{fieldErrors.city}</div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Postal code *
                    </label>
                    <input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                    />
                    {fieldErrors.postalCode && (
                      <div className="mt-1 text-sm text-red-600">{fieldErrors.postalCode}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
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

                {stockProblems.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    Some items exceed available stock. Please adjust your cart.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canPay}
                  title={!canPay ? 'Please complete required fields' : undefined}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl ${
                    !canPay
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-700 text-white hover:bg-green-800'
                  }`}
                >
                  {submitting ? 'Processing…' : 'Proceed to Payment'}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-md p-8 h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((it) => {
                  const stock = stockById[it.productId];
                  const hasStockIssue = typeof stock === 'number' && it.quantity > stock;
                  return (
                    <div key={it.productId} className="flex justify-between items-start pb-4 border-b border-gray-200">
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-gray-900">{it.title}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Qty {it.quantity} × {eur.format((it.price ?? 0) / 100)}
                        </div>
                        {hasStockIssue && (
                          <div className="text-sm text-red-600 mt-1 font-medium">
                            Only {stock} in stock
                          </div>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900">
                        {eur.format(((it.price ?? 0) * (it.quantity ?? 0)) / 100)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-700">
                  <span>Total items</span>
                  <span className="font-semibold">{totalItems}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-green-700">{eur.format(totalAmount / 100)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
