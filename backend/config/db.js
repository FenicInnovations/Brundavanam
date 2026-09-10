const mongoose = require("mongoose");
const { mongodbUri } = require("./env");

async function connectDB() {
  if (!mongodbUri) {
    console.error("[db] MONGODB_URI is not set — see backend/.env.example");
    return;
  }

  try {
    await mongoose.connect(mongodbUri);
    console.log("[db] MongoDB connected");
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
