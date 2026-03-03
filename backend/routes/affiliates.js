const express = require('express');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/affiliates/dashboard
 * Get affiliate stats for the authenticated user
 */
router.get('/dashboard', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // Count users who were referred by this user
        const referralCount = await User.countDocuments({ referredBy: user.affiliateCode });

        res.status(200).json({
            affiliateCode: user.affiliateCode,
            referralCount,
            affiliateLink: `${process.env.APP_URL || 'https://resilience-atlas.app'}/signup?ref=${user.affiliateCode}`
        });
    } catch (err) {
        logger.error('Affiliate dashboard error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/affiliates/referrals
 * List users referred by the authenticated user
 */
router.get('/referrals', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const referrals = await User.find(
            { referredBy: user.affiliateCode },
            'username email createdAt'
        ).sort({ createdAt: -1 });

        res.status(200).json({ referrals });
    } catch (err) {
        logger.error('Referrals fetch error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
