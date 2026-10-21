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
  Phone,
  Mail,
  MapPin,
  Globe,
  Leaf,
  Users,
} from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { fetchStorefrontInitial } from "@/lib/productUtils";
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
    badge: "Brundavanam Goshala • Sacred Sanctuary",
    supertitle: "Traditional Ahimsa Cow Care & Ayurvedic Living",
    title: "Rooted in Tradition. Made for Tomorrow.",
    subtitle:
      "Pure Ayurvedic wellness handcrafted with care for our indigenous Gir cows and your family.",
    tags: ["Ahimsa Care", "Pure A2 Gir Herd", "100% Chemical-Free"],
    buttonText: "Shop Sacred Offerings",
    buttonHref: "/shop",
    secondaryText: "Our Sanctuary",
    secondaryHref: "/about",
    image: "/images/banners/banner_goshala_sanctuary.jpg",
  },
  {
    badge: "Pure Ayurveda • Goodness in Every Drop",
    supertitle: "Amrutha Dhara — అమృత ధార",
    title: "Amrutha Dhara Ayurvedic Drops",
    subtitle:
      "Traditional herbal remedy for cold, headache relief & respiratory soothing. 100% natural.",
    tags: ["Cold & Headache Relief", "100% Chemical-Free", "Pure Cow Ingredients"],
    buttonText: "Shop Amrutha Dhara",
    buttonHref: "/shop",
    secondaryText: "Learn More",
    secondaryHref: "/about",
    image: "/images/banners/banner_amrutha_dhara.jpg",
  },
  {
    badge: "Sacred Purity for Daily Puja",
    supertitle: "Sahaja Kunkuma — సహజ కుంకుమ",
    title: "Sahaja Kunkuma Sacred Kumkum",
    subtitle:
      "Handcrafted natural cow-based sacred kunkuma. Completely free from harmful chemicals & lead.",
    tags: ["100% Cow-Based", "Zero Harsh Chemicals", "Sacred Puja Purity"],
    buttonText: "Shop Sahaja Kunkuma",
    buttonHref: "/shop",
    secondaryText: "Learn More",
    secondaryHref: "/about",
    image: "/images/banners/banner_sahaja_kunkuma.jpg",
  },
  {
    badge: "Universal Pain Relief Oil",
    supertitle: "Gau Dhara — గౌ ధార",
    title: "Gau Dhara Healing Herbal Oil",
    subtitle:
      "Ancient Ayurvedic botanical oil for joint soothing, muscle stiffness & energized mobility.",
    tags: ["Joint & Knee Comfort", "Muscle Relief", "Quick Absorption"],
    buttonText: "Shop Gau Dhara Oil",
    buttonHref: "/shop",
    secondaryText: "Learn More",
    secondaryHref: "/about",
    image: "/images/banners/banner_gau_dhara.jpg",
  },
];

const BROCHURE_VALUES = [
  {
    icon: "🌱",
    title: "Natural Living",
    desc: "Products inspired by nature and traditional wellness practices, completely chemical-free.",
  },
  {
    icon: "🪷",
    title: "Ayurvedic Heritage",
    desc: "Rooted in India's timeless knowledge of holistic well-being and sacred healing scriptures.",
  },
  {
    icon: "🐄",
    title: "Gaumata Care",
    desc: "Supporting the loving protection, nurturing, and lifelong honorable shelter of indigenous cows.",
  },
  {
    icon: "🌍",
    title: "Sustainable Future",
    desc: "Encouraging responsible choices and circular organic harmony for a healthier planet.",
  },
];

const BROCHURE_SIGNATURE_PRODUCTS = [
  {
    id: "sahaja-kunkuma",
    title: "Sahaja Kunkuma",
    teluguTitle: "సహజ కుంకుమ",
    tagline: "Traditional Purity for Everyday Life",
    desc: "A pure and natural kunkuma made from cow-based ingredients. A 100% chemical-free sacred product for daily prayer and divine grace.",
    badge: "100% Chemical Free",
    accent: "from-rose-500/10 to-amber-500/10",
    border: "border-rose-200",
    badgeColor: "bg-rose-100 text-rose-800",
    icon: "🔴",
    image: "/images/sahaja_kunkuma.jpg",
    href: "/shop",
  },
  {
    id: "amrutha-dhara",
    title: "Amrutha Dhara",
    teluguTitle: "అమృత ధార",
    tagline: "Timeless Care in Every Drop",
    desc: "A traditional Ayurvedic preparation for everyday wellness, cold relief, headache soothing, and natural respiratory comfort.",
    badge: "Goodness in Every Drop",
    accent: "from-amber-500/10 to-yellow-500/10",
    border: "border-amber-200",
    badgeColor: "bg-amber-100 text-amber-900",
    icon: "💧",
    image: "/images/amrutha_dhara.jpg",
    href: "/shop",
  },
  {
    id: "gau-dhara",
    title: "Gau Dhara",
    teluguTitle: "గౌ ధార",
    tagline: "Natural Relief for a More Active You",
    desc: "Universal Pain Relief Oil. A natural and traditional formulation for everyday comfort, soothing joints and easing muscle fatigue.",
    badge: "Universal Pain Relief Oil",
    accent: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-800",
    icon: "🌿",
    image: "/images/gau_dhara.jpg",
    href: "/shop",
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
  const [liveDeals, setLiveDeals] = useState([]);
  const [liveCategories, setLiveCategories] = useState([]);
  const [cacheSource, setCacheSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadStorefront() {
      try {
        const initial = await fetchStorefrontInitial(8);
        if (initial?.featuredProducts && initial.featuredProducts.length > 0) {
          setLiveProducts(initial.featuredProducts);
        }
        if (initial?.deals && initial.deals.length > 0) {
          setLiveDeals(initial.deals);
        }
        if (initial?.categories && initial.categories.length > 0) {
          setLiveCategories(initial.categories);
        }
        if (initial?.cacheSource) {
          setCacheSource(initial.cacheSource);
        }
      } catch (err) {
        console.error("Failed to load storefront data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStorefront();
  }, []);

  // Slide carousel auto-advance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const bestSellers = liveProducts.length > 0 ? liveProducts.slice(0, 8) : [];
  const hotProduct = liveDeals.length > 0 ? liveDeals[0] : (liveProducts.length > 0 ? liveProducts[0] : null);
  const displayCategories = liveCategories.length > 0 ? liveCategories : CATEGORIES;

  return (
    <div className="space-y-10 sm:space-y-16 pb-12 sm:pb-16">
      {/* 1. Hero Full-Width Panoramic Banner Showcase */}
      <section className="relative overflow-hidden bg-black text-white border-b border-amber-900/40">
        <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex items-center">
          {/* Full-Width Panoramic Banner Slide Image */}
          <div className="absolute inset-0">
            <img
              src={HERO_SLIDES[currentSlide].image}
              alt={HERO_SLIDES[currentSlide].title}
              className="h-full w-full object-cover object-right md:object-center transition-all duration-700"
            />
            {/* Subtle Directional Gradient: Dark on text side only; product & cows stay 100% visible and un-tinted */}
            <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-r from-black/90 via-black/55 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent sm:hidden pointer-events-none" />
          </div>

          {/* Compact, High-Legibility Text Overlay Container (Leaves remainder of banner uncovered) */}
          <div className="relative mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 w-full">
            <div className="max-w-lg lg:max-w-xl space-y-3 sm:space-y-4 animate-in fade-in duration-500">
              {/* Sacred Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-amber-400/40 bg-black/50 backdrop-blur-md px-3 py-1 text-[11px] sm:text-xs font-bold text-amber-300 shadow-md">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <span className="truncate max-w-[280px] sm:max-w-none">
                  {HERO_SLIDES[currentSlide].badge}
                </span>
              </div>

              {HERO_SLIDES[currentSlide].supertitle && (
                <p className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-amber-400 drop-shadow-sm">
                  {HERO_SLIDES[currentSlide].supertitle}
                </p>
              )}

              {/* Title - Bold, Highly Legible */}
              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold leading-[1.2] text-white tracking-tight drop-shadow-md">
                {HERO_SLIDES[currentSlide].title}
              </h1>

              {/* Subtitle - Short & Crisp */}
              <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-amber-50/95 font-sans max-w-lg drop-shadow-sm line-clamp-3 sm:line-clamp-none">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>

              {/* Pill Badges List - Compact */}
              <div className="flex flex-wrap gap-2 pt-1">
                {HERO_SLIDES[currentSlide].tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-black/50 backdrop-blur-md px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-amber-100 shadow-sm"
                  >
                    <CheckCircle2 size={12} className="text-amber-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3.5 pt-2">
                <Link
                  href={HERO_SLIDES[currentSlide].buttonHref}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-5 py-3 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-bold text-stone-950 shadow-lg shadow-black/50 hover:brightness-110 active:scale-95 transition-all text-center"
                >
                  <ShoppingBag size={16} />
                  <span>{HERO_SLIDES[currentSlide].buttonText}</span>
                  <ArrowRight size={14} />
                </Link>

                <Link
                  href={HERO_SLIDES[currentSlide].secondaryHref || "/about"}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-black/40 backdrop-blur-md px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-amber-100 hover:bg-black/60 hover:text-white transition-all shadow-sm text-center"
                >
                  <span>{HERO_SLIDES[currentSlide].secondaryText || "Our Story"}</span>
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
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-amber-400/30 hover:bg-amber-500 hover:text-stone-950 transition-all shadow-lg backdrop-blur-md"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next Slide"
            onClick={() =>
              setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
            }
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-amber-400/30 hover:bg-amber-500 hover:text-stone-950 transition-all shadow-lg backdrop-blur-md"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? "w-7 sm:w-9 bg-amber-400 shadow-md" : "w-2 sm:w-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Live Goshala Metrics Bar - Refined Warm Subtle Dark */}
        <div className="border-t border-amber-900/40 bg-[#16120d] px-4 py-3.5 sm:px-6 sm:py-4 shadow-inner-xs text-amber-100">
          <div className="mx-auto max-w-content grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-center">
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] sm:bg-transparent">
              <span className="font-display text-lg sm:text-2xl font-bold text-amber-400">100+</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-200/70">Indigenous Gir Cows</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] sm:bg-transparent">
              <span className="font-display text-lg sm:text-2xl font-bold text-amber-400">100% Vedic</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-200/70">Bilona Churned Ghee</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] sm:bg-transparent">
              <span className="font-display text-lg sm:text-2xl font-bold text-amber-400">5000+</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-200/70">Happy Families</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/[0.03] sm:bg-transparent">
              <span className="font-display text-lg sm:text-2xl font-bold text-amber-400">Ahimsa</span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-amber-200/70">Zero Chemicals</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category Showcase - Mobile Horizontal Pill Scroll + Desktop Grid */}
      <section className="mx-auto max-w-content px-4 sm:px-6 md:px-8">
        <div className="flex items-end justify-between gap-2 mb-4 sm:mb-8">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-accent-deep">
              Sacred Offerings
            </span>
            <h2 className="font-display text-xl sm:text-3xl font-bold text-ink mt-0.5">
              Explore by Vedic Category
            </h2>
            <p className="hidden sm:block text-xs text-ink-soft mt-1">
              Carefully crafted products direct from our goshala sanctuary to your home.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-deep transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile Horizontal Pill Scroll + Desktop Grid */}
        <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {displayCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group shrink-0 w-[125px] sm:w-auto relative flex flex-col items-center text-center rounded-2xl border border-line/80 bg-surface p-3 sm:p-5 shadow-2xs hover:-translate-y-1 hover:border-accent hover:shadow-xl transition-all duration-300"
            >
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300 border border-amber-200/50 shadow-2xs">
                <span className="text-2xl sm:text-3xl">🌿</span>
              </div>
              <h3 className="font-display text-xs sm:text-sm font-bold text-ink group-hover:text-accent transition-colors leading-tight line-clamp-2">
                {cat.name}
              </h3>
              <p className="hidden sm:block text-[11px] text-ink-soft mt-1 line-clamp-2">
                {cat.description || "Authentic Vedic Goshala prepared product."}
              </p>
              <span className="mt-1.5 sm:mt-3 text-[10px] font-bold text-accent uppercase tracking-wider group-hover:underline">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Deal Spotlight & Best Sellers Grid */}
      <section className="mx-auto max-w-content px-4 sm:px-6 md:px-8 space-y-8 sm:space-y-12">
        {/* Deal Spotlight Banner */}
        {loading ? (
          <div className="h-64 animate-pulse rounded-2xl sm:rounded-3xl bg-amber-50/50 border border-line" />
        ) : hotProduct ? (
          <WeeklyDealSpotlight product={hotProduct} />
        ) : null}

        {/* Best Sellers Grid */}
        <div>
          <div className="flex items-end justify-between gap-2 mb-4 sm:mb-8">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-accent-deep">
                Top Rated Offerings
              </span>
              <h2 className="font-display text-xl sm:text-3xl font-bold text-ink mt-0.5">
                Goshala Best Sellers
              </h2>
              <p className="hidden sm:block text-xs text-ink-soft mt-1">
                Handpicked sacred products cherished for purity, nutritional vitality, and divine aroma.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-deep transition-colors shrink-0"
            >
              <span>Explore All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-amber-50/50 border border-line" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {bestSellers.map((product) => (
                <ProductCard key={product.slug || product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Brochure Featured Collection: Pure Ayurveda for Everyday Wellness */}
      <section className="mx-auto max-w-content px-4 sm:px-6 md:px-8">
        <div className="rounded-2xl sm:rounded-3xl border border-amber-200/80 bg-gradient-to-br from-[#fffdf9] via-[#fbf7ed] to-[#f5eedc] p-4 sm:p-8 lg:p-10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 sm:mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-amber-200">
                <Sparkles size={12} className="text-amber-600" />
                <span>Pure Ayurveda for Everyday Wellness</span>
              </span>
              <h2 className="font-display text-xl sm:text-3xl font-bold text-ink mt-2">
                Simple. Natural. Meaningful.
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft mt-1">
                Handcrafted formulations derived from cow-based ingredients. Free from harmful chemicals.
              </p>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-block text-xs font-serif italic text-amber-900 font-semibold bg-amber-200/50 px-2.5 py-1 rounded-lg">
                Goodness in Every Drop
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {BROCHURE_SIGNATURE_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className={`group relative flex flex-col justify-between rounded-2xl border ${prod.border} bg-surface p-4 sm:p-5 shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div>
                  {/* Real Product Image Showcase */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white border border-amber-200/80 mb-3 sm:mb-4 shadow-2xs group-hover:border-accent group-hover:shadow-md transition-all">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs ${prod.badgeColor}`}>
                        {prod.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{prod.icon}</span>
                    <h3 className="font-display text-base sm:text-lg font-bold text-ink group-hover:text-accent transition-colors">
                      {prod.title}
                    </h3>
                  </div>
                  <p className="text-xs font-bold text-accent-deep font-sans mb-1">
                    {prod.teluguTitle}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-ink-soft/90 uppercase tracking-wider mb-2">
                    {prod.tagline}
                  </p>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {prod.desc}
                  </p>
                </div>

                <div className="pt-3.5 mt-3 border-t border-line/60">
                  <Link
                    href={prod.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-deep transition-colors"
                  >
                    <span>Discover Offering</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <p className="text-xs font-bold tracking-wide text-amber-950 uppercase">
              Trust Nature. Choose Brundavanam.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-surface hover:bg-accent-deep transition-all shadow-sm w-full sm:w-auto"
            >
              <ShoppingBag size={14} />
              <span>Explore All Ayurvedic Offerings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Brochure Core Values: Care Today for a Brighter Tomorrow */}
      <section className="border-y border-line bg-[#fbf7ed] py-8 sm:py-14">
        <div className="mx-auto max-w-content px-4 sm:px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-accent-deep bg-amber-100/70 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full border border-amber-200">
              <Sparkles size={12} className="text-amber-600" />
              <span>Care Today for a Brighter Tomorrow</span>
            </span>
            <h2 className="font-display text-xl sm:text-3xl font-bold text-ink mt-2 sm:mt-3">
              Our Values & Deeper Purpose
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft mt-1 sm:mt-2 leading-relaxed">
              Brundavanam Goshala is driven by a simple belief — when we care for nature, it cares for us.
            </p>
            <div className="mt-2.5 sm:mt-3 inline-block rounded-xl bg-amber-200/50 px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold tracking-wider text-amber-950 uppercase">
              Goodness for People • Care for Cows • Harmony for the Planet
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {BROCHURE_VALUES.map((val, idx) => (
              <div
                key={idx}
                className="relative rounded-xl sm:rounded-2xl border border-line bg-surface p-3.5 sm:p-6 shadow-xs hover:border-accent hover:shadow-lg transition-all"
              >
                <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 block">{val.icon}</span>
                <h3 className="font-display text-xs sm:text-base font-bold text-ink mb-1 sm:mb-2">
                  {val.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-ink-soft leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Brochure Gratitude Banner: Gratitude to Gaumata - Subtle Warm Dark Theme */}
      <section className="mx-auto max-w-content px-4 sm:px-6 md:px-8">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#231c15] via-[#2a221a] to-[#1c1711] p-4 sm:p-8 lg:p-12 border border-amber-500/30 shadow-xl text-amber-50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full border border-amber-400/40">
                ❤️ Together for a Kinder Tomorrow
              </span>
              <h2 className="font-display text-xl sm:text-3xl lg:text-4xl font-bold leading-tight text-white">
                Gratitude to Gaumata for a Healthier, Happier Tomorrow.
              </h2>
              <p className="font-serif italic text-sm sm:text-base text-amber-300 font-semibold">
                Small choices. A bigger tomorrow.
              </p>
              <p className="text-xs sm:text-sm text-[#ded4be] leading-relaxed">
                Every mindful choice creates a brighter world. When you choose Brundavanam Goshala, you bring authentic Ayurvedic goodness into your family while nurturing and honoring indigenous desi cows in our sacred sanctuary.
              </p>

              {/* Contacts Card - Subtle Translucent Dark Glass */}
              <div className="rounded-xl sm:rounded-2xl border border-amber-500/20 bg-white/5 backdrop-blur-md p-3.5 sm:p-5 shadow-inner-xs space-y-2.5 sm:space-y-3">
                <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px] sm:text-[11px]">
                  Let&apos;s Stay Connected:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs text-amber-100 font-medium">
                  <a href="tel:+919492602499" className="flex items-center gap-2 hover:text-amber-300 transition-colors">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Phone size={12} />
                    </span>
                    <span>+91 94926 02499</span>
                  </a>
                  <a href="mailto:brundavanamgaushala@gmail.com" className="flex items-center gap-2 hover:text-amber-300 transition-colors truncate">
                    <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Mail size={12} />
                    </span>
                    <span className="truncate">brundavanamgaushala@gmail.com</span>
                  </a>
                  <div className="flex items-center gap-2 truncate">
                    <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Globe size={12} />
                    </div>
                    <span className="truncate">www.brundavanamgoshala.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <MapPin size={12} />
                    </div>
                    <span>Brundavanam Goshala, India</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-1">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-5 py-3 sm:px-6 sm:py-3.5 text-xs font-bold text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-950/40 text-center w-full sm:w-auto"
                >
                  <ShoppingBag size={15} />
                  <span>Support via Purchases</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-white/10 px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-semibold text-amber-100 hover:bg-white/20 hover:text-white transition-all shadow-xs backdrop-blur-xs text-center w-full sm:w-auto"
                >
                  <span>Read Our Mission & Values</span>
                </Link>
              </div>
            </div>

            {/* Right Column: 100% Fully Visible Banner Photograph */}
            <div className="lg:col-span-5 relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-stone-900">
              <img
                src="/images/brochure/sacred_gaumata_gratitude.jpg"
                alt="Sacred Gaumata at Brundavanam Goshala"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Real Customer Testimonials */}
      <section className="mx-auto max-w-content px-4 sm:px-6 md:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-accent-deep">
            Blessed Feedback
          </span>
          <h2 className="font-display text-xl sm:text-3xl font-bold text-ink mt-0.5 sm:mt-1">
            Loved by Thousands of Households
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="rounded-xl sm:rounded-2xl border border-line bg-surface p-4 sm:p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-2 sm:mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-xs text-ink-soft leading-relaxed italic mb-3 sm:mb-4">
                  "{t.text}"
                </p>
              </div>
              <div className="pt-3 border-t border-line/60">
                <p className="text-xs font-bold text-ink">{t.name}</p>
                <p className="text-[11px] text-ink-soft">{t.city} • Verified Devotee</p>
                <span className="inline-block mt-0.5 text-[10px] font-semibold text-accent-deep">
                  Verified: {t.product}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Trust & Confidence Guarantees */}
      <section className="mx-auto max-w-content px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-line bg-surface p-4 sm:p-8 shadow-xs">
          {TRUST_BADGES.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div key={idx} className="flex items-start gap-3 p-1.5 sm:p-2">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-100/70 text-accent-deep">
                  <Icon size={18} />
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
          variantId: product.variants?.[0]?.isFallback ? null : (product.variants?.[0]?.id || null),
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
    <div className="rounded-2xl sm:rounded-3xl border border-line bg-gradient-to-br from-[#fffdf8] to-[#fbf7ed] p-4 sm:p-6 lg:p-8 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left: Product Image */}
        <div className="lg:col-span-5 relative aspect-square max-w-[280px] sm:max-w-none mx-auto sm:mx-0 w-full rounded-2xl overflow-hidden bg-white border border-line/80 shadow-inner-xs">
          <img
            src={product.images?.[0] || "https://placehold.co/600x600?text=Brundavanam+Deal"}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <Flame size={13} className="fill-white" />
            <span>SPECIAL SPOTLIGHT DEAL</span>
          </div>
        </div>

        {/* Right: Deal Details, Compare Price & Timer */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-accent-deep bg-amber-100/60 px-2.5 py-0.5 rounded-md">
              Limited Harvest Batch
            </span>
            <span className="text-[11px] sm:text-xs text-ink-soft">• In Stock & Ready to Ship</span>
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-ink hover:text-accent transition-colors">
              {product.name}
            </h2>
          </Link>

          <p className="text-xs text-ink-soft leading-relaxed max-w-xl">
            {product.shortDescription ||
              "Handcrafted using authentic Bilona wooden bi-directional churning of whole A2 curd. Free from preservatives, artificial colors, or chemicals."}
          </p>

          {/* Price Row with Compare Price Strikethrough & Savings Badge */}
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pt-0.5 sm:pt-1">
            <span className="text-2xl sm:text-3xl font-black text-ink">
              ₹{sellingPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-sm sm:text-base text-ink-soft/70 line-through">
                ₹{comparePrice.toLocaleString("en-IN")}
              </span>
            )}
            {hasDiscount && savings > 0 && (
              <span className="rounded-xl bg-emerald-100 text-emerald-800 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-extrabold">
                Save ₹{savings.toLocaleString("en-IN")} ({discountPercent}% OFF)
              </span>
            )}
          </div>

          {/* Countdown Clock */}
          <div className="pt-1 sm:pt-2">
            <p className="text-xs font-bold text-ink mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-accent" />
              <span>Offer Valid For This Batch:</span>
            </p>
            <CountdownTimer />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 sm:pt-3">
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-xs sm:text-sm font-bold text-surface shadow-md shadow-accent/20 hover:bg-accent-deep active:scale-95 transition-all text-center w-full sm:w-auto"
            >
              <ShoppingBag size={16} />
              <span>{added ? "Added to Cart ✓" : "Add to Cart Now"}</span>
            </button>
            <Link
              href={`/product/${product.slug}`}
              className="rounded-xl border border-line bg-surface px-5 py-3 text-xs sm:text-sm font-semibold text-ink hover:bg-bg transition-colors text-center w-full sm:w-auto"
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
