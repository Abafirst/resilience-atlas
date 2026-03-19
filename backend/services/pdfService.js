'use strict';

const PDFDocument = require('pdfkit');

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    accent: '#8b5cf6',
    strong: '#10b981',
    solid: '#6366f1',
    developing: '#f59e0b',
    emerging: '#ef4444',
    text: '#1e293b',
    textLight: '#64748b',
    border: '#e2e8f0',
    bgLight: '#f8fafc',
    bgBlue: '#eff6ff',
    bgGreen: '#f0fdf4',
    bgOrange: '#fff7ed',
    bgPurple: '#faf5ff',
    white: '#ffffff',
};

const LEVEL_COLORS = {
    strong: COLORS.strong,
    solid: COLORS.solid,
    developing: COLORS.developing,
    emerging: COLORS.emerging,
};

// ── Layout helpers ─────────────────────────────────────────────────────────────

/** Convert hex colour string to [r, g, b] components (0-255). */
function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Apply a hex fill colour. */
function fillColor(doc, hex) {
    const [r, g, b] = hexToRgb(hex);
    doc.fillColor([r, g, b]);
}

/** Apply a hex stroke colour. */
function strokeColor(doc, hex) {
    const [r, g, b] = hexToRgb(hex);
    doc.strokeColor([r, g, b]);
}

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

/** Add a new page and reset the Y position. */
function newPage(doc) {
    doc.addPage();
}

/** Draw a coloured section header bar. */
function sectionHeader(doc, text, yPos) {
    const y = yPos !== undefined ? yPos : doc.y;
    fillColor(doc, COLORS.primary);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 24, 4).fill();
    fillColor(doc, COLORS.white);
    doc.fontSize(12).font('Helvetica-Bold').text(text, PAGE_MARGIN + 10, y + 6, { width: CONTENT_WIDTH - 20 });
    fillColor(doc, COLORS.text);
    doc.y = y + 32;
}

/** Draw a progress bar for a score percentage. */
function progressBar(doc, x, y, width, pct, color) {
    const barH = 8;
    // Background
    strokeColor(doc, COLORS.border);
    fillColor(doc, '#e2e8f0');
    doc.roundedRect(x, y, width, barH, 3).fillAndStroke();
    // Fill
    const fillW = Math.max(2, Math.min(pct / 100, 1) * width);
    fillColor(doc, color || COLORS.primary);
    strokeColor(doc, color || COLORS.primary);
    doc.roundedRect(x, y, fillW, barH, 3).fillAndStroke();
    // Reset
    fillColor(doc, COLORS.text);
    strokeColor(doc, COLORS.border);
}

/** Wrap text to fit within a coloured box (returns new y after box). */
function infoBox(doc, text, bgHex, borderHex, x, y, width) {
    if (!text) return y;
    const pad = 10;
    const innerWidth = width - pad * 2;
    // Calculate height
    const savedY = doc.y;
    const textH = doc.heightOfString(text, { width: innerWidth, lineGap: 2 });
    const boxH = textH + pad * 2;
    // Draw box
    fillColor(doc, bgHex);
    strokeColor(doc, borderHex);
    doc.roundedRect(x, y, width, boxH, 6).fillAndStroke();
    // Draw text
    fillColor(doc, COLORS.text);
    doc.fontSize(10).font('Helvetica').text(text, x + pad, y + pad, { width: innerWidth, lineGap: 2 });
    doc.y = y + boxH + 6;
    return doc.y;
}

/** Check remaining page space and add a new page if needed. */
function ensureSpace(doc, needed) {
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + needed > pageBottom) {
        newPage(doc);
    }
}

// ── Page builders ─────────────────────────────────────────────────────────────

/** Page 1 – Cover */
function buildCoverPage(doc, report, overall) {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Title block
    fillColor(doc, COLORS.text);
    doc.fontSize(26).font('Helvetica-Bold').text('The Resilience Atlas\u2122', PAGE_MARGIN, 60, { align: 'center', width: CONTENT_WIDTH });
    doc.fontSize(14).font('Helvetica').text('Personal Resilience Report', PAGE_MARGIN, doc.y + 4, { align: 'center', width: CONTENT_WIDTH });

    // Hero score box
    const heroY = doc.y + 24;
    fillColor(doc, COLORS.primary);
    doc.roundedRect(PAGE_MARGIN, heroY, CONTENT_WIDTH, 140, 12).fill();

    fillColor(doc, COLORS.white);
    doc.fontSize(11).font('Helvetica').text('OVERALL RESILIENCE SCORE', PAGE_MARGIN, heroY + 18, { align: 'center', width: CONTENT_WIDTH, characterSpacing: 1 });
    doc.fontSize(60).font('Helvetica-Bold').text(`${overall}%`, PAGE_MARGIN, heroY + 36, { align: 'center', width: CONTENT_WIDTH });
    doc.fontSize(16).font('Helvetica').text(report.profileArchetype || '', PAGE_MARGIN, heroY + 100, { align: 'center', width: CONTENT_WIDTH });

    fillColor(doc, COLORS.text);
    doc.y = heroY + 150;

    // Meta info
    doc.fontSize(11).font('Helvetica')
        .text(`Archetype: ${report.profileArchetype || 'N/A'}`, PAGE_MARGIN, doc.y + 10)
        .text(`Primary Strength: ${report.dominantType || 'N/A'}`, PAGE_MARGIN, doc.y + 4)
        .text(`Date: ${dateStr}`, PAGE_MARGIN, doc.y + 4);

    // Disclaimer
    doc.y = doc.y + 24;
    fillColor(doc, COLORS.textLight);
    doc.fontSize(9).font('Helvetica').text(
        'For personal growth and self-reflection only. Not a clinical assessment or medical advice.',
        PAGE_MARGIN, doc.y, { align: 'center', width: CONTENT_WIDTH }
    );
    fillColor(doc, COLORS.text);
}

/** Page 2 – Executive Summary */
function buildExecutiveSummaryPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'Executive Summary');

    if (report.executiveSummary) {
        infoBox(doc, report.executiveSummary, COLORS.bgLight, COLORS.border, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    // Archetype description
    if (report.profileDescription) {
        sectionHeader(doc, 'Your Resilience Archetype');
        fillColor(doc, COLORS.text);
        doc.fontSize(13).font('Helvetica-Bold').text(report.profileArchetype || '', PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
        doc.y += 6;
        infoBox(doc, report.profileDescription, COLORS.bgPurple, '#c4b5fd', PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }
}

/** Page 3 – Dimension Scores Table */
function buildDimensionScoresPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'Dimension Score Overview');

    const colX = [PAGE_MARGIN, PAGE_MARGIN + 160, PAGE_MARGIN + 220, PAGE_MARGIN + 270];
    const rowH = 22;

    // Header row
    fillColor(doc, '#f1f5f9');
    doc.rect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, rowH).fill();
    fillColor(doc, COLORS.text);
    doc.fontSize(9).font('Helvetica-Bold')
        .text('Dimension', colX[0] + 4, doc.y + 6, { width: 150 })
        .text('%', colX[1] + 4, doc.y - 10, { width: 55 })
        .text('Visual', colX[2] + 4, doc.y - 10, { width: 45 })
        .text('Level', colX[3] + 4, doc.y - 10, { width: 60 });

    doc.y += rowH;

    // Data rows
    const dims = Object.entries(report.dimensionAnalysis || {});
    for (const [dim, analysis] of dims) {
        ensureSpace(doc, rowH + 4);
        const rowY = doc.y;
        const levelColor = LEVEL_COLORS[analysis.level] || COLORS.primary;

        // Alternating bg
        fillColor(doc, '#f8fafc');
        strokeColor(doc, COLORS.border);
        doc.rect(PAGE_MARGIN, rowY, CONTENT_WIDTH, rowH).fillAndStroke();

        fillColor(doc, COLORS.text);
        doc.fontSize(9).font('Helvetica').text(dim, colX[0] + 4, rowY + 6, { width: 150 });

        doc.text(`${Number(analysis.percentage || 0).toFixed(1)}%`, colX[1] + 4, rowY + 6, { width: 55 });

        // Mini progress bar
        progressBar(doc, colX[2] + 4, rowY + 8, 44, analysis.percentage || 0, levelColor);

        fillColor(doc, levelColor);
        doc.fontSize(8).font('Helvetica-Bold').text((analysis.level || '').toUpperCase(), colX[3] + 4, rowY + 7, { width: 60 });

        fillColor(doc, COLORS.text);
        doc.y = rowY + rowH;
    }
}

/** Render one dimension deep-dive section. */
function buildDimensionSection(doc, dimName, analysis) {
    ensureSpace(doc, 80);

    const levelColor = LEVEL_COLORS[analysis.level] || COLORS.primary;

    // Dimension header
    const headerY = doc.y;
    fillColor(doc, levelColor);
    doc.roundedRect(PAGE_MARGIN, headerY, CONTENT_WIDTH, 28, 5).fill();
    fillColor(doc, COLORS.white);
    doc.fontSize(12).font('Helvetica-Bold').text(dimName, PAGE_MARGIN + 10, headerY + 7, { width: CONTENT_WIDTH * 0.6 });
    doc.fontSize(16).font('Helvetica-Bold').text(`${Number(analysis.percentage || 0).toFixed(1)}%`, PAGE_MARGIN + CONTENT_WIDTH * 0.65, headerY + 5, { width: CONTENT_WIDTH * 0.3, align: 'right' });
    fillColor(doc, COLORS.text);
    doc.y = headerY + 36;

    // Progress bar
    progressBar(doc, PAGE_MARGIN, doc.y, CONTENT_WIDTH, analysis.percentage || 0, levelColor);
    doc.y += 14;

    // Benchmark
    if (analysis.benchmark) {
        fillColor(doc, COLORS.textLight);
        doc.fontSize(9).font('Helvetica').text(
            `Approx. ${analysis.benchmark.percentile}th percentile (population mean: ${analysis.benchmark.populationMean}%)`,
            PAGE_MARGIN, doc.y
        );
        doc.y += 14;
        fillColor(doc, COLORS.text);
    }

    // Personalized insight
    if (analysis.personalizedInsight) {
        infoBox(doc, analysis.personalizedInsight, COLORS.bgBlue, COLORS.primary, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    // Strengths
    if (analysis.strengthsDemonstrated && analysis.strengthsDemonstrated.length > 0) {
        ensureSpace(doc, 30);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Strengths Demonstrated', PAGE_MARGIN, doc.y);
        doc.y += 4;
        for (const s of analysis.strengthsDemonstrated) {
            ensureSpace(doc, 16);
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${s}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
            doc.y += 2;
        }
        doc.y += 6;
    }

    // Growth opportunities
    if (analysis.growthOpportunities && analysis.growthOpportunities.length > 0) {
        ensureSpace(doc, 30);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Growth Opportunities', PAGE_MARGIN, doc.y);
        doc.y += 4;
        for (const g of analysis.growthOpportunities) {
            ensureSpace(doc, 16);
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${g}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 10 });
            doc.y += 2;
        }
        doc.y += 6;
    }

    // Daily micro-practice
    if (analysis.dailyMicroPractice) {
        ensureSpace(doc, 40);
        infoBox(doc, `\u26a1 Daily Micro-Practice\n${analysis.dailyMicroPractice}`, COLORS.bgOrange, '#fde68a', PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    doc.y += 8;
}

/** Pages 4+: Dimension Deep-Dives */
function buildDimensionDeepDives(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'Dimension Deep-Dives');

    const dims = Object.entries(report.dimensionAnalysis || {});
    for (let i = 0; i < dims.length; i++) {
        const [dimName, analysis] = dims[i];
        if (i > 0) {
            // Each dimension on its own page for clarity
            newPage(doc);
        }
        buildDimensionSection(doc, dimName, analysis);
    }
}

/** 30-Day Action Plan page */
function build30DayPlanPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'Your 30-Day Resilience Action Plan');

    const plan = report.thirtyDayPlan || {};
    const weeks = [
        { label: 'Week 1', data: plan.week1 },
        { label: 'Week 2', data: plan.week2 },
        { label: 'Week 3', data: plan.week3 },
        { label: 'Week 4', data: plan.week4 },
    ];

    for (const { label, data } of weeks) {
        if (!data) continue;
        ensureSpace(doc, 60);

        const weekY = doc.y;
        fillColor(doc, '#f1f5f9');
        strokeColor(doc, COLORS.border);
        doc.roundedRect(PAGE_MARGIN, weekY, CONTENT_WIDTH, 20, 4).fillAndStroke();
        fillColor(doc, COLORS.primary);
        doc.fontSize(11).font('Helvetica-Bold').text(`${label}: ${data.focus || ''}`, PAGE_MARGIN + 8, weekY + 5, { width: CONTENT_WIDTH - 16 });
        fillColor(doc, COLORS.text);
        doc.y = weekY + 26;

        if (data.exercises && data.exercises.length > 0) {
            for (const ex of data.exercises) {
                if (!ex) continue;
                ensureSpace(doc, 16);
                doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${ex}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 20 });
                doc.y += 2;
            }
        }

        if (data.affirmation) {
            ensureSpace(doc, 20);
            doc.y += 4;
            fillColor(doc, COLORS.accent);
            doc.fontSize(9).font('Helvetica-Oblique').text(`\u201c${data.affirmation}\u201d`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 20 });
            fillColor(doc, COLORS.text);
        }

        doc.y += 14;
    }
}

/** Resources page */
function buildResourcesPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'Recommended Resources');

    const res = report.recommendedResources || {};

    const sections = [
        { title: '\ud83c\udfeb Workshops', items: res.workshops },
        { title: '\u25b6 Videos & Talks', items: res.videos },
        { title: '\u270f Practices', items: res.practices },
        { title: '\ud83d\udcda Reading', items: res.readingMaterials },
    ];

    for (const { title, items } of sections) {
        if (!items || items.length === 0) continue;
        ensureSpace(doc, 30);
        fillColor(doc, COLORS.text);
        doc.fontSize(11).font('Helvetica-Bold').text(title, PAGE_MARGIN, doc.y);
        doc.y += 6;
        for (const item of items) {
            ensureSpace(doc, 16);
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${item}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 20 });
            doc.y += 2;
        }
        doc.y += 10;
    }
}

/** Strength Integration + Stress Response page */
function buildInsightsPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'Strength Integration Analysis');

    const si = report.strengthIntegration || {};
    if (si.topThreeCombo) {
        fillColor(doc, COLORS.text);
        doc.fontSize(11).font('Helvetica-Bold').text(`Top Combination: ${si.topThreeCombo}`, PAGE_MARGIN, doc.y);
        doc.y += 8;
    }
    if (si.blueprint) {
        infoBox(doc, si.blueprint, COLORS.bgGreen, '#86efac', PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    if (si.synergies && si.synergies.length > 0) {
        ensureSpace(doc, 30);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Synergies', PAGE_MARGIN, doc.y);
        doc.y += 4;
        for (const s of si.synergies) {
            ensureSpace(doc, 16);
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${s}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 20 });
            doc.y += 2;
        }
        doc.y += 8;
    }

    // Stress Response
    ensureSpace(doc, 40);
    sectionHeader(doc, 'Stress Response Profile');
    const sr = report.stressResponse || {};
    if (sr.overallResilience) {
        infoBox(doc, sr.overallResilience, COLORS.bgOrange, '#fed7aa', PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }
    if (sr.copingStrategies && sr.copingStrategies.length > 0) {
        ensureSpace(doc, 30);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Coping Strategies', PAGE_MARGIN, doc.y);
        doc.y += 4;
        for (const s of sr.copingStrategies) {
            ensureSpace(doc, 16);
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${s}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 20 });
            doc.y += 2;
        }
        doc.y += 8;
    }

    // Relationship Insights
    ensureSpace(doc, 40);
    sectionHeader(doc, 'Relationship & Team Dynamics');
    const ri = report.relationshipInsights || {};
    if (ri.communicationStyle) {
        infoBox(doc, ri.communicationStyle, '#f0f9ff', '#bae6fd', PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }
    if (ri.partnershipRecommendations && ri.partnershipRecommendations.length > 0) {
        ensureSpace(doc, 30);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.text).text('Partnership Recommendations', PAGE_MARGIN, doc.y);
        doc.y += 4;
        for (const p of ri.partnershipRecommendations) {
            ensureSpace(doc, 16);
            doc.fontSize(9).font('Helvetica').fillColor(COLORS.text).text(`\u2022  ${p}`, PAGE_MARGIN + 10, doc.y, { width: CONTENT_WIDTH - 20 });
            doc.y += 2;
        }
    }
}

/** Footer on every page. */
function addFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 30;
        fillColor(doc, COLORS.textLight);
        strokeColor(doc, COLORS.border);
        doc.moveTo(PAGE_MARGIN, footerY - 6).lineTo(PAGE_WIDTH - PAGE_MARGIN, footerY - 6).stroke();
        doc.fontSize(8).font('Helvetica').text(
            `The Resilience Atlas\u2122  \u2014  For educational and self-reflection purposes only. Not a clinical assessment.  |  Page ${i + 1} of ${range.count}`,
            PAGE_MARGIN, footerY, { width: CONTENT_WIDTH, align: 'center' }
        );
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a complete PDF report using PDFKit.
 *
 * @param {Object} report  - Output of buildComprehensiveReport()
 * @param {number|string} overall - Overall resilience score (0-100)
 * @returns {Promise<Buffer>} Valid PDF binary buffer
 */
function buildPdfWithPDFKit(report, overall) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: PAGE_MARGIN,
                bufferPages: true,
                info: {
                    Title: 'The Resilience Atlas\u2122 Report',
                    Author: 'The Resilience Atlas\u2122',
                    Subject: 'Personal Resilience Assessment Report',
                },
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // ── Build pages ──────────────────────────────────────────────────
            buildCoverPage(doc, report, overall);
            buildExecutiveSummaryPage(doc, report);
            buildDimensionScoresPage(doc, report);
            buildInsightsPage(doc, report);
            buildDimensionDeepDives(doc, report);
            build30DayPlanPage(doc, report);
            buildResourcesPage(doc, report);

            // ── Footers on all pages ─────────────────────────────────────────
            addFooters(doc);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { buildPdfWithPDFKit };
