const { fast2sms } = require("../config/env");

const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Sends an OTP SMS via Fast2SMS. Only this module ever sees the API key.
 * Throws on failure — callers decide how to respond (the OTP has
 * already been committed to Redis by the time this runs, so a send
 * failure is reported as a 502 rather than silently "succeeding").
 */
async function sendOtpSms(phone, otp) {
  if (!fast2sms.apiKey) {
    throw new Error("FAST2SMS_API_KEY is not configured");
  }

  const params = new URLSearchParams({
    route: fast2sms.templateId ? "dlt" : "otp",
    variables_values: otp,
    numbers: phone,
  });

  if (fast2sms.templateId) params.set("message_id", fast2sms.templateId);
  if (fast2sms.senderId) params.set("sender_id", fast2sms.senderId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // const res = await fetch(`${FAST2SMS_URL}?${params.toString()}`, {
    //   method: "GET",
    //   headers: { authorization: fast2sms.apiKey },
    //   signal: controller.signal,
    // });
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
                "Authorization": "3yH8QpnDvhwON5u7SKEf1Mcig2aT6IqlAmWtX4YJPrez9kGVBZhSMZYCUyNx8iDaHj1GJv3TPrcOFqtK",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "route": "dlt",
                "sender_id": "KRMSLT",
                "message": "213995",
                "variables_values": `${otp}|`,
                "flash": 0,
                "numbers": phone
            })
        });

    const body = await res.json().catch(() => ({}));

    if (!res.ok || body.return === false) {
      // Deliberately not logging `body` in full — it can echo back the
      // phone number and message content.
      console.error("[fast2sms] Send failed", { status: res.status });
      throw new Error("SMS provider rejected the request");
    }

    console.log("[fast2sms] OTP dispatched");
    return true;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("[fast2sms] Request timed out");
      throw new Error("SMS provider timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { sendOtpSms };