'use strict';

/**
 * outcomeReports.js — Clinical outcome report routes for Task #22f.
 *
 * All routes require a valid JWT (authenticateJWT) and Practitioner/Practice/
 * Enterprise tier access (requirePractitionerTier).
 *
 * Endpoints (all prefixed with /api/clinical/outcome-reports):
 *
 *   POST /generate               — Generate a new outcome report (PDF + metadata)
 *   GET  /client/:clientId       — List all reports for a given client
 *   GET  /:reportId              — Retrieve a single report (with audit logging)
 *   POST /:reportId/send         — Email a report to a recipient
 *   POST /bulk-generate          — Generate reports for multiple clients
 */

const express    = require('express');
const router     = express.Router();
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const mongoose   = require('mongoose');
const rateLimit  = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const OutcomeReport      = require('../../models/OutcomeReport');
const ClientProfile      = require('../../models/ClientProfile');
const ClientProgressSnapshot = require('../../models/ClientProgressSnapshot');
const SessionNote        = require('../../models/SessionNote');
const ClientMilestone    = require('../../models/ClientMilestone');
const logger             = require('../../utils/logger');

const {
  computeBaselineScores,
  computeCurrentScores,
  buildDimensionProgress,
  countGoalsByStatus,
  topActivities,
  isMilestoneTrigger,
  dimensionNarrative,
  changeColour,
  formatDate,
  DIMENSION_KEYS,
} = require('../../utils/outcomeReportUtils');

// ── Rate limiters ──────────────────────────────────────────────────────────────

const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many report generation requests. Please wait before generating more reports.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Build the pre-computed report data object from DB records.
 * Returns { baselineScores, currentScores, totalSessions, goalsAchieved,
 *           goalsInProgress, dimensionProgress, topActs, milestones,
 *           periodStart, periodEnd, clientLabel }
 */
async function assembleReportData({
  clientProfile,
  snapshots,
  sessionNotes,
  milestones,
  isAnonymized,
}) {
  const baselineScores = computeBaselineScores(snapshots);
  const currentScores  = computeCurrentScores(snapshots);
  const dimensionProgress = buildDimensionProgress(baselineScores, currentScores);

  const goalCounts = countGoalsByStatus(clientProfile.clinicalGoals || []);
  const topActs    = topActivities(sessionNotes);

  const sessionDates = sessionNotes
    .map(n => n.sessionDate)
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b));

  const periodStart = sessionDates[0]    || null;
  const periodEnd   = sessionDates.slice(-1)[0] || null;

  const clientLabel = isAnonymized
    ? `Client-${String(clientProfile._id).slice(-6).toUpperCase()}`
    : (clientProfile.clientIdentifier || String(clientProfile._id));

  return {
    baselineScores,
    currentScores,
    totalSessions:   sessionNotes.length,
    goalsAchieved:   goalCounts.achieved,
    goalsInProgress: goalCounts.inProgress,
    dimensionProgress,
    topActs,
    milestones,
    periodStart,
    periodEnd,
    clientLabel,
    goals: clientProfile.clinicalGoals || [],
  };
}

/**
 * Render a pdfkit PDFDocument for an outcome report.
 * Returns the doc (already piped / ended by the caller).
 *
 * @param {PDFDocument} doc
 * @param {object}      reportData  — output of assembleReportData()
 * @param {string}      reportType  — 'insurance' | 'family' | 'school' | 'summary'
 * @param {object}      practitioner — { name?, credentials? } optional labels
 */
function renderPdf(doc, reportData, reportType, practitioner) {
  const {
    clientLabel,
    periodStart,
    periodEnd,
    totalSessions,
    goalsAchieved,
    goalsInProgress,
    dimensionProgress,
    goals,
    topActs,
    milestones,
  } = reportData;

  const reportTitle = {
    insurance: 'Clinical Outcome Report (Insurance / Clinical Format)',
    family:    'Progress Report for Families',
    school:    'Educational Progress Summary',
    summary:   'Brief Progress Summary',
  }[reportType] || 'Outcome Report';

  // ── Confidential watermark banner ─────────────────────────────────────────
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#cc0000')
    .text('CONFIDENTIAL — For Authorized Use Only', { align: 'center' })
    .fillColor('#000000');

  doc.moveDown(0.5);

  // ── Title ──────────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(reportTitle, { align: 'center' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Generated: ${formatDate(new Date())}`, { align: 'center' });

  doc.moveDown(1.5);

  // ── Client Summary ─────────────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Client Summary', { underline: true });

  doc.moveDown(0.4);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Client: ${clientLabel}`)
    .text(
      `Date Range: ${periodStart ? formatDate(periodStart) : 'N/A'} – ${periodEnd ? formatDate(periodEnd) : 'N/A'}`
    )
    .text(`Total Sessions Completed: ${totalSessions}`);

  if (practitioner && practitioner.name) {
    doc.text(`Practitioner: ${practitioner.name}${practitioner.credentials ? `, ${practitioner.credentials}` : ''}`);
  }

  doc.moveDown(1.5);

  // ── Dimension Progress Analysis ────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Dimension Progress Analysis', { underline: true });

  doc.moveDown(0.4);

  doc
    .fontSize(9)
    .font('Helvetica')
    .text('Baseline = average of first 3 assessments  |  Current = average of last 3 assessments', { indent: 10 });

  doc.moveDown(0.5);

  dimensionProgress.forEach(dp => {
    const colour    = changeColour(dp.change);
    const colourHex = colour === 'green' ? '#1a7a1a' : colour === 'red' ? '#cc0000' : '#8a6800';
    const sign      = dp.change >= 0 ? '+' : '';

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(colourHex)
      .text(`${dp.label}`, { indent: 15, continued: true })
      .fillColor('#000000')
      .font('Helvetica')
      .text(
        `  ${dp.baseline} → ${dp.current}  (${sign}${dp.change} pts, ${sign}${dp.pctChange}%)`,
        { indent: 0 }
      );

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#444444')
      .text(dimensionNarrative(dp), { indent: 25 })
      .fillColor('#000000');

    doc.moveDown(0.3);
  });

  doc.moveDown(1);

  // ── Goal Achievement ───────────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Goal Achievement', { underline: true });

  doc.moveDown(0.4);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Goals Achieved: ${goalsAchieved}   |   In Progress: ${goalsInProgress}   |   Total: ${goals.length}`);

  doc.moveDown(0.5);

  if (goals.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No clinical goals recorded.', { indent: 15 });
  } else {
    goals.forEach(goal => {
      const statusIcon = goal.status === 'achieved' ? '✅'
        : goal.status === 'active' || goal.status === 'in-progress' ? '🔄'
        : '⏸';

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${statusIcon}  ${goal.goal || goal.description || '(no description)'}`, { indent: 15, continued: false });

      const meta = [
        `Status: ${goal.status || 'unknown'}`,
        goal.priority ? `Priority: ${goal.priority}` : null,
        goal.targetDate ? `Target: ${formatDate(goal.targetDate)}` : null,
        goal.achievedAt ? `Achieved: ${formatDate(goal.achievedAt)}` : null,
      ].filter(Boolean).join('  |  ');

      if (meta) {
        doc.fontSize(9).font('Helvetica').fillColor('#444444').text(meta, { indent: 25 }).fillColor('#000000');
      }
      doc.moveDown(0.3);
    });
  }

  doc.moveDown(1);

  // ── Session Highlights ─────────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Session Highlights', { underline: true });

  doc.moveDown(0.4);

  // Most effective activities
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Most-Used Activities', { indent: 10 });

  doc.moveDown(0.3);

  if (topActs.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No activity data available.', { indent: 20 });
  } else {
    topActs.forEach((act, i) => {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`${i + 1}. Activity ID: ${act.activityId}  (used ${act.count} time${act.count !== 1 ? 's' : ''})`, { indent: 20 });
    });
  }

  doc.moveDown(0.7);

  // Key milestones
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Key Milestones', { indent: 10 });

  doc.moveDown(0.3);

  if (!milestones || milestones.length === 0) {
    doc.fontSize(10).font('Helvetica').text('No milestones recorded.', { indent: 20 });
  } else {
    milestones.slice(0, 10).forEach(m => {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`• ${m.title}  (${formatDate(m.achievedDate)})`, { indent: 20 });
      if (m.description) {
        doc.fontSize(9).fillColor('#444444').text(m.description, { indent: 30 }).fillColor('#000000');
      }
      doc.moveDown(0.2);
    });
  }

  doc.moveDown(1);

  // ── Recommendations ────────────────────────────────────────────────────────
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Recommendations', { underline: true });

  doc.moveDown(0.4);

  // Identify dimensions needing the most work (largest negative or smallest positive change).
  const sorted = [...dimensionProgress].sort((a, b) => a.change - b.change);
  const focusAreas = sorted.slice(0, 2);

  if (focusAreas.every(dp => dp.change === 0)) {
    doc.fontSize(10).font('Helvetica').text(
      'Continue the current therapeutic approach across all dimensions.',
      { indent: 15 }
    );
  } else {
    focusAreas.forEach(dp => {
      doc.fontSize(10).font('Helvetica').text(
        `• Consider targeted interventions for ${dp.label} (current: ${dp.current}/100).`,
        { indent: 15 }
      );
    });
  }

  const improving = dimensionProgress.filter(dp => dp.change > 0);
  if (improving.length > 0) {
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').text(
      `• Maintain activities supporting ${improving.map(dp => dp.label).join(', ')}.`,
      { indent: 15 }
    );
  }

  if (isMilestoneTrigger(totalSessions)) {
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor('#1a7a1a').text(
      `🎉 Milestone reached: ${totalSessions} sessions completed!`,
      { indent: 15 }
    ).fillColor('#000000');
  }

  doc.moveDown(2);

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#cc0000')
    .text('CONFIDENTIAL — For Authorized Clinical Use Only', { align: 'center' })
    .fillColor('#666666')
    .text('This report was generated by the IATLAS Resilience Platform.', { align: 'center' });
}

// ── Routes ────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/outcome-reports/generate
// Generate a new outcome report for a client.
// Body: { clientProfileId, reportType?, isAnonymized?, practitionerName?, practitionerCredentials? }
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/generate',
  generateLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      if (!practitionerId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      const {
        clientProfileId,
        reportType      = 'summary',
        isAnonymized    = false,
        practitionerName,
        practitionerCredentials,
      } = req.body;

      if (!clientProfileId || !mongoose.Types.ObjectId.isValid(clientProfileId)) {
        return res.status(400).json({ error: 'clientProfileId must be a valid ObjectId.' });
      }

      const validTypes = OutcomeReport.VALID_REPORT_TYPES;
      if (!validTypes.includes(reportType)) {
        return res.status(400).json({ error: `reportType must be one of: ${validTypes.join(', ')}.` });
      }

      // Verify ownership.
      const clientProfile = await ClientProfile.findById(clientProfileId).lean();
      if (!clientProfile || clientProfile.practitionerId !== practitionerId) {
        return res.status(404).json({ error: 'Client profile not found.' });
      }

      // Fetch supporting data in parallel.
      const [snapshots, sessionNotes, milestones] = await Promise.all([
        ClientProgressSnapshot.find(
          { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) }
        ).sort({ snapshotDate: 1 }).lean(),

        SessionNote.find(
          { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId), isDeleted: false }
        ).sort({ sessionDate: 1 }).lean(),

        ClientMilestone.find(
          { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) }
        ).sort({ achievedDate: -1 }).lean(),
      ]);

      const reportData = await assembleReportData({
        clientProfile,
        snapshots,
        sessionNotes,
        milestones,
        isAnonymized,
      });

      // Persist metadata first so we have a reportId.
      const report = await OutcomeReport.create({
        practitionerId,
        clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
        reportType,
        periodStart:    reportData.periodStart,
        periodEnd:      reportData.periodEnd,
        totalSessions:  reportData.totalSessions,
        goalsAchieved:  reportData.goalsAchieved,
        goalsInProgress: reportData.goalsInProgress,
        baselineScores: reportData.baselineScores,
        currentScores:  reportData.currentScores,
        isAnonymized,
        accessedBy:     [practitionerId],
        generatedAt:    new Date(),
      });

      const practitioner = {
        name:        practitionerName        || null,
        credentials: practitionerCredentials || null,
      };

      // ── Build and stream PDF ───────────────────────────────────────────────
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="outcome-report-${report._id}.pdf"`
      );
      // Surface the report ID so callers can reference it without parsing the body.
      res.setHeader('X-Report-Id', String(report._id));

      doc.pipe(res);
      renderPdf(doc, reportData, reportType, practitioner);
      doc.end();

      logger.info(`[outcomeReports] Report ${report._id} generated for client ${clientProfileId} by ${practitionerId}`);
    } catch (err) {
      logger.error('[outcomeReports] POST /generate error:', err);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Failed to generate report.' });
      }
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clinical/outcome-reports/client/:clientId
// List all outcome reports for a given client.
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/client/:clientId',
  standardLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      if (!practitionerId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      const { clientId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ error: 'clientId must be a valid ObjectId.' });
      }

      // Verify ownership.
      const clientProfile = await ClientProfile.findById(clientId).lean();
      if (!clientProfile || clientProfile.practitionerId !== practitionerId) {
        return res.status(404).json({ error: 'Client profile not found.' });
      }

      const reports = await OutcomeReport.find({
        practitionerId,
        clientProfileId: new mongoose.Types.ObjectId(clientId),
      })
        .sort({ generatedAt: -1 })
        .lean();

      return res.json({ reports });
    } catch (err) {
      logger.error('[outcomeReports] GET /client/:clientId error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clinical/outcome-reports/:reportId
// Retrieve a single outcome report (metadata only; PDF must be re-generated).
// Records access in the audit trail.
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/:reportId',
  standardLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      if (!practitionerId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      const { reportId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({ error: 'reportId must be a valid ObjectId.' });
      }

      const report = await OutcomeReport.findOneAndUpdate(
        { _id: reportId, practitionerId },
        { $addToSet: { accessedBy: practitionerId } },
        { new: true }
      ).lean();

      if (!report) {
        return res.status(404).json({ error: 'Report not found.' });
      }

      return res.json(report);
    } catch (err) {
      logger.error('[outcomeReports] GET /:reportId error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/outcome-reports/:reportId/send
// Email an outcome report to a recipient.
// Body: { email, subject?, message?, passwordProtect? }
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/:reportId/send',
  standardLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      if (!practitionerId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      const { reportId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({ error: 'reportId must be a valid ObjectId.' });
      }

      const { email, subject, message } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const report = await OutcomeReport.findOne({ _id: reportId, practitionerId }).lean();
      if (!report) {
        return res.status(404).json({ error: 'Report not found.' });
      }

      // Look up client for the report.
      const clientProfile = await ClientProfile.findById(report.clientProfileId).lean();

      const clientLabel = report.isAnonymized
        ? `Client-${String(report.clientProfileId).slice(-6).toUpperCase()}`
        : (clientProfile?.clientIdentifier || String(report.clientProfileId));

      // Build email transport.  Falls back to a stub when SMTP is not configured.
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const fromAddress = process.env.SMTP_FROM || 'noreply@iatlas.app';

      if (!smtpHost || !smtpUser || !smtpPass) {
        logger.warn('[outcomeReports] SMTP not configured — email delivery skipped');
        // Persist the attempted delivery in the audit trail.
        await OutcomeReport.updateOne(
          { _id: reportId },
          { $addToSet: { sentToEmails: email } }
        );
        return res.json({ sent: false, reason: 'SMTP not configured on this server.', email });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const emailSubject = subject ||
        `Outcome Report for ${clientLabel} — ${new Date(report.generatedAt).toLocaleDateString('en-US')}`;

      const emailBody = message ||
        `Please find attached the latest outcome report for ${clientLabel}.\n\n` +
        `This report covers ${formatDate(report.periodStart)} to ${formatDate(report.periodEnd)} ` +
        `and includes ${report.totalSessions} session(s).\n\n` +
        `This message is confidential and intended solely for the named recipient.`;

      await transporter.sendMail({
        from:    fromAddress,
        to:      email,
        subject: emailSubject,
        text:    emailBody,
      });

      // Audit trail.
      await OutcomeReport.updateOne(
        { _id: reportId },
        { $addToSet: { sentToEmails: email } }
      );

      logger.info(`[outcomeReports] Report ${reportId} sent to ${email} by ${practitionerId}`);
      return res.json({ sent: true, email });
    } catch (err) {
      logger.error('[outcomeReports] POST /:reportId/send error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/clinical/outcome-reports/bulk-generate
// Generate outcome reports for multiple clients at once.
// Body: { clientProfileIds: string[], reportType?, isAnonymized? }
// Returns metadata for each generated report (PDFs not streamed for bulk).
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/bulk-generate',
  generateLimiter,
  authenticateJWT,
  requirePractitionerTier,
  async (req, res) => {
    try {
      const practitionerId = resolveUserId(req);
      if (!practitionerId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }

      const {
        clientProfileIds,
        reportType   = 'summary',
        isAnonymized = false,
      } = req.body;

      if (!Array.isArray(clientProfileIds) || clientProfileIds.length === 0) {
        return res.status(400).json({ error: 'clientProfileIds must be a non-empty array.' });
      }

      const validTypes = OutcomeReport.VALID_REPORT_TYPES;
      if (!validTypes.includes(reportType)) {
        return res.status(400).json({ error: `reportType must be one of: ${validTypes.join(', ')}.` });
      }

      const invalid = clientProfileIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalid.length > 0) {
        return res.status(400).json({ error: `Invalid ObjectIds: ${invalid.join(', ')}.` });
      }

      const results = [];

      for (const clientProfileId of clientProfileIds) {
        try {
          const clientProfile = await ClientProfile.findById(clientProfileId).lean();
          if (!clientProfile || clientProfile.practitionerId !== practitionerId) {
            results.push({ clientProfileId, success: false, error: 'Client profile not found.' });
            continue;
          }

          const [snapshots, sessionNotes, milestones] = await Promise.all([
            ClientProgressSnapshot.find(
              { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) }
            ).sort({ snapshotDate: 1 }).lean(),

            SessionNote.find(
              { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId), isDeleted: false }
            ).sort({ sessionDate: 1 }).lean(),

            ClientMilestone.find(
              { practitionerId, clientProfileId: new mongoose.Types.ObjectId(clientProfileId) }
            ).sort({ achievedDate: -1 }).lean(),
          ]);

          const reportData = await assembleReportData({
            clientProfile,
            snapshots,
            sessionNotes,
            milestones,
            isAnonymized,
          });

          const report = await OutcomeReport.create({
            practitionerId,
            clientProfileId: new mongoose.Types.ObjectId(clientProfileId),
            reportType,
            periodStart:     reportData.periodStart,
            periodEnd:       reportData.periodEnd,
            totalSessions:   reportData.totalSessions,
            goalsAchieved:   reportData.goalsAchieved,
            goalsInProgress: reportData.goalsInProgress,
            baselineScores:  reportData.baselineScores,
            currentScores:   reportData.currentScores,
            isAnonymized,
            accessedBy:      [practitionerId],
            generatedAt:     new Date(),
          });

          results.push({ clientProfileId, success: true, reportId: String(report._id) });
          logger.info(`[outcomeReports] Bulk: report ${report._id} for client ${clientProfileId}`);
        } catch (innerErr) {
          logger.error(`[outcomeReports] Bulk error for ${clientProfileId}:`, innerErr);
          results.push({ clientProfileId, success: false, error: 'Failed to generate report.' });
        }
      }

      return res.json({ results, total: clientProfileIds.length, succeeded: results.filter(r => r.success).length });
    } catch (err) {
      logger.error('[outcomeReports] POST /bulk-generate error:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

module.exports = router;
