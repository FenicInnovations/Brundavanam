"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search, Bell, ExternalLink, CloudCheck, Cloud, Home } from "lucide-react";
import { useSelector, selectAuth } from "@/lib/redux/store";

export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useSelector(selectAuth);

  // Generate breadcrumb segments
  const pathSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const formatted = segment.replace(/-/g, " ");
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
          title="Back to Home Page"
        >
          <Home className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link href="/admin" className="hover:text-emerald-600 transition-colors font-medium">
          Admin
        </Link>
        {pathSegments.slice(1).map((seg, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className={idx === pathSegments.length - 2 ? "font-semibold text-slate-900" : ""}>
              {seg}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {/* Back to Home Button */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all shadow-xs"
          title="Navigate back to Homepage"
        >
          <Home className="w-3.5 h-3.5 text-emerald-600" />
          <span>Back to Home</span>
        </Link>

        {/* GCS Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>GCS Connected</span>
        </div>

        {/* Live Storefront Link */}
        <Link
          href="/shop"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200"
        >
          <span>View Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* User Badge */}
        {(() => {
          const hasValidName = user?.name && user.name.trim() !== "" && user.name.trim() !== "Valued Customer";
          const adminDisplayName = hasValidName ? user.name.trim() : (user?.phone ? `+91 ${user.phone}` : (user?.email || "Admin"));
          const adminInitial = hasValidName ? user.name.trim()[0].toUpperCase() : (user?.phone ? user.phone.slice(-1) : "A");

          return (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {adminInitial}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-slate-900">{adminDisplayName}</span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {user?.role || "Administrator"} {hasValidName && user?.phone ? `• +91 ${user.phone}` : ""}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </header>
  );
}
