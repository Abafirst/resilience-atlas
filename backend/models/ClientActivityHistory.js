'use strict';

/**
 * ClientActivityHistory.js
 *
 * Tracks which IATLAS activities have been used in sessions for a specific
 * client, including optional effectiveness ratings (1–5) and free-text notes.
 * Each document represents one usage event.
 */

const mongoose = require('mongoose');

const clientActivityHistorySchema = new mongoose.Schema(
  {
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    clientProfileId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
      ref:      'ClientProfile',
    },

    activityId: {
      type:     String,
      required: true,
      index:    true,
    },

    // Optional link to the session note where the activity was used.
    sessionNoteId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
      ref:     'SessionNote',
    },

    usedAt: {
      type:    Date,
      default: Date.now,
      index:   true,
    },

    // 1–5 star rating; null = not yet rated.
    effectivenessRating: {
      type:    Number,
      min:     1,
      max:     5,
      default: null,
    },

    // Free-text notes about how the client responded.
    notes: {
      type:      String,
      maxlength: 2000,
      default:   '',
    },
  },
  { timestamps: true }
);

// Speed up "most recent activity usage" queries.
clientActivityHistorySchema.index({ clientProfileId: 1, usedAt: -1 });
clientActivityHistorySchema.index({ clientProfileId: 1, activityId: 1, usedAt: -1 });
clientActivityHistorySchema.index({ practitionerId: 1, clientProfileId: 1, usedAt: -1 });

module.exports = mongoose.model('ClientActivityHistory', clientActivityHistorySchema);
