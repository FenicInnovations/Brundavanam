const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getAllCustomers,
  toggleCustomerStatus,
} = require("../controllers/adminCustomerController");

// Secure all admin customer endpoints
router.use(protect, adminOnly);

router.get("/", getAllCustomers);
router.patch("/:id/status", toggleCustomerStatus);

module.exports = router;
