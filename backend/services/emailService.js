'use strict';

/**
 * emailService.js — Centralised email sending for The Resilience Atlas™.
 *
 * All outgoing emails use the branded HTML templates in
 * backend/templates/emails/ and are sent via Nodemailer (Yahoo SMTP by default,
 * but any SMTP provider works by setting SMTP_* environment variables).
 */

const nodemailer = require('nodemailer');
const logger     = require('../utils/logger');

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
 * Send an email using the pre-built { subject, html, text } object returned
 * by a template builder function.
 *
 * @param {string}  to         Recipient address
 * @param {{ subject: string, html: string, text: string }} emailObj
 * @returns {Promise<Object>}  Nodemailer info object
 */
async function _send(to, emailObj) {
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
 * @param {Object} report  { overall, dominantType, categories, summary }
 */
async function sendQuizReport(to, name, report) {
  const scores = report.categories || {};
  const vars = {
    firstName:         name,
    overallScore:      report.overall,
    dominantDimension: report.dominantType,
    scores,
    topInsight:        report.summary,
    reportLink:        `${process.env.APP_URL || 'https://resilience-atlas.app'}/results.html`,
    retakeLink:        `${process.env.APP_URL || 'https://resilience-atlas.app'}/quiz.html`,
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

  /* Referral program */
  sendReferralWelcome,
  sendReferralThankYou,

  /* Legacy aliases (keep existing call-sites working) */
  sendQuizReport,
  sendInviteEmail,

  /* Exposed for testing */
  capitalize,
};
