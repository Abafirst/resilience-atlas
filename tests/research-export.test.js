'use strict';

/**
 * research-export.test.js
 *
 * Tests for Task #23c: Research Export Tools
 *
 * Covers:
 *  - GET  /api/research/aggregate-stats
 *  - POST /api/research/csv
 *  - POST /api/research/longitudinal
 *  - Access control (auth, practitioner tier)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFindClientProfiles = jest.fn();
jest.mock('../backend/models/ClientProfile', () => {
  const M = {
    find: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockImplementation(async () => mockFindClientProfiles()),
    })),
  };
  return M;
});

const mockSnapshotFind  = jest.fn();
const mockSnapshotAgg   = jest.fn();
jest.mock('../backend/models/ClientProgressSnapshot', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockImplementation(async () => mockSnapshotFind()),
  })),
  aggregate: jest.fn().mockImplementation(async () => mockSnapshotAgg()),
}));

jest.mock('express-rate-limit', () => () => (req, res, next) => next());

jest.mock('../backend/utils/logger', () => ({
  info:  jest.fn(),
  error: jest.fn(),
  warn:  jest.fn(),
}));

const mockRequirePractitionerTier = jest.fn((req, res, next) => next());
const mockAuthenticateJWT = jest.fn((req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  req.user = { userId: 'practitioner_test' };
  next();
});

jest.mock('../backend/middleware/auth', () => ({
  authenticateJWT:          (...args) => mockAuthenticateJWT(...args),
  requirePractitionerTier:  (...args) => mockRequirePractitionerTier(...args),
}));

// ── Setup ─────────────────────────────────────────────────────────────────────

const express    = require('express');
const request    = require('supertest');

function makeToken() {
  return 'Bearer test.token.value';
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/research', require('../backend/routes/clinical/researchExport'));
  return app;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/research/aggregate-stats', () => {
  beforeEach(() => {
    mockFindClientProfiles.mockResolvedValue([]);
    mockSnapshotAgg.mockResolvedValue([]);
  });

  it('returns 401 without auth', async () => {
    const res = await request(buildApp()).get('/api/research/aggregate-stats');
    expect(res.status).toBe(401);
  });

  it('returns 200 with empty cohort when no clients', async () => {
    mockFindClientProfiles.mockResolvedValue([]);
    const res = await request(buildApp())
      .get('/api/research/aggregate-stats')
      .set('Authorization', makeToken());
    expect(res.status).toBe(200);
    expect(res.body.cohortSize).toBe(0);
  });

  it('returns aggregate stats for clients with snapshots', async () => {
    const fakeClientId = require('mongoose').Types?.ObjectId?.createFromHexString
      ? 'aaaaaaaaaaaaaaaaaaaaaaaa'
      : 'aaaaaaaaaaaaaaaaaaaaaaaa';

    mockFindClientProfiles.mockResolvedValue([
      { _id: { toString: () => fakeClientId }, practitionerId: 'practitioner_test', dateOfBirth: new Date('2015-01-01'), isActive: true },
    ]);
    mockSnapshotAgg.mockResolvedValue([
      {
        _id:            fakeClientId,
        snapshotDate:   new Date(),
        dimensionScores: {
          agenticGenerative: 65, relationalConnective: 70, somaticRegulative: 60,
          cognitiveNarrative: 72, emotionalAdaptive: 55, spiritualExistential: 50,
        },
      },
    ]);

    const res = await request(buildApp())
      .get('/api/research/aggregate-stats')
      .set('Authorization', makeToken());

    expect(res.status).toBe(200);
    expect(res.body.cohortSize).toBe(1);
    expect(res.body.dimensionStats).toBeDefined();
    expect(res.body.ageGroupDistribution).toBeDefined();
    expect(res.body.irbNote).toBeDefined();
  });
});

describe('POST /api/research/csv', () => {
  beforeEach(() => {
    mockFindClientProfiles.mockResolvedValue([]);
    mockSnapshotFind.mockResolvedValue([]);
  });

  it('returns 401 without auth', async () => {
    const res = await request(buildApp()).post('/api/research/csv').send({});
    expect(res.status).toBe(401);
  });

  it('returns 422 for invalid dimension fields', async () => {
    const res = await request(buildApp())
      .post('/api/research/csv')
      .set('Authorization', makeToken())
      .send({ fields: ['invalidDimension'] });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/Invalid dimension fields/);
  });

  it('returns csv string and rowCount: 0 when no clients', async () => {
    mockFindClientProfiles.mockResolvedValue([]);
    const res = await request(buildApp())
      .post('/api/research/csv')
      .set('Authorization', makeToken())
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.rowCount).toBe(0);
  });

  it('returns de-identified CSV rows for clients with snapshots', async () => {
    const fakeId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
    mockFindClientProfiles.mockResolvedValue([
      { _id: { toString: () => fakeId }, practitionerId: 'practitioner_test', dateOfBirth: new Date('2010-06-15'), isActive: true },
    ]);
    mockSnapshotFind.mockResolvedValue([
      {
        clientProfileId: { toString: () => fakeId },
        snapshotDate:    new Date('2025-01-15'),
        dataSource:      'assessment',
        dimensionScores: {
          agenticGenerative: 60, relationalConnective: 65, somaticRegulative: 58,
          cognitiveNarrative: 70, emotionalAdaptive: 50, spiritualExistential: 45,
        },
      },
    ]);

    const res = await request(buildApp())
      .post('/api/research/csv')
      .set('Authorization', makeToken())
      .send({ fields: ['agenticGenerative', 'emotionalAdaptive'], includeAge: true, snapshotsMax: 1 });

    expect(res.status).toBe(200);
    expect(res.body.rowCount).toBe(1);
    expect(res.body.clientCount).toBe(1);
    expect(res.body.csv).toContain('researchId');
    expect(res.body.csv).toContain('R001');
    // Should NOT contain the raw client ID
    expect(res.body.csv).not.toContain(fakeId);
    expect(res.body.irbStatement).toBeDefined();
  });
});

describe('POST /api/research/longitudinal', () => {
  beforeEach(() => {
    mockFindClientProfiles.mockResolvedValue([]);
    mockSnapshotFind.mockResolvedValue([]);
  });

  it('returns 401 without auth', async () => {
    const res = await request(buildApp()).post('/api/research/longitudinal').send({});
    expect(res.status).toBe(401);
  });

  it('returns empty dataset when no clients', async () => {
    mockFindClientProfiles.mockResolvedValue([]);
    const res = await request(buildApp())
      .post('/api/research/longitudinal')
      .set('Authorization', makeToken())
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.dataset).toEqual([]);
    expect(res.body.rowCount).toBe(0);
  });

  it('excludes clients with fewer snapshots than minSnapshots', async () => {
    const fakeId = 'cccccccccccccccccccccccc';
    mockFindClientProfiles.mockResolvedValue([
      { _id: { toString: () => fakeId }, practitionerId: 'practitioner_test', dateOfBirth: new Date('2008-03-10'), isActive: true },
    ]);
    // Only 1 snapshot — should be excluded with default minSnapshots: 2
    mockSnapshotFind.mockResolvedValue([
      {
        clientProfileId: { toString: () => fakeId },
        snapshotDate:    new Date('2025-02-01'),
        dataSource:      'assessment',
        dimensionScores: { agenticGenerative: 55, relationalConnective: 60, somaticRegulative: 50, cognitiveNarrative: 65, emotionalAdaptive: 45, spiritualExistential: 40 },
      },
    ]);

    const res = await request(buildApp())
      .post('/api/research/longitudinal')
      .set('Authorization', makeToken())
      .send({ minSnapshots: 2 });

    expect(res.status).toBe(200);
    expect(res.body.rowCount).toBe(0);
  });

  it('returns longitudinal rows with wave number and change columns', async () => {
    const fakeId = 'dddddddddddddddddddddddd';
    mockFindClientProfiles.mockResolvedValue([
      { _id: { toString: () => fakeId }, practitionerId: 'practitioner_test', dateOfBirth: new Date('2012-08-22'), isActive: true },
    ]);
    mockSnapshotFind.mockResolvedValue([
      {
        clientProfileId: { toString: () => fakeId },
        snapshotDate:    new Date('2025-01-01'),
        dataSource:      'assessment',
        dimensionScores: { agenticGenerative: 50, relationalConnective: 55, somaticRegulative: 48, cognitiveNarrative: 60, emotionalAdaptive: 42, spiritualExistential: 38 },
      },
      {
        clientProfileId: { toString: () => fakeId },
        snapshotDate:    new Date('2025-04-01'),
        dataSource:      'assessment',
        dimensionScores: { agenticGenerative: 58, relationalConnective: 62, somaticRegulative: 54, cognitiveNarrative: 67, emotionalAdaptive: 50, spiritualExistential: 44 },
      },
    ]);

    const res = await request(buildApp())
      .post('/api/research/longitudinal')
      .set('Authorization', makeToken())
      .send({ minSnapshots: 2 });

    expect(res.status).toBe(200);
    expect(res.body.rowCount).toBe(2);
    expect(res.body.dataset[0].wave).toBe(1);
    expect(res.body.dataset[1].wave).toBe(2);
    // Wave 2 change for agenticGenerative should be 8 (58-50)
    expect(res.body.dataset[1].agenticGenerative_change).toBe(8);
    // Wave 1 change should be 0 (baseline)
    expect(res.body.dataset[0].agenticGenerative_change).toBe(0);
    expect(res.body.irbStatement).toBeDefined();
    expect(res.body.columns).toContain('agenticGenerative_change');
  });
});
