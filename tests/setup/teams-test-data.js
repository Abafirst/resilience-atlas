'use strict';

/**
 * tests/setup/teams-test-data.js
 *
 * Shared test fixtures for Teams tier verification tests.
 *
 * Provides pre-built mock organisations, users, and purchase records
 * for each supported tier so individual test files can import them
 * instead of duplicating setup logic.
 */

// ── Tier definitions (mirrors backend/config/tiers.js) ───────────────────────

/** Canonical Teams tier keys and their display names */
const TEAMS_TIERS = {
    STARTER:    'starter',
    PRO:        'pro',
    ENTERPRISE: 'enterprise',
};

/** Org-model aliases (Organization.plan field) for Teams tiers */
const TEAMS_TIER_ALIASES = {
    'teams-starter': 'starter',
    'teams-pro':     'pro',
};

/** Non-teams individual plan keys — must NOT unlock team features */
const INDIVIDUAL_TIERS = ['free', 'atlas-starter', 'atlas-navigator', 'atlas-premium'];

/**
 * Expected user limits per tier (maxUsers in TIER_CONFIG).
 * Infinity is represented as null in the public /api/tiers response.
 */
const TIER_USER_LIMITS = {
    starter:    15,
    pro:        30,
    enterprise: Infinity,
};

/**
 * Expected team limits per tier (maxTeams in TIER_CONFIG).
 * Infinity is represented as null in the public /api/tiers response.
 */
const TIER_TEAM_LIMITS = {
    starter:    1,
    pro:        999,
    enterprise: Infinity,
};

/**
 * Feature gates that each tier must include.
 * Used to assert canAccessFeature() correctness.
 */
const TIER_REQUIRED_GATES = {
    starter: ['basic'],
    pro:     ['basic', 'advanced', 'multi-team', 'facilitation'],
    enterprise: ['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks', 'sso', 'data-export'],
};

/**
 * Feature gates that must NOT be accessible to a given tier.
 */
const TIER_FORBIDDEN_GATES = {
    starter:    ['advanced', 'multi-team', 'facilitation', 'branding', 'webhooks', 'sso', 'data-export'],
    pro:        ['branding', 'webhooks', 'sso', 'data-export'],
    enterprise: [], // enterprise can access everything
};

// ── Mock purchase records ─────────────────────────────────────────────────────

/** Build a mock completed Purchase document for the given tier. */
function makePurchase(tier, overrides = {}) {
    return {
        _id:             `purchase-${tier}-001`,
        userId:          `user-${tier}-001`,
        stripeSessionId: `cs_test_${tier}_session`,
        email:           `buyer-${tier}@example.com`,
        tier,
        status:          'completed',
        purchasedAt:     new Date('2025-01-01T00:00:00Z'),
        ...overrides,
    };
}

const MOCK_PURCHASES = {
    starter:    makePurchase('starter'),
    pro:        makePurchase('pro'),
    enterprise: makePurchase('enterprise'),
};

// ── Mock organisation records ─────────────────────────────────────────────────

/** Build a mock Organisation document for the given plan. */
function makeOrganization(plan, overrides = {}) {
    const isoAlias = plan.startsWith('teams-') ? plan.replace('teams-', '') : plan;
    const maxUsers  = { starter: 15, pro: 30, enterprise: null }[isoAlias] ?? null;
    const maxTeams  = { starter: 1,  pro: 999, enterprise: null }[isoAlias] ?? null;

    return {
        _id:      `org-${plan}-001`,
        name:     `Test Org (${plan})`,
        adminEmail: `admin-${plan}@example.com`,
        plan,
        maxUsers,
        maxTeams,
        members:  [],
        ...overrides,
    };
}

const MOCK_ORGANIZATIONS = {
    starter:      makeOrganization('starter'),
    pro:          makeOrganization('pro'),
    enterprise:   makeOrganization('enterprise'),
    teamsStarter: makeOrganization('teams-starter'),
    teamsPro:     makeOrganization('teams-pro'),
};

// ── Mock user records ─────────────────────────────────────────────────────────

/** Build an array of N mock user objects. */
function makeUsers(count, prefix = 'user') {
    return Array.from({ length: count }, (_, i) => ({
        _id:   `${prefix}-${String(i + 1).padStart(3, '0')}`,
        email: `${prefix}${i + 1}@example.com`,
        name:  `Test User ${i + 1}`,
    }));
}

// ── Stripe-session mocks ──────────────────────────────────────────────────────

/** Build a mock Stripe checkout session for the given tier. */
function makeStripeSession(tier, paymentStatus = 'paid') {
    return {
        id:             `cs_test_${tier}_session`,
        payment_status: paymentStatus,
        metadata:       { tier },
        customer_email: `buyer-${tier}@example.com`,
    };
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

/**
 * Sign a test JWT for the given userId using the test secret.
 * Requires JWT_SECRET to be set (jest.setup.js sets JWT_TEST_SECRET but not JWT_SECRET;
 * individual test files should set process.env.JWT_SECRET = 'test-secret' themselves).
 */
function makeJwt(userId) {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
    TEAMS_TIERS,
    TEAMS_TIER_ALIASES,
    INDIVIDUAL_TIERS,
    TIER_USER_LIMITS,
    TIER_TEAM_LIMITS,
    TIER_REQUIRED_GATES,
    TIER_FORBIDDEN_GATES,
    MOCK_PURCHASES,
    MOCK_ORGANIZATIONS,
    makePurchase,
    makeOrganization,
    makeUsers,
    makeStripeSession,
    makeJwt,
};
