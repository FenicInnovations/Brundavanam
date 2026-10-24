"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Truck,
  HeartHandshake,
  ArrowRight,
  Loader2,
  MessageCircle,
} from "lucide-react";
import {
  SITE_NAME,
  CONTACT_PHONE,
  CONTACT_EMAIL,
  CONTACT_ADDRESS,
} from "@/lib/constants";
import { CATEGORIES } from "@/lib/mockCategories";
import { newsletterApi } from "@/lib/api/newsletterApi";

const QUICK_LINKS = [
  { label: "About Our Goshala", href: "/about" },
  { label: "Gaumata Sanctuary", href: "/goshala" },
  { label: "Sacred Offerings Shop", href: "/shop" },
  { label: "Track Shipment / Order", href: "/track-order" },
  { label: "Cart & Checkout", href: "/cart" },
  { label: "Saved Wishlist", href: "/account/wishlist" },
  { label: "Devotee Profile", href: "/account" },
  { label: "Contact & Sanctuary Visit", href: "/contact" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
  { label: "Refund & Cancellation", href: "/policies/refund" },
  { label: "Shipping Policy", href: "/policies/shipping" },
];

const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/p/Brundavanam-Goshala-61565490178430/",
    icon: Facebook,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/brundavanamgoshala/",
    icon: Instagram,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@BrundavanamGaushala",
    icon: Youtube,
  },
];

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: "100% Organic Sanctuary",
    desc: "Lifelong care & protection for non-milking cows and bull calves.",
  },
  {
    icon: Sparkles,
    title: "Pure Vedic Bilona",
    desc: "Bi-directional wooden churned A2 curd — zero industrial heating.",
  },
  {
    icon: HeartHandshake,
    title: "Honest & Chemical-Free",
    desc: "Lab tested, zero preservatives, no artificial fragrances or colors.",
  },
  {
    icon: Truck,
    title: "Pan-India Safe Delivery",
    desc: "Breakage-proof, eco-friendly food grade glass jar packaging.",
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'info' | 'error', message: string }

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setStatus({
        type: "error",
        message: "Please enter your email address to receive sacred updates.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setStatus({
        type: "error",
        message: "Please enter a valid email address (e.g. devotee@example.com).",
      });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await newsletterApi.subscribe(cleanEmail, "footer");

      if (res.success) {
        if (res.isAlreadySubscribed) {
          setStatus({
            type: "info",
            message:
              res.message ||
              "You are already part of our sacred circle! Thank you for your continued support.",
          });
        } else {
          setStatus({
            type: "success",
            message:
              res.message ||
              "Dhanyavadah! 🙏 You are now subscribed to sacred updates, harvest alerts, and Vedic blessings.",
          });
          setEmail("");
        }
      } else {
        setStatus({
          type: "error",
          message: res.message || "Something went wrong. Please try again.",
        });
      }
    } catch (err) {
      console.error("Newsletter subscription error:", err);
      setStatus({
        type: "error",
        message:
          err.data?.message ||
          err.message ||
          "Unable to subscribe right now. Please try again shortly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="mt-20 border-t border-amber-900/30 bg-[#16120d] text-amber-50">
      {/* 1. Value & Trust Guarantee Pillars Strip */}
      <div className="border-b border-amber-900/20 bg-[#1c1610]/80 py-8 px-6 md:px-8">
        <div className="mx-auto max-w-content grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {pillar.title}
                  </h4>
                  <p className="text-[11px] text-amber-200/70 mt-0.5 leading-snug">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-content px-6 pt-12 md:px-8">
        {/* 2. Interactive Newsletter Subscription Box */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#241c14] via-[#2c2219] to-[#1e1710] p-6 sm:p-10 border border-amber-500/25 shadow-xl mb-12">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Newsletter Title & Copy */}
            <div className="lg:col-span-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <Sparkles size={12} className="text-amber-400" />
                <span>Sacred Devotee Community</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Subscribe to Our Vedic Newsletter
              </h3>
              <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed max-w-xl">
                Be the first to receive notifications on fresh seasonal batches of authentic Bilona A2 Ghee, sacred festive offerings, traditional Ayurvedic remedies, and inspiring Gaumata seva stories.
              </p>
            </div>

            {/* Newsletter Form & Instant Feedback */}
            <div className="lg:col-span-6">
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-400/60">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status) setStatus(null);
                      }}
                      placeholder="Enter your email address"
                      disabled={submitting}
                      className="w-full rounded-xl border border-amber-400/30 bg-[#16120d]/90 pl-10 pr-4 py-3.5 text-xs sm:text-sm text-white placeholder:text-amber-200/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-stone-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-950/40 shrink-0 disabled:opacity-60 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-stone-950" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe Now</span>
                        <Send size={14} className="text-stone-950" />
                      </>
                    )}
                  </button>
                </div>

                {/* Inline Status Feedback Message */}
                {status && (
                  <div
                    className={`flex items-start gap-2.5 rounded-xl p-3 text-xs animate-in fade-in duration-300 ${
                      status.type === "success"
                        ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-200"
                        : status.type === "info"
                        ? "bg-amber-950/80 border border-amber-500/50 text-amber-200"
                        : "bg-rose-950/80 border border-rose-500/50 text-rose-200"
                    }`}
                  >
                    {status.type === "success" ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : status.type === "info" ? (
                      <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed font-medium">{status.message}</span>
                  </div>
                )}

                <p className="text-[11px] text-amber-200/60 leading-normal">
                  🔒 We respect your privacy. Zero spam. Pure Vedic blessings delivered with care. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* 3. Multi-Column Content & Links Section */}
        <div className="grid grid-cols-1 gap-10 py-8 md:grid-cols-2 lg:grid-cols-12 border-t border-amber-900/30">
          {/* Column 1: Brand & Goshala Identity (lg: 4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-amber-400 bg-white shadow-md shrink-0">
                <Image
                  src="/images/logo.png"
                  alt={SITE_NAME}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-white tracking-wide">
                  {SITE_NAME}
                </p>
                <p className="text-[10px] font-extrabold tracking-wider text-amber-400 uppercase">
                  Ahar.am • Arogy.am • Soundary.am
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-amber-200/80 max-w-sm">
              Rooted in Tradition. Made for a Kinder Tomorrow. Brundavanam Goshala is a sacred sanctuary dedicated to the lifelong protection of indigenous Desi cows and sharing pure, authentic Vedic Ayurvedic wellness.
            </p>

            {/* Direct Sanctuary Contacts */}
            <div className="space-y-2 pt-2 text-xs text-amber-100/90 font-medium">
              <a
                href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
                className="flex items-center gap-2.5 hover:text-amber-300 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Phone size={13} />
                </div>
                <span>{CONTACT_PHONE}</span>
              </a>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2.5 hover:text-amber-300 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Mail size={13} />
                </div>
                <span>{CONTACT_EMAIL}</span>
              </a>

              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                  <MapPin size={13} />
                </div>
                <span className="text-[11px] leading-relaxed text-amber-200/80">
                  {CONTACT_ADDRESS}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-[11px] text-amber-300/80 pt-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Clock size={13} />
                </div>
                <span>Daily Go Darshan Timings: 7:00 AM – 6:00 PM IST</span>
              </div>
            </div>
          </div>

          {/* Column 2: Vedic Categories (lg: 2 cols) */}
          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Sacred Offerings
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 text-xs text-amber-200/80">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className="hover:text-amber-300 transition-colors duration-150 inline-flex items-center gap-1 group"
                  >
                    <span className="text-[10px] text-amber-400/60 group-hover:translate-x-0.5 transition-transform">
                      ›
                    </span>
                    <span>{cat.name}</span>
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/shop"
                  className="font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Explore Full Store</span>
                  <ArrowRight size={12} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Devotee Links (lg: 3 cols) */}
          <div className="lg:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Devotee Navigation
            </p>
            <ul className="mt-4 flex flex-col gap-2.5 text-xs text-amber-200/80">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-amber-300 transition-colors duration-150 inline-flex items-center gap-1 group"
                  >
                    <span className="text-[10px] text-amber-400/60 group-hover:translate-x-0.5 transition-transform">
                      ›
                    </span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Policies, WhatsApp & Socials (lg: 3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Trust & Policies
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-xs text-amber-200/80">
                {POLICY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:text-amber-300 transition-colors duration-150 inline-flex items-center gap-1"
                    >
                      <span className="text-[10px] text-amber-400/60">›</span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct WhatsApp Seva Channel Button */}
            <div className="pt-1">
              <a
                href={`https://wa.me/919492602499?text=${encodeURIComponent("Namaste! I would like to inquire about Brundavanam Goshala products and seva.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-all shadow-xs"
              >
                <MessageCircle size={15} className="text-emerald-400" />
                <span>Chat on WhatsApp Seva</span>
              </a>
            </div>

            {/* Social Icons */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">
                Connect With Us
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                {SOCIALS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500 hover:text-stone-950 hover:border-amber-500 transition-all duration-200 shadow-xs"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Legal & Sacred Blessing Bar */}
      <div className="border-t border-amber-900/30 bg-[#120f0a] py-5 pb-24 md:pb-5">
        <div className="mx-auto max-w-content px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-xs text-amber-200/70 font-serif italic">
              ॥ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ॥ (May all beings be happy and free from disease)
            </p>
            <p className="text-[11px] text-amber-200/50">
              © {new Date().getFullYear()} {SITE_NAME}. Handcrafted with devotion for Gaumata Seva & Organic Wellness.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-amber-200/60">
            <span>🛡️ 100% Secure Razorpay Checkout</span>
            <span>•</span>
            <span>🌱 Verified Organic Dairy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
