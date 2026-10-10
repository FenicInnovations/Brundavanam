const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  subscribe,
  unsubscribe,
  getAdminSubscribers,
  getAdminNewsletterStats,
  updateSubscriber,
  deleteSubscriber,
  exportSubscribers,
  broadcastNewsletter,
} = require("../controllers/newsletterController");

// Public endpoints
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// Admin-protected endpoints
router.get("/admin/subscribers", protect, adminOnly, getAdminSubscribers);
router.get("/admin/stats", protect, adminOnly, getAdminNewsletterStats);
router.get("/admin/export", protect, adminOnly, exportSubscribers);
router.post("/admin/broadcast", protect, adminOnly, broadcastNewsletter);
router.patch("/admin/:id", protect, adminOnly, updateSubscriber);
router.delete("/admin/:id", protect, adminOnly, deleteSubscriber);

module.exports = router;
