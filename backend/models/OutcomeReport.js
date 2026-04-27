'use strict';

/**
 * OutcomeReport.js — Mongoose model for IATLAS clinical outcome reports.
 *
 * Each document records one generated outcome report for a client.
 * Reports capture a point-in-time snapshot of progress across all
 * 6 resilience dimensions together with goal achievement data.
 *
 * Supports HIPAA-compliant access auditing via the `accessedBy` array
 * and anonymisation via `isAnonymized`.
 */

const mongoose = require('mongoose');

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_REPORT_TYPES = ['insurance', 'family', 'school', 'summary'];

// ── Main schema ───────────────────────────────────────────────────────────────

const outcomeReportSchema = new mongoose.Schema(
  {
    // Auth0 sub of the practitioner who generated this report.
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

    // Format / audience of the report.
    reportType: {
      type:    String,
      enum:    VALID_REPORT_TYPES,
      default: 'summary',
    },

    // Date range covered by this report.
    periodStart: { type: Date, default: null },
    periodEnd:   { type: Date, default: null },

    // Aggregate metrics captured at generation time.
    totalSessions:    { type: Number, default: 0 },
    goalsAchieved:    { type: Number, default: 0 },
    goalsInProgress:  { type: Number, default: 0 },

    // Per-dimension baseline / current scores (JSONB equivalent).
    baselineScores: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    currentScores:  { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

    // True when client name is replaced with an anonymised identifier in the PDF.
    isAnonymized: { type: Boolean, default: false },

    // HIPAA audit trail — array of practitionerIds who accessed this report.
    accessedBy: { type: [String], default: [] },

    // Delivery tracking.
    sentToEmails: { type: [String], default: [] },

    // When this report was actually generated (may differ from createdAt for
    // async/bulk jobs).
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────────────────────────

outcomeReportSchema.index({ practitionerId: 1, clientProfileId: 1, generatedAt: -1 });

// ── Export ────────────────────────────────────────────────────────────────────

const OutcomeReport = mongoose.model('OutcomeReport', outcomeReportSchema);

const exported = OutcomeReport || {};
exported.VALID_REPORT_TYPES = VALID_REPORT_TYPES;

module.exports = exported;
