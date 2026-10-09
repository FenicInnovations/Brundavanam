const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const { getCartWishlistAnalytics } = require("../controllers/adminAnalyticsController");

router.use(protect, adminOnly);

router.get("/cart-wishlist", getCartWishlistAnalytics);

module.exports = router;
