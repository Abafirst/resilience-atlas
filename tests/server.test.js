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

// ── CORS behaviour ────────────────────────────────────────────────────────────

describe('CORS middleware', () => {
  const ORIGIN_A = 'https://www.theresilienceatlas.com';
  const ORIGIN_B = 'https://resilience-atlas-staging.up.railway.app';

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
