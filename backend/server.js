// ==============================
// Core dependencies
// ==============================
const express = require("express");
const { auth, requiresAuth } = require('express-openid-connect');
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
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env', // use env in production!
  baseURL: 'http://localhost:3000',
  clientID: 'Egwj9LGtWJmL7bJDkuWvRgTYv9vbmb4f',
  issuerBaseURL: 'https://dev-ammhzit80o0cjhx5.us.auth0.com'
};

app.use(auth(config));
app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});
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
// Default to a curated list of known safe origins.  Override via a
// comma-separated CORS_ORIGIN env var, or set CORS_ORIGIN=* to allow all
// origins (permissive / local-dev shortcut).
const DEFAULT_ALLOWED_ORIGINS = [
  "https://theresilienceatlas.com",
  "https://resilience-atlas-production-e037.up.railway.app",
  // http is intentional here — localhost is never reached over the public
  // internet, so there is no credential-leakage risk for local development.
  "http://localhost:3000",
];

const corsOriginRaw = process.env.CORS_ORIGIN;
const corsOrigins = !corsOriginRaw
  ? DEFAULT_ALLOWED_ORIGINS
  : corsOriginRaw === "*"
  ? "*"
  : corsOriginRaw.split(",").map((s) => s.trim()).filter(Boolean);

logger.info(
  `✅ CORS allowed origins: ${Array.isArray(corsOrigins) ? corsOrigins.join(", ") : corsOrigins}`
);

app.use(
  cors({
    // Using an origin function (rather than the string "*") ensures that
    // callback(null, true) reflects the actual request origin back to the
    // browser.  This is required for credentials: true to work correctly —
    // browsers reject Access-Control-Allow-Origin: * when credentials are
    // present, but accept a reflected origin value.
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
    credentials: true,
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
    auth0Domain: process.env.AUTH0_DOMAIN || null,
    auth0ClientId: process.env.AUTH0_CLIENT_ID || null,
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
app.use("/api/teams", require("./routes/teams-resources"));
console.log("✅ Mounted route: /api/teams");

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

// ── Auth routes — redirect to Auth0 Universal Login ─────────
// These routes ensure that navigating to /login or /register never
// renders a legacy local form.  When AUTH0_DOMAIN and AUTH0_CLIENT_ID
// are configured the user is sent directly to the Auth0 hosted login
// page; otherwise they are redirected to the homepage as a safe fallback.
//
// redirect_uri is sourced exclusively from environment variables to avoid
// open-redirect vulnerabilities that can arise when request headers are
// used to derive a callback URL.
function buildAuth0AuthorizeUrl(screenHint) {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  // Prefer the explicit override; fall back to APP_URL; never derive from request headers.
  const redirectUri = process.env.AUTH0_REDIRECT_URI || process.env.APP_URL || null;
  if (!domain || !clientId) return null;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri || "",
    scope: "openid profile email",
  });
  if (screenHint) params.set("screen_hint", screenHint);
  return `https://${domain}/authorize?${params.toString()}`;
}

app.get("/login", pageLimiter, (req, res) => {
  const url = buildAuth0AuthorizeUrl(null);
  if (url) return res.redirect(302, url);
  res.redirect("/");
});

app.get("/register", pageLimiter, (req, res) => {
  const url = buildAuth0AuthorizeUrl("signup");
  if (url) return res.redirect(302, url);
  res.redirect("/");
});

// ==============================
// Static Frontend
// ==============================

// Serve the React production build (client/dist) when it has been compiled.
// client/dist takes precedence so the latest frontend build is always used.
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.use(express.static(path.join(__dirname, "../public")));

// SPA fallback — serve the React entry point for any route not handled above.
// Falls back to the legacy public/index.html when the React build is absent
// (e.g. local development before running `npm run build`).
app.get("*", pageLimiter, (req, res) => {
  const reactIndex = path.join(clientDist, "index.html");
  res.sendFile(reactIndex, (err) => {
    if (err) res.sendFile(path.join(__dirname, "../public/index.html"));
  });
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

// PORT is the public-facing port Railway (and Cloudflare) expects the app on.
// Defaults to 3000. Both HTTP and HTTPS servers bind to this port so Cloudflare
// can reach the origin regardless of which SSL mode is active.
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

/* istanbul ignore next */
if (!process.env.JEST_WORKER_ID) {
  const CF_CERT = process.env.CF_ORIGIN_CERT;
  const CF_KEY = process.env.CF_ORIGIN_KEY;

  if (CF_CERT && CF_KEY) {
    // HTTPS mode — bind the main Express app to PORT (default 3000) using the
    // Cloudflare origin certificate.  Cloudflare connects to this origin on
    // port 3000 over TLS (Full SSL mode), so the server must be reachable on
    // that port.
    https
      .createServer({ cert: CF_CERT, key: CF_KEY }, app)
      .listen(PORT, HOST, () => {
        logger.info(`🚀 Server running on https://${HOST}:${PORT} (HTTPS)`);
      });

    // Dedicated plain-HTTP health server on port 3001.
    // Railway's healthcheck probe cannot negotiate TLS, so we expose a
    // minimal HTTP server that only responds to GET /health.  All other
    // traffic continues to flow through the HTTPS server above.
    const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 3001;
    const healthApp = express();
    healthApp.get("/health", (req, res) => {
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
    // HTTP mode — no TLS certificates configured.  This is the correct setup
    // for Cloudflare Flexible SSL, where Cloudflare terminates TLS and
    // connects to the origin over plain HTTP.  Also used for local development.
    http.createServer(app).listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on http://${HOST}:${PORT} (HTTP)`);
    });

    // Dedicated health server on port 3001 — mirrors the HTTPS-mode setup so
    // Railway's healthcheck probe always has a plain-HTTP endpoint regardless
    // of which SSL mode is active.
    const HEALTH_PORT = Number(process.env.HEALTH_PORT) || 3001;
    const healthApp = express();
    healthApp.get("/health", (req, res) => {
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
  }
}

module.exports = app;

