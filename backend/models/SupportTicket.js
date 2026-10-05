const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "general",
        "product",
        "order",
        "shipping",
        "payment",
        "return_refund",
        "complaint",
        "partnership",
        "other",
      ],
      default: "general",
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "new",
        "open",
        "in_progress",
        "waiting_customer",
        "resolved",
        "closed",
      ],
      default: "new",
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestAccessToken: {
      type: String,
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ["website", "email", "phone", "whatsapp"],
      default: "website",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastCustomerMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastAdminMessageAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    callNotesCount: {
      type: Number,
      default: 0,
    },
    internalNotesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Helper method to format human readable category
supportTicketSchema.methods.getCategoryLabel = function () {
  const map = {
    general: "General Enquiry",
    product: "Product Information",
    order: "Order Related",
    shipping: "Shipping & Delivery",
    payment: "Payment Issue",
    return_refund: "Return / Refund",
    complaint: "Product Complaint",
    partnership: "Partnership / Business",
    other: "Other",
  };
  return map[this.category] || this.category;
};

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
