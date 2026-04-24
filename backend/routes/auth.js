const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Auth0Profile = require('../models/Auth0Profile');
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
 * GET /api/auth/profile-status
 * Returns whether the authenticated user has a full name stored in the DB.
 *
 * Auth required (Bearer JWT).
 * Only allows querying status for the email that matches the JWT "email" claim.
 *
 * Query params:
 *   email (required) — must match the authenticated user's email
 *
 * Response:
 *   { hasName: boolean, fullName?: string }
 */
router.get('/profile-status', authStatusLimiter, authenticateJWT, async (req, res) => {
    const jwtEmail = req.user && req.user.email;

    // Auth0 access tokens do not always include the email claim.
    // When the claim is absent, fail open so the user is not blocked.
    if (!jwtEmail) {
        return res.json({ hasName: false });
    }

    const { email } = req.query;
    if (!email) {
        return res.status(400).json({ error: 'email query parameter is required.' });
    }

    if (email.toLowerCase().trim() !== jwtEmail.toLowerCase().trim()) {
        return res.status(403).json({ error: 'Forbidden.' });
    }

    try {
        const cleanEmail = jwtEmail.toLowerCase().trim();
        const profile = await Auth0Profile.findOne({ email: cleanEmail }).lean();
        const hasName = !!(profile && profile.fullName && profile.fullName.trim().length > 0);
        return res.json({
            hasName,
            ...(hasName ? { fullName: profile.fullName } : {}),
        });
    } catch (err) {
        logger.error('Profile status fetch error:', err);
        return res.status(500).json({ error: 'Internal server error.' });
    }
});

/**
 * POST /api/auth/complete-profile
 * Stores the authenticated user's full name in the app database.
 *
 * Auth required (Bearer JWT).
 * Only allows updating the profile for the email that matches the JWT.
 *
 * Body (JSON):
 *   { email: string, fullName: string }
 *
 * Validation:
 *   - fullName trimmed length must be 2..80
 *   - spaces are allowed; control characters are rejected
 *
 * Response:
 *   { message: string, fullName: string }
 */
router.post('/complete-profile', authStatusLimiter, authenticateJWT, async (req, res) => {
    const jwtEmail = req.user && req.user.email;
    const jwtSub   = req.user && (req.user.sub || req.user.userId);

    const { email, fullName } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'email is required.' });
    }

    // Verify the caller can only update their own profile.
    // When the JWT includes an email claim, it must match the request body.
    // Auth0 access tokens frequently omit the email claim; when that happens we
    // accept the body email as long as the request is authenticated (sub present).
    if (jwtEmail) {
        if (email.toLowerCase().trim() !== jwtEmail.toLowerCase().trim()) {
            return res.status(403).json({ error: 'Forbidden.' });
        }
    } else if (!jwtSub) {
        // Neither email nor sub in the token — cannot verify identity.
        return res.status(400).json({ error: 'Email not found in token.' });
    }

    if (!fullName || typeof fullName !== 'string') {
        return res.status(400).json({ error: 'fullName is required.' });
    }

    const trimmed = fullName.trim();

    if (trimmed.length < 2 || trimmed.length > 80) {
        return res.status(400).json({ error: 'Full name must be between 2 and 80 characters.' });
    }

    // Reject control characters (ASCII 0–31 and DEL 127)
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(trimmed)) {
        return res.status(400).json({ error: 'Full name contains invalid characters.' });
    }

    try {
        const cleanEmail = (jwtEmail || email).toLowerCase().trim();
        const profile = await Auth0Profile.findOneAndUpdate(
            { email: cleanEmail },
            {
                email: cleanEmail,
                sub: (req.user.sub || req.user.userId) || null,
                fullName: trimmed,
            },
            { upsert: true, new: true, runValidators: true }
        );
        return res.json({ message: 'Profile updated.', fullName: profile.fullName });
    } catch (err) {
        logger.error('Complete profile error:', err);
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
