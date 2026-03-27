'use strict';

/**
 * Tests for backend/routes/teams-resources.js
 *
 * Covers:
 *  - GET /api/teams/access  with session_id, email, and JWT Bearer token
 *  - GET /api/teams/download/:resourceId  authorization checks
 *  - verifyTeamsAccess() with userId (JWT path)
 */

// ── Environment ───────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

// ── Stripe mock ───────────────────────────────────────────────────────────────

const mockStripeSession = { payment_status: 'unpaid', metadata: {} };
jest.mock('../backend/config/stripe', () => ({
    checkout: {
        sessions: {
            retrieve: jest.fn().mockResolvedValue(mockStripeSession),
        },
    },
}));

// ── Purchase model mock ───────────────────────────────────────────────────────

const mockPurchaseFindOne = jest.fn();
jest.mock('../backend/models/Purchase', () => ({
    findOne: mockPurchaseFindOne,
}));

// ── PDF service mock ──────────────────────────────────────────────────────────

jest.mock('../backend/services/teamsResourcePdfService', () => {
    const { EventEmitter } = require('events');
    class FakeDoc extends EventEmitter {
        pipe(dest) {
            // Simulate writing some data and ending the stream
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

// ── App setup ─────────────────────────────────────────────────────────────────

const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

const teamsRouter = require('../backend/routes/teams-resources');

const app = express();
app.use(express.json());
app.use('/api/teams', teamsRouter);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a valid JWT for the given userId. */
function makeToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/** Build a lean() mock from partial purchase fields with chain support (.sort().lean()). */
function purchase(tier) {
    const leanResult = { tier, status: 'completed' };
    const obj = {
        lean: jest.fn().mockResolvedValue(leanResult),
        sort: jest.fn().mockReturnThis(),
    };
    return obj;
}

/** Build a lean() mock that returns null (no purchase) with chain support. */
function noPurchase() {
    const obj = {
        lean: jest.fn().mockResolvedValue(null),
        sort: jest.fn().mockReturnThis(),
    };
    return obj;
}

/** Reset Purchase mock to always return null. */
function resetPurchaseMock() {
    mockPurchaseFindOne.mockReset();
    mockPurchaseFindOne.mockReturnValue(noPurchase());
}

// ── GET /api/teams/access ─────────────────────────────────────────────────────

describe('GET /api/teams/access', () => {
    beforeEach(() => resetPurchaseMock());

    it('returns 400 when no credentials are provided', async () => {
        const res = await request(app).get('/api/teams/access');
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/session_id|email|authenticated/i);
    });

    it('returns { valid: false } when session_id has no matching purchase', async () => {
        const res = await request(app).get('/api/teams/access?session_id=cs_fake');
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(false);
    });

    it('returns { valid: true, tier } when session_id matches a teams purchase', async () => {
        mockPurchaseFindOne.mockReturnValue(purchase('starter'));

        const res = await request(app).get('/api/teams/access?session_id=cs_valid');
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(true);
        expect(res.body.tier).toBe('starter');
    });

    it('returns { valid: true, tier } when email matches a teams purchase', async () => {
        mockPurchaseFindOne.mockReturnValue(purchase('pro'));

        const res = await request(app)
            .get('/api/teams/access?email=buyer@example.com');
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(true);
        expect(res.body.tier).toBe('pro');
    });

    it('returns { valid: true, tier } when valid JWT Bearer token matches a teams purchase', async () => {
        mockPurchaseFindOne.mockReturnValue(purchase('pro'));

        const token = makeToken('user-abc-123');
        const res = await request(app)
            .get('/api/teams/access')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(true);
        expect(res.body.tier).toBe('pro');
    });

    it('returns { valid: false } when JWT Bearer token has no matching purchase', async () => {
        // userId lookup returns null
        mockPurchaseFindOne.mockReturnValue(noPurchase());

        const token = makeToken('user-no-purchase');
        const res = await request(app)
            .get('/api/teams/access')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(false);
    });

    it('returns 400 when JWT token is invalid and no other credentials provided', async () => {
        const res = await request(app)
            .get('/api/teams/access')
            .set('Authorization', 'Bearer invalid.token.here');
        expect(res.status).toBe(400);
    });

    it('returns { valid: false } for non-teams tier purchase via session_id (atlas-premium)', async () => {
        // sessionId path explicitly checks TEAMS_TIERS.has(purchase.tier)
        mockPurchaseFindOne.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue({ tier: 'atlas-premium', status: 'completed' }),
        });

        const res = await request(app).get('/api/teams/access?session_id=cs_individual');
        expect(res.status).toBe(200);
        expect(res.body.valid).toBe(false);
    });
});

// ── GET /api/teams/download/:resourceId ───────────────────────────────────────

describe('GET /api/teams/download/:resourceId', () => {
    beforeEach(() => resetPurchaseMock());

    it('returns 401 when no credentials are provided', async () => {
        const res = await request(app).get('/api/teams/download/workshop-guide-01');
        expect(res.status).toBe(401);
    });

    it('returns 404 for an unknown resource ID', async () => {
        mockPurchaseFindOne.mockReturnValue(purchase('starter'));
        const res = await request(app).get('/api/teams/download/unknown-resource?session_id=cs_valid');
        expect(res.status).toBe(404);
    });

    it('returns 403 when session_id has no matching teams purchase', async () => {
        // First call (by session) returns null, second (by Stripe) rejects, no email fallback
        const res = await request(app).get('/api/teams/download/workshop-guide-01?session_id=cs_nopurchase');
        expect(res.status).toBe(403);
    });

    it('streams PDF when session_id matches a valid teams purchase', async () => {
        mockPurchaseFindOne.mockReturnValue(purchase('starter'));

        const res = await request(app)
            .get('/api/teams/download/workshop-guide-01?session_id=cs_valid');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/pdf/i);
    });

    it('streams PDF when valid JWT Bearer token matches a teams purchase', async () => {
        mockPurchaseFindOne.mockReturnValue(purchase('pro'));

        const token = makeToken('user-pro-123');
        const res = await request(app)
            .get('/api/teams/download/workshop-guide-01')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/pdf/i);
    });

    it('returns 401 when JWT token is invalid and no other credentials provided', async () => {
        const res = await request(app)
            .get('/api/teams/download/workshop-guide-01')
            .set('Authorization', 'Bearer bad.token');
        expect(res.status).toBe(401);
    });
});
