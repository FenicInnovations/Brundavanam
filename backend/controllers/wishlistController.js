const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

/**
 * Helper to fetch populated user wishlist
 */
async function getPopulatedWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "products.product",
    select: "name slug price discountPrice stock images isActive isDeleted category brand sku",
    populate: { path: "category", select: "name slug" },
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
    return { wishlist, products: [] };
  }

  // Filter out soft-deleted or inactive items
  const validProducts = wishlist.products.filter(
    (item) => item.product && item.product.isActive && !item.product.isDeleted
  );

  if (validProducts.length !== wishlist.products.length) {
    wishlist.products = validProducts;
    await wishlist.save();
  }

  return { wishlist, products: wishlist.products };
}

// GET /api/wishlist
async function getWishlist(req, res, next) {
  try {
    const { products } = await getPopulatedWishlist(req.user._id);
    res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/wishlist/toggle
async function toggleWishlist(req, res, next) {
  try {
    const { productId } = req.body;

    if (!productId) {
      const err = new Error("Product ID is required");
      err.statusCode = 400;
      throw err;
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const existingIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    let action = "added";
    if (existingIndex > -1) {
      wishlist.products.splice(existingIndex, 1);
      action = "removed";
    } else {
      const product = await Product.findById(productId);
      if (!product || product.isDeleted || !product.isActive) {
        const err = new Error("Product is unavailable");
        err.statusCode = 404;
        throw err;
      }
      wishlist.products.push({ product: productId });
    }

    await wishlist.save();
    const { products } = await getPopulatedWishlist(req.user._id);

    res.json({
      success: true,
      action,
      message: `Item ${action} ${action === "added" ? "to" : "from"} wishlist`,
      data: products,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/wishlist/merge
async function mergeWishlist(req, res, next) {
  try {
    const { guestItems = [] } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    for (const item of guestItems) {
      const productId = item.product?._id || item.productId || item.product;
      if (!productId) continue;

      const exists = wishlist.products.some(
        (p) => p.product.toString() === productId.toString()
      );

      if (!exists) {
        const product = await Product.findById(productId);
        if (product && !product.isDeleted && product.isActive) {
          wishlist.products.push({ product: productId });
        }
      }
    }

    await wishlist.save();
    const { products } = await getPopulatedWishlist(req.user._id);

    res.json({
      success: true,
      message: "Guest wishlist merged successfully",
      data: products,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWishlist,
  toggleWishlist,
  mergeWishlist,
};
