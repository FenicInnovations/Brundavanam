const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getShippingSettings,
  updateShippingSettings,
} = require("../controllers/adminShippingController");

// Secure all admin shipping settings endpoints
router.use(protect, adminOnly);

router.get("/settings", getShippingSettings);
router.patch("/settings", updateShippingSettings);

module.exports = router;
