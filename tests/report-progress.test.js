'use strict';

/**
 * Tests for the report progress/polling endpoints:
 *   GET /api/report/generate — starts async PDF generation, returns a hash
 *   GET /api/report/status  — returns job progress by hash
 *   GET /api/report/download?hash=... — serves the ready PDF by hash
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

jest.mock('mongoose', () => {
    class Schema {
        constructor() {}
        pre() { return this; }
        index() { return this; }
        methods = {};
    }
    Schema.Types = { ObjectId: String, Mixed: {} };
    return {
        connect: jest.fn().mockResolvedValue({}),
        Schema,
        model: jest.fn(),
    };
});

jest.mock('../backend/models/Purchase', () => ({
    create: jest.fn().mockResolvedValue({ _id: 'purchase001' }),
    findOne: jest.fn().mockResolvedValue(null),
    find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort:   jest.fn().mockReturnThis(),
        lean:   jest.fn().mockResolvedValue([]),
    }),
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

// Mock puppeteer so tests don't try to launch a browser.
jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setContent: jest.fn().mockResolvedValue(undefined),
            pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
        }),
        close: jest.fn().mockResolvedValue(undefined),
    }),
}));

// Mock all other models referenced by server.js routes.
jest.mock('../backend/models/User', () => {
    const MockUser = jest.fn().mockImplementation(() => ({}));
    MockUser.findOne = jest.fn().mockResolvedValue(null);
    MockUser.findById = jest.fn().mockResolvedValue(null);
    MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
    MockUser.countDocuments = jest.fn().mockResolvedValue(0);
    MockUser.find = jest.fn().mockResolvedValue([]);
    return MockUser;
});
jest.mock('../backend/models/ResilienceResult', () => ({
    create: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0),
}));
jest.mock('../backend/models/PracticeCompletion', () => ({
    create: jest.fn().mockResolvedValue({ _id: 'comp001' }),
    find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }) }),
    countDocuments: jest.fn().mockResolvedValue(0),
}));
jest.mock('stripe', () => function Stripe() {
    return {
        paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
        customers: { create: jest.fn() },
        checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
        webhooks: { constructEvent: jest.fn() },
    };
});
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }) })),
}));

const request = require('supertest');

// Remove STRIPE_SECRET_KEY so tier-gating is bypassed in tests.
delete process.env.STRIPE_SECRET_KEY;
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';

const app = require('../backend/server');
const { jobStore, buildJobHash } = require('../backend/routes/report');

const SAMPLE_SCORES = JSON.stringify({
    'Agentic-Generative': { raw: 24, max: 30, percentage: 80 },
    'Relational':          { raw: 18, max: 30, percentage: 60 },
});

// ── /api/report/generate ─────────────────────────────────────────────────────

describe('GET /api/report/generate', () => {
    afterEach(() => jobStore.clear());

    test('returns 400 when overall is missing', async () => {
        const res = await request(app)
            .get('/api/report/generate')
            .query({ scores: SAMPLE_SCORES });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when scores is missing', async () => {
        const res = await request(app)
            .get('/api/report/generate')
            .query({ overall: '75' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 200 with a hash when params are valid', async () => {
        const res = await request(app)
            .get('/api/report/generate')
            .query({ overall: '75', dominantType: 'Relational', scores: SAMPLE_SCORES });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('hash');
        expect(typeof res.body.hash).toBe('string');
        expect(res.body.hash.length).toBeGreaterThan(0);
    });

    test('returns same hash for identical params (idempotent)', async () => {
        const params = { overall: '75', dominantType: 'Relational', scores: SAMPLE_SCORES };
        const res1 = await request(app).get('/api/report/generate').query(params);
        const res2 = await request(app).get('/api/report/generate').query(params);
        expect(res1.status).toBe(200);
        expect(res2.status).toBe(200);
        expect(res1.body.hash).toBe(res2.body.hash);
    });

    test('creates a job in the store with pending or processing status', async () => {
        const params = { overall: '80', dominantType: 'Agentic-Generative', scores: SAMPLE_SCORES };
        const res = await request(app).get('/api/report/generate').query(params);
        expect(res.status).toBe(200);
        const hash = res.body.hash;
        const job = jobStore.get(hash);
        expect(job).toBeDefined();
        expect(['pending', 'processing']).toContain(job.status);
    });

    test('returns 402 when STRIPE_SECRET_KEY is set and no email is provided', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const res = await request(app)
            .get('/api/report/generate')
            .query({ overall: '75', scores: SAMPLE_SCORES });
        expect(res.status).toBe(402);
        expect(res.body).toHaveProperty('upgradeRequired', true);
        delete process.env.STRIPE_SECRET_KEY;
    });

    test('returns 402 with upgradeRequired=true when email provided but no purchase', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const Purchase = require('../backend/models/Purchase');
        Purchase.find.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([]), // no Purchase records
        });
        const User = require('../backend/models/User');
        User.findOne.mockResolvedValueOnce(null); // no User record
        const res = await request(app)
            .get('/api/report/generate')
            .query({ overall: '75', scores: SAMPLE_SCORES, email: 'test@example.com' });
        expect(res.status).toBe(402);
        expect(res.body).toHaveProperty('upgradeRequired', true);
        expect(res.body.error).toMatch(/paid report purchase/i);
        delete process.env.STRIPE_SECRET_KEY;
    });

    test('returns 402 for the first assessment when no purchase exists (no "first assessment free")', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const Purchase = require('../backend/models/Purchase');
        Purchase.find.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([]), // no purchases — first assessment is NOT free
        });
        const User = require('../backend/models/User');
        User.findOne.mockResolvedValueOnce(null);
        const res = await request(app)
            .get('/api/report/generate')
            .query({ overall: '75', scores: SAMPLE_SCORES, email: 'newuser@example.com' });
        // In the new model every assessment requires a purchase — there is no free first assessment.
        expect(res.status).toBe(402);
        expect(res.body).toHaveProperty('upgradeRequired', true);
        delete process.env.STRIPE_SECRET_KEY;
    });

    test('returns 200 when STRIPE_SECRET_KEY is set and email has an active atlas-navigator purchase', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const Purchase = require('../backend/models/Purchase');
        const purchaseDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        Purchase.find.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([
                { tier: 'atlas-navigator', status: 'completed', purchasedAt: purchaseDate, createdAt: purchaseDate },
            ]),
        });
        const res = await request(app)
            .get('/api/report/generate')
            .query({ overall: '75', scores: SAMPLE_SCORES, email: 'paid@example.com' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('hash');
        delete process.env.STRIPE_SECRET_KEY;
    });
});

// ── /api/report/status ───────────────────────────────────────────────────────

describe('GET /api/report/status', () => {
    afterEach(() => jobStore.clear());

    test('returns 400 when hash is missing', async () => {
        const res = await request(app).get('/api/report/status');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 404 for an unknown hash', async () => {
        const res = await request(app).get('/api/report/status').query({ hash: 'nonexistent' });
        expect(res.status).toBe(404);
    });

    test('returns job data for a known hash', async () => {
        const hash = 'testhash123';
        jobStore.set(hash, {
            status: 'processing',
            progress: 50,
            message: 'Building layout…',
            estimatedSeconds: 5,
            createdAt: new Date(),
            startedAt: new Date(),
            completedAt: null,
            error: null,
            pdfBuffer: null,
        });

        const res = await request(app).get('/api/report/status').query({ hash });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('processing');
        expect(res.body.progress).toBe(50);
        expect(res.body.message).toBe('Building layout…');
        expect(res.body).not.toHaveProperty('pdfBuffer'); // buffer must NOT be exposed
    });

    test('returns ready status and 100% progress for a completed job', async () => {
        const hash = 'readyhash456';
        jobStore.set(hash, {
            status: 'ready',
            progress: 100,
            message: 'Your report is ready!',
            estimatedSeconds: 0,
            createdAt: new Date(),
            startedAt: new Date(),
            completedAt: new Date(),
            error: null,
            pdfBuffer: Buffer.from('%PDF-1.4 mock'),
        });

        const res = await request(app).get('/api/report/status').query({ hash });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
        expect(res.body.progress).toBe(100);
    });

    test('returns failed status when job failed', async () => {
        const hash = 'failedhash789';
        jobStore.set(hash, {
            status: 'failed',
            progress: 0,
            message: 'Report generation failed.',
            estimatedSeconds: 0,
            createdAt: new Date(),
            startedAt: new Date(),
            completedAt: new Date(),
            error: 'Puppeteer crash',
            pdfBuffer: null,
        });

        const res = await request(app).get('/api/report/status').query({ hash });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('failed');
        expect(res.body.error).toBe('Puppeteer crash');
    });
});

// ── /api/report/download (hash mode) ─────────────────────────────────────────

describe('GET /api/report/download (hash mode)', () => {
    afterEach(() => jobStore.clear());

    test('returns 404 for unknown hash', async () => {
        const res = await request(app).get('/api/report/download').query({ hash: 'unknown' });
        expect(res.status).toBe(404);
    });

    test('returns 409 when job is still processing', async () => {
        const hash = 'processinghash';
        jobStore.set(hash, {
            status: 'processing',
            progress: 50,
            message: 'Generating…',
            estimatedSeconds: 5,
            createdAt: new Date(),
            startedAt: new Date(),
            completedAt: null,
            error: null,
            pdfBuffer: null,
        });

        const res = await request(app).get('/api/report/download').query({ hash });
        expect(res.status).toBe(409);
    });

    test('returns PDF when job is ready', async () => {
        const hash = 'readydownloadhash';
        const mockPdf = Buffer.from('%PDF-1.4 mock content');
        jobStore.set(hash, {
            status: 'ready',
            progress: 100,
            message: 'Your report is ready!',
            estimatedSeconds: 0,
            createdAt: new Date(),
            startedAt: new Date(),
            completedAt: new Date(),
            error: null,
            pdfBuffer: mockPdf,
        });

        const res = await request(app).get('/api/report/download').query({ hash });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });
});

// ── buildJobHash helper ───────────────────────────────────────────────────────

describe('buildJobHash', () => {
    test('returns a string', () => {
        expect(typeof buildJobHash('75', 'Relational', SAMPLE_SCORES)).toBe('string');
    });

    test('is deterministic for identical inputs', () => {
        const h1 = buildJobHash('75', 'Relational', SAMPLE_SCORES);
        const h2 = buildJobHash('75', 'Relational', SAMPLE_SCORES);
        expect(h1).toBe(h2);
    });

    test('differs for different inputs', () => {
        const h1 = buildJobHash('75', 'Relational', SAMPLE_SCORES);
        const h2 = buildJobHash('80', 'Agentic-Generative', SAMPLE_SCORES);
        expect(h1).not.toBe(h2);
    });

    test('returns a 32-character hex string', () => {
        const h = buildJobHash('75', 'Relational', SAMPLE_SCORES);
        expect(h).toMatch(/^[0-9a-f]{32}$/);
    });
});

// ── /api/report/access ────────────────────────────────────────────────────────

describe('GET /api/report/access', () => {
    const Purchase = require('../backend/models/Purchase');
    const User     = require('../backend/models/User');

    afterEach(() => {
        delete process.env.STRIPE_SECRET_KEY;
        jest.clearAllMocks();
    });

    test('returns 400 when email is missing', async () => {
        const res = await request(app).get('/api/report/access');
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body.hasAccess).toBe(false);
    });

    test('returns hasAccess=true with empty purchases in dev mode (no STRIPE_SECRET_KEY)', async () => {
        delete process.env.STRIPE_SECRET_KEY;
        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'user@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(true);
        expect(res.body.hasActiveAccess).toBe(true);
        expect(Array.isArray(res.body.purchases)).toBe(true);
    });

    test('returns hasAccess=false when STRIPE_SECRET_KEY is set and no purchase exists', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        Purchase.findOne = jest.fn().mockResolvedValue(null);
        // find() returns a chainable that resolves to []
        Purchase.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([]),
        });
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue(null),
        });

        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'nopurchase@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(false);
        expect(res.body.hasActiveAccess).toBe(false);
        expect(res.body.purchases).toHaveLength(0);
    });

    test('returns hasAccess=true and hasActiveAccess=true for atlas-navigator (permanent)', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const mockPurchase = {
            tier: 'atlas-navigator',
            purchasedAt: new Date('2024-06-01'),
            createdAt:   new Date('2024-06-01'),
        };
        Purchase.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([mockPurchase]),
        });

        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'buyer@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(true);
        expect(res.body.hasActiveAccess).toBe(true);
        expect(res.body.purchases).toHaveLength(1);
        expect(res.body.purchases[0].tier).toBe('atlas-navigator');
        expect(res.body.purchases[0].isExpired).toBe(false);
    });

    test('returns hasActiveAccess=true for a recent atlas-starter purchase (within 30 days)', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago — within 30-day window
        const mockPurchase = {
            tier: 'atlas-starter',
            purchasedAt: recentDate,
            createdAt:   recentDate,
        };
        Purchase.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([mockPurchase]),
        });

        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'starter@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(true);
        expect(res.body.hasActiveAccess).toBe(true);
        expect(res.body.purchases[0].isExpired).toBe(false);
    });

    test('returns hasAccess=true AND hasActiveAccess=true even for an old atlas-starter purchase (no expiry in new model)', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
        const mockPurchase = {
            tier: 'atlas-starter',
            purchasedAt: oldDate,
            createdAt:   oldDate,
        };
        Purchase.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([mockPurchase]),
        });

        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'old-starter@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(true);
        // All purchases are now permanent — no expiry in the new access model.
        expect(res.body.hasActiveAccess).toBe(true);
        expect(res.body.purchases[0].isExpired).toBe(false);
    });

    test('returns hasAccess=true via User fallback when purchasedDeepReport flag is set', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        Purchase.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([]),
        });
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue({
                purchasedDeepReport: true,
                atlasPremium: false,
                purchaseDate: new Date('2024-05-01'),
            }),
        });

        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'legacy@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(true);
        expect(res.body.hasActiveAccess).toBe(true);
        expect(res.body.purchases).toHaveLength(1);
        expect(res.body.purchases[0].tier).toBe('atlas-navigator');
    });

    test('returns hasAccess=true via User fallback when atlasPremium flag is set', async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
        Purchase.find = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            sort:   jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue([]),
        });
        User.findOne = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean:   jest.fn().mockResolvedValue({
                purchasedDeepReport: false,
                atlasPremium: true,
                purchaseDate: null,
            }),
        });

        const res = await request(app)
            .get('/api/report/access')
            .query({ email: 'premium@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.hasAccess).toBe(true);
        expect(res.body.hasActiveAccess).toBe(true);
        expect(res.body.purchases[0].tier).toBe('atlas-premium');
    });
});

// ── Access control unit tests (replaces isPurchaseActive) ────────────────────
// The new access model makes ALL purchases permanent (no expiry).
// atlas-navigator/atlas-premium/Teams tiers grant blanket access.
// atlas-starter grants per-assessment access (hash match).

describe('access control - BLANKET_ACCESS_TIERS', () => {
    const report = require('../backend/routes/report');

    test('buildJobHash is exported', () => {
        expect(typeof report.buildJobHash).toBe('function');
    });

    test('buildJobHash produces consistent output', () => {
        const h1 = report.buildJobHash('75', 'Cognitive-Narrative', '{"a":1}');
        const h2 = report.buildJobHash('75', 'Cognitive-Narrative', '{"a":1}');
        expect(h1).toBe(h2);
        expect(h1).toHaveLength(32); // MD5 hex
    });

    test('buildJobHash differs when inputs differ', () => {
        const h1 = report.buildJobHash('75', 'Cognitive-Narrative', '{"a":1}');
        const h2 = report.buildJobHash('80', 'Cognitive-Narrative', '{"a":1}');
        expect(h1).not.toBe(h2);
    });
});
