const Redis = require("ioredis");
const { redisUrl } = require("./env");

let client = null;
let ready = false;

function connectRedis() {
  if (!redisUrl) {
    console.error(
      "[redis] REDIS_URL is not set — OTP auth cannot function without it. " +
        "See backend/.env.example."
    );
    return null;
  }

  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 200, 5000),
  });

  client.on("connect", () => {
    ready = true;
    console.log("[redis] Connected");
  });

  client.on("error", (err) => {
    ready = false;
    // ioredis retries automatically — log without crashing the process.
    console.error("[redis] Connection error:", err.message);
  });

  return client;
}

function getRedis() {
  return client;
}

/**
 * OTP endpoints call this first. If Redis is down we return a clear 503
 * rather than falling through and skipping rate limits / OTP storage —
 * "fail gracefully, never silently bypass security."
 */
function requireRedis(req, res, next) {
  if (!client || !ready) {
    const err = new Error("Service temporarily unavailable. Please try again shortly.");
    err.statusCode = 503;
    return next(err);
  }
  next();
}

module.exports = { connectRedis, getRedis, requireRedis };