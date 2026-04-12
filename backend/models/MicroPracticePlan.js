'use strict';

/**
 * MicroPracticePlan — Stores a user's 30-day micro-practice plan.
 *
 * The plan is generated once per (email, assessmentHash) pair based on the
 * user's assessment results and persisted so it never re-randomises on
 * subsequent visits.
 *
 * Each day contains one practice object referencing the dimension and
 * practice title so it can be looked up in EVIDENCE_PRACTICES on the client.
 */

const mongoose = require('mongoose');

const daySchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 30,
  },
  dimension: {
    type: String,
    required: true,
    trim: true,
  },
  practiceTitle: {
    type: String,
    required: true,
    trim: true,
  },
  /** ISO date string (YYYY-MM-DD) for the day this practice is scheduled. */
  scheduledDate: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, { _id: false });

const microPracticePlanSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * MD5 hash of the assessment data — links this plan to a specific
     * assessment result so the plan is stable per assessment, not per user.
     */
    assessmentHash: {
      type: String,
      required: false,
      trim: true,
    },

    /** ISO date string when the plan was started (Day 1). */
    startDate: {
      type: String,
      required: true,
    },

    /** Timezone supplied by the client (e.g. "America/New_York"). */
    timezone: {
      type: String,
      default: 'UTC',
    },

    days: {
      type: [daySchema],
      default: [],
      validate: {
        validator: (arr) => arr.length === 30,
        message: 'A plan must contain exactly 30 days.',
      },
    },

    /**
     * Whether a welcome email with the Day-1 practice was sent.
     * Used by the daily job to avoid re-sending.
     */
    day1EmailSent: {
      type: Boolean,
      default: false,
    },

    /**
     * ISO date string (YYYY-MM-DD) of the last day an email was sent.
     * Set by the daily-micro-practice job to prevent duplicate sends.
     */
    lastEmailSentDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index so each email+hash pair yields at most one plan.
microPracticePlanSchema.index(
  { email: 1, assessmentHash: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('MicroPracticePlan', microPracticePlanSchema);
