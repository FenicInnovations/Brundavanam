require("dotenv").config();

const required = ["MONGODB_URI", "JWT_SECRET"];

function assertEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV !== "test") {
    console.warn(
      `[env] Missing recommended variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill these in before running for real."
    );
  }
}

assertEnv();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI||'mongodb+srv://fenicinnovations_db_user:tw3A8WihAA3UTgTz@cluster0.ofotmhj.mongodb.net/?appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
