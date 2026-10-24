import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Heart,
  Sun,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Globe,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  Leaf,
  Users,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Brundavanam Goshala | Sacred Sanctuary for Gaumata",
  description:
    "Rooted in Tradition. Made for a Kinder Tomorrow. Discover life at Brundavanam Goshala — Organic milking, open pasture grazing, lifetime sanctuary, and sacred Ayurvedic care.",
};

const SANCTUARY_PILLARS = [
  {
    tag: "PEOPLE",
    title: "Goodness for People",
    desc: "Nourishing families with pure, unadulterated A2 Gir cow ghee and sacred Ayurvedic wellness crafted without synthetic chemicals or artificial preservatives.",
    icon: "🥛",
    color: "from-amber-500/10 to-amber-600/10 border-amber-300",
  },
  {
    tag: "COWS",
    title: "Care for Gaumata",
    desc: "A strictly non-violent sanctuary where calves nurse first, cows graze freely, and every animal receives lifetime love, medical care, and zero slaughter protection.",
    icon: "🐄",
    color: "from-emerald-500/10 to-teal-600/10 border-emerald-300",
  },
  {
    tag: "PLANET",
    title: "Harmony with Nature",
    desc: "Regenerative soil revitalisation through sacred Gomaye (organic manure) and Gomutra, restoring soil microbial vitality without chemical fertilizers or pesticides.",
    icon: "🌱",
    color: "from-lime-500/10 to-emerald-600/10 border-lime-300",
  },
  {
    tag: "TOGETHER",
    title: "A Kinder Tomorrow",
    desc: "Preserving sacred Vedic traditions by reconnecting conscious families to authentic cow seva and sustaining traditional cowherds and local artisans.",
    icon: "🪷",
    color: "from-orange-500/10 to-rose-600/10 border-orange-300",
  },
];

const DAILY_SCHEDULE = [
  {
    time: "04:30 AM",
    title: "Brahma Muhurta Awakening & Shloka Chanting",
    desc: "Caretakers awaken with morning prayers and Vedic mantras. Airy open sheds are swept, washed with natural neem decoction, and prepped with clean dry bedding.",
    tag: "Sacred Dawn",
  },
  {
    time: "06:00 AM",
    title: "Organic Milking — Calves Drink First",
    desc: "In accordance with Vedic organic principles, calves are always allowed to drink their mother's milk to their heart's content first. Only excess milk is gently gathered by hand for sacred curd and bilona ghee.",
    tag: "Organic Practice",
  },
  {
    time: "08:30 AM",
    title: "Open Pasture Free Grazing & Sunlight",
    desc: "The herd roams free across sprawling, chemical-free grasslands, foraging on native grasses, herbs, and soaking in vital morning prana and sunshine.",
    tag: "Free-Range Life",
  },
  {
    time: "01:00 PM",
    title: "Nutritional Fodder & Sweet Fresh Spring Water",
    desc: "Cows return to shaded resting pavilions where they relish balanced organic fodder enriched with fresh green grass, jaggery, mineral salt, and pure spring water.",
    tag: "Holistic Diet",
  },
  {
    time: "04:00 PM",
    title: "Ayurvedic Care, Grooming & Loving Touch",
    desc: "Gentle hand brushing, dust-baths, and veterinary health examinations. Wounds or ailments are treated with pure Ayurvedic herbs, turmeric, and neem formulations.",
    tag: "Compassionate Care",
  },
  {
    time: "06:30 PM",
    title: "Sandhya Go Puja & Evening Aarti",
    desc: "The day concludes with incense, camphor aarti, and chanting of sacred Go Suktam. Cows rest comfortably in clean, predator-safe, peaceful shelters overnight.",
    tag: "Evening Worship",
  },
];

const LOGO_STREAMS = [
  {
    word: "Ahar.am",
    title: "Pure Nutrition",
    telugu: "ఆహారం",
    desc: "Nourishment for the physical body. Authentic Bilona A2 Desi Cow Ghee hand-churned from cultured curd in clay pots, packed with vitamins A, D, E, and K.",
    badge: "100% Cultured A2 Ghee",
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    word: "Arogy.am",
    title: "Holistic Health",
    telugu: "ఆరోగ్యం",
    desc: "Formulations that restore harmony and vitality. Amrutha Dhara for clear breathing and headache relief, and Gau Dhara Universal Pain Relief Oil for joint comfort.",
    badge: "Ayurvedic Remedies",
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    word: "Soundary.am",
    title: "Natural Purity & Grace",
    telugu: "సౌందర్యం",
    desc: "Inner and outer radiance through sacred offerings. Sahaja Kunkuma (100% chemical-free) for daily auspicious grace, herbal bath bars, and pure Gau Dhoop.",
    badge: "Sacred Daily Essentials",
    color: "bg-rose-100 text-rose-900 border-rose-300",
  },
];

const GALLERY_IMAGES = [
  {
    src: "/images/brochure/hero_gaumata_calf.jpg",
    title: "Mother Cow & Calf at Sunrise",
    desc: "Loving bond in lush pastoral serenity",
  },
  {
    src: "/images/brochure/pastoral_sanctuary_sunset.jpg",
    title: "Sunlit Pastures of Brundavanam",
    desc: "Sprawling open meadows where cows roam freely",
  },
  {
    src: "/images/brochure/sacred_gaumata_gratitude.jpg",
    title: "Sacred Gaumata Reverence",
    desc: "Treated with dignity, vermilion tilak & fragrant marigold garlands",
  },
  {
    src: "/images/brochure/ayurvedic_products_trio.jpg",
    title: "Sacred Goshala Wellness",
    desc: "Sahaja Kunkuma, Amrutha Dhara & Gau Dhara pain oil",
  },
];

export default function GoshalaPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Header Banner - Subtle Warm Dark Theme */}
      <section className="relative overflow-hidden bg-[#1d1711] text-amber-50 py-16 md:py-20 border-b border-amber-900/40">
        {/* Natural Lighting Background Image with Warm Subtle Dark Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/images/brochure/pastoral_sanctuary_sunset.jpg"
            alt="Brundavanam Goshala Sanctuary"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#18130e]/95 via-[#201811]/85 sm:via-[#201811]/70 md:via-[#201811]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18130e]/80 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-content px-6 md:px-8">
          <div className="max-w-3xl space-y-6">
            {/* Logo Crest Badge */}
            <div className="inline-flex items-center gap-3 rounded-full border border-amber-400/40 bg-white/10 px-3.5 py-1.5 shadow-xs backdrop-blur-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-2xs ring-1 ring-amber-400">
                <Image
                  src="/images/logo.png"
                  alt="Brundavanam Logo"
                  width={34}
                  height={34}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="pr-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Ahar.am • Arogy.am • Soundary.am
                </span>
                <span className="block text-[10px] text-amber-200/70 font-semibold">
                  @BRUNDAVANAM GOSHALA SANCTUARY
                </span>
              </div>
            </div>

            <p className="text-xs uppercase tracking-widest font-extrabold text-amber-400">
              Sacred Sanctuary • Compassionate Cow Care • Organic Living
            </p>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.15] text-white tracking-tight drop-shadow-xs">
              Where Gaumata is Family, and Every Day is a Blessing.
            </h1>

            <p className="text-base sm:text-lg text-[#ded4be] leading-relaxed">
              Rooted in timeless Vedic tradition and compassionate living. At Brundavanam Goshala, we protect, revere, and nurture indigenous cows throughout their natural lives with free-range grazing, organic milking, and unconditional love.
            </p>

            <div className="rounded-2xl border-l-4 border-amber-500 bg-amber-500/15 p-4 shadow-xs backdrop-blur-xs max-w-xl text-amber-200">
              <p className="font-serif italic text-amber-200 text-sm sm:text-base font-semibold">
                “When we care for Gaumata, we care for a healthier, kinder world.”
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3.5 text-xs font-bold text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-950/40"
              >
                <ShoppingBag size={15} />
                <span>Support via Sacred Offerings</span>
                <ArrowRight size={14} />
              </Link>
              <a
                href="#visit"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-white/10 px-5 py-3.5 text-xs font-bold text-amber-100 hover:bg-white/20 hover:text-white transition-all shadow-xs backdrop-blur-xs"
              >
                <Calendar size={15} className="text-amber-400" />
                <span>Visit & Go Darshan</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The 3 Sacred Streams from Our Logo */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="rounded-3xl border-2 border-amber-200/90 bg-gradient-to-br from-[#fffdf8] via-[#faf5e8] to-[#f5eedc] p-6 sm:p-10 shadow-sm">
          <div className="mx-auto max-w-2xl text-center space-y-3 mb-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white p-1.5 shadow-md ring-2 ring-amber-400">
              <Image
                src="/images/logo.png"
                alt="Brundavanam Logo"
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-800">
              The Meaning of Our Sacred Crest
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Ahar.am • Arogy.am • Soundary.am
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              Our official seal symbolizes the sacred cycle of mother cow&apos;s blessings. From ethical nourishment to holistic healing and daily spiritual grace, every stream honors Gaumata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LOGO_STREAMS.map((stream, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-xl font-bold text-ink">
                      {stream.word}
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      {stream.telugu}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-amber-900">
                    {stream.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {stream.desc}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-amber-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${stream.color}`}>
                    {stream.badge}
                  </span>
                  <Link
                    href="/shop"
                    className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    View <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The 4 Brochure Pillars */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-deep">
            A Deeper Purpose
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Goodness for People. Care for Cows. Harmony for Planet.
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft">
            Our daily work at the goshala is guided by four sacred commitments from our founding philosophy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SANCTUARY_PILLARS.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border bg-gradient-to-b ${p.color} p-6 shadow-xs hover:shadow-md transition-all flex flex-col`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{p.icon}</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/90 px-2 py-0.5 rounded-full text-ink border border-line">
                  {p.tag}
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-ink mb-2">
                {p.title}
              </h3>
              <p className="text-xs text-ink-soft leading-relaxed flex-1">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. A Day in the Sanctuary — Daily Rhythm */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-10 lg:p-12 shadow-xs">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-accent-deep">
              Sanctuary Life
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-ink">
              A Day at Brundavanam Goshala
            </h2>
            <p className="text-xs sm:text-sm text-ink-soft">
              Every morning begins with respect, and every evening closes with gratitude. Take a look at our daily rhythm of cow care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DAILY_SCHEDULE.map((item, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-line bg-surface-alt p-6 hover:border-accent hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-accent-deep font-bold text-xs">
                      <Clock size={13} />
                      <span>{item.time}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-ink mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Lifelong Sanctuary & Strict Organic Care Promise */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#fffdf8] via-[#fbf7ed] to-[#f4ecd8] p-6 sm:p-10 lg:p-12 border-2 border-amber-200/90 shadow-sm text-ink">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-3.5 py-1 rounded-full border border-amber-300">
                <ShieldCheck size={14} className="text-amber-700" />
                Our Lifetime Organic Care Promise
              </span>

              <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight text-ink">
                Lifelong Shelter, Zero Slaughter, Dignified Care Forever.
              </h2>

              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
                In many commercial dairies, cows that grow old or stop giving milk are abandoned or sent away. At Brundavanam Goshala, our cows are considered sacred mothers and family members.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-ink leading-relaxed">
                    <strong>Zero-Slaughter & Non-Abandonment:</strong> Every cow, bull, and calf born or welcomed into our sanctuary lives peacefully until their natural, dignified passing.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-ink leading-relaxed">
                    <strong>Calves Drink First:</strong> We never separate calves from their mothers or starve calves for commercial yield. They drink first and drink plentifully.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-ink leading-relaxed">
                    <strong>Elderly & Sick Cow Care:</strong> Aging cows receive soft nutritious fodder, ayurvedic joint supplements, warm bedding, and continuous veterinary attention.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-ink leading-relaxed">
                    <strong>Bulls & Oxen Respected:</strong> Bulls are not viewed as liabilities. They graze alongside the herd and are treated with equal honor and love.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Photo */}
            <div className="lg:col-span-5 relative aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden border-2 border-amber-300/80 shadow-xl bg-white">
              <Image
                src="/images/brochure/sacred_gaumata_gratitude.jpg"
                alt="Sacred Cow Care at Brundavanam Goshala"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. Sanctuary Photographic Showcase */}
      <section className="mx-auto max-w-content px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent-deep">
            Visual Tour
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Glimpses of Brundavanam Goshala
          </h2>
          <p className="text-xs sm:text-sm text-ink-soft">
            Explore authentic scenes from our sacred pasture sanctuary and daily Vedic wellness routines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GALLERY_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
                <Image
                  src={img.src}
                  alt={img.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="font-display text-sm font-bold text-ink">
                  {img.title}
                </h3>
                <p className="text-[11px] text-ink-soft">
                  {img.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Visitor Guidelines, Darshan & Contact Information - Subtle Warm Dark Theme */}
      <section id="visit" className="mx-auto max-w-content px-6 md:px-8">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#231c15] via-[#2a221a] to-[#1c1711] p-6 sm:p-10 lg:p-12 shadow-xl text-amber-50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-400/40">
                <Calendar size={13} className="text-amber-400" />
                Visit Brundavanam Goshala
              </span>

              <h2 className="font-display text-2xl sm:text-4xl font-bold leading-tight text-white">
                Experience the Peace of Go Darshan & Sacred Seva.
              </h2>

              <p className="text-xs sm:text-sm text-[#ded4be] leading-relaxed">
                Families, seekers, and children are warmly welcomed to visit our sanctuary. Experience the joy of feeding fresh jaggery and green grass to gentle mother cows, performing traditional Go Puja, and breathing pure pastoral air.
              </p>

              {/* Sanctuary Contacts Card - Subtle Translucent Dark Glass */}
              <div className="rounded-2xl border border-amber-500/20 bg-white/5 backdrop-blur-md p-5 shadow-inner-xs space-y-3">
                <h3 className="font-bold text-amber-300 uppercase tracking-wider text-xs">
                  Sanctuary Visiting Hours & Contact:
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
                      <span className="block text-[10px] text-amber-300/80 font-bold">Helpline / Inquiries</span>
                      <span className="font-bold text-white">+91 94926 02499</span>
                    </span>
                  </a>

                  <a
                    href="mailto:brundavanamgaushala@gmail.com"
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 hover:text-amber-300 transition-all border border-amber-500/20"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                      <Mail size={13} />
                    </span>
                    <span className="flex flex-col">
                      <span className="block text-[10px] text-amber-300/80 font-bold">Official Email</span>
                      <span className="font-bold text-white">brundavanamgaushala@gmail.com</span>
                    </span>
                  </a>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-amber-500/20">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Clock size={13} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-amber-300/80 font-bold">Darshan Timings</span>
                      <span className="font-bold text-white">7:00 AM – 6:00 PM (Daily)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-amber-500/20">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Globe size={13} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-amber-300/80 font-bold">Website Portal</span>
                      <span className="font-bold text-white">www.brundavanamgoshala.com</span>
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
                  <span>Support through Products</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-white/10 px-5 py-3.5 text-xs font-bold text-amber-100 hover:bg-white/20 hover:text-white transition-all shadow-xs backdrop-blur-xs"
                >
                  <span>Book a Sanctuary Visit</span>
                </Link>
              </div>
            </div>

            {/* Right Photo */}
            <div className="lg:col-span-5 relative aspect-[4/3] lg:aspect-square rounded-3xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-stone-900">
              <Image
                src="/images/brochure/hero_gaumata_calf.jpg"
                alt="Darshan at Brundavanam Goshala"
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
