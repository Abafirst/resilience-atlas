'use strict';

const request = require('supertest');

// ── Env ──────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';

// ── Mocks ────────────────────────────────────────────────────────────────────

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

jest.mock('mongoose', () => {
  class Schema {
    constructor() {}
    pre() { return this; }
    index() { return this; }
    methods = {};
  }
  Schema.Types = { ObjectId: String, Mixed: {} };

  return {
    connect: jest.fn().mockResolvedValue({}),
    Schema,
    model: jest.fn(),
  };
});

// Mock PracticeCompletion model
const mockCompletion = {
  _id: 'comp001',
  practiceId: 'cn-01',
  difficulty_level: 'beginner',
  framework_principles_engaged: ['Cognitive Defusion', 'Reframing Behavior'],
  reflectionResponse: 'I felt calmer.',
  completedAt: new Date('2026-03-10T05:00:00.000Z'),
};

jest.mock('../backend/models/PracticeCompletion', () => {
  const MockModel = {
    create: jest.fn().mockResolvedValue(mockCompletion),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([mockCompletion])
      })
    }),
    countDocuments: jest.fn().mockResolvedValue(3),
  };
  return MockModel;
});

// Mock other models used by server
jest.mock('../backend/models/User', () => {
  const mockUser = {
    _id: 'user001',
    username: 'testuser',
    email: 'test@example.com',
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
  };
  const MockUser = jest.fn().mockImplementation(() => mockUser);
  MockUser.findOne = jest.fn().mockResolvedValue(null);
  MockUser.findById = jest.fn().mockResolvedValue(mockUser);
  MockUser.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUser);
  MockUser.countDocuments = jest.fn().mockResolvedValue(0);
  return MockUser;
});

jest.mock('../backend/models/ResilienceResult', () => ({
  create: jest.fn().mockResolvedValue({}),
}));

jest.mock('stripe', () => function Stripe() {
  return {
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
    customers: { create: jest.fn() },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } }
      })
    }
  };
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  })),
}));

jest.mock('jsonwebtoken', () => {
  const real = jest.requireActual('jsonwebtoken');
  return { ...real, sign: real.sign, verify: real.verify };
});

// ── App ───────────────────────────────────────────────────────────────────────
const app = require('../backend/server');
const jwt = require('jsonwebtoken');

function authToken() {
  return jwt.sign({ id: 'user001' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/evidence-practices/complete', () => {
  const PracticeCompletion = require('../backend/models/PracticeCompletion');

  beforeEach(() => {
    PracticeCompletion.create.mockResolvedValue(mockCompletion);
  });

  test('returns 201 with valid payload (anonymous)', async () => {
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({
        practiceId: 'cn-01',
        reflectionResponse: 'This helped me.',
        difficulty_level: 'beginner',
        framework_principles_engaged: ['Cognitive Defusion', 'Reframing Behavior']
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Practice completion recorded.');
    expect(res.body).toHaveProperty('id');
  });

  test('returns 201 with valid payload (authenticated)', async () => {
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({
        practiceId: 'sb-02',
        difficulty_level: 'beginner',
        framework_principles_engaged: ['Present-Moment Awareness']
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Practice completion recorded.');
  });

  test('returns 400 when practiceId is missing', async () => {
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({ difficulty_level: 'beginner' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when practiceId is empty string', async () => {
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({ practiceId: '   ', difficulty_level: 'beginner' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when difficulty_level is invalid', async () => {
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({ practiceId: 'cn-01', difficulty_level: 'expert' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 when difficulty_level is missing', async () => {
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({ practiceId: 'cn-01' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 500 when database throws', async () => {
    PracticeCompletion.create.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({ practiceId: 'cn-01', difficulty_level: 'beginner' });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('truncates reflectionResponse to 2000 chars', async () => {
    const longText = 'a'.repeat(3000);
    const res = await request(app)
      .post('/api/evidence-practices/complete')
      .send({ practiceId: 'cn-01', difficulty_level: 'beginner', reflectionResponse: longText });
    expect(res.status).toBe(201);
    const call = PracticeCompletion.create.mock.calls.at(-1)[0];
    expect(call.reflectionResponse.length).toBe(2000);
  });

  test('all difficulty levels are accepted', async () => {
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      const res = await request(app)
        .post('/api/evidence-practices/complete')
        .send({ practiceId: 'ea-01', difficulty_level: level });
      expect(res.status).toBe(201);
    }
  });
});

describe('GET /api/evidence-practices/completions', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/evidence-practices/completions');
    expect(res.status).toBe(401);
  });

  test('returns 200 with completions for authenticated user', async () => {
    const res = await request(app)
      .get('/api/evidence-practices/completions')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('completions');
    expect(Array.isArray(res.body.completions)).toBe(true);
  });
});

describe('GET /api/evidence-practices/completions/week', () => {
  test('returns 401 without authentication', async () => {
    const res = await request(app).get('/api/evidence-practices/completions/week');
    expect(res.status).toBe(401);
  });

  test('returns 200 with count for authenticated user', async () => {
    const res = await request(app)
      .get('/api/evidence-practices/completions/week')
      .set('Authorization', `Bearer ${authToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('count');
    expect(typeof res.body.count).toBe('number');
  });
});
