"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
import Rating from "@/components/ui/Rating";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export default function ProductCard({ product }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const wishlisted = isWishlisted(product.slug);
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(100 - (product.basePrice / product.compareAtPrice) * 100)
      : null;

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product.slug);
        }}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow-card"
      >
        <Heart
          size={17}
          className={wishlisted ? "text-accent" : "text-ink-soft"}
          fill={wishlisted ? "currentColor" : "none"}
        />
      </button>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-line">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {discount && (
            <span className="absolute left-2 top-2 rounded bg-accent px-2 py-1 text-[11px] font-medium text-surface">
              {discount}% off
            </span>
          )}
        </div>

        <div className="mt-3">
          <p className="text-sm font-medium text-ink">{product.name}</p>
          <p className="mt-1 line-clamp-1 text-xs text-ink-soft">
            {product.shortDescription}
          </p>
          <div className="mt-2">
            <Rating value={product.ratingsAverage} count={product.ratingsCount} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-ink">
                ₹{product.basePrice}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-ink-soft line-through">
                  ₹{product.compareAtPrice}
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label={`Add ${product.name} to cart`}
              disabled={firstAvailable.stock <= 0}
              onClick={(e) => {
                e.preventDefault();
                addToCart(product.slug, firstAvailable.id, 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ink text-ink transition-colors duration-150 hover:border-accent hover:text-accent-deep disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
