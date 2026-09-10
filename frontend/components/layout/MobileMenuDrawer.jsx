"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { PRIMARY_NAV, SITE_NAME } from "@/lib/constants";

/**
 * Full-screen slide-in nav for mobile, opened from MobileHeader's
 * hamburger. Kept separate from BottomNav — the bottom bar covers the
 * five things people do constantly, this drawer covers everything else
 * (About, Goshala, Donations, Blog, Contact).
 */
export default function MobileMenuDrawer({ open, onClose }) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute inset-y-0 left-0 flex w-[82%] max-w-sm flex-col bg-bg px-6 py-5 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-lg font-medium text-ink">
            {SITE_NAME}
          </span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center"
          >
            <X size={22} className="text-ink" />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="rounded-lg px-2 py-3 text-base text-ink transition-colors duration-150 hover:bg-surface hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
