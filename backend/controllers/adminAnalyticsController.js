const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

/**
 * GET /api/admin/analytics/cart-wishlist
 * Get aggregated data for carts and wishlists
 */
async function getCartWishlistAnalytics(req, res, next) {
  try {
    // 1. Total Carts & Wishlists
    const [totalCarts, totalWishlists] = await Promise.all([
      Cart.countDocuments({ items: { $not: { $size: 0 } } }),
      Wishlist.countDocuments({ products: { $not: { $size: 0 } } }),
    ]);

    // 2. Top products in Carts
    const topCartProductsPipeline = [
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          count: 1,
          totalQuantity: 1,
          name: "$product.name",
          images: "$product.images",
          price: "$product.basePrice",
        },
      },
    ];

    // 3. Top products in Wishlists
    const topWishlistProductsPipeline = [
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          count: 1,
          name: "$product.name",
          images: "$product.images",
          price: "$product.basePrice",
        },
      },
    ];

    const [topCartProducts, topWishlistProducts] = await Promise.all([
      Cart.aggregate(topCartProductsPipeline),
      Wishlist.aggregate(topWishlistProductsPipeline),
    ]);

    res.json({
      success: true,
      analytics: {
        totals: {
          carts: totalCarts,
          wishlists: totalWishlists,
        },
        topCartProducts,
        topWishlistProducts,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCartWishlistAnalytics,
};
