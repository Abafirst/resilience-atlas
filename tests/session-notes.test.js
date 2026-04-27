'use strict';

/**
 * session-notes.test.js
 *
 * Unit and integration tests for the Session Notes feature:
 *  - SessionNote model (encrypt/decrypt helpers)
 *  - Session Notes API endpoints (CRUD + activities)
 *  - Permission enforcement (practitioner tier, note ownership)
 *  - Audit logging verification
 */

// ── Mocks (must come before any require of the modules being mocked) ──────────

const mockSave      = jest.fn();
const mockFindById  = jest.fn();
const mockFind      = jest.fn();
const mockCountDocs = jest.fn();
const mockCreate    = jest.fn();

const mockClientFindById = jest.fn();

const mockAuditCreate = jest.fn().mockResolvedValue({});

jest.mock('../backend/models/SessionNote', () => {
  const mockModel = {
    create:         mockCreate,
    findById:       mockFindById,
    find:           mockFind,
    countDocuments: mockCountDocs,
  };
  return mockModel;
});

jest.mock('../backend/models/SessionNoteAuditLog', () => ({
  create: mockAuditCreate,
}));

jest.mock('../backend/models/ClientProfile', () => ({
  findById: mockClientFindById,
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

// ClientProfileMock imported via mockClientFindById top-level variable

// ── App setup ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/clinical/session-notes', require('../backend/routes/clinical/sessionNotes'));
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

const otherPractitioner = {
  sub:    'auth0|practitioner999',
  userId: 'auth0|practitioner999',
  tier:   'practitioner',
};

const freeUser = {
  sub:    'auth0|freeuser001',
  userId: 'auth0|freeuser001',
  tier:   'free',
};

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeNote(overrides = {}) {
  const activityLinkId = new mongoose.Types.ObjectId();
  const base = {
    _id:             new mongoose.Types.ObjectId(),
    practitionerId:  'auth0|practitioner001',
    clientProfileId: new mongoose.Types.ObjectId(),
    sessionDate:     new Date('2024-06-15'),
    templateId:      null,
    activities:      [
      {
        _id:             activityLinkId,
        activityId:      'activity-abc',
        durationMinutes: 30,
        notes:           '',
        toObject: () => ({
          _id:             activityLinkId,
          activityId:      'activity-abc',
          durationMinutes: 30,
          notes:           '',
        }),
      },
    ],
    subjective:  'Client reports feeling better.',
    objective:   'Engaged well in activities.',
    assessment:  'Moderate progress noted.',
    plan:        'Continue current approach.',
    status:      'draft',
    finalizedAt: null,
    isDeleted:   false,
    createdAt:   new Date(),
    updatedAt:   new Date(),
  };
  const merged = { ...base, ...overrides };
  merged.toSafeObject = () => {
    // eslint-disable-next-line no-unused-vars
    const { __v, toSafeObject, save, ...rest } = merged;
    return rest;
  };
  merged.toObject = () => {
    // eslint-disable-next-line no-unused-vars
    const { __v, toSafeObject, toObject, save, ...rest } = merged;
    return rest;
  };
  merged.save = mockSave.mockResolvedValue(merged);
  return merged;
}

function makeClient(overrides = {}) {
  return {
    _id:              new mongoose.Types.ObjectId(),
    practitionerId:   'auth0|practitioner001',
    clientIdentifier: 'Client A',
    isActive:         true,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests: SessionNote encrypt / decrypt helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('SessionNote encrypt / decrypt', () => {
  let encrypt;
  let decrypt;

  beforeEach(() => {
    jest.resetModules();
    const actual = jest.requireActual('../backend/models/SessionNote');
    encrypt = actual.encrypt;
    decrypt = actual.decrypt;
  });

  test('round-trips plain text (no key configured)', () => {
    const original = 'Client reports anxiety.';
    expect(decrypt(encrypt(original))).toBe(original);
  });

  test('returns null for null input (encrypt)', () => {
    expect(encrypt(null)).toBeNull();
  });

  test('returns empty string for empty input (encrypt)', () => {
    expect(encrypt('')).toBe('');
  });

  test('decrypt returns value unchanged when not an enc: string', () => {
    expect(decrypt('plain text')).toBe('plain text');
  });

  test('decrypt returns value unchanged when null', () => {
    expect(decrypt(null)).toBeNull();
  });

  test('encrypt with key produces enc: prefix', () => {
    const hexKey = 'a'.repeat(64); // 32-byte hex key
    const saved  = process.env.SESSION_NOTES_ENCRYPTION_KEY;
    process.env.SESSION_NOTES_ENCRYPTION_KEY = hexKey;
    jest.resetModules();
    const m = jest.requireActual('../backend/models/SessionNote');
    const result = m.encrypt('hello');
    process.env.SESSION_NOTES_ENCRYPTION_KEY = saved;
    expect(result).toMatch(/^enc:/);
  });

  test('encrypt + decrypt with real key round-trips correctly', () => {
    const hexKey = 'b'.repeat(64);
    const saved  = process.env.SESSION_NOTES_ENCRYPTION_KEY;
    process.env.SESSION_NOTES_ENCRYPTION_KEY = hexKey;
    jest.resetModules();
    const m = jest.requireActual('../backend/models/SessionNote');
    const plain    = 'SOAP subjective content';
    const cipher   = m.encrypt(plain);
    const decrypted = m.decrypt(cipher);
    process.env.SESSION_NOTES_ENCRYPTION_KEY = saved;
    expect(decrypted).toBe(plain);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: POST /api/clinical/session-notes
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/session-notes', () => {
  let app;
  const clientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 401 when no token provided', async () => {
    const res = await request(app).post('/api/clinical/session-notes').send({});
    expect(res.status).toBe(401);
  });

  test('returns 403 for free tier user', async () => {
    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(freeUser))
      .send({ clientProfileId: clientId.toString() });
    expect(res.status).toBe(403);
  });

  test('returns 400 when clientProfileId is missing', async () => {
    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/clientProfileId/);
  });

  test('returns 400 when clientProfileId is invalid', async () => {
    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: 'not-an-id' });
    expect(res.status).toBe(400);
  });

  test('returns 403 when client profile is not owned by practitioner', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClient({ practitionerId: 'auth0|other' })),
    });

    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: clientId.toString() });
    expect(res.status).toBe(403);
  });

  test('returns 403 when client profile is not found', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: clientId.toString() });
    expect(res.status).toBe(403);
  });

  test('creates a note and returns 201', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClient()),
    });
    const note = makeNote({ clientProfileId: clientId });
    mockCreate.mockResolvedValue(note);

    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({
        clientProfileId: clientId.toString(),
        subjective:      'Feeling anxious',
        objective:       'Calm demeanor observed',
        assessment:      'Mild anxiety',
        plan:            'Breathing exercises',
      });

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'created' })
    );
  });

  test('returns 500 on unexpected error', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('DB error')),
    });

    const res = await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: clientId.toString() });

    expect(res.status).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/clinical/session-notes (list)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clinical/session-notes', () => {
  let app;
  const clientId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/clinical/session-notes');
    expect(res.status).toBe(401);
  });

  test('returns 400 when client_profile_id is missing', async () => {
    const res = await request(app)
      .get('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(400);
  });

  test('returns 403 when client profile is not owned', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClient({ practitionerId: 'auth0|other' })),
    });

    const res = await request(app)
      .get(`/api/clinical/session-notes?client_profile_id=${clientId}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
  });

  test('returns paginated list of notes', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClient()),
    });
    const note = makeNote({ clientProfileId: clientId });
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([note]),
    });
    mockCountDocs.mockResolvedValue(1);

    const res = await request(app)
      .get(`/api/clinical/session-notes?client_profile_id=${clientId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
    // List view should NOT include SOAP fields
    expect(res.body.notes[0].subjective).toBeUndefined();
  });

  test('filters by status=finalized', async () => {
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClient()),
    });
    mockFind.mockReturnValue({
      sort:  jest.fn().mockReturnThis(),
      skip:  jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    });
    mockCountDocs.mockResolvedValue(0);

    const res = await request(app)
      .get(`/api/clinical/session-notes?client_profile_id=${clientId}&status=finalized`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'finalized' })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: GET /api/clinical/session-notes/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clinical/session-notes/:id', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 400 for invalid note ID', async () => {
    const res = await request(app)
      .get('/api/clinical/session-notes/not-an-id')
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(400);
  });

  test('returns 404 for non-existent note', async () => {
    const id = new mongoose.Types.ObjectId();
    mockFindById.mockResolvedValue(null);

    const res = await request(app)
      .get(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(404);
  });

  test('returns 403 when note belongs to another practitioner', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ practitionerId: 'auth0|other' });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .get(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
  });

  test('returns 200 with decrypted SOAP fields and logs viewed', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .get(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body.subjective).toBeDefined();
    expect(res.body.objective).toBeDefined();
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'viewed' })
    );
  });

  test('returns 404 for soft-deleted note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, isDeleted: true });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .get(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: PATCH /api/clinical/session-notes/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/clinical/session-notes/:id', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 403 when editing another practitioner\'s note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ practitionerId: 'auth0|other' });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ subjective: 'updated' });
    expect(res.status).toBe(403);
  });

  test('returns 403 when trying to edit a finalized note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, status: 'finalized', finalizedAt: new Date() });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ subjective: 'updated' });
    expect(res.status).toBe(403);
  });

  test('updates SOAP fields and logs edited', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ subjective: 'Updated subjective content' });

    expect(res.status).toBe(200);
    expect(mockSave).toHaveBeenCalled();
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'edited' })
    );
  });

  test('finalizes note when finalize=true is sent', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ finalize: true });

    expect(res.status).toBe(200);
    expect(note.status).toBe('finalized');
    expect(note.finalizedAt).toBeInstanceOf(Date);
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'finalized' })
    );
  });

  test('returns 400 for invalid sessionDate', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ sessionDate: 'not-a-date' });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: DELETE /api/clinical/session-notes/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/clinical/session-notes/:id', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 403 when trying to delete a finalized note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, status: 'finalized', finalizedAt: new Date() });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Finalized/);
  });

  test('soft-deletes a draft note and logs deleted', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, status: 'draft' });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(note.isDeleted).toBe(true);
    expect(mockSave).toHaveBeenCalled();
    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'deleted' })
    );
  });

  test('returns 403 when deleting another practitioner\'s note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, practitionerId: 'auth0|other' });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: POST /api/clinical/session-notes/:id/activities
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/session-notes/:id/activities', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 400 when activityId is missing', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .post(`/api/clinical/session-notes/${id}/activities`)
      .set('Authorization', authHeader(practitionerUser))
      .send({});
    expect(res.status).toBe(400);
  });

  test('adds activity to draft note', async () => {
    const id         = new mongoose.Types.ObjectId();
    const noteSimple = makeNote({ _id: id });
    noteSimple.activities = [];
    mockFindById.mockResolvedValue(noteSimple);

    const res = await request(app)
      .post(`/api/clinical/session-notes/${id}/activities`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ activityId: 'act-001', durationMinutes: 45, notes: 'Great session' });

    expect(res.status).toBe(201);
    expect(mockSave).toHaveBeenCalled();
  });

  test('returns 403 when adding activity to finalized note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, status: 'finalized' });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .post(`/api/clinical/session-notes/${id}/activities`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ activityId: 'act-001' });
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: DELETE /api/clinical/session-notes/:id/activities/:activityLinkId
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/clinical/session-notes/:id/activities/:activityLinkId', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('returns 400 for invalid activity link ID', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}/activities/bad-id`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(400);
  });

  test('returns 404 when activity link not found', async () => {
    const id             = new mongoose.Types.ObjectId();
    const activityLinkId = new mongoose.Types.ObjectId();
    const note           = makeNote({ _id: id });
    // note already has one activity with a different _id
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}/activities/${activityLinkId}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(404);
  });

  test('removes activity from draft note', async () => {
    const id             = new mongoose.Types.ObjectId();
    const activityLinkId = new mongoose.Types.ObjectId();
    const note = makeNote({
      _id:        id,
      activities: [{
        _id:             activityLinkId,
        activityId:      'activity-xyz',
        durationMinutes: 20,
        notes:           '',
        toObject: () => ({ _id: activityLinkId, activityId: 'activity-xyz' }),
      }],
    });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}/activities/${activityLinkId}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(note.activities).toHaveLength(0);
    expect(mockSave).toHaveBeenCalled();
  });

  test('returns 403 when removing activity from finalized note', async () => {
    const id             = new mongoose.Types.ObjectId();
    const activityLinkId = new mongoose.Types.ObjectId();
    const note = makeNote({
      _id:    id,
      status: 'finalized',
    });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}/activities/${activityLinkId}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Permission tests: cross-practitioner isolation
// ─────────────────────────────────────────────────────────────────────────────

describe('Cross-practitioner isolation', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockAuditCreate.mockResolvedValue({});
  });

  test('practitioner cannot view another practitioner\'s note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, practitionerId: otherPractitioner.userId });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .get(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
  });

  test('practitioner cannot update another practitioner\'s note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, practitionerId: otherPractitioner.userId });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ subjective: 'tampering' });
    expect(res.status).toBe(403);
  });

  test('practitioner cannot delete another practitioner\'s note', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, practitionerId: otherPractitioner.userId });
    mockFindById.mockResolvedValue(note);

    const res = await request(app)
      .delete(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit logging tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Audit logging', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    jest.resetAllMocks();
    mockSave.mockResolvedValue({});
    mockAuditCreate.mockResolvedValue({});
  });

  test('logs "created" on POST', async () => {
    const clientId = new mongoose.Types.ObjectId();
    mockClientFindById.mockReturnValue({
      lean: jest.fn().mockResolvedValue(makeClient()),
    });
    mockCreate.mockResolvedValue(makeNote({ clientProfileId: clientId }));

    await request(app)
      .post('/api/clinical/session-notes')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: clientId.toString() });

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'created', practitionerId: practitionerUser.userId })
    );
  });

  test('logs "viewed" on GET /:id', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    await request(app)
      .get(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'viewed', practitionerId: practitionerUser.userId })
    );
  });

  test('logs "edited" on PATCH', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ subjective: 'edited' });

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'edited' })
    );
  });

  test('logs "finalized" when finalize=true', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id });
    mockFindById.mockResolvedValue(note);

    await request(app)
      .patch(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ finalize: true });

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'finalized' })
    );
  });

  test('logs "deleted" on DELETE', async () => {
    const id   = new mongoose.Types.ObjectId();
    const note = makeNote({ _id: id, status: 'draft' });
    mockFindById.mockResolvedValue(note);

    await request(app)
      .delete(`/api/clinical/session-notes/${id}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(mockAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'deleted' })
    );
  });
});
