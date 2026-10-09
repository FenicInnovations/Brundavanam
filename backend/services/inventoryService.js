const Product = require("../models/Product");

/**
 * Inventory Service
 * Manages atomic stock reservations, commits, and releases with variant-level support.
 */
class InventoryService {
  /**
   * Verify if all items in the list have sufficient stock
   */
  async checkStock(items = []) {
    const issues = [];

    for (const item of items) {
      const product = await Product.findById(item.product || item._id);
      if (!product || product.isDeleted || !product.isActive) {
        issues.push({
          productId: item.product || item._id,
          name: item.name || "Unknown Product",
          error: "Product is no longer available",
        });
        continue;
      }

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) {
          issues.push({
            productId: product._id,
            name: product.name,
            error: `Variant '${item.variantLabel || item.variantId}' not found`,
          });
        } else if (variant.stock < item.quantity) {
          issues.push({
            productId: product._id,
            name: `${product.name} (${variant.label})`,
            available: variant.stock,
            requested: item.quantity,
            error: `Only ${variant.stock} units remaining in stock`,
          });
        }
      } else {
        if (product.stock < item.quantity) {
          issues.push({
            productId: product._id,
            name: product.name,
            available: product.stock,
            requested: item.quantity,
            error: `Only ${product.stock} units remaining in stock`,
          });
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Atomically reserve stock during checkout initialization.
   * If any single product fails to decrement (race condition), rolls back all previously decremented items.
   */
  async reserveStock(items = []) {
    const reservedItems = [];

    try {
      for (const item of items) {
        const productId = item.product?._id || item.product || item._id;
        const quantity = item.quantity;

        if (item.variantId) {
          // Decrement specific variant and base product stock atomically
          const updated = await Product.findOneAndUpdate(
            {
              _id: productId,
              isActive: true,
              isDeleted: false,
              variants: {
                $elemMatch: {
                  _id: item.variantId,
                  stock: { $gte: quantity }
                }
              }
            },
            {
              $inc: {
                "variants.$.stock": -quantity,
                stock: -quantity,
              },
            },
            { new: true }
          );

          if (!updated) {
            const err = new Error(
              `Insufficient stock for '${item.name || "variant"}' (${item.variantLabel || ""})`
            );
            err.statusCode = 400;
            throw err;
          }
          reservedItems.push(item);
        } else {
          // Decrement base product stock atomically
          const updated = await Product.findOneAndUpdate(
            {
              _id: productId,
              isActive: true,
              isDeleted: false,
              stock: { $gte: quantity },
            },
            {
              $inc: { stock: -quantity },
            },
            { new: true }
          );

          if (!updated) {
            const err = new Error(`Insufficient stock for '${item.name || "product"}'`);
            err.statusCode = 400;
            throw err;
          }
          reservedItems.push(item);
        }
      }

      return { success: true, reservedCount: reservedItems.length };
    } catch (err) {
      // Rollback already reserved items on failure
      if (reservedItems.length > 0) {
        await this.releaseStock(reservedItems);
      }
      throw err;
    }
  }

  /**
   * Release reserved stock back into inventory (e.g., checkout abandoned, payment failure, order cancellation)
   */
  async releaseStock(items = []) {
    const results = [];

    for (const item of items) {
      const productId = item.product?._id || item.product || item._id;
      const quantity = item.quantity;

      try {
        if (item.variantId) {
          await Product.updateOne(
            {
              _id: productId,
              "variants._id": item.variantId,
            },
            {
              $inc: {
                "variants.$.stock": quantity,
                stock: quantity,
              },
            }
          );
        } else {
          await Product.updateOne(
            { _id: productId },
            { $inc: { stock: quantity } }
          );
        }
        results.push({ productId, quantity, released: true });
      } catch (releaseErr) {
        console.error(
          `[InventoryService] Error releasing stock for product ${productId}:`,
          releaseErr.message
        );
        results.push({ productId, quantity, released: false, error: releaseErr.message });
      }
    }

    return results;
  }

  /**
   * Commit reserved stock permanently upon verified payment
   */
  async commitStock(items = []) {
    // In our atomic reservation pattern, stock is already decremented at reservation time.
    // Commit finalizes the transaction in logs.
    console.log(
      `[InventoryService] Successfully committed stock for ${items.length} order items.`
    );
    return { success: true };
  }
}

module.exports = new InventoryService();
