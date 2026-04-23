'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_name?: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number, variant_name?: string) => void;
  updateQuantity: (product_id: number, variant_name: string | undefined, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('arong-cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('arong-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product_id === newItem.product_id && i.variant_name === newItem.variant_name
      );
      if (existing) {
        return prev.map((i) =>
          i.product_id === newItem.product_id && i.variant_name === newItem.variant_name
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
    setIsOpen(true);
  };

  const removeItem = (product_id: number, variant_name?: string) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.product_id === product_id && i.variant_name === variant_name)
      )
    );
  };

  const updateQuantity = (
    product_id: number,
    variant_name: string | undefined,
    qty: number
  ) => {
    if (qty <= 0) {
      removeItem(product_id, variant_name);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === product_id && i.variant_name === variant_name
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
