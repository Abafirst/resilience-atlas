'use strict';

/**
 * leadership-report.test.js
 *
 * Integration tests for the Leadership Report and Organization API endpoints.
 * All external dependencies (mongoose, models) are mocked.
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

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';

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
    Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
  };
});

// ── Mock all models used by the new routes ──────────────────────────────────

const mockOrg = {
  _id: 'org001',
  name: 'Test Organization',
  admins: ['user001'],
  invitedEmails: ['a@example.com', 'b@example.com'],
  completedResultIds: ['res001'],
  leadershipReportIds: [],
  autoGenerateEnabled: true,
  isActive: true,
};

jest.mock('../backend/models/Organization', () => {
  const Org = jest.fn().mockImplementation(() => mockOrg);
  Org.findById = jest.fn().mockResolvedValue(mockOrg);
  Org.find = jest.fn().mockResolvedValue([mockOrg]);
  Org.create = jest.fn().mockResolvedValue(mockOrg);
  Org.findByIdAndUpdate = jest.fn().mockResolvedValue(mockOrg);
  return Org;
});

const mockReport = {
  _id: 'report001',
  organizationId: 'org001',
  reportDate: new Date('2026-01-01'),
  teamOverview: {
    totalInvited: 2,
    totalRespondents: 1,
    responseRate: 50,
    averageOverallScore: 65,
    resilienceLevel: 'strong',
    previousAverageScore: null,
    scoreTrend: null,
  },
  dimensionAnalysis: {},
  strengthDistribution: {},
  keyObservations: [
    { type: 'strength', dimension: 'Relational', observation: 'Test obs', confidence: 90 },
  ],
  recommendations: [
    {
      title: 'Test rec',
      action: 'Do something',
      rationale: 'Because',
      timeline: '1 month',
      expectedImpact: 'Better resilience',
      difficulty: 'easy',
    },
  ],
  isArchived: false,
  lastUpdated: new Date(),
};

jest.mock('../backend/models/LeadershipReport', () => {
  const LR = jest.fn().mockImplementation(() => mockReport);
  const makeChain = (value) => ({
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(value),
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject),
    catch: (reject) => Promise.resolve(value).catch(reject),
  });
  LR.findOne = jest.fn().mockImplementation(() => makeChain(mockReport));
  LR.find = jest.fn().mockImplementation(() => ({
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([mockReport]),
    then: (resolve, reject) => Promise.resolve([mockReport]).then(resolve, reject),
    catch: (reject) => Promise.resolve([mockReport]).catch(reject),
  }));
  LR.findOneAndUpdate = jest.fn().mockResolvedValue({ ...mockReport, isArchived: true, lastUpdated: new Date() });
  LR.create = jest.fn().mockResolvedValue(mockReport);
  return LR;
});

jest.mock('../backend/models/ResilienceResult', () => ({
  create: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockResolvedValue([]),
}));

jest.mock('../backend/models/PracticeCompletion', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'comp001' }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock('../backend/models/Invite', () => ({
  findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'invite001', email: 'c@example.com' }),
}));

jest.mock('../backend/models/User', () => {
  const mockUser = {
    _id: 'user001',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    affiliateCode: 'RA-TESTUSER-ABC',
    stripeCustomerId: null,
    quizResults: [],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    toJSON: jest.fn(function () { return this; }),
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
  };
  const MockUser = jest.fn().mockImplementation(() => mockUser);
  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.findById = jest.fn().mockResolvedValue(mockUser);
  MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
  MockUser.countDocuments = jest.fn().mockResolvedValue(0);
  MockUser.find = jest.fn().mockResolvedValue([]);
  return MockUser;
});

jest.mock('stripe', () => function Stripe() {
  return {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test', status: 'requires_payment_method' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
    },
    customers: { create: jest.fn().mockResolvedValue({ id: 'cus_test' }) },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } },
      }),
    },
  };
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  })),
}));

// Mock the report generator to avoid real DB calls in route tests
jest.mock('../backend/services/leadership-report-generator', () => ({
  generateLeadershipReport: jest.fn().mockResolvedValue({
    _id: 'report001',
    reportDate: new Date('2026-01-01'),
  }),
  maybeAutoGenerate: jest.fn().mockResolvedValue(null),
}));

jest.mock('jsonwebtoken', () => {
  const real = jest.requireActual('jsonwebtoken');
  return { ...real, sign: real.sign, verify: real.verify };
});

// ── Test setup ──────────────────────────────────────────────────────────────

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../backend/server');

function authToken(userId = 'user001') {
  return jwt.sign({ userId, username: 'testuser', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Organization routes ──────────────────────────────────────────────────────

describe('POST /api/org', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/org').send({ name: 'Acme' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/org')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 201 with organization when name is provided', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.create.mockResolvedValueOnce(mockOrg);

    const res = await request(app)
      .post('/api/org')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ name: 'Acme Corp' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('organization');
  });
});

describe('GET /api/org/:organizationId', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/org/org001');
    expect(res.status).toBe(401);
  });

  test('returns 200 with organization for an admin', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce(mockOrg);

    const res = await request(app)
      .get('/api/org/org001')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('organization');
  });

  test('returns 403 for a non-admin user', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce({ ...mockOrg, admins: ['other-user'] });

    const res = await request(app)
      .get('/api/org/org001')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/org/:organizationId/invite', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/org/org001/invite').send({ emails: ['a@b.com'] });
    expect(res.status).toBe(401);
  });

  test('returns 400 when emails array is missing', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce(mockOrg);

    const res = await request(app)
      .post('/api/org/org001/invite')
      .set('Authorization', `Bearer ${authToken('user001')}`)
      .send({ emails: [] });
    expect(res.status).toBe(400);
  });

  test('returns 200 when valid emails are provided', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce(mockOrg);
    Organization.findByIdAndUpdate.mockResolvedValueOnce(mockOrg);

    const res = await request(app)
      .post('/api/org/org001/invite')
      .set('Authorization', `Bearer ${authToken('user001')}`)
      .send({ emails: ['c@example.com'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('invites_sent');
  });
});

// ── Leadership report routes ──────────────────────────────────────────────────

describe('GET /api/org/:organizationId/leadership-report', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/org/org001/leadership-report');
    expect(res.status).toBe(401);
  });

  test('returns 200 with report for an admin', async () => {
    const Organization = require('../backend/models/Organization');
    const LeadershipReport = require('../backend/models/LeadershipReport');
    Organization.findById.mockResolvedValueOnce(mockOrg);
    LeadershipReport.find.mockImplementationOnce(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockReport]),
    }));

    const res = await request(app)
      .get('/api/org/org001/leadership-report')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('report');
  });

  test('returns 404 when no report exists', async () => {
    const Organization = require('../backend/models/Organization');
    const LeadershipReport = require('../backend/models/LeadershipReport');
    Organization.findById.mockResolvedValueOnce(mockOrg);
    LeadershipReport.find.mockImplementationOnce(() => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }));

    const res = await request(app)
      .get('/api/org/org001/leadership-report')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/org/:organizationId/leadership-report/generate', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).post('/api/org/org001/leadership-report/generate');
    expect(res.status).toBe(401);
  });

  test('returns 201 with reportId on success', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce(mockOrg);

    const res = await request(app)
      .post('/api/org/org001/leadership-report/generate')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('reportId');
    expect(res.body).toHaveProperty('status', 'generated');
  });
});

describe('GET /api/org/:organizationId/leadership-report/history', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/org/org001/leadership-report/history');
    expect(res.status).toBe(401);
  });

  test('returns 200 with history array for an admin', async () => {
    const Organization = require('../backend/models/Organization');
    const LeadershipReport = require('../backend/models/LeadershipReport');
    Organization.findById.mockResolvedValueOnce(mockOrg);
    LeadershipReport.find.mockImplementationOnce(() => ({
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([mockReport]),
    }));

    const res = await request(app)
      .get('/api/org/org001/leadership-report/history')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
    expect(Array.isArray(res.body.history)).toBe(true);
  });
});

describe('PUT /api/org/:organizationId/leadership-report/:reportId/archive', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).put('/api/org/org001/leadership-report/report001/archive');
    expect(res.status).toBe(401);
  });

  test('returns 200 with success flag when archived', async () => {
    const Organization = require('../backend/models/Organization');
    const LeadershipReport = require('../backend/models/LeadershipReport');
    Organization.findById.mockResolvedValueOnce(mockOrg);
    LeadershipReport.findOneAndUpdate.mockResolvedValueOnce({ ...mockReport, isArchived: true, lastUpdated: new Date() });

    const res = await request(app)
      .put('/api/org/org001/leadership-report/report001/archive')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});

describe('GET /api/org/:organizationId/leadership-report/:reportId/compare', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/org/org001/leadership-report/report001/compare');
    expect(res.status).toBe(401);
  });

  test('returns 200 with comparison data', async () => {
    const Organization = require('../backend/models/Organization');
    const LeadershipReport = require('../backend/models/LeadershipReport');
    Organization.findById.mockResolvedValueOnce(mockOrg);
    // Both findOne calls in Promise.all: current report and no previous
    LeadershipReport.findOne
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockReport]),
        then: (r) => Promise.resolve(mockReport).then(r),
        catch: (r) => Promise.resolve(mockReport).catch(r),
      }))
      .mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        then: (r) => Promise.resolve(null).then(r),
        catch: (r) => Promise.resolve(null).catch(r),
      }));

    const res = await request(app)
      .get('/api/org/org001/leadership-report/report001/compare')
      .set('Authorization', `Bearer ${authToken('user001')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('comparison');
    expect(res.body.comparison).toHaveProperty('current');
  });
});
