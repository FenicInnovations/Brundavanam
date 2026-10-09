const User = require("../models/User");

/**
 * GET /api/admin/customers
 * Get all customers with pagination and search
 */
async function getAllCustomers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { search } = req.query;

    const filter = { role: "customer" }; // Only fetch customers

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [customers, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-password -resetPasswordToken -resetPasswordExpires"), // Exclude sensitive info
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      customers,
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
 * PATCH /api/admin/customers/:id/status
 * Toggle customer active status
 */
async function toggleCustomerStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.isActive = isActive;
    await customer.save();

    res.json({
      success: true,
      message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
      customer,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCustomers,
  toggleCustomerStatus,
};
