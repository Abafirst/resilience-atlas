const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const Purchase = require('../models/Purchase');

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
router.get('/download', async (req, res) => {
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

        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            h1 { color: #667eea; margin-bottom: 4px; }
            .subtitle { color: #888; font-size: 14px; margin-bottom: 24px; }
            .score-section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .score-section h2 { margin: 0 0 8px 0; color: #667eea; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #667eea; color: #fff; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) td { background: #f8f9fa; }
            .bar-track { background: #e0e7ff; border-radius: 4px; height: 16px; }
            .bar-fill { background: #667eea; height: 16px; border-radius: 4px; }
            .footer { margin-top: 40px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
          </style>
        </head>
        <body>
          <h1>Resilience Assessment Report</h1>
          <p class="subtitle">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div class="score-section">
            <h2>Overall Score: ${overall}%</h2>
            <p>Dominant Type: <strong>${dominantType || '—'}</strong></p>
          </div>

          <h3>Detailed Scores</h3>
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
            Resilience Atlas &mdash; For educational and self-reflection purposes only. Not a clinical diagnosis.
          </div>
        </body>
      </html>
    `;

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
        console.error('PDF generation failed:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

module.exports = router;
