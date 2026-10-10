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

    // Sync User schema indexes to ensure email partialFilterExpression is active
    const User = require("../models/User");
    User.syncIndexes().catch((e) => {
      console.warn("[db] User index sync notice:", e.message);
    });

    // Auto-populate default weight & dimensions on products missing them
    const Product = require("../models/Product");
    Product.find({ $or: [{ weight: { $exists: false } }, { weight: null }, { weightValue: { $exists: false } }] })
      .then(async (products) => {
        for (const p of products) {
          let weightVal = 50;
          let unit = "g";
          let weightKg = 0.05;
          let dims = { length: 10, breadth: 10, height: 6 };

          if (/50\s*g/i.test(p.name) || /50\s*g/i.test(p.sku)) {
            weightVal = 50; unit = "g"; weightKg = 0.05; dims = { length: 8, breadth: 8, height: 5 };
          } else if (/15\s*ml/i.test(p.name) || /15\s*ml/i.test(p.sku)) {
            weightVal = 15; unit = "ml"; weightKg = 0.015; dims = { length: 8, breadth: 5, height: 4 };
          } else if (/8\s*ml/i.test(p.name) || /8\s*ml/i.test(p.sku)) {
            weightVal = 8; unit = "ml"; weightKg = 0.008; dims = { length: 8, breadth: 5, height: 4 };
          } else if (/500\s*ml/i.test(p.name)) {
            weightVal = 500; unit = "ml"; weightKg = 0.5; dims = { length: 14, breadth: 10, height: 10 };
          } else if (/1\s*L/i.test(p.name) || /1\s*kg/i.test(p.name)) {
            weightVal = 1; unit = "kg"; weightKg = 1.0; dims = { length: 18, breadth: 14, height: 12 };
          }

          p.weightValue = weightVal;
          p.weightUnit = unit;
          p.weight = weightKg;
          p.dimensions = dims;
          await p.save();
        }
      })
      .catch((e) => {
        console.warn("[db] Product weight sync notice:", e.message);
      });
  } catch (err) {
    console.error("[db] MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
