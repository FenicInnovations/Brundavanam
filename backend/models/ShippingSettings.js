const mongoose = require("mongoose");

const shippingSettingsSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: "global",
      unique: true,
      index: true,
    },

    // Free Delivery Threshold (Configurable from Admin Panel)
    freeShippingThreshold: {
      type: Number,
      default: 800,
      min: 0,
    },
    isFreeShippingEnabled: {
      type: Boolean,
      default: true,
    },

    // Standard / Economical Delivery Rates (Subsidized)
    standardBaseRate: {
      type: Number,
      default: 45,
      min: 0,
    },
    standardLocalRate: {
      type: Number,
      default: 35, // Andhra Pradesh & Telangana
      min: 0,
    },
    standardEstimatedDays: {
      type: String,
      default: "2-4 business days",
    },

    // Express / Fast Delivery Rates
    expressBaseRate: {
      type: Number,
      default: 79,
      min: 0,
    },
    expressLocalRate: {
      type: Number,
      default: 59,
      min: 0,
    },
    expressEstimatedDays: {
      type: String,
      default: "1-2 business days",
    },

    // Special Promotional Subsidy / Delivery Discount Offer
    shippingDiscountOffer: {
      type: Number,
      default: 20, // e.g. ₹20 off delivery fee
      min: 0,
    },
    isOfferActive: {
      type: Boolean,
      default: true,
    },
    offerLabel: {
      type: String,
      default: "Goshala Delivery Subsidy",
    },
    offerBannerText: {
      type: String,
      default: "Special Seva Offer: Flat ₹20 Delivery Subsidy Applied at Checkout!",
    },

    // Maximum Shipping Cap Safeguards (never allow ₹165)
    maxStandardCharge: {
      type: Number,
      default: 49,
    },
    maxExpressCharge: {
      type: Number,
      default: 89,
    },

    // Audit Info
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedByName: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

// Static method to get or initialize default global shipping settings
shippingSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ configKey: "global" });
  if (!settings) {
    settings = await this.create({ configKey: "global" });
  }
  return settings;
};

module.exports = mongoose.model("ShippingSettings", shippingSettingsSchema);
