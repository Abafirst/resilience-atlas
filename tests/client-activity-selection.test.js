'use strict';

/**
 * client-activity-selection.test.js
 *
 * Tests for:
 *  - backend/utils/activityRecommendations.js  (unit tests)
 *  - backend/routes/clinical/clientActivities.js (API route tests)
 *
 * Covers:
 *  - Recommendation algorithm: age filtering, goal matching, sensory boost,
 *    favourite boost, recency penalty
 *  - Activity favourites CRUD
 *  - Activity history recording and update
 *  - Activity stats aggregation
 *  - Access control (auth required, practitioner tier required, ownership check)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock ClientProfile — controlled by tests via mockClientDoc
let mockClientDoc = null;

jest.mock('../backend/models/ClientProfile', () => {
  const mock = {
    findById: jest.fn().mockImplementation(function (id) {
      return {
        lean: jest.fn().mockImplementation(async () => {
          if (!mockClientDoc) return null;
          return { ...mockClientDoc, _id: mockClientDoc._id || id };
        }),
      };
    }),
  };
  mock.VALID_DIMENSIONS = [];
  return mock;
});

// Mock ClientActivityFavorites
let mockFavDoc = null;

jest.mock('../backend/models/ClientActivityFavorites', () => {
  const M = jest.fn();
  M.findOne = jest.fn().mockImplementation(async () => ({
    lean: jest.fn().mockImplementation(async () => mockFavDoc),
  }));
  // findOne().lean() pattern — re-implement as two-step
  M.findOne = jest.fn().mockReturnValue({
    lean: jest.fn().mockImplementation(async () => mockFavDoc),
  });
  M.findOneAndUpdate = jest.fn().mockImplementation(
    async (_filter, update, _opts) => {
      if (!mockFavDoc) {
        mockFavDoc = { practitionerId: 'prac1', clientProfileId: 'client1', favorites: [] };
      }
      if (Array.isArray(update)) {
        // Aggregation pipeline — simulate $concatArrays de-dup + append
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
      } else if (update.$pull && update.$pull.favorites) {
        const { activityId } = update.$pull.favorites;
        mockFavDoc.favorites = mockFavDoc.favorites.filter(f => f.activityId !== activityId);
      }
      return {
        favorites: mockFavDoc.favorites,
        toObject: () => mockFavDoc,
      };
    }
  );
  return M;
});

// Mock ClientActivityHistory
let mockHistoryDocs = [];
let mockSaveEntry   = jest.fn().mockImplementation(async function () { return this; });

jest.mock('../backend/models/ClientActivityHistory', () => {
  const M = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this._id  = { toString: () => 'hist001' };
    this.save = mockSaveEntry;
  });
  M.find = jest.fn().mockImplementation(() => ({
    sort:  function () { return this; },
    limit: function () { return this; },
    lean:  jest.fn().mockImplementation(async () => mockHistoryDocs),
  }));
  M.create = jest.fn().mockImplementation(async (data) => ({
    ...data,
    _id: { toString: () => 'hist001' },
  }));
  M.findOne = jest.fn().mockImplementation(async () => null);
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
      return res.status(403).json({ error: 'Invalid token.' });
    }
    next();
  },
  requirePractitionerTier: (req, res, next) => {
    if (!['practitioner', 'practice', 'enterprise'].includes(req.user?.tier)) {
      return res.status(403).json({ error: 'Practitioner tier required.', code: 'PROFESSIONAL_TIER_REQUIRED', upgrade: true });
    }
    next();
  },
}));

jest.mock('../backend/utils/logger', () => ({
  info:  jest.fn(),
  error: jest.fn(),
  warn:  jest.fn(),
}));

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

jest.mock('mongoose', () => {
  const actualObjectId = { isValid: jest.fn(() => true) };
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
    Types:      { ObjectId: actualObjectId },
    Schema,
    model:      jest.fn(() => ({})),
  };
});

// ── Imports ───────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

const { calculateRelevanceScore, getRecommendedActivities } =
  require('../backend/utils/activityRecommendations');

// ── App builder ───────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/clinical/clients/:id', require('../backend/routes/clinical/clientActivities'));
  return app;
}

function authHeader(payload) {
  return 'Bearer ' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

const PRACTITIONER = { sub: 'prac1', userId: 'prac1', tier: 'practitioner' };
const FREE_USER    = { sub: 'free1', userId: 'free1', tier: 'free' };

const CLIENT_ID = '507f1f77bcf86cd799439011';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeClient(overrides = {}) {
  return {
    _id:              { toString: () => CLIENT_ID },
    practitionerId:   'prac1',
    clientIdentifier: 'Test Client',
    dateOfBirth:      new Date(Date.now() - 8 * 365.25 * 24 * 60 * 60 * 1000), // 8 years old
    clinicalGoals:    [],
    isActive:         true,
    ...overrides,
  };
}

function makeActivity(overrides = {}) {
  return {
    id:           'activity-001',
    title:        'Breathing Exercise',
    age_min:      5,
    age_max:      18,
    categories:   ['emotional_regulation'],
    tags:         ['calming', 'mindfulness'],
    sensory_types: ['tactile', 'auditory'],
    skill_targets: ['emotional_regulation', 'self_regulation'],
    ...overrides,
  };
}

function makeClientProfile(overrides = {}) {
  return {
    id:                  'client-001',
    age:                 8,
    goals:               [{ category: 'emotional_regulation', priority: 3 }],
    sensory_preferences: ['tactile'],
    diagnosis_tags:      [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: activityRecommendations.js
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateRelevanceScore — unit tests', () => {
  const client    = makeClientProfile();
  const favorites = [];
  const history   = [];

  test('returns null when client age is below activity age_min', () => {
    const activity = makeActivity({ age_min: 10, age_max: 18 });
    const result   = calculateRelevanceScore(activity, { ...client, age: 5 }, favorites, history);
    expect(result).toBeNull();
  });

  test('returns null when client age is above activity age_max', () => {
    const activity = makeActivity({ age_min: 5, age_max: 10 });
    const result   = calculateRelevanceScore(activity, { ...client, age: 12 }, favorites, history);
    expect(result).toBeNull();
  });

  test('awards 20 points for age-appropriate activity', () => {
    const activity = makeActivity({ age_min: 5, age_max: 18 });
    const result   = calculateRelevanceScore(activity, client, favorites, history);
    expect(result).not.toBeNull();
    expect(result.relevance_score).toBeGreaterThanOrEqual(20);
    expect(result.match_reasons).toContain('age_appropriate');
  });

  test('awards goal-match points and includes reason', () => {
    const activity = makeActivity({ skill_targets: ['emotional_regulation'] });
    const c        = makeClientProfile({ goals: [{ category: 'emotional_regulation', priority: 3 }] });
    const result   = calculateRelevanceScore(activity, c, favorites, history);
    expect(result).not.toBeNull();
    expect(result.match_reasons).toContain('matches_goal_emotional_regulation');
    expect(result.relevance_score).toBeGreaterThanOrEqual(30);
  });

  test('awards sensory preference match points', () => {
    const activity = makeActivity({ sensory_types: ['tactile', 'visual'] });
    const c        = makeClientProfile({ sensory_preferences: ['tactile'] });
    const result   = calculateRelevanceScore(activity, c, favorites, history);
    expect(result.match_reasons).toContain('sensory_tactile_match');
    expect(result.relevance_score).toBeGreaterThanOrEqual(30); // 20 age + 10 sensory
  });

  test('awards favourite boost', () => {
    const activity = makeActivity();
    const result   = calculateRelevanceScore(activity, client, ['activity-001'], history);
    expect(result.is_favorite).toBe(true);
    expect(result.match_reasons).toContain('favorited');
    expect(result.relevance_score).toBeGreaterThanOrEqual(35); // 20 age + 15 fav
  });

  test('applies recency penalty for activity used < 7 days ago', () => {
    const recentUsed = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    const hist = [{ activity_id: 'activity-001', effectiveness_rating: null, used_at: recentUsed }];
    const result = calculateRelevanceScore(makeActivity(), client, favorites, hist);
    expect(result.match_reasons).toContain('recently_used');
  });

  test('boosts score for previously effective activity', () => {
    const hist = [
      { activity_id: 'activity-001', effectiveness_rating: 5, used_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const result = calculateRelevanceScore(makeActivity(), client, favorites, hist);
    expect(result.avg_effectiveness_rating).toBe(5);
    expect(result.match_reasons.some(r => r.startsWith('previously_effective_'))).toBe(true);
    expect(result.relevance_score).toBeGreaterThan(30);
  });

  test('caps relevance_score at 100', () => {
    const c    = makeClientProfile({ sensory_preferences: ['tactile', 'auditory'] });
    const hist = [
      { activity_id: 'activity-001', effectiveness_rating: 5, used_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    ];
    const result = calculateRelevanceScore(makeActivity(), c, ['activity-001'], hist);
    expect(result.relevance_score).toBeLessThanOrEqual(100);
  });

  test('relevance_score is never negative', () => {
    // Only recency penalty, no other boosts
    const recentUsed = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const hist = [{ activity_id: 'activity-001', effectiveness_rating: null, used_at: recentUsed }];
    const c    = makeClientProfile({ goals: [], sensory_preferences: [] });
    const result = calculateRelevanceScore(makeActivity({ skill_targets: [] }), c, [], hist);
    expect(result.relevance_score).toBeGreaterThanOrEqual(0);
  });
});

describe('getRecommendedActivities — unit tests', () => {
  const client    = makeClientProfile();
  const favorites = [];
  const history   = [];

  const activities = [
    makeActivity({ id: 'act-1', age_min: 5, age_max: 18 }),
    makeActivity({ id: 'act-2', age_min: 12, age_max: 18 }), // too old for age-8 client
    makeActivity({ id: 'act-3', age_min: 5, age_max: 18, sensory_types: ['visual'] }),
  ];

  test('filters out age-inappropriate activities', () => {
    const result = getRecommendedActivities(activities, client, favorites, history);
    expect(result.map(r => r.id)).not.toContain('act-2');
  });

  test('respects limit parameter', () => {
    const manyActivities = Array.from({ length: 30 }, (_, i) =>
      makeActivity({ id: `act-${i}`, age_min: 0, age_max: 100 })
    );
    const result = getRecommendedActivities(manyActivities, client, favorites, history, { limit: 5 });
    expect(result.length).toBeLessThanOrEqual(5);
  });

  test('filters by category', () => {
    const acts = [
      makeActivity({ id: 'a1', categories: ['emotional_regulation'], age_min: 0, age_max: 100 }),
      makeActivity({ id: 'a2', categories: ['social_skills'], age_min: 0, age_max: 100 }),
    ];
    const result = getRecommendedActivities(acts, client, favorites, history, { category: 'social_skills' });
    expect(result.map(r => r.id)).toContain('a2');
    expect(result.map(r => r.id)).not.toContain('a1');
  });

  test('excludes recently used when excludeRecentlyUsed is true', () => {
    const recentUsed = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const hist = [{ activity_id: 'act-1', effectiveness_rating: null, used_at: recentUsed }];
    const result = getRecommendedActivities(
      activities,
      client,
      favorites,
      hist,
      { excludeRecentlyUsed: true }
    );
    expect(result.map(r => r.id)).not.toContain('act-1');
  });

  test('returns activities sorted by relevance_score descending', () => {
    const acts = [
      makeActivity({ id: 'low',  age_min: 0, age_max: 100, sensory_types: [] }),
      makeActivity({ id: 'high', age_min: 0, age_max: 100, sensory_types: ['tactile'] }),
    ];
    const result = getRecommendedActivities(acts, client, ['high'], history);
    const scores = result.map(r => r.relevance_score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API route tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Client Activity API Routes', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    mockClientDoc    = null;
    mockFavDoc       = null;
    mockHistoryDocs  = [];
    jest.clearAllMocks();

    // Restore the ClientActivityFavorites mock to its default behaviour
    const CAF = require('../backend/models/ClientActivityFavorites');
    CAF.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockImplementation(async () => mockFavDoc),
    });
    CAF.findOneAndUpdate = jest.fn().mockImplementation(
      async (_filter, update, _opts) => {
        if (!mockFavDoc) {
          mockFavDoc = { favorites: [] };
        }
        if (Array.isArray(update)) {
          const setPipeline = update[0]?.$set;
          const concat = setPipeline?.favorites?.$concatArrays;
          if (concat) {
            const filterStage = concat[0]?.$filter;
            const newItems    = concat[1] || [];
            if (filterStage) {
              const excludeId = filterStage.cond?.$ne?.[1];
              if (excludeId) {
                mockFavDoc.favorites = mockFavDoc.favorites.filter(f => f.activityId !== excludeId);
              }
            }
            newItems.forEach(item => mockFavDoc.favorites.push(item));
          }
        } else if (update.$pull?.favorites) {
          const { activityId } = update.$pull.favorites;
          mockFavDoc.favorites = mockFavDoc.favorites.filter(f => f.activityId !== activityId);
        }
        return { favorites: mockFavDoc.favorites };
      }
    );

    // Restore the ClientActivityHistory mock
    const CAH = require('../backend/models/ClientActivityHistory');
    CAH.find = jest.fn().mockImplementation(() => ({
      sort:  function () { return this; },
      limit: function () { return this; },
      lean:  jest.fn().mockImplementation(async () => mockHistoryDocs),
    }));
    CAH.create = jest.fn().mockImplementation(async (data) => ({
      ...data,
      _id: { toString: () => 'hist001' },
    }));
    CAH.findOne = jest.fn().mockImplementation(async () => null);
  });

  // ── Access control ──────────────────────────────────────────────────────────

  describe('Access control', () => {
    test('returns 401 without token', async () => {
      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`);
      expect(res.status).toBe(401);
    });

    test('returns 403 for free-tier user', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(FREE_USER));
      expect(res.status).toBe(403);
    });

    test('returns 403 when client does not belong to practitioner', async () => {
      mockClientDoc = makeClient({ practitionerId: 'other-practitioner' });
      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(PRACTITIONER));
      expect(res.status).toBe(403);
    });
  });

  // ── GET /activity-favorites ─────────────────────────────────────────────────

  describe('GET /activity-favorites', () => {
    test('returns empty list when no favourites exist', async () => {
      mockClientDoc = makeClient();
      mockFavDoc    = null;

      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ favorites: [], count: 0 });
    });

    test('returns existing favourites', async () => {
      mockClientDoc = makeClient();
      mockFavDoc    = {
        favorites: [
          { activityId: 'act-001', addedAt: new Date(), notes: '' },
        ],
      };

      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.favorites[0].activityId).toBe('act-001');
    });
  });

  // ── POST /activity-favorites ────────────────────────────────────────────────

  describe('POST /activity-favorites', () => {
    test('returns 400 when activity_id is missing', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .post(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({});
      expect(res.status).toBe(400);
    });

    test('returns 400 for invalid activity_id (spaces)', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .post(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({ activity_id: 'id with spaces' });
      expect(res.status).toBe(400);
    });

    test('adds a valid activity to favourites', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .post(`/api/clinical/clients/${CLIENT_ID}/activity-favorites`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({ activity_id: 'treasure-map' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.favorites.some(f => f.activityId === 'treasure-map')).toBe(true);
    });
  });

  // ── DELETE /activity-favorites/:activityId ──────────────────────────────────

  describe('DELETE /activity-favorites/:activityId', () => {
    test('removes an activity from favourites', async () => {
      mockClientDoc = makeClient();
      mockFavDoc    = {
        favorites: [{ activityId: 'act-to-remove', addedAt: new Date(), notes: '' }],
      };

      const res = await request(app)
        .delete(`/api/clinical/clients/${CLIENT_ID}/activity-favorites/act-to-remove`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.favorites.some(f => f.activityId === 'act-to-remove')).toBe(false);
    });

    test('returns 400 for invalid activityId', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .delete(`/api/clinical/clients/${CLIENT_ID}/activity-favorites/<script>`)
        .set('Authorization', authHeader(PRACTITIONER));
      expect(res.status).toBe(400);
    });
  });

  // ── GET /activity-history ───────────────────────────────────────────────────

  describe('GET /activity-history', () => {
    test('returns empty history when none exist', async () => {
      mockClientDoc   = makeClient();
      mockHistoryDocs = [];

      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-history`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ history: [], count: 0 });
    });

    test('returns existing history entries', async () => {
      mockClientDoc   = makeClient();
      mockHistoryDocs = [
        { _id: 'h1', activityId: 'act-001', usedAt: new Date(), effectivenessRating: 4, notes: '' },
      ];

      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-history`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body.history.length).toBe(1);
    });
  });

  // ── POST /activity-history ──────────────────────────────────────────────────

  describe('POST /activity-history', () => {
    test('returns 400 when activity_id is missing', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .post(`/api/clinical/clients/${CLIENT_ID}/activity-history`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({});
      expect(res.status).toBe(400);
    });

    test('returns 400 for effectiveness_rating outside 1–5', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .post(`/api/clinical/clients/${CLIENT_ID}/activity-history`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({ activity_id: 'act-001', effectiveness_rating: 6 });
      expect(res.status).toBe(400);
    });

    test('records valid activity usage', async () => {
      mockClientDoc = makeClient();
      const res = await request(app)
        .post(`/api/clinical/clients/${CLIENT_ID}/activity-history`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({ activity_id: 'act-001', effectiveness_rating: 4, notes: 'Went well' });

      expect(res.status).toBe(201);
      expect(res.body.history_entry).toBeDefined();
    });
  });

  // ── PATCH /activity-history/:historyId ─────────────────────────────────────

  describe('PATCH /activity-history/:historyId', () => {
    test('returns 404 when history entry not found', async () => {
      mockClientDoc = makeClient();
      const CAH = require('../backend/models/ClientActivityHistory');
      CAH.findOne = jest.fn().mockImplementation(async () => null);

      const res = await request(app)
        .patch(`/api/clinical/clients/${CLIENT_ID}/activity-history/507f1f77bcf86cd799439011`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({ effectiveness_rating: 5 });

      expect(res.status).toBe(404);
    });

    test('updates effectiveness_rating on existing entry', async () => {
      mockClientDoc = makeClient();
      const fakeEntry = {
        _id: '507f1f77bcf86cd799439011',
        activityId: 'act-001',
        effectivenessRating: null,
        notes: '',
        save: jest.fn().mockResolvedValue({}),
      };
      const CAH = require('../backend/models/ClientActivityHistory');
      CAH.findOne = jest.fn().mockImplementation(async () => fakeEntry);

      const res = await request(app)
        .patch(`/api/clinical/clients/${CLIENT_ID}/activity-history/507f1f77bcf86cd799439011`)
        .set('Authorization', authHeader(PRACTITIONER))
        .send({ effectiveness_rating: 5 });

      expect(res.status).toBe(200);
      expect(fakeEntry.save).toHaveBeenCalled();
    });
  });

  // ── GET /activity-stats ─────────────────────────────────────────────────────

  describe('GET /activity-stats', () => {
    test('returns zeroed stats when no history', async () => {
      mockClientDoc   = makeClient();
      mockHistoryDocs = [];

      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-stats`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body.total_unique_activities).toBe(0);
    });

    test('aggregates stats correctly', async () => {
      mockClientDoc   = makeClient();
      mockHistoryDocs = [
        { activityId: 'act-001', usedAt: new Date(), effectivenessRating: 5 },
        { activityId: 'act-001', usedAt: new Date(), effectivenessRating: 3 },
        { activityId: 'act-002', usedAt: new Date(), effectivenessRating: null },
      ];

      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/activity-stats`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(res.body.total_unique_activities).toBe(2);
      expect(res.body.most_frequently_used[0].activity_id).toBe('act-001');
      expect(res.body.most_frequently_used[0].usage_count).toBe(2);
    });
  });

  // ── GET /recommended-activities ────────────────────────────────────────────

  describe('GET /recommended-activities', () => {
    test('returns 200 with empty catalog', async () => {
      mockClientDoc = makeClient();
      // The route tries to require ../../data/iatlasCatalog.json; it falls back gracefully
      const res = await request(app)
        .get(`/api/clinical/clients/${CLIENT_ID}/recommended-activities`)
        .set('Authorization', authHeader(PRACTITIONER));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
    });
  });
});
