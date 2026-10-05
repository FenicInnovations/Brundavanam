const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeCart,
} = require("../controllers/cartController");

router.use(protect);

router.get("/", getCart);
router.post("/items", addItem);
router.put("/items/:itemId", updateItemQuantity);
router.delete("/items/:itemId", removeItem);
router.delete("/", clearCart);
router.post("/merge", mergeCart);

module.exports = router;
