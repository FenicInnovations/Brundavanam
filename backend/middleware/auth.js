const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const User = require("../models/User");

/**
 * Reads the `accessToken` HttpOnly cookie set at OTP verification,
 * verifies it, and attaches the user to req.user. The frontend never
 * reads or decodes this token itself — GET /api/auth/me is the source
 * of truth for auth state.
 */
async function protect(req, res, next) {
  const token = req.cookies?.accessToken;

  if (!token) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.userId);
    if (!req.user || !req.user.isActive) throw new Error("Session expired");
    next();
  } catch (err) {
    err.statusCode = 401;
    err.message = "Session expired";
    next(err);
  }
}

module.exports = { protect };