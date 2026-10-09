"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Heart,
  Star,
  Clock,
} from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { fetchStorefrontProducts } from "@/lib/productUtils";
import { CATEGORIES } from "@/lib/mockCategories";
import { useDispatch, addToCart, triggerToast } from "@/lib/redux/store";

const TRUST_BADGES = [
  {
    icon: Truck,
    title: "All-India Fast Shipping",
    text: "Free delivery on orders above ₹1,500",
  },
  {
    icon: ShieldCheck,
    title: "100% Lab Tested & Certified",
    text: "Zero adulteration, pure A2 Gir cow milk",
  },
  {
    icon: Award,
    title: "Traditional Bilona Method",
    text: "Churned bi-directionally in clay pots",
  },
  {
    icon: Headphones,
    title: "Dedicated Goshala Support",
    text: "Direct assistance on call & WhatsApp",
  },
];

const HERO_SLIDES = [
  {
    badge: "100% Traditional Vedic Bilona Churned",
    title: "Pure A2 Desi Gir Cow Ghee",
    subtitle:
      "Crafted using ancient curd-churning methods in clay pots over slow cow-dung fire. Golden, aromatic, and rich in natural nutrients.",
    tags: ["Ahimsa Care", "Handmade at Dawn", "Glass Jar Packing"],
    buttonText: "Shop Pure A2 Ghee",
    buttonHref: "/shop",
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1600&q=80",
  },
  {
    badge: "Sacred Aromatherapy & Temple Purity",
    title: "Natural Cow Dung Dhoop & Incense",
    subtitle:
      "Purify your home and puja mandir with charcoal-free dhoop cups made with pure desi cow dung, loban, camphor, and sacred ayurvedic herbs.",
    tags: ["100% Natural", "Air Purifying", "Charcoal Free"],
    buttonText: "Explore Puja Collection",
    buttonHref: "/shop",
    image: "https://images.unsplash.com/photo-1609743522653-52354461eb27?w=1600&q=80",
  },
  {
    badge: "Sanctuary for 500+ Indigenous Cows",
    title: "Sacred Goshala Heritage & Seva",
    subtitle:
      "Every purchase directly supports the nutrition, healthcare, and lifelong shelter of abandoned and aging desi cows in our sanctuary.",
    tags: ["500+ Cows Protected", "Natural Green Fodder", "Ahimsa Milk"],
    buttonText: "Discover Our Mission",
    buttonHref: "/goshala",
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=1600&q=80",
  },
];

const BILONA_STEPS = [
  {
    step: "01",
    title: "Ahimsa Milking",
    desc: "Calves drink their fill first. Fresh milk is gathered with love from healthy, naturally grazing desi Gir cows.",
  },
  {
    step: "02",
    title: "Clay Pot Fermentation",
    desc: "Milk is boiled gently on cow dung cake embers and naturally cultured overnight into thick probiotics-rich curd.",
  },
  {
    step: "03",
    title: "Wooden Bilona Churning",
    desc: "Churned bi-directionally before sunrise using wooden churners to separate pure Makkhan (cultured butter).",
  },
  {
    step: "04",
    title: "Slow Low-Flame Clarification",
    desc: "Butter is melted slowly with sacred herbs until water evaporates, yielding luminous granular golden ghee.",
  },
];

const TESTIMONIALS = [
  {
    name: "Dr. Radhika Sharma",
    city: "Hyderabad",
    rating: 5,
    text: "The aroma of Brundavanam A2 Ghee takes me back to my grandmother's home. The distinct granular texture and pure yellow color prove its authentic bilona preparation.",
    product: "Pure A2 Gir Cow Ghee (Bilona)",
  },
  {
    name: "Suresh Narayanan",
    city: "Bengaluru",
    rating: 5,
    text: "We use their cow dung dhoop cups daily for our sandhya puja. It burns completely without soot or toxic smell, filling the house with a peaceful, divine presence.",
    product: "Organic Herbal Gau Dhoop",
  },
  {
    name: "Ananya Deshmukh",
    city: "Mumbai",
    rating: 5,
    text: "Knowing that every jar of ghee supports an ahimsa goshala where cows are never sold or harmed makes every meal a blessing. Exceptional packaging and quality.",
    product: "Cultured A2 Desi Ghee",
  },
];

export default function HomePage() {
  const [liveProducts, setLiveProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadProducts() {
      try {
        const items = await fetchStorefrontProducts();
        if (items && items.length > 0) {
          setLiveProducts(items);
        }
      } catch (err) {
        console.error("Failed to fetch live products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // Slide carousel auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const bestSellers = liveProducts.length > 0 ? liveProducts.slice(0, 8) : [];
  const hotProduct = liveProducts.length > 0 ? liveProducts[0] : null;

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Promotional Showcase Banner */}
      <section className="relative overflow-hidden bg-[#1f1911] text-[#faf3e0]">
        <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center">
          {/* Background Slide Image with Layered Gradient */}
          <div className="absolute inset-0">
            <img
              src={HERO_SLIDES[currentSlide].image}
              alt="Brundavanam Goshala"
              className="h-full w-full object-cover opacity-35 transition-all duration-1000 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#17120a] via-[#17120a]/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17120a] via-transparent to-black/20" />
          </div>

          {/* Hero Content Container */}
          <div className="relative mx-auto max-w-content px-6 py-12 md:px-8 md:py-16 w-full">
            <div className="max-w-2xl space-y-5 animate-in fade-in slide-in-from-left duration-700">
              {/* Sacred Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-xs font-bold text-amber-300 backdrop-blur-xs">
                <Sparkles size={14} className="text-amber-400" />
                <span>{HERO_SLIDES[currentSlide].badge}</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-[#faf3e0] tracking-tight">
                {HERO_SLIDES[currentSlide].title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base leading-relaxed text-[#ded4be] font-sans max-w-xl">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>

              {/* Badges List */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {HERO_SLIDES[currentSlide].tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-[#faf3e0] backdrop-blur-xs"
                  >
                    <CheckCircle2 size={13} className="text-amber-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link
                  href={HERO_SLIDES[currentSlide].buttonHref}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-950 shadow-lg shadow-amber-900/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <ShoppingBag size={17} />
                  <span>{HERO_SLIDES[currentSlide].buttonText}</span>
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/goshala"
                  className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-5 py-3.5 text-xs sm:text-sm font-semibold text-[#faf3e0] hover:bg-white/15 transition-all backdrop-blur-xs"
                >
                  <span>Our Heritage & Cows</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            type="button"
            aria-label="Previous Slide"
            onClick={() =>
              setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-amber-600 transition-all backdrop-blur-xs"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next Slide"
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white hover:bg-amber-600 transition-all backdrop-blur-xs"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-8 bg-amber-400" : "w-2.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Live Goshala Metrics Bar */}
        <div className="border-t border-amber-900/40 bg-[#16120b] px-6 py-4">
          <div className="mx-auto max-w-content grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-xl sm:text-2xl font-bold text-amber-400">500+</span>
              <span className="text-[11px] uppercase tracking-wider text-[#ded4be]">Indigenous Gir Cows Protected</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-xl sm:text-2xl font-bold text-amber-400">100% Vedic</span>
              <span className="text-[11px] uppercase tracking-wider text-[#ded4be]">Bilona Wooden Churned</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-xl sm:text-2xl font-bold text-amber-400">15,000+</span>
              <span className="text-[11px] uppercase tracking-wider text-[#ded4be]">Happy Devotees & Families</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="font-display text-xl sm:text-2xl font-bold text-amber-400">Ahimsa Certified</span>
              <span className="text-[11px] uppercase tracking-wider text-[#ded4be]">Zero Chemical Adulteration</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category Showcase */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent-deep">
              Sacred Offerings
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              Explore by Vedic Category
            </h2>
            <p className="text-xs text-ink-soft mt-1">
              Carefully crafted products direct from our goshala sanctuary to your home.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-deep transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative flex flex-col items-center text-center rounded-2xl border border-line/80 bg-surface p-5 shadow-2xs hover:-translate-y-1.5 hover:border-accent hover:shadow-xl transition-all duration-300"
            >
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 border border-amber-200/50">
                <span className="text-3xl">🌿</span>
              </div>
              <h3 className="font-display text-sm font-bold text-ink group-hover:text-accent transition-colors leading-tight">
                {cat.name}
              </h3>
              <p className="text-[11px] text-ink-soft mt-1 line-clamp-2">
                {cat.description || "Authentic Vedic Goshala prepared product."}
              </p>
              <span className="mt-3 text-[10px] font-bold text-accent uppercase tracking-wider group-hover:underline">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Deal Spotlight & Best Sellers Grid */}
      <section className="mx-auto max-w-content px-6 md:px-8 space-y-12">
        {/* Deal Spotlight Banner */}
        {loading ? (
          <div className="h-64 animate-pulse rounded-3xl bg-amber-50/50 border border-line" />
        ) : hotProduct ? (
          <WeeklyDealSpotlight product={hotProduct} />
        ) : null}

        {/* Best Sellers Grid */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent-deep">
                Top Rated Offerings
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">
                Goshala Best Sellers
              </h2>
              <p className="text-xs text-ink-soft mt-1">
                Handpicked sacred products cherished for purity, nutritional vitality, and divine aroma.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-deep transition-colors"
            >
              <span>Explore Full Store</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-amber-50/50 border border-line" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.slug || product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. The 5 Steps of Vedic Purity (Bilona Method) */}
      <section className="border-y border-line bg-[#fbf7ed] py-14">
        <div className="mx-auto max-w-content px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-deep bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200">
              <Sparkles size={12} className="text-amber-600" />
              <span>Ancient Vedic Wisdom</span>
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-3">
              The Sacred 4-Step Bilona Method
            </h2>
            <p className="text-xs text-ink-soft mt-2 leading-relaxed">
              Unlike commercial ghee made by separating cream with high-speed centrifuges, our A2 ghee is prepared following the authentic 5,000-year-old Vedic churning process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BILONA_STEPS.map((step) => (
              <div
                key={step.step}
                className="relative rounded-2xl border border-line bg-surface p-6 shadow-xs hover:border-accent hover:shadow-lg transition-all"
              >
                <span className="font-display text-4xl font-extrabold text-amber-200/80 block mb-2">
                  {step.step}
                </span>
                <h3 className="font-display text-base font-bold text-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Goshala Mission Banner */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#1c1813] text-[#faf3e0] p-8 md:p-14">
          <div className="relative z-10 max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
              ❤️ Gau Mata Seva & Protection
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight">
              A Sacred Sanctuary Built on Love, Never Exploitation
            </h2>
            <p className="text-xs sm:text-sm text-[#ded4be] leading-relaxed">
              At Brundavanam Goshala, cows live out their natural lives in peace and honor. Male calves and non-milking aging cows receive equal love, medical attention, and nourishing organic fodder.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/goshala"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs font-bold text-surface hover:bg-accent-deep transition-all shadow-md"
              >
                <span>Read Our Goshala Story</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-xs font-semibold hover:bg-white/10 transition-all"
              >
                <span>Support via Purchases</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Real Customer Testimonials */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-deep">
            Blessed Feedback
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">
            Loved by Thousands of Households
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-line bg-surface p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={15} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-ink-soft leading-relaxed italic mb-4">
                  "{t.text}"
                </p>
              </div>
              <div className="pt-3 border-t border-line/60">
                <p className="text-xs font-bold text-ink">{t.name}</p>
                <p className="text-[11px] text-ink-soft">{t.city} • Verified Devotee</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-accent-deep">
                  Verified: {t.product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Trust & Confidence Guarantees */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
          {TRUST_BADGES.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5 p-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100/70 text-accent-deep">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-ink">{b.title}</h3>
                  <p className="text-[11px] text-ink-soft mt-0.5 leading-snug">{b.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * Dedicated Weekly Deal Spotlight Card with live timer, compare price, and instant add-to-cart
 */
function WeeklyDealSpotlight({ product }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const sellingPrice = product.price || product.basePrice || 0;
  const comparePrice = product.compareAtPrice || product.originalPrice || null;
  const hasDiscount = Boolean(comparePrice && comparePrice > sellingPrice);
  const discountPercent =
    product.discountPercent || (hasDiscount ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100) : null);
  const savings = hasDiscount ? comparePrice - sellingPrice : 0;

  const handleAdd = async () => {
    try {
      await dispatch(
        addToCart({
          product,
          variantId: product.variants?.[0]?.id || null,
          quantity: 1,
        })
      );
      setAdded(true);
      dispatch(triggerToast(`Added '${product.name}' to cart!`, "success"));
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      dispatch(triggerToast("Failed to add to cart", "error"));
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-gradient-to-br from-[#fffdf8] to-[#fbf7ed] p-6 sm:p-8 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Product Image */}
        <div className="lg:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-white border border-line/80 shadow-inner-xs">
          <img
            src={product.images?.[0] || "https://placehold.co/600x600?text=Brundavanam+Deal"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Flame size={13} className="fill-white" />
            <span>SPECIAL SPOTLIGHT DEAL</span>
          </div>
        </div>

        {/* Right: Deal Details, Compare Price & Timer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-deep bg-amber-100/60 px-2.5 py-0.5 rounded-md">
              Limited Harvest Batch
            </span>
            <span className="text-xs text-ink-soft">• In Stock & Ready to Ship</span>
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink hover:text-accent transition-colors">
              {product.name}
            </h2>
          </Link>

          <p className="text-xs text-ink-soft leading-relaxed max-w-xl">
            {product.shortDescription ||
              "Handcrafted using authentic Bilona wooden bi-directional churning of whole A2 curd. Free from preservatives, artificial colors, or chemicals."}
          </p>

          {/* Price Row with Compare Price Strikethrough & Savings Badge */}
          <div className="flex flex-wrap items-baseline gap-3 pt-1">
            <span className="text-3xl font-black text-ink">
              ₹{sellingPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-base text-ink-soft/70 line-through">
                ₹{comparePrice.toLocaleString("en-IN")}
              </span>
            )}
            {hasDiscount && savings > 0 && (
              <span className="rounded-xl bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-extrabold">
                Save ₹{savings.toLocaleString("en-IN")} ({discountPercent}% OFF)
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          <div className="pt-2">
            <p className="text-xs font-bold text-ink mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-accent" />
              <span>Offer Valid For This Batch:</span>
            </p>
            <CountdownTimer />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs sm:text-sm font-bold text-surface shadow-md shadow-accent/20 hover:bg-accent-deep active:scale-95 transition-all"
            >
              <ShoppingBag size={16} />
              <span>{added ? "Added to Cart ✓" : "Add to Cart Now"}</span>
            </button>
            <Link
              href={`/product/${product.slug}`}
              className="rounded-xl border border-line bg-surface px-5 py-3 text-xs sm:text-sm font-semibold text-ink hover:bg-bg transition-colors"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [target] = useState(() => Date.now() + 48 * 60 * 60 * 1000);
  const [remaining, setRemaining] = useState(target - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl border border-line bg-surface px-3 py-1.5 text-center min-w-[54px] shadow-2xs">
        <span className="block text-sm font-extrabold text-ink font-mono">{String(hours).padStart(2, "0")}</span>
        <span className="block text-[9px] uppercase tracking-wider text-ink-soft">Hours</span>
      </div>
      <span className="font-bold text-ink-soft">:</span>
      <div className="rounded-xl border border-line bg-surface px-3 py-1.5 text-center min-w-[54px] shadow-2xs">
        <span className="block text-sm font-extrabold text-ink font-mono">{String(minutes).padStart(2, "0")}</span>
        <span className="block text-[9px] uppercase tracking-wider text-ink-soft">Mins</span>
      </div>
      <span className="font-bold text-ink-soft">:</span>
      <div className="rounded-xl border border-line bg-surface px-3 py-1.5 text-center min-w-[54px] shadow-2xs">
        <span className="block text-sm font-extrabold text-ink font-mono">{String(seconds).padStart(2, "0")}</span>
        <span className="block text-[9px] uppercase tracking-wider text-ink-soft">Secs</span>
      </div>
    </div>
  );
}
