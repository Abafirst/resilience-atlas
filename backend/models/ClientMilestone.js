'use strict';

/**
 * ClientMilestone.js — Mongoose model for IATLAS client milestone achievements.
 *
 * Practitioners record notable achievements and progress milestones for
 * clients.  Milestones can optionally be linked to a session note or a
 * specific clinical goal in the client's profile.
 */

const mongoose = require('mongoose');

const VALID_MILESTONE_TYPES = [
  'goal_achieved',
  'skill_mastered',
  'behavior_improved',
  'session_count',
  'custom',
];

const clientMilestoneSchema = new mongoose.Schema(
  {
    // Auth0 sub of the practitioner who created this milestone.
    practitionerId: {
      type:     String,
      required: true,
      index:    true,
    },

    // ObjectId of the associated ClientProfile.
    clientProfileId: {
      type:     mongoose.Schema.Types.ObjectId,
      required: true,
      index:    true,
      ref:      'ClientProfile',
    },

    // Category of milestone.
    milestoneType: {
      type:    String,
      enum:    VALID_MILESTONE_TYPES,
      default: 'custom',
    },

    // Short descriptive title (e.g. "Completed 10 sessions").
    title: {
      type:      String,
      required:  true,
      trim:      true,
      minlength: 2,
      maxlength: 200,
    },

    // Optional longer description.
    description: {
      type:      String,
      maxlength: 2000,
      default:   '',
    },

    // Date the milestone was achieved (may differ from createdAt for back-dated entries).
    achievedDate: {
      type:     Date,
      required: true,
      index:    true,
    },

    // Optional link to the session note where this was observed.
    sessionNoteId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
      ref:     'SessionNote',
    },

    // Optional link to the clinical goal in ClientProfile.clinicalGoals.
    relatedGoalId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

clientMilestoneSchema.index({ practitionerId: 1, clientProfileId: 1, achievedDate: -1 });

// ── Export ────────────────────────────────────────────────────────────────────

const ClientMilestone = mongoose.model('ClientMilestone', clientMilestoneSchema);

const exported = ClientMilestone || {};
exported.VALID_MILESTONE_TYPES = VALID_MILESTONE_TYPES;

module.exports = exported;
