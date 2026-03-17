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
app.use(express.static(path.join(__dirname, "../public")));
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

// Raw body for Stripe webhook signature verification — must be registered
// BEFORE the global express.json() parser, which would otherwise consume the
// readable stream and make signature verification impossible.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

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
console.log("✅ Mounted route: /auth");
app.use("/api/auth", require("./routes/auth"));
console.log("✅ Mounted route: /api/auth");
app.use("/api/quiz", require("./routes/quiz"));
console.log("✅ Mounted route: /api/quiz");
app.use("/api/affiliates", require("./routes/affiliates"));
console.log("✅ Mounted route: /api/affiliates");
app.use("/api/stripe", require("./routes/stripe"));
console.log("✅ Mounted route: /api/stripe");
app.use("/api/payments", require("./routes/payments"));
console.log("✅ Mounted route: /api/payments");
app.use("/api/report", require("./routes/report"));
console.log("✅ Mounted route: /api/report");
app.use("/api/evidence-practices", require("./routes/evidence-practices"));
console.log("✅ Mounted route: /api/evidence-practices");
app.use("/api/org", require("./routes/organization"));
console.log("✅ Mounted route: /api/org");
app.use("/api/org/:organizationId/leadership-report", require("./routes/leadership-report"));
console.log("✅ Mounted route: /api/org/:organizationId/leadership-report");
app.use("/api/insights", require("./routes/insights"));
console.log("✅ Mounted route: /api/insights");
app.use("/api/dashboard", require("./routes/dashboard"));
console.log("✅ Mounted route: /api/dashboard");
app.use("/api/organizations", require("./routes/organizations"));
console.log("✅ Mounted route: /api/organizations");
app.use("/api/orgs-advanced", require("./routes/org-advanced"));
console.log("✅ Mounted route: /api/orgs-advanced");
app.use("/api/team-analytics", require("./routes/team-analytics"));
console.log("✅ Mounted route: /api/team-analytics");
app.use("/api/growth", require("./routes/growth"));
console.log("✅ Mounted route: /api/growth");
app.use("/api/atlas", require("./routes/atlas"));
console.log("✅ Mounted route: /api/atlas");
app.use("/api/share", require("./routes/share"));
console.log("✅ Mounted route: /api/share");
app.use("/admin", require("./routes/admin"));
console.log("✅ Mounted route: /admin");

// ==============================
// Root API info
// ==============================

// Rate limiter for HTML page routes (prevents scraping / DoS)
const rateLimit = require("express-rate-limit");
const pageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please try again later.",
});

app.get("/", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ── Insight article routes ──────────────────────────────────
app.get("/insights", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/insights.html"));
});
app.get("/insights/six-resilience-dimensions", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/insights/six-resilience-dimensions.html"));
});
app.get("/insights/resilience-under-pressure", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/insights/resilience-under-pressure.html"));
});
app.get("/insights/team-resilience", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/insights/team-resilience.html"));
});

// ── Team / B2B page ─────────────────────────────────────────
app.get("/team", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/team.html"));
});

// ── Admin leads page ────────────────────────────────────────
app.get("/admin/leads/ui", pageLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin/leads.html"));
});

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

/* istanbul ignore next */
if (!process.env.JEST_WORKER_ID) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;

