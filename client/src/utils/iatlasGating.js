/**
 * iatlasGating.js — IATLAS payment gating utilities.
 *
 * Provides access-control helpers and pricing tier definitions for the
 * IATLAS kids games and curriculum content.
 *
 * Tier hierarchy (lowest → highest access):
 *   free → iatlas-individual → iatlas-family → iatlas-professional
 */

const IATLAS_TIER_KEY = 'iatlas_tier';

/** IATLAS-specific pricing tiers */
export const IATLAS_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    billing: 'free',
    audience: 'Everyone',
    features: [
      'Preview resilience content',
      'Browse skills library',
      'Read sample stories',
    ],
  },
  'iatlas-individual': {
    name: 'IATLAS Individual',
    price: 1999, // $19.99
    priceLabel: '$19.99',
    billing: 'one-time',
    audience: 'Individuals',
    features: [
      'All interactive kids games',
      'Full badge & stars collection',
      'Age-specific activity guides',
      'Resilience stories & videos',
      '1 child account',
    ],
  },
  'iatlas-family': {
    name: 'IATLAS Family',
    price: 3999, // $39.99
    priceLabel: '$39.99',
    billing: 'one-time',
    audience: 'Families',
    highlighted: true,
    features: [
      'Everything in Individual',
      'Up to 5 child accounts',
      'Parent progress dashboard',
      'Family resilience report',
      'Priority support',
    ],
  },
  'iatlas-professional': {
    name: 'IATLAS Professional',
    price: 9999, // $99.99
    priceLabel: '$99.99',
    billing: 'one-time',
    audience: 'Clinicians, Educators & Caregivers',
    features: [
      'Everything in Family',
      'Up to 30 child accounts',
      'Curriculum facilitation guides',
      'Progress tracking & reports',
      'Professional certificate',
      'Classroom & clinic tools',
    ],
  },
};

/** Tier order for access comparisons (higher = more access). */
const IATLAS_TIER_ORDER = {
  free:                  0,
  'iatlas-individual':   1,
  'iatlas-family':       2,
  'iatlas-professional': 3,
};

/**
 * Returns the current user's IATLAS tier from localStorage.
 * Falls back to 'free' if no tier is stored or the value is unrecognised.
 *
 * @returns {'free'|'iatlas-individual'|'iatlas-family'|'iatlas-professional'}
 */
export function getIATLASTier() {
  try {
    const stored = localStorage.getItem(IATLAS_TIER_KEY);
    if (stored && Object.keys(IATLAS_TIERS).includes(stored)) return stored;
  } catch {
    // localStorage unavailable (e.g. SSR, private-mode restriction)
  }
  return 'free';
}

/**
 * Stores the user's IATLAS tier in localStorage.
 *
 * @param {'free'|'iatlas-individual'|'iatlas-family'|'iatlas-professional'} tier
 */
export function setIATLASTier(tier) {
  try {
    localStorage.setItem(IATLAS_TIER_KEY, tier);
  } catch {
    // localStorage unavailable
  }
}

/**
 * Returns true when the user holds any paid IATLAS tier
 * (i.e. iatlas-individual or above).
 *
 * @returns {boolean}
 */
export function hasIATLASAccess() {
  return (IATLAS_TIER_ORDER[getIATLASTier()] || 0) >= IATLAS_TIER_ORDER['iatlas-individual'];
}

/**
 * Returns true when the user's tier meets or exceeds the required tier.
 *
 * @param {'free'|'iatlas-individual'|'iatlas-family'|'iatlas-professional'} requiredTier
 * @returns {boolean}
 */
export function hasIATLASAccessForTier(requiredTier) {
  return (IATLAS_TIER_ORDER[getIATLASTier()] || 0) >= (IATLAS_TIER_ORDER[requiredTier] || 0);
}
