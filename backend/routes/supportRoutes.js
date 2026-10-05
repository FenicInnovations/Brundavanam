const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  createTicket,
  getGuestTicket,
  replyGuestTicket,
  getCustomerTickets,
  getCustomerTicketById,
  replyCustomerTicket,
  getAdminSupportStats,
  getAdminTickets,
  getAdminTicketById,
  adminReply,
  adminAddInternalNote,
  adminLogCall,
  adminUpdateStatus,
  adminUpdatePriority,
  adminAssignTicket,
  getAdminStaffList,
  inboundEmailWebhook,
  getAdminSmtpStatus,
  sendAdminTestEmail,
} = require("../controllers/supportController");

/**
 * Optional authentication helper: if cookie exists, resolves req.user,
 * otherwise allows guest submission without throwing.
 */
async function optionalAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.userId);
  } catch {
    // Continue as guest if token is missing or expired
  }
  next();
}

// ----------------------------------------------------
// Public / Guest Routes
// ----------------------------------------------------
router.post("/tickets", optionalAuth, createTicket);
router.get("/tickets/track", getGuestTicket);
router.post("/tickets/track/messages", replyGuestTicket);
router.post("/webhook/inbound-email", inboundEmailWebhook);

// ----------------------------------------------------
// Customer Authenticated Routes
// ----------------------------------------------------
router.get("/customer/tickets", protect, getCustomerTickets);
router.get("/customer/tickets/:id", protect, getCustomerTicketById);
router.post("/customer/tickets/:id/messages", protect, replyCustomerTicket);

// ----------------------------------------------------
// Admin Routes (Restricted to role 'admin' & 'super_admin')
// ----------------------------------------------------
router.get("/admin/stats", protect, adminOnly, getAdminSupportStats);
router.get("/admin/tickets", protect, adminOnly, getAdminTickets);
router.get("/admin/tickets/:id", protect, adminOnly, getAdminTicketById);
router.post("/admin/tickets/:id/reply", protect, adminOnly, adminReply);
router.post("/admin/tickets/:id/internal-notes", protect, adminOnly, adminAddInternalNote);
router.post("/admin/tickets/:id/call-notes", protect, adminOnly, adminLogCall);
router.patch("/admin/tickets/:id/status", protect, adminOnly, adminUpdateStatus);
router.patch("/admin/tickets/:id/priority", protect, adminOnly, adminUpdatePriority);
router.patch("/admin/tickets/:id/assign", protect, adminOnly, adminAssignTicket);
router.get("/admin/staff", protect, adminOnly, getAdminStaffList);
router.get("/admin/smtp-status", protect, adminOnly, getAdminSmtpStatus);
router.post("/admin/test-email", protect, adminOnly, sendAdminTestEmail);

module.exports = router;
