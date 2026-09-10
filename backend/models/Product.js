const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // e.g. "500ml", "1L"
    price: { type: Number, required: true },
    compareAtPrice: Number,
    stock: { type: Number, default: 0 },
    sku: String,
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    shortDescription: String,
    description: String,
    ingredients: String,
    usageInstructions: String,
    images: [{ type: String }],
    variants: [variantSchema],
    basePrice: { type: Number, required: true },
    compareAtPrice: Number,
    stock: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

productSchema.index({ name: "text", shortDescription: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
