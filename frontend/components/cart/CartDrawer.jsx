"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Truck,
} from "lucide-react";
import {
  useDispatch,
  useSelector,
  selectCartItems,
  selectCartSubtotal,
  selectCartTotalCount,
  selectShippingConfig,
  updateCartQuantity,
  removeFromCart,
  getItemEffectivePrice,
} from "@/lib/redux/store";
import { resolveProductImage } from "@/lib/productUtils";
import { apiClient } from "@/lib/api/apiClient";

export default function CartDrawer({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const totalCount = useSelector(selectCartTotalCount);
  const reduxConfig = useSelector(selectShippingConfig);

  const [shippingConfig, setShippingConfig] = useState(
    reduxConfig || {
      freeShippingThreshold: 800,
      isFreeShippingEnabled: true,
    }
  );

  useEffect(() => {
    if (reduxConfig) setShippingConfig(reduxConfig);
  }, [reduxConfig]);

  if (!isOpen) return null;

  const threshold = shippingConfig.freeShippingThreshold || 800;
  const isFreeEligible = shippingConfig.isFreeShippingEnabled && subtotal >= threshold;
  const shortfall = Math.max(0, threshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Drawer Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">Shopping Cart</h2>
                <p className="text-xs text-slate-300">
                  {totalCount} {totalCount === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dynamic Free Shipping Progress Nudge */}
          {shippingConfig.isFreeShippingEnabled && cartItems.length > 0 && (
            <div className="px-6 py-3 bg-emerald-50/70 border-b border-emerald-100 text-xs">
              {isFreeEligible ? (
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>🎉 Your order qualifies for <strong>FREE Delivery</strong>!</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-900 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Add ₹{shortfall} more for FREE Delivery!
                    </span>
                    <span className="font-bold text-emerald-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-emerald-200/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Delivery Subsidy Notice */}
          {shippingConfig.isOfferActive && shippingConfig.shippingDiscountOffer > 0 && cartItems.length > 0 && !isFreeEligible && (
            <div className="px-6 py-2 bg-amber-50/80 border-b border-amber-200/60 text-xs flex items-center justify-between text-amber-950 font-bold">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Delivery Subsidy</span>
              </span>
              <span className="text-emerald-700">-₹{shippingConfig.shippingDiscountOffer * totalCount} (₹{shippingConfig.shippingDiscountOffer}/item)</span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-slate-100">
            {cartItems.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Explore our range of A2 Gir Cow Ghee, organic products, and goshala items.
                  </p>
                </div>
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-md"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              cartItems.map((item) => {
                const product = item.product || {};
                const primaryImage = resolveProductImage(product);

                return (
                  <div key={item._id} className="pt-4 first:pt-0 flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl bg-amber-50/50 border border-slate-200 overflow-hidden flex-shrink-0 relative">
                      <img
                        src={primaryImage}
                        alt={product.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/logo.png";
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                      {item.variantLabel && (
                        <span className="text-[10px] text-slate-500 font-medium">Variant: {item.variantLabel}</span>
                      )}
                      {(() => {
                        const unitPrice = getItemEffectivePrice(item);
                        const regularPrice = Number(product.price) || 0;
                        return (
                          <div className="text-xs font-extrabold text-emerald-700 mt-1">
                            ₹{unitPrice.toFixed(2)}{" "}
                            {regularPrice > unitPrice && (
                              <span className="text-[10px] text-slate-400 line-through ml-1 font-normal">
                                ₹{regularPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(updateCartQuantity({ itemId: item._id, quantity: item.quantity - 1 }))
                          }
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            dispatch(updateCartQuantity({ itemId: item._id, quantity: item.quantity + 1 }))
                          }
                          className="p-1 text-slate-600 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart(item._id))}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  {subtotal >= 800 ? (
                    <span className="text-emerald-600 font-bold uppercase tracking-wide">FREE</span>
                  ) : (
                    <span className="text-slate-500 font-medium italic">Calculated at Checkout</span>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-emerald-700">₹{subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Pure A2 Guaranteed • Direct Goshala Delivery</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
