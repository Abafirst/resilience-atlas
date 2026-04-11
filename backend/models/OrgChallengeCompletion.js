'use strict';

/**
 * OrgChallengeCompletion — Records when a user completes an org challenge.
 */
const mongoose = require('mongoose');

const OrgChallengeCompletionSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrgChallenge',
      required: true,
    },

    // Auth0 sub / userId of the completing user
    userId: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    // Points awarded (snapshot of challenge.points at completion time)
    pointsEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent duplicate completions per user per challenge
OrgChallengeCompletionSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
OrgChallengeCompletionSchema.index({ orgId: 1, userId: 1 });

module.exports = mongoose.model('OrgChallengeCompletion', OrgChallengeCompletionSchema);
