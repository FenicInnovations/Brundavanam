"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export default function CartPage() {
  const { lines, subtotal, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist } = useWishlist();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
        <h1 className="font-display text-2xl text-ink md:text-3xl">Your Cart</h1>
        <EmptyState
          title="Your cart is empty"
          message="Browse the shop and add something you'll love."
          actionLabel="Browse Shop"
          actionHref="/shop"
        />
      </div>
    );
  }

  const shipping = subtotal >= 1500 ? 0 : 79;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-2xl text-ink md:text-3xl">Your Cart</h1>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <div className="flex-1 divide-y">
          {lines.map((line) => (
            <div key={`${line.slug}-${line.variantId}`} className="flex gap-4 py-5">
              <Link
                href={`/product/${line.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-line"
              >
                <Image
                  src={line.product.images[0]}
                  alt={line.product.name}
                  width={200}
                  height={200}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link
                      href={`/product/${line.slug}`}
                      className="text-sm font-medium text-ink hover:text-accent-deep"
                    >
                      {line.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-soft">{line.variant.label}</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-ink">
                    ₹{line.variant.price * line.quantity}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center rounded border">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateQuantity(line.slug, line.variantId, line.quantity - 1)
                      }
                      className="flex h-8 w-8 items-center justify-center text-ink"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateQuantity(
                          line.slug,
                          line.variantId,
                          Math.min(line.variant.stock, line.quantity + 1)
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center text-ink"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-ink-soft">
                    <button
                      type="button"
                      aria-label="Move to wishlist"
                      onClick={() => {
                        toggleWishlist(line.slug);
                        removeFromCart(line.slug, line.variantId);
                      }}
                      className="hover:text-accent"
                    >
                      <Heart size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove"
                      onClick={() => removeFromCart(line.slug, line.variantId)}
                      className="hover:text-accent-deep"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit w-full rounded-xl border bg-surface p-6 lg:w-80">
          <p className="font-display text-lg text-ink">Order Summary</p>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span className="text-ink">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span className="text-ink">{shipping === 0 ? "Free" : `₹${shipping}`}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-ink-soft">
                Add ₹{1500 - subtotal} more for free shipping.
              </p>
            )}
            <div className="mt-2 flex justify-between border-t pt-3 text-base font-semibold text-ink">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          {/* Checkout isn't built yet — this ships in a later stage. */}
          <Button disabled className="mt-6 w-full">
            Proceed to Checkout
          </Button>
          <p className="mt-2 text-center text-xs text-ink-soft">
            Checkout arrives in a later stage.
          </p>
        </div>
      </div>
    </div>
  );
}
