// ==============================
// Core dependencies
// ==============================
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
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
// Only initialize the server-side OIDC middleware when the required
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
        // YouTube embeds are used on the Kids page for video stories.
        frameSrc: [
          "'self'",
          "https://js.stripe.com",
          auth0Domain,
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],
        // Images: allow self, inline data URIs (charts), Gravatar (user avatars),
        // Auth0 CDN (profile pictures / Lock widget assets), and YouTube
        // thumbnails used on the Kids page.
        imgSrc: [
          "'self'",
          "data:",
          "https://www.gravatar.com",
          "https://s.gravatar.com",
          "https://cdn.auth0.com",
          "https://img.youtube.com",
          "https://i.ytimg.com",
          "https://yt-embed.herokuapp.com",
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
  // Staging Railway deployment — included by default so staging works
  // out-of-the-box without requiring a manual CORS_ORIGIN env var override.
  "https://resilience-atlas-staging.up.railway.app",
  // Capacitor serves the SPA from localhost origins in native WebViews.
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "ionic://localhost",
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

const corsOptions = {
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };

app.use(cors(corsOptions));
app.options("/api/*", cors(corsOptions));
app.options("/config", cors(corsOptions));

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

// Serve app-owned assets (logos, shared images) from public/assets at /assets/*.
// This must come BEFORE the Vite /assets mount so that files like
// logo-256x256.png are found here first and served correctly.
// fallthrough:true allows requests for files that don't exist in public/assets
// to continue to the Vite assets mount below.
app.use(
  "/assets",
  express.static(path.join(__dirname, "../public/assets"), { fallthrough: true })
);

// Explicitly mount the Vite assets directory with fallthrough:false so that
// any /assets/* request that doesn't match a real file returns 404 immediately
// instead of falling through to API handlers (which return JSON) or the SPA
// catch-all (which returns index.html — both triggering browser MIME errors).
app.use(
  "/assets",
  express.static(path.join(clientDist, "assets"), { fallthrough: false })
);

// eslint-disable-next-line no-unused-vars
app.use("/assets", (err, req, res, next) => {
  if (err && err.status === 404) {
    return res.type("text").status(404).send("Not found");
  }
  next(err);
});

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
  const userAgent = req.get("User-Agent") || "";
  const clientType = req.query.clientType?.toString().toLowerCase() || "";
  const isNativeClient = clientType === "native" || userAgent.toLowerCase().includes("capacitor");
  const auth0ClientId = isNativeClient
    ? (process.env.AUTH0_CLIENT_ID_NATIVE || process.env.AUTH0_CLIENT_ID || null)
    : (process.env.AUTH0_CLIENT_ID_PRODUCTION || process.env.AUTH0_CLIENT_ID || null);

  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    auth0Domain:    process.env.AUTH0_DOMAIN    || null,
    auth0ClientId,
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
app.use("/api/sso", require("./routes/sso"));
console.log("✅ Mounted route: /api/sso");
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
app.use("/api/org-gamification", require("./routes/org-gamification"));
console.log("✅ Mounted route: /api/org-gamification");
app.use("/api/team-analytics", require("./routes/team-analytics"));
console.log("✅ Mounted route: /api/team-analytics");
app.use("/api/growth", require("./routes/growth"));
console.log("✅ Mounted route: /api/growth");
app.use("/api/gamification", require("./routes/gamification"));
console.log("✅ Mounted route: /api/gamification");
app.use("/api/micro-practice-plan", require("./routes/micro-practice-plan"));
console.log("✅ Mounted route: /api/micro-practice-plan");
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
app.use("/api/iatlas", require("./routes/iatlas-subscriptions"));
console.log("✅ Mounted route: /api/iatlas");
app.use("/api/iatlas/profiles", require("./routes/profiles"));
console.log("✅ Mounted route: /api/iatlas/profiles");
app.use("/api/iatlas/waitlist", require("./routes/waitlist"));
console.log("✅ Mounted route: /api/iatlas/waitlist");
app.use("/api/iatlas/tier-waitlist", require("./routes/iatlas-tier-waitlist"));
console.log("✅ Mounted route: /api/iatlas/tier-waitlist");
app.use("/api/iatlas/clinical/session-plans", require("./routes/sessionPlans"));
console.log("✅ Mounted route: /api/iatlas/clinical/session-plans");
app.use("/api/iatlas/clinical/outcome-reports", require("./routes/clinical-reports"));
console.log("✅ Mounted route: /api/iatlas/clinical/outcome-reports");
app.use("/api/iatlas/roadmap", require("./routes/iatlas-roadmap"));
console.log("✅ Mounted route: /api/iatlas/roadmap");
app.use("/api/practices", require("./routes/practices"));
console.log("✅ Mounted route: /api/practices");
app.use("/api/practitioners", require("./routes/practiceInvitations"));
console.log("✅ Mounted route: /api/practitioners");
app.use("/api/cases", require("./routes/caseAssignments"));
console.log("✅ Mounted route: /api/cases");
app.use("/api/activity-logs", require("./routes/activityLogs"));
console.log("✅ Mounted route: /api/activity-logs");
app.use("/api/progress", require("./routes/progress"));
console.log("✅ Mounted route: /api/progress");
app.use("/api/support", require("./routes/support"));
console.log("✅ Mounted route: /api/support");

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

// ==============================
// Debug / Diagnostics (non-production only)
// ==============================

// Lightweight diagnostic endpoint to confirm that the client build is present
// in the running container.  Intentionally omits env-var values to avoid
// accidental secret leakage.  Disabled in production.  Rate-limited to
// prevent filesystem-enumeration abuse.
if (process.env.NODE_ENV !== "production") {
  app.get("/__debug/dist", pageLimiter, (req, res) => {
    res.json({
      clientDistExists: fs.existsSync(clientDist),
      clientDistAssetsExists: fs.existsSync(path.join(clientDist, "assets")),
    });
  });
}

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

// ── Auth routes — SPA-friendly redirects ────────────────────
// /login and /register hand off to the React SPA rather than generating
// server-side Auth0 authorize URLs.  The old approach produced a
// redirect_uri of http://localhost:3000/callback in production (because
// the server could not derive the correct origin from env vars), causing
// Auth0 "Callback URL mismatch" errors.
//
// By redirecting into the SPA the browser's window.location.origin is
// used by Auth0's loginWithRedirect() as the callback URL — which is
// always correct in every environment.
//
// An optional same-origin ?returnTo= param is honored so deep-links
// like /login?returnTo=/results can land on a specific SPA page.
// Only same-origin paths are accepted to prevent open-redirect vulnerabilities.
const sanitiseReturnTo = require("./utils/sanitiseReturnTo");

app.get("/login", pageLimiter, (req, res) => {
  const returnTo = sanitiseReturnTo(req.query.returnTo);
  res.redirect(302, returnTo || "/results-history");
});

app.get("/register", pageLimiter, (req, res) => {
  res.redirect(302, "/results-history");
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
  '/teams-resources.html': '/teams/resources',
  '/teams-facilitation.html': '/teams/facilitation',
  '/teams-activities.html': '/teams/activities',
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

// /resources must always load the React SPA so the resource library is served
// by the React component and legacy public/resources.html is never returned.
app.get("/resources", pageLimiter, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send(
        "Service unavailable: production build not found. Run `npm run build` in the client directory."
      );
    }
  });
});

// /dashboard must always load the React SPA so users see the personal
// DashboardPage component. The legacy public/dashboard.html is never returned
// because this route is registered before the public/ static middleware.
app.get("/dashboard", pageLimiter, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send(
        "Service unavailable: production build not found. Run `npm run build` in the client directory."
      );
    }
  });
});

// /gamification must always load the React SPA so the entitlement checks
// enforced by GamificationDashboard run for every visitor. Registering this
// route before the public/ static middleware prevents any legacy
// public/gamification.html from being served instead.
app.get("/gamification", pageLimiter, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send(
        "Service unavailable: production build not found. Run `npm run build` in the client directory."
      );
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
// Teams routes — serve React SPA
// ==============================

// Flat legacy Teams paths redirect permanently to the canonical nested paths.
// These redirects are registered before public/ static files so the legacy
// HTML files can never be served at those paths.
app.get("/teams-activities", pageLimiter, (req, res) => res.redirect(301, "/teams/activities"));
app.get("/teams-resources",  pageLimiter, (req, res) => res.redirect(301, "/teams/resources"));
app.get("/teams-facilitation", pageLimiter, (req, res) => res.redirect(301, "/teams/facilitation"));

// /teams and /teams/* must always load the React SPA so access gating and
// React Router handle rendering.  Registered before express.static(public)
// so public/teams-*.html files can never shadow these routes.
app.get(["/teams", "/teams/*"], pageLimiter, (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      res.status(503).send(
        "Service unavailable: production build not found. Run `npm run build` in the client directory."
      );
    }
  });
});

// ==============================
// Public static files
// ==============================

// Serve the legacy public/ directory (assessment pages, static assets, etc.)
// AFTER the React SPA static assets so that client/dist files always take
// priority for the root route, while standalone HTML pages remain directly
// accessible via their own URLs.  Note: /quiz.html is redirected to /quiz
// before this middleware runs, so the legacy quiz.html is never served.
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
