const express = require("express");
const router = express.Router();
const Gallery = require("../models/Gallery");
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");


// ─── PUBLIC ROUTES ───────────────────────────────────────────────────────────

// GET /api/gallery — Fetch all published gallery items (for About Us page)
router.get("/", async (req, res) => {
  try {
    const items = await Gallery.find({ isPublished: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Gallery fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch gallery items" });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/admin/gallery — Fetch all items (including unpublished)
router.get("/admin", protect, adminOnly, async (req, res) => {
  try {
    const items = await Gallery.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Admin gallery fetch error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch gallery items" });
  }
});

// POST /api/admin/gallery — Add new gallery item
router.post("/admin", protect, adminOnly, async (req, res) => {
  try {
    const { type, title, description, url, thumbnailUrl, sortOrder, isPublished, tags } = req.body;

    if (!type || !url) {
      return res.status(400).json({ success: false, message: "Type and URL are required" });
    }

    const item = new Gallery({
      type,
      title,
      description,
      url,
      thumbnailUrl,
      sortOrder: sortOrder || 0,
      isPublished: isPublished !== undefined ? isPublished : true,
      tags: tags || [],
    });

    await item.save();
    res.status(201).json({ success: true, data: item, message: "Gallery item added successfully" });
  } catch (err) {
    console.error("Gallery create error:", err);
    res.status(500).json({ success: false, message: "Failed to create gallery item" });
  }
});

// PUT /api/admin/gallery/:id — Update a gallery item
router.put("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Gallery item not found" });
    }

    const { type, title, description, url, thumbnailUrl, sortOrder, isPublished, tags } = req.body;

    if (type) item.type = type;
    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (url) item.url = url;
    if (thumbnailUrl !== undefined) item.thumbnailUrl = thumbnailUrl;
    if (sortOrder !== undefined) item.sortOrder = sortOrder;
    if (isPublished !== undefined) item.isPublished = isPublished;
    if (tags) item.tags = tags;

    await item.save();
    res.json({ success: true, data: item, message: "Gallery item updated successfully" });
  } catch (err) {
    console.error("Gallery update error:", err);
    res.status(500).json({ success: false, message: "Failed to update gallery item" });
  }
});

// DELETE /api/admin/gallery/:id — Delete a gallery item
router.delete("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Gallery item not found" });
    }
    res.json({ success: true, message: "Gallery item deleted successfully" });
  } catch (err) {
    console.error("Gallery delete error:", err);
    res.status(500).json({ success: false, message: "Failed to delete gallery item" });
  }
});

// PATCH /api/admin/gallery/:id/toggle — Toggle published status
router.patch("/admin/:id/toggle", protect, adminOnly, async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Gallery item not found" });
    }
    item.isPublished = !item.isPublished;
    await item.save();
    res.json({ success: true, data: item, message: `Gallery item ${item.isPublished ? "published" : "unpublished"}` });
  } catch (err) {
    console.error("Gallery toggle error:", err);
    res.status(500).json({ success: false, message: "Failed to toggle gallery item" });
  }
});

module.exports = router;
