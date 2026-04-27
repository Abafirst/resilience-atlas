'use strict';

const mongoose = require('mongoose');

/**
 * IATLASTierWaitlist — stores waitlist sign-ups for coming-soon IATLAS
 * pricing tiers (currently: practice, enterprise).
 *
 * Collection: iatlas_tier_waitlist
 */
const IATLASTierWaitlistSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      required: true,
      enum: ['practice', 'enterprise'],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Unique constraint: one entry per email + tier combination
IATLASTierWaitlistSchema.index({ email: 1, tier: 1 }, { unique: true });
IATLASTierWaitlistSchema.index({ tier: 1, joinedAt: -1 });

module.exports = mongoose.model(
  'IATLASTierWaitlist',
  IATLASTierWaitlistSchema,
  'iatlas_tier_waitlist',
);
