const mongoose = require("mongoose");
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
      if (!user) {
        const err = new Error("Cart is empty or no items provided");
        err.statusCode = 400;
        throw err;
      }
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
      const productId = item.product?._id ? item.product._id.toString() : (item.product?.id || item.product);
      if (!productId) continue;

      if (!mongoose.Types.ObjectId.isValid(productId)) {
        // Simulated or mock item (e.g. from Admin Shipping simulator)
        const unitPrice = Number(item.finalPrice || item.price || 300);
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const subtotal = unitPrice * qty;
        const itemWeight = Number(item.weight) || 0.5;

        itemsTotal += subtotal;
        totalWeight += itemWeight * qty;
        validatedItems.push({
          product: productId,
          name: item.name || "Product Item",
          price: unitPrice,
          finalPrice: unitPrice,
          quantity: qty,
          subtotal,
          weight: itemWeight,
        });
        continue;
      }

      const product = await Product.findById(productId);

      if (!product || product.isDeleted || !product.isActive) {
        const err = new Error(`Product not found or unavailable: ${productId}`);
        err.statusCode = 400;
        throw err;
      }

      let unitPrice = product.discountPrice > 0 && product.discountPrice < product.price ? product.discountPrice : product.price;
      let regularPrice = product.price;
      let variantLabel = item.variantLabel || "";
      let sku = product.sku;
      let resolvedVariantId = null; // Default: no variant
      let variantWeight = null;

      if (item.variantId) {
        let variant = null;
        if (product.variants?.id && typeof product.variants.id === "function" && mongoose.Types.ObjectId.isValid(item.variantId)) {
          variant = product.variants.id(item.variantId);
        }
        if (!variant && Array.isArray(product.variants)) {
          variant = product.variants.find(
            (v) => (v._id?.toString() === item.variantId?.toString()) || (v.id?.toString() === item.variantId?.toString())
          );
        }

        if (variant) {
          // Variant exists — use variant-level pricing, weight and sku
          unitPrice = variant.discountPrice > 0 && variant.discountPrice < variant.price ? variant.discountPrice : variant.price;
          regularPrice = variant.price;
          variantLabel = variant.label;
          sku = variant.sku || sku;
          resolvedVariantId = variant._id;
          if (variant.weight && variant.weight > 0) {
            variantWeight = variant.weight;
          }
        } else {
          // Stale variantId — variant was removed from product. Fall back to base product.
          console.warn(`[OrderService] Cart item has stale variantId ${item.variantId} for product ${product.name}. Falling back to base product.`);
          variantLabel = "";
          resolvedVariantId = null;
        }
      }

      // Accurate weight calculation: variant weight -> product weight -> default 0.1 kg (100g)
      let itemWeight = variantWeight || product.weight || 0.1;
      if (itemWeight <= 0) itemWeight = 0.1;

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const subtotal = unitPrice * qty;
      const gstRate = 5; 
      const gstAmount = Math.round((subtotal * gstRate) / (100 + gstRate) * 100) / 100;

      itemsTotal += subtotal;
      taxTotal += gstAmount;
      totalWeight += itemWeight * qty;

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

    const totalQuantity = validatedItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 1), 0);
    return { validatedItems, itemsTotal, taxTotal, totalWeight, totalQuantity };
  }

  /**
   * Pre-calculate shipping cost for checkout with speed options & quantity-based promotional subsidy
   * 100% Automated Shiprocket courier rates & distinct estimated business days (Slow: 5-8 days vs Fast: 2-3 days)
   */
  async calculateOrderShipping({ user, items, pincode, deliverySpeed = "standard" }) {
    if (!pincode) {
      const err = new Error("Destination pincode is required to calculate shipping");
      err.statusCode = 400;
      throw err;
    }

    const { validatedItems, itemsTotal, totalWeight, totalQuantity } = await this._resolveCheckoutItems(user, items);
    const ShippingSettings = require("../models/ShippingSettings");
    const settings = await ShippingSettings.getSettings();

    const threshold = settings.freeShippingThreshold || 800;
    const pin = String(pincode).trim();

    // 1. Fetch real-time Shiprocket courier quotes based on destination PIN & total weight
    const shippingService = require("./shippingService");
    const couriers = await shippingService.calculateShippingRates({
      deliveryPincode: pin,
      weight: totalWeight > 0 ? totalWeight : 0.5,
      declaredValue: itemsTotal,
    });

    if (!Array.isArray(couriers) || couriers.length === 0) {
      throw new Error(`Courier delivery is currently unavailable for PIN code ${pin}`);
    }

    // 2. Slow Delivery (Standard Eco): Always pick the absolute CHEAPEST courier quote from Shiprocket (e.g. India Post / Surface)
    const couriersSortedByCheapest = [...couriers].sort((a, b) => a.rate - b.rate);
    const cheapestCourier = couriersSortedByCheapest[0];

    // 3. Fast Delivery (Express Priority): Fastest Air courier with priority transit
    const expressAirCouriers = couriers.filter((c) => c.is_air && c.courier_company_id !== cheapestCourier.courier_company_id);
    let fastestCourier = null;
    if (expressAirCouriers.length > 0) {
      fastestCourier = [...expressAirCouriers].sort((a, b) => {
        if (a.estimated_delivery_days !== b.estimated_delivery_days) {
          return a.estimated_delivery_days - b.estimated_delivery_days;
        }
        return a.rate - b.rate;
      })[0];
    } else {
      const alt = couriers.filter((c) => c.courier_company_id !== cheapestCourier.courier_company_id);
      fastestCourier = alt.length > 0
        ? alt.sort((a, b) => a.estimated_delivery_days - b.estimated_delivery_days)[0]
        : null;
    }

    if (!fastestCourier || fastestCourier.courier_company_id === cheapestCourier.courier_company_id) {
      fastestCourier = {
        courier_name: `${cheapestCourier.courier_name} (Priority)`,
        courier_company_id: (cheapestCourier.courier_company_id || 10) + 1,
        rate: Math.round(cheapestCourier.rate * 1.35 + 20),
        etd: "2-3 business days",
        estimated_delivery_days: 2,
        is_air: true,
      };
    }

    // Enforce clear distinction in delivery business days:
    // Slow Eco: 5 to 8 business days (or 3-5 days for local intra-city)
    // Fast Express: 2 to 3 business days (or 1-2 days for local)
    const pin3 = parseInt(pin.substring(0, 3), 10);
    const isLocal = [500, 501, 502, 520, 521, 522].includes(pin3);

    let slowDaysLabel = cheapestCourier.etd;
    if (!slowDaysLabel || cheapestCourier.estimated_delivery_days <= 3) {
      slowDaysLabel = isLocal ? "3-5 business days" : "5-8 business days";
    }

    let fastDaysLabel = fastestCourier.etd;
    if (!fastDaysLabel || fastestCourier.estimated_delivery_days >= 4) {
      fastDaysLabel = isLocal ? "1-2 business days" : "2-3 business days";
    }

    // 4. Per-Item Shipping Discount Subsidy (if enabled in Admin Settings):
    const discountPerItem = (settings.isOfferActive && settings.shippingDiscountOffer > 0)
      ? Number(settings.shippingDiscountOffer)
      : 0;

    const itemCount = Math.max(1, totalQuantity || (validatedItems ? validatedItems.length : 1));
    const totalSubsidy = discountPerItem > 0 ? (itemCount * discountPerItem) : 0;

    // 5. Courier Rate & Delivery Pricing:
    // Display the CHEAPEST courier rate from Shiprocket (e.g. India Post).
    // Free delivery is ONLY unlocked if order subtotal reaches Free Shipping Threshold (e.g. ₹800).
    // Do NOT make eco delivery free automatically!
    const isThresholdMet = Boolean(settings.isFreeShippingEnabled && itemsTotal >= threshold);
    const isFreeEligible = isThresholdMet;

    const stdOriginal = cheapestCourier.rate;
    const stdFinal = isFreeEligible
      ? 0
      : (totalSubsidy > 0 ? Math.max(15, stdOriginal - totalSubsidy) : stdOriginal);

    const expOriginal = fastestCourier.rate;
    const expFinal = isFreeEligible
      ? Math.min(expOriginal, Math.max(25, expOriginal - stdOriginal))
      : (totalSubsidy > 0 ? Math.max(25, expOriginal - totalSubsidy) : expOriginal);

    const bannerMsg = totalSubsidy > 0
      ? (itemCount > 1
          ? `Special Seva Offer: Flat ₹${totalSubsidy} Delivery Subsidy Applied (₹${discountPerItem} OFF per item × ${itemCount} items!)`
          : `Special Seva Offer: Flat ₹${discountPerItem} Delivery Subsidy Applied! (Add more items for +₹${discountPerItem} OFF per item)`
        )
      : settings.offerBannerText;

    const options = [
      {
        id: "standard",
        name: `Standard Eco Delivery (${slowDaysLabel})`,
        marketingTag: "Most Economical · Safe Ground Vedic Packaging",
        courierName: cheapestCourier.courier_name,
        courierCompanyId: cheapestCourier.courier_company_id,
        originalRate: stdOriginal,
        discount: totalSubsidy,
        rate: stdFinal,
        isFree: isFreeEligible,
        estimatedDeliveryDays: slowDaysLabel,
        deliveryDaysCount: cheapestCourier.estimated_delivery_days || 6,
        badge: isFreeEligible ? "100% FREE Delivery" : "Lowest Rate",
        description: "Budget-friendly surface delivery with natural cow dung dhoop cushion & sealed glass-safe protection",
      },
      {
        id: "express",
        name: `Express Fast Delivery (${fastDaysLabel})`,
        marketingTag: "Fastest Arrival · Priority Air Transit",
        courierName: fastestCourier.courier_name,
        courierCompanyId: fastestCourier.courier_company_id,
        originalRate: expOriginal,
        discount: totalSubsidy,
        rate: expFinal,
        isFree: false,
        estimatedDeliveryDays: fastDaysLabel,
        deliveryDaysCount: fastestCourier.estimated_delivery_days || 2,
        badge: "Fastest Transit",
        description: "Priority dispatch within 12-24 hours via express air courier for rapid arrival",
      },
    ];

    const selectedOption = options.find((o) => o.id === deliverySpeed) || options[0];

    return {
      isFree: selectedOption.isFree,
      amount: selectedOption.rate,
      originalAmount: selectedOption.originalRate,
      discount: selectedOption.discount,
      currency: "INR",
      courierName: selectedOption.courierName,
      courierCompanyId: selectedOption.courierCompanyId,
      estimatedDeliveryDays: selectedOption.estimatedDeliveryDays,
      thresholdReached: isFreeEligible,
      threshold,
      shortfall: Math.max(0, threshold - itemsTotal),
      deliverySpeed: selectedOption.id,
      selectedOption,
      options,
      offer: {
        isActive: settings.isOfferActive,
        discount: totalSubsidy,
        discountPerItem,
        itemCount,
        label: settings.offerLabel,
        bannerText: bannerMsg,
      },
    };
  }

  /**
   * 1. Check out and create order draft with Razorpay payment initiation
   */
  async createCheckoutOrder({
    user,
    items: rawItems,
    shippingAddress,
    billingAddress,
    customerNotes,
    couponCode,
    deliverySpeed = "standard",
  }) {
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.line1) {
      const err = new Error("Valid shipping address is required");
      err.statusCode = 400;
      throw err;
    }

    const actualBilling = billingAddress && billingAddress.fullName ? billingAddress : shippingAddress;

    // Resolve items and compute subtotal
    const { validatedItems, itemsTotal, taxTotal, totalWeight } = await this._resolveCheckoutItems(user, rawItems);

    // Revalidate shipping cost via dynamic rules before creating order
    const shippingInfo = await this.calculateOrderShipping({
      user,
      items: rawItems,
      pincode: shippingAddress.postalCode,
      deliverySpeed,
    });

    const shippingFee = shippingInfo.amount;
    const shippingDiscount = shippingInfo.discount || 0;

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
          userId: user ? user._id.toString() : "guest",
          orderNumber,
        },
      });

      // Persist Order document
      const order = new Order({
        orderNumber,
        user: user ? user._id : null,
        isGuest: !user,
        guestEmail: shippingAddress.email || (user ? user.email : ""),
        guestPhone: shippingAddress.phone || (user ? user.phone : ""),
        items: validatedItems,
        pricing: {
          itemsTotal,
          taxTotal,
          shippingFee,
          shippingDiscount,
          deliverySpeed,
          discountAmount,
          couponCode: couponCode || "",
          grandTotal,
          currency: "INR",
        },
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          email: shippingAddress.email || (user ? user.email : ""),
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
          weight: totalWeight > 0 ? Math.round(totalWeight * 1000) / 1000 : 0.5,
        },
        billingAddress: {
          fullName: actualBilling.fullName,
          phone: actualBilling.phone,
          email: actualBilling.email || (user ? user.email : shippingAddress.email),
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
    if (user && order.user && order.user.toString() !== user._id.toString() && !user.isAdmin) {
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

    // Clear user cart if authenticated
    if (order.user) {
      try {
        await Cart.findOneAndUpdate({ user: order.user }, { items: [] });
      } catch (cartErr) {
        console.warn("[OrderService] Cart clear warning:", cartErr.message);
      }
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
  async dispatchOrderToShiprocket(orderId, packingOverrides = {}) {
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

    // Apply any warehouse packing overrides
    if (packingOverrides.weight) {
      order.shipping.weight = Math.max(0.05, Number(packingOverrides.weight));
    }
    if (packingOverrides.length) {
      order.shipping.length = Math.max(1, Number(packingOverrides.length));
    }
    if (packingOverrides.breadth) {
      order.shipping.breadth = Math.max(1, Number(packingOverrides.breadth));
    }
    if (packingOverrides.height) {
      order.shipping.height = Math.max(1, Number(packingOverrides.height));
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

      const normStatus = (track.currentStatus || "").trim().toUpperCase();
      const isActuallyDelivered =
        track.statusCode === 7 ||
        normStatus === "DELIVERED" ||
        normStatus === "SHIPMENT DELIVERED" ||
        normStatus === "PACKAGE DELIVERED";

      const isOutForDelivery =
        track.statusCode === 17 ||
        normStatus === "OUT FOR DELIVERY" ||
        normStatus.includes("OUT FOR DELIVERY");

      const isInTransit =
        track.statusCode === 18 ||
        track.statusCode === 6 ||
        track.statusCode === 42 ||
        normStatus === "IN TRANSIT" ||
        normStatus === "SHIPPED" ||
        normStatus === "PICKED UP" ||
        normStatus.includes("TRANSIT");

      if (isActuallyDelivered && order.status !== "delivered") {
        order.transitionTo("delivered", "courier", "Shiprocket confirmed delivery");
        order.shipping.deliveredAt = new Date();
        notificationService.sendOrderDelivered(order).catch(console.error);
      } else if (isOutForDelivery && order.status !== "out_for_delivery" && order.status !== "delivered") {
        order.transitionTo("out_for_delivery", "courier", "Shiprocket out for delivery");
      } else if (isInTransit && ["confirmed", "processing", "ready_to_ship"].includes(order.status)) {
        order.transitionTo("shipped", "courier", `Shiprocket tracking: ${track.currentStatus}`);
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

