'use strict';

/**
 * Tests for backend/routes/dashboard.js
 * Tests the B2B dashboard API endpoints using a minimal standalone Express app.
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

jest.mock('express-rate-limit', () => {
  return () => (req, res, next) => next();
});

// ── Model mocks ───────────────────────────────────────────────────────────────

const mockOrgAdmin = {
  _id: 'user001',
  username: 'Alice Admin',
  email: 'alice@acme.com',
  organizationId: 'org001',
  role: 'admin',
  teamName: 'Team A',
};

const mockOrgMember = {
  _id: 'user002',
  username: 'Bob Member',
  email: 'bob@acme.com',
  organizationId: 'org001',
  role: 'member',
  teamName: 'Team B',
};

const mockOrg = {
  _id: 'org001',
  name: 'Acme Corp',
  tier: 'business',
  createdAt: new Date('2026-01-01'),
};

const mockResults = [
  {
    userId: 'user001',
    organizationId: 'org001',
    overall: 82,
    dominantType: 'Relational',
    dimension_scores: { relational: 85, cognitive: 78, somatic: 72, emotional: 80, spiritual: 88, agentic: 81 },
    scores: null,
    createdAt: new Date('2026-03-10'),
  },
  {
    userId: 'user002',
    organizationId: 'org001',
    overall: 71,
    dominantType: 'Cognitive-Narrative',
    dimension_scores: { relational: 68, cognitive: 72, somatic: 60, emotional: 70, spiritual: 75, agentic: 76 },
    scores: null,
    createdAt: new Date('2026-03-09'),
  },
];

const mockMembers = [
  { _id: 'user001', username: 'Alice Admin',  email: 'alice@acme.com', teamName: 'Team A', role: 'admin' },
  { _id: 'user002', username: 'Bob Member',   email: 'bob@acme.com',   teamName: 'Team B', role: 'member' },
];

const mockUserModel = {
  findById:       jest.fn(),
  find:           jest.fn(),
  countDocuments: jest.fn().mockResolvedValue(2),
};

const mockOrgModel = {
  findById: jest.fn(),
};

const mockResultModel = {
  find: jest.fn(),
};

const mockInviteModel = {
  countDocuments: jest.fn().mockResolvedValue(2),
};

jest.mock('../backend/models/User', () => mockUserModel);
jest.mock('../backend/models/Organization', () => mockOrgModel);
jest.mock('../backend/models/ResilienceResult', () => mockResultModel);
jest.mock('../backend/models/Invite', () => mockInviteModel);

// ── App setup ─────────────────────────────────────────────────────────────────

const express = require('express');
const jwt     = require('jsonwebtoken');
const request = require('supertest');

function buildApp() {
  const app = express();
  app.use(express.json());
  // Mount the dashboard router under /api/dashboard
  app.use('/api/dashboard', require('../backend/routes/dashboard'));
  return app;
}

function authToken(userId, extra) {
  return jwt.sign(
    Object.assign({ userId: userId || 'user001' }, extra || {}),
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupFindLean(mockFn, value) {
  mockFn.mockReturnValue({ lean: jest.fn().mockResolvedValue(value) });
}

function setupResultFind(value) {
  mockResultModel.find.mockReturnValue({
    sort:  jest.fn().mockReturnThis(),
    lean:  jest.fn().mockResolvedValue(value),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/dashboard/org-summary', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockOrgAdmin) });
    mockOrgModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockOrg) });
    setupResultFind(mockResults);
    mockUserModel.countDocuments.mockResolvedValue(2);
    mockInviteModel.countDocuments.mockResolvedValue(2);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/dashboard/org-summary');
    expect(res.status).toBe(401);
  });

  test('returns 403 when user has no organizationId', async () => {
    mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ ...mockOrgAdmin, organizationId: null }) });
    const res = await request(app)
      .get('/api/dashboard/org-summary')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/organization/i);
  });

  test('returns 200 with org summary for an org member', async () => {
    const res = await request(app)
      .get('/api/dashboard/org-summary')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('organization');
    expect(res.body).toHaveProperty('summary');
    expect(res.body.organization.name).toBe('Acme Corp');
  });

  test('summary includes all required fields', async () => {
    const res = await request(app)
      .get('/api/dashboard/org-summary')
      .set('Authorization', `Bearer ${authToken()}`);
    const { summary } = res.body;
    expect(summary).toHaveProperty('avg_overall_score');
    expect(summary).toHaveProperty('strongest_dimension');
    expect(summary).toHaveProperty('weakest_dimension');
    expect(summary).toHaveProperty('completion_rate');
    expect(summary).toHaveProperty('total_members');
    expect(summary).toHaveProperty('completed_assessments');
    expect(summary).toHaveProperty('dimension_averages');
  });

  test('calculates correct average overall score', async () => {
    const res = await request(app)
      .get('/api/dashboard/org-summary')
      .set('Authorization', `Bearer ${authToken()}`);
    // avg of 82 and 71 = 76.5
    expect(res.body.summary.avg_overall_score).toBeCloseTo(76.5, 0);
  });

  test('identifies strongest and weakest dimensions', async () => {
    const res = await request(app)
      .get('/api/dashboard/org-summary')
      .set('Authorization', `Bearer ${authToken()}`);
    const { summary } = res.body;
    // Spiritual averages: (88+75)/2 = 81.5 — should be strongest
    // Somatic averages: (72+60)/2 = 66 — should be weakest
    expect(summary.strongest_dimension).toBe('spiritual');
    expect(summary.weakest_dimension).toBe('somatic');
  });
});

describe('GET /api/dashboard/members', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockOrgAdmin) });
    setupFindLean(mockUserModel.find, mockMembers);
    setupResultFind(mockResults);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/dashboard/members');
    expect(res.status).toBe(401);
  });

  test('returns 200 with members list for org member', async () => {
    const res = await request(app)
      .get('/api/dashboard/members')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('members');
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members).toHaveLength(2);
  });

  test('members include expected fields', async () => {
    const res = await request(app)
      .get('/api/dashboard/members')
      .set('Authorization', `Bearer ${authToken()}`);
    const member = res.body.members[0];
    expect(member).toHaveProperty('user_id');
    expect(member).toHaveProperty('name');
    expect(member).toHaveProperty('email');
    expect(member).toHaveProperty('team');
    expect(member).toHaveProperty('overall_score');
    expect(member).toHaveProperty('dominant_dimension');
    expect(member).toHaveProperty('completed_at');
    expect(member).toHaveProperty('dimension_scores');
  });

  test('member overall_score is correctly populated', async () => {
    const res = await request(app)
      .get('/api/dashboard/members')
      .set('Authorization', `Bearer ${authToken()}`);
    const alice = res.body.members.find((m) => m.email === 'alice@acme.com');
    expect(alice).toBeDefined();
    expect(alice.overall_score).toBe(82);
  });
});

describe('GET /api/dashboard/team-breakdown', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockOrgAdmin) });
    setupFindLean(mockUserModel.find, mockMembers);
    setupResultFind(mockResults);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/dashboard/team-breakdown');
    expect(res.status).toBe(401);
  });

  test('returns 200 with teams list for org member', async () => {
    const res = await request(app)
      .get('/api/dashboard/team-breakdown')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('teams');
    expect(Array.isArray(res.body.teams)).toBe(true);
  });

  test('teams include expected fields', async () => {
    const res = await request(app)
      .get('/api/dashboard/team-breakdown')
      .set('Authorization', `Bearer ${authToken()}`);
    if (res.body.teams.length > 0) {
      const team = res.body.teams[0];
      expect(team).toHaveProperty('team_name');
      expect(team).toHaveProperty('avg_score');
      expect(team).toHaveProperty('member_count');
      expect(team).toHaveProperty('dimension_averages');
    }
  });

  test('groups members by team correctly', async () => {
    const res = await request(app)
      .get('/api/dashboard/team-breakdown')
      .set('Authorization', `Bearer ${authToken()}`);
    const teamNames = res.body.teams.map((t) => t.team_name).sort();
    expect(teamNames).toContain('Team A');
    expect(teamNames).toContain('Team B');
  });
});

describe('GET /api/dashboard/export/csv', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockOrgAdmin) });
    setupFindLean(mockUserModel.find, mockMembers);
    mockOrgModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'org001', name: 'Acme Corp' }) });
    setupResultFind(mockResults);
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/dashboard/export/csv');
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin users', async () => {
    mockUserModel.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockOrgMember) });
    const res = await request(app)
      .get('/api/dashboard/export/csv')
      .set('Authorization', `Bearer ${authToken('user002')}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  test('returns CSV file for admin users', async () => {
    const res = await request(app)
      .get('/api/dashboard/export/csv')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  test('CSV includes correct header row', async () => {
    const res = await request(app)
      .get('/api/dashboard/export/csv')
      .set('Authorization', `Bearer ${authToken()}`);
    const lines = res.text.split('\n');
    const header = lines[0];
    expect(header).toMatch(/Name,Email,Team,Overall_Score/);
    expect(header).toMatch(/Relational.*Cognitive.*Somatic.*Emotional.*Spiritual.*Agentic/);
    expect(header).toMatch(/Dominant_Dimension,Completed_At/);
  });

  test('CSV includes member data rows', async () => {
    const res = await request(app)
      .get('/api/dashboard/export/csv')
      .set('Authorization', `Bearer ${authToken()}`);
    const lines = res.text.split('\n').filter(Boolean);
    // Should have header + 2 member rows
    expect(lines.length).toBeGreaterThanOrEqual(2);
    // Check Alice's row is in there
    const aliceRow = lines.find((l) => l.includes('alice@acme.com'));
    expect(aliceRow).toBeDefined();
    expect(aliceRow).toMatch(/82/);
  });
});
