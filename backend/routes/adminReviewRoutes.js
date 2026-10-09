const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getAllReviewsAdmin,
  toggleReviewStatus,
  deleteReview,
} = require("../controllers/reviewController");

// Secure all admin review endpoints
router.use(protect, adminOnly);

router.get("/", getAllReviewsAdmin);
router.patch("/:id/status", toggleReviewStatus);
router.delete("/:id", deleteReview);

module.exports = router;
