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
        id: null,
        label: p.unit || "Standard Pack",
        price: sellingPrice,
        compareAtPrice: comparePrice,
        stock: p.stock !== undefined ? Number(p.stock) : 100,
        isFallback: true,
      },
    ];
  } else {
    // Ensure every real variant has id, price, and compareAtPrice
    variants = variants.map((v, i) => ({
      ...v,
      id: v._id ? v._id.toString() : (v.id || null),
      price: v.price !== undefined ? Number(v.price) : sellingPrice,
      compareAtPrice: v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : comparePrice,
      stock: v.stock !== undefined ? Number(v.stock) : 50,
      weight: v.weight !== undefined ? v.weight : null,
      weightValue: v.weightValue !== undefined ? v.weightValue : null,
      weightUnit: v.weightUnit || p.weightUnit || "g",
      isFallback: false,
    }));
  }

  const categoryId =
    typeof p.category === "object"
      ? (p.category?._id?.toString?.() || p.category?.id || p.category?._id || "")
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
    weight: p.weight !== undefined ? p.weight : 0.1,
    weightValue: p.weightValue !== undefined ? p.weightValue : 100,
    weightUnit: p.weightUnit || "g",
    dimensions: p.dimensions || { length: 10, breadth: 10, height: 10 },
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
 * Fetches published products via GraphQL (requesting only required fields),
 * with graceful fallback to REST if needed.
 */
export async function fetchStorefrontProducts(options = {}) {
  // 1. Primary: Ultra-fast GraphQL query requesting only storefront fields
  try {
    const { gqlRequest } = await import("@/lib/graphql/client");
    const { GET_PRODUCTS_QUERY } = await import("@/lib/graphql/queries");

    const data = await gqlRequest(GET_PRODUCTS_QUERY, {
      category: options.category || undefined,
      search: options.search || undefined,
      featured: options.featured || undefined,
      limit: options.limit || 50,
      skip: options.skip || 0,
    });

    if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
      return data.products.map(normalizeProduct);
    }
  } catch (err) {
    console.warn("[productUtils:GraphQL] Falling back to REST for products:", err?.message || err);
  }

  // 2. Fallback: REST endpoint
  try {
    const res = await apiClient.get("/products");
    const rawList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    if (rawList.length > 0) {
      return rawList.map(normalizeProduct);
    }
  } catch (err) {
    console.warn("[productUtils:REST] Could not fetch live products:", err?.message || err);
  }

  return [];
}

/**
 * Fetches single product details by slug/id via GraphQL first, fallback to REST.
 */
export async function fetchStorefrontProductBySlug(slug) {
  // 1. Primary: GraphQL single product query
  try {
    const { gqlRequest } = await import("@/lib/graphql/client");
    const { GET_PRODUCT_BY_SLUG_QUERY } = await import("@/lib/graphql/queries");

    const data = await gqlRequest(GET_PRODUCT_BY_SLUG_QUERY, { slug });
    if (data?.product?.product) {
      return {
        product: normalizeProduct(data.product.product),
        related: Array.isArray(data.product.related)
          ? data.product.related.map(normalizeProduct)
          : [],
      };
    }
  } catch (err) {
    console.warn("[productUtils:GraphQL] Falling back to REST for product:", err?.message || err);
  }

  // 2. Fallback: REST endpoint
  try {
    const res = await apiClient.get(`/products/${slug}`);
    if (res?.data) {
      return {
        product: normalizeProduct(res.data),
        related: Array.isArray(res.related) ? res.related.map(normalizeProduct) : [],
      };
    }
  } catch (err) {
    console.warn("[productUtils:REST] Could not fetch product by slug:", err?.message || err);
  }

  return { product: null, related: [] };
}

/**
 * Zero-Waterfall Golden Query: Fetches entire storefront initial state
 * (Categories, Featured Products, Deals, and User context) in 1 single roundtrip.
 * Fully backed by Redis in backend.
 */
export async function fetchStorefrontInitial(limit = 8) {
  try {
    const { gqlRequest } = await import("@/lib/graphql/client");
    const { STOREFRONT_INITIAL_QUERY } = await import("@/lib/graphql/queries");

    const data = await gqlRequest(STOREFRONT_INITIAL_QUERY, { limit });
    if (data?.storefrontInitial) {
      const initial = data.storefrontInitial;
      return {
        categories: Array.isArray(initial.categories) ? initial.categories : [],
        featuredProducts: Array.isArray(initial.featuredProducts)
          ? initial.featuredProducts.map(normalizeProduct)
          : [],
        deals: Array.isArray(initial.deals)
          ? initial.deals.map(normalizeProduct)
          : [],
        me: initial.me || null,
        cart: initial.cart || null,
        wishlist: initial.wishlist || null,
        cacheSource: initial.cacheSource || "Database",
      };
    }
  } catch (err) {
    console.warn("[productUtils:GraphQL] storefrontInitial query fallback:", err?.message || err);
  }

  // Fallback: load products via existing method
  const fallbackProducts = await fetchStorefrontProducts();
  return {
    categories: [],
    featuredProducts: fallbackProducts.slice(0, limit),
    deals: fallbackProducts.slice(0, 1),
    me: null,
    cart: null,
    wishlist: null,
    cacheSource: "Fallback",
  };
}

export const DEFAULT_PRODUCT_IMAGE = "/images/logo.png";

/**
 * Universal product image resolver. Safely extracts the primary image URL
 * whether products come from GraphQL (string array), MongoDB REST API (GCS file object array),
 * normalized storefront products, or raw cart/wishlist items.
 */
export function resolveProductImage(product, fallback = DEFAULT_PRODUCT_IMAGE) {
  if (!product) return fallback;

  // Direct string URL passed
  if (typeof product === "string" && product.trim() && !product.includes("[object Object]")) {
    return product;
  }

  // If a wrapper item was passed (e.g. { product: { ... } })
  if (product.product && typeof product.product === "object") {
    return resolveProductImage(product.product, fallback);
  }

  // 1. Array of images
  if (Array.isArray(product.images) && product.images.length > 0) {
    // Check for primary image object first
    const primaryObj = product.images.find(
      (img) =>
        typeof img === "object" &&
        img !== null &&
        Boolean(img.isPrimary) &&
        Boolean(img.publicUrl || img.previewUrl || img.url)
    );
    if (primaryObj) {
      return primaryObj.publicUrl || primaryObj.previewUrl || primaryObj.url;
    }

    // Iterate through items to find first valid image URL or object
    for (const img of product.images) {
      if (typeof img === "string" && img.trim() && !img.includes("[object Object]")) {
        return img;
      }
      if (typeof img === "object" && img !== null) {
        const url = img.publicUrl || img.previewUrl || img.url;
        if (typeof url === "string" && url.trim()) {
          return url;
        }
      }
    }
  }

  // 2. Direct image properties
  if (typeof product.image === "string" && product.image.trim()) {
    return product.image;
  }
  if (typeof product.image === "object" && product.image !== null) {
    const url = product.image.publicUrl || product.image.previewUrl || product.image.url;
    if (typeof url === "string" && url.trim()) {
      return url;
    }
  }

  if (typeof product.publicUrl === "string" && product.publicUrl.trim()) {
    return product.publicUrl;
  }

  if (typeof product.thumbnail === "string" && product.thumbnail.trim()) {
    return product.thumbnail;
  }

  if (typeof product.photo === "string" && product.photo.trim()) {
    return product.photo;
  }

  return fallback;
}


