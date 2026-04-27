'use strict';

/**
 * iatlas-tier-waitlist.js — Waitlist route for coming-soon IATLAS pricing tiers.
 *
 * Endpoints:
 *   POST /api/iatlas/tier-waitlist — Add a user to the waitlist for a coming-soon tier
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const IATLASTierWaitlist = require('../models/IATLASTierWaitlist');
const logger             = require('../utils/logger');

const tierWaitlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const VALID_TIERS = ['practice', 'enterprise'];

// ── POST /api/iatlas/tier-waitlist ────────────────────────────────────────────
router.post('/', tierWaitlistLimiter, async (req, res) => {
  try {
    const { tier, email, name, organization } = req.body;

    // Validate required fields
    if (!tier || !email || !name) {
      return res.status(400).json({ error: 'Missing required fields: tier, email, name' });
    }

    if (!VALID_TIERS.includes(tier)) {
      return res.status(400).json({ error: `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}` });
    }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'Email must be a string.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic email format check (avoids ReDoS-prone regexes)
    if (
      normalizedEmail.length > 254 ||
      normalizedEmail.split('@').length !== 2 ||
      !normalizedEmail.split('@')[1].includes('.')
    ) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Check for duplicate entry
    const existing = await IATLASTierWaitlist.findOne({
      email: { $eq: normalizedEmail },
      tier:  { $eq: tier },
    });

    if (existing) {
      return res.status(200).json({
        message: 'You are already on the waitlist for this tier.',
        alreadyJoined: true,
      });
    }

    const entry = new IATLASTierWaitlist({
      tier,
      email:        normalizedEmail,
      name:         typeof name         === 'string' ? name.trim()         : undefined,
      organization: typeof organization === 'string' ? organization.trim() : undefined,
    });

    await entry.save();

    logger.info(`IATLAS tier waitlist: new entry tier=${tier} email=${normalizedEmail}`);

    return res.status(201).json({
      message: "You've been added to the waitlist! We'll notify you when this tier launches.",
      tier,
    });
  } catch (err) {
    // Handle MongoDB duplicate-key error (race condition safety net)
    if (err.code === 11000) {
      return res.status(200).json({
        message: 'You are already on the waitlist for this tier.',
        alreadyJoined: true,
      });
    }
    logger.error('IATLAS tier waitlist error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

module.exports = router;
