"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getProductBySlug } from "@/lib/mockProducts";

const WishlistContext = createContext(null);
const STORAGE_KEY = "bg_wishlist_v1";

export function WishlistProvider({ children }) {
  const [slugs, setSlugs] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSlugs(JSON.parse(stored));
    } catch {
      // ignore malformed/blocked storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  }, [slugs, hydrated]);

  const toggleWishlist = (slug) => {
    setSlugs((current) =>
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  };

  const isWishlisted = (slug) => slugs.includes(slug);

  const products = slugs.map(getProductBySlug).filter(Boolean);

  return (
    <WishlistContext.Provider
      value={{
        slugs,
        products,
        wishlistCount: slugs.length,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
