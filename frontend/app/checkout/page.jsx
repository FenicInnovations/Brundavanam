"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSelector, useDispatch, selectCartItems, selectCartSubtotal, clearCart, getItemEffectivePrice } from "@/lib/redux/store";
import { resolveProductImage } from "@/lib/productUtils";
import { apiClient } from "@/lib/api/apiClient";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Loader2,
  ShieldCheck,
  MapPin,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Package,
  Truck,
  CreditCard,
  Sparkles,
  Check,
  Info,
  Plus,
  Home,
  Briefcase,
  Building,
  ArrowRight,
  ChevronDown,
  UserCheck,
  Clock,
  Zap,
} from "lucide-react";

export const INDIAN_STATES = [
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
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, status: authStatus } = useAuth();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  // Saved addresses state & primary address detection
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [deliveryOption, setDeliveryOption] = useState("custom"); // "saved" | "custom"
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // Pre-fill primary saved address if logged in
  useEffect(() => {
    let isMounted = true;
    async function fetchUserAddresses() {
      if (user) {
        setLoadingSavedAddresses(true);
        try {
          const res = await api.getAddresses();
          if (isMounted && res.success && Array.isArray(res.addresses) && res.addresses.length > 0) {
            setSavedAddresses(res.addresses);
            // Auto-select Primary address (isDefault: true) or fallback to first
            const primary = res.addresses.find((a) => a.isDefault) || res.addresses[0];
            setSelectedSavedId(primary._id);
            setDeliveryOption("saved");
            setAddress((prev) => ({
              ...prev,
              fullName: primary.fullName,
              phone: primary.phone,
              email: prev.email || user.email || "",
              line1: primary.line1,
              line2: primary.line2 || "",
              city: primary.city,
              state: primary.state,
              postalCode: primary.postalCode,
            }));
          } else if (isMounted) {
            setDeliveryOption("custom");
            setAddress((prev) => ({
              ...prev,
              fullName: prev.fullName || user.name || "",
              phone: prev.phone || user.phone || "",
              email: prev.email || user.email || "",
            }));
          }
        } catch (err) {
          console.warn("[checkout] Could not fetch saved addresses:", err.message);
          if (isMounted) setDeliveryOption("custom");
        } finally {
          if (isMounted) setLoadingSavedAddresses(false);
        }
      }
    }

    fetchUserAddresses();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedSavedId(addr._id);
    setDeliveryOption("saved");
    setShowAddressPicker(false);
    setAddress((prev) => ({
      ...prev,
      fullName: addr.fullName,
      phone: addr.phone,
      email: prev.email || user?.email || "",
      line1: addr.line1,
      line2: addr.line2 || "",
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
    }));
  };

  const handleSelectCustomAddressOption = () => {
    setDeliveryOption("custom");
    setShowAddressPicker(false);
    setAddress((prev) => ({
      fullName: prev.fullName || user?.name || "",
      phone: prev.phone || user?.phone || "",
      email: prev.email || user?.email || "",
      line1: "",
      line2: "",
      city: "",
      state: "Telangana",
      postalCode: "",
    }));
  };

  const [selectedSpeed, setSelectedSpeed] = useState("standard"); // "standard" | "express"
  const [shipping, setShipping] = useState({
    loading: false,
    calculated: false,
    error: null,
    amount: 0,
    originalAmount: 0,
    discount: 0,
    isFree: false,
    courierName: "",
    shortfall: 0,
    threshold: 800,
    estimatedDeliveryDays: null,
    deliverySpeed: "standard",
    options: [],
    offer: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/cart");
    }
  }, [cartItems, router]);

  // Load Razorpay Script
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Calculate Shipping
  const calculateShipping = useCallback(
    async (pincode, speed = selectedSpeed) => {
      if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) return;
      setShipping((prev) => ({ ...prev, loading: true, error: null, calculated: false }));
      try {
        const payloadItems = cartItems.map((ci) => ({
          product: ci.product?._id || ci.product,
          variantId: ci.variantId || null,
          variantLabel: ci.variantLabel || "",
          quantity: ci.quantity,
        }));
        const res = await apiClient.post("/orders/shipping/calculate", {
          pincode,
          items: payloadItems,
          deliverySpeed: speed,
        });
        if (res.success && res.shipping) {
          const s = res.shipping;
          setShipping({
            loading: false,
            calculated: true,
            error: null,
            amount: s.amount,
            originalAmount: s.originalAmount || s.amount,
            discount: s.discount || 0,
            isFree: s.isFree,
            courierName: s.courierName || "",
            shortfall: s.shortfall || 0,
            threshold: s.threshold || 800,
            estimatedDeliveryDays: s.estimatedDeliveryDays || null,
            deliverySpeed: s.deliverySpeed || speed,
            options: Array.isArray(s.options) ? s.options : [],
            offer: s.offer || null,
          });
        }
      } catch (err) {
        setShipping({
          loading: false,
          calculated: false,
          error: err.message || "Unable to calculate delivery charges. Please try again.",
          amount: 0,
          originalAmount: 0,
          discount: 0,
          isFree: false,
          courierName: "",
          shortfall: 0,
          threshold: 800,
          estimatedDeliveryDays: null,
          deliverySpeed: speed,
          options: [],
          offer: null,
        });
      }
    },
    [cartItems, selectedSpeed]
  );

  const handleSelectDeliverySpeed = (speedId) => {
    setSelectedSpeed(speedId);
    if (shipping.options && shipping.options.length > 0) {
      const match = shipping.options.find((o) => o.id === speedId);
      if (match) {
        setShipping((prev) => ({
          ...prev,
          amount: match.rate,
          originalAmount: match.originalRate,
          discount: match.discount,
          isFree: match.isFree,
          courierName: match.courierName,
          estimatedDeliveryDays: match.estimatedDeliveryDays,
          deliverySpeed: speedId,
        }));
        return;
      }
    }
    if (address.postalCode?.length === 6) {
      calculateShipping(address.postalCode, speedId);
    }
  };

  // Debounced shipping recalculation on pincode/cart change
  useEffect(() => {
    if (address.postalCode?.length === 6) {
      const timer = setTimeout(() => calculateShipping(address.postalCode, selectedSpeed), 500);
      return () => clearTimeout(timer);
    } else {
      setShipping((prev) => ({ ...prev, calculated: false, error: null, amount: 0, isFree: false }));
    }
  }, [address.postalCode, cartItems, calculateShipping, selectedSpeed]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setCheckoutError("");

    if (!shipping.calculated && !shipping.isFree) {
      if (address.postalCode.length !== 6) {
        setCheckoutError("Please enter a valid 6-digit PIN code to calculate delivery charges.");
      } else {
        setCheckoutError("Delivery calculation is in progress. Please wait.");
      }
      return;
    }

    if (shipping.error) {
      setCheckoutError("Delivery is unavailable for this PIN code. Please try a different address.");
      return;
    }

    setIsProcessing(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const payloadItems = cartItems.map((ci) => ({
        product: ci.product?._id || ci.product,
        variantId: ci.variantId || null,
        variantLabel: ci.variantLabel || "",
        quantity: ci.quantity,
      }));

      // Backend re-validates cart, prices & shipping independently
      const checkoutData = await apiClient.post("/orders/checkout", {
        items: payloadItems,
        shippingAddress: { ...address, country: "India" },
        billingAddress: { ...address, country: "India" },
        deliverySpeed: selectedSpeed,
      });

      if (!checkoutData.success) {
        throw new Error(checkoutData.message || "Checkout failed");
      }

      const { razorpayOrder, clientConfig, order } = checkoutData;

      const options = {
        key: clientConfig?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Brundavanam Goshala",
        description: `Order #${order.orderNumber}`,
        image: "/logo.png",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          setIsProcessing(true);
          try {
            const verifyData = await apiClient.post("/orders/verify-payment", {
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyData.success) {
              dispatch(clearCart());
              if (user) {
                router.push(`/account/orders/${order._id}?success=1`);
              } else {
                router.push(
                  `/track-order?orderNumber=${order.orderNumber}&email=${encodeURIComponent(
                    address.email || ""
                  )}&placed=true`
                );
              }
            }
          } catch (err) {
            setCheckoutError("Payment verification failed: " + (err.message || "Please contact support."));
            setIsProcessing(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        notes: {
          order_number: order.orderNumber,
        },
        theme: { color: "#059669" },
        modal: {
          ondismiss: async () => {
            try {
              await apiClient.post("/orders/payment-failed", {
                orderId: order._id,
                reason: "Payment dismissed by user",
              });
            } catch {}
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async function (response) {
        try {
          await apiClient.post("/orders/payment-failed", {
            orderId: order._id,
            reason: response.error?.description || "Payment failed",
          });
        } catch {}
        setCheckoutError(`Payment Failed: ${response.error?.description || "Please try again."}`);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      setCheckoutError(err.message || "Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) return null;

  const canPlaceOrder = (shipping.calculated || shipping.isFree) && !shipping.error && !shipping.loading;
  const totalPayable = subtotal + (shipping.isFree ? 0 : shipping.amount);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Checkout</h1>
              <p className="text-sm text-slate-500 mt-1">Complete your order from Brundavanam Goshala</p>
            </div>
            {!user && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-900 rounded-full text-xs font-bold w-fit border border-amber-300/80 shadow-2xs">
                <UserCheck size={14} className="text-amber-700" />
                <span>Guest Checkout Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Guest Order Banner / Sign-in nudge */}
        {!user && (
          <div className="mb-8 p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-emerald-50/60 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span>Buying without logging in? You can checkout as Guest!</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Instant
                  </span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  No login required. We will send your order confirmation and tracking link directly to your email.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Link
                href="/login?redirect=/checkout"
                className="w-full sm:w-auto text-center text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-white hover:bg-emerald-50/80 px-4 py-2 rounded-xl border border-emerald-300 shadow-2xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Sign in for Member Benefits</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT: Address Form */}
          {/* LEFT: Address Section */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Delivery Address
                </h2>
                {user && (
                  <Link
                    href="/account/addresses"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>Manage Addresses</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
              </div>

              {/* Mode Toggle: Saved Address vs Different Address */}
              {savedAddresses.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      const selected =
                        savedAddresses.find((a) => a._id === selectedSavedId) ||
                        savedAddresses.find((a) => a.isDefault) ||
                        savedAddresses[0];
                      if (selected) handleSelectSavedAddress(selected);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      deliveryOption === "saved"
                        ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <CheckCircle2
                      size={15}
                      className={deliveryOption === "saved" ? "text-emerald-600" : "text-slate-400"}
                    />
                    <span>Deliver to Saved Address</span>
                    {savedAddresses.find((a) => a._id === selectedSavedId)?.isDefault && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold">
                        Primary
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectCustomAddressOption}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      deliveryOption === "custom"
                        ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Plus
                      size={15}
                      className={deliveryOption === "custom" ? "text-emerald-600" : "text-slate-400"}
                    />
                    <span>Deliver to a Different Address</span>
                  </button>
                </div>
              )}

              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
                {/* 1. SAVED PRIMARY ADDRESS MODE */}
                {deliveryOption === "saved" && savedAddresses.length > 0 ? (
                  <div className="space-y-4">
                    {/* Active Selected Address Showcase */}
                    {(() => {
                      const current =
                        savedAddresses.find((a) => a._id === selectedSavedId) ||
                        savedAddresses.find((a) => a.isDefault) ||
                        savedAddresses[0];

                      return (
                        <div className="rounded-2xl border-2 border-emerald-500/70 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-xs relative space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {current.label?.[0]?.toUpperCase() || "H"}
                              </span>
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {current.label || "Home"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {current.isDefault && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                  <Sparkles size={11} className="text-emerald-700" />
                                  <span>Primary Address</span>
                                </span>
                              )}

                              {savedAddresses.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAddressPicker(!showAddressPicker)}
                                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                                >
                                  <span>{showAddressPicker ? "Close" : "Change"}</span>
                                  <ChevronDown
                                    size={13}
                                    className={`transition-transform ${showAddressPicker ? "rotate-180" : ""}`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Recipient Details */}
                          <div>
                            <p className="text-sm font-bold text-slate-900">{current.fullName}</p>
                            <p className="text-xs font-semibold text-slate-500">+91 {current.phone}</p>
                          </div>

                          {/* Street Address */}
                          <div className="text-xs text-slate-700 leading-relaxed font-sans pt-1 border-t border-slate-100">
                            <p>{current.line1}</p>
                            {current.line2 && <p>{current.line2}</p>}
                            <p className="font-semibold text-slate-900 mt-0.5">
                              {current.city}, {current.state} –{" "}
                              <span className="font-bold text-emerald-800">{current.postalCode}</span>
                            </p>
                          </div>

                          {/* Expandable Picker to switch between other saved addresses */}
                          {showAddressPicker && savedAddresses.length > 1 && (
                            <div className="pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Select another saved address:
                              </p>
                              <div className="grid grid-cols-1 gap-2">
                                {savedAddresses
                                  .filter((a) => a._id !== current._id)
                                  .map((other) => (
                                    <div
                                      key={other._id}
                                      onClick={() => handleSelectSavedAddress(other)}
                                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer transition-all flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-900">{other.fullName}</span>
                                          <span className="text-[10px] text-slate-500 uppercase">({other.label})</span>
                                          {other.isDefault && (
                                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 rounded">Primary</span>
                                          )}
                                        </div>
                                        <p className="text-slate-600 text-[11px] truncate max-w-sm mt-0.5">
                                          {other.line1}, {other.city} - {other.postalCode}
                                        </p>
                                      </div>
                                      <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                                        Use this
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Email for invoice & tracking updates */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Email Address (for order confirmation &amp; tax invoice) *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={address.email}
                        onChange={handleInputChange}
                        placeholder="recipient@example.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  /* 2. CUSTOM / MANUAL ADDRESS INPUT FORM */
                  <div className="space-y-4">
                    {savedAddresses.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                        <span>Entering a different address for this order:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const primary =
                              savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                            if (primary) handleSelectSavedAddress(primary);
                          }}
                          className="font-bold text-emerald-700 hover:underline"
                        >
                          Use Primary Saved Address
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={address.fullName}
                          onChange={handleInputChange}
                          placeholder="Full Name (e.g. Ramesh Kumar)"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          pattern="[0-9]{10}"
                          value={address.phone}
                          onChange={handleInputChange}
                          placeholder="10-digit mobile number"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={address.email}
                        onChange={handleInputChange}
                        placeholder="For order confirmation & invoice"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address Line 1 *</label>
                      <input
                        type="text"
                        name="line1"
                        required
                        value={address.line1}
                        onChange={handleInputChange}
                        placeholder="House/Flat No., Building Name, Street"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address Line 2</label>
                      <input
                        type="text"
                        name="line2"
                        value={address.line2}
                        onChange={handleInputChange}
                        placeholder="Locality, Landmark (optional)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">City *</label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={address.city}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">State *</label>
                        <div className="relative">
                          <select
                            name="state"
                            required
                            value={address.state}
                            onChange={handleInputChange}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer pr-10 text-slate-800"
                          >
                            <option value="" disabled>Select State / UT</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span>PIN Code *</span>
                          {shipping.loading && (
                            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          required
                          maxLength={6}
                          value={address.postalCode}
                          onChange={handleInputChange}
                          placeholder="e.g. 522002"
                          className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${
                            shipping.error
                              ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                              : shipping.calculated
                              ? "border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/20"
                              : "border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Shiprocket Price & Courier Status Card */}
                {shipping.loading && (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
                    <div>
                      <p className="font-semibold">Calculating real Shiprocket delivery rate...</p>
                      <p className="text-[11px] text-emerald-600">Checking courier serviceability &amp; transit time for PIN {address.postalCode}</p>
                    </div>
                  </div>
                )}

                {shipping.calculated && !shipping.error && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        Choose Delivery Speed
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Live Shiprocket Rates
                      </span>
                    </div>

                    {/* Marketing Offer Banner if Active */}
                    {shipping.offer?.isActive && shipping.offer.discount > 0 && (
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-emerald-950 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="font-bold">{shipping.offer.bannerText}</span>
                        </div>
                        {!shipping.isFree && (
                          <Link
                            href="/shop"
                            className="shrink-0 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-300 hover:border-emerald-400 px-2.5 py-1 rounded-xl shadow-2xs transition-all flex items-center gap-1"
                          >
                            <span>+ Add Item (+₹{shipping.offer?.discountPerItem || 20} OFF)</span>
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Interactive Speed Option Cards with Live Business Days */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {shipping.options && shipping.options.length > 0 ? (
                        shipping.options.map((opt) => {
                          const isSelected = selectedSpeed === opt.id;
                          const isExpress = opt.id === "express";
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleSelectDeliverySpeed(opt.id)}
                              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative space-y-2.5 ${
                                isSelected
                                  ? isExpress
                                    ? "border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-500/20"
                                    : "border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        isSelected
                                          ? isExpress
                                            ? "border-amber-500 bg-amber-500 text-white"
                                            : "border-emerald-600 bg-emerald-600 text-white"
                                          : "border-slate-300"
                                      }`}
                                    >
                                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-900">{opt.name}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 pl-6">
                                    {opt.marketingTag || (isExpress ? "Fastest Arrival by Air" : "Most Economical Surface")}
                                  </p>
                                </div>

                                <div className="text-right shrink-0">
                                  {opt.isFree ? (
                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px] uppercase tracking-wide">
                                      FREE
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      {opt.discount > 0 && (
                                        <span className="text-[11px] text-slate-400 line-through font-normal">
                                          ₹{opt.originalRate}
                                        </span>
                                      )}
                                      <span className="text-sm font-extrabold text-slate-900">
                                        ₹{opt.rate}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Prominent Business Days Delivery Indicator */}
                              <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                                  {isExpress ? (
                                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                  )}
                                  Delivered in {opt.estimatedDeliveryDays}
                                </span>
                                {opt.badge && (
                                  <span
                                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                                      opt.isFree
                                        ? "bg-emerald-100 text-emerald-800"
                                        : isExpress
                                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    }`}
                                  >
                                    {opt.badge}
                                  </span>
                                )}
                              </div>

                              {/* Courier details & Vedic protection */}
                              <div className="text-[11px] text-slate-500 space-y-0.5 pt-0.5">
                                <p className="truncate">via <strong className="text-slate-700">{opt.courierName}</strong></p>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{opt.description}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/30 flex items-center justify-between sm:col-span-2">
                          <span className="text-xs font-bold text-slate-900">
                            {shipping.courierName || "Standard Eco Delivery"}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {shipping.isFree ? "FREE" : `₹${shipping.amount}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping error feedback */}
                {shipping.error && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-semibold">Delivery Rate Calculation</p>
                      <p className="text-[11px] text-rose-600 mt-0.5">{shipping.error}</p>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Payment Method Section - NO COD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Payment Method
                </h2>
                <span className="text-[11px] px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-full">
                  Prepaid Only
                </span>
              </div>

              {/* Selected Prepaid Gateway */}
              <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/20 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Online Payment (Razorpay)</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, Net Banking &amp; Wallets
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-emerald-800">
                        <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md font-semibold">UPI Instant</span>
                        <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md font-semibold">Visa / Mastercard / RuPay</span>
                        <span className="px-2 py-0.5 bg-white border border-emerald-200 rounded-md font-semibold">All Indian Banks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* No COD Banner */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">Cash on Delivery (COD) Not Available</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    To maintain the highest purity, hygienic direct packing, and fresh dispatch of our goshala items without courier delays, all orders are processed via secure prepaid payment only.
                  </p>
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Order Items ({cartItems.length})
                </h3>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add More Products</span>
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const product = item.product || {};
                  const unitPrice = getItemEffectivePrice(item);
                  const itemTotal = unitPrice * item.quantity;
                  const image = resolveProductImage(product);
                  return (
                    <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-amber-50/50 border border-slate-200 overflow-hidden shrink-0 relative">
                        <img
                          src={image}
                          alt={product.name || "Product"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/images/logo.png";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{product.name}</p>
                        {item.variantLabel && <p className="text-xs text-slate-500">Variant: {item.variantLabel}</p>}
                        <p className="text-xs text-slate-500">
                          Qty: {item.quantity} × ₹{unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 shrink-0">₹{itemTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Add more items footer */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link
                  href="/cart"
                  className="font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ← Modify Cart Quantities
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <span>Explore Store &amp; Add Products</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs sticky top-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
                <Link
                  href="/shop"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>+ Add Items</span>
                </Link>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Products Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    Delivery ({selectedSpeed === "express" ? "Express Fast" : "Standard Eco"})
                  </span>

                  {shipping.loading ? (
                    <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating…
                    </span>
                  ) : !address.postalCode || address.postalCode.length < 6 ? (
                    <span className="text-slate-400 text-xs italic">Enter PIN code</span>
                  ) : shipping.error ? (
                    <span className="text-rose-500 text-xs font-medium">Unavailable</span>
                  ) : shipping.isFree ? (
                    <span className="text-emerald-600 font-extrabold text-xs uppercase tracking-wide">
                      FREE
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {shipping.discount > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{shipping.originalAmount}
                        </span>
                      )}
                      <span className="font-bold text-slate-900">₹{shipping.amount}</span>
                    </div>
                  )}
                </div>

                {/* Subsidized Delivery Offer Row */}
                {shipping.discount > 0 && !shipping.isFree && (
                  <div className="flex justify-between items-center text-xs text-emerald-700 font-semibold bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        {shipping.offer?.itemCount > 1
                          ? `Goshala Delivery Subsidy (${shipping.offer.itemCount} items × ₹${shipping.offer.discountPerItem || 20} OFF)`
                          : `Goshala Delivery Subsidy Offer`}
                      </span>
                    </span>
                    <span className="font-bold">-₹{shipping.discount}</span>
                  </div>
                )}

                {shipping.calculated && shipping.estimatedDeliveryDays && (
                  <div className="text-[10px] text-slate-500 text-right">
                    via {shipping.courierName} · Est. {shipping.estimatedDeliveryDays}
                  </div>
                )}
              </div>

              {/* Free delivery & Per-item subsidy nudge */}
              {shipping.calculated && !shipping.isFree && (
                <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/40 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-2.5 shadow-2xs">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Add 1 more product to save an extra <strong>₹{shipping.offer?.discountPerItem || 20} OFF</strong> delivery
                      {shipping.shortfall > 0 ? ` or add ₹${shipping.shortfall} to unlock 100% FREE Delivery!` : "!"}
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 group"
                  >
                    <span>+ Add Items to Reduce Delivery Fee</span>
                    <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
              {shipping.isFree && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>🎉 Your order qualifies for <strong>FREE Delivery</strong>!</span>
                </div>
              )}

              {/* Total */}
              <div className="pt-4 border-t border-slate-100 flex justify-between font-extrabold text-slate-900">
                <span>Total Payable</span>
                <span className="text-xl text-emerald-700">₹{(canPlaceOrder ? totalPayable : subtotal).toFixed(2)}</span>
              </div>

              {!canPlaceOrder && !shipping.error && address.postalCode.length > 0 && (
                <p className="text-[11px] text-slate-400 text-center">*Delivery charges will be added after PIN code entry</p>
              )}

              {/* Error */}
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing || shipping.loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>Place Order & Pay Securely</span>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secured by Razorpay · 256-bit SSL</span>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Delivery calculated based on your PIN code. Actual charge confirmed by backend before payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
