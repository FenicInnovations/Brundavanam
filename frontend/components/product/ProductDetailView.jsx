"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import Rating from "@/components/ui/Rating";
import Button from "@/components/ui/Button";
import ProductGallery from "@/components/product/ProductGallery";
import { VariantSelector, QuantitySelector } from "@/components/product/VariantSelector";
import ProductTabs from "@/components/product/ProductTabs";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

export default function ProductDetailView({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [variantId, setVariantId] = useState(
    product.variants.find((v) => v.stock > 0)?.id ?? product.variants[0].id
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId);
  const outOfStock = variant.stock <= 0;
  const wishlisted = isWishlisted(product.slug);

  const handleAddToCart = () => {
    addToCart(product.slug, variantId, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product.slug, variantId, quantity);
    router.push("/cart");
  };

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <h1 className="font-display text-2xl text-ink md:text-3xl">{product.name}</h1>
          <div className="mt-2">
            <Rating value={product.ratingsAverage} count={product.ratingsCount} />
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-ink">₹{variant.price}</span>
            {variant.compareAtPrice && (
              <span className="text-base text-ink-soft line-through">
                ₹{variant.compareAtPrice}
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {product.shortDescription}
          </p>

          <div className="mt-6 flex flex-col gap-5">
            <VariantSelector
              variants={product.variants}
              selectedId={variantId}
              onSelect={setVariantId}
            />
            <QuantitySelector quantity={quantity} onChange={setQuantity} max={variant.stock || 1} />
          </div>

          <p className={`mt-4 text-sm ${outOfStock ? "text-accent-deep" : "text-support"}`}>
            {outOfStock ? "Out of stock" : `In stock — ${variant.stock} available`}
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button className="flex-1" disabled={outOfStock} onClick={handleAddToCart}>
              {justAdded ? "Added ✓" : "Add to Cart"}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              disabled={outOfStock}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => toggleWishlist(product.slug)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded border"
            >
              <Heart
                size={19}
                className={wishlisted ? "text-accent" : "text-ink-soft"}
                fill={wishlisted ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-y py-5 text-center text-xs text-ink-soft">
            <div className="flex flex-col items-center gap-1.5">
              <Truck size={18} className="text-accent" />
              Ships in 2 days
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <RotateCcw size={18} className="text-accent" />
              7-day returns
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={18} className="text-accent" />
              Quality checked
            </div>
          </div>

          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
}
