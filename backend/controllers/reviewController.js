const Review = require("../models/Review");
const Product = require("../models/Product");

/**
 * POST /api/reviews
 * Create a new review (Auth required)
 */
async function createReview(req, res, next) {
  try {
    const { product, rating, title, comment } = req.body;

    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ product, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      product,
      user: req.user._id,
      rating,
      title,
      comment,
    });

    res.status(201).json({ success: true, review });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reviews/product/:productId
 * Get reviews for a product (Public)
 */
async function getProductReviews(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = { product: req.params.productId, isApproved: true };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/reviews
 * Get all reviews for admin with pagination
 */
async function getAllReviewsAdmin(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const [reviews, total] = await Promise.all([
      Review.find({})
        .populate("user", "name email")
        .populate("product", "name images")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Review.countDocuments({}),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/reviews/:id/status
 * Toggle review approval status
 */
async function toggleReviewStatus(req, res, next) {
  try {
    const { isApproved } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.isApproved = isApproved;
    await review.save();

    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'hidden'} successfully`,
      review,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/reviews/:id
 * Delete a review permanently
 */
async function deleteReview(req, res, next) {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getProductReviews,
  getAllReviewsAdmin,
  toggleReviewStatus,
  deleteReview,
};
