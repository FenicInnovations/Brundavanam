"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Truck,
  MapPin,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Printer,
  Receipt,
  Sliders,
  Sparkles,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  HelpCircle,
  Zap,
  ShieldCheck,
  BadgePercent,
  Clock,
  IndianRupee,
  Info,
  Check,
  Globe,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "@/lib/api/apiClient";
import { useDispatch, triggerToast, shippingSliceActions } from "@/lib/redux/store";

export default function AdminShippingPage() {
  const dispatch = useDispatch();

  // Tab State: "consignments" | "settings"
  const [activeTab, setActiveTab] = useState("consignments");

  // Consignments List State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Shipping Strategy Settings State (100% Automated Shiprocket)
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settings, setSettings] = useState({
    freeShippingThreshold: 800,
    isFreeShippingEnabled: true,
    shippingDiscountOffer: 20,
    isOfferActive: true,
    offerLabel: "Goshala Delivery Subsidy",
    offerBannerText: "Special Seva Offer: Flat ₹20 Delivery Subsidy Applied at Checkout!",
    maxStandardCharge: 49,
    maxExpressCharge: 89,
    updatedByName: "Admin",
    updatedAt: null,
  });

  // Interactive Live PIN code simulator
  const [simPincode, setSimPincode] = useState("500081");
  const [simCartAmount, setSimCartAmount] = useState(650);
  const [simItemCount, setSimItemCount] = useState(2);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Fetch Shipments
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

  // Fetch Shipping Strategy Settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await apiClient.get("/admin/shipping/settings");
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error("Failed to load shipping settings:", err);
      dispatch(triggerToast("Failed to load shipping rules", "error"));
    } finally {
      setSettingsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === "consignments") {
      fetchShipments(pagination.page, searchTerm, statusFilter);
    } else if (activeTab === "settings") {
      fetchSettings();
    }
  }, [activeTab, fetchShipments, fetchSettings, pagination.page, statusFilter]);

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
      dispatch(triggerToast("Live tracking synced with Shiprocket", "success"));
    } catch (err) {
      console.error("Sync failed:", err.message);
      dispatch(triggerToast("Failed to sync tracking status", "error"));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await apiClient.patch("/admin/shipping/settings", settings);
      if (res.success) {
        setSettings(res.settings);
        dispatch({ type: shippingSliceActions.UPDATE_CONFIG, payload: res.settings });
        dispatch(triggerToast("Shipping rules and delivery strategy saved successfully!", "success"));
      }
    } catch (err) {
      console.error("Failed to save shipping settings:", err);
      dispatch(triggerToast(err.message || "Failed to save settings", "error"));
    } finally {
      setSettingsSaving(false);
    }
  };

  // Interactive live PIN code simulation query
  const runPincodeSimulation = useCallback(
    async (pin, cartVal, qty = 2) => {
      if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) return;
      setSimLoading(true);
      try {
        const res = await apiClient.post("/orders/shipping/calculate", {
          pincode: pin,
          items: [{ product: "mock-prod", quantity: Number(qty) || 1, finalPrice: Number(cartVal) || 650, weight: 0.5 }],
        });
        if (res.success && res.shipping) {
          setSimResult(res.shipping);
        }
      } catch (err) {
        console.error("Simulation failed:", err);
      } finally {
        setSimLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === "settings" && simPincode?.length === 6) {
      const timer = setTimeout(() => runPincodeSimulation(simPincode, simCartAmount, simItemCount), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, simPincode, simCartAmount, simItemCount, runPincodeSimulation, settings.shippingDiscountOffer, settings.isOfferActive, settings.freeShippingThreshold, settings.isFreeShippingEnabled]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Shipping &amp; Logistics</h1>
              <p className="text-sm text-slate-500">
                Manage live consignments, customize delivery rates, free shipping range &amp; promotional subsidies
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers/locations"
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2.5 text-xs font-semibold shadow-xs transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Geo Destination Intel</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("consignments")}
          className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "consignments"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PackageSearch className="w-4 h-4" />
          <span>Active Consignments &amp; Orders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 pb-3.5 px-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "settings"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Delivery Rates &amp; Free Shipping Strategy</span>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
            Admin Controlled
          </span>
        </button>
      </div>

      {/* TAB 1: Consignments */}
      {activeTab === "consignments" && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/70">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by AWB or Order No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full md:w-auto px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-xs"
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

              <button
                type="button"
                onClick={() => fetchShipments(pagination.page, searchTerm, statusFilter)}
                className="p-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-xs"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Shipment Details</th>
                  <th className="px-6 py-3.5">Destination / Pickup</th>
                  <th className="px-6 py-3.5">Courier / Speed</th>
                  <th className="px-6 py-3.5">Live Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-7 h-7 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-600">Loading shipments...</p>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                        <PackageSearch className="w-10 h-10 text-slate-300" />
                        <p className="font-semibold text-slate-800">No active shipments found</p>
                        <p className="text-xs text-slate-500">
                          Shipments will appear here once orders are confirmed and prepared for dispatch.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isReturn =
                      order.returnRequest &&
                      order.returnRequest.status &&
                      order.returnRequest.status !== "none";
                    const isAwBAvailable = Boolean(order.shipping?.awbCode);
                    const speed = order.pricing?.deliverySpeed || "standard";

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 font-mono">
                              #{order.orderNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {isReturn && (
                              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded w-fit mt-1">
                                Reverse Pickup
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800">
                              {order.shippingAddress?.fullName || "Recipient"}
                            </span>
                            <span className="text-slate-600">
                              {order.shippingAddress?.city}, {order.shippingAddress?.state}
                            </span>
                            <span className="font-mono text-emerald-700 font-semibold text-[11px]">
                              PIN: {order.shippingAddress?.postalCode}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span>{order.shipping?.courierName || "Shiprocket Surface"}</span>
                              <span
                                className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                  speed === "express"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {speed === "express" ? "Express" : "Eco"}
                              </span>
                            </div>

                            {isAwBAvailable ? (
                              <>
                                <span className="font-mono text-slate-600 text-[11px]">
                                  AWB: {order.shipping.awbCode}
                                </span>
                                {(order.shipping?.etd || order.shipping?.estimatedDelivery) && (
                                  <span className="text-[10px] text-emerald-700 font-semibold">
                                    EDD: {order.shipping.etd || order.shipping.estimatedDelivery}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-amber-600 font-medium text-[11px] italic">
                                AWB Pending
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              order.status === "delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "shipped" || order.status === "out_for_delivery"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span className="capitalize">{order.status?.replace(/_/g, " ")}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isAwBAvailable && (
                              <button
                                type="button"
                                onClick={() => handleSyncTracking(order._id)}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Sync live tracking from Shiprocket"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <Link
                              href={`/admin/orders/${order._id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-xs"
                            >
                              <span>Manage</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/70 text-xs">
              <span className="text-slate-500 font-medium">
                Showing Page <span className="font-semibold text-slate-700">{pagination.page}</span> of{" "}
                <span className="font-semibold text-slate-700">{pagination.pages}</span> ({pagination.total} orders)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Automated Delivery Strategy & Controls */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsLoading ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Loading delivery configuration...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Controls & Automation Intel */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Automated Architecture Notice */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                        <Truck className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold tracking-wide">100% Automated Shiprocket Delivery Rates</h2>
                    </div>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Live Real-Time API
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Customer shipping charges and exact business days are automatically calculated in real-time using Shiprocket’s live courier quotes for all 19,000+ PIN codes across India.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Standard Eco Delivery</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Automatically selects the <strong>cheapest courier</strong> (Surface Eco) from Shiprocket with live delivery business days.
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                        <Zap className="w-3.5 h-3.5 fill-amber-300" />
                        <span>Express Fast Delivery</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Automatically selects the <strong>fastest courier</strong> (Air Express) for customers who need sacred ghee &amp; puja items quickly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Free Delivery Threshold Control */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        <h2 className="text-base font-bold text-slate-900">
                          Free Delivery Minimum Order Threshold
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500">
                        Customers with orders meeting or exceeding this cart subtotal automatically receive 100% Free Standard Eco Delivery.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.isFreeShippingEnabled}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, isFreeShippingEnabled: e.target.checked }))
                        }
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800">Enable Free Delivery</span>
                    </label>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-950 mb-1">
                        Free Delivery Minimum Order Value (₹)
                      </label>
                      <p className="text-[11px] text-amber-800">
                        Used across the website, product badges, cart nudges, and checkout calculations.
                      </p>
                    </div>

                    <div className="relative w-44">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        required
                        value={settings.freeShippingThreshold}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, freeShippingThreshold: e.target.value }))
                        }
                        className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Promotional Shipping Subsidy / Discount Offer */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BadgePercent className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-slate-900">
                          Per-Item Shipping Subsidy Offer (Volume Strategy)
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500">
                        Provide a per-item delivery discount (e.g. ₹20 OFF per item) that multiplies with the total quantity in the cart.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={settings.isOfferActive}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, isOfferActive: e.target.checked }))
                        }
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800">Activate Offer</span>
                    </label>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Smart Pricing Strategy</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Because you increased product base prices by ₹20, offering ₹20 OFF per item (e.g., <strong>1 item = ₹20 OFF, 2 items = ₹40 OFF, 3 items = ₹60 OFF</strong>) is completely margin-neutral. Customers feel rewarded with a higher delivery discount the more items they purchase!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Subsidy Amount Per Product Item (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          required
                          value={settings.shippingDiscountOffer}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, shippingDiscountOffer: e.target.value }))
                          }
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Multiplied by total items in cart.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Offer Tag / Label
                      </label>
                      <input
                        type="text"
                        value={settings.offerLabel}
                        onChange={(e) => setSettings((s) => ({ ...s, offerLabel: e.target.value }))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Displayed beside discount in summary.</p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Checkout Offer Banner Text
                      </label>
                      <input
                        type="text"
                        value={settings.offerBannerText}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, offerBannerText: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Customer Delivery Fee Ceiling Safeguards (Anti-Gouging Protection) */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h2 className="text-base font-bold text-slate-900">
                        Customer Delivery Fee Ceiling (Safeguard Against High Charges)
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      Protects customers from high rural courier surcharges (ODA). Even if Shiprocket’s internal courier tariff is ₹162+ for a remote village, the customer will never see or be charged more than this ceiling!
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Why This Matters (Meesho &amp; Amazon Strategy)</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Private couriers add heavy ODA surcharges for rural taluks. If customers see ₹140 or ₹162 shipping, they immediately cancel. By setting a ceiling (e.g. ₹49), customers pay a friendly rate (₹29 or FREE with the ₹20 item offer), while your product profit margin (+₹20 added to catalog) easily absorbs the difference!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Max Standard Eco Delivery Fee Cap (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={20}
                          max={99}
                          required
                          value={settings.maxStandardCharge ?? 49}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, maxStandardCharge: Number(e.target.value) || 49 }))
                          }
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Recommended: ₹49 (Maximum a customer will ever see).</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Max Express Air Delivery Fee Cap (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={40}
                          max={199}
                          required
                          value={settings.maxExpressCharge ?? 89}
                          onChange={(e) =>
                            setSettings((s) => ({ ...s, maxExpressCharge: Number(e.target.value) || 89 }))
                          }
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Recommended: ₹89 (For priority air shipping).</p>
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    {settings.updatedByName && (
                      <span>Last saved by <strong>{settings.updatedByName}</strong></span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                  >
                    {settingsSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Strategy...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Shipping Rules</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Col: Live Shiprocket Tester & Simulator */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-lg space-y-5 sticky top-6">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Live PIN Code Simulator
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                      Real API Output
                    </span>
                  </div>

                  {/* Test PIN code & Cart amount inputs */}
                  <div className="space-y-3 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Test Destination PIN Code:
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={simPincode}
                        onChange={(e) => setSimPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter 6-digit PIN"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Quick PIN Pills */}
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {[
                        { pin: "500081", label: "Hyderabad" },
                        { pin: "522002", label: "Guntur" },
                        { pin: "560001", label: "Bangalore" },
                        { pin: "110001", label: "Delhi" },
                        { pin: "400001", label: "Mumbai" },
                        { pin: "700001", label: "Kolkata" },
                      ].map((item) => (
                        <button
                          key={item.pin}
                          type="button"
                          onClick={() => setSimPincode(item.pin)}
                          className={`px-2 py-0.5 rounded-md border transition-all ${
                            simPincode === item.pin
                              ? "bg-emerald-500/30 text-emerald-300 border-emerald-400"
                              : "bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700"
                          }`}
                        >
                          {item.label} ({item.pin})
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Simulated Order Subtotal (₹):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={simCartAmount}
                        onChange={(e) => setSimCartAmount(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded-xl text-xs font-bold text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Simulated Cart Items Count Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Simulated Cart Quantity:
                        </label>
                        <span className="text-[11px] text-emerald-400 font-bold">
                          {simItemCount} {simItemCount === 1 ? "Item" : "Items"} (₹{simItemCount * (Number(settings.shippingDiscountOffer) || 20)} OFF)
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 2, 3, 4].map((qty) => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setSimItemCount(qty)}
                            className={`py-1 rounded-lg text-xs font-bold border transition-all ${
                              simItemCount === qty
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                                : "bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-slate-700"
                            }`}
                          >
                            {qty} {qty === 1 ? "item" : "items"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Free shipping rule status */}
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-300">Free Delivery Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        settings.isFreeShippingEnabled && simCartAmount >= settings.freeShippingThreshold
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {settings.isFreeShippingEnabled
                        ? simCartAmount >= settings.freeShippingThreshold
                          ? "✓ Unlocked (FREE Standard)"
                          : `Needs ₹${Math.max(0, settings.freeShippingThreshold - simCartAmount)} more`
                        : "Disabled"}
                    </span>
                  </div>

                  {/* Simulation Result Output */}
                  {simLoading ? (
                    <div className="p-6 text-center space-y-2">
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Fetching live Shiprocket rates for PIN {simPincode}...</p>
                    </div>
                  ) : simResult && Array.isArray(simResult.options) && simResult.options.length > 0 ? (
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                        Customer Checkout View:
                      </span>

                      {simResult.options.map((opt) => {
                        const isExpress = opt.id === "express";
                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                              isExpress
                                ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                                : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                {isExpress ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Truck className="w-3.5 h-3.5 text-emerald-400" />}
                                {opt.name}
                              </span>
                              <div className="text-right">
                                {opt.isFree ? (
                                  <span className="bg-emerald-500 text-slate-900 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                                    FREE
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    {opt.discount > 0 && (
                                      <span className="text-[10px] text-slate-400 line-through">
                                        ₹{opt.originalRate}
                                      </span>
                                    )}
                                    <span className="font-extrabold text-white text-sm">
                                      ₹{opt.rate}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                              <span className="flex items-center gap-1 text-slate-300 font-medium">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {opt.estimatedDeliveryDays}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                via {opt.courierName}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Active offer badge in checkout */}
                      {settings.isOfferActive && settings.shippingDiscountOffer > 0 && (
                        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                            Active Checkout Offer:
                          </span>
                          <p className="text-xs text-emerald-200 font-semibold">
                            &quot;{settings.offerBannerText}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-800/60 rounded-xl text-center text-xs text-slate-400">
                      Enter a valid 6-digit PIN code above to simulate live rates.
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-700">
                    💡 <strong>Safe &amp; Automated:</strong> Shiprocket dynamically assigns the best couriers based on weight and distance. You never need to configure manual rate cards.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
