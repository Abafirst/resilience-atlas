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
        name: 'Atlas Navigator (Lifetime)',
        price: 4999, // $49.99
        billing: 'one-time',
        maxUsers: 1,
        maxTeams: 0,
        features: [
            'Unlimited Full PDF Reports',
            'Unlimited Gamification Access',
            'Unlimited Free Assessment Taking',
            'Full Assessment History',
            'Brief Results Always Free',
        ],
        gates: ['deep-report', 'gamification'],
        dataRetention: 'Unlimited',
        // Human-readable description for pricing pages and unlock modals.
        description: 'One-time $49.99 payment gives lifetime access to unlimited PDF reports, assessments, and gamification.',
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
        features: ['Unlimited users & teams', 'Org-managed custom branding', 'SSO/SAML self-service setup', 'Self-service data export', 'Everything in Premium', 'Self-custody: own your org data'],
        gates: ['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks', 'sso', 'data-export'],
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
