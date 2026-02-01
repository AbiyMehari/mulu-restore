'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = {
  productId: string;
  title: string;
  price: number; // cents
  quantity: number;
  image?: string;
  slug?: string;
};

export type AddCartItemInput = Omit<CartItem, 'quantity'>;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: AddCartItemInput, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
};

const STORAGE_KEY = 'mulu_cart';

const CartContext = createContext<CartContextValue | null>(null);

function coercePositiveInt(value: unknown, fallback = 1) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function normalizeStoredItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const out: CartItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as any;

    const productId = typeof e.productId === 'string' ? e.productId : '';
    const title = typeof e.title === 'string' ? e.title : '';
    const price = typeof e.price === 'number' ? e.price : Number(e.price);
    const quantity = coercePositiveInt(e.quantity, 0);
    const image = typeof e.image === 'string' ? e.image : undefined;
    const slug = typeof e.slug === 'string' ? e.slug : undefined;

    if (!productId || !title) continue;
    if (!Number.isFinite(price) || price < 0) continue;
    if (quantity <= 0) continue;

    out.push({ productId, title, price, quantity, image, slug });
  }

  return out;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setItems(normalizeStoredItems(parsed));
    } catch {
      setItems([]);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore write errors (e.g. storage disabled/quota)
    }
  }, [items]);

  const addItem = useCallback((item: AddCartItemInput, quantity = 1) => {
    const qty = coercePositiveInt(quantity, 1);
    if (!item?.productId || qty <= 0) return;

    setItems((prev) => {
      const idx = prev.findIndex((x) => x.productId === item.productId);
      if (idx === -1) {
        return [
          ...prev,
          {
            productId: item.productId,
            title: item.title,
            price: item.price,
            quantity: qty,
            image: item.image,
            slug: item.slug,
          },
        ];
      }

      const next = prev.slice();
      next[idx] = {
        ...next[idx],
        title: item.title ?? next[idx].title,
        price: typeof item.price === 'number' ? item.price : next[idx].price,
        image: item.image ?? next[idx].image,
        slug: item.slug ?? next[idx].slug,
        quantity: next[idx].quantity + qty,
      };
      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((x) => x.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, quantity: number) => {
    const qty = coercePositiveInt(quantity, 0);
    setItems((prev) => {
      if (qty <= 0) return prev.filter((x) => x.productId !== productId);
      return prev.map((x) => (x.productId === productId ? { ...x, quantity: qty } : x));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useCallback(() => {
    return items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  }, [items]);

  const totalAmount = useCallback(() => {
    return items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      totalItems,
      totalAmount,
    }),
    [items, addItem, removeItem, updateQty, clearCart, totalItems, totalAmount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}

