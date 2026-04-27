'use strict';

/**
 * ClientProgressSnapshot.js — Mongoose model for IATLAS client progress snapshots.
 *
 * Each document records a point-in-time observation of a client's resilience
 * dimension scores.  Snapshots can be created automatically after formal
 * assessments or manually by practitioners between sessions.
 */

const mongoose = require('mongoose');

const VALID_DATA_SOURCES = ['assessment', 'practitioner_observation', 'self_report'];

const DIMENSION_KEYS = [
  'agenticGenerative',
  'relationalConnective',
  'somaticRegulative',
  'cognitiveNarrative',
  'emotionalAdaptive',
  'spiritualExistential',
];

// ── Sub-schema: dimension scores ─────────────────────────────────────────────

const dimensionScoresSchema = new mongoose.Schema(
  {
    agenticGenerative:    { type: Number, default: 0, min: 0, max: 100 },
    relationalConnective: { type: Number, default: 0, min: 0, max: 100 },
    somaticRegulative:    { type: Number, default: 0, min: 0, max: 100 },
    cognitiveNarrative:   { type: Number, default: 0, min: 0, max: 100 },
    emotionalAdaptive:    { type: Number, default: 0, min: 0, max: 100 },
    spiritualExistential: { type: Number, default: 0, min: 0, max: 100 },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const clientProgressSnapshotSchema = new mongoose.Schema(
  {
    // Auth0 sub of the owning practitioner.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // ObjectId of the associated ClientProfile.
    clientProfileId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
      ref:      'ClientProfile',
    },

    // Date the snapshot was recorded (may differ from createdAt for back-dated entries).
    snapshotDate: {
      type:     Date,
      required: true,
      index:    true,
    },

    // Scores for each of the 6 resilience dimensions (0–100).
    dimensionScores: {
      type:     dimensionScoresSchema,
      default:  () => ({}),
    },

    // Composite overall score (0–100); can be auto-calculated or manually supplied.
    overallScore: {
      type:    Number,
      min:     0,
      max:     100,
      default: 0,
    },

    // How this data was collected.
    dataSource: {
      type:    String,
      enum:    VALID_DATA_SOURCES,
      default: 'practitioner_observation',
    },

    // Optional free-text notes about the snapshot.
    notes: {
      type:      String,
      maxlength: 2000,
      default:   '',
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

clientProgressSnapshotSchema.index({ practitionerId: 1, clientProfileId: 1, snapshotDate: -1 });

// ── Export ────────────────────────────────────────────────────────────────────

const ClientProgressSnapshot = mongoose.model('ClientProgressSnapshot', clientProgressSnapshotSchema);

const exported = ClientProgressSnapshot || {};
exported.VALID_DATA_SOURCES = VALID_DATA_SOURCES;
exported.DIMENSION_KEYS     = DIMENSION_KEYS;

module.exports = exported;
