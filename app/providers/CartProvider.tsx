'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addToCart as addToCartStorage,
  clearCart as clearCartStorage,
  readCart,
  removeFromCart,
  setCartQuantity as setCartQuantityStorage,
} from '@/lib/cart';

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

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  useEffect(() => {
    // Ensure state reflects any already-stored cart.
    setItems(readCart());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  const addItem = useCallback((item: AddCartItemInput, quantity = 1) => {
    if (!item?.productId) return;
    const updated = addToCartStorage({ productId: item.productId, title: item.title, price: item.price }, quantity);
    setItems(updated);
  }, []);

  const removeItem = useCallback((productId: string) => {
    const updated = removeFromCart(productId);
    setItems(updated);
  }, []);

  const updateQty = useCallback((productId: string, quantity: number) => {
    const updated = setCartQuantityStorage(productId, quantity);
    setItems(updated);
  }, []);

  const clearCart = useCallback(() => {
    clearCartStorage();
    setItems([]);
  }, []);

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

