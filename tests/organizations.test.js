'use strict';

/**
 * organizations.test.js
 *
 * Integration tests for the Business Tier /api/organizations endpoints.
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

const jwt = require('jsonwebtoken');

// ── Mongoose mock ─────────────────────────────────────────────────────────────
jest.mock('mongoose', () => {
  class Schema {
    constructor() {}
    pre() { return this; }
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

// ── Stripe mock ───────────────────────────────────────────────────────────────
jest.mock('stripe', () => function Stripe() {
  return {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test', status: 'requires_payment_method' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
    },
    customers: { create: jest.fn().mockResolvedValue({ id: 'cus_test' }) },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/pay/cs_test' }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cs_test', payment_status: 'paid',
          customer_email: 'test@example.com',
          metadata: { tier: 'deep-report', email: 'test@example.com' },
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test', customer_email: 'test@example.com', metadata: { tier: 'business' } } },
      }),
    },
  };
});

// ── Nodemailer mock ───────────────────────────────────────────────────────────
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  })),
}));

// ── JWT mock (keep real implementation) ──────────────────────────────────────
jest.mock('jsonwebtoken', () => {
  const real = jest.requireActual('jsonwebtoken');
  return { ...real, sign: real.sign, verify: real.verify };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const ADMIN_ID  = 'user001';
const ORG_ID    = 'org001';

const mockOrg = {
  _id: ORG_ID,
  name: 'Test Corp',
  company_name: 'Test Corp',
  admin_email: 'admin@test.com',
  plan: 'business',
  subscription_status: 'active',
  admins: [ADMIN_ID],
  invitedEmails: [],
  completedResultIds: ['res001'],
  settings: { team_name: 'Alpha Team', max_users: 10, custom_branding: false },
};

const mockResult = {
  _id: 'res001',
  email: 'alice@test.com',
  firstName: 'Alice',
  overall: 82,
  dominantType: 'Relational',
  scores: { relational: 85, cognitive: 70, somatic: 60, emotional: 75, spiritual: 80, agentic: 72 },
  createdAt: new Date('2026-03-10'),
};

const mockUser = {
  _id: ADMIN_ID,
  email: 'admin@test.com',
  organization_id: ORG_ID,
  role: 'admin',
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
};

const mockTeamResult = {
  _id: 'tr001',
  organization_id: ORG_ID,
  period: 'current',
  team_count: 1,
  averages: { relational: 85, cognitive: 70, somatic: 60, emotional: 75, spiritual: 80, agentic: 72, overall: 82 },
};

// ── Model mocks ───────────────────────────────────────────────────────────────
jest.mock('../backend/models/Organization', () => {
  const Org = jest.fn().mockImplementation(() => mockOrg);
  Org.findById = jest.fn().mockResolvedValue(mockOrg);
  Org.create   = jest.fn().mockResolvedValue(mockOrg);
  Org.findByIdAndUpdate = jest.fn().mockResolvedValue(mockOrg);
  return Org;
});

jest.mock('../backend/models/User', () => {
  const leanResult = [mockUser];
  const U = jest.fn().mockImplementation(() => mockUser);
  const leanable = (val) => ({ lean: jest.fn().mockResolvedValue(val) });
  U.findById          = jest.fn().mockReturnValue(leanable(mockUser));
  U.findOne           = jest.fn().mockReturnValue(leanable(mockUser));
  U.find              = jest.fn().mockReturnValue(leanable(leanResult));
  U.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
  U.countDocuments    = jest.fn().mockResolvedValue(1);
  return U;
});

jest.mock('../backend/models/ResilienceResult', () => {
  const RR = jest.fn().mockImplementation(() => mockResult);
  RR.find   = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([mockResult]) });
  RR.create = jest.fn().mockResolvedValue(mockResult);
  return RR;
});

jest.mock('../backend/models/TeamResult', () => {
  const TR = jest.fn().mockImplementation(() => mockTeamResult);
  TR.findOneAndUpdate = jest.fn().mockResolvedValue(mockTeamResult);
  TR.findOne          = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockTeamResult) });
  return TR;
});

jest.mock('../backend/models/LeadershipReport', () => {
  const LR = jest.fn().mockImplementation(() => ({}));
  const chain = { sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) };
  LR.findOne = jest.fn().mockResolvedValue(null);
  LR.find    = jest.fn().mockReturnValue(chain);
  LR.create  = jest.fn().mockResolvedValue({});
  return LR;
});

jest.mock('../backend/models/Purchase', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'purchase001' }),
  findOne: jest.fn().mockResolvedValue(null),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

jest.mock('../backend/models/PracticeCompletion', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'comp001' }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
}));

// Mock puppeteer to avoid launching a real browser in tests
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock analytics helper to avoid DB calls
jest.mock('../backend/routes/analytics', () => ({
  computeTeamAverages: jest.fn().mockResolvedValue(mockTeamResult),
}));

// Mock leadership-report-generator
jest.mock('../backend/services/leadership-report-generator', () => ({
  generateLeadershipReport: jest.fn().mockResolvedValue({ _id: 'report001' }),
  maybeAutoGenerate: jest.fn().mockResolvedValue(null),
}));

// ── Helper ────────────────────────────────────────────────────────────────────
function makeToken(userId = ADMIN_ID) {
  return jwt.sign({ userId }, process.env.JWT_SECRET);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
const request = require('supertest');
const app     = require('../backend/server');

describe('POST /api/organizations', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/organizations').send({
      company_name: 'Acme', admin_email: 'a@acme.com', plan: 'business',
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when company_name is missing', async () => {
    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ admin_email: 'a@acme.com', plan: 'business' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/company_name/i);
  });

  it('returns 400 when admin_email is missing', async () => {
    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ company_name: 'Acme', plan: 'business' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/admin_email/i);
  });

  it('returns 201 with organisation when required fields provided', async () => {
    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ company_name: 'Acme', admin_email: 'a@acme.com', plan: 'business' });
    expect(res.status).toBe(201);
    expect(res.body.organization).toBeDefined();
    expect(res.body.organization.company_name).toBe('Test Corp');
  });
});

describe('GET /api/organizations/:id', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/organizations/${ORG_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with organisation for an admin', async () => {
    const res = await request(app)
      .get(`/api/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(200);
    expect(res.body.organization).toBeDefined();
  });

  it('returns 403 for a non-admin user', async () => {
    // Temporarily return an org where this user is not an admin
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce({ ...mockOrg, admins: ['other-user'] });

    const res = await request(app)
      .get(`/api/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/organizations/:id', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).put(`/api/organizations/${ORG_ID}`).send({ company_name: 'New Name' });
    expect(res.status).toBe(401);
  });

  it('returns 200 and updates the organisation', async () => {
    const res = await request(app)
      .put(`/api/organizations/${ORG_ID}`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ company_name: 'Updated Corp' });
    expect(res.status).toBe(200);
    expect(res.body.organization).toBeDefined();
  });
});

describe('GET /api/organizations/:id/users', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/organizations/${ORG_ID}/users`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with a list of users for an admin', async () => {
    const res = await request(app)
      .get(`/api/organizations/${ORG_ID}/users`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});

describe('GET /api/organizations/:id/analytics', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/organizations/${ORG_ID}/analytics`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with analytics for an admin', async () => {
    const res = await request(app)
      .get(`/api/organizations/${ORG_ID}/analytics`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(200);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics.team_count).toBeDefined();
    expect(res.body.analytics.averages).toBeDefined();
  });
});

describe('GET /api/organizations/:id/results', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/organizations/${ORG_ID}/results`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with results array for an admin', async () => {
    const res = await request(app)
      .get(`/api/organizations/${ORG_ID}/results`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
  });
});

describe('POST /api/organizations/:id/export/csv', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post(`/api/organizations/${ORG_ID}/export/csv`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with CSV content for an admin', async () => {
    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/csv`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Name');
    expect(res.text).toContain('Email');
  });

  it('returns 403 for a non-admin user', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValueOnce({ ...mockOrg, admins: ['other-user'] });

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/csv`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/organizations/:id/export/pdf', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post(`/api/organizations/${ORG_ID}/export/pdf`);
    expect(res.status).toBe(401);
  });

  it('returns 200 with PDF content for an admin', async () => {
    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/pdf`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});
