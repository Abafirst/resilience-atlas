'use strict';

/**
 * user-consent.js — Endpoints for managing assessment sharing consent.
 *
 * Endpoints:
 *   POST /api/user/consent          — Update sharing consent for a specific assessment
 *   GET  /api/user/consent/history  — View consent history for the authenticated user
 *   PUT  /api/user/consent/default  — Update the user's default consent preference
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const { authenticateJWT } = require('../middleware/auth');
const ResilienceResult    = require('../models/ResilienceResult');
const User                = require('../models/User');

const router = express.Router();

const consentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(consentLimiter);

// ── POST /api/user/consent ────────────────────────────────────────────────────

/**
 * Update sharing consent for a specific assessment result.
 *
 * Body: { assessmentId, consent (boolean), goals (string, optional) }
 * The assessmentId must belong to the authenticated user.
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const { assessmentId, consent, goals } = req.body;

    if (typeof consent !== 'boolean') {
      return res.status(400).json({ error: '`consent` must be a boolean.' });
    }

    if (!assessmentId || !mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ error: 'Valid `assessmentId` is required.' });
    }

    const safeGoals = consent && goals
      ? String(goals).trim().slice(0, 1000)
      : null;

    // Verify the assessment belongs to this user
    const assessment = await ResilienceResult.findOne({ _id: assessmentId, userId }).lean();
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found or does not belong to you.' });
    }

    // Update the assessment consent
    await ResilienceResult.findByIdAndUpdate(assessmentId, {
      sharingConsent:     consent,
      sharingConsentDate: new Date(),
      sharingGoals:       safeGoals,
    });

    // Append to user's consent history for audit trail
    await User.findByIdAndUpdate(userId, {
      $push: {
        consentHistory: {
          assessmentId,
          consent,
          date:  new Date(),
          goals: safeGoals,
        },
      },
    });

    res.json({
      success:       true,
      assessmentId,
      consent,
      consentDate:   new Date(),
    });
  } catch (err) {
    console.error('POST /api/user/consent error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/user/consent/history ────────────────────────────────────────────

/**
 * Returns the authenticated user's consent history and current consent state
 * for all their assessments linked to an organization.
 */
router.get('/history', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const user = await User.findById(userId, {
      consentHistory: 1,
      defaultSharingConsent: 1,
    }).lean();

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Return all org-linked assessments with their consent status
    const assessments = await ResilienceResult.find(
      { userId, organizationId: { $ne: null } },
      {
        _id: 1,
        organizationId: 1,
        createdAt: 1,
        sharingConsent: 1,
        sharingConsentDate: 1,
        sharingGoals: 1,
        overall: 1,
        overall_score: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      defaultSharingConsent: user.defaultSharingConsent ?? false,
      consentHistory:        user.consentHistory || [],
      assessments:           assessments.map((a) => ({
        assessmentId:      a._id,
        organizationId:    a.organizationId,
        completedAt:       a.createdAt,
        sharingConsent:    a.sharingConsent ?? null,
        sharingConsentDate: a.sharingConsentDate ?? null,
        sharingGoals:      a.sharingGoals ?? null,
        overallScore:      a.overall ?? a.overall_score ?? null,
      })),
    });
  } catch (err) {
    console.error('GET /api/user/consent/history error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/user/consent/default ────────────────────────────────────────────

/**
 * Update the user's default consent preference for future assessments.
 *
 * Body: { defaultConsent (boolean) }
 */
router.put('/default', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const { defaultConsent } = req.body;

    if (typeof defaultConsent !== 'boolean') {
      return res.status(400).json({ error: '`defaultConsent` must be a boolean.' });
    }

    await User.findByIdAndUpdate(userId, {
      defaultSharingConsent: defaultConsent,
    });

    res.json({ success: true, defaultSharingConsent: defaultConsent });
  } catch (err) {
    console.error('PUT /api/user/consent/default error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
