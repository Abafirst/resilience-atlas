const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Lead = require('../models/Lead');
const AnalyticsEvent = require('../models/Analytics');
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/auth');

// Rate limit: 60 requests per minute for admin routes
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(adminLimiter);

// Simple admin check middleware — verifies the authenticated user has admin role.
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
  next();
}

// ── GET /admin/leads ────────────────────────────────────────
// List all leads (filterable by stage). Admin-only.
router.get('/leads', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { stage, page = 1, limit = 50 } = req.query;
    const filter = stage ? { stage } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Lead.countDocuments(filter),
    ]);

    return res.json({ leads, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('admin/leads GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

// ── PATCH /admin/leads/:id ──────────────────────────────────
// Update lead stage or notes. Admin-only.
router.patch('/leads/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { stage, notes } = req.body;
    const update = {};
    if (stage) update.stage = stage;
    if (notes !== undefined) update.notes = notes;

    const lead = await Lead.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!lead) return res.status(404).json({ error: 'Lead not found.' });

    return res.json({ lead });
  } catch (err) {
    console.error('admin/leads PATCH error:', err);
    return res.status(500).json({ error: 'Failed to update lead.' });
  }
});

// ── GET /admin/analytics ────────────────────────────────────
// Summary of tracked analytics events. Admin-only.
router.get('/analytics', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const summary = await AnalyticsEvent.aggregate([
      { $group: { _id: '$event', count: { $sum: 1 }, last: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
    ]);

    return res.json({ summary });
  } catch (err) {
    console.error('admin/analytics GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
});

// ── GET /admin/users ────────────────────────────────────────
// List all users with optional role filter. Admin-only.
router.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = role ? { role } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('email username role createdAt organization_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('admin/users GET error:', err);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ── PATCH /admin/users/:id/role ─────────────────────────────
// Update a user's platform-level role (admin / member). Admin-only.
router.patch('/users/:id/role', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: "role must be 'admin' or 'member'." });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    // Prevent self-demotion
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('email username role').lean();

    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.json({ user });
  } catch (err) {
    console.error('admin/users/role PATCH error:', err);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

module.exports = router;
