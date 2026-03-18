'use strict';

/**
 * Tests for backend/routes/upsell.js
 */

// ── Env ───────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET  = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';

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

jest.mock('mongoose', () => {
    class Schema {
        constructor() {}
        pre()   { return this; }
        index() { return this; }
        methods = {};
    }
    Schema.Types = { ObjectId: String, Mixed: {} };
    return {
        connect:    jest.fn().mockResolvedValue({}),
        disconnect: jest.fn().mockResolvedValue({}),
        Types:      { ObjectId: { isValid: jest.fn(() => true) } },
        Schema,
        model:      jest.fn(),
    };
});

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

// ── Stub UpsellEvent model ────────────────────────────────────────────────────

const mockEventId = 'event_001';

jest.mock('../backend/models/UpsellEvent', () => {
    const mockDoc = { _id: 'event_001' };
    const MockUpsellEvent = jest.fn(() => mockDoc);
    MockUpsellEvent.create   = jest.fn().mockResolvedValue(mockDoc);
    MockUpsellEvent.aggregate = jest.fn().mockResolvedValue([]);
    return MockUpsellEvent;
});

// ── App & request helper ──────────────────────────────────────────────────────

const request = require('supertest');
const app     = require('../backend/server');

// ── POST /api/upsell/event ────────────────────────────────────────────────────

describe('POST /api/upsell/event', () => {
    const validPayload = {
        sessionId:  'sess_abc123',
        trigger:    'assessment_complete',
        variant:    'control',
        targetTier: 'atlas-navigator',
        eventType:  'impression',
    };

    test('returns 201 with valid payload', async () => {
        const res = await request(app)
            .post('/api/upsell/event')
            .send(validPayload);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('id');
    });

    test('returns 400 when sessionId is missing', async () => {
        const { sessionId: _omit, ...rest } = validPayload;
        const res = await request(app).post('/api/upsell/event').send(rest);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when trigger is missing', async () => {
        const { trigger: _omit, ...rest } = validPayload;
        const res = await request(app).post('/api/upsell/event').send(rest);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when targetTier is missing', async () => {
        const { targetTier: _omit, ...rest } = validPayload;
        const res = await request(app).post('/api/upsell/event').send(rest);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when eventType is missing', async () => {
        const { eventType: _omit, ...rest } = validPayload;
        const res = await request(app).post('/api/upsell/event').send(rest);
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 500 when model throws', async () => {
        const UpsellEvent = require('../backend/models/UpsellEvent');
        UpsellEvent.create.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).post('/api/upsell/event').send(validPayload);
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

    test('accepts conversion eventType', async () => {
        const res = await request(app)
            .post('/api/upsell/event')
            .send({ ...validPayload, eventType: 'conversion' });
        expect(res.status).toBe(201);
    });

    test('accepts atlas-premium targetTier', async () => {
        const res = await request(app)
            .post('/api/upsell/event')
            .send({ ...validPayload, targetTier: 'atlas-premium' });
        expect(res.status).toBe(201);
    });

    test('accepts optional fields', async () => {
        const res = await request(app)
            .post('/api/upsell/event')
            .send({
                ...validPayload,
                userTier:  'free',
                offerShown: true,
                campaign:  'spring2025',
                pageUrl:   '/results.html',
            });
        expect(res.status).toBe(201);
    });
});

// ── GET /api/upsell/stats ─────────────────────────────────────────────────────

describe('GET /api/upsell/stats', () => {
    test('returns 200 with summary object', async () => {
        const res = await request(app).get('/api/upsell/stats');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('totals');
        expect(res.body).toHaveProperty('conversionRate');
        expect(res.body).toHaveProperty('byTrigger');
        expect(res.body).toHaveProperty('byVariant');
    });

    test('defaults to 30-day window', async () => {
        const res = await request(app).get('/api/upsell/stats');
        expect(res.status).toBe(200);
        expect(res.body.period).toBe('30d');
    });

    test('respects ?days query param', async () => {
        const res = await request(app).get('/api/upsell/stats?days=7');
        expect(res.status).toBe(200);
        expect(res.body.period).toBe('7d');
    });

    test('caps days at 365', async () => {
        const res = await request(app).get('/api/upsell/stats?days=9999');
        expect(res.status).toBe(200);
        expect(res.body.period).toBe('365d');
    });

    test('totals includes all event type keys', async () => {
        const res = await request(app).get('/api/upsell/stats');
        const { totals } = res.body;
        expect(totals).toHaveProperty('impression');
        expect(totals).toHaveProperty('dismiss');
        expect(totals).toHaveProperty('click');
        expect(totals).toHaveProperty('conversion');
    });

    test('conversionRate is zero when no data', async () => {
        const res = await request(app).get('/api/upsell/stats');
        expect(res.body.conversionRate).toBe('0.00%');
    });

    test('returns 500 when aggregate throws', async () => {
        const UpsellEvent = require('../backend/models/UpsellEvent');
        UpsellEvent.aggregate.mockRejectedValueOnce(new Error('DB error'));
        const res = await request(app).get('/api/upsell/stats');
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error');
    });
});
