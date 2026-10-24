const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const {
  checkout,
  calculateShipping,
  getShippingConfig,
  verifyPayment,
  paymentFailed,
  getMyOrders,
  getOrderById,
  trackOrder,
  cancelMyOrder,
  requestReturn,
  downloadInvoice,
} = require("../controllers/orderController");

// Public & Guest-accessible endpoints with optional authentication
router.get("/shipping/config", optionalAuth, getShippingConfig);
router.post("/shipping/calculate", optionalAuth, calculateShipping);
router.post("/checkout", optionalAuth, checkout);
router.post("/verify-payment", optionalAuth, verifyPayment);
router.post("/payment-failed", optionalAuth, paymentFailed);
router.get("/track", optionalAuth, trackOrder);

// Customer account endpoints requiring login (MUST be declared before /:id)
router.get("/my-orders", protect, getMyOrders);
router.post("/:id/cancel", protect, cancelMyOrder);
router.post("/:id/return", protect, requestReturn);

// Specific order by ID
router.get("/:id", optionalAuth, getOrderById);
router.get("/:id/invoice", optionalAuth, downloadInvoice);

module.exports = router;

