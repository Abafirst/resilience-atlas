'use strict';

jest.mock('winston');

// ...other mocks...

const request = require('supertest');
const app = require('../backend/server');

/**
 * Integration tests for the backend Express server.
 * External dependencies (mongoose, stripe, nodemailer) are mocked so that
 * no live network connections are required.
 */

// ── Env ──────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';

// ── Mocks ────────────────────────────────────────────────────────────────────

// IMPORTANT: mock winston before requiring the server, because backend/utils/logger.js
// imports winston at module-load time.
jest.mock('winston', () => {
  const loggerInstance = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => loggerInstance),
    format: {
      combine: jest.fn((...args) => args),
      timestamp: jest.fn(() => ({})),
      errors: jest.fn(() => ({})),
      splat: jest.fn(() => ({})),
      json: jest.fn(() => ({})),
      colorize: jest.fn(() => ({})),
      printf: jest.fn((fn) => fn),
    },
    transports: {
      Console: function ConsoleTransport() {},
      File: function FileTransport() {},
    },
  };
});

// Mock mongoose so the server doesn't attempt a real DB connection.
jest.mock('mongoose', () => {
  class Schema {
    constructor() {}
    pre() {
      return this;
    }
    index() {
      return this;
    }
    methods = {};
  }
  Schema.Types = { ObjectId: String, Mixed: {} };

  const m = {
    connect: jest.fn().mockResolvedValue({}),
    Schema,
    model: jest.fn(),
  };
  return m;
});

// Mock User model used by routes.
const mockUser = {
  _id: 'user001',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  affiliateCode: 'RA-TESTUSER-ABC',
  stripeCustomerId: null,
  quizResults: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  toJSON: jest.fn(function () {
    return {
      _id: this._id,
      username: this.username,
      email: this.email,
      role: this.role,
      affiliateCode: this.affiliateCode,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      quizResults: this.quizResults,
      stripeCustomerId: this.stripeCustomerId,
    };
  }),
  comparePassword: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
};

jest.mock('../backend/models/User', () => {
  const MockUser = jest.fn().mockImplementation(() => mockUser);
  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.findById = jest.fn().mockImplementation(() => Promise.resolve(mockUser));
  MockUser.findByIdAndUpdate = jest.fn().mockImplementation(() => Promise.resolve(mockUser));
  MockUser.countDocuments = jest.fn().mockResolvedValue(0);
  MockUser.find = jest.fn().mockResolvedValue([]);
  return MockUser;
});

// Mock ResilienceResult model so DB saves don't require a real connection.
jest.mock('../backend/models/ResilienceResult', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

// Mock PracticeCompletion model used by the evidence-practices route.
jest.mock('../backend/models/PracticeCompletion', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'comp001' }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) })
  }),
  countDocuments: jest.fn().mockResolvedValue(0),
}));

// Mock Purchase model used by the payments route and report download.
jest.mock('../backend/models/Purchase', () => ({
  create: jest.fn().mockResolvedValue({ _id: 'purchase001' }),
  findOne: jest.fn().mockResolvedValue(null),
  findOneAndUpdate: jest.fn().mockResolvedValue({}),
}));

// Mock stripe — use a regular function so `new Stripe(key)` works as a constructor.
jest.mock('stripe', () => function Stripe() {
  return {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test',
        client_secret: 'secret_test',
        status: 'requires_payment_method',
      }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' }),
    },
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test',
          url: 'https://checkout.stripe.com/pay/cs_test',
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cs_test',
          payment_status: 'paid',
          customer_email: 'test@example.com',
          metadata: { tier: 'atlas-navigator', email: 'test@example.com' },
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } },
      }),
    },
  };
});

// Mock nodemailer so no emails are actually sent.
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  })),
}));

// Mock jsonwebtoken so we can produce verifiable tokens in tests.
jest.mock('jsonwebtoken', () => {
  const real = jest.requireActual('jsonwebtoken');
  return {
    ...real,
    sign: real.sign,
    verify: real.verify,
  };
});


// ── Test helpers ──────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
function authToken() {
    return jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Health / Root ─────────────────────────────────────────────────────────────

describe('GET /health', () => {
    test('returns 200 with status OK once server is ready, or 503 while starting', async () => {
        const res = await request(app).get('/health');
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body).toMatchObject({ status: 'OK' });
        } else {
            expect(res.body).toMatchObject({ status: 'starting' });
        }
    });
});

describe('GET /', () => {
    test('returns HTML (200 when client/dist is built, 503 otherwise)', async () => {
        const res = await request(app).get('/');
        // In production client/dist/index.html exists → 200.
        // In CI/test environments without a frontend build → 503.
        expect([200, 503]).toContain(res.status);
        expect(res.type).toMatch(/html/);
    });
});

// ── Public assessment pages (free, no payment required) ──────────────────────

describe('GET /quiz.html', () => {
    test('permanently redirects to /quiz (SPA route)', async () => {
        // /quiz.html now redirects to the SPA /quiz route so that all users land
        // on the React SPA which handles auth via Auth0Provider.
        const res = await request(app).get('/quiz.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/quiz');
    });
});

describe('GET /results.html', () => {
    test('permanently redirects to /results (removes legacy bypass)', async () => {
        // /results.html must now issue a 301 redirect to /results so that
        // users always land on the React SPA which enforces tier/payment logic.
        const res = await request(app).get('/results.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/results');
    });
});

describe('GET /resources.html', () => {
    test('permanently redirects to /resources (SPA route)', async () => {
        // /resources.html must redirect to the SPA /resources route so that
        // old links continue to work without serving the legacy static file.
        const res = await request(app).get('/resources.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/resources');
    });
});

describe('GET /team.html', () => {
    test('permanently redirects to /teams (SPA route)', async () => {
        // /team.html redirects to /teams (the canonical Teams landing SPA route).
        const res = await request(app).get('/team.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams');
    });

    test('preserves query-string params when redirecting', async () => {
        const res = await request(app).get('/team.html?upgrade=success&session_id=cs_test_123');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams?upgrade=success&session_id=cs_test_123');
    });
});

describe('GET /dashboard.html', () => {
    test('permanently redirects to /dashboard (SPA route)', async () => {
        // /dashboard.html redirects to /dashboard so users always land on the
        // React SPA DashboardPage instead of the legacy static HTML file.
        const res = await request(app).get('/dashboard.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/dashboard');
    });
});

describe('GET /dashboard', () => {
    test('serves React SPA index.html', async () => {
        // /dashboard must be handled before the public/ static middleware so
        // public/dashboard.html is never accidentally returned.
        const res = await request(app).get('/dashboard');
        // The SPA index.html may not exist in CI (no client build), so accept
        // either 200 (built) or 503 (build absent) — never a static HTML page.
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.headers['content-type']).toMatch(/html/);
        }
    });
});

// ── Teams routes ─────────────────────────────────────────────────────────────

describe('GET /teams-activities.html', () => {
    test('permanently redirects to /teams/activities (canonical SPA route)', async () => {
        const res = await request(app).get('/teams-activities.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams/activities');
    });
});

describe('GET /teams-resources.html', () => {
    test('permanently redirects to /teams/resources (canonical SPA route)', async () => {
        const res = await request(app).get('/teams-resources.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams/resources');
    });
});

describe('GET /teams-facilitation.html', () => {
    test('permanently redirects to /teams/facilitation (canonical SPA route)', async () => {
        const res = await request(app).get('/teams-facilitation.html');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams/facilitation');
    });
});

describe('GET /teams-activities', () => {
    test('permanently redirects to /teams/activities (canonical path)', async () => {
        const res = await request(app).get('/teams-activities');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams/activities');
    });
});

describe('GET /teams-resources', () => {
    test('permanently redirects to /teams/resources (canonical path)', async () => {
        const res = await request(app).get('/teams-resources');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams/resources');
    });
});

describe('GET /teams-facilitation', () => {
    test('permanently redirects to /teams/facilitation (canonical path)', async () => {
        const res = await request(app).get('/teams-facilitation');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/teams/facilitation');
    });
});

describe('GET /teams', () => {
    test('serves React SPA index.html', async () => {
        const res = await request(app).get('/teams');
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.headers['content-type']).toMatch(/html/);
        }
    });
});

describe('GET /teams/activities', () => {
    test('serves React SPA index.html (never legacy teams-activities.html)', async () => {
        const res = await request(app).get('/teams/activities');
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.headers['content-type']).toMatch(/html/);
            // Must not contain legacy HTML markers
            expect(res.text).not.toMatch(/teams-activities\.js/);
        }
    });
});

describe('GET /teams/resources', () => {
    test('serves React SPA index.html (never legacy teams-resources.html)', async () => {
        const res = await request(app).get('/teams/resources');
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.headers['content-type']).toMatch(/html/);
            expect(res.text).not.toMatch(/teams-resources\.js/);
        }
    });
});

describe('GET /teams/facilitation', () => {
    test('serves React SPA index.html (never legacy teams-facilitation.html)', async () => {
        const res = await request(app).get('/teams/facilitation');
        expect([200, 503]).toContain(res.status);
        if (res.status === 200) {
            expect(res.headers['content-type']).toMatch(/html/);
            expect(res.text).not.toMatch(/teams-facilitation\.js/);
        }
    });
});

// ── Auth routes ───────────────────────────────────────────────────────────────

describe('GET /api/auth/profile', () => {
    const User = require('../backend/models/User');

    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/auth/profile');
        expect(res.status).toBe(401);
    });

    test('returns 200 with user data for an authenticated request', async () => {
        User.findById.mockResolvedValue(mockUser);
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user');
    });
});

// ── Quiz routes ───────────────────────────────────────────────────────────────

describe('GET /api/quiz/questions', () => {
    test('returns 200 with questions array', async () => {
        const res = await request(app).get('/api/quiz/questions');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('questions');
        expect(Array.isArray(res.body.questions)).toBe(true);
    });
});

describe('POST /api/quiz/submit', () => {
    const User = require('../backend/models/User');

    test('returns 401 without a token', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .send({ answers: Array(72).fill(3) });
        expect(res.status).toBe(401);
    });

    test('returns 400 when answers array is wrong length', async () => {
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: [1, 2, 3] });
        expect(res.status).toBe(400);
    });

    test('returns 200 with scores on valid submission', async () => {
        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        const res = await request(app)
            .post('/api/quiz/submit')
            .set('Authorization', `Bearer ${authToken()}`)
            .send({ answers: Array(72).fill(4) });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('scores');
        expect(res.body).toHaveProperty('overall');
        expect(res.body).toHaveProperty('dominantType');
    });
});

describe('GET /api/quiz/results', () => {
    const User = require('../backend/models/User');

    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/quiz/results');
        expect(res.status).toBe(401);
    });

    test('returns 200 with results for an authenticated user', async () => {
        User.findById.mockResolvedValue({ ...mockUser, quizResults: [] });
        const res = await request(app)
            .get('/api/quiz/results')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('results');
    });
});

// ── Payments tiers route ──────────────────────────────────────────────────────

describe('GET /api/payments/tiers', () => {
    test('returns 200 with tiers array containing atlas-starter and atlas-navigator', async () => {
        const res = await request(app).get('/api/payments/tiers');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('tiers');
        expect(Array.isArray(res.body.tiers)).toBe(true);
        expect(res.body.tiers).toHaveLength(2);

        const starterTier = res.body.tiers.find(t => t.id === 'atlas-starter');
        expect(starterTier).toBeDefined();
        expect(starterTier.name).toBe('Atlas Starter');
        expect(starterTier.price).toBe(4.99);
        expect(starterTier.currency).toBe('USD');
        expect(starterTier.billing).toBe('one-time');

        const navigatorTier = res.body.tiers.find(t => t.id === 'atlas-navigator');
        expect(navigatorTier).toBeDefined();
        expect(navigatorTier.name).toBe('Atlas Navigator');
        expect(navigatorTier.price).toBe(9.99);
        expect(navigatorTier.currency).toBe('USD');
        expect(navigatorTier.billing).toBe('one-time');
    });
});

// ── CORS behavior ────────────────────────────────────────────────────────────

describe('CORS middleware', () => {
  const ORIGIN_A = 'https://www.theresilienceatlas.com';
  const ORIGIN_B = 'https://resilience-atlas-staging.up.railway.app';
  const CAPACITOR_ORIGIN_HTTPS = 'https://localhost';
  const CAPACITOR_ORIGIN_HTTP = 'http://localhost';

  /** Re-require the app after mutating process.env so the new CORS_ORIGIN is picked up. */
  function loadFreshApp() {
    jest.resetModules();
    return require('../backend/server');
  }

  afterEach(() => {
    delete process.env.CORS_ORIGIN;
    jest.resetModules();
  });

  test('allows default production origins when CORS_ORIGIN is not set', async () => {
    const freshApp = loadFreshApp();
    const allowedByDefault = 'https://theresilienceatlas.com';
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', allowedByDefault);
    expect(res.headers['access-control-allow-origin']).toBe(allowedByDefault);
  });

  test('blocks unlisted origins when CORS_ORIGIN is not set', async () => {
    const freshApp = loadFreshApp();
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', 'https://untrusted-domain.com');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('allows all origins when CORS_ORIGIN is "*"', async () => {
    process.env.CORS_ORIGIN = '*';
    const freshApp = loadFreshApp();
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', ORIGIN_A);
    const acao = res.headers['access-control-allow-origin'];
    expect([ORIGIN_A, '*', undefined]).toContain(acao);
  });

  test('allows a listed origin when CORS_ORIGIN is a comma-separated list', async () => {
    process.env.CORS_ORIGIN = `${ORIGIN_A},${ORIGIN_B}`;
    const freshApp = loadFreshApp();
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', ORIGIN_A);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_A);
  });

  test('allows requests without an Origin header (curl/Postman)', async () => {
    process.env.CORS_ORIGIN = ORIGIN_A;
    const freshApp = loadFreshApp();
    const res = await request(freshApp).get('/health');
    expect([200, 503]).toContain(res.status);
  });

  test('allows staging origin by default (no CORS_ORIGIN env var)', async () => {
    const freshApp = loadFreshApp();
    const res = await request(freshApp)
      .get('/health')
      .set('Origin', ORIGIN_B);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_B);
  });

  test('allows Capacitor localhost origins by default (no CORS_ORIGIN env var)', async () => {
    const freshApp = loadFreshApp();
    const httpsRes = await request(freshApp)
      .get('/config')
      .set('Origin', CAPACITOR_ORIGIN_HTTPS);
    expect(httpsRes.headers['access-control-allow-origin']).toBe(CAPACITOR_ORIGIN_HTTPS);

    const httpRes = await request(freshApp)
      .get('/config')
      .set('Origin', CAPACITOR_ORIGIN_HTTP);
    expect(httpRes.headers['access-control-allow-origin']).toBe(CAPACITOR_ORIGIN_HTTP);
  });

  test('handles /api/* CORS preflight from Capacitor origin', async () => {
    const freshApp = loadFreshApp();
    const res = await request(freshApp)
      .options('/api/quiz')
      .set('Origin', CAPACITOR_ORIGIN_HTTPS)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization');
    expect([200, 204]).toContain(res.status);
    expect(res.headers['access-control-allow-origin']).toBe(CAPACITOR_ORIGIN_HTTPS);
    expect(res.headers['access-control-allow-methods']).toMatch(/OPTIONS/);
  });

  test('/assets/* from staging origin returns 404 not 500 (no CORS block)', async () => {
    const freshApp = loadFreshApp();
    const res = await request(freshApp)
      .get('/assets/nonexistent.js')
      .set('Origin', ORIGIN_B);
    // Must not be blocked by CORS (which would produce a 500 with JSON body).
    expect(res.status).not.toBe(500);
    expect(res.headers['content-type']).not.toMatch(/json/);
    // Static file not found → 404, and CORS header must be present.
    expect(res.status).toBe(404);
    expect(res.headers['access-control-allow-origin']).toBe(ORIGIN_B);
  });
});

// ── Asset serving (Vite build) ────────────────────────────────────────────────

describe('GET /assets/nonexistent.css', () => {
    test('returns 404 (not JSON, not index.html) for missing Vite assets', async () => {
        const res = await request(app).get('/assets/nonexistent.css');
        expect(res.status).toBe(404);
        // Must not be served as JSON (would cause browser MIME rejection).
        expect(res.headers['content-type']).not.toMatch(/json/);
        // Must not be served as HTML (would cause browser MIME rejection).
        expect(res.headers['content-type']).not.toMatch(/html/);
    });
});

describe('GET /assets/nonexistent.js', () => {
    test('returns 404 (not JSON, not index.html) for missing Vite JS assets', async () => {
        const res = await request(app).get('/assets/nonexistent.js');
        expect(res.status).toBe(404);
        expect(res.headers['content-type']).not.toMatch(/json/);
        expect(res.headers['content-type']).not.toMatch(/html/);
    });
});

describe('GET /config', () => {
    test('returns JSON with expected keys (no regression from asset-serving changes)', async () => {
        const res = await request(app).get('/config');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toMatch(/json/);
        expect(res.body).toHaveProperty('auth0Domain');
        expect(res.body).toHaveProperty('auth0ClientId');
    });

    const AUTH0_ENV_KEYS = [
      'AUTH0_CLIENT_ID',
      'AUTH0_CLIENT_ID_NATIVE',
      'AUTH0_CLIENT_ID_PRODUCTION',
    ];
    const originalAuth0Env = {};

    function requireFreshApp() {
      jest.resetModules();
      return require('../backend/server');
    }

    beforeAll(() => {
      AUTH0_ENV_KEYS.forEach((key) => {
        originalAuth0Env[key] = process.env[key];
      });
    });

    afterEach(() => {
      AUTH0_ENV_KEYS.forEach((key) => {
        if (originalAuth0Env[key] === undefined) delete process.env[key];
        else process.env[key] = originalAuth0Env[key];
      });
      jest.resetModules();
    });

    test('returns native client id when clientType=native', async () => {
      process.env.AUTH0_CLIENT_ID_NATIVE = 'native-client-id';
      const freshApp = requireFreshApp();

      const res = await request(freshApp).get('/config?clientType=native');

      expect(res.status).toBe(200);
      expect(res.body.auth0ClientId).toBe('native-client-id');
    });

    test('returns native client id when User-Agent contains Capacitor', async () => {
      process.env.AUTH0_CLIENT_ID_NATIVE = 'native-client-id';
      const freshApp = requireFreshApp();

      const res = await request(freshApp)
        .get('/config')
        .set('User-Agent', 'Capacitor Android');

      expect(res.status).toBe(200);
      expect(res.body.auth0ClientId).toBe('native-client-id');
    });

    test('returns AUTH0_CLIENT_ID fallback for web requests when production ID is not set', async () => {
      process.env.AUTH0_CLIENT_ID = 'legacy-client-id';
      delete process.env.AUTH0_CLIENT_ID_PRODUCTION;
      const freshApp = requireFreshApp();

      const fallbackRes = await request(freshApp).get('/config');
      expect(fallbackRes.status).toBe(200);
      expect(fallbackRes.body.auth0ClientId).toBe('legacy-client-id');
    });

    test('returns production client id for web requests when AUTH0_CLIENT_ID_PRODUCTION is set', async () => {
      process.env.AUTH0_CLIENT_ID = 'legacy-client-id';
      process.env.AUTH0_CLIENT_ID_PRODUCTION = 'web-client-id';
      const freshAppWithProductionId = requireFreshApp();
      const productionRes = await request(freshAppWithProductionId).get('/config');

      expect(productionRes.status).toBe(200);
      expect(productionRes.body.auth0ClientId).toBe('web-client-id');
    });
});

// ── Affiliate routes ──────────────────────────────────────────────────────────

describe('GET /api/affiliates/dashboard', () => {
    const User = require('../backend/models/User');

    test('returns 401 without a token', async () => {
        const res = await request(app).get('/api/affiliates/dashboard');
        expect(res.status).toBe(401);
    });

    test('returns 200 with affiliate data for authenticated user', async () => {
        User.findById.mockResolvedValue(mockUser);
        User.countDocuments.mockResolvedValue(3);
        const res = await request(app)
            .get('/api/affiliates/dashboard')
            .set('Authorization', `Bearer ${authToken()}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('affiliateCode');
        expect(res.body).toHaveProperty('referralCount');
    });
});
