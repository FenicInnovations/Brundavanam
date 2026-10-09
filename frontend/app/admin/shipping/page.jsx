"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Truck, MapPin, ExternalLink, RefreshCw, ChevronLeft, ChevronRight, PackageSearch, Printer, Receipt } from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";

export default function AdminShippingPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const fetchShipments = useCallback(
    async (page = 1, search = "", status = "") => {
      setLoading(true);
      setError("");
      try {
        const params = { page, limit: pagination.limit };
        if (search) params.search = search;
        if (status) params.status = status;
        const res = await apiClient.get("/admin/orders", params);
        if (res.success) {
          setOrders(Array.isArray(res.orders) ? res.orders : []);
          setPagination(res.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
        } else {
          setError(res.message || "Failed to load shipments");
        }
      } catch (err) {
        console.error("Failed to fetch shipments:", err.message);
        setError(err.message || "Failed to fetch shipments");
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchShipments(pagination.page, searchTerm, statusFilter);
  }, [fetchShipments, pagination.page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShipments(1, searchTerm, statusFilter);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((p) => ({ ...p, page: newPage }));
    }
  };

  const handleSyncTracking = async (id) => {
    try {
      const res = await apiClient.get(`/admin/orders/${id}/track`);
      setOrders((prev) => prev.map((o) => (o._id === id ? res.order || o : o)));
    } catch (err) {
      console.error("Sync failed:", err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Shipping Management</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage active shipments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by AWB or Order No..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            />
          </form>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            >
              <option value="">All Orders &amp; Consignments</option>
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="shipped">Shipped</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="return_requested">Return Requested</option>
              <option value="return_pickup_scheduled">Return Pickup Scheduled</option>
              <option value="returned">Returned / Restocked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Shipment Details</th>
                <th className="px-6 py-4">Destination / Pickup</th>
                <th className="px-6 py-4">Courier / AWB</th>
                <th className="px-6 py-4">Live Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading shipments...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <PackageSearch className="w-8 h-8 text-slate-300" />
                      <p>No active shipments found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isReturn = order.returnRequest && order.returnRequest.status && order.returnRequest.status !== "none";
                  const awb = isReturn ? (order.returnRequest?.returnAwbCode || order.shipping?.awbCode) : order.shipping?.awbCode;
                  const courierName = isReturn ? (order.returnRequest?.returnCourierName || "Shiprocket Reverse") : (order.shipping?.courierName || "Shiprocket");
                  const trackingUrl = isReturn ? (order.returnRequest?.returnTrackingUrl || order.shipping?.trackingUrl) : order.shipping?.trackingUrl;
                  const shippingAddress = order.shippingAddress || {};

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/admin/orders/${order._id}`} className="font-semibold text-emerald-600 hover:underline">
                              Order #{order.orderNumber || order._id.slice(-6)}
                            </Link>
                            {isReturn && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-rose-100 text-rose-800">
                                Return
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 capitalize mt-0.5">
                            {order.status ? order.status.replace(/_/g, " ") : "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col max-w-[200px]">
                            <span className="font-medium text-slate-700 truncate" title={shippingAddress.fullName || "Customer"}>
                              {shippingAddress.fullName || order.user?.name || "Customer"}
                            </span>
                            <span className="text-xs text-slate-500 truncate" title={shippingAddress.city ? `${shippingAddress.city}, ${shippingAddress.state || ""}` : "No address"}>
                              {shippingAddress.city ? `${shippingAddress.city}, ${shippingAddress.state || ""}` : "Address pending"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {awb ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{courierName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono w-fit mt-1 border ${
                              isReturn ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 text-indigo-600 border-indigo-100"
                            }`}>
                              {awb}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {isReturn ? "Pickup Pending" : "Not Dispatched"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {isReturn ? `Return: ${order.returnRequest?.status ? order.returnRequest.status.replace(/_/g, " ") : "Requested"}` : (order.shipping?.currentStatus || "N/A")}
                          </span>
                          {order.shipping?.statusUpdatedAt && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(order.shipping.statusUpdatedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                            window.open(`${apiUrl}/admin/orders/${order._id}/invoice`, "_blank");
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          title="Download & Print Tax Invoice"
                        >
                          <Receipt className="w-4 h-4 text-amber-600" />
                        </button>
                        {(order.shipping?.awbCode || order.returnRequest?.returnAwbCode) && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
                                if (order.shipping?.labelUrl && order.shipping.labelUrl.startsWith("http")) {
                                  window.open(order.shipping.labelUrl, "_blank");
                                } else {
                                  window.open(`${apiUrl}/admin/orders/${order._id}/label`, "_blank");
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Print Shipping Label (AWB Barcode Slip)"
                            >
                              <Printer className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => handleSyncTracking(order._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Sync Tracking"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            {trackingUrl && (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Track on Courier site"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>

        {!loading && orders.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} shipments
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
