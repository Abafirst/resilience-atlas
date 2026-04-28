'use strict';

/**
 * MLModelPerformance.js — Mongoose model for ML model performance tracking.
 *
 * Each document records the accuracy metrics for a specific model version at
 * a specific point in time.  Admins can inspect this collection via
 * GET /api/ml/models/status.
 */

const mongoose = require('mongoose');

const VALID_MODEL_TYPES = [
  'activity_predictor',
  'regression_detector',
  'goal_scorer',
  'frequency_recommender',
  'treatment_planner',
];

const mlModelPerformanceSchema = new mongoose.Schema(
  {
    modelType: {
      type:     String,
      enum:     VALID_MODEL_TYPES,
      required: true,
      index:    true,
    },

    version: {
      type:     String,
      required: true,
    },

    // Accuracy metrics — not all fields are applicable to every model type.
    accuracy: {
      type: Number,
      min:  0,
      max:  1,
    },

    precision: {
      type: Number,
      min:  0,
      max:  1,
    },

    recall: {
      type: Number,
      min:  0,
      max:  1,
    },

    f1Score: {
      type: Number,
      min:  0,
      max:  1,
    },

    mse: { type: Number },
    r2:  { type: Number },

    trainingDataSize:   { type: Number, default: 0 },
    validationDataSize: { type: Number, default: 0 },

    // Whether this version is currently serving predictions.
    isActive: {
      type:    Boolean,
      default: false,
      index:   true,
    },

    deployedAt:  { type: Date },
    retiredAt:   { type: Date },
  },
  { timestamps: true }
);

mlModelPerformanceSchema.index({ modelType: 1, isActive: 1 });

const MLModelPerformance = mongoose.model('MLModelPerformance', mlModelPerformanceSchema);

const exported = MLModelPerformance || {};
exported.VALID_MODEL_TYPES = VALID_MODEL_TYPES;

module.exports = exported;
