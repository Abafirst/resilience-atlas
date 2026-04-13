'use strict';

/**
 * emailService.js — Centralised email sending for The Resilience Atlas™.
 *
 * All outgoing emails use the branded HTML templates in
 * backend/templates/emails/ and are sent via SendGrid (when SENDGRID_API_KEY
 * is set) or Nodemailer (Yahoo SMTP by default, but any SMTP provider works
 * by setting SMTP_* environment variables) as a fallback.
 */

const nodemailer = require('nodemailer');
const sgMail     = require('@sendgrid/mail');
const logger     = require('../utils/logger');

// Configure SendGrid when an API key is available.
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const { buildAssessmentResultsEmail } = require('../templates/emails/assessmentResults');
const { buildReportReadyEmail }        = require('../templates/emails/reportReady');
const { buildWelcomeEmail }            = require('../templates/emails/welcome');
const { buildCongratulationsEmail }    = require('../templates/emails/congratulations');
const { buildReminderEmail }           = require('../templates/emails/reminder');
const { buildStreakMilestoneEmail }    = require('../templates/emails/streakMilestone');
const { buildTeamInvitationEmail }     = require('../templates/emails/teamInvitation');
const { buildGrowthMilestoneEmail }    = require('../templates/emails/growthMilestone');
const { referralWelcome }              = require('../templates/emails/referralWelcome');
const { referralThankYou }             = require('../templates/emails/referralThankYou');
const { buildTeamPurchaseConfirmationEmail } = require('../templates/emails/teamPurchaseConfirmation');
const { buildPurchaseWelcomeEmail }          = require('../templates/emails/purchaseWelcome');
const { wrapEmail } = require('../templates/emails/base');

/* ── Transport ─────────────────────────────────────────────────────────────── */

/**
 * Build a Nodemailer transport.
 * Prefers explicit SMTP_* env vars (compatible with any provider).
 * Falls back to Yahoo credentials for backwards-compatibility.
 */
function createTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: 'yahoo',
    auth: {
      user: process.env.YAHOO_EMAIL,
      pass: process.env.YAHOO_APP_PASSWORD,
    },
  });
}

const transporter = createTransport();

/** Default sender address */
const FROM = process.env.EMAIL_FROM || process.env.YAHOO_EMAIL || 'noreply@resilience-atlas.app';

/* ── Internal helpers ──────────────────────────────────────────────────────── */

/**
 * Returns true when DISABLE_USER_EMAILS=true is set in the environment.
 * Used to suppress user-facing transactional emails in staging/testing.
 *
 * @returns {boolean}
 */
function isUserEmailsDisabled() {
  return process.env.DISABLE_USER_EMAILS === 'true';
}

/**
 * Send an email using the pre-built { subject, html, text } object returned
 * by a template builder function.
 *
 * Uses SendGrid when SENDGRID_API_KEY is set; falls back to Nodemailer.
 *
 * When DISABLE_USER_EMAILS=true, user-facing emails are suppressed.
 * Pass { isAdmin: true } to bypass the flag for admin/operational emails.
 *
 * @param {string}  to         Recipient address
 * @param {{ subject: string, html: string, text: string }} emailObj
 * @param {{ isAdmin?: boolean }} [opts]
 * @returns {Promise<Object>}  SendGrid response, Nodemailer info, or skip marker
 */
async function _send(to, emailObj, { isAdmin = false } = {}) {
  if (!isAdmin && isUserEmailsDisabled()) {
    logger.warn(`[emailService] User email suppressed (DISABLE_USER_EMAILS=true): subject="${emailObj.subject}"`);
    return { skipped: true, reason: 'DISABLE_USER_EMAILS' };
  }

  if (process.env.SENDGRID_API_KEY) {
    const msg = {
      to,
      from:    FROM,
      subject: emailObj.subject,
      html:    emailObj.html,
      text:    emailObj.text,
    };
    try {
      const [response] = await sgMail.send(msg);
      logger.info(`[emailService] Email "${emailObj.subject}" sent to ${to} via SendGrid — statusCode: ${response.statusCode}`);
      return response;
    } catch (err) {
      logger.error(`[emailService] SendGrid send failed for "${emailObj.subject}" to ${to}: ${err.message}`, { stack: err.stack });
      throw err;
    }
  }

  // Fallback: Nodemailer
  const mailOptions = {
    from:    FROM,
    to,
    subject: emailObj.subject,
    html:    emailObj.html,
    text:    emailObj.text,
  };
  const info = await transporter.sendMail(mailOptions);
  logger.info(`[emailService] Email "${emailObj.subject}" sent to ${to} — messageId: ${info.messageId}`);
  return info;
}

/* ── Utility ───────────────────────────────────────────────────────────────── */

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

/* ── Public API ─────────────────────────────────────────────────────────────── */

/**
 * Send the assessment results email after a user completes the quiz.
 *
 * @param {string} to
 * @param {Object} vars  See assessmentResults.js for full variable list
 */
async function sendAssessmentResults(to, vars) {
  const emailObj = buildAssessmentResultsEmail(vars);
  return _send(to, emailObj);
}

/**
 * Legacy alias kept for backwards-compatibility with existing quiz route.
 * Internally delegates to sendAssessmentResults.
 *
 * @param {string} to
 * @param {string} name
 * @param {Object} report  { overall, dominantType, categories, summary, assessmentHash? }
 */
async function sendQuizReport(to, name, report) {
  const scores  = report.categories || {};
  const appUrl  = process.env.APP_URL || 'https://resilience-atlas.app';

  // Build a hash-based deep link when the caller supplies an assessment hash.
  // The link routes through /login so unauthenticated users are prompted to
  // sign in before being redirected to their specific results.
  let reportLink;
  if (report.assessmentHash) {
    const returnTo = `/results?hash=${encodeURIComponent(report.assessmentHash)}`;
    reportLink = `${appUrl}/login?returnTo=${encodeURIComponent(returnTo)}`;
  } else {
    reportLink = `${appUrl}/results`;
  }

  const vars = {
    firstName:         name,
    overallScore:      report.overall,
    dominantDimension: report.dominantType,
    scores,
    topInsight:        report.summary,
    reportLink,
    retakeLink:        `${appUrl}/quiz`,
  };
  return sendAssessmentResults(to, vars);
}

/**
 * Send the "report ready" email when a PDF is available for download.
 *
 * @param {string} to
 * @param {Object} vars  See reportReady.js for full variable list
 */
async function sendReportReady(to, vars) {
  const emailObj = buildReportReadyEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a welcome email to a first-time user.
 *
 * @param {string} to
 * @param {Object} vars  See welcome.js for full variable list
 */
async function sendWelcome(to, vars) {
  const emailObj = buildWelcomeEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a congratulations email after assessment completion.
 *
 * @param {string} to
 * @param {Object} vars  See congratulations.js for full variable list
 */
async function sendCongratulations(to, vars) {
  const emailObj = buildCongratulationsEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a 90-day reassessment reminder email.
 *
 * @param {string} to
 * @param {Object} vars  See reminder.js for full variable list
 */
async function sendReminder(to, vars) {
  const emailObj = buildReminderEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a streak milestone celebration email (7, 30, 100 days).
 *
 * @param {string} to
 * @param {Object} vars  See streakMilestone.js for full variable list
 */
async function sendStreakMilestone(to, vars) {
  const emailObj = buildStreakMilestoneEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a team invitation email.
 *
 * @param {string} to
 * @param {Object} vars  See teamInvitation.js for full variable list
 *   OR backwards-compatible: provide { orgName, joinLink } to mimic sendInviteEmail
 */
async function sendTeamInvitation(to, vars) {
  const emailObj = buildTeamInvitationEmail({
    inviteeName:      vars.inviteeName,
    organizationName: vars.organizationName || vars.orgName,
    inviterName:      vars.inviterName,
    invitationLink:   vars.invitationLink   || vars.joinLink,
    teamContext:      vars.teamContext,
    expiryDays:       vars.expiryDays,
    unsubscribeUrl:   vars.unsubscribeUrl,
  });
  return _send(to, emailObj);
}

/**
 * Legacy alias kept for backwards-compatibility with existing organization routes.
 *
 * @param {string} to
 * @param {string} orgName
 * @param {string} joinLink
 */
async function sendInviteEmail(to, orgName, joinLink) {
  return sendTeamInvitation(to, { orgName, joinLink });
}

/**
 * Send an invitation reminder email (used by reminder-email-job.js).
 *
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.orgName
 * @param {string} opts.teamName
 * @param {string} opts.assessmentUrl
 * @param {number} opts.reminderNumber
 */
async function sendInvitationReminder({ to, orgName, teamName, assessmentUrl, reminderNumber = 1 }) {
  const vars = {
    inviteeName:      '',
    organizationName: orgName,
    invitationLink:   assessmentUrl,
    teamContext:      teamName
      ? `This is reminder #${reminderNumber} for joining the <strong>${teamName}</strong> assessment.`
      : `This is reminder #${reminderNumber} to complete the team assessment.`,
    expiryDays:       7,
  };
  return sendTeamInvitation(to, vars);
}

/**
 * Send a growth milestone email when a user improves in a dimension.
 *
 * @param {string} to
 * @param {Object} vars  See growthMilestone.js for full variable list
 */
async function sendGrowthMilestone(to, vars) {
  const emailObj = buildGrowthMilestoneEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a welcome email to a newly referred user.
 *
 * @param {string} to
 * @param {Object} vars  { name, referrerName, discountPct, ctaUrl }
 */
async function sendReferralWelcome(to, vars) {
  const emailObj = referralWelcome(vars);
  return _send(to, emailObj);
}

/**
 * Send a thank-you email to the referrer when their friend joins.
 *
 * @param {string} to
 * @param {Object} vars  { name, friendName, creditAmount, totalCredits, dashboardUrl, badge }
 */
async function sendReferralThankYou(to, vars) {
  const emailObj = referralThankYou(vars);
  return _send(to, emailObj);
}

/**
 * Validate that a buffer contains a well-formed PDF document.
 *
 * Checks for the `%PDF-1` magic-byte header that every compliant PDF must
 * start with.  Returns `false` for null / empty buffers as well.
 *
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function validatePdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 1024) {
    return false;
  }
  // PDF magic bytes: "%PDF-1" (hex 25 50 44 46 2D 31)
  return buffer.slice(0, 6).toString('ascii') === '%PDF-1';
}

/**
 * Send a PDF report as an email attachment.
 *
 * @param {string} to         Recipient email address
 * @param {Buffer} pdfBuffer  PDF file content
 * @returns {Promise<Object>} Nodemailer info object
 */
async function sendPdfReport(to, pdfBuffer) {
  if (!validatePdfBuffer(pdfBuffer)) {
    const detail = !pdfBuffer
      ? 'pdfBuffer is null/undefined'
      : `buffer length ${pdfBuffer.length}, header "${pdfBuffer.slice(0, 8).toString('hex')}"`;
    logger.error(`[emailService] sendPdfReport: invalid PDF buffer (${detail})`);
    throw new Error('Invalid PDF buffer — cannot attach to email.');
  }

  try {
    const info = await transporter.sendMail({
      from:    FROM,
      to,
      subject: 'Your Resilience Atlas Report',
      text:    'Please find your personalized Resilience Atlas report attached.',
      html:    '<p>Please find your personalized Resilience Atlas report attached.</p>',
      attachments: [
        {
          filename:    'resilience-report.pdf',
          content:     pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    logger.info(`[emailService] PDF report sent to ${to} — messageId: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`[emailService] sendPdfReport failed for ${to}: ${err.message}`, { stack: err.stack });
    throw err;
  }
}

/**
 * Send a reward-style welcome email immediately after a user purchases or
 * unlocks Atlas Starter or Atlas Navigator.
 * Called once per purchase from the payment-confirm endpoint.
 *
 * @param {string} to
 * @param {Object} vars  See purchaseWelcome.js for full variable list
 *   { firstName, tier, resultsLink, gamificationLink, unsubscribeUrl }
 */
async function sendPurchaseWelcome(to, vars) {
  const emailObj = buildPurchaseWelcomeEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send a purchase confirmation email to a Teams package buyer.
 * Called after successful payment for Atlas Team Basic or Atlas Team Premium.
 * No admin notification is sent — these are fully self-serve.
 *
 * @param {string} to
 * @param {Object} vars  { planName, planPrice, email, dashboardUrl }
 */
async function sendTeamPurchaseConfirmation(to, vars) {
  const emailObj = buildTeamPurchaseConfirmationEmail(vars);
  return _send(to, emailObj);
}

/**
 * Send an admin notification when an Atlas Team Enterprise inquiry is received.
 * Only invoked for Enterprise — Basic and Premium are fully self-serve.
 *
 * @param {string} to         Admin / site-owner email address
 * @param {Object} vars       { contactName, companyName, email, teamSize, message }
 */
async function sendTeamEnterpriseAdminNotification(to, vars) {
  const {
    contactName  = '',
    companyName  = '',
    email        = '',
    teamSize     = '',
    message      = '',
  } = vars;

  const lines = [
    `Name:         ${contactName}`,
    `Company:      ${companyName}`,
    `Email:        ${email}`,
    `Team size:    ${teamSize || 'Not specified'}`,
    `Message:      ${message || '(none)'}`,
  ];

  const bodyHtml = `
    <h2 style="margin:0 0 12px;font-size:20px;">&#128279; New Atlas Team Enterprise Inquiry</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;">
      A new Enterprise inquiry has been submitted via the team page.
    </p>
    <table width="100%" cellpadding="6" cellspacing="0" border="0"
           style="font-size:14px;border-collapse:collapse;margin-bottom:24px;">
      ${[
        ['Name',      contactName],
        ['Company',   companyName],
        ['Email',     `<a href="mailto:${email}">${email}</a>`],
        ['Team size', teamSize || 'Not specified'],
        ['Message',   message  || '(none)'],
      ].map(([label, val]) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="font-weight:700;color:#1a3a5c;width:120px;padding:8px 12px;">${label}</td>
          <td style="color:#334155;padding:8px 12px;">${val}</td>
        </tr>`).join('')}
    </table>
    <p style="font-size:13px;color:#64748b;">
      Reply directly to <a href="mailto:${email}">${email}</a> to respond.
    </p>`;

  const emailObj = {
    subject: `New Enterprise Inquiry — ${companyName || contactName || 'Unknown'}`,
    html: wrapEmail(bodyHtml, 'Atlas Team Enterprise Inquiry'),
    text: ['Atlas Team Enterprise Inquiry', '='.repeat(40), ...lines].join('\n'),
  };

  return _send(to, emailObj, { isAdmin: true });
}

/**
 * Generic send function for custom HTML/text emails (e.g. scheduled reports).
 *
 * @param {string} to
 * @param {{ subject: string, html: string, text?: string }} emailObj
 */
async function sendEmail(to, emailObj) {
  return _send(to, emailObj);
}

/* ── Exports ──────────────────────────────────────────────────────────────── */

module.exports = {
  /* New themed functions */
  sendAssessmentResults,
  sendReportReady,
  sendWelcome,
  sendCongratulations,
  sendReminder,
  sendStreakMilestone,
  sendTeamInvitation,
  sendGrowthMilestone,
  sendInvitationReminder,
  sendPurchaseWelcome,

  /* Teams package emails */
  sendTeamPurchaseConfirmation,
  sendTeamEnterpriseAdminNotification,

  /* Referral program */
  sendReferralWelcome,
  sendReferralThankYou,

  /* PDF report with attachment */
  sendPdfReport,
  validatePdfBuffer,

  /* Legacy aliases (keep existing call-sites working) */
  sendQuizReport,
  sendInviteEmail,

  /* Generic send for custom emails */
  sendEmail,

  /* Exposed for testing */
  capitalize,
};
