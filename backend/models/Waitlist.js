'use strict';

const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema(
  {
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
    specialty: {
      type: String,
      required: true,
      enum: ['teachers', 'slp', 'ot', 'daily-living', 'social-skills', 'clinicians', 'caregivers'],
    },
    organization: {
      type: String,
      trim: true,
    },
    interestedIn: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: 'iatlas-curriculum-page',
      trim: true,
    },
    submittedAt: {
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

// Unique constraint: one entry per email+specialty combination
WaitlistSchema.index({ email: 1, specialty: 1 }, { unique: true });
WaitlistSchema.index({ specialty: 1, submittedAt: -1 });

module.exports = mongoose.model('IatlasWaitlist', WaitlistSchema, 'iatlas_waitlist');
