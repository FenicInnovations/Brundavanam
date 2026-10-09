const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  createReview,
  getProductReviews,
} = require("../controllers/reviewController");

// Public routes
router.get("/product/:productId", getProductReviews);

// Protected routes (Customers)
router.use(protect);
router.post("/", createReview);

module.exports = router;
