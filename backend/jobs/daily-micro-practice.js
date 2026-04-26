'use strict';

/**
 * daily-micro-practice.js
 *
 * Scheduled job that sends each user their Day N micro-practice email
 * from their 30-day personalized plan.
 *
 * Run daily via cron / system scheduler:
 *   node backend/jobs/daily-micro-practice.js
 *
 * The job queries paid/full MicroPracticePlan documents, determines which
 * "day" each user is on (relative to their plan's startDate), and sends
 * them a short email with that day's practice. It is idempotent within a
 * single calendar day because it skips plans whose lastEmailSentDate is
 * already today.
 *
 * Environment variables used:
 *   MONGODB_URI          — MongoDB connection string (required)
 *   APP_URL              — Base URL of the app (default: https://resilience-atlas.app)
 *   EMAIL_FROM           — From address for emails (default: noreply@resilience-atlas.app)
 *   DAILY_PRACTICE_BATCH — Number of plans processed per batch (default: 50)
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');

dotenv.config();

const MicroPracticePlan = require('../models/MicroPracticePlan');
const emailService      = require('../services/emailService');
const logger            = require('../utils/logger');

const APP_URL    = process.env.APP_URL    || 'https://resilience-atlas.app';
const BATCH_SIZE = parseInt(process.env.DAILY_PRACTICE_BATCH || '50', 10);

// ── Email template ─────────────────────────────────────────────────────────────

function buildDailyPracticeEmail(vars) {
  const {
    firstName       = 'Friend',
    day,
    dimension,
    practiceTitle,
    resultsLink     = `${APP_URL}/results`,
    unsubscribeUrl,
  } = vars;

  const dayLabel = `Day ${day} of 30`;

  const subject = `🌱 ${dayLabel} — Your micro-practice: ${practiceTitle}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f8fc;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f8fc">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
      <tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 32px;color:#fff;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;opacity:.8;">Your 30-Day Resilience Plan</p>
        <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;">${dayLabel} 🌱</h1>
        <p style="margin:0;font-size:14px;opacity:.9;">Hi ${firstName} — here's your practice for today.</p>
      </td></tr>
      <tr><td style="padding:28px 32px;">
        <div style="background:#f5f3ff;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.08em;">${dimension}</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">${practiceTitle}</p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
            Open your results page to see the full instructions and mark this practice complete.
          </p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="padding-bottom:24px;">
            <a href="${resultsLink}" style="display:inline-block;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:700;font-size:14px;">
              View Today's Practice →
            </a>
          </td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 20px;">
        <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
          You're on day ${day} of your 30-day resilience journey.
          ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe</a>` : ''}
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Your 30-Day Resilience Plan — ${dayLabel}`,
    '='.repeat(40),
    '',
    `Hi ${firstName},`,
    '',
    `Today's practice: ${practiceTitle} (${dimension})`,
    '',
    `View the full practice and mark it complete: ${resultsLink}`,
    '',
    `You're on day ${day} of your 30-day resilience journey.`,
    ...(unsubscribeUrl ? [`To unsubscribe: ${unsubscribeUrl}`] : []),
  ].join('\n');

  return { subject, html, text };
}

// ── Core job ───────────────────────────────────────────────────────────────────

/**
 * Determine which day of the 30-day plan a user is on as of today (in their
 * timezone).  Returns null if the plan hasn't started or has finished.
 *
 * @param {string} startDate  ISO YYYY-MM-DD
 * @param {string} timezone   IANA timezone string
 * @returns {number|null}     1-based day number, or null
 */
function getPlanDay(startDate, timezone) {
  let todayStr;
  try {
    todayStr = new Date().toLocaleDateString('en-CA', { timeZone: timezone || 'UTC' });
  } catch (_) {
    todayStr = new Date().toISOString().slice(0, 10);
  }

  if (!startDate) return null;

  const start = new Date(startDate + 'T00:00:00Z');
  const today = new Date(todayStr + 'T00:00:00Z');
  const diff  = Math.floor((today - start) / 86_400_000);

  const day = diff + 1; // 1-based
  if (day < 1 || day > 30) return null;
  return day;
}

/**
 * Process a single MicroPracticePlan: determine today's day, find the
 * practice, send the email, and record the send.
 *
 * @param {Object} plan  MicroPracticePlan document
 * @returns {Promise<'sent'|'skipped'|'error'>}
 */
async function processPlan(plan) {
  const todayStr = (() => {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: plan.timezone || 'UTC' });
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  })();

  // Skip if we already sent an email today.
  if (plan.lastEmailSentDate === todayStr) return 'skipped';

  const dayNum = getPlanDay(plan.startDate, plan.timezone);
  if (!dayNum) return 'skipped';

  const dayEntry = plan.days.find(d => d.day === dayNum);
  if (!dayEntry) {
    logger.warn(`[daily-micro-practice] No day entry for day ${dayNum} in plan ${plan._id}`);
    return 'skipped';
  }

  const firstName = (plan.email.split('@')[0] || '').replace(/[._-]/g, ' ').split(' ')[0] || 'Friend';

  try {
    const emailObj = buildDailyPracticeEmail({
      firstName,
      day:           dayNum,
      dimension:     dayEntry.dimension,
      practiceTitle: dayEntry.practiceTitle,
      resultsLink:   `${APP_URL}/results`,
    });

    await emailService.sendEmail(plan.email, emailObj);

    // Mark last email sent so we don't double-send.
    await MicroPracticePlan.findByIdAndUpdate(plan._id, { lastEmailSentDate: todayStr });

    logger.info(`[daily-micro-practice] Sent Day ${dayNum} email to ${plan.email}`);
    return 'sent';
  } catch (err) {
    logger.error(`[daily-micro-practice] Failed to send to ${plan.email}: ${err.message}`);
    return 'error';
  }
}

/**
 * Main job entry-point.
 */
async function runDailyMicroPracticeJob() {
  logger.info('[daily-micro-practice] Job started');

  const summary = { sent: 0, skipped: 0, error: 0 };
  let skip = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const batch = await MicroPracticePlan.find(
      { tier: { $in: ['paid', 'full'] } },
      { email: 1, startDate: 1, timezone: 1, lastEmailSentDate: 1, days: 1, tier: 1 },
      { skip, limit: BATCH_SIZE, lean: true }
    );

    if (batch.length === 0) break;

    for (const plan of batch) {
      const result = await processPlan(plan);
      summary[result] = (summary[result] || 0) + 1;
    }

    skip += batch.length;
    if (batch.length < BATCH_SIZE) break;
  }

  logger.info(`[daily-micro-practice] Job complete — sent: ${summary.sent}, skipped: ${summary.skipped}, errors: ${summary.error}`);
  return summary;
}

// ── Run standalone ─────────────────────────────────────────────────────────────

if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('[daily-micro-practice] MONGODB_URI environment variable is required');
    process.exit(1);
  }

  mongoose
    .connect(uri)
    .then(() => runDailyMicroPracticeJob())
    .then((summary) => {
      logger.info('[daily-micro-practice] Summary:', summary);
      return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('[daily-micro-practice] Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = { runDailyMicroPracticeJob, getPlanDay, buildDailyPracticeEmail };
