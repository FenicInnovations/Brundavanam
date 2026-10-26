import { Suspense } from "react";
import { fetchStorefrontProducts } from "@/lib/productUtils";
import ShopView from "@/components/shop/ShopView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Shop All Products | Brundavanam Goshala",
  description:
    "Traditional Vedic A2 Gir Cow Bilona Ghee, natural Gau Dhoop, and authentic temple puja essentials from Brundavanam Goshala.",
};

export default async function ShopPage() {
  const products = await fetchStorefrontProducts();

  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-ink-soft">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-xs font-semibold">Loading Goshala Offerings...</p>
        </div>
      }
    >
      <ShopView initialProducts={products} products={products} />
    </Suspense>
  );
}
