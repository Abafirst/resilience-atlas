'use strict';

const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { generateReport } = require('../scoring');
const logger = require('../utils/logger');

/**
 * Build a deterministic SHA-256 hash from quiz scores.
 * Used to cache generated reports — identical scores reuse the same PDF/text.
 * @param {Object} scores - Output of calculateResilienceScores()
 * @returns {string} hex digest
 */
function buildResultsHash(scores) {
    const payload = JSON.stringify({
        overall: scores.overall,
        dominantType: scores.dominantType,
        categories: scores.categories,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generate a human-readable narrative text from quiz scores.
 * @param {Object} scores - Output of calculateResilienceScores()
 * @returns {string} narrative report text
 */
function generateNarrativeReport(scores) {
    const report = generateReport(scores);

    const lines = [
        `Resilience Atlas — Personal Report`,
        `=====================================`,
        ``,
        `Overall Resilience Score: ${report.overall}%`,
        `Level: ${report.level}`,
        `Dominant Type: ${report.dominantType}`,
        ``,
        `Summary`,
        `-------`,
        report.summary,
        ``,
        `Category Breakdown`,
        `------------------`,
    ];

    for (const [category, data] of Object.entries(report.categories)) {
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        lines.push(`${label}: ${data.percentage}% — ${data.level}`);
        if (data.recommendation) {
            lines.push(`  ↳ ${data.recommendation}`);
        }
    }

    return lines.join('\n');
}

/**
 * Generate a PDF buffer from quiz scores.
 * @param {Object} scores - Output of calculateResilienceScores()
 * @param {string} username - The user's display name
 * @returns {Promise<Buffer>} PDF binary data
 */
function generatePDFReport(scores, username) {
    return new Promise((resolve, reject) => {
        try {
            const report = generateReport(scores);
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Title
            doc.fontSize(22).font('Helvetica-Bold').text('Resilience Atlas', { align: 'center' });
            doc.fontSize(16).font('Helvetica').text('Personal Resilience Report', { align: 'center' });
            doc.moveDown();

            // User & score summary
            doc.fontSize(12).text(`Name: ${username || 'Participant'}`);
            doc.text(`Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            doc.fontSize(14).font('Helvetica-Bold').text(`Overall Score: ${report.overall}%`);
            doc.fontSize(12).font('Helvetica').text(`Level: ${report.level}`);
            doc.text(`Dominant Type: ${report.dominantType}`);
            doc.moveDown();

            // Summary
            doc.fontSize(13).font('Helvetica-Bold').text('Summary');
            doc.fontSize(11).font('Helvetica').text(report.summary, { lineGap: 4 });
            doc.moveDown();

            // Category breakdown
            doc.fontSize(13).font('Helvetica-Bold').text('Category Breakdown');
            doc.moveDown(0.5);

            for (const [category, data] of Object.entries(report.categories)) {
                const label = category.charAt(0).toUpperCase() + category.slice(1);
                doc.fontSize(11).font('Helvetica-Bold').text(`${label}: ${data.percentage}%  (${data.level})`);
                if (data.recommendation) {
                    doc.fontSize(10).font('Helvetica').text(`   ${data.recommendation}`, { lineGap: 2 });
                }
                doc.moveDown(0.3);
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Save a PDF buffer to storage and return a URL.
 * In production this would upload to S3/GCS. Here we store it as a
 * base64 data-URI so the system works without external file storage.
 * @param {Buffer} pdfBuffer
 * @param {string} userId
 * @param {string} hash
 * @returns {string} URL / data-URI for the PDF
 */
function savePDF(pdfBuffer, userId, hash) {
    // For a real production system, upload to S3 and return a signed URL.
    // For this implementation we return a base64 data-URI so the feature
    // works end-to-end without requiring external storage.
    const base64 = pdfBuffer.toString('base64');
    return `data:application/pdf;base64,${base64}`;
}

module.exports = {
    buildResultsHash,
    generateNarrativeReport,
    generatePDFReport,
    savePDF,
};
