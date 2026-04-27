'use strict';

/**
 * checkTier.js — Tier-verification middleware factory.
 *
 * Creates Express middleware that restricts an endpoint to users whose
 * subscription tier meets or exceeds the minimum required tiers.
 *
 * Tier is resolved in two steps:
 *  1. JWT custom claim `https://theresilienceatlas.com/tier` (set by Auth0
 *     rule/action so it is present on every Auth0-issued access token).
 *  2. Database fallback — queries `iatlas_subscriptions` for an active or
 *     trialing subscription when the JWT claim is absent (e.g. legacy tokens
 *     or unit-test tokens that omit the claim).
 *
 * Must be used AFTER `authenticateJWT` so that `req.user` is populated.
 *
 * Usage:
 *   const checkTier = require('../middleware/checkTier');
 *   router.post('/', authenticateJWT, checkTier(['practitioner', 'practice', 'enterprise']), handler);
 */

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const TIER_CLAIM_NS = 'https://theresilienceatlas.com/tier';

/**
 * Look up the user's active tier from the iatlas_subscriptions collection.
 * Returns 'free' when no active subscription is found or the DB is unavailable.
 *
 * @param {string} userId
 * @returns {Promise<string>}
 */
async function getTierFromDb(userId) {
  try {
    const db = mongoose.connection.db;
    if (!db) return 'free';
    const sub = await db.collection('iatlas_subscriptions').findOne({
      userId: userId.toString(),
      status: { $in: ['active', 'trialing'] },
    });
    return sub?.tier || 'free';
  } catch {
    return 'free';
  }
}

/**
 * Middleware factory — returns an Express middleware that enforces tier access.
 *
 * @param {string[]} allowedTiers  — list of tier strings that are permitted
 * @returns {Function}  Express middleware (req, res, next)
 */
function checkTier(allowedTiers) {
  if (!Array.isArray(allowedTiers) || allowedTiers.length === 0) {
    throw new Error('checkTier: allowedTiers must be a non-empty array');
  }

  const allowed = new Set(allowedTiers);

  return async function checkTierMiddleware(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const userId = req.user.userId || req.user.sub;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      // Prefer JWT claim (Auth0 sets this via a Rule/Action).
      let currentTier = req.user[TIER_CLAIM_NS] || null;

      // Fall back to database when claim is absent.
      if (!currentTier) {
        currentTier = await getTierFromDb(userId);
      }

      if (!allowed.has(currentTier)) {
        return res.status(403).json({
          error:         'Upgrade required',
          currentTier,
          requiredTiers: allowedTiers,
          upgradeUrl:    '/pricing',
        });
      }

      // Expose resolved tier for downstream handlers.
      req.userTier = currentTier;
      next();
    } catch (err) {
      logger.error('[checkTier] error:', err);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
}

module.exports = checkTier;
