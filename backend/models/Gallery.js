const mongoose = require("mongoose");

const galleryItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["image", "video", "youtube", "external_video"],
      required: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // For images: GCS URL or direct URL
    url: {
      type: String,
      required: true,
      trim: true,
    },
    // For videos hosted on GCS - optional thumbnail
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    // YouTube video ID extracted from URL (for type: youtube)
    youtubeId: {
      type: String,
      trim: true,
    },
    // Sort order for display
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Whether to show on the About Us page
    isPublished: {
      type: Boolean,
      default: true,
    },
    // Admin-entered tags for filtering
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
  }
);

// Extract YouTube ID from URL before saving
galleryItemSchema.pre("save", function (next) {
  if (this.type === "youtube" && this.url) {
    const match = this.url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (match) {
      this.youtubeId = match[1];
      if (!this.thumbnailUrl) {
        this.thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }
  }
  next();
});

module.exports = mongoose.model("Gallery", galleryItemSchema);
