'use strict';

/**
 * iatlasGating.js — Shared IATLAS tier gating logic for the backend.
 *
 * Mirrors the logic in client/src/utils/iatlasGating.js so that both sides
 * enforce the same tier limits from a single source of truth.
 *
 * Consumer tiers:
 *   free         → 0 child profiles (no IATLAS access)
 *   individual   → 1 child profile
 *   family       → 5 child profiles
 *   complete     → 5 child profiles
 *
 * Professional tiers (all allow up to 5 child profiles):
 *   practitioner, practice, enterprise → 5 child profiles
 */

const TIER_LIMITS = {
  free:         0,
  individual:   1,
  family:       5,
  complete:     5,
  practitioner: 5,
  practice:     5,
  enterprise:   5,
};

/**
 * Return the maximum number of child profiles allowed for a given tier.
 * @param {string} tier  One of the IATLAS tier names.
 * @returns {number}     Maximum profile count (0 = no access).
 */
function getMaxProfiles(tier) {
  return TIER_LIMITS[tier] ?? 0;
}

/**
 * Returns true when the supplied tier grants access to at least one
 * child profile (i.e. any paid IATLAS tier).
 * @param {string} tier
 * @returns {boolean}
 */
function hasIATLASAccess(tier) {
  return getMaxProfiles(tier) > 0;
}

module.exports = { getMaxProfiles, hasIATLASAccess, TIER_LIMITS };
