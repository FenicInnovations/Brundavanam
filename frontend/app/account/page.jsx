"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Heart, Package, MapPin, LogOut, Headphones } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Account overview: who's logged in, and a jump-off point to the rest
 * of the account area. Orders and Addresses are shown as "coming soon"
 * rather than faked, since those stages haven't been built yet —
 * Wishlist is real and links through to the page built in Stage 2.
 */
export default function AccountPage() {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/register");
  }, [status, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/register");
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
        <div className="h-8 w-40 animate-pulse rounded bg-line" />
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <div className="h-48 animate-pulse rounded-xl bg-line" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-20 animate-pulse rounded-xl bg-line" />
            <div className="h-20 animate-pulse rounded-xl bg-line" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-2xl text-ink md:text-3xl">My Account</h1>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        {/* Who's logged in + logout */}
        <div className="rounded-xl border bg-surface p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <User size={26} />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">{user.name || "Welcome"}</p>
          <p className="text-sm text-ink-soft">+91 {user.phone}</p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded border py-2.5 text-sm font-medium text-accent-deep transition-colors duration-150 hover:bg-bg"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>

        {/* Quick links into the rest of the account area */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/account/wishlist"
            className="flex items-center gap-4 rounded-xl border bg-surface p-5 transition-colors duration-150 hover:border-accent"
          >
            <Heart size={20} className="text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Wishlist</p>
              <p className="text-xs text-ink-soft">View saved products</p>
            </div>
          </Link>

          <Link
            href="/account/support"
            className="flex items-center gap-4 rounded-xl border bg-surface p-5 transition-colors duration-150 hover:border-accent"
          >
            <Headphones size={20} className="text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">Customer Support</p>
              <p className="text-xs text-ink-soft">View enquiries & conversations</p>
            </div>
          </Link>

          <div className="flex items-center gap-4 rounded-xl border bg-surface p-5 opacity-60">
            <Package size={20} className="text-ink-soft" />
            <div>
              <p className="text-sm font-medium text-ink">Orders</p>
              <p className="text-xs text-ink-soft">Coming soon</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border bg-surface p-5 opacity-60">
            <MapPin size={20} className="text-ink-soft" />
            <div>
              <p className="text-sm font-medium text-ink">Addresses</p>
              <p className="text-xs text-ink-soft">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}