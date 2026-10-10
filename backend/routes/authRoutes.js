const express = require("express");
const { sendOtp, verifyOtp, me, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { requireRedis } = require("../config/redis");
const { otpIpRateLimit } = require("../middleware/rateLimit");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const router = express.Router();

router.post("/send-otp", requireRedis, otpIpRateLimit, sendOtp);
router.post("/verify-otp", requireRedis, verifyOtp);
router.get("/me", protect, me);
router.post("/logout", logout);

// Customer saved addresses
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:id", protect, updateAddress);
router.delete("/addresses/:id", protect, deleteAddress);
router.patch("/addresses/:id/default", protect, setDefaultAddress);

module.exports = router;