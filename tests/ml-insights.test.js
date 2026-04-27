'use strict';

/**
 * ml-insights.test.js
 *
 * Tests for Task #23b: Predictive Analytics & ML-Powered Insights
 *
 * Covers:
 *  - mlEngine.js utility functions (unit tests)
 *  - POST /api/ml/predict-activity-effectiveness
 *  - POST /api/ml/detect-regression-risk
 *  - GET  /api/ml/recommend-session-frequency/:clientId
 *  - POST /api/ml/score-goal-probability
 *  - POST /api/ml/generate-treatment-plan
 *  - GET  /api/ml/models/status
 *  - POST /api/ml/models/retrain
 *  - GET  /api/ml/explain/:predictionId
 *  - POST /api/ml/:predictionId/feedback
 *  - Access control (auth, practitioner tier, ownership)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// ClientProfile mock
let mockClientDoc = null;

jest.mock('../backend/models/ClientProfile', () => {
  const M = {
    findById: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockImplementation(async () => mockClientDoc),
    })),
  };
  M.VALID_DIMENSIONS = [];
  return M;
});

// ClientProgressSnapshot mock
let mockSnapshotDocs = [];
let mockSnapshotLatest = null;

jest.mock('../backend/models/ClientProgressSnapshot', () => ({
  find: jest.fn().mockImplementation((query) => {
    const chain = {
      sort: function () { return this; },
      lean: jest.fn().mockImplementation(async () => mockSnapshotDocs),
    };
    return chain;
  }),
  aggregate: jest.fn().mockResolvedValue([]),
}));

// SessionNote mock
jest.mock('../backend/models/SessionNote', () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

// ClientActivityHistory mock
let mockHistoryDocs = [];

jest.mock('../backend/models/ClientActivityHistory', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort: function () { return this; },
    lean: jest.fn().mockImplementation(async () => mockHistoryDocs),
  })),
}));

// MLPrediction mock
let mockPredictionDoc = null;
const mockPredictionCreate = jest.fn();
const mockPredictionFindById = jest.fn();
const mockPredictionFindByIdAndUpdate = jest.fn();

jest.mock('../backend/models/MLPrediction', () => {
  const M = {
    create:            mockPredictionCreate,
    findById:          jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockImplementation(async () => mockPredictionDoc),
    })),
    findByIdAndUpdate: mockPredictionFindByIdAndUpdate,
    countDocuments:    jest.fn().mockResolvedValue(0),
  };
  M.VALID_PREDICTION_TYPES = ['activity', 'regression', 'goal', 'frequency', 'plan'];
  M.VALID_FEEDBACK_VALUES  = ['helpful', 'not_helpful'];
  return M;
});

// MLModelPerformance mock
jest.mock('../backend/models/MLModelPerformance', () => ({
  find: jest.fn().mockImplementation(() => ({
    lean: jest.fn().mockResolvedValue([]),
  })),
}));

// Auth middleware mock
jest.mock('../backend/middleware/auth', () => ({
  authenticateJWT: (req, res, next) => {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
      req.user = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    } catch {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    next();
  },
  requirePractitionerTier: (req, res, next) => {
    const allowed = ['practitioner', 'practice', 'enterprise'];
    if (!allowed.includes(req.user?.tier)) {
      return res.status(403).json({
        error: 'Practitioner tier required.',
        code: 'PROFESSIONAL_TIER_REQUIRED',
        upgrade: true,
      });
    }
    next();
  },
}));

jest.mock('../backend/utils/logger', () => ({
  info:  jest.fn(),
  error: jest.fn(),
  warn:  jest.fn(),
}));

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

jest.mock('mongoose', () => {
  function ObjectId(v) {
    if (!(this instanceof ObjectId)) return new ObjectId(v);
    this._v = v;
    this.toString = () => String(v);
  }
  ObjectId.isValid = jest.fn(v => typeof v === 'string' && v.length === 24);

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
    Types:      { ObjectId },
    Schema,
    model:      jest.fn(() => ({})),
  };
});

// ── Test helpers ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');
const express  = require('express');
const request  = require('supertest');

function makeToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

const VALID_CLIENT_ID  = 'a'.repeat(24);
const VALID_PREDICT_ID = 'b'.repeat(24);
const PRACTITIONER_ID  = 'prac_test_123';

const PRACTITIONER_TOKEN = makeToken({ userId: PRACTITIONER_ID, tier: 'practitioner' });
const FREE_TOKEN         = makeToken({ userId: 'user_free', tier: 'free' });

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/ml', require('../backend/routes/clinical/mlInsights'));
  return app;
}

// ═════════════════════════════════════════════════════════════════════════════
// mlEngine.js unit tests
// ═════════════════════════════════════════════════════════════════════════════

const mlEngine = require('../backend/utils/mlEngine');

describe('mlEngine — statistical helpers', () => {
  test('mean of empty array is 0', () => {
    expect(mlEngine.mean([])).toBe(0);
  });

  test('mean of [2, 4, 6] is 4', () => {
    expect(mlEngine.mean([2, 4, 6])).toBe(4);
  });

  test('stdDev of a single element is 0', () => {
    expect(mlEngine.stdDev([5])).toBe(0);
  });

  test('stdDev of [0, 10] ≈ 5', () => {
    expect(mlEngine.stdDev([0, 10])).toBeCloseTo(5, 1);
  });

  test('linearSlope of ascending series is positive', () => {
    expect(mlEngine.linearSlope([1, 2, 3, 4, 5])).toBeGreaterThan(0);
  });

  test('linearSlope of descending series is negative', () => {
    expect(mlEngine.linearSlope([5, 4, 3, 2, 1])).toBeLessThan(0);
  });

  test('countConsecutiveDeclines returns 0 for flat series', () => {
    expect(mlEngine.countConsecutiveDeclines([5, 5, 5, 5])).toBe(0);
  });

  test('countConsecutiveDeclines returns 3 for [10, 9, 8, 7]', () => {
    expect(mlEngine.countConsecutiveDeclines([10, 9, 8, 7])).toBe(3);
  });
});

// ── predictActivityEffectiveness ──────────────────────────────────────────────

describe('mlEngine — predictActivityEffectiveness', () => {
  const client     = { age: 9 };
  const baseline   = { emotionalAdaptive: 40 };
  const activities = [
    { _id: 'act_1', title: 'Breathing', categories: ['emotional'], tags: [], skill_targets: [], age_min: 5, age_max: 15 },
    { _id: 'act_2', title: 'Math Puzzles', categories: ['cognitive'], tags: [], skill_targets: [], age_min: 5, age_max: 15 },
    { _id: 'act_3', title: 'Teen Activity', categories: ['emotional'], tags: [], skill_targets: [], age_min: 14, age_max: 18 },
  ];
  const history    = [];
  const dim        = 'emotionalAdaptive';

  test('returns array sorted by predictedImprovement descending', () => {
    const preds = mlEngine.predictActivityEffectiveness(client, baseline, activities, history, dim);
    for (let i = 1; i < preds.length; i++) {
      expect(preds[i - 1].predictedImprovement).toBeGreaterThanOrEqual(preds[i].predictedImprovement);
    }
  });

  test('age-mismatched activity has lower predicted improvement', () => {
    const preds = mlEngine.predictActivityEffectiveness(client, baseline, activities, history, dim);
    const teen  = preds.find(p => p.activityId === 'act_3');
    const good  = preds.find(p => p.activityId === 'act_1');
    expect(teen.predictedImprovement).toBeLessThanOrEqual(good.predictedImprovement);
  });

  test('dimension-aligned activity has non-zero confidence', () => {
    const preds = mlEngine.predictActivityEffectiveness(client, baseline, activities, history, dim);
    const aligned = preds.find(p => p.activityId === 'act_1');
    expect(aligned.confidence).toBeGreaterThan(0);
  });

  test('returns empty array for empty activities list', () => {
    expect(mlEngine.predictActivityEffectiveness(client, baseline, [], history, dim)).toHaveLength(0);
  });
});

// ── detectRegressionRisk ─────────────────────────────────────────────────────

describe('mlEngine — detectRegressionRisk', () => {
  test('returns empty array for empty snapshots', () => {
    expect(mlEngine.detectRegressionRisk([], {}, 0)).toHaveLength(0);
  });

  test('detects sudden_drop when current average is well below historical', () => {
    const snapshots = [
      { dimensionScores: { emotionalAdaptive: 30 } },
      { dimensionScores: { emotionalAdaptive: 32 } },
      { dimensionScores: { emotionalAdaptive: 28 } },
    ];
    const historicalAvg = { emotionalAdaptive: 70 }; // large gap
    const risks = mlEngine.detectRegressionRisk(snapshots, historicalAvg, 0);
    const suddenDrop = risks.find(r => r.type === 'sudden_drop');
    expect(suddenDrop).toBeDefined();
    expect(suddenDrop.severity).toBe('high');
  });

  test('detects attendance risk when missedSessions > 2', () => {
    const snapshots = [
      { dimensionScores: { emotionalAdaptive: 50 } },
      { dimensionScores: { emotionalAdaptive: 52 } },
      { dimensionScores: { emotionalAdaptive: 51 } },
    ];
    const risks = mlEngine.detectRegressionRisk(snapshots, { emotionalAdaptive: 51 }, 5);
    const attend = risks.find(r => r.type === 'attendance');
    expect(attend).toBeDefined();
    expect(attend.severity).toBe('high');
  });

  test('does not flag attendance risk when missedSessions <= 2', () => {
    const snapshots = [
      { dimensionScores: { emotionalAdaptive: 50 } },
      { dimensionScores: { emotionalAdaptive: 50 } },
      { dimensionScores: { emotionalAdaptive: 50 } },
    ];
    const risks = mlEngine.detectRegressionRisk(snapshots, { emotionalAdaptive: 50 }, 2);
    const attend = risks.find(r => r.type === 'attendance');
    expect(attend).toBeUndefined();
  });
});

// ── recommendSessionFrequency ─────────────────────────────────────────────────

describe('mlEngine — recommendSessionFrequency', () => {
  test('returns sensible defaults for insufficient data', () => {
    const result = mlEngine.recommendSessionFrequency([], 1, 8);
    expect(result).toHaveProperty('currentFrequency', 1);
    expect(result).toHaveProperty('recommendedFrequency');
    expect(result.confidenceScore).toBeLessThanOrEqual(40);
  });

  test('suggests increasing frequency when progress rate is slow', () => {
    const snapshots = Array.from({ length: 8 }, (_, i) => ({
      dimensionScores: { emotionalAdaptive: 50 + i * 0.1 }, // very slow progress
    }));
    const result = mlEngine.recommendSessionFrequency(snapshots, 1, 8);
    expect(result.recommendedFrequency).toBeGreaterThanOrEqual(result.currentFrequency);
  });
});

// ── scoreGoalProbability ─────────────────────────────────────────────────────

describe('mlEngine — scoreGoalProbability', () => {
  const client    = { age: 9, attendanceRate: 0.85 };
  const baseline  = { emotionalAdaptive: 50 };

  test('returns probability between 5 and 95', () => {
    const result = mlEngine.scoreGoalProbability(
      { dimension: 'emotionalAdaptive', targetScore: 80 },
      client, baseline, 1
    );
    expect(result.probability).toBeGreaterThanOrEqual(5);
    expect(result.probability).toBeLessThanOrEqual(95);
  });

  test('probability increases with better attendance', () => {
    const lowAtt  = mlEngine.scoreGoalProbability({ dimension: 'emotionalAdaptive', targetScore: 80 }, { ...client, attendanceRate: 0.4 },  baseline, 1);
    const highAtt = mlEngine.scoreGoalProbability({ dimension: 'emotionalAdaptive', targetScore: 80 }, { ...client, attendanceRate: 0.95 }, baseline, 1);
    expect(highAtt.probability).toBeGreaterThan(lowAtt.probability);
  });

  test('probability decreases when target date is tight', () => {
    const tightDate  = new Date(Date.now() + 7   * 24 * 60 * 60 * 1000).toISOString(); // 1 week
    const looseDate  = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 52 weeks
    // Use a small gap so that 52 weeks is generous but 1 week is very tight
    const smallGapBaseline = { emotionalAdaptive: 72 }; // only 3 pts to targetScore 75
    const tightResult = mlEngine.scoreGoalProbability({ dimension: 'emotionalAdaptive', targetScore: 75, targetDate: tightDate }, client, smallGapBaseline, 1);
    const looseResult = mlEngine.scoreGoalProbability({ dimension: 'emotionalAdaptive', targetScore: 75, targetDate: looseDate }, client, smallGapBaseline, 1);
    expect(looseResult.probability).toBeGreaterThan(tightResult.probability);
  });

  test('includes expectedCompletionDate and weeksToCompletion', () => {
    const result = mlEngine.scoreGoalProbability(
      { dimension: 'emotionalAdaptive', targetScore: 75 },
      client, baseline, 1
    );
    expect(result).toHaveProperty('expectedCompletionDate');
    expect(result).toHaveProperty('weeksToCompletion');
    expect(result.weeksToCompletion).toBeGreaterThan(0);
  });
});

// ── generateTreatmentPlan ─────────────────────────────────────────────────────

describe('mlEngine — generateTreatmentPlan', () => {
  const client   = { age: 9 };
  const baseline = { emotionalAdaptive: 40, somaticRegulative: 50 };
  const goals    = [
    { dimension: 'emotionalAdaptive',  targetScore: 75 },
    { dimension: 'somaticRegulative', targetScore: 70 },
  ];
  const activities = [
    { _id: 'a1', title: 'Breathing', categories: ['emotional'], tags: [], skill_targets: [], age_min: 5, age_max: 15 },
    { _id: 'a2', title: 'Body Scan', categories: ['somatic'],   tags: [], skill_targets: [], age_min: 5, age_max: 15 },
  ];

  test('generates a plan with the correct number of weeks', () => {
    const plan = mlEngine.generateTreatmentPlan(client, baseline, goals, 6, activities, []);
    expect(plan.totalWeeks).toBe(6);
    expect(plan.weeks).toHaveLength(6);
  });

  test('each week has a focusDimension and expectedWeeklyGain', () => {
    const plan = mlEngine.generateTreatmentPlan(client, baseline, goals, 4, activities, []);
    for (const week of plan.weeks) {
      expect(week).toHaveProperty('focusDimension');
      expect(week).toHaveProperty('expectedWeeklyGain');
      expect(week.expectedWeeklyGain).toBeGreaterThanOrEqual(0);
    }
  });

  test('successProbability is between 0 and 100', () => {
    const plan = mlEngine.generateTreatmentPlan(client, baseline, goals, 12, activities, []);
    expect(plan.successProbability).toBeGreaterThanOrEqual(0);
    expect(plan.successProbability).toBeLessThanOrEqual(100);
  });

  test('returns message when no goals provided', () => {
    const plan = mlEngine.generateTreatmentPlan(client, baseline, [], 12, activities, []);
    expect(plan.message).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API endpoint tests
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ml/predict-activity-effectiveness', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockClientDoc = { _id: VALID_CLIENT_ID, practitionerId: PRACTITIONER_ID, isActive: true };
    mockSnapshotDocs = [];
    mockHistoryDocs  = [];
    mockPredictionCreate.mockResolvedValue({ _id: VALID_PREDICT_ID });
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_CLIENT_ID || v === VALID_PREDICT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/ml/predict-activity-effectiveness')
      .send({ clientId: VALID_CLIENT_ID, targetDimension: 'emotionalAdaptive' });
    expect(res.status).toBe(401);
  });

  test('returns 403 for free tier', async () => {
    const res = await request(app)
      .post('/api/ml/predict-activity-effectiveness')
      .set('Authorization', `Bearer ${FREE_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, targetDimension: 'emotionalAdaptive' });
    expect(res.status).toBe(403);
  });

  test('returns 400 when clientId missing', async () => {
    const res = await request(app)
      .post('/api/ml/predict-activity-effectiveness')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ targetDimension: 'emotionalAdaptive' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/clientId/i);
  });

  test('returns 400 when targetDimension is invalid', async () => {
    const res = await request(app)
      .post('/api/ml/predict-activity-effectiveness')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, targetDimension: 'invalid_dim' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/targetDimension/i);
  });

  test('returns 403 when client not owned by practitioner', async () => {
    mockClientDoc = { _id: VALID_CLIENT_ID, practitionerId: 'other_practitioner', isActive: true };
    const res = await request(app)
      .post('/api/ml/predict-activity-effectiveness')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, targetDimension: 'emotionalAdaptive' });
    expect(res.status).toBe(403);
  });

  test('returns 200 with predictions array and aiDisclaimer', async () => {
    const res = await request(app)
      .post('/api/ml/predict-activity-effectiveness')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, targetDimension: 'emotionalAdaptive' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('predictions');
    expect(Array.isArray(res.body.predictions)).toBe(true);
    expect(res.body).toHaveProperty('aiDisclaimer');
  });
});

describe('POST /api/ml/detect-regression-risk', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockClientDoc    = { _id: VALID_CLIENT_ID, practitionerId: PRACTITIONER_ID, isActive: true };
    mockSnapshotDocs = [];
    mockPredictionCreate.mockResolvedValue({ _id: VALID_PREDICT_ID });
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_CLIENT_ID || v === VALID_PREDICT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 401 without auth', async () => {
    const res = await request(app).post('/api/ml/detect-regression-risk').send({ clientId: VALID_CLIENT_ID });
    expect(res.status).toBe(401);
  });

  test('returns 400 when clientId missing', async () => {
    const res = await request(app)
      .post('/api/ml/detect-regression-risk')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 200 with risks array', async () => {
    const res = await request(app)
      .post('/api/ml/detect-regression-risk')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('risks');
    expect(Array.isArray(res.body.risks)).toBe(true);
    expect(res.body).toHaveProperty('highRiskCount');
    expect(res.body).toHaveProperty('aiDisclaimer');
  });
});

describe('GET /api/ml/recommend-session-frequency/:clientId', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockClientDoc    = { _id: VALID_CLIENT_ID, practitionerId: PRACTITIONER_ID, isActive: true };
    mockSnapshotDocs = [];
    mockPredictionCreate.mockResolvedValue({ _id: VALID_PREDICT_ID });
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_CLIENT_ID || v === VALID_PREDICT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/ml/recommend-session-frequency/${VALID_CLIENT_ID}`);
    expect(res.status).toBe(401);
  });

  test('returns 200 with frequency recommendation', async () => {
    const res = await request(app)
      .get(`/api/ml/recommend-session-frequency/${VALID_CLIENT_ID}`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('currentFrequency');
    expect(res.body).toHaveProperty('recommendedFrequency');
    expect(res.body).toHaveProperty('rationale');
    expect(res.body).toHaveProperty('aiDisclaimer');
  });

  test('returns 400 for invalid client ID', async () => {
    mongoose.Types.ObjectId.isValid.mockReturnValue(false);
    const res = await request(app)
      .get('/api/ml/recommend-session-frequency/invalid-id')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ml/score-goal-probability', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockClientDoc    = { _id: VALID_CLIENT_ID, practitionerId: PRACTITIONER_ID, isActive: true };
    mockSnapshotDocs = [];
    mockPredictionCreate.mockResolvedValue({ _id: VALID_PREDICT_ID });
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_CLIENT_ID || v === VALID_PREDICT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 400 when goal is missing', async () => {
    const res = await request(app)
      .post('/api/ml/score-goal-probability')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID });
    expect(res.status).toBe(400);
  });

  test('returns 400 when goal.dimension is invalid', async () => {
    const res = await request(app)
      .post('/api/ml/score-goal-probability')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, goal: { dimension: 'bad_dim', targetScore: 80 } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dimension/i);
  });

  test('returns 400 when targetScore is missing', async () => {
    const res = await request(app)
      .post('/api/ml/score-goal-probability')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, goal: { dimension: 'emotionalAdaptive' } });
    expect(res.status).toBe(400);
  });

  test('returns 200 with probability and risk factors', async () => {
    const res = await request(app)
      .post('/api/ml/score-goal-probability')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({
        clientId: VALID_CLIENT_ID,
        goal: { dimension: 'emotionalAdaptive', targetScore: 80 },
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('probability');
    expect(res.body.probability).toBeGreaterThanOrEqual(5);
    expect(res.body.probability).toBeLessThanOrEqual(95);
    expect(res.body).toHaveProperty('riskFactors');
    expect(res.body).toHaveProperty('suggestions');
    expect(res.body).toHaveProperty('aiDisclaimer');
  });
});

describe('POST /api/ml/generate-treatment-plan', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockClientDoc    = { _id: VALID_CLIENT_ID, practitionerId: PRACTITIONER_ID, isActive: true };
    mockSnapshotDocs = [];
    mockHistoryDocs  = [];
    mockPredictionCreate.mockResolvedValue({ _id: VALID_PREDICT_ID });
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_CLIENT_ID || v === VALID_PREDICT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 400 when goals array is empty', async () => {
    const res = await request(app)
      .post('/api/ml/generate-treatment-plan')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ clientId: VALID_CLIENT_ID, goals: [] });
    expect(res.status).toBe(400);
  });

  test('returns 400 when totalWeeks > 52', async () => {
    const res = await request(app)
      .post('/api/ml/generate-treatment-plan')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({
        clientId: VALID_CLIENT_ID,
        goals: [{ dimension: 'emotionalAdaptive', targetScore: 80 }],
        totalWeeks: 100,
      });
    expect(res.status).toBe(400);
  });

  test('returns 200 with week-by-week plan', async () => {
    const res = await request(app)
      .post('/api/ml/generate-treatment-plan')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({
        clientId: VALID_CLIENT_ID,
        goals: [{ dimension: 'emotionalAdaptive', targetScore: 80 }],
        totalWeeks: 4,
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalWeeks', 4);
    expect(res.body).toHaveProperty('weeks');
    expect(Array.isArray(res.body.weeks)).toBe(true);
    expect(res.body).toHaveProperty('successProbability');
    expect(res.body).toHaveProperty('aiDisclaimer');
  });
});

describe('GET /api/ml/models/status', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    const MLPrediction = require('../backend/models/MLPrediction');
    MLPrediction.countDocuments.mockResolvedValue(42);
    mongoose.Types.ObjectId.isValid.mockImplementation(v => true);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 401 without auth', async () => {
    const res = await request(app).get('/api/ml/models/status');
    expect(res.status).toBe(401);
  });

  test('returns 200 with engine status and models', async () => {
    const res = await request(app)
      .get('/api/ml/models/status')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('engineVersion');
    expect(res.body).toHaveProperty('status', 'operational');
    expect(Array.isArray(res.body.models)).toBe(true);
    expect(res.body).toHaveProperty('privacyNote');
  });
});

describe('POST /api/ml/models/retrain', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  afterEach(() => jest.clearAllMocks());

  test('returns 422 when insufficient data (< 100 predictions)', async () => {
    const MLPrediction = require('../backend/models/MLPrediction');
    MLPrediction.countDocuments.mockResolvedValue(50);
    const res = await request(app)
      .post('/api/ml/models/retrain')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(422);
    expect(res.body.status).toBe('skipped');
  });

  test('returns 200 with job queued when enough data', async () => {
    const MLPrediction = require('../backend/models/MLPrediction');
    MLPrediction.countDocuments.mockResolvedValue(200);
    const res = await request(app)
      .post('/api/ml/models/retrain')
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('queued');
    expect(res.body).toHaveProperty('jobId');
  });
});

describe('GET /api/ml/explain/:predictionId', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockPredictionDoc = {
      _id:              VALID_PREDICT_ID,
      practitionerId:   PRACTITIONER_ID,
      predictionType:   'activity',
      confidence:       72,
      explanation:      'Top activity predicted to improve by 2.3 pts',
      modelVersion:     '1.0.0',
      inputFeatures:    { currentScore: 40 },
      predictionOutput: {},
    };
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_PREDICT_ID || v === VALID_CLIENT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/ml/explain/${VALID_PREDICT_ID}`);
    expect(res.status).toBe(401);
  });

  test('returns 404 when prediction not found', async () => {
    mockPredictionDoc = null;
    const res = await request(app)
      .get(`/api/ml/explain/${VALID_PREDICT_ID}`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(404);
  });

  test('returns 403 when prediction owned by another practitioner', async () => {
    mockPredictionDoc = { ...mockPredictionDoc, practitionerId: 'other_practitioner' };
    const res = await request(app)
      .get(`/api/ml/explain/${VALID_PREDICT_ID}`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(403);
  });

  test('returns 200 with explanation and featureImportance', async () => {
    const res = await request(app)
      .get(`/api/ml/explain/${VALID_PREDICT_ID}`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('explanation');
    expect(res.body).toHaveProperty('featureImportance');
    expect(Array.isArray(res.body.featureImportance)).toBe(true);
    expect(res.body).toHaveProperty('humanInTheLoop');
    expect(res.body).toHaveProperty('aiDisclaimer');
  });
});

describe('POST /api/ml/:predictionId/feedback', () => {
  let app;
  beforeAll(() => { app = buildApp(); });

  beforeEach(() => {
    mockPredictionDoc = {
      _id:            VALID_PREDICT_ID,
      practitionerId: PRACTITIONER_ID,
      predictionType: 'activity',
    };
    mockPredictionFindByIdAndUpdate.mockResolvedValue({});
    mongoose.Types.ObjectId.isValid.mockImplementation(v => v === VALID_PREDICT_ID || v === VALID_CLIENT_ID);
  });

  afterEach(() => jest.clearAllMocks());

  test('returns 400 for invalid feedback value', async () => {
    const res = await request(app)
      .post(`/api/ml/${VALID_PREDICT_ID}/feedback`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ feedback: 'somewhat_helpful' });
    expect(res.status).toBe(400);
  });

  test('returns 200 when valid helpful feedback submitted', async () => {
    const res = await request(app)
      .post(`/api/ml/${VALID_PREDICT_ID}/feedback`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ feedback: 'helpful' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('feedback', 'helpful');
  });

  test('returns 200 when valid not_helpful feedback submitted', async () => {
    const res = await request(app)
      .post(`/api/ml/${VALID_PREDICT_ID}/feedback`)
      .set('Authorization', `Bearer ${PRACTITIONER_TOKEN}`)
      .send({ feedback: 'not_helpful' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('feedback', 'not_helpful');
  });
});
