"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Heart,
  Package,
  MapPin,
  LogOut,
  Headphones,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
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

  const isAdmin = Boolean(
    user && (user.isAdmin || user.role === "admin" || user.role === "super_admin")
  );

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink md:text-3xl">My Account</h1>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-900/20 hover:bg-emerald-800 transition-all hover:scale-[1.02] active:scale-95"
          >
            <LayoutDashboard size={16} />
            <span>Admin Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
        {/* Who's logged in + logout */}
        <div className="rounded-xl border bg-surface p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <User size={26} />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">{user.name || "Welcome"}</p>
          <p className="text-sm text-ink-soft">+91 {user.phone}</p>

          {isAdmin && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <ShieldCheck size={13} />
              <span>{user.role === "super_admin" ? "Super Admin" : "Admin Staff"}</span>
            </div>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
            >
              <LayoutDashboard size={14} />
              <span>Go to Admin Panel</span>
            </Link>
          )}

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
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-4 rounded-xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 p-5 transition-all duration-150 hover:border-emerald-600 hover:shadow-md sm:col-span-2 group"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
                <LayoutDashboard size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-emerald-950">Admin Panel Dashboard</p>
                  <span className="rounded-full bg-emerald-200/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
                    {user.role === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 mt-0.5">
                  Manage products, inventory, customer orders, shipping & analytics
                </p>
              </div>
              <ArrowRight size={18} className="text-emerald-700 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

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

          <Link
            href="/account/orders"
            className="flex items-center gap-4 rounded-xl border bg-surface p-5 transition-colors duration-150 hover:border-accent"
          >
            <Package size={20} className="text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">My Orders</p>
              <p className="text-xs text-ink-soft">Track & view your orders</p>
            </div>
          </Link>

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