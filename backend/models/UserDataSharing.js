'use strict';

/**
 * UserDataSharing.js — Centralized model for per-organisation sharing preferences.
 *
 * One document per (userId, organizationId) pair.
 * Tracks independent consent for:
 *   - scoresEnabled    : whether assessment dimension/overall scores are shared
 *   - curriculumEnabled: whether IATLAS curriculum progress is shared
 *
 * history[] provides a full audit trail of every consent change.
 */

const mongoose = require('mongoose');

const ConsentHistoryEntrySchema = new mongoose.Schema(
  {
    type:    { type: String, enum: ['scores', 'curriculum'], required: true },
    action:  { type: String, enum: ['granted', 'revoked'],  required: true },
    date:    { type: Date,   default: Date.now },
    goals:   { type: String, default: null },
    context: { type: String, default: null }, // e.g. 'assessment_submission', 'settings_change'
  },
  { _id: false }
);

const UserDataSharingSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    organizationId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Organization',
      required: true,
    },

    // ── Assessment scores consent ────────────────────────────────────────────
    scoresEnabled:      { type: Boolean, default: null },   // null = not yet set
    scoresConsentDate:  { type: Date,    default: null },
    scoresGoals:        { type: String,  default: null },
    scoresLastUpdated:  { type: Date,    default: null },

    // ── Curriculum progress consent ─────────────────────────────────────────
    curriculumEnabled:      { type: Boolean, default: null },
    curriculumConsentDate:  { type: Date,    default: null },
    curriculumGoals:        { type: String,  default: null },
    curriculumLastUpdated:  { type: Date,    default: null },

    // ── Audit trail ──────────────────────────────────────────────────────────
    history: {
      type:    [ConsentHistoryEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// One preference document per (user, org) pair
UserDataSharingSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
// Efficient lookup of all org members who share scores/curriculum
UserDataSharingSchema.index({ organizationId: 1, scoresEnabled: 1 });
UserDataSharingSchema.index({ organizationId: 1, curriculumEnabled: 1 });

module.exports = mongoose.model('UserDataSharing', UserDataSharingSchema);
