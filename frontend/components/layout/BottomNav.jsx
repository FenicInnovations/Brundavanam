"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Store, Search, ShoppingBag, User } from "lucide-react";
import { BOTTOM_NAV } from "@/lib/constants";
import { useCart } from "@/context/CartContext";

const ICONS = { Home, Store, Search, ShoppingBag, User };

/**
 * Fixed, app-style tab bar — the mobile centerpiece.
 *
 * - Stays pinned through scroll (`fixed`, not `sticky`).
 * - `env(safe-area-inset-bottom)` keeps it clear of the home-indicator
 *   area on notched phones.
 * - The active tab gets a raised pill + filled icon instead of just a
 *   color swap, so it reads clearly at a thumb's-length glance.
 * - `SiteShell` adds matching bottom padding to page content so nothing
 *   ever sits underneath this bar.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex h-[var(--bottom-nav-height)] items-stretch justify-between px-2">
        {BOTTOM_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badge = item.href === "/cart" ? cartCount : 0;

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
                    fillOpacity={isActive ? 0.12 : 0}
                  />
                  {badge > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-surface">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[11px] leading-none ${
                    isActive ? "font-medium text-accent" : "text-ink-soft"
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
