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
// app.use(express.static(path.join(__dirname, "../public"))); // Removed: prevents stale public files from shadowing the React build

// ==============================
// express-openid-connect (server-side OIDC session)
// ==============================
// Only initialise the server-side OIDC middleware when the required
// environment variables are present.  When the variables are absent the
// middleware would fall back to hardcoded placeholder values, producing a
// baseURL/clientID mismatch that can intercept or corrupt the SPA auth
// callback and cause the React results page to hang on "Loading…".
const oidcAuth0Domain   = process.env.AUTH0_DOMAIN;
const oidcAuth0ClientId = process.env.AUTH0_CLIENT_ID;
const oidcSecret        = process.env.AUTH0_SECRET;
const oidcBaseURL       = process.env.BASE_URL || 'http://localhost:3000';

let requiresAuth; // may remain undefined if OIDC middleware is not mounted

if (oidcAuth0Domain && oidcAuth0ClientId && oidcSecret) {
  const { auth: oidcAuth, requiresAuth: _requiresAuth } = require('express-openid-connect');
  requiresAuth = _requiresAuth;
  const oidcConfig = {
    authRequired: false,
    auth0Logout: true,
    secret: oidcSecret,
    baseURL: oidcBaseURL,
    clientID: oidcAuth0ClientId,
    issuerBaseURL: `https://${oidcAuth0Domain}`,
  };
  app.use(oidcAuth(oidcConfig));
} else {
  logger.warn(
    '⚠️  express-openid-connect NOT mounted — AUTH0_DOMAIN, AUTH0_CLIENT_ID, ' +
    'or AUTH0_SECRET missing.  Set all three to enable server-side OIDC sessions.'
  );
}


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

// Security headers — helmet sets sensible defaults for all headers.
// The Content Security Policy is explicitly configured to allow Auth0 and
// Stripe resources that are required for authentication and payments, while
// keeping everything else locked down to 'self'.
//
// Auth0 domain is read from the AUTH0_DOMAIN environment variable so the
// same server code works across dev, staging and production environments
// without changes.  The hardcoded value is kept as a safe fallback for the
// current dev tenant.
const auth0Domain = process.env.AUTH0_DOMAIN
  ? `https://${process.env.AUTH0_DOMAIN}`
  : "https://dev-ammhzit80o0cjhx5.us.auth0.com";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Default: only allow resources from our own origin.
        defaultSrc: ["'self'"],
        // Scripts: allow Stripe JS SDK and Auth0 SPA JS SDK loaded from CDN.
        // quiz.html loads auth0-spa-js directly from cdn.auth0.com.
        // 'unsafe-inline' is required by Stripe and Auth0 libraries as well as
        // any inline event handlers in the frontend; without it the browser
        // blocks their scripts and the payment/login flows never complete.
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://js.stripe.com",
          "https://cdn.auth0.com",
        ],
        // Styles: allow self and inline styles (used by React, chart libraries,
        // and certain Auth0 components).  cdn.auth0.com may serve style bundles
        // for the Universal Login widget / Lock.
        // fonts.googleapis.com is required for the Google Fonts stylesheet.
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.auth0.com",
          "https://fonts.googleapis.com",
        ],
        // Network requests allowed from the browser:
        //   - Auth0 tenant: required for token exchange and user-info calls
        //     during the OAuth/OIDC login flow.
        //   - https://cdn.auth0.com: Auth0 CDN for SPA JS and management API.
        //   - https://js.stripe.com: required for Stripe Elements iframe
        //     communication.
        //   - https://api.stripe.com: required for card-element payment
        //     intent confirmations and other Stripe API calls made from the
        //     browser.
        connectSrc: [
          "'self'",
          auth0Domain,              // Auth0 OAuth/OIDC endpoints
          "https://cdn.auth0.com",  // Auth0 CDN
          "https://js.stripe.com",  // Stripe Elements iframe
          "https://api.stripe.com", // Stripe API calls from the browser
        ],
        // Frames: Stripe embeds its payment UI inside cross-origin iframes.
        // Auth0 Universal Login also uses a cross-origin popup/frame for
        // the login and registration flow.
        frameSrc: [
          "'self'",
          "https://js.stripe.com",
          auth0Domain,
        ],
        // Images: allow self, inline data URIs (charts), Gravatar (user avatars),
        // and Auth0 CDN (profile pictures / Lock widget assets).
        imgSrc: [
          "'self'",
          "data:",
          "https://www.gravatar.com",
          "https://s.gravatar.com",
          "https://cdn.auth0.com",
        ],
        // Fonts: allow self, inline data URIs (icon fonts embedded as data URLs),
        // and Google Fonts CDN for webfont delivery.
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      },
    },
  })
);

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
// Static Frontend
// ==============================

// Serve the React production build (client/dist).
// Must come before API routes so asset requests are handled directly
// without falling through to the SPA catch-all.
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));

// Serve brand assets (SVG icons, favicon, etc.) at /brand/*.
// The public HTML pages reference /brand/symbol/web/favicon.svg and other
// brand resources, so this directory must be exposed as a static route.
app.use("/brand", express.static(path.join(__dirname, "../brand")));

// Redirect the browser's automatic /favicon.ico request to the SVG favicon
// so that the browser tab icon is shown and no 404 is logged.
app.get("/favicon.ico", (req, res) => {
  res.redirect(301, "/brand/symbol/web/favicon.svg");
});

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
    auth0Domain:    process.env.AUTH0_DOMAIN    || null,
    auth0ClientId:  process.env.AUTH0_CLIENT_ID || null,
    auth0Audience:  process.env.AUTH0_AUDIENCE  || null,
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
app.use("/api/tiers", require("./routes/tiers"));
console.log("✅ Mounted route: /api/tiers");
app.use("/api/upsell", require("./routes/upsell"));
console.log("✅ Mounted route: /api/upsell");
app.use("/api/report", require("./routes/report"));
console.log("✅ Mounted route: /api/report");
app.use("/api/assessment", require("./routes/assessment"));
console.log("✅ Mounted route: /api/assessment");
app.use("/api/tiers", require("./routes/tiers"));
console.log("✅ Mounted route: /api/tiers");
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
app.use("/api/orgs-advanced/:orgId/api-keys", require("./routes/api-keys"));
console.log("✅ Mounted route: /api/orgs-advanced/:orgId/api-keys");
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

// Debug /profile route — only useful when the OIDC middleware is active.
// Rate-limited to prevent credential-enumeration / DoS abuse.
app.get('/profile', pageLimiter, (req, res) => {
  if (requiresAuth) {
    return requiresAuth()(req, res, () => {
      res.json(req.oidc.user);
    });
  }
  res.status(501).json({ error: 'OIDC middleware not configured.' });
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
//
// An optional `returnTo` query param (URL-encoded, must start with "/") is
// stored in the Auth0 `state` parameter so that the callback handler can
// redirect the user back to the page they were on — including a `?checkout=<tier>`
// param that auto-starts the Stripe purchase flow after login.
function buildAuth0AuthorizeUrl(screenHint, returnTo) {
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
  // Pass a safe returnTo as the Auth0 state so the callback can redirect there.
  // Only allow same-origin paths (must start with "/") to prevent open redirects.
  if (returnTo && typeof returnTo === "string" && returnTo.startsWith("/")) {
    params.set("state", encodeURIComponent(returnTo));
  }
  return `https://${domain}/authorize?${params.toString()}`;
}

app.get("/login", pageLimiter, (req, res) => {
  // Accept an optional ?returnTo=/path?checkout=tier redirect hint.
  // Only allow same-origin paths to prevent open redirects:
  //   - Must start with "/" (not "//", "/\", etc.)
  //   - Must not contain protocol separators (":", "//")
  //   - URL-decode first, then re-validate the decoded value
  let returnTo = null;
  if (req.query.returnTo) {
    try {
      const rt = decodeURIComponent(String(req.query.returnTo));
      // Strict same-origin path check: must start with '/' but not '//'
      // and must not contain any protocol-relative patterns.
      if (
        rt.startsWith("/") &&
        !rt.startsWith("//") &&
        !rt.startsWith("/\\") &&
        !/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(rt)  // no scheme like http:, https:, data:
      ) {
        returnTo = rt;
      }
    } catch (_e) {
      // Ignore malformed or un-decodable param.
    }
  }
  const url = buildAuth0AuthorizeUrl(null, returnTo);
  if (url) return res.redirect(302, url);
  // Auth0 not configured — fall back to homepage.
  res.redirect("/");
});

app.get("/register", pageLimiter, (req, res) => {
  const url = buildAuth0AuthorizeUrl("signup");
  if (url) return res.redirect(302, url);
  res.redirect("/");
});

// ==============================
// Results route — serve React SPA
// ==============================

// ── Legacy HTML → SPA route redirects (301 Permanent) ──────────────────────
// Placed before the public/ static middleware so that physical HTML files
// can never be served instead of the SPA's routes.
const htmlRedirects = {
  '/about.html': '/about',
  '/research.html': '/research',
  '/founder.html': '/founder',
  '/assessment.html': '/assessment',
  '/insights.html': '/insights',
  '/join.html': '/join',
  '/pricing-teams.html': '/pricing-teams',
  '/resources.html': '/resources',
  '/quiz.html': '/quiz',
  '/kids.html': '/kids',
  '/atlas.html': '/atlas',
  '/comparison.html': '/comparison',
  '/dashboard.html': '/dashboard',
  '/dashboard-advanced.html': '/dashboard-advanced',
  '/team-analytics.html': '/team-analytics',
  '/teams-resources.html': '/teams-resources',
  '/teams-facilitation.html': '/teams-facilitation',
  '/teams-activities.html': '/teams-activities',
  '/legacy-results.html': '/results',
  '/results-legacy.html': '/results',
  '/results.html': '/results',
  '/insights/team-resilience.html': '/insights/team-resilience',
  '/insights/six-resilience-dimensions.html': '/insights/six-resilience-dimensions',
  '/insights/resilience-under-pressure.html': '/insights/resilience-under-pressure',
  '/resources/workshop-guides/somatic-workshop.html': '/resources/workshop-guides/somatic',
  '/resources/workshop-guides/emotional-workshop.html': '/resources/workshop-guides/emotional',
  '/resources/workshop-guides/spiritual-workshop.html': '/resources/workshop-guides/spiritual',
  '/resources/workshop-guides/cognitive-workshop.html': '/resources/workshop-guides/cognitive',
  '/resources/workshop-guides/agentic-workshop.html': '/resources/workshop-guides/agentic',
  '/resources/workshop-guides/relational-workshop.html': '/resources/workshop-guides/relational',
  '/pages/leadership-report.html': '/leadership-report',
  '/pages/org-dashboard.html': '/org-dashboard',
  '/admin/leads.html': '/admin/leads',
};

Object.entries(htmlRedirects).forEach(([oldPath, newPath]) => {
  app.get(oldPath, pageLimiter, (req, res) => res.redirect(301, newPath));
});

// /results must always load the React SPA so the paywall and tier checks
// enforced by ResultsPage run for every visitor.
app.get("/results", pageLimiter, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send("Service unavailable: production build not found. Run `npm run build` in the client directory.");
    }
  });
});

// ==============================
// Team route — serve React SPA
// ==============================

// /team.html is special: preserve query-string (Stripe post-payment redirects)
app.get("/team.html", pageLimiter, (req, res) => {
  const qs = req.originalUrl.slice('/team.html'.length);
  res.redirect(301, `/teams${qs}`);
});

// /team must always load the React SPA so the payment confirmation and tier
// checks enforced by TeamPage run for every visitor.
app.get("/team", pageLimiter, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send("Service unavailable: production build not found. Run `npm run build` in the client directory.");
    }
  });
});

// ==============================
// Public static files
// ==============================

// Serve the legacy public/ directory (quiz.html, assessment pages, etc.)
// AFTER the React SPA static assets so that client/dist files always take
// priority for the root route, while standalone HTML pages remain directly
// accessible via their own URLs (e.g. /quiz.html).
// This must come BEFORE the SPA catch-all so these pages are served correctly
// instead of falling through to the React app.
app.use(express.static(path.join(__dirname, "../public")));

// ==============================
// SPA Fallback
// ==============================

// SPA fallback — serve the React entry point for any route not handled above.
// IMPORTANT: only handle routes without a file extension (browser navigation).
// Requests for .js, .css, .png, etc. that reach this point mean the asset
// does not exist — returning index.html for those would trigger a browser
// MIME-type mismatch error ("text/html is not a supported stylesheet MIME
// type").  A 404 is the correct response for missing static assets.
app.get("*", pageLimiter, (req, res) => {
  const ext = path.extname(req.path);
  if (ext && ext !== ".html") {
    return res.status(404).send("Not found");
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send("Service unavailable: production build not found. Run `npm run build` in the client directory.");
    }
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

