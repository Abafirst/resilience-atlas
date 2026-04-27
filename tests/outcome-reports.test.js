'use strict';

/**
 * outcome-reports.test.js
 *
 * Tests for Task #22f: Client Outcome Reports
 *
 * Covers:
 *  - outcomeReportUtils.js utility functions (unit tests)
 *  - POST /api/clinical/outcome-reports/generate
 *  - GET  /api/clinical/outcome-reports/client/:clientId
 *  - GET  /api/clinical/outcome-reports/:reportId
 *  - POST /api/clinical/outcome-reports/:reportId/send
 *  - POST /api/clinical/outcome-reports/bulk-generate
 *  - Access control (auth, practitioner tier, ownership)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockClientProfileDoc = null;

jest.mock('../backend/models/ClientProfile', () => {
  const M = {
    findById: jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockImplementation(async () => mockClientProfileDoc),
    })),
  };
  M.VALID_DIMENSIONS = [];
  return M;
});

let mockSnapshotDocs = [];

jest.mock('../backend/models/ClientProgressSnapshot', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort: function () { return this; },
    lean: jest.fn().mockImplementation(async () => mockSnapshotDocs),
  })),
}));

let mockSessionNoteDocs = [];

jest.mock('../backend/models/SessionNote', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort: function () { return this; },
    lean: jest.fn().mockImplementation(async () => mockSessionNoteDocs),
  })),
}));

let mockMilestoneDocs = [];

jest.mock('../backend/models/ClientMilestone', () => ({
  find: jest.fn().mockImplementation(() => ({
    sort: function () { return this; },
    lean: jest.fn().mockImplementation(async () => mockMilestoneDocs),
  })),
}));

// OutcomeReport mock
let mockReportDoc = null;
let mockReportDocs = [];
const mockReportCreate        = jest.fn();
const mockReportFind          = jest.fn();
const mockReportFindOne       = jest.fn();
const mockFindOneAndUpdate    = jest.fn();
const mockUpdateOne           = jest.fn();

jest.mock('../backend/models/OutcomeReport', () => {
  const M = {
    create:            mockReportCreate,
    find:              mockReportFind,
    findOne:           mockReportFindOne,
    findOneAndUpdate:  mockFindOneAndUpdate,
    updateOne:         mockUpdateOne,
  };
  M.VALID_REPORT_TYPES = ['insurance', 'family', 'school', 'summary'];
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
    const allowed = ['practitioner', 'practice', 'enterprise'];
    if (!allowed.includes(req.user?.tier)) {
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

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  })),
}));

// pdfkit mock — chainable, streams end event
jest.mock('pdfkit', () => {
  const { EventEmitter } = require('events');
  class PDFDocument extends EventEmitter {
    constructor() {
      super();
      this.y = 0;
      this.page = { margins: { bottom: 45 } };
    }
    pipe(stream) {
      // Emit finish after a tick so the response ends cleanly.
      setImmediate(() => {
        stream.end && stream.end();
      });
      return this;
    }
    end() {
      setImmediate(() => this.emit('end'));
      return this;
    }
  }
  const chainMethods = [
    'fontSize', 'font', 'text', 'moveDown', 'fillColor', 'strokeColor',
    'rect', 'fill', 'moveTo', 'lineTo', 'stroke', 'lineWidth', 'image',
    'addPage', 'save', 'restore', 'translate', 'rotate', 'opacity',
  ];
  chainMethods.forEach(m => {
    PDFDocument.prototype[m] = function () { return this; };
  });
  return PDFDocument;
});

jest.mock('mongoose', () => {
  function ObjectId(v) {
    if (!(this instanceof ObjectId)) return new ObjectId(v);
    this._v = v;
    this.toString = () => String(v);
  }
  ObjectId.isValid = jest.fn(v => typeof v === 'string' && v.length === 24);

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

// ── Imports ───────────────────────────────────────────────────────────────────

const express = require('express');
const request = require('supertest');

const {
  DIMENSION_KEYS,
  MILESTONE_SESSION_COUNTS,
  computeBaselineScores,
  computeCurrentScores,
  buildDimensionProgress,
  countGoalsByStatus,
  topActivities,
  isMilestoneTrigger,
  dimensionNarrative,
  changeColour,
  formatDate,
} = require('../backend/utils/outcomeReportUtils');

// ── App builder ───────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/clinical/outcome-reports', require('../backend/routes/clinical/outcomeReports'));
  return app;
}

function authHeader(payload) {
  return 'Bearer ' + Buffer.from(JSON.stringify(payload)).toString('base64');
}

const practitionerUser = { userId: 'pract-001', tier: 'practitioner' };
const freeUser         = { userId: 'free-001',  tier: 'free' };

const VALID_CLIENT_ID = 'a'.repeat(24);
const VALID_REPORT_ID = 'b'.repeat(24);

function makeClientProfile(overrides = {}) {
  return {
    _id:              VALID_CLIENT_ID,
    practitionerId:   practitionerUser.userId,
    clientIdentifier: 'J.D.',
    clinicalGoals:    [],
    ...overrides,
  };
}

function makeSnapshot(snapshotDate, scores = {}) {
  return {
    snapshotDate,
    dimensionScores: {
      agenticGenerative:    scores.agenticGenerative    ?? 50,
      relationalConnective: scores.relationalConnective ?? 50,
      somaticRegulative:    scores.somaticRegulative    ?? 50,
      cognitiveNarrative:   scores.cognitiveNarrative   ?? 50,
      emotionalAdaptive:    scores.emotionalAdaptive    ?? 50,
      spiritualExistential: scores.spiritualExistential ?? 50,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests — outcomeReportUtils
// ─────────────────────────────────────────────────────────────────────────────

describe('outcomeReportUtils', () => {
  describe('computeBaselineScores', () => {
    test('returns zeros for empty snapshots', () => {
      const result = computeBaselineScores([]);
      DIMENSION_KEYS.forEach(k => expect(result[k]).toBe(0));
    });

    test('averages first 3 snapshots in chronological order', () => {
      const snaps = [
        makeSnapshot('2025-01-03', { agenticGenerative: 60 }),
        makeSnapshot('2025-01-01', { agenticGenerative: 40 }),
        makeSnapshot('2025-01-02', { agenticGenerative: 50 }),
        makeSnapshot('2025-01-04', { agenticGenerative: 80 }),
      ];
      const result = computeBaselineScores(snaps, 3);
      // First 3 sorted: 01-01 (40), 01-02 (50), 01-03 (60) → avg = 50
      expect(result.agenticGenerative).toBe(50);
    });

    test('works with a single snapshot', () => {
      const snaps = [makeSnapshot('2025-01-01', { emotionalAdaptive: 70 })];
      const result = computeBaselineScores(snaps, 3);
      expect(result.emotionalAdaptive).toBe(70);
    });
  });

  describe('computeCurrentScores', () => {
    test('returns zeros for empty snapshots', () => {
      const result = computeCurrentScores([]);
      DIMENSION_KEYS.forEach(k => expect(result[k]).toBe(0));
    });

    test('averages last 3 snapshots', () => {
      const snaps = [
        makeSnapshot('2025-01-01', { somaticRegulative: 30 }),
        makeSnapshot('2025-01-02', { somaticRegulative: 40 }),
        makeSnapshot('2025-01-03', { somaticRegulative: 50 }),
        makeSnapshot('2025-01-04', { somaticRegulative: 90 }),
      ];
      const result = computeCurrentScores(snaps, 3);
      // Last 3 sorted: 01-02 (40), 01-03 (50), 01-04 (90) → avg = 60
      expect(result.somaticRegulative).toBe(60);
    });
  });

  describe('buildDimensionProgress', () => {
    test('computes change and pctChange correctly', () => {
      const baseline = Object.fromEntries(DIMENSION_KEYS.map(k => [k, 50]));
      const current  = Object.fromEntries(DIMENSION_KEYS.map(k => [k, 60]));
      const result   = buildDimensionProgress(baseline, current);

      expect(result).toHaveLength(DIMENSION_KEYS.length);
      result.forEach(dp => {
        expect(dp.change).toBe(10);
        expect(dp.pctChange).toBe(20);
        expect(dp.baseline).toBe(50);
        expect(dp.current).toBe(60);
        expect(dp.label).toBeTruthy();
      });
    });

    test('handles zero baseline without division error', () => {
      const baseline = Object.fromEntries(DIMENSION_KEYS.map(k => [k, 0]));
      const current  = Object.fromEntries(DIMENSION_KEYS.map(k => [k, 40]));
      const result   = buildDimensionProgress(baseline, current);
      result.forEach(dp => expect(dp.pctChange).toBe(0));
    });
  });

  describe('countGoalsByStatus', () => {
    test('counts achieved, in-progress, and total', () => {
      const goals = [
        { status: 'achieved' },
        { status: 'active' },
        { status: 'in-progress' },
        { status: 'on-hold' },
      ];
      const result = countGoalsByStatus(goals);
      expect(result.achieved).toBe(1);
      expect(result.inProgress).toBe(2);
      expect(result.total).toBe(4);
    });

    test('handles null / undefined input', () => {
      const result = countGoalsByStatus(null);
      expect(result).toEqual({ achieved: 0, inProgress: 0, total: 0 });
    });

    test('handles empty array', () => {
      const result = countGoalsByStatus([]);
      expect(result).toEqual({ achieved: 0, inProgress: 0, total: 0 });
    });
  });

  describe('topActivities', () => {
    test('ranks activities by usage count', () => {
      const notes = [
        { activities: [{ activityId: 'act-1' }, { activityId: 'act-2' }] },
        { activities: [{ activityId: 'act-1' }, { activityId: 'act-3' }] },
        { activities: [{ activityId: 'act-1' }] },
      ];
      const result = topActivities(notes, 2);
      expect(result[0].activityId).toBe('act-1');
      expect(result[0].count).toBe(3);
      expect(result).toHaveLength(2);
    });

    test('returns empty array for notes with no activities', () => {
      const notes = [{ activities: [] }, {}];
      expect(topActivities(notes)).toEqual([]);
    });

    test('handles null input', () => {
      expect(topActivities(null)).toEqual([]);
    });
  });

  describe('isMilestoneTrigger', () => {
    test.each(MILESTONE_SESSION_COUNTS)('returns true at %d sessions', count => {
      expect(isMilestoneTrigger(count)).toBe(true);
    });

    test('returns false for non-milestone counts', () => {
      expect(isMilestoneTrigger(5)).toBe(false);
      expect(isMilestoneTrigger(11)).toBe(false);
      expect(isMilestoneTrigger(99)).toBe(false);
    });
  });

  describe('dimensionNarrative', () => {
    test('positive change', () => {
      const text = dimensionNarrative({ label: 'Agentic-Generative', change: 10, pctChange: 20 });
      expect(text).toMatch(/improved/);
      expect(text).toMatch(/10/);
    });

    test('negative change', () => {
      const text = dimensionNarrative({ label: 'Agentic-Generative', change: -5, pctChange: -10 });
      expect(text).toMatch(/declined/);
    });

    test('no change', () => {
      const text = dimensionNarrative({ label: 'Agentic-Generative', change: 0, pctChange: 0 });
      expect(text).toMatch(/stable/);
    });
  });

  describe('changeColour', () => {
    test('positive → green', ()  => expect(changeColour(5)).toBe('green'));
    test('negative → red',   ()  => expect(changeColour(-1)).toBe('red'));
    test('zero → yellow',    ()  => expect(changeColour(0)).toBe('yellow'));
  });

  describe('formatDate', () => {
    test('formats a date string', () => {
      const result = formatDate('2026-01-15');
      expect(result).toMatch(/January/);
      expect(result).toMatch(/2026/);
    });

    test('returns dash for null', () => {
      expect(formatDate(null)).toBe('—');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests — API routes
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/outcome-reports/generate', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    // Default: valid client owned by practitioner.
    mockClientProfileDoc = makeClientProfile();
    mockSnapshotDocs     = [];
    mockSessionNoteDocs  = [];
    mockMilestoneDocs    = [];
    mockReportCreate.mockResolvedValue({
      _id: VALID_REPORT_ID,
      reportType: 'summary',
      generatedAt: new Date(),
    });
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .send({ clientProfileId: VALID_CLIENT_ID });
    expect(res.status).toBe(401);
  });

  test('returns 403 for free user', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(freeUser))
      .send({ clientProfileId: VALID_CLIENT_ID });
    expect(res.status).toBe(403);
  });

  test('returns 400 for missing clientProfileId', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/clientProfileId/);
  });

  test('returns 400 for invalid clientProfileId', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: 'not-an-objectid' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid reportType', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: VALID_CLIENT_ID, reportType: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reportType/);
  });

  test('returns 404 when client not found', async () => {
    mockClientProfileDoc = null;
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: VALID_CLIENT_ID });
    expect(res.status).toBe(404);
  });

  test('returns 404 when client belongs to another practitioner', async () => {
    mockClientProfileDoc = makeClientProfile({ practitionerId: 'other-pract' });
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: VALID_CLIENT_ID });
    expect(res.status).toBe(404);
  });

  test('streams a PDF and sets X-Report-Id header on success', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: VALID_CLIENT_ID, reportType: 'summary' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['x-report-id']).toBe(VALID_REPORT_ID);
    expect(mockReportCreate).toHaveBeenCalledTimes(1);
  });

  test('persists isAnonymized flag in report metadata', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: VALID_CLIENT_ID, isAnonymized: true });

    expect(res.status).toBe(200);
    const createArgs = mockReportCreate.mock.calls[0][0];
    expect(createArgs.isAnonymized).toBe(true);
  });

  test.each(['insurance', 'family', 'school', 'summary'])('accepts reportType: %s', async (reportType) => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileId: VALID_CLIENT_ID, reportType });
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clinical/outcome-reports/client/:clientId', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    mockClientProfileDoc = makeClientProfile();
    mockReportDocs = [
      { _id: VALID_REPORT_ID, reportType: 'summary', generatedAt: new Date() },
    ];
    mockReportFind.mockImplementation(() => ({
      sort: function () { return this; },
      lean: jest.fn().mockResolvedValue(mockReportDocs),
    }));
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/clinical/outcome-reports/client/${VALID_CLIENT_ID}`);
    expect(res.status).toBe(401);
  });

  test('returns 403 for free user', async () => {
    const res = await request(app)
      .get(`/api/clinical/outcome-reports/client/${VALID_CLIENT_ID}`)
      .set('Authorization', authHeader(freeUser));
    expect(res.status).toBe(403);
  });

  test('returns 400 for invalid clientId', async () => {
    const res = await request(app)
      .get('/api/clinical/outcome-reports/client/bad-id')
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(400);
  });

  test('returns 404 when client not found', async () => {
    mockClientProfileDoc = null;
    const res = await request(app)
      .get(`/api/clinical/outcome-reports/client/${VALID_CLIENT_ID}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(404);
  });

  test('returns report list for valid practitioner', async () => {
    const res = await request(app)
      .get(`/api/clinical/outcome-reports/client/${VALID_CLIENT_ID}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reports');
    expect(Array.isArray(res.body.reports)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/clinical/outcome-reports/:reportId', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    mockReportDoc = { _id: VALID_REPORT_ID, practitionerId: practitionerUser.userId, reportType: 'summary', accessedBy: [] };
    mockFindOneAndUpdate.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(mockReportDoc),
    }));
  });

  test('returns 401 without auth', async () => {
    const res = await request(app).get(`/api/clinical/outcome-reports/${VALID_REPORT_ID}`);
    expect(res.status).toBe(401);
  });

  test('returns 400 for invalid reportId', async () => {
    const res = await request(app)
      .get('/api/clinical/outcome-reports/bad-id')
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(400);
  });

  test('returns 404 when report not found', async () => {
    mockFindOneAndUpdate.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue(null),
    }));
    const res = await request(app)
      .get(`/api/clinical/outcome-reports/${VALID_REPORT_ID}`)
      .set('Authorization', authHeader(practitionerUser));
    expect(res.status).toBe(404);
  });

  test('returns report metadata and records access', async () => {
    const res = await request(app)
      .get(`/api/clinical/outcome-reports/${VALID_REPORT_ID}`)
      .set('Authorization', authHeader(practitionerUser));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(VALID_REPORT_ID);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_REPORT_ID, practitionerId: practitionerUser.userId },
      { $addToSet: { accessedBy: practitionerUser.userId } },
      { new: true }
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/outcome-reports/:reportId/send', () => {
  let app;

  function setupFindOneReturning(value) {
    mockReportFindOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(value),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    mockReportDoc = {
      _id:             VALID_REPORT_ID,
      practitionerId:  practitionerUser.userId,
      clientProfileId: VALID_CLIENT_ID,
      isAnonymized:    false,
      generatedAt:     new Date(),
      periodStart:     null,
      periodEnd:       null,
      totalSessions:   5,
    };
    mockClientProfileDoc = makeClientProfile();
    setupFindOneReturning(mockReportDoc);
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post(`/api/clinical/outcome-reports/${VALID_REPORT_ID}/send`)
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(401);
  });

  test('returns 400 for missing email', async () => {
    const res = await request(app)
      .post(`/api/clinical/outcome-reports/${VALID_REPORT_ID}/send`)
      .set('Authorization', authHeader(practitionerUser))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/);
  });

  test('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post(`/api/clinical/outcome-reports/${VALID_REPORT_ID}/send`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid reportId', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bad-id/send')
      .set('Authorization', authHeader(practitionerUser))
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });

  test('returns 404 when report not found', async () => {
    setupFindOneReturning(null);
    const res = await request(app)
      .post(`/api/clinical/outcome-reports/${VALID_REPORT_ID}/send`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(404);
  });

  test('returns sent: false when SMTP not configured', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const res = await request(app)
      .post(`/api/clinical/outcome-reports/${VALID_REPORT_ID}/send`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(false);
    expect(res.body.reason).toMatch(/SMTP/);
    // Audit trail should still be updated.
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  test('records email in sentToEmails audit trail when SMTP missing', async () => {
    delete process.env.SMTP_HOST;
    await request(app)
      .post(`/api/clinical/outcome-reports/${VALID_REPORT_ID}/send`)
      .set('Authorization', authHeader(practitionerUser))
      .send({ email: 'audit@example.com' });

    const updateCall = mockUpdateOne.mock.calls[0];
    expect(updateCall[1].$addToSet.sentToEmails).toBe('audit@example.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/clinical/outcome-reports/bulk-generate', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    mockClientProfileDoc = makeClientProfile();
    mockSnapshotDocs     = [];
    mockSessionNoteDocs  = [];
    mockMilestoneDocs    = [];
    mockReportCreate.mockResolvedValue({ _id: VALID_REPORT_ID });
  });

  test('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .send({ clientProfileIds: [VALID_CLIENT_ID] });
    expect(res.status).toBe(401);
  });

  test('returns 400 for empty clientProfileIds', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileIds: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/clientProfileIds/);
  });

  test('returns 400 for invalid ObjectIds in the array', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileIds: ['bad-id'] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid ObjectIds/);
  });

  test('returns 400 for invalid reportType', async () => {
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileIds: [VALID_CLIENT_ID], reportType: 'bogus' });
    expect(res.status).toBe(400);
  });

  test('generates reports for all valid clients', async () => {
    const ids = [VALID_CLIENT_ID, 'c'.repeat(24)];
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileIds: ids });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.results).toHaveLength(2);
  });

  test('marks a client as failed when profile not found', async () => {
    mockClientProfileDoc = null;
    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileIds: [VALID_CLIENT_ID] });

    expect(res.status).toBe(200);
    expect(res.body.results[0].success).toBe(false);
    expect(res.body.results[0].error).toMatch(/not found/);
  });

  test('succeeded count reflects only successful reports', async () => {
    // First ID succeeds, second belongs to another practitioner.
    const ClientProfile = require('../backend/models/ClientProfile');
    ClientProfile.findById
      .mockImplementationOnce(() => ({
        lean: jest.fn().mockResolvedValue(makeClientProfile()),
      }))
      .mockImplementationOnce(() => ({
        lean: jest.fn().mockResolvedValue(makeClientProfile({ practitionerId: 'other' })),
      }));

    const res = await request(app)
      .post('/api/clinical/outcome-reports/bulk-generate')
      .set('Authorization', authHeader(practitionerUser))
      .send({ clientProfileIds: [VALID_CLIENT_ID, 'c'.repeat(24)] });

    expect(res.status).toBe(200);
    expect(res.body.succeeded).toBe(1);
  });
});
