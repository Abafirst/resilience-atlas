'use strict';

/**
 * ClientProgress.js — Mongoose model for IATLAS client progress tracking.
 *
 * Each document stores the full longitudinal outcome history for a single
 * client managed by a practitioner.  Session history entries are appended as
 * the therapeutic relationship progresses; baseline and current assessments
 * allow before/after dimensional-score comparisons for reports.
 */

const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const dimensionScoresSchema = new mongoose.Schema(
  {
    agenticGenerative:    { type: Number, default: 0, min: 0, max: 100 },
    somaticRegulative:    { type: Number, default: 0, min: 0, max: 100 },
    cognitiveNarrative:   { type: Number, default: 0, min: 0, max: 100 },
    relationalConnective: { type: Number, default: 0, min: 0, max: 100 },
    emotionalAdaptive:    { type: Number, default: 0, min: 0, max: 100 },
    spiritualExistential: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

const goalProgressSchema = new mongoose.Schema(
  {
    goalId:   { type: String, required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type:    String,
      enum:    ['in-progress', 'achieved', 'discontinued'],
      default: 'in-progress',
    },
  },
  { _id: false }
);

const outcomeMeasuresSchema = new mongoose.Schema(
  {
    subjective: { type: Number, default: null, min: 1, max: 10 },
    objective:  { type: Number, default: null, min: 1, max: 10 },
    goals:      { type: [goalProgressSchema], default: [] },
  },
  { _id: false }
);

const sessionEntrySchema = new mongoose.Schema(
  {
    sessionId:       { type: String, required: true },
    sessionDate:     { type: Date,   default: null },
    sessionNumber:   { type: Number, default: null },
    focus:           { type: String, default: '' },
    dimensionScores: { type: dimensionScoresSchema, default: () => ({}) },
    protocolsUsed:   { type: [String], default: [] },
    clinicalNotes:   { type: String, default: '' },
    outcomeMeasures: { type: outcomeMeasuresSchema, default: () => ({}) },
  },
  { _id: false }
);

const assessmentSnapshotSchema = new mongoose.Schema(
  {
    date:            { type: Date,   default: null },
    dimensionScores: { type: Object, default: () => ({}) },
  },
  { _id: false }
);

const treatmentGoalSchema = new mongoose.Schema(
  {
    goalId:          { type: String,  required: true },
    dimension:       { type: String,  default: '' },
    description:     { type: String,  required: true, trim: true, maxlength: 512 },
    targetDate:      { type: Date,    default: null },
    status: {
      type:    String,
      enum:    ['in-progress', 'achieved', 'discontinued'],
      default: 'in-progress',
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const clientProgressSchema = new mongoose.Schema(
  {
    // Anonymised client identifier supplied by the practitioner.
    clientId: {
      type:      String,
      required:  true,
      index:     true,
      trim:      true,
      maxlength: 128,
    },

    // Auth0 sub of the practitioner who manages this client.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    sessionHistory:      { type: [sessionEntrySchema],      default: [] },
    baselineAssessment:  { type: assessmentSnapshotSchema,  default: () => ({}) },
    currentAssessment:   { type: assessmentSnapshotSchema,  default: () => ({}) },
    treatmentGoals:      { type: [treatmentGoalSchema],     default: [] },
  },
  { timestamps: true }
);

// Compound index so a practitioner can look up any of their clients quickly.
clientProgressSchema.index({ practitionerId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('ClientProgress', clientProgressSchema);
