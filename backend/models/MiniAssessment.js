'use strict';

/**
 * MiniAssessment.js — Mongoose model for IATLAS mini assessment results.
 *
 * Stores the result of a quick 3-question pulse-check assessment for a
 * single resilience dimension.
 */

const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    score:      { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const MiniAssessmentSchema = new mongoose.Schema(
  {
    // Authenticated user performing the assessment (practitioner or parent)
    userId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // Optional: the child profile this assessment is about
    clientProfileId: {
      type:    String,
      trim:    true,
      default: null,
      index:   true,
    },

    // One of the six IATLAS dimensions
    dimension: {
      type:     String,
      required: true,
      trim:     true,
      enum: [
        'emotional-adaptive',
        'agentic-generative',
        'somatic-regulative',
        'cognitive-narrative',
        'relational-connective',
        'spiritual-existential',
      ],
    },

    // 'parent' or 'practitioner'
    versionUsed: {
      type:     String,
      required: true,
      trim:     true,
      enum:     ['parent', 'practitioner'],
      default:  'parent',
    },

    // Array of { questionId, score } — one per question
    responses: {
      type:     [ResponseSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length === 3,
        message:   'Exactly 3 responses are required per mini assessment.',
      },
    },

    // Computed total score (3–15)
    totalScore: {
      type:     Number,
      required: true,
      min:      3,
      max:      15,
    },

    // 'low' | 'medium' | 'high'
    interpretation: {
      type:  String,
      trim:  true,
      enum:  ['low', 'medium', 'high'],
    },

    // Activity IDs recommended based on score
    recommendedActivities: {
      type:    [String],
      default: [],
    },

    // Optional free-text notes from the rater
    notes: {
      type:    String,
      trim:    true,
      default: '',
      maxlength: 2000,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// Compound index for efficient history queries
MiniAssessmentSchema.index({ userId: 1, clientProfileId: 1, dimension: 1, createdAt: -1 });

module.exports = mongoose.model('MiniAssessment', MiniAssessmentSchema);
