"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
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
} from "@/lib/redux/store";
import { resolveProductImage } from "@/lib/productUtils";

export default function CartPage() {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const totalCount = useSelector(selectCartTotalCount);
  const shippingConfig = useSelector(selectShippingConfig);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            <span>Shopping Cart ({totalCount})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your selected Brundavanam Goshala organic products before checkout.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Cart is Currently Empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Explore our traditional Bilona A2 Desi Gir Cow Ghee, herbal Panchagavya products, and goshala items.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-md"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const product = item.product || {};
                  const primaryImage = resolveProductImage(product);

                  return (
                    <div key={item._id} className="py-5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-20 h-20 rounded-2xl bg-amber-50/50 border border-slate-200 overflow-hidden flex-shrink-0 relative">
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
                        <div className="space-y-1 min-w-0">
                          <Link
                            href={`/product/${product.slug}`}
                            className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          {item.variantLabel && (
                            <span className="text-xs text-slate-500 font-medium block">
                              Variant: {item.variantLabel}
                            </span>
                          )}
                          {(() => {
                            const rawPrice = product.price !== undefined ? Number(product.price) : 0;
                            const rawDiscount = product.discountPrice !== undefined ? Number(product.discountPrice) : 0;
                            const itemPrice = (rawDiscount > 0 && rawDiscount < rawPrice) ? rawDiscount : rawPrice;
                            const itemCompare = (rawDiscount > 0 && rawDiscount < rawPrice) ? rawPrice : (product.compareAtPrice ? Number(product.compareAtPrice) : null);

                            return (
                              <div className="text-xs font-semibold text-emerald-700">
                                ₹{itemPrice.toLocaleString("en-IN")}{" "}
                                {itemCompare && itemCompare > itemPrice && (
                                  <span className="text-[10px] text-slate-400 line-through ml-1">
                                    ₹{itemCompare.toLocaleString("en-IN")}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(updateCartQuantity({ itemId: item._id, quantity: item.quantity - 1 }))
                            }
                            className="p-2 text-slate-600 hover:text-slate-900"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(updateCartQuantity({ itemId: item._id, quantity: item.quantity + 1 }))
                            }
                            className="p-2 text-slate-600 hover:text-slate-900"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {(() => {
                          const rawPrice = product.price !== undefined ? Number(product.price) : 0;
                          const rawDiscount = product.discountPrice !== undefined ? Number(product.discountPrice) : 0;
                          const itemPrice = (rawDiscount > 0 && rawDiscount < rawPrice) ? rawDiscount : rawPrice;
                          const lineTotal = (itemPrice * (item.quantity || 1)).toFixed(2);

                          return (
                            <span className="font-extrabold text-slate-900 text-sm">
                              ₹{lineTotal}
                            </span>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={() => dispatch(removeFromCart(item._id))}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary & Checkout Sidebar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 h-fit">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal ({totalCount} items)</span>
                  <span className="font-bold text-slate-900">₹{Number(subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Estimated Shipping</span>
                  {shippingConfig?.isFreeShippingEnabled && subtotal >= (shippingConfig?.freeShippingThreshold || 800) ? (
                    <span className="text-emerald-600 font-bold text-xs uppercase tracking-wide">
                      FREE (Above ₹{shippingConfig?.freeShippingThreshold || 800})
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium text-xs">Calculated by PIN at Checkout</span>
                  )}
                </div>
                {shippingConfig?.isOfferActive && shippingConfig?.shippingDiscountOffer > 0 && !(shippingConfig?.isFreeShippingEnabled && subtotal >= (shippingConfig?.freeShippingThreshold || 800)) && (
                  <div className="flex justify-between items-center text-amber-900 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-700" />
                      <span>Delivery Discount Offer</span>
                    </span>
                    <span className="text-emerald-700">-₹{shippingConfig.shippingDiscountOffer * totalCount} (₹{shippingConfig.shippingDiscountOffer}/item)</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Subtotal Amount</span>
                  <span className="text-emerald-700">₹{Number(subtotal || 0).toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="space-y-3 pt-2 text-xs text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Authentic A2 Products Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Dispatched directly from Brundavanam Goshala</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
