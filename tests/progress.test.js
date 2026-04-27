'use strict';

/**
 * Tests for backend/routes/progress.js — user progress persistence API.
 */

// ── Env ───────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET  = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';

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

jest.mock('https', () => ({
  request: jest.fn(),
  Agent:   jest.fn().mockImplementation(function AgentMock() {}),
}));

// ── Stub UserProgress model ───────────────────────────────────────────────────

const DEFAULT_ADULT_DOC = {
  userId:           'user001',
  childProfileId:   null,
  progressType:     'adult',
  skillProgress:    {},
  completedModules: [],
  xp:               0,
  level:            1,
  badges:           [],
  streaks:          { current: 0, longest: 0, lastActivityDate: null },
  quests:           [],
  rawAdultData:     {},
  lastSyncedAt:     null,
  createdAt:        new Date('2025-01-15T12:00:00.000Z'),
  updatedAt:        new Date('2025-01-15T12:00:00.000Z'),
};

let mockUserProgressDoc = null;

jest.mock('../backend/models/UserProgress', () => {
  const mockDefaultDoc = {
    userId:           'user001',
    childProfileId:   null,
    progressType:     'adult',
    skillProgress:    {},
    completedModules: [],
    xp:               0,
    level:            1,
    badges:           [],
    streaks:          { current: 0, longest: 0, lastActivityDate: null },
    quests:           [],
    rawAdultData:     {},
    lastSyncedAt:     null,
  };

  const MockModel = jest.fn().mockImplementation(function(data) {
    Object.assign(this, mockDefaultDoc, data);
  });

  MockModel.findOne = jest.fn().mockImplementation(() => {
    const result = mockUserProgressDoc ? { ...mockUserProgressDoc } : null;
    return { lean: jest.fn().mockResolvedValue(result) };
  });

  MockModel.findOneAndUpdate = jest.fn().mockImplementation((_filter, update, _opts) => {
    const setData = update.$set || {};
    const result = { ...mockDefaultDoc, ...mockUserProgressDoc, ...setData };
    mockUserProgressDoc = result;
    return { lean: jest.fn().mockResolvedValue({ ...result }) };
  });

  MockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });

  return MockModel;
});

// ── Other model mocks required by server.js ───────────────────────────────────

jest.mock('../backend/models/User', () => {
  const MockUser = jest.fn().mockImplementation(() => ({}));
  MockUser.findOne         = jest.fn().mockResolvedValue(null);
  MockUser.findById        = jest.fn().mockResolvedValue(null);
  MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  MockUser.countDocuments  = jest.fn().mockResolvedValue(0);
  return MockUser;
});

jest.mock('../backend/models/ResilienceResult', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

jest.mock('../backend/models/Purchase', () => {
  const M = jest.fn();
  M.findOne = jest.fn().mockResolvedValue(null);
  return M;
});

jest.mock('stripe', () => function Stripe() {
  return {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
    customers:      { create: jest.fn() },
    checkout:       { sessions: { create: jest.fn().mockResolvedValue({ url: 'https://stripe.test' }) } },
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

function authTokenUserId(userId = 'user001') {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function authTokenAuth0(sub = 'auth0|user001') {
  return jwt.sign({ userId: sub, sub }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Tests: GET /api/progress ──────────────────────────────────────────────────

describe('GET /api/progress', () => {
  beforeEach(() => {
    mockUserProgressDoc = null;
    const UserProgress = require('../backend/models/UserProgress');
    UserProgress.findOne.mockClear();
  });

  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/progress');
    expect(res.status).toBe(401);
  });

  test('returns default empty progress when no document exists', async () => {
    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body.exists).toBe(false);
    expect(res.body.progress).toHaveProperty('completedModules');
    expect(res.body.progress).toHaveProperty('xp', 0);
    expect(res.body.progress).toHaveProperty('level', 1);
    expect(Array.isArray(res.body.progress.badges)).toBe(true);
  });

  test('returns stored progress when document exists', async () => {
    mockUserProgressDoc = {
      ...DEFAULT_ADULT_DOC,
      userId:   'user001',
      xp:       500,
      level:    3,
      badges:   ['badge-one'],
      streaks:  { current: 5, longest: 10, lastActivityDate: '2025-01-14' },
    };

    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
    expect(res.body.progress.xp).toBe(500);
    expect(res.body.progress.level).toBe(3);
    expect(res.body.progress.badges).toContain('badge-one');
  });

  test('returns kids progress when childProfileId is provided', async () => {
    mockUserProgressDoc = null;

    const res = await request(app)
      .get('/api/progress?childProfileId=child-abc')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(false);
    expect(res.body.progress).toHaveProperty('kidsActivities');
    expect(res.body.progress).toHaveProperty('kidsBadges');
    expect(res.body.progress).toHaveProperty('kidsStreaks');
    expect(res.body.progress.childProfileId).toBe('child-abc');
  });

  test('accepts Auth0 sub-based userId token', async () => {
    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${authTokenAuth0('auth0|abc123')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
  });
});

// ── Tests: POST /api/progress/sync ────────────────────────────────────────────

describe('POST /api/progress/sync', () => {
  beforeEach(() => {
    mockUserProgressDoc = null;
    const UserProgress = require('../backend/models/UserProgress');
    UserProgress.findOne.mockClear();
    UserProgress.findOneAndUpdate.mockClear();
  });

  test('returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/progress/sync')
      .send({ progressData: { xp: 100 } });
    expect(res.status).toBe(401);
  });

  test('returns 400 when progressData is missing', async () => {
    const res = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when progressData is not an object', async () => {
    const res = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ progressData: 'not-an-object' });
    expect(res.status).toBe(400);
  });

  test('creates a new progress document on first sync', async () => {
    const progressData = {
      xp:     1200,
      level:  5,
      badges: ['badge-1', 'badge-2'],
      streaks: { current: 3, longest: 7, lastActivityDate: '2025-01-14' },
    };

    const res = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ progressData });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body).toHaveProperty('lastSyncedAt');

    const UserProgress = require('../backend/models/UserProgress');
    expect(UserProgress.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String), childProfileId: null }),
      expect.objectContaining({ $set: expect.objectContaining({ lastSyncedAt: expect.any(Date) }) }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  test('merges new data with existing document', async () => {
    mockUserProgressDoc = {
      ...DEFAULT_ADULT_DOC,
      xp:     500,
      level:  2,
      badges: ['badge-existing'],
    };

    const progressData = {
      xp:     1200,
      badges: ['badge-new'],
    };

    const res = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ progressData });

    expect(res.status).toBe(200);
    // The merged XP should be max(500, 1200) = 1200
    const UserProgress = require('../backend/models/UserProgress');
    const callArg = UserProgress.findOneAndUpdate.mock.calls[0][1].$set;
    expect(callArg.xp).toBe(1200);
    // Badges should be union
    expect(callArg.badges).toContain('badge-existing');
    expect(callArg.badges).toContain('badge-new');
  });

  test('syncs kids progress when childProfileId is provided', async () => {
    const progressData = {
      kidsActivities: { 'activity-1': { completed: true, stars: 3 } },
      kidsBadges:     ['kids-badge-1'],
    };

    const res = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ childProfileId: 'child-abc', progressData });

    expect(res.status).toBe(200);

    const UserProgress = require('../backend/models/UserProgress');
    const [filter] = UserProgress.findOneAndUpdate.mock.calls[0];
    expect(filter.childProfileId).toBe('child-abc');
  });

  test('accepts Auth0 sub-based userId token', async () => {
    const res = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authTokenAuth0('auth0|user999')}`)
      .send({ progressData: { xp: 100 } });

    expect(res.status).toBe(200);
  });
});

// ── Tests: DELETE /api/progress/reset ─────────────────────────────────────────

describe('DELETE /api/progress/reset', () => {
  beforeEach(() => {
    mockUserProgressDoc = null;
    const UserProgress = require('../backend/models/UserProgress');
    UserProgress.deleteOne.mockClear();
  });

  test('returns 401 without authentication', async () => {
    const res = await request(app).delete('/api/progress/reset').send({});
    expect(res.status).toBe(401);
  });

  test('returns { success: true } for authenticated user', async () => {
    const res = await request(app)
      .delete('/api/progress/reset')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const UserProgress = require('../backend/models/UserProgress');
    expect(UserProgress.deleteOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: expect.any(String), childProfileId: null })
    );
  });

  test('deletes child profile progress when childProfileId is provided', async () => {
    const res = await request(app)
      .delete('/api/progress/reset')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ childProfileId: 'child-abc' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const UserProgress = require('../backend/models/UserProgress');
    const [filter] = UserProgress.deleteOne.mock.calls[0];
    expect(filter.childProfileId).toBe('child-abc');
  });
});

// ── Integration test: Create → Fetch → Verify ─────────────────────────────────

describe('Integration: create via sync then fetch', () => {
  let savedProgress = null;

  beforeEach(() => {
    mockUserProgressDoc = null;
    savedProgress = null;

    const UserProgress = require('../backend/models/UserProgress');

    UserProgress.findOneAndUpdate.mockImplementation((_filter, update, _opts) => {
      const setData = update.$set || {};
      savedProgress = { ...DEFAULT_ADULT_DOC, ...setData };
      mockUserProgressDoc = savedProgress;
      return { lean: jest.fn().mockResolvedValue({ ...savedProgress }) };
    });

    UserProgress.findOne.mockImplementation(() =>
      ({ lean: jest.fn().mockResolvedValue(savedProgress ? { ...savedProgress } : null) })
    );
  });

  test('progress created via sync is returned by GET', async () => {
    const progressData = {
      xp:     800,
      level:  4,
      badges: ['badge-alpha'],
      streaks: { current: 5, longest: 12, lastActivityDate: '2025-01-10' },
      completedModules: ['mod-1', 'mod-2'],
    };

    // Step 1: sync progress to backend
    const syncRes = await request(app)
      .post('/api/progress/sync')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ progressData });

    expect(syncRes.status).toBe(200);
    expect(syncRes.body.progress).toHaveProperty('xp', 800);

    // Step 2: fetch progress back
    const getRes = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${authToken()}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.exists).toBe(true);
    expect(getRes.body.progress.xp).toBe(800);
    expect(getRes.body.progress.level).toBe(4);
    expect(getRes.body.progress.badges).toContain('badge-alpha');
  });
});
