"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  Shield,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Truck,
} from "lucide-react";
import {
  SITE_NAME,
  CONTACT_PHONE,
  TOP_BAR_MESSAGE,
  FREE_SHIPPING_MESSAGE,
} from "@/lib/constants";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  useDispatch,
  useSelector,
  selectCartTotalCount,
  selectWishlistItems,
  selectCategories,
  selectCurrentUser,
  selectIsAdmin,
  logoutUser,
  fetchCategories,
  selectFreeShippingThreshold,
  selectIsFreeShippingEnabled,
} from "@/lib/redux/store";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Goshala", href: "/goshala" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();

  const [scrolled, setScrolled] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const accountMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);

  const { user: ctxUser, status: ctxStatus, logout: ctxLogout } = useAuth();
  const reduxUser = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);
  const categories = useSelector(selectCategories);

  // Directly read accurate counts from Redux store (Single Source of Truth)
  const cartTotalCount = useSelector(selectCartTotalCount);
  const wishlistItems = useSelector(selectWishlistItems);
  const wishlistTotalCount = wishlistItems?.length || 0;

  // Dynamic Free Shipping Configuration from Admin
  const freeShippingThreshold = useSelector(selectFreeShippingThreshold) || 800;
  const isFreeShippingEnabled = useSelector(selectIsFreeShippingEnabled);

  const currentUser = reduxUser || ctxUser;
  const isAuthenticated = ctxStatus === "authenticated" || !!reduxUser;

  // Selected Delivery Address & Recipient Name State
  const [userAddresses, setUserAddresses] = useState([]);

  // Fetch saved addresses to determine the selected/primary address recipient name
  const fetchUserAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getAddresses();
      if (res?.success && Array.isArray(res.addresses)) {
        setUserAddresses(res.addresses);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserAddresses();
    } else {
      setUserAddresses([]);
    }
  }, [isAuthenticated, fetchUserAddresses]);

  // Listen for real-time address updates triggered anywhere in the app
  useEffect(() => {
    const handleAddressUpdated = () => {
      fetchUserAddresses();
    };
    window.addEventListener("address-updated", handleAddressUpdated);
    return () => window.removeEventListener("address-updated", handleAddressUpdated);
  }, [fetchUserAddresses]);

  // Priority: 
  // 1. Check primary/default address in userAddresses or currentUser.addresses
  // 2. Fall back to "Valued Customer" if user has no address saved
  const effectiveAddresses = userAddresses.length > 0 ? userAddresses : (currentUser?.addresses || []);
  const selectedAddress =
    effectiveAddresses.find((a) => a.isDefault) ||
    (effectiveAddresses.length > 0 ? effectiveAddresses[0] : null);
  const selectedPersonName = (selectedAddress?.fullName?.trim() && selectedAddress.fullName.trim() !== "Valued Customer")
    ? selectedAddress.fullName.trim()
    : null;
  const validUserName = (currentUser?.name?.trim() && currentUser.name.trim() !== "Valued Customer")
    ? currentUser.name.trim()
    : null;
  const customerDisplayName =
    validUserName ||
    selectedPersonName ||
    (currentUser?.phone ? `+91 ${currentUser.phone}` : (currentUser?.email || "Devotee"));

  // Clean up legacy stale localStorage keys on initial mount
  useEffect(() => {
    try {
      localStorage.removeItem("bg_cart_v1");
      localStorage.removeItem("bg_wishlist_v1");
    } catch {
      // ignore
    }
  }, []);

  // Fetch categories if not loaded yet
  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories]);

  // Track window scroll for subtle header compaction
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Handle Search Submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() && selectedCategory === "all") {
      router.push("/shop");
      return;
    }

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);

    router.push(`/shop?${params.toString()}`);
  };

  // Unified Logout Flow: Clears session and redirects directly to /register
  const handleLogout = async () => {
    setAccountMenuOpen(false);
    try {
      await dispatch(logoutUser());
      if (ctxLogout) await ctxLogout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/register");
    }
  };

  // Helper for active navigation link styling
  const isLinkActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className="sticky top-0 z-50 hidden w-full flex-col bg-white shadow-xs transition-all md:flex"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* 1. Sacred Golden Announcement Bar */}
      <div className="flex items-center justify-between bg-[#1f1911] px-8 py-2 text-xs text-[#faf3e0] border-b border-[#2e261a]">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="font-medium tracking-wide">
            {TOP_BAR_MESSAGE}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/track-order"
            className="flex items-center gap-1.5 text-[#faf3e0] hover:text-amber-300 transition-colors text-xs font-semibold"
          >
            <Truck size={13} className="text-amber-400" />
            <span>Track Order</span>
          </Link>
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 text-[#faf3e0] hover:text-amber-300 transition-colors"
          >
            <Phone size={13} className="text-amber-400" />
            <span>Direct Support: <strong className="font-semibold">{CONTACT_PHONE}</strong></span>
          </a>
        </div>
      </div>

      {/* 2. Main Branding, Global Search, and Account/Cart Actions */}
      <div
        className={`flex items-center justify-between gap-6 border-b border-line bg-surface px-8 transition-all duration-200 ${
          scrolled ? "h-[74px] shadow-sm" : "h-[88px]"
        }`}
      >
        {/* Brand Logo & Tagline */}
        <Link href="/" className="group flex items-center gap-3 shrink-0">
          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-amber-300 shadow-sm group-hover:scale-105 transition-transform duration-200 bg-white">
            <Image
              src="/images/logo.png"
              alt={SITE_NAME}
              width={48}
              height={48}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl tracking-tight text-ink font-bold group-hover:text-accent transition-colors leading-none">
              {SITE_NAME}
            </span>
            <span className="text-[10px] font-extrabold tracking-wide text-amber-800 mt-1 flex items-center gap-1.5">
              <span>Ahar.am</span>
              <span className="text-amber-500 font-bold">•</span>
              <span>Arogy.am</span>
              <span className="text-amber-500 font-bold">•</span>
              <span>Soundary.am</span>
            </span>
          </div>
        </Link>

        {/* Global Search Bar with Integrated Category Selector */}
        <form
          onSubmit={handleSearch}
          className="flex h-12 max-w-2xl flex-1 items-center rounded-2xl border border-line bg-[#fdfbf7] shadow-inner-xs focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/15 transition-all overflow-hidden"
        >
          {/* Category Dropdown Filter */}
          <div className="relative shrink-0 border-r border-line/80">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-12 appearance-none bg-transparent pl-3.5 pr-8 text-xs font-semibold text-ink-soft outline-none cursor-pointer hover:text-ink transition-colors"
            >
              <option value="all">All Categories</option>
              {categories &&
                categories
                  .filter((c) => !c.parent)
                  .map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/70"
            />
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Pure A2 Ghee, Dhoop, Kunkuma, Cow Dung Diyas..."
            className="h-full flex-1 px-4 text-sm text-ink outline-none placeholder:text-ink-soft/60 bg-transparent"
          />

          {/* Search Action Button */}
          <button
            type="submit"
            aria-label="Search Catalog"
            className="flex h-full items-center justify-center bg-accent px-5 text-surface font-semibold hover:bg-accent-deep transition-colors duration-150 gap-1.5"
          >
            <Search size={17} />
            <span className="hidden xl:inline text-xs">Search</span>
          </button>
        </form>

        {/* Right Section: Location, Account, Wishlist, and Cart */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Country / Delivery Status */}
          <div className="hidden xl:flex items-center gap-2 rounded-xl border border-line/80 bg-bg/50 px-3 py-2 text-xs font-medium text-ink-soft">
            <MapPin size={15} className="text-accent" />
            <div className="leading-tight">
              <span className="block text-[9px] uppercase tracking-wider text-ink-soft/80">Delivery</span>
              <span className="font-semibold text-ink">All India Shipping</span>
            </div>
          </div>

          {/* Account Dropdown Menu */}
          <div className="relative" ref={accountMenuRef}>
            {mounted && isAuthenticated ? (
              <button
                type="button"
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface hover:bg-bg/60 p-2 lg:px-3 lg:py-2 transition-all"
                title={`Logged in as ${customerDisplayName}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent-deep font-bold text-xs">
                  {customerDisplayName !== "Valued Customer" ? (
                    customerDisplayName[0].toUpperCase()
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="hidden text-left leading-tight lg:block">
                  <span className="block text-[10px] text-ink-soft font-medium">Hello,</span>
                  <span
                    className="block text-xs font-bold text-ink max-w-[130px] truncate"
                    title={customerDisplayName}
                  >
                    {customerDisplayName}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-ink-soft transition-transform ${accountMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            ) : (
              <Link
                href="/register"
                className="flex items-center gap-2 rounded-xl border border-line bg-surface hover:bg-amber-50/60 hover:border-amber-300 px-3 py-2 text-ink transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                  <User size={16} />
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-[10px] text-ink-soft font-medium">Welcome</span>
                  <span className="block text-xs font-bold text-ink">Login / Register</span>
                </div>
              </Link>
            )}

            {/* Authenticated Account Dropdown Drawer */}
            {mounted && isAuthenticated && accountMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-line mb-1 bg-bg/40 rounded-xl">
                  <p className="text-xs font-bold text-ink truncate" title={customerDisplayName}>
                    {customerDisplayName}
                  </p>
                  {currentUser?.phone && (
                    <p className="text-[11px] text-ink-soft truncate">+91 {currentUser.phone}</p>
                  )}
                  {selectedAddress?.city && (
                    <p className="text-[10px] text-amber-700 font-medium truncate mt-0.5">
                      📍 {selectedAddress.city}
                      {selectedAddress.postalCode ? `, ${selectedAddress.postalCode}` : ""}
                    </p>
                  )}
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <Shield size={10} /> Admin Access
                    </span>
                  )}
                </div>

                <Link
                  href="/account"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-bg hover:text-accent transition-colors"
                >
                  <User size={15} />
                  <span>My Account Overview</span>
                </Link>

                <Link
                  href="/account/wishlist"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-ink hover:bg-bg hover:text-accent transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart size={15} />
                    <span>My Wishlist</span>
                  </span>
                  {wishlistTotalCount > 0 && (
                    <span className="rounded-full bg-accent/20 text-accent-deep px-1.5 py-0.5 text-[10px] font-bold">
                      {wishlistTotalCount}
                    </span>
                  )}
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/70 transition-colors my-1"
                  >
                    <Shield size={15} />
                    <span>Admin Control Center</span>
                  </Link>
                )}

                <div className="pt-1 mt-1 border-t border-line">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wishlist Link with Live Redux Counter */}
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="group relative flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-surface hover:bg-rose-50 hover:border-rose-200 text-ink-soft hover:text-rose-600 transition-all"
            title="Saved Items in Wishlist"
          >
            <Heart size={20} className="transition-transform group-hover:scale-110" />
            {mounted && wishlistTotalCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
                {wishlistTotalCount}
              </span>
            )}
          </Link>

          {/* Shopping Cart Button with Live Item Counter */}
          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className="group relative flex h-11 items-center gap-2.5 rounded-2xl bg-accent px-4 text-surface font-semibold shadow-md shadow-accent/20 hover:bg-accent-deep transition-all"
            title="View Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag size={20} className="transition-transform group-hover:scale-105" />
              {mounted && cartTotalCount > 0 && (
                <span className="absolute -right-2.5 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1c1813] px-1 text-[10px] font-bold text-white border-2 border-surface shadow-xs">
                  {cartTotalCount}
                </span>
              )}
            </div>
            <span className="text-xs font-bold tracking-tight">Cart</span>
          </Link>
        </div>
      </div>

      {/* 3. Navigation Bar with Clear Active Link Highlighting */}
      <div className="flex items-center justify-between border-b border-line bg-[#faf6ed] px-8 py-0">
        <div className="flex items-center gap-8">
          {/* Browse Categories Dropdown Trigger */}
          <div className="relative" ref={categoryMenuRef}>
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center gap-2.5 bg-accent px-5 py-3 text-xs font-bold text-surface tracking-wide uppercase transition-colors hover:bg-accent-deep rounded-t-xl"
            >
              <Menu size={16} />
              <span>Browse Categories</span>
              <ChevronDown size={14} className={`transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Categories Flyout Menu */}
            {categoriesOpen && (
              <div className="absolute left-0 top-full w-64 rounded-b-2xl border border-line bg-surface p-2 shadow-xl z-50 animate-in fade-in duration-150">
                <Link
                  href="/shop"
                  onClick={() => setCategoriesOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-accent-deep hover:bg-amber-50 transition-colors border-b border-line/60 mb-1"
                >
                  <span>All Products Collection</span>
                  <ArrowRight size={14} />
                </Link>
                {categories && categories.length > 0 ? (
                  categories
                    .filter((c) => !c.parent)
                    .map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/shop?category=${cat._id}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-ink hover:bg-bg hover:text-accent transition-colors"
                      >
                        <span>{cat.name}</span>
                        <ChevronDown size={12} className="-rotate-90 text-ink-soft/40" />
                      </Link>
                    ))
                ) : (
                  <p className="px-3.5 py-2 text-xs text-ink-soft">Loading categories...</p>
                )}
              </div>
            )}
          </div>

          {/* Primary Nav Links with Active Route Highlighting */}
          <nav aria-label="Primary Site Navigation" className="flex items-center gap-2">
            {NAV_LINKS.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-3 text-sm font-semibold transition-all flex items-center gap-1.5 rounded-t-xl ${
                    active
                      ? "text-accent-deep font-bold border-b-2 border-accent bg-surface/90 shadow-2xs"
                      : "text-ink-soft hover:text-ink hover:bg-surface/50 border-b-2 border-transparent"
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Free Shipping & Purity Assurance Ribbon */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-accent-deep">
          <p className="flex items-center gap-1.5 bg-amber-100/70 border border-amber-200/80 px-3 py-1 rounded-full">
            <Zap size={13} className="text-amber-700" />
            <span>
              {isFreeShippingEnabled
                ? `Free Shipping in India: Order Above ₹${freeShippingThreshold.toLocaleString("en-IN")}/-`
                : "Free Shipping in India: Order Above ₹800/-"}
            </span>
          </p>
          <span className="text-[11px] text-ink-soft/80 font-medium">
            100% Organic Goshala
          </span>
        </div>
      </div>
    </header>
  );
}