"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, Heart } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";
import { useState, useEffect } from "react";
import IconButton from "@/components/ui/IconButton";
import { useSelector, selectCartTotalCount, selectWishlistItems } from "@/lib/redux/store";

/**
 * Mobile top bar:
 * Uses accurate Redux counts for Cart and Wishlist badges,
 * clean responsive navigation targets, and quick search shortcut.
 */
export default function MobileHeader({ onMenuOpen }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = useSelector(selectCartTotalCount) || 0;
  const wishlistItems = useSelector(selectWishlistItems);
  const wishlistCount = wishlistItems?.length || 0;

  return (
    <header
      className="sticky top-0 z-50 flex h-[var(--mobile-header-height)] w-full max-w-full items-center justify-between border-b border-line bg-white px-2.5 sm:px-3 shadow-xs md:hidden"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Left side: Hamburger menu + Logo icon + Site Name */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 mr-2">
        <IconButton
          icon={Menu}
          label="Open navigation menu"
          onClick={onMenuOpen}
          className="shrink-0 text-ink"
        />

        <Link
          href="/"
          className="font-display text-xs sm:text-sm font-bold tracking-tight text-ink flex items-center gap-1.5 sm:gap-2 min-w-0"
        >
          <div className="relative h-7 w-7 rounded-full overflow-hidden border border-amber-300 shadow-2xs shrink-0 bg-white">
            <Image
              src="/images/logo.png"
              alt={SITE_NAME}
              width={28}
              height={28}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="truncate text-ink font-bold max-w-[140px] xs:max-w-[170px] sm:max-w-[210px]">
            {SITE_NAME}
          </span>
        </Link>
      </div>

      {/* Right side: Action icons */}
      <div className="flex items-center gap-0 sm:gap-0.5 shrink-0">
        <IconButton href="/shop" icon={Search} label="Search" />
        <IconButton
          href="/account/wishlist"
          icon={Heart}
          label="Wishlist"
          badge={mounted && wishlistCount > 0 ? wishlistCount : undefined}
        />
        <IconButton
          href="/cart"
          icon={ShoppingBag}
          label="Cart"
          badge={mounted && cartCount > 0 ? cartCount : undefined}
        />
      </div>
    </header>
  );
}
