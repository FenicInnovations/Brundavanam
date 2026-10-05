// Canonical format used everywhere (MongoDB, Redis keys, SMS dispatch):
// a bare 10-digit number, e.g. "9876543210". Accepts "+919876543210",
// "919876543210", "09876543210", or "9876543210" as input.

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

function normalizePhone(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
}

function isValidIndianMobile(raw) {
  const normalized = normalizePhone(raw);
  return !!normalized && INDIAN_MOBILE_REGEX.test(normalized);
}

module.exports = { normalizePhone, isValidIndianMobile };