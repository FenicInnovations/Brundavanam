"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getProductBySlug } from "@/lib/mockProducts";

const CartContext = createContext(null);
const STORAGE_KEY = "bg_cart_v1";

/**
 * Cart state lives in localStorage for now — there's no backend cart
 * endpoint yet. Stage 3/4 swaps this provider's internals for real
 * GET/POST/PATCH calls to /api/cart without changing how components
 * call useCart().
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ slug, variantId, quantity }]
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore malformed/blocked storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addToCart = (slug, variantId, quantity = 1) => {
    setItems((current) => {
      const existing = current.find(
        (i) => i.slug === slug && i.variantId === variantId
      );
      if (existing) {
        return current.map((i) =>
          i.slug === slug && i.variantId === variantId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...current, { slug, variantId, quantity }];
    });
  };

  const updateQuantity = (slug, variantId, quantity) => {
    setItems((current) =>
      current
        .map((i) =>
          i.slug === slug && i.variantId === variantId ? { ...i, quantity } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (slug, variantId) => {
    setItems((current) =>
      current.filter((i) => !(i.slug === slug && i.variantId === variantId))
    );
  };

  const clearCart = () => setItems([]);

  // Resolve against product data for display — dropped silently if a
  // slug/variant no longer exists (e.g. mock data changed).
  const lines = items
    .map((item) => {
      const product = getProductBySlug(item.slug);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (!product || !variant) return null;
      return { ...item, product, variant };
    })
    .filter(Boolean);

  const cartCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.variant.price * l.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        lines,
        cartCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
