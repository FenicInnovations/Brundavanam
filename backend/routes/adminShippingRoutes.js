const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getShippingSettings,
  updateShippingSettings,
  getShiprocketPickupLocations,
} = require("../controllers/adminShippingController");

// Secure all admin shipping settings endpoints
router.use(protect, adminOnly);

router.get("/settings", getShippingSettings);
router.patch("/settings", updateShippingSettings);
router.get("/pickup-locations", getShiprocketPickupLocations);

module.exports = router;
