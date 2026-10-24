"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/apiClient";
import {
  Package,
  Search,
  Calendar,
  Truck,
  FileText,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  CheckCircle2,
  Clock,
  RotateCcw,
  MapPin,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import dayjs from "dayjs";
import { useDispatch, addToCart, triggerToast } from "@/lib/redux/store";
import { WHATSAPP_NUMBER } from "@/lib/constants";

export default function AccountOrdersPage() {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "active" | "delivered" | "cancelled"
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/orders/my-orders");
      if (res.success && Array.isArray(res.orders)) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      setError(err.message || "Failed to load orders. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrderNumber = (e, orderNumber) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    dispatch(triggerToast(`Copied Order #${orderNumber} to clipboard`, "info"));
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadInvoice = (e, orderId, orderNumber) => {
    e.preventDefault();
    e.stopPropagation();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    window.open(`${apiUrl}/orders/${orderId}/invoice`, "_blank");
    dispatch(triggerToast(`Downloading Tax Invoice for #${orderNumber}`, "success"));
  };

  const handleReorderItem = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setReorderingId(item.product?._id || item.product || item.name);
      await dispatch(
        addToCart({
          product: {
            _id: item.product?._id || item.product,
            id: item.product?._id || item.product,
            name: item.name,
            price: item.finalPrice || item.price,
            images: item.image ? [item.image] : [],
            stock: 99,
          },
          variantId: item.variantId || null,
          variantLabel: item.variantLabel || "",
          quantity: 1,
        })
      );
      dispatch(triggerToast(`Added '${item.name}' back to your cart!`, "success"));
    } catch (err) {
      dispatch(triggerToast(err.message || "Could not reorder item", "error"));
    } finally {
      setReorderingId(null);
    }
  };

  // Status mapping helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
      case "completed":
        return {
          label: "Delivered",
          classes: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CheckCircle2,
        };
      case "out_for_delivery":
        return {
          label: "Out For Delivery",
          classes: "bg-teal-100 text-teal-800 border-teal-200 animate-pulse",
          icon: Truck,
        };
      case "shipped":
        return {
          label: "Dispatched & In Transit",
          classes: "bg-indigo-100 text-indigo-800 border-indigo-200",
          icon: Truck,
        };
      case "processing":
      case "ready_to_ship":
        return {
          label: "Packing & Preparing",
          classes: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
        };
      case "confirmed":
        return {
          label: "Order Confirmed",
          classes: "bg-amber-100 text-amber-800 border-amber-200",
          icon: CheckCircle2,
        };
      case "cancelled":
      case "payment_failed":
        return {
          label: status.replace(/_/g, " "),
          classes: "bg-rose-100 text-rose-800 border-rose-200",
          icon: AlertCircle,
        };
      case "return_requested":
      case "return_approved":
      case "returned":
      case "refunded":
        return {
          label: status.replace(/_/g, " "),
          classes: "bg-purple-100 text-purple-800 border-purple-200",
          icon: RotateCcw,
        };
      default:
        return {
          label: (status || "Pending").replace(/_/g, " "),
          classes: "bg-slate-100 text-slate-800 border-slate-200",
          icon: Clock,
        };
    }
  };

  // Tab filtering & search
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === "active") {
        const activeStatuses = [
          "confirmed",
          "processing",
          "ready_to_ship",
          "shipped",
          "out_for_delivery",
        ];
        if (!activeStatuses.includes(order.status)) return false;
      } else if (activeTab === "delivered") {
        if (!["delivered", "completed"].includes(order.status)) return false;
      } else if (activeTab === "cancelled") {
        const cancelledStatuses = [
          "cancelled",
          "payment_failed",
          "return_requested",
          "return_approved",
          "returned",
          "refunded",
        ];
        if (!cancelledStatuses.includes(order.status)) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = (order.orderNumber || "").toLowerCase().includes(q);
        const matchesAwb = (order.shipping?.awbCode || "").toLowerCase().includes(q);
        const matchesItem = (order.items || []).some((item) =>
          (item.name || "").toLowerCase().includes(q)
        );
        return matchesNum || matchesAwb || matchesItem;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 md:space-y-8 md:py-10">
      {/* Top Breadcrumb & Title Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-ink-soft mb-1">
            <Link href="/account" className="hover:text-accent transition-colors">
              Account
            </Link>
            <span>/</span>
            <span className="font-semibold text-ink">My Orders</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl flex items-center gap-2">
              <Package className="h-7 w-7 text-accent" />
              <span>My Orders</span>
            </h1>
            {!loading && orders.length > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-xs font-bold border border-amber-200">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            )}
          </div>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink shadow-2xs hover:border-accent hover:text-accent transition-all shrink-0"
        >
          <ShoppingBag size={14} className="text-accent" />
          <span>Explore Offerings</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line/80 bg-surface p-3 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Orders" },
            { id: "active", label: "In Transit / Active" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled / Returned" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-accent text-surface shadow-xs"
                  : "text-ink-soft hover:bg-bg hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order # or product..."
            className="w-full rounded-xl border border-line bg-bg pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/70 focus:border-accent focus:bg-surface focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-3xl border border-line bg-surface p-6 shadow-xs space-y-4 animate-pulse"
            >
              <div className="flex justify-between border-b border-line/60 pb-4">
                <div className="h-5 w-40 bg-line/60 rounded" />
                <div className="h-5 w-24 bg-line/60 rounded" />
              </div>
              <div className="h-16 bg-line/30 rounded-2xl" />
              <div className="flex justify-between pt-2">
                <div className="h-8 w-28 bg-line/60 rounded-xl" />
                <div className="h-8 w-32 bg-line/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Unable to load orders</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State: No Orders in Account */}
      {!loading && !error && orders.length === 0 && (
        <div className="rounded-3xl border border-line bg-gradient-to-b from-[#fffdf8] to-[#fbf7ed] p-10 sm:p-16 text-center space-y-5 shadow-xs">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100/80 text-amber-800 border border-amber-200/80 shadow-xs">
            <Package size={36} className="text-accent" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
              No Orders Found Yet
            </h3>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              You haven't placed any orders with Brundavanam Goshala yet. Experience authentic A2 Gir Cow Bilona Ghee and pure Vedic wellness prepared with devotion.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-xs sm:text-sm font-bold text-surface shadow-md shadow-accent/20 hover:bg-accent-deep transition-all"
            >
              <Sparkles size={16} />
              <span>Explore Sacred Offerings</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty Filter State: Search / Tab returned 0 */}
      {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
        <div className="rounded-3xl border border-line bg-surface p-10 text-center space-y-4">
          <p className="text-sm font-semibold text-ink">No orders match your current filter.</p>
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSearchQuery("");
            }}
            className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-accent hover:bg-bg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;
            const hasAwb = Boolean(order.shipping?.awbCode);
            const edd = order.shipping?.etd || order.shipping?.estimatedDelivery;

            return (
              <div
                key={order._id}
                className="group overflow-hidden rounded-3xl border border-line/90 bg-surface shadow-xs hover:border-accent/40 hover:shadow-md transition-all duration-200"
              >
                {/* 1. Order Card Header */}
                <div className="border-b border-line/80 bg-[#fbf7ed]/60 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      {/* Order Number with Copy */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-ink">
                          #{order.orderNumber}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyOrderNumber(e, order.orderNumber)}
                          title="Copy Order Number"
                          className="rounded-md p-1 text-ink-soft hover:bg-amber-100/80 hover:text-ink transition-colors cursor-pointer"
                        >
                          {copiedId === order.orderNumber ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>

                      <span className="text-xs text-ink-soft/50">•</span>

                      {/* Date */}
                      <span className="text-xs text-ink-soft flex items-center gap-1">
                        <Calendar size={13} className="text-accent" />
                        <span>{dayjs(order.createdAt).format("DD MMM YYYY, hh:mm A")}</span>
                      </span>

                      <span className="text-xs text-ink-soft/50">•</span>

                      {/* Price */}
                      <span className="text-xs font-bold text-ink">
                        Grand Total:{" "}
                        <strong className="text-sm font-black text-accent-deep">
                          ₹{Number(order.pricing?.grandTotal || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </strong>
                      </span>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${badge.classes}`}
                      >
                        <BadgeIcon size={13} />
                        <span>{badge.label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Live Tracking / Estimated Delivery Banner */}
                {(hasAwb || edd || order.shipping?.currentStatus) && (
                  <div className="border-b border-line/60 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-amber-50/30 px-4 py-3 sm:px-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 font-semibold text-slate-800">
                          <Truck size={15} className="text-emerald-600 shrink-0" />
                          <span>{order.shipping?.courierName || "Shiprocket Express"}</span>
                          {hasAwb && (
                            <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-slate-700">
                              AWB: {order.shipping.awbCode}
                            </span>
                          )}
                        </div>

                        {order.shipping?.currentStatus && (
                          <span className="text-slate-600 text-[11px]">
                            • Status:{" "}
                            <strong className="text-slate-900 capitalize">
                              {order.shipping.currentStatus}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* Prominent Estimated Delivery Date */}
                      {edd && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/80 px-2.5 py-1 text-emerald-900 font-bold border border-emerald-200 text-[11px] sm:text-xs">
                          <Calendar size={13} className="text-emerald-700" />
                          <span>Estimated Delivery: {edd}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Items Ordered List */}
                <div className="p-4 sm:p-6 divide-y divide-line/40">
                  {(order.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Thumbnail */}
                        <div className="h-16 w-16 rounded-xl border border-line bg-[#f8f4eb] overflow-hidden shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-ink-soft">
                              <Package size={22} />
                            </div>
                          )}
                        </div>

                        {/* Title & Variant Info */}
                        <div className="min-w-0 space-y-0.5">
                          <h4 className="font-display text-sm font-bold text-ink hover:text-accent transition-colors truncate max-w-sm sm:max-w-md">
                            {item.name}
                          </h4>
                          {item.variantLabel && (
                            <p className="text-[11px] font-medium text-ink-soft">
                              Pack: {item.variantLabel}
                            </p>
                          )}
                          <p className="text-xs text-ink-soft">
                            Qty: <strong className="text-ink font-bold">{item.quantity}</strong> × ₹
                            {(Number(item.finalPrice || item.price) || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>

                      {/* Subtotal & Buy Again action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0">
                        <span className="font-extrabold text-sm text-ink sm:text-right">
                          ₹{(Number(item.subtotal) || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleReorderItem(e, item)}
                          disabled={reorderingId === (item.product?._id || item.product || item.name)}
                          className="rounded-lg border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-accent hover:border-accent hover:bg-amber-50/50 transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <ShoppingBag size={12} />
                          <span>Buy Again</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Delivery Destination & Footer Actions Bar */}
                <div className="border-t border-line/70 bg-[#faf6ed]/40 px-4 py-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Destination Address */}
                  {order.shippingAddress && (
                    <div className="flex items-center gap-1.5 text-ink-soft truncate max-w-md">
                      <MapPin size={13} className="text-accent shrink-0" />
                      <span className="truncate">
                        Deliver to: <strong className="text-ink">{order.shippingAddress.fullName}</strong>,{" "}
                        {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {/* Direct WhatsApp Support */}
                    <a
                      href={`https://wa.me/919492602499?text=${encodeURIComponent(
                        `Namaste Brundavanam Team, I have an inquiry regarding my Order #${order.orderNumber}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                    >
                      <MessageCircle size={13} className="text-emerald-600" />
                      <span>Order Help</span>
                    </a>

                    {/* Tax Invoice */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadInvoice(e, order._id, order.orderNumber)}
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-3 py-1.5 font-bold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileText size={13} className="text-slate-600" />
                      <span>Invoice</span>
                    </button>

                    {/* Full Order Detail */}
                    <Link
                      href={`/account/orders/${order._id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-accent px-3.5 py-1.5 font-bold text-surface hover:bg-accent-deep transition-all shadow-2xs"
                    >
                      <span>View Order</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
