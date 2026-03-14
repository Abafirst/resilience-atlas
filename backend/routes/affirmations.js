const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateJWT } = require('../middleware/auth');
const UserAffirmation = require('../models/UserAffirmation');
const CustomAffirmation = require('../models/CustomAffirmation');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting: 60 requests per minute per IP
const affirmationsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(affirmationsLimiter);

const VALID_RESILIENCE_TYPES = new Set([
  'Cognitive-Narrative',
  'Relational',
  'Agentic-Generative',
  'Emotional-Adaptive',
  'Spiritual-Existential',
  'Somatic-Regulative',
]);

/**
 * Extract optional userId from JWT. Returns undefined if no valid token present.
 */
function extractUserId(req) {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded.id || decoded.userId;
    }
  } catch { /* No valid token — anonymous */ }
  return undefined;
}

/**
 * POST /api/affirmations/rate
 * Rate an affirmation 1–5.
 * Authentication is optional — anonymous ratings are accepted.
 */
router.post('/rate', async (req, res) => {
  try {
    const { affirmationId, rating } = req.body;

    if (!affirmationId || typeof affirmationId !== 'string' || affirmationId.trim().length === 0) {
      return res.status(400).json({ error: 'affirmationId is required.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
    }

    const userId = extractUserId(req);
    const filter = userId
      ? { userId, affirmationId: affirmationId.trim() }
      : { affirmationId: affirmationId.trim(), userId: { $exists: false } };

    const update = {
      $set: { rating: parsedRating, lastEngagedAt: new Date() },
      $setOnInsert: { firstEngagedAt: new Date() },
      $inc: { engagementCount: 1 },
    };

    await UserAffirmation.findOneAndUpdate(filter, update, { upsert: true, new: true });

    logger.info(`Affirmation rated: ${affirmationId} → ${parsedRating}${userId ? ` by user ${userId}` : ' (anonymous)'}`);

    res.status(200).json({ message: 'Rating saved.' });
  } catch (err) {
    logger.error('Affirmation rate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/affirmations/favorite
 * Save or un-save an affirmation as a favorite.
 * Authentication is optional.
 */
router.post('/favorite', async (req, res) => {
  try {
    const { affirmationId, isFavorited } = req.body;

    if (!affirmationId || typeof affirmationId !== 'string' || affirmationId.trim().length === 0) {
      return res.status(400).json({ error: 'affirmationId is required.' });
    }

    if (typeof isFavorited !== 'boolean') {
      return res.status(400).json({ error: 'isFavorited must be a boolean.' });
    }

    const userId = extractUserId(req);
    const filter = userId
      ? { userId, affirmationId: affirmationId.trim() }
      : { affirmationId: affirmationId.trim(), userId: { $exists: false } };

    const update = {
      $set: { isFavorited, lastEngagedAt: new Date() },
      $setOnInsert: { firstEngagedAt: new Date() },
      $inc: { engagementCount: 1 },
    };

    await UserAffirmation.findOneAndUpdate(filter, update, { upsert: true, new: true });

    logger.info(`Affirmation ${isFavorited ? 'favorited' : 'un-favorited'}: ${affirmationId}${userId ? ` by user ${userId}` : ' (anonymous)'}`);

    res.status(200).json({ message: `Affirmation ${isFavorited ? 'saved as favorite' : 'removed from favorites'}.` });
  } catch (err) {
    logger.error('Affirmation favorite error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/affirmations/personalized
 * Get the user's top affirmations sorted by rating and engagement.
 * Requires JWT authentication.
 */
router.get('/personalized', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const records = await UserAffirmation
      .find({ userId })
      .sort({ isFavorited: -1, rating: -1, engagementCount: -1 })
      .limit(20);

    res.status(200).json({ affirmations: records });
  } catch (err) {
    logger.error('Personalized affirmations error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/affirmations/custom
 * Create a custom affirmation.
 * Authentication is optional.
 */
router.post('/custom', async (req, res) => {
  try {
    const { text, resilience_type } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'text is required.' });
    }

    if (text.trim().length > 300) {
      return res.status(400).json({ error: 'text must be 300 characters or fewer.' });
    }

    if (!resilience_type || !VALID_RESILIENCE_TYPES.has(resilience_type)) {
      return res.status(400).json({
        error: `resilience_type must be one of: ${[...VALID_RESILIENCE_TYPES].join(', ')}.`,
      });
    }

    const userId = extractUserId(req);

    const custom = await CustomAffirmation.create({
      userId: userId || undefined,
      text: text.trim(),
      resilience_type,
    });

    logger.info(`Custom affirmation created${userId ? ` by user ${userId}` : ' (anonymous)'}`);

    res.status(201).json({ message: 'Custom affirmation saved.', id: custom._id });
  } catch (err) {
    logger.error('Custom affirmation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/affirmations/by-type
 * Return all affirmation IDs and metadata for a resilience type.
 * This endpoint returns the static library data, no auth required.
 */
router.get('/by-type', (req, res) => {
  const { type } = req.query;

  if (!type || !VALID_RESILIENCE_TYPES.has(type)) {
    return res.status(400).json({
      error: `type query param must be one of: ${[...VALID_RESILIENCE_TYPES].join(', ')}.`,
    });
  }

  // The full affirmation library lives in the frontend JS bundle;
  // this endpoint returns metadata for server-side use or API consumers.
  const AFFIRMATION_IDS_BY_TYPE = {
    'Cognitive-Narrative': ['cn-aff-01','cn-aff-02','cn-aff-03','cn-aff-04','cn-aff-05','cn-aff-06','cn-aff-07'],
    'Relational':          ['re-aff-01','re-aff-02','re-aff-03','re-aff-04','re-aff-05','re-aff-06','re-aff-07'],
    'Agentic-Generative':  ['ag-aff-01','ag-aff-02','ag-aff-03','ag-aff-04','ag-aff-05','ag-aff-06','ag-aff-07'],
    'Emotional-Adaptive':  ['ea-aff-01','ea-aff-02','ea-aff-03','ea-aff-04','ea-aff-05','ea-aff-06','ea-aff-07'],
    'Spiritual-Existential':['se-aff-01','se-aff-02','se-aff-03','se-aff-04','se-aff-05','se-aff-06','se-aff-07'],
    'Somatic-Regulative':  ['sb-aff-01','sb-aff-02','sb-aff-03','sb-aff-04','sb-aff-05','sb-aff-06','sb-aff-07'],
  };

  res.status(200).json({
    type,
    affirmationIds: AFFIRMATION_IDS_BY_TYPE[type] || [],
  });
});

module.exports = router;
