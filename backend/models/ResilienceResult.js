const mongoose = require('mongoose');

const ResilienceResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Optional: organization this result belongs to (null for individual/free users)
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  },
  email: {
    type: String,
    required: true
  },
  firstName: String,
  // Overall resilience score (0–100)
  overall: Number,
  // Alias field for dashboard queries
  overall_score: Number,
  dominantType: String,
  // Alias for dashboard queries (same value as dominantType)
  dominant_dimension: String,
  scores: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Structured dimension scores for dashboard aggregation
  dimension_scores: {
    relational:  { type: Number, default: null },
    cognitive:   { type: Number, default: null },
    somatic:     { type: Number, default: null },
    emotional:   { type: Number, default: null },
    spiritual:   { type: Number, default: null },
    agentic:     { type: Number, default: null },
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient org-level aggregation queries
ResilienceResultSchema.index({ userId: 1 });
ResilienceResultSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('ResilienceResult', ResilienceResultSchema);
