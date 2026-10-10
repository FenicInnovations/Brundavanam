const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { normalizePhone, isValidIndianMobile } = require("../utils/phone");
const otpService = require("../services/otpService");
const { jwtSecret, jwtExpiresIn, nodeEnv } = require("../config/env");

const COOKIE_NAME = "accessToken";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  };
}

// POST /api/auth/send-otp
async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    console.log("sendOtp called with phone:", phone);

    if (!isValidIndianMobile(phone)) {
      const err = new Error("Invalid mobile number");
      err.statusCode = 400;
      throw err;
    }

    const normalized = normalizePhone(phone);
    console.log("Normalized phone number:", normalized,phone);

    try {
      await otpService.sendOtp(normalized);
    } catch (err) {
      if (err instanceof otpService.RateLimitError) {
        return res
          .status(429)
          .json({ success: false, message: err.message, retryAfterSeconds: err.retryAfterSeconds });
      }
      throw err;
    }

    // Same response whether or not this number already has an account —
    // avoids leaking account existence via response differences.
    res.json({ success: true, message: "OTP sent successfully." });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-otp
async function verifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body;

    if (!isValidIndianMobile(phone) || !/^\d{6}$/.test(otp || "")) {
      const err = new Error("Invalid mobile number or OTP");
      err.statusCode = 400;
      throw err;
    }

    const normalized = normalizePhone(phone);
    const result = await otpService.verifyOtp(normalized, otp);

    if (!result.valid) {
      const statusCode = result.reason.startsWith("Too many") ? 429 : 400;
      return res.status(statusCode).json({ success: false, message: result.reason });
    }

    // Atomic find-or-create avoids a race between two verify calls for
    // a brand-new number creating duplicate users.
    const user = await User.findOneAndUpdate(
      { phone: normalized },
      { $setOnInsert: { phone: normalized, name: "Valued Customer" } },
      { upsert: true, new: true, setDefaultsOnInsert: false }
    );

    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name || null,
        email: user.email || null,
        role: user.role || (user.isAdmin ? "admin" : "customer"),
        isAdmin: Boolean(user.isAdmin || user.role === "admin" || user.role === "super_admin"),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me  (protected)
async function me(req, res) {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id,
      phone: user.phone,
      name: user.name || null,
      email: user.email || null,
      role: user.role || (user.isAdmin ? "admin" : "customer"),
      isAdmin: Boolean(user.isAdmin || user.role === "admin" || user.role === "super_admin"),
      addresses: user.addresses,
    },
  });
}

// POST /api/auth/logout
function logout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ success: true, message: "Logged out." });
}

module.exports = { sendOtp, verifyOtp, me, logout };