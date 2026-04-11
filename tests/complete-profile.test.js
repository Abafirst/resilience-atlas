'use strict';

/**
 * complete-profile.test.js
 *
 * Tests for:
 *   GET  /api/auth/profile-status
 *   POST /api/auth/complete-profile
 *
 * Covers:
 *   - unauthenticated requests are rejected (401)
 *   - authenticated user can get their profile status
 *   - authenticated user can set their full name
 *   - user cannot query/set profile for a different email (403)
 *   - fullName validation (length, control characters)
 */

// ── Mock winston so no real log output is produced ──────────────────────────
jest.mock('winston', () => {
  const inst = {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add:   jest.fn(),
  };
  return {
    createLogger: jest.fn(() => inst),
    format: {
      combine:   jest.fn((...a) => a),
      timestamp: jest.fn(() => ({})),
      errors:    jest.fn(() => ({})),
      splat:     jest.fn(() => ({})),
      json:      jest.fn(() => ({})),
      colorize:  jest.fn(() => ({})),
      printf:    jest.fn((fn) => fn),
    },
    transports: {
      Console: function ConsoleTransport() {},
      File:    function FileTransport()    {},
    },
  };
});

// ── Mock express-rate-limit so tests are never throttled ─────────────────────
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());

const request = require('supertest');
const express = require('express');

// ── In-memory Auth0Profile store ─────────────────────────────────────────────
const mockProfiles = new Map();

jest.mock('../backend/models/Auth0Profile', () => {
  return {
    findOne: jest.fn(({ email }) => ({
      lean: () => Promise.resolve(mockProfiles.get(email) || null),
    })),
    findOneAndUpdate: jest.fn(
      ({ email }, update, { upsert, new: returnNew } = {}) => {
        const existing = mockProfiles.get(email) || {};
        const merged = { ...existing, ...update };
        if (upsert || returnNew) mockProfiles.set(email, merged);
        return Promise.resolve(merged);
      }
    ),
  };
});

// ── Mock authenticateJWT so we can control req.user in tests ─────────────────
//
// We expose a module-level `mockUser` variable.  Tests set it to simulate
// different authenticated identities.  Setting it to null simulates an
// unauthenticated request (middleware returns 401).

let mockUser = null;

jest.mock('../backend/middleware/auth', () => ({
  authenticateJWT: (req, res, next) => {
    if (!mockUser) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    req.user = mockUser;
    next();
  },
}));

// ── Build the Express app under test ─────────────────────────────────────────

function buildApp() {
  jest.resetModules();
  const authRouter = require('../backend/routes/auth');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockProfiles.clear();
  mockUser = null;
  jest.clearAllMocks();
});

// ── GET /api/auth/profile-status ─────────────────────────────────────────────

describe('GET /api/auth/profile-status', () => {
  describe('when unauthenticated', () => {
    it('returns 401', async () => {
      const app = buildApp();
      const res = await request(app)
        .get('/api/auth/profile-status?email=user@example.com');
      expect(res.status).toBe(401);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockUser = { email: 'alice@example.com', sub: 'auth0|alice', userId: 'auth0|alice' };
    });

    it('returns 400 when email query param is missing', async () => {
      const app = buildApp();
      const res = await request(app)
        .get('/api/auth/profile-status')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(400);
    });

    it('returns 403 when email does not match JWT', async () => {
      const app = buildApp();
      const res = await request(app)
        .get('/api/auth/profile-status?email=other@example.com')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(403);
    });

    it('returns hasName: false when no profile exists', async () => {
      const app = buildApp();
      const res = await request(app)
        .get('/api/auth/profile-status?email=alice@example.com')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(200);
      expect(res.body.hasName).toBe(false);
      expect(res.body.fullName).toBeUndefined();
    });

    it('returns hasName: true and fullName when profile exists', async () => {
      mockProfiles.set('alice@example.com', { email: 'alice@example.com', fullName: 'Alice Example' });
      const app = buildApp();
      const res = await request(app)
        .get('/api/auth/profile-status?email=alice@example.com')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(200);
      expect(res.body.hasName).toBe(true);
      expect(res.body.fullName).toBe('Alice Example');
    });

    it('is case-insensitive for the email parameter', async () => {
      mockProfiles.set('alice@example.com', { email: 'alice@example.com', fullName: 'Alice' });
      const app = buildApp();
      // JWT email is lowercase; query uses uppercase variant
      mockUser = { email: 'Alice@Example.com', sub: 'auth0|alice', userId: 'auth0|alice' };
      const res = await request(app)
        .get('/api/auth/profile-status?email=Alice@Example.com')
        .set('Authorization', 'Bearer fake-token');
      expect(res.status).toBe(200);
    });
  });
});

// ── POST /api/auth/complete-profile ──────────────────────────────────────────

describe('POST /api/auth/complete-profile', () => {
  describe('when unauthenticated', () => {
    it('returns 401', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .send({ email: 'user@example.com', fullName: 'Jane Doe' });
      expect(res.status).toBe(401);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockUser = { email: 'bob@example.com', sub: 'auth0|bob', userId: 'auth0|bob' };
    });

    it('returns 403 when email does not match JWT', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'attacker@example.com', fullName: 'Attacker Name' });
      expect(res.status).toBe(403);
    });

    it('stores the full name and returns 200', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com', fullName: 'Bob Smith' });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Bob Smith');
      expect(res.body.message).toBeDefined();
    });

    it('trims whitespace around the full name', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com', fullName: '  Bob Smith  ' });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Bob Smith');
    });

    it('allows spaces within the name', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com', fullName: 'Mary Jo Smith-Jones' });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('Mary Jo Smith-Jones');
    });

    it('returns 400 when fullName is missing', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when fullName is too short (< 2 chars after trim)', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com', fullName: 'B' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/2/);
    });

    it('returns 400 when fullName exceeds 80 characters', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com', fullName: 'A'.repeat(81) });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/80/);
    });

    it('returns 400 when fullName contains a control character', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        // eslint-disable-next-line no-control-regex
        .send({ email: 'bob@example.com', fullName: 'Bob\x01Smith' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('returns 400 when email is missing from body', async () => {
      const app = buildApp();
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ fullName: 'Bob Smith' });
      expect(res.status).toBe(400);
    });

    it('allows updating the name a second time (upsert)', async () => {
      const app = buildApp();
      mockProfiles.set('bob@example.com', { email: 'bob@example.com', fullName: 'Old Name' });
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', 'Bearer fake-token')
        .send({ email: 'bob@example.com', fullName: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.fullName).toBe('New Name');
    });
  });
});
