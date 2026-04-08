'use strict';

/**
 * emailService.test.js — Unit tests for the email service and HTML templates.
 *
 * Nodemailer's transporter is mocked so no real emails are sent.
 */

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

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const emailService = require('../backend/services/emailService');

const {
  buildAssessmentResultsEmail,
} = require('../backend/templates/emails/assessmentResults');
const { buildReportReadyEmail }     = require('../backend/templates/emails/reportReady');
const { buildWelcomeEmail }         = require('../backend/templates/emails/welcome');
const { buildCongratulationsEmail } = require('../backend/templates/emails/congratulations');
const { buildReminderEmail }        = require('../backend/templates/emails/reminder');
const { buildStreakMilestoneEmail } = require('../backend/templates/emails/streakMilestone');
const { buildTeamInvitationEmail }  = require('../backend/templates/emails/teamInvitation');
const { buildGrowthMilestoneEmail } = require('../backend/templates/emails/growthMilestone');

/* ────────────────────────────────────────────────────────────────────────── */
/* Template builder tests                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

describe('Email templates — buildAssessmentResultsEmail', () => {
  const vars = {
    firstName: 'Alice',
    overallScore: 78,
    dominantDimension: 'Emotional',
    scores: { emotional: 85, mental: 72, physical: 68, social: 80, spiritual: 75, financial: 60 },
    topInsight: 'You handle adversity with remarkable emotional awareness.',
    reportLink: 'https://example.com/report',
    retakeLink: 'https://example.com/quiz',
  };

  it('returns subject, html and text', () => {
    const result = buildAssessmentResultsEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('includes the overall score in subject', () => {
    const { subject } = buildAssessmentResultsEmail(vars);
    expect(subject).toContain('78%');
  });

  it('includes the first name in html', () => {
    const { html } = buildAssessmentResultsEmail(vars);
    expect(html).toContain('Alice');
  });

  it('includes all dimension scores in html', () => {
    const { html } = buildAssessmentResultsEmail(vars);
    expect(html).toContain('Emotional');
    expect(html).toContain('Mental');
    expect(html).toContain('Physical');
  });

  it('includes the top insight', () => {
    const { html } = buildAssessmentResultsEmail(vars);
    expect(html).toContain('remarkable emotional awareness');
  });

  it('includes CTAs', () => {
    const { html } = buildAssessmentResultsEmail(vars);
    expect(html).toContain('https://example.com/report');
    expect(html).toContain('https://example.com/quiz');
  });

  it('renders with all defaults when no vars are provided', () => {
    const { html, subject, text } = buildAssessmentResultsEmail({});
    expect(html.length).toBeGreaterThan(100);
    expect(subject).toBeTruthy();
    expect(text).toBeTruthy();
  });

  it('has an unsubscribe link in footer', () => {
    const { html } = buildAssessmentResultsEmail(vars);
    expect(html).toContain('Unsubscribe');
  });

  it('handles SPA object scores ({ percentage: number }) without NaN', () => {
    const spaVars = {
      ...vars,
      scores: {
        'Agentic-Generative':    { percentage: 78 },
        'Emotional-Adaptive':    { percentage: 77 },
        'Relational-Connective': { percentage: 73 },
        'Spiritual-Reflective':  { percentage: 73 },
        'Cognitive-Narrative':   { percentage: 68 },
        'Somatic-Regulative':    { percentage: 67 },
      },
    };
    const { html, text } = buildAssessmentResultsEmail(spaVars);
    expect(html).not.toContain('NaN');
    expect(text).not.toContain('NaN');
    expect(html).toContain('78%');
    expect(text).toContain('78%');
  });

  it('defaults to 0% for invalid/missing score values', () => {
    const badVars = {
      ...vars,
      scores: { emotional: null, mental: undefined, physical: 'bad' },
    };
    const { html, text } = buildAssessmentResultsEmail(badVars);
    expect(html).not.toContain('NaN');
    expect(text).not.toContain('NaN');
  });
});

describe('Email templates — buildReportReadyEmail', () => {
  const vars = {
    firstName:    'Bob',
    downloadLink: 'https://example.com/dl',
    reportLink:   'https://example.com/report',
    expiryDays:   7,
    keyFindings:  ['High emotional resilience', 'Growth opportunity in Financial'],
    isFreeTier:   true,
    upgradeLink:  'https://example.com/upgrade',
    shareLink:    'https://example.com/share',
  };

  it('returns subject, html and text', () => {
    const result = buildReportReadyEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('subject contains first name', () => {
    const { subject } = buildReportReadyEmail(vars);
    expect(subject).toContain('Bob');
  });

  it('includes download link in html', () => {
    const { html } = buildReportReadyEmail(vars);
    expect(html).toContain('https://example.com/dl');
  });

  it('shows expiry days', () => {
    const { html } = buildReportReadyEmail(vars);
    expect(html).toContain('7 day');
  });

  it('includes key findings', () => {
    const { html } = buildReportReadyEmail(vars);
    expect(html).toContain('High emotional resilience');
  });

  it('shows upgrade block for free tier users', () => {
    const { html } = buildReportReadyEmail({ ...vars, isFreeTier: true });
    expect(html).toContain('Upgrade to Premium');
  });

  it('does not show upgrade block for premium users', () => {
    const { html } = buildReportReadyEmail({ ...vars, isFreeTier: false });
    expect(html).not.toContain('Upgrade to Premium');
  });

  it('includes social share buttons', () => {
    const { html } = buildReportReadyEmail(vars);
    expect(html).toContain('twitter.com');
    expect(html).toContain('linkedin.com');
  });
});

describe('Email templates — buildWelcomeEmail', () => {
  const vars = {
    firstName:     'Carol',
    startQuizLink: 'https://example.com/quiz',
    resourcesLink: 'https://example.com/resources',
  };

  it('returns subject, html and text', () => {
    const result = buildWelcomeEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('subject contains first name', () => {
    expect(buildWelcomeEmail(vars).subject).toContain('Carol');
  });

  it('mentions Janeen Molchany', () => {
    expect(buildWelcomeEmail(vars).html).toContain('Janeen Molchany');
  });

  it('includes estimated time', () => {
    expect(buildWelcomeEmail(vars).html).toContain('12');
  });

  it('has a start quiz CTA', () => {
    expect(buildWelcomeEmail(vars).html).toContain('https://example.com/quiz');
  });

  it('includes FAQ section', () => {
    expect(buildWelcomeEmail(vars).html).toContain('Frequently Asked Questions');
  });
});

describe('Email templates — buildCongratulationsEmail', () => {
  const vars = {
    firstName:         'Dave',
    overallScore:      82,
    dominantDimension: 'Mental',
    primaryStrength:   'Analytical thinking under pressure.',
    reportLink:        'https://example.com/report',
    upgradeLink:       'https://example.com/upgrade',
    nextSteps:         ['Review your full report', 'Try a micro-practice today'],
    shareLink:         'https://example.com/share',
  };

  it('returns subject, html and text', () => {
    const result = buildCongratulationsEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('subject contains first name', () => {
    expect(buildCongratulationsEmail(vars).subject).toContain('Dave');
  });

  it('shows overall score', () => {
    expect(buildCongratulationsEmail(vars).html).toContain('82%');
  });

  it('shows primary strength', () => {
    expect(buildCongratulationsEmail(vars).html).toContain('Analytical thinking under pressure');
  });

  it('shows what\'s next steps', () => {
    const { html } = buildCongratulationsEmail(vars);
    expect(html).toContain('Review your full report');
    expect(html).toContain('Try a micro-practice today');
  });
});

describe('Email templates — buildReminderEmail', () => {
  const vars = {
    firstName:     'Eve',
    previousScore: 65,
    previousDate:  'September 10, 2025',
    growthAreas:   ['Financial', 'Social'],
    retakeLink:    'https://example.com/quiz',
    specialOffer:  '20% off Atlas Premium',
    offerLink:     'https://example.com/upgrade',
    daysSince:     93,
  };

  it('returns subject, html and text', () => {
    const result = buildReminderEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('subject contains first name', () => {
    expect(buildReminderEmail(vars).subject).toContain('Eve');
  });

  it('shows days since last assessment', () => {
    expect(buildReminderEmail(vars).html).toContain('93 days');
  });

  it('shows previous score', () => {
    expect(buildReminderEmail(vars).html).toContain('65%');
  });

  it('shows growth areas', () => {
    const { html } = buildReminderEmail(vars);
    expect(html).toContain('Financial');
    expect(html).toContain('Social');
  });

  it('shows special offer when provided', () => {
    expect(buildReminderEmail(vars).html).toContain('20% off Atlas Premium');
  });

  it('omits special offer when not provided', () => {
    const { html } = buildReminderEmail({ ...vars, specialOffer: '' });
    expect(html).not.toContain('Special Offer');
  });
});

describe('Email templates — buildStreakMilestoneEmail', () => {
  it('returns subject, html and text', () => {
    const result = buildStreakMilestoneEmail({ firstName: 'Frank', streakDays: 7 });
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it.each([7, 30, 100])('shows correct badge for %d-day streak', (days) => {
    const { html } = buildStreakMilestoneEmail({ streakDays: days });
    expect(html).toContain(`${days}`);
  });

  it('includes impact statement when provided', () => {
    const { html } = buildStreakMilestoneEmail({
      streakDays: 30,
      impactStatement: 'You strengthened Emotional resilience by 12%.',
    });
    expect(html).toContain('You strengthened Emotional resilience by 12%');
  });

  it('shows next practice block when provided', () => {
    const { html } = buildStreakMilestoneEmail({
      streakDays: 7,
      nextPractice: 'Gratitude Journaling',
      nextPracticeLink: 'https://example.com/practice',
    });
    expect(html).toContain('Gratitude Journaling');
  });
});

describe('Email templates — buildTeamInvitationEmail', () => {
  const vars = {
    inviteeName:      'Grace',
    organizationName: 'Acme Corp',
    inviterName:      'Henry',
    invitationLink:   'https://example.com/join?token=abc123',
    teamContext:      'We are building a resilient engineering team.',
    expiryDays:       7,
  };

  it('returns subject, html and text', () => {
    const result = buildTeamInvitationEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('subject contains organization name', () => {
    expect(buildTeamInvitationEmail(vars).subject).toContain('Acme Corp');
  });

  it('shows invitee name', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('Grace');
  });

  it('shows organisation name', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('Acme Corp');
  });

  it('shows inviter name', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('Henry');
  });

  it('includes accept invitation link', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('https://example.com/join?token=abc123');
  });

  it('shows team context when provided', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('resilient engineering team');
  });

  it('includes FAQ section', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('FAQ About Team Assessments');
  });

  it('shows expiry notice', () => {
    expect(buildTeamInvitationEmail(vars).html).toContain('7 day');
  });
});

describe('Email templates — buildGrowthMilestoneEmail', () => {
  const vars = {
    firstName:         'Irene',
    dimension:         'Emotional',
    previousScore:     55,
    currentScore:      72,
    growthPercentage:  17,
    whatHelped:        'Daily journaling and mindfulness practice.',
    nextOpportunity:   'Financial',
    nextOpportunityScore: 48,
    reportLink:        'https://example.com/report',
  };

  it('returns subject, html and text', () => {
    const result = buildGrowthMilestoneEmail(vars);
    expect(result).toHaveProperty('subject');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('text');
  });

  it('subject contains dimension and first name', () => {
    const { subject } = buildGrowthMilestoneEmail(vars);
    expect(subject).toContain('Emotional');
    expect(subject).toContain('Irene');
  });

  it('shows before and after scores', () => {
    const { html } = buildGrowthMilestoneEmail(vars);
    expect(html).toContain('55%');
    expect(html).toContain('72%');
  });

  it('shows what helped block', () => {
    expect(buildGrowthMilestoneEmail(vars).html).toContain('journaling and mindfulness');
  });

  it('shows next opportunity', () => {
    expect(buildGrowthMilestoneEmail(vars).html).toContain('Financial');
  });

  it('includes report link', () => {
    expect(buildGrowthMilestoneEmail(vars).html).toContain('https://example.com/report');
  });
});

/* ────────────────────────────────────────────────────────────────────────── */
/* emailService send-function tests                                            */
/* ────────────────────────────────────────────────────────────────────────── */

describe('emailService — send functions', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
  });

  it('sendQuizReport calls sendMail once', async () => {
    await emailService.sendQuizReport('user@example.com', 'Alice', {
      overall: 75,
      dominantType: 'Emotional',
      categories: { emotional: 85, mental: 70 },
      summary: 'Great resilience.',
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.to).toBe('user@example.com');
    expect(opts.html).toContain('Alice');
    expect(opts.text).toBeTruthy();
  });

  it('sendAssessmentResults calls sendMail once', async () => {
    await emailService.sendAssessmentResults('user@example.com', {
      firstName: 'Bob',
      overallScore: 80,
      scores: { emotional: 80 },
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendInviteEmail calls sendMail once (legacy path)', async () => {
    await emailService.sendInviteEmail('user@example.com', 'Acme Corp', 'https://example.com/join');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.to).toBe('user@example.com');
    expect(opts.html).toContain('Acme Corp');
    expect(opts.html).toContain('https://example.com/join');
  });

  it('sendInvitationReminder calls sendMail once', async () => {
    await emailService.sendInvitationReminder({
      to:            'user@example.com',
      orgName:       'Acme Corp',
      teamName:      'Engineering',
      assessmentUrl: 'https://example.com/quiz',
      reminderNumber: 2,
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.html).toContain('Acme Corp');
    expect(opts.html).toContain('reminder #2');
  });

  it('sendWelcome calls sendMail once', async () => {
    await emailService.sendWelcome('user@example.com', { firstName: 'Carol' });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendCongratulations calls sendMail once', async () => {
    await emailService.sendCongratulations('user@example.com', {
      firstName: 'Dave', overallScore: 90,
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendReminder calls sendMail once', async () => {
    await emailService.sendReminder('user@example.com', {
      firstName: 'Eve', daysSince: 91,
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendStreakMilestone calls sendMail once', async () => {
    await emailService.sendStreakMilestone('user@example.com', {
      firstName: 'Frank', streakDays: 30,
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendTeamInvitation calls sendMail once', async () => {
    await emailService.sendTeamInvitation('user@example.com', {
      organizationName: 'Acme',
      invitationLink: 'https://example.com/join',
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendReportReady calls sendMail once', async () => {
    await emailService.sendReportReady('user@example.com', {
      firstName: 'Grace', downloadLink: 'https://example.com/dl',
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('sendGrowthMilestone calls sendMail once', async () => {
    await emailService.sendGrowthMilestone('user@example.com', {
      firstName: 'Hank', dimension: 'Mental', previousScore: 50, currentScore: 65,
    });
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('each email includes plain text fallback', async () => {
    await emailService.sendWelcome('user@example.com', { firstName: 'Ivy' });
    const opts = mockSendMail.mock.calls[0][0];
    expect(typeof opts.text).toBe('string');
    expect(opts.text.length).toBeGreaterThan(20);
  });
});

describe('emailService — capitalize utility', () => {
  it('capitalizes a lowercase word', () => {
    expect(emailService.capitalize('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(emailService.capitalize('')).toBe('');
  });

  it('handles undefined gracefully', () => {
    expect(emailService.capitalize(undefined)).toBe('');
  });
});

/* ── validatePdfBuffer ────────────────────────────────────────────────────── */

describe('emailService — validatePdfBuffer', () => {
  const { validatePdfBuffer } = emailService;

  function makePdfBuffer(size = 2048) {
    const buf = Buffer.alloc(size);
    buf.write('%PDF-1.4', 0, 'ascii');
    return buf;
  }

  it('returns true for a buffer with valid PDF magic bytes', () => {
    expect(validatePdfBuffer(makePdfBuffer())).toBe(true);
  });

  it('returns false for null', () => {
    expect(validatePdfBuffer(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(validatePdfBuffer(undefined)).toBe(false);
  });

  it('returns false for a non-Buffer value', () => {
    expect(validatePdfBuffer('not a buffer')).toBe(false);
  });

  it('returns false for a buffer that is too small (< 1024 bytes)', () => {
    const small = Buffer.alloc(512);
    small.write('%PDF-1.4', 0, 'ascii');
    expect(validatePdfBuffer(small)).toBe(false);
  });

  it('returns false when magic bytes are wrong', () => {
    const buf = makePdfBuffer();
    buf.write('NOTPDF', 0, 'ascii');
    expect(validatePdfBuffer(buf)).toBe(false);
  });
});

/* ── sendPdfReport ────────────────────────────────────────────────────────── */

describe('emailService — sendPdfReport', () => {
  beforeEach(() => mockSendMail.mockClear());

  function validPdfBuffer(size = 2048) {
    const buf = Buffer.alloc(size);
    buf.write('%PDF-1.4', 0, 'ascii');
    return buf;
  }

  it('calls sendMail with an attachment for a valid PDF buffer', async () => {
    await emailService.sendPdfReport('user@example.com', validPdfBuffer());
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const opts = mockSendMail.mock.calls[0][0];
    expect(opts.to).toBe('user@example.com');
    expect(opts.attachments).toHaveLength(1);
    expect(opts.attachments[0].contentType).toBe('application/pdf');
  });

  it('throws for a null pdfBuffer without calling sendMail', async () => {
    await expect(emailService.sendPdfReport('user@example.com', null))
      .rejects.toThrow('Invalid PDF buffer');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('throws for a too-small buffer without calling sendMail', async () => {
    const small = Buffer.alloc(100);
    small.write('%PDF-1.4', 0, 'ascii');
    await expect(emailService.sendPdfReport('user@example.com', small))
      .rejects.toThrow('Invalid PDF buffer');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('throws when sendMail rejects, propagating the underlying error', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));
    await expect(emailService.sendPdfReport('user@example.com', validPdfBuffer()))
      .rejects.toThrow('SMTP connection refused');
  });
});
