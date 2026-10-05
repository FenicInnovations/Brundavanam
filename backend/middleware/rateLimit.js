const { getRedis } = require("../config/redis");
const { otpIpMaxPerHour } = require("../config/env");

/**
 * IP-based limiter on top of the phone-based one in otpService — a
 * single phone's limits don't stop someone hammering the endpoint with
 * different numbers from one machine.
 */
async function otpIpRateLimit(req, res, next) {
  try {
    const redis = getRedis();
    const key = `otp:ip:${req.ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 3600);

    if (count > otpIpMaxPerHour) {
      const err = new Error("Too many requests from this network. Please try again later.");
      err.statusCode = 429;
      return next(err);
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { otpIpRateLimit };