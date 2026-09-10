import { getAllProducts } from "@/lib/mockProducts";
import ShopView from "@/components/shop/ShopView";

export const metadata = {
  title: "Shop",
  description:
    "Traditional ghee, panchagavya products, and puja essentials from Brundavanam Goshala.",
};

// Stage 3 replaces this with a server-side fetch to GET /api/products.
export default function ShopPage() {
  const products = getAllProducts();
  return <ShopView products={products} />;
}
