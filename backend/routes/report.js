const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const Purchase = require('../models/Purchase');
const { buildComprehensiveReport } = require('../services/reportService');
const { buildReportHTML } = require('../templates/reportTemplate');
const { sendPdfReport } = require('../services/emailService');

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
 * Escape HTML special characters to prevent injection in the PDF template.
 * @param {*} value
 * @returns {string}
 */
function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

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
 * Render a dimension card with analysis, insights, and micro-practice.
 * @param {string} dimName
 * @param {Object} analysis - dimensionAnalysis entry
 * @returns {string} HTML string
 */
function renderDimensionCard(dimName, analysis) {
    const levelColors = {
        strong: '#10b981',
        solid: '#6366f1',
        developing: '#f59e0b',
        emerging: '#ef4444',
    };
    const color = levelColors[analysis.level] || '#6366f1';

    const strengthsHtml = (analysis.strengthsDemonstrated || [])
        .map((s) => `<li>${esc(s)}</li>`)
        .join('');

    const growthHtml = (analysis.growthOpportunities || [])
        .map((g) => `<li>${esc(g)}</li>`)
        .join('');

    const weeklyHtml = (analysis.weeklyProgression || [])
        .map((w) => `<li>${esc(w)}</li>`)
        .join('');

    return `
<div class="dim-card">
  <div class="dim-header" style="border-left:5px solid ${color}">
    <div class="dim-title">${esc(dimName)}</div>
    <div class="dim-score" style="color:${color}">${esc(String(Number(analysis.percentage).toFixed(1)))}%</div>
    <span class="dim-level" style="background:${color}">${esc(analysis.level)}</span>
  </div>

  <div class="bar-track"><div class="bar-fill" style="width:${Math.min(analysis.percentage, 100)}%;background:${color}"></div></div>

  ${analysis.benchmark ? `<p class="benchmark-text">You are in approximately the <strong>${esc(String(analysis.benchmark.percentile))}th percentile</strong> for this dimension (population mean: ${esc(String(analysis.benchmark.populationMean))}%)</p>` : ''}

  ${analysis.personalizedInsight ? `<div class="insight-box"><p>${esc(analysis.personalizedInsight).replace(/\n\n/g, '</p><p>')}</p></div>` : ''}

  ${strengthsHtml ? `
  <div class="subsection">
    <div class="subsection-title">Strengths Demonstrated</div>
    <ul>${strengthsHtml}</ul>
  </div>` : ''}

  ${growthHtml ? `
  <div class="subsection">
    <div class="subsection-title">Growth Opportunities</div>
    <ul>${growthHtml}</ul>
  </div>` : ''}

  ${analysis.dailyMicroPractice ? `
  <div class="practice-box">
    <div class="practice-title">&#9889; Daily Micro-Practice</div>
    <p>${esc(analysis.dailyMicroPractice).replace(/\n/g, '<br>')}</p>
  </div>` : ''}

  ${weeklyHtml ? `
  <div class="subsection">
    <div class="subsection-title">30-Day Weekly Progression</div>
    <ul>${weeklyHtml}</ul>
  </div>` : ''}

  ${analysis.realWorldApplication ? `
  <div class="subsection">
    <div class="subsection-title">Real-World Application</div>
    <p>${esc(analysis.realWorldApplication).replace(/\n\n/g, '</p><p>')}</p>
  </div>` : ''}
</div>`;
}

/**
 * Build the complete PDF HTML from the comprehensive report object.
 * @param {Object} report - Output of buildComprehensiveReport()
 * @param {string} overallRaw - raw overall value from query string
 * @param {string} dominantTypeRaw - raw dominantType from query string
 * @param {Object} scoresObj - parsed scores object
 * @returns {string} full HTML document
 */
function buildReportHtml(report, overallRaw, dominantTypeRaw, scoresObj) {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const dimensionCardsHtml = Object.entries(report.dimensionAnalysis || {})
        .map(([dim, analysis]) => renderDimensionCard(dim, analysis))
        .join('\n');

    const strengthsListHtml = (report.strengthIntegration && report.strengthIntegration.synergies || [])
        .map((s) => `<li>${esc(s)}</li>`).join('');

    const gapsListHtml = (report.strengthIntegration && report.strengthIntegration.gaps || [])
        .map((g) => `<li>${esc(g)}</li>`).join('');

    const copingListHtml = (report.stressResponse && report.stressResponse.copingStrategies || [])
        .map((s) => `<li>${esc(s)}</li>`).join('');

    const groundingListHtml = (report.stressResponse && report.stressResponse.groundingTechniques || [])
        .map((t) => `<li>${esc(t)}</li>`).join('');

    const partnershipListHtml = (report.relationshipInsights && report.relationshipInsights.partnershipRecommendations || [])
        .map((p) => `<li>${esc(p)}</li>`).join('');

    const week1 = (report.thirtyDayPlan && report.thirtyDayPlan.week1) || {};
    const week2 = (report.thirtyDayPlan && report.thirtyDayPlan.week2) || {};
    const week3 = (report.thirtyDayPlan && report.thirtyDayPlan.week3) || {};
    const week4 = (report.thirtyDayPlan && report.thirtyDayPlan.week4) || {};

    function renderWeek(week, label) {
        const exHtml = (week.exercises || []).map((e) => `<li>${esc(e)}</li>`).join('');
        return `
<div class="week-card">
  <div class="week-title">${esc(label)}: ${esc(week.focus || '')}</div>
  ${exHtml ? `<ul>${exHtml}</ul>` : ''}
  ${week.affirmation ? `<p class="affirmation">&ldquo;${esc(week.affirmation)}&rdquo;</p>` : ''}
</div>`;
    }

    const workshopsHtml = (report.recommendedResources && report.recommendedResources.workshops || [])
        .map((w) => `<li>${esc(w)}</li>`).join('');
    const videosHtml = (report.recommendedResources && report.recommendedResources.videos || [])
        .map((v) => `<li>${esc(v)}</li>`).join('');
    const practicesHtml = (report.recommendedResources && report.recommendedResources.practices || [])
        .map((p) => `<li>${esc(p)}</li>`).join('');
    const readingHtml = (report.recommendedResources && report.recommendedResources.readingMaterials || [])
        .map((r) => `<li>${esc(r)}</li>`).join('');

    // Fallback dimension table if no analysis was built (e.g. unknown dimension keys)
    const dimensionTableHtml = Object.entries(scoresObj).map(([type, data]) => `
<tr>
  <td>${esc(type)}</td>
  <td>${esc(String(data.raw))}/${esc(String(data.max))}</td>
  <td>${esc(String(Number(data.percentage).toFixed(1)))}%</td>
  <td><div class="bar-track"><div class="bar-fill" style="width:${Math.min(data.percentage, 100)}%"></div></div></td>
</tr>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:"Helvetica Neue",Arial,sans-serif;color:#1e293b;font-size:13px;line-height:1.6;padding:0}
    .page{padding:48px 56px}
    h1{font-size:28px;letter-spacing:.5px;color:#1e293b}
    h2{font-size:18px;color:#1e293b;margin:28px 0 10px}
    h3{font-size:14px;color:#334155;margin:18px 0 6px}
    p{margin:6px 0}
    ul{margin:6px 0 6px 20px}
    li{margin:4px 0}
    .subtitle{color:#64748b;font-size:13px;margin:4px 0 32px}
    .hero{text-align:center;padding:32px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;margin-bottom:36px}
    .hero-label{font-size:14px;opacity:.85;letter-spacing:.5px;text-transform:uppercase}
    .hero-score-number{font-size:64px;font-weight:700;line-height:1.1}
    .hero-archetype{font-size:18px;margin-top:8px;opacity:.9}
    .hero-dominant{font-size:13px;margin-top:4px;opacity:.75}
    .executive-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:28px}
    .executive-box p+p{margin-top:10px}
    .dim-card{border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:28px;page-break-inside:avoid}
    .dim-header{padding-left:12px;margin-bottom:12px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
    .dim-title{font-size:15px;font-weight:700;flex:1}
    .dim-score{font-size:22px;font-weight:700}
    .dim-level{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;color:#fff;text-transform:uppercase}
    .bar-track{background:#e2e8f0;height:10px;border-radius:8px;margin-bottom:12px}
    .bar-fill{background:linear-gradient(90deg,#6366f1,#8b5cf6);height:10px;border-radius:8px}
    .benchmark-text{font-size:12px;color:#64748b;margin-bottom:10px}
    .insight-box{background:#eff6ff;border-left:4px solid #6366f1;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0}
    .insight-box p+p{margin-top:8px}
    .subsection{margin:14px 0}
    .subsection-title{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin-bottom:6px}
    .practice-box{background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:12px 0}
    .practice-title{font-weight:700;font-size:12px;color:#92400e;margin-bottom:6px}
    .archetype-box{background:linear-gradient(135deg,#faf5ff,#ede9fe);border:1px solid #c4b5fd;border-radius:12px;padding:24px;margin-bottom:28px}
    .archetype-name{font-size:22px;font-weight:700;color:#5b21b6}
    .archetype-emoji{font-size:32px;margin-bottom:8px}
    .archetype-desc p+p{margin-top:8px}
    .section-header{background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;padding:10px 16px;border-radius:8px;margin:32px 0 16px;font-size:16px;font-weight:700}
    .integration-box{background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:20px;margin-bottom:20px}
    .stress-box{background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:20px}
    .relation-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin-bottom:20px}
    .week-card{border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;page-break-inside:avoid}
    .week-title{font-weight:700;color:#6366f1;margin-bottom:8px}
    .affirmation{font-style:italic;color:#5b21b6;margin-top:8px;font-size:12px}
    .resource-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
    .resource-card{border:1px solid #e2e8f0;border-radius:8px;padding:14px}
    .resource-card-title{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin-bottom:8px}
    .footer-bar{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th{background:#f1f5f9;padding:8px 10px;text-align:left;font-size:12px}
    td{padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px}
    .page-break{page-break-after:always}
  </style>
</head>
<body>
<div class="page">

  <!-- Cover / Hero -->
  <h1>The Resilience Atlas&#8482; Report</h1>
  <p class="subtitle">Generated: ${esc(dateStr)} &#8212; For personal growth and self-reflection only. Not a clinical assessment.</p>

  <div class="hero">
    <div class="hero-label">Overall Resilience Score</div>
    <div class="hero-score-number">${esc(String(overallRaw))}%</div>
    <div class="hero-archetype">${esc(report.profileArchetype || '')}</div>
    <div class="hero-dominant">Primary Strength: ${esc(dominantTypeRaw || '-')}</div>
  </div>

  <!-- Executive Summary -->
  <div class="section-header">Executive Summary</div>
  <div class="executive-box">
    <p>${esc(report.executiveSummary || '').replace(/\n\n/g, '</p><p>')}</p>
  </div>

  <!-- Profile Archetype -->
  <div class="section-header">Your Resilience Archetype</div>
  <div class="archetype-box">
    <div class="archetype-name">${esc(report.profileArchetype || '')}</div>
    <div class="archetype-desc">
      <p>${esc(report.profileDescription || '').replace(/\n\n/g, '</p><p>')}</p>
    </div>
  </div>

  <!-- Dimension Breakdown Table -->
  <div class="section-header">Dimension Score Overview</div>
  <table>
    <thead>
      <tr><th>Dimension</th><th>Score</th><th>Percentage</th><th>Level</th><th style="width:180px">Visual</th></tr>
    </thead>
    <tbody>${dimensionTableHtml}</tbody>
  </table>

  <div class="page-break"></div>

  <!-- Strength Integration -->
  <div class="section-header">Strength Integration Analysis</div>
  <div class="integration-box">
    <h3>Your Top-Three Combination: ${esc((report.strengthIntegration && report.strengthIntegration.topThreeCombo) || '')}</h3>
    ${report.strengthIntegration && report.strengthIntegration.blueprint ? `<p>${esc(report.strengthIntegration.blueprint)}</p>` : ''}
    ${strengthsListHtml ? `<div class="subsection"><div class="subsection-title">Synergies</div><ul>${strengthsListHtml}</ul></div>` : ''}
    ${gapsListHtml ? `<div class="subsection"><div class="subsection-title">Growth Gaps</div><ul>${gapsListHtml}</ul></div>` : ''}
  </div>

  <!-- Stress Response -->
  <div class="section-header">Stress Response Profile</div>
  <div class="stress-box">
    <p>${esc((report.stressResponse && report.stressResponse.overallResilience) || '')}</p>
    ${copingListHtml ? `<div class="subsection"><div class="subsection-title">Coping Strategies</div><ul>${copingListHtml}</ul></div>` : ''}
    ${groundingListHtml ? `<div class="subsection"><div class="subsection-title">Grounding Techniques</div><ul>${groundingListHtml}</ul></div>` : ''}
  </div>

  <!-- Relationship Insights -->
  <div class="section-header">Relationship &amp; Team Dynamics</div>
  <div class="relation-box">
    <p>${esc((report.relationshipInsights && report.relationshipInsights.communicationStyle) || '')}</p>
    ${partnershipListHtml ? `<div class="subsection"><div class="subsection-title">Partnership Recommendations</div><ul>${partnershipListHtml}</ul></div>` : ''}
  </div>

  <div class="page-break"></div>

  <!-- Dimension Deep-Dives -->
  <div class="section-header">Dimension Deep-Dives</div>
  ${dimensionCardsHtml}

  <div class="page-break"></div>

  <!-- 30-Day Action Plan -->
  <div class="section-header">Your 30-Day Resilience Action Plan</div>
  ${renderWeek(week1, 'Week 1')}
  ${renderWeek(week2, 'Week 2')}
  ${renderWeek(week3, 'Week 3')}
  ${renderWeek(week4, 'Week 4')}

  <!-- Recommended Resources -->
  <div class="section-header">Recommended Resources</div>
  <div class="resource-grid">
    ${workshopsHtml ? `<div class="resource-card"><div class="resource-card-title">&#127979; Workshops</div><ul>${workshopsHtml}</ul></div>` : ''}
    ${videosHtml ? `<div class="resource-card"><div class="resource-card-title">&#9654; Videos &amp; Talks</div><ul>${videosHtml}</ul></div>` : ''}
    ${practicesHtml ? `<div class="resource-card"><div class="resource-card-title">&#9999; Practices</div><ul>${practicesHtml}</ul></div>` : ''}
    ${readingHtml ? `<div class="resource-card"><div class="resource-card-title">&#128218; Reading</div><ul>${readingHtml}</ul></div>` : ''}
  </div>

  <div class="footer-bar">
    The Resilience Atlas&#8482; &mdash; For educational and self-reflection purposes only. Not a clinical diagnosis. &copy; The Resilience Atlas&#8482;
  </div>

</div>
</body>
</html>`;
}

/**
 * GET /api/report/download
 * Generate and download a comprehensive PDF resilience report.
 * Query params: overall, dominantType, scores (JSON-encoded), email (required for tier verification)
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
 * @param {string} scores  Cleaned JSON string (HTML entities already reversed)
 * @param {string} [email]  User email for personalisation (optional)
 */
async function runGeneration(hash, overall, dominantType, scores, email) {
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

        const comprehensiveReport = buildComprehensiveReport({
            userId: email ? String(email).toLowerCase().trim() : 'anonymous',
            overall: Number(overall),
            dominantType: dominantType || '',
            scores: scoresObj,
        });

        await new Promise((r) => setTimeout(r, 50));
        updateJob(hash, { progress: 50, message: 'Narrative insights ready.' });

        // Stage 3 — Render PDF HTML (50 → 75%)
        updateJob(hash, { progress: 55, message: 'Building your report layout…' });
        const html = buildReportHtml(comprehensiveReport, overall, dominantType, scoresObj);
        updateJob(hash, { progress: 75, message: 'Report layout complete.' });

        // Stage 4 — Generate PDF buffer (75 → 100%)
        updateJob(hash, { progress: 80, message: 'Generating PDF…', estimatedSeconds: 5 });

        console.log('Launching Puppeteer browser…');
        const browser = await puppeteer.launch({
            headless: 'new',
            timeout: 30000,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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
