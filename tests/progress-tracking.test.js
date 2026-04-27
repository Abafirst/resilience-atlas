'use strict';

/**
 * progress-tracking.test.js
 *
 * Tests for Task #22e: Progress Tracking Dashboard
 *
 * Covers:
 *  - progressCalculations.js utility functions (unit tests)
 *  - clientAlerts.js utility functions (unit tests)
 *  - /api/clinical/clients/:id/progress-snapshots (CRUD)
 *  - /api/clinical/clients/:id/milestones (CRUD)
 *  - /api/clinical/clients/:id/progress-overview
 *  - /api/clinical/clients/:id/progress-timeline
 *  - /api/clinical/clients/:id/activity-effectiveness-trends
 *  - /api/clinical/clients/:id/session-frequency-analysis
 *  - /api/clinical/clients/:id/goal-progress-report
 *  - /api/clinical/dashboard/alerts
 *  - /api/clinical/dashboard/aggregate-stats
 *  - /api/clinical/dashboard/settings (GET + PATCH)
 *  - Access control (auth, practitioner tier, ownership)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock ClientProfile
let mockClientDoc = null;

jest.mock('../backend/models/ClientProfile', () => {
  const M = {
    findById: jest.fn().mockImplementation((id) => ({
      lean: jest.fn().mockImplementation(async () => {
        if (!mockClientDoc) return null;
        return { ...mockClientDoc, _id: mockClientDoc._id || id };
      }),
    })),
    find:           jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate:      jest.fn().mockResolvedValue([]),
  };
  M.VALID_DIMENSIONS = [];
  return M;
});

// Mock ClientProgressSnapshot
let mockSnapshotDocs = [];
const mockSnapshotCreate = jest.fn();

jest.mock('../backend/models/ClientProgressSnapshot', () => {
  const M = {
    find: jest.fn().mockImplementation(() => ({
      sort: function () { return this; },
      lean: jest.fn().mockImplementation(async () => mockSnapshotDocs),
    })),
    create:    mockSnapshotCreate,
    aggregate: jest.fn().mockResolvedValue([]),
  };
  M.VALID_DATA_SOURCES = ['assessment', 'practitioner_observation', 'self_report'];
  M.DIMENSION_KEYS     = ['agenticGenerative', 'relationalConnective', 'somaticRegulative', 'cognitiveNarrative', 'emotionalAdaptive', 'spiritualExistential'];
  return M;
});

// Mock ClientMilestone
let mockMilestoneDocs = [];
const mockMilestoneCreate = jest.fn();

jest.mock('../backend/models/ClientMilestone', () => {
  const M = {
    find: jest.fn().mockImplementation(() => ({
      sort: function () { return this; },
      lean: jest.fn().mockImplementation(async () => mockMilestoneDocs),
    })),
    create: mockMilestoneCreate,
  };
  M.VALID_MILESTONE_TYPES = ['goal_achieved', 'skill_mastered', 'behavior_improved', 'session_count', 'custom'];
  return M;
});

// Mock SessionNote
let mockSessionNoteDocs = [];

jest.mock('../backend/models/SessionNote', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort:  function () { return this; },
    lean:  jest.fn().mockImplementation(async () => mockSessionNoteDocs),
    limit: function () { return this; },
  })),
  countDocuments: jest.fn().mockResolvedValue(0),
}));

// Mock ClientActivityHistory
let mockHistoryDocs = [];

jest.mock('../backend/models/ClientActivityHistory', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort: function () { return this; },
    lean: jest.fn().mockImplementation(async () => mockHistoryDocs),
  })),
  aggregate: jest.fn().mockResolvedValue([]),
}));

// Mock PractitionerDashboardSettings
let mockSettingsDoc = null;
const mockSettingsFindOneAndUpdate = jest.fn();

jest.mock('../backend/models/PractitionerDashboardSettings', () => {
  const M = {
    findOne: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockImplementation(async () => {
        // eslint-disable-next-line no-use-before-define
        return mockSettingsDoc;
      }),
    })),
    findOneAndUpdate: mockSettingsFindOneAndUpdate,
  };
  M.VALID_DATE_RANGES = ['7_days', '30_days', '90_days', '6_months', '1_year', 'all_time'];
  return M;
});

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
      return res.status(403).json({ error: 'Practitioner tier required.', code: 'PROFESSIONAL_TIER_REQUIRED', upgrade: true });
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
  // ObjectId that works both as a constructor and for isValid checks.
  function ObjectId(v) {
    if (!(this instanceof ObjectId)) return new ObjectId(v);
    this._v = v;
    this.toString = () => String(v);
  }
  ObjectId.isValid = jest.fn(() => true);

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

// ── Imports ───────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');

const {
  calculateOverallProgress,
  calculateProgressTrend,
  calculateOverallScore,
  calculateSessionFrequency,
  buildTimelineDataPoints,
  buildDimensionChanges,
  dateRangeToCutoff,
} = require('../backend/utils/progressCalculations');

const {
  noRecentSessionAlert,
  decliningProgressAlert,
  goalAtRiskAlerts,
  generateClientAlerts,
} = require('../backend/utils/clientAlerts');

// ── App builders ──────────────────────────────────────────────────────────────

function buildProgressApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/clinical/clients/:id', require('../backend/routes/clinical/clientProgress'));
  return app;
}

function buildDashboardApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/clinical/dashboard', require('../backend/routes/clinical/practitionerDashboard'));
  return app;
}

function authHeader(payload) {
  return 'Bearer ' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

const PRACTITIONER = { sub: 'prac1', userId: 'prac1', tier: 'practitioner' };
const FREE_USER    = { sub: 'free1', userId: 'free1', tier: 'free'         };
const CLIENT_ID    = '507f1f77bcf86cd799439011';

function makeClient(overrides = {}) {
  return {
    _id:              { toString: () => CLIENT_ID },
    practitionerId:   'prac1',
    clientIdentifier: 'Test Client',
    dateOfBirth:      new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
    clinicalGoals:    [],
    isActive:         true,
    lastSessionDate:  null,
    ...overrides,
  };
}

function makeSnapshot(overrides = {}) {
  const base = {
    _id:            { toString: () => 'snap001' },
    practitionerId: 'prac1',
    clientProfileId: CLIENT_ID,
    snapshotDate:   new Date('2024-01-15'),
    overallScore:   70,
    dimensionScores: {
      agenticGenerative: 70, relationalConnective: 72,
      somaticRegulative: 68, cognitiveNarrative: 71,
      emotionalAdaptive: 74, spiritualExistential: 65,
    },
    dataSource: 'practitioner_observation',
    notes:      '',
  };
  return { ...base, ...overrides };
}

// ── Reset state before each test ──────────────────────────────────────────────

beforeEach(() => {
  mockClientDoc      = null;
  mockSnapshotDocs   = [];
  mockMilestoneDocs  = [];
  mockSessionNoteDocs = [];
  mockHistoryDocs    = [];
  mockSettingsDoc    = null;

  mockSnapshotCreate.mockReset();
  mockMilestoneCreate.mockReset();
  mockSettingsFindOneAndUpdate.mockReset();
});

// ═════════════════════════════════════════════════════════════════════════════
// UNIT TESTS: progressCalculations.js
// ═════════════════════════════════════════════════════════════════════════════

describe('progressCalculations — calculateOverallProgress', () => {
  it('returns positive number when current > baseline', () => {
    const baseline = { agenticGenerative: 50, relationalConnective: 50, somaticRegulative: 50, cognitiveNarrative: 50, emotionalAdaptive: 50, spiritualExistential: 50 };
    const current  = { agenticGenerative: 60, relationalConnective: 60, somaticRegulative: 60, cognitiveNarrative: 60, emotionalAdaptive: 60, spiritualExistential: 60 };
    expect(calculateOverallProgress(baseline, current)).toBe(10);
  });

  it('returns 0 for identical scores', () => {
    const scores = { agenticGenerative: 70, relationalConnective: 70, somaticRegulative: 70, cognitiveNarrative: 70, emotionalAdaptive: 70, spiritualExistential: 70 };
    expect(calculateOverallProgress(scores, scores)).toBe(0);
  });

  it('returns 0 for missing inputs', () => {
    expect(calculateOverallProgress(null, null)).toBe(0);
  });
});

describe('progressCalculations — calculateProgressTrend', () => {
  it('returns stable for fewer than 2 snapshots', () => {
    expect(calculateProgressTrend([])).toBe('stable');
    expect(calculateProgressTrend([makeSnapshot()])).toBe('stable');
  });

  it('returns improving when recent scores are higher', () => {
    const snapshots = [
      { snapshotDate: '2024-01-01', overallScore: 40 },
      { snapshotDate: '2024-02-01', overallScore: 42 },
      { snapshotDate: '2024-03-01', overallScore: 70 },
      { snapshotDate: '2024-04-01', overallScore: 72 },
    ];
    expect(calculateProgressTrend(snapshots)).toBe('improving');
  });

  it('returns declining when recent scores are lower', () => {
    const snapshots = [
      { snapshotDate: '2024-01-01', overallScore: 80 },
      { snapshotDate: '2024-02-01', overallScore: 78 },
      { snapshotDate: '2024-03-01', overallScore: 50 },
      { snapshotDate: '2024-04-01', overallScore: 48 },
    ];
    expect(calculateProgressTrend(snapshots)).toBe('declining');
  });

  it('returns stable for minimal difference', () => {
    const snapshots = [
      { snapshotDate: '2024-01-01', overallScore: 70 },
      { snapshotDate: '2024-02-01', overallScore: 71 },
      { snapshotDate: '2024-03-01', overallScore: 72 },
      { snapshotDate: '2024-04-01', overallScore: 73 },
    ];
    expect(calculateProgressTrend(snapshots)).toBe('stable');
  });
});

describe('progressCalculations — calculateOverallScore', () => {
  it('averages the 6 dimension scores', () => {
    const scores = { agenticGenerative: 60, relationalConnective: 60, somaticRegulative: 60, cognitiveNarrative: 60, emotionalAdaptive: 60, spiritualExistential: 60 };
    expect(calculateOverallScore(scores)).toBe(60);
  });

  it('returns 0 for null input', () => {
    expect(calculateOverallScore(null)).toBe(0);
  });
});

describe('progressCalculations — calculateSessionFrequency', () => {
  it('returns 0 sessions/week for empty array', () => {
    const result = calculateSessionFrequency([], 30);
    expect(result.sessionsPerWeek).toBe(0);
    expect(result.consistency).toBe(100);
  });

  it('correctly calculates sessions per week', () => {
    // 4 sessions over 28 days = 1 per week
    const now = Date.now();
    const dates = [
      new Date(now - 7  * 24 * 60 * 60 * 1000),
      new Date(now - 14 * 24 * 60 * 60 * 1000),
      new Date(now - 21 * 24 * 60 * 60 * 1000),
      new Date(now - 25 * 24 * 60 * 60 * 1000),
    ];
    const { sessionsPerWeek } = calculateSessionFrequency(dates, 28);
    expect(sessionsPerWeek).toBe(1);
  });
});

describe('progressCalculations — buildTimelineDataPoints', () => {
  it('returns empty array for no snapshots', () => {
    expect(buildTimelineDataPoints([], 'monthly')).toEqual([]);
  });

  it('groups by month correctly', () => {
    const snapshots = [
      { snapshotDate: '2024-01-10', overallScore: 60 },
      { snapshotDate: '2024-01-20', overallScore: 70 },
      { snapshotDate: '2024-02-05', overallScore: 80 },
    ];
    const points = buildTimelineDataPoints(snapshots, 'monthly');
    expect(points).toHaveLength(2);
    expect(points[0].date).toBe('2024-01');
    expect(points[0].value).toBe(65); // average of 60 and 70
  });
});

describe('progressCalculations — buildDimensionChanges', () => {
  it('computes change for each dimension', () => {
    const baseline = { agenticGenerative: 50, relationalConnective: 60, somaticRegulative: 50, cognitiveNarrative: 50, emotionalAdaptive: 50, spiritualExistential: 50 };
    const current  = { agenticGenerative: 60, relationalConnective: 55, somaticRegulative: 50, cognitiveNarrative: 50, emotionalAdaptive: 50, spiritualExistential: 50 };
    const changes  = buildDimensionChanges(baseline, current);
    const ag = changes.find(c => c.dimension === 'agenticGenerative');
    const rc = changes.find(c => c.dimension === 'relationalConnective');
    expect(ag.change).toBe(10);
    expect(rc.change).toBe(-5);
  });
});

describe('progressCalculations — dateRangeToCutoff', () => {
  it('returns null for all_time', () => {
    expect(dateRangeToCutoff('all_time')).toBeNull();
  });

  it('returns a date in the past for 30_days', () => {
    const cutoff = dateRangeToCutoff('30_days');
    expect(cutoff).toBeInstanceOf(Date);
    expect(cutoff.getTime()).toBeLessThan(Date.now());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// UNIT TESTS: clientAlerts.js
// ═════════════════════════════════════════════════════════════════════════════

describe('clientAlerts — noRecentSessionAlert', () => {
  it('returns alert when no session date supplied', () => {
    const alert = noRecentSessionAlert('client1', null);
    expect(alert).not.toBeNull();
    expect(alert.alertType).toBe('no_recent_session');
    expect(alert.priority).toBe('high');
  });

  it('returns alert when last session was over 14 days ago', () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const alert   = noRecentSessionAlert('client1', oldDate);
    expect(alert).not.toBeNull();
    expect(alert.message).toMatch(/20 days/);
  });

  it('returns null when session was within 14 days', () => {
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(noRecentSessionAlert('client1', recentDate)).toBeNull();
  });
});

describe('clientAlerts — decliningProgressAlert', () => {
  it('returns null for fewer than 2 snapshots', () => {
    expect(decliningProgressAlert('client1', [])).toBeNull();
  });

  it('returns alert for declining trend', () => {
    const snaps = [
      { snapshotDate: '2024-01-01', overallScore: 80 },
      { snapshotDate: '2024-02-01', overallScore: 78 },
      { snapshotDate: '2024-03-01', overallScore: 50 },
      { snapshotDate: '2024-04-01', overallScore: 48 },
    ];
    const alert = decliningProgressAlert('client1', snaps);
    expect(alert).not.toBeNull();
    expect(alert.alertType).toBe('declining_progress');
  });

  it('returns null for improving trend', () => {
    const snaps = [
      { snapshotDate: '2024-01-01', overallScore: 40 },
      { snapshotDate: '2024-02-01', overallScore: 50 },
      { snapshotDate: '2024-03-01', overallScore: 70 },
      { snapshotDate: '2024-04-01', overallScore: 80 },
    ];
    expect(decliningProgressAlert('client1', snaps)).toBeNull();
  });
});

describe('clientAlerts — goalAtRiskAlerts', () => {
  it('returns empty array for no goals', () => {
    expect(goalAtRiskAlerts('client1', [])).toEqual([]);
  });

  it('generates alert for active goal not updated in 30+ days', () => {
    const staleGoal = {
      goal:      'Reduce anxiety',
      status:    'active',
      updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    };
    const alerts = goalAtRiskAlerts('client1', [staleGoal]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].alertType).toBe('goal_at_risk');
  });

  it('does not alert for recently updated goal', () => {
    const freshGoal = {
      goal:      'Build confidence',
      status:    'active',
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    };
    expect(goalAtRiskAlerts('client1', [freshGoal])).toHaveLength(0);
  });

  it('ignores achieved goals', () => {
    const achievedGoal = {
      goal:      'Done',
      status:    'achieved',
      updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    };
    expect(goalAtRiskAlerts('client1', [achievedGoal])).toHaveLength(0);
  });
});

describe('clientAlerts — generateClientAlerts', () => {
  it('aggregates alerts from all generators', () => {
    const staleGoal = { goal: 'Test', status: 'active', updatedAt: new Date(0) };
    const snaps     = [
      { snapshotDate: '2024-01-01', overallScore: 80 },
      { snapshotDate: '2024-02-01', overallScore: 40 },
      { snapshotDate: '2024-03-01', overallScore: 35 },
      { snapshotDate: '2024-04-01', overallScore: 30 },
    ];
    const alerts = generateClientAlerts('client1', null, snaps, [staleGoal]);
    const types  = alerts.map(a => a.alertType);
    expect(types).toContain('no_recent_session');
    expect(types).toContain('declining_progress');
    expect(types).toContain('goal_at_risk');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /progress-snapshots
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/clinical/clients/:id/progress-snapshots', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for free tier user', async () => {
    mockClientDoc = makeClient();
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(FREE_USER))
      .send({});
    expect(res.status).toBe(403);
  });

  it('returns 403 when client not owned by practitioner', async () => {
    mockClientDoc = makeClient({ practitionerId: 'other-prac' });
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ snapshot_date: '2024-01-01', dimension_scores: {} });
    expect(res.status).toBe(403);
  });

  it('returns 400 when snapshot_date is missing', async () => {
    mockClientDoc = makeClient();
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ dimension_scores: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/snapshot_date/);
  });

  it('returns 400 when dimension_scores is missing', async () => {
    mockClientDoc = makeClient();
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ snapshot_date: '2024-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/dimension_scores/);
  });

  it('creates snapshot successfully', async () => {
    mockClientDoc = makeClient();
    const created = makeSnapshot();
    mockSnapshotCreate.mockResolvedValue(created);

    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({
        snapshot_date:    '2024-01-15',
        dimension_scores: { agenticGenerative: 70, relationalConnective: 72, somaticRegulative: 68, cognitiveNarrative: 71, emotionalAdaptive: 74, spiritualExistential: 65 },
        data_source:      'assessment',
        notes:            'First formal assessment',
      });

    expect(res.status).toBe(201);
    expect(mockSnapshotCreate).toHaveBeenCalledTimes(1);
  });

  it('auto-calculates overall_score when not provided', async () => {
    mockClientDoc = makeClient();
    const created = makeSnapshot({ overallScore: 70 });
    mockSnapshotCreate.mockResolvedValue(created);

    await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({
        snapshot_date:    '2024-01-15',
        dimension_scores: { agenticGenerative: 70, relationalConnective: 70, somaticRegulative: 70, cognitiveNarrative: 70, emotionalAdaptive: 70, spiritualExistential: 70 },
      });

    const callArgs = mockSnapshotCreate.mock.calls[0][0];
    expect(callArgs.overallScore).toBe(70);
  });
});

describe('GET /api/clinical/clients/:id/progress-snapshots', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns snapshots with trend analysis', async () => {
    mockClientDoc    = makeClient();
    mockSnapshotDocs = [
      makeSnapshot({ snapshotDate: new Date('2024-04-01'), overallScore: 75 }),
      makeSnapshot({ snapshotDate: new Date('2024-01-01'), overallScore: 65 }),
    ];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-snapshots`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('snapshots');
    expect(res.body).toHaveProperty('trend');
    expect(Array.isArray(res.body.snapshots)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /milestones
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/clinical/clients/:id/milestones', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns 400 when title is missing', async () => {
    mockClientDoc = makeClient();
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/milestones`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ achieved_date: '2024-03-01', milestone_type: 'custom' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/);
  });

  it('returns 400 for invalid milestone_type', async () => {
    mockClientDoc = makeClient();
    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/milestones`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ title: 'First 10 sessions', achieved_date: '2024-03-01', milestone_type: 'invalid_type' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/milestone_type/);
  });

  it('creates milestone successfully', async () => {
    mockClientDoc = makeClient();
    const created = {
      _id:           { toString: () => 'ms001' },
      practitionerId: 'prac1',
      clientProfileId: CLIENT_ID,
      milestoneType:  'session_count',
      title:          'Completed 10 sessions',
      achievedDate:   new Date('2024-03-01'),
    };
    mockMilestoneCreate.mockResolvedValue(created);

    const res = await request(app)
      .post(`/api/clinical/clients/${CLIENT_ID}/milestones`)
      .set('Authorization', authHeader(PRACTITIONER))
      .send({
        milestone_type: 'session_count',
        title:          'Completed 10 sessions',
        achieved_date:  '2024-03-01',
      });

    expect(res.status).toBe(201);
    expect(mockMilestoneCreate).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/clinical/clients/:id/milestones', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns milestones array', async () => {
    mockClientDoc    = makeClient();
    mockMilestoneDocs = [
      { _id: 'ms001', title: 'First milestone', achievedDate: new Date('2024-03-01') },
    ];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/milestones`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.milestones)).toBe(true);
    expect(res.body.milestones).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /progress-overview
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/clinical/clients/:id/progress-overview', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns 403 for non-owner practitioner', async () => {
    mockClientDoc = makeClient({ practitionerId: 'other' });
    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-overview`)
      .set('Authorization', authHeader(PRACTITIONER));
    expect(res.status).toBe(403);
  });

  it('returns comprehensive overview shape', async () => {
    mockClientDoc      = makeClient();
    mockSnapshotDocs   = [makeSnapshot()];
    mockMilestoneDocs  = [];
    mockSessionNoteDocs = [];
    mockHistoryDocs    = [];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-overview`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessionStats');
    expect(res.body).toHaveProperty('activityStats');
    expect(res.body).toHaveProperty('goalProgress');
    expect(res.body).toHaveProperty('milestones');
    expect(res.body).toHaveProperty('dimensionProgress');
  });

  it('accepts date_range query param', async () => {
    mockClientDoc      = makeClient();
    mockSnapshotDocs   = [];
    mockMilestoneDocs  = [];
    mockSessionNoteDocs = [];
    mockHistoryDocs    = [];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-overview?date_range=30_days`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /progress-timeline
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/clinical/clients/:id/progress-timeline', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns 400 for invalid granularity', async () => {
    mockClientDoc = makeClient();
    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-timeline?granularity=hourly`)
      .set('Authorization', authHeader(PRACTITIONER));
    expect(res.status).toBe(400);
  });

  it('returns dataPoints for overall_score metric', async () => {
    mockClientDoc    = makeClient();
    mockSnapshotDocs = [makeSnapshot()];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-timeline?metric=overall_score&granularity=monthly`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dataPoints');
    expect(res.body.metric).toBe('overall_score');
  });

  it('returns series for dimension_scores metric', async () => {
    mockClientDoc    = makeClient();
    mockSnapshotDocs = [makeSnapshot()];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-timeline?metric=dimension_scores`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('series');
    expect(res.body.metric).toBe('dimension_scores');
  });

  it('returns dataPoints for session_frequency metric', async () => {
    mockClientDoc      = makeClient();
    mockSessionNoteDocs = [{ sessionDate: new Date() }];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/progress-timeline?metric=session_frequency`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dataPoints');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /activity-effectiveness-trends
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/clinical/clients/:id/activity-effectiveness-trends', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns effectiveness analysis shape', async () => {
    mockClientDoc   = makeClient();
    mockHistoryDocs = [
      { activityId: 'act-001', effectivenessRating: 4, usedAt: new Date(), category: 'breathing' },
      { activityId: 'act-001', effectivenessRating: 5, usedAt: new Date(), category: 'breathing' },
      { activityId: 'act-002', effectivenessRating: 3, usedAt: new Date(), category: 'movement' },
    ];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/activity-effectiveness-trends`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('activities');
    expect(res.body).toHaveProperty('trendingActivities');
    expect(res.body).toHaveProperty('decliningActivities');
    expect(res.body).toHaveProperty('byCategory');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /session-frequency-analysis
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/clinical/clients/:id/session-frequency-analysis', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns frequency analysis shape', async () => {
    mockClientDoc       = makeClient();
    mockSessionNoteDocs = [
      { sessionDate: new Date(Date.now() - 7  * 24 * 60 * 60 * 1000) },
      { sessionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    ];

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/session-frequency-analysis`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalSessions');
    expect(res.body).toHaveProperty('byWeeks');
    expect(res.body).toHaveProperty('byMonths');
    expect(res.body).toHaveProperty('gaps');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /goal-progress-report
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/clinical/clients/:id/goal-progress-report', () => {
  let app;
  beforeAll(() => { app = buildProgressApp(); });

  it('returns goal report with at-risk flags', async () => {
    mockClientDoc = makeClient({
      clinicalGoals: [
        {
          _id:       'goal001',
          goal:      'Reduce anxiety symptoms',
          priority:  'high',
          status:    'active',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        },
        {
          _id:        'goal002',
          goal:       'Build social skills',
          priority:   'medium',
          status:     'achieved',
          createdAt:  new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          achievedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt:  new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    const res = await request(app)
      .get(`/api/clinical/clients/${CLIENT_ID}/goal-progress-report`)
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('goals');
    expect(res.body).toHaveProperty('goalsAtRisk');
    expect(res.body).toHaveProperty('byPriority');
    expect(res.body).toHaveProperty('byStatus');
    expect(res.body.goalsAtRisk).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// API TESTS: /api/clinical/dashboard
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/clinical/dashboard/alerts', () => {
  let app;
  beforeAll(() => { app = buildDashboardApp(); });

  const ClientProfile = require('../backend/models/ClientProfile');

  beforeEach(() => {
    ClientProfile.find.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue([]),
    }));
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/clinical/dashboard/alerts');
    expect(res.status).toBe(401);
  });

  it('returns 403 for free user', async () => {
    const res = await request(app)
      .get('/api/clinical/dashboard/alerts')
      .set('Authorization', authHeader(FREE_USER));
    expect(res.status).toBe(403);
  });

  it('returns alerts array', async () => {
    ClientProfile.find.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue([]),
    }));
    const ClientProgressSnapshot = require('../backend/models/ClientProgressSnapshot');
    ClientProgressSnapshot.find.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue([]),
    }));

    const res = await request(app)
      .get('/api/clinical/dashboard/alerts')
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('alerts');
    expect(Array.isArray(res.body.alerts)).toBe(true);
  });
});

describe('GET /api/clinical/dashboard/aggregate-stats', () => {
  let app;
  beforeAll(() => { app = buildDashboardApp(); });

  it('returns aggregate stats shape', async () => {
    const ClientProfile = require('../backend/models/ClientProfile');
    ClientProfile.countDocuments.mockResolvedValue(5);
    ClientProfile.find.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue([]),
    }));
    const SessionNote = require('../backend/models/SessionNote');
    SessionNote.countDocuments.mockResolvedValue(10);
    const ClientProgressSnapshot = require('../backend/models/ClientProgressSnapshot');
    ClientProgressSnapshot.aggregate.mockResolvedValue([]);
    const ClientActivityHistory = require('../backend/models/ClientActivityHistory');
    ClientActivityHistory.aggregate.mockResolvedValue([]);
    ClientProfile.aggregate.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/clinical/dashboard/aggregate-stats')
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalActiveClients');
    expect(res.body).toHaveProperty('sessionsThisMonth');
    expect(res.body).toHaveProperty('averageClientProgress');
    expect(res.body).toHaveProperty('topActivitiesAcrossClients');
    expect(res.body).toHaveProperty('caseloadByAgeGroup');
  });
});

describe('GET /api/clinical/dashboard/settings', () => {
  let app;
  beforeAll(() => { app = buildDashboardApp(); });

  it('returns default settings when none saved', async () => {
    mockSettingsDoc = null;

    const res = await request(app)
      .get('/api/clinical/dashboard/settings')
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('defaultDateRange');
    expect(res.body).toHaveProperty('favoriteMetrics');
    expect(res.body).toHaveProperty('alertPreferences');
  });

  it('returns saved settings when present', async () => {
    mockSettingsDoc = {
      practitionerId:  'prac1',
      defaultDateRange: '30_days',
      favoriteMetrics: ['dimension_radar'],
      alertPreferences: { no_recent_session: true },
    };

    const res = await request(app)
      .get('/api/clinical/dashboard/settings')
      .set('Authorization', authHeader(PRACTITIONER));

    expect(res.status).toBe(200);
    expect(res.body.defaultDateRange).toBe('30_days');
  });
});

describe('PATCH /api/clinical/dashboard/settings', () => {
  let app;
  beforeAll(() => { app = buildDashboardApp(); });

  it('returns 400 for invalid date_range', async () => {
    const res = await request(app)
      .patch('/api/clinical/dashboard/settings')
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ default_date_range: 'bad_range' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when no valid fields provided', async () => {
    const res = await request(app)
      .patch('/api/clinical/dashboard/settings')
      .set('Authorization', authHeader(PRACTITIONER))
      .send({});
    expect(res.status).toBe(400);
  });

  it('updates settings successfully', async () => {
    const updated = {
      practitionerId:  'prac1',
      defaultDateRange: '30_days',
      favoriteMetrics:  ['dimension_radar'],
      alertPreferences: { no_recent_session: true },
    };
    mockSettingsFindOneAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/api/clinical/dashboard/settings')
      .set('Authorization', authHeader(PRACTITIONER))
      .send({
        default_date_range: '30_days',
        favorite_metrics:   ['dimension_radar'],
      });

    expect(res.status).toBe(200);
    expect(mockSettingsFindOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when favorite_metrics is not an array', async () => {
    const res = await request(app)
      .patch('/api/clinical/dashboard/settings')
      .set('Authorization', authHeader(PRACTITIONER))
      .send({ favorite_metrics: 'not-an-array' });
    expect(res.status).toBe(400);
  });
});
