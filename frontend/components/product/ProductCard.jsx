"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Check, Sparkles } from "lucide-react";
import Rating from "@/components/ui/Rating";
import {
  useDispatch,
  useSelector,
  addToCart,
  toggleWishlist,
  selectWishlistItems,
  triggerToast,
} from "@/lib/redux/store";
import { normalizeProduct } from "@/lib/productUtils";

export default function ProductCard({ product: rawProduct }) {
  const dispatch = useDispatch();
  const product = normalizeProduct(rawProduct);

  const wishlistItems = useSelector(selectWishlistItems);
  const isWishlisted = wishlistItems?.some(
    (item) => item.product?._id === product.id || item.product?.slug === product.slug
  );

  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const firstAvailable = product.variants?.find((v) => v.stock > 0) ?? product.variants?.[0];
  const isOutOfStock = product.stock <= 0 && (!firstAvailable || firstAvailable.stock <= 0);

  // Price calculations
  const sellingPrice = product.basePrice || product.price || 0;
  const comparePrice = product.compareAtPrice || product.originalPrice || null;
  const hasDiscount = Boolean(comparePrice && comparePrice > sellingPrice);
  const discountPercent = product.discountPercent || (hasDiscount ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100) : null);
  const savings = hasDiscount ? comparePrice - sellingPrice : 0;

  // Primary image
  const primaryImage = imageError
    ? "https://placehold.co/600x600/fbf7ed/2e2315?text=Brundavanam+Organic"
    : product.images?.[0] || "https://placehold.co/600x600/fbf7ed/2e2315?text=Brundavanam+Goshala";

  // Handle Add to Cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    try {
      await dispatch(
        addToCart({
          product,
          variantId: firstAvailable?.id || null,
          variantLabel: firstAvailable?.label || "",
          quantity: 1,
        })
      );
      setAdded(true);
      dispatch(triggerToast(`Added '${product.name}' to shopping cart`, "success"));
      setTimeout(() => setAdded(false), 1800);
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to add to cart", "error"));
    }
  };

  // Handle Wishlist Toggle
  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const action = await dispatch(toggleWishlist(product));
      dispatch(
        triggerToast(
          action === "removed"
            ? `Removed '${product.name}' from wishlist`
            : `Added '${product.name}' to wishlist`,
          "info"
        )
      );
    } catch (err) {
      dispatch(triggerToast(err.message || "Could not update wishlist", "error"));
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-surface p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl">
      {/* 1. Image Showcase Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f8f4eb]">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={primaryImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          onClick={handleToggleWishlist}
          className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
              : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-rose-500"
          }`}
          title={isWishlisted ? "In your Wishlist" : "Add to Wishlist"}
        >
          <Heart
            size={16}
            className={`transition-transform duration-200 ${isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : ""}`}
          />
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 z-10">
            <span className="rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Sacred Vedic Tag */}
        <div className="absolute bottom-2 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#1f1911]/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-semibold text-[#faf3e0]">
            <Sparkles size={10} className="text-amber-400" />
            <span>100% Ahimsa</span>
          </span>
        </div>
      </div>

      {/* 2. Product Meta & Pricing */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          {/* Category / Goshala Tag */}
          <span className="block text-[10px] font-bold uppercase tracking-wider text-accent-deep/90 truncate">
            {product.categoryName || "Goshala Collection"}
          </span>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block mt-1">
            <h3 className="font-display text-sm font-bold text-ink line-clamp-2 leading-snug group-hover:text-accent transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Ratings */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <Rating value={product.ratingsAverage || 4.9} count={product.ratingsCount || 24} />
          </div>
        </div>

        {/* 3. Pricing and Add-to-Cart Row */}
        <div className="mt-3 pt-2.5 border-t border-line/60">
          <div className="flex items-center justify-between gap-2">
            {/* Price with Compare Strikethrough & Savings */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-ink">
                  ₹{sellingPrice.toLocaleString("en-IN")}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-ink-soft/70 line-through">
                    ₹{comparePrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {hasDiscount && savings > 0 && (
                <span className="text-[10px] font-semibold text-emerald-700">
                  Save ₹{savings.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all shadow-xs ${
                added
                  ? "bg-emerald-600 text-white"
                  : isOutOfStock
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-accent text-surface hover:bg-accent-deep active:scale-95 shadow-accent/20"
              }`}
              title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            >
              {added ? (
                <>
                  <Check size={14} className="stroke-[3]" />
                  <span>Added</span>
                </>
              ) : isOutOfStock ? (
                <span>Sold Out</span>
              ) : (
                <>
                  <ShoppingBag size={14} />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
