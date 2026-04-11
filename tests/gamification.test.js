'use strict';

/**
 * Tests for backend/routes/gamification.js and backend/services/gamificationService.js
 */

// ── Env ───────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET    = 'test-secret';
process.env.MONGODB_URI   = 'mongodb://localhost/test';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('winston', () => {
  const logger = {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add:   jest.fn(),
  };
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
    transports: {
      Console: function ConsoleTransport() {},
      File:    function FileTransport() {},
    },
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
    connect:    jest.fn().mockResolvedValue({}),
    disconnect: jest.fn().mockResolvedValue({}),
    Types:      { ObjectId: { isValid: jest.fn(() => true) } },
    Schema,
    model:      jest.fn(),
  };
});

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

// Mock https so userinfo calls can be controlled per-test without network.
// Agent is mocked as a jest.fn() constructor to satisfy Stripe's httpAgent requirement
// (backend/config/stripe.js creates `new https.Agent({ keepAlive: false })`).
jest.mock('https', () => ({
  request: jest.fn(),
  Agent:   jest.fn().mockImplementation(function AgentMock() {}),
}));

// ── Stub GamificationProgress model ──────────────────────────────────────────

jest.mock('../backend/models/GamificationProgress', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockProgress = {
    userId:     'user001',
    currentStreak: { days: 0, startDate: null, lastPracticeDate: null },
    longestStreak: 0,
    totalPoints:   0,
    pointHistory:  [],
    badges:        [],
    currentChallenge: {
      dimension: null, week: null, year: null,
      completedDays: 0, reward: 10, difficulty: 'medium',
    },
    completedChallenges: 0,
    challengeHistory:    [],
    leaderboardOptIn:    false,
    notificationsEnabled: true,
    save: mockSave,
  };

  const MockModel = function(data) {
    Object.assign(this, mockProgress, data);
    this.save = mockSave;
  };
  MockModel.findOne    = jest.fn().mockResolvedValue(mockProgress);
  MockModel.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 2 });
  MockModel.find       = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    }),
  });
  MockModel.__mockProgress = mockProgress;
  return MockModel;
});

// ── Mock other models loaded transitively by server.js ───────────────────────

jest.mock('../backend/models/User', () => {
  const mockUser = {
    _id: 'user001',
    username: 'testuser',
    email: 'test@example.com',
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
  };
  const MockUser = jest.fn().mockImplementation(() => mockUser);
  MockUser.findOne       = jest.fn().mockResolvedValue(null);
  MockUser.findById      = jest.fn().mockResolvedValue(mockUser);
  MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
  MockUser.countDocuments = jest.fn().mockResolvedValue(0);
  return MockUser;
});

jest.mock('../backend/models/ResilienceResult', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

jest.mock('../backend/models/Purchase', () => {
  const MockPurchase = jest.fn();
  // Default: no purchase found (entitlement check fails without STRIPE_SECRET_KEY skip)
  MockPurchase.findOne = jest.fn().mockResolvedValue(null);
  return MockPurchase;
});

jest.mock('stripe', () => function Stripe() {
  return {
    paymentIntents:   { create: jest.fn(), retrieve: jest.fn() },
    customers:        { create: jest.fn() },
    checkout:         { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://stripe.test' }) } },
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

jest.mock('jsonwebtoken', () => {
  const real = jest.requireActual('jsonwebtoken');
  return { ...real, sign: real.sign, verify: real.verify };
});

// ── App & helpers ─────────────────────────────────────────────────────────────

const request = require('supertest');
const app     = require('../backend/server');
const jwt     = require('jsonwebtoken');

function authToken(id = 'user001') {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/** Token that includes an email claim (required by requirePaidTier email lookup). */
function authTokenWithEmail(email = 'user@example.com', id = 'user001') {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/** Token simulating an Auth0-normalized payload (userId + sub, no id field). */
function authTokenAuth0(sub = 'auth0|user001') {
  return jwt.sign({ userId: sub, sub }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Token simulating an Auth0 access-token payload with iss claim but no email.
 * This is the real-world case for Google OAuth users where the email claim is
 * absent from the access token (it may only be available via userinfo).
 */
function authTokenAuth0WithIss(sub, iss) {
  return jwt.sign({ userId: sub, sub, iss }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Route tests ───────────────────────────────────────────────────────────────

describe('GET /api/gamification/progress', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/gamification/progress');
    expect(res.status).toBe(401);
  });

  test('returns 200 with progress for authenticated user', async () => {
    const res = await request(app)
      .get('/api/gamification/progress')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
  });

  test('returns 200 with progress for Auth0-authenticated user (sub-based userId)', async () => {
    const res = await request(app)
      .get('/api/gamification/progress')
      .set('Authorization', `Bearer ${authTokenAuth0('auth0|abc123')}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
  });
});

describe('POST /api/gamification/practice', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).post('/api/gamification/practice')
      .send({ practiceId: 'cn-01' });
    expect(res.status).toBe(401);
  });

  test('returns 400 when practiceId is missing', async () => {
    const res = await request(app)
      .post('/api/gamification/practice')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when practiceId is blank', async () => {
    const res = await request(app)
      .post('/api/gamification/practice')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ practiceId: '   ' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid dimension', async () => {
    const res = await request(app)
      .post('/api/gamification/practice')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ practiceId: 'cn-01', dimension: 'Not-A-Dimension' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 200 with valid practiceId (no dimension)', async () => {
    const res = await request(app)
      .post('/api/gamification/practice')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ practiceId: 'cn-01' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Practice completion recorded.');
    expect(res.body).toHaveProperty('totalPoints');
    expect(res.body).toHaveProperty('currentStreak');
    expect(Array.isArray(res.body.newBadges)).toBe(true);
  });

  test('returns 200 with valid practiceId and dimension', async () => {
    const res = await request(app)
      .post('/api/gamification/practice')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ practiceId: 'cn-01', dimension: 'Cognitive-Narrative' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Practice completion recorded.');
  });
});

describe('POST /api/gamification/challenge', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).post('/api/gamification/challenge').send({ dimension: 'Cognitive-Narrative' });
    expect(res.status).toBe(401);
  });

  test('returns 400 for missing dimension', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid dimension', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Unknown' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid difficulty', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Cognitive-Narrative', difficulty: 'extreme' });
    expect(res.status).toBe(400);
  });

  test('returns 200 for valid challenge setup', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Cognitive-Narrative', difficulty: 'easy' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Weekly challenge set.');
    expect(res.body).toHaveProperty('currentChallenge');
  });

  test('accepts canonical dimension Relational-Connective', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Relational-Connective', difficulty: 'easy' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Weekly challenge set.');
    expect(res.body.currentChallenge).toHaveProperty('dimension', 'Relational-Connective');
  });

  test('accepts canonical dimension Emotional-Adaptive', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Emotional-Adaptive', difficulty: 'medium' });
    expect(res.status).toBe(200);
    expect(res.body.currentChallenge).toHaveProperty('dimension', 'Emotional-Adaptive');
  });

  test('accepts legacy alias Relational-Social and normalizes to Relational-Connective', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Relational-Social', difficulty: 'easy' });
    expect(res.status).toBe(200);
    expect(res.body.currentChallenge).toHaveProperty('dimension', 'Relational-Connective');
  });

  test('accepts legacy alias Emotional-Somatic and normalizes to Emotional-Adaptive', async () => {
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ dimension: 'Emotional-Somatic', difficulty: 'hard' });
    expect(res.status).toBe(200);
    expect(res.body.currentChallenge).toHaveProperty('dimension', 'Emotional-Adaptive');
  });
});

describe('POST /api/gamification/share', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).post('/api/gamification/share');
    expect(res.status).toBe(401);
  });

  test('returns 200 and awards share point', async () => {
    const res = await request(app)
      .post('/api/gamification/share')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Share recorded.');
    expect(res.body).toHaveProperty('totalPoints');
  });
});

describe('PUT /api/gamification/preferences', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).put('/api/gamification/preferences')
      .send({ leaderboardOptIn: true });
    expect(res.status).toBe(401);
  });

  test('returns 400 when no preferences provided', async () => {
    const res = await request(app)
      .put('/api/gamification/preferences')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when leaderboardOptIn is not boolean', async () => {
    const res = await request(app)
      .put('/api/gamification/preferences')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ leaderboardOptIn: 'yes' });
    expect(res.status).toBe(400);
  });

  test('returns 200 when valid preferences provided', async () => {
    const res = await request(app)
      .put('/api/gamification/preferences')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ leaderboardOptIn: true, notificationsEnabled: false });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Preferences updated.');
    expect(res.body).toHaveProperty('leaderboardOptIn');
    expect(res.body).toHaveProperty('notificationsEnabled');
  });
});

describe('GET /api/gamification/leaderboard', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/gamification/leaderboard');
    expect(res.status).toBe(401);
  });

  test('returns 200 with entries array', async () => {
    const res = await request(app)
      .get('/api/gamification/leaderboard')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('entries');
    expect(Array.isArray(res.body.entries)).toBe(true);
  });

  test('accepts period and limit query params', async () => {
    const res = await request(app)
      .get('/api/gamification/leaderboard?period=monthly&limit=5')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('period', 'monthly');
  });

  test('defaults to weekly for unknown period', async () => {
    const res = await request(app)
      .get('/api/gamification/leaderboard?period=yearly')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('period', 'weekly');
  });
});

// ── Service unit tests ────────────────────────────────────────────────────────

describe('gamificationService — unit tests', () => {
  const svc = require('../backend/services/gamificationService');

  describe('getISOWeekAndYear', () => {
    test('returns week and year for a known date', () => {
      // 2024-01-08 is week 2 of 2024 in ISO 8601
      const { week, year } = svc.getISOWeekAndYear(new Date('2024-01-08T00:00:00Z'));
      expect(week).toBe(2);
      expect(year).toBe(2024);
    });

    test('returns week 1 for Jan 1 in a year starting on Monday', () => {
      // 2024-01-01 is week 1 of 2024
      const { week, year } = svc.getISOWeekAndYear(new Date('2024-01-01T00:00:00Z'));
      expect(week).toBe(1);
      expect(year).toBe(2024);
    });
  });

  describe('POINTS constants', () => {
    test('has expected point values', () => {
      expect(svc.POINTS.PRACTICE_COMPLETE).toBe(1);
      expect(svc.POINTS.STREAK_MAINTAINED).toBe(2);
      expect(svc.POINTS.CHALLENGE_COMPLETE).toBe(10);
      expect(svc.POINTS.BADGE_UNLOCKED).toBe(5);
      expect(svc.POINTS.SHARE).toBe(1);
    });
  });

  describe('BADGE_DEFINITIONS', () => {
    test('every badge has name, rarity, icon and test function', () => {
      svc.BADGE_DEFINITIONS.forEach(def => {
        expect(typeof def.name).toBe('string');
        expect(typeof def.rarity).toBe('string');
        expect(typeof def.icon).toBe('string');
        expect(typeof def.test).toBe('function');
      });
    });
  });
});

// ── Entitlement gate (requirePaidTier) ────────────────────────────────────────

describe('requirePaidTier — entitlement gate', () => {
  const originalStripeKey = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    // Enable the Stripe-gated tier check for this suite
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
  });

  afterEach(() => {
    // Restore original value (undefined in the test baseline)
    if (originalStripeKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = originalStripeKey;
    }
  });

  test('returns 403 with upgradeRequired when authenticated user has no paid purchase', async () => {
    const Purchase = require('../backend/models/Purchase');
    const User     = require('../backend/models/User');
    // No purchase and no legacy-flag access
    Purchase.findOne.mockResolvedValueOnce(null);
    User.findOne.mockResolvedValueOnce({ purchasedDeepReport: false, atlasPremium: false });

    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authTokenWithEmail('locked@example.com')}`)
      .send({ dimension: 'Cognitive-Narrative' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('upgradeRequired', true);
    expect(res.body.error).toMatch(/paid tier/i);
  });

  test('returns 200 when authenticated user has a completed atlas-starter purchase', async () => {
    const Purchase = require('../backend/models/Purchase');
    Purchase.findOne.mockResolvedValueOnce({ tier: 'atlas-starter', status: 'completed' });

    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authTokenWithEmail('starter@example.com')}`)
      .send({ dimension: 'Cognitive-Narrative', difficulty: 'easy' });

    expect(res.status).toBe(200);
  });

  // ── sub-as-email regression tests ──────────────────────────────────────────

  test('sub-only token: does NOT attempt purchase lookup using sub as email', async () => {
    const Purchase = require('../backend/models/Purchase');
    const User     = require('../backend/models/User');

    // No iss in token → userinfo path is skipped; User lookup by sub returns nothing.
    User.findOne.mockResolvedValueOnce(null); // user model fallback also finds nothing

    const sub = 'google-oauth2|116737161976967572606';
    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authTokenAuth0(sub)}`)
      .send({ dimension: 'Cognitive-Narrative' });

    // Should be denied (403) — NOT because sub was used as email and failed purchase
    // lookup, but because no email was resolved at all.
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('upgradeRequired', true);

    // Purchase.findOne must NOT have been called with the sub string as email.
    const purchaseCalls = Purchase.findOne.mock.calls;
    const calledWithSubAsEmail = purchaseCalls.some(
      ([query]) => query && query.email === sub
    );
    expect(calledWithSubAsEmail).toBe(false);
  });

  test('sub-only token + userinfo returns email + purchase exists → 200', async () => {
    const https    = require('https');
    const Purchase = require('../backend/models/Purchase');
    const { EventEmitter } = require('events');

    const navigatorEmail = 'navigator@example.com';

    // Mock https.request to simulate Auth0 userinfo returning an email.
    https.request.mockImplementation((options, callback) => {
      const res = new EventEmitter();
      res.statusCode = 200;
      res.setEncoding = jest.fn();

      const fakeReq = new EventEmitter();
      fakeReq.setTimeout = jest.fn();
      fakeReq.end = jest.fn(() => {
        setImmediate(() => {
          callback(res);
          setImmediate(() => {
            res.emit('data', JSON.stringify({ email: navigatorEmail }));
            res.emit('end');
          });
        });
      });
      fakeReq.destroy = jest.fn();
      return fakeReq;
    });

    // Purchase found for the email returned by userinfo.
    Purchase.findOne.mockResolvedValueOnce({ tier: 'atlas-navigator', status: 'completed' });

    const sub = 'google-oauth2|116737161976967572606';
    const iss = 'https://dev-ammhzit80o0cjhx5.us.auth0.com/';

    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authTokenAuth0WithIss(sub, iss)}`)
      .send({ dimension: 'Cognitive-Narrative', difficulty: 'easy' });

    expect(res.status).toBe(200);

    // Restore https mock for subsequent tests.
    https.request.mockReset();
  });

  test('sub-only token + userinfo fails + no user fallback → 403', async () => {
    const https = require('https');
    const User  = require('../backend/models/User');
    const { EventEmitter } = require('events');

    // Mock https.request to simulate userinfo network error.
    https.request.mockImplementation(() => {
      const fakeReq = new EventEmitter();
      fakeReq.setTimeout = jest.fn();
      fakeReq.end = jest.fn(() => {
        setImmediate(() => fakeReq.emit('error', new Error('Connection refused')));
      });
      fakeReq.destroy = jest.fn();
      return fakeReq;
    });

    // User model fallback finds nothing.
    User.findOne.mockResolvedValueOnce(null);

    const sub = 'google-oauth2|116737161976967572606';
    const iss = 'https://dev-ammhzit80o0cjhx5.us.auth0.com/';

    const res = await request(app)
      .post('/api/gamification/challenge')
      .set('Authorization', `Bearer ${authTokenAuth0WithIss(sub, iss)}`)
      .send({ dimension: 'Cognitive-Narrative' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('upgradeRequired', true);

    // Restore https mock.
    https.request.mockReset();
  });
});
