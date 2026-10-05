const express = require("express");
const router = express.Router();
const {
  getPublicProducts,
  getPublicProductBySlug,
  streamMediaFile,
} = require("../controllers/productController");

// Public media file streaming proxy (bypasses private bucket ACLs)
router.get("/media/file/*", streamMediaFile);

router.get("/", getPublicProducts);
router.get("/:slugOrId", getPublicProductBySlug);

module.exports = router;
