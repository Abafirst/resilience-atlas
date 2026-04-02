/**
 * tierGating.js — Utility functions for Teams tier access control.
 * Determines what a user can access based on their current Teams plan.
 */

export const TEAM_TIERS = {
  none: 'none',
  basic: 'basic',
  premium: 'premium',
  enterprise: 'enterprise',
};

/** Tier display names */
export const TIER_NAMES = {
  none: 'No Teams Plan',
  basic: 'Atlas Team Basic',
  premium: 'Atlas Team Premium',
  enterprise: 'Atlas Enterprise',
};

/** Tier prices (for upgrade prompts) */
export const TIER_PRICES = {
  basic: '$299',
  premium: '$699',
  enterprise: '$2,499+',
};

/**
 * Get the current user's Teams tier from localStorage.
 * Returns one of: 'none' | 'basic' | 'premium' | 'enterprise'
 */
export function getCurrentTeamsTier() {
  try {
    const stored = localStorage.getItem('ra-teams-tier');
    if (stored && Object.values(TEAM_TIERS).includes(stored)) return stored;
    // Also check session plan from auth token
    const user = JSON.parse(localStorage.getItem('ra-user') || 'null');
    if (user?.plan) {
      if (user.plan === 'teams-starter' || user.plan === 'starter') return TEAM_TIERS.basic;
      if (user.plan === 'teams-pro' || user.plan === 'pro') return TEAM_TIERS.premium;
      if (user.plan === 'enterprise') return TEAM_TIERS.enterprise;
    }
  } catch {}
  return TEAM_TIERS.none;
}

/** Tier order for comparisons (higher = more access) */
const TIER_ORDER = { none: 0, basic: 1, premium: 2, enterprise: 3 };

/**
 * Returns true if the user's current tier meets or exceeds the required tier.
 * @param {string} currentTier - The user's current tier
 * @param {string} requiredTier - The minimum required tier
 */
export function canAccessFeatureTier(currentTier, requiredTier) {
  return (TIER_ORDER[currentTier] || 0) >= (TIER_ORDER[requiredTier] || 0);
}

/**
 * Facilitation guide access control.
 * All facilitation guides require Premium tier or above.
 */
export const FACILITATION_GUIDE_MIN_TIER = TEAM_TIERS.premium;

/**
 * Check if current user can access facilitation guides.
 */
export function canAccessFacilitationGuides() {
  const tier = getCurrentTeamsTier();
  return canAccessFeatureTier(tier, FACILITATION_GUIDE_MIN_TIER);
}
