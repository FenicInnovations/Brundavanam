const Product = require("../models/Product");
const Category = require("../models/Category");
const { createSlug } = require("../utils/slugify");
const gcsService = require("../services/gcsService");
const { invalidateCache } = require("../graphql/resolvers");

/**
 * Normalizes weight to kilograms based on unit:
 * - 'kg': value as-is
 * - 'g': value / 1000
 * - 'ml': value / 1000 (standard liquid density ~0.95-1.0 g/ml)
 * - 'l': value * 1.0
 */
function normalizeWeightToKg(value, unit = "g") {
  const num = Number(value);
  if (isNaN(num) || num <= 0) return 0.1; // Default 100g if unset

  switch (unit?.toLowerCase()) {
    case "kg":
      return Math.round(num * 1000) / 1000;
    case "g":
      return Math.round((num / 1000) * 1000) / 1000;
    case "ml":
      return Math.round((num / 1000) * 1000) / 1000;
    case "l":
      return Math.round(num * 1000) / 1000;
    default:
      return Math.round((num / 1000) * 1000) / 1000;
  }
}

function normalizeDimensions(dim) {
  if (!dim || typeof dim !== "object") {
    return { length: 10, breadth: 10, height: 10 };
  }
  return {
    length: Math.max(1, Number(dim.length) || 10),
    breadth: Math.max(1, Number(dim.breadth) || 10),
    height: Math.max(1, Number(dim.height) || 10),
  };
}

// GET /api/admin/products
async function getProducts(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      subcategory,
      status, // active, inactive, all
      stockStatus, // low_stock, out_of_stock, in_stock, all
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeDeleted = "false",
    } = req.query;

    // Filter pipeline
    const filter = {};

    // Soft delete filter
    if (includeDeleted === "true") {
      // Show all including soft deleted
    } else if (includeDeleted === "only") {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = false;
    }

    // Search query
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: regex },
        { sku: regex },
        { brand: regex },
        { tags: regex },
        { shortDescription: regex },
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    // Status filter
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    // Stock Status filter
    if (stockStatus === "out_of_stock") {
      filter.stock = 0;
    } else if (stockStatus === "low_stock") {
      filter.stock = { $gt: 0, $lte: 10 };
    } else if (stockStatus === "in_stock") {
      filter.stock = { $gt: 10 };
    }

    // Featured filter
    if (isFeatured === "true") {
      filter.isFeatured = true;
    }

    // Sort configuration
    const sortField = ["name", "price", "stock", "createdAt", "updatedAt"].includes(sortBy)
      ? sortBy
      : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit) || 1;

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/products/:id
async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/products
async function createProduct(req, res, next) {
  try {
    const {
      name,
      slug: customSlug,
      sku,
      brand,
      category,
      subcategory,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      images = [],
      files = [],
      variants = [],
      attributes = [],
      tags = [],
      isFeatured = false,
      isActive = true,
      seoTitle,
      seoDescription,
      weightValue,
      weightUnit = "g",
      dimensions,
    } = req.body;

    if (!name || !name.trim()) {
      const err = new Error("Product name is required");
      err.statusCode = 400;
      throw err;
    }

    if (!price || Number(price) < 0) {
      const err = new Error("Valid product price is required");
      err.statusCode = 400;
      throw err;
    }

    if (!category) {
      const err = new Error("Category is required");
      err.statusCode = 400;
      throw err;
    }

    // Auto-generate or validate slug
    let baseSlug = customSlug ? createSlug(customSlug) : createSlug(name);
    let finalSlug = baseSlug;
    let slugExists = await Product.findOne({ slug: finalSlug });
    let counter = 1;
    while (slugExists) {
      finalSlug = `${baseSlug}-${counter}`;
      slugExists = await Product.findOne({ slug: finalSlug });
      counter++;
    }

    // Auto-generate or validate SKU
    let finalSku = sku ? sku.trim().toUpperCase() : `SKU-${Date.now().toString(36).toUpperCase()}`;
    const skuExists = await Product.findOne({ sku: finalSku });
    if (skuExists) {
      const err = new Error(`SKU '${finalSku}' is already in use`);
      err.statusCode = 400;
      throw err;
    }

    // Process images display order and primary status
    const formattedImages = images.map((img, index) => ({
      ...img,
      displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
      isPrimary: img.isPrimary || (index === 0 && !images.some((i) => i.isPrimary)),
    }));

    // Normalize physical weight and dimensions for Shiprocket courier calculation
    const normalizedWeight = normalizeWeightToKg(weightValue, weightUnit);
    const normalizedDimensions = normalizeDimensions(dimensions);

    const formattedVariants = (variants || []).map((v) => ({
      ...v,
      weightValue: v.weightValue !== undefined && v.weightValue !== "" ? Number(v.weightValue) : null,
      weightUnit: v.weightUnit || weightUnit || "g",
      weight: v.weightValue
        ? normalizeWeightToKg(v.weightValue, v.weightUnit || weightUnit)
        : normalizedWeight,
    }));

    const product = new Product({
      name: name.trim(),
      slug: finalSlug,
      sku: finalSku,
      brand: brand ? brand.trim() : "Brundavanam",
      category,
      subcategory: subcategory || null,
      shortDescription,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : 0,
      stock: stock !== undefined ? Number(stock) : 0,
      weight: normalizedWeight,
      weightValue: weightValue !== undefined && weightValue !== "" ? Number(weightValue) : (weightUnit === "kg" ? normalizedWeight : normalizedWeight * 1000),
      weightUnit: weightUnit || "g",
      dimensions: normalizedDimensions,
      images: formattedImages,
      files,
      variants: formattedVariants,
      attributes,
      tags,
      isFeatured: Boolean(isFeatured),
      isActive: Boolean(isActive),
      seoTitle: seoTitle || name,
      seoDescription: seoDescription || shortDescription || "",
      createdBy: req.user?._id || null,
      createdByName:
        (req.user?.name && req.user.name !== "Valued Customer" ? req.user.name : null) ||
        (req.user?.phone ? `+91 ${req.user.phone}` : (req.user?.email || "Admin")),
      updatedBy: req.user?._id || null,
      updatedByName:
        (req.user?.name && req.user.name !== "Valued Customer" ? req.user.name : null) ||
        (req.user?.phone ? `+91 ${req.user.phone}` : (req.user?.email || "Admin")),
    });

    await product.save();
    invalidateCache("gql:*").catch(() => {});
    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: populatedProduct,
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/products/:id
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    const {
      name,
      slug: customSlug,
      sku,
      brand,
      category,
      subcategory,
      shortDescription,
      description,
      price,
      discountPrice,
      stock,
      images = [],
      files = [],
      variants = [],
      attributes = [],
      tags = [],
      isFeatured,
      isActive,
      seoTitle,
      seoDescription,
      weightValue,
      weightUnit,
      dimensions,
    } = req.body;

    // Detect deleted GCS images to prevent orphan files in storage
    const currentStoragePaths = existingProduct.images
      .concat(existingProduct.files)
      .map((f) => f.storagePath)
      .filter(Boolean);

    const updatedStoragePaths = images
      .concat(files)
      .map((f) => f.storagePath)
      .filter(Boolean);

    const removedStoragePaths = currentStoragePaths.filter(
      (path) => !updatedStoragePaths.includes(path)
    );

    // Asynchronously delete removed files from GCS bucket
    if (removedStoragePaths.length > 0) {
      gcsService.deleteMultipleFiles(removedStoragePaths).catch((e) => {
        console.error("GCS deletion warning during product update:", e);
      });
    }

    // Update slug if requested or name changed
    if (name && name.trim() !== existingProduct.name) {
      let baseSlug = customSlug ? createSlug(customSlug) : createSlug(name);
      let finalSlug = baseSlug;
      let slugExists = await Product.findOne({ slug: finalSlug, _id: { $ne: id } });
      let counter = 1;
      while (slugExists) {
        finalSlug = `${baseSlug}-${counter}`;
        slugExists = await Product.findOne({ slug: finalSlug, _id: { $ne: id } });
        counter++;
      }
      existingProduct.slug = finalSlug;
      existingProduct.name = name.trim();
    }

    if (sku && sku.trim().toUpperCase() !== existingProduct.sku) {
      const newSku = sku.trim().toUpperCase();
      const skuExists = await Product.findOne({ sku: newSku, _id: { $ne: id } });
      if (skuExists) {
        const err = new Error(`SKU '${newSku}' is already in use`);
        err.statusCode = 400;
        throw err;
      }
      existingProduct.sku = newSku;
    }

    if (brand !== undefined) existingProduct.brand = brand;
    if (category !== undefined) existingProduct.category = category;
    if (subcategory !== undefined) existingProduct.subcategory = subcategory || null;
    if (shortDescription !== undefined) existingProduct.shortDescription = shortDescription;
    if (description !== undefined) existingProduct.description = description;
    if (price !== undefined) existingProduct.price = Number(price);
    if (discountPrice !== undefined) existingProduct.discountPrice = Number(discountPrice);
    if (stock !== undefined) existingProduct.stock = Number(stock);

    // Format images ordering & primary indicator
    const formattedImages = images.map((img, index) => ({
      ...img,
      displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
      isPrimary: img.isPrimary || (index === 0 && !images.some((i) => i.isPrimary)),
    }));

    existingProduct.images = formattedImages;
    existingProduct.files = files;

    const activeUnit = weightUnit || existingProduct.weightUnit || "g";
    if (weightValue !== undefined && weightValue !== "") {
      existingProduct.weightValue = Number(weightValue);
      existingProduct.weightUnit = activeUnit;
      existingProduct.weight = normalizeWeightToKg(weightValue, activeUnit);
    } else if (weightUnit !== undefined && existingProduct.weightValue) {
      existingProduct.weightUnit = weightUnit;
      existingProduct.weight = normalizeWeightToKg(existingProduct.weightValue, weightUnit);
    }

    if (dimensions !== undefined) {
      existingProduct.dimensions = normalizeDimensions(dimensions);
    }

    if (variants !== undefined) {
      existingProduct.variants = (variants || []).map((v) => ({
        ...v,
        weightValue: v.weightValue !== undefined && v.weightValue !== "" ? Number(v.weightValue) : null,
        weightUnit: v.weightUnit || activeUnit,
        weight: v.weightValue
          ? normalizeWeightToKg(v.weightValue, v.weightUnit || activeUnit)
          : (existingProduct.weight || 0.1),
      }));
    }

    existingProduct.attributes = attributes;
    existingProduct.tags = tags;
    if (isFeatured !== undefined) existingProduct.isFeatured = Boolean(isFeatured);
    if (isActive !== undefined) existingProduct.isActive = Boolean(isActive);
    if (seoTitle !== undefined) existingProduct.seoTitle = seoTitle;
    if (seoDescription !== undefined) existingProduct.seoDescription = seoDescription;

    existingProduct.updatedBy = req.user?._id || null;
    existingProduct.updatedByName =
      (req.user?.name && req.user.name !== "Valued Customer" ? req.user.name : null) ||
      (req.user?.phone ? `+91 ${req.user.phone}` : (req.user?.email || "Admin"));

    await existingProduct.save();
    invalidateCache("gql:*").catch(() => {});

    const updatedProduct = await Product.findById(id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug");

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/products/:id
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // 'true' for permanent delete

    const product = await Product.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    if (hardDelete === "true") {
      // Collect all stored file paths in GCS
      const storagePaths = product.images
        .concat(product.files)
        .map((f) => f.storagePath)
        .filter(Boolean);

      // Remove from GCS bucket
      if (storagePaths.length > 0) {
        await gcsService.deleteMultipleFiles(storagePaths);
      }

      await Product.findByIdAndDelete(id);
      invalidateCache("gql:*").catch(() => {});

      return res.json({
        success: true,
        message: "Product permanently deleted from database and storage",
      });
    } else {
      // Recommended Soft Delete
      product.isDeleted = true;
      product.deletedAt = new Date();
      product.isActive = false;
      await product.save();
      invalidateCache("gql:*").catch(() => {});

      return res.json({
        success: true,
        message: "Product soft deleted. Historical order records preserved.",
        data: product,
      });
    }
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/products/:id/stock
async function updateStock(req, res, next) {
  try {
    const { id } = req.params;
    const { stock, variants } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    // Update base stock if provided
    if (stock !== undefined && Number(stock) >= 0) {
      product.stock = Number(stock);
    }

    // Update individual variant stocks if provided
    // Expects: variants = [{ _id: "variantId", stock: 20 }, ...]
    if (Array.isArray(variants) && variants.length > 0) {
      for (const vUpdate of variants) {
        const variant = product.variants.id(vUpdate._id);
        if (variant && Number(vUpdate.stock) >= 0) {
          variant.stock = Number(vUpdate.stock);
        }
      }
    }

    await product.save();
    invalidateCache("gql:*").catch(() => {});
    await product.populate("category", "name slug");

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
}


// POST /api/admin/products/media/upload-url
async function getSignedUploadUrl(req, res, next) {
  try {
    const { fileName, fileType = "image", mimeType, size } = req.body;

    if (!fileName || !mimeType || !size) {
      const err = new Error("fileName, mimeType, and size are required");
      err.statusCode = 400;
      throw err;
    }

    const signedData = await gcsService.generateSignedUploadUrl({
      fileName,
      fileType,
      mimeType,
      size: Number(size),
    });

    res.json({
      success: true,
      data: signedData,
    });
  } catch (err) {
    next(err);
  }
}

async function uploadDirectMedia(req, res, next) {
  try {
    const { fileName, mimeType, base64, fileType = "image" } = req.body;

    if (!fileName || !mimeType || !base64) {
      const err = new Error("fileName, mimeType, and base64 data are required");
      err.statusCode = 400;
      throw err;
    }

    // Strip base64 header if present (e.g. data:image/png;base64,...)
    const base64Data = base64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const uploadedData = await gcsService.uploadFileDirect({
      buffer,
      fileName,
      mimeType,
      fileType,
    });

    res.json({
      success: true,
      data: uploadedData,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getSignedUploadUrl,
  uploadDirectMedia,
};

