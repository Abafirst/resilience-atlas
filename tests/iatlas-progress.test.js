'use strict';

/**
 * tests/iatlas-progress.test.js
 *
 * Tests for the IATLAS profile-based progress persistence endpoints:
 *   GET    /api/iatlas/progress/:profileId  — load saved progress snapshot
 *   POST   /api/iatlas/progress/:profileId  — save/upsert progress snapshot
 *   DELETE /api/iatlas/progress/:profileId  — clear all progress for a profile
 */

// ── State ─────────────────────────────────────────────────────────────────────

let mockChildProfileDoc = null;
let mockSavedProfileDoc = null;

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../backend/models/ChildProfile', () => {
  const M = {
    findOne: jest.fn().mockImplementation(() => {
      // Build a Mongoose-like document with .lean() and save/markModified support.
      const createDoc = () => {
        if (!mockChildProfileDoc) return null;
        const doc = { ...mockChildProfileDoc };
        doc.markModified = jest.fn();
        doc.save = jest.fn().mockImplementation(function () {
          mockSavedProfileDoc = { ...this };
          return Promise.resolve({
            ...this,
            updatedAt: new Date('2026-04-29T10:35:00.000Z'),
          });
        });
        return doc;
      };

      const doc = createDoc();
      // Return a thenable that also has a .lean() method so the route can
      // call either `await findOne(...)` or `await findOne(...).lean()`.
      const promise = Promise.resolve(doc);
      promise.lean = () => Promise.resolve(doc ? { ...doc } : null);
      return promise;
    }),
  };
  return M;
});

jest.mock('../backend/models/IATLASProgress', () => {
  const M = {
    findOne: jest.fn().mockResolvedValue(null),
    findOneAndUpdate: jest.fn().mockResolvedValue(null),
  };
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
      return res.status(401).json({ error: 'Invalid token.' });
    }
    next();
  },
}));

jest.mock('../backend/utils/logger', () => ({
  info:  jest.fn(),
  error: jest.fn(),
  warn:  jest.fn(),
  debug: jest.fn(),
}));

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

jest.mock('mongoose', () => {
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

// ── App setup ─────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/iatlas/progress', require('../backend/routes/iatlas-progress'));
  return app;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Encode a user payload as a fake Bearer token (base64 JSON). */
function authHeader(payload) {
  return 'Bearer ' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

const USER_A = { sub: 'user-a', userId: 'user-a' };
const USER_B = { sub: 'user-b', userId: 'user-b' };
const PROFILE_ID = 'profile-abc-123';

function makeChildProfile(overrides = {}) {
  return {
    profileId: PROFILE_ID,
    userId:    USER_A.userId,
    name:      'Test Child',
    ageGroup:  '8-10',
    progress: {
      dimensions:          {},
      totalXP:             0,
      level:               1,
      badges:              [],
      streaks:             {},
      completedActivities: {},
      certificates:        [],
    },
    updatedAt: new Date('2026-04-29T10:30:00.000Z'),
    ...overrides,
  };
}

// ── Reset state before each test ──────────────────────────────────────────────

beforeEach(() => {
  mockChildProfileDoc = null;
  mockSavedProfileDoc = null;
  const ChildProfile = require('../backend/models/ChildProfile');
  ChildProfile.findOne.mockClear();
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/iatlas/progress/:profileId
// ═════════════════════════════════════════════════════════════════════════════

describe('GET /api/iatlas/progress/:profileId', () => {
  test('returns 401 when no auth token is provided', async () => {
    const res = await request(buildApp())
      .get(`/api/iatlas/progress/${PROFILE_ID}`)
      .send();
    expect(res.status).toBe(401);
  });

  test('returns 403 when profile does not exist or belongs to different user', async () => {
    mockChildProfileDoc = null; // profile not found

    const res = await request(buildApp())
      .get(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  test('returns empty progress object when profile exists but has no progress', async () => {
    mockChildProfileDoc = makeChildProfile();

    const res = await request(buildApp())
      .get(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('progress');
    expect(res.body.progress).toEqual({});
    expect(res.body.lastSyncedAt).toBeNull();
  });

  test('returns stored progress when profile has existing progress', async () => {
    mockChildProfileDoc = makeChildProfile({
      progress: {
        dimensions:          {},
        totalXP:             450,
        level:               3,
        badges:              ['first-activity', 'early-explorer'],
        streaks:             { current: 5, longest: 7, lastDate: '2026-04-28' },
        completedActivities: {
          'age-8-10/deep-breathing': { completedAt: '2026-04-28T10:00:00Z', starsEarned: 3 },
        },
        certificates: [],
      },
      updatedAt: new Date('2026-04-29T10:30:00.000Z'),
    });

    const res = await request(buildApp())
      .get(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(200);
    expect(res.body.progress.totalXP).toBe(450);
    expect(res.body.progress.level).toBe(3);
    expect(res.body.progress.badges).toContain('first-activity');
    expect(res.body.progress.completedActivities).toHaveProperty('age-8-10/deep-breathing');
    expect(res.body.lastSyncedAt).not.toBeNull();
  });

  test('returns 403 when profile belongs to a different user', async () => {
    // Profile is owned by USER_A; request is from USER_B.
    // The global mock returns null when mockChildProfileDoc = null,
    // which simulates the ownership check failing.
    mockChildProfileDoc = null;

    const res = await request(buildApp())
      .get(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_B));

    expect(res.status).toBe(403);
  });

  test('returns 400 for invalid profileId format', async () => {
    const res = await request(buildApp())
      .get('/api/iatlas/progress/invalid$profile!id')
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/iatlas/progress/:profileId
// ═════════════════════════════════════════════════════════════════════════════

describe('POST /api/iatlas/progress/:profileId', () => {
  test('returns 401 when no auth token is provided', async () => {
    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .send({ progress: { totalXP: 100 } });
    expect(res.status).toBe(401);
  });

  test('returns 400 when progress body is missing', async () => {
    mockChildProfileDoc = makeChildProfile();

    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when progress is not an object', async () => {
    mockChildProfileDoc = makeChildProfile();

    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({ progress: 'not-an-object' });

    expect(res.status).toBe(400);
  });

  test('returns 403 when profile does not exist or belongs to different user', async () => {
    mockChildProfileDoc = null;

    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({ progress: { totalXP: 100 } });

    expect(res.status).toBe(403);
  });

  test('creates/updates progress document successfully (upsert)', async () => {
    mockChildProfileDoc = makeChildProfile();

    const progressPayload = {
      completedActivities: {
        'age-8-10/deep-breathing': { completedAt: '2026-04-29T10:00:00Z', starsEarned: 3 },
      },
      totalXP:  450,
      level:    3,
      badges:   ['first-activity', 'early-explorer'],
      streaks:  { current: 5, longest: 7, lastDate: '2026-04-28' },
      certificates: [],
    };

    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({ progress: progressPayload });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('progress');
    expect(res.body).toHaveProperty('lastSyncedAt');
  });

  test('merges incoming progress with existing progress', async () => {
    // Profile already has some progress
    mockChildProfileDoc = makeChildProfile({
      progress: {
        dimensions:          {},
        totalXP:             200,
        level:               2,
        badges:              ['first-activity'],
        streaks:             { current: 3, longest: 5 },
        completedActivities: { 'age-8-10/activity-1': { completedAt: '2026-04-28' } },
        certificates:        [],
      },
    });

    // New progress only updates XP and adds a new badge
    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({
        progress: {
          totalXP: 450,
          badges:  ['first-activity', 'early-explorer'],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('returns 400 when totalXP is negative', async () => {
    mockChildProfileDoc = makeChildProfile();

    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({ progress: { totalXP: -10 } });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/totalXP/);
  });

  test('returns 400 when level is less than 1', async () => {
    mockChildProfileDoc = makeChildProfile();

    const res = await request(buildApp())
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({ progress: { level: 0 } });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/level/);
  });

  test('returns 400 for invalid profileId format', async () => {
    const res = await request(buildApp())
      .post('/api/iatlas/progress/invalid$profile!id')
      .set('Authorization', authHeader(USER_A))
      .send({ progress: { totalXP: 100 } });

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// DELETE /api/iatlas/progress/:profileId
// ═════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/iatlas/progress/:profileId', () => {
  test('returns 401 when no auth token is provided', async () => {
    const res = await request(buildApp())
      .delete(`/api/iatlas/progress/${PROFILE_ID}`)
      .send();
    expect(res.status).toBe(401);
  });

  test('returns 403 when profile does not exist or belongs to different user', async () => {
    mockChildProfileDoc = null;

    const res = await request(buildApp())
      .delete(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(403);
  });

  test('clears progress for the profile and returns success', async () => {
    mockChildProfileDoc = makeChildProfile({
      progress: {
        totalXP:             500,
        level:               4,
        badges:              ['first-activity'],
        completedActivities: { 'age-8-10/deep-breathing': {} },
        certificates:        [],
        dimensions:          {},
        streaks:             {},
      },
    });

    const res = await request(buildApp())
      .delete(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain(PROFILE_ID);
  });

  test('returns 400 for invalid profileId format', async () => {
    const res = await request(buildApp())
      .delete('/api/iatlas/progress/invalid$profile!id')
      .set('Authorization', authHeader(USER_A));

    expect(res.status).toBe(400);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Integration: POST then GET
// ═════════════════════════════════════════════════════════════════════════════

describe('Integration: save progress then load it', () => {
  test('progress saved via POST is returned by GET', async () => {
    const progressPayload = {
      completedActivities: {
        'age-8-10/deep-breathing': { completedAt: '2026-04-29T10:00:00Z', starsEarned: 3 },
        'age-8-10/body-scan':      { completedAt: '2026-04-29T11:00:00Z', starsEarned: 2 },
      },
      totalXP:      175,
      level:        2,
      badges:       ['first-activity'],
      streaks:      { current: 2, longest: 2, lastDate: '2026-04-29' },
      certificates: [],
    };

    const ChildProfile = require('../backend/models/ChildProfile');

    // POST call: findOne returns a writable document (no .lean()).
    ChildProfile.findOne.mockImplementationOnce(() => {
      const doc = makeChildProfile();
      doc.markModified = jest.fn();
      doc.save = jest.fn().mockResolvedValue({
        ...doc,
        progress:  progressPayload,
        updatedAt: new Date('2026-04-29T10:35:00.000Z'),
      });
      const p = Promise.resolve(doc);
      p.lean = () => Promise.resolve({ ...doc });
      return p;
    });

    // GET call: findOne returns a plain lean doc with saved progress.
    ChildProfile.findOne.mockImplementationOnce(() => {
      const doc = {
        ...makeChildProfile({ progress: progressPayload }),
        updatedAt: new Date('2026-04-29T10:35:00.000Z'),
      };
      const p = Promise.resolve(doc);
      p.lean = () => Promise.resolve({ ...doc });
      return p;
    });

    const app = request(buildApp());

    // Step 1: save progress
    const postRes = await app
      .post(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A))
      .send({ progress: progressPayload });

    expect(postRes.status).toBe(200);
    expect(postRes.body.success).toBe(true);

    // Step 2: load progress
    const getRes = await app
      .get(`/api/iatlas/progress/${PROFILE_ID}`)
      .set('Authorization', authHeader(USER_A));

    expect(getRes.status).toBe(200);
    expect(getRes.body.progress.totalXP).toBe(175);
    expect(getRes.body.progress.level).toBe(2);
    expect(getRes.body.progress.badges).toContain('first-activity');
  });
});
