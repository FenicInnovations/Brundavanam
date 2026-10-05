const { getRedis } = require("../config/redis");
const { generateOtp, hashOtp, verifyOtpHash } = require("../utils/otp");
const { sendOtpSms } = require("./fast2sms.service");
const {
  otpTtlSeconds,
  otpMaxAttempts,
  otpResendCooldownSeconds,
  otpMaxPerHour,
} = require("../config/env");

const otpKey = (phone) => `otp:${phone}`;
const cooldownKey = (phone) => `otp:cooldown:${phone}`;
const hourlyKey = (phone) => `otp:hourly:${phone}`;

class RateLimitError extends Error {
  constructor(message, retryAfterSeconds) {
    super(message);
    this.statusCode = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Generates, hashes, stores, and dispatches an OTP for `phone`.
 * Throws RateLimitError if the 60s cooldown or 5-per-hour cap is hit.
 */
async function sendOtp(phone) {
  const redis = getRedis();

  const [onCooldown, hourlyCount] = await Promise.all([
    redis.exists(cooldownKey(phone)),
    redis.get(hourlyKey(phone)),
  ]);

  if (onCooldown) {
    const ttl = await redis.ttl(cooldownKey(phone));
    throw new RateLimitError("Please wait before requesting another OTP.", ttl);
  }

  if (hourlyCount && Number(hourlyCount) >= otpMaxPerHour) {
    throw new RateLimitError("Too many requests. Please try again later.", 3600);
  }

  const otp = generateOtp();
  const record = JSON.stringify({
    otpHash: hashOtp(otp),
    attempts: 0,
    createdAt: Date.now(),
  });

  // Only one active OTP per phone — a new send invalidates any previous one.
  const pipeline = redis.pipeline();
  pipeline.set(otpKey(phone), record, "EX", otpTtlSeconds);
  pipeline.set(cooldownKey(phone), "1", "EX", otpResendCooldownSeconds);
  await pipeline.exec();

  // Redis EXPIRE's NX flag needs Redis 7+, so avoid depending on it —
  // only set the TTL the first time this hour's counter is created.
  const hourlyCountAfterIncr = await redis.incr(hourlyKey(phone));
  if (hourlyCountAfterIncr === 1) {
    await redis.expire(hourlyKey(phone), 3600);
  }

  await sendOtpSms(phone, otp);

  console.log("[otp] OTP request dispatched for a phone number ending in", phone.slice(-4));
}

/**
 * Verifies `otp` against the stored record for `phone`.
 * Returns { valid: boolean, reason?: string }.
 */
async function verifyOtp(phone, otp) {
  const redis = getRedis();
  const raw = await redis.get(otpKey(phone));

  if (!raw) {
    return { valid: false, reason: "OTP expired or not requested. Please request a new one." };
  }

  const record = JSON.parse(raw);

  if (record.attempts >= otpMaxAttempts) {
    await redis.del(otpKey(phone));
    return { valid: false, reason: "Too many attempts. Please request a new OTP." };
  }

  if (!verifyOtpHash(otp, record.otpHash)) {
    record.attempts += 1;
    const ttl = await redis.ttl(otpKey(phone));
    await redis.set(otpKey(phone), JSON.stringify(record), "EX", ttl > 0 ? ttl : 1);

    if (record.attempts >= otpMaxAttempts) {
      await redis.del(otpKey(phone));
      return { valid: false, reason: "Too many attempts. Please request a new OTP." };
    }
    return { valid: false, reason: "Incorrect OTP." };
  }

  // Correct — burn the OTP so it can't be reused.
  await redis.del(otpKey(phone));
  console.log("[otp] OTP verified for a phone number ending in", phone.slice(-4));
  return { valid: true };
}

module.exports = { sendOtp, verifyOtp, RateLimitError };