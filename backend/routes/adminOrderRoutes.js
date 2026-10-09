const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createShipment,
  trackShipment,
  issueRefund,
  regenerateInvoice,
  approveReturn,
  rejectReturn,
  confirmReturnReceived,
  downloadInvoice,
  getShippingLabel,
} = require("../controllers/adminOrderController");

// Secure all admin order endpoints
router.use(protect, adminOnly);

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.get("/:id/invoice", downloadInvoice);
router.get("/:id/label", getShippingLabel);
router.patch("/:id/status", updateOrderStatus);
router.post("/:id/ship", createShipment);
router.get("/:id/track", trackShipment);
router.post("/:id/refund", issueRefund);
router.post("/:id/invoice/regenerate", regenerateInvoice);
router.post("/:id/return/approve", approveReturn);
router.post("/:id/return/reject", rejectReturn);
router.post("/:id/return/receive", confirmReturnReceived);

module.exports = router;

