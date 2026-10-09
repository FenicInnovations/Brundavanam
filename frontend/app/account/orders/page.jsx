"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/apiClient";
import { Package, Loader2, MapPin } from "lucide-react";
import dayjs from "dayjs";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get("/orders/my-orders");
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-rose-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-600" />
          My Orders
        </h1>
        <Link href="/shop" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
          Continue Shopping &rarr;
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No orders yet</h3>
            <p className="text-sm text-slate-500 mt-1">You haven't placed any orders with us yet.</p>
          </div>
          <Link
            href="/shop"
            className="inline-flex px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div>
                    <span className="text-slate-500 block text-xs">Order Placed</span>
                    <span className="font-semibold text-slate-900">{dayjs(order.createdAt).format("MMM D, YYYY")}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Total</span>
                    <span className="font-semibold text-slate-900">₹{order.pricing.grandTotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Order #</span>
                    <span className="font-semibold text-slate-900">{order.orderNumber}</span>
                  </div>
                </div>
                <Link
                  href={`/account/orders/${order._id}`}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 text-xs text-center transition-colors shadow-xs"
                >
                  View Details
                </Link>
              </div>

              <div className="p-5 flex flex-col sm:flex-row gap-6 justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md ${
                      ["delivered", "completed"].includes(order.status)
                        ? "bg-emerald-100 text-emerald-800"
                        : ["cancelled", "refunded", "payment_failed"].includes(order.status)
                        ? "bg-rose-100 text-rose-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    {order.shipping?.currentStatus && (
                      <span className="text-xs font-medium text-slate-600">
                        • {order.shipping.currentStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex -space-x-2 overflow-hidden">
                    {order.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 overflow-hidden flex-shrink-0 z-10" style={{ zIndex: 10 - i }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 z-0">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-600 truncate max-w-md">
                    {order.items.map(i => i.name).join(", ")}
                  </div>
                </div>

                {order.shippingAddress && (
                  <div className="sm:w-64 flex-shrink-0 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs mb-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Ship To
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{order.shippingAddress.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{order.shippingAddress.line1}</p>
                    <p className="text-[11px] text-slate-500">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
