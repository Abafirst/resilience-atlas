'use strict';

/**
 * ClinicalScale.js — Mongoose model for validated clinical assessment results.
 *
 * Stores completed PHQ-9, GAD-7, and other standardised rating scale results
 * for practitioner-administered assessments.
 *
 * These differ from IATLAS mini-assessments:
 *  - Question counts are variable (7–9+)
 *  - Scoring ranges are scale-specific (0–27 for PHQ-9, 0–21 for GAD-7)
 *  - A severity band is derived from the total score per scale specification
 */

const mongoose = require('mongoose');

const ResponseItemSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    score:      { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ClinicalScaleSchema = new mongoose.Schema(
  {
    // Auth0 user ID of the practitioner administering the assessment
    practitionerId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // The client being assessed (references ClientProfile._id as string)
    clientProfileId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // Instrument identifier
    scaleType: {
      type:     String,
      required: true,
      trim:     true,
      enum:     ['PHQ-9', 'GAD-7'],
      index:    true,
    },

    // Array of { questionId, score }
    responses: {
      type:     [ResponseItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 7 && arr.length <= 9,
        message:   'Responses must contain between 7 and 9 items.',
      },
    },

    // Computed total score
    totalScore: {
      type:     Number,
      required: true,
      min:      0,
    },

    // Derived severity band per instrument scoring guidelines
    severityBand: {
      type:  String,
      trim:  true,
      enum:  ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'],
    },

    // Free-text clinical notes
    notes: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: 5000,
    },

    // Date the assessment was administered (defaults to creation time)
    administeredAt: {
      type:    Date,
      default: () => new Date(),
      index:   true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient history queries per client + instrument
ClinicalScaleSchema.index({ clientProfileId: 1, scaleType: 1, administeredAt: -1 });
ClinicalScaleSchema.index({ practitionerId: 1, administeredAt: -1 });

module.exports = mongoose.model('ClinicalScale', ClinicalScaleSchema);
