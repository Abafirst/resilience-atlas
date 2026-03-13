const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const AnalyticsEvent = require('../models/Analytics');

// ── GET /admin/leads ────────────────────────────────────────
// List all leads (filterable by stage).
router.get('/leads', async (req, res) => {
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
// Update lead stage or notes.
router.patch('/leads/:id', async (req, res) => {
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
// Summary of tracked analytics events.
router.get('/analytics', async (req, res) => {
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

module.exports = router;
