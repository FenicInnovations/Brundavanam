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
      const validVariantId =
        firstAvailable?.id &&
        !firstAvailable?.isFallback &&
        firstAvailable.id !== product.slug &&
        firstAvailable.id !== product._id
          ? firstAvailable.id
          : null;

      await dispatch(
        addToCart({
          product,
          variantId: validVariantId,
          variantLabel: validVariantId ? (firstAvailable?.label || "") : "",
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
    <div className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-surface p-2.5 sm:p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl">
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
          className={`absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full backdrop-blur-md transition-all shadow-sm ${
            isWishlisted
              ? "bg-rose-50 text-rose-600 ring-1 ring-rose-200"
              : "bg-surface/90 text-ink-soft hover:bg-surface hover:text-rose-500"
          }`}
          title={isWishlisted ? "In your Wishlist" : "Add to Wishlist"}
        >
          <Heart
            size={15}
            className={`transition-transform duration-200 ${isWishlisted ? "fill-rose-500 text-rose-500 scale-110" : ""}`}
          />
        </button>

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute left-2 top-2 sm:left-2.5 sm:top-2.5 flex flex-col gap-1 z-10">
            <span className="rounded-md sm:rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-1.5 py-0.5 sm:px-2 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Sacred Vedic Tag */}
        <div className="absolute bottom-1.5 left-2 sm:bottom-2 sm:left-2.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#1f1911]/80 backdrop-blur-xs px-1.5 py-0.5 sm:px-2 text-[8px] sm:text-[9px] font-semibold text-[#faf3e0]">
            <Sparkles size={9} className="text-amber-400" />
            <span>100% Organic</span>
          </span>
        </div>
      </div>

      {/* 2. Product Meta & Pricing */}
      <div className="mt-2.5 sm:mt-3 flex flex-1 flex-col justify-between">
        <div>
          {/* Category / Goshala Tag */}
          <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-accent-deep/90 truncate">
            {product.categoryName || "Goshala Collection"}
          </span>

          {/* Product Title - Uniform min-height prevents uneven card stretching */}
          <Link href={`/product/${product.slug}`} className="block mt-0.5 sm:mt-1">
            <h3 className="font-display text-xs sm:text-sm font-bold text-ink line-clamp-2 min-h-[2.2rem] sm:min-h-[2.5rem] leading-snug group-hover:text-accent transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Ratings */}
          <div className="mt-1 flex items-center gap-1">
            <Rating value={product.ratingsAverage || 4.9} count={product.ratingsCount || 24} />
          </div>
        </div>

        {/* 3. Pricing and Add-to-Cart Row */}
        <div className="mt-2.5 pt-2 border-t border-line/60">
          <div className="flex items-center justify-between gap-1.5">
            {/* Price with Compare Strikethrough & Savings */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-sm sm:text-base font-extrabold text-ink whitespace-nowrap">
                  ₹{sellingPrice.toLocaleString("en-IN")}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] sm:text-xs text-ink-soft/70 line-through whitespace-nowrap">
                    ₹{comparePrice.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {hasDiscount && savings > 0 && (
                <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 truncate">
                  Save ₹{savings.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className={`flex h-8 sm:h-9 items-center justify-center gap-1 rounded-xl px-2.5 sm:px-3 text-xs font-bold transition-all shadow-xs shrink-0 ${
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
                  <Check size={13} className="stroke-[3]" />
                  <span>Added</span>
                </>
              ) : isOutOfStock ? (
                <span>Out</span>
              ) : (
                <>
                  <ShoppingBag size={13} />
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
