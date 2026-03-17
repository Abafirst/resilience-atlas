'use strict';

/**
 * GamificationProgress Model
 *
 * Stores all gamification state for a user: streaks, points, badges,
 * weekly challenges and preferences. One document per user.
 */
const mongoose = require('mongoose');

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const PointEventSchema = new mongoose.Schema(
  {
    date:        { type: Date,   default: Date.now },
    type:        { type: String, required: true, trim: true },
    points:      { type: Number, required: true },
    description: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const BadgeSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    unlockedAt: { type: Date,   default: Date.now },
    rarity:     { type: String, enum: ['common', 'uncommon', 'rare', 'legendary'], default: 'common' },
    icon:       { type: String, default: '' },
  },
  { _id: false }
);

const ChallengeHistorySchema = new mongoose.Schema(
  {
    week:      { type: Number, required: true },
    year:      { type: Number, required: true },
    dimension: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    date:      { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────

const GamificationProgressSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },

    // ── Streaks ──────────────────────────────────────────────────────────────
    currentStreak: {
      days:             { type: Number, default: 0 },
      startDate:        { type: Date,   default: null },
      lastPracticeDate: { type: Date,   default: null },
    },
    longestStreak: { type: Number, default: 0 },

    // ── Points ───────────────────────────────────────────────────────────────
    totalPoints:  { type: Number, default: 0 },
    pointHistory: { type: [PointEventSchema], default: [] },

    // ── Badges ───────────────────────────────────────────────────────────────
    badges: { type: [BadgeSchema], default: [] },

    // ── Weekly challenge ─────────────────────────────────────────────────────
    currentChallenge: {
      dimension:     { type: String, default: null },
      week:          { type: Number, default: null },
      year:          { type: Number, default: null },
      completedDays: { type: Number, default: 0 },
      reward:        { type: Number, default: 10 },
      difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    },
    completedChallenges: { type: Number, default: 0 },
    challengeHistory:    { type: [ChallengeHistorySchema], default: [] },

    // ── Preferences ──────────────────────────────────────────────────────────
    leaderboardOptIn:      { type: Boolean, default: false },
    notificationsEnabled:  { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Efficient per-user lookups
GamificationProgressSchema.index({ userId: 1 });

// Leaderboard: top users by total points (only those who opted in)
GamificationProgressSchema.index({ leaderboardOptIn: 1, totalPoints: -1 });

module.exports = mongoose.model('GamificationProgress', GamificationProgressSchema);
