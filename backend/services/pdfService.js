'use strict';

const path = require('path');
const PDFDocument = require('pdfkit');
const { DIMENSION_CONTENT } = require('../templates/dimensionContent');
const branding = require('../config/branding');
const { getSkillLevelLabel, getSkillLevelIcon, getSkillLevelDescription } = require('../utils/skillLevels');

// Use the static brand logo file directly for PDF cover rendering.
// The logo lives in client/public/assets/ and is copied to the container
// image via `COPY . .` in the Dockerfile.
const LOGO_PNG_PATH = path.resolve(__dirname, '../../client/public/assets/logo-256x256.png');

// ── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',
    accent: '#10b981',
    accentDark: '#059669',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#1e293b',
    textMid: '#475569',
    textLight: '#94a3b8',
    border: '#e2e8f0',
    bgLight: '#f8fafc',
    bgBlue: '#eff6ff',
    bgGreen: '#f0fdf4',
    bgOrange: '#fff7ed',
    bgPurple: '#faf5ff',
    bgPink: '#fdf2f8',
    white: '#ffffff',
    coverBg: '#1e1b4b',
    coverAccent: '#4338ca',
};

const LEVEL_COLORS = {
    strong: '#059669',
    solid: '#6366f1',
    developing: '#f59e0b',
    emerging: '#ef4444',
};

const LEVEL_BG = {
    strong: '#f0fdf4',
    solid: '#eff6ff',
    developing: '#fff7ed',
    emerging: '#fef2f2',
};

// Per-dimension brand colors and icons
const DIM_CONFIG = {
    'Cognitive-Narrative':   { color: '#6366f1', bg: '#eff6ff', icon: 'C', short: 'Cognitive' },
    'Relational-Connective': { color: '#ec4899', bg: '#fdf2f8', icon: 'R', short: 'Relational' },
    'Agentic-Generative':    { color: '#f59e0b', bg: '#fffbeb', icon: 'A', short: 'Agentic' },
    'Emotional-Adaptive':    { color: '#10b981', bg: '#f0fdf4', icon: 'E', short: 'Emotional' },
    'Spiritual-Reflective':  { color: '#8b5cf6', bg: '#faf5ff', icon: 'S', short: 'Spiritual' },
    'Somatic-Regulative':    { color: '#06b6d4', bg: '#ecfeff', icon: 'B', short: 'Somatic' },
};

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_MARGIN = 45;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

// ── PDF-safe text helper ──────────────────────────────────────────────────────
// PDFKit uses built-in Helvetica/Times fonts (WinAnsi / Latin-1 only).
// Multi-byte Unicode characters such as emoji (🌟 🌱 ⚡) render as garbled
// characters (e.g. "Ø") when passed to doc.text().  This helper strips any
// character above U+00FF before handing text to PDFKit.
function pdfSafe(text) {
    return String(text).replace(/[^\u0000-\u00FF]/g, '').replace(/\s+/g, ' ').trim();
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function fc(doc, h) { doc.fillColor(h); }
function sc(doc, h) { doc.strokeColor(h); }

function fillColor(doc, hex) {
    doc.fillColor(hex);
}

function strokeColor(doc, hex) {
    doc.strokeColor(hex);
}

// ── Layout helpers ─────────────────────────────────────────────────────────────

function newPage(doc) {
    doc.addPage();
}

/** Check remaining page space and add a new page if needed. */
function ensureSpace(doc, needed) {
    const pageBottom = PAGE_HEIGHT - doc.page.margins.bottom - 20;
    if (doc.y + needed > pageBottom) {
        newPage(doc);
    }
}

/** Draw a section header bar with white text. */
function sectionHeader(doc, text, color) {
    const y = doc.y;
    const barColor = color || COLORS.primary;
    fillColor(doc, barColor);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 26, 4).fill();
    fillColor(doc, COLORS.white);
    doc.fontSize(11).font('Helvetica-Bold').text(text, PAGE_MARGIN + 12, y + 7, {
        width: CONTENT_WIDTH - 24,
        lineBreak: false,
    });
    fillColor(doc, COLORS.text);
    doc.y = y + 34;
}

/** Draw a sub-section label. */
function subHeader(doc, text, color) {
    fillColor(doc, color || COLORS.primary);
    doc.fontSize(10).font('Helvetica-Bold').text(text, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
    fillColor(doc, COLORS.text);
    doc.y += 4;
}

/** Draw a colored progress bar. */
function progressBar(doc, x, y, width, pct, color) {
    const barH = 9;
    const clampedPct = Math.max(0, Math.min(pct / 100, 1));
    const fillW = Math.max(3, clampedPct * width);
    fillColor(doc, '#e2e8f0');
    doc.roundedRect(x, y, width, barH, 4).fill();
    fillColor(doc, color || COLORS.primary);
    doc.roundedRect(x, y, fillW, barH, 4).fill();
    fillColor(doc, COLORS.text);
}

/** Draw a highlighted info box (returns new doc.y after box). */
function infoBox(doc, text, bgHex, borderHex, x, y, width) {
    if (!text) return y;
    const pad = 10;
    const innerW = width - pad * 2;
    const textH = doc.fontSize(10).heightOfString(text, { width: innerW, lineGap: 2 });
    const boxH = textH + pad * 2;
    fillColor(doc, bgHex);
    strokeColor(doc, borderHex);
    doc.roundedRect(x, y, width, boxH, 6).fillAndStroke();
    fillColor(doc, COLORS.text);
    doc.fontSize(10).font('Helvetica').text(text, x + pad, y + pad, { width: innerW, lineGap: 2 });
    strokeColor(doc, COLORS.border);
    doc.y = y + boxH + 8;
    return doc.y;
}

/** Draw a stat tile. */
function statTile(doc, label, value, x, y, w) {
    const h = 48;
    fillColor(doc, COLORS.bgLight);
    strokeColor(doc, COLORS.border);
    doc.roundedRect(x, y, w, h, 6).fillAndStroke();
    fillColor(doc, COLORS.textLight);
    doc.fontSize(7).font('Helvetica').text(label.toUpperCase(), x + 6, y + 6, {
        width: w - 12,
        align: 'center',
        lineBreak: false,
    });
    fillColor(doc, COLORS.text);
    doc.fontSize(14).font('Helvetica-Bold').text(String(value), x + 6, y + 20, {
        width: w - 12,
        align: 'center',
        lineBreak: false,
    });
    fillColor(doc, COLORS.text);
    strokeColor(doc, COLORS.border);
}

/** Draw a bullet point. */
function bullet(doc, text, indent) {
    const x = PAGE_MARGIN + (indent || 0);
    ensureSpace(doc, 14);
    fillColor(doc, COLORS.text);
    doc.fontSize(9).font('Helvetica').text('\u2022  ' + text, x, doc.y, {
        width: CONTENT_WIDTH - (indent || 0),
        lineGap: 1,
    });
    doc.y += 2;
}

/** Add footers to every buffered page except the cover (page 0). */
function addFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        // Skip the cover page — it has its own branded footer bar drawn in
        // buildCoverPage().  Drawing the standard footer on top of it would
        // create two overlapping footers and visual blending at the page 1/2
        // boundary.
        if (i === range.start) continue;

        doc.switchToPage(i);
        // Set bottom margin to 0 so footer text drawn below the normal content
        // boundary does not trigger PDFKit's auto page-break mechanism.
        doc.page.margins.bottom = 0;
        const footerY = PAGE_HEIGHT - 32;
        strokeColor(doc, COLORS.border);
        doc.moveTo(PAGE_MARGIN, footerY - 4).lineTo(PAGE_WIDTH - PAGE_MARGIN, footerY - 4).stroke();
        fillColor(doc, COLORS.textLight);
        doc.fontSize(7).font('Helvetica').text(
            branding.company.name + '  |  ' + branding.company.domain + '  |  ' + branding.company.email + '  |  For self-reflection purposes only. Not a clinical assessment.  |  Page ' + (i + 1),
            PAGE_MARGIN,
            footerY,
            { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
        );
    }
    fillColor(doc, COLORS.text);
}

// ── PAGE BUILDERS ──────────────────────────────────────────────────────────────

/** Page 1 - Premium Cover */
function buildCoverPage(doc, report, overall) {
    const dateStr = new Date(report.assessmentDate || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const archetype = report.profileArchetype || 'Resilient Explorer';

    // Deep background
    fillColor(doc, COLORS.coverBg);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();

    // Top accent strip
    fillColor(doc, COLORS.coverAccent);
    doc.rect(0, 0, PAGE_WIDTH, 8).fill();

    // Brand name
    fillColor(doc, COLORS.white);
    doc.fontSize(9).font('Helvetica').text(
        'THE RESILIENCE ATLAS\u2122  |  PERSONAL NAVIGATION REPORT',
        PAGE_MARGIN, 22,
        { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
    );

    // Brand logo
    const cx = PAGE_WIDTH / 2;
    const logoSize = 140;
    const logoX = cx - logoSize / 2;
    const logoY = 110;
    doc.image(LOGO_PNG_PATH, logoX, logoY, { width: logoSize, height: logoSize });

    // Main title
    fillColor(doc, COLORS.white);
    doc.fontSize(26).font('Helvetica-Bold').text('Your Personal', PAGE_MARGIN, 272, {
        align: 'center', width: CONTENT_WIDTH, lineBreak: false,
    });
    doc.y = 302;
    fillColor(doc, '#818cf8');
    doc.fontSize(30).font('Helvetica-Bold').text('Resilience Atlas\u2122', PAGE_MARGIN, doc.y, {
        align: 'center', width: CONTENT_WIDTH, lineBreak: false,
    });

    // Tagline
    fillColor(doc, '#c7d2fe');
    doc.y = 342;
    doc.fontSize(10).font('Helvetica').text(
        'Your Internal Compass for Life\'s Journey',
        PAGE_MARGIN, doc.y,
        { align: 'center', width: CONTENT_WIDTH, lineBreak: false }
    );

    // Score hero box
    const heroY = 374;
    fillColor(doc, COLORS.coverAccent);
    doc.roundedRect(PAGE_MARGIN + 30, heroY, CONTENT_WIDTH - 60, 130, 12).fill();

    fillColor(doc, '#c7d2fe');
    doc.fontSize(9).font('Helvetica').text(
        'OVERALL RESILIENCE SCORE',
        PAGE_MARGIN + 30, heroY + 14,
        { align: 'center', width: CONTENT_WIDTH - 60, lineBreak: false }
    );

    fillColor(doc, COLORS.white);
    doc.fontSize(52).font('Helvetica-Bold').text(
        overall + '%', PAGE_MARGIN + 30, heroY + 30,
        { align: 'center', width: CONTENT_WIDTH - 60, lineBreak: false }
    );

    fillColor(doc, '#c7d2fe');
    doc.fontSize(10).font('Helvetica').text(
        archetype,
        PAGE_MARGIN + 30, heroY + 96,
        { align: 'center', width: CONTENT_WIDTH - 60, lineBreak: false }
    );

    // Meta row
    fillColor(doc, '#94a3b8');
    doc.y = heroY + 138;
    doc.fontSize(9).font('Helvetica').text(
        'Assessment Date: ' + dateStr + '  \u2014  Primary Strength: ' + (report.dominantType || 'N/A'),
        PAGE_MARGIN, doc.y,
        { align: 'center', width: CONTENT_WIDTH, lineBreak: false }
    );

    // Bottom accent – disable bottom margin first so drawing below the content
    // area does not trigger PDFKit's automatic page-break mechanism.
    doc.page.margins.bottom = 0;
    fillColor(doc, '#312e81');
    doc.rect(0, PAGE_HEIGHT - 50, PAGE_WIDTH, 50).fill();
    fillColor(doc, '#818cf8');
    doc.fontSize(8).font('Helvetica').text(
        branding.company.name + '  |  ' + branding.company.domain + '  |  ' + branding.company.email,
        PAGE_MARGIN, PAGE_HEIGHT - 36,
        { align: 'center', width: CONTENT_WIDTH, lineBreak: false }
    );
    fillColor(doc, '#6366f1');
    doc.fontSize(7).font('Helvetica').text(
        'RESILIENCE IS NOT FOUND \u2014 IT IS CHARTED  |  ONE DAY, ONE PRACTICE, ONE CHOICE AT A TIME',
        PAGE_MARGIN, PAGE_HEIGHT - 20,
        { align: 'center', width: CONTENT_WIDTH, lineBreak: false }
    );
}

/** Page 2 - Journey Map / Executive Summary */
function buildJourneyMapPage(doc, report) {
    newPage(doc);

    sectionHeader(doc, 'YOUR RESILIENCE JOURNEY \u2014 EXECUTIVE SUMMARY', COLORS.primary);
    if (report.profileArchetype) {
        ensureSpace(doc, 60);
        sectionHeader(doc, 'YOUR ARCHETYPE: ' + report.profileArchetype.toUpperCase(), COLORS.secondary);
        ensureSpace(doc, 80);
        infoBox(doc, report.profileDescription || '', COLORS.bgPurple, '#c4b5fd', PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    // Key stats row
    ensureSpace(doc, 70);
    const overallNum = Number(report.overall || 0);
    const topDim = report.dominantType || 'N/A';
    const rankedDims = Object.entries(report.dimensionAnalysis || {})
        .sort((a, b) => a[1].percentage - b[1].percentage);
    const bottomDimEntry = rankedDims.length > 0 ? rankedDims[0] : null;
    const bottomSkillLabel = bottomDimEntry
        ? getSkillLevelLabel(Number(bottomDimEntry[1].percentage || 0))
        : 'N/A';
    const archetypeValue = report.profileArchetype
        ? report.profileArchetype.replace(/^The /, '')
        : getSkillLevelLabel(overallNum);

    const tileW = (CONTENT_WIDTH - 12) / 4;
    const tileY = doc.y + 4;
    const landscapeLevel = getSkillLevelLabel(overallNum);
    statTile(doc, 'Resilience Foundation', landscapeLevel, PAGE_MARGIN, tileY, tileW - 3);
    statTile(doc, 'Anchor Dimension', topDim.split('-')[0], PAGE_MARGIN + (tileW + 1), tileY, tileW - 3);
    statTile(doc, 'Growth Frontier', bottomSkillLabel, PAGE_MARGIN + (tileW + 1) * 2, tileY, tileW - 3);
    statTile(doc, 'Your Archetype', archetypeValue, PAGE_MARGIN + (tileW + 1) * 3, tileY, tileW - 3);
    doc.y = tileY + 58;

    // Dimension skill table — clean two-column layout with absolute positioning
    ensureSpace(doc, 40);
    subHeader(doc, 'WAYPOINTS ON YOUR RESILIENCE MAP');
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMid).text(
        'Six territories of resilience form your complete inner landscape. Each holds unique strengths and growth edges \u2014 together they define your resilience identity and navigation approach to life\'s challenges.',
        PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 }
    );
    fillColor(doc, COLORS.text);
    doc.y += 12;

    // Table header
    ensureSpace(doc, 20);
    const tableHeaderY = doc.y;
    const colDimW = 200;
    const colLevelW = 115;
    const colBarX = PAGE_MARGIN + colDimW + colLevelW + 10;
    const colBarW = CONTENT_WIDTH - colDimW - colLevelW - 15;
    fillColor(doc, COLORS.textMid);
    doc.fontSize(8).font('Helvetica-Bold').text('DIMENSION', PAGE_MARGIN, tableHeaderY, { width: colDimW, lineBreak: false });
    doc.fontSize(8).font('Helvetica-Bold').text('SKILL LEVEL', PAGE_MARGIN + colDimW + 5, tableHeaderY, { width: colLevelW, lineBreak: false });
    strokeColor(doc, COLORS.border);
    doc.moveTo(PAGE_MARGIN, tableHeaderY + 12).lineTo(PAGE_WIDTH - PAGE_MARGIN, tableHeaderY + 12).stroke();
    strokeColor(doc, COLORS.border);
    doc.y = tableHeaderY + 18;

    const dims = Object.entries(report.dimensionAnalysis || {});
    for (const [dim, analysis] of dims) {
        ensureSpace(doc, 18);
        const cfg = DIM_CONFIG[dim] || { color: COLORS.primary };
        const levelColor = LEVEL_COLORS[analysis.level] || COLORS.primary;
        const pct = Number(analysis.percentage || 0);
        const skillLabel = getSkillLevelLabel(pct);
        const rowY = doc.y;

        fillColor(doc, cfg.color);
        doc.fontSize(9).font('Helvetica-Bold').text(dim, PAGE_MARGIN, rowY, { width: colDimW, lineBreak: false });

        fillColor(doc, levelColor);
        doc.fontSize(9).font('Helvetica-Bold').text(skillLabel, PAGE_MARGIN + colDimW + 5, rowY, { width: colLevelW, lineBreak: false });

        progressBar(doc, colBarX, rowY + 2, colBarW, pct, cfg.color);

        doc.y = rowY + 16;
        fillColor(doc, COLORS.text);
    }
}

/** Page 3 - Visual Dashboard */
function buildDashboardPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'CHARTING YOUR TERRITORY \u2014 DIMENSION DASHBOARD', COLORS.primary);

    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMid).text(
        'Each bar below represents one territory of your resilience map. Your scores are your starting coordinates \u2014 not your destination. Every territory can be developed through intentional practice.',
        PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 }
    );
    fillColor(doc, COLORS.text);
    doc.y += 12;

    const dims = Object.entries(report.dimensionAnalysis || {});
    const labelW = 165;
    const barX = PAGE_MARGIN + labelW + 10;
    const barW = CONTENT_WIDTH - labelW - 60;
    const barRowH = 36;

    for (const [dim, analysis] of dims) {
        ensureSpace(doc, barRowH + 8);
        const cfg = DIM_CONFIG[dim] || { color: COLORS.primary, bg: COLORS.bgLight };
        const levelColor = LEVEL_COLORS[analysis.level] || COLORS.primary;
        const pct = Number(analysis.percentage || 0);
        const rowY = doc.y;

        fillColor(doc, cfg.bg);
        doc.roundedRect(PAGE_MARGIN, rowY, CONTENT_WIDTH, barRowH + 4, 6).fill();

        fillColor(doc, cfg.color);
        doc.fontSize(10).font('Helvetica-Bold').text(dim, PAGE_MARGIN + 8, rowY + 5, {
            width: labelW - 12, lineBreak: false,
        });

        const content = DIMENSION_CONTENT[dim];
        if (content && content.tagline) {
            fillColor(doc, COLORS.textLight);
            doc.fontSize(7).font('Helvetica').text(content.tagline, PAGE_MARGIN + 8, rowY + 19, {
                width: labelW - 12, lineBreak: false,
            });
        }

        progressBar(doc, barX, rowY + 14, barW, pct, cfg.color);

        const skillLabel = getSkillLevelLabel(pct);
        const skillIcon = getSkillLevelIcon(pct);
        fillColor(doc, COLORS.text);
        doc.fontSize(9).font('Helvetica-Bold').text(pdfSafe(skillIcon + ' ' + skillLabel), barX + barW + 6, rowY + 10, {
            width: 60, lineBreak: true,
        });

        fillColor(doc, COLORS.text);
        doc.y = rowY + barRowH + 10;
    }

    // Skill Level Legend – add clear vertical gap so it doesn't crowd the last bar.
    ensureSpace(doc, 80);
    doc.y += 16;
    sectionHeader(doc, 'SKILL LEVEL GUIDE', COLORS.textMid);

    const levels = [
        { icon: '🌟', label: 'Developed Skill', desc: 'Your anchor \u2014 naturally drawn on under pressure' },
        { icon: '🌱', label: 'Building Skill', desc: 'Actively strengthening \u2014 consistent practice is showing' },
        { icon: '⚡', label: 'Foundational Skill', desc: 'Your growth frontier \u2014 fertile ground for development' },
    ];

    const legColW = (CONTENT_WIDTH - 12) / 2;
    const legStartY = doc.y;
    const legRowH = 34;
    const legSwatchW = 10;        // width of the colored swatch square
    const legTextOffset = 14;     // horizontal gap between swatch left-edge and text
    const legTextW = legColW - legTextOffset - 2; // available width for text within one column
    const legDescOffsetY = 13;    // vertical gap from label top to description line
    const SKILL_LEVEL_COLORS = ['#10b981', '#3b82f6', '#f97316'];
    for (let i = 0; i < levels.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = PAGE_MARGIN + col * (legColW + 12);
        const y = legStartY + row * legRowH;
        fillColor(doc, SKILL_LEVEL_COLORS[i] || COLORS.primary);
        doc.roundedRect(x, y + 2, legSwatchW, legSwatchW, 2).fill();
        // Label on its own line — explicit width prevents overflow into adjacent column
        fillColor(doc, COLORS.text);
        doc.fontSize(8).font('Helvetica-Bold').text(pdfSafe(levels[i].icon + ' ' + levels[i].label), x + legTextOffset, y, {
            width: legTextW,
            lineBreak: false,
        });
        // Description on second line — independent text call with clamped width
        fillColor(doc, COLORS.textLight);
        doc.fontSize(7.5).font('Helvetica').text(levels[i].desc, x + legTextOffset, y + legDescOffsetY, {
            width: legTextW,
            lineBreak: false,
        });
        fillColor(doc, COLORS.text);
    }
    doc.y = legStartY + Math.ceil(levels.length / 2) * legRowH + 10;

    ensureSpace(doc, 48);
    infoBox(
        doc,
        'Your coordinates have been plotted. The following pages explore each territory in detail \u2014 with personalized insights, life applications, and your daily navigation tools.',
        COLORS.bgBlue,
        COLORS.primary,
        PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** Pages 4-9 - One dimension per page */
function buildDimensionPage(doc, dimName, analysis) {
    newPage(doc);
    const cfg = DIM_CONFIG[dimName] || { color: COLORS.primary, bg: COLORS.bgLight, icon: 'D', short: dimName };
    const levelColor = LEVEL_COLORS[analysis.level] || COLORS.primary;
    const pct = Number(analysis.percentage || 0);
    const content = DIMENSION_CONTENT[dimName];

    // Dimension header band
    fillColor(doc, cfg.color);
    doc.rect(0, 0, PAGE_WIDTH, 52).fill();

    fillColor(doc, COLORS.white);
    doc.fontSize(18).font('Helvetica-Bold').text(
        dimName, PAGE_MARGIN, 12, { width: CONTENT_WIDTH * 0.65, lineBreak: false }
    );
    const skillLabel = getSkillLevelLabel(pct);
    const skillIcon = getSkillLevelIcon(pct);
    doc.fontSize(14).font('Helvetica-Bold').text(
        pdfSafe(skillIcon + ' ' + skillLabel), PAGE_MARGIN + CONTENT_WIDTH * 0.65, 10,
        { width: CONTENT_WIDTH * 0.35, align: 'right', lineBreak: false }
    );

    // Level pill
    fillColor(doc, levelColor);
    doc.roundedRect(PAGE_MARGIN + CONTENT_WIDTH * 0.65, 36, 88, 13, 4).fill();
    fillColor(doc, COLORS.white);
    doc.fontSize(8).font('Helvetica-Bold').text(
        (analysis.level || '').toUpperCase(), PAGE_MARGIN + CONTENT_WIDTH * 0.65, 39,
        { width: 88, align: 'center', lineBreak: false }
    );

    doc.y = 62;

    // Tagline
    if (content && content.tagline) {
        fillColor(doc, COLORS.textMid);
        doc.fontSize(10).font('Helvetica-Oblique').text(
            '"' + content.tagline + '"', PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, lineBreak: false }
        );
        doc.y += 14;
    }

    // Progress bar
    progressBar(doc, PAGE_MARGIN, doc.y, CONTENT_WIDTH, pct, cfg.color);
    doc.y += 14;

    // Percentile note
    if (analysis.benchmark) {
        fillColor(doc, COLORS.textLight);
        doc.fontSize(8).font('Helvetica').text(
            'Approx. ' + analysis.benchmark.percentile + 'th percentile  \u2014  Population mean: ' + analysis.benchmark.populationMean + '%',
            PAGE_MARGIN, doc.y, { lineBreak: false }
        );
        doc.y += 14;
    }
    // ── Personalized insight (compact) ───────────────────────────────────
    if (analysis.personalizedInsight) {
        infoBox(
            doc,
            'What this means for your journey:\n\n' + analysis.personalizedInsight,
            cfg.bg, cfg.color, PAGE_MARGIN, doc.y, CONTENT_WIDTH
        );
    }

    // Two-column: Strengths + Growth Opportunities
    ensureSpace(doc, 80);
    const colW2 = (CONTENT_WIDTH - 10) / 2;
    const col1X = PAGE_MARGIN;
    const col2X = PAGE_MARGIN + colW2 + 10;
    const colY = doc.y;

    fillColor(doc, COLORS.accentDark);
    doc.fontSize(9).font('Helvetica-Bold').text('STRENGTHS DEMONSTRATED', col1X, colY, {
        width: colW2, lineBreak: false,
    });
    fillColor(doc, COLORS.text);
    doc.y = colY + 14;

    const strengths = analysis.strengthsDemonstrated || [];
    let maxStrY = doc.y;
    for (const s of strengths.slice(0, 4)) {
        ensureSpace(doc, 14);
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(
            '\u2022  ' + s, col1X, doc.y, { width: colW2 - 4, lineGap: 1 }
        );
        doc.y += 2;
        if (doc.y > maxStrY) maxStrY = doc.y;
    }

    doc.y = colY;
    fillColor(doc, cfg.color);
    doc.fontSize(9).font('Helvetica-Bold').text('GROWTH OPPORTUNITIES', col2X, colY, {
        width: colW2, lineBreak: false,
    });
    fillColor(doc, COLORS.text);
    let gy = colY + 14;
    const growths = analysis.growthOpportunities || [];
    for (const g of growths.slice(0, 4)) {
        const textH = doc.fontSize(8).heightOfString('\u2022  ' + g, { width: colW2 - 4, lineGap: 1 });
        doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(
            '\u2022  ' + g, col2X, gy, { width: colW2 - 4, lineGap: 1 }
        );
        gy += textH + 3;
        if (gy > maxStrY) maxStrY = gy;
    }
    doc.y = maxStrY + 6;

    // Daily Micro-Practice
    if (analysis.dailyMicroPractice) {
        ensureSpace(doc, 50);
        infoBox(
            doc,
            'DAILY 15-MINUTE PRACTICE\n' + analysis.dailyMicroPractice,
            COLORS.bgOrange, COLORS.warning, PAGE_MARGIN, doc.y, CONTENT_WIDTH
        );
    }

    // Life Applications
    const la = content && content.lifeApplications;
    if (la) {
        ensureSpace(doc, 40);
        sectionHeader(doc, 'HOW ' + dimName.toUpperCase() + ' SHAPES YOUR LIFE', cfg.color);

        const apps = [
            { area: 'Romantic Relationships', text: la.relationships },
            { area: 'Friendships & Social Life', text: la.friendships },
            { area: 'Parenting & Caregiving', text: la.parenting },
            { area: 'Work & Career', text: la.work },
            { area: 'Personal Growth', text: la.personalGrowth },
        ];

        for (const app of apps) {
            if (!app.text) continue;
            ensureSpace(doc, 30);
            const rowY = doc.y;
            fillColor(doc, COLORS.primary);
            doc.fontSize(9).font('Helvetica-Bold').text(app.area + ':', PAGE_MARGIN, rowY, {
                width: 120, lineBreak: false,
            });
            fillColor(doc, COLORS.text);
            doc.fontSize(9).font('Helvetica').text(app.text, PAGE_MARGIN + 128, rowY, {
                width: CONTENT_WIDTH - 130, lineGap: 1,
            });
            const textH = doc.heightOfString(app.text, { width: CONTENT_WIDTH - 130, lineGap: 1 });
            doc.y = rowY + Math.max(14, textH) + 5;
            fillColor(doc, COLORS.text);
        }
    }

    // 30-day progression highlights
    if (analysis.weeklyProgression && analysis.weeklyProgression.length > 0) {
        ensureSpace(doc, 40);
        subHeader(doc, '30-DAY PROGRESSION PATH', cfg.color);
        for (const week of analysis.weeklyProgression) {
            if (!week) continue;
            ensureSpace(doc, 18);
            doc.fontSize(8).font('Helvetica').fillColor(COLORS.text).text(
                '\u2022  ' + week, PAGE_MARGIN + 8, doc.y, { width: CONTENT_WIDTH - 8, lineGap: 1 }
            );
            doc.y += 4;
        }
    }
}

/** Pages 10-11 - Strength Integration & Synergies */
function buildStrengthIntegrationPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'STRENGTH INTEGRATION \u2014 YOUR INNER ALLIANCE', COLORS.primary);

    const si = report.strengthIntegration || {};

    if (si.topThreeCombo) {
        doc.y += 4;
        fillColor(doc, COLORS.text);
        doc.fontSize(11).font('Helvetica-Bold').text(
            'Your Top Combination: ' + si.topThreeCombo, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH }
        );
        doc.y += 10;
    }

    if (si.blueprint) {
        infoBox(doc, si.blueprint, COLORS.bgGreen, COLORS.accentDark, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    if (si.synergies && si.synergies.length > 0) {
        ensureSpace(doc, 40);
        subHeader(doc, 'HOW YOUR STRENGTHS AMPLIFY EACH OTHER');
        for (const s of si.synergies) { bullet(doc, s); }
        doc.y += 6;
    }

    if (si.gaps && si.gaps.length > 0) {
        ensureSpace(doc, 40);
        subHeader(doc, 'GROWTH FRONTIERS TO CHART NEXT', COLORS.warning);
        for (const g of si.gaps) { bullet(doc, g); }
        doc.y += 8;
    }

    // Dimension grid
    ensureSpace(doc, 60);
    sectionHeader(doc, 'DIMENSION NAVIGATION MAP', COLORS.secondary);

    const ranked = Object.entries(report.dimensionAnalysis || {})
        .sort((a, b) => b[1].percentage - a[1].percentage);

    const dimColW = (CONTENT_WIDTH - 10) / 3;
    const gridStartY = doc.y;
    for (let i = 0; i < Math.min(ranked.length, 6); i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const [dim, analysis] = ranked[i];
        const cfg = DIM_CONFIG[dim] || { color: COLORS.primary };
        const x = PAGE_MARGIN + col * (dimColW + 5);
        const y = gridStartY + row * 48;

        fillColor(doc, cfg.color);
        doc.roundedRect(x, y, dimColW, 42, 6).fill();
        fillColor(doc, COLORS.white);
        doc.fontSize(8).font('Helvetica-Bold').text(
            dim.split('-')[0], x + 6, y + 6, { width: dimColW - 12, lineBreak: false }
        );
        const gridSkillIcon = getSkillLevelIcon(Number(analysis.percentage || 0));
        const gridSkillLabel = getSkillLevelLabel(Number(analysis.percentage || 0));
        doc.fontSize(9).font('Helvetica-Bold').text(
            pdfSafe(gridSkillIcon + ' ' + gridSkillLabel), x + 6, y + 20,
            { width: dimColW - 12, align: 'right', lineBreak: false }
        );
        fillColor(doc, COLORS.text);
    }
    doc.y = gridStartY + Math.ceil(Math.min(ranked.length, 6) / 3) * 48 + 12;
}

/** Page 12 - Stress Response Profile */
function buildStressResponsePage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'YOUR EMERGENCY NAVIGATION SYSTEM \u2014 STRESS RESPONSE PROFILE', '#dc2626');

    const sr = report.stressResponse || {};

    if (sr.overallResilience) {
        infoBox(doc,
            'Your Stress Navigation Style:\n\n' + sr.overallResilience,
            COLORS.bgOrange, COLORS.warning, PAGE_MARGIN, doc.y, CONTENT_WIDTH
        );
    }

    if (sr.strengthsUnderStress && sr.strengthsUnderStress.length > 0) {
        ensureSpace(doc, 40);
        subHeader(doc, 'WHEN YOU\'RE AT YOUR BEST UNDER PRESSURE', COLORS.accentDark);
        for (const s of sr.strengthsUnderStress) {
            const cfg = DIM_CONFIG[s] || {};
            bullet(doc, s + ' \u2014 your anchor territory under stress');
        }
    }

    if (sr.vulnerabilitiesUnderStress && sr.vulnerabilitiesUnderStress.length > 0) {
        ensureSpace(doc, 40);
        subHeader(doc, 'WHAT TYPICALLY DRAINS YOUR RESERVES', COLORS.warning);
        for (const v of sr.vulnerabilitiesUnderStress) {
            bullet(doc, v + ' \u2014 needs extra support when stress is high');
        }
        doc.y += 6;
    }

    if (sr.copingStrategies && sr.copingStrategies.length > 0) {
        ensureSpace(doc, 50);
        subHeader(doc, 'YOUR PERSONALIZED COPING STRATEGIES');
        for (const s of sr.copingStrategies.slice(0, 5)) { bullet(doc, s, 8); }
        doc.y += 8;
    }

    if (sr.groundingTechniques && sr.groundingTechniques.length > 0) {
        ensureSpace(doc, 60);
        sectionHeader(doc, 'EMERGENCY GROUNDING TECHNIQUES', '#dc2626');
        for (const t of sr.groundingTechniques) { bullet(doc, t, 8); }
        doc.y += 6;
    }

    ensureSpace(doc, 80);
    infoBox(
        doc,
        '5-4-3-2-1 Sensory Grounding: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This grounds you instantly in the present moment.\n\nBox Breathing: Inhale 4 counts, hold 4, exhale 4, hold 4. Repeat 4 times. This activates your parasympathetic nervous system and restores calm within minutes.',
        COLORS.bgBlue, COLORS.primary, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** Page 13 - Relationship & Team Dynamics */
function buildRelationshipDynamicsPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'NAVIGATING WITH OTHERS \u2014 RELATIONSHIP & TEAM DYNAMICS', COLORS.secondary);

    const ri = report.relationshipInsights || {};

    if (ri.communicationStyle) {
        subHeader(doc, 'YOUR COMMUNICATION STYLE & TEAM ROLE');
        infoBox(doc, ri.communicationStyle, COLORS.bgPurple, COLORS.secondary, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    if (ri.partnershipRecommendations && ri.partnershipRecommendations.length > 0) {
        ensureSpace(doc, 50);
        subHeader(doc, 'PARTNERSHIP & RELATIONSHIP RECOMMENDATIONS');
        for (const p of ri.partnershipRecommendations) { bullet(doc, p, 8); }
        doc.y += 8;
    }

    // Life area applications from top dimensions
    ensureSpace(doc, 80);
    sectionHeader(doc, 'YOUR RESILIENCE ACROSS KEY LIFE AREAS', COLORS.primary);

    const topDims = (report.topDimensions || []).slice(0, 3);
    const lifeAreas = [
        { key: 'relationships', label: 'Romantic Relationships' },
        { key: 'friendships', label: 'Friendships & Social Life' },
        { key: 'parenting', label: 'Parenting & Caregiving' },
        { key: 'work', label: 'Work & Career' },
    ];

    for (const area of lifeAreas) {
        const apps = topDims
            .map((dim) => {
                const content = DIMENSION_CONTENT[dim];
                return content && content.lifeApplications && content.lifeApplications[area.key];
            })
            .filter(Boolean);

        if (apps.length > 0) {
            ensureSpace(doc, 40);
            fillColor(doc, COLORS.primary);
            doc.fontSize(10).font('Helvetica-Bold').text(area.label, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH });
            doc.y += 4;
            fillColor(doc, COLORS.text);
            doc.fontSize(9).font('Helvetica').text(apps[0], PAGE_MARGIN + 10, doc.y, {
                width: CONTENT_WIDTH - 10, lineGap: 2,
            });
            doc.y += 8;
        }
    }

    ensureSpace(doc, 50);
    infoBox(
        doc,
        'Conflict Navigation Insight: Your archetype shapes how you naturally approach conflict. Notice whether you tend to engage directly (agentic), seek connection first (relational), process internally (cognitive/spiritual), regulate physically (somatic), or feel deeply before responding (emotional). Awareness of your default pattern is the first step to more conscious navigation.',
        COLORS.bgLight, COLORS.border, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** Page 14 - 30-Day Expedition Part 1 (Weeks 1-2) */
function buildActionPlanPage1(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'YOUR 30-DAY RESILIENCE EXPEDITION \u2014 THE JOURNEY MAP', COLORS.accentDark);

    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMid).text(
        'Your expedition begins today. Each week charts a new territory \u2014 building resilience one intentional practice at a time. 15 minutes a day is all it takes to navigate toward a stronger, more grounded you.',
        PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 }
    );
    fillColor(doc, COLORS.text);
    doc.y += 12;

    const plan = report.thirtyDayPlan || {};
    const weekDefs = [
        { key: 'week1', label: 'WEEK 1', color: COLORS.primary },
        { key: 'week2', label: 'WEEK 2', color: COLORS.secondary },
    ];

    for (const { key, label, color } of weekDefs) {
        const data = plan[key];
        if (!data) continue;
        ensureSpace(doc, 80);

        const weekY = doc.y;
        fillColor(doc, color);
        doc.roundedRect(PAGE_MARGIN, weekY, CONTENT_WIDTH, 24, 4).fill();
        fillColor(doc, COLORS.white);
        doc.fontSize(11).font('Helvetica-Bold').text(
            label + ': ' + (data.focus || '').toUpperCase(),
            PAGE_MARGIN + 10, weekY + 6, { width: CONTENT_WIDTH - 20, lineBreak: false }
        );
        fillColor(doc, COLORS.text);
        doc.y = weekY + 32;

        // Exercises
        if (data.exercises && data.exercises.length > 0) {
            subHeader(doc, 'Daily 15-Minute Practices', color);
            for (const ex of data.exercises) {
                if (!ex) continue;
                bullet(doc, ex, 8);
            }
        }

        // Life area applications
        const lifeAreas = ['\u2764\uFE0F Relationships', '\u{1F91D} Friendships', '\u{1F476} Parenting', '\u{1F4BC} Work', '\u{1F331} Growth'];
        doc.y += 4;
        fc(doc, COLORS.textMid);
        doc.fontSize(8).font('Helvetica-Bold').text(
            `Apply in: ${lifeAreas.join('  \u2022  ')}`,
            PAGE_MARGIN + 8, doc.y, { width: CONTENT_WIDTH - 16 }
        );
        doc.y += 12;

        // Affirmation
        if (data.affirmation) {
            ensureSpace(doc, 24);
            fillColor(doc, color);
            doc.fontSize(10).font('Helvetica-Oblique').text(
                '\u201c' + data.affirmation + '\u201d',
                PAGE_MARGIN + 20, doc.y,
                { width: CONTENT_WIDTH - 40, align: 'center' }
            );
            fillColor(doc, COLORS.text);
            doc.y += 6;
        }
        doc.y += 10;
    }

    // Progress checklist
    ensureSpace(doc, 60);
    sectionHeader(doc, 'WEEKS 1-2 PROGRESS TRACKING CHECKLIST', COLORS.accent);
    const checkItems = [
        'Completed at least 10 of 14 daily practices',
        'Identified my primary resilience anchor dimension',
        'Shared my journey with at least one trusted person',
        'Noticed one stress response pattern I want to navigate differently',
        'Journaled or reflected at least 5 times this fortnight',
    ];
    for (const item of checkItems) {
        ensureSpace(doc, 16);
        strokeColor(doc, COLORS.border);
        fillColor(doc, COLORS.white);
        doc.roundedRect(PAGE_MARGIN + 4, doc.y, 10, 10, 2).fillAndStroke();
        fillColor(doc, COLORS.text);
        doc.fontSize(9).font('Helvetica').text('  ' + item, PAGE_MARGIN + 18, doc.y, {
            width: CONTENT_WIDTH - 20, lineBreak: false,
        });
        doc.y += 14;
    }

    // Leveraging your type
    ensureSpace(doc, 55);
    infoBox(doc,
        '\uD83D\uDEE4\uFE0F  Your Navigator Type is not a cage \u2014 it is a compass. Understanding it lets you lean ' +
        'into your natural strengths while deliberately developing the dimensions that will round out your resilience. ' +
        'The most resilient people know their type deeply and choose, each day, when to navigate from their strength ' +
        'and when to stretch beyond it.',
        COLORS.bgBlue, COLORS.primary, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
}

/** Page 15 - 30-Day Expedition Part 2 (Weeks 3-4) */
function buildActionPlanPage2(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'YOUR 30-DAY EXPEDITION \u2014 WEEKS 3 & 4: INTEGRATION', COLORS.accentDark);

    const plan = report.thirtyDayPlan || {};
    const weekDefs = [
        { key: 'week3', label: 'WEEK 3', color: COLORS.accent },
        { key: 'week4', label: 'WEEK 4', color: COLORS.warning },
    ];

    for (const { key, label, color } of weekDefs) {
        const data = plan[key];
        if (!data) continue;
        ensureSpace(doc, 80);

        const weekY = doc.y;
        fillColor(doc, color);
        doc.roundedRect(PAGE_MARGIN, weekY, CONTENT_WIDTH, 24, 4).fill();
        fillColor(doc, COLORS.white);
        doc.fontSize(11).font('Helvetica-Bold').text(
            label + ': ' + (data.focus || '').toUpperCase(),
            PAGE_MARGIN + 10, weekY + 6, { width: CONTENT_WIDTH - 20, lineBreak: false }
        );
        fillColor(doc, COLORS.text);
        doc.y = weekY + 32;

        if (data.exercises && data.exercises.length > 0) {
            subHeader(doc, 'Daily 15-Minute Practices', color);
            for (const ex of data.exercises) {
                if (!ex) continue;
                bullet(doc, ex, 8);
            }
        }

        if (data.affirmation) {
            ensureSpace(doc, 24);
            fillColor(doc, color);
            doc.fontSize(10).font('Helvetica-Oblique').text(
                '\u201c' + data.affirmation + '\u201d',
                PAGE_MARGIN + 20, doc.y,
                { width: CONTENT_WIDTH - 40, align: 'center' }
            );
            fillColor(doc, COLORS.text);
            doc.y += 6;
        }
        doc.y += 10;
    }

    // Success metrics
    ensureSpace(doc, 60);
    sectionHeader(doc, '30-DAY SUCCESS METRICS', COLORS.accentDark);
    const metrics = [
        { metric: 'Daily Practice', target: 'Completed 20+ of 30 daily practices' },
        { metric: 'Awareness', target: 'Can name all 6 dimensions and your score in each' },
        { metric: 'Application', target: 'Applied at least one practice to a real-life challenge' },
        { metric: 'Relationships', target: 'Had a meaningful conversation about resilience' },
        { metric: 'Wellbeing', target: 'Noticed improvement in at least one area of daily life' },
        { metric: 'Next Step', target: 'Ready to retake the assessment and chart your growth' },
    ];
    const mColW = (CONTENT_WIDTH - 8) / 2;
    const mStartY = doc.y;
    for (let i = 0; i < metrics.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = PAGE_MARGIN + col * (mColW + 8);
        const y = mStartY + row * 32;
        fillColor(doc, COLORS.bgGreen);
        strokeColor(doc, COLORS.accentDark);
        doc.roundedRect(x, y, mColW, 26, 4).fillAndStroke();
        fillColor(doc, COLORS.accentDark);
        doc.fontSize(8).font('Helvetica-Bold').text(metrics[i].metric, x + 6, y + 4, {
            width: mColW - 12, lineBreak: false,
        });
        fillColor(doc, COLORS.text);
        doc.fontSize(7).font('Helvetica').text(metrics[i].target, x + 6, y + 15, {
            width: mColW - 12, lineBreak: false,
        });
        strokeColor(doc, COLORS.border);
        fillColor(doc, COLORS.text);
    }
    doc.y = mStartY + Math.ceil(metrics.length / 2) * 32 + 12;

    ensureSpace(doc, 50);
    infoBox(
        doc,
        'RETAKE RECOMMENDATION: After completing your 30-day expedition, retake the Resilience Atlas assessment to chart your growth. Most people see meaningful shifts within 30 days of consistent practice. Your next map will show how far you have navigated.',
        COLORS.bgBlue, COLORS.primary, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** Page 16 - Navigation Tools (Resources) */
function buildResourcesPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'YOUR NAVIGATION TOOLKIT \u2014 PERSONALIZED RESOURCES', COLORS.primary);

    doc.fontSize(9).font('Helvetica').fillColor(COLORS.textMid).text(
        'These resources have been curated based on your growth-frontier dimensions \u2014 the territories with the most potential on your map. One resource from each category, committed to for 30 days, creates significant change.',
        PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 }
    );
    fillColor(doc, COLORS.text);
    doc.y += 12;

    const res = report.recommendedResources || {};
    const sections = [
        { title: 'WORKSHOPS & COURSES', items: res.workshops, bg: COLORS.bgBlue, border: COLORS.primary },
        { title: 'VIDEOS & TALKS', items: res.videos, bg: COLORS.bgPurple, border: COLORS.secondary },
        { title: 'DAILY PRACTICES & TECHNIQUES', items: res.practices, bg: COLORS.bgGreen, border: COLORS.accent },
        { title: 'BOOKS & READING LIST', items: res.readingMaterials, bg: COLORS.bgOrange, border: COLORS.warning },
    ];

    for (const section of sections) {
        if (!section.items || section.items.length === 0) continue;
        ensureSpace(doc, 40);
        sectionHeader(doc, section.title, COLORS.textMid);
        for (const item of section.items) { bullet(doc, item, 8); }
        doc.y += 6;
    }

    ensureSpace(doc, 80);
    sectionHeader(doc, 'CONNECT WITH US', COLORS.primary);
    bullet(doc, 'Website: ' + branding.company.domain, 8);
    bullet(doc, 'Email: ' + branding.company.email, 8);
    bullet(doc, 'LinkedIn: ' + branding.social.linkedin, 8);
    bullet(doc, 'X (Twitter): ' + branding.social.twitter, 8);
    bullet(doc, 'Facebook: ' + branding.social.facebook, 8);
    doc.y += 6;
}

// PAGE 15 — Relationship Navigation & Team Dynamics ───────────────────────────
function buildRelationshipPage(doc, report) {
    newPage(doc);
    sectionHeader(doc, 'CHARTING COURSE WITH OTHERS \u2014 RELATIONSHIP NAVIGATION', COLORS.primary);

    ensureSpace(doc, 80);
    sectionHeader(doc, 'APPS, COMMUNITIES & COACHING', COLORS.textMid);
    const appItems = [
        'Mindfulness Apps: Headspace, Calm, Insight Timer \u2014 for somatic and spiritual resilience',
        'Community: Search for resilience or growth communities on Meetup.com',
        'Therapy & Coaching: A therapist or coach who specializes in your lowest dimension',
        'Podcasts: "The Good Life Project", "On Being", "The Huberman Lab"',
        'Support Groups: Psychology Today therapist directory or your local community center',
    ];
    for (const item of appItems) { bullet(doc, item, 8); }
    doc.y += 8;

    ensureSpace(doc, 40);
    infoBox(
        doc,
        'Navigation Tip: You do not need all these resources. Choose ONE from each category that resonates with you and commit to it for 30 days. Depth of engagement beats breadth of collection every time.',
        COLORS.bgLight, COLORS.border, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** Page 17 - Benchmarking, Context & Growth Horizon */
function buildBenchmarkingPage(doc, report, overall) {
    newPage(doc);
    sectionHeader(doc, 'BENCHMARKING, CONTEXT & YOUR GROWTH HORIZON', COLORS.primary);

    const overallNum = Number(overall || 0);
    const populationMeans = Object.values(DIMENSION_CONTENT).map((c) => c.benchmark.populationMean);
    const avgMean = Math.round(populationMeans.reduce((a, b) => a + b, 0) / populationMeans.length);
    const overallSkillLabel = getSkillLevelLabel(overallNum);

    infoBox(
        doc,
        'Population Context: Your overall resilience reflects ' + overallSkillLabel + ' capacity. ' +
        'This reflects your current state \u2014 not your ceiling. ' +
        'Resilience is trainable, and research consistently shows meaningful improvement with deliberate practice over 30-90 days.',
        COLORS.bgBlue, COLORS.primary, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    // Per-dimension grid
    ensureSpace(doc, 100);
    subHeader(doc, 'YOUR COORDINATES ON THE RESILIENCE MAP');

    const dims = Object.entries(report.dimensionAnalysis || {});
    const gridColW = (CONTENT_WIDTH - 10) / 3;
    const gridY = doc.y;
    for (let i = 0; i < dims.length; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const [dim, analysis] = dims[i];
        const cfg = DIM_CONFIG[dim] || { color: COLORS.primary };
        const x = PAGE_MARGIN + col * (gridColW + 5);
        const y = gridY + row * 50;

        fillColor(doc, cfg.color);
        doc.roundedRect(x, y, gridColW, 44, 6).fill();
        fillColor(doc, COLORS.white);
        doc.fontSize(8).font('Helvetica-Bold').text(dim.split('-')[0], x + 6, y + 6, {
            width: gridColW - 12, lineBreak: false,
        });
        const benchSkillIcon = getSkillLevelIcon(Number(analysis.percentage || 0));
        const benchSkillLabel = getSkillLevelLabel(Number(analysis.percentage || 0));
        doc.fontSize(9).font('Helvetica-Bold').text(
            pdfSafe(benchSkillIcon + ' ' + benchSkillLabel), x + 6, y + 20,
            { width: gridColW - 12, align: 'right', lineBreak: false }
        );
        fillColor(doc, COLORS.text);
    }
    doc.y = gridY + Math.ceil(dims.length / 3) * 50 + 12;

    // Science section
    ensureSpace(doc, 80);
    sectionHeader(doc, 'WHAT SCIENCE SAYS ABOUT YOUR GROWTH POTENTIAL', COLORS.secondary);
    const sciencePoints = [
        'Neuroplasticity: The brain remains changeable throughout life. Resilience practices create measurable neural changes within weeks.',
        'Post-Traumatic Growth: Research by Tedeschi & Calhoun shows adversity, when processed well, can lead to profound positive change.',
        'The 66-Day Habit: Studies suggest it takes an average of 66 days to form a new automatic behavior \u2014 your 30-day plan is a powerful start.',
        'Social Contagion: Resilience is catching. Spending time with resilient people measurably increases your own capacity.',
        'Mindfulness & Regulation: Just 8 weeks of consistent mindfulness practice produces measurable changes in brain structure associated with stress regulation.',
    ];
    for (const point of sciencePoints) { bullet(doc, point, 8); }
    doc.y += 8;

    // Next steps
    ensureSpace(doc, 70);
    sectionHeader(doc, 'YOUR NEXT WAYPOINTS', COLORS.accentDark);
    const nextSteps = [
        { step: '30-Day Retake', desc: 'Retake the assessment in 30 days to chart your growth. Most users see a 5-15 point improvement.' },
        { step: 'Share the Map', desc: 'Invite a friend to take the assessment. Shared journeys create accountability and deeper connection.' },
        { step: 'Premium Upgrade', desc: 'Access 1:1 coaching, deeper dimension workshops, and advanced navigational tools.' },
        { step: 'Get Support', desc: 'Questions about your report? Connect with our team at support@theresilienceatlas.com' },
    ];
    for (const ns of nextSteps) {
        ensureSpace(doc, 24);
        fillColor(doc, COLORS.primary);
        doc.fontSize(9).font('Helvetica-Bold').text('\u2192  ' + ns.step + ': ', PAGE_MARGIN + 8, doc.y, {
            continued: true, lineBreak: false,
        });
        fillColor(doc, COLORS.text);
        doc.fontSize(9).font('Helvetica').text(ns.desc, { width: CONTENT_WIDTH - 30, lineGap: 1 });
        doc.y += 4;
    }

    // Closing hero box
    ensureSpace(doc, 60);
    doc.y += 8;
    fillColor(doc, COLORS.coverBg);
    doc.roundedRect(PAGE_MARGIN, doc.y, CONTENT_WIDTH, 58, 8).fill();
    fillColor(doc, COLORS.white);
    doc.fontSize(12).font('Helvetica-Bold').text(
        'You are the cartographer of your own resilience.',
        PAGE_MARGIN, doc.y + 8, { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
    );
    fillColor(doc, '#c7d2fe');
    doc.fontSize(9).font('Helvetica').text(
        'Every practice you complete charts new territory. Every challenge you navigate builds the map.',
        PAGE_MARGIN, doc.y + 28, { width: CONTENT_WIDTH, align: 'center', lineBreak: false }
    );
    fillColor(doc, COLORS.text);
    doc.y += 68;

    // Disclaimer
    fillColor(doc, COLORS.textLight);
    doc.fontSize(8).font('Helvetica').text(
        'The Resilience Atlas assessment is provided for personal growth and educational purposes only. It is not a clinical assessment and does not constitute medical, psychological, or therapeutic advice. If you are experiencing significant mental health challenges, please consult a qualified professional.',
        PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, align: 'center', lineGap: 2 }
    );
    fillColor(doc, COLORS.text);
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a comprehensive 17-page PDF report using PDFKit.
 *
 * @param {Object} report  - Output of buildComprehensiveReport()
 * @param {number|string} overall - Overall resilience score (0-100)
 * @returns {Promise<Buffer>} Valid PDF binary buffer
 */
function buildPdfWithPDFKit(report, overall) {
    return new Promise((resolve, reject) => {
        try {
            const overallNum = Number(overall) || 0;

            // Attach overall level to report for page builders
            report.overallLevel = overallNum >= 80 ? 'strong'
                : overallNum >= 65 ? 'solid'
                    : overallNum >= 50 ? 'developing'
                        : 'emerging';

            const doc = new PDFDocument({
                size: 'A4',
                margin: PAGE_MARGIN,
                bufferPages: true,
                info: {
                    Title: 'The Resilience Atlas\u2122 \u2014 Your Personal Navigation Report',
                    Author: 'The Resilience Atlas\u2122',
                    Subject: 'Comprehensive Personal Resilience Report',
                },
            });

            const chunks = [];
            doc.on('data',  (chunk) => chunks.push(chunk));
            doc.on('end',   () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            try {
                // Page 1: Cover
                buildCoverPage(doc, report, overall);

                // Page 2: Journey Map / Executive Summary
                buildJourneyMapPage(doc, report);

                // Page 3: Visual Dashboard
                buildDashboardPage(doc, report);

                // Pages 4-9: Dimension Deep-Dives (one per dimension)
                const dims = Object.entries(report.dimensionAnalysis || {});
                for (const [dimName, analysis] of dims) {
                    buildDimensionPage(doc, dimName, analysis);
                }

                // Pages 10-11: Strength Integration & Synergies
                buildStrengthIntegrationPage(doc, report);

                // Page 12: Stress Response Profile
                buildStressResponsePage(doc, report);

                // Page 13: Relationship & Team Dynamics
                buildRelationshipDynamicsPage(doc, report);

                // Page 14: 30-Day Expedition Part 1 (Weeks 1-2)
                buildActionPlanPage1(doc, report);

                // Page 15: 30-Day Expedition Part 2 (Weeks 3-4)
                buildActionPlanPage2(doc, report);

                // Page 16: Navigation Tools (Resources)
                buildResourcesPage(doc, report);

                // Page 17: Benchmarking, Context & Growth Horizon
                buildBenchmarkingPage(doc, report, overall);

                // Footers on all pages
                addFooters(doc);

                doc.end();
            } catch (buildErr) {
                reject(buildErr);
            }
        } catch (initErr) {
            reject(initErr);
        }
    });
}

module.exports = { buildPdfWithPDFKit };
