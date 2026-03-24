'use strict';

/**
 * Referral / Affiliate routes – full referral program.
 *
 * Endpoints:
 *  GET  /api/affiliates/dashboard      – referral stats + share content
 *  GET  /api/affiliates/referrals      – paginated referral list (with status)
 *  GET  /api/affiliates/leaderboard    – top referrers (?period=monthly|alltime)
 *  GET  /api/affiliates/analytics      – conversion rates + reward tracking
 *  GET  /api/affiliates/share-content  – pre-written share messages
 *  POST /api/affiliates/complete/:userId – mark referral completed
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const User       = require('../models/User');
const Referral   = require('../models/Referral');
const { authenticateJWT } = require('../middleware/auth');
const referralService     = require('../services/referralService');
const logger     = require('../utils/logger');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(limiter);

/* ── Helpers ──────────────────────────────────────────────────────────────── */

async function getOrCreateUser(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  if (!user.affiliateCode) {
    await referralService.ensureAffiliateCode(user);
  }
  return user;
}

/* ── GET /api/affiliates/dashboard ────────────────────────────────────────── */
router.get('/dashboard', authenticateJWT, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const analytics = await referralService.getUserAnalytics(user._id.toString());
    const share     = referralService.getShareContent({
      username:      user.username,
      affiliateCode: user.affiliateCode,
    });
    const badge = referralService.getReferralBadge(analytics.completed);

    res.status(200).json({
      affiliateCode:   user.affiliateCode,
      referralLink:    share.link,
      rewardBalance:   user.referralCredits       || 0,
      rewardsEarned:   user.referralRewardsEarned || 0,
      stats:           analytics,
      currentBadge:    badge,
      shareContent:    share,
      friendDiscount:  referralService.FRIEND_DISCOUNT,
      referrerCredit:  referralService.REFERRER_CREDIT,
    });
  } catch (err) {
    logger.error('Referral dashboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/* ── GET /api/affiliates/referrals ─────────────────────────────────────────
 * Query: ?page=1&limit=20&status=pending|completed|failed
 */
router.get('/referrals', authenticateJWT, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip  = (page - 1) * limit;

    const filter = { referrerId: user._id };
    if (req.query.status) filter.status = req.query.status;

    const [referrals, total] = await Promise.all([
      Referral.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('referredUserId', 'username createdAt'),
      Referral.countDocuments(filter),
    ]);

    res.status(200).json({
      referrals: referrals.map((r) => ({
        id:                   r._id,
        status:               r.status,
        referredEmail:        r.referredEmail,
        referredUsername:     r.referredUserId ? r.referredUserId.username : null,
        signupDate:           r.createdAt,
        completedAt:          r.completedAt,
        referrerRewardAmount: r.referrerRewardAmount,
        friendRewardAmount:   r.friendRewardAmount,
        rewardGranted:        r.referrerRewardGranted,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error('Referrals fetch error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/* ── GET /api/affiliates/leaderboard ─────────────────────────────────────────
 * Query: ?period=monthly|alltime&limit=20
 */
router.get('/leaderboard', authenticateJWT, async (req, res) => {
  try {
    const period = ['monthly', 'alltime'].includes(req.query.period)
      ? req.query.period : 'alltime';
    const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));

    const leaderboard = await referralService.getLeaderboard(period, limit);
    res.status(200).json({ period, leaderboard });
  } catch (err) {
    logger.error('Referral leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/* ── GET /api/affiliates/analytics ───────────────────────────────────────── */
router.get('/analytics', authenticateJWT, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const analytics = await referralService.getUserAnalytics(user._id.toString());

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Referral.aggregate([
      { $match: { referrerId: user._id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:       { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      summary:          analytics,
      rewardBalance:    user.referralCredits       || 0,
      rewardsEarned:    user.referralRewardsEarned || 0,
      monthlyBreakdown: monthly.map((m) => ({
        year:       m._id.year,
        month:      m._id.month,
        total:      m.total,
        completed:  m.completed,
        conversion: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
      })),
    });
  } catch (err) {
    logger.error('Referral analytics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/* ── GET /api/affiliates/share-content ───────────────────────────────────── */
router.get('/share-content', authenticateJWT, async (req, res) => {
  try {
    const user = await getOrCreateUser(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const share = referralService.getShareContent({
      username:      user.username,
      affiliateCode: user.affiliateCode,
    });
    res.status(200).json(share);
  } catch (err) {
    logger.error('Share content error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/* ── POST /api/affiliates/complete/:referredUserId ───────────────────────── */
router.post('/complete/:referredUserId', authenticateJWT, async (req, res) => {
  try {
    if (
      req.user.userId !== req.params.referredUserId &&
      req.user.role   !== 'admin'
    ) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const referral = await referralService.completeReferral(req.params.referredUserId);
    if (!referral) {
      return res.status(404).json({ error: 'No pending referral found for this user.' });
    }

    res.status(200).json({ message: 'Referral completed and rewards granted.', referral });
  } catch (err) {
    logger.error('Referral completion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
