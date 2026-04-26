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
    price: null,
    description: 'Basic IATLAS access',
    features: [],
  },
  individual: {
    name: 'IATLAS Individual',
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
  },
  family: {
    name: 'IATLAS Family',
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
  },
  complete: {
    name: 'IATLAS Complete',
    price: '$99.99/mo',
    description: 'Full curriculum access',
    badge: '🏆',
    color: '#7c3aed',
    features: [
      'Everything in Family',
      'Full curriculum access',
      'Advanced progress analytics',
      'Priority support',
    ],
  },
  practitioner: {
    name: 'IATLAS Practitioner',
    price: '$149/mo',
    description: 'Individual practice',
    badge: '🩺',
    color: '#059669',
    features: [
      'Clinical assessments & session plans',
      'Client resources & worksheets',
      'ABA protocol library',
      'Progress & outcome reports',
      'Individual practice',
    ],
  },
  practice: {
    name: 'IATLAS Practice',
    price: '$399/mo',
    description: 'Group practice',
    badge: '🏥',
    color: '#0369a1',
    features: [
      'Everything in Practitioner',
      'Multi-practitioner access',
      'Group practice management',
      'Team progress dashboard',
    ],
  },
  enterprise: {
    name: 'IATLAS Enterprise',
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
