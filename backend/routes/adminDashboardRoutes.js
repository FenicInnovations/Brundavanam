const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const { getDashboardStats } = require("../controllers/adminDashboardController");

router.use(protect, adminOnly);

router.get("/stats", getDashboardStats);

module.exports = router;
