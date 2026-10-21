const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, default: "" },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    variantLabel: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    hsnCode: { type: String, default: "04059020" },
    gstRate: { type: Number, default: 5 }, // 5% default for Ghee/Goshala products
    gstAmount: { type: Number, default: 0 },
  },
  { _id: true }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
);

const trackingHistoryItemSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    activity: { type: String, default: "" },
    location: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const statusHistoryItemSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: "system" }, // "system", "user", "admin"
    note: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
      index: true,
    },
    guestEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    guestPhone: {
      type: String,
      default: "",
      trim: true,
    },
    items: [orderItemSchema],

    pricing: {
      itemsTotal: { type: Number, required: true, min: 0 },
      taxTotal: { type: Number, default: 0, min: 0 },
      shippingFee: { type: Number, default: 0, min: 0 },
      shippingDiscount: { type: Number, default: 0, min: 0 },
      deliverySpeed: { type: String, default: "standard" },
      discountAmount: { type: Number, default: 0, min: 0 },
      couponCode: { type: String, default: "" },
      grandTotal: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "INR" },
    },

    shippingAddress: {
      type: addressSnapshotSchema,
      required: true,
    },
    billingAddress: {
      type: addressSnapshotSchema,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending_payment",
        "payment_failed",
        "confirmed",
        "processing",
        "ready_to_ship",
        "shipped",
        "out_for_delivery",
        "delivered",
        "return_requested",
        "return_approved",
        "return_pickup_scheduled",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "pending_payment",
      index: true,
    },

    payment: {
      provider: {
        type: String,
        enum: ["razorpay", "mock", "cod"],
        default: "razorpay",
      },
      status: {
        type: String,
        enum: [
          "pending",
          "authorized",
          "captured",
          "failed",
          "refunded",
          "partially_refunded",
        ],
        default: "pending",
      },
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: { type: String, index: true },
      razorpaySignature: { type: String },
      paidAt: { type: Date },
      failureReason: { type: String },
    },

    shipping: {
      provider: { type: String, default: "shiprocket" },
      shiprocketOrderId: { type: Number },
      shipmentId: { type: Number },
      awbCode: { type: String, index: true },
      courierCompanyId: { type: Number },
      courierName: { type: String, default: "" },
      trackingUrl: { type: String, default: "" },
      labelUrl: { type: String, default: "" },
      manifestUrl: { type: String, default: "" },
      pickupScheduledAt: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
      etd: { type: String, default: "" },
      currentStatus: { type: String, default: "Pending Shipment" },
      history: [trackingHistoryItemSchema],
      weight: { type: Number, default: 0.5 },
      length: { type: Number },
      breadth: { type: Number },
      height: { type: Number },
    },

    invoice: {
      invoiceNumber: { type: String, index: true },
      invoiceDate: { type: Date },
      invoiceUrl: { type: String, default: "" },
      fileId: { type: String, default: "" },
    },

    refund: {
      status: {
        type: String,
        enum: ["none", "requested", "processing", "completed", "failed"],
        default: "none",
      },
      razorpayRefundId: { type: String },
      amount: { type: Number, default: 0 },
      reason: { type: String, default: "" },
      refundedAt: { type: Date },
    },

    customerNotes: { type: String, default: "" },

    returnRequest: {
      status: {
        type: String,
        enum: ["none", "requested", "approved", "pickup_scheduled", "picked_up", "received", "rejected"],
        default: "none",
      },
      reason: { type: String, default: "" },
      comments: { type: String, default: "" },
      requestedAt: { type: Date },
      actionedAt: { type: Date },
      rejectionReason: { type: String, default: "" },
      shiprocketReturnOrderId: { type: Number },
      shiprocketReturnShipmentId: { type: Number },
      returnAwbCode: { type: String },
      returnCourierName: { type: String, default: "" },
      returnTrackingUrl: { type: String, default: "" },
      pickupAddress: {
        fullName: { type: String },
        phone: { type: String },
        line1: { type: String },
        line2: { type: String },
        city: { type: String },
        state: { type: String },
        postalCode: { type: String },
      },
    },

    statusHistory: [statusHistoryItemSchema],
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "payment.razorpayOrderId": 1 });
orderSchema.index({ "payment.razorpayPaymentId": 1 });
orderSchema.index({ "shipping.awbCode": 1 });
orderSchema.index({ "invoice.invoiceNumber": 1 });

/**
 * Generate human-friendly unique order number
 * Format: BG-YYYYMMDD-XXXX (e.g. BG-20261006-9281)
 */
orderSchema.statics.generateOrderNumber = function () {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BG-${dateStr}-${randomSuffix}`;
};

/**
 * Helper to record status transitions with audit logs
 */
orderSchema.methods.transitionTo = function (nextStatus, changedBy = "system", note = "") {
  this.status = nextStatus;
  this.statusHistory.push({
    status: nextStatus,
    changedAt: new Date(),
    changedBy,
    note,
  });
};

module.exports = mongoose.model("Order", orderSchema);
