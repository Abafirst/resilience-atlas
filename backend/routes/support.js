'use strict';

/**
 * support.js — Support ticket CRUD routes for the IATLAS priority support system.
 *
 * All routes require a valid JWT (authenticateJWT middleware).
 *
 * Endpoints:
 *   POST /api/support/tickets              — Create new support ticket
 *   GET  /api/support/tickets              — List authenticated user's tickets
 *   GET  /api/support/tickets/:id          — Get a single ticket
 *   POST /api/support/tickets/:id/reply    — Add a reply to a ticket
 */

const express     = require('express');
const router      = express.Router();
const rateLimit   = require('express-rate-limit');
const mongoose    = require('mongoose');

const { authenticateJWT } = require('../middleware/auth');
const SupportTicket        = require('../models/SupportTicket');
const { getIATLASTier }    = require('../utils/iatlasHelpers');
const logger               = require('../utils/logger');

// ── Rate limiter ──────────────────────────────────────────────────────────────

const supportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(supportLimiter);

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

// ── POST /api/support/tickets — Create new support ticket ────────────────────

router.post('/tickets', authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const { category, subject, description, attachments } = req.body;

    if (!category || !subject || !description) {
      return res.status(400).json({ error: 'category, subject, and description are required.' });
    }

    const userTier  = await getIATLASTier(userId);
    const userEmail = req.user.email || '';
    const userName  = req.user.name  || req.user.email || '';

    const ticket = new SupportTicket({
      userId,
      userEmail,
      userName,
      userTier,
      category,
      subject:     subject.trim(),
      description: description.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    await ticket.save();

    logger.info('[support] Ticket created', {
      ticketId: ticket._id,
      userId,
      userTier,
      priority: ticket.priority,
    });

    return res.status(201).json({
      success: true,
      ticket:  ticket.toObject(),
      message: 'Support ticket created successfully',
    });
  } catch (error) {
    logger.error('[support] Error creating support ticket:', { message: error.message });
    return res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// ── GET /api/support/tickets — List authenticated user's tickets ──────────────

router.get('/tickets', authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const tickets = await SupportTicket.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ tickets });
  } catch (error) {
    logger.error('[support] Error fetching tickets:', { message: error.message });
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// ── GET /api/support/tickets/:id — Get single ticket ─────────────────────────

router.get('/tickets/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
    }

    const ticket = await SupportTicket.findOne({ _id: id, userId }).lean();
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json({ ticket });
  } catch (error) {
    logger.error('[support] Error fetching ticket:', { message: error.message });
    return res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// ── POST /api/support/tickets/:id/reply — Add reply to ticket ────────────────

router.post('/tickets/:id/reply', authenticateJWT, async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated.' });

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
    }

    const { message, attachments } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required.' });
    }

    const ticket = await SupportTicket.findOne({ _id: id, userId });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.replies.push({
      author:      'user',
      message:     message.trim(),
      timestamp:   new Date(),
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    // Re-open ticket when customer replies (unless already resolved/closed)
    if (!['resolved', 'closed'].includes(ticket.status)) {
      ticket.status = 'open';
    }

    await ticket.save();

    return res.json({
      success: true,
      ticket:  ticket.toObject(),
    });
  } catch (error) {
    logger.error('[support] Error adding reply:', { message: error.message });
    return res.status(500).json({ error: 'Failed to add reply' });
  }
});

module.exports = router;
