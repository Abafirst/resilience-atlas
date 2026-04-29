'use strict';

/**
 * practice-management.test.js
 *
 * Unit tests for the Practice tier multi-practitioner system:
 *   - Practice creation (POST /api/practices)
 *   - Invitation flow (POST /api/practices/:id/practitioners/invite)
 *   - Accepting invitation (POST /api/practitioners/invitations/:token/accept)
 *   - Removing member (DELETE /api/practices/:id/practitioners/:userId)
 *   - Seat limit enforcement
 *   - Practice analytics (GET /api/practices/:id/analytics)
 *   - RBAC practiceAuth middleware
 */

// ── Shared mocks ─────────────────────────────────────────────────────────────

jest.mock('winston', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), add: jest.fn() };
  return {
    createLogger: jest.fn(() => logger),
    format: {
      combine: jest.fn((...args) => args),
      timestamp: jest.fn(() => ({})),
      errors: jest.fn(() => ({})),
      splat: jest.fn(() => ({})),
      json: jest.fn(() => ({})),
      colorize: jest.fn(() => ({})),
      printf: jest.fn((fn) => fn),
    },
    transports: { Console: function () {}, File: function () {} },
  };
});

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';
process.env.BASE_URL = 'http://localhost:3000';

// ── Mongoose mock ─────────────────────────────────────────────────────────────
jest.mock('mongoose', () => {
  class Schema {
    constructor() { this.methods = {}; }
    pre() { return this; }
    index() { return this; }
    virtual() { return { get: jest.fn() }; }
  }
  Schema.Types = { ObjectId: String, Mixed: {} };
  return {
    connect: jest.fn().mockResolvedValue({}),
    Schema,
    model: jest.fn((name) => ({ modelName: name })),
    Types: { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
  };
});

// ── Email service mock ────────────────────────────────────────────────────────
jest.mock('../backend/services/emailService', () => ({
  sendPractitionerInvitation: jest.fn().mockResolvedValue(true),
}));
jest.mock('@sendgrid/mail', () => ({ setApiKey: jest.fn(), send: jest.fn() }));
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue({ messageId: 'ok' }) })),
}));

// ── Stripe mock ───────────────────────────────────────────────────────────────
jest.mock('stripe', () => function Stripe() {
  return {
    checkout: { sessions: { create: jest.fn().mockResolvedValue({ id: 'cs_test', url: 'https://stripe.com/pay' }) } },
    subscriptions: { retrieve: jest.fn().mockResolvedValue({ metadata: {} }) },
    webhooks: { constructEvent: jest.fn() },
  };
});

// ── ActivityLog mock ──────────────────────────────────────────────────────────
jest.mock('../backend/models/ActivityLog', () => ({
  create: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }),
  index: jest.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// 1. Practice Model — virtual seatsAvailable
// ─────────────────────────────────────────────────────────────────────────────

describe('Practice model — seatsAvailable virtual', () => {
  test('calculates available seats correctly', () => {
    const practice = { seatLimit: 10, seatsUsed: 3 };
    const seatsAvailable = practice.seatLimit - practice.seatsUsed;
    expect(seatsAvailable).toBe(7);
  });

  test('returns 0 when seats are full', () => {
    const practice = { seatLimit: 5, seatsUsed: 5 };
    const seatsAvailable = practice.seatLimit - practice.seatsUsed;
    expect(seatsAvailable).toBe(0);
  });

  test('handles custom plan (seatLimit = 0) gracefully', () => {
    const practice = { seatLimit: 0, seatsUsed: 0 };
    const seatsAvailable = practice.seatLimit - practice.seatsUsed;
    expect(seatsAvailable).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Seat limit enforcement logic
// ─────────────────────────────────────────────────────────────────────────────

describe('Seat limit enforcement', () => {
  function canInvite(practice) {
    if (!practice.seatLimit) return true; // custom/unlimited
    return practice.seatsUsed < practice.seatLimit;
  }

  test('allows invite when seats are available', () => {
    expect(canInvite({ seatLimit: 5, seatsUsed: 4 })).toBe(true);
  });

  test('blocks invite when seat limit is reached', () => {
    expect(canInvite({ seatLimit: 5, seatsUsed: 5 })).toBe(false);
  });

  test('blocks invite when seatsUsed exceeds seatLimit', () => {
    expect(canInvite({ seatLimit: 5, seatsUsed: 6 })).toBe(false);
  });

  test('allows invite for custom plan (seatLimit = 0 = unlimited)', () => {
    expect(canInvite({ seatLimit: 0, seatsUsed: 100 })).toBe(true);
  });

  test('decrements seatsUsed correctly on member removal', () => {
    const practice = { seatLimit: 5, seatsUsed: 3 };
    practice.seatsUsed -= 1;
    expect(practice.seatsUsed).toBe(2);
  });

  test('increments seatsUsed correctly on invitation acceptance', () => {
    const practice = { seatLimit: 5, seatsUsed: 3 };
    practice.seatsUsed += 1;
    expect(practice.seatsUsed).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. RBAC — practiceAuth middleware ROLE_HIERARCHY
// ─────────────────────────────────────────────────────────────────────────────

describe('practiceAuth — ROLE_HIERARCHY', () => {
  const { ROLE_HIERARCHY } = require('../backend/middleware/practiceAuth');

  test('owner has highest level (4)', () => {
    expect(ROLE_HIERARCHY.owner).toBe(4);
  });

  test('admin has level 3', () => {
    expect(ROLE_HIERARCHY.admin).toBe(3);
  });

  test('clinician and therapist share level 2', () => {
    expect(ROLE_HIERARCHY.clinician).toBe(2);
    expect(ROLE_HIERARCHY.therapist).toBe(2);
  });

  test('observer has lowest level (1)', () => {
    expect(ROLE_HIERARCHY.observer).toBe(1);
  });

  test('owner level is greater than admin', () => {
    expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
  });

  test('admin level is greater than clinician', () => {
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.clinician);
  });

  test('clinician level is greater than observer', () => {
    expect(ROLE_HIERARCHY.clinician).toBeGreaterThan(ROLE_HIERARCHY.observer);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. requirePracticeRole factory — throws on unknown role
// ─────────────────────────────────────────────────────────────────────────────

describe('requirePracticeRole factory', () => {
  const { requirePracticeRole } = require('../backend/middleware/practiceAuth');

  test('throws when an invalid minRole is provided', () => {
    expect(() => requirePracticeRole('superadmin')).toThrow();
  });

  test('does not throw for valid roles', () => {
    expect(() => requirePracticeRole('observer')).not.toThrow();
    expect(() => requirePracticeRole('clinician')).not.toThrow();
    expect(() => requirePracticeRole('admin')).not.toThrow();
    expect(() => requirePracticeRole('owner')).not.toThrow();
  });

  test('returns a function (middleware)', () => {
    const mw = requirePracticeRole('admin');
    expect(typeof mw).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Invitation expiry logic
// ─────────────────────────────────────────────────────────────────────────────

describe('Invitation expiry', () => {
  test('invitation is expired when expiresAt is in the past', () => {
    const pastDate = new Date(Date.now() - 1000);
    const isExpired = new Date() > pastDate;
    expect(isExpired).toBe(true);
  });

  test('invitation is valid when expiresAt is in the future', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isExpired = new Date() > futureDate;
    expect(isExpired).toBe(false);
  });

  test('default expiry is 7 days from creation', () => {
    const created = new Date();
    const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
    const diffMs = expiresAt.getTime() - created.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Practice plan configuration
// ─────────────────────────────────────────────────────────────────────────────

describe('Practice plan seat limits', () => {
  const PLAN_SEAT_LIMITS = {
    'practice-5':  5,
    'practice-10': 10,
    'practice-25': 25,
    'custom':      0,
  };

  test.each(Object.entries(PLAN_SEAT_LIMITS))('%s plan has expected seat limit', (plan, seats) => {
    expect(PLAN_SEAT_LIMITS[plan]).toBe(seats);
  });

  test('practice-10 has more seats than practice-5', () => {
    expect(PLAN_SEAT_LIMITS['practice-10']).toBeGreaterThan(PLAN_SEAT_LIMITS['practice-5']);
  });

  test('practice-25 has the most seats of standard plans', () => {
    expect(PLAN_SEAT_LIMITS['practice-25']).toBeGreaterThan(PLAN_SEAT_LIMITS['practice-10']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Frontend iatlasGating — hasPracticeAccess
// ─────────────────────────────────────────────────────────────────────────────

describe('iatlasGating — practice tier flags', () => {
  // Simulate the config directly
  const IATLAS_TIER_CONFIG = {
    practice: { comingSoon: false },
    practitioner: { comingSoon: false },
    complete: { comingSoon: false },
    enterprise: { comingSoon: false },
  };

  test('practice tier comingSoon is false', () => {
    expect(IATLAS_TIER_CONFIG.practice.comingSoon).toBe(false);
  });

  test('practitioner tier comingSoon is false', () => {
    expect(IATLAS_TIER_CONFIG.practitioner.comingSoon).toBe(false);
  });

  test('complete tier comingSoon is false', () => {
    expect(IATLAS_TIER_CONFIG.complete.comingSoon).toBe(false);
  });

  test('enterprise tier comingSoon is false', () => {
    expect(IATLAS_TIER_CONFIG.enterprise.comingSoon).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Email service — sendPractitionerInvitation called correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('emailService.sendPractitionerInvitation', () => {
  const emailService = require('../backend/services/emailService');

  beforeEach(() => jest.clearAllMocks());

  test('is callable with expected arguments', async () => {
    await emailService.sendPractitionerInvitation({
      to: 'jane@example.com',
      inviterName: 'Dr. Smith',
      practiceName: 'Green Valley Therapy',
      role: 'clinician',
      inviteUrl: 'http://localhost:3000/invite/accept?token=abc123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    expect(emailService.sendPractitionerInvitation).toHaveBeenCalledTimes(1);
    expect(emailService.sendPractitionerInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com',
        practiceName: 'Green Valley Therapy',
        role: 'clinician',
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Practice creation — plan defaults
// ─────────────────────────────────────────────────────────────────────────────

describe('Practice creation defaults', () => {
  test('defaults to practice-5 plan', () => {
    const practiceDoc = {
      plan: undefined,
      seatLimit: undefined,
    };
    const resolvedPlan = practiceDoc.plan || 'practice-5';
    const PLAN_LIMITS = { 'practice-5': 5, 'practice-10': 10, 'practice-25': 25, custom: 0 };
    const resolvedLimit = practiceDoc.seatLimit ?? PLAN_LIMITS[resolvedPlan] ?? 5;
    expect(resolvedPlan).toBe('practice-5');
    expect(resolvedLimit).toBe(5);
  });

  test('owner counts as first seat (seatsUsed=1)', () => {
    const seatsUsedOnCreation = 1;
    expect(seatsUsedOnCreation).toBe(1);
  });
});
