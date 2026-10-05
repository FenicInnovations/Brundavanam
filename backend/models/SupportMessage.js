const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, default: "document" },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: true }
);

const callDetailsSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String },
    durationMinutes: { type: Number, default: 0 },
    outcome: {
      type: String,
      enum: ["answered", "busy", "no_answer", "voicemail", "resolved", "callback_requested"],
      default: "answered",
    },
  },
  { _id: false }
);

const supportMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderType: {
      type: String,
      required: true,
      enum: ["customer", "admin", "system"],
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [attachmentSchema],
    channel: {
      type: String,
      enum: ["website", "email", "phone", "whatsapp"],
      default: "website",
    },
    isInternal: {
      type: Boolean,
      default: false,
      index: true,
    },
    noteType: {
      type: String,
      enum: ["message", "internal_note", "call_note", "system_event"],
      default: "message",
      index: true,
    },
    callDetails: {
      type: callDetailsSchema,
      default: null,
    },
    systemEventDetails: {
      action: { type: String },
      previousValue: { type: String },
      newValue: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
