const Order = require("../models/Order");
const orderService = require("../services/orderService");
const invoiceService = require("../services/invoiceService");

/**
 * POST /api/orders/checkout
 * Initiate checkout, reserve inventory, create Order and Razorpay Order
 */
async function checkout(req, res, next) {
  try {
    const { items, shippingAddress, billingAddress, customerNotes, couponCode } = req.body;

    const result = await orderService.createCheckoutOrder({
      user: req.user,
      items,
      shippingAddress,
      billingAddress,
      customerNotes,
      couponCode,
    });

    res.status(201).json({
      success: true,
      message: "Order initiated successfully",
      order: result.order,
      razorpayOrder: result.razorpayOrder,
      clientConfig: result.clientConfig,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/shipping/calculate
 * Calculate dynamic shipping cost via Shiprocket API based on user cart and pincode
 */
async function calculateShipping(req, res, next) {
  try {
    const { pincode, items } = req.body;

    if (!pincode) {
      return res.status(400).json({ success: false, message: "Pincode is required" });
    }

    const shippingInfo = await orderService.calculateOrderShipping({
      user: req.user,
      items,
      pincode,
    });

    res.json({
      success: true,
      shipping: shippingInfo,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/verify-payment
 * Verify signature from Razorpay and confirm order
 */
async function verifyPayment(req, res, next) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification parameters",
      });
    }

    const order = await orderService.confirmPaymentAndOrder({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      user: req.user,
    });

    res.json({
      success: true,
      message: "Payment verified and order confirmed",
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/payment-failed
 * Mark order as payment failed and release reserved stock
 */
async function paymentFailed(req, res, next) {
  try {
    const { orderId, reason } = req.body;
    const order = await orderService.handlePaymentFailure({ orderId, reason });

    res.json({
      success: true,
      message: "Order marked as payment failed, inventory released",
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/my-orders
 * List logged-in user's orders
 */
async function getMyOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const status = req.query.status;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-statusHistory"),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 * Get single order by ID
 */
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only allow owner or admin
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/:id/cancel
 * Cancel order and refund payment
 */
async function cancelMyOrder(req, res, next) {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder({
      orderId: req.params.id,
      user: req.user,
      reason,
      isAdmin: false,
    });

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id/invoice
 * Download or stream PDF tax invoice
 */
async function downloadInvoice(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // If GCS URL exists, redirect to it directly
    if (order.invoice?.invoiceUrl && order.invoice.invoiceUrl.startsWith("http")) {
      return res.redirect(order.invoice.invoiceUrl);
    }

    // Otherwise generate PDF buffer dynamically and stream
    const invoiceNumber = order.invoice?.invoiceNumber || invoiceService.generateInvoiceNumber(order);
    const pdfBuffer = await invoiceService.buildPdfBuffer(order, invoiceNumber, order.createdAt);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="invoice-${order.orderNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/:id/return
 * Request a return / reverse pickup for a delivered order
 */
async function requestReturn(req, res, next) {
  try {
    const { reason, comments, pickupAddress } = req.body;
    const order = await orderService.requestOrderReturn({
      orderId: req.params.id,
      user: req.user,
      reason,
      comments,
      pickupAddress,
    });

    res.json({
      success: true,
      message: "Return request submitted successfully. Reverse pickup will be arranged.",
      order,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  checkout,
  calculateShipping,
  verifyPayment,
  paymentFailed,
  getMyOrders,
  getOrderById,
  cancelMyOrder,
  requestReturn,
  downloadInvoice,
};

