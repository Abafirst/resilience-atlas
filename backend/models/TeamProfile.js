'use strict';

/**
 * TeamProfile.js — Mongoose model for cached team analytics snapshots.
 *
 * Stores the computed analytics for an organization (or sub-team) including
 * dimension averages, member statuses, trend data, recommendations, and a
 * generated narrative HTML report.  Updated by the daily cron job or on-demand.
 */

const mongoose = require('mongoose');

// ── Trend entry sub-schema ────────────────────────────────────────────────────

const trendEntrySchema = new mongoose.Schema(
  {
    date:    { type: Date,   required: true },
    average: { type: Number, required: true },
    min:     { type: Number, default: null },
    max:     { type: Number, default: null },
  },
  { _id: false }
);

// ── Member status sub-schema ──────────────────────────────────────────────────

const memberStatusSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name:           { type: String, required: true },
    role:           { type: String, default: 'member' },
    score:          { type: Number, default: null },
    assessmentDate: { type: Date,   default: null },
    // 'assessed' — completed this cycle; 'pending' — invited, not yet done; 'overdue' — past deadline
    status: {
      type: String,
      enum: ['assessed', 'pending', 'overdue'],
      default: 'pending',
    },
    riskFlags: [{ type: String }],
    // Per-dimension scores for heatmap
    dimensionScores: {
      relational: { type: Number, default: null },
      cognitive:  { type: Number, default: null },
      somatic:    { type: Number, default: null },
      emotional:  { type: Number, default: null },
      spiritual:  { type: Number, default: null },
      agentic:    { type: Number, default: null },
    },
  },
  { _id: false }
);

// ── Peer mentoring pair sub-schema ────────────────────────────────────────────

const mentoringPairSchema = new mongoose.Schema(
  {
    mentor:    { type: String, required: true },
    mentee:    { type: String, required: true },
    dimension: { type: String, required: true },
  },
  { _id: false }
);

// ── Main TeamProfile schema ───────────────────────────────────────────────────

const teamProfileSchema = new mongoose.Schema(
  {
    // Reference to the parent organization
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Optional reference to a specific sub-team (null = whole org)
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },

    // ── Aggregated team profile ───────────────────────────────────────────────

    teamProfile: {
      name:           { type: String, required: true },
      memberCount:    { type: Number, default: 0 },
      overallScore:   { type: Number, default: null },
      assessmentDate: { type: Date,   default: null },

      // Latest dimension averages (0-100 per dimension)
      dimensionAverages: {
        'Cognitive-Narrative':  { type: Number, default: null },
        'Relational-Connective':{ type: Number, default: null },
        'Agentic-Generative':   { type: Number, default: null },
        'Emotional-Adaptive':   { type: Number, default: null },
        'Spiritual-Reflective': { type: Number, default: null },
        'Somatic-Regulative':   { type: Number, default: null },
      },

      // Time-series trend data per dimension
      trends: {
        'Cognitive-Narrative':  [trendEntrySchema],
        'Relational-Connective':[trendEntrySchema],
        'Agentic-Generative':   [trendEntrySchema],
        'Emotional-Adaptive':   [trendEntrySchema],
        'Spiritual-Reflective': [trendEntrySchema],
        'Somatic-Regulative':   [trendEntrySchema],
      },
    },

    // ── Per-member status list ────────────────────────────────────────────────
    memberStatus: [memberStatusSchema],

    // ── Recommendations ───────────────────────────────────────────────────────
    recommendations: {
      strengthFocus:        [{ type: String }],
      riskIntervention:     [{ type: String }],
      workshopSuggestions:  [{ type: String }],
      peerMentoringPairs:   [mentoringPairSchema],
    },

    // ── Generated HTML narrative report ──────────────────────────────────────
    generatedReport: { type: String, default: '' },

    // ── Metadata ──────────────────────────────────────────────────────────────
    generatedAt:  { type: Date,    default: Date.now },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index for efficient lookups: latest profile per org
teamProfileSchema.index({ orgId: 1, createdAt: -1 });
teamProfileSchema.index({ orgId: 1, teamId: 1, createdAt: -1 });

module.exports = mongoose.model('TeamProfile', teamProfileSchema);
