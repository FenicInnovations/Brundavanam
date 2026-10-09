"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Package, Truck, Receipt, CheckCircle2, 
  XCircle, Clock, MapPin, Phone, Mail, FileText, Settings2, ShieldAlert, AlertCircle, RotateCcw, Printer
} from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import ConfirmModal from "@/components/admin/ConfirmModal";

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
  return_requested: "bg-rose-100 text-rose-800",
  return_approved: "bg-amber-100 text-amber-800",
  return_pickup_scheduled: "bg-indigo-100 text-indigo-800",
  returned: "bg-orange-100 text-orange-800",
  refunded: "bg-slate-100 text-slate-800",
};

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Return actions state
  const [approveReturnModalOpen, setApproveReturnModalOpen] = useState(false);
  const [rejectReturnModalOpen, setRejectReturnModalOpen] = useState(false);
  const [receiveReturnModalOpen, setReceiveReturnModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [receiveRefundInput, setReceiveRefundInput] = useState("");
  const [restockInventoryCheck, setRestockInventoryCheck] = useState(true);
  
  const [processing, setProcessing] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await apiClient.get(`/admin/orders/${id}`);
      if (res.success) {
        setOrder(res.order);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err.message);
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  const handleDownloadInvoice = () => {
    window.open(`${apiUrl}/admin/orders/${id}/invoice`, "_blank");
  };

  const handlePrintLabel = () => {
    if (order?.shipping?.labelUrl && order.shipping.labelUrl.startsWith("http")) {
      window.open(order.shipping.labelUrl, "_blank");
    } else {
      window.open(`${apiUrl}/admin/orders/${id}/label`, "_blank");
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setProcessing(true);
    try {
      const res = await apiClient.patch(`/admin/orders/${id}/status`, { status: newStatus });
      setOrder(res.order);
      setStatusModalOpen(false);
    } catch (err) {
      console.error("Status update failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateShipment = async () => {
    setProcessing(true);
    try {
      const res = await apiClient.post(`/admin/orders/${id}/ship`);
      setOrder(res.order);
    } catch (err) {
      console.error("Shipment creation failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleTrackShipment = async () => {
    setProcessing(true);
    try {
      const res = await apiClient.get(`/admin/orders/${id}/track`);
      setOrder(res.order);
    } catch (err) {
      console.error("Tracking sync failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleIssueRefund = async () => {
    setProcessing(true);
    try {
      const res = await apiClient.post(`/admin/orders/${id}/refund`, {
        amount: Number(refundAmount) || undefined,
        reason: refundReason,
      });
      setOrder(res.order);
      setRefundModalOpen(false);
    } catch (err) {
      console.error("Refund failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveReturn = async () => {
    setProcessing(true);
    try {
      const res = await apiClient.post(`/admin/orders/${id}/return/approve`);
      setOrder(res.order);
      setApproveReturnModalOpen(false);
    } catch (err) {
      console.error("Return approval failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReturn = async () => {
    setProcessing(true);
    try {
      const res = await apiClient.post(`/admin/orders/${id}/return/reject`, {
        reason: rejectionReasonInput,
      });
      setOrder(res.order);
      setRejectReturnModalOpen(false);
    } catch (err) {
      console.error("Return rejection failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReturnReceived = async () => {
    setProcessing(true);
    try {
      const res = await apiClient.post(`/admin/orders/${id}/return/receive`, {
        refundAmount: Number(receiveRefundInput) || undefined,
        restockInventory: restockInventoryCheck,
      });
      setOrder(res.order);
      setReceiveReturnModalOpen(false);
    } catch (err) {
      console.error("Return receipt failed:", err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              Order {order.orderNumber}
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize tracking-wide ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-800"}`}>
                {order.status.replace(/_/g, " ")}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm"
          >
            <Receipt className="w-4 h-4 text-emerald-600" /> Download Tax Invoice
          </button>
          <button
            onClick={() => setStatusModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm shadow-sm shadow-emerald-600/20"
          >
            <Settings2 className="w-4 h-4" /> Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-slate-800 font-semibold">
              <Package className="w-5 h-5 text-emerald-600" /> Order Items ({order.items.length})
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3 text-right">Price</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-slate-400" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-slate-800 truncate">{item.name}</span>
                            {item.variantLabel && (
                              <span className="text-xs text-slate-500">{item.variantLabel}</span>
                            )}
                            <span className="text-[10px] text-slate-400">HSN: {item.hsnCode} | GST: {item.gstRate}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-medium">{item.quantity}</td>
                      <td className="px-5 py-4 text-right text-slate-600">INR {item.finalPrice.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-slate-800">INR {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totals */}
            <div className="bg-slate-50 p-5 border-t border-slate-200">
              <div className="w-full max-w-xs ml-auto space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>INR {order.pricing.itemsTotal.toFixed(2)}</span>
                </div>
                {order.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount {order.pricing.couponCode ? `(${order.pricing.couponCode})` : ""}</span>
                    <span>- INR {order.pricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax (Included)</span>
                  <span>INR {order.pricing.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping Fee</span>
                  <span>{order.pricing.shippingFee > 0 ? `INR ${order.pricing.shippingFee.toFixed(2)}` : "Free"}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800 text-base">
                  <span>Grand Total</span>
                  <span>INR {order.pricing.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline / Status History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 text-slate-800 font-semibold">
              <Clock className="w-5 h-5 text-indigo-500" /> Order Timeline
            </div>
            <div className="p-5">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {[...order.statusHistory].reverse().map((hist, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <div className="w-2.5 h-2.5 bg-slate-400 rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 capitalize">{hist.status.replace(/_/g, " ")}</span>
                        <span className="text-xs text-slate-400">{new Date(hist.changedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">{hist.note}</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">By: {hist.changedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Info Panels */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Customer & Shipping
            </div>
            <div className="p-5 space-y-4 text-sm text-slate-700">
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1">Customer Name</span>
                <span className="font-semibold text-slate-800">{order.shippingAddress.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{order.shippingAddress.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{order.shippingAddress.email}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <span className="block text-xs font-medium text-slate-400 mb-2">Shipping Address</span>
                <p className="leading-relaxed">
                  {order.shippingAddress.line1}<br />
                  {order.shippingAddress.line2 ? <>{order.shippingAddress.line2}<br /></> : ""}
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}
                </p>
              </div>

              {order.customerNotes && (
                <div className="pt-4 border-t border-slate-100">
                  <span className="block text-xs font-medium text-slate-400 mb-2">Customer Notes</span>
                  <p className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs italic">
                    "{order.customerNotes}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-500" /> Payment & Refund
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className={`font-semibold capitalize ${
                  order.payment.status === 'captured' ? 'text-emerald-600' :
                  order.payment.status === 'failed' ? 'text-rose-600' :
                  order.payment.status === 'refunded' ? 'text-slate-500' : 'text-amber-600'
                }`}>
                  {order.payment.status}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Method</span>
                <span className="font-semibold text-slate-800 capitalize">{order.payment.provider}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Payment ID</span>
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                  {order.payment.razorpayPaymentId || "N/A"}
                </span>
              </div>

              {order.refund?.status && order.refund.status !== "none" && (
                <div className="pt-2">
                  <span className="block text-xs font-semibold text-rose-500 mb-2 uppercase tracking-wide">Refund Details</span>
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-medium">Status</span>
                      <span className="text-rose-800 font-bold capitalize">{order.refund.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-rose-700 font-medium">Amount</span>
                      <span className="text-rose-800">INR {order.refund.amount.toFixed(2)}</span>
                    </div>
                    {order.refund.razorpayRefundId && (
                      <div className="flex justify-between">
                        <span className="text-rose-700 font-medium">Refund ID</span>
                        <span className="text-rose-800 font-mono">{order.refund.razorpayRefundId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {order.payment.status === "captured" && (
                <button
                  onClick={() => setRefundModalOpen(true)}
                  className="w-full mt-2 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" /> Issue Manual Refund
                </button>
              )}
            </div>
          </div>

          {/* Fulfillment / Shipping Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-500" /> Fulfillment
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Shipping Partner</span>
                <span className="font-semibold text-slate-800 capitalize">{order.shipping?.provider || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">Courier Name</span>
                <span className="font-semibold text-slate-800">{order.shipping?.courierName || "Pending"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="text-slate-500">AWB Tracking</span>
                {order.shipping?.awbCode ? (
                  <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {order.shipping.awbCode}
                  </span>
                ) : (
                  <span className="text-slate-400">Not Assigned</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Current Status</span>
                <span className="font-medium text-slate-800">{order.shipping?.currentStatus}</span>
              </div>

              <div className="pt-4 grid gap-2">
                {!order.shipping?.awbCode ? (
                  <button
                    onClick={handleCreateShipment}
                    disabled={processing || !['confirmed', 'processing'].includes(order.status)}
                    className="w-full py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    Create Shiprocket Shipment
                  </button>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={handlePrintLabel}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                      >
                        <Printer className="w-4 h-4" /> Print Shipping Label
                      </button>
                      <button
                        onClick={handleDownloadInvoice}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors"
                      >
                        <Receipt className="w-4 h-4 text-emerald-600" /> Print Tax Invoice
                      </button>
                    </div>

                    <button
                      onClick={handleTrackShipment}
                      disabled={processing}
                      className="w-full py-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl font-medium text-xs transition-colors"
                    >
                      Sync Live Tracking
                    </button>
                    {order.shipping.trackingUrl && (
                      <a
                        href={order.shipping.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl font-medium text-xs transition-colors"
                      >
                        Track on Courier Site &rarr;
                      </a>
                    )}

                    {/* Warehouse Packaging Instruction Box */}
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1 text-amber-950">
                        📦 Dispatch Checklist:
                      </p>
                      <p>
                        1. <strong>Shipping Label (AWB Slip):</strong> Stick securely onto the outside of the box so the courier agent can scan the barcode.
                      </p>
                      <p>
                        2. <strong>Tax Invoice:</strong> Place inside the box or insert into a clear invoice pouch attached to the parcel.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Return Logistics & Management Card */}
          {order.returnRequest && order.returnRequest.status !== "none" && (
            <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
              <div className="p-4 border-b border-rose-100 bg-rose-50/60 font-semibold text-rose-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" /> Return Logistics
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  {order.returnRequest.status.replace(/_/g, " ")}
                </span>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-medium block mb-0.5">Return Reason</span>
                  <span className="font-semibold text-slate-800 text-sm block">{order.returnRequest.reason}</span>
                  {order.returnRequest.comments && (
                    <p className="text-xs text-slate-600 mt-1 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      "{order.returnRequest.comments}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-medium block mb-1">Pickup Address</span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {order.returnRequest.pickupAddress?.fullName || order.shippingAddress.fullName} · {order.returnRequest.pickupAddress?.phone || order.shippingAddress.phone}<br />
                    {order.returnRequest.pickupAddress?.line1 || order.shippingAddress.line1}, {order.returnRequest.pickupAddress?.city || order.shippingAddress.city} - {order.returnRequest.pickupAddress?.postalCode || order.shippingAddress.postalCode}
                  </p>
                </div>

                {order.returnRequest.returnAwbCode && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-medium block mb-1">Reverse Courier Partner</span>
                    <span className="font-semibold text-slate-800 text-xs block">
                      {order.returnRequest.returnCourierName || "Shiprocket Reverse Logistics"}
                    </span>
                    <span className="inline-block mt-1 font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                      AWB: {order.returnRequest.returnAwbCode}
                    </span>
                    {order.returnRequest.returnTrackingUrl && (
                      <a
                        href={order.returnRequest.returnTrackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 font-semibold hover:underline block mt-1.5"
                      >
                        Track Return Parcel &rarr;
                      </a>
                    )}
                  </div>
                )}

                {order.returnRequest.status === "requested" && (
                  <div className="pt-3 border-t border-slate-100 grid gap-2">
                    <button
                      onClick={() => setApproveReturnModalOpen(true)}
                      disabled={processing}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
                    >
                      Schedule Shiprocket Reverse Pickup
                    </button>
                    <button
                      onClick={() => setRejectReturnModalOpen(true)}
                      disabled={processing}
                      className="w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-xs transition-colors"
                    >
                      Decline Return Request
                    </button>
                  </div>
                )}

                {["pickup_scheduled", "approved"].includes(order.returnRequest.status) && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setReceiveRefundInput(String(order.pricing.grandTotal));
                        setReceiveReturnModalOpen(true);
                      }}
                      disabled={processing}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Return Received &amp; Issue Refund
                    </button>
                  </div>
                )}

                {order.returnRequest.status === "received" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                    ✓ Return parcel confirmed at Goshala warehouse. Stock restocked &amp; refund issued.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleUpdateStatus}
        title="Update Order Status"
        confirmText="Update Status"
        isDestructive={false}
      >
        <div className="space-y-4 my-2">
          <p className="text-sm text-slate-500">
            Manually update the status of this order. Be careful, as this may trigger automated emails to the customer.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-sm"
            >
              <option value="">Select Status</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        onConfirm={handleIssueRefund}
        title="Issue Refund"
        confirmText="Process Refund"
        isDestructive={true}
      >
        <div className="space-y-4 my-2">
          <div className="bg-amber-50 p-3 rounded-lg flex gap-3 text-amber-800 text-sm mb-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>This action will process a real refund via Razorpay to the customer's original payment method.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Refund Amount (INR)</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={`Max: ${order.pricing.grandTotal}`}
              max={order.pricing.grandTotal}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Leave blank for full refund.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason (Optional)</label>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation"
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>
      </ConfirmModal>

      {/* Approve Return Modal */}
      <ConfirmModal
        isOpen={approveReturnModalOpen}
        onClose={() => setApproveReturnModalOpen(false)}
        onConfirm={handleApproveReturn}
        title="Schedule Shiprocket Reverse Pickup"
        confirmText="Schedule Pickup"
        isDestructive={false}
      >
        <div className="space-y-4 my-2">
          <p className="text-sm text-slate-600">
            This will create a reverse pickup order with <strong>Shiprocket</strong> to collect the package from the customer's address:
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <strong>Pickup Contact:</strong> {order.returnRequest?.pickupAddress?.fullName || order.shippingAddress.fullName} ({order.returnRequest?.pickupAddress?.phone || order.shippingAddress.phone})<br />
            <strong>Address:</strong> {order.returnRequest?.pickupAddress?.line1 || order.shippingAddress.line1}, {order.returnRequest?.pickupAddress?.city || order.shippingAddress.city} - {order.returnRequest?.pickupAddress?.postalCode || order.shippingAddress.postalCode}
          </div>
          <p className="text-xs text-emerald-700">
            ✓ A return AWB tracking number will be assigned automatically and notified to the customer via email.
          </p>
        </div>
      </ConfirmModal>

      {/* Reject Return Modal */}
      <ConfirmModal
        isOpen={rejectReturnModalOpen}
        onClose={() => setRejectReturnModalOpen(false)}
        onConfirm={handleRejectReturn}
        title="Decline Return Request"
        confirmText="Decline Return"
        isDestructive={true}
      >
        <div className="space-y-4 my-2">
          <p className="text-sm text-slate-600">
            Provide a reason for declining this return request. The customer will be informed.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Rejection *</label>
            <textarea
              rows={3}
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              placeholder="e.g. Return window expired / Product seal was intact and non-damaged upon review"
              className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-rose-500 text-sm resize-none"
            />
          </div>
        </div>
      </ConfirmModal>

      {/* Receive Return & Refund Modal */}
      <ConfirmModal
        isOpen={receiveReturnModalOpen}
        onClose={() => setReceiveReturnModalOpen(false)}
        onConfirm={handleConfirmReturnReceived}
        title="Confirm Return Received & Issue Refund"
        confirmText="Confirm & Process Refund"
        isDestructive={false}
      >
        <div className="space-y-4 my-2">
          <div className="bg-emerald-50 p-3 rounded-lg flex gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>
              Confirm that the returned parcel has arrived at the Goshala warehouse and passed inspection.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Refund Amount (INR)</label>
            <input
              type="number"
              value={receiveRefundInput}
              onChange={(e) => setReceiveRefundInput(e.target.value)}
              placeholder={`Max: ${order.pricing.grandTotal}`}
              max={order.pricing.grandTotal}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Default is full order amount (₹{order.pricing.grandTotal}).</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="restock-check"
              checked={restockInventoryCheck}
              onChange={(e) => setRestockInventoryCheck(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="restock-check" className="text-sm font-medium text-slate-700 cursor-pointer">
              Automatically restock items back into warehouse inventory
            </label>
          </div>
        </div>
      </ConfirmModal>

    </div>
  );
}
