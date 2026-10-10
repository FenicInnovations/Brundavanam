import { apiClient } from "@/lib/api/apiClient";

/**
 * Normalizes any product object (from MongoDB database API or mock products)
 * into a standard format compatible with all storefront components.
 */
export function normalizeProduct(p) {
  if (!p) return null;

  // Extract images array
  let imageList = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    imageList = p.images.map((img) => {
      if (typeof img === "string") return img;
      return img?.publicUrl || img?.previewUrl || img?.url || "https://placehold.co/600x600?text=Product+Image";
    });
  } else {
    imageList = ["https://placehold.co/600x600?text=Brundavanam+Product"];
  }

  const rawPrice = p.price !== undefined ? Number(p.price) : Number(p.basePrice || 0);
  const rawDiscountPrice = p.discountPrice !== undefined ? Number(p.discountPrice) : 0;
  const rawComparePrice = p.compareAtPrice !== undefined ? Number(p.compareAtPrice) : 0;

  let sellingPrice = rawPrice;
  let comparePrice = null;

  // Fully dynamic price parsing from database:
  // In Brundavanam schema:
  // - If discountPrice > price: price is the discounted selling price (e.g. 199), discountPrice is the actual original price (e.g. 219)
  // - If discountPrice < price: discountPrice is the discounted selling price (e.g. 199), price is the actual original price (e.g. 219)
  if (rawDiscountPrice > 0 && rawPrice > 0) {
    if (rawDiscountPrice > rawPrice) {
      sellingPrice = rawPrice;
      comparePrice = rawDiscountPrice;
    } else if (rawDiscountPrice < rawPrice) {
      sellingPrice = rawDiscountPrice;
      comparePrice = rawPrice;
    }
  } else if (rawComparePrice > 0 && rawComparePrice > rawPrice) {
    sellingPrice = rawPrice;
    comparePrice = rawComparePrice;
  }

  const hasDiscount = Boolean(comparePrice && comparePrice > sellingPrice);
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100)
    : null;
  const savingsAmount = hasDiscount ? comparePrice - sellingPrice : 0;

  // Fallback variants if empty
  let variants = p.variants;
  if (!Array.isArray(variants) || variants.length === 0) {
    variants = [
      {
        id: p._id || p.slug || "v_default",
        label: p.unit || "Standard Pack",
        price: sellingPrice,
        compareAtPrice: comparePrice,
        stock: p.stock !== undefined ? Number(p.stock) : 100,
      },
    ];
  } else {
    // Ensure every variant has price and compareAtPrice
    variants = variants.map((v, i) => ({
      ...v,
      id: v.id || v._id || `v_${i}`,
      price: v.price !== undefined ? Number(v.price) : sellingPrice,
      compareAtPrice: v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : comparePrice,
      stock: v.stock !== undefined ? Number(v.stock) : 50,
    }));
  }

  const categoryId =
    typeof p.category === "object"
      ? (p.category?._id?.toString?.() || p.category?._id || "")
      : (typeof p.category === "string" ? p.category : "");
  const categorySlug =
    typeof p.category === "object"
      ? (p.category?.slug || p.category?.name?.toLowerCase().replace(/\s+/g, "-") || "")
      : (typeof p.category === "string" ? p.category : "");
  const categoryName =
    typeof p.category === "object"
      ? (p.category?.name || p.category?.slug || "")
      : (typeof p.category === "string" ? p.category : "");

  return {
    ...p,
    id: p._id || p.id || p.slug,
    _id: p._id || p.id || p.slug,
    name: p.name || "Brundavanam Product",
    slug: p.slug || `product-${Date.now()}`,
    shortDescription: p.shortDescription || p.description || "",
    description: p.description || p.shortDescription || "",
    price: sellingPrice,
    basePrice: sellingPrice,
    compareAtPrice: comparePrice,
    originalPrice: comparePrice,
    hasDiscount,
    discountPercent,
    savingsAmount,
    images: imageList,
    variants,
    stock: p.stock !== undefined ? Number(p.stock) : 100,
    category: categorySlug || "general",
    categoryId,
    categorySlug,
    categoryName: categoryName || "General",
    rawCategory: p.category,
    ratingsAverage: p.ratingsAverage || 4.9,
    ratingsCount: p.ratingsCount || 24,
    isFeatured: Boolean(p.isFeatured),
  };
}

/**
 * Fetches published products from backend MongoDB database.
 */
export async function fetchStorefrontProducts() {
  try {
    const res = await apiClient.get("/products");
    const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    if (rawList.length > 0) {
      return rawList.map(normalizeProduct);
    }
  } catch (err) {
    console.warn("[productUtils] Could not fetch live products from API:", err.message);
  }

  return [];
}

/**
 * Fetches single product details by slug/id.
 */
export async function fetchStorefrontProductBySlug(slug) {
  try {
    const res = await apiClient.get(`/products/${slug}`);
    if (res?.data) {
      return {
        product: normalizeProduct(res.data),
        related: Array.isArray(res.related) ? res.related.map(normalizeProduct) : [],
      };
    }
  } catch (err) {
    console.warn("[productUtils] Could not fetch product by slug from API:", err.message);
  }

  return { product: null, related: [] };
}

