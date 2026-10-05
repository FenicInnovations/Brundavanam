const Product = require("../models/Product");
const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");

// GET /api/admin/dashboard/stats
async function getDashboardStats(req, res, next) {
  try {
    const totalProducts = await Product.countDocuments({ isDeleted: false });
    const activeProducts = await Product.countDocuments({ isDeleted: false, isActive: true });
    const lowStockProducts = await Product.countDocuments({
      isDeleted: false,
      stock: { $gt: 0, $lte: 10 },
    });
    const outOfStockProducts = await Product.countDocuments({
      isDeleted: false,
      stock: 0,
    });

    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalTickets = await SupportTicket.countDocuments();
    const openTickets = await SupportTicket.countDocuments({
      status: { $in: ["new", "open", "in_progress", "waiting_customer"] },
    });

    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        customers: {
          total: totalCustomers,
        },
        support: {
          total: totalTickets,
          open: openTickets,
        },
        orders: {
          isImplemented: false,
          note: "Orders module is planned for future release",
          total: null,
          pending: null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboardStats };
