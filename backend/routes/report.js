const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const ResilienceResult = require('../models/ResilienceResult');
const { TIER_CONFIG, PLAN_ALIASES, PREMIUM_TIERS } = require('../config/tiers');
const { canAccessFeature } = require('../utils/tierUtils');

/**
 * Tiers that grant access to any report or gamification feature.
 * Includes individual tiers (from canAccessFeature checks), all PREMIUM_TIERS,
 * and teams-plan alias keys from PLAN_ALIASES so that purchases stored with
 * either the short or prefixed variant are found.
 */
const REPORT_ACCESS_TIERS = Array.from(new Set([
    ...Object.keys(TIER_CONFIG).filter(
        (tier) => canAccessFeature(tier, 'basic-report') || canAccessFeature(tier, 'deep-report') || canAccessFeature(tier, 'gamification')
    ),
    ...PREMIUM_TIERS,
    ...Object.keys(PLAN_ALIASES),
]));

/**
 * Tiers that grant blanket (all-assessment) PDF access.
 * Atlas Starter is intentionally excluded — it grants per-assessment access only.
 * All purchases are permanent (no expiry).
 * Includes teams-plan alias keys whose canonical target also grants blanket access.
 */
const BLANKET_ACCESS_BASE = new Set(['atlas-navigator', 'atlas-premium', 'starter', 'pro', 'enterprise']);
const BLANKET_ACCESS_TIERS = new Set([
    ...BLANKET_ACCESS_BASE,
    // Add any PLAN_ALIASES whose canonical tier grants blanket access (e.g. teams-starter→starter, teams-pro→pro)
    ...Object.keys(PLAN_ALIASES).filter(alias => BLANKET_ACCESS_BASE.has(PLAN_ALIASES[alias])),
]);
const { buildComprehensiveReport } = require('../services/reportService');
const { buildPdfWithPDFKit } = require('../services/pdfService');
const { sendPdfReport, validatePdfBuffer } = require('../services/emailService');
const { authenticateJWT } = require('../middleware/auth');
const ResilienceReport = require('../models/ResilienceReport');

/** Rate limiter — PDF generation is expensive, so keep this conservative. */
const reportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

/**
 * Rate limiter for lightweight read-only endpoints (e.g. /access check).
 * More lenient than the PDF generation limiter.
 */
const accessLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
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
router.get('/generate', reportLimiter, authenticateJWT, async (req, res) => {
    try {
        const { overall, dominantType, email } = req.query;
        console.log(`[report/generate] Request from user=${req.user && req.user.userId} email=${email || '(none)'} overall=${overall}`);
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
        // PDF download access policy:
        //   - First assessment (email has ≤ 1 submission in DB): FREE
        //   - Second+ assessment: requires an Atlas Starter ($9.99) or
        //     Atlas Navigator ($49.99) purchase that is still within its
        //     access window (atlas-starter expires after ATLAS_STARTER_EXPIRY_DAYS).
        //     Re-downloading a previously paid assessment is always permitted.
        //
        // The check is skipped when STRIPE_SECRET_KEY is not set so that local
        // development and test environments can generate PDFs without payment.
        // In production, STRIPE_SECRET_KEY must be present and the purchase DB
        // must contain a completed record for the provided email address
        // (unless it is the user's first assessment).

        // Build the stable hash now so we can compare against purchase assessmentData
        // during the access check (for re-download of previously paid assessments).
        const cleanScores = JSON.stringify(scoresObj);
        const hash = buildJobHash(overall, dominantType || '', cleanScores);

        if (process.env.STRIPE_SECRET_KEY) {
            if (!email) {
                return res.status(402).json({
                    error: 'A paid report purchase is required to download the PDF.',
                    upgradeRequired: true,
                });
            }
            try {
                const cleanEmail = String(email).toLowerCase().trim();

                // Access control policy (new tiered model):
                //   - Atlas Navigator / atlas-premium / Teams tiers → blanket access
                //     (any completed purchase at these tiers allows ALL assessments).
                //   - Atlas Starter → per-assessment access: the purchase must have
                //     assessmentData whose hash matches the current request's hash.
                //   - All purchases are permanent — no 30-day expiry.
                //   - There is no "first assessment free" exception.
                const allPurchases = await Purchase.find({
                    email: cleanEmail,
                    tier: { $in: REPORT_ACCESS_TIERS },
                    status: 'completed',
                }).lean();

                // 1. Blanket access: Navigator / Premium / Teams.
                const hasBlanketAccess = allPurchases.some((p) => BLANKET_ACCESS_TIERS.has(p.tier));

                if (!hasBlanketAccess) {
                    // 2. Per-assessment access: any purchase whose stored assessmentData
                    //    hash matches the current assessment's hash.
                    const isAssessmentUnlocked = allPurchases.some((p) => {
                        if (!p.assessmentData || !p.assessmentData.scores) return false;
                        const pHash = buildJobHash(
                            String(p.assessmentData.overall),
                            p.assessmentData.dominantType || '',
                            JSON.stringify(p.assessmentData.scores)
                        );
                        return pHash === hash;
                    });

                    if (!isAssessmentUnlocked) {
                        // 3. Fallback: check the User record's purchasedDeepReport flag
                        //    (covers admin grants / legacy migrations).
                        let userHasAccess = false;
                        try {
                            const user = await User.findOne({ email: cleanEmail });
                            userHasAccess = Boolean(user && (user.purchasedDeepReport || user.atlasPremium));
                        } catch (userErr) {
                            console.warn('User access check skipped (DB unavailable):', userErr.message);
                        }
                        if (!userHasAccess) {
                            return res.status(402).json({
                                error: 'A paid report purchase is required to download the PDF. Please unlock this report to continue.',
                                upgradeRequired: true,
                            });
                        }
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
        console.error('[report/generate] Failed to start report:', error.message, error.stack);
        return res.status(500).json({ error: 'Failed to start report generation. Please try again.' });
    }
});

/**
 * GET /api/report/status
 * Poll the status of an async PDF generation job.
 *
 * Query params: hash (required)
 */
router.get('/status', accessLimiter, authenticateJWT, async (req, res) => {
    const { hash } = req.query;

    if (!hash) {
        return res.status(400).json({ error: 'Missing hash parameter' });
    }

    // Check in-flight in-memory store first (covers active /generate jobs).
    const job = jobStore.get(hash);
    if (job) {
        const { pdfBuffer, ...safe } = job;
        return res.json(safe);
    }

    // Fall back to persisted ResilienceReport record (covers queue-based flow).
    try {
        const report = await ResilienceReport.findOne({ resultsHash: String(hash) });
        if (!report) {
            return res.status(404).json({ status: 'not_found' });
        }
        return res.json({ status: report.status });
    } catch (err) {
        console.error('[report/status] DB lookup failed:', err.message);
        return res.status(404).json({ status: 'not_found' });
    }
});

/**
 * GET /api/report/download
 * Serve a completed PDF by its job hash.
 *
 * Query params: hash (required)
 */
router.get('/download', accessLimiter, authenticateJWT, async (req, res) => {
    const { hash } = req.query;

    if (!hash) {
        return res.status(400).json({ error: 'Missing hash parameter' });
    }

    const job = jobStore.get(hash);
    if (!job) {
        return res.status(404).json({ error: 'Report not found. It may have expired.' });
    }

    if (job.status === 'processing' || job.status === 'pending') {
        return res.status(202).json({ status: 'pending' });
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
router.post('/email', reportLimiter, authenticateJWT, async (req, res) => {
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

/**
 * GET /api/report/access
 * Check whether an email address has PDF report access, and optionally whether
 * a specific assessment is unlocked.
 *
 * Access model:
 *   - Atlas Navigator / Premium / Teams → blanket access (all assessments).
 *   - Atlas Starter → per-assessment access (matched by assessmentData hash).
 *   - All purchases are permanent (no expiry).
 *
 * Query params:
 *   email        (required)
 *   overall      (optional) — overall score for the current assessment
 *   dominantType (optional) — dominant dimension for the current assessment
 *   scores       (optional) — JSON-encoded scores for the current assessment
 *
 * Response:
 *   {
 *     hasAccess:                    boolean,  // any purchase exists
 *     hasActiveAccess:              boolean,  // same as hasAccess (all purchases are permanent now)
 *     isCurrentAssessmentUnlocked:  boolean,  // specific to provided assessment data
 *     hasNavigatorAccess:           boolean,  // user has blanket/navigator access
 *     purchases:                    [...],
 *     assessmentCount:              number,
 *   }
 *
 * No auth required — the email functions as the access token (consistent
 * with /generate which also uses email for tier verification).
 * Rate-limited to prevent enumeration abuse.
 */
router.get('/access', accessLimiter, async (req, res) => {
    const { email, overall, dominantType } = req.query;
    const scoresRaw = unescapeHtmlEntities(req.query.scores || '');

    if (!email) {
        return res.status(400).json({ error: 'Missing email parameter', hasAccess: false });
    }

    // In dev/test environments (no Stripe key and not production) grant access
    // so that local development can exercise the download flow without real purchases.
    // In production (NODE_ENV=production) we always check the database even if
    // STRIPE_SECRET_KEY is missing, to prevent accidental free access.
    if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== 'production') {
        return res.json({
            hasAccess: true,
            hasActiveAccess: true,
            isCurrentAssessmentUnlocked: true,
            hasNavigatorAccess: true,
            purchases: [],
            assessmentCount: 0,
        });
    }

    try {
        const cleanEmail = String(email).toLowerCase().trim();

        // Count total assessments for this email.
        let assessmentCount = 0;
        try {
            assessmentCount = await ResilienceResult.countDocuments({ email: cleanEmail });
        } catch (countErr) {
            console.warn('Assessment count check failed (non-fatal):', countErr.message);
        }

        // Find all completed purchases for this email that grant PDF access.
        const purchases = await Purchase.find({
            email: cleanEmail,
            tier: { $in: REPORT_ACCESS_TIERS },
            status: 'completed',
        })
            .select('tier purchasedAt createdAt assessmentData')
            .sort({ createdAt: -1 })
            .lean();

        if (purchases.length > 0) {
            // All purchases are now permanent — no expiry check needed.
            const hasNavigatorAccess = purchases.some((p) => BLANKET_ACCESS_TIERS.has(p.tier));

            // Build hash for the current assessment (if data was provided).
            let currentHash = null;
            if (overall && scoresRaw) {
                try {
                    const scoresObj = JSON.parse(scoresRaw);
                    currentHash = buildJobHash(String(overall), dominantType || '', JSON.stringify(scoresObj));
                } catch { /* ignore invalid JSON */ }
            }

            // isCurrentAssessmentUnlocked:
            //   - true if user has blanket (Navigator) access, OR
            //   - true if a Starter purchase matches the current assessment hash.
            let isCurrentAssessmentUnlocked = hasNavigatorAccess;
            if (!isCurrentAssessmentUnlocked && currentHash) {
                isCurrentAssessmentUnlocked = purchases.some((p) => {
                    if (!p.assessmentData || !p.assessmentData.scores) return false;
                    const pHash = buildJobHash(
                        String(p.assessmentData.overall),
                        p.assessmentData.dominantType || '',
                        JSON.stringify(p.assessmentData.scores)
                    );
                    return pHash === currentHash;
                });
            }

            return res.json({
                hasAccess: true,
                hasActiveAccess: true,        // backwards compat — all purchases are permanent
                isCurrentAssessmentUnlocked,
                hasNavigatorAccess,
                purchases: purchases.map((p) => ({
                    tier:           p.tier,
                    purchasedAt:    p.purchasedAt || p.createdAt,
                    assessmentData: p.assessmentData || null,
                    isExpired:      false,    // all purchases are now permanent
                })),
                assessmentCount,
            });
        }

        // Fallback: check the User record's flags (covers admin grants / migrations).
        let user = null;
        try {
            user = await User.findOne({ email: cleanEmail })
                .select('purchasedDeepReport atlasPremium purchaseDate')
                .lean();
        } catch (userErr) {
            console.warn('User access check skipped (DB unavailable):', userErr.message);
        }

        if (user && (user.purchasedDeepReport || user.atlasPremium)) {
            return res.json({
                hasAccess: true,
                hasActiveAccess: true,
                isCurrentAssessmentUnlocked: true,
                hasNavigatorAccess: true,
                purchases: [{
                    tier:           user.atlasPremium ? 'atlas-premium' : 'atlas-navigator',
                    purchasedAt:    user.purchaseDate || null,
                    assessmentData: null,
                    isExpired:      false,
                }],
                assessmentCount,
            });
        }

        return res.json({
            hasAccess: false,
            hasActiveAccess: false,
            isCurrentAssessmentUnlocked: false,
            hasNavigatorAccess: false,
            purchases: [],
            assessmentCount,
        });
    } catch (dbErr) {
        console.warn('Purchase access check failed (DB unavailable):', dbErr.message);
        return res.status(503).json({
            error: 'Unable to verify access at this time. Please try again shortly.',
            hasAccess: false,
        });
    }
});

/**
 * GET /api/report/:hash
 * Return the current status and content of a report identified by its results hash.
 * This route MUST remain last so it does not shadow named routes above.
 *
 * Responses:
 *   404 { status: 'not_found' }          — hash unknown
 *   202 { status: 'pending'|'processing' } — still generating
 *   200 { status: 'ready', reportText, pdfUrl } — complete
 *   200 { status: 'failed' }              — generation failed
 */
router.get('/:hash', accessLimiter, authenticateJWT, async (req, res) => {
    const { hash } = req.params;

    try {
        const report = await ResilienceReport.findOne({ resultsHash: String(hash) });
        if (!report) {
            return res.status(404).json({ status: 'not_found' });
        }

        if (report.status === 'pending' || report.status === 'processing') {
            return res.status(202).json({ status: report.status });
        }

        return res.json({
            status: report.status,
            reportText: report.reportText,
            pdfUrl: report.pdfUrl,
        });
    } catch (err) {
        console.error('[report/:hash] DB lookup failed:', err.message);
        return res.status(503).json({ error: 'Unable to retrieve report at this time. Please try again shortly.' });
    }
});

module.exports = router;
module.exports.jobStore = jobStore;
module.exports.buildJobHash = buildJobHash;
