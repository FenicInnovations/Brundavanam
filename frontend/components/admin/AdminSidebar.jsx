"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  List,
  PlusCircle,
  FolderTree,
  Boxes,
  ShoppingCart,
  Users,
  HeartHandshake,
  Star,
  Ticket,
  CreditCard,
  Truck,
  BarChart3,
  Image as ImageIcon,
  Bell,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  LifeBuoy,
  Home,
  MapPin,
  Mail,
} from "lucide-react";
import { useDispatch, useSelector, selectSidebarExpanded, selectAuth } from "@/lib/redux/store";
import { adminSliceActions } from "@/lib/redux/slices/adminSlice";
import { logoutAdmin } from "@/lib/redux/slices/authSlice";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const sidebarExpanded = useSelector(selectSidebarExpanded);
  const { user } = useSelector(selectAuth);

  const [productsOpen, setProductsOpen] = useState(pathname.startsWith("/admin/products"));

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      isFuture: false,
    },
    {
      label: "Products",
      icon: Package,
      isFuture: false,
      hasSubmenu: true,
      isOpen: productsOpen,
      toggle: () => setProductsOpen(!productsOpen),
      submenu: [
        { label: "All Products", href: "/admin/products", icon: List },
        { label: "Add Product", href: "/admin/products/new", icon: PlusCircle },
        { label: "Categories", href: "/admin/products/categories", icon: FolderTree },
        { label: "Inventory", href: "/admin/products/inventory", icon: Boxes },
      ],
    },
    {
      label: "Customer Support",
      icon: LifeBuoy,
      href: "/admin/support",
      isFuture: false,
    },
    { label: "Orders", icon: ShoppingCart, href: "/admin/orders", isFuture: false },
    { label: "Customers", icon: Users, href: "/admin/customers", isFuture: false },
    {
      label: "Customer Geo & Marketing",
      icon: MapPin,
      href: "/admin/customers/locations",
      isFuture: false,
    },
    {
      label: "Newsletter Subscribers",
      icon: Mail,
      href: "/admin/newsletter",
      isFuture: false,
    },
    { label: "Wishlist / Cart Analytics", icon: HeartHandshake, href: "/admin/analytics/cart", isFuture: false },
    { label: "Reviews", icon: Star, href: "/admin/reviews", isFuture: false },
    { label: "Gallery", icon: ImageIcon, href: "/admin/gallery", isFuture: false },
    { label: "Coupons / Discounts", icon: Ticket, href: "/admin/coupons", isFuture: true },
    { label: "Payments", icon: CreditCard, href: "/admin/payments", isFuture: true },
    { label: "Shipping", icon: Truck, href: "/admin/shipping", isFuture: false },
    { label: "Reports / Analytics", icon: BarChart3, href: "/admin/reports", isFuture: true },
    { label: "Media / Files", icon: ImageIcon, href: "/admin/media", isFuture: true },
    { label: "Notifications", icon: Bell, href: "/admin/notifications", isFuture: true },
    { label: "Settings", icon: Settings, href: "/admin/settings", isFuture: true },
    { label: "Admin Users / Roles", icon: ShieldAlert, href: "/admin/users", isFuture: true },
  ];

  const handleLogout = async () => {
    await dispatch(logoutAdmin());
    router.push("/register");
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col ${
        sidebarExpanded ? "w-64" : "w-20"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-400 bg-white shadow-md flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Brundavanam Goshala"
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          {sidebarExpanded && (
            <div className="flex flex-col">
              <span className="font-semibold text-white tracking-wide text-sm leading-tight">
                Brundavanam
              </span>
              <span className="text-[10px] text-amber-300 font-medium tracking-wider uppercase">
                Admin Console
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => dispatch({ type: adminSliceActions.TOGGLE_SIDEBAR })}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item, idx) => {
          const Icon = item.icon;

          if (item.hasSubmenu) {
            const isSubActive = item.submenu.some((sub) => pathname === sub.href);
            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={item.toggle}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isSubActive
                      ? "bg-emerald-950/50 text-emerald-300 border border-emerald-800/40"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isSubActive ? "text-emerald-400" : "text-slate-400"}`} />
                    {sidebarExpanded && <span className="truncate">{item.label}</span>}
                  </div>
                  {sidebarExpanded && (
                    item.isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {sidebarExpanded && item.isOpen && (
                  <div className="pl-9 pr-1 space-y-1">
                    {item.submenu.map((sub, sIdx) => {
                      const SubIcon = sub.icon;
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sIdx}
                          href={sub.href}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40 font-semibold"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <div key={idx} className="relative group">
              {item.isFuture ? (
                <div
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed hover:bg-slate-800/20`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 flex-shrink-0 text-slate-600" />
                    {sidebarExpanded && <span className="truncate">{item.label}</span>}
                  </div>
                  {sidebarExpanded && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-sans border border-slate-700">
                      Soon
                    </span>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    {sidebarExpanded && <span className="truncate">{item.label}</span>}
                  </div>
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Back to Home Navigation */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/40">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all group ${
            !sidebarExpanded ? "justify-center" : ""
          }`}
          title="Back to Home Page"
        >
          <Home className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0" />
          {sidebarExpanded && <span className="truncate">Back to Home</span>}
        </Link>
      </div>

      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        {sidebarExpanded ? (
          <div className="flex items-center justify-between">
            {(() => {
              const hasValidName = user?.name && user.name.trim() !== "" && user.name.trim() !== "Valued Customer";
              const adminDisplayName = hasValidName ? user.name.trim() : (user?.phone ? `+91 ${user.phone}` : (user?.email || "Administrator"));
              const adminInitial = hasValidName ? user.name.trim()[0].toUpperCase() : (user?.phone ? user.phone.slice(-1) : "A");

              return (
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 border border-slate-600 shrink-0">
                    {adminInitial}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-white truncate" title={adminDisplayName}>
                      {adminDisplayName}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {user?.phone ? `+91 ${user.phone}` : (user?.role || "Admin")}
                    </span>
                  </div>
                </div>
              );
            })()}
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
}
