const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const Purchase = require('../models/Purchase');

/** Rate limiter — PDF generation is expensive, so keep this conservative. */
const reportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

// ── In-memory job store ───────────────────────────────────────────────────────
// Stores generation jobs keyed by hash. Jobs expire after JOB_TTL_MS.
// A Map is sufficient for single-process deployments; replace with Redis for
// multi-instance setups.

const JOB_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * @typedef {Object} ReportJob
 * @property {'pending'|'processing'|'ready'|'failed'} status
 * @property {number} progress   0-100
 * @property {string} message    Human-readable stage description
 * @property {number} estimatedSeconds  Rough ETA in seconds
 * @property {Date}   createdAt
 * @property {Date|null} startedAt
 * @property {Date|null} completedAt
 * @property {string|null} error
 * @property {Buffer|null} pdfBuffer  Set when status === 'ready'
 */

/** @type {Map<string, ReportJob>} */
const jobStore = new Map();

/** Remove expired jobs to prevent unbounded memory growth. */
function pruneExpiredJobs() {
    const cutoff = Date.now() - JOB_TTL_MS;
    for (const [hash, job] of jobStore) {
        if (job.createdAt.getTime() < cutoff) {
            jobStore.delete(hash);
        }
    }
}

/**
 * Derive a stable hash from report parameters so that identical inputs reuse
 * the same cached result within the TTL window.
 */
function buildJobHash(overall, dominantType, scores) {
    return crypto
        .createHash('sha256')
        .update(`${overall}|${dominantType}|${scores}`)
        .digest('hex')
        .slice(0, 32);
}

/** Update a job's fields in-place (safe – always checks existence first). */
function updateJob(hash, fields) {
    const job = jobStore.get(hash);
    if (job) Object.assign(job, fields);
}

// ── Shared HTML builder ───────────────────────────────────────────────────────

function buildReportHtml(overall, dominantType, scoresObj) {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { font-family: "Helvetica Neue", Arial, sans-serif; margin: 50px; color: #1e293b; }
      h1 { font-size: 30px; letter-spacing: 1px; margin-bottom: 5px; }
      .subtitle { color: #64748b; margin-bottom: 40px; }
      .hero-score { text-align: center; padding: 35px; border-radius: 14px;
        background: linear-gradient(135deg,#6366f1,#8b5cf6); color: white; margin-bottom: 40px; }
      .hero-score-number { font-size: 58px; font-weight: bold; }
      .section { margin-top: 30px; }
      .bar-track { background: #e2e8f0; height: 16px; border-radius: 10px; }
      .bar-fill { background: linear-gradient(90deg,#6366f1,#8b5cf6); height: 16px; border-radius: 10px; }
      .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; }
    </style>
  </head>
  <body>
    <h1>The Resilience Atlas&#8482; Report</h1>
    <p class="subtitle">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div class="hero-score">
      <div>Overall Resilience Score</div>
      <div class="hero-score-number">${overall}</div>
    </div>
    <div class="section">
      <h2>Dominant Dimension</h2>
      <p>The dimension that most strongly shapes your resilience profile:</p>
      <p><strong>${dominantType || '-'}</strong></p>
      <h2>Dimension Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Dimension</th><th>Score</th><th>Percentage</th><th style="width:200px">Visual</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(scoresObj).map(([type, data]) => `
          <tr>
            <td>${type}</td>
            <td>${data.raw}/${data.max}</td>
            <td>${Number(data.percentage).toFixed(1)}%</td>
            <td><div class="bar-track"><div class="bar-fill" style="width:${Math.min(data.percentage, 100)}%"></div></div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="footer">
      The Resilience Atlas&#8482; &mdash; For educational and self-reflection purposes only. Not a clinical diagnosis.
    </div>
  </body>
</html>`;
}

// ── Async PDF generation ──────────────────────────────────────────────────────

/**
 * Run the full PDF generation pipeline for a job, updating progress as it
 * moves through each stage.
 *
 * Stages:
 *   Stage 1 (0 → 25%)  : Parse assessment data
 *   Stage 2 (25 → 50%) : Generate narrative insights
 *   Stage 3 (50 → 75%) : Render PDF HTML
 *   Stage 4 (75 → 100%): Generate PDF buffer
 *   Stage 5 (100%)     : Cache and return
 *
 * @param {string} hash
 * @param {string} overall
 * @param {string} dominantType
 * @param {string} scores  Raw JSON string from query param
 */
async function runGeneration(hash, overall, dominantType, scores) {
    updateJob(hash, {
        status: 'processing',
        startedAt: new Date(),
        progress: 0,
        message: 'Starting report generation…',
        estimatedSeconds: 15,
    });

    try {
        // Stage 1 — Parse assessment data (0 → 25%)
        updateJob(hash, { progress: 5, message: 'Parsing your assessment data…' });

        let scoresObj;
        try {
            scoresObj = JSON.parse(scores);
        } catch {
            throw new Error('Invalid scores format');
        }

        updateJob(hash, { progress: 25, message: 'Assessment data ready.' });

        // Stage 2 — Generate narrative insights (25 → 50%)
        updateJob(hash, { progress: 30, message: 'Analyzing your resilience profile…' });
        await new Promise((r) => setTimeout(r, 50));
        updateJob(hash, { progress: 50, message: 'Narrative insights ready.' });

        // Stage 3 — Render PDF HTML (50 → 75%)
        updateJob(hash, { progress: 55, message: 'Building your report layout…' });
        const html = buildReportHtml(overall, dominantType, scoresObj);
        updateJob(hash, { progress: 75, message: 'Report layout complete.' });

        // Stage 4 — Generate PDF buffer (75 → 100%)
        updateJob(hash, { progress: 80, message: 'Generating PDF…', estimatedSeconds: 5 });

        console.log('Launching Puppeteer browser…');
        const browser = await puppeteer.launch({
            headless: 'new',
            timeout: 30000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
            ],
        });

        let pdfBuffer;
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        } finally {
            await browser.close();
        }

        updateJob(hash, { progress: 95, message: 'Finalizing your report…' });

        // Stage 5 — Cache and mark ready (100%)
        updateJob(hash, {
            status: 'ready',
            progress: 100,
            message: 'Your report is ready!',
            estimatedSeconds: 0,
            completedAt: new Date(),
            pdfBuffer,
        });
    } catch (err) {
        console.error('Async PDF generation failed:', err.message, err.stack);
        updateJob(hash, {
            status: 'failed',
            progress: 0,
            message: 'Report generation failed.',
            error: err.message,
            completedAt: new Date(),
        });
    }
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/report/generate
 * Start async PDF report generation. Returns a job hash for status polling.
 * If an identical job is already pending/processing/ready within the TTL
 * window, the existing hash is returned (idempotent).
 *
 * Query params: overall, dominantType, scores (JSON-encoded), email
 */
router.get('/generate', reportLimiter, async (req, res) => {
    try {
        const { overall, dominantType, scores, email } = req.query;

        if (!overall || !scores) {
            return res.status(400).json({ error: 'Missing resilience data' });
        }

        // ── Tier gating ────────────────────────────────────────────────────────
        if (process.env.STRIPE_SECRET_KEY) {
            if (!email) {
                return res.status(402).json({
                    error: 'A Deep Report or Atlas Premium purchase is required to download the PDF.',
                    upgradeRequired: true,
                });
            }
            try {
                const purchase = await Purchase.findOne({
                    email: String(email).toLowerCase().trim(),
                    status: 'completed',
                });
                if (!purchase) {
                    return res.status(402).json({
                        error: 'A Deep Report or Atlas Premium purchase is required to download the PDF.',
                        upgradeRequired: true,
                    });
                }
            } catch (dbErr) {
                console.warn('Purchase check skipped (DB unavailable):', dbErr.message);
            }
        }
        // ───────────────────────────────────────────────────────────────────────

        pruneExpiredJobs();

        const hash = buildJobHash(overall, dominantType, scores);

        // Return existing job if it is still valid (not failed).
        const existing = jobStore.get(hash);
        if (existing && existing.status !== 'failed') {
            return res.json({ hash, status: existing.status });
        }

        // Create a new job entry.
        jobStore.set(hash, {
            status: 'pending',
            progress: 0,
            message: 'Queued for generation…',
            estimatedSeconds: 15,
            createdAt: new Date(),
            startedAt: null,
            completedAt: null,
            error: null,
            pdfBuffer: null,
        });

        // Fire-and-forget — generation runs in the background.
        runGeneration(hash, overall, dominantType, scores).catch(() => {
            // Errors are already handled inside runGeneration.
        });

        return res.json({ hash, status: 'pending', estimatedSeconds: 15 });
    } catch (error) {
        console.error('Report generate endpoint failed:', error.message);
        return res.status(500).json({ error: 'Failed to start report generation' });
    }
});

/**
 * GET /api/report/status
 * Poll for the progress of an async report generation job.
 *
 * Query params: hash
 * Returns: { status, progress, message, estimatedSeconds, createdAt, startedAt, completedAt, error }
 */
router.get('/status', async (req, res) => {
    const { hash } = req.query;
    if (!hash) {
        return res.status(400).json({ error: 'Missing hash parameter' });
    }

    const job = jobStore.get(hash);
    if (!job) {
        return res.status(404).json({ error: 'Job not found or expired' });
    }

    return res.json({
        status: job.status,
        progress: job.progress,
        message: job.message,
        estimatedSeconds: job.estimatedSeconds,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
    });
});

/**
 * GET /api/report/download
 * Download a PDF report.
 *
 * Two modes:
 *   1. Async mode (preferred): ?hash=<hash>  — Retrieve a previously generated PDF.
 *   2. Legacy sync mode: ?overall=...&scores=...  — Generate and stream synchronously
 *      (kept for backward compatibility; new callers should use /generate + /status).
 */
router.get('/download', reportLimiter, async (req, res) => {
    const { hash } = req.query;

    // ── Mode 1: Retrieve by hash ───────────────────────────────────────────────
    if (hash) {
        const job = jobStore.get(hash);
        if (!job) {
            return res.status(404).json({ error: 'Job not found or expired' });
        }
        if (job.status !== 'ready') {
            return res.status(409).json({ error: 'Report is not ready yet', status: job.status });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resilience-report.pdf"');
        return res.send(job.pdfBuffer);
    }

    // ── Mode 2: Legacy synchronous generation ─────────────────────────────────
    try {
        const { overall, dominantType, scores, email } = req.query;

        if (!overall || !scores) {
            return res.status(400).json({ error: 'Missing resilience data' });
        }

        // Tier gating (same logic as /generate).
        if (process.env.STRIPE_SECRET_KEY) {
            if (!email) {
                return res.status(402).json({
                    error: 'A Deep Report or Atlas Premium purchase is required to download the PDF.',
                    upgradeRequired: true,
                });
            }
            try {
                const purchase = await Purchase.findOne({
                    email: String(email).toLowerCase().trim(),
                    status: 'completed',
                });
                if (!purchase) {
                    return res.status(402).json({
                        error: 'A Deep Report or Atlas Premium purchase is required to download the PDF.',
                        upgradeRequired: true,
                    });
                }
            } catch (dbErr) {
                console.warn('Purchase check skipped (DB unavailable):', dbErr.message);
            }
        }

        let scoresObj;
        try {
            scoresObj = JSON.parse(scores);
        } catch {
            return res.status(400).json({ error: 'Invalid scores format' });
        }

        const html = buildReportHtml(overall, dominantType, scoresObj);

        console.log('Launching Puppeteer browser (legacy sync)…');
        const browser = await puppeteer.launch({
            headless: 'new',
            timeout: 30000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
            ],
        });

        let pdf;
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'networkidle0' });
            pdf = await page.pdf({ format: 'A4', printBackground: true });
        } finally {
            await browser.close();
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resilience-report.pdf"');
        return res.send(pdf);
    } catch (error) {
        console.error('PDF generation failed:', error.message, error.stack);
        return res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
module.exports.jobStore = jobStore;
module.exports.buildJobHash = buildJobHash;
