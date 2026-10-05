const Product = require("../models/Product");

// GET /api/products
async function getPublicProducts(req, res, next) {
  try {
    const { category, search, featured, limit = 50 } = req.query;

    const filter = { isActive: true, isDeleted: false };

    if (category) {
      filter.category = category;
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { tags: regex }, { shortDescription: regex }];
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:slugOrId
async function getPublicProductBySlug(req, res, next) {
  try {
    const { slugOrId } = req.params;

    let product = await Product.findOne({
      slug: slugOrId,
      isActive: true,
      isDeleted: false,
    })
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .lean();

    if (!product && slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findOne({
        _id: slugOrId,
        isActive: true,
        isDeleted: false,
      })
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .lean();
    }

    if (!product) {
      const err = new Error("Product not found");
      err.statusCode = 404;
      throw err;
    }

    // Get related products in same category
    const related = await Product.find({
      category: product.category?._id || product.category,
      _id: { $ne: product._id },
      isActive: true,
      isDeleted: false,
    })
      .populate("category", "name slug")
      .limit(4)
      .lean();

    res.json({
      success: true,
      data: product,
      related,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/media/file/*
async function streamMediaFile(req, res) {
  try {
    const storagePath = req.params[0] || req.params.path;
    if (!storagePath) {
      return res.status(400).send("Storage path is required");
    }

    const { getStorageClient } = require("../services/gcsService");
    const { gcs: gcsConfig } = require("../config/env");
    const bucketName = (gcsConfig.bucketName || process.env.GCS_BUCKET_NAME || "radhakrishnan").trim();

    const storage = getStorageClient();
    if (!storage) {
      return res.status(500).send("GCS Storage client not initialized");
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(storagePath);

    const [exists] = await file.exists();
    if (!exists) {
      console.warn(`[mediaStream] File does not exist in bucket '${bucketName}': ${storagePath}`);
      return res.status(404).send("File not found");
    }

    const [metadata] = await file.getMetadata();
    res.setHeader("Content-Type", metadata.contentType || "image/jpeg");
    if (metadata.size) {
      res.setHeader("Content-Length", metadata.size);
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const readStream = file.createReadStream();
    readStream.on("error", (streamErr) => {
      console.error(`[mediaStream] Stream error for ${storagePath}:`, streamErr.message);
      if (!res.headersSent) {
        res.status(500).send("Error streaming file");
      }
    });

    readStream.pipe(res);
  } catch (err) {
    console.error("[mediaStream] Failed to stream file:", err);
    if (!res.headersSent) {
      res.status(500).send("Error streaming media file");
    }
  }
}

module.exports = { getPublicProducts, getPublicProductBySlug, streamMediaFile };
