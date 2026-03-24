const express = require('express');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/auth/profile
 * Get the authenticated user's profile
 */
router.get('/profile', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.status(200).json({ user: user.toJSON() });
    } catch (err) {
        logger.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * PUT /api/auth/profile
 * Update the authenticated user's profile
 */
router.put('/profile', authenticateJWT, async (req, res) => {
    try {
        const { username, email } = req.body;
        const updates = {};
        if (username) updates.username = username;
        if (email) updates.email = email;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { ...updates, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({ message: 'Profile updated.', user: user.toJSON() });
    } catch (err) {
        logger.error('Profile update error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
