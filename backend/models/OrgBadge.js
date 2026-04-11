'use strict';

/**
 * OrgBadge — Custom badge definitions for an Enterprise organization.
 *
 * Org admins create badge definitions; awards are tracked in OrgBadgeAward.
 */
const mongoose = require('mongoose');

const OrgBadgeSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Display name shown to users
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    // Optional longer description / criteria text
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },

    // Emoji or URL to badge icon. Emoji (e.g. "🏆") is the simplest v1 approach.
    icon: {
      type: String,
      trim: true,
      default: '🏅',
    },

    // Whether awarding is manual (admin awards it) or criteria-based (future).
    awardType: {
      type: String,
      enum: ['manual', 'criteria'],
      default: 'manual',
    },

    // Optional criteria description (used when awardType === 'criteria')
    criteria: {
      type: String,
      trim: true,
      default: '',
    },

    // Soft-delete / retire a badge without removing it from award history
    retired: {
      type: Boolean,
      default: false,
    },

    // Admin who created the badge
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

OrgBadgeSchema.index({ orgId: 1, retired: 1 });

module.exports = mongoose.model('OrgBadge', OrgBadgeSchema);
