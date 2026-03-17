const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
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

const parsedScores = scoresObj;

const html = `
<!DOCTYPE html>
<html>
        <head>
          <meta charset="UTF-8" />
<style>
body {
  font-family: "Helvetica Neue", Arial, sans-serif;
  margin: 50px;
  color: #1e293b;
}

h1 {
  font-size: 30px;
  letter-spacing: 1px;
  margin-bottom: 5px;
}

.subtitle {
  color: #64748b;
  margin-bottom: 40px;
}

.hero-score {
  text-align: center;
  padding: 35px;
  border-radius: 14px;
  background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: white;
  margin-bottom: 40px;
}

.hero-score-number {
  font-size: 58px;
  font-weight: bold;
}

.section {
  margin-top: 30px;
}

.dimension {
  margin-bottom: 20px;
}

.dimension-label {
  font-weight: 600;
  margin-bottom: 5px;
}

.bar-track {
  background: #e2e8f0;
  height: 16px;
  border-radius: 10px;
}

.bar-fill {
  background: linear-gradient(90deg,#6366f1,#8b5cf6);
  height: 16px;
  border-radius: 10px;
}

.footer {
  margin-top: 40px;
  font-size: 11px;
  color: #94a3b8;
}
</style>
        </head>
        <body>
          <h1>The Resilience Atlas™ Report</h1>
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
                <th>Dimension</th>
                <th>Score</th>
                <th>Percentage</th>
                <th style="width:200px">Visual</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(scoresObj).map(([type, data]) => `
              <tr>
                <td>${type}</td>
                <td>${data.raw}/${data.max}</td>
                <td>${Number(data.percentage).toFixed(1)}%</td>
                <td>
                  <div class="bar-track">
                    <div class="bar-fill" style="width:${Math.min(data.percentage, 100)}%"></div>
                  </div>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>

          <div class="footer">
            The Resilience Atlas™ &mdash; For educational and self-reflection purposes only. Not a clinical diagnosis.
          </div>
        </body>
      </html>
    `;

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
            pdf = await page.pdf({ format: 'A4', printBackground: true });
        } finally {
            await browser.close();
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="resilience-report.pdf"');
        res.send(pdf);
    } catch (error) {
        console.error('PDF generation failed:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
