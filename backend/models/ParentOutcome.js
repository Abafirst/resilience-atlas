'use strict';

/**
 * ParentOutcome.js — Mongoose model for IATLAS Parent-Reported Outcome (PRO) forms.
 *
 * Stores completed weekly or monthly parent check-in forms, including
 * dimension ratings, observations, and flags.
 */

const mongoose = require('mongoose');

const DimensionRatingSchema = new mongoose.Schema(
  {
    dimensionKey: { type: String, required: true, trim: true },
    rating:       { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const ParentOutcomeSchema = new mongoose.Schema(
  {
    // Auth0 user ID of the parent/caregiver submitting the form
    parentUserId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // The child profile this report is about
    childProfileId: {
      type:    String,
      trim:    true,
      default: null,
      index:   true,
    },

    // 'weekly' | 'monthly'
    formType: {
      type:     String,
      required: true,
      trim:     true,
      enum:     ['weekly', 'monthly'],
    },

    // ISO week or month string (e.g. '2024-W45' or '2024-11')
    period: {
      type:  String,
      trim:  true,
    },

    // Selected wins from the multiselect
    wins: {
      type:    [String],
      default: [],
    },

    // Selected challenges from the checklist
    challenges: {
      type:    [String],
      default: [],
    },

    // Free-text observation from the parent
    observations: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: 5000,
    },

    // Per-dimension ratings (1–5 scale)
    dimensionRatings: {
      type:    [DimensionRatingSchema],
      default: [],
    },

    // Overall progress rating (monthly form, 1–5)
    overallProgress: {
      type: Number,
      min:  1,
      max:  5,
    },

    // Flags: array of strings like 'concern', 'celebration', 'urgent'
    flags: {
      type:    [String],
      default: [],
    },

    // Questions or topics for the practitioner
    questionsForPractitioner: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: 2000,
    },

    // Celebration note
    celebration: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: 2000,
    },

    // Practitioner-added notes (not editable by parent)
    practitionerNotes: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: 5000,
    },

    // Whether the practitioner has reviewed this submission
    reviewedByPractitioner: {
      type:    Boolean,
      default: false,
    },

    reviewedAt: {
      type:    Date,
      default: null,
    },

    // Flexible storage for additional form section responses
    additionalResponses: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// Compound index for efficient queries
ParentOutcomeSchema.index({ parentUserId: 1, childProfileId: 1, formType: 1, createdAt: -1 });

module.exports = mongoose.model('ParentOutcome', ParentOutcomeSchema);
