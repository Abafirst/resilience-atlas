'use strict';

/**
 * ProgressCircle.js — Multi-stakeholder shared progress tracking model.
 *
 * A Progress Circle is a shared workspace centred around a child profile
 * where parents, caregivers, providers, teachers, and employers can
 * collaboratively monitor resilience growth across settings.
 */

const mongoose = require('mongoose');

const sharedActivitySchema = new mongoose.Schema(
  {
    activityId:       { type: String, required: true },
    completedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedByRole:  { type: String, default: '' },
    completedAt:      { type: Date,   default: Date.now },
    setting:          { type: String, default: '' },  // "home", "school", "clinic", "therapy"
    dimension:        { type: String, default: '' },
    xpAwarded:        { type: Number, default: 0 },
    notes:            { type: String, default: '' },
    visible:          { type: Boolean, default: true },
  },
  { _id: true }
);

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'parent',
        'guardian',
        'caregiver',
        'grandparent',
        'foster_parent',
        'family_member',
        'slp',
        'ot',
        'bcba',
        'teacher',
        'counselor',
        'therapist',
        'coach',
        'employer',
        'mentor',
        'other',
      ],
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    organizationType: {
      type: String,
      enum: [
        'family',
        'caregiver_network',
        'slp_practice',
        'ot_practice',
        'aba_clinic',
        'school',
        'employer',
        'therapy_center',
        'healthcare_practice',
        'other',
        null,
      ],
      default: null,
    },

    // Permissions
    canViewProgress:    { type: Boolean, default: true  },
    canViewActivities:  { type: Boolean, default: true  },
    canViewDimensions:  { type: Boolean, default: true  },
    canViewNotes:       { type: Boolean, default: false },
    canAddActivities:   { type: Boolean, default: false },
    canInviteOthers:    { type: Boolean, default: false },

    // Metadata
    invitedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    invitedAt:  { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'active', 'declined', 'removed'],
      default: 'pending',
    },

    // Specialty context
    specialtyContext: {
      sessionFrequency: { type: String, default: '' },
      primaryFocus:     { type: [String], default: [] },
      startDate:        { type: Date, default: null },
    },
  },
  { _id: true }
);

const progressCircleSchema = new mongoose.Schema(
  {
    childProfileId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'ChildProfile',
      required: true,
      index:    true,
    },

    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    // Privacy level controls how much detail stakeholders can see.
    // full:       all stakeholders see all data
    // aggregated: stakeholders see summary stats only
    // minimal:    stakeholders see only their own contribution
    privacyLevel: {
      type:    String,
      enum:    ['full', 'aggregated', 'minimal'],
      default: 'aggregated',
    },

    sharingEnabled: {
      type:    Boolean,
      default: false,
    },

    members: [memberSchema],

    sharedActivities: [sharedActivitySchema],
  },
  { timestamps: true }
);

progressCircleSchema.index({ childProfileId: 1, 'members.userId': 1 });

module.exports = mongoose.model('ProgressCircle', progressCircleSchema);
