'use client';

import { useState } from 'react';
import { useCart } from '@/app/providers/CartProvider';

export default function AddToCartButton({
  productId,
  title,
  price,
  slug,
  image,
}: {
  productId: string;
  title: string;
  price: number;
  slug: string;
  image?: string;
}) {
  const { addItem } = useCart();
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = () => {
    addItem({ productId, title, price, slug, image }, 1);
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

