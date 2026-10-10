const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const { mongodbUri } = require("../config/env");

async function fixIndex() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongodbUri);
  const collection = mongoose.connection.db.collection("users");

  console.log("1. Checking existing indexes...");
  const existingIndexes = await collection.indexes();
  const hasEmailIndex = existingIndexes.some((idx) => idx.name === "email_1");

  if (hasEmailIndex) {
    console.log("2. Dropping old email_1 index...");
    await collection.dropIndex("email_1");
    console.log("Old email_1 index dropped successfully.");
  }

  console.log("3. Unsetting email: null on existing user records...");
  const unsetResult = await collection.updateMany(
    { email: null },
    { $unset: { email: "" } }
  );
  console.log("Unset count:", unsetResult.modifiedCount);

  console.log("4. Creating new partialFilterExpression index for email...");
  await collection.createIndex(
    { email: 1 },
    {
      unique: true,
      partialFilterExpression: { email: { $type: "string" } },
      name: "email_1",
    }
  );
  console.log("New partial unique index created successfully.");

  const updatedIndexes = await collection.indexes();
  console.log("Updated indexes:", JSON.stringify(updatedIndexes, null, 2));

  process.exit(0);
}

fixIndex().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
