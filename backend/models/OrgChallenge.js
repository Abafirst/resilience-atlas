'use strict';

/**
 * OrgChallenge — Custom challenge definitions for an Enterprise organization.
 *
 * Org admins create challenges; completions are tracked in OrgChallengeCompletion.
 */
const mongoose = require('mongoose');

const OrgChallengeSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    // Optional resilience dimension this challenge targets
    dimension: {
      type: String,
      trim: true,
      default: null,
    },

    // Points awarded on completion
    points: {
      type: Number,
      default: 10,
      min: 0,
      max: 10000,
    },

    // ISO date strings (YYYY-MM-DD) for the challenge window
    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    // Whether the challenge is still open for new completions
    active: {
      type: Boolean,
      default: true,
    },

    // Admin who created this challenge
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

OrgChallengeSchema.index({ orgId: 1, active: 1 });

module.exports = mongoose.model('OrgChallenge', OrgChallengeSchema);
