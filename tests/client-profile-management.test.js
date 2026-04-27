'use strict';

/**
 * client-profile-management.test.js
 *
 * Unit tests for the ClientProfile management system:
 *  - Age-group calculation
 *  - Schema validation rules
 *  - Encryption / decryption helpers
 *  - Ownership verification logic
 *  - API endpoint integration (create, list, get, update, archive, restore)
 */

// ── Mocks (must come before any require of the modules being mocked) ──────────

const mockSave      = jest.fn();
const mockFindById  = jest.fn();
const mockFind      = jest.fn();
const mockCountDocs = jest.fn();
const mockCreate    = jest.fn();
const mockAuditCreate = jest.fn();

jest.mock('../backend/models/ClientProfile', () => {
  const VALID_DIMENSIONS = [
    'agentic-generative',
    'somatic-regulative',
    'cognitive-narrative',
    'relational-connective',
    'emotional-adaptive',
    'spiritual-existential',
  ];

  function calculateAgeGroup(dateOfBirth) {
    if (!dateOfBirth) return 'unknown';
    const dob = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return 'unknown';
    const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 3  && age <= 4)  return 'ages-3-4';
    if (age >= 5  && age <= 7)  return 'ages-5-7';
    if (age >= 8  && age <= 10) return 'ages-8-10';
    if (age >= 11 && age <= 13) return 'ages-11-13';
    if (age >= 14 && age <= 17) return 'ages-14-17';
    if (age >= 18)              return 'adult';
    return 'unknown';
  }

  const mockModel = {
    create:          mockCreate,
    findById:        mockFindById,
    find:            mockFind,
    countDocuments:  mockCountDocs,
    VALID_DIMENSIONS,
    calculateAgeGroup,
  };
  return mockModel;
});

jest.mock('../backend/models/AuditLog', () => ({
  create: mockAuditCreate.mockResolvedValue({}),
}));

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
  requirePractitionerTier: (req, res, next) => {
    const allowedTiers = ['practitioner', 'practice', 'enterprise'];
    if (!allowedTiers.includes(req.user && req.user.tier)) {
      return res.status(403).json({
        error:   'Practitioner tier required.',
        code:    'PROFESSIONAL_TIER_REQUIRED',
        upgrade: true,
      });
    }
    next();
  },
}));

jest.mock('../backend/utils/logger', () => ({
  info:  jest.fn(),
  error: jest.fn(),
  warn:  jest.fn(),
}));

// ── Import after mocks ────────────────────────────────────────────────────────

const express  = require('express');
const request  = require('supertest');
const mongoose = require('mongoose');

// Load the real module (bypassing the mock) so we can test the utility
// functions directly without requiring a live MongoDB connection.
const realClientProfile = jest.requireActual('../backend/models/ClientProfile');
const calculateAgeGroup = realClientProfile.calculateAgeGroup;
const VALID_DIMENSIONS  = realClientProfile.VALID_DIMENSIONS;
// encrypt / decrypt are loaded lazily in the encrypt/decrypt describe block
// because one test calls jest.resetModules() and must re-require them.

// ── App setup ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/clinical/clients', require('../backend/routes/clinical/clients'));
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

function makeClient(overrides = {}) {
  const base = {
    _id:              new mongoose.Types.ObjectId(),
    practitionerId:   'auth0|practitioner001',
    clientIdentifier: 'Client A',
    dateOfBirth:      new Date('2010-06-15'),
    ageGroup:         'ages-11-13',
    pronouns:         'they/them',
    targetDimensions: ['agentic-generative'],
    clinicalGoals:    [],
    isActive:         true,
    archivedAt:       null,
    intakeNotes:      '',
    ongoingNotes:     '',
    medicalConsiderations: '',
    createdAt:        new Date(),
    updatedAt:        new Date(),
  };
  const merged = { ...base, ...overrides };
  merged.toSafeObject = () => {
    // eslint-disable-next-line no-unused-vars
    const { __v, toSafeObject, save, ...rest } = merged;
    return rest;
  };
  merged.save = mockSave.mockResolvedValue(merged);
  return merged;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: calculateAgeGroup
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateAgeGroup', () => {
  function dobYearsAgo(years) {
    return new Date(Date.now() - years * 365.25 * 24 * 60 * 60 * 1000);
  }

  test('returns ages-3-4 for a 3 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(3))).toBe('ages-3-4');
  });

  test('returns ages-3-4 for a 4 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(4))).toBe('ages-3-4');
  });

  test('returns ages-5-7 for a 5 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(5))).toBe('ages-5-7');
  });

  test('returns ages-5-7 for a 7 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(7))).toBe('ages-5-7');
  });

  test('returns ages-8-10 for an 8 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(8))).toBe('ages-8-10');
  });

  test('returns ages-11-13 for an 11 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(11))).toBe('ages-11-13');
  });

  test('returns ages-14-17 for a 14 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(14))).toBe('ages-14-17');
  });

  test('returns adult for an 18 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(18))).toBe('adult');
  });

  test('returns adult for a 40 year old', () => {
    expect(calculateAgeGroup(dobYearsAgo(40))).toBe('adult');
  });

  test('returns unknown for null input', () => {
    expect(calculateAgeGroup(null)).toBe('unknown');
  });

  test('returns unknown for undefined input', () => {
    expect(calculateAgeGroup(undefined)).toBe('unknown');
  });

  test('returns unknown for an invalid date', () => {
    expect(calculateAgeGroup('not-a-date')).toBe('unknown');
  });

  test('returns unknown for a 2-year-old (below minimum bracket)', () => {
    expect(calculateAgeGroup(dobYearsAgo(2))).toBe('unknown');
  });

  test('accepts a Date object', () => {
    expect(calculateAgeGroup(new Date('2000-01-01'))).toBe('adult');
  });

  test('accepts a date string', () => {
    expect(calculateAgeGroup('2000-01-01')).toBe('adult');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: encrypt / decrypt
// ─────────────────────────────────────────────────────────────────────────────

describe('encrypt / decrypt', () => {
  let encrypt;
  let decrypt;

  beforeEach(() => {
    // Always load the actual (non-mocked) module so these tests run
    // against the real implementation.
    const actual = jest.requireActual('../backend/models/ClientProfile');
    encrypt = actual.encrypt;
    decrypt = actual.decrypt;
  });

  test('returns null for null input', () => {
    expect(encrypt(null)).toBeNull();
    expect(decrypt(null)).toBeNull();
  });

  test('returns empty string for empty string input', () => {
    expect(encrypt('')).toBe('');
    expect(decrypt('')).toBe('');
  });

  test('returns value unchanged when no encryption key is set (dev fallback)', () => {
    // In the test environment CLIENT_ENCRYPTION_KEY is not set.
    const value = 'sensitive notes';
    expect(encrypt(value)).toBe(value);
    expect(decrypt(value)).toBe(value);
  });

  test('round-trips correctly when a 32-byte key is present', () => {
    const key = '0'.repeat(64); // 32 bytes as hex
    const origEnv = process.env.CLIENT_ENCRYPTION_KEY;
    process.env.CLIENT_ENCRYPTION_KEY = key;

    // Re-require to pick up the new env var.
    jest.resetModules();
    const { encrypt: enc, decrypt: dec } = jest.requireActual('../backend/models/ClientProfile');

    const plaintext  = 'my secret note';
    const ciphertext = enc(plaintext);
    expect(ciphertext).toMatch(/^enc:/);
    expect(dec(ciphertext)).toBe(plaintext);

    process.env.CLIENT_ENCRYPTION_KEY = origEnv;
    jest.resetModules();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: VALID_DIMENSIONS
// ─────────────────────────────────────────────────────────────────────────────

describe('VALID_DIMENSIONS', () => {
  test('contains exactly 6 dimensions', () => {
    expect(VALID_DIMENSIONS).toHaveLength(6);
  });

  test('contains all required IATLAS dimensions', () => {
    expect(VALID_DIMENSIONS).toContain('agentic-generative');
    expect(VALID_DIMENSIONS).toContain('somatic-regulative');
    expect(VALID_DIMENSIONS).toContain('cognitive-narrative');
    expect(VALID_DIMENSIONS).toContain('relational-connective');
    expect(VALID_DIMENSIONS).toContain('emotional-adaptive');
    expect(VALID_DIMENSIONS).toContain('spiritual-existential');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: POST /api/clinical/clients
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/clients', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  const validBody = {
    clientIdentifier: 'Client A',
    dateOfBirth:      '2010-06-15',
    targetDimensions: ['agentic-generative'],
  };

  test('returns 401 when no token is provided', async () => {
    const res = await request(app).post('/api/clinical/clients').send(validBody);
    expect(res.status).toBe(401);
  });

  test('returns 403 for a free-tier user', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(freeUser))
      .send(validBody);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PROFESSIONAL_TIER_REQUIRED');
  });

  test('returns 400 when clientIdentifier is missing', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, clientIdentifier: '' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when clientIdentifier is too short', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, clientIdentifier: 'X' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when clientIdentifier has consecutive spaces', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, clientIdentifier: 'Client  A' });
    expect(res.status).toBe(400);
  });

  test('returns 400 when dateOfBirth is missing', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, dateOfBirth: undefined });
    expect(res.status).toBe(400);
  });

  test('returns 400 when dateOfBirth is in the future', async () => {
    const future = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, dateOfBirth: future });
    expect(res.status).toBe(400);
  });

  test('returns 400 when targetDimensions is empty', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, targetDimensions: [] });
    expect(res.status).toBe(400);
  });

  test('returns 400 when targetDimensions contains an invalid value', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, targetDimensions: ['invalid-dimension'] });
    expect(res.status).toBe(400);
  });

  test('returns 400 when targetDimensions has more than 6 items', async () => {
    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send({ ...validBody, targetDimensions: VALID_DIMENSIONS.concat(VALID_DIMENSIONS) });
    expect(res.status).toBe(400);
  });

  test('creates a client and returns 201 for a valid practitioner request', async () => {
    const newClient = makeClient();
    mockCreate.mockResolvedValue(newClient);

    const res = await request(app)
      .post('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser))
      .send(validBody);

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE_CLIENT' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/clinical/clients
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clinical/clients', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/clinical/clients');
    expect(res.status).toBe(401);
  });

  test('returns 403 for a free-tier user', async () => {
    const res = await request(app)
      .get('/api/clinical/clients')
      .set('Authorization', authHeader(freeUser));
    expect(res.status).toBe(403);
  });

  test('returns paginated client list for a practitioner', async () => {
    const clients = [makeClient(), makeClient()];
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(clients),
    });
    mockCountDocs.mockResolvedValue(2);

    const res = await request(app)
      .get('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.clients).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.pagination.page).toBe(1);
  });

  test('applies status=archived filter correctly', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/clinical/clients?status=archived')
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    const callArgs = mockFind.mock.calls[0][0];
    expect(callArgs.isActive).toBe(false);
  });

  test('applies search filter correctly', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    await request(app)
      .get('/api/clinical/clients?search=ClientA')
      .set('Authorization', authHeader(practitionerUser));

    const callArgs = mockFind.mock.calls[0][0];
    expect(callArgs.clientIdentifier).toBeInstanceOf(RegExp);
    expect(callArgs.clientIdentifier.source).toBe('ClientA');
  });

  test('enforces max limit of 100', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    await request(app)
      .get('/api/clinical/clients?limit=500')
      .set('Authorization', authHeader(practitionerUser));

    const limitCall = mockFind.mock.results[0].value.limit.mock.calls[0][0];
    expect(limitCall).toBe(100);
  });

  test('writes LIST_CLIENTS audit log entry', async () => {
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    await request(app)
      .get('/api/clinical/clients')
      .set('Authorization', authHeader(practitionerUser));

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LIST_CLIENTS' })
    );
  });
});

/**
 * Helper: set up mockFindById to return `ownershipDoc` via `.lean()` on the
 * first call (ownership middleware), then `fullDoc` directly on the second
 * call (route handler).
 */
function setupFindByIdForOwnerCheck(ownershipDoc, fullDoc) {
  mockFindById
    .mockReturnValueOnce({ lean: jest.fn().mockResolvedValue(ownershipDoc) })
    .mockResolvedValueOnce(fullDoc);
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/clinical/clients/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clinical/clients/:id', () => {
  let app;
  const clientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 403 when client belongs to a different practitioner', async () => {
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|otherPractitioner', isActive: true },
      makeClient({ _id: clientId })
    );

    const res = await request(app)
      .get(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(403);
  });

  test('returns 404 when client does not exist', async () => {
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      null // route handler returns null
    );

    const res = await request(app)
      .get(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(404);
  });

  test('returns 200 with client data for the owner', async () => {
    const client = makeClient({ _id: clientId });
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      client
    );

    const res = await request(app)
      .get(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'VIEW_CLIENT' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: DELETE /api/clinical/clients/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/clinical/clients/:id', () => {
  let app;
  const clientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('archives a client (soft delete) and returns 200', async () => {
    const client = makeClient({ _id: clientId });
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      client
    );

    const res = await request(app)
      .delete(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/archived/i);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ARCHIVE_CLIENT' })
    );
  });

  test('returns 409 when client is already archived', async () => {
    const client = makeClient({ _id: clientId, isActive: false });
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: false },
      client
    );

    const res = await request(app)
      .delete(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: POST /api/clinical/clients/:id/restore
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/clients/:id/restore', () => {
  let app;
  const clientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('restores an archived client and returns 200', async () => {
    const client = makeClient({ _id: clientId, isActive: false, archivedAt: new Date() });
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: false },
      client
    );

    const res = await request(app)
      .post(`/api/clinical/clients/${clientId}/restore`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'RESTORE_CLIENT' })
    );
  });

  test('returns 409 when client is already active', async () => {
    const client = makeClient({ _id: clientId, isActive: true });
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      client
    );

    const res = await request(app)
      .post(`/api/clinical/clients/${clientId}/restore`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: PUT /api/clinical/clients/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PUT /api/clinical/clients/:id', () => {
  let app;
  const clientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('updates allowed fields and returns 200', async () => {
    const client = makeClient({ _id: clientId });
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      client
    );

    const res = await request(app)
      .put(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ pronouns: 'she/her' });

    expect(res.status).toBe(200);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE_CLIENT' })
    );
  });

  test('returns 400 when updating with invalid clientIdentifier', async () => {
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      makeClient({ _id: clientId })
    );

    const res = await request(app)
      .put(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientIdentifier: '' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when updating with invalid targetDimensions', async () => {
    setupFindByIdForOwnerCheck(
      { _id: clientId, practitionerId: 'auth0|practitioner001', isActive: true },
      makeClient({ _id: clientId })
    );

    const res = await request(app)
      .put(`/api/clinical/clients/${clientId}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ targetDimensions: ['not-a-dimension'] });

    expect(res.status).toBe(400);
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

  const tiers = ['free', 'individual', 'team'];

  tiers.forEach(tier => {
    test(`blocks ${tier} tier from POST /api/clinical/clients`, async () => {
      const res = await request(app)
        .post('/api/clinical/clients')
        .set('Authorization', authHeader({ sub: 'user1', userId: 'user1', tier }))
        .send({ clientIdentifier: 'Client B', dateOfBirth: '2010-01-01', targetDimensions: ['agentic-generative'] });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('PROFESSIONAL_TIER_REQUIRED');
    });
  });

  const allowedTiers = ['practitioner', 'practice', 'enterprise'];

  allowedTiers.forEach(tier => {
    test(`allows ${tier} tier access`, async () => {
      mockFind.mockReturnValue({
        sort:  jest.fn().mockReturnThis(),
        skip:  jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });
      mockCountDocs.mockResolvedValue(0);
      mockAuditCreate.mockResolvedValue({});

      const res = await request(app)
        .get('/api/clinical/clients')
        .set('Authorization', authHeader({ sub: 'user1', userId: 'user1', tier }));
      expect(res.status).toBe(200);
    });
  });
});
