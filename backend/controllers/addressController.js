const User = require("../models/User");

const MAX_ADDRESSES = 5;

/**
 * GET /api/auth/addresses
 * Get all saved addresses for the current user
 */
async function getAddresses(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    const addresses = user ? user.addresses || [] : [];

    // Sort so default/primary address appears first
    const sorted = [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    res.json({
      success: true,
      addresses: sorted,
      maxLimit: MAX_ADDRESSES,
      count: addresses.length,
      limitReached: addresses.length >= MAX_ADDRESSES,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/addresses
 * Add a new delivery address (enforcing maximum 5 addresses limit)
 */
async function addAddress(req, res, next) {
  try {
    const { label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = req.body;

    if (!fullName || !phone || !line1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required address fields: Full Name, Phone, Address Line 1, City, State, and PIN Code.",
      });
    }

    if (!/^\d{6}$/.test(String(postalCode).trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Enforce strictly limited number of saved addresses per customer
    if (user.addresses && user.addresses.length >= MAX_ADDRESSES) {
      return res.status(400).json({
        success: false,
        message: `Address limit reached. Customers can save a maximum of ${MAX_ADDRESSES} addresses to ensure system security. Please edit or delete an existing address.`,
        limitReached: true,
        maxLimit: MAX_ADDRESSES,
      });
    }

    const shouldBeDefault = Boolean(isDefault) || !user.addresses || user.addresses.length === 0;

    // If setting as default, mark all other addresses as false
    if (shouldBeDefault && Array.isArray(user.addresses)) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label: label ? label.trim() : "Home",
      fullName: fullName.trim(),
      phone: phone.trim(),
      line1: line1.trim(),
      line2: line2 ? line2.trim() : "",
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country ? country.trim() : "India",
      isDefault: shouldBeDefault,
    };

    user.addresses.push(newAddress);
    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    res.status(201).json({
      success: true,
      message: "Address saved successfully.",
      addresses: sorted,
      maxLimit: MAX_ADDRESSES,
      count: user.addresses.length,
      limitReached: user.addresses.length >= MAX_ADDRESSES,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/auth/addresses/:id
 * Update an existing delivery address
 */
async function updateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const { label, fullName, phone, line1, line2, city, state, postalCode, country, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const address = user.addresses.id(id);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    if (fullName) address.fullName = fullName.trim();
    if (phone) address.phone = phone.trim();
    if (line1) address.line1 = line1.trim();
    if (line2 !== undefined) address.line2 = line2 ? line2.trim() : "";
    if (city) address.city = city.trim();
    if (state) address.state = state.trim();
    if (postalCode) {
      if (!/^\d{6}$/.test(String(postalCode).trim())) {
        return res.status(400).json({ success: false, message: "Please enter a valid 6-digit Indian PIN code." });
      }
      address.postalCode = postalCode.trim();
    }
    if (country) address.country = country.trim();
    if (label) address.label = label.trim();

    if (isDefault !== undefined) {
      if (isDefault) {
        user.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
        address.isDefault = true;
      } else {
        address.isDefault = false;
        // If user unchecked default but this was the only address, keep it default
        if (user.addresses.length === 1) {
          address.isDefault = true;
        }
      }
    }

    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    res.json({
      success: true,
      message: "Address updated successfully.",
      addresses: sorted,
      maxLimit: MAX_ADDRESSES,
      count: user.addresses.length,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/auth/addresses/:id
 * Delete a saved delivery address
 */
async function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was primary, make the first remaining address the primary
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    res.json({
      success: true,
      message: "Address removed successfully.",
      addresses: sorted,
      maxLimit: MAX_ADDRESSES,
      count: user.addresses.length,
      limitReached: user.addresses.length >= MAX_ADDRESSES,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/addresses/:id/default
 * Set address as primary / default
 */
async function setDefaultAddress(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let found = false;
    user.addresses.forEach((addr) => {
      if (addr._id.toString() === id) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    await user.save();

    const sorted = [...user.addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

    res.json({
      success: true,
      message: "Primary delivery address updated.",
      addresses: sorted,
      maxLimit: MAX_ADDRESSES,
      count: user.addresses.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  MAX_ADDRESSES,
};
