"use client";

import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import { useWishlist } from "@/context/WishlistContext";

export default function WishlistPage() {
  const { products } = useWishlist();

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-2xl text-ink md:text-3xl">Your Wishlist</h1>

      {products.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it here for later."
          actionLabel="Browse Shop"
          actionHref="/shop"
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
