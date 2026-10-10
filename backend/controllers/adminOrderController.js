const Order = require("../models/Order");
const orderService = require("../services/orderService");
const invoiceService = require("../services/invoiceService");
const refundService = require("../services/refundService");
const shippingService = require("../services/shippingService");

/**
 * GET /api/admin/orders
 * Filter, search, and paginate all store orders
 */
async function getAllOrders(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { status, search, paymentStatus } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter["payment.status"] = paymentStatus;

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { orderNumber: searchRegex },
        { "shippingAddress.fullName": searchRegex },
        { "shippingAddress.phone": searchRegex },
        { "shipping.awbCode": searchRegex },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
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
 * GET /api/admin/orders/:id
 * Get single order by ID for Admin
 */
async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email phone");
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 * Manually update order status (e.g. processing, delivered)
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.transitionTo(status, req.user?.name || "admin", note || "Updated by admin");
    await order.save();

    res.json({
      success: true,
      message: `Order status updated to '${status}'`,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/ship
 * Create shipment with Shiprocket and assign AWB
 */
async function createShipment(req, res, next) {
  try {
    const { weight, length, breadth, height } = req.body || {};
    const order = await orderService.dispatchOrderToShiprocket(req.params.id, {
      weight,
      length,
      breadth,
      height,
    });

    res.json({
      success: true,
      message: "Order dispatched to Shiprocket successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders/:id/track
 * Sync live Shiprocket tracking status
 */
async function trackShipment(req, res, next) {
  try {
    const order = await orderService.syncOrderTracking(req.params.id);

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/refund
 * Issue manual refund via Razorpay
 */
async function issueRefund(req, res, next) {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.payment.status !== "captured" || !order.payment.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "No captured Razorpay payment found for this order",
      });
    }

    const refund = await refundService.processRefund({
      paymentId: order.payment.razorpayPaymentId,
      amount: amount || order.pricing.grandTotal,
      reason: reason || "Admin initiated refund",
    });

    order.refund = {
      status: "completed",
      razorpayRefundId: refund.id,
      amount: amount || order.pricing.grandTotal,
      reason: reason || "Admin refund",
      refundedAt: new Date(),
    };

    order.payment.status = amount && amount < order.pricing.grandTotal ? "partially_refunded" : "refunded";
    order.transitionTo("refunded", req.user?.name || "admin", `Admin refund: ${reason || "Refund issued"}`);
    await order.save();

    res.json({
      success: true,
      message: "Refund processed successfully via Razorpay",
      refund,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/invoice/regenerate
 * Force regenerate PDF invoice
 */
async function regenerateInvoice(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const invoiceData = await invoiceService.generateAndUploadInvoice(order);
    order.invoice = {
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      invoiceUrl: invoiceData.invoiceUrl,
      fileId: invoiceData.fileId,
    };
    await order.save();

    res.json({
      success: true,
      message: "Invoice generated successfully",
      invoice: order.invoice,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/return/approve
 * Schedule reverse pickup with Shiprocket for approved return
 */
async function approveReturn(req, res, next) {
  try {
    const { pickupAddress } = req.body;
    const order = await orderService.approveReturnAndSchedulePickup({
      orderId: req.params.id,
      adminUser: req.user,
      pickupAddress,
    });

    res.json({
      success: true,
      message: `Shiprocket reverse pickup scheduled (AWB: ${order.returnRequest?.returnAwbCode || "Assigned"})`,
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/return/reject
 * Reject customer return request
 */
async function rejectReturn(req, res, next) {
  try {
    const { reason } = req.body;
    const order = await orderService.rejectOrderReturn({
      orderId: req.params.id,
      adminUser: req.user,
      rejectionReason: reason,
    });

    res.json({
      success: true,
      message: "Return request rejected",
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/orders/:id/return/receive
 * Mark return received at warehouse and process refund
 */
async function confirmReturnReceived(req, res, next) {
  try {
    const { refundAmount, restockInventory = true } = req.body;
    const order = await orderService.confirmReturnReceivedAndRefund({
      orderId: req.params.id,
      adminUser: req.user,
      refundAmount,
      restockInventory,
    });

    res.json({
      success: true,
      message: "Return received at Goshala warehouse. Stock & refund processed.",
      order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders/:id/invoice
 * Stream GST Tax Invoice PDF for Admin download & print
 */
async function downloadInvoice(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
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
 * GET /api/admin/orders/:id/label
 * Fetch or generate Courier Shipping Label (with Barcode & AWB) from Shiprocket
 */
async function getShippingLabel(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.shipping?.shipmentId && !order.shipping?.awbCode) {
      return res.status(400).json({
        success: false,
        message: "Shipment has not been created with Shiprocket yet. Please click 'Create Shiprocket Shipment' first.",
      });
    }

    if (order.shipping.labelUrl && order.shipping.labelUrl.startsWith("http")) {
      return res.redirect(order.shipping.labelUrl);
    }

    // If labelUrl not stored yet, generate via Shiprocket
    if (order.shipping.shipmentId) {
      const labelRes = await shippingService.generateLabel(order.shipping.shipmentId);
      if (labelRes.labelUrl) {
        order.shipping.labelUrl = labelRes.labelUrl;
        await order.save();
        return res.redirect(labelRes.labelUrl);
      }
    }

    return res.status(400).json({
      success: false,
      message: "Shipping label is not yet available from the courier.",
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createShipment,
  trackShipment,
  issueRefund,
  regenerateInvoice,
  approveReturn,
  rejectReturn,
  confirmReturnReceived,
  downloadInvoice,
  getShippingLabel,
};

