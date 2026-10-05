const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getSignedUploadUrl,
  uploadDirectMedia,
} = require("../controllers/adminProductController");

// Secure all admin product endpoints
router.use(protect, adminOnly);

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/:id/stock", updateStock);
router.post("/media/upload-url", getSignedUploadUrl);
router.post("/media/upload-direct", uploadDirectMedia);

module.exports = router;
