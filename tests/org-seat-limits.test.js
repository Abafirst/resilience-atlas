'use strict';

/**
 * org-seat-limits.test.js
 *
 * Tests that the invite handler enforces seat limits based on org plan.
 * Also verifies CSV/PDF export tier gates.
 */

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

// ── Stripe / Nodemailer mocks ─────────────────────────────────────────────────
jest.mock('stripe', () => function Stripe() {
  return { checkout: { sessions: { create: jest.fn().mockResolvedValue({ id: 'cs_test', url: 'https://stripe.com' }) } } };
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  })),
}));

jest.mock('jsonwebtoken', () => {
  const real = jest.requireActual('jsonwebtoken');
  return { ...real };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const ADMIN_ID = 'admin001';
const ORG_ID = 'org001';

function makeToken(userId) {
  return jwt.sign({ userId, sub: userId }, 'test-secret', { expiresIn: '1h' });
}

const makeOrg = (plan, invitedEmails = []) => ({
  _id: ORG_ID,
  name: 'Test Corp',
  company_name: 'Test Corp',
  plan,
  subscription_status: 'active',
  admins: [ADMIN_ID],
  invitedEmails,
  completedResultIds: [],
  settings: { max_users: 100 },
});

// ── Model mocks (will be reconfigured per test) ───────────────────────────────
let mockOrg;

jest.mock('../backend/models/Organization', () => {
  const Org = jest.fn();
  Org.findById = jest.fn();
  Org.create = jest.fn();
  Org.findByIdAndUpdate = jest.fn().mockResolvedValue({});
  return Org;
});

jest.mock('../backend/models/Invite', () => {
  const Invite = jest.fn();
  Invite.findOneAndUpdate = jest.fn().mockResolvedValue({ _id: 'inv001', status: 'pending' });
  Invite.countDocuments = jest.fn().mockResolvedValue(0);
  return Invite;
});

jest.mock('../backend/models/User', () => {
  const U = jest.fn();
  U.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: ADMIN_ID, role: 'admin' }) });
  U.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  U.countDocuments = jest.fn().mockResolvedValue(0);
  return U;
});

jest.mock('../backend/models/ResilienceResult', () => {
  const RR = jest.fn();
  RR.find = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  return RR;
});

jest.mock('../backend/models/TeamResult', () => {
  const TR = jest.fn();
  TR.findOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  return TR;
});

// Mock puppeteer for PDF tests
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.alloc(5000, '%PDF-mock')),
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

// Mock emailService
jest.mock('../backend/services/emailService', () => ({
  sendInviteEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../backend/services/leadership-report-generator', () => ({
  maybeAutoGenerate: jest.fn().mockResolvedValue(null),
}));

const request = require('supertest');
const express = require('express');

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/org', require('../backend/routes/organization'));
  app.use('/api/organizations', require('../backend/routes/organizations'));

  const Organization = require('../backend/models/Organization');
  const Invite = require('../backend/models/Invite');
  const User = require('../backend/models/User');

  // Reset to defaults
  mockOrg = makeOrg('teams-starter', []);
  Organization.findById.mockResolvedValue(mockOrg);
  Invite.countDocuments.mockResolvedValue(0);
  User.countDocuments.mockResolvedValue(1); // 1 admin already
});

// ─────────────────────────────────────────────────────────────────────────────
// Invite seat limit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Invite seat limits — Basic plan (max 15)', () => {
  it('allows invites when under the seat limit', async () => {
    const Organization = require('../backend/models/Organization');
    // 1 admin + 5 invited = 6 seats used, inviting 5 more = 11 total (under 15)
    mockOrg = makeOrg('teams-starter', ['a@t.com','b@t.com','c@t.com','d@t.com','e@t.com']);
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/org/${ORG_ID}/invite`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ emails: ['f@t.com','g@t.com','h@t.com','i@t.com','j@t.com'] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects invites that would exceed 15-seat limit', async () => {
    const Organization = require('../backend/models/Organization');
    // Already at 14 invited emails, trying to add 2 more (would exceed 15)
    const emails14 = Array.from({length: 14}, (_, i) => `user${i}@t.com`);
    mockOrg = makeOrg('teams-starter', emails14);
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/org/${ORG_ID}/invite`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ emails: ['new1@t.com', 'new2@t.com'] });

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/seat limit/i);
    expect(res.body.seats_max).toBe(15);
  });

  it('allows re-inviting an already-invited email (no seat consumed)', async () => {
    const Organization = require('../backend/models/Organization');
    // At limit with 15 emails, but re-inviting an existing one should not block
    const emails15 = Array.from({length: 15}, (_, i) => `user${i}@t.com`);
    mockOrg = makeOrg('teams-starter', emails15);
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/org/${ORG_ID}/invite`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ emails: ['user0@t.com'] }); // already in the list

    // Should succeed because it's a re-invite (no new seat consumed)
    expect(res.status).toBe(200);
  });
});

describe('Invite seat limits — Premium plan (max 30)', () => {
  it('allows up to 30 invites on pro plan', async () => {
    const Organization = require('../backend/models/Organization');
    const emails20 = Array.from({length: 20}, (_, i) => `user${i}@t.com`);
    mockOrg = makeOrg('teams-pro', emails20);
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/org/${ORG_ID}/invite`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ emails: ['new1@t.com','new2@t.com','new3@t.com'] });

    expect(res.status).toBe(200);
  });

  it('rejects invites exceeding 30-seat limit on pro plan', async () => {
    const Organization = require('../backend/models/Organization');
    const emails29 = Array.from({length: 29}, (_, i) => `user${i}@t.com`);
    mockOrg = makeOrg('teams-pro', emails29);
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/org/${ORG_ID}/invite`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ emails: ['new1@t.com', 'new2@t.com'] });

    expect(res.status).toBe(422);
    expect(res.body.seats_max).toBe(30);
  });
});

describe('Invite seat limits — Enterprise plan (unlimited)', () => {
  it('allows more than 30 invites on enterprise plan', async () => {
    const Organization = require('../backend/models/Organization');
    const emails50 = Array.from({length: 50}, (_, i) => `user${i}@enterprise.com`);
    mockOrg = makeOrg('enterprise', emails50);
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/org/${ORG_ID}/invite`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ emails: ['new1@enterprise.com','new2@enterprise.com'] });

    // Enterprise has no seat limit, so this should succeed
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CSV export tier gate tests
// ─────────────────────────────────────────────────────────────────────────────

describe('CSV export — tier gate', () => {
  it('allows CSV export for teams-starter plan', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('teams-starter');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/csv`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
  });

  it('allows CSV export for enterprise plan', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('enterprise');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/csv`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
  });

  it('rejects CSV export for free plan', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('free');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/csv`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Basic/i);
  });

  it('requires authentication for CSV export', async () => {
    const res = await request(app).post(`/api/organizations/${ORG_ID}/export/csv`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PDF export tier gate tests
// ─────────────────────────────────────────────────────────────────────────────

describe('PDF export — tier gate', () => {
  it('allows PDF export for teams-pro plan', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('teams-pro');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/pdf`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });

  it('allows PDF export for enterprise plan', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('enterprise');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/pdf`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
  });

  it('rejects PDF export for teams-starter plan (Basic)', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('teams-starter');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/pdf`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Premium/i);
  });

  it('rejects PDF export for free plan', async () => {
    const Organization = require('../backend/models/Organization');
    mockOrg = makeOrg('free');
    Organization.findById.mockResolvedValue(mockOrg);

    const res = await request(app)
      .post(`/api/organizations/${ORG_ID}/export/pdf`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
  });

  it('requires authentication for PDF export', async () => {
    const res = await request(app).post(`/api/organizations/${ORG_ID}/export/pdf`);
    expect(res.status).toBe(401);
  });
});
