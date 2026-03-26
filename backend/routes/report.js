const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const { PREMIUM_TIERS } = require('../config/tiers');
const { buildComprehensiveReport } = require('../services/reportService');
const { buildPdfWithPDFKit } = require('../services/pdfService');
const { sendPdfReport, validatePdfBuffer } = require('../services/emailService');

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
 * In-memory store mapping job hash → job state.
 * Exported for testing and introspection.
 */
const jobStore = new Map();

/**
 * Build a deterministic 32-char MD5-style hex hash from the report inputs.
 * Using MD5 (via Node crypto) for a compact, URL-safe key — not for security.
 * @param {string} overall
 * @param {string} dominantType
 * @param {string} scores  Raw JSON string
 * @returns {string} 32-character hex hash
 */
function buildJobHash(overall, dominantType, scores) {
    return crypto
        .createHash('md5')
        .update(`${overall}|${dominantType}|${scores}`)
        .digest('hex');
}

/**
 * Merge partial updates into an existing job record.
 * @param {string} hash
 * @param {Object} patch
 */
function updateJob(hash, patch) {
    const existing = jobStore.get(hash) || {};
    jobStore.set(hash, { ...existing, ...patch });
}

// Periodically remove expired jobs to prevent memory leaks.
setInterval(() => {
    const cutoff = Date.now() - JOB_TTL_MS;
    for (const [key, job] of jobStore.entries()) {
        if (job.createdAt && job.createdAt.getTime() < cutoff) {
            jobStore.delete(key);
        }
    }
}, 60 * 1000).unref();

/**
 * Reverse the HTML entity encoding applied by the sanitiseInput middleware so
 * that JSON strings passed as query parameters can be safely parsed.
 * The middleware replaces characters like `"` → `&quot;` before the route
 * handler runs, which would otherwise make JSON.parse fail.
 * @param {string} str
 * @returns {string}
 */
function unescapeHtmlEntities(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x3D;/g, '=')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * GET /api/report/download
 * Generate and download a comprehensive PDF resilience report.
 * Query params: overall, dominantType, scores (JSON-encoded), email (required for tier verification)
 *
 * Stages:
 *   Stage 1 (0 → 25%)  : Parse assessment data
 *   Stage 2 (25 → 50%) : Generate narrative insights
 *   Stage 3 (50 → 95%) : Generate PDF with PDFKit
 *   Stage 4 (100%)     : Cache and return
 *
 * @param {string} hash
 * @param {string} overall
 * @param {string} dominantType
 * @param {string} scores  Cleaned JSON string (HTML entities already reversed)
 * @param {string} [email]  User email for personalisation (optional)
 */
async function runGeneration(hash, overall, dominantType, scores, email) {
    const startTime = Date.now();
    console.log(`[PDF Generation] Starting report generation for hash: ${hash}`);

    updateJob(hash, {
        status: 'processing',
        startedAt: new Date(),
        progress: 0,
        message: 'Starting report generation…',
        estimatedSeconds: 15,
    });

    try {
        // Stage 1 — Parse assessment data (0 → 25%)
        console.log('[PDF Generation] Stage 1: Parsing assessment data…');
        updateJob(hash, { progress: 5, message: 'Parsing your assessment data…' });

        let scoresObj;
        try {
            scoresObj = JSON.parse(scores);
        } catch {
            throw new Error('Invalid scores format');
        }

        updateJob(hash, { progress: 25, message: 'Assessment data ready.' });
        console.log(`[PDF Generation] Stage 1 complete (${Date.now() - startTime}ms)`);

        // Stage 2 — Generate narrative insights (25 → 50%)
        console.log('[PDF Generation] Stage 2: Analyzing resilience profile…');
        updateJob(hash, { progress: 30, message: 'Analyzing your resilience profile…' });

        const comprehensiveReport = buildComprehensiveReport({
            userId: email ? String(email).toLowerCase().trim() : 'anonymous',
            overall: Number(overall),
            dominantType: dominantType || '',
            scores: scoresObj,
        });

        await new Promise((r) => setTimeout(r, 50));
        updateJob(hash, { progress: 50, message: 'Narrative insights ready.' });
        console.log(`[PDF Generation] Stage 2 complete (${Date.now() - startTime}ms)`);

        // Stage 3 — Generate PDF with PDFKit (50 → 95%)
        console.log('[PDF Generation] Stage 3: Building PDF with PDFKit…');
        updateJob(hash, { progress: 55, message: 'Building your report…' });

        const pdfBuffer = await buildPdfWithPDFKit(comprehensiveReport, Number(overall));
        console.log(`[PDF Generation] PDF generated (${Date.now() - startTime}ms), size: ${pdfBuffer.length} bytes`);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('PDF generation produced empty buffer');
        }
        const MIN_VALID_PDF_SIZE = 1000;
        if (pdfBuffer.length < MIN_VALID_PDF_SIZE) {
            throw new Error(`PDF buffer too small (${pdfBuffer.length} bytes) - likely invalid`);
        }

        updateJob(hash, { progress: 95, message: 'Finalizing your report…' });
        console.log(`[PDF Generation] Stage 3 complete (${Date.now() - startTime}ms)`);

        // Stage 4 — Cache and mark ready (100%)
        updateJob(hash, {
            status: 'ready',
            progress: 100,
            message: 'Your report is ready!',
            estimatedSeconds: 0,
            completedAt: new Date(),
            pdfBuffer,
        });

        const duration = Date.now() - startTime;
        console.log(`[PDF Generation] Complete in ${duration}ms for hash: ${hash}`);
    } catch (err) {
        const duration = Date.now() - startTime;
        const errorMsg = err.message || 'Unknown error';
        console.error('[PDF Generation] Error:', {
            hash,
            duration: `${duration}ms`,
            message: errorMsg,
            stack: err.stack,
            details: err.toString(),
        });
        updateJob(hash, {
            status: 'failed',
            progress: 0,
            message: 'Report generation failed.',
            error: errorMsg,
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
        const { overall, dominantType, email } = req.query;
        // Reverse any HTML entity encoding applied by the sanitiseInput middleware
        // so that the JSON string can be parsed correctly.
        const scores = unescapeHtmlEntities(req.query.scores);

        if (!overall || !scores) {
            return res.status(400).json({ error: 'Missing resilience data' });
        }

        // Validate scores format early so we can return a clear 400 before
        // queuing the job.
        let scoresObj;
        try {
            scoresObj = JSON.parse(scores);
            if (!scoresObj || typeof scoresObj !== 'object' || Array.isArray(scoresObj)) {
                throw new Error('scores must be a plain object');
            }
        } catch {
            return res.status(400).json({ error: 'Invalid scores format' });
        }

        // ── Tier gating ────────────────────────────────────────────────────────
        // Enforce an Atlas Navigator or Atlas Premium purchase before generating
        // the full PDF report.
        //
        // The check is skipped when STRIPE_SECRET_KEY is not set so that local
        // development and test environments can generate PDFs without payment.
        // In production, STRIPE_SECRET_KEY must be present and the purchase DB
        // must contain a completed record for the provided email address.
        if (process.env.STRIPE_SECRET_KEY) {
            if (!email) {
                return res.status(402).json({
                    error: 'An Atlas Navigator or Atlas Premium purchase is required to download the PDF.',
                    upgradeRequired: true,
                });
            }
            try {
                const cleanEmail = String(email).toLowerCase().trim();
                // Check for a completed individual purchase (atlas-navigator or atlas-premium).
                // Teams tiers (starter, pro, enterprise) also grant deep-report access.
                // PREMIUM_TIERS is the canonical list from backend/config/tiers.js.
                const purchase = await Purchase.findOne({
                    email: cleanEmail,
                    tier: { $in: PREMIUM_TIERS },
                    status: 'completed',
                });
                if (!purchase) {
                    // Fallback: check the User record's purchasedDeepReport flag,
                    // which covers users whose access was granted outside the
                    // standard Stripe checkout flow (e.g. admin grants or migrations).
                    let userHasAccess = false;
                    try {
                        const user = await User.findOne({ email: cleanEmail });
                        userHasAccess = Boolean(user && (user.purchasedDeepReport || user.atlasPremium));
                    } catch (userErr) {
                        console.warn('User access check skipped (DB unavailable):', userErr.message);
                    }
                    if (!userHasAccess) {
                        return res.status(402).json({
                            error: 'An Atlas Navigator or Atlas Premium purchase is required to download the PDF.',
                            upgradeRequired: true,
                        });
                    }
                }
            } catch (dbErr) {
                // DB unavailable — block rather than silently allow, to prevent
                // free access during temporary DB outages in production.
                console.warn('Purchase check failed (DB unavailable):', dbErr.message);
                return res.status(503).json({
                    error: 'Unable to verify your purchase at this time. Please try again shortly.',
                });
            }
        }
        // ───────────────────────────────────────────────────────────────────────

        // Use the re-stringified scores to build a stable hash (avoids any
        // entity-encoding differences between identical score sets).
        const cleanScores = JSON.stringify(scoresObj);
        const hash = buildJobHash(overall, dominantType || '', cleanScores);

        // Idempotent: reuse existing job if still active within the TTL.
        const existing = jobStore.get(hash);
        if (existing && ['pending', 'processing', 'ready'].includes(existing.status)) {
            return res.json({ hash, estimatedSeconds: existing.estimatedSeconds || 15 });
        }

        // Create a new pending job entry.
        jobStore.set(hash, {
            status: 'pending',
            createdAt: new Date(),
            startedAt: null,
            completedAt: null,
            progress: 0,
            message: 'Queued…',
            estimatedSeconds: 15,
            error: null,
            pdfBuffer: null,
        });

        // Kick off generation asynchronously — do NOT await so the response
        // is returned immediately.
        runGeneration(hash, overall, dominantType || '', cleanScores, email || '')
            .catch((err) => console.error('Background report generation failed:', err.message, err.stack));

        return res.json({ hash, estimatedSeconds: 15 });
    } catch (error) {
        console.error('Report generation start failed:', error.message, error.stack);
        return res.status(500).json({ error: 'Failed to start report generation' });
    }
});

/**
 * GET /api/report/status
 * Poll the status of an async PDF generation job.
 *
 * Query params: hash (required)
 */
router.get('/status', async (req, res) => {
    const { hash } = req.query;

    if (!hash) {
        return res.status(400).json({ error: 'Missing hash parameter' });
    }

    const job = jobStore.get(hash);
    if (!job) {
        return res.status(404).json({ error: 'Job not found' });
    }

    // Strip the raw PDF buffer from the response — it is served via /download.
    const { pdfBuffer, ...safe } = job;
    return res.json(safe);
});

/**
 * GET /api/report/download
 * Serve a completed PDF by its job hash.
 *
 * Query params: hash (required)
 */
router.get('/download', async (req, res) => {
    const { hash } = req.query;

    if (!hash) {
        return res.status(400).json({ error: 'Missing hash parameter' });
    }

    const job = jobStore.get(hash);
    if (!job) {
        return res.status(404).json({ error: 'Report not found. It may have expired.' });
    }

    if (job.status === 'processing' || job.status === 'pending') {
        return res.status(409).json({ error: 'Report is still being generated. Please try again shortly.' });
    }

    if (job.status === 'failed') {
        return res.status(500).json({ error: job.error || 'Report generation failed.' });
    }

    if (job.status !== 'ready' || !job.pdfBuffer) {
        return res.status(404).json({ error: 'Report not available.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resilience-atlas-report.pdf"');
    return res.send(job.pdfBuffer);
});

/**
 * POST /api/report/email
 * Send a completed PDF report to an email address.
 *
 * Body: { hash, email }
 */
router.post('/email', async (req, res) => {
    const { hash, email } = req.body;

    if (!hash) {
        return res.status(400).json({ error: 'Missing hash parameter' });
    }

    if (!email) {
        return res.status(400).json({ error: 'Missing email parameter' });
    }

    const job = jobStore.get(hash);
    if (!job) {
        return res.status(404).json({ error: 'Report not found. It may have expired.' });
    }

    if (job.status !== 'ready' || !job.pdfBuffer) {
        return res.status(409).json({ error: 'Report is not ready yet.' });
    }

    if (!validatePdfBuffer(job.pdfBuffer)) {
        console.error(`[report/email] Invalid PDF buffer for hash ${hash}: length=${job.pdfBuffer ? job.pdfBuffer.length : 0}`);
        return res.status(500).json({ error: 'The generated report is corrupted. Please regenerate your report and try again.' });
    }

    try {
        await sendPdfReport(email, job.pdfBuffer);
        return res.json({ message: 'Report sent successfully' });
    } catch (err) {
        console.error('Report email send failed:', err.message, err.stack);
        return res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
});

module.exports = router;
module.exports.jobStore = jobStore;
module.exports.buildJobHash = buildJobHash;
