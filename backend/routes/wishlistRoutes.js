const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getWishlist,
  toggleWishlist,
  mergeWishlist,
} = require("../controllers/wishlistController");

router.use(protect);

router.get("/", getWishlist);
router.post("/toggle", toggleWishlist);
router.post("/merge", mergeWishlist);

module.exports = router;
