'use strict';

/**
 * referralService – business logic for the referral program.
 *
 * Responsibilities:
 *  - Generate unique affiliate codes
 *  - Record new referrals on signup
 *  - Mark referrals as completed after qualifying action (first purchase)
 *  - Apply referrer + friend rewards
 *  - Leaderboard queries
 *  - Conversion-rate analytics
 *  - Anti-fraud: duplicate IP detection and duplicate-email checks
 */

const crypto = require('crypto');
const User = require('../models/User');
const Referral = require('../models/Referral');
const logger = require('../utils/logger');

// ── Constants ────────────────────────────────────────────────────────────────
const REFERRER_CREDIT   = 10;  // credits awarded to referrer on completion
const FRIEND_DISCOUNT   = 15;  // percent discount for friend on first purchase

// Fraud threshold: max sign-ups from the same IP allowed within the window
const FRAUD_IP_LIMIT    = 3;
const FRAUD_IP_WINDOW_H = 24;  // hours

// ── Helper: generate unique affiliate code ────────────────────────────────────
function generateAffiliateCode(username) {
  const tag      = username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const random   = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RA-${tag}-${random}`;
}

/**
 * Ensure the user has an affiliateCode; generate one if missing.
 * @param {import('../models/User')} user – Mongoose document
 * @returns {Promise<string>} the affiliate code
 */
async function ensureAffiliateCode(user) {
  if (user.affiliateCode) return user.affiliateCode;

  let code;
  let attempts = 0;
  do {
    code = generateAffiliateCode(user.username);
    attempts++;
    // eslint-disable-next-line no-await-in-loop
    const existing = await User.findOne({ affiliateCode: code });
    if (!existing) break;
  } while (attempts < 10);

  user.affiliateCode = code;
  await user.save();
  return code;
}

/**
 * Anti-fraud: count how many sign-ups from a given IP occurred in the last
 * FRAUD_IP_WINDOW_H hours.  Returns true if this IP is suspicious.
 * @param {string} ip
 * @returns {Promise<boolean>}
 */
async function isSuspiciousIp(ip) {
  if (!ip) return false;
  const windowStart = new Date(Date.now() - FRAUD_IP_WINDOW_H * 60 * 60 * 1000);
  const count = await Referral.countDocuments({
    signupIp: ip,
    createdAt: { $gte: windowStart },
  });
  return count >= FRAUD_IP_LIMIT;
}

/**
 * Record a new referral when a user signs up via a referral link.
 *
 * @param {{
 *   referrerCode: string,
 *   referredUser: import('../models/User'),
 *   signupIp: string|null
 * }} opts
 * @returns {Promise<import('../models/Referral')|null>}
 */
async function recordReferral({ referrerCode, referredUser, signupIp }) {
  try {
    if (!referrerCode) return null;

    // Find referrer
    const referrer = await User.findOne({ affiliateCode: referrerCode });
    if (!referrer) {
      logger.warn(`Referral signup: unknown referrerCode "${referrerCode}"`);
      return null;
    }

    // Self-referral guard
    if (referrer._id.toString() === referredUser._id.toString()) {
      logger.warn(`Self-referral attempt by user ${referredUser._id}`);
      return null;
    }

    // Duplicate check: same referred user in a previous referral
    const duplicate = await Referral.findOne({ referredUserId: referredUser._id });
    if (duplicate) {
      logger.warn(`Duplicate referral for user ${referredUser._id}`);
      return null;
    }

    // IP fraud check
    const suspicious = await isSuspiciousIp(signupIp);

    const referral = new Referral({
      referrerId:      referrer._id,
      referrerCode,
      referredUserId:  referredUser._id,
      referredEmail:   referredUser.email,
      signupIp,
      fraudFlag:       suspicious,
      status:          suspicious ? 'failed' : 'pending',
      failureReason:   suspicious ? 'Suspicious IP address' : null,
    });

    await referral.save();
    logger.info(`Referral recorded: ${referrer.username} → ${referredUser.username}`);
    return referral;
  } catch (err) {
    logger.error('referralService.recordReferral error:', err);
    return null;
  }
}

/**
 * Mark a referral as completed and apply rewards.
 * Called after a qualifying action (e.g. first purchase).
 *
 * @param {string} referredUserId
 * @returns {Promise<import('../models/Referral')|null>}
 */
async function completeReferral(referredUserId) {
  try {
    const referral = await Referral.findOne({
      referredUserId,
      status: 'pending',
      fraudFlag: false,
    });
    if (!referral) return null;

    // Apply referrer reward
    await User.findByIdAndUpdate(referral.referrerId, {
      $inc: {
        referralCredits:       REFERRER_CREDIT,
        referralRewardsEarned: REFERRER_CREDIT,
      },
    });

    referral.status                 = 'completed';
    referral.completedAt            = new Date();
    referral.referrerRewardGranted  = true;
    referral.friendRewardGranted    = true;
    referral.referrerRewardAmount   = REFERRER_CREDIT;
    referral.friendRewardAmount     = FRIEND_DISCOUNT;
    await referral.save();

    logger.info(`Referral completed for user ${referredUserId}`);
    return referral;
  } catch (err) {
    logger.error('referralService.completeReferral error:', err);
    return null;
  }
}

/**
 * Return leaderboard data – top referrers by completed referrals.
 *
 * @param {'monthly'|'alltime'} period
 * @param {number} limit
 * @returns {Promise<Array<{rank, username, referralCount, rewards}>>}
 */
async function getLeaderboard(period = 'alltime', limit = 20) {
  const match = { status: 'completed', fraudFlag: false };
  if (period === 'monthly') {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    match.completedAt = { $gte: start };
  }

  const rows = await Referral.aggregate([
    { $match: match },
    { $group: { _id: '$referrerId', referralCount: { $sum: 1 } } },
    { $sort: { referralCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from:         'users',
        localField:   '_id',
        foreignField: '_id',
        as:           'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id:           0,
        userId:        '$_id',
        username:      '$user.username',
        referralCount: 1,
        rewards:       { $multiply: ['$referralCount', REFERRER_CREDIT] },
      },
    },
  ]);

  return rows.map((row, i) => ({ rank: i + 1, ...row }));
}

/**
 * Referral analytics for a single user.
 *
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getUserAnalytics(userId) {
  const [total, completed, failed, pending] = await Promise.all([
    Referral.countDocuments({ referrerId: userId }),
    Referral.countDocuments({ referrerId: userId, status: 'completed' }),
    Referral.countDocuments({ referrerId: userId, status: 'failed' }),
    Referral.countDocuments({ referrerId: userId, status: 'pending' }),
  ]);

  return {
    total,
    completed,
    failed,
    pending,
    conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    totalRewardsEarned: completed * REFERRER_CREDIT,
  };
}

/**
 * Get share content (pre-written messages) for a user.
 *
 * @param {{username: string, affiliateCode: string}} user
 * @returns {{link, twitter, linkedin, whatsapp, email}}
 */
function getShareContent(user) {
  const appUrl = process.env.APP_URL || 'https://resilience-atlas.app';
  const link   = `${appUrl}/signup?ref=${user.affiliateCode}`;
  const msg    = `I've been using Resilience Atlas to build mental, emotional, and social resilience. Get ${FRIEND_DISCOUNT}% off your first assessment when you sign up with my link!`;

  return {
    link,
    twitter:   `${msg} 🧠✨ ${link}`,
    linkedin:  `${msg}\n\n${link}`,
    whatsapp:  `${msg} ${link}`,
    email: {
      subject: `Join me on Resilience Atlas – ${FRIEND_DISCOUNT}% off for you!`,
      body:    `Hi,\n\n${msg}\n\nClick here to get started: ${link}\n\nSee you inside!\n${user.username}`,
    },
  };
}

/**
 * Milestone badges for referral achievements.
 * Returns the badge name for a given completed-referral count, or null.
 *
 * @param {number} completedCount
 * @returns {string|null}
 */
function getReferralBadge(completedCount) {
  if (completedCount >= 50) return 'Referral Legend';
  if (completedCount >= 25) return 'Network Builder';
  if (completedCount >= 10) return 'Referral Master';
  if (completedCount >= 5)  return 'Community Champion';
  if (completedCount >= 1)  return 'First Referral';
  return null;
}

module.exports = {
  generateAffiliateCode,
  ensureAffiliateCode,
  isSuspiciousIp,
  recordReferral,
  completeReferral,
  getLeaderboard,
  getUserAnalytics,
  getShareContent,
  getReferralBadge,
  REFERRER_CREDIT,
  FRIEND_DISCOUNT,
};
