'use strict';

/**
 * sso.test.js — Unit tests for GET /api/sso/lookup
 *
 * Verifies domain-based SSO routing: returns { sso: true, connection } for
 * mapped domains and { sso: false } for all others.
 */

// Mock winston logger so no real log output is produced during tests.
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

const request = require('supertest');
const express = require('express');

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a fresh Express app that mounts the SSO router.
 * The domainMap inside sso.js is loaded once at require() time, so we must
 * reset the module registry whenever we want a different SSO_DOMAIN_MAP value.
 */
function buildApp() {
  // Re-require the router so it picks up the current process.env.SSO_DOMAIN_MAP.
  jest.resetModules();
  const ssoRouter = require('../backend/routes/sso');
  const app = express();
  app.use(express.json());
  app.use('/api/sso', ssoRouter);
  return app;
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  delete process.env.SSO_DOMAIN_MAP;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/sso/lookup', () => {
  describe('when SSO_DOMAIN_MAP is not set', () => {
    it('returns { sso: false } for any email', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=user@acme.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sso: false });
    });
  });

  describe('when SSO_DOMAIN_MAP is configured', () => {
    beforeEach(() => {
      process.env.SSO_DOMAIN_MAP = JSON.stringify({
        'acme.com':        'acme-saml',
        'corp.example.com': 'corp-oidc',
      });
    });

    it('returns { sso: true, connection } for a mapped domain', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=alice@acme.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sso: true, connection: 'acme-saml' });
    });

    it('is case-insensitive for the domain', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=bob@ACME.COM');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sso: true, connection: 'acme-saml' });
    });

    it('returns { sso: false } for an unmapped domain', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=carol@gmail.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sso: false });
    });

    it('returns { sso: true } for a subdomain in the map', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=dave@corp.example.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sso: true, connection: 'corp-oidc' });
    });
  });

  describe('input validation', () => {
    it('returns 400 when email query param is missing', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a string without @', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=notanemail');
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for a bare @ with no domain', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=user@');
      expect(res.status).toBe(400);
    });

    it('returns 400 for a domain with no dot', async () => {
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=user@localhost');
      expect(res.status).toBe(400);
    });
  });

  describe('when SSO_DOMAIN_MAP is malformed JSON', () => {
    it('returns { sso: false } and does not crash', async () => {
      process.env.SSO_DOMAIN_MAP = '{bad json}';
      const app = buildApp();
      const res = await request(app).get('/api/sso/lookup?email=user@acme.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sso: false });
    });
  });
});
