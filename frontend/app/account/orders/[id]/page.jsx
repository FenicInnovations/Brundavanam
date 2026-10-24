"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/apiClient";
import { 
  ArrowLeft, 
  Package, 
  MapPin, 
  Truck, 
  CreditCard, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  X
} from "lucide-react";
import dayjs from "dayjs";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Return modal state
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("Damaged or leaking packaging during transit");
  const [returnComments, setReturnComments] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnError, setReturnError] = useState("");

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await apiClient.get(`/orders/${id}`);
      if (res.success) {
        setOrder(res.order);
      }
    } catch (err) {
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/orders/${id}/invoice`, "_blank");
  };

  const handleRequestReturn = async (e) => {
    e.preventDefault();
    setReturnSubmitting(true);
    setReturnError("");
    try {
      const res = await apiClient.post(`/orders/${id}/return`, {
        reason: returnReason,
        comments: returnComments,
      });
      if (res.success) {
        setOrder(res.order);
        setReturnModalOpen(false);
      }
    } catch (err) {
      setReturnError(err.message || "Failed to submit return request");
    } finally {
      setReturnSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="text-rose-500 bg-rose-50 p-4 rounded-xl border border-rose-100">
          {error || "Order not found"}
        </div>
        <Link href="/account/orders" className="text-sm font-semibold text-emerald-600">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    if (["delivered", "completed"].includes(status)) return <CheckCircle className="w-5 h-5 text-emerald-600" />;
    if (["cancelled", "refunded", "payment_failed"].includes(status)) return <XCircle className="w-5 h-5 text-rose-500" />;
    if (["shipped", "out_for_delivery"].includes(status)) return <Truck className="w-5 h-5 text-blue-500" />;
    return <Clock className="w-5 h-5 text-amber-500" />;
  };

  const getStatusColor = (status) => {
    if (["delivered", "completed"].includes(status)) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (["cancelled", "refunded", "payment_failed"].includes(status)) return "bg-rose-100 text-rose-800 border-rose-200";
    if (["shipped", "out_for_delivery"].includes(status)) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/account/orders" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Order #{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            Placed on {dayjs(order.createdAt).format("MMMM D, YYYY [at] h:mm A")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            {order.status.replace(/_/g, " ")}
          </div>
          {["delivered", "completed"].includes(order.status) && (!order.returnRequest || ["none", "rejected"].includes(order.returnRequest.status)) && (
            <button
              onClick={() => setReturnModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors shadow-xs"
            >
              <RotateCcw className="w-4 h-4" /> Request Return
            </button>
          )}
          {["confirmed", "shipped", "delivered"].includes(order.status) && (
            <button
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" /> Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">

          {/* Return & Reverse Delivery Tracker */}
          {order.returnRequest && order.returnRequest.status !== "none" && (
            <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-rose-50 to-amber-50/50 border-b border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Return &amp; Reverse Delivery</h3>
                    <p className="text-[11px] text-slate-500">
                      Requested on {dayjs(order.returnRequest.requestedAt || order.updatedAt).format("MMM D, YYYY")}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  order.returnRequest.status === "received" || order.status === "returned"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : order.returnRequest.status === "rejected"
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {order.returnRequest.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Return Reason</span>
                    <span className="font-semibold text-slate-800 text-sm">{order.returnRequest.reason}</span>
                    {order.returnRequest.comments && (
                      <p className="text-slate-600 mt-1 italic">"{order.returnRequest.comments}"</p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reverse Courier Partner</span>
                    {order.returnRequest.returnAwbCode ? (
                      <div>
                        <span className="font-semibold text-slate-800 text-sm block">
                          {order.returnRequest.returnCourierName || "Shiprocket Reverse Logistics"}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">
                            {order.returnRequest.returnAwbCode}
                          </span>
                          {order.returnRequest.returnTrackingUrl && (
                            <a
                              href={order.returnRequest.returnTrackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 font-bold hover:underline flex items-center gap-0.5"
                            >
                              Track <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : order.returnRequest.status === "rejected" ? (
                      <span className="text-rose-600 font-medium">Return request was not approved: {order.returnRequest.rejectionReason}</span>
                    ) : (
                      <div className="text-slate-500">
                        <span className="font-medium text-amber-700">Under Review</span>
                        <p className="mt-0.5 text-[11px]">Shiprocket reverse pickup is being arranged by our team.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Refund Status if returned */}
                {order.refund?.status === "completed" && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>
                        Refund of <strong>₹{order.refund.amount?.toFixed(2)}</strong> successfully issued to your original payment method.
                      </span>
                    </div>
                    {order.refund.razorpayRefundId && (
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {order.refund.razorpayRefundId}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Items Ordered
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                    {item.variantLabel && (
                      <p className="text-xs text-slate-500">Variant: {item.variantLabel}</p>
                    )}
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 sm:text-right shrink-0">
                    ₹{item.subtotal.toFixed(2)}
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">₹{item.finalPrice} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Order Timeline
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {order.statusHistory?.map((hist, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-white bg-emerald-600 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xs z-10"></div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">{hist.status.replace(/_/g, " ")}</h4>
                      <time className="text-[10px] font-semibold text-slate-400">{dayjs(hist.changedAt).format("MMM D, HH:mm")}</time>
                    </div>
                    {hist.note && <p className="text-xs text-slate-600">{hist.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Summaries */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-900">
              Payment Summary
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>₹{order.pricing.itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax</span>
                <span>₹{order.pricing.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{order.pricing.shippingFee === 0 ? <span className="text-emerald-600 font-semibold uppercase text-xs">Free</span> : `₹${order.pricing.shippingFee.toFixed(2)}`}</span>
              </div>
              {order.pricing.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{order.pricing.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between font-extrabold text-slate-900 text-base">
                <span>Grand Total</span>
                <span>₹{order.pricing.grandTotal.toFixed(2)}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Payment Method</div>
                  <div className="text-sm font-bold text-slate-900 uppercase">
                    {order.payment.provider} • {order.payment.status}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Delivery Details
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-slate-500 font-semibold mb-1">Shipping Address</div>
                <div className="text-sm text-slate-900 font-medium">{order.shippingAddress.fullName}</div>
                <div className="text-xs text-slate-600 mt-0.5">{order.shippingAddress.phone}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {order.shippingAddress.line1}
                  {order.shippingAddress.line2 && <>, {order.shippingAddress.line2}</>}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </div>
              </div>

              {order.shipping?.awbCode && (
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold mb-2">Tracking Information</div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600 font-medium">{order.shipping.courierName || 'Courier'}</span>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{order.shipping.awbCode}</span>
                    </div>
                    {(order.shipping?.etd || order.shipping?.estimatedDelivery) && (
                      <div className="text-xs text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-medium flex items-center justify-between">
                        <span className="text-slate-600">Estimated Delivery:</span>
                        <strong className="font-bold text-emerald-900">{order.shipping.etd || order.shipping.estimatedDelivery}</strong>
                      </div>
                    )}
                    {order.shipping?.currentStatus && (
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Courier Status:</span>
                        <span className="font-semibold text-slate-800 capitalize">{order.shipping.currentStatus}</span>
                      </div>
                    )}
                    {order.shipping.trackingUrl && (
                      <a href={order.shipping.trackingUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 font-bold hover:underline block pt-1">
                        Track Live Package &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Request Order Return</h3>
              </div>
              <button
                onClick={() => setReturnModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason for Return *
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="Damaged or leaking packaging during transit">Damaged or leaking packaging during transit</option>
                  <option value="Quality or freshness issue">Quality or freshness issue</option>
                  <option value="Incorrect product received">Incorrect product received</option>
                  <option value="Expired or broken safety seal">Expired or broken safety seal</option>
                  <option value="Other concern">Other concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Additional Details / Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  placeholder="Describe the issue to help our quality & inspection team..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Pickup Address</span>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {order.shippingAddress.fullName} · {order.shippingAddress.phone}<br />
                  {order.shippingAddress.line1}, {order.shippingAddress.city} - {order.shippingAddress.postalCode}
                </p>
                <p className="text-[10px] text-emerald-700 pt-1 font-medium">
                  ✓ Reverse courier pickup will be scheduled at this doorstep address via Shiprocket.
                </p>
              </div>

              {returnError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{returnError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={returnSubmitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-rose-900/20"
                >
                  {returnSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Return Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
