// ==============================
// Core dependencies
// ==============================
const express = require("express");
const http = require("http");
const https = require("https");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("crypto");

const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");

// ==============================
// Load environment variables
// ==============================
dotenv.config();

// ==============================
// Internal utilities
// ==============================
const logger = require("./utils/logger");
const { globalErrorHandler } = require("./middleware/errorHandler");
const { sanitiseInput } = require("./middleware/validation");
const sentry = require("./config/sentry");

// ==============================
// Express app
// ==============================
const app = express();
app.use(express.static(path.join(__dirname, "../public")));

// ==============================
// Request timeout — PDF generation can take up to 2 minutes.
// ==============================
const REQUEST_TIMEOUT_MS = 120000; // 2 minutes
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS);
  next();
});

// ==============================
// Request ID — attach a unique ID to every request for tracing.
// ==============================
app.use((req, _res, next) => {
  req.id = `req_${crypto.randomBytes(6).toString("hex")}`;
  next();
});

// Sentry request handler must come before all routes.
app.use(sentry.requestHandler());

// ==============================
// Middleware
// ==============================

// Security headers
app.use(helmet());

// CORS configuration
// Support a comma-separated allowlist in CORS_ORIGIN, e.g.:
//   CORS_ORIGIN=https://www.example.com,https://staging.example.com
// Unset or "*" → allow all origins (permissive default).
const corsOriginRaw = process.env.CORS_ORIGIN || "*";
const corsOrigins =
  corsOriginRaw === "*"
    ? "*"
    : corsOriginRaw.split(",").map((s) => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, Postman, server-to-server) that send no Origin header.
      if (!origin) return callback(null, true);
      // Allow all origins when wildcard is configured.
      if (corsOrigins === "*") return callback(null, true);
      // Allow only the listed origins.
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
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

// Input sanitisation — strip XSS characters from all string fields.
app.use(sanitiseInput);

// ==============================
// MongoDB Connection
// ==============================

let dbStatus = "disconnected";

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      dbStatus = "connected";
      logger.info("✅ MongoDB connected");
    })
    .catch((err) => {
      dbStatus = "error";
      logger.error("❌ MongoDB connection failed", { message: err.message });
    });
} else {
  logger.warn("⚠️ MONGODB_URI not set — database features disabled");
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
app.use("/api/upsell", require("./routes/upsell"));
console.log("✅ Mounted route: /api/upsell");
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
app.use("/api/gamification", require("./routes/gamification"));
console.log("✅ Mounted route: /api/gamification");
app.use("/api/atlas", require("./routes/atlas"));
console.log("✅ Mounted route: /api/atlas");
app.use("/api/history", require("./routes/history"));
console.log("✅ Mounted route: /api/history");
app.use("/api/share", require("./routes/share"));
app.use("/api/comparisons", require("./routes/comparisons"));
console.log("✅ Mounted route: /api/share");
app.use("/admin", require("./routes/admin"));
console.log("✅ Mounted route: /admin");
app.use("/api/resources", require("./routes/resources"));
console.log("✅ Mounted route: /api/resources");

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

// Sentry error handler must come AFTER all routes but BEFORE the custom handler.
app.use(sentry.errorHandler());

app.use(globalErrorHandler);

// ==============================
// Start Server
// ==============================

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

/* istanbul ignore next */
if (!process.env.JEST_WORKER_ID) {
  const CF_CERT = process.env.CF_ORIGIN_CERT;
  const CF_KEY = process.env.CF_ORIGIN_KEY;

  if (CF_CERT && CF_KEY) {
    // HTTPS mode — use the Cloudflare origin certificate so that Cloudflare's
    // Full SSL mode can establish a trusted TLS connection to this origin server
    // without triggering a redirect loop.
    https
      .createServer({ cert: CF_CERT, key: CF_KEY }, app)
      .listen(PORT, HOST, () => {
        logger.info(`🚀 Server running on https://${HOST}:${PORT} (HTTPS)`);
      });

    // Dedicated HTTP health server — Railway's healthcheck cannot validate
    // self-signed / origin TLS certificates, so we expose /health over plain
    // HTTP on a separate port.  All other traffic remains HTTPS-only.
    const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 3001;
    const healthApp = express();
    healthApp.get("/health", (_req, res) => {
      res.status(200).json({
        status: "OK",
        service: "Resilience Atlas API",
        database: dbStatus,
        timestamp: new Date().toISOString(),
      });
    });
    http.createServer(healthApp).listen(HEALTH_PORT, HOST, () => {
      logger.info(
        `🩺 Health server running on http://${HOST}:${HEALTH_PORT} (HTTP)`
      );
    });
  } else {
    // HTTP fallback for local development / environments without TLS certs.
    logger.warn(
      "⚠️  CF_ORIGIN_CERT / CF_ORIGIN_KEY not set — falling back to HTTP"
    );
    app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT} (HTTP)`);
    });
  }
}

module.exports = app;

