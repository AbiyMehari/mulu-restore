'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useCart } from '@/app/providers/CartProvider';

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear cart after successful payment.
    clearCart();
    try {
      window.localStorage.removeItem('mulu_cart');
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 720 }}>
      <h1>Payment successful</h1>
      {sessionId ? (
        <p style={{ color: '#374151' }}>
          Session: <code>{sessionId}</code>
        </p>
      ) : (
        <p style={{ color: '#374151' }}>Your payment was completed.</p>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/orders">My Orders</Link>
        <Link href="/products">Continue shopping</Link>
      </div>
    </div>
  );
}

