const mongoose = require('mongoose');

/**
 * LeadershipReport model.
 * Stores aggregated team statistics — no individual scores are exposed.
 */

const dimensionStatsSchema = new mongoose.Schema(
  {
    average: Number,
    min: Number,
    max: Number,
    stdDev: Number,
    percentile: Number,
    // Count of employees per score bucket (e.g., 10 bins of 10 points each)
    distribution: [Number],
    interpretation: String,
    recommendation: String,
  },
  { _id: false }
);

const observationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['strength', 'risk', 'opportunity', 'balance', 'demographic'],
    },
    dimension: String,
    observation: String,
    confidence: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    title: String,
    action: String,
    rationale: String,
    timeline: String,
    expectedImpact: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
    },
  },
  { _id: false }
);

const leadershipReportSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    reportDate: {
      type: Date,
      default: Date.now,
    },

    // ── Team Overview ───────────────────────────────────────────────────────
    teamOverview: {
      totalInvited: { type: Number, default: 0 },
      totalRespondents: { type: Number, default: 0 },
      responseRate: { type: Number, default: 0 },
      averageOverallScore: { type: Number, default: 0 },
      resilienceLevel: {
        type: String,
        enum: ['emerging', 'developing', 'strong', 'high'],
        default: 'emerging',
      },
      previousAverageScore: { type: Number, default: null },
      scoreTrend: { type: Number, default: null },
    },

    // ── Dimension Analysis (one entry per dimension) ───────────────────────
    dimensionAnalysis: {
      'Cognitive-Narrative': dimensionStatsSchema,
      Relational: dimensionStatsSchema,
      'Agentic-Generative': dimensionStatsSchema,
      'Emotional-Adaptive': dimensionStatsSchema,
      'Spiritual-Reflective': dimensionStatsSchema,
      'Somatic-Regulative': dimensionStatsSchema,
    },

    // ── Primary strength distribution ──────────────────────────────────────
    strengthDistribution: {
      type: Map,
      of: Number,
    },

    // ── Key Observations ──────────────────────────────────────────────────
    keyObservations: [observationSchema],

    // ── Recommendations ───────────────────────────────────────────────────
    recommendations: [recommendationSchema],

    // ── Metadata ──────────────────────────────────────────────────────────
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeadershipReport', leadershipReportSchema);
