'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useCart } from '@/app/providers/CartProvider';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, totalAmount, clearCart } = useCart();
  const eur = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });

  // Explicitly read localStorage on mount to avoid showing "empty cart"
  // during the initial cart hydration window.
  const [storedCount, setStoredCount] = useState<number | null>(null);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('mulu_cart');
      const parsed = raw ? JSON.parse(raw) : [];
      setStoredCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setStoredCount(0);
    }
  }, []);

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

    if (!fullName.trim()) errors.name = 'Required';
    if (!email.trim()) errors.email = 'Required';
    if (!street.trim()) errors.street = 'Required';
    if (!city.trim()) errors.city = 'Required';
    if (!postalCode.trim()) errors.postalCode = 'Required';

    return errors;
  };

  const currentErrors = useMemo(() => validate(), [fullName, email, street, city, postalCode]);
  const canPay = items.length > 0 && Object.keys(currentErrors).length === 0 && !submitting;

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

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || `Failed (${res.status})` });
        return;
      }

      const orderId = data?.item?._id;
      if (!orderId) {
        setMessage({ type: 'error', text: 'Failed to create order.' });
        return;
      }

      clearCart();
      try {
        window.localStorage.removeItem('mulu_cart');
      } catch {
        // ignore
      }
      router.push(`/order/success?id=${orderId}`);
    } catch (err) {
      console.error('Checkout failed:', err);
      setMessage({ type: 'error', text: 'Request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && storedCount === null) {
    return (
      <div>
        <h1>Checkout</h1>
        <p>Loading your cart…</p>
      </div>
    );
  }

  if (items.length === 0 && (storedCount ?? 0) === 0) {
    return (
      <div>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link href="/products">Go to products</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/products">← Back to Products</Link>
      </div>

      <h1>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        <form onSubmit={onSubmit} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>Shipping & Contact</h2>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
            {fieldErrors.name ? <div style={{ marginTop: '0.25rem', color: '#b91c1c' }}>{fieldErrors.name}</div> : null}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" style={{ width: '100%', padding: '0.5rem' }} />
            {fieldErrors.email ? <div style={{ marginTop: '0.25rem', color: '#b91c1c' }}>{fieldErrors.email}</div> : null}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Street</label>
            <input value={street} onChange={(e) => setStreet(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
            {fieldErrors.street ? <div style={{ marginTop: '0.25rem', color: '#b91c1c' }}>{fieldErrors.street}</div> : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
              {fieldErrors.city ? <div style={{ marginTop: '0.25rem', color: '#b91c1c' }}>{fieldErrors.city}</div> : null}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem' }}>Postal code</label>
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
              {fieldErrors.postalCode ? <div style={{ marginTop: '0.25rem', color: '#b91c1c' }}>{fieldErrors.postalCode}</div> : null}
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
          </div>

          {message ? (
            <div style={{ marginBottom: '0.75rem', color: message.type === 'error' ? '#b91c1c' : '#15803d' }}>
              {message.text}
            </div>
          ) : null}

          <button type="submit" disabled={!canPay} style={{ padding: '0.5rem 0.75rem' }}>
            {submitting ? 'Paying…' : 'Pay'}
          </button>
        </form>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>Order summary</h2>

          <div style={{ marginTop: '0.75rem' }}>
            {items.map((it) => (
              <div key={it.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ paddingRight: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{it.title}</div>
                  <div style={{ color: '#374151' }}>
                    Qty {it.quantity} × {eur.format((it.price ?? 0) / 100)}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{eur.format(((it.price ?? 0) * (it.quantity ?? 0)) / 100)}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total items</span>
              <strong>{totalItems()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span>Total</span>
              <strong>{eur.format(totalAmount() / 100)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
