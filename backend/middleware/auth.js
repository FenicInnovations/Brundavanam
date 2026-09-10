const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const User = require("../models/User");

/**
 * Reads the `token` http-only cookie set at login, verifies it, and
 * attaches the user (minus password) to req.user. Stage 3 wires this
 * into the auth routes/controllers.
 */
async function protect(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    const err = new Error("Not authorized — please log in");
    err.statusCode = 401;
    return next(err);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) throw new Error("User no longer exists");
    next();
  } catch (err) {
    err.statusCode = 401;
    err.message = "Not authorized — invalid or expired session";
    next(err);
  }
}

module.exports = { protect };
