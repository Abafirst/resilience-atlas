'use strict';

/**
 * growth.test.js — Unit tests for POST /api/growth/team-lead
 *
 * Verifies that Enterprise inquiry submissions trigger an admin email
 * notification and that misconfigured environments are properly logged.
 */

// ── Mocks must be hoisted before any require ──────────────────────────────────

jest.mock('winston', () => {
  const loggerInstance = {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add:   jest.fn(),
  };
  return {
    createLogger: jest.fn(() => loggerInstance),
    format: {
      combine:   jest.fn((...args) => args),
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

const mockSendTeamEnterpriseAdminNotification = jest.fn().mockResolvedValue({ messageId: 'test-id' });

jest.mock('../backend/services/emailService', () => ({
  sendTeamEnterpriseAdminNotification: mockSendTeamEnterpriseAdminNotification,
}));

const mockLeadCreate = jest.fn().mockResolvedValue({ _id: 'lead123' });
jest.mock('../backend/models/Lead', () => ({ create: mockLeadCreate }));

const mockAnalyticsCreate = jest.fn().mockResolvedValue({});
jest.mock('../backend/models/Analytics', () => ({ create: mockAnalyticsCreate }));

// ── Test setup ────────────────────────────────────────────────────────────────

const request = require('supertest');
const express = require('express');

// Build a minimal Express app mounting only the growth router
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/growth', require('../backend/routes/growth'));
  return app;
}

const VALID_ENTERPRISE_BODY = {
  company_name:  'Acme Corp',
  contact_name:  'Jane Smith',
  email:         'jane@acmecorp.com',
  team_size:     '11-50',
  message:       'Looking for team resilience insights.',
  plan:          'enterprise',
};

beforeEach(() => {
  jest.clearAllMocks();
  // Restore ADMIN_EMAIL between tests
  delete process.env.ADMIN_EMAIL;
  delete process.env.COMPANY_EMAIL;
  delete process.env.SUPPORT_EMAIL;
  delete process.env.EMAIL_FROM;
  delete process.env.YAHOO_EMAIL;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/growth/team-lead — Enterprise inquiry email notification', () => {
  it('sends admin notification using ADMIN_EMAIL when set', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(VALID_ENTERPRISE_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockSendTeamEnterpriseAdminNotification).toHaveBeenCalledTimes(1);
    expect(mockSendTeamEnterpriseAdminNotification).toHaveBeenCalledWith(
      'admin@example.com',
      expect.objectContaining({
        contactName: 'Jane Smith',
        companyName: 'Acme Corp',
        email:       'jane@acmecorp.com',
        teamSize:    '11-50',
        message:     'Looking for team resilience insights.',
      })
    );
  });

  it('falls back to COMPANY_EMAIL when ADMIN_EMAIL is not set', async () => {
    process.env.COMPANY_EMAIL = 'company@example.com';
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(VALID_ENTERPRISE_BODY);

    expect(res.status).toBe(201);
    expect(mockSendTeamEnterpriseAdminNotification).toHaveBeenCalledWith(
      'company@example.com',
      expect.any(Object)
    );
  });

  it('falls back to SUPPORT_EMAIL when neither ADMIN_EMAIL nor COMPANY_EMAIL are set', async () => {
    process.env.SUPPORT_EMAIL = 'support@example.com';
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(VALID_ENTERPRISE_BODY);

    expect(res.status).toBe(201);
    expect(mockSendTeamEnterpriseAdminNotification).toHaveBeenCalledWith(
      'support@example.com',
      expect.any(Object)
    );
  });

  it('falls back to YAHOO_EMAIL as last resort', async () => {
    process.env.YAHOO_EMAIL = 'yahoo@example.com';
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(VALID_ENTERPRISE_BODY);

    expect(res.status).toBe(201);
    expect(mockSendTeamEnterpriseAdminNotification).toHaveBeenCalledWith(
      'yahoo@example.com',
      expect.any(Object)
    );
  });

  it('logs an error (not console.warn) when no admin email env var is configured', async () => {
    // No email env vars set
    const logger = require('../backend/utils/logger');
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(VALID_ENTERPRISE_BODY);

    expect(res.status).toBe(201);
    expect(mockSendTeamEnterpriseAdminNotification).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('no admin email is configured'),
      expect.objectContaining({ company_name: 'Acme Corp' })
    );
  });

  it('still returns 201 and saves the lead even when email sending fails', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    mockSendTeamEnterpriseAdminNotification.mockRejectedValueOnce(new Error('SMTP error'));
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(VALID_ENTERPRISE_BODY);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(mockLeadCreate).toHaveBeenCalledTimes(1);
  });

  it('does NOT send admin notification for non-enterprise plans', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    const app = buildApp();

    await request(app)
      .post('/api/growth/team-lead')
      .send({ ...VALID_ENTERPRISE_BODY, plan: 'basic' });

    await request(app)
      .post('/api/growth/team-lead')
      .send({ ...VALID_ENTERPRISE_BODY, plan: 'premium' });

    expect(mockSendTeamEnterpriseAdminNotification).not.toHaveBeenCalled();
  });

  it('defaults to enterprise when plan is omitted (backward-compat)', async () => {
    process.env.ADMIN_EMAIL = 'admin@example.com';
    const app = buildApp();
    const body = { ...VALID_ENTERPRISE_BODY };
    delete body.plan;

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send(body);

    expect(res.status).toBe(201);
    expect(mockSendTeamEnterpriseAdminNotification).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when required fields are missing', async () => {
    const app = buildApp();

    const res = await request(app)
      .post('/api/growth/team-lead')
      .send({ email: 'jane@example.com' }); // missing company_name & contact_name

    expect(res.status).toBe(400);
    expect(mockSendTeamEnterpriseAdminNotification).not.toHaveBeenCalled();
  });
});
