const paymentService = require("./paymentService");

class RefundService {
  /**
   * Process a full or partial refund via Razorpay
   * @param {Object} params
   * @param {string} params.paymentId - Razorpay payment ID (e.g. pay_29QQoUBcx96muk)
   * @param {number} params.amount - Refund amount in INR (if omitted, full refund)
   * @param {string} params.reason - Refund reason or note
   * @param {string} params.speed - "normal" (5-7 days) or "optimum" / "instant"
   */
  async processRefund({ paymentId, amount, reason = "Order cancelled", speed = "normal" }) {
    if (!paymentId) {
      throw new Error("Payment ID is required to process refund");
    }

    // Mock fallback when in mock mode
    if (paymentService.isMock || !paymentService.client) {
      const mockRefundId = `rfnd_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return {
        id: mockRefundId,
        entity: "refund",
        amount: amount ? Math.round(amount * 100) : 0,
        currency: "INR",
        payment_id: paymentId,
        status: "processed",
        speed_processed: speed,
        notes: { reason },
        created_at: Math.floor(Date.now() / 1000),
        isMock: true,
      };
    }

    try {
      const refundOptions = {
        speed,
        notes: {
          reason: reason.slice(0, 255),
          platform: "Brundavanam Goshala",
        },
      };

      if (amount && Number(amount) > 0) {
        refundOptions.amount = Math.round(Number(amount) * 100);
      }

      const refund = await paymentService.client.payments.refund(paymentId, refundOptions);
      console.log(`[RefundService] Razorpay refund successful for payment ${paymentId}: ${refund.id}`);
      return refund;
    } catch (err) {
      console.error(`[RefundService] Failed to process refund for ${paymentId}:`, err);
      throw new Error(`Refund Failed: ${err.message || err.description}`);
    }
  }

  /**
   * Fetch refund status from Razorpay
   */
  async fetchRefund(refundId) {
    if (paymentService.isMock || !paymentService.client) {
      return {
        id: refundId,
        status: "processed",
        isMock: true,
      };
    }

    try {
      return await paymentService.client.refunds.fetch(refundId);
    } catch (err) {
      console.error(`[RefundService] Fetch refund failed for ID ${refundId}:`, err);
      throw err;
    }
  }
}

module.exports = new RefundService();
