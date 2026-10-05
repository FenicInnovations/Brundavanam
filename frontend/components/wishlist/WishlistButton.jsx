"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useDispatch, useSelector, selectIsInWishlist, toggleWishlist } from "@/lib/redux/store";
import { triggerToast } from "@/lib/redux/slices/adminSlice";

export default function WishlistButton({ product, className = "" }) {
  const dispatch = useDispatch();
  const isInWishlist = useSelector(selectIsInWishlist(product?._id));

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product || !product._id) return;

    try {
      const action = await dispatch(toggleWishlist(product));
      const message = action === "removed" ? "Item removed from wishlist" : "Item added to wishlist";
      dispatch(triggerToast(message, action === "removed" ? "info" : "success"));
    } catch (err) {
      dispatch(triggerToast(err.message || "Failed to update wishlist", "error"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${
        isInWishlist
          ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-sm"
          : "bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-200"
      } ${className}`}
      title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Heart className={`w-4 h-4 ${isInWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}
