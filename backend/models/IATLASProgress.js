'use strict';

/**
 * IATLASProgress.js — Mongoose model for IATLAS completion-based progress tracking.
 *
 * Tracks activity completions, badges, XP, and streaks WITHOUT storing any
 * assessment scores or performance ratings.  Progress is purely based on:
 *   - Activities completed per dimension
 *   - Badges unlocked from completion milestones
 *   - XP earned for engagement
 *   - Consecutive-day streaks
 *
 * One document per (userId, childProfileId) pair:
 *   - Adult progress : userId set, childProfileId = null
 *   - Kids progress  : userId set, childProfileId = '<profileId>'
 */

const mongoose = require('mongoose');

// ── Completed activity entry ───────────────────────────────────────────────────

const CompletedActivitySchema = new mongoose.Schema(
  {
    activityId:  { type: String, required: true, trim: true },
    completedAt: { type: Date,   default: () => new Date() },
    dimension:   { type: String, trim: true },
    ageGroup:    { type: String, trim: true },
    notes:       { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// ── Unlocked badge entry ───────────────────────────────────────────────────────

const UnlockedBadgeSchema = new mongoose.Schema(
  {
    badgeId:     { type: String, required: true, trim: true },
    unlockedAt:  { type: Date,   default: () => new Date() },
    dimension:   { type: String, trim: true, default: null },
    milestone:   { type: String, trim: true },
  },
  { _id: false }
);

// ── XP history entry ──────────────────────────────────────────────────────────

const XPEntrySchema = new mongoose.Schema(
  {
    amount:   { type: Number, required: true },
    reason:   { type: String, trim: true },
    earnedAt: { type: Date,   default: () => new Date() },
  },
  { _id: false }
);

// ── Journey milestone entry ───────────────────────────────────────────────────

const MilestoneEntrySchema = new mongoose.Schema(
  {
    milestoneId: { type: String, required: true, trim: true },
    achievedAt:  { type: Date,   default: () => new Date() },
    title:       { type: String, trim: true },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const IATLASProgressSchema = new mongoose.Schema(
  {
    // Auth0 user ID (string sub), consistent with UserProgress model
    userId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // null for adult / parent; child profile ID string for kids progress
    childProfileId: {
      type:    String,
      trim:    true,
      default: null,
      index:   true,
    },

    // ── Activity completion tracking ─────────────────────────────────────────

    completedActivities: {
      type:    [CompletedActivitySchema],
      default: [],
    },

    // ── Completion counts by dimension ───────────────────────────────────────

    dimensionProgress: {
      'agentic-generative':   { type: Number, default: 0 },
      'somatic-regulative':   { type: Number, default: 0 },
      'cognitive-narrative':  { type: Number, default: 0 },
      'relational-connective':{ type: Number, default: 0 },
      'emotional-adaptive':   { type: Number, default: 0 },
      'spiritual-existential':{ type: Number, default: 0 },
    },

    // ── Badge system ─────────────────────────────────────────────────────────

    unlockedBadges: {
      type:    [UnlockedBadgeSchema],
      default: [],
    },

    // ── XP system ────────────────────────────────────────────────────────────

    totalXP: { type: Number, default: 0 },

    xpHistory: {
      type:    [XPEntrySchema],
      default: [],
    },

    // ── Streak tracking ──────────────────────────────────────────────────────

    currentStreak:    { type: Number, default: 0 },
    longestStreak:    { type: Number, default: 0 },
    lastActivityDate: { type: Date,   default: null },

    // ── Journey milestones ───────────────────────────────────────────────────

    milestones: {
      type:    [MilestoneEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

// Compound index: one document per (userId, childProfileId)
IATLASProgressSchema.index({ userId: 1, childProfileId: 1 }, { unique: true });

module.exports = mongoose.model('IATLASProgress', IATLASProgressSchema);
