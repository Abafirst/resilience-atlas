'use strict';

/**
 * ClinicalIntake.js — Mongoose model for IATLAS clinical intake assessments.
 *
 * Each document represents one intake (or reassessment) form completed by a
 * practitioner for a client.  Multiple intakes per client allow longitudinal
 * dimension-score tracking for outcome comparison.
 *
 * Privacy note: clientIdentifier should be a pseudonym or initials — NOT a
 * full legal name.  No PII is required by the schema.
 */

const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const guardianContactSchema = new mongoose.Schema(
  {
    name:  { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false }
);

const dimensionRatingsSchema = new mongoose.Schema(
  {
    'agentic-generative':    { type: Number, default: null, min: 1, max: 10 },
    'somatic-regulative':    { type: Number, default: null, min: 1, max: 10 },
    'cognitive-narrative':   { type: Number, default: null, min: 1, max: 10 },
    'relational-connective': { type: Number, default: null, min: 1, max: 10 },
    'emotional-adaptive':    { type: Number, default: null, min: 1, max: 10 },
    'spiritual-existential': { type: Number, default: null, min: 1, max: 10 },
  },
  { _id: false }
);

const supportSystemSchema = new mongoose.Schema(
  {
    family:       { type: String, enum: ['yes', 'no', 'partial', ''], default: '' },
    friends:      { type: String, enum: ['yes', 'no', 'partial', ''], default: '' },
    professional: { type: String, enum: ['yes', 'no', 'partial', ''], default: '' },
    community:    { type: String, enum: ['yes', 'no', 'partial', ''], default: '' },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const clinicalIntakeSchema = new mongoose.Schema(
  {
    // Auth0 sub of the practitioner who owns this intake.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // Client name or ID — NOT intended to store sensitive PII.
    clientIdentifier: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 128,
    },

    // Optional: link to a ClientProfile document by MongoDB ObjectId string.
    clientProfileId: {
      type:    String,
      default: null,
      index:   true,
    },

    dateOfBirth: { type: Date, default: null },
    pronouns:    { type: String, default: '', trim: true, maxlength: 64 },

    guardianContact: {
      type:    guardianContactSchema,
      default: () => ({}),
    },

    dimensionRatings: {
      type:    dimensionRatingsSchema,
      default: () => ({}),
    },

    currentStressors: {
      type:    [String],
      default: [],
    },

    supportSystem: {
      type:    supportSystemSchema,
      default: () => ({}),
    },

    therapyGoals: {
      type:    [String],
      default: [],
    },

    // Free-text notes section.
    additionalNotes: {
      type:    String,
      default: '',
    },

    // Soft-delete flag.
    archived: {
      type:    Boolean,
      default: false,
      index:   true,
    },
  },
  { timestamps: true }
);

// Compound index for listing a practitioner's non-archived intakes efficiently.
clinicalIntakeSchema.index({ practitionerId: 1, archived: 1, createdAt: -1 });

module.exports = mongoose.model('ClinicalIntake', clinicalIntakeSchema);
