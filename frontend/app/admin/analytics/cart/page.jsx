"use client";

import React, { useState, useEffect } from "react";
import { Heart, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

export default function CartWishlistAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get("/admin/analytics/cart-wishlist");
        if (res.success) {
          setAnalyticsData(res.analytics);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Wishlist & Cart Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Insights on customer intent and abandoned carts</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Wishlists</p>
            <h3 className="text-3xl font-bold text-slate-800">{analyticsData.totals.wishlists}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Carts</p>
            <h3 className="text-3xl font-bold text-slate-800">{analyticsData.totals.carts}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Wishlist Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-slate-800 font-semibold">
            <TrendingUp className="w-5 h-5 text-rose-500" /> Most Wishlisted Products
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-right">Added By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyticsData.topWishlistProducts.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="px-5 py-8 text-center text-slate-500">No data available</td>
                  </tr>
                ) : (
                  analyticsData.topWishlistProducts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.images?.[0]?.url ? (
                            <img src={item.images[0].url} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{item.name}</span>
                            <span className="text-xs text-slate-500">INR {item.price}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-rose-600">
                        {item.count} <span className="text-xs font-normal text-slate-500">users</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Cart Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-slate-800 font-semibold">
            <TrendingUp className="w-5 h-5 text-blue-500" /> Top Products in Carts
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3 text-center">In Carts</th>
                  <th className="px-5 py-3 text-right">Total Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analyticsData.topCartProducts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-8 text-center text-slate-500">No data available</td>
                  </tr>
                ) : (
                  analyticsData.topCartProducts.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.images?.[0]?.url ? (
                            <img src={item.images[0].url} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{item.name}</span>
                            <span className="text-xs text-slate-500">INR {item.price}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-blue-600">
                        {item.count}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-700">
                        {item.totalQuantity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
