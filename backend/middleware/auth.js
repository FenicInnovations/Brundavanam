const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const User = require("../models/User");

function extractToken(req) {
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Reads the `accessToken` from either the Authorization header (Bearer) or
 * HttpOnly cookie, verifies it, and attaches the user to req.user.
 */
async function protect(req, res, next) {
  const token = extractToken(req);

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

async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.userId);
  } catch {
    req.user = null;
  }
  next();
}

module.exports = { protect, optionalAuth, extractToken };