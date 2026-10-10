const Product = require("../models/Product");
const Category = require("../models/Category");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const NewsletterSubscriber = require("../models/NewsletterSubscriber");
const { getRedis } = require("../config/redis");
const { sendNewsletterWelcomeEmail } = require("../services/emailService");

/**
 * Universal Redis Cache wrapper with graceful fallback to MongoDB
 */
async function withRedisCache(key, ttlSeconds, fetchFn) {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Fallback to database on Redis read glitch
    }
  }

  const fresh = await fetchFn();

  if (redis && fresh !== undefined && fresh !== null) {
    try {
      await redis.set(key, JSON.stringify(fresh), "EX", ttlSeconds);
    } catch {
      // Non-blocking cache write error
    }
  }

  return fresh;
}

/**
 * Clear specific Redis cache patterns (e.g. after catalog update)
 */
async function invalidateCache(pattern) {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Non-blocking
  }
}

/**
 * Formats a raw MongoDB Product document into clean, normalized GraphQL shape
 */
function formatProduct(p) {
  if (!p) return null;

  const imageList =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images
          .map((img) =>
            typeof img === "string"
              ? img
              : img?.publicUrl || img?.previewUrl || img?.url || null
          )
          .filter(Boolean)
      : ["https://placehold.co/600x600?text=Brundavanam+Product"];

  const rawPrice = Number(p.price || 0);
  const rawDiscount = Number(p.discountPrice || 0);
  let sellingPrice = rawPrice;
  let comparePrice = null;

  if (rawDiscount > 0 && rawPrice > 0) {
    if (rawDiscount > rawPrice) {
      sellingPrice = rawPrice;
      comparePrice = rawDiscount;
    } else {
      sellingPrice = rawDiscount;
      comparePrice = rawPrice;
    }
  }

  const hasDiscount = Boolean(comparePrice && comparePrice > sellingPrice);
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - sellingPrice) / comparePrice) * 100)
    : 0;
  const savingsAmount = hasDiscount ? comparePrice - sellingPrice : 0;

  return {
    id: p._id ? p._id.toString() : "",
    name: p.name || "",
    slug: p.slug || "",
    sku: p.sku || "",
    brand: p.brand || "Brundavanam",
    category: p.category
      ? {
          id: p.category._id ? p.category._id.toString() : p.category.toString(),
          name: p.category.name || "",
          slug: p.category.slug || "",
          description: p.category.description || "",
          image: p.category.image || "",
          isActive: p.category.isActive ?? true,
          sortOrder: p.category.sortOrder || 0,
        }
      : null,
    subcategory: p.subcategory
      ? {
          id: p.subcategory._id
            ? p.subcategory._id.toString()
            : p.subcategory.toString(),
          name: p.subcategory.name || "",
          slug: p.subcategory.slug || "",
        }
      : null,
    shortDescription: p.shortDescription || "",
    description: p.description || "",
    price: sellingPrice,
    discountPrice: comparePrice,
    stock: p.stock !== undefined ? Number(p.stock) : 0,
    inStock: Number(p.stock || 0) > 0,
    discountPercent,
    savingsAmount,
    weight: p.weight !== undefined && p.weight !== null ? Number(p.weight) : 0.1,
    weightValue: p.weightValue !== undefined && p.weightValue !== null ? Number(p.weightValue) : (p.weight ? Math.round(p.weight * 1000) : 100),
    weightUnit: p.weightUnit || "g",
    dimensions: p.dimensions
      ? {
          length: Number(p.dimensions.length || 10),
          breadth: Number(p.dimensions.breadth || 10),
          height: Number(p.dimensions.height || 10),
        }
      : { length: 10, breadth: 10, height: 10 },
    images: imageList,
    variants: Array.isArray(p.variants)
      ? p.variants.map((v) => ({
          id: v._id ? v._id.toString() : null,
          label: v.label || "",
          sku: v.sku || "",
          price: Number(v.price || 0),
          discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
          stock: v.stock !== undefined ? Number(v.stock) : 0,
          weight: v.weight !== undefined && v.weight !== null ? Number(v.weight) : null,
          weightValue: v.weightValue !== undefined && v.weightValue !== null ? Number(v.weightValue) : null,
          weightUnit: v.weightUnit || p.weightUnit || "g",
        }))
      : [],
    attributes: Array.isArray(p.attributes) ? p.attributes : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    isFeatured: Boolean(p.isFeatured),
    ratingsAverage: p.ratingsAverage || 4.9,
    ratingsCount: p.ratingsCount || 24,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : null,
  };
}

/**
 * Calculates cart totals & delivery fee
 */
function computeCart(cartDoc) {
  if (!cartDoc || !Array.isArray(cartDoc.items)) {
    return { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };
  }

  let subtotal = 0;
  let itemCount = 0;

  const items = cartDoc.items
    .filter((i) => i.product && !i.product.isDeleted && i.product.isActive !== false)
    .map((item) => {
      const formattedProd = formatProduct(item.product);
      const price = formattedProd ? formattedProd.price : 0;
      const qty = item.quantity || 1;
      const itemTotal = price * qty;

      subtotal += itemTotal;
      itemCount += qty;

      return {
        id: item._id ? item._id.toString() : null,
        productId: item.product._id ? item.product._id.toString() : item.product.toString(),
        product: formattedProd,
        variantId: item.variantId ? item.variantId.toString() : null,
        variantLabel: item.variantLabel || "",
        quantity: qty,
        price,
        total: itemTotal,
      };
    });

  const deliveryFee = subtotal >= 1500 || subtotal === 0 ? 0 : 99;
  const total = subtotal + deliveryFee;

  return { items, subtotal, deliveryFee, total, itemCount };
}

/**
 * Resolvers Map
 */
const resolvers = {
  /**
   * 1. Golden Storefront Initial Query
   * Pulls categories, featured offerings, spotlight deal, and user cart/wishlist
   * in ONE ultra-fast roundtrip, with Redis caching.
   */
  async storefrontInitial({ limit = 8 }, context) {
    // 1. Fetch categories from Redis (TTL: 30 minutes)
    const categories = await withRedisCache("gql:categories", 1800, async () => {
      const docs = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean();
      return docs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "",
        isActive: c.isActive,
        sortOrder: c.sortOrder || 0,
      }));
    });

    // 2. Fetch featured products from Redis (TTL: 10 minutes)
    const featuredProducts = await withRedisCache(
      `gql:featured:${limit}`,
      600,
      async () => {
        const docs = await Product.find({
          isActive: { $ne: false },
          isDeleted: { $ne: true },
        })
          .populate("category", "name slug")
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(limit)
          .lean();
        return docs.map(formatProduct);
      }
    );

    // 3. Spotlight Deals (TTL: 10 minutes)
    const deals = await withRedisCache("gql:deals", 600, async () => {
      const docs = await Product.find({
        isActive: { $ne: false },
        isDeleted: { $ne: true },
        $or: [{ discountPrice: { $gt: 0 } }, { isFeatured: true }],
      })
        .populate("category", "name slug")
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(2)
        .lean();
      return docs.map(formatProduct);
    });

    // 4. User context (if authenticated via cookie / JWT)
    let me = null;
    let cart = { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };
    let wishlist = { items: [], itemCount: 0 };

    if (context?.user) {
      const u = context.user;
      me = {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isAdmin: Boolean(u.isAdmin || u.role === "admin" || u.role === "super_admin"),
        isActive: u.isActive,
        addresses: Array.isArray(u.addresses)
          ? u.addresses.map((a) => ({
              id: a._id ? a._id.toString() : null,
              label: a.label,
              fullName: a.fullName,
              phone: a.phone,
              line1: a.line1,
              line2: a.line2,
              city: a.city,
              state: a.state,
              postalCode: a.postalCode,
              country: a.country,
              isDefault: a.isDefault,
            }))
          : [],
      };

      // Pull cart
      const cartDoc = await Cart.findOne({ user: u._id }).populate({
        path: "items.product",
        populate: { path: "category", select: "name slug" },
      });
      cart = computeCart(cartDoc);

      // Pull wishlist
      const wishDoc = await Wishlist.findOne({ user: u._id }).populate({
        path: "products.product",
        populate: { path: "category", select: "name slug" },
      });
      if (wishDoc && Array.isArray(wishDoc.products)) {
        const validWish = wishDoc.products
          .filter((w) => w.product && !w.product.isDeleted && w.product.isActive !== false)
          .map((w) => ({
            id: w._id ? w._id.toString() : null,
            product: formatProduct(w.product),
            addedAt: w.addedAt ? new Date(w.addedAt).toISOString() : null,
          }));
        wishlist = { items: validWish, itemCount: validWish.length };
      }
    }

    return {
      me,
      categories,
      featuredProducts,
      deals,
      cart,
      wishlist,
      cacheSource: "Redis-Optimized",
    };
  },

  /**
   * 2. Products Query with Dynamic Filters
   */
  async products({ category, search, featured, limit = 50, skip = 0 }) {
    const filter = { isActive: { $ne: false }, isDeleted: { $ne: true } };

    if (category && category !== "all") {
      const catDoc = await Category.findOne({ slug: category });
      if (catDoc) filter.category = catDoc._id;
    }

    if (featured === true) {
      filter.isFeatured = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ];
    }

    const docs = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return docs.map(formatProduct);
  },

  /**
   * 3. Single Product Detail Query with Related items
   */
  async product({ slug }) {
    return withRedisCache(`gql:product:${slug}`, 900, async () => {
      let product = await Product.findOne({
        slug,
        isActive: { $ne: false },
        isDeleted: { $ne: true },
      })
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .lean();

      if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
        product = await Product.findOne({
          _id: slug,
          isActive: { $ne: false },
          isDeleted: { $ne: true },
        })
          .populate("category", "name slug")
          .populate("subcategory", "name slug")
          .lean();
      }

      if (!product) return null;

      const relatedDocs = await Product.find({
        category: product.category?._id || product.category,
        _id: { $ne: product._id },
        isActive: { $ne: false },
        isDeleted: { $ne: true },
      })
        .populate("category", "name slug")
        .limit(4)
        .lean();

      return {
        product: formatProduct(product),
        related: relatedDocs.map(formatProduct),
      };
    });
  },

  /**
   * 4. Categories Query
   */
  async categories({ all = false }) {
    const filter = all ? {} : { isActive: true };
    return withRedisCache(`gql:categories:${all}`, 1800, async () => {
      const docs = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
      return docs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        description: c.description || "",
        image: c.image || "",
        isActive: c.isActive,
        sortOrder: c.sortOrder || 0,
      }));
    });
  },

  /**
   * 5. Current Authenticated User
   */
  async me(_, context) {
    if (!context?.user) return null;
    const u = context.user;
    return {
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isAdmin: Boolean(u.isAdmin || u.role === "admin" || u.role === "super_admin"),
      isActive: u.isActive,
      addresses: Array.isArray(u.addresses) ? u.addresses : [],
    };
  },

  /**
   * 6. Current User Cart
   */
  async cart(_, context) {
    if (!context?.user) {
      return { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };
    }
    const cartDoc = await Cart.findOne({ user: context.user._id }).populate({
      path: "items.product",
      populate: { path: "category", select: "name slug" },
    });
    return computeCart(cartDoc);
  },

  /**
   * 7. Current User Wishlist
   */
  async wishlist(_, context) {
    if (!context?.user) {
      return { items: [], itemCount: 0 };
    }
    const wishDoc = await Wishlist.findOne({ user: context.user._id }).populate({
      path: "products.product",
      populate: { path: "category", select: "name slug" },
    });
    if (!wishDoc || !Array.isArray(wishDoc.products)) {
      return { items: [], itemCount: 0 };
    }
    const items = wishDoc.products
      .filter((w) => w.product && !w.product.isDeleted && w.product.isActive !== false)
      .map((w) => ({
        id: w._id ? w._id.toString() : null,
        product: formatProduct(w.product),
        addedAt: w.addedAt ? new Date(w.addedAt).toISOString() : null,
      }));
    return { items, itemCount: items.length };
  },

  /**
   * 8. Search Products
   */
  async searchProducts({ query, limit = 10 }) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const docs = await Product.find({
      isActive: { $ne: false },
      isDeleted: { $ne: true },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
        { tags: { $regex: q, $options: "i" } },
      ],
    })
      .populate("category", "name slug")
      .limit(limit)
      .lean();
    return docs.map(formatProduct);
  },

  /**
   * MUTATIONS
   */
  async addToCart({ productId, variantId, variantLabel, quantity = 1 }, context) {
    if (!context?.user) {
      throw new Error("Authentication required to modify persistent cart.");
    }
    const product = await Product.findById(productId);
    if (!product || product.isDeleted || product.isActive === false) {
      throw new Error("Product is unavailable or out of stock.");
    }

    let cart = await Cart.findOne({ user: context.user._id });
    if (!cart) cart = new Cart({ user: context.user._id, items: [] });

    // Sanitize variantId against actual product variants
    let sanitizedVariantId = null;
    let sanitizedVariantLabel = variantLabel || "";
    if (variantId && Array.isArray(product.variants) && product.variants.length > 0) {
      const matched = product.variants.find(
        (v) => v._id?.toString() === variantId.toString()
      );
      if (matched) {
        sanitizedVariantId = matched._id;
        sanitizedVariantLabel = matched.label || sanitizedVariantLabel;
      }
    }

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (sanitizedVariantId
          ? item.variantId?.toString() === sanitizedVariantId.toString()
          : !item.variantId)
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        variantId: sanitizedVariantId,
        variantLabel: sanitizedVariantLabel,
        quantity,
      });
    }

    await cart.save();
    const updated = await Cart.findById(cart._id).populate({
      path: "items.product",
      populate: { path: "category", select: "name slug" },
    });
    return computeCart(updated);
  },

  async updateCartQuantity({ productId, variantId, quantity }, context) {
    if (!context?.user) {
      throw new Error("Authentication required to modify cart.");
    }
    let cart = await Cart.findOne({ user: context.user._id });
    if (!cart) return { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };

    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) =>
          !(
            item.product.toString() === productId &&
            (variantId ? item.variantId?.toString() === variantId : !item.variantId)
          )
      );
    } else {
      const idx = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          (variantId ? item.variantId?.toString() === variantId : !item.variantId)
      );
      if (idx > -1) cart.items[idx].quantity = quantity;
    }

    await cart.save();
    const updated = await Cart.findById(cart._id).populate({
      path: "items.product",
      populate: { path: "category", select: "name slug" },
    });
    return computeCart(updated);
  },

  async removeFromCart({ productId, variantId }, context) {
    if (!context?.user) {
      throw new Error("Authentication required to modify cart.");
    }
    let cart = await Cart.findOne({ user: context.user._id });
    if (!cart) return { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          (variantId ? item.variantId?.toString() === variantId : !item.variantId)
        )
    );

    await cart.save();
    const updated = await Cart.findById(cart._id).populate({
      path: "items.product",
      populate: { path: "category", select: "name slug" },
    });
    return computeCart(updated);
  },

  async clearCart(_, context) {
    if (!context?.user) return { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };
    await Cart.findOneAndUpdate({ user: context.user._id }, { items: [] });
    return { items: [], subtotal: 0, deliveryFee: 0, total: 0, itemCount: 0 };
  },

  async toggleWishlist({ productId }, context) {
    if (!context?.user) {
      throw new Error("Please log in to manage your wishlist.");
    }
    let wishlist = await Wishlist.findOne({ user: context.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: context.user._id, products: [] });

    const idx = wishlist.products.findIndex(
      (p) => p.product.toString() === productId
    );

    if (idx > -1) {
      wishlist.products.splice(idx, 1);
    } else {
      wishlist.products.push({ product: productId, addedAt: new Date() });
    }

    await wishlist.save();
    const updated = await Wishlist.findById(wishlist._id).populate({
      path: "products.product",
      populate: { path: "category", select: "name slug" },
    });

    const valid = updated.products
      .filter((w) => w.product && !w.product.isDeleted && w.product.isActive !== false)
      .map((w) => ({
        id: w._id ? w._id.toString() : null,
        product: formatProduct(w.product),
        addedAt: w.addedAt ? new Date(w.addedAt).toISOString() : null,
      }));

    return { items: valid, itemCount: valid.length };
  },

  async subscribeNewsletter({ email, source = "graphql" }) {
    const cleanEmail = email.trim().toLowerCase();
    let subscriber = await NewsletterSubscriber.findOne({ email: cleanEmail });

    if (subscriber) {
      if (subscriber.status === "active") {
        return {
          success: true,
          isAlreadySubscribed: true,
          message: "You are already subscribed to the Brundavanam Goshala newsletter! Thank you.",
        };
      }
      subscriber.status = "active";
      subscriber.subscribedAt = new Date();
      await subscriber.save();
      sendNewsletterWelcomeEmail({ email: cleanEmail }).catch(() => {});
      return {
        success: true,
        message: "Welcome back! Your subscription has been reactivated.",
      };
    }

    await NewsletterSubscriber.create({
      email: cleanEmail,
      status: "active",
      source,
      subscribedAt: new Date(),
    });
    sendNewsletterWelcomeEmail({ email: cleanEmail }).catch(() => {});

    return {
      success: true,
      message: "Thank you for subscribing to Brundavanam Goshala newsletter!",
    };
  },

  async unsubscribeNewsletter({ email }) {
    const cleanEmail = email.trim().toLowerCase();
    await NewsletterSubscriber.findOneAndUpdate(
      { email: cleanEmail },
      { status: "unsubscribed", unsubscribedAt: new Date() }
    );
    return {
      success: true,
      message: "You have been unsubscribed from newsletter updates.",
    };
  },
};

module.exports = { resolvers, formatProduct, invalidateCache };
