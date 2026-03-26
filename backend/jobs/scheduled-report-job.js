'use strict';

/**
 * scheduled-report-job.js — Automated weekly/monthly team analytics summaries.
 *
 * Checks all active organizations whose OrgSettings have scheduledExport enabled.
 * Sends a summary email based on the configured frequency (weekly / monthly).
 *
 * Invoke via cron or directly: node backend/jobs/scheduled-report-job.js
 *
 * Recommended cron schedule:
 *   0 7 * * 1   — every Monday at 07:00 (catches weekly orgs)
 *   0 7 1 * *   — 1st of month at 07:00 (catches monthly orgs)
 * Or run daily and let the job decide based on lastExportedAt.
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const Organization   = require('../models/Organization');
const OrgSettings    = require('../models/OrgSettings');
const TeamProfile    = require('../models/TeamProfile');
const emailService   = require('../services/emailService');
const logger         = require('../utils/logger');

const DIMS = [
  'Agentic-Generative',
  'Relational-Connective',
  'Spiritual-Reflective',
  'Emotional-Adaptive',
  'Somatic-Regulative',
  'Cognitive-Narrative',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Determine whether an export is due given the frequency and lastExportedAt.
 *
 * @param {'weekly'|'monthly'} frequency
 * @param {Date|null} lastExportedAt
 * @returns {boolean}
 */
function isDue(frequency, lastExportedAt) {
  if (!lastExportedAt) return true; // Never exported — always due

  const now   = new Date();
  const msAgo = now - new Date(lastExportedAt);
  const days  = msAgo / (1000 * 60 * 60 * 24);

  if (frequency === 'weekly')  return days >= 7;
  if (frequency === 'monthly') return days >= 28;
  return false;
}

/**
 * Build the HTML body for the scheduled report email.
 *
 * @param {Object} org      — Organization document
 * @param {Object} profile  — Latest TeamProfile document (may be null)
 * @returns {string} HTML
 */
function buildReportHtml(org, profile) {
  const orgName = org.company_name || org.name || 'Your Organization';

  if (!profile || !profile.averages) {
    return `
      <p>Hello,</p>
      <p>This is your scheduled resilience analytics summary for <strong>${orgName}</strong>.</p>
      <p>No assessment data is available yet. Encourage your team to complete their resilience assessments to unlock insights here.</p>
      <p style="margin-top:2rem;font-size:0.875rem;color:#6b7280">
        You're receiving this email because scheduled reporting is enabled for your organization.
        Manage your settings at <a href="${process.env.APP_URL || 'https://resilience-atlas.app'}/dashboard-advanced.html">your dashboard</a>.
      </p>
    `;
  }

  const overall    = profile.overallScore != null ? `${profile.overallScore}%` : 'N/A';
  const memberCount = profile.memberCount  || 0;

  const dimRows = DIMS.map((dim) => {
    const shortKey = dim.split('-')[0].toLowerCase();
    const score    = profile.averages && profile.averages[shortKey] != null
      ? `${Math.round(profile.averages[shortKey])}%`
      : 'N/A';
    return `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">${dim}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${score}</td>
    </tr>`;
  }).join('');

  return `
    <p>Hello,</p>
    <p>Here is your scheduled resilience analytics summary for <strong>${orgName}</strong>.</p>

    <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:0.9rem">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #d1d5db">Metric</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #d1d5db">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">Overall Score</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${overall}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb">Members Assessed</td>
          <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${memberCount}</td>
        </tr>
        ${dimRows}
      </tbody>
    </table>

    <p>
      <a href="${process.env.APP_URL || 'https://resilience-atlas.app'}/dashboard-advanced.html"
         style="background:#1a2e5a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
        View Full Dashboard →
      </a>
    </p>

    <p style="margin-top:2rem;font-size:0.875rem;color:#6b7280">
      You're receiving this because scheduled reporting is enabled for your organization.
      <a href="${process.env.APP_URL || 'https://resilience-atlas.app'}/dashboard-advanced.html#settings">Manage settings</a>.
    </p>
  `;
}

// ── Main job ──────────────────────────────────────────────────────────────────

/**
 * Process all organizations with scheduled exports that are currently due.
 *
 * @returns {Promise<{ processed: number, sent: number, errors: number }>}
 */
async function runScheduledReportJob() {
  const stats = { processed: 0, sent: 0, errors: 0 };

  // Find all org settings with scheduled export enabled
  const settingsList = await OrgSettings.find({
    'scheduledExport.enabled': true,
  }).lean();

  for (const settings of settingsList) {
    stats.processed++;
    try {
      const { frequency, recipientEmail, lastExportedAt } = settings.scheduledExport;

      if (!isDue(frequency, lastExportedAt)) continue;

      const org = await Organization.findById(settings.organizationId).lean();
      if (!org || !org.isActive) continue;

      const recipient = recipientEmail || org.admin_email || org.adminEmail;
      if (!recipient) {
        logger.warn(`[scheduled-report] No recipient email for org ${org._id} — skipping.`);
        continue;
      }

      // Fetch latest team analytics snapshot
      const profile = await TeamProfile.findOne({ organizationId: org._id })
        .sort({ updatedAt: -1 })
        .lean();

      const orgName = org.company_name || org.name || 'Your Organization';
      const html    = buildReportHtml(org, profile);
      const subject = `[${orgName}] ${frequency === 'weekly' ? 'Weekly' : 'Monthly'} Resilience Report`;

      await emailService.sendEmail(recipient, { subject, html, text: subject });

      // Update lastExportedAt
      await OrgSettings.updateOne(
        { _id: settings._id },
        { $set: { 'scheduledExport.lastExportedAt': new Date() } }
      );

      stats.sent++;
      logger.info(`[scheduled-report] Sent ${frequency} report to ${recipient} (org: ${org._id})`);
    } catch (err) {
      stats.errors++;
      logger.error(`[scheduled-report] Error for org ${settings.organizationId}: ${err.message}`);
    }
  }

  return stats;
}

/* istanbul ignore next */
if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  mongoose
    .connect(uri)
    .then(() => runScheduledReportJob())
    .then((stats) => {
      console.log('Scheduled report job complete:', JSON.stringify(stats));
      mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Scheduled report job failed:', err);
      process.exit(1);
    });
}

module.exports = { runScheduledReportJob, isDue };
