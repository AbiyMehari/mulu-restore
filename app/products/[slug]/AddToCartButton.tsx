'use client';

import { useState } from 'react';
import { addToCart as addToCartStorage } from '@/lib/cart';

export default function AddToCartButton({
  productId,
  title,
  price,
  // Accept these optional props because the server page passes them.
  // We intentionally do not persist them to localStorage.
  slug: _slug,
  image: _image,
}: {
  productId: string;
  title: string;
  price: number;
  slug?: string;
  image?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = () => {
    addToCartStorage({ productId, title, price }, 1);
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

