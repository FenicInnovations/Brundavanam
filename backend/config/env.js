require("dotenv").config();

const required = ["MONGODB_URI", "JWT_SECRET"];

function assertEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV !== "test") {
    console.warn(
      `[env] Missing recommended variables: ${missing.join(", ")}. ` +
      "Copy .env.example to .env and fill these in before running for real."
    );
  }
}

assertEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  redisUrl: process.env.REDIS_URL,

  otpHashSecret: process.env.OTP_HASH_SECRET || process.env.JWT_SECRET,
  otpTtlSeconds: 5 * 60,
  otpMaxAttempts: 5,
  otpResendCooldownSeconds: 60,
  otpMaxPerHour: 10,
  otpIpMaxPerHour: 20,

  fast2sms: {
    apiKey: process.env.FAST2SMS_API_KEY,
    senderId: process.env.FAST2SMS_SENDER_ID,
    templateId: process.env.FAST2SMS_TEMPLATE_ID,
  },

  gcs: {
    bucketName: process.env.GCS_BUCKET_NAME || "radhakrishnan",
    projectId: process.env.GCS_PROJECT_ID,
    clientEmail: process.env.GCS_CLIENT_EMAIL,
    privateKey: process.env.GCS_PRIVATE_KEY,
  },

  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    user: process.env.SMTP_USER || "brundavanamgaushala@gmail.com",
    pass: process.env.SMTP_PASS || "",
    supportEmail: process.env.SUPPORT_EMAIL || "brundavanamgaushala@gmail.com",
    adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "brundavanamgaushala@gmail.com",
  },

  paymentProvider: process.env.PAYMENT_PROVIDER || "razorpay",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_TkvXHtDKpt4OBC",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "V533DXVf9vcy8MCip4lIRBZe",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },

  shiprocket: {
    email: process.env.SHIPROCKET_EMAIL || "fenicinnovations@gmail.com",
    password: process.env.SHIPROCKET_PASSWORD || "",
    pickupPincode: process.env.SHIPROCKET_PICKUP_PINCODE || "500081",
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    freeShippingThreshold: parseInt(process.env.FREE_SHIPPING_THRESHOLD, 10) || 800,
  },

  company: {
    name: "Brundavanam Goshala",
    legalName: "Brundavanam Goshala Trust",
    gstin: process.env.COMPANY_GSTIN || "36AALCB2941H1ZN",
    pan: process.env.COMPANY_PAN || "AALCB2941H",
    address:
      process.env.COMPANY_ADDRESS ||
      "Sree Raghvendra Brundavanam Garellavalasa, Manyam Parvathipuram Dist, Andhra Pradesh, Salur, India, 535592",
    phone: process.env.COMPANY_PHONE || "+91 9492602499",
    email: process.env.SUPPORT_EMAIL || "brundavanamgaushala@gmail.com",
    website: process.env.FRONTEND_URL || "http://localhost:3000",
  },
};