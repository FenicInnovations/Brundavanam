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
    <header className="sticky top-0 z-40 flex h-[var(--mobile-header-height)] items-center justify-between border-b border-line bg-surface/95 px-3 backdrop-blur-md md:hidden">
      <IconButton icon={Menu} label="Open navigation menu" onClick={onMenuOpen} />

      <Link
        href="/"
        className="font-display text-sm font-bold tracking-tight text-ink flex items-center gap-2"
      >
        <div className="relative h-7 w-7 rounded-full overflow-hidden border border-amber-300 shadow-2xs shrink-0 bg-white">
          <Image
            src="/images/logo.png"
            alt={SITE_NAME}
            width={28}
            height={28}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="truncate max-w-[170px]">{SITE_NAME}</span>
      </Link>

      <div className="flex items-center gap-0.5">
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
