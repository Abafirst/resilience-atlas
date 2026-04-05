const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const ResilienceResult = require('../models/ResilienceResult');
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiter for auth status checks.
const authStatusLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

// Rate limiter for the user-status endpoint.
const userStatusLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

/**
 * GET /api/auth/profile
 * Get the authenticated user's profile
 */
router.get('/profile', authStatusLimiter, authenticateJWT, async (req, res) => {
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
router.put('/profile', authStatusLimiter, authenticateJWT, async (req, res) => {
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

/**
 * GET /api/auth/user-status
 * Return the quiz-completion and subscription status for a given email.
 * Used by the React SPA after Auth0 login to decide where to redirect the user:
 *   - hasCompletedQuiz = true  → send to /results
 *   - hasCompletedQuiz = false → send to /quiz  (new user)
 *
 * Query params:
 *   email (required) — the authenticated user's email address
 *
 * Response:
 *   {
 *     hasCompletedQuiz:   boolean,
 *     subscription:       { tier: string, purchasedAt: Date } | null,
 *     lastAssessmentDate: Date | null,
 *   }
 *
 * Rate-limited.  No additional authentication required — email is the
 * primary identifier used consistently throughout the individual quiz flow.
 */
router.get('/user-status', userStatusLimiter, async (req, res) => {
    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    try {
        const [lastResult, latestPurchase] = await Promise.all([
            ResilienceResult.findOne({ email: cleanEmail })
                .sort({ createdAt: -1 })
                .select('createdAt')
                .lean(),
            Purchase.findOne({ email: cleanEmail, status: 'completed' })
                .sort({ createdAt: -1 })
                .select('tier purchasedAt')
                .lean(),
        ]);

        return res.json({
            hasCompletedQuiz:   !!lastResult,
            subscription:       latestPurchase
                ? { tier: latestPurchase.tier, purchasedAt: latestPurchase.purchasedAt }
                : null,
            lastAssessmentDate: lastResult ? lastResult.createdAt : null,
        });
    } catch (err) {
        logger.error('User status fetch error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * GET /api/auth/oidc-status
 * Check whether the current request has an active Auth0 (OIDC) session.
 * Used by the frontend purchase flow to decide whether to redirect to login.
 *
 * Returns:
 *   { authenticated: true,  email: string, name: string } — if logged in
 *   { authenticated: false }                               — if not logged in
 */
router.get('/oidc-status', authStatusLimiter, (req, res) => {
    // express-openid-connect attaches req.oidc when the auth() middleware is
    // active.  If Auth0 is not configured (missing env vars) the middleware is
    // absent and req.oidc is undefined — treat that as "not authenticated".
    if (req.oidc && req.oidc.isAuthenticated()) {
        const user = req.oidc.user || {};
        return res.json({
            authenticated: true,
            email: user.email || null,
            name:  user.name  || null,
        });
    }
    return res.json({ authenticated: false });
});

module.exports = router;
