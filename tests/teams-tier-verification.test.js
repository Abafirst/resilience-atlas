'use strict';

/**
 * teams-tier-verification.test.js
 *
 * Verifies that the Teams tiers (starter, pro, enterprise) expose the correct
 * feature gates and that plan aliases resolve properly.
 */

jest.mock('winston', () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), add: jest.fn() };
    return {
        createLogger: jest.fn(() => logger),
        format: {
            combine: jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors: jest.fn(() => ({})),
            splat: jest.fn(() => ({})),
            json: jest.fn(() => ({})),
            colorize: jest.fn(() => ({})),
            printf: jest.fn((fn) => fn),
        },
        transports: { Console: function () {}, File: function () {} },
    };
});

process.env.JWT_SECRET = 'test-secret';

const { canAccessFeature, getTierConfig, normalizePlan } = require('../backend/utils/tierUtils');
const { TIER_CONFIG, PLAN_ALIASES } = require('../backend/config/tiers');

describe('Teams Tier Verification', () => {
    describe('PLAN_ALIASES', () => {
        it('maps teams-starter to starter', () => {
            expect(PLAN_ALIASES['teams-starter']).toBe('starter');
        });

        it('maps teams-pro to pro', () => {
            expect(PLAN_ALIASES['teams-pro']).toBe('pro');
        });
    });

    describe('normalizePlan()', () => {
        it('resolves teams-starter to starter', () => {
            expect(normalizePlan('teams-starter')).toBe('starter');
        });

        it('resolves teams-pro to pro', () => {
            expect(normalizePlan('teams-pro')).toBe('pro');
        });

        it('leaves enterprise unchanged', () => {
            expect(normalizePlan('enterprise')).toBe('enterprise');
        });
    });

    describe('Teams starter tier', () => {
        it('starter can access basic features', () => {
            expect(canAccessFeature('starter', 'basic')).toBe(true);
        });

        it('teams-starter alias behaves identically to starter', () => {
            expect(canAccessFeature('teams-starter', 'basic')).toBe(true);
        });

        it('starter cannot access advanced or enterprise features', () => {
            expect(canAccessFeature('starter', 'advanced')).toBe(false);
            expect(canAccessFeature('starter', 'webhooks')).toBe(false);
        });

        it('getTierConfig returns config for starter', () => {
            const cfg = getTierConfig('starter');
            expect(cfg).not.toBeNull();
            expect(cfg.name).toBeDefined();
        });
    });

    describe('Teams pro tier', () => {
        it('pro can access basic and advanced features', () => {
            expect(canAccessFeature('pro', 'basic')).toBe(true);
            expect(canAccessFeature('pro', 'advanced')).toBe(true);
            expect(canAccessFeature('pro', 'multi-team')).toBe(true);
            expect(canAccessFeature('pro', 'facilitation')).toBe(true);
        });

        it('teams-pro alias behaves identically to pro', () => {
            expect(canAccessFeature('teams-pro', 'advanced')).toBe(true);
        });

        it('pro cannot access enterprise-only features', () => {
            expect(canAccessFeature('pro', 'branding')).toBe(false);
            expect(canAccessFeature('pro', 'webhooks')).toBe(false);
        });

        it('getTierConfig returns config for pro', () => {
            const cfg = getTierConfig('pro');
            expect(cfg).not.toBeNull();
            expect(cfg.name).toBeDefined();
        });
    });

    describe('Enterprise tier', () => {
        it('enterprise can access all feature gates', () => {
            for (const gate of ['basic', 'advanced', 'multi-team', 'facilitation', 'branding', 'webhooks']) {
                expect(canAccessFeature('enterprise', gate)).toBe(true);
            }
        });

        it('getTierConfig returns config for enterprise', () => {
            const cfg = getTierConfig('enterprise');
            expect(cfg).not.toBeNull();
            expect(cfg.name).toBe('Atlas Enterprise');
        });
    });

    describe('TIER_CONFIG completeness', () => {
        it('includes starter, pro, and enterprise keys', () => {
            const keys = Object.keys(TIER_CONFIG);
            expect(keys).toContain('starter');
            expect(keys).toContain('pro');
            expect(keys).toContain('enterprise');
        });

        it('every teams tier entry has required fields', () => {
            for (const key of ['starter', 'pro', 'enterprise']) {
                const tier = TIER_CONFIG[key];
                expect(typeof tier.name).toBe('string');
                expect(Array.isArray(tier.features)).toBe(true);
                expect(Array.isArray(tier.gates)).toBe(true);
            }
        });
    });
});
