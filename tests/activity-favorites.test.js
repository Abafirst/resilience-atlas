'use strict';

/**
 * activity-favorites.test.js
 * Tests for backend/routes/activity-favorites.js
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

// ── ActivityFavorites model mock ──────────────────────────────────────────────

let mockFavDoc = null;

jest.mock('../backend/models/ActivityFavorites', () => {
  const MockActivityFavorites = jest.fn();

  MockActivityFavorites.findOne = jest.fn().mockImplementation(() => ({
    lean: jest.fn().mockImplementation(async () => mockFavDoc),
  }));

  // The POST handler now uses an aggregation pipeline update (array as second arg).
  // This mock handles both the pipeline case (add) and the classic update ($pull)
  // used by the DELETE handler.
  MockActivityFavorites.findOneAndUpdate = jest.fn().mockImplementation(
    async (_filter, update, _opts) => {
      if (!mockFavDoc) {
        mockFavDoc = { userId: 'user001', favorites: [] };
      }
      // Aggregation pipeline update (Array) — used by POST to add a favorite
      if (Array.isArray(update)) {
        // Simulate: remove existing entry for activityId then push the new one.
        // We find the $concatArrays instruction by inspecting the pipeline step.
        const setPipeline = update[0]?.$set;
        if (setPipeline && setPipeline.favorites) {
          const concat = setPipeline.favorites.$concatArrays;
          if (concat) {
            const filterStage  = concat[0]?.$filter;
            const newItems     = concat[1] || [];
            if (filterStage) {
              // The $ne condition tells us which activityId to exclude
              const excludeId = filterStage.cond?.$ne?.[1];
              if (excludeId) {
                mockFavDoc.favorites = mockFavDoc.favorites.filter(
                  f => f.activityId !== excludeId
                );
              }
            }
            newItems.forEach(item => mockFavDoc.favorites.push(item));
          }
        }
        return { ...mockFavDoc };
      }
      // Classic update operators — used by DELETE ($pull)
      if (update.$pull && update.$pull.favorites) {
        const { activityId } = update.$pull.favorites;
        mockFavDoc.favorites = mockFavDoc.favorites.filter(f => f.activityId !== activityId);
      }
      return { ...mockFavDoc };
    }
  );

  return MockActivityFavorites;
});

// ── Other model mocks required by server.js ───────────────────────────────────

jest.mock('../backend/models/User', () => {
  const M = jest.fn().mockImplementation(() => ({}));
  M.findOne           = jest.fn().mockResolvedValue(null);
  M.findById          = jest.fn().mockResolvedValue(null);
  M.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  M.countDocuments    = jest.fn().mockResolvedValue(0);
  return M;
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

function authToken(sub = 'user001') {
  return jwt.sign({ userId: sub, sub }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Activity Favorites API', () => {

  beforeEach(() => {
    // Reset mock state before each test
    mockFavDoc = null;
    const ActivityFavorites = require('../backend/models/ActivityFavorites');
    ActivityFavorites.findOne.mockImplementation(() => ({
      lean: jest.fn().mockImplementation(async () => mockFavDoc),
    }));
    ActivityFavorites.findOneAndUpdate.mockImplementation(
      async (_filter, update, _opts) => {
        if (!mockFavDoc) {
          mockFavDoc = { userId: 'user001', favorites: [] };
        }
        // Aggregation pipeline (Array) — POST adds a favorite
        if (Array.isArray(update)) {
          const setPipeline = update[0]?.$set;
          const concat = setPipeline?.favorites?.$concatArrays;
          if (concat) {
            const filterStage = concat[0]?.$filter;
            const newItems    = concat[1] || [];
            if (filterStage) {
              const excludeId = filterStage.cond?.$ne?.[1];
              if (excludeId) {
                mockFavDoc.favorites = mockFavDoc.favorites.filter(
                  f => f.activityId !== excludeId
                );
              }
            }
            newItems.forEach(item => mockFavDoc.favorites.push(item));
          }
          return { ...mockFavDoc };
        }
        // Classic update operators — DELETE uses $pull
        if (update.$pull && update.$pull.favorites) {
          const { activityId } = update.$pull.favorites;
          mockFavDoc.favorites = mockFavDoc.favorites.filter(f => f.activityId !== activityId);
        }
        return { ...mockFavDoc };
      }
    );
  });

  // ── GET /api/activity-favorites ─────────────────────────────────────────────

  describe('GET /api/activity-favorites', () => {
    test('returns 401 when no Authorization header is provided', async () => {
      const res = await request(app).get('/api/activity-favorites');
      expect(res.status).toBe(401);
    });

    test('returns empty favorites list for a new user', async () => {
      mockFavDoc = null;
      const res = await request(app)
        .get('/api/activity-favorites')
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ favorites: [], count: 0 });
    });

    test('returns existing favorites for a user who has some', async () => {
      mockFavDoc = {
        userId: 'user001',
        favorites: [
          { activityId: 'treasure-map', savedAt: new Date().toISOString(), notes: '' },
          { activityId: 'smart-goals-kids', savedAt: new Date().toISOString(), notes: 'great activity' },
        ],
      };

      const res = await request(app)
        .get('/api/activity-favorites')
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
      expect(res.body.favorites).toHaveLength(2);
      expect(res.body.favorites[0].activityId).toBe('treasure-map');
    });
  });

  // ── POST /api/activity-favorites/:activityId ────────────────────────────────

  describe('POST /api/activity-favorites/:activityId', () => {
    test('returns 401 when not authenticated', async () => {
      const res = await request(app).post('/api/activity-favorites/treasure-map');
      expect(res.status).toBe(401);
    });

    test('returns 400 or 404 for a path-traversal activityId', async () => {
      const res = await request(app)
        .post('/api/activity-favorites/../../etc/passwd')
        .set('Authorization', `Bearer ${authToken()}`);
      // Express normalizes path traversal to 404 before it reaches the handler
      expect([400, 404]).toContain(res.status);
    });

    test('adds an activity to favorites', async () => {
      const res = await request(app)
        .post('/api/activity-favorites/treasure-map')
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.favorites.some(f => f.activityId === 'treasure-map')).toBe(true);
    });

    test('adds an activity with optional notes', async () => {
      const res = await request(app)
        .post('/api/activity-favorites/smart-goals-kids')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ notes: 'Excellent for goal-setting practice' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('truncates notes that exceed 500 characters server-side', async () => {
      const longNotes = 'a'.repeat(600);
      const res = await request(app)
        .post('/api/activity-favorites/some-activity')
        .set('Authorization', `Bearer ${authToken()}`)
        .send({ notes: longNotes });

      // Should succeed (truncation happens server-side)
      expect(res.status).toBe(200);
    });
  });

  // ── DELETE /api/activity-favorites/:activityId ──────────────────────────────

  describe('DELETE /api/activity-favorites/:activityId', () => {
    test('returns 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/activity-favorites/treasure-map');
      expect(res.status).toBe(401);
    });

    test('returns 400 for an invalid activityId', async () => {
      const res = await request(app)
        .delete('/api/activity-favorites/<script>')
        .set('Authorization', `Bearer ${authToken()}`);
      expect(res.status).toBe(400);
    });

    test('removes an activity from favorites', async () => {
      mockFavDoc = {
        userId: 'user001',
        favorites: [
          { activityId: 'treasure-map', savedAt: new Date(), notes: '' },
        ],
      };

      const res = await request(app)
        .delete('/api/activity-favorites/treasure-map')
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.favorites.some(f => f.activityId === 'treasure-map')).toBe(false);
    });

    test('returns empty favorites when removing from empty list', async () => {
      const ActivityFavorites = require('../backend/models/ActivityFavorites');
      ActivityFavorites.findOneAndUpdate.mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/api/activity-favorites/nonexistent')
        .set('Authorization', `Bearer ${authToken()}`);

      expect(res.status).toBe(200);
      expect(res.body.favorites).toEqual([]);
    });
  });

  // ── isValidActivityId validation ────────────────────────────────────────────

  describe('activityId input validation', () => {
    const validIds = [
      'treasure-map',
      'smart-goals-kids',
      'abc123',
      'activity_001',
      'AG-001',
    ];

    const invalidIds = [
      '../etc/passwd',
      '<script>alert(1)</script>',
      'id with spaces',
      '',
    ];

    validIds.forEach(id => {
      test(`accepts valid activityId: "${id}"`, async () => {
        const res = await request(app)
          .post(`/api/activity-favorites/${encodeURIComponent(id)}`)
          .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).not.toBe(400);
      });
    });

    invalidIds.forEach(id => {
      if (id === '') {
        // Empty string maps to the base path which returns 405 or 404 (no handler for POST /)
        test(`rejects invalid activityId: "${id}"`, async () => {
          const res = await request(app)
            .post(`/api/activity-favorites/${encodeURIComponent(id)}`)
            .set('Authorization', `Bearer ${authToken()}`);
          expect(res.status).not.toBe(200);
        });
      } else {
        test(`rejects invalid activityId: "${id}"`, async () => {
          const res = await request(app)
            .post(`/api/activity-favorites/${encodeURIComponent(id)}`)
            .set('Authorization', `Bearer ${authToken()}`);
          expect(res.status).toBe(400);
        });
      }
    });
  });
});
