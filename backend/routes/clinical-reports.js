'use strict';

/**
 * clinical-reports.js — IATLAS clinical outcome report routes.
 *
 * All routes require a valid JWT (authenticateJWT) and Practitioner/Practice/
 * Enterprise tier access (requirePractitionerTier).
 *
 * Endpoints:
 *   GET  /api/iatlas/clinical/outcome-reports/:clientId
 *        — Generate a PDF outcome report for the given client
 *   GET  /api/iatlas/clinical/outcome-reports
 *        — List all client progress records for the practitioner
 *   POST /api/iatlas/clinical/outcome-reports
 *        — Create or update a client progress record
 *   GET  /api/iatlas/clinical/outcome-reports/:clientId/progress
 *        — Get raw progress data (JSON) for a client
 *   PUT  /api/iatlas/clinical/outcome-reports/:clientId/session
 *        — Add a session entry to the client's history
 *   PUT  /api/iatlas/clinical/outcome-reports/:clientId/goals
 *        — Update treatment goals for a client
 *   PUT  /api/iatlas/clinical/outcome-reports/:clientId/assessment
 *        — Update baseline or current assessment scores
 */

const express      = require('express');
const router       = express.Router();
const PDFDocument  = require('pdfkit');
const crypto       = require('crypto');
const rateLimit    = require('express-rate-limit');
const mongoose     = require('mongoose');

const { authenticateJWT, requirePractitionerTier } = require('../middleware/auth');
const ClientProgress = require('../models/ClientProgress');
const logger         = require('../utils/logger');

// ── Rate limiter ──────────────────────────────────────────────────────────────

const reportsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Map an internal camelCase dimension key to a human-readable label.
 */
function formatDimensionName(dim) {
  const names = {
    agenticGenerative:    'Agentic-Generative',
    somaticRegulative:    'Somatic-Regulative',
    cognitiveNarrative:   'Cognitive-Interpretive',
    relationalConnective: 'Relational-Connective',
    emotionalAdaptive:    'Emotional-Adaptive',
    spiritualExistential: 'Spiritual-Existential',
  };
  return names[dim] || dim;
}

const DIMENSIONS = [
  'agenticGenerative',
  'somaticRegulative',
  'cognitiveNarrative',
  'relationalConnective',
  'emotionalAdaptive',
  'spiritualExistential',
];

// ── Routes ────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/outcome-reports
// List all client progress records owned by the authenticated practitioner.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const records = await ClientProgress.find({ practitionerId: practitionerId.toString() })
      .select('clientId sessionHistory treatmentGoals baselineAssessment currentAssessment createdAt updatedAt')
      .lean();

    return res.json(records);
  } catch (err) {
    logger.error('[clinical-reports] GET / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/iatlas/clinical/outcome-reports
// Create a new client progress record (or upsert by clientId).
// Body: { clientId, baselineAssessment?, treatmentGoals? }
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { clientId, baselineAssessment, treatmentGoals } = req.body;

    if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
      return res.status(400).json({ error: 'clientId is required.' });
    }

    const update = {
      $setOnInsert: { practitionerId: practitionerId.toString(), clientId: clientId.trim() },
    };

    if (baselineAssessment) update.$set = { ...(update.$set || {}), baselineAssessment };
    if (Array.isArray(treatmentGoals)) update.$set = { ...(update.$set || {}), treatmentGoals };

    const record = await ClientProgress.findOneAndUpdate(
      { practitionerId: practitionerId.toString(), clientId: clientId.trim() },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logger.info(`[clinical-reports] Upserted progress for client ${clientId} by ${practitionerId}`);
    return res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      // Race-condition duplicate — fetch and return existing record.
      try {
        const practitionerId = resolveUserId(req);
        const existing = await ClientProgress.findOne({
          practitionerId: practitionerId.toString(),
          clientId: req.body.clientId?.trim(),
        }).lean();
        if (existing) return res.json(existing);
      } catch { /* fall through */ }
    }
    logger.error('[clinical-reports] POST / error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/outcome-reports/:clientId/progress
// Return raw JSON progress data for a specific client.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:clientId/progress', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { clientId } = req.params;

    const record = await ClientProgress.findOne({
      clientId:        clientId.toString(),
      practitionerId:  practitionerId.toString(),
    }).lean();

    if (!record) {
      return res.status(404).json({ error: 'Client progress record not found.' });
    }

    return res.json(record);
  } catch (err) {
    logger.error('[clinical-reports] GET /:clientId/progress error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/clinical/outcome-reports/:clientId/session
// Append a new session entry to the client's history.
// Body: { sessionDate?, sessionNumber?, focus?, dimensionScores?, protocolsUsed?,
//         clinicalNotes?, outcomeMeasures? }
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:clientId/session', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { clientId } = req.params;
    const {
      sessionDate,
      sessionNumber,
      focus,
      dimensionScores,
      protocolsUsed,
      clinicalNotes,
      outcomeMeasures,
    } = req.body;

    const record = await ClientProgress.findOne({
      clientId:       clientId.toString(),
      practitionerId: practitionerId.toString(),
    });

    if (!record) {
      return res.status(404).json({ error: 'Client progress record not found.' });
    }

    record.sessionHistory.push({
      sessionId:     crypto.randomUUID(),
      sessionDate:   sessionDate   || null,
      sessionNumber: sessionNumber || null,
      focus:         focus         || '',
      dimensionScores: dimensionScores || {},
      protocolsUsed:   Array.isArray(protocolsUsed) ? protocolsUsed : [],
      clinicalNotes:   clinicalNotes || '',
      outcomeMeasures: outcomeMeasures || {},
    });

    await record.save();
    logger.info(`[clinical-reports] Added session to client ${clientId} by ${practitionerId}`);
    return res.json(record);
  } catch (err) {
    logger.error('[clinical-reports] PUT /:clientId/session error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/clinical/outcome-reports/:clientId/goals
// Replace or update treatment goals for a client.
// Body: { treatmentGoals: [...] }
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:clientId/goals', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { clientId } = req.params;
    const { treatmentGoals } = req.body;

    if (!Array.isArray(treatmentGoals)) {
      return res.status(400).json({ error: 'treatmentGoals must be an array.' });
    }

    const record = await ClientProgress.findOneAndUpdate(
      { clientId: clientId.toString(), practitionerId: practitionerId.toString() },
      { $set: { treatmentGoals } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ error: 'Client progress record not found.' });
    }

    return res.json(record);
  } catch (err) {
    logger.error('[clinical-reports] PUT /:clientId/goals error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/iatlas/clinical/outcome-reports/:clientId/assessment
// Update baseline or current assessment scores.
// Body: { type: 'baseline' | 'current', date?, dimensionScores: {...} }
// ─────────────────────────────────────────────────────────────────────────────

router.put('/:clientId/assessment', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { clientId } = req.params;
    const { type, date, dimensionScores } = req.body;

    if (!['baseline', 'current'].includes(type)) {
      return res.status(400).json({ error: "type must be 'baseline' or 'current'." });
    }
    if (!dimensionScores || typeof dimensionScores !== 'object') {
      return res.status(400).json({ error: 'dimensionScores is required.' });
    }

    const field = type === 'baseline' ? 'baselineAssessment' : 'currentAssessment';
    const record = await ClientProgress.findOneAndUpdate(
      { clientId: clientId.toString(), practitionerId: practitionerId.toString() },
      { $set: { [field]: { date: date || new Date(), dimensionScores } } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ error: 'Client progress record not found.' });
    }

    return res.json(record);
  } catch (err) {
    logger.error('[clinical-reports] PUT /:clientId/assessment error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/iatlas/clinical/outcome-reports/:clientId
// Generate a PDF outcome report for the given client.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:clientId', reportsLimiter, authenticateJWT, requirePractitionerTier, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    if (!practitionerId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { clientId } = req.params;

    const clientProgress = await ClientProgress.findOne({
      clientId:       clientId.toString(),
      practitionerId: practitionerId.toString(),
    });

    if (!clientProgress) {
      return res.status(404).json({ error: 'Client progress record not found.' });
    }

    // ── Build PDF ─────────────────────────────────────────────────────────────

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="client-outcome-report-${encodeURIComponent(clientId)}.pdf"`
    );

    doc.pipe(res);

    // ── Cover header ──────────────────────────────────────────────────────────
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Clinical Outcome Report', { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

    doc.moveDown(1.5);

    // ── Client summary ────────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Client Summary', { underline: true });

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Client ID: ${clientId}`)
      .text(`Total Sessions: ${clientProgress.sessionHistory.length}`)
      .text(`Treatment Start: ${clientProgress.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

    doc.moveDown(1.5);

    // ── Dimensional progress summary ──────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Dimensional Progress Summary', { underline: true });

    doc.moveDown(0.5);

    DIMENSIONS.forEach((dim) => {
      const baseline = clientProgress.baselineAssessment?.dimensionScores?.[dim] ?? 0;
      const current  = clientProgress.currentAssessment?.dimensionScores?.[dim]  ?? 0;
      const change   = current - baseline;
      const sign     = change >= 0 ? '+' : '';

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          `${formatDimensionName(dim)}: ${baseline} → ${current} (${sign}${change})`,
          { indent: 20 }
        );
    });

    doc.moveDown(1.5);

    // ── Treatment goals ───────────────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Treatment Goals', { underline: true });

    doc.moveDown(0.5);

    if (clientProgress.treatmentGoals.length === 0) {
      doc.fontSize(10).font('Helvetica').text('No treatment goals recorded.', { indent: 20 });
    } else {
      clientProgress.treatmentGoals.forEach((goal) => {
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`• ${goal.description}`, { indent: 20, continued: false });

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `  Progress: ${goal.progressPercent}% | Status: ${goal.status}` +
              (goal.targetDate
                ? ` | Target: ${new Date(goal.targetDate).toLocaleDateString('en-US')}`
                : ''),
            { indent: 30 }
          );

        doc.moveDown(0.3);
      });
    }

    doc.moveDown(1.5);

    // ── Recent session outcomes ───────────────────────────────────────────────
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Recent Session Outcomes (last 5 sessions)', { underline: true });

    doc.moveDown(0.5);

    const recentSessions = clientProgress.sessionHistory.slice(-5);

    if (recentSessions.length === 0) {
      doc.fontSize(10).font('Helvetica').text('No session history recorded.', { indent: 20 });
    } else {
      recentSessions.forEach((session) => {
        const dateStr = session.sessionDate
          ? new Date(session.sessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : 'Date unknown';

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Session ${session.sessionNumber ?? '—'} — ${dateStr}`, { indent: 20 });

        if (session.focus) {
          doc.font('Helvetica').text(`Focus: ${session.focus}`, { indent: 30 });
        }

        const subj = session.outcomeMeasures?.subjective ?? '—';
        const obj  = session.outcomeMeasures?.objective  ?? '—';
        doc.font('Helvetica').text(`Subjective: ${subj}/10 | Objective: ${obj}/10`, { indent: 30 });

        doc.moveDown(0.5);
      });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc
      .fontSize(8)
      .font('Helvetica')
      .moveDown(2)
      .text('Confidential — For Clinical Use Only', { align: 'center' });

    doc.end();

    logger.info(`[clinical-reports] PDF generated for client ${clientId} by ${practitionerId}`);
  } catch (err) {
    logger.error('[clinical-reports] GET /:clientId (PDF) error:', err);
    // Only send error JSON if headers haven't been flushed yet.
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate report.' });
    }
  }
});

module.exports = router;
