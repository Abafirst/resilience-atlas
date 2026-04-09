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

const MicroQuestSchema = new mongoose.Schema(
  {
    questId:     { type: String, required: true, trim: true },
    dimension:   { type: String, required: true, trim: true },
    completedAt: { type: Date,   default: Date.now },
    pointsEarned:{ type: Number, default: 0 },
  },
  { _id: false }
);

const SkillPathwaySchema = new mongoose.Schema(
  {
    dimension:    { type: String, required: true, trim: true },
    level:        { type: Number, required: true, min: 1, max: 3 },
    completedAt:  { type: Date,   default: Date.now },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const ChoiceQuestSchema = new mongoose.Schema(
  {
    scenarioId:  { type: String, required: true, trim: true },
    choiceKey:   { type: String, required: true, trim: true },
    actPrinciple:{ type: String, default: '' },
    respondedAt: { type: Date,   default: Date.now },
    pointsEarned:{ type: Number, default: 0 },
  },
  { _id: false }
);

const ReinforcementHistorySchema = new mongoose.Schema(
  {
    practiceId:  { type: String, required: true, trim: true },
    dimension:   { type: String, required: true, trim: true },
    completedAt: { type: Date,   default: Date.now },
  },
  { _id: false }
);

const StreakResetSchema = new mongoose.Schema(
  {
    resetAt:        { type: Date, default: Date.now },
    daysMissed:     { type: Number, default: 0 },
    recoveryStarted:{ type: Boolean, default: false },
  },
  { _id: false }
);

// ── Root schema ───────────────────────────────────────────────────────────────

const GamificationProgressSchema = new mongoose.Schema(
  {
    userId: {
      type:     String,
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

    // ── Adult gamification ────────────────────────────────────────────────────
    microQuests:            { type: [MicroQuestSchema],            default: [] },
    skillPathways:          { type: [SkillPathwaySchema],          default: [] },
    choiceQuests:           { type: [ChoiceQuestSchema],           default: [] },
    reinforcementHistory:   { type: [ReinforcementHistorySchema],  default: [] },
    streakResets:           { type: [StreakResetSchema],           default: [] },

    // ── Preferences ──────────────────────────────────────────────────────────
    leaderboardOptIn:      { type: Boolean, default: false },
    notificationsEnabled:  { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Leaderboard: top users by total points (only those who opted in)
GamificationProgressSchema.index({ leaderboardOptIn: 1, totalPoints: -1 });

module.exports = mongoose.model('GamificationProgress', GamificationProgressSchema);
