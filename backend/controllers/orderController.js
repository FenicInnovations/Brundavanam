const Order = require("../models/Order");
const orderService = require("../services/orderService");
const invoiceService = require("../services/invoiceService");

/**
 * POST /api/orders/checkout
 * Initiate checkout, reserve inventory, create Order and Razorpay Order
 */
async function checkout(req, res, next) {
  try {
    const { items, shippingAddress, billingAddress, customerNotes, couponCode, deliverySpeed } = req.body;

    const result = await orderService.createCheckoutOrder({
      user: req.user,
      items,
      shippingAddress,
      billingAddress,
      customerNotes,
      couponCode,
      deliverySpeed,
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
 * Calculate dynamic shipping cost with fast vs eco speed options & promotional subsidies
 */
async function calculateShipping(req, res, next) {
  try {
    const { pincode, items, deliverySpeed } = req.body;

    if (!pincode) {
      return res.status(400).json({ success: false, message: "Pincode is required" });
    }

    const shippingInfo = await orderService.calculateOrderShipping({
      user: req.user,
      items,
      pincode,
      deliverySpeed: deliverySpeed || "standard",
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
 * GET /api/orders/shipping/config
 * Public endpoint to fetch store shipping rules, threshold & promotional offers
 */
async function getShippingConfig(req, res, next) {
  try {
    const ShippingSettings = require("../models/ShippingSettings");
    const settings = await ShippingSettings.getSettings();
    res.json({
      success: true,
      config: {
        freeShippingThreshold: settings.freeShippingThreshold,
        isFreeShippingEnabled: settings.isFreeShippingEnabled,
        standardBaseRate: settings.standardBaseRate,
        standardLocalRate: settings.standardLocalRate,
        standardEstimatedDays: settings.standardEstimatedDays,
        expressBaseRate: settings.expressBaseRate,
        expressLocalRate: settings.expressLocalRate,
        expressEstimatedDays: settings.expressEstimatedDays,
        shippingDiscountOffer: settings.shippingDiscountOffer,
        isOfferActive: settings.isOfferActive,
        offerLabel: settings.offerLabel,
        offerBannerText: settings.offerBannerText,
      },
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
/**
 * GET /api/orders/track
 * Public shipping & order tracking for guests and registered users
 * Query: orderNumber (or orderId), and email or phone
 */
async function trackOrder(req, res, next) {
  try {
    const { orderNumber, orderId, email, phone } = req.query;

    if (!orderNumber && !orderId) {
      return res.status(400).json({
        success: false,
        message: "Order number or order ID is required for tracking",
      });
    }

    let query = {};
    if (orderNumber) {
      query.orderNumber = orderNumber.trim().toUpperCase();
    } else if (orderId) {
      query._id = orderId;
    }

    const order = await Order.findOne(query);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No order found with the provided details. Please verify your order number.",
      });
    }

    const isOwner = req.user && order.user && order.user.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      const inputEmail = (email || "").trim().toLowerCase();
      const inputPhone = (phone || "").trim().replace(/\D/g, "");

      const orderEmail = (order.shippingAddress?.email || order.guestEmail || order.billingAddress?.email || "").toLowerCase();
      const orderPhone = (order.shippingAddress?.phone || order.guestPhone || order.billingAddress?.phone || "").replace(/\D/g, "");

      const emailValid = inputEmail && (inputEmail === orderEmail);
      const phoneValid = inputPhone && inputPhone.length >= 6 && (orderPhone.endsWith(inputPhone) || inputPhone.endsWith(orderPhone));

      if (!emailValid && !phoneValid) {
        return res.status(403).json({
          success: false,
          message: "Please enter the email address or phone number used when placing this order.",
        });
      }
    }

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 * Get single order by ID (supports authenticated user or verified guest)
 */
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const isOwner = req.user && order.user && order.user.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.isAdmin;

    const queryEmail = (req.query.email || "").trim().toLowerCase();
    const queryPhone = (req.query.phone || "").trim().replace(/\D/g, "");

    const orderEmail = (order.shippingAddress?.email || order.guestEmail || order.billingAddress?.email || "").toLowerCase();
    const orderPhone = (order.shippingAddress?.phone || order.guestPhone || order.billingAddress?.phone || "").replace(/\D/g, "");

    const emailMatch = queryEmail && (queryEmail === orderEmail);
    const phoneMatch = queryPhone && queryPhone.length >= 6 && (orderPhone.endsWith(queryPhone) || queryPhone.endsWith(orderPhone));

    // If order has no user (guest order) and is requested right after checkout, or matches email/phone
    if (!isOwner && !isAdmin && !emailMatch && !phoneMatch && order.user) {
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

    const isOwner = req.user && order.user && order.user.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.isAdmin;
    const queryEmail = (req.query.email || "").trim().toLowerCase();
    const orderEmail = (order.shippingAddress?.email || order.guestEmail || "").toLowerCase();
    const isGuestOwner = queryEmail && queryEmail === orderEmail;

    if (!isOwner && !isAdmin && !isGuestOwner && order.user) {
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
  getShippingConfig,
  verifyPayment,
  paymentFailed,
  getMyOrders,
  getOrderById,
  trackOrder,
  cancelMyOrder,
  requestReturn,
  downloadInvoice,
};

