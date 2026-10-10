import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Globe,
  Users,
  Leaf,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "About Us | Brundavanam Goshala",
  description:
    "Rooted in Tradition. Made for a Kinder Tomorrow. Brundavanam Goshala brings pure Ayurvedic, cow-based wellness to modern lives while protecting and nurturing Gaumata.",
};

const BROCHURE_VALUES = [
  {
    icon: "🌱",
    title: "Natural Living",
    tagline: "Inspired by Nature",
    desc: "Products inspired by nature and traditional wellness practices, handcrafted without artificial additives or toxic synthetic chemicals.",
  },
  {
    icon: "🪷",
    title: "Ayurvedic Heritage",
    tagline: "India's Timeless Knowledge",
    desc: "Rooted in India's timeless knowledge of holistic well-being, preserving sacred Vedic formulations passed down through generations.",
  },
  {
    icon: "🐄",
    title: "Gaumata Care",
    tagline: "Sacred Protection & Nurturing",
    desc: "Supporting the lifelong care, protection, and nurturing of cows in an ahimsa sanctuary where every mother and calf lives with love.",
  },
  {
    icon: "🌍",
    title: "Sustainable Future",
    tagline: "Responsible Harmony",
    desc: "Encouraging responsible choices for a healthier planet through regenerative, zero-waste, cow-based organic harmony.",
  },
];

const SIGNATURE_PRODUCTS = [
  {
    title: "Sahaja Kunkuma",
    teluguTitle: "సహజ కుంకుమ",
    tagline: "Traditional Purity for Everyday Life",
    desc: "A pure and natural kunkuma made from cow-based ingredients. A completely chemical-free sacred product for daily puja and auspicious wellness.",
    badge: "100% Chemical Free",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    icon: "🔴",
  },
  {
    title: "Amrutha Dhara",
    teluguTitle: "అమృత ధార",
    tagline: "Timeless Care in Every Drop",
    desc: "A traditional Ayurvedic preparation for everyday wellness. Formulated with soothing herbs to support clear breathing, head comfort, and natural vitality.",
    badge: "Goodness in Every Drop",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    icon: "💧",
  },
  {
    title: "Gau Dhara",
    teluguTitle: "గౌ ధార",
    tagline: "Natural Relief for a More Active You",
    desc: "Universal Pain Relief Oil. A natural and traditional formulation for everyday comfort, soothing joints, easing muscle fatigue, and revitalizing movement.",
    badge: "Universal Pain Relief Oil",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: "🌿",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Header Banner - Subtle Warm Dark Theme */}
      <section className="relative overflow-hidden bg-[#1d1711] text-amber-50 py-16 md:py-20 border-b border-amber-900/40">
        {/* Background Overlay with Warm Subtle Dark Lighting */}
        <div className="absolute inset-0">
          <Image
            src="/images/brochure/hero_gaumata_calf.jpg"
            alt="Brundavanam Goshala Gaumata and Calf"
            fill
            priority
            className="object-cover object-right md:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#18130e]/95 via-[#201811]/85 sm:via-[#201811]/70 md:via-[#201811]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18130e]/80 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-content px-6 md:px-8">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-4 py-1.5 text-xs font-bold text-amber-300 shadow-xs backdrop-blur-xs">
              <Sparkles size={14} className="text-amber-400" />
              <span>TRADITIONAL • AYURVEDIC • NATURAL • SUSTAINABLE</span>
            </div>

            <p className="text-xs uppercase tracking-widest font-extrabold text-amber-400">
              Brundavanam Goshala — Nature&apos;s Essence, A Brighter Tomorrow
            </p>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.12] text-white tracking-tight drop-shadow-xs">
              Rooted in Tradition. <br />
              <span className="text-amber-400">Made for a Kinder Tomorrow.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#ded4be] leading-relaxed max-w-2xl font-sans">
              Natural. Thoughtful. Meaningful. Brundavanam Goshala is more than a brand — it is a heartfelt initiative to promote holistic wellness and a sustainable future through the sacred bond with Gaumata.
            </p>

            {/* Holy Quote Callout */}
            <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-500/15 p-5 text-sm sm:text-base italic font-serif text-amber-200 max-w-2xl shadow-xs backdrop-blur-xs">
              &ldquo;When we care for Gaumata, we care for a healthier, kinder world.&rdquo;
            </div>

            {/* The 4 Core Brochure Pillars */}
            <div className="pt-2">
              <p className="text-[11px] uppercase tracking-wider font-bold text-amber-300 mb-3">
                Our Four Core Commitments:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                {[
                  { label: "PEOPLE", desc: "Holistic Health", icon: "🌱" },
                  { label: "COWS", desc: "Ahimsa Protection", icon: "🐄" },
                  { label: "PLANET", desc: "Eco Harmony", icon: "🌍" },
                  { label: "TOGETHER", desc: "A Kinder Tomorrow", icon: "🤝" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-amber-400/25 bg-white/10 shadow-xs text-center backdrop-blur-xs"
                  >
                    <span className="text-xl mb-1">{item.icon}</span>
                    <span className="text-xs font-black tracking-widest text-white">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-amber-200/80 font-medium mt-0.5">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                href="/shop"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-stone-950 shadow-lg shadow-amber-950/40 hover:brightness-110 active:scale-95 transition-all"
              >
                <ShoppingBag size={16} />
                <span>Shop Sacred Offerings</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-white/10 px-5 py-3.5 text-xs sm:text-sm font-bold text-amber-100 hover:bg-white/20 hover:text-white transition-all shadow-xs backdrop-blur-xs"
              >
                <span>Connect With Our Goshala</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Our Story: A Deeper Purpose */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Text narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent-deep bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200">
                Our Story
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3">
                A Deeper Purpose
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-ink-soft leading-relaxed">
              <p className="font-medium text-ink">
                Brundavanam Goshala is more than a brand — it is a heartfelt initiative to promote holistic wellness and a sustainable future through the sacred bond with Gaumata.
              </p>
              <p>
                We bring the timeless wisdom of Ayurveda to modern lives with pure, natural products derived from cow-based ingredients, while supporting the care, protection, and well-being of cows.
              </p>
              <p>
                Our journey is driven by a simple belief —{" "}
                <strong className="text-ink font-semibold">when we care for nature, it cares for us.</strong>
              </p>
            </div>

            {/* Stylized Brochure Quote Box */}
            <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 shadow-2xs">
              <p className="font-serif italic text-xl sm:text-2xl text-amber-950 font-bold">
                &ldquo;Care Today for a Brighter Tomorrow&rdquo;
              </p>
              <p className="text-xs text-amber-900/80 mt-2 font-medium">
                Every drop of ghee, every pinch of kunkuma, and every Ayurvedic remedy at Brundavanam honors our ancient lineage of reverence and ahimsa.
              </p>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="lg:col-span-5 relative aspect-[4/3] rounded-3xl overflow-hidden border border-line shadow-lg bg-line">
            <Image
              src="/images/brochure/pastoral_sanctuary_sunset.jpg"
              alt="Brundavanam Goshala Sanctuary Landscape"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3. Our Values: The Four Pillars */}
      <section className="border-y border-line bg-[#fbf7ed] py-16">
        <div className="mx-auto max-w-content px-6 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-deep bg-amber-100/70 px-3.5 py-1 rounded-full border border-amber-200">
              <Sparkles size={12} className="text-amber-600" />
              <span>Timeless Principles</span>
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3">
              Our Values
            </h2>
            <div className="mt-3 inline-block rounded-xl bg-amber-200/60 px-5 py-2 text-xs sm:text-sm font-bold tracking-wider text-amber-950 uppercase shadow-2xs">
              Goodness for People • Care for Cows • Harmony for the Planet
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BROCHURE_VALUES.map((val, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-amber-200/70 bg-surface p-7 shadow-xs hover:border-accent hover:shadow-xl transition-all group flex flex-col justify-between"
              >
                <div>
                  <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">
                    {val.icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-deep block mb-1">
                    {val.tagline}
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink mb-2">
                    {val.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Our Products Philosophy: Pure Ayurveda for Everyday Wellness */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-[#fffdf8] via-[#fbf7ed] to-[#f4ecd8] p-8 md:p-12 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-3 py-1 rounded-full border border-amber-200">
                  <span>Our Products</span>
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-3">
                  Pure Ayurveda for Everyday Wellness
                </h2>
                <p className="font-serif italic text-base text-amber-900 font-semibold mt-1">
                  Simple. Natural. Meaningful. Goodness in Every Drop.
                </p>
              </div>

              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                Every formulation in our collection is crafted with ancient Ayurvedic principles using cow-based ingredients. Free from chemical fragrances, parabens, artificial dyes, and toxic petroleum derivatives.
              </p>

              {/* Signature Products Breakdown */}
              <div className="space-y-4 pt-2">
                {SIGNATURE_PRODUCTS.map((prod, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-amber-200/80 bg-white/80 p-4 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{prod.icon}</span>
                        <h3 className="font-display text-sm font-bold text-ink">
                          {prod.title}{" "}
                          <span className="text-xs font-bold text-accent-deep font-sans">
                            ({prod.teluguTitle})
                          </span>
                        </h3>
                      </div>
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${prod.badgeClass}`}>
                        {prod.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-amber-950 uppercase tracking-wide">
                      {prod.tagline}
                    </p>
                    <p className="text-xs text-ink-soft leading-relaxed">
                      {prod.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-xs font-black uppercase tracking-wider text-amber-950">
                  Trust Nature. Choose Brundavanam.
                </p>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-6 relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden border border-amber-200 shadow-xl bg-white">
              <Image
                src="/images/brochure/ayurvedic_products_trio.jpg"
                alt="Brundavanam Ayurvedic Products: Sahaja Kunkuma, Amrutha Dhara, Gau Dhara"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Together for a Kinder Tomorrow & Connection Center - Subtle Warm Dark Theme */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#231c15] via-[#2a221a] to-[#1c1711] p-6 sm:p-10 lg:p-12 border border-amber-500/30 shadow-xl text-amber-50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-400/40">
                ❤️ Together for a Kinder Tomorrow
              </span>

              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight text-white">
                Gratitude to Gaumata for a Healthier, Happier Tomorrow.
              </h2>

              <p className="font-serif italic text-lg sm:text-xl text-amber-300 font-semibold">
                Small choices. A bigger tomorrow.
              </p>

              <p className="text-xs sm:text-sm text-[#ded4be] leading-relaxed">
                Every offering you bring home from Brundavanam Goshala creates a ripples of blessings — nourishing your family with pure Ayurvedic care while providing lifetime fodder, medical treatment, and dignified shelter for our sacred indigenous herd.
              </p>

              {/* Contact Information Bar - Subtle Translucent Dark Glass */}
              <div className="rounded-2xl border border-amber-500/20 bg-white/5 backdrop-blur-md p-5 shadow-inner-xs space-y-3">
                <h3 className="font-bold text-amber-300 uppercase tracking-wider text-xs">
                  Let&apos;s Stay Connected:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-100 font-medium">
                  <a
                    href="tel:+919492602499"
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-amber-300 transition-all border border-amber-500/20"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Phone size={13} />
                    </span>
                    <span className="flex flex-col">
                      <span className="block text-[10px] text-amber-300/80 font-bold">Direct Phone</span>
                      <span className="font-bold text-white">+91 94926 02499</span>
                    </span>
                  </a>

                  <a
                    href="mailto:gokarni@yahoo.com"
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-amber-300 transition-all border border-amber-500/20"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Mail size={13} />
                    </span>
                    <span className="flex flex-col">
                      <span className="block text-[10px] text-amber-300/80 font-bold">Official Email</span>
                      <span className="font-bold text-white">gokarni@yahoo.com</span>
                    </span>
                  </a>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-amber-500/20">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Globe size={13} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-amber-300/80 font-bold">Online Portal</span>
                      <span className="font-bold text-white">www.brundavanamgoshala.com</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-amber-500/20">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <MapPin size={13} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-amber-300/80 font-bold">Sanctuary</span>
                      <span className="font-bold text-white">Brundavanam Goshala, India</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3.5 text-xs font-bold text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-950/40"
                >
                  <ShoppingBag size={15} />
                  <span>Shop Pure Goshala Products</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-white/10 px-5 py-3.5 text-xs font-bold text-amber-100 hover:bg-white/20 hover:text-white transition-all shadow-xs backdrop-blur-xs"
                >
                  <span>Send Us an Enquiry</span>
                </Link>
              </div>
            </div>

            {/* Right Column: 100% Fully Visible Banner Photograph */}
            <div className="lg:col-span-5 relative aspect-square sm:aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-stone-900">
              <Image
                src="/images/brochure/sacred_gaumata_gratitude.jpg"
                alt="Gratitude to Gaumata"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
