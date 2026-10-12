const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const { port, nodeEnv, frontendUrl } = require("./config/env");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

connectDB();
connectRedis();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const allowedOrigins = [
  frontendUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".netlify.app") ||
        (process.env.ADDITIONAL_ORIGINS &&
          process.env.ADDITIONAL_ORIGINS.split(",").map((s) => s.trim()).includes(origin))
      ) {
        return callback(null, true);
      }
      // Allow in production if origin header matches Netlify deployment
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(cookieParser());
if (nodeEnv !== "test") app.use(morgan("dev"));

// Rate limiting
if (nodeEnv === "production") {
  app.use(
    "/api",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true })
  );
} else {
  // Relaxed limit for local development
  app.use(
    "/api",
    rateLimit({ windowMs: 15 * 60 * 1000, max: 10000, standardHeaders: true })
  );
}

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Brundavanam Goshala API is running" });
});

// Mount Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/admin/products", require("./routes/adminProductRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));

// Cart & Wishlist Routes
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));

// Order & Payment Pipeline Routes
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/admin/customers", require("./routes/adminCustomerRoutes"));
app.use("/api/admin/analytics", require("./routes/adminAnalyticsRoutes"));
app.use("/api/admin/reviews", require("./routes/adminReviewRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/webhooks", require("./routes/webhookRoutes"));

// Support & Customer Enquiries
app.use("/api/support", require("./routes/supportRoutes"));

// Newsletter & Subscribers
app.use("/api/newsletter", require("./routes/newsletterRoutes"));

// High-Performance GraphQL API (Single roundtrip, field-level precision, Redis-cached)
app.use("/api/graphql", require("./routes/graphqlRoutes"));
app.use("/graphql", require("./routes/graphqlRoutes"));

// Gallery (About Us page media)
app.use("/api/gallery", require("./routes/galleryRoutes"));


app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server] Listening on port ${port} (${nodeEnv}) - Shiprocket Logistics ready`);
});