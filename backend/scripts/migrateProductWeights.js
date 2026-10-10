const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { mongodbUri } = require("../config/env");
const Product = require("../models/Product");

async function migrate() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongodbUri);
    console.log("MongoDB Connected!");

    const products = await Product.find({});
    console.log(`Found ${products.length} products to check...`);

    for (const prod of products) {
      let weightVal = prod.weightValue;
      let unit = prod.weightUnit || "g";
      let weightKg = prod.weight;
      let dims = prod.dimensions || { length: 10, breadth: 10, height: 10 };

      // Parse from title / SKU if not set
      if (!weightVal || weightVal === 100) {
        if (/50\s*g/i.test(prod.name) || /50\s*g/i.test(prod.sku)) {
          weightVal = 50;
          unit = "g";
          weightKg = 0.05;
          dims = { length: 8, breadth: 8, height: 5 };
        } else if (/15\s*ml/i.test(prod.name) || /15\s*ml/i.test(prod.sku)) {
          weightVal = 15;
          unit = "ml";
          weightKg = 0.015;
          dims = { length: 8, breadth: 5, height: 4 };
        } else if (/8\s*ml/i.test(prod.name) || /8\s*ml/i.test(prod.sku)) {
          weightVal = 8;
          unit = "ml";
          weightKg = 0.008;
          dims = { length: 8, breadth: 5, height: 4 };
        } else if (/500\s*ml/i.test(prod.name)) {
          weightVal = 500;
          unit = "ml";
          weightKg = 0.5;
          dims = { length: 14, breadth: 10, height: 10 };
        } else if (/1\s*L/i.test(prod.name) || /1\s*kg/i.test(prod.name)) {
          weightVal = 1;
          unit = "kg";
          weightKg = 1.0;
          dims = { length: 18, breadth: 14, height: 12 };
        } else {
          weightVal = 50;
          unit = "g";
          weightKg = 0.05;
          dims = { length: 10, breadth: 10, height: 6 };
        }
      }

      prod.weightValue = weightVal;
      prod.weightUnit = unit;
      prod.weight = weightKg || (unit === "kg" ? weightVal : weightVal / 1000);
      prod.dimensions = dims;

      await prod.save();
      console.log(`Updated product "${prod.name}": ${prod.weightValue}${prod.weightUnit} (${prod.weight} kg), dims: ${dims.length}x${dims.breadth}x${dims.height} cm`);
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
