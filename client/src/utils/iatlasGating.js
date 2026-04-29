/**
 * iatlasGating.js — Utility functions for IATLAS payment access control.
 *
 * IATLAS is a separate product line from Atlas Start / Atlas Navigator.
 * It has its own pricing tiers for individuals, families, and professionals.
 *
 * Consumer tiers:
 *   Individual ($19.99/mo)  — 1 child profile
 *   Family     ($39.99/mo)  — Up to 5 child profiles
 *   Complete   ($99.99/mo)  — Full curriculum access
 *
 * Professional tiers:
 *   Practitioner ($149/mo)  — Individual practice
 *   Practice     ($399/mo)  — Group practice
 *   Enterprise   (Custom)   — Organizations
 */

export const IATLAS_TIER_KEY = 'iatlas_tier';

export const IATLAS_TIERS = {
  free:         'free',
  individual:   'individual',
  family:       'family',
  complete:     'complete',
  practitioner: 'practitioner',
  practice:     'practice',
  enterprise:   'enterprise',
};

export const IATLAS_TIER_CONFIG = {
  free: {
    name: 'Free',
    displayName: 'Free Access',
    price: null,
    description: 'Basic IATLAS access',
    features: [],
    comingSoon: false,
  },
  individual: {
    name: 'IATLAS Individual',
    displayName: 'Individual Plan',
    price: '$19.99/mo',
    description: '1 child profile',
    badge: '🌟',
    color: '#4f46e5',
    features: [
      'All kids games & activities',
      'IATLAS curriculum (all ages)',
      'Progress tracking',
      'Printable resources',
      '1 child profile',
    ],
    comingSoon: false,
  },
  family: {
    name: 'IATLAS Family',
    displayName: 'Family Plan',
    price: '$39.99/mo',
    description: 'Up to 5 child profiles',
    badge: '👨‍👩‍👧‍👦',
    color: '#0891b2',
    recommended: true,
    features: [
      'Everything in Individual',
      'Caregiver resources & parent guides',
      'Shared progress dashboard',
      'Family challenge activities',
    ],
    comingSoon: false,
  },
  complete: {
    name: 'IATLAS Complete',
    displayName: 'Complete Plan',
    price: '$99.99/mo',
    description: 'Full curriculum access',
    badge: '🏆',
    color: '#7c3aed',
    features: [
      'Everything in Family',
      'Full curriculum access (49 modules)',
      'Advanced progress analytics ✓',
      'Priority support (launching Q3 2026)',
      'Downloadable resources (launching Q3 2026)',
    ],
    comingSoon: true,
  },
  practitioner: {
    name: 'IATLAS Practitioner',
    displayName: 'Practitioner Plan',
    price: '$149/mo',
    description: 'Individual practice',
    badge: '🩺',
    color: '#059669',
    features: [
      'Clinical assessments & session plans ✓',
      'ABA Protocol Library ✓',
      'Client resources (launching Q3 2026)',
      'Progress & outcome reports ✓',
      'Professional development content ✓',
    ],
    comingSoon: true,
  },
  practice: {
    name: 'IATLAS Practice',
    displayName: 'Practice Plan',
    price: '$399/mo',
    description: 'Group practice',
    badge: '🏥',
    color: '#0369a1',
    features: [
      'Everything in Practitioner',
      'Multi-practitioner access (5–25 seats)',
      'Team collaboration tools',
      'Group practice dashboard',
      'Role-based permissions',
      'Team analytics',
    ],
    comingSoon: true,
  },
  enterprise: {
    name: 'IATLAS Enterprise',
    displayName: 'Enterprise Plan',
    price: 'Custom',
    description: 'Organizations',
    badge: '🏢',
    color: '#374151',
    features: [
      'Everything in Practice',
      'Custom onboarding',
      'Dedicated support',
      'Custom integrations',
    ],
    comingSoon: false,
  },
};

/**
 * Get the current IATLAS tier from localStorage.
 *
 * NOTE: IATLAS is a separate product from Atlas Start / Atlas Navigator.
 * Holding an Atlas Navigator subscription does NOT grant IATLAS access.
 *
 * @returns {string} One of the IATLAS_TIERS values
 */
export function getIATLASTier() {
  try {
    const iatlasTier = localStorage.getItem(IATLAS_TIER_KEY);
    if (iatlasTier && Object.values(IATLAS_TIERS).includes(iatlasTier)) {
      return iatlasTier;
    }
  } catch {
    // localStorage unavailable — fall through to free
  }
  return IATLAS_TIERS.free;
}

/**
 * Returns true if the user has any paid IATLAS access tier.
 */
export function hasIATLASAccess() {
  return getIATLASTier() !== IATLAS_TIERS.free;
}

/**
 * Returns true if the user can access Kids Games & Curriculum sections.
 * Requires IATLAS Individual, Family, Complete, or any Professional tier.
 */
export function hasKidsAccess() {
  const tier = getIATLASTier();
  return [
    IATLAS_TIERS.individual,
    IATLAS_TIERS.family,
    IATLAS_TIERS.complete,
    IATLAS_TIERS.practitioner,
    IATLAS_TIERS.practice,
    IATLAS_TIERS.enterprise,
  ].includes(tier);
}

/**
 * Returns true if the user can access Caregiver Resources.
 * Requires IATLAS Family, Complete, or any Professional tier.
 */
export function hasCaregiverAccess() {
  const tier = getIATLASTier();
  return [
    IATLAS_TIERS.family,
    IATLAS_TIERS.complete,
    IATLAS_TIERS.practitioner,
    IATLAS_TIERS.practice,
    IATLAS_TIERS.enterprise,
  ].includes(tier);
}

/**
 * Returns true if the user can access Professional Materials.
 * Requires IATLAS Practitioner, Practice, or Enterprise tier.
 */
export function hasProfessionalAccess() {
  const tier = getIATLASTier();
  return [
    IATLAS_TIERS.practitioner,
    IATLAS_TIERS.practice,
    IATLAS_TIERS.enterprise,
  ].includes(tier);
}

/**
 * Returns the maximum number of child profiles allowed for the current tier.
 *   free         → 0 (no IATLAS access)
 *   individual   → 1
 *   family+      → 5
 */
export function getMaxProfiles(tier) {
  const TIER_LIMITS = {
    free:         0,
    individual:   1,
    family:       5,
    complete:     5,
    practitioner: 5,
    practice:     5,
    enterprise:   5,
  };
  return TIER_LIMITS[tier] ?? 0;
}

/**
 * Returns true if the current tier supports creating child profiles.
 */
export function canCreateProfiles() {
  const tier = getIATLASTier();
  return getMaxProfiles(tier) > 0;
}

/**
 * Returns true if the user has the Complete tier or any professional tier.
 * Complete tier is required for the Advanced Personal Analytics dashboard.
 */
export function hasCompleteAccess() {
  const tier = getIATLASTier();
  return [
    IATLAS_TIERS.complete,
    IATLAS_TIERS.practitioner,
    IATLAS_TIERS.practice,
    IATLAS_TIERS.enterprise,
  ].includes(tier);
}

/**
 * Returns true if the user can add another child profile given the count they already have.
 * @param {number} currentCount  Number of existing (non-archived) profiles.
 */
export function canAddAnotherProfile(currentCount) {
  const tier = getIATLASTier();
  const max  = getMaxProfiles(tier);
  return max > 0 && currentCount < max;
}

/**
 * Returns true if the user has the Practice tier or Enterprise tier,
 * which enables group practice management features (multi-practitioner dashboard,
 * seat management, team analytics, etc.)
 */
export function hasPracticeAccess() {
  const tier = getIATLASTier();
  return [
    IATLAS_TIERS.practice,
    IATLAS_TIERS.enterprise,
  ].includes(tier);
}

/** API endpoint for IATLAS subscription status checks. */
const IATLAS_SUBSCRIPTION_STATUS_URL = '/api/iatlas/subscription-status';

/**
 * Check whether the authenticated user has an active IATLAS subscription at or
 * above `minTier` by calling the backend subscription-status endpoint.
 *
 * @param {string} minTier   — minimum tier required ('practice', 'practitioner', etc.)
 * @param {string} [token]   — Auth0 bearer token; falls back to a cached token if omitted
 * @returns {Promise<{
 *   allowed: boolean,
 *   currentTier: string,
 *   requiredTier: string,
 *   upgradeUrl: string
 * }>}
 */
export async function requireActiveSubscription(minTier, token) {
  const hierarchy = {
    free: 0,
    individual: 1,
    family: 2,
    complete: 3,
    practitioner: 4,
    practice: 5,
    enterprise: 6,
  };

  const authToken = token || (() => {
    try { return localStorage.getItem('auth0_cached_token') || null; } catch { return null; }
  })();

  if (!authToken) {
    return {
      allowed: false,
      currentTier: 'free',
      requiredTier: minTier,
      upgradeUrl: '/pricing/iatlas',
    };
  }

  try {
    const response = await fetch(IATLAS_SUBSCRIPTION_STATUS_URL, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      return {
        allowed: false,
        currentTier: 'free',
        requiredTier: minTier,
        upgradeUrl: '/pricing/iatlas',
      };
    }

    const data = await response.json();
    const currentTier = data.tier || 'free';
    const allowed = (hierarchy[currentTier] ?? 0) >= (hierarchy[minTier] ?? 0);

    return {
      allowed,
      currentTier,
      requiredTier: minTier,
      upgradeUrl: '/pricing/iatlas',
    };
  } catch {
    return {
      allowed: false,
      currentTier: 'free',
      requiredTier: minTier,
      upgradeUrl: '/pricing/iatlas',
    };
  }
}
