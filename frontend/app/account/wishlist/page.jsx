"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowRight, Package } from "lucide-react";
import {
  useDispatch,
  useSelector,
  selectWishlistItems,
  selectWishlistLoading,
  fetchWishlist,
  toggleWishlist,
  addToCart,
} from "@/lib/redux/store";
import { triggerToast } from "@/lib/redux/slices/adminSlice";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector(selectWishlistItems);
  const loading = useSelector(selectWishlistLoading);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const handleMoveToCart = async (product) => {
    try {
      await dispatch(addToCart({ product, quantity: 1 }));
      await dispatch(toggleWishlist(product));
      dispatch(triggerToast(`Moved '${product.name}' to shopping cart`, "success"));
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to add to cart", "error"));
    }
  };

  const handleRemove = async (product) => {
    try {
      await dispatch(toggleWishlist(product));
      dispatch(triggerToast(`Removed '${product.name}' from wishlist`, "info"));
    } catch (err) {
      dispatch(triggerToast("Failed to remove item", "error"));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            <span>My Wishlist ({wishlistItems.length})</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your saved favorite organic Goshala products.
          </p>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <div className="w-20 h-20 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Wishlist is Empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Save your favorite A2 Gir Cow Ghee or Panchagavya products to order later.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-all shadow-md"
            >
              <span>Explore Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistItems.map((item) => {
              const product = item.product || {};
              const primaryImage =
                product.images?.find((i) => i.isPrimary)?.publicUrl ||
                product.images?.[0]?.publicUrl ||
                "https://placehold.co/300x300?text=No+Image";

              return (
                <div
                  key={item._id || product._id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-square relative overflow-hidden bg-slate-100">
                      <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{product.name}</h3>
                      <div className="text-sm font-extrabold text-emerald-700">
                        ₹{product.price}{" "}
                        {product.discountPrice > 0 && (
                          <span className="text-xs text-slate-400 line-through ml-1 font-normal">
                            ₹{product.discountPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveToCart(product)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Move to Cart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(product)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
