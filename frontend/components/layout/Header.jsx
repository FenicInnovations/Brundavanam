"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  User,
  ShoppingBag,
  Heart,
  MapPin,
  ChevronDown,
  Menu,
  Phone,
  Zap,
} from "lucide-react";
import { SITE_NAME, CONTACT_PHONE, TOP_BAR_MESSAGE, FREE_SHIPPING_MESSAGE } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Goshala", href: "/goshala" },
  { label: "Contact Us", href: "/contact" },
  { label: "About Us", href: "/about" },
];

/**
 * Full desktop header: announcement bar, logo + search + account/cart,
 * and a category/nav row. Hidden below `md` — MobileHeader + BottomNav
 * cover phones.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 hidden w-full flex-col bg-surface md:flex">
      {/* Announcement bar */}
      <div className="flex items-center justify-between bg-ink px-8 py-2 text-xs text-bg">
        <p>{TOP_BAR_MESSAGE}</p>
        <p className="flex items-center gap-2">
          <Phone size={13} />
          Call Us: <strong className="font-semibold">{CONTACT_PHONE}</strong>
        </p>
      </div>

      {/* Logo, search, account/wishlist/cart */}
      <div
        className={`flex items-center gap-6 border-b px-8 transition-[height] duration-200 ${
          scrolled ? "h-[68px]" : "h-[84px]"
        }`}
      >
        <Link href="/" className="shrink-0 font-display text-xl text-ink">
          {SITE_NAME}
        </Link>

        <div className="flex h-11 max-w-2xl flex-1 items-center rounded border overflow-hidden">
          <button
            type="button"
            className="flex h-full items-center gap-1.5 whitespace-nowrap border-r bg-bg px-3 text-sm text-ink-soft"
          >
            All Categories
            <ChevronDown size={15} />
          </button>
          <input
            type="text"
            placeholder="Search for products..."
            className="h-full flex-1 px-4 text-sm text-ink outline-none placeholder:text-ink-soft"
          />
          <button
            type="button"
            aria-label="Search"
            className="flex h-full items-center justify-center bg-ink px-5 text-bg transition-colors duration-150 hover:bg-accent-deep"
          >
            <Search size={17} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="hidden items-center gap-1.5 rounded border px-3 py-2 text-sm text-ink-soft lg:flex"
          >
            <MapPin size={16} />
            India
          </button>

          <Link
            href="/login"
            className="hidden items-center gap-2 rounded border px-3 py-2 lg:flex"
          >
            <User size={18} className="text-ink-soft" />
            <span className="text-left leading-tight">
              <span className="block text-[10px] text-ink-soft">Account</span>
              <span className="block text-xs font-medium text-ink">Login / Register</span>
            </span>
          </Link>

          <Link href="/account/wishlist" aria-label="Wishlist" className="relative p-2 text-ink-soft hover:text-accent">
            <Heart size={22} />
            {wishlistCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-surface">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded bg-accent text-surface transition-colors duration-150 hover:bg-accent-deep"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-bg">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category / nav row */}
      <div className="flex items-center justify-between border-b px-8">
        <div className="flex items-center gap-8">
          <button
            type="button"
            className="flex items-center gap-2 bg-accent px-4 py-3 text-sm font-medium text-surface transition-colors duration-150 hover:bg-accent-deep"
          >
            <Menu size={17} />
            Browse All Categories
            <ChevronDown size={15} />
          </button>

          <nav aria-label="Primary" className="flex items-center gap-7">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b-2 border-transparent py-4 text-sm text-ink-soft transition-colors duration-150 hover:text-accent-deep"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="hidden items-center gap-2 text-sm font-medium text-accent-deep lg:flex">
          <Zap size={15} />
          {FREE_SHIPPING_MESSAGE}
        </p>
      </div>
    </header>
  );
}
