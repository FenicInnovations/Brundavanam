"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Users,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart2,
  LifeBuoy,
  Home,
} from "lucide-react";
import { useDispatch, useSelector, selectDashboardStats } from "@/lib/redux/store";
import { fetchDashboardStats } from "@/lib/redux/slices/adminSlice";
import { CardSkeleton } from "@/components/admin/SkeletonLoader";

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const stats = useSelector(selectDashboardStats);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administration Overview</h1>
          <p className="text-xs text-slate-500">Loading live database metrics...</p>
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const { products, customers, orders, support } = stats;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-8 rounded-3xl text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Store Command Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome to Brundavanam Goshala Admin
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage your organic A2 dairy and Goshala product catalog, monitor inventory levels, and control media assets in Google Cloud Storage.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/admin/products/new"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </Link>
            <Link
              href="/admin/products"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <span>Manage Product Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-800/90 hover:bg-slate-700 hover:text-white text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/30 transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Product & Catalog Metrics (Real Data) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-600" />
          <span>Product & Inventory Metrics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Products */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Products</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{products.total}</div>
            <p className="text-xs text-slate-500">Configured in MongoDB database</p>
          </div>

          {/* Active Products */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Published</span>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{products.active}</div>
            <p className="text-xs text-emerald-600 font-medium">Visible to customers online</p>
          </div>

          {/* Low Stock */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Low Stock Alert</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{products.lowStock}</div>
            <p className="text-xs text-amber-600 font-medium">Stock count &le; 10 units</p>
          </div>

          {/* Out of Stock */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Out of Stock</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{products.outOfStock}</div>
            <p className="text-xs text-rose-600 font-medium">Requires immediate restock</p>
          </div>
        </div>
      </div>

      {/* Orders & Customer Metrics (Future Functionality Clearly Badged) */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          <span>Orders & Customer Analytics</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Support Enquiries (Live) */}
          <Link
            href="/admin/support"
            className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden hover:border-emerald-400 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Support Enquiries</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <LifeBuoy className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{support?.total ?? 0}</div>
            <p className="text-xs text-emerald-600 font-medium">
              {support?.open ?? 0} active / pending response &rarr;
            </p>
          </Link>

          {/* Registered Customers */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Registered Customers</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{customers.total}</div>
            <p className="text-xs text-purple-600 font-medium">Active customer accounts</p>
          </div>

          {/* Total Orders (Future) */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden opacity-90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Orders</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                Future Module
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-400">N/A</div>
            <p className="text-xs text-slate-400">Order management workflow planned for next release.</p>
          </div>

          {/* Pending Orders (Future) */}
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden opacity-90">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pending Orders</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                Future Module
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-400">N/A</div>
            <p className="text-xs text-slate-400">Real-time order status tracking coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
