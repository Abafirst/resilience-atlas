'use strict';

/**
 * Resilience Atlas — unit and integration tests
 *
 * Tests for:
 *   - ResilienceAssessment model schema
 *   - Evolution tracking engine (services/evolution.js)
 *   - Pattern detection and report generation (services/reportGenerator.js)
 *   - Share card generator (services/shareCardGenerator.js)
 *   - Atlas API endpoints (routes/atlas.js)
 *   - Share API endpoints (routes/share.js)
 *   - Updated quiz submission flow (routes/quiz.js)
 */

// ── Environment ───────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret-atlas';
process.env.MONGODB_URI = 'mongodb://localhost/test-atlas';

// ── Mock winston ──────────────────────────────────────────────────────────────
jest.mock('winston', () => {
    const logger = {
        info:  jest.fn(),
        warn:  jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        add:   jest.fn(),
    };
    return {
        createLogger:  jest.fn(() => logger),
        format: {
            combine:   jest.fn((...a) => a),
            timestamp: jest.fn(() => ({})),
            errors:    jest.fn(() => ({})),
            splat:     jest.fn(() => ({})),
            json:      jest.fn(() => ({})),
            colorize:  jest.fn(() => ({})),
            printf:    jest.fn((fn) => fn),
        },
        transports: {
            Console: function ConsoleTransport() {},
            File:    function FileTransport()    {},
        },
    };
});

// ── Mock mongoose ─────────────────────────────────────────────────────────────
jest.mock('mongoose', () => {
    const m = {
        connect: jest.fn().mockResolvedValue({}),
        Schema: class Schema {
            constructor() {}
            pre()   { return this; }
            index() { return this; }
            methods = {};
            static Types = { ObjectId: String };
        },
        model: jest.fn(),
        Types: { ObjectId: String },
    };
    m.Schema.Types = { ObjectId: String };
    return m;
});

// ── Mock ResilienceAssessment ─────────────────────────────────────────────────
const mockAssessmentDoc = {
    _id:           'assessment001',
    userId:        'user001',
    overall:       75,
    dominantType:  'emotional',
    assessmentDate: new Date('2026-01-01'),
    scores: {
        emotional: 80, mental: 70, physical: 65,
        social: 75,    spiritual: 60, financial: 55,
    },
    save: jest.fn().mockResolvedValue({ _id: 'assessment001' }),
};

jest.mock('../backend/models/ResilienceAssessment', () => {
    const MockAssessment = jest.fn().mockImplementation(() => mockAssessmentDoc);
    MockAssessment.findOne = jest.fn().mockImplementation(() => ({
        sort:  jest.fn().mockReturnThis(),
        lean:  jest.fn().mockResolvedValue(mockAssessmentDoc),
    }));
    MockAssessment.find = jest.fn().mockImplementation(() => ({
        sort:  jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean:  jest.fn().mockResolvedValue([mockAssessmentDoc]),
    }));
    MockAssessment.findById = jest.fn().mockResolvedValue(mockAssessmentDoc);
    return MockAssessment;
});

// ── Mock User ─────────────────────────────────────────────────────────────────
const mockUser = {
    _id:      'user001',
    username: 'atlasuser',
    email:    'atlas@example.com',
    quizResults: [],
    toJSON: jest.fn(function () { return { _id: this._id, username: this.username }; }),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
};

jest.mock('../backend/models/User', () => {
    const MockUser = jest.fn().mockImplementation(() => mockUser);
    MockUser.findOne          = jest.fn().mockResolvedValue(null);
    MockUser.findById         = jest.fn().mockResolvedValue(mockUser);
    MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
    MockUser.countDocuments   = jest.fn().mockResolvedValue(0);
    MockUser.find             = jest.fn().mockResolvedValue([]);
    return MockUser;
});

// ── Mock Stripe ───────────────────────────────────────────────────────────────
jest.mock('stripe', () => function MockStripe() {
    return {
        paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
        customers:      { create: jest.fn() },
        webhooks:       { constructEvent: jest.fn() },
    };
});

// ── Mock nodemailer ───────────────────────────────────────────────────────────
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
    })),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../backend/server');

function authToken() {
    return jwt.sign(
        { userId: mockUser._id, username: mockUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

// =============================================================================
// 1. Evolution tracking engine
// =============================================================================

describe('calculateEvolution', () => {
    const { calculateEvolution, calculateDirection, angleToBearing } = require('../backend/services/evolution');

    const current = {
        categories: { emotional: 80, mental: 70, physical: 65, social: 75, spiritual: 60, financial: 55 },
        overall:    68,
        dominantType: 'emotional',
    };

    test('returns isFirstAssessment=true when no previous exists', () => {
        const result = calculateEvolution(current, null);
        expect(result.isFirstAssessment).toBe(true);
        expect(result.overallChange).toBeNull();
        expect(result.interpretation).toContain('first point');
    });

    test('calculates correct changes when previous exists', () => {
        const previous = {
            scores:  { emotional: 70, mental: 60, physical: 65, social: 65, spiritual: 55, financial: 50 },
            overall: 60,
        };
        const result = calculateEvolution(current, previous);
        expect(result.isFirstAssessment).toBe(false);
        expect(result.overallChange).toBe(8); // 68 - 60
        expect(result.changes.emotional).toBe(10); // 80 - 70
        expect(result.changes.mental).toBe(10);    // 70 - 60
        expect(result.changes.physical).toBe(0);   // 65 - 65
    });

    test('direction has primary (compass bearing) and magnitude', () => {
        const previous = {
            scores:  { emotional: 70, mental: 60, physical: 65, social: 65, spiritual: 55, financial: 50 },
            overall: 60,
        };
        const result = calculateEvolution(current, previous);
        expect(result.direction).toHaveProperty('primary');
        expect(result.direction).toHaveProperty('magnitude');
        const validBearings = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        expect(validBearings).toContain(result.direction.primary);
        expect(result.direction.magnitude).toBeGreaterThanOrEqual(0);
        expect(result.direction.magnitude).toBeLessThanOrEqual(10);
    });

    test('angleToBearing maps degrees to correct bearings', () => {
        expect(angleToBearing(0)).toBe('N');
        expect(angleToBearing(45)).toBe('NE');
        expect(angleToBearing(90)).toBe('E');
        expect(angleToBearing(180)).toBe('S');
        expect(angleToBearing(270)).toBe('W');
    });

    test('calculateDirection returns N with zero magnitude when no change', () => {
        const noChange = { emotional: 0, mental: 0, physical: 0, social: 0, spiritual: 0, financial: 0 };
        const dir = calculateDirection(noChange);
        expect(dir.magnitude).toBe(0);
    });

    test('generateInterpretation is included in evolution result', () => {
        const previous = {
            scores:  { emotional: 70, mental: 60, physical: 65, social: 65, spiritual: 55, financial: 50 },
            overall: 60,
        };
        const result = calculateEvolution(current, previous);
        expect(typeof result.interpretation).toBe('string');
        expect(result.interpretation.length).toBeGreaterThan(0);
    });
});

// =============================================================================
// 2. Pattern detection and report generation
// =============================================================================

describe('detectPatterns', () => {
    const { detectPatterns } = require('../backend/services/reportGenerator');

    test('detects balanced_profile when all scores within 10 points', () => {
        const scores = { emotional: 70, mental: 72, physical: 68, social: 71, spiritual: 69, financial: 70 };
        const patterns = detectPatterns(scores, null);
        expect(patterns).toContain('balanced_profile');
    });

    test('detects dominant_high when one score > 75 and > 15 above next', () => {
        const scores = { emotional: 90, mental: 70, physical: 60, social: 65, spiritual: 55, financial: 50 };
        const patterns = detectPatterns(scores, null);
        expect(patterns).toContain('dominant_high');
    });

    test('detects dual_strength_profile when two scores > 70', () => {
        const scores = { emotional: 80, mental: 75, physical: 60, social: 55, spiritual: 50, financial: 45 };
        const patterns = detectPatterns(scores, null);
        expect(patterns).toContain('dual_strength_profile');
    });

    test('detects growth_gap with > 15 point improvement since last assessment', () => {
        const scores    = { emotional: 70, mental: 70, physical: 70, social: 70, spiritual: 70, financial: 70 };
        const evolution = {
            isFirstAssessment: false,
            changes: { emotional: 20, mental: 0, physical: 0, social: 0, spiritual: 0, financial: 0 },
        };
        const patterns = detectPatterns(scores, evolution);
        expect(patterns).toContain('growth_gap');
    });

    test('detects emerging_strength with 5-15 point improvement', () => {
        const scores    = { emotional: 70, mental: 70, physical: 70, social: 70, spiritual: 70, financial: 70 };
        const evolution = {
            isFirstAssessment: false,
            changes: { emotional: 10, mental: 0, physical: 0, social: 0, spiritual: 0, financial: 0 },
        };
        const patterns = detectPatterns(scores, evolution);
        expect(patterns).toContain('emerging_strength');
    });

    test('detects plateau when all changes < 5 points', () => {
        const scores    = { emotional: 70, mental: 70, physical: 70, social: 70, spiritual: 70, financial: 70 };
        const evolution = {
            isFirstAssessment: false,
            changes: { emotional: 2, mental: -1, physical: 0, social: 3, spiritual: -2, financial: 1 },
        };
        const patterns = detectPatterns(scores, evolution);
        expect(patterns).toContain('plateau');
    });
});

describe('generateNarrativeReport', () => {
    const { generateNarrativeReport } = require('../backend/services/reportGenerator');

    const scores = { emotional: 80, mental: 70, physical: 65, social: 75, spiritual: 60, financial: 55 };

    test('returns all expected report sections', () => {
        const report = generateNarrativeReport(scores, 68, 'emotional', null);
        expect(report).toHaveProperty('overview');
        expect(report).toHaveProperty('primaryStrength');
        expect(report).toHaveProperty('secondaryStrength');
        expect(report).toHaveProperty('emergingStrength');
        expect(report).toHaveProperty('growthSuggestions');
        expect(report).toHaveProperty('evolutionSummary');
        expect(report).toHaveProperty('patterns');
        expect(report).toHaveProperty('fullReport');
        expect(report).toHaveProperty('disclaimer');
    });

    test('growthSuggestions is an array of 1-4 items', () => {
        const report = generateNarrativeReport(scores, 68, 'emotional', null);
        expect(Array.isArray(report.growthSuggestions)).toBe(true);
        expect(report.growthSuggestions.length).toBeGreaterThanOrEqual(1);
        expect(report.growthSuggestions.length).toBeLessThanOrEqual(4);
    });

    test('overview mentions the overall score', () => {
        const report = generateNarrativeReport(scores, 68, 'emotional', null);
        expect(report.overview).toContain('68%');
    });

    test('disclaimer is present and non-empty', () => {
        const report = generateNarrativeReport(scores, 68, 'emotional', null);
        expect(typeof report.disclaimer).toBe('string');
        expect(report.disclaimer.length).toBeGreaterThan(0);
    });

    test('evolutionSummary mentions first assessment when no previous data', () => {
        const report = generateNarrativeReport(scores, 68, 'emotional', null);
        expect(report.evolutionSummary).toContain('first point');
    });

    test('generates report with evolution data', () => {
        const evolution = {
            isFirstAssessment: false,
            overallChange:     8,
            changes:           { emotional: 10, mental: 5, physical: 0, social: 5, spiritual: -2, financial: 0 },
            direction:         { primary: 'N', magnitude: 3 },
            interpretation:    'Your resilience has grown.',
        };
        const report = generateNarrativeReport(scores, 68, 'emotional', evolution);
        expect(report.evolutionSummary).not.toContain('first point');
    });

    test('report uses supportive non-diagnostic language', () => {
        const report = generateNarrativeReport(scores, 68, 'emotional', null);
        const text = report.fullReport.toLowerCase();
        // Should NOT contain clinical/deterministic language
        expect(text).not.toContain('diagnos');
        expect(text).not.toContain('disorder');
        expect(text).not.toContain('guaranteed');
    });
});

describe('rankDimensions', () => {
    const { rankDimensions } = require('../backend/services/reportGenerator');

    test('returns dimensions sorted highest to lowest', () => {
        const scores = { emotional: 80, mental: 70, physical: 65, social: 75, spiritual: 60, financial: 55 };
        const ranked = rankDimensions(scores);
        expect(ranked[0].dimension).toBe('emotional');
        expect(ranked[0].score).toBe(80);
        expect(ranked[ranked.length - 1].dimension).toBe('financial');
    });

    test('returns all 6 dimensions', () => {
        const scores = { emotional: 80, mental: 70, physical: 65, social: 75, spiritual: 60, financial: 55 };
        const ranked = rankDimensions(scores);
        expect(ranked).toHaveLength(6);
    });
});

// =============================================================================
// 3. Share card generator
// =============================================================================

describe('generateShareCard', () => {
    const { generateShareCard } = require('../backend/services/shareCardGenerator');

    const opts = {
        overall:     75,
        dominantType: 'emotional',
        scores:      { emotional: 80, mental: 70, physical: 65, social: 75, spiritual: 60, financial: 55 },
        direction:   'NE',
    };

    test('returns a Buffer', () => {
        const result = generateShareCard(opts);
        expect(Buffer.isBuffer(result)).toBe(true);
    });

    test('SVG output contains expected elements', () => {
        const svg = generateShareCard(opts).toString('utf8');
        expect(svg).toContain('THE RESILIENCE ATLAS');
        expect(svg).toContain('resilienceatlas.com');
        expect(svg).toContain('75'); // overall score
        expect(svg).toContain('Emotional'); // primary strength
    });

    test('handles missing scores gracefully', () => {
        expect(() => generateShareCard({ overall: 50, dominantType: 'mental', scores: {}, direction: 'N' }))
            .not.toThrow();
    });

    test('SVG is valid XML (starts and ends correctly)', () => {
        const svg = generateShareCard(opts).toString('utf8');
        expect(svg.trim()).toMatch(/^<\?xml/);
        expect(svg.trim()).toMatch(/<\/svg>$/);
    });
});

// =============================================================================
// 4. Atlas API endpoints
// =============================================================================

describe('GET /api/atlas/history', () => {
    const ResilienceAssessment = require('../backend/models/ResilienceAssessment');

    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/atlas/history');
        expect(res.status).toBe(401);
    });

    test('returns 200 with assessments array for authenticated user', async () => {
        ResilienceAssessment.find.mockImplementation(() => ({
            sort:  jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean:  jest.fn().mockResolvedValue([mockAssessmentDoc]),
        }));

        const res = await request(app)
            .get('/api/atlas/history')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('assessments');
        expect(Array.isArray(res.body.assessments)).toBe(true);
        expect(res.body).toHaveProperty('count');
    });
});

describe('GET /api/atlas/assessment/:id', () => {
    const ResilienceAssessment = require('../backend/models/ResilienceAssessment');

    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/atlas/assessment/assessment001');
        expect(res.status).toBe(401);
    });

    test('returns 200 with assessment for authenticated user', async () => {
        ResilienceAssessment.findOne.mockImplementation(() => ({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockAssessmentDoc),
        }));

        const res = await request(app)
            .get('/api/atlas/assessment/assessment001')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('assessment');
    });

    test('returns 404 when assessment not found', async () => {
        ResilienceAssessment.findOne.mockImplementation(() => ({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        }));

        const res = await request(app)
            .get('/api/atlas/assessment/nonexistent')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.status).toBe(404);
    });
});

// =============================================================================
// 5. Share API endpoints
// =============================================================================

describe('GET /api/share/profile-card', () => {
    const ResilienceAssessment = require('../backend/models/ResilienceAssessment');

    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/share/profile-card');
        expect(res.status).toBe(401);
    });

    test('returns SVG image for authenticated user with assessment', async () => {
        ResilienceAssessment.findOne.mockImplementation(() => ({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockAssessmentDoc),
        }));

        const res = await request(app)
            .get('/api/share/profile-card')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('image/svg+xml');
        // SVG content is sent as a Buffer; supertest exposes it in res.text or res.body
        const svgContent = res.text || (res.body && res.body.toString('utf8')) || '';
        expect(svgContent).toContain('THE RESILIENCE ATLAS');
    });

    test('returns 404 when no assessment exists', async () => {
        ResilienceAssessment.findOne.mockImplementation(() => ({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        }));

        const res = await request(app)
            .get('/api/share/profile-card')
            .set('Authorization', `Bearer ${authToken()}`);

        expect(res.status).toBe(404);
    });
});

describe('GET /api/share/profile-card/:assessmentId', () => {
    const ResilienceAssessment = require('../backend/models/ResilienceAssessment');

    test('returns SVG for a valid assessment ID (no auth required)', async () => {
        ResilienceAssessment.findById.mockResolvedValue(mockAssessmentDoc);

        const res = await request(app)
            .get('/api/share/profile-card/assessment001');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('image/svg+xml');
    });

    test('returns 404 for an unknown assessment ID', async () => {
        ResilienceAssessment.findById.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/share/profile-card/unknownid');

        expect(res.status).toBe(404);
    });
});

// =============================================================================
// 6. Updated quiz submission flow
// =============================================================================

describe('POST /api/quiz/submit (updated flow)', () => {
    const ResilienceAssessment = require('../backend/models/ResilienceAssessment');
    const User                 = require('../backend/models/User');

    beforeEach(() => {
        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        ResilienceAssessment.mockImplementation(() => mockAssessmentDoc);
        ResilienceAssessment.findOne.mockImplementation(() => ({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null), // No previous assessment
        }));
    });

    test('returns 401 without a token', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .send({ answers: Array(72).fill(3) });
        expect(res.status).toBe(401);
    });

    test('returns 400 for wrong number of answers', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: [1, 2, 3] });
        expect(res.status).toBe(400);
    });

    test('returns 200 with scores, evolution, and narrativeReport on valid submission', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(4) });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('scores');
        expect(res.body).toHaveProperty('overall');
        expect(res.body).toHaveProperty('dominantType');
        expect(res.body).toHaveProperty('evolution');
        expect(res.body).toHaveProperty('narrativeReport');
        expect(res.body).toHaveProperty('retakeMessage');
    });

    test('evolution.isFirstAssessment is true when no previous assessment exists', async () => {
        ResilienceAssessment.findOne.mockImplementation(() => ({
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(null),
        }));

        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(4) });

        expect(res.status).toBe(200);
        expect(res.body.evolution.isFirstAssessment).toBe(true);
    });

    test('retakeMessage contains Atlas messaging', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(4) });

        expect(res.status).toBe(200);
        expect(res.body.retakeMessage).toContain('Resilience Atlas');
    });
});
