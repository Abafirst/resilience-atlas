'use strict';

/**
 * sso.js — SSO domain-lookup route.
 *
 * GET /api/sso/lookup?email=<email>
 *
 * Returns whether the email's domain has a configured SSO/SAML connection so
 * the SPA can route the user through enterprise SSO instead of the standard
 * username/password flow.
 *
 * Domain → connection mapping is supplied via the SSO_DOMAIN_MAP environment
 * variable as a JSON object, e.g.:
 *
 *   SSO_DOMAIN_MAP='{"acme.com":"acme-saml","corp.example.com":"corp-oidc"}'
 *
 * If the variable is absent or the domain is not listed the endpoint returns
 * { sso: false } and the SPA falls back to a standard Auth0 login with the
 * email pre-filled as login_hint.
 */

const express  = require('express');
const rateLimit = require('express-rate-limit');
const logger   = require('../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Generous enough for a normal user but prevents enumeration abuse.
const ssoLookupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Domain-map loader ─────────────────────────────────────────────────────────

/**
 * Parse the SSO_DOMAIN_MAP environment variable once at startup.
 * Returns a plain object: { 'domain.com': 'connection-name', … }
 * Falls back to {} when the variable is absent or malformed.
 */
function loadDomainMap() {
  const raw = process.env.SSO_DOMAIN_MAP;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Normalise all keys to lowercase for case-insensitive matching.
      const normalised = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof k === 'string' && typeof v === 'string' && k && v) {
          normalised[k.toLowerCase().trim()] = v.trim();
        }
      }
      return normalised;
    }
  } catch (err) {
    logger.warn('[sso] Failed to parse SSO_DOMAIN_MAP — falling back to no SSO domains:', err.message);
  }

  return {};
}

// Eagerly parse so malformed config is detected at startup.
const domainMap = loadDomainMap();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Very light email-format check (no regex to avoid ReDoS).
 * Returns true only when the string has a single @ with a non-empty local part
 * and a domain segment that contains at least one dot.
 */
function looksLikeEmail(s) {
  if (typeof s !== 'string') return false;
  const atIdx = s.indexOf('@');
  if (atIdx < 1) return false;                      // must have local part
  if (s.indexOf('@', atIdx + 1) !== -1) return false; // only one @
  const domain = s.slice(atIdx + 1);
  const dotIdx = domain.lastIndexOf('.');
  return dotIdx > 0 && dotIdx < domain.length - 1;   // non-empty TLD
}

/**
 * Extract the domain portion of an email address, lower-cased.
 * Assumes looksLikeEmail() has already returned true.
 */
function emailDomain(email) {
  return email.slice(email.indexOf('@') + 1).toLowerCase().trim();
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/sso/lookup
 *
 * Query params:
 *   email (required) — the address the user typed into the email-first login form.
 *
 * Responses:
 *   200 { sso: true,  connection: "connection-name" } — domain has SSO configured
 *   200 { sso: false }                                — use password / social login
 *   400 { error: "..." }                              — invalid or missing email
 */
router.get('/lookup', ssoLookupLimiter, (req, res) => {
  const { email } = req.query;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email query parameter is required.' });
  }

  const trimmed = email.trim();

  if (!looksLikeEmail(trimmed)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const domain = emailDomain(trimmed);
  const connection = domainMap[domain];

  if (connection) {
    logger.info(`[sso] SSO match for domain "${domain}" → connection "${connection}"`);
    return res.json({ sso: true, connection });
  }

  return res.json({ sso: false });
});

module.exports = router;
