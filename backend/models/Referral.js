'use strict';

const mongoose = require('mongoose');

/**
 * Referral – tracks a single referral relationship from invitation through reward.
 *
 * Lifecycle:  pending → completed | failed | expired
 *
 * "pending"   – referred user signed up, reward not yet granted
 * "completed" – reward conditions met (e.g. first purchase); credits applied
 * "failed"    – flagged as fraudulent or otherwise ineligible
 * "expired"   – reward window passed with no qualifying action
 */
const referralSchema = new mongoose.Schema(
  {
    // ── Referrer ──────────────────────────────────────────────────────────────
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    referrerCode: {
      type: String,
      required: true,
    },

    // ── Referred user ─────────────────────────────────────────────────────────
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    referredEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'expired'],
      default: 'pending',
      index: true,
    },

    // ── Reward metadata ───────────────────────────────────────────────────────
    referrerRewardType: {
      type: String,
      enum: ['credit', 'discount', 'none'],
      default: 'credit',
    },
    referrerRewardAmount: {
      type: Number,
      default: 10,       // $10 credit by default
    },
    referrerRewardGranted: {
      type: Boolean,
      default: false,
    },

    friendRewardType: {
      type: String,
      enum: ['discount', 'credit', 'none'],
      default: 'discount',
    },
    friendRewardAmount: {
      type: Number,
      default: 15,       // 15% discount on first purchase
    },
    friendRewardGranted: {
      type: Boolean,
      default: false,
    },

    // ── Completion / failure context ──────────────────────────────────────────
    completedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },

    // ── Anti-fraud ────────────────────────────────────────────────────────────
    signupIp: {
      type: String,
      default: null,
    },
    fraudFlag: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ── Compound indexes ────────────────────────────────────────────────────────
referralSchema.index({ referrerId: 1, createdAt: -1 });
referralSchema.index({ referredUserId: 1 });
referralSchema.index({ referrerCode: 1, status: 1 });

module.exports = mongoose.model('Referral', referralSchema);
