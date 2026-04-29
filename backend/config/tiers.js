'use strict';

/**
 * backend/config/tiers.js — Canonical SaaS tier configuration.
 *
 * All plan features and limits are governed by this file.
 * Never hardcode plan logic — import and reference this single source.
 *
 * This config is display-only for price/feature marketing data.
 * All Stripe price/payment logic remains in payments.js and env.
 *
 * Keys used by the Organization model plan field:
 *   free | business | teams-starter | teams-pro | teams-enterprise | enterprise
 *
 * Keys used by the Stripe checkout flow (payments.js TIERS):
 *   atlas-navigator | atlas-premium | starter | pro
 *
 * PLAN_ALIASES maps the org-model prefixed keys → checkout keys so that
 * canAccessFeature() (in backend/utils/tierUtils.js) works with both.
 */

/**
 * Full tier configuration — the single source of truth for plan names,
 * display prices, user/team limits, user-facing feature lists, and internal
 * feature gates used by canAccessFeature().
 *
 * `price`  — amount in cents (matches TIERS[key].amount in payments.js).
 * `gates`  — internal feature-gate strings consumed by canAccessFeature().
 *            DO NOT expose gates in the public /api/tiers response.
 */
const TIER_CONFIG = {
    'free': {
        name: 'Free',
        price: 0,
        billing: 'free',
        maxUsers: 1,
        maxTeams: 0,
        features: ['Basic assessment', 'Individual results', 'Radar chart'],
        gates: [],
        dataRetention: '1 month',
    },
    'atlas-starter': {
        name: 'Atlas Starter',
        price: 999, // $9.99
        billing: 'one-time',
        maxUsers: 1,
        maxTeams: 0,
        features: [
            'Full PDF Report (1 report per purchase)',
            'Gamification Access (when report unlocked)',
            'Assessment History',
            'Unlimited Free Assessment Taking',
            'Brief Results Always Free',
        ],
        gates: ['basic-report'],
        dataRetention: 'Unlimited',
        // Human-readable description for pricing pages and unlock modals.
        description: 'Unlock one full PDF report and gamification access. Pay $9.99 for each new report you want to download.',
    },
    'atlas-navigator': {
        name: 'Atlas Navigator',
        price: 4999, // $49.99
        billing: 'one-time',
        maxUsers: 1,
        maxTeams: 0,
        features: [
            'PDF Report: 1 every 30 days (per user)',
            'Full Gamification Access',
            'Unlimited Free Assessment Taking',
            'Full Assessment History',
            'Brief Results Always Free',
        ],
        gates: ['deep-report', 'gamification'],
        dataRetention: 'Unlimited',
        // Human-readable description for pricing pages and unlock modals.
        description: 'One-time $49.99 payment. Generate 1 full PDF report every 30 days, plus full gamification access.',
    },
    'atlas-premium': {
        name: 'Atlas Premium',
        price: 4999, // $49.99
        billing: 'one-time',
        maxUsers: 1,
        maxTeams: 0,
        features: ['All Deep Report features', 'Lifetime access', 'Unlimited reassessments'],
        gates: ['deep-report', 'premium'],
        dataRetention: 'Unlimited',
    },
    'business': {
        name: 'Business',
        price: null, // Custom pricing
        billing: 'custom',
        maxUsers: 25,
        maxTeams: 1,
        features: ['Team analytics', 'Member results', 'Admin dashboard'],
        gates: ['basic'],
        dataRetention: '1 year',
    },
    'starter': {
        name: 'Atlas Team Basic',
        price: 29900, // $299 one-time
        billing: 'one-time',
        maxUsers: 15,
        maxTeams: 1,
        features: ['Team dashboard', 'Basic reports', 'CSV export', '1 team'],
        gates: ['basic'],
        dataRetention: '1 year',
    },
    'pro': {
        name: 'Atlas Team Premium',
        price: 69900, // $699 one-time
        billing: 'one-time',
        maxUsers: 30,
        maxTeams: 999,
        features: ['Advanced analytics', 'Facilitation tools', 'Multiple teams', 'Auto-generated reports'],
        gates: ['basic', 'advanced', 'multi-team', 'facilitation'],
        dataRetention: '3 years',
    },
    'enterprise': {
        name: 'Atlas Enterprise',
        price: 249900, // Starting at $2,499 one-time
        billing: 'one-time',
        maxUsers: Infinity,
        maxTeams: Infinity,
        features: ['Unlimited users & teams', 'Org-managed custom branding', 'SSO/SAML available on request', 'Self-service data export', 'Everything in Premium', 'Self-custody: own your org data', 'Full Gamification Suite'],
        gates: ['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks', 'sso', 'data-export', 'org-gamification'],
        // 'webhooks' gate retained for backward-compatibility with existing feature checks
        dataRetention: 'Self-managed (export anytime)',
    },
};

/**
 * Aliases from Organization.plan enum values to TIER_CONFIG keys.
 * The Organization model uses prefixed keys ('teams-starter', 'teams-pro', 'teams-enterprise')
 * while the Stripe checkout flow uses short keys ('starter', 'pro', 'enterprise').
 */
const PLAN_ALIASES = {
    'teams-starter':    'starter',
    'teams-pro':        'pro',
    'teams-enterprise': 'enterprise',
};

/**
 * Tiers that grant access to premium features (PDF report, gamification, etc.).
 * Includes both individual paid tiers and all Teams tiers.
 *
 * Used by report.js and gamification.js to verify purchases.
 * Always use this constant rather than hardcoding tier names in route handlers.
 */
const PREMIUM_TIERS = [
    'atlas-starter',
    'atlas-navigator',
    'atlas-premium',
    'starter',
    'pro',
    'enterprise',
    'teams-starter',
    'teams-pro',
    'teams-enterprise',
];

module.exports = { TIER_CONFIG, PLAN_ALIASES, PREMIUM_TIERS };

// ── IATLAS product tier configuration ────────────────────────────────────────
//
// IATLAS is a separate product line from Atlas (assessment/teams).
// Stripe price IDs are read from environment variables to avoid hard-coding
// secrets; set them in .env / Railway environment settings.
//
//   STRIPE_IATLAS_INDIVIDUAL_PRICE_ID
//   STRIPE_IATLAS_FAMILY_PRICE_ID
//   STRIPE_IATLAS_COMPLETE_PRICE_ID
//   STRIPE_IATLAS_PRACTITIONER_PRICE_ID
//   STRIPE_IATLAS_PRACTICE_PRICE_ID
//
// Enterprise is negotiated offline — no Stripe price ID is needed.

const IATLAS_TIER_CONFIG = {
  individual: {
    name:         'IATLAS Individual',
    price:        1999,   // $19.99/mo in cents
    billing:      'monthly',
    stripePriceId: process.env.STRIPE_IATLAS_INDIVIDUAL_PRICE_ID || null,
    maxProfiles:  1,
    features: [
      'All kids games & activities',
      'IATLAS curriculum (all ages)',
      'Progress tracking',
      'Printable resources',
      '1 child profile',
    ],
  },
  family: {
    name:         'IATLAS Family',
    price:        3999,   // $39.99/mo in cents
    billing:      'monthly',
    stripePriceId: process.env.STRIPE_IATLAS_FAMILY_PRICE_ID || null,
    maxProfiles:  5,
    recommended:  true,
    features: [
      'Everything in Individual',
      'Caregiver resources & parent guides',
      'Shared progress dashboard',
      'Family challenge activities',
    ],
  },
  complete: {
    name:         'IATLAS Complete',
    price:        9999,   // $99.99/mo in cents
    billing:      'monthly',
    stripePriceId: process.env.STRIPE_IATLAS_COMPLETE_PRICE_ID || null,
    maxProfiles:  5,
    comingSoon:   true,
    features: [
      'Everything in Family',
      'Full curriculum access (49 modules)',
      'Advanced progress analytics',
      'Priority support (launching Q3 2026)',
      'Downloadable resources (launching Q3 2026)',
    ],
  },
  practitioner: {
    name:         'IATLAS Practitioner',
    price:        14900,  // $149/mo in cents
    billing:      'monthly',
    stripePriceId: process.env.STRIPE_IATLAS_PRACTITIONER_PRICE_ID || null,
    maxProfiles:  5,
    comingSoon:   true,
    features: [
      'Clinical assessments & session plans',
      'ABA Protocol Library',
      'Client resources (launching Q3 2026)',
      'Progress & outcome reports',
      'Professional development content',
    ],
  },
  practice: {
    name:         'IATLAS Practice',
    price:        39900,  // $399/mo in cents
    billing:      'monthly',
    stripePriceId: process.env.STRIPE_IATLAS_PRACTICE_PRICE_ID || null,
    maxProfiles:  5,
    comingSoon:   true,
    features: [
      'Everything in Practitioner',
      'Multi-practitioner access',
      'Group practice management',
      'Team progress dashboard',
    ],
  },
  enterprise: {
    name:         'IATLAS Enterprise',
    price:        null,   // Custom — negotiated offline
    billing:      'custom',
    stripePriceId: null,
    maxProfiles:  Infinity,
    comingSoon:   false,
    features: [
      'Everything in Practice',
      'Custom onboarding',
      'Dedicated support',
      'Custom integrations',
    ],
  },
};

const IATLAS_PRIORITY_TIERS = ['complete', 'practitioner', 'practice', 'enterprise'];

const IATLAS_PROFESSIONAL_TIERS = ['practitioner', 'practice', 'enterprise'];

module.exports.IATLAS_TIER_CONFIG     = IATLAS_TIER_CONFIG;
module.exports.IATLAS_PRIORITY_TIERS  = IATLAS_PRIORITY_TIERS;
module.exports.IATLAS_PROFESSIONAL_TIERS = IATLAS_PROFESSIONAL_TIERS;
