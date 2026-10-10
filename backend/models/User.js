const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Valued Customer", trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    password: { type: String, default: null, select: false },
    phone: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["customer", "admin", "super_admin"],
      default: "customer",
    },
    isAdmin: { type: Boolean, default: false }, // synchronized with role
    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Enforce unique email only when email is an actual string (allows multiple users with no email)
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string" } },
  }
);

userSchema.pre("save", async function hashPasswordAndRole(next) {
  if (this.isModified("role")) {
    this.isAdmin = this.role === "admin" || this.role === "super_admin";
  } else if (this.isModified("isAdmin") && this.isAdmin && this.role === "customer") {
    this.role = "admin";
  }

  if (!this.password || !this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
