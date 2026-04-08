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
  },

  /**
   * Deterministic MD5 hash of (overall|dominantType|JSON.stringify(scores)).
   * Stored at submission time so /api/assessment/by-hash can look up an
   * assessment directly without scanning and recomputing hashes.
   * Sparse index — null/missing for records created before this field existed.
   */
  assessmentHash: {
    type: String,
    default: null,
  },
});

// Index for efficient org-level aggregation queries
ResilienceResultSchema.index({ userId: 1 });
ResilienceResultSchema.index({ organizationId: 1, createdAt: -1 });
// Fast by-hash lookup (used by GET /api/assessment/by-hash)
ResilienceResultSchema.index({ email: 1, assessmentHash: 1 }, { sparse: true });

module.exports = mongoose.model('ResilienceResult', ResilienceResultSchema);
