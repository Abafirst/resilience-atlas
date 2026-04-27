'use strict';

/**
 * iatlasHelpers.js — Shared backend utilities for IATLAS tier lookups.
 *
 * These helpers query the iatlas_subscriptions collection to resolve a user's
 * current paid tier.  They are intentionally decoupled from the route layer so
 * multiple route files can reuse the same logic without duplication.
 */

const mongoose = require('mongoose');

/**
 * Resolve the current IATLAS tier for a given user ID.
 *
 * Looks up an active or trialing subscription in the iatlas_subscriptions
 * collection.  Falls back to 'free' when no subscription is found or when
 * the database is unavailable.
 *
 * @param {string} userId
 * @returns {Promise<string>} One of: free | individual | family | complete |
 *                            practitioner | practice | enterprise
 */
async function getIATLASTier(userId) {
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

module.exports = { getIATLASTier };
