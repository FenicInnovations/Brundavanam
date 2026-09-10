"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Share2,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Rating from "@/components/ui/Rating";
import { getBestSellers, getHotProduct } from "@/lib/mockProducts";
import { CATEGORIES } from "@/lib/mockCategories";
import { BUSINESS_HOURS } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const TRUST_BADGES = [
  {
    icon: Truck,
    title: "Free Delivery, India Only",
    text: "On all orders over ₹1,500",
  },
  {
    icon: ShieldCheck,
    title: "Safe Payment",
    text: "100% secure checkout",
  },
  {
    icon: RotateCcw,
    title: "Shop With Confidence",
    text: "7-day easy returns",
  },
  {
    icon: Headphones,
    title: "Dedicated Help Center",
    text: BUSINESS_HOURS,
  },
];

/**
 * Stage 1–2 homepage, redesigned to the layout the client asked to match:
 * hero + hot-product countdown, a free-shipping banner, best sellers,
 * trust badges, and a shop-by-category grid — all in Brundavanam
 * Goshala's own identity rather than the reference site's.
 *
 * Data still comes from lib/mockProducts.js / lib/mockCategories.js —
 * Stage 3 swaps these for real fetches to GET /api/products and
 * GET /api/categories without touching this layout.
 */
export default function HomePage() {
  const bestSellers = getBestSellers(4);
  const hotProduct = getHotProduct();

  return (
    <div className="mx-auto max-w-content space-y-14 px-6 py-10 md:px-8 md:py-14">
      <HeroRow hotProduct={hotProduct} />
      <FreeShippingBanner />
      <BestSellers products={bestSellers} />
      <TrustBadges />
      <ShopByCategory />
    </div>
  );
}

function HeroRow({ hotProduct }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const firstVariant = hotProduct.variants[0];

  const handleAdd = () => {
    addToCart(hotProduct.slug, firstVariant.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Hero banner */}
      <div className="relative min-h-[380px] overflow-hidden rounded-xl bg-line lg:col-span-2">
        <Image
          src="https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1400&q=80"
          alt="Fresh ghee and goshala products"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" />
        <div className="relative flex h-full max-w-md flex-col justify-center p-10">
          <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
            Rooted in Tradition,
            <br />
            Made for You
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Bringing you the goodness of nature and the richness of our
            goshala's heritage.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink">
            <span>🌿 100% Natural</span>
            <span>🏺 Traditional</span>
            <span>♻️ Sustainable</span>
          </div>
          <div className="mt-7">
            <Button href="/shop">Shop Now</Button>
          </div>
        </div>
      </div>

      {/* Hot product card */}
      <div className="rounded-xl border bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Hot Product This Week</h2>
          <Link
            href="/shop"
            className="flex items-center gap-1 text-sm font-medium text-accent-deep"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Special pricing this week only.</p>

        <div className="mt-5 aspect-square w-full overflow-hidden rounded-lg bg-line">
          <Image
            src={hotProduct.images[0]}
            alt={hotProduct.name}
            width={500}
            height={500}
            className="h-full w-full object-cover"
          />
        </div>

        <p className="mt-4 font-medium text-ink">{hotProduct.name}</p>
        <p className="mt-1 text-2xl font-semibold text-ink">
          ₹{hotProduct.basePrice}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          In stock ({hotProduct.variants[0].stock})
        </p>

        <CountdownTimer className="mt-4" />

        <Button className="mt-5 w-full" onClick={handleAdd}>
          <ShoppingCart size={16} />
          {added ? "Added ✓" : "Add to Cart"}
        </Button>
      </div>
    </section>
  );
}

function CountdownTimer({ className = "" }) {
  // Fixed 3-day window from first render — every visitor sees a live
  // countdown without needing a backend-driven end date yet.
  const [target] = useState(() => Date.now() + 3 * 24 * 60 * 60 * 1000);
  const [remaining, setRemaining] = useState(target - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const units = [
    { label: "Days", value: days },
    { label: "Hrs", value: hours },
    { label: "Mins", value: minutes },
    { label: "Secs", value: seconds },
  ];

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      {units.map((unit) => (
        <div key={unit.label} className="rounded border bg-bg py-1.5 text-center">
          <p className="text-sm font-semibold text-ink">
            {String(unit.value).padStart(2, "0")}
          </p>
          <p className="text-[10px] text-ink-soft">{unit.label}</p>
        </div>
      ))}
    </div>
  );
}

function FreeShippingBanner() {
  return (
    <section className="flex flex-col items-center justify-between gap-6 rounded-xl border bg-surface p-8 md:flex-row">
      <div>
        <p className="font-display text-4xl text-accent">Free Shipping</p>
        <p className="mt-2 text-base font-medium text-ink">
          All over India on purchases of ₹1,500/- and above.
        </p>
      </div>
      <Button href="/shop">
        <ShoppingCart size={16} />
        Order Now
      </Button>
    </section>
  );
}

function BestSellers({ products }) {
  return (
    <section>
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl text-ink md:text-3xl">Best Sellers</h2>
        <Link
          href="/shop"
          className="flex items-center gap-1 text-sm font-medium text-accent-deep"
        >
          View All <ArrowRight size={14} />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
        {products.map((product) => (
          <BestSellerCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function BestSellerCard({ product }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const wishlisted = isWishlisted(product.slug);
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];

  return (
    <div className="rounded-xl border bg-surface p-4">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="aspect-square overflow-hidden rounded-lg bg-line">
          <Image
            src={product.images[0]}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="mt-3 block text-[11px] uppercase tracking-wide text-ink-soft">
          {product.category}
        </span>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-ink">
          {product.name}
        </p>
      </Link>

      <div className="mt-2">
        <Rating value={product.ratingsAverage} count={product.ratingsCount} />
      </div>
      <p className="mt-2 text-lg font-semibold text-ink">₹{product.basePrice}</p>

      {/* Cart/wishlist now wired to real (localStorage-backed) context —
         Stage 3/4 swaps the provider internals for API calls. */}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={firstAvailable.stock <= 0}
          onClick={() => addToCart(product.slug, firstAvailable.id, 1)}
          className="flex-1 rounded bg-ink py-2 text-xs font-medium text-bg transition-colors duration-150 hover:bg-accent-deep disabled:opacity-40"
        >
          Add to Cart
        </button>
        <Link
          href={`/product/${product.slug}`}
          className="flex flex-1 items-center justify-center rounded bg-accent py-2 text-xs font-medium text-surface transition-colors duration-150 hover:bg-accent-deep"
        >
          Buy Now
        </Link>
        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={() => toggleWishlist(product.slug)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border"
        >
          <Heart
            size={14}
            className={wishlisted ? "text-accent" : "text-ink-soft"}
            fill={wishlisted ? "currentColor" : "none"}
          />
        </button>
        <button
          type="button"
          aria-label="Share"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border text-ink-soft"
        >
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}

function TrustBadges() {
  return (
    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {TRUST_BADGES.map((badge) => (
        <div key={badge.title} className="flex items-center gap-4 rounded-xl bg-surface p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-surface">
            <badge.icon size={22} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{badge.title}</p>
            <p className="text-xs text-ink-soft">{badge.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function ShopByCategory() {
  return (
    <section className="text-center">
      <h2 className="font-display text-2xl text-ink md:text-3xl">Shop by Category</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Browse our wide range of natural, traditional products.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-left lg:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/shop/${cat.slug}`}
            className="group relative block h-64 overflow-hidden rounded-xl"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 flex items-end justify-between text-bg">
              <div>
                <p className="text-base font-semibold">{cat.name}</p>
                <span className="mt-1 inline-block rounded bg-bg/20 px-2 py-1 text-xs backdrop-blur-sm">
                  {cat.itemCount} Items
                </span>
              </div>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-surface transition-colors duration-150 group-hover:bg-bg group-hover:text-accent">
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
