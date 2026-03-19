'use strict';

const PDFDocument = require('pdfkit');

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = {
    // Primary Atlas palette
    indigo: '#4f46e5',
    indigoDark: '#3730a3',
    indigoLight: '#818cf8',
    purple: '#8b5cf6',
    purpleDark: '#6d28d9',
    purpleLight: '#c4b5fd',
    // Accent colours
    emerald: '#10b981',
    emeraldLight: '#6ee7b7',
    amber: '#f59e0b',
    amberLight: '#fde68a',
    rose: '#f43f5e',
    sky: '#0ea5e9',
    // Score level colours
    strong: '#10b981',
    solid: '#4f46e5',
    developing: '#f59e0b',
    emerging: '#ef4444',
    // Neutrals (slate)
    slate900: '#0f172a',
    slate800: '#1e293b',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748b',
    slate400: '#94a3b8',
    slate200: '#e2e8f0',
    slate100: '#f1f5f9',
    slate50: '#f8fafc',
    white: '#ffffff',
    // Background tints
    bgIndigo: '#eef2ff',
    bgPurple: '#faf5ff',
    bgEmerald: '#f0fdf4',
    bgAmber: '#fffbeb',
    bgRose: '#fff1f2',
    bgSky: '#f0f9ff',
};

const LEVEL_COLORS = {
    strong: COLORS.emerald,
    solid: COLORS.indigo,
    developing: COLORS.amber,
    emerging: COLORS.rose,
};

const LEVEL_LABELS = {
    strong: 'Strong',
    solid: 'Solid',
    developing: 'Developing',
    emerging: 'Emerging',
};

const DIMENSION_EMOJIS = {
    'Cognitive-Narrative': '🧠',
    'Relational-Connective': '🤝',
    'Agentic-Generative': '🧭',
    'Emotional-Adaptive': '💛',
    'Spiritual-Reflective': '🌟',
    'Somatic-Regulative': '⚡',
};

const DIMENSION_COLORS = {
    'Cognitive-Narrative': COLORS.sky,
    'Relational-Connective': COLORS.purple,
    'Agentic-Generative': COLORS.indigo,
    'Emotional-Adaptive': COLORS.amber,
    'Spiritual-Reflective': COLORS.emerald,
    'Somatic-Regulative': COLORS.rose,
};

// ── Layout constants ──────────────────────────────────────────────────────────
const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28;   // A4 portrait
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_HEIGHT = 30;
const BODY_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN - FOOTER_HEIGHT - 10;

// ── Low-level drawing helpers ─────────────────────────────────────────────────

function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fc(doc, hex) { doc.fillColor(hexToRgb(hex)); }
function sc(doc, hex) { doc.strokeColor(hexToRgb(hex)); }

function newPage(doc) { doc.addPage(); }

function ensureSpace(doc, needed) {
    if (doc.y + needed > BODY_BOTTOM) newPage(doc);
}

// ── Themed drawing helpers ─────────────────────────────────────────────────────

/** Coloured section bar with white text. */
function sectionBar(doc, text, colorHex, yPos) {
    const y = yPos !== undefined ? yPos : doc.y;
    fc(doc, colorHex);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 26, 5).fill();
    fc(doc, COLORS.white);
    doc.fontSize(11).font('Helvetica-Bold').text(text, PAGE_MARGIN + 12, y + 7, { width: CONTENT_WIDTH - 24 });
    fc(doc, COLORS.slate800);
    doc.y = y + 34;
    return doc.y;
}

/** Compact colored label bar (smaller than sectionBar). */
function labelBar(doc, text, colorHex) {
    const y = doc.y;
    fc(doc, colorHex);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 20, 4).fill();
    fc(doc, COLORS.white);
    doc.fontSize(9).font('Helvetica-Bold').text(text.toUpperCase(), PAGE_MARGIN + 10, y + 5, {
        width: CONTENT_WIDTH - 20, characterSpacing: 0.8,
    });
    fc(doc, COLORS.slate800);
    doc.y = y + 27;
}

/** Coloured info / callout box. */
function calloutBox(doc, text, bgHex, borderHex, x, y, width, opts) {
    if (!text) return y;
    const pad = 10;
    const innerW = width - pad * 2;
    const fontSize = (opts && opts.fontSize) || 10;
    const fontStyle = (opts && opts.bold) ? 'Helvetica-Bold' : 'Helvetica';
    const textH = doc.fontSize(fontSize).font(fontStyle).heightOfString(text, { width: innerW, lineGap: 2 });
    const boxH = textH + pad * 2;
    fc(doc, bgHex);
    sc(doc, borderHex);
    doc.roundedRect(x, y, width, boxH, 6).fillAndStroke();
    fc(doc, COLORS.slate800);
    doc.fontSize(fontSize).font(fontStyle).text(text, x + pad, y + pad, { width: innerW, lineGap: 2 });
    doc.y = y + boxH + 6;
    return doc.y;
}

/** Atlas-styled callout with compass icon label. */
function compassCallout(doc, label, text, bgHex, borderHex) {
    if (!text) return;
    ensureSpace(doc, 50);
    const y = doc.y;
    const pad = 10;
    const innerW = CONTENT_WIDTH - pad * 2;
    const headerH = 18;
    const textH = doc.fontSize(9).font('Helvetica').heightOfString(text, { width: innerW, lineGap: 2 });
    const boxH = headerH + textH + pad * 2 + 4;
    // Outer box
    fc(doc, bgHex);
    sc(doc, borderHex);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, boxH, 6).fillAndStroke();
    // Label strip
    fc(doc, borderHex);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, headerH, 6).fill();
    doc.rect(PAGE_MARGIN, y + headerH - 6, CONTENT_WIDTH, 6).fill(); // square bottom corners
    fc(doc, COLORS.white);
    doc.fontSize(8).font('Helvetica-Bold').text(`\u{1F9ED} ${label}`, PAGE_MARGIN + 10, y + 5, { width: innerW });
    // Body text
    fc(doc, COLORS.slate800);
    doc.fontSize(9).font('Helvetica').text(text, PAGE_MARGIN + pad, y + headerH + pad, { width: innerW, lineGap: 2 });
    doc.y = y + boxH + 8;
}

/** Progress bar. */
function progressBar(doc, x, y, width, pct, colorHex) {
    const h = 10;
    fc(doc, COLORS.slate200);
    sc(doc, COLORS.slate200);
    doc.roundedRect(x, y, width, h, 4).fillAndStroke();
    const fillW = Math.max(4, Math.min(pct / 100, 1) * width);
    fc(doc, colorHex);
    sc(doc, colorHex);
    doc.roundedRect(x, y, fillW, h, 4).fillAndStroke();
    fc(doc, COLORS.slate800);
    sc(doc, COLORS.slate200);
}

/** Draw a decorative compass-rose symbol at (cx, cy) with given radius. */
function compassRose(doc, cx, cy, r, colorHex) {
    const arms = 8;
    for (let i = 0; i < arms; i++) {
        const angle = (i / arms) * Math.PI * 2 - Math.PI / 2;
        const len = i % 2 === 0 ? r : r * 0.6;
        const x2 = cx + Math.cos(angle) * len;
        const y2 = cy + Math.sin(angle) * len;
        sc(doc, colorHex);
        doc.lineWidth(i % 2 === 0 ? 2 : 1)
            .moveTo(cx, cy)
            .lineTo(x2, y2)
            .stroke();
    }
    fc(doc, colorHex);
    doc.circle(cx, cy, 5).fill();
    doc.lineWidth(1);
}

/** Small bullet-list helper. */
function bulletList(doc, items, indent, colorHex) {
    if (!items || items.length === 0) return;
    fc(doc, COLORS.slate700);
    for (const item of items) {
        ensureSpace(doc, 16);
        // Bullet dot
        fc(doc, colorHex || COLORS.indigo);
        doc.circle(PAGE_MARGIN + indent + 4, doc.y + 5, 3).fill();
        fc(doc, COLORS.slate700);
        doc.fontSize(9).font('Helvetica').text(item, PAGE_MARGIN + indent + 12, doc.y, {
            width: CONTENT_WIDTH - indent - 12, lineGap: 2,
        });
        doc.y += 2;
    }
    doc.y += 4;
}

/** Two-column layout helper — renders label+value pairs side by side. */
function twoColStat(doc, col1Label, col1Val, col2Label, col2Val, colorHex) {
    const colW = CONTENT_WIDTH / 2 - 8;
    const y = doc.y;
    // Col 1
    fc(doc, COLORS.slate100);
    sc(doc, COLORS.slate200);
    doc.roundedRect(PAGE_MARGIN, y, colW, 36, 4).fillAndStroke();
    fc(doc, colorHex || COLORS.indigo);
    doc.fontSize(16).font('Helvetica-Bold').text(col1Val, PAGE_MARGIN + 10, y + 4, { width: colW - 20 });
    fc(doc, COLORS.slate500);
    doc.fontSize(8).font('Helvetica').text(col1Label, PAGE_MARGIN + 10, y + 24, { width: colW - 20 });
    // Col 2
    const x2 = PAGE_MARGIN + colW + 16;
    fc(doc, COLORS.slate100);
    sc(doc, COLORS.slate200);
    doc.roundedRect(x2, y, colW, 36, 4).fillAndStroke();
    fc(doc, colorHex || COLORS.indigo);
    doc.fontSize(16).font('Helvetica-Bold').text(col2Val, x2 + 10, y + 4, { width: colW - 20 });
    fc(doc, COLORS.slate500);
    doc.fontSize(8).font('Helvetica').text(col2Label, x2 + 10, y + 24, { width: colW - 20 });
    fc(doc, COLORS.slate800);
    sc(doc, COLORS.slate200);
    doc.y = y + 44;
}

// ── Page builders ─────────────────────────────────────────────────────────────

/** PAGE 1 — Premium Cover */
function buildCoverPage(doc, report, overall) {
    const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const level = report.overallLevel || 'developing';
    const levelLabel = LEVEL_LABELS[level] || 'Developing';

    // Full-page gradient-style background (approximate with layered rects)
    fc(doc, COLORS.indigoDark);
    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill();
    fc(doc, COLORS.purpleDark);
    doc.rect(0, PAGE_HEIGHT * 0.55, PAGE_WIDTH, PAGE_HEIGHT * 0.45).fill();

    // Decorative compass rose (top-right)
    compassRose(doc, PAGE_WIDTH - 70, 80, 40, 'rgba(255,255,255,0.25)');
    // A second subtle one bottom-left
    compassRose(doc, 70, PAGE_HEIGHT - 80, 30, 'rgba(255,255,255,0.15)');

    // Atlas logo / brand wordmark
    fc(doc, COLORS.white);
    doc.fontSize(11).font('Helvetica').text(
        '\u{1F9ED}  THE RESILIENCE ATLAS\u2122',
        PAGE_MARGIN, 44,
        { width: CONTENT_WIDTH, align: 'center', characterSpacing: 2 }
    );

    // Divider
    sc(doc, COLORS.purpleLight);
    doc.moveTo(PAGE_MARGIN + 60, 62).lineTo(PAGE_WIDTH - PAGE_MARGIN - 60, 62).lineWidth(1).stroke();
    doc.lineWidth(1);

    // Main title
    fc(doc, COLORS.white);
    doc.fontSize(26).font('Helvetica-Bold').text(
        'Your Personal Resilience Report',
        PAGE_MARGIN, 80,
        { width: CONTENT_WIDTH, align: 'center' }
    );
    fc(doc, COLORS.purpleLight);
    doc.fontSize(12).font('Helvetica').text(
        'Your Navigation Map to Lasting Resilience',
        PAGE_MARGIN, 116,
        { width: CONTENT_WIDTH, align: 'center' }
    );

    // Hero score circle
    const heroY = 160;
    const cx = PAGE_WIDTH / 2;
    fc(doc, 'rgba(255,255,255,0.12)');
    doc.circle(cx, heroY + 60, 70).fill();
    fc(doc, COLORS.white);
    doc.circle(cx, heroY + 60, 58).fill();
    fc(doc, COLORS.indigo);
    doc.fontSize(36).font('Helvetica-Bold').text(
        `${overall}%`,
        cx - 45, heroY + 36,
        { width: 90, align: 'center' }
    );
    fc(doc, COLORS.indigo);
    doc.fontSize(9).font('Helvetica-Bold').text(
        levelLabel.toUpperCase(),
        cx - 45, heroY + 80,
        { width: 90, align: 'center', characterSpacing: 1 }
    );

    // Score label above circle
    fc(doc, COLORS.amberLight);
    doc.fontSize(10).font('Helvetica-Bold').text(
        'OVERALL RESILIENCE SCORE',
        PAGE_MARGIN, heroY - 12,
        { width: CONTENT_WIDTH, align: 'center', characterSpacing: 1 }
    );

    // Archetype badge
    const badgeY = heroY + 148;
    fc(doc, 'rgba(255,255,255,0.15)');
    doc.roundedRect(PAGE_MARGIN + 40, badgeY, CONTENT_WIDTH - 80, 48, 10).fill();
    fc(doc, COLORS.amberLight);
    doc.fontSize(10).font('Helvetica-Bold').text(
        'YOUR ARCHETYPE',
        PAGE_MARGIN + 40, badgeY + 8,
        { width: CONTENT_WIDTH - 80, align: 'center', characterSpacing: 1 }
    );
    fc(doc, COLORS.white);
    doc.fontSize(15).font('Helvetica-Bold').text(
        report.profileArchetype || 'The Balanced',
        PAGE_MARGIN + 40, badgeY + 22,
        { width: CONTENT_WIDTH - 80, align: 'center' }
    );

    // Tagline
    fc(doc, COLORS.purpleLight);
    doc.fontSize(10).font('Helvetica-Oblique').text(
        '"Discover your inner compass. Navigate your resilience journey."',
        PAGE_MARGIN, badgeY + 72,
        { width: CONTENT_WIDTH, align: 'center' }
    );

    // Assessment date + primary strength
    const metaY = badgeY + 102;
    fc(doc, 'rgba(255,255,255,0.6)');
    doc.fontSize(9).font('Helvetica').text(
        `Assessment Date: ${dateStr}   \u2022   Primary Strength: ${report.dominantType || 'N/A'}`,
        PAGE_MARGIN, metaY,
        { width: CONTENT_WIDTH, align: 'center' }
    );

    // Bottom tagline
    fc(doc, 'rgba(255,255,255,0.4)');
    doc.fontSize(8).font('Helvetica').text(
        'For personal growth and self-reflection \u2014 not a clinical assessment',
        PAGE_MARGIN, PAGE_HEIGHT - 40,
        { width: CONTENT_WIDTH, align: 'center' }
    );
}

/** PAGE 2 — Your Resilience Journey */
function buildJourneyPage(doc, report, overall) {
    newPage(doc);
    const level = report.overallLevel || 'developing';
    const levelLabel = LEVEL_LABELS[level] || 'Developing';
    const levelColor = LEVEL_COLORS[level] || COLORS.indigo;

    // Page header
    sectionBar(doc, '\u{1F5FA}  Your Resilience Journey — You Are Here', COLORS.indigoDark);

    // Welcome narrative
    calloutBox(doc,
        'Welcome to The Resilience Atlas\u2122. This report is more than a score — it is a ' +
        'navigation map for your inner life. Resilience is not a fixed destination but a ' +
        'dynamic journey, and you are already on it. What follows will show you where you ' +
        'stand today, the terrain you\'ve already covered, and the new territory ahead of you.',
        COLORS.bgIndigo, COLORS.indigoLight,
        PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    // Score stats
    twoColStat(doc,
        'Overall Score', `${overall}%`,
        'Resilience Level', levelLabel,
        levelColor
    );

    // Percentile & benchmark
    const totalPct = (report.dimensionAnalysis)
        ? Math.round(Object.values(report.dimensionAnalysis).reduce((sum, d) => sum + (d.benchmark ? d.benchmark.percentile : 50), 0) / Object.keys(report.dimensionAnalysis).length)
        : 50;

    twoColStat(doc,
        'Approx. Percentile', `Top ${100 - totalPct}%`,
        'Dimensions Assessed', '6',
        COLORS.purple
    );

    doc.y += 4;

    // "You Are Here" narrative card
    sectionBar(doc, '\u{1F4CD}  You Are Here on Your Resilience Map', COLORS.purple);

    const youAreHereNarrative = buildYouAreHereNarrative(overall, levelLabel, report.profileArchetype, report.dominantType);
    calloutBox(doc, youAreHereNarrative, COLORS.bgPurple, COLORS.purpleLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH, { fontSize: 10 });

    // Level interpretation
    sectionBar(doc, '\u{1F4CA}  What Your Level Means', COLORS.slate700);
    const levelInterpretations = {
        strong:
            'A Strong resilience level signals a well-developed foundation across multiple ' +
            'dimensions. You have built genuine capacity to navigate adversity — and this report ' +
            'will help you go even deeper, sharing your strengths with others, and exploring ' +
            'new territories of growth.',
        solid:
            'A Solid resilience level reflects meaningful development and real capacity to ' +
            'navigate life\'s challenges. You have genuine strengths to build on and clear ' +
            'opportunities to deepen. This is a rich and exciting stage of the resilience journey.',
        developing:
            'A Developing resilience level indicates an active growth phase — you are building ' +
            'capacity in real time. This report will give you the specific practices and insights ' +
            'to accelerate your journey and turn potential into strength.',
        emerging:
            'An Emerging resilience level signals that significant growth territory lies ahead ' +
            'of you — and that is good news. The foundations are present; this report will ' +
            'illuminate specific pathways forward and celebrate the courage it takes to engage ' +
            'in this kind of honest self-exploration.',
    };
    calloutBox(doc, levelInterpretations[level] || levelInterpretations.developing,
        COLORS.bgEmerald, COLORS.emeraldLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
}

function buildYouAreHereNarrative(overall, levelLabel, archetype, dominant) {
    return (
        `Your overall resilience score of ${overall}% places you at a ${levelLabel} level on ` +
        `The Resilience Atlas\u2122 map. As ${archetype || 'a resilience-builder'}, your journey ` +
        `is anchored in ${dominant || 'your primary strength'} \u2014 the dimension where your ` +
        `inner compass is most reliably calibrated.\n\n` +
        `Every explorer begins somewhere. Your current coordinates on this map are not a ` +
        `verdict on your capacity \u2014 they are a starting point. The dimensions ahead of ` +
        `you represent new territory to discover, and the strengths you already carry are the ` +
        `tools you will use to navigate them.`
    );
}

/** PAGE 3 — Your Resilience Map (dimension overview) */
function buildMapPage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F5FA}  Your Resilience Map \u2014 Territory Overview', COLORS.indigoDark);

    calloutBox(doc,
        'Every resilience map has six territories. Below is your current landscape \u2014 ' +
        'the regions where you are strongest and those that hold the most growth potential. ' +
        'Each territory has its own wisdom, and together they form your unique Resilience Atlas.',
        COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    doc.y += 6;

    // Dimension score table (visual map)
    const dims = Object.entries(report.dimensionAnalysis || {});
    for (const [dimName, analysis] of dims) {
        ensureSpace(doc, 50);
        const dimColor = DIMENSION_COLORS[dimName] || COLORS.indigo;
        const levelColor = LEVEL_COLORS[analysis.level] || COLORS.indigo;
        const rowY = doc.y;

        // Row background
        fc(doc, COLORS.slate50);
        sc(doc, COLORS.slate200);
        doc.roundedRect(PAGE_MARGIN, rowY, CONTENT_WIDTH, 40, 4).fillAndStroke();

        // Colored left accent strip
        fc(doc, dimColor);
        doc.roundedRect(PAGE_MARGIN, rowY, 5, 40, 2).fill();

        // Dimension name
        fc(doc, COLORS.slate800);
        doc.fontSize(10).font('Helvetica-Bold').text(
            `${DIMENSION_EMOJIS[dimName] || ''} ${dimName}`,
            PAGE_MARGIN + 14, rowY + 5, { width: 175 }
        );

        // Tagline / descriptor
        fc(doc, COLORS.slate500);
        doc.fontSize(8).font('Helvetica-Oblique').text(
            analysis.description ? analysis.description.split('.')[0] + '.' : '',
            PAGE_MARGIN + 14, rowY + 20, { width: 175 }
        );

        // Score
        fc(doc, levelColor);
        doc.fontSize(16).font('Helvetica-Bold').text(
            `${Number(analysis.percentage || 0).toFixed(0)}%`,
            PAGE_MARGIN + 200, rowY + 8, { width: 55, align: 'right' }
        );

        // Progress bar
        progressBar(doc, PAGE_MARGIN + 260, rowY + 14, 120, analysis.percentage || 0, levelColor);

        // Level badge
        fc(doc, levelColor);
        doc.fontSize(8).font('Helvetica-Bold').text(
            (LEVEL_LABELS[analysis.level] || analysis.level || '').toUpperCase(),
            PAGE_MARGIN + 390, rowY + 15, { width: 55, align: 'center' }
        );

        fc(doc, COLORS.slate800);
        doc.y = rowY + 48;
    }

    doc.y += 8;

    // Territory overview legend
    sectionBar(doc, '\u{1F9ED}  Reading Your Map', COLORS.slate700);
    const legendItems = [
        ['Strong (80%+)', COLORS.emerald, 'This territory is well-developed — a genuine strength and resource.'],
        ['Solid (65–79%)', COLORS.indigo, 'Strong foundation with clear capacity for continued deepening.'],
        ['Developing (50–64%)', COLORS.amber, 'Active growth zone — real potential being built right now.'],
        ['Emerging (<50%)', COLORS.rose, 'New territory ahead — rich in opportunity and learning.'],
    ];
    for (const [label, color, desc] of legendItems) {
        ensureSpace(doc, 20);
        fc(doc, color);
        doc.rect(PAGE_MARGIN + 8, doc.y + 2, 10, 10).fill();
        fc(doc, COLORS.slate800);
        doc.fontSize(9).font('Helvetica-Bold').text(label, PAGE_MARGIN + 24, doc.y, { continued: true });
        fc(doc, COLORS.slate600);
        doc.fontSize(9).font('Helvetica').text(`  \u2014  ${desc}`, { width: CONTENT_WIDTH - 36 });
        doc.y += 2;
    }
}

/** PAGE 4 — Your Resilience Archetype */
function buildArchetypePage(doc, report) {
    newPage(doc);
    const archetype = report._archetypeObj || {};
    const archetypeName = report.profileArchetype || 'Your Archetype';
    const archetypeEmoji = archetype.emoji || '\u{1F9ED}';

    sectionBar(doc, `${archetypeEmoji}  Your Resilience Archetype`, COLORS.purple);

    // Archetype name hero
    const heroY = doc.y;
    fc(doc, COLORS.bgPurple);
    sc(doc, COLORS.purpleLight);
    doc.roundedRect(PAGE_MARGIN, heroY, CONTENT_WIDTH, 50, 8).fillAndStroke();
    fc(doc, COLORS.purple);
    doc.fontSize(22).font('Helvetica-Bold').text(archetypeName, PAGE_MARGIN + 16, heroY + 8, { width: CONTENT_WIDTH - 32 });
    fc(doc, COLORS.purpleDark);
    doc.fontSize(10).font('Helvetica-Oblique').text(
        'Your dominant resilience identity and navigation style',
        PAGE_MARGIN + 16, heroY + 32, { width: CONTENT_WIDTH - 32 }
    );
    fc(doc, COLORS.slate800);
    doc.y = heroY + 58;

    // Description
    if (report.profileDescription) {
        calloutBox(doc, report.profileDescription,
            COLORS.bgPurple, COLORS.purpleLight,
            PAGE_MARGIN, doc.y, CONTENT_WIDTH, { fontSize: 10 });
    }

    // Superpowers
    if (archetype.superpowers && archetype.superpowers.length > 0) {
        sectionBar(doc, '\u26A1  Your Superpowers', COLORS.emerald);
        bulletList(doc, archetype.superpowers, 0, COLORS.emerald);
    }

    // How this archetype shows up daily
    if (archetype.teamRole) {
        ensureSpace(doc, 60);
        sectionBar(doc, '\u{1F4BC}  How You Show Up in the World', COLORS.indigoDark);
        calloutBox(doc, archetype.teamRole, COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    // Partnership dynamics
    if (archetype.partnershipTips && archetype.partnershipTips.length > 0) {
        ensureSpace(doc, 60);
        sectionBar(doc, '\u{1F91D}  Navigating with Others', COLORS.purple);
        bulletList(doc, archetype.partnershipTips, 0, COLORS.purple);
    }

    // Blind spots (framed as navigation watchpoints)
    if (archetype.blindSpots && archetype.blindSpots.length > 0) {
        ensureSpace(doc, 60);
        sectionBar(doc, '\u{1F4A1}  Watchpoints on Your Map', COLORS.amber);
        calloutBox(doc, 'Every archetype has navigation watchpoints — areas to stay mindful of as you travel.',
            COLORS.bgAmber, COLORS.amberLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
        bulletList(doc, archetype.blindSpots, 0, COLORS.amber);
    }
}

/** PAGE 5–10 — Dimension Deep-Dives (one per dimension) */
function buildDimensionDeepDive(doc, dimName, analysis, dimIndex) {
    newPage(doc);
    const dimColor = DIMENSION_COLORS[dimName] || COLORS.indigo;
    const levelColor = LEVEL_COLORS[analysis.level] || COLORS.indigo;
    const emoji = DIMENSION_EMOJIS[dimName] || '';
    const levelLabel = LEVEL_LABELS[analysis.level] || analysis.level || '';
    const pct = Number(analysis.percentage || 0);

    // ─ Dimension header ─
    const headerH = 70;
    fc(doc, dimColor);
    doc.rect(0, doc.y - PAGE_MARGIN + PAGE_MARGIN, PAGE_WIDTH, headerH).fill();
    // We'll just draw a colored bar at current y
    const headerY = doc.y;
    fc(doc, dimColor);
    doc.roundedRect(PAGE_MARGIN, headerY, CONTENT_WIDTH, headerH, 8).fill();

    // Dimension number
    fc(doc, 'rgba(255,255,255,0.4)');
    doc.fontSize(36).font('Helvetica-Bold').text(
        `0${dimIndex + 1}`, PAGE_MARGIN + CONTENT_WIDTH - 60, headerY + 10, { width: 50, align: 'right' }
    );

    // Dimension name
    fc(doc, COLORS.white);
    doc.fontSize(18).font('Helvetica-Bold').text(
        `${emoji}  ${dimName}`,
        PAGE_MARGIN + 12, headerY + 10, { width: CONTENT_WIDTH - 80 }
    );

    // Score + level badge
    fc(doc, COLORS.white);
    doc.fontSize(26).font('Helvetica-Bold').text(
        `${pct.toFixed(0)}%`,
        PAGE_MARGIN + 12, headerY + 36, { width: 80 }
    );
    fc(doc, 'rgba(255,255,255,0.75)');
    doc.fontSize(10).font('Helvetica-Bold').text(
        levelLabel.toUpperCase(),
        PAGE_MARGIN + 70, headerY + 43, { width: 80 }
    );

    fc(doc, COLORS.slate800);
    doc.y = headerY + headerH + 8;

    // Progress bar
    progressBar(doc, PAGE_MARGIN, doc.y, CONTENT_WIDTH, pct, levelColor);
    doc.y += 16;

    // Benchmark
    if (analysis.benchmark) {
        fc(doc, COLORS.slate500);
        doc.fontSize(8).font('Helvetica-Oblique').text(
            `Approx. ${analysis.benchmark.percentile}th percentile \u2014 population mean: ${analysis.benchmark.populationMean}%`,
            PAGE_MARGIN, doc.y
        );
        doc.y += 14;
    }
    fc(doc, COLORS.slate800);

    // ─ What This Means ─
    if (analysis.personalizedInsight) {
        sectionBar(doc, '\u{1F4CD}  What This Means for You', dimColor);
        calloutBox(doc, analysis.personalizedInsight, COLORS.bgIndigo, dimColor, PAGE_MARGIN, doc.y, CONTENT_WIDTH, { fontSize: 9 });
    }

    // ─ Core Strengths ─
    if (analysis.strengthsDemonstrated && analysis.strengthsDemonstrated.length > 0) {
        ensureSpace(doc, 50);
        sectionBar(doc, '\u{1F31F}  Strengths You Carry', COLORS.emerald);
        bulletList(doc, analysis.strengthsDemonstrated, 0, COLORS.emerald);
    }

    // ─ Growth Opportunities ─
    if (analysis.growthOpportunities && analysis.growthOpportunities.length > 0) {
        ensureSpace(doc, 50);
        sectionBar(doc, '\u{1F331}  Growth Territory Ahead', COLORS.amber);
        bulletList(doc, analysis.growthOpportunities, 0, COLORS.amber);
    }

    // ─ Application Across Life Areas ─
    if (analysis.lifeApplications) {
        ensureSpace(doc, 30);
        sectionBar(doc, '\u{1F5FA}  Applying This Strength Across Your Life', dimColor);

        const lifeAreas = [
            { key: 'relationships', label: '\u2764\uFE0F  In Relationships', bg: COLORS.bgRose, border: COLORS.rose },
            { key: 'friendships', label: '\u{1F91D}  In Friendships', bg: COLORS.bgPurple, border: COLORS.purpleLight },
            { key: 'parenting', label: '\u{1F476}  In Parenting', bg: COLORS.bgEmerald, border: COLORS.emeraldLight },
            { key: 'work', label: '\u{1F4BC}  At Work', bg: COLORS.bgIndigo, border: COLORS.indigoLight },
            { key: 'personalGrowth', label: '\u{1F331}  Personal Growth', bg: COLORS.bgAmber, border: COLORS.amberLight },
        ];

        for (const area of lifeAreas) {
            const text = analysis.lifeApplications[area.key];
            if (!text) continue;
            ensureSpace(doc, 50);
            const areaY = doc.y;
            const pad = 8;
            const innerW = CONTENT_WIDTH - pad * 2 - 16;
            const labelH = 16;
            const textH = doc.fontSize(9).font('Helvetica').heightOfString(text, { width: innerW, lineGap: 2 });
            const boxH = labelH + textH + pad * 2 + 4;

            fc(doc, area.bg);
            sc(doc, area.border);
            doc.roundedRect(PAGE_MARGIN, areaY, CONTENT_WIDTH, boxH, 5).fillAndStroke();

            // Colored left border accent
            fc(doc, area.border);
            doc.roundedRect(PAGE_MARGIN, areaY, 4, boxH, 2).fill();

            // Area label
            fc(doc, COLORS.slate700);
            doc.fontSize(9).font('Helvetica-Bold').text(area.label, PAGE_MARGIN + 12, areaY + 6, { width: CONTENT_WIDTH - 20 });

            // Area text
            fc(doc, COLORS.slate700);
            doc.fontSize(9).font('Helvetica').text(text, PAGE_MARGIN + 12, areaY + labelH + 8, { width: innerW, lineGap: 2 });

            fc(doc, COLORS.slate800);
            doc.y = areaY + boxH + 6;
        }
    }

    // ─ Daily Micro-Practice ─
    if (analysis.dailyMicroPractice) {
        ensureSpace(doc, 50);
        sectionBar(doc, '\u{1F9ED}  Daily Practice (15 min)', COLORS.indigo);
        compassCallout(doc, 'Compass Practice', analysis.dailyMicroPractice, COLORS.bgIndigo, COLORS.indigoLight);
    }

    // ─ Affirmation ─
    if (analysis.affirmation) {
        ensureSpace(doc, 36);
        const affY = doc.y;
        fc(doc, dimColor);
        doc.roundedRect(PAGE_MARGIN, affY, CONTENT_WIDTH, 28, 6).fill();
        fc(doc, COLORS.white);
        doc.fontSize(10).font('Helvetica-Oblique').text(
            `\u201C${analysis.affirmation}\u201D`,
            PAGE_MARGIN + 14, affY + 8, { width: CONTENT_WIDTH - 28 }
        );
        fc(doc, COLORS.slate800);
        doc.y = affY + 36;
    }
}

/** PAGE 11 — Strength Integration & Synergies */
function buildStrengthIntegrationPage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F4A0}  Strength Integration \u2014 Your Unique Combination', COLORS.indigoDark);

    const si = report.strengthIntegration || {};

    if (si.topThreeCombo) {
        calloutBox(doc,
            `Your resilience is anchored in: ${si.topThreeCombo}`,
            COLORS.bgPurple, COLORS.purpleLight,
            PAGE_MARGIN, doc.y, CONTENT_WIDTH, { bold: true, fontSize: 11 }
        );
    }

    if (si.blueprint) {
        sectionBar(doc, '\u{1F5FA}  Your Personal Resilience Blueprint', COLORS.purple);
        calloutBox(doc, si.blueprint, COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    if (si.synergies && si.synergies.length > 0) {
        ensureSpace(doc, 50);
        sectionBar(doc, '\u26A1  Synergy Pairs \u2014 How Your Strengths Amplify Each Other', COLORS.emerald);
        bulletList(doc, si.synergies, 0, COLORS.emerald);
    }

    if (si.gaps && si.gaps.length > 0) {
        ensureSpace(doc, 50);
        sectionBar(doc, '\u{1F331}  Growth Gaps \u2014 Unlock Your Full Potential', COLORS.amber);
        calloutBox(doc,
            'These dimensions, when developed, will create a more integrated and complete resilience profile:',
            COLORS.bgAmber, COLORS.amberLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
        bulletList(doc, si.gaps, 0, COLORS.amber);
    }

    // Integration insight
    ensureSpace(doc, 80);
    sectionBar(doc, '\u{1F4A1}  Integration Insight', COLORS.indigo);
    calloutBox(doc,
        'True resilience mastery comes not from maximising any single dimension, but from ' +
        'understanding how all six interact in your unique profile. Your top dimensions are ' +
        'the compass bearings that guide you \u2014 but it is the integration of all six ' +
        'that makes the map complete. Consider this report the beginning of a lifelong ' +
        'navigation practice.',
        COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** PAGE 12 — Stress Response Profile / Internal Compass */
function buildStressResponsePage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F9ED}  Your Internal Compass \u2014 Navigating Under Pressure', COLORS.indigoDark);

    const sr = report.stressResponse || {};

    if (sr.overallResilience) {
        calloutBox(doc, sr.overallResilience, COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
    }

    // Strengths under stress
    if (sr.strengthsUnderStress && sr.strengthsUnderStress.length > 0) {
        sectionBar(doc, '\u26A1  When You\'re at Your Best', COLORS.emerald);
        calloutBox(doc,
            'These dimensions are reliably available to you even under pressure — your steadiest compass bearings:',
            COLORS.bgEmerald, COLORS.emeraldLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
        bulletList(doc, sr.strengthsUnderStress.map(d => `${DIMENSION_EMOJIS[d] || ''} ${d} \u2014 a genuine resource under pressure`), 0, COLORS.emerald);
    }

    // Vulnerabilities under stress
    if (sr.vulnerabilitiesUnderStress && sr.vulnerabilitiesUnderStress.length > 0) {
        ensureSpace(doc, 50);
        sectionBar(doc, '\u{1F4A1}  What Can Drain Your Resilience', COLORS.amber);
        calloutBox(doc,
            'These dimensions may be more vulnerable under significant stress \u2014 they are growth edges, not weaknesses:',
            COLORS.bgAmber, COLORS.amberLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
        bulletList(doc, sr.vulnerabilitiesUnderStress.map(d => `${DIMENSION_EMOJIS[d] || ''} ${d} \u2014 may need extra support when pressure is high`), 0, COLORS.amber);
    }

    // Coping strategies
    if (sr.copingStrategies && sr.copingStrategies.length > 0) {
        ensureSpace(doc, 60);
        sectionBar(doc, '\u{1F5FA}  Grounding Techniques for Your Profile', COLORS.indigo);
        bulletList(doc, sr.copingStrategies, 0, COLORS.indigo);
    }

    // Grounding techniques
    if (sr.groundingTechniques && sr.groundingTechniques.length > 0) {
        ensureSpace(doc, 60);
        sectionBar(doc, '\u{1F4AB}  Emergency Compass Resets', COLORS.purple);
        calloutBox(doc, 'When you feel most disoriented, these somatic techniques can restore your bearing:',
            COLORS.bgPurple, COLORS.purpleLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
        bulletList(doc, sr.groundingTechniques, 0, COLORS.purple);
    }

    // Pressure patterns
    ensureSpace(doc, 60);
    sectionBar(doc, '\u{1F4CA}  Navigating Your Pressure Patterns', COLORS.slate700);
    calloutBox(doc,
        'Your stress response profile reveals predictable patterns in how you navigate difficulty. ' +
        'Awareness of these patterns is itself a resilience skill \u2014 when you can name what ' +
        'is happening internally, you regain choice about how to respond. Your archetype\'s coping ' +
        'strategies listed above are calibrated specifically to your navigation style. Consider ' +
        'returning to them regularly \u2014 not just in crisis, but as preventive maintenance for ' +
        'your inner compass.',
        COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );
}

/** PAGE 13 — Relational Dynamics / Navigating with Others */
function buildRelationalDynamicsPage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F91D}  Navigating with Others \u2014 Relational Dynamics', COLORS.purple);

    const ri = report.relationshipInsights || {};

    if (ri.communicationStyle) {
        sectionBar(doc, '\u{1F5E3}  Your Communication Style', COLORS.indigoDark);
        calloutBox(doc, ri.communicationStyle, COLORS.bgPurple, COLORS.purpleLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH, { fontSize: 10 });
    }

    if (ri.partnershipRecommendations && ri.partnershipRecommendations.length > 0) {
        ensureSpace(doc, 60);
        sectionBar(doc, '\u{1F9ED}  Partnership Navigation Tips', COLORS.emerald);
        bulletList(doc, ri.partnershipRecommendations, 0, COLORS.emerald);
    }

    // How dimensions affect relationships
    ensureSpace(doc, 30);
    sectionBar(doc, '\u{1F5FA}  Your Relational Landscape', COLORS.slate700);

    const dims = Object.entries(report.dimensionAnalysis || {});
    const relDims = dims.filter(([, a]) => a.lifeApplications && a.lifeApplications.relationships);

    for (const [dimName, analysis] of relDims.slice(0, 4)) {
        ensureSpace(doc, 40);
        const dimColor = DIMENSION_COLORS[dimName] || COLORS.indigo;
        const y = doc.y;
        const pad = 8;
        const text = analysis.lifeApplications.relationships;
        const innerW = CONTENT_WIDTH - 20 - pad;
        const labelH = 16;
        const textH = doc.fontSize(9).font('Helvetica').heightOfString(text, { width: innerW, lineGap: 2 });
        const boxH = labelH + textH + pad + 8;

        fc(doc, COLORS.slate50);
        sc(doc, dimColor);
        doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, boxH, 4).fillAndStroke();
        fc(doc, dimColor);
        doc.roundedRect(PAGE_MARGIN, y, 4, boxH, 2).fill();
        fc(doc, COLORS.slate700);
        doc.fontSize(9).font('Helvetica-Bold').text(
            `${DIMENSION_EMOJIS[dimName] || ''} ${dimName}`,
            PAGE_MARGIN + 12, y + 5, { width: CONTENT_WIDTH - 20 }
        );
        doc.fontSize(9).font('Helvetica').text(text, PAGE_MARGIN + 12, y + labelH + 6, { width: innerW, lineGap: 2 });
        fc(doc, COLORS.slate800);
        doc.y = y + boxH + 6;
    }

    // Conflict resolution
    ensureSpace(doc, 60);
    sectionBar(doc, '\u{1F4A1}  Conflict Resolution Approach', COLORS.amber);
    const archetypeObj = report._archetypeObj || {};
    const conflictText =
        'Your resilience profile shapes how you naturally approach conflict. The strongest ' +
        'navigators use conflict as a compass reading \u2014 information about what matters, ' +
        'what has been violated, and what needs to be restored. Your archetype\'s partnership ' +
        'tips above offer specific guidance for navigating disagreement in your closest relationships.';
    calloutBox(doc, conflictText, COLORS.bgAmber, COLORS.amberLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH);
}

/** PAGE 14 — Resilience Across Life Domains */
function buildLifeDomainsPage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F5FA}  Your Resilience Across Life Domains', COLORS.indigoDark);

    calloutBox(doc,
        'Resilience is not abstract \u2014 it lives in the specific territories of your daily life. ' +
        'Below is your personalised map of how your strengths apply across the five most important ' +
        'life domains. Use this as a navigation guide for each area.',
        COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    const domains = [
        {
            key: 'relationships',
            label: '\u2764\uFE0F  Relationships',
            color: COLORS.rose,
            bg: COLORS.bgRose,
            desc: 'Intimate partnerships, family bonds, and close connections',
        },
        {
            key: 'friendships',
            label: '\u{1F91D}  Friendships',
            color: COLORS.purple,
            bg: COLORS.bgPurple,
            desc: 'Social connections, support networks, and community',
        },
        {
            key: 'parenting',
            label: '\u{1F476}  Parenting',
            color: COLORS.emerald,
            bg: COLORS.bgEmerald,
            desc: 'Raising children with intentional resilience practices',
        },
        {
            key: 'work',
            label: '\u{1F4BC}  Work & Career',
            color: COLORS.indigo,
            bg: COLORS.bgIndigo,
            desc: 'Professional performance, leadership, and career navigation',
        },
        {
            key: 'personalGrowth',
            label: '\u{1F331}  Personal Growth',
            color: COLORS.amber,
            bg: COLORS.bgAmber,
            desc: 'Self-development, learning, and becoming',
        },
    ];

    const dims = Object.entries(report.dimensionAnalysis || {});

    for (const domain of domains) {
        ensureSpace(doc, 70);
        const domY = doc.y;
        const domPad = 10;

        // Collect text from all dimensions for this domain
        const texts = dims
            .filter(([, a]) => a.lifeApplications && a.lifeApplications[domain.key])
            .map(([dimName, a]) => `${DIMENSION_EMOJIS[dimName] || ''} ${a.lifeApplications[domain.key]}`);

        if (texts.length === 0) continue;

        // Domain header
        fc(doc, domain.color);
        doc.roundedRect(PAGE_MARGIN, domY, CONTENT_WIDTH, 24, 5).fill();
        fc(doc, COLORS.white);
        doc.fontSize(10).font('Helvetica-Bold').text(domain.label, PAGE_MARGIN + 12, domY + 6, { width: CONTENT_WIDTH - 24 });
        fc(doc, COLORS.slate800);
        doc.y = domY + 30;

        // Domain description
        fc(doc, COLORS.slate500);
        doc.fontSize(8).font('Helvetica-Oblique').text(domain.desc, PAGE_MARGIN + 8, doc.y, { width: CONTENT_WIDTH - 16 });
        doc.y += 12;

        // Top insight (first dimension's application)
        calloutBox(doc, texts[0], domain.bg, domain.color, PAGE_MARGIN, doc.y, CONTENT_WIDTH, { fontSize: 9 });
        doc.y += 4;
    }
}

/** PAGE 15–16 — 30-Day Resilience Navigation Plan */
function build30DayPlanPage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F5FA}  Chart Your Course \u2014 30-Day Resilience Navigation Plan', COLORS.indigoDark);

    calloutBox(doc,
        'The most powerful journey begins with a single, deliberate step. Your 30-day ' +
        'navigation plan is calibrated to your lowest-scoring dimensions \u2014 the territories ' +
        'with the greatest growth potential. Each week has a focus dimension, a daily practice, ' +
        'and a weekly milestone. Commit to 15 minutes per day and notice what changes.',
        COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    const plan = report.thirtyDayPlan || {};
    const weekColors = [COLORS.indigo, COLORS.purple, COLORS.emerald, COLORS.amber];
    const weekBgs = [COLORS.bgIndigo, COLORS.bgPurple, COLORS.bgEmerald, COLORS.bgAmber];

    const weeks = [
        { label: 'Week 1 \u2014 Foundation', data: plan.week1, color: weekColors[0], bg: weekBgs[0] },
        { label: 'Week 2 \u2014 Deepening', data: plan.week2, color: weekColors[1], bg: weekBgs[1] },
        { label: 'Week 3 \u2014 Integration', data: plan.week3, color: weekColors[2], bg: weekBgs[2] },
        { label: 'Week 4 \u2014 Habit Formation', data: plan.week4, color: weekColors[3], bg: weekBgs[3] },
    ];

    for (const { label, data, color, bg } of weeks) {
        if (!data) continue;
        ensureSpace(doc, 80);

        const weekY = doc.y;
        // Week header
        fc(doc, color);
        doc.roundedRect(PAGE_MARGIN, weekY, CONTENT_WIDTH, 28, 6).fill();
        fc(doc, COLORS.white);
        doc.fontSize(11).font('Helvetica-Bold').text(label, PAGE_MARGIN + 12, weekY + 7, { width: CONTENT_WIDTH * 0.6 });
        if (data.focus) {
            fc(doc, 'rgba(255,255,255,0.8)');
            doc.fontSize(9).font('Helvetica').text(data.focus, PAGE_MARGIN + CONTENT_WIDTH * 0.55, weekY + 9, { width: CONTENT_WIDTH * 0.42, align: 'right' });
        }
        fc(doc, COLORS.slate800);
        doc.y = weekY + 36;

        // Exercises
        if (data.exercises && data.exercises.length > 0) {
            fc(doc, COLORS.slate600);
            doc.fontSize(8).font('Helvetica-Bold').text('DAILY PRACTICES:', PAGE_MARGIN + 8, doc.y);
            doc.y += 4;
            for (const ex of data.exercises.filter(Boolean)) {
                ensureSpace(doc, 16);
                fc(doc, color);
                doc.circle(PAGE_MARGIN + 14, doc.y + 5, 3).fill();
                fc(doc, COLORS.slate700);
                doc.fontSize(9).font('Helvetica').text(ex, PAGE_MARGIN + 22, doc.y, { width: CONTENT_WIDTH - 30, lineGap: 2 });
                doc.y += 2;
            }
        }

        // Life area applications
        const lifeAreas = ['\u2764\uFE0F Relationships', '\u{1F91D} Friendships', '\u{1F476} Parenting', '\u{1F4BC} Work', '\u{1F331} Growth'];
        doc.y += 4;
        fc(doc, COLORS.slate500);
        doc.fontSize(8).font('Helvetica-Bold').text(
            `Apply in: ${lifeAreas.join('  \u2022  ')}`,
            PAGE_MARGIN + 8, doc.y, { width: CONTENT_WIDTH - 16 }
        );
        doc.y += 12;

        // Affirmation
        if (data.affirmation) {
            ensureSpace(doc, 24);
            const affY = doc.y;
            fc(doc, bg);
            sc(doc, color);
            doc.roundedRect(PAGE_MARGIN, affY, CONTENT_WIDTH, 22, 4).fillAndStroke();
            fc(doc, color);
            doc.fontSize(9).font('Helvetica-Oblique').text(
                `\u201C${data.affirmation}\u201D`,
                PAGE_MARGIN + 14, affY + 6, { width: CONTENT_WIDTH - 28 }
            );
            fc(doc, COLORS.slate800);
            sc(doc, COLORS.slate200);
            doc.y = affY + 30;
        }

        // Progress tracking checkboxes
        ensureSpace(doc, 24);
        doc.y += 4;
        fc(doc, COLORS.slate400);
        const checkLabels = ['Day 1-2', 'Day 3-4', 'Day 5-6', 'Day 7'];
        let cx = PAGE_MARGIN + 8;
        for (const cl of checkLabels) {
            sc(doc, COLORS.slate400);
            doc.rect(cx, doc.y, 10, 10).stroke();
            fc(doc, COLORS.slate500);
            doc.fontSize(7).font('Helvetica').text(cl, cx + 13, doc.y + 1, { width: 40 });
            cx += 70;
        }
        doc.y += 18;

        doc.y += 8;
    }
}

/** PAGE 17 — Resources / Navigation Tools */
function buildResourcesPage(doc, report) {
    newPage(doc);
    sectionBar(doc, '\u{1F4DA}  Your Navigation Tools \u2014 Recommended Resources', COLORS.indigoDark);

    calloutBox(doc,
        'Your personalised resource library is curated to support the dimensions of your ' +
        'resilience profile that hold the most growth potential. Think of these as tools ' +
        'for your expedition \u2014 each one chosen to help you navigate new territory.',
        COLORS.bgIndigo, COLORS.indigoLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    const res = report.recommendedResources || {};

    const sections = [
        { title: '\u{1F4DA}  Reading for Your Journey', items: res.readingMaterials, color: COLORS.indigo, bg: COLORS.bgIndigo },
        { title: '\u{1F3EB}  Workshops & Courses', items: res.workshops, color: COLORS.purple, bg: COLORS.bgPurple },
        { title: '\u25B6\uFE0F  Videos & Talks', items: res.videos, color: COLORS.emerald, bg: COLORS.bgEmerald },
        { title: '\u2705  Practices & Exercises', items: res.practices, color: COLORS.amber, bg: COLORS.bgAmber },
    ];

    for (const { title, items, color, bg } of sections) {
        if (!items || items.length === 0) continue;
        ensureSpace(doc, 40);
        sectionBar(doc, title, color);
        bulletList(doc, items, 0, color);
        doc.y += 4;
    }

    // Meditation + community resources
    ensureSpace(doc, 60);
    sectionBar(doc, '\u{1F9D8}  Mindfulness & Grounding Practices', COLORS.slate700);
    bulletList(doc, [
        'Daily 10-minute meditation (Insight Timer, Headspace, or Calm app)',
        'Breathwork for stress regulation: 4-7-8 technique, box breathing, or physiological sigh',
        'Morning journaling: 5 minutes of free-writing to set your daily compass',
        'Evening reflection: What grew in me today? What needs tending tomorrow?',
        'Weekly nature immersion: 30-minute walk without devices, observing your terrain',
    ], 0, COLORS.slate600);

    // Premium offer callout
    ensureSpace(doc, 50);
    const premY = doc.y;
    fc(doc, COLORS.indigoDark);
    doc.roundedRect(PAGE_MARGIN, premY, CONTENT_WIDTH, 48, 8).fill();
    fc(doc, COLORS.amberLight);
    doc.fontSize(11).font('Helvetica-Bold').text(
        '\u2728  Deepen Your Journey with Premium Features',
        PAGE_MARGIN + 14, premY + 8, { width: CONTENT_WIDTH - 28 }
    );
    fc(doc, 'rgba(255,255,255,0.85)');
    doc.fontSize(9).font('Helvetica').text(
        'Unlock 1:1 coaching, monthly reassessments, and your personal Atlas growth community.',
        PAGE_MARGIN + 14, premY + 26, { width: CONTENT_WIDTH - 28 }
    );
    fc(doc, COLORS.slate800);
    doc.y = premY + 56;
}

/** PAGE 18 — Growth Journey Ahead */
function buildGrowthJourneyPage(doc, report, overall) {
    newPage(doc);
    sectionBar(doc, '\u{1F30D}  Next Steps on Your Map \u2014 Your Growth Journey Ahead', COLORS.indigoDark);

    calloutBox(doc,
        'You have arrived at the end of this report \u2014 and the beginning of your next ' +
        'expedition. Resilience is not a fixed destination on the map; it is the quality ' +
        'of your navigation. Every day you practise, you refine your compass. Every ' +
        'challenge you face with awareness, you expand your territory.',
        COLORS.bgPurple, COLORS.purpleLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH, { fontSize: 10 }
    );

    sectionBar(doc, '\u{1F4C5}  Your 30-Day Retake Plan', COLORS.emerald);
    calloutBox(doc,
        'Growth shows up in your scores. In 30 days, retake The Resilience Atlas\u2122 ' +
        'assessment and compare your new map with this one. Use your dimension deep-dives ' +
        'and action plan as your guide between now and then. Many people see meaningful ' +
        'movement in even a single focused month.',
        COLORS.bgEmerald, COLORS.emeraldLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    ensureSpace(doc, 60);
    sectionBar(doc, '\u{1F91D}  Share Your Map', COLORS.purple);
    calloutBox(doc,
        'Resilience grows in community. Consider sharing your archetype and top dimensions ' +
        'with people in your life \u2014 a partner, a close friend, a team colleague. Shared ' +
        'self-knowledge creates deeper connection and more intentional support. You might ' +
        'even invite someone you care about to take the assessment alongside you.',
        COLORS.bgPurple, COLORS.purpleLight, PAGE_MARGIN, doc.y, CONTENT_WIDTH
    );

    ensureSpace(doc, 60);
    sectionBar(doc, '\u{1F5FA}  Long-Term Navigation', COLORS.indigo);
    bulletList(doc, [
        'Return to your dimension deep-dives monthly \u2014 your relationship with each territory evolves',
        'Choose one dimension per quarter to focus your growth energy',
        'Build a personal "resilience team" \u2014 people who complement your profile',
        'Use adversity as a navigation event: what does this challenge reveal about my map?',
        'Celebrate milestones \u2014 resilience built is resilience earned',
    ], 0, COLORS.indigo);

    // Closing affirmation
    ensureSpace(doc, 56);
    const closeY = doc.y;
    fc(doc, COLORS.indigoDark);
    doc.roundedRect(PAGE_MARGIN, closeY, CONTENT_WIDTH, 56, 10).fill();
    // Compass rose decoration
    compassRose(doc, PAGE_MARGIN + 30, closeY + 28, 16, 'rgba(255,255,255,0.3)');
    fc(doc, COLORS.amberLight);
    doc.fontSize(13).font('Helvetica-Bold').text(
        'Begin Your Journey.',
        PAGE_MARGIN + 55, closeY + 8, { width: CONTENT_WIDTH - 70 }
    );
    fc(doc, COLORS.white);
    doc.fontSize(10).font('Helvetica').text(
        'Your resilience is real. Your map is unique. Your compass is already inside you.',
        PAGE_MARGIN + 55, closeY + 28, { width: CONTENT_WIDTH - 70 }
    );
    fc(doc, COLORS.slate800);
    doc.y = closeY + 64;

    // Contact/support
    doc.y += 4;
    fc(doc, COLORS.slate500);
    doc.fontSize(8).font('Helvetica').text(
        'Questions? Visit TheResilienceAtlas.com or contact support@theresilienceatlas.com',
        PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, align: 'center' }
    );
}

/** Footers on every page. */
function addFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 28;
        fc(doc, COLORS.slate200);
        sc(doc, COLORS.slate200);
        doc.moveTo(PAGE_MARGIN, footerY - 4).lineTo(PAGE_WIDTH - PAGE_MARGIN, footerY - 4).lineWidth(0.5).stroke();
        doc.lineWidth(1);
        fc(doc, COLORS.slate400);
        doc.fontSize(7.5).font('Helvetica').text(
            `The Resilience Atlas\u2122  \u2014  Your Personal Navigation Map  \u2022  For educational and self-reflection purposes only  \u2014  Page ${i + 1} of ${range.count}`,
            PAGE_MARGIN, footerY,
            { width: CONTENT_WIDTH, align: 'center' }
        );
    }
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Build a comprehensive Atlas-branded PDF report using PDFKit.
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
                    Subject: 'Comprehensive Personal Resilience Assessment Report',
                    Keywords: 'resilience, atlas, navigation, growth, wellbeing',
                },
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // ── Build all pages ──────────────────────────────────────────────
            // Page 1: Premium Cover
            buildCoverPage(doc, report, overallNum);

            // Page 2: Your Resilience Journey
            buildJourneyPage(doc, report, overallNum);

            // Page 3: Your Resilience Map
            buildMapPage(doc, report);

            // Page 4: Your Resilience Archetype
            buildArchetypePage(doc, report);

            // Pages 5–10: Dimension Deep-Dives (one per dimension)
            const dims = Object.entries(report.dimensionAnalysis || {});
            dims.forEach(([dimName, analysis], i) => {
                buildDimensionDeepDive(doc, dimName, analysis, i);
            });

            // Page 11: Strength Integration & Synergies
            buildStrengthIntegrationPage(doc, report);

            // Page 12: Stress Response / Internal Compass
            buildStressResponsePage(doc, report);

            // Page 13: Relational Dynamics
            buildRelationalDynamicsPage(doc, report);

            // Page 14: Resilience Across Life Domains
            buildLifeDomainsPage(doc, report);

            // Page 15–16: 30-Day Navigation Plan
            build30DayPlanPage(doc, report);

            // Page 17: Resources
            buildResourcesPage(doc, report);

            // Page 18: Growth Journey Ahead
            buildGrowthJourneyPage(doc, report, overallNum);

            // ── Footers on all pages ─────────────────────────────────────────
            addFooters(doc);

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { buildPdfWithPDFKit };
