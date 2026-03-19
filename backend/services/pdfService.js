'use strict';

const PDFDocument = require('pdfkit');
const { DIMENSION_CONTENT } = require('../templates/dimensionContent');

// ── Brand colour palette (Atlas Navigation theme) ────────────────────────────
const C = {
    indigo:       '#4F46E5',
    indigoDark:   '#3730A3',
    purple:       '#7C3AED',
    purpleLight:  '#EDE9FE',
    emerald:      '#10B981',
    emeraldLight: '#D1FAE5',
    strong:       '#10B981',
    solid:        '#4F46E5',
    developing:   '#F59E0B',
    emerging:     '#EF4444',
    amber:        '#F59E0B',
    amberLight:   '#FEF3C7',
    text:         '#1E293B',
    textMid:      '#475569',
    textLight:    '#94A3B8',
    border:       '#E2E8F0',
    bgPage:       '#F8FAFC',
    bgWhite:      '#FFFFFF',
    bgBlue:       '#EFF6FF',
    bgGreen:      '#F0FDF4',
    bgPurple:     '#FAF5FF',
    bgAmber:      '#FFFBEB',
    coverTop:     '#312E81',
};

const LEVEL_COLORS = {
    strong:     C.strong,
    solid:      C.solid,
    developing: C.developing,
    emerging:   C.emerging,
};

const TERRAIN_ICONS = {
    'Cognitive-Narrative':   '\uD83D\uDDFA',
    'Relational-Connective': '\uD83E\uDD1D',
    'Agentic-Generative':    '\uD83E\uDDED',
    'Emotional-Adaptive':    '\uD83D\uDCA7',
    'Spiritual-Reflective':  '\u2B50',
    'Somatic-Regulative':    '\u26A1',
};

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_W   = 595.28;
const PAGE_H   = 841.89;
const MARGIN   = 45;
const COL_W    = PAGE_W - MARGIN * 2;
const FOOTER_H = 28;
const BODY_BOT = PAGE_H - MARGIN - FOOTER_H;

// ── Colour helpers ────────────────────────────────────────────────────────────
function hex(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function fc(doc, h) { doc.fillColor(hex(h)); }
function sc(doc, h) { doc.strokeColor(hex(h)); }

// ── Layout helpers ────────────────────────────────────────────────────────────
function newPage(doc) { doc.addPage(); }

function ensureSpace(doc, need) {
    if (doc.y + need > BODY_BOT) newPage(doc);
}

function fillRect(doc, x, y, w, h, r, color) {
    fc(doc, color);
    doc.roundedRect(x, y, w, h, r || 0).fill();
}

/** Coloured section header bar. */
function sectionBanner(doc, text, color) {
    const y = doc.y;
    fillRect(doc, MARGIN, y, COL_W, 22, 4, color || C.indigo);
    fc(doc, C.bgWhite);
    doc.fontSize(10).font('Helvetica-Bold')
       .text(text, MARGIN + 10, y + 6, { width: COL_W - 20 });
    fc(doc, C.text);
    doc.y = y + 28;
}

/** Progress bar. */
function progressBar(doc, x, y, w, h, pct, color) {
    const barH = h || 8;
    sc(doc, C.border);
    fc(doc, C.border);
    doc.roundedRect(x, y, w, barH, barH / 2).fillAndStroke();
    const fw = Math.max(barH, (Math.min(pct, 100) / 100) * w);
    fc(doc, color || C.indigo);
    sc(doc, color || C.indigo);
    doc.roundedRect(x, y, fw, barH, barH / 2).fillAndStroke();
    fc(doc, C.text);
    sc(doc, C.border);
}

/** Callout box with left accent. Returns new doc.y. */
function calloutBox(doc, text, bgColor, accentColor) {
    if (!text) return doc.y;
    const pad = 8;
    const iw  = COL_W - pad * 2 - 5;
    // Compute height with correct font size set first
    doc.fontSize(10).font('Helvetica');
    const th  = doc.heightOfString(String(text), { width: iw, lineGap: 2 });
    const bh  = th + pad * 2;
    // Ensure enough space on the current page before drawing
    ensureSpace(doc, bh + 8);
    const cy  = doc.y;
    fillRect(doc, MARGIN, cy, COL_W, bh, 5, bgColor || C.bgBlue);
    fillRect(doc, MARGIN, cy, 4, bh, 2, accentColor || C.indigo);
    fc(doc, C.text);
    doc.fontSize(10).font('Helvetica')
       .text(String(text), MARGIN + 9, cy + pad, { width: iw, lineGap: 2 });
    doc.y = cy + bh + 6;
    return doc.y;
}

/** Bulleted list items. */
function bulletList(doc, items, color) {
    for (const item of (items || [])) {
        if (!item) continue;
        ensureSpace(doc, 16);
        fc(doc, color || C.indigo);
        doc.circle(MARGIN + 7, doc.y + 5, 2).fill();
        fc(doc, C.text);
        doc.fontSize(9.5).font('Helvetica')
           .text(String(item), MARGIN + 14, doc.y, { width: COL_W - 14, lineGap: 2 });
        doc.y += 3;
    }
}

/** Small coloured level badge pill. */
function levelBadge(doc, level, x, y) {
    const label = (level || 'developing').toUpperCase();
    const color = LEVEL_COLORS[level] || C.developing;
    const tw    = 70;
    fillRect(doc, x, y, tw, 14, 7, color);
    fc(doc, C.bgWhite);
    doc.fontSize(7).font('Helvetica-Bold').text(label, x + 4, y + 4, { width: tw - 8 });
    fc(doc, C.text);
}

// ── Atlas helpers ─────────────────────────────────────────────────────────────
function getScoreInterpretation(s) {
    if (s >= 80) return 'Exceptional Navigator';
    if (s >= 65) return 'Solid Navigator';
    if (s >= 50) return 'Developing Navigator';
    return 'Foundation Navigator';
}
function getPercentileLabel(s) {
    if (s >= 85) return 'Top 15% of all navigators';
    if (s >= 75) return 'Top 25% of all navigators';
    if (s >= 60) return 'Top 40% of all navigators';
    return 'Building expedition strength';
}
function getTerrainSummary(s) {
    if (s >= 80) return 'High-altitude terrain — you navigate with confidence and have strong footing across the resilience landscape.';
    if (s >= 65) return 'Rolling hills — solid ground beneath you with clear paths to higher elevation ahead.';
    if (s >= 50) return 'Mixed terrain — some well-trodden paths alongside territory still to explore.';
    return 'The foothills — every great expedition begins here, rich with growth potential.';
}

// ── Life-domain guidance per dimension ───────────────────────────────────────
const LIFE_DOMAINS = {
    'Cognitive-Narrative': {
        work:          'At work, your narrative reframing skills help you stay solution-focused under pressure and communicate constructively during conflict.',
        relationships: 'In relationships, this strength lets you understand your partner\'s perspective during high-emotion moments and hold a long-term view of the relationship.',
        friendships:   'With friends, you help reframe setbacks and bring perspective when things feel dark — a rare and valued gift.',
        parenting:     'As a parent, you model healthy self-talk and teach that challenges are growth opportunities — protective for children\'s resilience.',
    },
    'Relational-Connective': {
        work:          'In professional settings, relational resilience drives strong collaboration and the ability to build psychological safety in teams.',
        relationships: 'Your relational depth creates partnerships where both people feel seen — the foundation of lasting intimacy and mutual support.',
        friendships:   'You are the friend people turn to when they need to be truly heard. This depth makes your friendships sustaining through adversity.',
        parenting:     'High relational resilience creates secure attachment — children feel safe coming to you, a key protective factor in development.',
    },
    'Agentic-Generative': {
        work:          'Agentic resilience shows up at work as entrepreneurial thinking and the ability to move projects forward without needing certainty.',
        relationships: 'In relationships, your agency helps you take responsibility, initiate difficult conversations, and create conditions you want rather than waiting.',
        friendships:   'Your initiative organises gatherings, checks in on friends, and generates momentum — your agency makes connection happen.',
        parenting:     'Agentic parenting models problem-solving and teaches children that they too have power to influence their circumstances.',
    },
    'Emotional-Adaptive': {
        work:          'Emotional resilience at work lets you navigate interpersonal tension without escalation and maintain performance under emotional pressure.',
        relationships: 'This is perhaps the most vital relationship dimension — it enables processing conflict, repairing after ruptures, and maintaining intimacy.',
        friendships:   'Your emotional intelligence helps friends feel genuinely understood. You can be present for their pain without needing to fix it.',
        parenting:     'Emotionally resilient parenting means staying regulated when your child is dysregulated and modelling healthy emotional processing.',
    },
    'Spiritual-Reflective': {
        work:          'A connection to values at work creates intrinsic motivation and the ability to stay grounded when organisational pressures try to pull you off-course.',
        relationships: 'Anchored in your values, you navigate relationship challenges with less reactivity and greater wisdom.',
        friendships:   'You bring a quality of presence to friendship that goes beyond surface level — friends with shared depth may be your most nourishing connections.',
        parenting:     'Spiritual resilience in parenting means holding the big picture — who your child is becoming — through the difficult seasons.',
    },
    'Somatic-Regulative': {
        work:          'Physical regulation translates to sustained focus, better decision-making under pressure, and recovery from high-demand periods without burnout.',
        relationships: 'When your nervous system is regulated, you are more available — less reactive, more empathetic, better at listening before responding.',
        friendships:   'Your physical groundedness can be felt by others — regulated people help regulate those around them.',
        parenting:     'Somatic regulation is one of the most powerful parenting gifts — a grounded parent co-regulates a distressed child, building their nervous system capacity.',
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE BUILDERS
// ══════════════════════════════════════════════════════════════════════════════

// PAGE 1 — Branded Cover ──────────────────────────────────────────────────────
function buildCoverPage(doc, report, overall) {
    const dateStr = new Date().toLocaleDateString('en-US',
        { year: 'numeric', month: 'long', day: 'numeric' });

    // Full-page dark-indigo background
    fillRect(doc, 0, 0, PAGE_W, PAGE_H, 0, C.coverTop);
    // Top accent strip
    fillRect(doc, 0, 0, PAGE_W, 6, 0, C.purple);

    // Decorative compass rings
    const cx = PAGE_W / 2, cy = 200;
    sc(doc, '#5C5BD6');
    doc.circle(cx, cy, 110).stroke();
    sc(doc, '#6B6AE8');
    doc.circle(cx, cy, 80).stroke();
    sc(doc, '#7B7AF5');
    doc.circle(cx, cy, 50).stroke();
    // North-star crosshair
    sc(doc, '#A5B4FC');
    doc.moveTo(cx, cy - 12).lineTo(cx, cy + 12).stroke();
    doc.moveTo(cx - 12, cy).lineTo(cx + 12, cy).stroke();

    // Title
    fc(doc, C.bgWhite);
    doc.fontSize(26).font('Helvetica-Bold')
       .text('THE RESILIENCE ATLAS\u2122', MARGIN, 52,
             { align: 'center', width: COL_W, characterSpacing: 1 });
    fc(doc, '#A5B4FC');
    doc.fontSize(12).font('Helvetica')
       .text('Your Personal Resilience Map', MARGIN, 84,
             { align: 'center', width: COL_W });

    // Score circle
    fillRect(doc, cx - 65, 128, 130, 130, 65, '#3730A3');
    fc(doc, C.purple);
    doc.circle(cx, 193, 63).stroke();
    fc(doc, C.bgWhite);
    doc.fontSize(8).font('Helvetica').text('OVERALL SCORE', cx - 38, 136,
        { align: 'center', width: 76, characterSpacing: 1 });
    doc.fontSize(42).font('Helvetica-Bold').text(`${overall}%`, cx - 46, 150,
        { align: 'center', width: 92 });
    fc(doc, '#C4B5FD');
    doc.fontSize(9).font('Helvetica').text(getScoreInterpretation(overall), cx - 50, 206,
        { align: 'center', width: 100 });

    // Navigator type badge
    const badgeY = 273;
    fillRect(doc, cx - 85, badgeY, 170, 30, 15, C.purple);
    fc(doc, C.bgWhite);
    doc.fontSize(8).font('Helvetica').text('YOUR NAVIGATOR TYPE', MARGIN, badgeY + 4,
        { align: 'center', width: COL_W, characterSpacing: 1 });
    doc.fontSize(12).font('Helvetica-Bold').text(report.profileArchetype || 'Navigator', MARGIN, badgeY + 16,
        { align: 'center', width: COL_W });

    // Date
    fc(doc, '#94A3B8');
    doc.fontSize(10).font('Helvetica')
       .text(`Assessment Date: ${dateStr}`, MARGIN, badgeY + 52,
             { align: 'center', width: COL_W });

    // Tagline
    fc(doc, '#C4B5FD');
    doc.fontSize(11).font('Helvetica-Oblique')
       .text('"Discover your internal compass and chart your course toward lasting resilience."',
             MARGIN + 28, badgeY + 74, { align: 'center', width: COL_W - 56, lineGap: 3 });

    // Dimensions mini-preview strip
    const dims = Object.entries(report.dimensionAnalysis || {})
        .sort((a, b) => b[1].percentage - a[1].percentage);
    if (dims.length > 0) {
        const stripY = 440;
        fillRect(doc, MARGIN, stripY, COL_W, 1, 0, '#3B3A6E');
        const itemW = COL_W / Math.max(dims.length, 1);
        dims.forEach(([dim, analysis], i) => {
            const lc  = LEVEL_COLORS[analysis.level] || C.indigo;
            const x0  = MARGIN + i * itemW;
            const pct = Number(analysis.percentage || 0);
            const barFill = Math.max(2, (pct / 100) * (itemW - 8));
            fillRect(doc, x0 + 4, stripY + 4, barFill, 8, 3, lc);
        });
        fc(doc, '#6B6AE8');
        doc.fontSize(8).font('Helvetica').text('TERRAIN OVERVIEW', MARGIN, stripY + 16,
            { align: 'center', width: COL_W });
    }

    // Bottom strip
    fillRect(doc, 0, PAGE_H - 44, PAGE_W, 44, 0, '#1E1B4B');
    fc(doc, '#818CF8');
    doc.fontSize(8).font('Helvetica')
       .text('THE RESILIENCE ATLAS\u2122  |  Personal growth & self-reflection only. Not a clinical assessment.',
             MARGIN, PAGE_H - 28, { align: 'center', width: COL_W });
}

// PAGE 2 — Welcome & Orientation ──────────────────────────────────────────────
function buildWelcomePage(doc, report, overall) {
    newPage(doc);
    sectionBanner(doc, '\uD83E\uDDED  Welcome to Your Personal Resilience Atlas');

    calloutBox(doc,
        'The Resilience Atlas\u2122 is your personal expedition map — showing your current position ' +
        'on the resilience landscape, the terrain you have navigated, and the paths ahead. This report ' +
        'frames your journey using navigation metaphors: your overall score is Your Current Location, ' +
        'dimensions are Terrain Features, strengths are Navigation Tools, and growth areas are ' +
        'Uncharted Territory rich with possibility.',
        C.bgBlue, C.indigo);

    sectionBanner(doc, '\uD83D\uDDFA\uFE0F  How to Navigate This Report');
    const steps = [
        '\uD83D\uDCCD  Start with Your Current Location (Page 3) — the big-picture view of where you stand.',
        '\uD83D\uDDFA\uFE0F  Visit the Visual Dashboard (Page 4) — see all six terrain features at a glance.',
        '\u26F0\uFE0F  Explore each Terrain Guide — one deep-dive per resilience dimension.',
        '\uD83E\uDDED  Study your Navigator Archetype — understand your natural navigation style.',
        '\uD83D\uDEE4\uFE0F  Use the 30-Day Route Map — your practical expedition plan for the month ahead.',
        '\uD83D\uDCDA  Bookmark the Resources page — your navigation aids for the journey.',
        '\uD83D\uDD04  Retake in 30 days — track your expedition progress and celebrate growth.',
    ];
    bulletList(doc, steps, C.indigo);
    doc.y += 8;

    sectionBanner(doc, '\uD83D\uDCCD  Your Current Position on the Resilience Landscape', C.purple);
    calloutBox(doc, getTerrainSummary(overall), C.bgPurple, C.purple);

    sectionBanner(doc, '\uD83D\uDDDD\uFE0F  Navigation Symbols', C.textMid);
    const symbols = [
        ['STRONG (80–100%)',      C.strong,     'Well-developed terrain — navigate with confidence.'],
        ['SOLID (65–79%)',        C.solid,      'Established footing — clear paths to higher elevation.'],
        ['DEVELOPING (50–64%)',   C.developing, 'Active growth zone — investment yields rapid progress.'],
        ['EMERGING (below 50%)', C.emerging,   'Uncharted territory — highest growth potential.'],
    ];
    for (const [label, color, desc] of symbols) {
        ensureSpace(doc, 22);
        const ry = doc.y;
        fillRect(doc, MARGIN, ry, 110, 16, 4, color);
        fc(doc, C.bgWhite);
        doc.fontSize(7).font('Helvetica-Bold').text(label, MARGIN + 3, ry + 5, { width: 104 });
        fc(doc, C.textMid);
        doc.fontSize(9).font('Helvetica').text(desc, MARGIN + 118, ry + 4, { width: COL_W - 124 });
        doc.y = Math.max(ry + 20, doc.y + 2);
    }
}

// PAGE 3 — Executive Summary "Your Current Location" ─────────────────────────
function buildExecutiveSummaryPage(doc, report, overall) {
    newPage(doc);
    sectionBanner(doc, '\uD83D\uDCCD  Your Current Location — Executive Summary', C.indigo);

    // Score + meta row
    const rowY = doc.y;
    fillRect(doc, MARGIN, rowY, 130, 72, 6, C.indigoDark);
    fc(doc, C.bgWhite);
    doc.fontSize(8).font('Helvetica').text('OVERALL SCORE', MARGIN + 8, rowY + 8,
        { align: 'center', width: 114, characterSpacing: 1 });
    doc.fontSize(32).font('Helvetica-Bold').text(`${overall}%`, MARGIN + 8, rowY + 22,
        { align: 'center', width: 114 });
    fc(doc, '#C4B5FD');
    doc.fontSize(8).font('Helvetica').text(getScoreInterpretation(overall), MARGIN + 8, rowY + 58,
        { align: 'center', width: 114 });

    fc(doc, C.text);
    doc.fontSize(11).font('Helvetica-Bold')
       .text(getPercentileLabel(overall), MARGIN + 144, rowY + 6, { width: COL_W - 154 });
    fc(doc, C.textMid);
    doc.fontSize(9).font('Helvetica')
       .text(getTerrainSummary(overall), MARGIN + 144, rowY + 24, { width: COL_W - 154, lineGap: 2 });
    doc.y = rowY + 82;

    // Archetype
    sectionBanner(doc, '\uD83E\uDDED  Navigator Archetype: ' + (report.profileArchetype || 'Your Type'), C.purple);
    if (report.profileDescription) {
        // Show first 300 chars
        const excerpt = report.profileDescription.substring(0, 320).replace(/\n+/g, ' ');
        calloutBox(doc, excerpt + (report.profileDescription.length > 320 ? '…' : ''), C.bgPurple, C.purple);
    }

    // Executive summary paragraph
    if (report.executiveSummary) {
        sectionBanner(doc, '\uD83D\uDD0D  Key Discoveries', C.indigo);
        const paras = report.executiveSummary.split('\n\n');
        const firstPara = paras[0] ? paras[0].trim().substring(0, 380) : '';
        if (firstPara) {
            fc(doc, C.text);
            doc.fontSize(9.5).font('Helvetica')
               .text(firstPara, MARGIN, doc.y, { width: COL_W, lineGap: 2 });
            doc.y += 8;
        }
    }

    // Quick score overview
    if (report.dimensionAnalysis) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\u26F0\uFE0F  Terrain Features at a Glance', C.emerald);
        const sorted = Object.entries(report.dimensionAnalysis)
            .sort((a, b) => b[1].percentage - a[1].percentage);
        for (const [dim, analysis] of sorted) {
            ensureSpace(doc, 18);
            const lc  = LEVEL_COLORS[analysis.level] || C.indigo;
            const pct = Number(analysis.percentage || 0);
            const y0  = doc.y;
            fc(doc, C.text);
            doc.fontSize(9).font('Helvetica-Bold').text(dim, MARGIN, y0 + 1, { width: 210 });
            progressBar(doc, MARGIN + 216, y0 + 2, 150, 9, pct, lc);
            fc(doc, lc);
            doc.fontSize(9).font('Helvetica-Bold')
               .text(`${pct.toFixed(0)}%`, MARGIN + 373, y0 + 1, { width: 40, align: 'right' });
            fc(doc, C.text);
            doc.y = y0 + 16;
        }
    }
}

// PAGE 4 — Visual Dashboard ───────────────────────────────────────────────────
function buildVisualDashboard(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\uD83D\uDDFA\uFE0F  Resilience Landscape — Visual Dashboard');

    fc(doc, C.textMid);
    doc.fontSize(9.5).font('Helvetica')
       .text('Each bar below represents one terrain feature. Length shows your current position — from Emerging (foothill) to Strong (summit).',
             MARGIN, doc.y, { width: COL_W, lineGap: 2 });
    doc.y += 10;

    const dims = Object.entries(report.dimensionAnalysis || {})
        .sort((a, b) => b[1].percentage - a[1].percentage);
    const LABEL_W = 188;
    const BAR_W   = COL_W - LABEL_W - 70;
    const ROW_H   = 32;

    for (const [dim, analysis] of dims) {
        ensureSpace(doc, ROW_H + 6);
        const y0   = doc.y;
        const lc   = LEVEL_COLORS[analysis.level] || C.indigo;
        const pct  = Number(analysis.percentage || 0);
        const icon = TERRAIN_ICONS[dim] || '\uD83C\uDF0D';
        const content = DIMENSION_CONTENT[dim];

        // Row background
        fillRect(doc, MARGIN, y0, COL_W, ROW_H, 4, C.bgPage);
        sc(doc, C.border);
        doc.roundedRect(MARGIN, y0, COL_W, ROW_H, 4).stroke();

        // Label + tagline
        fc(doc, lc);
        doc.fontSize(10).font('Helvetica-Bold')
           .text(`${icon}  ${dim}`, MARGIN + 6, y0 + 4, { width: LABEL_W });
        fc(doc, C.textLight);
        if (content && content.tagline) {
            doc.fontSize(7.5).font('Helvetica-Oblique')
               .text(content.tagline, MARGIN + 6, y0 + 19, { width: LABEL_W });
        }

        // Bar
        progressBar(doc, MARGIN + LABEL_W + 4, y0 + 11, BAR_W, 11, pct, lc);

        // Score
        fc(doc, lc);
        doc.fontSize(10).font('Helvetica-Bold')
           .text(`${pct.toFixed(0)}%`, MARGIN + LABEL_W + BAR_W + 8, y0 + 10, { width: 48, align: 'right' });
        // Level badge
        levelBadge(doc, analysis.level, MARGIN + LABEL_W + BAR_W + 8, y0 + 4);

        fc(doc, C.text);
        doc.y = y0 + ROW_H + 5;
    }

    // Strongest + frontier callout
    ensureSpace(doc, 72);
    doc.y += 4;
    const strongest = dims[0];
    const frontier  = dims[dims.length - 1];
    const halfW     = COL_W / 2 - 5;
    const boxY      = doc.y;

    fillRect(doc, MARGIN, boxY, halfW, 60, 6, C.emeraldLight);
    fillRect(doc, MARGIN, boxY, 4, 60, 2, C.emerald);
    fc(doc, C.emerald);
    doc.fontSize(8).font('Helvetica-Bold')
       .text('\u2B50  STRONGEST TERRAIN', MARGIN + 10, boxY + 6, { width: halfW - 15 });
    fc(doc, C.text);
    doc.fontSize(10).font('Helvetica-Bold').text(strongest[0], MARGIN + 10, boxY + 20, { width: halfW - 15 });
    fc(doc, C.textMid);
    doc.fontSize(8.5).font('Helvetica')
       .text(`${Number(strongest[1].percentage).toFixed(0)}% — your primary navigation strength`, MARGIN + 10, boxY + 36, { width: halfW - 15 });

    const fx = MARGIN + halfW + 10;
    fillRect(doc, fx, boxY, halfW, 60, 6, C.amberLight);
    fillRect(doc, fx, boxY, 4, 60, 2, C.amber);
    fc(doc, C.amber);
    doc.fontSize(8).font('Helvetica-Bold')
       .text('\uD83C\uDF31  FRONTIER (GROWTH AREA)', fx + 10, boxY + 6, { width: halfW - 15 });
    fc(doc, C.text);
    doc.fontSize(10).font('Helvetica-Bold').text(frontier[0], fx + 10, boxY + 20, { width: halfW - 15 });
    fc(doc, C.textMid);
    doc.fontSize(8.5).font('Helvetica')
       .text(`${Number(frontier[1].percentage).toFixed(0)}% — your greatest growth opportunity`, fx + 10, boxY + 36, { width: halfW - 15 });

    fc(doc, C.text);
    doc.y = boxY + 68;
}

// PAGE 5 — Dimension Scores Overview ─────────────────────────────────────────
function buildDimensionScoresPage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\uD83D\uDCCA  Dimension Scores — Complete Terrain Map');

    fc(doc, C.textMid);
    doc.fontSize(9).font('Helvetica-Oblique')
       .text('Scores reflect your current development — not fixed traits. All dimensions are trainable.',
             MARGIN, doc.y, { width: COL_W });
    doc.y += 10;

    const colX = [MARGIN, MARGIN + 196, MARGIN + 262, MARGIN + 332, MARGIN + 396];
    const rH   = 26;
    fillRect(doc, MARGIN, doc.y, COL_W, rH, 4, C.indigoDark);
    fc(doc, C.bgWhite);
    const hY = doc.y + 9;
    doc.fontSize(8).font('Helvetica-Bold')
       .text('Terrain Feature',     colX[0] + 5, hY, { width: 185 })
       .text('Score',               colX[1] + 3, hY, { width: 58 })
       .text('Visual',              colX[2] + 3, hY, { width: 62 })
       .text('Level',               colX[3] + 3, hY, { width: 58 })
       .text('Tagline',             colX[4] + 3, hY, { width: COL_W - 406 });
    doc.y += rH;

    const dims = Object.entries(report.dimensionAnalysis || {})
        .sort((a, b) => b[1].percentage - a[1].percentage);
    let alt = false;
    for (const [dim, analysis] of dims) {
        ensureSpace(doc, rH + 2);
        const ry      = doc.y;
        const lc      = LEVEL_COLORS[analysis.level] || C.indigo;
        const pct     = Number(analysis.percentage || 0);
        const icon    = TERRAIN_ICONS[dim] || '';
        const content = DIMENSION_CONTENT[dim];

        fillRect(doc, MARGIN, ry, COL_W, rH, 0, alt ? C.bgPage : C.bgWhite);
        sc(doc, C.border);
        doc.rect(MARGIN, ry, COL_W, rH).stroke();

        fc(doc, C.text);
        doc.fontSize(8.5).font('Helvetica-Bold')
           .text(`${icon}  ${dim}`, colX[0] + 5, ry + 9, { width: 185 });
        fc(doc, lc);
        doc.fontSize(9).font('Helvetica-Bold')
           .text(`${pct.toFixed(1)}%`, colX[1] + 3, ry + 9, { width: 55 });
        progressBar(doc, colX[2] + 3, ry + 10, 60, 7, pct, lc);
        levelBadge(doc, analysis.level, colX[3] + 3, ry + 8);
        fc(doc, C.textMid);
        if (content && content.tagline) {
            doc.fontSize(7.5).font('Helvetica-Oblique')
               .text(content.tagline, colX[4] + 3, ry + 9, { width: COL_W - 407 });
        }
        fc(doc, C.text);
        doc.y = ry + rH;
        alt = !alt;
    }

    doc.y += 12;
    ensureSpace(doc, 90);
    sectionBanner(doc, '\uD83D\uDDDD\uFE0F  Interpretation Key');
    const keyItems = [
        [C.strong,     'STRONG (80–100%)',     'Well-developed navigational skill. Lean on this terrain in adversity.'],
        [C.solid,      'SOLID (65–79%)',        'Established footing. Clear growth paths to higher capability.'],
        [C.developing, 'DEVELOPING (50–64%)',   'Active growth zone. Your investment here yields rapid gains.'],
        [C.emerging,   'EMERGING (below 50%)', 'Uncharted territory — highest potential for transformation.'],
    ];
    for (const [color, label, desc] of keyItems) {
        ensureSpace(doc, 20);
        const ky = doc.y;
        fillRect(doc, MARGIN, ky + 2, 115, 13, 4, color);
        fc(doc, C.bgWhite);
        doc.fontSize(6.5).font('Helvetica-Bold').text(label, MARGIN + 3, ky + 5, { width: 109 });
        fc(doc, C.textMid);
        doc.fontSize(9).font('Helvetica').text(desc, MARGIN + 122, ky + 4, { width: COL_W - 130 });
        doc.y = ky + 18;
    }
}

// PAGES 6–11 — Dimension Deep-Dives ──────────────────────────────────────────
function buildDimensionTerrainPage(doc, dimName, analysis, domainContent) {
    newPage(doc);

    const lc      = LEVEL_COLORS[analysis.level] || C.indigo;
    const icon    = TERRAIN_ICONS[dimName] || '\uD83C\uDF0D';
    const pct     = Number(analysis.percentage || 0);
    const content = DIMENSION_CONTENT[dimName];

    // ── Header strip (fixed top band) ──────────────────────────────────────
    fillRect(doc, 0, 0, PAGE_W, 68, 0, lc);
    fc(doc, C.bgWhite);
    doc.fontSize(9).font('Helvetica').text(`${icon}  TERRAIN GUIDE`, MARGIN, 10,
        { width: COL_W - 80, characterSpacing: 1 });
    doc.fontSize(18).font('Helvetica-Bold').text(dimName, MARGIN, 24, { width: COL_W - 80 });
    if (content && content.tagline) {
        fc(doc, C.bgWhite);
        doc.fontSize(9).font('Helvetica-Oblique')
           .text(`"${content.tagline}"`, MARGIN, 47, { width: COL_W - 90 });
    }
    // Score box (top-right)
    fillRect(doc, PAGE_W - MARGIN - 74, 14, 74, 40, 6, '#00000033');
    fc(doc, C.bgWhite);
    doc.fontSize(8).font('Helvetica').text('SCORE', PAGE_W - MARGIN - 68, 18,
        { align: 'center', width: 62, characterSpacing: 1 });
    doc.fontSize(20).font('Helvetica-Bold').text(`${pct.toFixed(0)}%`, PAGE_W - MARGIN - 68, 30,
        { align: 'center', width: 62 });

    doc.y = 76;

    // Progress bar
    progressBar(doc, MARGIN, doc.y, COL_W, 10, pct, lc);
    doc.y += 16;

    // ── Personalized insight (compact) ───────────────────────────────────
    sectionBanner(doc, '\uD83E\uDDED  Your Navigation Skills in This Terrain', C.purple);
    if (analysis.personalizedInsight) {
        // Take the first paragraph only (up to first double-newline or 280 chars)
        const firstPara = analysis.personalizedInsight.split('\n\n')[0].replace(/\n/g, ' ');
        const insight   = firstPara.substring(0, 280);
        calloutBox(doc, insight + (firstPara.length > 280 ? '…' : ''), C.bgPurple, C.purple);
    }

    // ── Two-column: strengths + growth ───────────────────────────────────
    const strengths = (analysis.strengthsDemonstrated || []).slice(0, 3);
    const growth    = (analysis.growthOpportunities || []).slice(0, 2);

    if (strengths.length > 0 || growth.length > 0) {
        ensureSpace(doc, 50);
        const halfW = COL_W / 2 - 5;
        const twoY  = doc.y;

        // Left: strengths
        if (strengths.length > 0) {
            fc(doc, C.emerald);
            doc.fontSize(9).font('Helvetica-Bold')
               .text('\u2714  Strengths Demonstrated', MARGIN, twoY, { width: halfW });
            let ly = twoY + 14;
            for (const s of strengths) {
                fc(doc, C.indigo);
                doc.circle(MARGIN + 7, ly + 5, 2).fill();
                fc(doc, C.text);
                doc.fontSize(8.5).font('Helvetica')
                   .text(s, MARGIN + 14, ly, { width: halfW - 14, lineGap: 2 });
                ly = doc.y + 3;
            }
        }

        // Right: growth
        if (growth.length > 0) {
            const rx = MARGIN + halfW + 10;
            fc(doc, C.amber);
            doc.fontSize(9).font('Helvetica-Bold')
               .text('\uD83D\uDEE4\uFE0F  Growth Opportunities', rx, twoY, { width: halfW });
            let ry = twoY + 14;
            for (const g of growth) {
                fc(doc, C.amber);
                doc.circle(rx + 7, ry + 5, 2).fill();
                fc(doc, C.text);
                doc.fontSize(8.5).font('Helvetica')
                   .text(g, rx + 14, ry, { width: halfW - 14, lineGap: 2 });
                ry = doc.y + 3;
            }
        }

        // Advance past the two-column block
        doc.y = Math.max(doc.y, twoY + 14 + strengths.length * 20) + 8;
    }

    // ── Life domains (Work + Relationships only on dimension page) ────────
    if (domainContent) {
        ensureSpace(doc, 44);
        sectionBanner(doc, '\uD83C\uDF1F  This Terrain in Your Daily Life', C.emerald);
        const compactDomains = [
            ['\uD83D\uDCBC  Work:', domainContent.work],
            ['\u2764\uFE0F  Relationships:', domainContent.relationships],
        ];
        for (const [label, text] of compactDomains) {
            if (!text) continue;
            ensureSpace(doc, 32);
            const dy = doc.y;
            fc(doc, C.text);
            doc.fontSize(8.5).font('Helvetica-Bold').text(label, MARGIN, dy, { width: 90 });
            fc(doc, C.textMid);
            doc.fontSize(8.5).font('Helvetica')
               .text(text, MARGIN, dy + 13, { width: COL_W, lineGap: 1 });
            doc.y += 5;
        }
    }

    // ── Daily Waypoint (compact) ──────────────────────────────────────────
    if (analysis.dailyMicroPractice) {
        ensureSpace(doc, 42);
        // Short waypoint: first sentence only (up to 160 chars)
        const wp = analysis.dailyMicroPractice.split('.')[0].substring(0, 160) + '.';
        calloutBox(doc, '\uD83D\uDCCD  DAILY WAYPOINT: ' + wp, C.amberLight, C.amber);
    }
}

function buildDimensionDeepDives(doc, report) {
    const dims = Object.entries(report.dimensionAnalysis || {});
    for (const [dimName, analysis] of dims) {
        buildDimensionTerrainPage(doc, dimName, analysis, LIFE_DOMAINS[dimName] || null);
    }
}

// PAGE 12 — Navigator Archetype ───────────────────────────────────────────────
function buildArchetypePage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\uD83E\uDDED  Your Navigator Archetype — Deep Dive', C.purple);

    // Title block
    fillRect(doc, MARGIN, doc.y, COL_W, 50, 6, C.purpleLight);
    fc(doc, C.purple);
    doc.fontSize(22).font('Helvetica-Bold')
       .text(report.profileArchetype || 'Your Archetype', MARGIN + 14, doc.y + 8, { width: COL_W - 28 });
    fc(doc, C.textMid);
    doc.fontSize(9).font('Helvetica-Oblique')
       .text('Your Navigator Type — the natural orientation you bring to life\'s challenges.', MARGIN + 14, doc.y + 32, { width: COL_W - 28 });
    doc.y += 58;

    // Full description (first 450 chars)
    if (report.profileDescription) {
        const full = report.profileDescription.replace(/\n\n/g, '\n').substring(0, 460);
        calloutBox(doc, full + (report.profileDescription.length > 460 ? '…' : ''), C.bgPurple, C.purple);
    }

    // Superpowers — drawn from top dimensions
    if (report.topDimensions && report.topDimensions.length > 0) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\u26A1  Navigation Superpowers', C.emerald);
        const powers = report.topDimensions.slice(0, 3).map((dim) => {
            const a    = report.dimensionAnalysis[dim] || {};
            const strs = (a.strengthsDemonstrated || []).slice(0, 2);
            return `${dim}: ${strs.join('; ') || 'a key navigation strength'}`;
        });
        bulletList(doc, powers);
        doc.y += 6;
    }

    // Blind spots — from lower dimensions
    const lower = Object.entries(report.dimensionAnalysis || {})
        .sort((a, b) => a[1].percentage - b[1].percentage)
        .slice(0, 2)
        .map(([dim]) => {
            const a  = report.dimensionAnalysis[dim] || {};
            const go = (a.growthOpportunities || []).slice(0, 1);
            return `${dim}: ${go[0] || 'an area for focused growth'}`;
        });
    if (lower.length > 0) {
        ensureSpace(doc, 40);
        sectionBanner(doc, '\uD83D\uDD0D  Navigational Blind Spots', C.amber);
        bulletList(doc, lower);
        doc.y += 6;
    }

    // Grounding techniques
    if (report.stressResponse && (report.stressResponse.groundingTechniques || []).length > 0) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\u26F0\uFE0F  Your Navigator\'s Anchor Techniques', C.indigo);
        bulletList(doc, (report.stressResponse.groundingTechniques || []).slice(0, 4));
        doc.y += 6;
    }

    // Leveraging your type
    ensureSpace(doc, 55);
    calloutBox(doc,
        '\uD83D\uDEE4\uFE0F  Your Navigator Type is not a cage — it is a compass. Understanding it lets you lean ' +
        'into your natural strengths while deliberately developing the dimensions that will round out your resilience. ' +
        'The most resilient people know their type deeply and choose, each day, when to navigate from their strength ' +
        'and when to stretch beyond it.',
        C.bgBlue, C.indigo);
}

// PAGE 13 — Strength Integration & Synergies ──────────────────────────────────
function buildStrengthIntegrationPage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\u26A1  How Your Terrain Features Work Together');

    const si = report.strengthIntegration || {};

    // Top combo header
    if (si.topThreeCombo) {
        fillRect(doc, MARGIN, doc.y, COL_W, 44, 6, C.indigoDark);
        fc(doc, C.bgWhite);
        doc.fontSize(8).font('Helvetica').text('YOUR PRIMARY TERRAIN COMBINATION', MARGIN + 12, doc.y + 6,
            { align: 'center', width: COL_W - 24, characterSpacing: 1 });
        doc.fontSize(14).font('Helvetica-Bold').text(si.topThreeCombo, MARGIN + 12, doc.y + 22,
            { align: 'center', width: COL_W - 24 });
        fc(doc, C.text);
        doc.y += 52;
    }

    if (si.blueprint) {
        calloutBox(doc, si.blueprint, C.bgGreen, C.emerald);
    }

    sectionBanner(doc, '\uD83D\uDD0D  Terrain Synergies', C.emerald);
    bulletList(doc, (si.synergies || []).slice(0, 3));
    doc.y += 6;

    if ((si.gaps || []).length > 0) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\uD83C\uDF31  Frontier Territories — Integration Opportunities', C.amber);
        bulletList(doc, (si.gaps || []).slice(0, 2));
        doc.y += 6;
    }

    ensureSpace(doc, 55);
    sectionBanner(doc, '\uD83E\uDDED  How to Navigate With Your Combination', C.indigo);
    calloutBox(doc,
        'Resilience compounds when terrain features work in concert. Look for daily moments where two ' +
        'of your top strengths are both active — these are your power zones. The most resilient ' +
        'navigators learn to intentionally combine strengths, letting cognitive clarity amplify ' +
        'emotional regulation, and relational skills deepen personal agency.',
        C.bgBlue, C.indigo);

    // How combo shows up in life
    if (report.topDimensions && report.topDimensions.length >= 2) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\uD83D\uDCBC  Where Your Combination Shines', C.purple);
        const [d1, d2, d3] = report.topDimensions;
        bulletList(doc, [
            `Primary (${d1}): Leads your approach — lean here first when navigating challenges.`,
            `Secondary (${d2 || 'secondary'}): Amplifies and supports your primary strength.`,
            d3 ? `Supporting (${d3}): Your quiet resource — most visible to others under sustained pressure.` : null,
        ].filter(Boolean));
    }
}

// PAGE 14 — Stress Response & Emergency Navigation ────────────────────────────
function buildStressResponsePage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\u26A0\uFE0F  Navigating Rough Terrain — Stress Response Profile', C.emerging);

    const sr = report.stressResponse || {};

    if (sr.overallResilience) {
        calloutBox(doc, sr.overallResilience, C.amberLight, C.amber);
    }

    const twoColY = doc.y;
    const halfW   = COL_W / 2 - 6;

    // Strengths under stress
    const strengthsY = twoColY;
    if ((sr.strengthsUnderStress || []).length > 0) {
        sectionBanner(doc, '\u2714  Strongest Under Pressure', C.emerald);
        bulletList(doc, sr.strengthsUnderStress.map((d) => `${d} supports you most`));
        doc.y += 4;
    }

    // Vulnerabilities
    if ((sr.vulnerabilitiesUnderStress || []).length > 0) {
        ensureSpace(doc, 40);
        sectionBanner(doc, '\uD83D\uDD34  Watch Areas — Stress Vulnerabilities', C.emerging);
        bulletList(doc, sr.vulnerabilitiesUnderStress.map((d) => `${d} — prepare extra support here`));
        doc.y += 4;
    }

    // Coping strategies
    if ((sr.copingStrategies || []).length > 0) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\uD83E\uDDED  Your Personalised Coping Strategies', C.indigo);
        bulletList(doc, (sr.copingStrategies || []).slice(0, 5));
        doc.y += 6;
    }

    // Emergency tools
    ensureSpace(doc, 60);
    sectionBanner(doc, '\uD83D\uDE91  Emergency Grounding — Quick-Access Tools', C.purple);
    calloutBox(doc, [
        '\uD83D\uDCCD  5-4-3-2-1 SENSORY GROUNDING — immediate nervous system reset:',
        '5 things you can SEE  |  4 you can TOUCH  |  3 you can HEAR  |  2 you can SMELL  |  1 you can TASTE',
    ].join('\n'), C.bgPurple, C.purple);

    ensureSpace(doc, 45);
    calloutBox(doc,
        '\uD83D\uDCA8  BOX BREATHING — Inhale 4 counts \u2192 Hold 4 \u2192 Exhale 4 \u2192 Hold 4. Repeat 4x. ' +
        'Used by high-performance athletes for rapid nervous system regulation — available anywhere, anytime.',
        C.bgBlue, C.indigo);

    if ((sr.groundingTechniques || []).length > 0) {
        ensureSpace(doc, 40);
        sectionBanner(doc, '\uD83C\uDF0D  Your Personalised Grounding Techniques', C.emerald);
        bulletList(doc, (sr.groundingTechniques || []).slice(0, 4));
    }
}

// PAGE 15 — Relationship Navigation & Team Dynamics ───────────────────────────
function buildRelationshipPage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\uD83D\uDC65  Charting Course With Others — Relationship Navigation');

    const ri = report.relationshipInsights || {};

    if (ri.communicationStyle) {
        sectionBanner(doc, '\uD83D\uDDE3\uFE0F  Your Communication Style as a Navigator', C.indigo);
        calloutBox(doc, ri.communicationStyle, C.bgBlue, C.indigo);
    }

    if ((ri.partnershipRecommendations || []).length > 0) {
        ensureSpace(doc, 50);
        sectionBanner(doc, '\uD83E\uDD1D  Partnership Navigation Tips', C.purple);
        bulletList(doc, (ri.partnershipRecommendations || []).slice(0, 4));
        doc.y += 6;
    }

    // Relationship insights from top dimensions
    const topDims = (report.topDimensions || []).slice(0, 2);

    ensureSpace(doc, 50);
    sectionBanner(doc, '\u2764\uFE0F  Romantic Relationships', C.emerging);
    const relInsights = topDims.map((dim) => {
        const d = LIFE_DOMAINS[dim]; return d ? `${dim}: ${d.relationships}` : null;
    }).filter(Boolean);
    if (relInsights.length > 0) bulletList(doc, relInsights);
    else calloutBox(doc, 'Your top terrain features create a strong foundation for deep, reciprocal partnership.', C.bgBlue, C.indigo);
    doc.y += 4;

    ensureSpace(doc, 50);
    sectionBanner(doc, '\uD83D\uDE04  Friendships & Community', C.indigo);
    const friendInsights = topDims.map((dim) => {
        const d = LIFE_DOMAINS[dim]; return d ? `${dim}: ${d.friendships}` : null;
    }).filter(Boolean);
    if (friendInsights.length > 0) bulletList(doc, friendInsights);
    doc.y += 4;

    ensureSpace(doc, 50);
    sectionBanner(doc, '\uD83D\uDC68\u200D\uD83D\uDC67  Parenting & Caregiving', C.amber);
    const parentInsights = topDims.map((dim) => {
        const d = LIFE_DOMAINS[dim]; return d ? `${dim}: ${d.parenting}` : null;
    }).filter(Boolean);
    if (parentInsights.length > 0) bulletList(doc, parentInsights);
    else calloutBox(doc, 'Your resilience profile shapes how you nurture and support those in your care.', C.amberLight, C.amber);
    doc.y += 4;

    ensureSpace(doc, 50);
    sectionBanner(doc, '\uD83D\uDCBC  Professional & Team Navigation', C.purple);
    const workInsights = topDims.map((dim) => {
        const d = LIFE_DOMAINS[dim]; return d ? `${dim}: ${d.work}` : null;
    }).filter(Boolean);
    if (workInsights.length > 0) bulletList(doc, workInsights);
    calloutBox(doc,
        'Your Navigator Type brings a distinct strength to every team. Understanding your type helps ' +
        'you contribute your best and build teams collectively stronger than the sum of their parts.',
        C.bgPurple, C.purple);
}

// PAGE 16 — 30-Day Route Map ──────────────────────────────────────────────────
function build30DayPlanPage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\uD83D\uDDFA\uFE0F  Charting Your Next 30 Days — Route Map', C.indigo);

    fc(doc, C.textMid);
    doc.fontSize(9).font('Helvetica-Oblique')
       .text('Build resilience progressively — one waypoint at a time.',
             MARGIN, doc.y, { width: COL_W });
    doc.y += 8;

    const plan = report.thirtyDayPlan || {};
    const weeks = [
        { key: 'week1', label: 'WEEK 1',  theme: 'FOUNDATION',  emoji: '\uD83C\uDFDB\uFE0F', color: C.indigo  },
        { key: 'week2', label: 'WEEK 2',  theme: 'EXPLORATION', emoji: '\uD83C\uDF31',        color: C.emerald },
        { key: 'week3', label: 'WEEK 3',  theme: 'INTEGRATION', emoji: '\uD83E\uDD1D',        color: C.purple  },
        { key: 'week4', label: 'WEEK 4',  theme: 'EXPANSION',   emoji: '\uD83D\uDE80',        color: C.amber   },
    ];

    for (const { key, label, theme, emoji, color } of weeks) {
        const data = plan[key];
        if (!data) continue;
        ensureSpace(doc, 80);

        const wy = doc.y;
        fillRect(doc, MARGIN, wy, COL_W, 24, 5, color);
        fc(doc, C.bgWhite);
        doc.fontSize(11).font('Helvetica-Bold')
           .text(`${emoji}  ${label}: ${theme} — ${data.focus || ''}`, MARGIN + 10, wy + 7,
                 { width: COL_W - 20 });
        fc(doc, C.text);
        doc.y = wy + 30;

        // Exercises
        const exItems = (data.exercises || []).filter(Boolean).slice(0, 3);
        if (exItems.length > 0) {
            fc(doc, C.textMid);
            doc.fontSize(8.5).font('Helvetica-Bold').text('\uD83D\uDCCD  Daily Waypoints:', MARGIN + 6, doc.y);
            doc.y += 5;
            bulletList(doc, exItems);
        }

        // Affirmation
        if (data.affirmation) {
            ensureSpace(doc, 26);
            fillRect(doc, MARGIN + 6, doc.y + 1, COL_W - 12, 20, 4, C.bgPurple);
            fc(doc, C.purple);
            doc.fontSize(8.5).font('Helvetica-Oblique')
               .text(`\uD83D\uDCAD  "${data.affirmation}"`, MARGIN + 12, doc.y + 7,
                     { width: COL_W - 24 });
            fc(doc, C.text);
            doc.y += 28;
        }

        // Milestone
        ensureSpace(doc, 18);
        fc(doc, C.textLight);
        doc.fontSize(8).font('Helvetica')
           .text('\u25A1  Milestone: Reflect on your terrain progress this week. Note one win and one area to continue.',
                 MARGIN + 6, doc.y, { width: COL_W - 12 });
        doc.y += 16;
    }
}

// PAGE 17 — Navigation Resources & Next Steps ────────────────────────────────
function buildResourcesPage(doc, report) {
    newPage(doc);
    sectionBanner(doc, '\uD83D\uDCDA  Guides, Maps & Provisions — Your Navigation Resources', C.indigo);

    const res = report.recommendedResources || {};
    const sections = [
        { title: '\uD83C\uDFEB  Workshops & Training', items: res.workshops,        color: C.indigo },
        { title: '\u25B6\uFE0F  Videos & Talks',        items: res.videos,           color: C.purple },
        { title: '\u270F\uFE0F  Daily Practices',        items: res.practices,        color: C.emerald },
        { title: '\uD83D\uDCDA  Books & Reading',        items: res.readingMaterials, color: C.amber },
    ];
    for (const { title, items, color } of sections) {
        if (!items || items.length === 0) continue;
        ensureSpace(doc, 40);
        sectionBanner(doc, title, color);
        bulletList(doc, items.slice(0, 4));
        doc.y += 4;
    }

    ensureSpace(doc, 50);
    sectionBanner(doc, '\uD83E\uDDED  Next Steps on Your Journey', C.emerald);
    bulletList(doc, [
        '\uD83D\uDD04  Retake the Resilience Atlas\u2122 in 30 days to track expedition progress.',
        '\uD83D\uDC65  Share your results with a trusted friend — discover your combined Navigator Types.',
        '\uD83D\uDCDD  Use your Daily Waypoints from the Route Map every day this month.',
        '\uD83D\uDCCA  Keep a Resilience Journal — record moments you navigated challenges using your strengths.',
        '\uD83C\uDF1F  Explore premium features for deeper dimension coaching and personalised planning.',
    ]);
    doc.y += 8;

    ensureSpace(doc, 50);
    sectionBanner(doc, '\uD83E\uDDD8  Mindfulness & Meditation Aids', C.purple);
    bulletList(doc, [
        'Insight Timer (free app) — thousands of guided meditations for resilience',
        'Calm or Headspace — nervous system regulation programmes',
        'Tara Brach\'s RAIN practice — free at tarabrach.com',
        'The Wim Hof Method — breathwork for physical and mental resilience',
    ]);
    doc.y += 8;

    // Closing block
    ensureSpace(doc, 68);
    const closeY = doc.y;
    fillRect(doc, MARGIN, closeY, COL_W, 60, 6, C.indigoDark);
    fc(doc, C.bgWhite);
    doc.fontSize(13).font('Helvetica-Bold')
       .text('Your Expedition Has Already Begun.', MARGIN + 14, closeY + 10,
             { align: 'center', width: COL_W - 28 });
    fc(doc, '#C4B5FD');
    doc.fontSize(9).font('Helvetica')
       .text('Every challenge you have navigated brought you to this moment. ' +
             'This report is your compass — The Resilience Atlas\u2122 is with you for every step ahead.',
             MARGIN + 14, closeY + 32, { align: 'center', width: COL_W - 28, lineGap: 3 });
    fc(doc, C.text);
    doc.y = closeY + 68;
}

// ── Atlas-themed footers ──────────────────────────────────────────────────────
function addAtlasFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const footerY = PAGE_H - FOOTER_H;
        sc(doc, C.border);
        doc.moveTo(MARGIN, footerY - 5).lineTo(PAGE_W - MARGIN, footerY - 5).stroke();
        fc(doc, C.textLight);
        // Temporarily remove bottom margin so footer text doesn't trigger auto page-break
        const origBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;
        doc.fontSize(7.5).font('Helvetica')
           .text(
               `The Resilience Atlas\u2122  \u2014  Your Personal Navigation Map  |  ` +
               `For personal growth & self-reflection only. Not a clinical assessment.  |  ` +
               `Page ${i + 1} of ${range.count}`,
               MARGIN, footerY,
               { width: COL_W, align: 'center', lineBreak: false }
           );
        doc.page.margins.bottom = origBottom;
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a comprehensive Atlas-themed PDF report using PDFKit.
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
                margin: MARGIN,
                bufferPages: true,
                info: {
                    Title:    'The Resilience Atlas\u2122 \u2014 Your Personal Resilience Map',
                    Author:   'The Resilience Atlas\u2122',
                    Subject:  'Personal Resilience Assessment Report',
                    Keywords: 'resilience, atlas, navigation, compass, personal growth',
                },
            });

            const chunks = [];
            doc.on('data',  (chunk) => chunks.push(chunk));
            doc.on('end',   () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const score = Number(overall) || 0;

            // ── 17-page Atlas Report ─────────────────────────────────────────
            buildCoverPage(doc, report, score);                 // Page  1
            buildWelcomePage(doc, report, score);               // Page  2
            buildExecutiveSummaryPage(doc, report, score);      // Page  3
            buildVisualDashboard(doc, report);                  // Page  4
            buildDimensionScoresPage(doc, report);              // Page  5
            buildDimensionDeepDives(doc, report);               // Pages 6–11
            buildArchetypePage(doc, report);                    // Page 12
            buildStrengthIntegrationPage(doc, report);          // Page 13
            buildStressResponsePage(doc, report);               // Page 14
            buildRelationshipPage(doc, report);                 // Page 15
            build30DayPlanPage(doc, report);                    // Page 16
            buildResourcesPage(doc, report);                    // Page 17

            addAtlasFooters(doc);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { buildPdfWithPDFKit };
