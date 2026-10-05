"use client";

import React from "react";
import { useSelector, selectSidebarExpanded } from "@/lib/redux/store";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import Toast from "@/components/admin/Toast";

function AdminLayoutContent({ children }) {
  const sidebarExpanded = useSelector(selectSidebarExpanded);

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
