'use strict';

/**
 * tests/resilience-upgrade.test.js
 *
 * Integration tests for the asynchronous report generation flow.
 * All external dependencies (MongoDB, Redis, email) are mocked.
 */

// ── Environment ───────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';
// REDIS_URL intentionally NOT set — tests the graceful fallback path.

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

jest.mock('mongoose', () => {
    const m = {
        connect: jest.fn().mockResolvedValue({}),
        Schema: class Schema {
            constructor() {}
            pre() { return this; }
            index() { return this; }
            methods = {};
            static Types = { ObjectId: String };
        },
        model: jest.fn().mockReturnValue({}),
        connection: { readyState: 1 },
    };
    m.Schema.Types = { ObjectId: String };
    return m;
});

const mockUser = {
    _id: 'user001',
    username: 'testuser',
    email: 'test@example.com',
    quizResults: [],
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
};

jest.mock('../backend/models/User', () => {
    const MockUser = jest.fn().mockImplementation(() => mockUser);
    MockUser.findOne = jest.fn().mockResolvedValue(null);
    MockUser.findById = jest.fn().mockResolvedValue(mockUser);
    MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
    MockUser.countDocuments = jest.fn().mockResolvedValue(0);
    MockUser.find = jest.fn().mockResolvedValue([]);
    return MockUser;
});

const mockReport = {
    _id: 'report001',
    userId: 'user001',
    resultsHash: 'abc123',
    reportText: 'Sample report text',
    pdfUrl: 'data:application/pdf;base64,FAKE',
    status: 'ready',
    createdAt: new Date(),
};

jest.mock('../backend/models/ResilienceReport', () => {
    const MockReport = jest.fn().mockImplementation(() => mockReport);
    MockReport.findOne = jest.fn().mockResolvedValue(null);
    MockReport.findOneAndUpdate = jest.fn().mockResolvedValue(mockReport);
    return MockReport;
});

jest.mock('stripe', () => {
    const MockStripe = function () {
        return {
            paymentIntents: {
                create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test', status: 'requires_payment_method' }),
                retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
            },
            customers: { create: jest.fn().mockResolvedValue({ id: 'cus_test' }) },
            webhooks: {
                constructEvent: jest.fn().mockReturnValue({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_test' } } }),
            },
        };
    };
    return MockStripe;
});

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    })),
}));

jest.mock('jsonwebtoken', () => {
    const real = jest.requireActual('jsonwebtoken');
    return { ...real, sign: real.sign, verify: real.verify };
});

// Mock the queue so tests don't need Redis.
jest.mock('../queue/reportQueue', () => ({
    addReportJob: jest.fn().mockResolvedValue(null),
    getReportQueue: jest.fn().mockReturnValue(null),
    QUEUE_NAME: 'reportGeneration',
}));

// ── Test setup ────────────────────────────────────────────────────────────────

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../backend/server');
const { addReportJob } = require('../queue/reportQueue');
const ResilienceReport = require('../backend/models/ResilienceReport');

function authToken() {
    return jwt.sign(
        { id: mockUser._id, userId: mockUser._id, username: mockUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// ── Tests: POST /api/quiz/submit (async path) ─────────────────────────────────

describe('POST /api/quiz/submit — async report generation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const User = require('../backend/models/User');
        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        ResilienceReport.findOneAndUpdate.mockResolvedValue(mockReport);
    });

    test('returns 401 without authentication', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .send({ answers: Array(72).fill(3) });
        expect(res.status).toBe(401);
    });

    test('returns 400 when answers array is wrong length', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: [1, 2, 3] });
        expect(res.status).toBe(400);
    });

    test('returns 200 immediately with scores on valid submission', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(4) });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'submitted');
        expect(res.body).toHaveProperty('scores');
        expect(res.body).toHaveProperty('overall');
        expect(res.body).toHaveProperty('dominantType');
        expect(res.body).toHaveProperty('resultsHash');
    });

    test('enqueues a report generation job', async () => {
        await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(4) });

        expect(addReportJob).toHaveBeenCalledTimes(1);
        const jobPayload = addReportJob.mock.calls[0][0];
        expect(jobPayload).toHaveProperty('userId');
        expect(jobPayload).toHaveProperty('scores');
        expect(jobPayload).toHaveProperty('resultsHash');
    });

    test('still returns 200 even when queue is unavailable (graceful fallback)', async () => {
        addReportJob.mockResolvedValueOnce(null); // Simulate queue down

        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(3) });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'submitted');
    });

    test('response includes all six category scores', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(5) });

        expect(res.status).toBe(200);
        const { scores } = res.body;
        const expectedKeys = ['Agentic-Generative', 'Relational-Connective', 'Spiritual-Reflective', 'Emotional-Adaptive', 'Somatic-Regulative', 'Cognitive-Narrative'];
        for (const key of expectedKeys) {
            expect(scores).toHaveProperty(key);
        }
    });
});

// ── Tests: GET /api/report/status ────────────────────────────────────────────

describe('GET /api/report/status', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 401 without authentication', async () => {
        const res = await request(app)
            .get('/api/report/status?hash=abc123');
        expect(res.status).toBe(401);
    });

    test('returns 400 when hash is missing', async () => {
        const res = await request(app)
            .get('/api/report/status')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(400);
    });

    test('returns 404 when report not found', async () => {
        ResilienceReport.findOne.mockResolvedValueOnce(null);
        const res = await request(app)
            .get('/api/report/status?hash=nonexistent')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('status', 'not_found');
    });

    test('returns status "pending" when report is pending', async () => {
        ResilienceReport.findOne.mockResolvedValueOnce({ status: 'pending' });
        const res = await request(app)
            .get('/api/report/status?hash=abc123')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'pending');
    });

    test('returns status "ready" when report is ready', async () => {
        ResilienceReport.findOne.mockResolvedValueOnce({ status: 'ready' });
        const res = await request(app)
            .get('/api/report/status?hash=abc123')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ready');
    });
});

// ── Tests: GET /api/report/:hash ──────────────────────────────────────────────

describe('GET /api/report/:hash', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns 401 without authentication', async () => {
        const res = await request(app).get('/api/report/abc123');
        expect(res.status).toBe(401);
    });

    test('returns 404 when report not found', async () => {
        ResilienceReport.findOne.mockResolvedValueOnce(null);
        const res = await request(app)
            .get('/api/report/nonexistent')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(404);
    });

    test('returns 202 when report is not yet ready', async () => {
        ResilienceReport.findOne.mockResolvedValueOnce({ status: 'pending' });
        const res = await request(app)
            .get('/api/report/abc123')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(202);
        expect(res.body).toHaveProperty('status', 'pending');
    });

    test('returns 200 with report content when ready', async () => {
        ResilienceReport.findOne.mockResolvedValueOnce(mockReport);
        const res = await request(app)
            .get('/api/report/abc123')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ready');
        expect(res.body).toHaveProperty('reportText', 'Sample report text');
        expect(res.body).toHaveProperty('pdfUrl');
    });
});

// ── Tests: reportService ──────────────────────────────────────────────────────

describe('reportService', () => {
    const { buildResultsHash, generateNarrativeReport, generatePDFReport } =
        require('../backend/services/reportService');
    const { calculateResilienceScores } = require('../backend/scoring');

    const sampleScores = calculateResilienceScores(Array(72).fill(4));

    test('buildResultsHash returns a 64-char hex string', () => {
        const hash = buildResultsHash(sampleScores);
        expect(typeof hash).toBe('string');
        expect(hash).toHaveLength(64);
    });

    test('buildResultsHash is deterministic for identical scores', () => {
        const h1 = buildResultsHash(sampleScores);
        const h2 = buildResultsHash(sampleScores);
        expect(h1).toBe(h2);
    });

    test('buildResultsHash differs for different scores', () => {
        const otherScores = calculateResilienceScores(Array(72).fill(1));
        expect(buildResultsHash(sampleScores)).not.toBe(buildResultsHash(otherScores));
    });

    test('generateNarrativeReport returns non-empty string', () => {
        const text = generateNarrativeReport(sampleScores);
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(50);
        expect(text).toContain('Your Resilience Landscape');
    });

    test('generatePDFReport returns a Buffer', async () => {
        const buf = await generatePDFReport(sampleScores, 'Alice');
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.length).toBeGreaterThan(0);
    });
});
