"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, PackageCheck, Receipt, MapPin } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Chandigarh",
  "Puducherry",
];

const STATUS_COLORS = {
  pending_payment: "bg-amber-100 text-amber-800",
  payment_failed: "bg-rose-100 text-rose-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  processing: "bg-blue-100 text-blue-800",
  ready_to_ship: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  out_for_delivery: "bg-teal-100 text-teal-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-100 text-slate-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-slate-100 text-slate-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchOrders = useCallback(
    async (page = 1, search = "", status = "", state = "") => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: pagination.limit };
        if (search) params.search = search;
        if (status) params.status = status;
        if (state) params.state = state;
        const res = await apiClient.get("/admin/orders", params);
        if (res.success) {
          setOrders(res.orders);
          setPagination(res.pagination);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchOrders(pagination.page, searchTerm, statusFilter, stateFilter);
  }, [fetchOrders, pagination.page, statusFilter, stateFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1, searchTerm, statusFilter, stateFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((p) => ({ ...p, page: newPage }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Order Management</h1>
          <p className="text-sm text-slate-500 mt-1">View and manage all customer orders</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order No, Customer, Phone or AWB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </form>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="relative flex-1 md:w-44">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="ready_to_ship">Ready to Ship</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="relative flex-1 md:w-44">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">All States / UTs</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Order Details</th>
                <th className="px-6 py-4">Customer &amp; State</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading orders...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <PackageCheck className="w-8 h-8 text-slate-300" />
                      <p>No orders found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{order.orderNumber}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{order.shippingAddress?.fullName}</span>
                          {(order.isGuest || !order.user) && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-extrabold uppercase">
                              Guest
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{order.shippingAddress?.phone}</span>
                        <span className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                          {order.shippingAddress?.city ? `${order.shippingAddress.city}, ` : ""}{order.shippingAddress?.state || "State pending"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize tracking-wide ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-800"}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                        {order.shipping?.awbCode && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                            AWB: {order.shipping.awbCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">
                          INR {order.pricing.grandTotal.toFixed(2)}
                        </span>
                        <span className={`text-[10px] font-medium uppercase ${
                          order.payment.status === "captured" ? "text-emerald-600" :
                          order.payment.status === "failed" ? "text-rose-600" :
                          order.payment.status === "refunded" ? "text-slate-500" : "text-amber-600"
                        }`}>
                          {order.payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/admin/orders/${order._id}/invoice`,
                              "_blank"
                            )
                          }
                          title="Download & Print Tax Invoice"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-xs font-medium shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Invoice
                        </button>
                        <Link
                          href={`/admin/orders/${order._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-colors text-xs font-medium shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && orders.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[2rem] text-center">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
