// ==============================
// Core dependencies
// ==============================
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

// ==============================
// Load environment variables
// ==============================
dotenv.config();

// ==============================
// Express app
// ==============================
const app = express();

// ==============================
// Middleware
// ==============================

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Gzip compression
app.use(compression());

// Body parsing with limits
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ==============================
// MongoDB Connection
// ==============================

let dbStatus = "disconnected";

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      dbStatus = "connected";
      console.log("✅ MongoDB connected");
    })
    .catch((err) => {
      dbStatus = "error";
      console.error("❌ MongoDB connection failed:", err.message);
    });
} else {
  console.warn("⚠️ MONGODB_URI not set — database features disabled");
}

// ==============================
// Root API endpoint
// ==============================

app.get("/", (req, res, next) => {
  // Serve JSON welcome message for programmatic clients (e.g., API tests).
  // Static file serving handles browsers requesting the HTML landing page.
  if (!req.headers.accept || !req.headers.accept.includes("text/html")) {
    return res.json({ message: "Welcome to The Resilience Atlas API", version: "2.0.0" });
  }
  next();
});

// ==============================
// Health Check
// ==============================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Resilience Atlas API",
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ==============================
// Public Config (safe frontend values)
// ==============================

app.get("/config", (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
  });
});

// ==============================
// API ROUTES
// ==============================

app.use("/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/affiliates", require("./routes/affiliates"));
app.use("/api/stripe", require("./routes/stripe"));
app.use("/api/atlas", require("./routes/atlas"));
app.use("/api/share", require("./routes/share"));

// ==============================
// Static Frontend
// ==============================

app.use(express.static(path.join(__dirname, "../public")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ==============================
// Global Error Handler
// ==============================

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  const isDev = (process.env.NODE_ENV || "development") === "development";

  res.status(err.status || 500).json({
    error: isDev ? err.message : "Internal server error",
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  });
});

// ==============================
// Start Server
// ==============================

const PORT = process.env.PORT || 3000;

if (!process.env.JEST_WORKER_ID) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;

