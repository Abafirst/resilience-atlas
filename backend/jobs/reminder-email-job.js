'use strict';

/**
 * reminder-email-job.js — Automated invitation reminder emails.
 *
 * Checks for team members with pending invites that have not responded
 * after 3 days and again after 7 days, sending reminder emails.
 *
 * Usage (standalone):
 *   node backend/jobs/reminder-email-job.js
 *
 * Or import and call runReminderJob() from a scheduler.
 */

const mongoose     = require('mongoose');
const dotenv       = require('dotenv');
dotenv.config();

const Team         = require('../models/Team');
const Organization = require('../models/Organization');
const emailService = require('../services/emailService');

const REMINDER_INTERVALS_DAYS = [3, 7];  // Send reminders at day 3 and day 7

/**
 * Send reminder emails to invitees who haven't responded.
 *
 * @returns {Promise<{ processed: number, sent: number }>}
 */
async function runReminderJob() {
  const now = new Date();
  let processed = 0;
  let sent = 0;

  const teams = await Team.find({ isActive: true, 'pendingInvites.0': { $exists: true } }).lean();

  for (const team of teams) {
    const org = await Organization.findById(team.organizationId).lean();
    if (!org) continue;

    const orgName  = org.company_name || org.name || 'Your Team';
    const assessUrl = `${process.env.APP_URL || ''}/quiz.html?org=${org.slug || org._id}`;

    for (const invite of team.pendingInvites) {
      processed++;

      // Determine how many days since invitation
      const daysSinceInvite = Math.floor((now - new Date(invite.invitedAt)) / (1000 * 60 * 60 * 24));
      const currentReminders = invite.reminderCount || 0;

      // Find which reminder interval we should send (if any)
      const shouldSendReminder = REMINDER_INTERVALS_DAYS.some(
        (days, idx) => daysSinceInvite >= days && currentReminders <= idx
      );

      if (!shouldSendReminder) continue;

      // Don't spam — only send if last reminder was > 2 days ago
      if (invite.lastReminderAt) {
        const daysSinceLastReminder = Math.floor(
          (now - new Date(invite.lastReminderAt)) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastReminder < 2) continue;
      }

      try {
        await emailService.sendInvitationReminder({
          to: invite.email,
          orgName,
          teamName: team.name,
          assessmentUrl: assessUrl,
          reminderNumber: currentReminders + 1,
        });

        // Update the invite record
        await Team.updateOne(
          { _id: team._id, 'pendingInvites.email': invite.email },
          {
            $set: {
              'pendingInvites.$.lastReminderAt': now,
            },
            $inc: { 'pendingInvites.$.reminderCount': 1 },
          }
        );

        sent++;
      } catch (err) {
        console.warn(`[reminder-job] Failed to send reminder to ${invite.email}:`, err.message);
      }
    }
  }

  return { processed, sent };
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI || process.env.MONGO_URI || '')
    .then(() => runReminderJob())
    .then(({ processed, sent }) => {
      console.log(`[reminder-job] Done. Processed ${processed} invites, sent ${sent} reminders.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[reminder-job] Error:', err);
      process.exit(1);
    });
}

module.exports = { runReminderJob };
