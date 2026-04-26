'use strict';

/**
 * waitlist.js — IATLAS specialty waitlist route.
 *
 * Endpoints:
 *   POST /api/iatlas/waitlist  — Add an entry to the IATLAS specialty waitlist
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const Waitlist = require('../models/Waitlist');
const logger   = require('../utils/logger');

const waitlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── POST /api/iatlas/waitlist ─────────────────────────────────────────────────
router.post('/', waitlistLimiter, async (req, res) => {
  try {
    const { email, name, specialty, organization, interestedIn } = req.body;

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format without a regex susceptible to ReDoS —
    // check max length, require exactly one '@', and a '.' in the domain part.
    if (
      normalizedEmail.length > 254 ||
      normalizedEmail.split('@').length !== 2 ||
      !normalizedEmail.split('@')[1].includes('.')
    ) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const validSpecialties = ['teachers', 'slp', 'ot', 'daily-living', 'social-skills', 'clinicians', 'caregivers'];
    if (typeof specialty !== 'string' || !validSpecialties.includes(specialty)) {
      return res.status(400).json({ error: 'A valid specialty is required.' });
    }

    // Check for duplicate entry
    const existing = await Waitlist.findOne({
      email: { $eq: normalizedEmail },
      specialty: { $eq: specialty },
    });
    if (existing) {
      return res.status(409).json({
        error: 'You are already on the waitlist for this specialty.',
        alreadyRegistered: true,
      });
    }

    const entry = new Waitlist({
      email: normalizedEmail,
      name:         typeof name         === 'string' ? name.trim()         : undefined,
      specialty,
      organization: typeof organization === 'string' ? organization.trim() : undefined,
      interestedIn: Array.isArray(interestedIn) ? interestedIn : [],
      source:       'iatlas-curriculum-page',
    });

    await entry.save();

    logger.info(`IATLAS waitlist: new entry specialty=${specialty} email=${normalizedEmail}`);

    return res.status(201).json({
      message: "You've been added to the waitlist! We'll notify you when this specialty launches.",
    });
  } catch (err) {
    // Handle MongoDB duplicate-key error (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'You are already on the waitlist for this specialty.',
        alreadyRegistered: true,
      });
    }
    logger.error('IATLAS waitlist error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

module.exports = router;
