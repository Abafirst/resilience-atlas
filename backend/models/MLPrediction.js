'use strict';

/**
 * MLPrediction.js — Mongoose model for ML prediction records.
 *
 * Stores every prediction made by the ML engine so that:
 *  - Practitioners can view explanations later via GET /api/ml/explain/:id
 *  - Feedback (helpful / not_helpful) can be recorded for model improvement
 *  - Privacy audit trails are maintained (no PII in input_features)
 */

const mongoose = require('mongoose');

const VALID_PREDICTION_TYPES = ['activity', 'regression', 'goal', 'frequency', 'plan'];
const VALID_FEEDBACK_VALUES  = ['helpful', 'not_helpful'];

const mlPredictionSchema = new mongoose.Schema(
  {
    // Auth0 sub of the practitioner who triggered the prediction.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // Anonymised client identifier (ObjectId as string — no PII).
    clientId: {
      type:  String,
      index: true,
    },

    // What kind of prediction this is.
    predictionType: {
      type:     String,
      enum:     VALID_PREDICTION_TYPES,
      required: true,
      index:    true,
    },

    // Version string of the engine that produced this prediction (e.g. "1.0.0").
    modelVersion: {
      type:    String,
      default: '1.0.0',
    },

    // De-identified feature vector used for the prediction.
    inputFeatures: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // The raw prediction output (scores, ranks, plan weeks, etc.).
    predictionOutput: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Overall confidence level (0–100).
    confidence: {
      type: Number,
      min:  0,
      max:  100,
    },

    // Plain-language explanation shown to the practitioner.
    explanation: {
      type:      String,
      maxlength: 4000,
      default:   '',
    },

    // Optional practitioner feedback.
    feedback: {
      type:    String,
      enum:    [...VALID_FEEDBACK_VALUES, null],
      default: null,
    },
  },
  { timestamps: true }
);

mlPredictionSchema.index({ practitionerId: 1, predictionType: 1, createdAt: -1 });

const MLPrediction = mongoose.model('MLPrediction', mlPredictionSchema);

const exported = MLPrediction || {};
exported.VALID_PREDICTION_TYPES = VALID_PREDICTION_TYPES;
exported.VALID_FEEDBACK_VALUES  = VALID_FEEDBACK_VALUES;

module.exports = exported;
