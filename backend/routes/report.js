const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const puppeteer = require('puppeteer');
const Purchase = require('../models/Purchase');
const { buildReportHTML } = require('../templates/reportTemplate');

/** Rate limiter — PDF generation is expensive, so keep this conservative. */
const reportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a moment.' },
});

/**
 * GET /api/report/download
 * Generate and download a PDF resilience report.
 * Query params: overall, dominantType, scores (JSON-encoded), email (required for tier verification)
 *
 * Free users: returns 402 with an upgrade prompt.
 * Deep Report / Atlas Premium users: receives the full PDF.
 *
 * Graceful degradation: if the database is unavailable the check is skipped so
 * the endpoint never blocks unexpectedly in development environments.
 */
router.get('/download', reportLimiter, async (req, res) => {
    try {
        const { overall, dominantType, scores, email } = req.query;

        if (!overall || !scores) {
            return res.status(400).json({ error: 'Missing resilience data' });
        }

        // ── Tier gating ───────────────────────────────────────────────────────
        // Only users who have purchased Deep Report or Atlas Premium may
        // download the PDF.  Skip the check when Stripe is not configured (e.g.
        // local development without a STRIPE_SECRET_KEY).
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
                // Graceful degradation: allow download if DB is unreachable.
                console.warn('Purchase check skipped (DB unavailable):', dbErr.message);
            }
        }
        // ─────────────────────────────────────────────────────────────────────

let scoresObj;
try {
    scoresObj = JSON.parse(scores);
} catch {
    return res.status(400).json({ error: 'Invalid scores format' });
}

const html = buildReportHTML(
    Number(overall),
    dominantType || '',
    scoresObj,
    email ? String(email).split('@')[0] : undefined
);

        console.log('Launching Puppeteer browser...');
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
            pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
                preferCSSPageSize: true,
            });
        } finally {
            await browser.close();
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resilience-atlas-report.pdf"');
        res.send(pdf);
    } catch (error) {
        console.error('PDF generation failed:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
