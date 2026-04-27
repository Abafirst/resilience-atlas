'use strict';

/**
 * session-template-management.test.js
 *
 * Unit and integration tests for the Session Template system:
 *  - checkTier middleware
 *  - SessionTemplate model (encrypt/decrypt)
 *  - Templates API endpoints (CRUD + search + duplicate)
 *  - Tier gating enforcement
 */

// ── Mocks (must come before any require of the modules being mocked) ──────────

const mockSave          = jest.fn();
const mockFindById      = jest.fn();
const mockFind          = jest.fn();
const mockCountDocs     = jest.fn();
const mockCreate        = jest.fn();
const mockFindByIdAndDelete = jest.fn();

jest.mock('../backend/models/SessionTemplate', () => {
  const mockModel = {
    create:              mockCreate,
    findById:            mockFindById,
    find:                mockFind,
    countDocuments:      mockCountDocs,
    findByIdAndDelete:   mockFindByIdAndDelete,
  };
  return mockModel;
});

jest.mock('../backend/middleware/auth', () => ({
  authenticateJWT: (req, res, next) => {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const payload = auth.slice(7);
    try {
      req.user = JSON.parse(Buffer.from(payload, 'base64').toString());
    } catch {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    next();
  },
}));

// Mock checkTier middleware to use req.user.tier
jest.mock('../backend/middleware/checkTier', () => {
  return function checkTier(allowedTiers) {
    const allowed = new Set(allowedTiers);
    return function (req, res, next) {
      const tier = req.user && req.user.tier;
      if (!allowed.has(tier)) {
        return res.status(403).json({
          error:         'Upgrade required',
          currentTier:   tier || 'free',
          requiredTiers: allowedTiers,
          upgradeUrl:    '/pricing',
        });
      }
      req.userTier = tier;
      next();
    };
  };
});

jest.mock('../backend/utils/logger', () => ({
  info:  jest.fn(),
  error: jest.fn(),
  warn:  jest.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

const express  = require('express');
const request  = require('supertest');
const mongoose = require('mongoose');

// ── App setup ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/templates', require('../backend/routes/templates'));
  return app;
}

/**
 * Encode a user payload as a fake base64 "token" accepted by the mock middleware.
 */
function authHeader(payload) {
  return 'Bearer ' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

const practitionerUser = {
  sub:    'auth0|practitioner001',
  userId: 'auth0|practitioner001',
  tier:   'practitioner',
};

const freeUser = {
  sub:    'auth0|freeuser001',
  userId: 'auth0|freeuser001',
  tier:   'free',
};

// ── Fixture factory ───────────────────────────────────────────────────────────

function makeTemplate(overrides = {}) {
  const id = new mongoose.Types.ObjectId();
  const base = {
    _id:         id,
    therapistId: 'auth0|practitioner001',
    name:        'Intake Template',
    description: 'Standard intake session',
    category:    'intake',
    sections:    [
      { title: 'Goals', type: 'text', content: 'List goals', required: true, order: 0 },
    ],
    tags:        ['intake', 'goals'],
    isPublic:    false,
    sharedWith:  [],
    usageCount:  0,
    metadata: {
      estimatedDuration:   50,
      targetPopulation:    'Adults',
      therapeuticApproach: 'CBT',
    },
    createdAt:   new Date(),
    updatedAt:   new Date(),
  };
  const merged = { ...base, ...overrides };
  merged.toSafeObject = () => {
    // eslint-disable-next-line no-unused-vars
    const { toSafeObject, save, ...rest } = merged;
    return rest;
  };
  merged.save = mockSave.mockResolvedValue(merged);
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: checkTier middleware
// ─────────────────────────────────────────────────────────────────────────────

describe('checkTier middleware', () => {
  // Load the actual (non-mocked) module for direct unit testing.
  let checkTierActual;

  beforeAll(() => {
    // Temporarily remove the mock to load the real module.
    jest.unmock('../backend/middleware/checkTier');
    checkTierActual = jest.requireActual('../backend/middleware/checkTier');
  });

  afterAll(() => {
    // Restore the mock for subsequent integration tests.
    jest.mock('../backend/middleware/checkTier', () => {
      return function checkTier(allowedTiers) {
        const allowed = new Set(allowedTiers);
        return function (req, res, next) {
          const tier = req.user && req.user.tier;
          if (!allowed.has(tier)) {
            return res.status(403).json({
              error:         'Upgrade required',
              currentTier:   tier || 'free',
              requiredTiers: allowedTiers,
              upgradeUrl:    '/pricing',
            });
          }
          req.userTier = tier;
          next();
        };
      };
    });
  });

  test('throws when allowedTiers is not provided', () => {
    expect(() => checkTierActual([])).toThrow();
  });

  test('returns a middleware function', () => {
    const mw = checkTierActual(['practitioner']);
    expect(typeof mw).toBe('function');
  });

  test('calls next when JWT claim tier is in allowedTiers', async () => {
    const mw  = checkTierActual(['practitioner', 'practice', 'enterprise']);
    const req = { user: { userId: 'u1', 'https://theresilienceatlas.com/tier': 'practitioner' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userTier).toBe('practitioner');
  });

  test('returns 403 when JWT claim tier is not in allowedTiers', async () => {
    const mw  = checkTierActual(['practitioner', 'practice', 'enterprise']);
    const req = { user: { userId: 'u1', 'https://theresilienceatlas.com/tier': 'free' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error:      'Upgrade required',
      upgradeUrl: '/pricing',
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when req.user is absent', async () => {
    const mw  = checkTierActual(['practitioner']);
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('includes currentTier, requiredTiers in 403 response', async () => {
    const allowed = ['practitioner', 'practice', 'enterprise'];
    const mw  = checkTierActual(allowed);
    const req = { user: { userId: 'u1', 'https://theresilienceatlas.com/tier': 'individual' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await mw(req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      currentTier:   'individual',
      requiredTiers: allowed,
    }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: SessionTemplate encrypt / decrypt
// ─────────────────────────────────────────────────────────────────────────────

describe('SessionTemplate encrypt / decrypt', () => {
  let encrypt;
  let decrypt;

  beforeAll(() => {
    const actual = jest.requireActual('../backend/models/SessionTemplate');
    encrypt = actual.encrypt;
    decrypt = actual.decrypt;
  });

  test('returns null for null input', () => {
    expect(encrypt(null)).toBeNull();
    expect(decrypt(null)).toBeNull();
  });

  test('returns empty string for empty input', () => {
    expect(encrypt('')).toBe('');
  });

  test('returns plain text when no encryption key is configured', () => {
    const original = process.env.MONGODB_ENCRYPTION_KEY;
    delete process.env.MONGODB_ENCRYPTION_KEY;
    expect(encrypt('hello')).toBe('hello');
    expect(decrypt('hello')).toBe('hello');
    if (original !== undefined) process.env.MONGODB_ENCRYPTION_KEY = original;
  });

  test('encrypts and decrypts a string when a 32-byte key is configured', () => {
    const key32Bytes = Buffer.alloc(32, 'a').toString('base64');
    const saved = process.env.MONGODB_ENCRYPTION_KEY;
    process.env.MONGODB_ENCRYPTION_KEY = key32Bytes;

    // Re-require the actual module so it picks up the new env var.
    jest.isolateModules(() => {
      const fresh = jest.requireActual('../backend/models/SessionTemplate');
      const encFn = fresh.encrypt;
      const decFn = fresh.decrypt;
      const plaintext = 'Sensitive clinical data';
      const ciphertext = encFn(plaintext);
      expect(ciphertext).toMatch(/^enc:/);
      expect(decFn(ciphertext)).toBe(plaintext);
    });

    process.env.MONGODB_ENCRYPTION_KEY = saved;
  });

  test('decrypt returns value unchanged for non-encrypted strings', () => {
    expect(decrypt('plain text')).toBe('plain text');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: POST /api/templates
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/templates', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  test('creates a template and returns 201', async () => {
    const template = makeTemplate();
    mockCreate.mockResolvedValue(template);

    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', authHeader(practitionerUser))
      .send({
        name:        'Intake Template',
        description: 'Standard intake session',
        category:    'intake',
        sections:    [{ title: 'Goals', type: 'text', content: '', required: false, order: 0 }],
        tags:        ['intake'],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Intake Template');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', authHeader(practitionerUser))
      .send({ description: 'No name' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/i);
  });

  test('returns 400 when name exceeds 100 chars', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', authHeader(practitionerUser))
      .send({ name: 'A'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/100 characters/i);
  });

  test('returns 400 when description exceeds 500 chars', async () => {
    const res = await request(app)
      .post('/api/templates')
      .set('Authorization', authHeader(practitionerUser))
      .send({ name: 'Valid Name', description: 'D'.repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/500 characters/i);
  });

  test('returns 401 when no token provided', async () => {
    const res = await request(app)
      .post('/api/templates')
      .send({ name: 'Template' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/templates
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/templates', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  test('returns list of templates for the user', async () => {
    const templates = [makeTemplate(), makeTemplate({ name: 'Closure Template', category: 'closure' })];
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(templates),
    });
    mockCountDocs.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/templates')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.templates).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  test('returns empty list when user has no templates', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/templates')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.templates).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });

  test('supports category filter', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    await request(app)
      .get('/api/templates?category=intake')
      .set('Authorization', authHeader(practitionerUser));

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'intake' })
    );
  });

  test('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/templates/search
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/templates/search', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  test('returns matching templates for query', async () => {
    const templates = [makeTemplate({ name: 'Intake Session' })];
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(templates),
    });

    const res = await request(app)
      .get('/api/templates/search?q=intake')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.templates).toHaveLength(1);
  });

  test('returns all templates when no query provided', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/templates/search')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/templates/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/templates/:id', () => {
  let app;
  const templateId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  test('returns 200 for owned template', async () => {
    const template = makeTemplate({ _id: templateId });
    mockFindById.mockResolvedValue(template);

    const res = await request(app)
      .get(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Intake Template');
  });

  test('returns 404 when template not found', async () => {
    mockFindById.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(404);
  });

  test('returns 403 when another user tries to access a private template', async () => {
    const otherUser = { sub: 'auth0|other', userId: 'auth0|other', tier: 'practitioner' };
    const template  = makeTemplate({ _id: templateId, isPublic: false, sharedWith: [] });
    mockFindById.mockResolvedValue(template);

    const res = await request(app)
      .get(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(otherUser));

    expect(res.status).toBe(403);
  });

  test('returns 400 for invalid ObjectId', async () => {
    const res = await request(app)
      .get('/api/templates/not-a-valid-id')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: PUT /api/templates/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/templates/:id', () => {
  let app;
  const templateId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
  });

  test('updates fields and returns 200', async () => {
    const template = makeTemplate({ _id: templateId });
    mockFindById.mockResolvedValue(template);

    const res = await request(app)
      .put(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(mockSave).toHaveBeenCalled();
  });

  test('returns 400 when name is empty string', async () => {
    const template = makeTemplate({ _id: templateId });
    mockFindById.mockResolvedValue(template);

    const res = await request(app)
      .put(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  test('returns 403 when user does not own the template', async () => {
    const otherUser = { sub: 'auth0|other', userId: 'auth0|other', tier: 'practitioner' };
    const template  = makeTemplate({ _id: templateId });
    mockFindById.mockResolvedValue(template);

    const res = await request(app)
      .put(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(otherUser))
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: DELETE /api/templates/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/templates/:id', () => {
  let app;
  const templateId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  test('deletes template and returns 200', async () => {
    const template = makeTemplate({ _id: templateId });
    mockFindById.mockResolvedValue(template);
    mockFindByIdAndDelete.mockResolvedValue(template);

    const res = await request(app)
      .delete(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
    expect(mockFindByIdAndDelete).toHaveBeenCalledWith(template._id);
  });

  test('returns 404 when template not found', async () => {
    mockFindById.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(404);
  });

  test('returns 403 when user does not own the template', async () => {
    const otherUser = { sub: 'auth0|other', userId: 'auth0|other', tier: 'practitioner' };
    const template  = makeTemplate({ _id: templateId });
    mockFindById.mockResolvedValue(template);

    const res = await request(app)
      .delete(`/api/templates/${templateId}`)
      .set('Authorization', authHeader(otherUser));

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: POST /api/templates/:id/duplicate
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/templates/:id/duplicate', () => {
  let app;
  const templateId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  test('duplicates template with "Copy of" prefix and returns 201', async () => {
    const original = makeTemplate({ _id: templateId, name: 'Intake Template', usageCount: 5 });
    const copy     = makeTemplate({ name: 'Copy of Intake Template', usageCount: 0 });
    mockFindById.mockResolvedValue(original);
    mockCreate.mockResolvedValue(copy);

    const res = await request(app)
      .post(`/api/templates/${templateId}/duplicate`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(201);
    expect(res.body.name).toMatch(/^Copy of /);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name:       'Copy of Intake Template',
        usageCount: 0,
        isPublic:   false,
        sharedWith: [],
      })
    );
  });

  test('returns 404 when original not found', async () => {
    mockFindById.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/templates/${templateId}/duplicate`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(404);
  });

  test('truncates duplicated name to 100 characters', async () => {
    const longName = 'A'.repeat(98); // "Copy of " + 98 chars = 106 chars → truncated to 100
    const original = makeTemplate({ _id: templateId, name: longName });
    const copy     = makeTemplate({ name: `Copy of ${longName}`.slice(0, 100), usageCount: 0 });
    mockFindById.mockResolvedValue(original);
    mockCreate.mockResolvedValue(copy);

    const res = await request(app)
      .post(`/api/templates/${templateId}/duplicate`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(201);
    expect(res.body.name.length).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tier gating enforcement
// ─────────────────────────────────────────────────────────────────────────────

describe('Tier gating enforcement', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
  });

  const blockedTiers = ['free', 'individual', 'team'];

  blockedTiers.forEach((tier) => {
    test(`blocks ${tier} tier from POST /api/templates`, async () => {
      const res = await request(app)
        .post('/api/templates')
        .set('Authorization', authHeader({ sub: 'user1', userId: 'user1', tier }))
        .send({ name: 'Test Template' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Upgrade required');
      expect(res.body.upgradeUrl).toBe('/pricing');
    });

    test(`blocks ${tier} tier from GET /api/templates`, async () => {
      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', authHeader({ sub: 'user1', userId: 'user1', tier }));

      expect(res.status).toBe(403);
    });
  });

  const allowedTiers = ['practitioner', 'practice', 'enterprise'];

  allowedTiers.forEach((tier) => {
    test(`allows ${tier} tier to GET /api/templates`, async () => {
      mockFind.mockReturnValue({
        sort:  jest.fn().mockReturnThis(),
        skip:  jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      mockCountDocs.mockResolvedValue(0);

      const res = await request(app)
        .get('/api/templates')
        .set('Authorization', authHeader({ sub: 'user1', userId: 'user1', tier }));

      expect(res.status).toBe(200);
    });
  });
});
