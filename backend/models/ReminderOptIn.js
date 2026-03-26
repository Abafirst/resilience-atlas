'use strict';

const mongoose = require('mongoose');

/**
 * ReminderOptIn — stores user email preferences for reassessment reminders.
 *
 * When a user opts in on the results page, their email and last assessment
 * date are stored here. The reassessment-reminder-job.js checks this collection
 * daily and sends reminder emails to users who haven't retaken in 30 days.
 */
const reminderOptInSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        firstName: {
            type: String,
            trim: true,
            default: '',
        },
        // Score at time of opt-in (for personalizing the reminder email)
        lastScore: {
            type: Number,
            default: null,
        },
        // Date of the assessment when user opted in
        lastAssessmentDate: {
            type: Date,
            default: Date.now,
        },
        // Whether the user is still opted in (they can opt out via unsubscribe link)
        optedIn: {
            type: Boolean,
            default: true,
        },
        // Track when we last sent a reminder to avoid spamming
        lastReminderSentAt: {
            type: Date,
            default: null,
        },
        // How many reminders have been sent
        reminderCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

reminderOptInSchema.index({ email: 1 }, { unique: true });
reminderOptInSchema.index({ optedIn: 1, lastAssessmentDate: 1 });

module.exports = mongoose.model('ReminderOptIn', reminderOptInSchema);
