"use client";

import React from "react";
import { useSelector, selectSidebarExpanded } from "@/lib/redux/store";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import Toast from "@/components/admin/Toast";
import { useAuth } from "@/context/AuthContext";
import NotFound from "@/app/not-found";

function AdminLayoutContent({ children }) {
  const sidebarExpanded = useSelector(selectSidebarExpanded);
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  const isAdmin = Boolean(
    user && (user.isAdmin || user.role === "admin" || user.role === "super_admin")
  );

  if (!isAdmin) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 antialiased font-sans">
      <AdminSidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          sidebarExpanded ? "pl-64" : "pl-20"
        }`}
      >
        <AdminHeader />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
      <Toast />
    </div>
  );
}

export default function AdminLayout({ children }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
