'use strict';

/**
 * iatlasAuth.js — IATLAS tier-hierarchy authentication middleware.
 *
 * Provides `requireIATLASTier(minTier)` — a middleware factory that enforces
 * a minimum IATLAS subscription tier using a numeric hierarchy rather than
 * a fixed allow-list.  This allows, for example, requiring 'family' and
 * automatically granting access to 'complete', 'practitioner', 'practice',
 * and 'enterprise' users as well.
 *
 * Must be used AFTER `authenticateJWT` so that `req.user` is populated.
 *
 * Tier is resolved in two steps:
 *  1. JWT custom claim `https://theresilienceatlas.com/tier` (set by Auth0
 *     rule/action so it is present on every Auth0-issued access token).
 *  2. Database fallback — queries `iatlas_subscriptions` for an active or
 *     trialing subscription when the JWT claim is absent.
 *
 * Usage:
 *   const { requireIATLASTier } = require('../middleware/iatlasAuth');
 *   router.get('/', authenticateJWT, requireIATLASTier('family'), handler);
 */

const mongoose = require('mongoose');
const logger   = require('../utils/logger');

const TIER_CLAIM_NS = 'https://theresilienceatlas.com/tier';

/**
 * Numeric hierarchy for IATLAS tiers.
 * Higher number = higher tier (includes all lower tiers' privileges).
 */
const TIER_HIERARCHY = {
  free:         0,
  individual:   1,
  family:       2,
  complete:     3,
  practitioner: 4,
  practice:     5,
  enterprise:   6,
};

/**
 * Look up the user's active IATLAS tier from the iatlas_subscriptions collection.
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
    }, {
      sort: { createdAt: -1 },
    });
    return sub?.tier || 'free';
  } catch {
    return 'free';
  }
}

/**
 * Middleware factory — returns an Express middleware that enforces a minimum
 * IATLAS tier level.  Users at or above `minTier` in the hierarchy pass through;
 * all others receive a 403 with `upgradeRequired: true`.
 *
 * @param {string} minTier  — minimum tier required (e.g. 'individual', 'family')
 * @returns {Function}  Express middleware (req, res, next)
 */
function requireIATLASTier(minTier) {
  if (!TIER_HIERARCHY.hasOwnProperty(minTier)) {
    throw new Error(`requireIATLASTier: unknown tier '${minTier}'`);
  }

  const requiredLevel = TIER_HIERARCHY[minTier];

  return async function iatlasAuthMiddleware(req, res, next) {
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

      const userLevel = TIER_HIERARCHY[currentTier] ?? 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error:           `This feature requires ${minTier} tier or higher.`,
          currentTier,
          requiredTier:    minTier,
          upgradeRequired: true,
          upgradeUrl:      '/iatlas/pricing',
        });
      }

      // Expose resolved tier for downstream handlers.
      req.iatlasTier = currentTier;
      next();
    } catch (err) {
      logger.error('[iatlasAuth] requireIATLASTier error:', err);
      res.status(500).json({ error: 'Tier check failed.' });
    }
  };
}

module.exports = { requireIATLASTier, TIER_HIERARCHY };
