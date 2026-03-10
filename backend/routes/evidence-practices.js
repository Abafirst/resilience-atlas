const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const PracticeCompletion = require('../models/PracticeCompletion');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting: 60 requests per minute per IP
const practicesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(practicesLimiter);

// Valid practice IDs and difficulty levels for input validation
const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);

/**
 * POST /api/evidence-practices/complete
 * Record a practice completion.
 * Authentication is optional — anonymous completions are accepted.
 */
router.post('/complete', async (req, res) => {
  try {
    const { practiceId, reflectionResponse, difficulty_level, framework_principles_engaged } = req.body;

    if (!practiceId || typeof practiceId !== 'string' || practiceId.trim().length === 0) {
      return res.status(400).json({ error: 'practiceId is required.' });
    }

    if (!difficulty_level || !VALID_DIFFICULTIES.has(difficulty_level)) {
      return res.status(400).json({ error: 'difficulty_level must be beginner, intermediate, or advanced.' });
    }

    const truncatedReflection = typeof reflectionResponse === 'string'
      ? reflectionResponse.slice(0, 2000)
      : '';

    const principles = Array.isArray(framework_principles_engaged)
      ? framework_principles_engaged.filter(p => typeof p === 'string').slice(0, 10)
      : [];

    // Optionally extract userId from JWT if present
    let userId;
    try {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded.userId;
      }
    } catch {
      // No valid token — proceed anonymously
    }

    const completion = await PracticeCompletion.create({
      userId: userId || undefined,
      practiceId: practiceId.trim(),
      reflectionResponse: truncatedReflection,
      difficulty_level,
      framework_principles_engaged: principles
    });

    logger.info(`Practice completed: ${practiceId}${userId ? ` by user ${userId}` : ' (anonymous)'}`);

    res.status(201).json({
      message: 'Practice completion recorded.',
      id: completion._id
    });
  } catch (err) {
    logger.error('Practice completion error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/evidence-practices/completions
 * Get all completions for the authenticated user.
 * Requires a valid JWT token.
 */
router.get('/completions', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const completions = await PracticeCompletion
      .find({ userId })
      .sort({ completedAt: -1 })
      .limit(200);

    res.status(200).json({ completions });
  } catch (err) {
    logger.error('Fetch completions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/evidence-practices/completions/week
 * Get completion count for the current week (authenticated user only).
 */
router.get('/completions/week', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const count = await PracticeCompletion.countDocuments({
      userId,
      completedAt: { $gte: oneWeekAgo }
    });

    res.status(200).json({ count });
  } catch (err) {
    logger.error('Weekly completions error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
