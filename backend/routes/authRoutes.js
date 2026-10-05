const express = require("express");
const { sendOtp, verifyOtp, me, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { requireRedis } = require("../config/redis");
const { otpIpRateLimit } = require("../middleware/rateLimit");

const router = express.Router();

router.post("/send-otp", requireRedis, otpIpRateLimit, sendOtp);
router.post("/verify-otp", requireRedis, verifyOtp);
router.get("/me", protect, me);
router.post("/logout", logout);

module.exports = router;