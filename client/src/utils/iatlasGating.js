/**
 * iatlasGating.js — Utility functions for IATLAS payment access control.
 *
 * Supports three IATLAS-specific pricing tiers for individuals, families,
 * and professionals (clinicians, educators, caregivers).
 */

export const IATLAS_TIER_KEY = 'iatlas_tier';

export const IATLAS_TIERS = {
  free:         'free',
  individual:   'individual',
  family:       'family',
  professional: 'professional',
};

export const IATLAS_TIER_CONFIG = {
  free: {
    name: 'Free',
    price: null,
    description: 'Basic IATLAS access',
    features: [],
  },
  individual: {
    name: 'IATLAS Individual',
    price: '$9.99/mo',
    description: 'Full access for one person',
    badge: '🌟',
    color: '#4f46e5',
    features: [
      'All kids games & activities',
      'IATLAS curriculum (all ages)',
      'Progress tracking',
      'Printable resources',
    ],
  },
  family: {
    name: 'IATLAS Family',
    price: '$14.99/mo',
    description: 'Full access for up to 6 family members',
    badge: '👨‍👩‍👧‍👦',
    color: '#0891b2',
    recommended: true,
    features: [
      'Everything in Individual',
      'Up to 6 family profiles',
      'Shared progress dashboard',
      'Family challenge activities',
    ],
  },
  professional: {
    name: 'IATLAS Professional',
    price: '$24.99/mo',
    description: 'For clinicians, educators & caregivers',
    badge: '🎓',
    color: '#059669',
    features: [
      'Everything in Family',
      'Unlimited child/client profiles',
      'Clinical & classroom facilitation guides',
      'Progress & outcome reports',
      'ABA protocol library',
    ],
  },
};

/**
 * Get the current IATLAS tier from localStorage.
 * Also returns individual-level access when the user holds atlas-premium or any Teams tier
 * on the main Resilience Atlas plan.
 *
 * @returns {string} One of the IATLAS_TIERS values
 */
export function getIATLASTier() {
  try {
    const iatlasTier = localStorage.getItem(IATLAS_TIER_KEY);
    if (iatlasTier && Object.values(IATLAS_TIERS).includes(iatlasTier)) {
      return iatlasTier;
    }

    // Grant individual-level IATLAS access to atlas-premium and Teams users
    const resilienceTier = localStorage.getItem('resilience_tier') || '';
    const premiumTiers = [
      'atlas-premium',
      'teams-starter', 'teams-pro', 'teams-enterprise',
      'starter', 'pro', 'enterprise',
    ];
    if (premiumTiers.includes(resilienceTier)) {
      return IATLAS_TIERS.individual;
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
