"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import IconButton from "@/components/ui/IconButton";
import { useCart } from "@/context/CartContext";

/**
 * Mobile top bar. Every target sits on the outer edges so it's reachable
 * one-handed; the logo in the middle is a label, not a tap target.
 */
export default function MobileHeader({ onMenuOpen }) {
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-40 flex h-[var(--mobile-header-height)] items-center justify-between border-b bg-bg/95 px-3 backdrop-blur md:hidden">
      <IconButton icon={Menu} label="Open menu" onClick={onMenuOpen} />

      <Link
        href="/"
        className="font-display text-base font-medium tracking-tight text-ink"
      >
        {SITE_NAME}
      </Link>

      <div className="flex items-center">
        <IconButton href="/search" icon={Search} label="Search" />
        <IconButton href="/cart" icon={ShoppingBag} label="Cart" badge={cartCount} />
      </div>
    </header>
  );
}
