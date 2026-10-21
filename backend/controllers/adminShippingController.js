const ShippingSettings = require("../models/ShippingSettings");

/**
 * GET /api/admin/shipping/settings
 * Fetch current dynamic shipping and delivery configuration
 */
async function getShippingSettings(req, res, next) {
  try {
    const settings = await ShippingSettings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/shipping/settings
 * Update delivery charges, free shipping threshold, speed options, and promotional subsidies
 */
async function updateShippingSettings(req, res, next) {
  try {
    const settings = await ShippingSettings.getSettings();
    const {
      freeShippingThreshold,
      isFreeShippingEnabled,
      standardBaseRate,
      standardLocalRate,
      standardEstimatedDays,
      expressBaseRate,
      expressLocalRate,
      expressEstimatedDays,
      shippingDiscountOffer,
      isOfferActive,
      offerLabel,
      offerBannerText,
      maxStandardCharge,
      maxExpressCharge,
    } = req.body;

    if (freeShippingThreshold !== undefined) {
      settings.freeShippingThreshold = Math.max(0, parseInt(freeShippingThreshold, 10) || 0);
    }
    if (typeof isFreeShippingEnabled === "boolean") {
      settings.isFreeShippingEnabled = isFreeShippingEnabled;
    }
    if (standardBaseRate !== undefined) {
      settings.standardBaseRate = Math.max(0, parseInt(standardBaseRate, 10) || 0);
    }
    if (standardLocalRate !== undefined) {
      settings.standardLocalRate = Math.max(0, parseInt(standardLocalRate, 10) || 0);
    }
    if (typeof standardEstimatedDays === "string" && standardEstimatedDays.trim()) {
      settings.standardEstimatedDays = standardEstimatedDays.trim();
    }
    if (expressBaseRate !== undefined) {
      settings.expressBaseRate = Math.max(0, parseInt(expressBaseRate, 10) || 0);
    }
    if (expressLocalRate !== undefined) {
      settings.expressLocalRate = Math.max(0, parseInt(expressLocalRate, 10) || 0);
    }
    if (typeof expressEstimatedDays === "string" && expressEstimatedDays.trim()) {
      settings.expressEstimatedDays = expressEstimatedDays.trim();
    }
    if (shippingDiscountOffer !== undefined) {
      settings.shippingDiscountOffer = Math.max(0, parseInt(shippingDiscountOffer, 10) || 0);
    }
    if (typeof isOfferActive === "boolean") {
      settings.isOfferActive = isOfferActive;
    }
    if (typeof offerLabel === "string" && offerLabel.trim()) {
      settings.offerLabel = offerLabel.trim();
    }
    if (typeof offerBannerText === "string" && offerBannerText.trim()) {
      settings.offerBannerText = offerBannerText.trim();
    }
    if (maxStandardCharge !== undefined) {
      settings.maxStandardCharge = Math.max(0, parseInt(maxStandardCharge, 10) || 49);
    }
    if (maxExpressCharge !== undefined) {
      settings.maxExpressCharge = Math.max(0, parseInt(maxExpressCharge, 10) || 89);
    }

    if (req.user) {
      settings.updatedBy = req.user._id;
      settings.updatedByName = req.user.name?.trim() || (req.user.phone ? `+91 ${req.user.phone}` : "Admin");
    }

    await settings.save();

    res.json({
      success: true,
      message: "Shipping rules and delivery strategy updated successfully",
      settings,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getShippingSettings,
  updateShippingSettings,
};
