'use strict';

/**
 * UserProgress.js — Mongoose model for IATLAS user progress persistence.
 *
 * Stores all local progress data (adult IATLAS modules, kids activities,
 * XP, badges, streaks, quests) in MongoDB so progress syncs across
 * devices and survives browser cache clears.
 *
 * One document per (userId, childProfileId) pair:
 *   - Adult progress:  userId set, childProfileId = null
 *   - Kids progress:   userId set, childProfileId = '<profileId>'
 */

const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const StreakSchema = new mongoose.Schema(
  {
    current:          { type: Number, default: 0 },
    longest:          { type: Number, default: 0 },
    lastActivityDate: { type: String, default: null },
  },
  { _id: false }
);

const QuestSchema = new mongoose.Schema(
  {
    questId:     { type: String, required: true, trim: true },
    status:      { type: String, enum: ['active', 'completed', 'failed', 'abandoned'], default: 'active' },
    progress:    { type: Number, default: 0 },
    completedAt: { type: Date,   default: null },
  },
  { _id: false }
);

const KidsActivitySchema = new mongoose.Schema(
  {
    completed:   { type: Boolean, default: false },
    stars:       { type: Number,  default: 0 },
    completedAt: { type: Date,    default: null },
  },
  { _id: false }
);

const KidsAdventureSchema = new mongoose.Schema(
  {
    adventureId: { type: String, required: true, trim: true },
    status:      { type: String, default: 'active' },
    progress:    { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const UserProgressSchema = new mongoose.Schema(
  {
    // Auth0 user ID (sub)
    userId: {
      type:     String,
      required: true,
      trim:     true,
      index:    true,
    },

    // null for adult progress; child profile ID for kids progress
    childProfileId: {
      type:    String,
      default: null,
      index:   true,
    },

    // 'adult' | 'kids'
    progressType: {
      type:    String,
      enum:    ['adult', 'kids'],
      default: 'adult',
    },

    // ── Adult progress ────────────────────────────────────────────────────────

    // Full skill progress object: { [dimensionKey]: { [skillId]: { completedAt, xpEarned } } }
    skillProgress: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    completedModules: {
      type:    [String],
      default: [],
    },

    xp: {
      type:    Number,
      default: 0,
    },

    level: {
      type:    Number,
      default: 1,
    },

    badges: {
      type:    [String],
      default: [],
    },

    streaks: {
      type:    StreakSchema,
      default: () => ({}),
    },

    quests: {
      type:    [QuestSchema],
      default: [],
    },

    // ── Kids progress ─────────────────────────────────────────────────────────

    // Keyed by activityId
    kidsActivities: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    kidsBadges: {
      type:    [String],
      default: [],
    },

    kidsStreaks: {
      type:    StreakSchema,
      default: () => ({}),
    },

    kidsAdventures: {
      type:    [KidsAdventureSchema],
      default: [],
    },

    // Extra raw blobs for forward compatibility (dimension streaks, activity feed, reflections, etc.)
    rawAdultData:  { type: mongoose.Schema.Types.Mixed, default: {} },
    rawKidsData:   { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── Timestamps ────────────────────────────────────────────────────────────
    lastSyncedAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// Compound index: one document per (userId, childProfileId)
UserProgressSchema.index({ userId: 1, childProfileId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);
