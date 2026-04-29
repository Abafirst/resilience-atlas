'use strict';

/**
 * subscriptionAuth.js — IATLAS subscription payment-gating middleware.
 *
 * Provides `requireIATLASSubscription(minTier)` — a middleware factory that
 * enforces a minimum IATLAS subscription tier.  Users at or above `minTier`
 * in the tier hierarchy are allowed through; all others receive a 403 with an
 * upgrade prompt.
 *
 * Must be used AFTER `authenticateJWT` so that `req.user` is populated.
 *
 * Tier hierarchy (lowest → highest):
 *   free (0) → individual (1) → family (2) → complete (3)
 *             → practitioner (4) → practice (5) → enterprise (6)
 *
 * This module delegates to `iatlasAuth.js` to avoid duplicating the tier-
 * resolution and database-lookup logic.
 *
 * Usage:
 *   const { requireIATLASSubscription } = require('../middleware/subscriptionAuth');
 *   router.get('/mine', authenticateJWT, requireIATLASSubscription('practice'), handler);
 */

const { requireIATLASTier } = require('./iatlasAuth');

/**
 * Middleware factory — enforces a minimum IATLAS subscription tier.
 *
 * Returns 403 with `{ error, requiredTier, currentTier, upgradeUrl }` when the
 * user's subscription is missing or insufficient.  Attaches `req.iatlasTier`
 * for downstream handlers when access is granted.
 *
 * @param {string} minTier  — minimum tier required ('practice', 'practitioner', etc.)
 * @returns {Function}  Express middleware (req, res, next)
 */
function requireIATLASSubscription(minTier) {
  return requireIATLASTier(minTier);
}

module.exports = { requireIATLASSubscription };
