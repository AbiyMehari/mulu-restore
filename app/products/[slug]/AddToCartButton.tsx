'use client';

import { useState } from 'react';

export default function AddToCartButton({
  productId,
  title,
  price,
}: {
  productId: string;
  title: string;
  price: number;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = () => {
    let cart: any[] = [];
    try {
      const raw = window.localStorage.getItem('mulu_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        cart = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      cart = [];
    }

    const idx = cart.findIndex((x) => x && typeof x === 'object' && (x as any).productId === productId);
    if (idx === -1) {
      const updated = [...cart, { productId, title, price, quantity: 1 }];
      try {
        window.localStorage.setItem('mulu_cart', JSON.stringify(updated));
      } catch {
        // ignore
      }
      setMessage('Added to cart.');
      window.setTimeout(() => setMessage(null), 1500);
      return;
    }

    const current = cart[idx] as any;
    const currentQty = typeof current.quantity === 'number' ? current.quantity : 0;
    const nextQty = Math.max(0, Math.floor(currentQty)) + 1;

    const updated = cart.slice();
    updated[idx] = { productId, title, price, quantity: nextQty };

    try {
      window.localStorage.setItem('mulu_cart', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setMessage('Added to cart.');
    window.setTimeout(() => setMessage(null), 1500);
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button type="button" onClick={onAdd} style={{ padding: '0.5rem 0.75rem' }}>
        Add to cart
      </button>
      {message ? <div style={{ marginTop: '0.5rem', color: '#15803d' }}>{message}</div> : null}
    </div>
  );
}

