const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    isApproved: {
      type: Boolean,
      default: true, // Defaulting to true for simplicity, admin can toggle
    },
  },
  { timestamps: true }
);

// Prevent user from reviewing the same product twice
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to calculate average rating for a product
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, isApproved: true },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
      "rating.count": stats[0].nRating,
    });
  } else {
    await mongoose.model("Product").findByIdAndUpdate(productId, {
      "rating.average": 0,
      "rating.count": 0,
    });
  }
};

// Call calcAverageRatings after saving a review
reviewSchema.post("save", function () {
  this.constructor.calcAverageRatings(this.product);
});

// Call calcAverageRatings after removing/updating a review
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

module.exports = mongoose.model("Review", reviewSchema);
