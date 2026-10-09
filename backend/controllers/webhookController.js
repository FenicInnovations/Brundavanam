const Order = require("../models/Order");
const paymentService = require("../services/paymentService");
const orderService = require("../services/orderService");
const notificationService = require("../services/notificationService");

/**
 * POST /api/webhooks/razorpay
 * Handle asynchronous payment capture or refund callbacks
 */
async function handleRazorpayWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = JSON.stringify(req.body);

    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn("[Razorpay Webhook] Invalid webhook signature rejected");
        return res.status(400).json({ status: "invalid_signature" });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === "payment.captured") {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.notes?.orderNumber;

      if (orderId) {
        const order = await Order.findOne({ orderNumber: orderId });
        if (order && order.status === "pending_payment") {
          await orderService.confirmPaymentAndOrder({
            orderId: order._id,
            razorpayOrderId: paymentEntity.order_id,
            razorpayPaymentId: paymentEntity.id,
            razorpaySignature: "webhook_verified",
            user: null,
          });
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.notes?.orderNumber;

      if (orderId) {
        const order = await Order.findOne({ orderNumber: orderId });
        if (order) {
          await orderService.handlePaymentFailure({
            orderId: order._id,
            reason: paymentEntity.error_description || "Payment failed at gateway",
          });
        }
      }
    } else if (event === "refund.processed") {
      const refundEntity = payload.refund.entity;
      console.log(`[Razorpay Webhook] Refund processed: ${refundEntity.id}`);
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Razorpay Webhook] Error processing webhook:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/webhooks/shiprocket
 * Handle carrier tracking status updates
 */
async function handleShiprocketWebhook(req, res) {
  try {
    const { awb, current_status, courier_name, etd } = req.body;

    if (!awb) {
      return res.status(400).json({ message: "AWB required" });
    }

    const order = await Order.findOne({ "shipping.awbCode": awb });
    if (!order) {
      return res.status(404).json({ message: "Order not found for AWB" });
    }

    order.shipping.currentStatus = current_status;
    if (courier_name) order.shipping.courierName = courier_name;
    if (etd) order.shipping.etd = etd;

    order.shipping.history.push({
      status: current_status,
      activity: `Status update: ${current_status}`,
      location: req.body.current_city || "",
      date: new Date(),
    });

    if (
      (current_status || "").toLowerCase().includes("delivered") &&
      order.status !== "delivered"
    ) {
      order.transitionTo("delivered", "courier", "Shiprocket webhook delivery confirmation");
      order.shipping.deliveredAt = new Date();
      notificationService.sendOrderDelivered(order).catch(console.error);
    }

    await order.save();
    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Shiprocket Webhook] Error handling webhook:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  handleRazorpayWebhook,
  handleShiprocketWebhook,
};
