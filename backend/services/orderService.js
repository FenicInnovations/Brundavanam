const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const inventoryService = require("./inventoryService");
const paymentService = require("./paymentService");
const shippingService = require("./shippingService");
const refundService = require("./refundService");
const invoiceService = require("./invoiceService");
const notificationService = require("./notificationService");

const { shiprocket: srConfig } = require("../config/env");

class OrderService {
  /**
   * Helper to resolve cart items and calculate eligible subtotal and weight
   */
  async _resolveCheckoutItems(user, rawItems) {
    let checkoutItems = rawItems;
    if (!checkoutItems || checkoutItems.length === 0) {
      const cart = await Cart.findOne({ user: user._id }).populate("items.product");
      if (!cart || !cart.items || cart.items.length === 0) {
        const err = new Error("Cart is empty");
        err.statusCode = 400;
        throw err;
      }
      checkoutItems = cart.items.map((ci) => ({
        product: ci.product._id,
        variantId: ci.variantId,
        variantLabel: ci.variantLabel,
        quantity: ci.quantity,
      }));
    }

    const validatedItems = [];
    let itemsTotal = 0;
    let taxTotal = 0;
    let totalWeight = 0; // Default to 1kg if not specified per product

    for (const item of checkoutItems) {
      const productId = item.product?._id || item.product;
      const product = await Product.findById(productId);

      if (!product || product.isDeleted || !product.isActive) {
        const err = new Error(`Product not found or unavailable: ${productId}`);
        err.statusCode = 400;
        throw err;
      }

      let unitPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      let regularPrice = product.price;
      let variantLabel = item.variantLabel || "";
      let sku = product.sku;
      let weight = product.weight || 0.5; // Assume 500g default
      let resolvedVariantId = null; // Default: no variant

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          // Variant still exists — use variant-level pricing and stock
          unitPrice = variant.discountPrice > 0 ? variant.discountPrice : variant.price;
          regularPrice = variant.price;
          variantLabel = variant.label;
          sku = variant.sku || sku;
          resolvedVariantId = variant._id;
        } else {
          // Stale variantId — variant was removed from product. Fall back to base product.
          console.warn(`[OrderService] Cart item has stale variantId ${item.variantId} for product ${product.name}. Falling back to base product stock.`);
          variantLabel = "";
          resolvedVariantId = null;
        }
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const subtotal = unitPrice * qty;
      const gstRate = 5; 
      const gstAmount = Math.round((subtotal * gstRate) / (100 + gstRate) * 100) / 100;

      itemsTotal += subtotal;
      taxTotal += gstAmount;
      totalWeight += weight * qty;

      const primaryImg = product.images?.find((img) => img.isPrimary) || product.images?.[0];

      validatedItems.push({
        product: product._id,
        name: product.name,
        sku,
        variantId: resolvedVariantId,
        variantLabel,
        price: regularPrice,
        finalPrice: unitPrice,
        quantity: qty,
        subtotal,
        image: primaryImg?.publicUrl || "",
        hsnCode: "04059020",
        gstRate,
        gstAmount,
      });
    }

    return { validatedItems, itemsTotal, taxTotal, totalWeight };
  }


  /**
   * Pre-calculate shipping cost for checkout
   */
  async calculateOrderShipping({ user, items, pincode }) {
    if (!pincode) {
      const err = new Error("Destination pincode is required to calculate shipping");
      err.statusCode = 400;
      throw err;
    }

    const { itemsTotal, totalWeight } = await this._resolveCheckoutItems(user, items);
    const threshold = srConfig.freeShippingThreshold || 800;

    // IMPORTANT BUSINESS RULE: Free shipping above threshold
    if (itemsTotal >= threshold) {
      return {
        isFree: true,
        amount: 0,
        currency: "INR",
        courierName: "Free Delivery",
        estimatedDeliveryDays: 3,
        thresholdReached: true,
      };
    }

    // Call Shiprocket to get dynamic rates
    try {
      const rates = await shippingService.calculateShippingRates({
        deliveryPincode: pincode,
        weight: Math.max(0.5, totalWeight),
        cod: 0, // Assume prepaid for rate calculation in standard checkout
        declaredValue: itemsTotal,
      });

      if (!rates || rates.length === 0) {
        throw new Error("No shipping options available for this pincode.");
      }

      // Find the lowest rate
      const lowestRate = rates.reduce((prev, curr) => (prev.rate < curr.rate ? prev : curr));

      return {
        isFree: false,
        amount: Math.ceil(lowestRate.rate), // Round up to nearest rupee
        currency: "INR",
        courierName: lowestRate.courier_name,
        courierCompanyId: lowestRate.courier_company_id,
        estimatedDeliveryDays: lowestRate.etd,
        thresholdReached: false,
        shortfall: threshold - itemsTotal,
      };
    } catch (err) {
      console.error("[OrderService] Shipping calculation failed:", err.message);
      throw new Error("Unable to calculate delivery charges right now. Please try again.");
    }
  }

  /**
   * 1. Check out and create order draft with Razorpay payment initiation
   */
  async createCheckoutOrder({ user, items: rawItems, shippingAddress, billingAddress, customerNotes, couponCode }) {
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.line1) {
      const err = new Error("Valid shipping address is required");
      err.statusCode = 400;
      throw err;
    }

    const actualBilling = billingAddress && billingAddress.fullName ? billingAddress : shippingAddress;

    // IMPORTANT: Use the new helper to resolve items and validate
    const { validatedItems, itemsTotal, taxTotal, totalWeight } = await this._resolveCheckoutItems(user, rawItems);

    // IMPORTANT: Revalidate shipping cost via Shiprocket dynamically before creating order
    const shippingInfo = await this.calculateOrderShipping({
      user,
      items: rawItems,
      pincode: shippingAddress.postalCode,
    });
    
    const shippingFee = shippingInfo.amount;

    // Optional Coupon Discount logic
    let discountAmount = 0;
    if (couponCode && couponCode.toUpperCase() === "GOSHALA10") {
      discountAmount = Math.round(itemsTotal * 0.1);
    }

    const grandTotal = Math.max(1, itemsTotal + shippingFee - discountAmount);

    // Atomically reserve inventory
    await inventoryService.reserveStock(validatedItems);

    try {
      const orderNumber = Order.generateOrderNumber();

      // Create Razorpay Order
      const razorpayOrder = await paymentService.createOrder({
        amount: grandTotal,
        receipt: orderNumber,
        notes: {
          userId: user._id.toString(),
          orderNumber,
        },
      });

      // Persist Order document
      const order = new Order({
        orderNumber,
        user: user._id,
        items: validatedItems,
        pricing: {
          itemsTotal,
          taxTotal,
          shippingFee,
          discountAmount,
          couponCode: couponCode || "",
          grandTotal,
          currency: "INR",
        },
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          email: shippingAddress.email || user.email,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country || "India",
        },
        shipping: {
          provider: "shiprocket",
          amount: shippingFee,
          isFree: shippingInfo.isFree,
          courierName: shippingInfo.courierName,
          courierCompanyId: shippingInfo.courierCompanyId,
          estimatedDelivery: shippingInfo.estimatedDeliveryDays,
        },
        billingAddress: {
          fullName: actualBilling.fullName,
          phone: actualBilling.phone,
          email: actualBilling.email || user.email,
          line1: actualBilling.line1,
          line2: actualBilling.line2 || "",
          city: actualBilling.city,
          state: actualBilling.state,
          postalCode: actualBilling.postalCode,
          country: actualBilling.country || "India",
        },
        status: "pending_payment",
        payment: {
          provider: "razorpay",
          status: "pending",
          razorpayOrderId: razorpayOrder.id,
        },
        customerNotes: customerNotes || "",
        statusHistory: [
          {
            status: "pending_payment",
            changedAt: new Date(),
            changedBy: "user",
            note: "Order created, payment initiated with Razorpay",
          },
        ],
      });

      await order.save();

      return {
        order,
        razorpayOrder,
        clientConfig: paymentService.getClientConfig(),
      };
    } catch (err) {
      // If order creation fails after stock reservation, rollback stock
      await inventoryService.releaseStock(validatedItems);
      throw err;
    }
  }

  /**
   * 2. Verify Razorpay Payment Signature and finalize order
   */
  async confirmPaymentAndOrder({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature, user }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    // Verify ownership if requested by user
    if (user && order.user.toString() !== user._id.toString() && !user.isAdmin) {
      const err = new Error("Not authorized to verify this order");
      err.statusCode = 403;
      throw err;
    }

    if (order.status === "confirmed" && order.payment.status === "captured") {
      return order; // Idempotent return
    }

    const isValid = paymentService.verifySignature({
      razorpay_order_id: razorpayOrderId || order.payment.razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });

    if (!isValid) {
      order.payment.status = "failed";
      order.payment.failureReason = "Signature mismatch";
      order.transitionTo("payment_failed", "system", "Payment signature verification failed");
      await order.save();

      // Release reserved stock on payment failure
      await inventoryService.releaseStock(order.items);

      const err = new Error("Invalid payment signature");
      err.statusCode = 400;
      throw err;
    }

    // Payment Verified!
    order.payment.status = "captured";
    order.payment.razorpayOrderId = razorpayOrderId || order.payment.razorpayOrderId;
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.paidAt = new Date();

    order.transitionTo("confirmed", "user", `Payment captured via Razorpay ID: ${razorpayPaymentId}`);

    // Commit stock
    await inventoryService.commitStock(order.items);

    // Clear user cart
    try {
      await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
    } catch (cartErr) {
      console.warn("[OrderService] Cart clear warning:", cartErr.message);
    }

    // Generate Invoice PDF
    try {
      const invoiceData = await invoiceService.generateAndUploadInvoice(order);
      order.invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        invoiceUrl: invoiceData.invoiceUrl,
        fileId: invoiceData.fileId,
      };
    } catch (invErr) {
      console.error("[OrderService] Invoice generation deferred:", invErr.message);
    }

    await order.save();

    // Trigger Notifications asynchronously
    notificationService.sendOrderConfirmation(order).catch((err) => {
      console.error("[OrderService] Order confirmation email failed:", err.message);
    });

    notificationService.sendAdminNewOrderAlert(order).catch((err) => {
      console.error("[OrderService] Admin notification email failed:", err.message);
    });

    return order;
  }

  /**
   * 3. Handle explicit payment failure or checkout dismissal
   */
  async handlePaymentFailure({ orderId, reason = "Payment cancelled by user" }) {
    const order = await Order.findById(orderId);
    if (!order) return null;

    if (order.status === "pending_payment") {
      order.payment.status = "failed";
      order.payment.failureReason = reason;
      order.transitionTo("payment_failed", "system", reason);
      await order.save();

      // Return stock to inventory
      await inventoryService.releaseStock(order.items);
    }

    return order;
  }

  /**
   * 4. Dispatch Order to Shiprocket (Admin action or auto-fulfillment)
   */
  async dispatchOrderToShiprocket(orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (!["confirmed", "processing"].includes(order.status)) {
      const err = new Error(`Order in status '${order.status}' cannot be dispatched.`);
      err.statusCode = 400;
      throw err;
    }

    // Call Shipping Service
    const shipmentResult = await shippingService.createShipmentOrder(order);

    order.shipping = {
      ...order.shipping.toObject(),
      provider: "shiprocket",
      shiprocketOrderId: shipmentResult.shiprocketOrderId,
      shipmentId: shipmentResult.shipmentId,
      awbCode: shipmentResult.awbCode,
      courierCompanyId: shipmentResult.courierCompanyId,
      courierName: shipmentResult.courierName,
      trackingUrl: shipmentResult.trackingUrl,
      labelUrl: shipmentResult.labelUrl || "",
      currentStatus: shipmentResult.currentStatus || "Ready to Ship",
      shippedAt: new Date(),
    };

    order.transitionTo(
      shipmentResult.awbCode ? "shipped" : "ready_to_ship",
      "admin",
      `Shipment created with Shiprocket (AWB: ${shipmentResult.awbCode || "Pending"})`
    );

    await order.save();

    // Notify customer
    notificationService.sendOrderShipped(order).catch((err) => {
      console.error("[OrderService] Dispatch email failed:", err.message);
    });

    return order;
  }

  /**
   * 5. Sync live Shiprocket tracking
   */
  async syncOrderTracking(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error("Order not found");

    if (!order.shipping?.awbCode) {
      return order;
    }

    const track = await shippingService.trackShipment(order.shipping.awbCode);

    if (track) {
      order.shipping.currentStatus = track.currentStatus;
      if (track.courierName) order.shipping.courierName = track.courierName;
      if (track.etd) order.shipping.etd = track.etd;
      if (track.history?.length) order.shipping.history = track.history;

      // Detect delivery
      if (
        (track.currentStatus || "").toLowerCase().includes("deliver") &&
        order.status !== "delivered"
      ) {
        order.transitionTo("delivered", "courier", "Shiprocket confirmed delivery");
        order.shipping.deliveredAt = new Date();
        notificationService.sendOrderDelivered(order).catch(console.error);
      }

      await order.save();
    }

    return order;
  }

  /**
   * 6. Cancel Order & Issue Refund
   */
  async cancelOrder({ orderId, user, reason = "Requested by customer", isAdmin = false }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (!isAdmin && order.user.toString() !== user._id.toString()) {
      const err = new Error("Not authorized to cancel this order");
      err.statusCode = 403;
      throw err;
    }

    // Shipped or delivered orders cannot be directly cancelled (must use Return workflow)
    if (["shipped", "out_for_delivery", "delivered"].includes(order.status)) {
      const err = new Error(
        "Order has already shipped and cannot be cancelled directly. Please contact support."
      );
      err.statusCode = 400;
      throw err;
    }

    if (["cancelled", "refunded"].includes(order.status)) {
      return order; // Idempotent
    }

    let refundInfo = null;

    // If order was paid via Razorpay, trigger refund service
    if (order.payment.status === "captured" && order.payment.razorpayPaymentId) {
      try {
        refundInfo = await refundService.processRefund({
          paymentId: order.payment.razorpayPaymentId,
          amount: order.pricing.grandTotal,
          reason,
        });

        order.refund = {
          status: "completed",
          razorpayRefundId: refundInfo.id,
          amount: order.pricing.grandTotal,
          reason,
          refundedAt: new Date(),
        };

        order.payment.status = "refunded";
        order.transitionTo("refunded", isAdmin ? "admin" : "user", `Cancelled & refunded: ${reason}`);
      } catch (refundErr) {
        console.error("[OrderService] Refund failed during cancellation:", refundErr);
        order.refund = {
          status: "failed",
          reason: refundErr.message,
        };
        order.transitionTo("cancelled", isAdmin ? "admin" : "user", `Cancelled (Refund Pending Manual Review): ${reason}`);
      }
    } else {
      order.transitionTo("cancelled", isAdmin ? "admin" : "user", `Cancelled: ${reason}`);
    }

    // Release inventory back into stock
    await inventoryService.releaseStock(order.items);

    await order.save();

    // Notify customer
    notificationService.sendOrderCancelled(order, refundInfo || {}).catch((err) => {
      console.error("[OrderService] Cancel notification failed:", err.message);
    });

    return order;
  }

  /**
   * 7. Customer Request Return
   */
  async requestOrderReturn({ orderId, user, reason, comments, pickupAddress }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (order.user.toString() !== user._id.toString()) {
      const err = new Error("Not authorized to request return for this order");
      err.statusCode = 403;
      throw err;
    }

    if (!["delivered", "completed"].includes(order.status)) {
      const err = new Error("Returns can only be requested for delivered orders");
      err.statusCode = 400;
      throw err;
    }

    if (order.returnRequest && !["none", "rejected"].includes(order.returnRequest.status)) {
      const err = new Error(`Return request already ${order.returnRequest.status}`);
      err.statusCode = 400;
      throw err;
    }

    const effectivePickup = pickupAddress && pickupAddress.fullName ? pickupAddress : order.shippingAddress;

    order.returnRequest = {
      status: "requested",
      reason: reason || "Quality issue / Damaged item",
      comments: comments || "",
      requestedAt: new Date(),
      pickupAddress: {
        fullName: effectivePickup.fullName,
        phone: effectivePickup.phone,
        line1: effectivePickup.line1,
        line2: effectivePickup.line2 || "",
        city: effectivePickup.city,
        state: effectivePickup.state,
        postalCode: effectivePickup.postalCode,
      },
    };

    order.transitionTo("return_requested", "user", `Return requested: ${reason || "Damaged/Defective item"}`);
    await order.save();

    notificationService.sendReturnRequested(order).catch((err) => {
      console.error("[OrderService] Return requested notification failed:", err.message);
    });

    return order;
  }

  /**
   * 8. Admin Approve Return & Schedule Shiprocket Reverse Pickup
   */
  async approveReturnAndSchedulePickup({ orderId, adminUser, pickupAddress }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (!order.returnRequest || !["requested", "approved"].includes(order.returnRequest.status)) {
      const err = new Error("No pending return request found for this order");
      err.statusCode = 400;
      throw err;
    }

    const targetPickup = pickupAddress || order.returnRequest.pickupAddress || order.shippingAddress;

    // Call Shiprocket to schedule reverse pickup
    const returnShipment = await shippingService.createReturnShipment(order, {
      reason: order.returnRequest.reason,
      pickupAddress: targetPickup,
    });

    order.returnRequest.status = "pickup_scheduled";
    order.returnRequest.actionedAt = new Date();
    order.returnRequest.shiprocketReturnOrderId = returnShipment.shiprocketOrderId;
    order.returnRequest.shiprocketReturnShipmentId = returnShipment.shipmentId;
    order.returnRequest.returnAwbCode = returnShipment.awbCode;
    order.returnRequest.returnCourierName = returnShipment.courierName;
    order.returnRequest.returnTrackingUrl = returnShipment.trackingUrl;

    order.transitionTo(
      "return_pickup_scheduled",
      adminUser?.name || "admin",
      `Shiprocket reverse pickup scheduled via ${returnShipment.courierName} (AWB: ${returnShipment.awbCode})`
    );

    await order.save();

    notificationService.sendReturnPickupScheduled(order).catch((err) => {
      console.error("[OrderService] Return pickup notification failed:", err.message);
    });

    return order;
  }

  /**
   * 9. Admin Reject Return Request
   */
  async rejectOrderReturn({ orderId, adminUser, rejectionReason }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (!order.returnRequest || order.returnRequest.status !== "requested") {
      const err = new Error("No active pending return request to reject");
      err.statusCode = 400;
      throw err;
    }

    order.returnRequest.status = "rejected";
    order.returnRequest.actionedAt = new Date();
    order.returnRequest.rejectionReason = rejectionReason || "Return request rejected by admin";

    order.transitionTo("delivered", adminUser?.name || "admin", `Return rejected: ${rejectionReason || "Condition not met"}`);
    await order.save();

    return order;
  }

  /**
   * 10. Admin Confirm Return Received & Issue Automatic Refund
   */
  async confirmReturnReceivedAndRefund({ orderId, adminUser, refundAmount, restockInventory = true }) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("Order not found");
      err.statusCode = 404;
      throw err;
    }

    if (!order.returnRequest || !["pickup_scheduled", "approved", "requested"].includes(order.returnRequest.status)) {
      const err = new Error("Invalid return status for receipt confirmation");
      err.statusCode = 400;
      throw err;
    }

    order.returnRequest.status = "received";

    // Restock items into inventory if designated
    if (restockInventory) {
      await inventoryService.releaseStock(order.items);
    }

    // Process Razorpay refund if original payment was captured
    let refundInfo = null;
    const finalRefundAmount = refundAmount ? Number(refundAmount) : order.pricing.grandTotal;

    if (order.payment.status === "captured" && order.payment.razorpayPaymentId) {
      try {
        refundInfo = await refundService.processRefund({
          paymentId: order.payment.razorpayPaymentId,
          amount: finalRefundAmount,
          reason: "Product returned to warehouse and inspected",
        });

        order.refund = {
          status: "completed",
          razorpayRefundId: refundInfo.id,
          amount: finalRefundAmount,
          reason: "Returned item inspected & refunded",
          refundedAt: new Date(),
        };

        order.payment.status = finalRefundAmount < order.pricing.grandTotal ? "partially_refunded" : "refunded";
      } catch (refErr) {
        console.error("[OrderService] Auto-refund on return receipt failed:", refErr.message);
        order.refund = {
          status: "failed",
          amount: finalRefundAmount,
          reason: `Auto-refund error: ${refErr.message}`,
        };
      }
    }

    order.transitionTo("returned", adminUser?.name || "admin", "Return received at Goshala warehouse. Stock & refund processed.");
    await order.save();

    notificationService.sendReturnReceivedAndRefunded(order).catch((err) => {
      console.error("[OrderService] Return completion notification failed:", err.message);
    });

    return order;
  }
}

module.exports = new OrderService();

