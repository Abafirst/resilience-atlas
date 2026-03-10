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
    test('returns 200 with welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });
});

// ── Auth routes ───────────────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
    const User = require('../backend/models/User');

    beforeEach(() => {
        User.findOne.mockResolvedValue(null); // No existing user
    });

    test('returns 400 when required fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ username: 'alice' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 409 when user already exists', async () => {
        User.findOne.mockResolvedValue(mockUser); // Existing user
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ username: 'testuser', email: 'test@example.com', password: 'secret123' });
        expect(res.status).toBe(409);
    });

    test('returns 201 with token when signup succeeds', async () => {
        User.findOne.mockResolvedValue(null);
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ username: 'newuser', email: 'new@example.com', password: 'secret123' });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
    });
});

describe('POST /api/auth/login', () => {
    const User = require('../backend/models/User');

    test('returns 400 when fields are missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'x@x.com' });
        expect(res.status).toBe(400);
    });

    test('returns 401 when user not found', async () => {
        User.findOne.mockResolvedValue(null);
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ghost@example.com', password: 'pw' });
        expect(res.status).toBe(401);
    });

    test('returns 401 when password is wrong', async () => {
        User.findOne.mockResolvedValue({ ...mockUser, comparePassword: jest.fn().mockResolvedValue(false) });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    test('returns 200 with token on successful login', async () => {
        User.findOne.mockResolvedValue({ ...mockUser, comparePassword: jest.fn().mockResolvedValue(true) });
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'correct' });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });
});

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
            .send({ answers: Array(36).fill(3) });
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
            .send({ answers: Array(36).fill(4) });
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
