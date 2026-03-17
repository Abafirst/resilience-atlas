'use strict';

/**
 * team-analytics.test.js
 *
 * Tests for:
 *  - backend/services/teamAnalyticsService.js (unit tests for helpers)
 *  - backend/routes/team-analytics.js        (integration tests via supertest)
 */

// ── Environment ───────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('winston', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), add: jest.fn() };
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
    transports: { Console: function () {}, File: function () {} },
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
    connect: jest.fn().mockResolvedValue({}),
    Types: { ObjectId: { isValid: jest.fn(() => true) } },
    Schema,
    model: jest.fn(),
  };
});

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

// ── Shared mock data ──────────────────────────────────────────────────────────

const ADMIN_USER = {
  _id: 'user001',
  username: 'Alice Admin',
  email: 'alice@acme.com',
  organizationId: 'org001',
  role: 'admin',
};

const MEMBER_USER = {
  _id: 'user002',
  username: 'Bob Member',
  email: 'bob@acme.com',
  organizationId: 'org001',
  role: 'member',
};

const MOCK_ORG = {
  _id: 'org001',
  name: 'Acme Corp',
  admins: ['user001'],
  isActive: true,
};

const MOCK_TEAM_PROFILE = {
  _id: 'profile001',
  orgId: 'org001',
  teamId: null,
  teamProfile: {
    name: 'Acme Corp',
    memberCount: 2,
    overallScore: 74.5,
    assessmentDate: new Date('2026-03-10'),
    dimensionAverages: {
      'Cognitive-Narrative':   72,
      'Relational-Connective': 80,
      'Agentic-Generative':    68,
      'Emotional-Adaptive':    75,
      'Spiritual-Reflective':  70,
      'Somatic-Regulative':    63,
    },
    trends: {},
  },
  memberStatus: [
    {
      userId: 'user001', name: 'Alice Admin', role: 'admin', score: 82,
      assessmentDate: new Date('2026-03-10'), status: 'assessed',
      riskFlags: [], dimensionScores: { relational: 85, cognitive: 78, somatic: 72, emotional: 80, spiritual: 88, agentic: 81 },
    },
    {
      userId: 'user002', name: 'Bob Member', role: 'member', score: 38,
      assessmentDate: new Date('2026-03-09'), status: 'assessed',
      riskFlags: ['Overall resilience score critically low (38%)'],
      dimensionScores: { relational: 68, cognitive: 72, somatic: 40, emotional: 70, spiritual: 52, agentic: 55 },
    },
  ],
  recommendations: {
    strengthFocus:       ['Leverage Relational-Connective: team scores 80% — share best practices across teams.'],
    riskIntervention:    ['Integrate movement breaks, breathing exercises, and physical wellness into the workday.'],
    workshopSuggestions: ['Somatic Awareness & Stress-Regulation Practice'],
    peerMentoringPairs:  [{ mentor: 'Alice Admin', mentee: 'Bob Member', dimension: 'Somatic-Regulative' }],
  },
  generatedReport: '<html><body>Report</body></html>',
  generatedAt: new Date('2026-03-10'),
  isActive: true,
};

// ── Model mocks ───────────────────────────────────────────────────────────────

const mockOrgModel = { findById: jest.fn() };
const mockUserModel = { findById: jest.fn(), find: jest.fn() };
const mockTeamProfileModel = {
  findOne: jest.fn(),
  create:  jest.fn(),
  find:    jest.fn(),
};
const mockResilienceResultModel = { find: jest.fn() };

jest.mock('../backend/models/Organization',     () => mockOrgModel);
jest.mock('../backend/models/User',             () => mockUserModel);
jest.mock('../backend/models/TeamProfile',      () => mockTeamProfileModel);
jest.mock('../backend/models/ResilienceResult', () => mockResilienceResultModel);

// ── App setup ─────────────────────────────────────────────────────────────────

const express = require('express');
const jwt     = require('jsonwebtoken');
const request = require('supertest');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/team-analytics', require('../backend/routes/team-analytics'));
  return app;
}

function authToken(userId = 'user001', extra = {}) {
  return jwt.sign({ userId, ...extra }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function lean(val) {
  return { lean: jest.fn().mockResolvedValue(val) };
}

function sortLean(val) {
  return { sort: jest.fn().mockReturnValue(lean(val)) };
}

// ── Unit tests: teamAnalyticsService helpers ──────────────────────────────────

describe('teamAnalyticsService — helpers', () => {
  const svc = require('../backend/services/teamAnalyticsService');

  test('scoreCategory returns correct category', () => {
    expect(svc.scoreCategory(85)).toBe('strong');
    expect(svc.scoreCategory(70)).toBe('solid');
    expect(svc.scoreCategory(50)).toBe('developing');
    expect(svc.scoreCategory(30)).toBe('emerging');
    expect(svc.scoreCategory(null)).toBe(null);
  });

  test('buildRiskFlags flags low overall score', () => {
    const flags = svc.buildRiskFlags({}, {}, 35);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags[0]).toMatch(/critically low/i);
  });

  test('buildRiskFlags flags emerging dimension', () => {
    const dimScores = { somatic: 30 };
    const teamAvg   = { somatic: 65 };
    const flags = svc.buildRiskFlags(dimScores, teamAvg, 70);
    expect(flags.some((f) => /somatic/i.test(f))).toBe(true);
  });

  test('buildRiskFlags flags score below team average by >10%', () => {
    const dimScores = { cognitive: 50 };
    const teamAvg   = { cognitive: 65 };
    const flags = svc.buildRiskFlags(dimScores, teamAvg, 70);
    expect(flags.some((f) => /cognitive/i.test(f))).toBe(true);
  });

  test('buildRiskFlags returns empty array when member is healthy', () => {
    const dimScores = { cognitive: 80, relational: 75, agentic: 70, emotional: 72, spiritual: 68, somatic: 65 };
    const teamAvg   = { cognitive: 70, relational: 65, agentic: 60, emotional: 65, spiritual: 60, somatic: 58 };
    const flags = svc.buildRiskFlags(dimScores, teamAvg, 80);
    expect(flags.length).toBe(0);
  });

  test('identifyMentoringPairs returns pairs when data exists', () => {
    const members = [
      {
        status: 'assessed', name: 'Alice', dimensionScores: { cognitive: 85, relational: 75, agentic: 70, emotional: 80, spiritual: 88, somatic: 72 },
      },
      {
        status: 'assessed', name: 'Bob', dimensionScores: { cognitive: 40, relational: 60, agentic: 50, emotional: 55, spiritual: 45, somatic: 35 },
      },
    ];
    const dimAverages = { cognitive: 62, relational: 67, agentic: 60, emotional: 67, spiritual: 66, somatic: 53 };
    const pairs = svc.identifyMentoringPairs(members, dimAverages);
    expect(Array.isArray(pairs)).toBe(true);
    // At least one pair should be suggested
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0]).toHaveProperty('mentor');
    expect(pairs[0]).toHaveProperty('mentee');
    expect(pairs[0]).toHaveProperty('dimension');
  });

  test('identifyMentoringPairs returns empty array for insufficient data', () => {
    const pairs = svc.identifyMentoringPairs([], {});
    expect(pairs).toEqual([]);
  });

  test('buildRecommendations returns correct structure', () => {
    const dimAverages = { cognitive: 80, relational: 75, agentic: 70, emotional: 65, spiritual: 55, somatic: 40 };
    const recs = svc.buildRecommendations(dimAverages, [], []);
    expect(recs).toHaveProperty('strengthFocus');
    expect(recs).toHaveProperty('riskIntervention');
    expect(recs).toHaveProperty('workshopSuggestions');
    expect(recs).toHaveProperty('peerMentoringPairs');
    expect(Array.isArray(recs.strengthFocus)).toBe(true);
  });

  test('generateNarrativeReport returns HTML string', () => {
    const analytics = {
      teamProfile: {
        name: 'Test Team',
        overallScore: 72,
        memberCount: 5,
        dimensionAverages: {
          'Cognitive-Narrative':   72,
          'Relational-Connective': 80,
          'Agentic-Generative':    68,
          'Emotional-Adaptive':    75,
          'Spiritual-Reflective':  70,
          'Somatic-Regulative':    63,
        },
      },
      memberStatus: [
        { status: 'assessed', name: 'Alice', riskFlags: [] },
        { status: 'assessed', name: 'Bob',   riskFlags: ['Low score'] },
      ],
      recommendations: {
        strengthFocus:       ['Leverage Relational-Connective'],
        riskIntervention:    ['Improve Somatic'],
        workshopSuggestions: ['Somatic Workshop'],
        peerMentoringPairs:  [{ mentor: 'Alice', mentee: 'Bob', dimension: 'Somatic-Regulative' }],
      },
    };
    const html = svc.generateNarrativeReport(analytics);
    expect(typeof html).toBe('string');
    expect(html).toMatch(/<html/i);
    expect(html).toContain('Test Team');
    expect(html).toContain('72%');
    expect(html).toContain('Alice');
  });
});

// ── Route integration tests ───────────────────────────────────────────────────

describe('GET /api/team-analytics/:orgId', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue(lean(ADMIN_USER));
    mockOrgModel.findById.mockReturnValue(lean(MOCK_ORG));
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(MOCK_TEAM_PROFILE));
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/team-analytics/org001');
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin user', async () => {
    mockUserModel.findById.mockReturnValue(lean(MEMBER_USER));
    const res = await request(app)
      .get('/api/team-analytics/org001')
      .set('Authorization', `Bearer ${authToken('user002')}`);
    expect(res.status).toBe(403);
  });

  test('returns 404 when no snapshot exists', async () => {
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(null));
    const res = await request(app)
      .get('/api/team-analytics/org001')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(404);
  });

  test('returns 200 with analytics for admin', async () => {
    const res = await request(app)
      .get('/api/team-analytics/org001')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('analytics');
    expect(res.body.analytics).toHaveProperty('teamProfile');
  });

  test('analytics includes overallScore and memberCount', async () => {
    const res = await request(app)
      .get('/api/team-analytics/org001')
      .set('Authorization', `Bearer ${authToken()}`);
    const { analytics } = res.body;
    expect(analytics).toHaveProperty('memberCount');
    expect(analytics).toHaveProperty('atRiskCount');
    expect(analytics).toHaveProperty('generatedAt');
  });
});

describe('POST /api/team-analytics/:orgId/generate', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue(lean(ADMIN_USER));
    mockOrgModel.findById.mockReturnValue(lean(MOCK_ORG));
    // buildTeamAnalytics needs User.find and ResilienceResult.find
    mockUserModel.find.mockReturnValue(lean([
      { _id: 'user001', username: 'Alice Admin', email: 'alice@acme.com', teamName: null, role: 'admin' },
    ]));
    mockResilienceResultModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue(lean([])),
    });
    // TeamProfile.findOne for existing profile (none)
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(null));
    // TeamProfile.create
    mockTeamProfileModel.create.mockResolvedValue({
      ...MOCK_TEAM_PROFILE,
      toObject: () => MOCK_TEAM_PROFILE,
    });
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/team-analytics/org001/generate');
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin', async () => {
    mockUserModel.findById.mockReturnValue(lean(MEMBER_USER));
    const res = await request(app)
      .post('/api/team-analytics/org001/generate')
      .set('Authorization', `Bearer ${authToken('user002')}`);
    expect(res.status).toBe(403);
  });

  test('returns 201 with profileId for admin', async () => {
    const res = await request(app)
      .post('/api/team-analytics/org001/generate')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('profileId');
    expect(res.body).toHaveProperty('status', 'generated');
    expect(res.body).toHaveProperty('generatedAt');
  });
});

describe('GET /api/team-analytics/:orgId/report', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue(lean(ADMIN_USER));
    mockOrgModel.findById.mockReturnValue(lean(MOCK_ORG));
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(MOCK_TEAM_PROFILE));
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/team-analytics/org001/report');
    expect(res.status).toBe(401);
  });

  test('returns HTML report for admin', async () => {
    const res = await request(app)
      .get('/api/team-analytics/org001/report')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Report');
  });

  test('returns 404 when no report exists', async () => {
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(null));
    const res = await request(app)
      .get('/api/team-analytics/org001/report')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/team-analytics/:orgId/members', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(MOCK_TEAM_PROFILE));
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/team-analytics/org001/members');
    expect(res.status).toBe(401);
  });

  test('returns full member list for admin', async () => {
    mockUserModel.findById.mockReturnValue(lean(ADMIN_USER));
    mockOrgModel.findById.mockReturnValue(lean(MOCK_ORG));
    const res = await request(app)
      .get('/api/team-analytics/org001/members')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('members');
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members.length).toBe(2);
    // Admin sees full risk flags
    const bob = res.body.members.find((m) => m.name === 'Bob Member');
    expect(bob).toBeDefined();
    expect(bob.riskFlags.length).toBeGreaterThan(0);
  });

  test('returns redacted member list for regular member', async () => {
    mockUserModel.findById.mockReturnValue(lean(MEMBER_USER));
    mockOrgModel.findById.mockReturnValue(lean({ ...MOCK_ORG, admins: ['user001'] }));
    const res = await request(app)
      .get('/api/team-analytics/org001/members')
      .set('Authorization', `Bearer ${authToken('user002')}`);
    expect(res.status).toBe(200);
    const others = res.body.members.filter((m) => m.name === 'Team Member');
    expect(others.length).toBeGreaterThan(0);
  });
});

describe('GET /api/team-analytics/:orgId/risk', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue(lean(ADMIN_USER));
    mockOrgModel.findById.mockReturnValue(lean(MOCK_ORG));
    mockTeamProfileModel.findOne.mockReturnValue(sortLean(MOCK_TEAM_PROFILE));
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/team-analytics/org001/risk');
    expect(res.status).toBe(401);
  });

  test('returns at-risk members for admin', async () => {
    const res = await request(app)
      .get('/api/team-analytics/org001/risk')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('atRiskCount');
    expect(res.body).toHaveProperty('members');
    expect(res.body.atRiskCount).toBe(1);
    expect(res.body.members[0].name).toBe('Bob Member');
  });
});

describe('GET /api/team-analytics/:orgId/compare', () => {
  let app;
  const PREV_PROFILE = {
    ...MOCK_TEAM_PROFILE,
    _id: 'profile000',
    teamProfile: {
      ...MOCK_TEAM_PROFILE.teamProfile,
      overallScore: 70.0,
      memberCount: 2,
    },
    generatedAt: new Date('2026-02-10'),
  };

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue(lean(ADMIN_USER));
    mockOrgModel.findById.mockReturnValue(lean(MOCK_ORG));
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/team-analytics/org001/compare');
    expect(res.status).toBe(401);
  });

  test('returns comparison data when two snapshots exist', async () => {
    mockTeamProfileModel.findOne
      .mockReturnValueOnce({ sort: jest.fn().mockReturnValue(lean(MOCK_TEAM_PROFILE)) })
      .mockReturnValueOnce({ sort: jest.fn().mockReturnValue(lean(PREV_PROFILE)) });

    const res = await request(app)
      .get('/api/team-analytics/org001/compare')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('current');
    expect(res.body).toHaveProperty('previous');
    expect(res.body).toHaveProperty('comparison');
    expect(res.body.comparison).toHaveProperty('overallDelta');
    expect(res.body.comparison).toHaveProperty('direction');
  });

  test('returns comparison with null previous when only one snapshot', async () => {
    mockTeamProfileModel.findOne
      .mockReturnValueOnce({ sort: jest.fn().mockReturnValue(lean(MOCK_TEAM_PROFILE)) })
      .mockReturnValueOnce({ sort: jest.fn().mockReturnValue(lean(null)) });

    const res = await request(app)
      .get('/api/team-analytics/org001/compare')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.previous).toBeNull();
    expect(res.body.comparison.overallDelta).toBeNull();
  });
});
