'use strict';

/**
 * practiceAuth.js — Practice role-based access control middleware.
 *
 * Provides `requirePracticeRole(minRole)` — a middleware factory that enforces
 * a minimum practice role using a numeric hierarchy.  Must be used after
 * `authenticateJWT` so that `req.user` is populated.
 *
 * The middleware resolves the user's practice membership via the
 * PracticePractitioner join table (preferred) and attaches `req.practice`
 * and `req.practitionerRole` for downstream handlers.
 *
 * Usage:
 *   const { requirePracticeRole } = require('../middleware/practiceAuth');
 *   router.delete('/:id', authenticateJWT, requirePracticeRole('admin'), handler);
 */

const Practice = require('../models/Practice');
const PracticePractitioner = require('../models/PracticePractitioner');
const logger = require('../utils/logger');

/**
 * Numeric hierarchy for practice roles.
 * Higher number = higher role.
 */
const ROLE_HIERARCHY = {
  observer:   1,
  therapist:  2,
  clinician:  2,
  admin:      3,
  owner:      4,
};

/**
 * Resolve the caller's practice membership and role.
 * Checks the PracticePractitioner join table for an active membership.
 *
 * @param {string} practiceId — the practice's _id (ObjectId string)
 * @param {string} userId     — the caller's userId / Auth0 sub
 * @returns {Promise<{role: string|null, pp: object|null}>}
 */
async function resolveMembership(practiceId, userId) {
  try {
    const query = { practiceId, status: 'active', userId };
    const pp = await PracticePractitioner.findOne(query).lean();
    return { role: pp ? pp.role : null, pp };
  } catch (err) {
    logger.error('[practiceAuth] resolveMembership error:', err);
    return { role: null, pp: null };
  }
}

/**
 * Middleware factory — returns an Express middleware that enforces a minimum
 * practice role.  The `:practiceId` URL param must be present.
 *
 * @param {string} minRole — minimum role required (e.g. 'clinician', 'admin')
 * @returns {Function}
 */
function requirePracticeRole(minRole) {
  if (!ROLE_HIERARCHY.hasOwnProperty(minRole)) {
    throw new Error(`requirePracticeRole: unknown role '${minRole}'`);
  }

  const requiredLevel = ROLE_HIERARCHY[minRole];

  return async function practiceAuthMiddleware(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const userId = req.user.userId || req.user.sub || req.user.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      const practiceId = req.params.practiceId || req.params.id;
      if (!practiceId) {
        return res.status(400).json({ error: 'practiceId required.' });
      }

      const { role } = await resolveMembership(practiceId, userId);

      if (!role) {
        return res.status(403).json({ error: 'Not a practice member.' });
      }

      const userLevel = ROLE_HIERARCHY[role] ?? 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({
          error: `Requires ${minRole} role or higher.`,
          currentRole: role,
          requiredRole: minRole,
        });
      }

      // Attach practice and role to the request for downstream handlers.
      req.practitionerRole = role;
      const practice = await Practice.findById(practiceId).lean();
      if (!practice) {
        return res.status(404).json({ error: 'Practice not found.' });
      }
      req.practice = practice;
      next();
    } catch (err) {
      logger.error('[practiceAuth] requirePracticeRole error:', err);
      res.status(500).json({ error: 'Practice role check failed.' });
    }
  };
}

module.exports = { requirePracticeRole, ROLE_HIERARCHY };
