const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const AnalyticsEvent = require('../models/Analytics');

// ── POST /api/growth/team-lead ───────────────────────────────
// Capture a B2B team/organisation lead from the /team page.
router.post('/team-lead', async (req, res) => {
  try {
    const { company_name, contact_name, email, team_size, message } = req.body;

    if (!company_name || !contact_name || !email) {
      return res.status(400).json({ error: 'company_name, contact_name and email are required.' });
    }

    const lead = await Lead.create({ company_name, contact_name, email, team_size, message });

    // Record analytics event (best-effort)
    try {
      await AnalyticsEvent.create({
        event: 'lead_submitted',
        properties: { company_name, team_size },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) { /* non-fatal */ }

    return res.status(201).json({ success: true, id: lead._id });
  } catch (err) {
    console.error('growth/team-lead error:', err);
    return res.status(500).json({ error: 'Failed to save lead.' });
  }
});

// ── POST /api/growth/track ──────────────────────────────────
// Track a generic growth/analytics event.
router.post('/track', async (req, res) => {
  try {
    const { event, sessionId, properties } = req.body;

    const allowed = [
      'quiz_started', 'quiz_completed', 'report_purchased',
      'results_shared', 'team_invite_sent', 'email_captured',
      'lead_submitted', 'insights_viewed',
    ];

    if (!event || !allowed.includes(event)) {
      return res.status(400).json({ error: 'Invalid or missing event name.' });
    }

    await AnalyticsEvent.create({
      event,
      sessionId: sessionId || null,
      properties: properties || {},
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('growth/track error:', err);
    return res.status(500).json({ error: 'Failed to record event.' });
  }
});

// ── POST /api/growth/email-capture ─────────────────────────
// Capture email after quiz completion (newsletter / report).
router.post('/email-capture', async (req, res) => {
  try {
    const { email, sessionId, optInNewsletter } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    // Record analytics event (best-effort)
    try {
      await AnalyticsEvent.create({
        event: 'email_captured',
        sessionId: sessionId || null,
        properties: { optInNewsletter: !!optInNewsletter },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    } catch (_) { /* non-fatal */ }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('growth/email-capture error:', err);
    return res.status(500).json({ error: 'Failed to capture email.' });
  }
});

module.exports = router;
