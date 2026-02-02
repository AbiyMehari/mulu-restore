'use client';

import { useState } from 'react';
import { addToCart as addToCartStorage } from '@/lib/cart';
import { readCart } from '@/lib/cart';

export default function AddToCartButton({
  productId,
  title,
  price,
  stockQuantity,
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
      // Check if adding 1 more would exceed stock
      if (currentQty + 1 > stock) {
        if (currentQty > 0) {
          setMessage(`You already have ${currentQty} in your cart. Only ${stock} available in stock.`);
        } else {
          setMessage(`Only ${stock} in stock.`);
        }
        window.setTimeout(() => setMessage(null), 3000);
        return;
      }
    }

    addToCartStorage({ productId, title, price }, 1);
    setMessage('✓ Added to cart!');
    window.setTimeout(() => setMessage(null), 2000);
  };

  const isOutOfStock = typeof stockQuantity === 'number' && stockQuantity <= 0;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onAdd}
        disabled={isOutOfStock}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl ${
          isOutOfStock
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-700 text-white hover:bg-green-800'
        }`}
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
      {message && (
        <div
          className={`mt-3 p-3 rounded-lg text-sm font-medium ${
            message.toLowerCase().includes('stock') || message.toLowerCase().includes('only')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
