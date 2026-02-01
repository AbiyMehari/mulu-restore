'use client';

import { useState } from 'react';
import { addToCart as addToCartStorage } from '@/lib/cart';
import { readCart } from '@/lib/cart';

export default function AddToCartButton({
  productId,
  title,
  price,
  stockQuantity,
  // Accept these optional props because the server page passes them.
  // We intentionally do not persist them to localStorage.
  slug: _slug,
  image: _image,
}: {
  productId: string;
  title: string;
  price: number;
  stockQuantity?: number;
  slug?: string;
  image?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = () => {
    const stock = typeof stockQuantity === 'number' ? stockQuantity : null;
    if (stock !== null && stock <= 0) {
      setMessage('Out of stock.');
      window.setTimeout(() => setMessage(null), 1500);
      return;
    }

    if (stock !== null) {
      const current = readCart();
      const existing = current.find((x) => x.productId === productId);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty >= stock) {
        setMessage(`Only ${stock} in stock.`);
        window.setTimeout(() => setMessage(null), 2000);
        return;
      }
    }

    addToCartStorage({ productId, title, price }, 1);
    setMessage('Added to cart.');
    window.setTimeout(() => setMessage(null), 1500);
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <button
        type="button"
        onClick={onAdd}
        disabled={typeof stockQuantity === 'number' ? stockQuantity <= 0 : false}
        style={{ padding: '0.5rem 0.75rem', opacity: typeof stockQuantity === 'number' && stockQuantity <= 0 ? 0.6 : 1 }}
      >
        Add to cart
      </button>
      {message ? (
        <div style={{ marginTop: '0.5rem', color: message.toLowerCase().includes('stock') ? '#b91c1c' : '#15803d' }}>{message}</div>
      ) : null}
    </div>
  );
}

