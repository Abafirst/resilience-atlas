'use strict';

/**
 * tierUtils.test.js
 *
 * Unit tests for backend/utils/tierUtils.js (canAccessFeature, getTierConfig,
 * normalizePlan) and integration tests for the public GET /api/tiers endpoint.
 */

jest.mock('winston', () => {
    const loggerInstance = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        add: jest.fn(),
    };
    return {
        createLogger: jest.fn(() => loggerInstance),
        format: {
            combine: jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors: jest.fn(() => ({})),
            splat: jest.fn(() => ({})),
            json: jest.fn(() => ({})),
            colorize: jest.fn(() => ({})),
            printf: jest.fn((fn) => fn),
        },
        transports: {
            Console: function ConsoleTransport() {},
            File: function FileTransport() {},
        },
    };
});

process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const express = require('express');
const { canAccessFeature, getTierConfig, normalizePlan } = require('../backend/utils/tierUtils');
const { TIER_CONFIG, PLAN_ALIASES } = require('../backend/config/tiers');
const tiersRouter = require('../backend/routes/tiers');

// ── Minimal express app for /api/tiers integration tests ─────────────────────
const app = express();
app.use(express.json());
app.use('/api/tiers', tiersRouter);

// ── TIER_CONFIG shape ─────────────────────────────────────────────────────────

describe('TIER_CONFIG', () => {
    it('exports an object with at least the 7 canonical plan keys', () => {
        const keys = Object.keys(TIER_CONFIG);
        ['free', 'atlas-navigator', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise'].forEach((k) => {
            expect(keys).toContain(k);
        });
    });

    it('every entry has the required display fields', () => {
        for (const [key, tier] of Object.entries(TIER_CONFIG)) {
            expect(typeof tier.name).toBe('string');
            expect(Array.isArray(tier.features)).toBe(true);
            expect(Array.isArray(tier.gates)).toBe(true);
            expect(tier).toHaveProperty('maxUsers');
            expect(tier).toHaveProperty('maxTeams');
            expect(tier).toHaveProperty('billing');
            expect(tier).toHaveProperty('dataRetention');
        }
    });

    it('enterprise has the most permissive gate set', () => {
        const enterpriseGates = TIER_CONFIG['enterprise'].gates;
        for (const gate of ['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks']) {
            expect(enterpriseGates).toContain(gate);
        }
    });

    it('free plan has empty gates array', () => {
        expect(TIER_CONFIG['free'].gates).toEqual([]);
    });
});

// ── PLAN_ALIASES ──────────────────────────────────────────────────────────────

describe('PLAN_ALIASES', () => {
    it('maps teams-starter to starter', () => {
        expect(PLAN_ALIASES['teams-starter']).toBe('starter');
    });

    it('maps teams-pro to pro', () => {
        expect(PLAN_ALIASES['teams-pro']).toBe('pro');
    });
});

// ── normalizePlan ─────────────────────────────────────────────────────────────

describe('normalizePlan()', () => {
    it('returns the plan unchanged when no alias exists', () => {
        expect(normalizePlan('enterprise')).toBe('enterprise');
        expect(normalizePlan('free')).toBe('free');
        expect(normalizePlan('pro')).toBe('pro');
    });

    it('maps teams-starter → starter', () => {
        expect(normalizePlan('teams-starter')).toBe('starter');
    });

    it('maps teams-pro → pro', () => {
        expect(normalizePlan('teams-pro')).toBe('pro');
    });

    it('returns unknown plan unchanged', () => {
        expect(normalizePlan('unknown-plan')).toBe('unknown-plan');
    });
});

// ── canAccessFeature ──────────────────────────────────────────────────────────

describe('canAccessFeature()', () => {
    // free plan
    it('free plan cannot access any feature', () => {
        expect(canAccessFeature('free', 'basic')).toBe(false);
        expect(canAccessFeature('free', 'advanced')).toBe(false);
        expect(canAccessFeature('free', 'webhooks')).toBe(false);
    });

    // starter / teams-starter (canonical key + alias)
    it('starter plan can access basic', () => {
        expect(canAccessFeature('starter', 'basic')).toBe(true);
    });

    it('starter plan cannot access advanced features', () => {
        expect(canAccessFeature('starter', 'advanced')).toBe(false);
        expect(canAccessFeature('starter', 'multi-team')).toBe(false);
        expect(canAccessFeature('starter', 'facilitation')).toBe(false);
        expect(canAccessFeature('starter', 'branding')).toBe(false);
        expect(canAccessFeature('starter', 'webhooks')).toBe(false);
    });

    it('teams-starter alias behaves identically to starter', () => {
        expect(canAccessFeature('teams-starter', 'basic')).toBe(true);
        expect(canAccessFeature('teams-starter', 'advanced')).toBe(false);
    });

    // pro / teams-pro
    it('pro plan can access basic, advanced, multi-team, facilitation', () => {
        expect(canAccessFeature('pro', 'basic')).toBe(true);
        expect(canAccessFeature('pro', 'advanced')).toBe(true);
        expect(canAccessFeature('pro', 'multi-team')).toBe(true);
        expect(canAccessFeature('pro', 'facilitation')).toBe(true);
    });

    it('pro plan cannot access branding or webhooks', () => {
        expect(canAccessFeature('pro', 'branding')).toBe(false);
        expect(canAccessFeature('pro', 'webhooks')).toBe(false);
    });

    it('teams-pro alias behaves identically to pro', () => {
        expect(canAccessFeature('teams-pro', 'advanced')).toBe(true);
        expect(canAccessFeature('teams-pro', 'branding')).toBe(false);
    });

    // enterprise
    it('enterprise plan can access all features', () => {
        for (const gate of ['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks']) {
            expect(canAccessFeature('enterprise', gate)).toBe(true);
        }
    });

    // unknown plan
    it('returns false for unknown plans', () => {
        expect(canAccessFeature('unknown', 'basic')).toBe(false);
        expect(canAccessFeature(undefined, 'basic')).toBe(false);
        expect(canAccessFeature(null, 'basic')).toBe(false);
    });

    // individual features
    it('atlas-navigator can access deep-report', () => {
        expect(canAccessFeature('atlas-navigator', 'deep-report')).toBe(true);
    });

    it('atlas-premium can access deep-report and premium', () => {
        expect(canAccessFeature('atlas-premium', 'deep-report')).toBe(true);
        expect(canAccessFeature('atlas-premium', 'premium')).toBe(true);
    });

    it('business plan can access basic only', () => {
        expect(canAccessFeature('business', 'basic')).toBe(true);
        expect(canAccessFeature('business', 'advanced')).toBe(false);
    });
});

// ── getTierConfig ─────────────────────────────────────────────────────────────

describe('getTierConfig()', () => {
    it('returns the config for a known plan', () => {
        const cfg = getTierConfig('enterprise');
        expect(cfg).not.toBeNull();
        expect(cfg.name).toBe('Atlas Team Enterprise');
    });

    it('resolves aliases before returning config', () => {
        const direct = getTierConfig('pro');
        const alias  = getTierConfig('teams-pro');
        expect(alias).toEqual(direct);
    });

    it('returns null for unknown plans', () => {
        expect(getTierConfig('unknown-plan')).toBeNull();
        expect(getTierConfig(undefined)).toBeNull();
    });
});

// ── GET /api/tiers ────────────────────────────────────────────────────────────

describe('GET /api/tiers', () => {
    it('returns 200 with a tiers object', async () => {
        const res = await request(app).get('/api/tiers');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('tiers');
        expect(typeof res.body.tiers).toBe('object');
    });

    it('includes all canonical plan keys', async () => {
        const res = await request(app).get('/api/tiers');
        const keys = Object.keys(res.body.tiers);
        ['free', 'atlas-navigator', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise'].forEach((k) => {
            expect(keys).toContain(k);
        });
    });

    it('each tier entry has the expected display fields', async () => {
        const res = await request(app).get('/api/tiers');
        for (const [, tier] of Object.entries(res.body.tiers)) {
            expect(tier).toHaveProperty('name');
            expect(tier).toHaveProperty('billing');
            expect(tier).toHaveProperty('features');
            expect(tier).toHaveProperty('dataRetention');
            expect(tier).toHaveProperty('maxUsers');
            expect(tier).toHaveProperty('maxTeams');
        }
    });

    it('does NOT expose internal gates in the response', async () => {
        const res = await request(app).get('/api/tiers');
        for (const [, tier] of Object.entries(res.body.tiers)) {
            expect(tier).not.toHaveProperty('gates');
        }
    });

    it('converts Infinity maxUsers/maxTeams to null for JSON safety', async () => {
        const res = await request(app).get('/api/tiers');
        const enterprise = res.body.tiers['enterprise'];
        expect(enterprise.maxUsers).toBeNull();
        expect(enterprise.maxTeams).toBeNull();
    });

    it('free plan price is 0', async () => {
        const res = await request(app).get('/api/tiers');
        expect(res.body.tiers['free'].price).toBe(0);
    });
});
