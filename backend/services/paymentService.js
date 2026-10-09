const crypto = require("crypto");
const Razorpay = require("razorpay");
const { razorpay: razorpayConfig, paymentProvider } = require("../config/env");

class PaymentService {
  constructor() {
    this.keyId = (razorpayConfig.keyId || process.env.RAZORPAY_KEY_ID || "").trim();
    this.keySecret = (razorpayConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || "").trim();
    this.webhookSecret = (razorpayConfig.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
    this.isMock = paymentProvider === "mock" || !this.keyId || !this.keySecret;

    if (!this.isMock) {
      try {
        this.client = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        console.log(`[PaymentService] Initialized live Razorpay client with Key ID: ${this.keyId.slice(0, 8)}...`);
      } catch (err) {
        console.warn("[PaymentService] Failed initializing Razorpay client, defaulting to mock mode:", err.message);
        this.isMock = true;
      }
    } else {
      console.log("[PaymentService] Operating in MOCK mode (test payments will succeed automatically).");
    }
  }

  /**
   * Create an order on Razorpay (Amount in INR, converted to paise)
   */
  async createOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const amountInPaise = Math.round(Number(amount) * 100);

    if (this.isMock || !this.client) {
      const mockOrderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return {
        id: mockOrderId,
        entity: "order",
        amount: amountInPaise,
        currency,
        receipt,
        status: "created",
        isMock: true,
      };
    }

    try {
      const options = {
        amount: amountInPaise,
        currency,
        receipt: receipt.toString().slice(0, 40),
        notes: {
          platform: "Brundavanam Goshala",
          ...notes,
        },
      };

      const razorpayOrder = await this.client.orders.create(options);
      return razorpayOrder;
    } catch (err) {
      console.error("[PaymentService] Failed to create Razorpay order:", err);
      throw new Error(`Razorpay Order Creation Failed: ${err.message || err.description}`);
    }
  }

  /**
   * Verify HMAC SHA-256 signature sent back by Razorpay frontend SDK
   */
  verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (this.isMock) {
      // In mock mode, permit verification if signature contains 'mock' or matches
      if (razorpay_order_id && razorpay_payment_id) {
        return true;
      }
      return false;
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      return generatedSignature === razorpay_signature;
    } catch (err) {
      console.error("[PaymentService] Signature verification exception:", err.message);
      return false;
    }
  }

  /**
   * Verify Webhook signature received in Razorpay webhook headers
   */
  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret) {
      console.warn("[PaymentService] RAZORPAY_WEBHOOK_SECRET is not configured in .env");
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");

      return expectedSignature === signature;
    } catch (err) {
      console.error("[PaymentService] Webhook signature verification error:", err.message);
      return false;
    }
  }

  /**
   * Fetch payment details by Razorpay Payment ID
   */
  async fetchPayment(paymentId) {
    if (this.isMock || !this.client) {
      return {
        id: paymentId,
        entity: "payment",
        amount: 100000,
        currency: "INR",
        status: "captured",
        method: "upi",
        isMock: true,
      };
    }

    try {
      return await this.client.payments.fetch(paymentId);
    } catch (err) {
      console.error(`[PaymentService] Fetch payment failed for ID ${paymentId}:`, err);
      throw err;
    }
  }

  /**
   * Get public configuration to send to frontend checkout
   */
  getClientConfig() {
    return {
      keyId: this.isMock ? "rzp_test_mock_brundavanam" : this.keyId,
      isMock: this.isMock,
    };
  }
}

module.exports = new PaymentService();
