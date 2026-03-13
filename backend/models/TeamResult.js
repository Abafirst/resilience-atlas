const mongoose = require('mongoose');

/**
 * TeamResult model — stores aggregated team resilience metrics for an organization.
 * Computed from the individual ResilienceResult documents belonging to the org.
 */
const teamResultSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Descriptive period label, e.g. 'current', 'q1-2026'
    period: {
      type: String,
      default: 'current',
      trim: true,
    },

    // Number of team members included in this snapshot
    team_count: {
      type: Number,
      default: 0,
    },

    // Average scores (0-100) per resilience dimension
    averages: {
      relational:  { type: Number, default: 0 },
      cognitive:   { type: Number, default: 0 },
      somatic:     { type: Number, default: 0 },
      emotional:   { type: Number, default: 0 },
      spiritual:   { type: Number, default: 0 },
      agentic:     { type: Number, default: 0 },
      overall:     { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeamResult', teamResultSchema);
