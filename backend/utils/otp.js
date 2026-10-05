const crypto = require("crypto");
const { otpHashSecret } = require("../config/env");

function generateOtp() {
  // crypto.randomInt is cryptographically secure, unlike Math.random().
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp) {
  return crypto.createHmac("sha256", otpHashSecret).update(otp).digest("hex");
}

function verifyOtpHash(otp, hash) {
  const candidate = hashOtp(otp);
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(candidate);
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { generateOtp, hashOtp, verifyOtpHash };