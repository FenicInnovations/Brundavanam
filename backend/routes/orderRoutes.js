const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const {
  checkout,
  calculateShipping,
  verifyPayment,
  paymentFailed,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  requestReturn,
  downloadInvoice,
} = require("../controllers/orderController");

// Pincode rate calculation is accessible with optional auth
router.post("/shipping/calculate", optionalAuth, calculateShipping);

// Customer order management endpoints require authentication
router.use(protect);

router.post("/checkout", checkout);
router.post("/verify-payment", verifyPayment);
router.post("/payment-failed", paymentFailed);
router.get("/my-orders", getMyOrders);
router.get("/:id", getOrderById);
router.post("/:id/cancel", cancelMyOrder);
router.post("/:id/return", requestReturn);
router.get("/:id/invoice", downloadInvoice);

module.exports = router;

