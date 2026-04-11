'use strict';

/**
 * org-gamification.test.js
 *
 * Tests for the Enterprise org gamification routes:
 *   - Custom badge CRUD
 *   - Badge award
 *   - Challenge CRUD and completion
 *   - Org-wide leaderboard
 *   - Enterprise plan gate enforcement
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
  const createFromHexString = jest.fn((id) => id);
  return {
    connect: jest.fn().mockResolvedValue({}),
    Schema,
    model: jest.fn(),
    Types: {
      ObjectId: {
        isValid: jest.fn().mockReturnValue(true),
        createFromHexString,
      },
    },
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
const ADMIN_ID  = 'admin001';
const MEMBER_ID = 'member001';
const ORG_ID    = 'org001';
const BADGE_ID  = 'badge001';
const CHALLENGE_ID = 'chal001';

function makeToken(userId) {
  return jwt.sign({ userId, sub: userId }, 'test-secret', { expiresIn: '1h' });
}

const enterpriseOrg = {
  _id: ORG_ID,
  name: 'Enterprise Corp',
  plan: 'enterprise',
  admins: [ADMIN_ID],
};

const starterOrg = {
  _id: ORG_ID,
  name: 'Starter Corp',
  plan: 'teams-starter',
  admins: [ADMIN_ID],
};

const mockBadge = {
  _id: BADGE_ID,
  orgId: ORG_ID,
  name: 'Resilience Champion',
  description: 'Awarded for outstanding resilience',
  icon: '🏆',
  awardType: 'manual',
  retired: false,
};

const mockChallenge = {
  _id: CHALLENGE_ID,
  orgId: ORG_ID,
  title: 'Complete a grounding exercise',
  description: 'Take 5 minutes for a somatic grounding practice',
  dimension: 'somatic',
  points: 20,
  active: true,
};

// ── Model mocks ───────────────────────────────────────────────────────────────
jest.mock('../backend/models/Organization', () => {
  const Org = jest.fn();
  Org.findById = jest.fn();
  return Org;
});

jest.mock('../backend/models/User', () => {
  const U = jest.fn();
  U.findById = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: MEMBER_ID, organization_id: ORG_ID }) });
  return U;
});

jest.mock('../backend/models/OrgBadge', () => {
  const OB = jest.fn();
  OB.find       = jest.fn();
  OB.findOne    = jest.fn();
  OB.create     = jest.fn();
  OB.findOneAndUpdate = jest.fn();
  return OB;
});

jest.mock('../backend/models/OrgBadgeAward', () => {
  const OBA = jest.fn();
  OBA.find      = jest.fn();
  OBA.findOne   = jest.fn();
  OBA.create    = jest.fn();
  OBA.aggregate = jest.fn();
  return OBA;
});

jest.mock('../backend/models/OrgChallenge', () => {
  const OC = jest.fn();
  OC.find       = jest.fn();
  OC.findOne    = jest.fn();
  OC.create     = jest.fn();
  OC.findOneAndUpdate = jest.fn();
  return OC;
});

jest.mock('../backend/models/OrgChallengeCompletion', () => {
  const OCC = jest.fn();
  OCC.find      = jest.fn();
  OCC.findOne   = jest.fn();
  OCC.create    = jest.fn();
  OCC.aggregate = jest.fn();
  return OCC;
});

const request = require('supertest');
const express = require('express');

let app;

beforeEach(() => {
  app = express();
  app.use(express.json());
  app.use('/api/org-gamification', require('../backend/routes/org-gamification'));

  const Organization = require('../backend/models/Organization');
  const OrgBadge = require('../backend/models/OrgBadge');
  const OrgBadgeAward = require('../backend/models/OrgBadgeAward');
  const OrgChallenge = require('../backend/models/OrgChallenge');
  const OrgChallengeCompletion = require('../backend/models/OrgChallengeCompletion');

  Organization.findById.mockResolvedValue(enterpriseOrg);

  const badgeListChain = { sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([mockBadge]) }) };
  OrgBadge.find.mockReturnValue(badgeListChain);
  OrgBadge.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockBadge) });
  OrgBadge.create.mockResolvedValue(mockBadge);
  OrgBadge.findOneAndUpdate.mockResolvedValue(mockBadge);

  OrgBadgeAward.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }) });
  OrgBadgeAward.create.mockResolvedValue({ _id: 'award001' });
  OrgBadgeAward.aggregate.mockResolvedValue([]);

  const chalListChain = { sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([mockChallenge]) }) };
  OrgChallenge.find.mockReturnValue(chalListChain);
  OrgChallenge.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockChallenge) });
  OrgChallenge.create.mockResolvedValue(mockChallenge);
  OrgChallenge.findOneAndUpdate.mockResolvedValue(mockChallenge);

  OrgChallengeCompletion.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
  OrgChallengeCompletion.create.mockResolvedValue({ _id: 'completion001', pointsEarned: 20 });
  OrgChallengeCompletion.aggregate.mockResolvedValue([]);
});

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise gate enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe('Enterprise plan gate', () => {
  it('returns 403 for non-enterprise orgs on badges endpoint', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValue(starterOrg);

    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/badges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Enterprise/i);
  });

  it('returns 403 for non-enterprise orgs on challenges endpoint', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValue(starterOrg);

    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/challenges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
  });

  it('returns 403 for non-enterprise orgs on leaderboard endpoint', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValue(starterOrg);

    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/leaderboard`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
  });

  it('requires authentication on all endpoints', async () => {
    const res = await request(app).get(`/api/org-gamification/${ORG_ID}/badges`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Badges CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/org-gamification/:orgId/badges', () => {
  it('returns badge list for enterprise org', async () => {
    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/badges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.badges)).toBe(true);
    expect(res.body.badges[0].name).toBe('Resilience Champion');
  });
});

describe('POST /api/org-gamification/:orgId/badges', () => {
  it('creates a badge as admin', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/badges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ name: 'New Badge', description: 'A new badge', icon: '⭐' });

    expect(res.status).toBe(201);
    expect(res.body.badge).toBeDefined();
  });

  it('requires badge name', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/badges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ description: 'Missing name' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it('returns 403 for non-admin trying to create badge', async () => {
    const Organization = require('../backend/models/Organization');
    // Non-admin org — user not in admins list
    Organization.findById.mockResolvedValue({ ...enterpriseOrg, admins: ['other-admin'] });

    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/badges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ name: 'Test Badge' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/org-gamification/:orgId/badges/:badgeId (retire)', () => {
  it('retires badge as admin', async () => {
    const res = await request(app)
      .delete(`/api/org-gamification/${ORG_ID}/badges/${BADGE_ID}`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/org-gamification/:orgId/badges/:badgeId/award', () => {
  it('awards badge to a user', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/badges/${BADGE_ID}/award`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ userId: 'auth0|user123', email: 'user@test.com', note: 'Well done!' });

    expect(res.status).toBe(201);
    expect(res.body.award).toBeDefined();
  });

  it('requires userId when awarding', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/badges/${BADGE_ID}/award`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ email: 'user@test.com' }); // no userId

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Challenges CRUD
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/org-gamification/:orgId/challenges', () => {
  it('returns challenge list for enterprise org', async () => {
    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/challenges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.challenges)).toBe(true);
  });
});

describe('POST /api/org-gamification/:orgId/challenges', () => {
  it('creates a challenge as admin', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/challenges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ title: 'Grounding Challenge', points: 15 });

    expect(res.status).toBe(201);
    expect(res.body.challenge).toBeDefined();
  });

  it('requires title for challenge', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/challenges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ points: 10 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 403 for non-admin trying to create challenge', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValue({ ...enterpriseOrg, admins: ['other-admin'] });

    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/challenges`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`)
      .send({ title: 'Test Challenge' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/org-gamification/:orgId/challenges/:id/complete', () => {
  it('marks challenge as complete for member', async () => {
    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/challenges/${CHALLENGE_ID}/complete`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(201);
    expect(res.body.pointsEarned).toBeDefined();
  });

  it('returns 409 if challenge already completed by user', async () => {
    const OrgChallengeCompletion = require('../backend/models/OrgChallengeCompletion');
    const err = new Error('duplicate');
    err.code = 11000;
    OrgChallengeCompletion.create.mockRejectedValueOnce(err);

    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/challenges/${CHALLENGE_ID}/complete`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it('returns 404 for inactive challenge', async () => {
    const OrgChallenge = require('../backend/models/OrgChallenge');
    OrgChallenge.findOne.mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post(`/api/org-gamification/${ORG_ID}/challenges/${CHALLENGE_ID}/complete`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Org-wide leaderboard
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/org-gamification/:orgId/leaderboard', () => {
  it('returns leaderboard for enterprise org', async () => {
    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/leaderboard`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.leaderboard)).toBe(true);
  });

  it('returns 403 for non-enterprise plan', async () => {
    const Organization = require('../backend/models/Organization');
    Organization.findById.mockResolvedValue(starterOrg);

    const res = await request(app)
      .get(`/api/org-gamification/${ORG_ID}/leaderboard`)
      .set('Authorization', `Bearer ${makeToken(ADMIN_ID)}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app).get(`/api/org-gamification/${ORG_ID}/leaderboard`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Org isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('Org isolation', () => {
  it('cannot access another org — returns 403 if user is not a member', async () => {
    const Organization = require('../backend/models/Organization');
    const User = require('../backend/models/User');

    // Different org
    const otherOrg = { ...enterpriseOrg, _id: 'other-org', admins: ['other-admin'] };
    Organization.findById.mockResolvedValue(otherOrg);

    // User not in this org
    User.findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue({ _id: MEMBER_ID, organization_id: 'my-org' }),
    });

    const res = await request(app)
      .get(`/api/org-gamification/other-org/badges`)
      .set('Authorization', `Bearer ${makeToken(MEMBER_ID)}`);

    expect(res.status).toBe(403);
  });
});
