"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, User, Heart, ShoppingBag, LogOut, Shield, ChevronRight, Phone } from "lucide-react";
import { SITE_NAME, CONTACT_PHONE } from "@/lib/constants";
import {
  useDispatch,
  useSelector,
  selectCurrentUser,
  selectIsAdmin,
  selectWishlistItems,
  selectCartTotalCount,
  logoutUser,
} from "@/lib/redux/store";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Shop Products", href: "/shop" },
  { label: "Goshala & Heritage", href: "/goshala" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function MobileMenuDrawer({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user: ctxUser, logout: ctxLogout } = useAuth();
  const reduxUser = useSelector(selectCurrentUser);
  const user = reduxUser || ctxUser;
  const isAdmin = useSelector(selectIsAdmin);
  const cartCount = useSelector(selectCartTotalCount) || 0;
  const wishlistItems = useSelector(selectWishlistItems);
  const wishlistCount = wishlistItems?.length || 0;

  // Selected Delivery Address & Recipient Name computation
  const addresses = user?.addresses || [];
  const selectedAddress =
    addresses.find((a) => a.isDefault) || (addresses.length > 0 ? addresses[0] : null);
  const selectedPersonName = (selectedAddress?.fullName?.trim() && selectedAddress.fullName.trim() !== "Valued Customer")
    ? selectedAddress.fullName.trim()
    : null;
  const validUserName = (user?.name?.trim() && user.name.trim() !== "Valued Customer")
    ? user.name.trim()
    : null;
  const customerDisplayName =
    validUserName ||
    selectedPersonName ||
    (user?.phone ? `+91 ${user.phone}` : (user?.email || "Devotee"));

  const isLinkActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await dispatch(logoutUser());
      if (ctxLogout) await ctxLogout();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      router.push("/register");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/50 backdrop-blur-xs transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-[#faf6ed] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface p-5">
          <Link href="/" onClick={onClose} className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden border border-amber-300 shadow-2xs shrink-0 bg-white">
              <Image
                src="/images/logo.png"
                alt={SITE_NAME}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-bold text-ink leading-tight">
                {SITE_NAME}
              </span>
              <span className="text-[9px] font-bold tracking-wider text-amber-800">
                Ahar.am • Arogy.am • Soundary.am
              </span>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg text-ink-soft hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Account Tile */}
        <div className="p-4 border-b border-line bg-surface/70">
          {mounted && user ? (
            <div className="flex flex-col gap-2 bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-surface font-bold text-sm">
                  {customerDisplayName !== "Valued Customer" ? (
                    customerDisplayName[0].toUpperCase()
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate" title={customerDisplayName}>
                    {customerDisplayName}
                  </p>
                  <p className="text-xs text-ink-soft truncate">+91 {user.phone}</p>
                  {selectedAddress?.city && (
                    <p className="text-[10px] text-amber-800 font-medium truncate">
                      📍 {selectedAddress.city}
                      {selectedAddress.postalCode ? `, ${selectedAddress.postalCode}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-amber-200/50 mt-1">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex-1 text-center py-1.5 px-3 bg-surface rounded-xl text-xs font-semibold text-ink border border-line shadow-2xs hover:bg-bg"
                >
                  My Account
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="py-1.5 px-3 bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                  title="Log Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/register"
              onClick={onClose}
              className="flex items-center justify-between p-3.5 bg-accent text-surface rounded-2xl font-bold text-xs shadow-md shadow-accent/20"
            >
              <div className="flex items-center gap-2.5">
                <User size={18} />
                <span>Login or Register with OTP</span>
              </div>
              <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {/* Main Navigation Links */}
        <nav aria-label="Mobile Navigation" className="flex flex-col p-4 gap-1.5 flex-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-ink-soft px-3 mb-1">
            Menu Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "bg-amber-100/80 text-accent-deep font-bold border border-amber-300/80 shadow-2xs"
                    : "text-ink hover:bg-surface hover:text-accent"
                }`}
              >
                <span>{item.label}</span>
                {active ? (
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                ) : (
                  <ChevronRight size={15} className="text-ink-soft/40" />
                )}
              </Link>
            );
          })}

          <div className="pt-3 mt-2 border-t border-line space-y-1.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-ink-soft px-3 mb-1">
              Your Activity
            </p>
            <Link
              href="/account/wishlist"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface"
            >
              <span className="flex items-center gap-2.5">
                <Heart size={18} className="text-rose-600" />
                <span>Wishlist</span>
              </span>
              {mounted && wishlistCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface"
            >
              <span className="flex items-center gap-2.5">
                <ShoppingBag size={18} className="text-accent" />
                <span>Shopping Cart</span>
              </span>
              {mounted && cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {cartCount} items
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Footer Support */}
        <div className="p-4 border-t border-line bg-surface/50 text-xs text-ink-soft flex flex-col gap-2">
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
            className="flex items-center gap-2 font-semibold text-ink hover:text-accent"
          >
            <Phone size={14} className="text-accent" />
            <span>Support: {CONTACT_PHONE}</span>
          </a>
          <p className="text-[11px] text-ink-soft/80">
            Dedicated to Gau Mata Seva & Authentic Organic Products.
          </p>
        </div>
      </div>
    </div>
  );
}
