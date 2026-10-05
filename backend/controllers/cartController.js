const Cart = require("../models/Cart");
const Product = require("../models/Product");

/**
 * Helper to populate cart product details cleanly
 */
async function getPopulatedCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug price discountPrice stock images isActive isDeleted category brand sku",
    populate: { path: "category", select: "name slug" },
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    return { cart, items: [] };
  }

  // Filter out any products that were deleted or deactivated
  const validItems = cart.items.filter(
    (item) => item.product && item.product.isActive && !item.product.isDeleted
  );

  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    await cart.save();
  }

  return { cart, items: cart.items };
}

// GET /api/cart
async function getCart(req, res, next) {
  try {
    const { items } = await getPopulatedCart(req.user._id);
    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart/items
async function addItem(req, res, next) {
  try {
    const { productId, variantId, variantLabel, quantity = 1 } = req.body;

    if (!productId) {
      const err = new Error("Product ID is required");
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product || product.isDeleted || !product.isActive) {
      const err = new Error("Product is unavailable or out of stock");
      err.statusCode = 404;
      throw err;
    }

    if (product.stock <= 0) {
      const err = new Error("Product is currently out of stock");
      err.statusCode = 400;
      throw err;
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart with same product and variant
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        (variantId ? item.variantId?.toString() === variantId : !item.variantId)
    );

    const requestedQty = Number(quantity);

    if (existingIndex > -1) {
      const currentQty = cart.items[existingIndex].quantity;
      const newQty = Math.min(currentQty + requestedQty, product.stock);
      cart.items[existingIndex].quantity = newQty;
    } else {
      const initialQty = Math.min(requestedQty, product.stock);
      cart.items.push({
        product: productId,
        variantId: variantId || null,
        variantLabel: variantLabel || "",
        quantity: initialQty,
      });
    }

    await cart.save();
    const { items } = await getPopulatedCart(req.user._id);

    res.json({
      success: true,
      message: "Item added to cart",
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/cart/items/:itemId
async function updateItemQuantity(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      const err = new Error("Cart not found");
      err.statusCode = 404;
      throw err;
    }

    const item = cart.items.id(itemId);
    if (!item) {
      const err = new Error("Cart item not found");
      err.statusCode = 404;
      throw err;
    }

    const newQty = Number(quantity);

    if (newQty <= 0) {
      cart.items.pull(itemId);
    } else {
      const product = await Product.findById(item.product);
      if (product) {
        item.quantity = Math.min(newQty, product.stock);
      } else {
        cart.items.pull(itemId);
      }
    }

    await cart.save();
    const { items } = await getPopulatedCart(req.user._id);

    res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart/items/:itemId
async function removeItem(req, res, next) {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      const err = new Error("Cart not found");
      err.statusCode = 404;
      throw err;
    }

    cart.items.pull(itemId);
    await cart.save();

    const { items } = await getPopulatedCart(req.user._id);
    res.json({
      success: true,
      message: "Item removed from cart",
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart
async function clearCart(req, res, next) {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({
      success: true,
      message: "Cart cleared",
      data: [],
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart/merge
async function mergeCart(req, res, next) {
  try {
    const { guestItems = [] } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const guestItem of guestItems) {
      const productId = guestItem.product?._id || guestItem.productId;
      if (!productId) continue;

      const product = await Product.findById(productId);
      if (!product || product.isDeleted || !product.isActive || product.stock <= 0) {
        continue;
      }

      const existingIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          (guestItem.variantId
            ? item.variantId?.toString() === guestItem.variantId
            : !item.variantId)
      );

      const guestQty = Number(guestItem.quantity) || 1;

      if (existingIndex > -1) {
        // Merge quantities for duplicate item
        const combinedQty = cart.items[existingIndex].quantity + guestQty;
        cart.items[existingIndex].quantity = Math.min(combinedQty, product.stock);
      } else {
        cart.items.push({
          product: productId,
          variantId: guestItem.variantId || null,
          variantLabel: guestItem.variantLabel || "",
          quantity: Math.min(guestQty, product.stock),
        });
      }
    }

    await cart.save();
    const { items } = await getPopulatedCart(req.user._id);

    res.json({
      success: true,
      message: "Guest cart merged successfully",
      data: items,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeCart,
};
