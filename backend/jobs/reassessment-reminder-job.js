'use strict';

/**
 * reassessment-reminder-job.js — 30-day reassessment reminder emails.
 *
 * Queries ReminderOptIn for users who:
 *   - opted in (optedIn: true)
 *   - have not taken a new assessment in the last 30 days
 *   - have not already received a reminder in the last 28 days (avoid spam)
 *
 * Usage (standalone):
 *   node backend/jobs/reassessment-reminder-job.js
 *
 * Or import and call runReassessmentReminderJob() from a scheduler (e.g. cron).
 * Recommended schedule: once per day (e.g. "0 9 * * *" — 9am UTC).
 */

const mongoose     = require('mongoose');
const dotenv       = require('dotenv');
dotenv.config();

const ReminderOptIn  = require('../models/ReminderOptIn');
const emailService   = require('../services/emailService');
const logger         = require('../utils/logger');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

// How many days before we send a reminder
const DAYS_UNTIL_REMINDER = 30;
// Minimum gap between reminders (prevent re-sending too soon)
const MIN_DAYS_BETWEEN_REMINDERS = 28;

/**
 * Send reassessment reminders to opted-in users.
 *
 * @returns {Promise<{ processed: number, sent: number }>}
 */
async function runReassessmentReminderJob() {
    const now = new Date();
    const cutoffDate = new Date(now - DAYS_UNTIL_REMINDER * 24 * 60 * 60 * 1000);
    const reminderCooloff = new Date(now - MIN_DAYS_BETWEEN_REMINDERS * 24 * 60 * 60 * 1000);

    let processed = 0;
    let sent = 0;

    // Find users who opted in, whose last assessment was more than 30 days ago,
    // and who haven't been reminded in the last 28 days.
    const candidates = await ReminderOptIn.find({
        optedIn:            true,
        lastAssessmentDate: { $lt: cutoffDate },
        $or: [
            { lastReminderSentAt: null },
            { lastReminderSentAt: { $lt: reminderCooloff } },
        ],
    }).lean();

    for (const optIn of candidates) {
        processed++;

        const daysSince = Math.floor(
            (now - new Date(optIn.lastAssessmentDate)) / (1000 * 60 * 60 * 24)
        );

        const retakeLink = `${APP_URL}/quiz`;
        const unsubscribeUrl = `${APP_URL}/api/quiz/reminder-optout?email=${encodeURIComponent(optIn.email)}`;

        try {
            await emailService.sendReminder(optIn.email, {
                firstName:      optIn.firstName || 'Friend',
                previousScore:  optIn.lastScore,
                previousDate:   optIn.lastAssessmentDate
                    ? new Date(optIn.lastAssessmentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : null,
                daysSince,
                retakeLink,
                unsubscribeUrl,
            });

            // Update the record so we don't re-send too soon
            await ReminderOptIn.updateOne(
                { _id: optIn._id },
                {
                    $set:  { lastReminderSentAt: now },
                    $inc:  { reminderCount: 1 },
                }
            );

            sent++;
            logger.info(`[reassessment-reminder-job] Sent reminder to ${optIn.email} (${daysSince} days since last assessment)`);
        } catch (err) {
            logger.warn(`[reassessment-reminder-job] Failed to send reminder to ${optIn.email}:`, err.message);
        }
    }

    logger.info(`[reassessment-reminder-job] Done. Processed ${processed}, sent ${sent}.`);
    return { processed, sent };
}

// ── Main ───────────────────────────────────────────────────────────────────────

if (require.main === module) {
    mongoose
        .connect(process.env.MONGODB_URI || process.env.MONGO_URI || '')
        .then(() => runReassessmentReminderJob())
        .then(({ processed, sent }) => {
            console.log(`[reassessment-reminder-job] Done. Processed ${processed}, sent ${sent}.`);
            process.exit(0);
        })
        .catch((err) => {
            console.error('[reassessment-reminder-job] Error:', err);
            process.exit(1);
        });
}

module.exports = { runReassessmentReminderJob };
