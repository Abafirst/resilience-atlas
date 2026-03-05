const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');
const { authResponse } = require('../utils/responseHelper');

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, referralCode } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required.' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists.' });
        }

        const user = new User({
            username,
            email,
            password,
            referredBy: referralCode || null
        });

        // Generate unique affiliate code
        user.affiliateCode = `RA-${username.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        await user.save();

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info(`New user registered: ${username}`);

        res.status(201).json(authResponse('User registered successfully.', token, user.toJSON()));
    } catch (err) {
        logger.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info(`User logged in: ${user.username}`);

        res.status(200).json(authResponse('Login successful.', token, user.toJSON()));
    } catch (err) {
        logger.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

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
