"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Search, ShoppingBag, User } from "lucide-react";
import { BOTTOM_NAV } from "@/lib/constants";
import { useSelector, selectCartTotalCount } from "@/lib/redux/store";

const ICONS = { Home, Store, Search, ShoppingBag, User };

/**
 * Fixed, app-style tab bar for mobile screens:
 * Synchronized with Redux cart count.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const cartCount = useSelector(selectCartTotalCount) || 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav
      aria-label="Primary Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/98 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex h-[var(--bottom-nav-height)] items-stretch justify-between px-1 sm:px-2">
        {BOTTOM_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badge = mounted && item.href === "/cart" ? cartCount : 0;

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-transform duration-150 active:scale-95"
              >
                <span className="relative flex h-7 w-7 items-center justify-center">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.25 : 1.75}
                    className={isActive ? "text-accent" : "text-ink-soft"}
                    fill={isActive && item.icon !== "Search" ? "currentColor" : "none"}
                    fillOpacity={isActive ? 0.14 : 0}
                  />
                  {badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-surface">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] leading-none ${
                    isActive ? "font-bold text-accent" : "text-ink-soft"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
