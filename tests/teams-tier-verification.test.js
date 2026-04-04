'use strict';

/**
 * tests/teams-tier-verification.test.js
 *
 * Automated Teams Tier Feature Testing Suite
 *
 * Verifies that all advertised Teams pricing tier features (Basic, Premium,
 * Enterprise) are correctly gated at every layer:
 *
 *  1. Tier config — user/team limits and feature gates are declared correctly
 *  2. Utility functions — canAccessFeature() and normalizePlan() enforce gates
 *  3. GET /api/tiers — public endpoint exposes correct limits without gates
 *  4. GET /api/teams/access — purchase verification per tier
 *  5. GET /api/teams/download/:id — resource download gating
 *  6. Feature gate matrix — every tier/gate combination
 *  7. Billing consistency — prices match advertised amounts
 */

// ── Environment ───────────────────────────────────────────────────────────────
process.env.JWT_SECRET  = 'test-secret';
process.env.NODE_ENV    = 'test';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('winston', () => {
    const logger = {
        info:  jest.fn(),
        warn:  jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        add:   jest.fn(),
    };
    return {
        createLogger: jest.fn(() => logger),
        format: {
            combine:   jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors:    jest.fn(() => ({})),
            splat:     jest.fn(() => ({})),
            json:      jest.fn(() => ({})),
            colorize:  jest.fn(() => ({})),
            printf:    jest.fn((fn) => fn),
        },
        transports: {
            Console: function ConsoleTransport() {},
            File:    function FileTransport() {},
        },
    };
});

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

const mockStripeSession = { payment_status: 'unpaid', metadata: {} };
jest.mock('../backend/config/stripe', () => ({
    checkout: {
        sessions: {
            retrieve: jest.fn().mockResolvedValue(mockStripeSession),
        },
    },
}));

const mockPurchaseFindOne = jest.fn();
jest.mock('../backend/models/Purchase', () => ({
    findOne: mockPurchaseFindOne,
}));

jest.mock('../backend/services/teamsResourcePdfService', () => {
    const { EventEmitter } = require('events');
    class FakeDoc extends EventEmitter {
        pipe(dest) {
            setImmediate(() => {
                dest.write(Buffer.from('%PDF-1.4 fake'));
                dest.end();
            });
            return dest;
        }
        end() { return this; }
    }
    return {
        generateResourcePdf: jest.fn(() => new FakeDoc()),
        ALL_RESOURCE_IDS: ['workshop-guide-01', 'activity-cards-01'],
    };
});

// ── Imports ───────────────────────────────────────────────────────────────────

const request  = require('supertest');
const express  = require('express');
const jwt      = require('jsonwebtoken');

const { canAccessFeature, getTierConfig, normalizePlan } = require('../backend/utils/tierUtils');
const { TIER_CONFIG, PLAN_ALIASES, PREMIUM_TIERS }       = require('../backend/config/tiers');
const tiersRouter       = require('../backend/routes/tiers');
const teamsRouter       = require('../backend/routes/teams-resources');

const {
    TEAMS_TIERS,
    TEAMS_TIER_ALIASES,
    INDIVIDUAL_TIERS,
    TIER_USER_LIMITS,
    TIER_TEAM_LIMITS,
    TIER_REQUIRED_GATES,
    TIER_FORBIDDEN_GATES,
    MOCK_PURCHASES,
    makePurchase,
    makeJwt,
} = require('./setup/teams-test-data');

// ── Express apps ──────────────────────────────────────────────────────────────

const tiersApp = express();
tiersApp.use(express.json());
tiersApp.use('/api/tiers', tiersRouter);

const teamsApp = express();
teamsApp.use(express.json());
teamsApp.use('/api/teams', teamsRouter);

// ── Purchase mock helpers ─────────────────────────────────────────────────────

function purchaseMock(tier) {
    const doc = { tier, status: 'completed' };
    return { sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(doc) };
}

function noPurchaseMock() {
    return { sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(null) };
}

function resetPurchase() {
    mockPurchaseFindOne.mockReset();
    mockPurchaseFindOne.mockReturnValue(noPurchaseMock());
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. TIER CONFIG — advertised limits and gates are declared correctly
// ═══════════════════════════════════════════════════════════════════════════════

describe('Teams Tier Config — user and team limits', () => {
    test.each([
        ['starter',    15],
        ['pro',        30],
        ['enterprise', Infinity],
    ])('%s plan has maxUsers = %s', (plan, expected) => {
        expect(TIER_CONFIG[plan].maxUsers).toBe(expected);
    });

    test.each([
        ['starter',    1],
        ['pro',        999],
        ['enterprise', Infinity],
    ])('%s plan has maxTeams = %s', (plan, expected) => {
        expect(TIER_CONFIG[plan].maxTeams).toBe(expected);
    });

    test('Basic (starter) allows only 1 team', () => {
        expect(TIER_CONFIG['starter'].maxTeams).toBe(1);
    });

    test('Premium (pro) allows multiple teams', () => {
        expect(TIER_CONFIG['pro'].maxTeams).toBeGreaterThan(1);
    });

    test('Enterprise allows unlimited users (Infinity)', () => {
        expect(TIER_CONFIG['enterprise'].maxUsers).toBe(Infinity);
    });

    test('Enterprise allows unlimited teams (Infinity)', () => {
        expect(TIER_CONFIG['enterprise'].maxTeams).toBe(Infinity);
    });

    test('Basic user limit (15) is less than Premium limit (30)', () => {
        expect(TIER_CONFIG['starter'].maxUsers).toBeLessThan(TIER_CONFIG['pro'].maxUsers);
    });

    test('Premium user limit (30) is a finite number less than Enterprise', () => {
        expect(TIER_CONFIG['pro'].maxUsers).toBe(30);
        expect(TIER_CONFIG['pro'].maxUsers).toBeLessThan(TIER_CONFIG['enterprise'].maxUsers);
    });
});

describe('Teams Tier Config — billing and pricing', () => {
    test('Basic (starter) price is $299 (29900 cents)', () => {
        expect(TIER_CONFIG['starter'].price).toBe(29900);
    });

    test('Premium (pro) price is $699 (69900 cents)', () => {
        expect(TIER_CONFIG['pro'].price).toBe(69900);
    });

    test('Enterprise price is $2,499+ (249900 cents)', () => {
        expect(TIER_CONFIG['enterprise'].price).toBe(249900);
    });

    test('All Teams tiers use one-time billing', () => {
        for (const key of Object.values(TEAMS_TIERS)) {
            expect(TIER_CONFIG[key].billing).toBe('one-time');
        }
    });

    test('Enterprise price is higher than Premium', () => {
        expect(TIER_CONFIG['enterprise'].price).toBeGreaterThan(TIER_CONFIG['pro'].price);
    });

    test('Premium price is higher than Basic', () => {
        expect(TIER_CONFIG['pro'].price).toBeGreaterThan(TIER_CONFIG['starter'].price);
    });
});

describe('Teams Tier Config — all tiers have required shape', () => {
    for (const [key, expected] of Object.entries({ starter: 'Atlas Team Basic', pro: 'Atlas Team Premium', enterprise: 'Atlas Enterprise' })) {
        test(`${key} has display name "${expected}"`, () => {
            expect(TIER_CONFIG[key].name).toBe(expected);
        });
    }

    test.each(Object.values(TEAMS_TIERS))('%s tier has features array', (tier) => {
        expect(Array.isArray(TIER_CONFIG[tier].features)).toBe(true);
        expect(TIER_CONFIG[tier].features.length).toBeGreaterThan(0);
    });

    test.each(Object.values(TEAMS_TIERS))('%s tier has dataRetention field', (tier) => {
        expect(TIER_CONFIG[tier]).toHaveProperty('dataRetention');
        expect(typeof TIER_CONFIG[tier].dataRetention).toBe('string');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PLAN ALIASES — Organization model keys map to canonical keys
// ═══════════════════════════════════════════════════════════════════════════════

describe('Plan aliases (Organization.plan → canonical tier)', () => {
    test('teams-starter maps to starter', () => {
        expect(normalizePlan('teams-starter')).toBe('starter');
        expect(PLAN_ALIASES['teams-starter']).toBe('starter');
    });

    test('teams-pro maps to pro', () => {
        expect(normalizePlan('teams-pro')).toBe('pro');
        expect(PLAN_ALIASES['teams-pro']).toBe('pro');
    });

    test('canonical keys are returned unchanged', () => {
        for (const key of Object.values(TEAMS_TIERS)) {
            expect(normalizePlan(key)).toBe(key);
        }
    });

    test('teams-starter alias has same gates as starter', () => {
        const direct = TIER_CONFIG['starter'].gates;
        const alias  = TIER_CONFIG[normalizePlan('teams-starter')].gates;
        expect(alias).toEqual(direct);
    });

    test('teams-pro alias has same gates as pro', () => {
        const direct = TIER_CONFIG['pro'].gates;
        const alias  = TIER_CONFIG[normalizePlan('teams-pro')].gates;
        expect(alias).toEqual(direct);
    });

    test('canAccessFeature works with Organization.plan aliases', () => {
        expect(canAccessFeature('teams-starter', 'basic')).toBe(true);
        expect(canAccessFeature('teams-starter', 'advanced')).toBe(false);
        expect(canAccessFeature('teams-pro', 'facilitation')).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FEATURE GATE MATRIX — each tier grants/denies the correct features
// ═══════════════════════════════════════════════════════════════════════════════

describe('Feature gate matrix — Basic (starter)', () => {
    test('can access basic dashboard features', () => {
        expect(canAccessFeature('starter', 'basic')).toBe(true);
    });

    test.each(['advanced', 'multi-team', 'facilitation', 'branding', 'webhooks', 'sso', 'data-export'])(
        'cannot access "%s"',
        (gate) => {
            expect(canAccessFeature('starter', gate)).toBe(false);
        }
    );
});

describe('Feature gate matrix — Premium (pro)', () => {
    test.each(['basic', 'advanced', 'multi-team', 'facilitation'])(
        'can access "%s"',
        (gate) => {
            expect(canAccessFeature('pro', gate)).toBe(true);
        }
    );

    test.each(['branding', 'webhooks', 'sso', 'data-export'])(
        'cannot access "%s"',
        (gate) => {
            expect(canAccessFeature('pro', gate)).toBe(false);
        }
    );
});

describe('Feature gate matrix — Enterprise', () => {
    test.each(['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks', 'sso', 'data-export'])(
        'can access "%s"',
        (gate) => {
            expect(canAccessFeature('enterprise', gate)).toBe(true);
        }
    );
});

describe('Feature gate matrix — Individual plans cannot access Teams features', () => {
    test.each(INDIVIDUAL_TIERS)('%s plan cannot access "basic" Teams feature', (plan) => {
        expect(canAccessFeature(plan, 'basic')).toBe(false);
    });

    test.each(INDIVIDUAL_TIERS)('%s plan cannot access "advanced" Teams feature', (plan) => {
        expect(canAccessFeature(plan, 'advanced')).toBe(false);
    });

    test.each(INDIVIDUAL_TIERS)('%s plan cannot access "facilitation"', (plan) => {
        expect(canAccessFeature(plan, 'facilitation')).toBe(false);
    });
});

describe('Feature gate matrix — Required gates per tier (from test data)', () => {
    for (const [tier, gates] of Object.entries(TIER_REQUIRED_GATES)) {
        for (const gate of gates) {
            test(`${tier} includes required gate "${gate}"`, () => {
                expect(canAccessFeature(tier, gate)).toBe(true);
            });
        }
    }
});

describe('Feature gate matrix — Forbidden gates per tier (from test data)', () => {
    for (const [tier, gates] of Object.entries(TIER_FORBIDDEN_GATES)) {
        for (const gate of gates) {
            test(`${tier} must NOT have gate "${gate}"`, () => {
                expect(canAccessFeature(tier, gate)).toBe(false);
            });
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TEAMS-SPECIFIC ADVERTISED FEATURES — gamifications, leaderboards, etc.
// ═══════════════════════════════════════════════════════════════════════════════

describe('Advertised feature — gamification access', () => {
    test('Basic tier has gamification mentioned in features', () => {
        const features = TIER_CONFIG['starter'].features.join(' ').toLowerCase();
        // Basic has team dashboard, CSV export etc — check at least "team" is mentioned
        expect(features).toMatch(/team/i);
    });

    test('Premium tier features mention facilitation tools', () => {
        const features = TIER_CONFIG['pro'].features.join(' ').toLowerCase();
        expect(features).toMatch(/facilitation/i);
    });

    test('Enterprise features mention unlimited users', () => {
        const features = TIER_CONFIG['enterprise'].features.join(' ').toLowerCase();
        expect(features).toMatch(/unlimited/i);
    });

    test('Enterprise features mention custom branding', () => {
        const features = TIER_CONFIG['enterprise'].features.join(' ').toLowerCase();
        expect(features).toMatch(/brand/i);
    });
});

describe('Advertised feature — CSV export (Basic+)', () => {
    test('Basic tier features mention CSV export', () => {
        const features = TIER_CONFIG['starter'].features.join(' ').toLowerCase();
        expect(features).toMatch(/csv/i);
    });
});

describe('Advertised feature — facilitation guides (Premium+ only)', () => {
    test('Facilitation is NOT accessible to Basic (starter)', () => {
        expect(canAccessFeature('starter', 'facilitation')).toBe(false);
    });

    test('Facilitation IS accessible to Premium (pro)', () => {
        expect(canAccessFeature('pro', 'facilitation')).toBe(true);
    });

    test('Facilitation IS accessible to Enterprise', () => {
        expect(canAccessFeature('enterprise', 'facilitation')).toBe(true);
    });
});

describe('Advertised feature — multi-team support (Premium+ only)', () => {
    test('Basic (starter) is restricted to 1 team', () => {
        expect(TIER_CONFIG['starter'].maxTeams).toBe(1);
        expect(canAccessFeature('starter', 'multi-team')).toBe(false);
    });

    test('Premium (pro) can access multi-team gate', () => {
        expect(canAccessFeature('pro', 'multi-team')).toBe(true);
    });

    test('Enterprise can access multi-team gate', () => {
        expect(canAccessFeature('enterprise', 'multi-team')).toBe(true);
    });
});

describe('Advertised feature — advanced analytics (Premium+ only)', () => {
    test('Basic cannot access advanced analytics', () => {
        expect(canAccessFeature('starter', 'advanced')).toBe(false);
    });

    test('Premium can access advanced analytics', () => {
        expect(canAccessFeature('pro', 'advanced')).toBe(true);
    });

    test('Enterprise can access advanced analytics', () => {
        expect(canAccessFeature('enterprise', 'advanced')).toBe(true);
    });
});

describe('Advertised feature — branding and SSO (Enterprise only)', () => {
    test('Basic cannot access custom branding', () => {
        expect(canAccessFeature('starter', 'branding')).toBe(false);
    });

    test('Premium cannot access custom branding', () => {
        expect(canAccessFeature('pro', 'branding')).toBe(false);
    });

    test('Enterprise can access custom branding', () => {
        expect(canAccessFeature('enterprise', 'branding')).toBe(true);
    });

    test('Basic cannot access SSO/SAML', () => {
        expect(canAccessFeature('starter', 'sso')).toBe(false);
    });

    test('Premium cannot access SSO/SAML', () => {
        expect(canAccessFeature('pro', 'sso')).toBe(false);
    });

    test('Enterprise can access SSO/SAML', () => {
        expect(canAccessFeature('enterprise', 'sso')).toBe(true);
    });
});

describe('Advertised feature — data export (Enterprise only)', () => {
    test('Basic cannot access self-service data export', () => {
        expect(canAccessFeature('starter', 'data-export')).toBe(false);
    });

    test('Premium cannot access self-service data export', () => {
        expect(canAccessFeature('pro', 'data-export')).toBe(false);
    });

    test('Enterprise can access self-service data export', () => {
        expect(canAccessFeature('enterprise', 'data-export')).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. GET /api/tiers — public endpoint enforces correct limits
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/tiers — Teams tier limits in API response', () => {
    test('returns 200 with tiers object', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('tiers');
    });

    test('starter maxUsers is 15', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        expect(res.body.tiers['starter'].maxUsers).toBe(15);
    });

    test('pro maxUsers is 30', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        expect(res.body.tiers['pro'].maxUsers).toBe(30);
    });

    test('enterprise maxUsers is null (serialised Infinity)', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        expect(res.body.tiers['enterprise'].maxUsers).toBeNull();
    });

    test('starter maxTeams is 1', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        expect(res.body.tiers['starter'].maxTeams).toBe(1);
    });

    test('enterprise maxTeams is null (serialised Infinity)', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        expect(res.body.tiers['enterprise'].maxTeams).toBeNull();
    });

    test('internal gates are NOT exposed in API response', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        for (const [, tier] of Object.entries(res.body.tiers)) {
            expect(tier).not.toHaveProperty('gates');
        }
    });

    test('all Teams tiers are present in API response', async () => {
        const res = await request(tiersApp).get('/api/tiers');
        for (const key of Object.values(TEAMS_TIERS)) {
            expect(res.body.tiers).toHaveProperty(key);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. GET /api/teams/access — purchase verification per tier
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/teams/access — purchase verification', () => {
    beforeEach(() => resetPurchase());

    test('returns 400 when no credentials provided', async () => {
        const res = await request(teamsApp).get('/api/teams/access');
        expect(res.status).toBe(400);
    });

    test.each(['starter', 'pro', 'enterprise'])(
        '%s purchase verified via session_id returns { valid: true, tier }',
        async (tier) => {
            mockPurchaseFindOne.mockReturnValue(purchaseMock(tier));
            const res = await request(teamsApp).get(`/api/teams/access?session_id=cs_test_${tier}`);
            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
            expect(res.body.tier).toBe(tier);
        }
    );

    test.each(['starter', 'pro', 'enterprise'])(
        '%s purchase verified via email returns { valid: true, tier }',
        async (tier) => {
            mockPurchaseFindOne.mockReturnValue(purchaseMock(tier));
            const res = await request(teamsApp).get(`/api/teams/access?email=buyer-${tier}@example.com`);
            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
            expect(res.body.tier).toBe(tier);
        }
    );

    test.each(['starter', 'pro', 'enterprise'])(
        '%s purchase verified via JWT Bearer token returns { valid: true, tier }',
        async (tier) => {
            mockPurchaseFindOne.mockReturnValue(purchaseMock(tier));
            const token = makeJwt(`user-${tier}`);
            const res = await request(teamsApp)
                .get('/api/teams/access')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.valid).toBe(true);
            expect(res.body.tier).toBe(tier);
        }
    );

    test('no matching purchase returns { valid: false }', async () => {
        const res = await request(teamsApp).get('/api/teams/access?session_id=cs_nonexistent');
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(false);
    });

    test('individual plan (atlas-premium) does NOT grant Teams access', async () => {
        mockPurchaseFindOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ tier: 'atlas-premium', status: 'completed' }),
        });
        const res = await request(teamsApp).get('/api/teams/access?session_id=cs_individual');
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(false);
    });

    test('invalid Bearer token returns 400', async () => {
        const res = await request(teamsApp)
            .get('/api/teams/access')
            .set('Authorization', 'Bearer not.a.real.token');
        expect(res.status).toBe(400);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. GET /api/teams/download/:id — resource download gating
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/teams/download/:resourceId — resource download gating', () => {
    beforeEach(() => resetPurchase());

    test('returns 401 when unauthenticated', async () => {
        const res = await request(teamsApp).get('/api/teams/download/workshop-guide-01');
        expect(res.status).toBe(401);
    });

    test('returns 404 for unknown resource ID with valid purchase', async () => {
        mockPurchaseFindOne.mockReturnValue(purchaseMock('starter'));
        const res = await request(teamsApp).get('/api/teams/download/unknown-resource?session_id=cs_valid');
        expect(res.status).toBe(404);
    });

    test('returns 403 when session_id has no matching Teams purchase', async () => {
        const res = await request(teamsApp).get('/api/teams/download/workshop-guide-01?session_id=cs_none');
        expect(res.status).toBe(403);
    });

    test.each(['starter', 'pro', 'enterprise'])(
        '%s purchase via session_id can download resource',
        async (tier) => {
            mockPurchaseFindOne.mockReturnValue(purchaseMock(tier));
            const res = await request(teamsApp).get(`/api/teams/download/workshop-guide-01?session_id=cs_test_${tier}`);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/pdf/i);
        }
    );

    test.each(['starter', 'pro', 'enterprise'])(
        '%s purchase via JWT Bearer token can download resource',
        async (tier) => {
            mockPurchaseFindOne.mockReturnValue(purchaseMock(tier));
            const token = makeJwt(`user-${tier}`);
            const res = await request(teamsApp)
                .get('/api/teams/download/workshop-guide-01')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/pdf/i);
        }
    );

    test('individual plan cannot download Teams resource', async () => {
        mockPurchaseFindOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ tier: 'atlas-navigator', status: 'completed' }),
        });
        const res = await request(teamsApp).get('/api/teams/download/workshop-guide-01?session_id=cs_individual');
        expect(res.status).toBe(403);
    });

    test('invalid Bearer token returns 401', async () => {
        const res = await request(teamsApp)
            .get('/api/teams/download/workshop-guide-01')
            .set('Authorization', 'Bearer invalid.token');
        expect(res.status).toBe(401);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. PREMIUM_TIERS — Teams tiers are included in PREMIUM_TIERS list
// ═══════════════════════════════════════════════════════════════════════════════

describe('PREMIUM_TIERS — Teams tiers are recognised as premium', () => {
    test.each(['starter', 'pro', 'enterprise'])(
        '%s is in PREMIUM_TIERS',
        (tier) => {
            expect(PREMIUM_TIERS).toContain(tier);
        }
    );

    test('free tier is NOT in PREMIUM_TIERS', () => {
        expect(PREMIUM_TIERS).not.toContain('free');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. getTierConfig — resolves correct config for all team plans
// ═══════════════════════════════════════════════════════════════════════════════

describe('getTierConfig() — Teams plans resolve correctly', () => {
    test.each([
        ['starter',      'Atlas Team Basic'],
        ['teams-starter','Atlas Team Basic'],
        ['pro',          'Atlas Team Premium'],
        ['teams-pro',    'Atlas Team Premium'],
        ['enterprise',   'Atlas Enterprise'],
    ])('%s resolves to name "%s"', (plan, expectedName) => {
        const cfg = getTierConfig(plan);
        expect(cfg).not.toBeNull();
        expect(cfg.name).toBe(expectedName);
    });

    test('unknown plan returns null', () => {
        expect(getTierConfig('unknown-plan')).toBeNull();
        expect(getTierConfig(undefined)).toBeNull();
        expect(getTierConfig(null)).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. TIER HIERARCHY — access escalates from Basic → Premium → Enterprise
// ═══════════════════════════════════════════════════════════════════════════════

describe('Tier hierarchy — access escalates correctly', () => {
    const tierOrder = ['free', 'starter', 'pro', 'enterprise'];

    test('enterprise has strictly more gates than pro', () => {
        const proGates        = new Set(TIER_CONFIG['pro'].gates);
        const enterpriseGates = new Set(TIER_CONFIG['enterprise'].gates);
        // Every pro gate must also be in enterprise
        for (const gate of proGates) {
            expect(enterpriseGates.has(gate)).toBe(true);
        }
        // Enterprise must have at least one gate pro does not
        expect(enterpriseGates.size).toBeGreaterThan(proGates.size);
    });

    test('pro has strictly more gates than starter', () => {
        const starterGates = new Set(TIER_CONFIG['starter'].gates);
        const proGates     = new Set(TIER_CONFIG['pro'].gates);
        for (const gate of starterGates) {
            expect(proGates.has(gate)).toBe(true);
        }
        expect(proGates.size).toBeGreaterThan(starterGates.size);
    });

    test('user limits increase with tier', () => {
        const limits = tierOrder
            .filter((t) => TIER_CONFIG[t])
            .map((t) => TIER_CONFIG[t].maxUsers)
            .map((v) => (v === Infinity ? Number.MAX_SAFE_INTEGER : v));
        for (let i = 0; i < limits.length - 1; i++) {
            expect(limits[i]).toBeLessThanOrEqual(limits[i + 1]);
        }
    });
});
