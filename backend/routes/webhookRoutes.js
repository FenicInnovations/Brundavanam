const express = require("express");
const router = express.Router();
const {
  handleRazorpayWebhook,
  handleShiprocketWebhook,
} = require("../controllers/webhookController");

router.post("/razorpay", handleRazorpayWebhook);
router.post("/shiprocket", handleShiprocketWebhook);

module.exports = router;
