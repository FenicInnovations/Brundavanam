"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Share2,
} from "lucide-react";
import Rating from "@/components/ui/Rating";
import ProductGallery from "@/components/product/ProductGallery";
import { VariantSelector, QuantitySelector } from "@/components/product/VariantSelector";
import ProductTabs from "@/components/product/ProductTabs";
import {
  useDispatch,
  useSelector,
  addToCart,
  toggleWishlist,
  selectWishlistItems,
  triggerToast,
} from "@/lib/redux/store";

export default function ProductDetailView({ product }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const wishlistItems = useSelector(selectWishlistItems);
  const isWishlisted = wishlistItems?.some(
    (item) => item.product?._id === product.id || item.product?.slug === product.slug
  );

  const [variantId, setVariantId] = useState(
    product.variants?.find((v) => v.stock > 0)?.id ?? product.variants?.[0]?.id
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant =
    product.variants?.find((v) => v.id === variantId) ?? product.variants?.[0];

  const outOfStock = (selectedVariant?.stock ?? product.stock) <= 0;

  // Price calculations
  const sellingPrice = selectedVariant?.price ?? product.basePrice ?? product.price ?? 0;
  const comparePrice =
    selectedVariant?.compareAtPrice ?? product.compareAtPrice ?? product.originalPrice ?? null;
  const hasDiscount = Boolean(comparePrice && comparePrice > sellingPrice);
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100)
    : product.discountPercent ?? null;
  const savings = hasDiscount ? comparePrice - sellingPrice : 0;

  // Add to Cart
  const handleAddToCart = async () => {
    if (outOfStock) return;
    try {
      const genuineVariantId =
        selectedVariant?.id && !selectedVariant?.isFallback && selectedVariant.id !== product.slug
          ? selectedVariant.id
          : null;

      await dispatch(
        addToCart({
          product,
          variantId: genuineVariantId,
          variantLabel: genuineVariantId ? (selectedVariant?.label || "") : "",
          quantity,
        })
      );
      setJustAdded(true);
      dispatch(triggerToast(`Added ${quantity} × '${product.name}' to cart`, "success"));
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to add to cart", "error"));
    }
  };

  // Buy Now
  const handleBuyNow = async () => {
    if (outOfStock) return;
    try {
      const genuineVariantId =
        selectedVariant?.id && !selectedVariant?.isFallback && selectedVariant.id !== product.slug
          ? selectedVariant.id
          : null;

      await dispatch(
        addToCart({
          product,
          variantId: genuineVariantId,
          variantLabel: genuineVariantId ? (selectedVariant?.label || "") : "",
          quantity,
        })
      );
      router.push("/cart");
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to proceed to checkout", "error"));
    }
  };

  // Toggle Wishlist
  const handleToggleWishlist = async () => {
    try {
      const action = await dispatch(toggleWishlist(product));
      dispatch(
        triggerToast(
          action === "removed"
            ? `Removed '${product.name}' from wishlist`
            : `Saved '${product.name}' to wishlist`,
          "info"
        )
      );
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to update wishlist", "error"));
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 sm:px-6 py-6 md:px-8 md:py-12 space-y-8">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-ink-soft">
        <Link href="/" className="hover:text-accent transition-colors">
          Home
        </Link>
        <ChevronRight size={13} className="text-line" />
        <Link href="/shop" className="hover:text-accent transition-colors">
          Shop
        </Link>
        <ChevronRight size={13} className="text-line" />
        {product.categoryName && (
          <>
            <Link
              href={`/shop?category=${product.category}`}
              className="hover:text-accent transition-colors"
            >
              {product.categoryName}
            </Link>
            <ChevronRight size={13} className="text-line" />
          </>
        )}
        <span className="font-semibold text-ink truncate max-w-[200px] sm:max-w-xs">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Showcase Grid */}
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        {/* Left: Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Right: Product Meta, Pricing & Purchase Controls */}
        <div className="space-y-6">
          <div>
            {/* Sacred Origin Tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-accent-deep bg-amber-100/70 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                <Sparkles size={11} className="text-amber-600" />
                <span>Brundavanam Ahimsa Goshala</span>
              </span>
              <span className="text-xs text-ink-soft">SKU: {product.sku || "BG-VEDIC"}</span>
            </div>

            {/* Product Title */}
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="mt-2.5 flex items-center gap-3">
              <Rating value={product.ratingsAverage || 4.9} count={product.ratingsCount || 28} />
              <span className="text-xs text-emerald-700 font-semibold">• 100% Verified Devotee Reviews</span>
            </div>
          </div>

          {/* Pricing Box with Strikethrough & Savings */}
          <div className="rounded-2xl border border-line/80 bg-[#fdfbf7] p-4 sm:p-5 shadow-2xs space-y-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-ink">
                ₹{sellingPrice.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="text-lg text-ink-soft/70 line-through">
                  ₹{comparePrice.toLocaleString("en-IN")}
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-2.5 py-1 text-xs font-extrabold shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {hasDiscount && savings > 0 && (
              <p className="text-xs font-bold text-emerald-800">
                You Save: ₹{savings.toLocaleString("en-IN")} on this authentic pack!
              </p>
            )}

            <p className="text-[11px] text-ink-soft">
              Inclusive of all taxes • Free shipping all over India on orders above ₹1,500.
            </p>
          </div>

          {/* Short Description */}
          <p className="text-sm leading-relaxed text-ink-soft">
            {product.shortDescription ||
              "Authentic Vedic preparation crafted following timeless traditional principles. Made with pure A2 Desi cow ingredients, free from artificial additives."}
          </p>

          {/* Key Purity Highlights */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="flex items-center gap-2 rounded-xl bg-surface border border-line p-2.5 text-xs font-semibold text-ink">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>100% Ahimsa Cow Care</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface border border-line p-2.5 text-xs font-semibold text-ink">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Clay Pot Cultured</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface border border-line p-2.5 text-xs font-semibold text-ink">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>No Chemicals or Preservatives</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface border border-line p-2.5 text-xs font-semibold text-ink">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Food-Grade Glass Packaging</span>
            </div>
          </div>

          {/* Variant and Quantity Selection */}
          <div className="space-y-4 pt-2">
            {product.variants && product.variants.length > 1 && (
              <VariantSelector
                variants={product.variants}
                selectedId={variantId}
                onSelect={setVariantId}
              />
            )}

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-ink">Quantity:</span>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                max={selectedVariant?.stock || 50}
              />
              <span
                className={`text-xs font-semibold ${
                  outOfStock ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {outOfStock
                  ? "Currently Out of Stock"
                  : `In Stock (${selectedVariant?.stock || 50} units available)`}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold shadow-md transition-all active:scale-95 ${
                justAdded
                  ? "bg-emerald-600 text-white shadow-emerald-900/20"
                  : outOfStock
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border"
                  : "bg-accent text-surface hover:bg-accent-deep shadow-accent/20"
              }`}
            >
              <ShoppingBag size={18} />
              <span>{justAdded ? "Added to Cart ✓" : "Add to Cart"}</span>
            </button>

            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuyNow}
              className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 px-6 text-sm font-bold border transition-all active:scale-95 ${
                outOfStock
                  ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                  : "border-ink bg-surface text-ink hover:bg-bg"
              }`}
            >
              <Zap size={18} className="text-amber-500 fill-amber-500" />
              <span>Buy Now</span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              aria-label={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
              onClick={handleToggleWishlist}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all ${
                isWishlisted
                  ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm"
                  : "border-line bg-surface text-ink-soft hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50"
              }`}
              title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
            >
              <Heart
                size={20}
                className={isWishlisted ? "fill-rose-600 text-rose-600" : ""}
              />
            </button>
          </div>

          {/* Delivery & Purity Badges Strip */}
          <div className="grid grid-cols-3 gap-3 border-y border-line py-5 text-center text-xs text-ink-soft">
            <div className="flex flex-col items-center gap-1.5">
              <Truck size={20} className="text-accent" />
              <span className="font-semibold text-ink">Ships in 24-48h</span>
              <span className="text-[10px]">All India Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RotateCcw size={20} className="text-accent" />
              <span className="font-semibold text-ink">Safe Packaging</span>
              <span className="text-[10px]">Glass Jar Breakage Cover</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={20} className="text-accent" />
              <span className="font-semibold text-ink">100% Purity</span>
              <span className="text-[10px]">Indigenous Gir Cow</span>
            </div>
          </div>

          {/* Deep Content Information Tabs */}
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
}
