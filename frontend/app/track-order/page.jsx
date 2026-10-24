"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/apiClient";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  Calendar,
  CreditCard,
  UserCheck,
  X,
} from "lucide-react";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get("orderNumber") || searchParams.get("orderId") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialPhone = searchParams.get("phone") || "";
  const isJustPlaced = searchParams.get("placed") === "true";

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [verificationInput, setVerificationInput] = useState(initialEmail || initialPhone);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSignInModal, setShowSignInModal] = useState(false);

  // Auto-search if query params exist
  useEffect(() => {
    if (initialOrderNumber && (initialEmail || initialPhone)) {
      handleTrack(initialOrderNumber, initialEmail || initialPhone);
    }
  }, [initialOrderNumber, initialEmail, initialPhone]);

  const handleTrack = async (numToSearch, verifyVal) => {
    const searchNum = (numToSearch || orderNumber).trim();
    const searchVerify = (verifyVal || verificationInput).trim();

    if (!searchNum) {
      setError("Please enter your Order Number (e.g. BG-20261021-1234).");
      return;
    }

    if (!searchVerify) {
      setError("Please enter the Email Address or Phone Number used for this order.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const isEmail = searchVerify.includes("@");
      const params = {
        orderNumber: searchNum,
        ...(isEmail ? { email: searchVerify } : { phone: searchVerify }),
      };

      const res = await apiClient.get("/orders/track", params);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.message || "Order not found. Please check your order details.");
      }
    } catch (err) {
      setError(
        err.message || "Unable to find this order. Please verify your order number and email/phone."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTrack();
  };

  const getStepStatus = (stepName) => {
    if (!order) return "upcoming";
    const statusOrder = [
      "pending_payment",
      "confirmed",
      "processing",
      "ready_to_ship",
      "shipped",
      "out_for_delivery",
      "delivered",
    ];

    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepName);

    if (order.status === "cancelled" || order.status === "payment_failed") {
      return "failed";
    }

    if (currentIdx >= stepIdx) {
      return "completed";
    }
    return "upcoming";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* TOP BANNER: Sign-in Member Benefits Notice */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">Sign in for Full Tracking &amp; Member Benefits</h3>
                  <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-amber-100/90 leading-relaxed max-w-xl">
                  Sign in or create a free account with your email to automatically track all current &amp; past shipments in one dashboard, download tax invoices, save addresses, and earn sacred devotee rewards!
                </p>
              </div>
            </div>
            <Link
              href={`/login?redirect=/track-order${order ? `?orderNumber=${order.orderNumber}` : ""}`}
              className="w-full sm:w-auto text-center shrink-0 px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <span>Sign In / Register</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Freshly Placed Order Confirmation Banner */}
        {isJustPlaced && (
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-emerald-950">
                🎉 Order Placed &amp; Payment Confirmed!
              </h2>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Thank you for your devotion and support. Your order has been securely processed. We have dispatched a confirmation email with all details to your address.
              </p>
            </div>
          </div>
        )}

        {/* Header & Search Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Track Your Shipment
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track live delivery status, courier AWB details, and dispatch progress without needing to login.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Order ID / Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. BG-20261021-1234"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full pl-3.5 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email Address or Phone *
              </label>
              <input
                type="text"
                required
                placeholder="Email or 10-digit mobile"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="sm:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/10 transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching…</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Track</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ORDER DETAILS CARD */}
        {order && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Order Highlights */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900">
                      #{order.orderNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize bg-emerald-100 text-emerald-800">
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-xs text-slate-500 block">Total Amount Paid</span>
                  <span className="text-xl font-black text-emerald-700">
                    ₹{order.pricing?.grandTotal?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Courier Shipment Details Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {order.shipping?.courierName || "Shiprocket Express"}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Courier: {order.shipping?.provider?.toUpperCase() || "SHIPROCKET"}
                      </p>
                    </div>
                  </div>

                  {order.shipping?.awbCode ? (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-slate-800">
                        AWB: {order.shipping.awbCode}
                      </span>
                      {order.shipping?.trackingUrl && (
                        <a
                          href={order.shipping.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <span>Live Tracking</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      Tracking code will be assigned upon dispatch
                    </span>
                  )}
                </div>

                {(order.shipping?.etd || order.shipping?.estimatedDelivery) && (
                  <div className="flex items-center gap-2 text-xs text-emerald-900 bg-white/80 px-3 py-2 rounded-xl border border-emerald-200 font-medium">
                    <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Estimated Delivery Date:{" "}
                      <strong className="text-emerald-800 font-bold">
                        {order.shipping.etd || order.shipping.estimatedDelivery}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Milestones */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                  Shipment Progress
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  {[
                    { label: "Order Placed", step: "confirmed" },
                    { label: "Processing", step: "processing" },
                    { label: "Dispatched", step: "shipped" },
                    { label: "Delivered", step: "delivered" },
                  ].map((m) => {
                    const status = getStepStatus(m.step);
                    const isDone = status === "completed";
                    return (
                      <div
                        key={m.label}
                        className={`p-3 rounded-2xl border transition-all ${
                          isDone
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 mx-auto mb-1.5 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isDone ? "✓" : "•"}
                        </div>
                        <span className="text-xs font-bold block">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Address & Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Delivery Address */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Delivery Destination
                </h3>
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    {order.shippingAddress?.fullName}
                  </p>
                  <p className="text-slate-500 font-medium">
                    Phone: +91 {order.shippingAddress?.phone}
                  </p>
                  <p>{order.shippingAddress?.line1}</p>
                  {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p className="font-semibold text-slate-900">
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} –{" "}
                    <span className="font-bold text-emerald-800">
                      {order.shippingAddress?.postalCode}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payment Summary
                </h3>
                <div className="text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Products Subtotal</span>
                    <span className="font-bold text-slate-900">
                      ₹{order.pricing?.itemsTotal?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className="font-bold text-slate-900">
                      {order.pricing?.shippingFee > 0
                        ? `₹${order.pricing.shippingFee.toFixed(2)}`
                        : "FREE"}
                    </span>
                  </div>
                  {order.pricing?.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span>-₹{order.pricing.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-extrabold text-slate-900">
                    <span>Total Paid</span>
                    <span className="text-emerald-700">
                      ₹{order.pricing?.grandTotal?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ordered Items List */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                Ordered Products ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div key={item._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-slate-200 overflow-hidden shrink-0">
                      <img
                        src={item.image || "/logo.png"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/logo.png";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      {item.variantLabel && (
                        <p className="text-[10px] text-slate-500 font-medium">
                          Variant: {item.variantLabel}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} × ₹{item.finalPrice?.toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">
                      ₹{item.subtotal?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
