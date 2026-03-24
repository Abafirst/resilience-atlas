'use strict';

/**
 * DailyInsight.js
 *
 * Stores generated daily insight records so the scheduler can track which
 * insight was sent on which date and surface historical content via the API.
 */

const mongoose = require('mongoose');

const dailyInsightSchema = new mongoose.Schema(
  {
    /** The 1-based day number within the quote-library cycle (1–N). */
    dayNumber: {
      type:     Number,
      required: true,
    },

    /** Calendar date for which this insight was generated (UTC midnight). */
    insightDate: {
      type:    Date,
      required: true,
    },

    /** Unique quote id from the library (e.g. "cn-001"). */
    quoteId: {
      type:     String,
      required: true,
    },

    /** Resilience dimension for this insight. */
    resilienceDimension: {
      type: String,
      enum: [
        'Cognitive-Narrative',
        'Agentic-Generative',
        'Relational-Connective',
        'Emotional-Adaptive',
        'Spiritual-Reflective',
        'Somatic-Regulative',
      ],
      required: true,
    },

    /** Full insight payload as returned by buildInsight(). */
    insight: {
      type:     mongoose.Schema.Types.Mixed,
      required: true,
    },

    /** Generated platform content. */
    email: {
      subject: String,
      html:    String,
      text:    String,
    },
    xPost:         String,
    linkedIn:      String,
    graphicPrompt: String,
    videoScript:   String,

    /** Whether the email was dispatched for this insight date. */
    emailSent: {
      type:    Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// One record per calendar date — prevent duplicate generation for the same day
dailyInsightSchema.index({ insightDate: 1 }, { unique: true });
dailyInsightSchema.index({ resilienceDimension: 1 });
dailyInsightSchema.index({ quoteId: 1 });

module.exports = mongoose.model('DailyInsight', dailyInsightSchema);
