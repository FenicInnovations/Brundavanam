
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
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

connectDB();

app.use(helmet());
app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
if (nodeEnv !== "test") app.use(morgan("dev"));

// General API rate limit — tighter limits go on auth routes specifically
// once they exist (Stage 3).
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true })
);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Brundavanam Goshala API is running" });
});

// Stage 3 onward: mount real routers here, e.g.
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/products", require("./routes/productRoutes"));
// app.use("/api/categories", require("./routes/categoryRoutes"));

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server] Listening on port ${port} (${nodeEnv})`);
});
