'use strict';

/**
 * OrgBadgeAward — Records when an org admin awards a custom badge to a user.
 */
const mongoose = require('mongoose');

const OrgBadgeAwardSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrgBadge',
      required: true,
    },

    // The user who received the award (stored as string to match Auth0 sub)
    awardedToUserId: {
      type: String,
      required: true,
    },

    // Optional email for display / lookup
    awardedToEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    // Admin who issued the award
    awardedByUserId: {
      type: String,
      required: true,
    },

    // Free-text note from the admin
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: 300,
    },
  },
  { timestamps: true }
);

OrgBadgeAwardSchema.index({ orgId: 1, awardedToUserId: 1 });
OrgBadgeAwardSchema.index({ orgId: 1, badgeId: 1 });
// Prevent awarding the same badge to the same user more than once within an org
OrgBadgeAwardSchema.index({ orgId: 1, badgeId: 1, awardedToUserId: 1 }, { unique: true });

module.exports = mongoose.model('OrgBadgeAward', OrgBadgeAwardSchema);
