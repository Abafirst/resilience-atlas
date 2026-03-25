'use strict';

/**
 * backend/utils/tierUtils.js — Utility helpers for SaaS plan feature gating.
 *
 * All plan features and limits are governed by backend/config/tiers.js.
 * Never hardcode plan logic — import and reference that single source.
 *
 * This module is display-only for feature checks.
 * All Stripe price/payment logic remains in payments.js and env.
 */

const { TIER_CONFIG, PLAN_ALIASES } = require('../config/tiers');

/**
 * Normalize a plan key, handling aliases from the Organization model's plan
 * enum (e.g. 'teams-starter') to the canonical TIER_CONFIG key ('starter').
 *
 * @param {string} plan
 * @returns {string} Canonical TIER_CONFIG key
 */
function normalizePlan(plan) {
    return PLAN_ALIASES[plan] || plan;
}

/**
 * Check whether a given plan includes access to the named feature gate.
 *
 * Feature gate names correspond to the `gates` arrays in TIER_CONFIG and are
 * internal identifiers — they are not user-facing strings.
 *
 * Supported gate names:
 *   'basic'        — base team features (dashboard, CSV export)
 *   'advanced'     — advanced analytics (distribution, trends, benchmarks)
 *   'multi-team'   — multiple sub-team management
 *   'facilitation' — action plans, workshop guides, discussion prompts
 *   'branding'     — custom logo/brand colors on dashboard & reports
 *   'webhooks'     — webhook event system
 *   'deep-report'  — individual deep report PDF
 *   'premium'      — atlas premium features (lifetime, unlimited reassessments)
 *
 * @param {string} plan        — org.plan value (e.g. 'teams-starter', 'pro')
 * @param {string} featureName — gate name from the list above
 * @returns {boolean}
 */
function canAccessFeature(plan, featureName) {
    const key = normalizePlan(plan);
    const config = TIER_CONFIG[key];
    if (!config) return false;
    return config.gates.includes(featureName);
}

/**
 * Return the full TIER_CONFIG entry for a given plan, or null if unknown.
 * Handles plan aliases transparently.
 *
 * @param {string} plan
 * @returns {object|null}
 */
function getTierConfig(plan) {
    const key = normalizePlan(plan);
    return TIER_CONFIG[key] || null;
}

module.exports = { canAccessFeature, getTierConfig, normalizePlan };
