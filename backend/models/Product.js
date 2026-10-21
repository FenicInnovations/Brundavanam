const mongoose = require("mongoose");

// Embedded schema for Google Cloud Storage file references
const gcsFileSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["image", "pdf", "video", "document"],
      default: "image",
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    bucketName: { type: String, required: true },
    storagePath: { type: String, required: true },
    publicUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    isPrimary: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
  },
  { _id: true }
);

// Embedded schema for Variants (e.g. 500ml, 1L, Pack of 2)
const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    sku: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    weight: { type: Number, default: null, min: 0 }, // Normalized weight in kg
    weightValue: { type: Number, default: null, min: 0 },
    weightUnit: { type: String, enum: ["g", "kg", "ml", "l"], default: "g" },
    attributes: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
  },
  { _id: true }
);

// Flexible attribute schema for key-value pairs (e.g. Origin: "Desi Gir Cow", Processing: "Bilona Method")
const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    brand: { type: String, default: "Brundavanam", trim: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    shortDescription: { type: String, trim: true },
    description: { type: String, trim: true },

    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },

    // Physical shipping attributes for accurate Shiprocket logistics
    weight: { type: Number, default: 0.1, min: 0 }, // Normalized weight in kg (default 100g)
    weightValue: { type: Number, default: 100, min: 0 }, // Admin entered value (e.g., 10, 50, 500, 1)
    weightUnit: { type: String, enum: ["g", "kg", "ml", "l"], default: "g" },
    dimensions: {
      length: { type: Number, default: 10, min: 0 }, // in cm
      breadth: { type: Number, default: 10, min: 0 }, // in cm
      height: { type: Number, default: 10, min: 0 }, // in cm
    },

    images: [gcsFileSchema],
    files: [gcsFileSchema], // PDF manuals, specifications, lab reports

    variants: [variantSchema],
    attributes: [attributeSchema],
    tags: [{ type: String, trim: true }],

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

    seoTitle: { type: String, trim: true },
    seoDescription: { type: String, trim: true },

    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },

    // Admin audit tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdByName: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedByName: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes for fast searching, filtering, and sorting
productSchema.index({ name: "text", shortDescription: "text", description: "text", tags: "text", brand: "text", sku: "text" });
productSchema.index({ category: 1, isActive: 1, isDeleted: 1 });
productSchema.index({ subcategory: 1, isDeleted: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isFeatured: 1, isDeleted: 1 });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
