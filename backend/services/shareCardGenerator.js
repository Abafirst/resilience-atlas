'use strict';

/**
 * Share card generator for The Resilience Atlas.
 *
 * Generates an SVG-based profile card (1200 × 630 px) optimized for social
 * media sharing (LinkedIn, X/Twitter, Facebook).
 *
 * SVG is used because it requires no native binary dependencies and is
 * natively supported by modern browsers and most social platforms. The output
 * can be embedded in img tags, shared via URL, or converted to PNG by the
 * client if needed.
 */

const COLORS = {
    background: '#0f2942',
    primary:    '#4a9eca',
    secondary:  '#7fba8f',
    accent:     '#f0c060',
    text:       '#ffffff',
    textMuted:  '#a8c4d8',
    grid:       '#1e4060',
};

const DIMENSIONS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];

// ── Mini compass SVG ──────────────────────────────────────────────────────────

const DIR_ANGLE = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

/**
 * Generate SVG markup for a mini compass graphic.
 *
 * @param {number} cx        - Centre X
 * @param {number} cy        - Centre Y
 * @param {number} r         - Radius
 * @param {string} direction - Compass bearing (N, NE, E, …)
 * @returns {string} SVG fragment
 */
function compassSvg(cx, cy, r, direction) {
    const bearing = DIR_ANGLE[direction] !== undefined ? DIR_ANGLE[direction] : 0;
    // Convert compass bearing to standard math angle (90 - bearing)
    const rad = ((90 - bearing) * Math.PI) / 180;
    const ax  = cx + r * 0.65 * Math.cos(rad);
    const ay  = cy - r * 0.65 * Math.sin(rad);

    return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLORS.primary}" stroke-width="2"/>
    <line x1="${cx}" y1="${cy - r * 0.85}" x2="${cx}" y2="${cy - r * 0.1}" stroke="${COLORS.textMuted}" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy + r * 0.1}"  x2="${cx}" y2="${cy + r * 0.85}" stroke="${COLORS.textMuted}" stroke-width="1.5" opacity="0.4"/>
    <line x1="${cx - r * 0.85}" y1="${cy}" x2="${cx - r * 0.1}" y2="${cy}" stroke="${COLORS.textMuted}" stroke-width="1.5" opacity="0.4"/>
    <line x1="${cx + r * 0.1}"  y1="${cy}" x2="${cx + r * 0.85}" y2="${cy}" stroke="${COLORS.textMuted}" stroke-width="1.5" opacity="0.4"/>
    <text x="${cx}"     y="${cy - r - 6}"  text-anchor="middle" font-size="11" fill="${COLORS.textMuted}">N</text>
    <text x="${cx + r + 6}" y="${cy + 4}"  text-anchor="start"  font-size="11" fill="${COLORS.textMuted}">E</text>
    <text x="${cx}"     y="${cy + r + 14}" text-anchor="middle" font-size="11" fill="${COLORS.textMuted}">S</text>
    <text x="${cx - r - 6}" y="${cy + 4}"  text-anchor="end"    font-size="11" fill="${COLORS.textMuted}">W</text>
    <polygon points="${ax - 5},${ay + 8} ${ax + 5},${ay + 8} ${ax},${ay - 8}"
             fill="${COLORS.accent}"
             transform="rotate(${bearing}, ${cx}, ${cy})"/>
    `;
}

// ── Mini radar chart SVG ──────────────────────────────────────────────────────

/**
 * Generate SVG markup for a mini radar chart.
 *
 * @param {number} cx     - Centre X
 * @param {number} cy     - Centre Y
 * @param {number} r      - Radius
 * @param {Object} scores - { emotional, mental, physical, social, spiritual, financial }
 * @returns {string} SVG fragment
 */
function radarSvg(cx, cy, r, scores) {
    const n = DIMENSIONS.length;

    const axisPoints = DIMENSIONS.map((_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
        };
    });

    const fillPoints = DIMENSIONS.map((dim, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const val   = Math.min(100, Math.max(0, scores[dim] || 0)) / 100;
        return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
    });

    const gridStr  = axisPoints.map((p) => `${p.x},${p.y}`).join(' ');
    const gridLines = DIMENSIONS.map((_, i) => {
        const p = axisPoints[i];
        return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${COLORS.grid}" stroke-width="1" opacity="0.6"/>`;
    }).join('');

    return `
    ${gridLines}
    <polygon points="${gridStr}" fill="none" stroke="${COLORS.grid}" stroke-width="1" opacity="0.6"/>
    <polygon points="${fillPoints.join(' ')}" fill="${COLORS.primary}" fill-opacity="0.35" stroke="${COLORS.primary}" stroke-width="2"/>
    `;
}

// ── Background grid (lat/long aesthetic) ─────────────────────────────────────

function backgroundGrid(W, H) {
    const hLines = Array.from({ length: 9 }, (_, i) => {
        const y = Math.round((H / 8) * i);
        return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${COLORS.grid}" stroke-width="0.5"/>`;
    });
    const vLines = Array.from({ length: 14 }, (_, i) => {
        const x = Math.round((W / 13) * i);
        return `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${COLORS.grid}" stroke-width="0.5"/>`;
    });
    return [...hLines, ...vLines].join('');
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a share card as an SVG Buffer.
 *
 * @param {Object} opts
 * @param {number} opts.overall      - Overall resilience score (0–100)
 * @param {string} opts.dominantType - Primary resilience type key
 * @param {Object} opts.scores       - Category scores { emotional, mental, … }
 * @param {string} [opts.direction]  - Compass bearing (e.g. 'NE'). Defaults to 'N'.
 * @returns {Buffer} SVG content as a UTF-8 Buffer
 */
function generateShareCard(opts) {
    const { overall = 0, dominantType = '', scores = {}, direction = 'N' } = opts;

    const W = 1200;
    const H = 630;

    const sorted = DIMENSIONS
        .map((d) => ({ name: d.charAt(0).toUpperCase() + d.slice(1), score: scores[d] || 0 }))
        .sort((a, b) => b.score - a.score);

    const primaryLabel  = sorted[0]?.name || (dominantType.charAt(0).toUpperCase() + dominantType.slice(1)) || '—';
    const solidLabel    = sorted[1]?.name || '—';
    const emergingLabel = sorted[sorted.length - 1]?.name || '—';

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   style="stop-color:${COLORS.background};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#0a1e33;stop-opacity:1"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <g opacity="0.4">${backgroundGrid(W, H)}</g>

  <!-- Header bar -->
  <rect x="0" y="0" width="${W}" height="88" fill="${COLORS.background}" opacity="0.6"/>
  <text x="60" y="58" font-family="Georgia, 'Times New Roman', serif" font-size="30"
        font-weight="bold" fill="${COLORS.primary}">&#9788; THE RESILIENCE ATLAS</text>
  <line x1="60" y1="82" x2="${W - 60}" y2="82" stroke="${COLORS.primary}" stroke-width="1" opacity="0.6"/>

  <!-- Overall score — large and prominent -->
  <text x="68" y="180" font-family="Georgia, serif" font-size="108" font-weight="bold"
        fill="${COLORS.accent}">${overall}</text>
  <text x="68" y="208" font-family="Arial, Helvetica, sans-serif" font-size="17"
        fill="${COLORS.textMuted}" letter-spacing="1">OVERALL RESILIENCE SCORE</text>

  <!-- Strength labels (left column) -->
  <text x="68" y="275" font-family="Arial, sans-serif" font-size="13"
        fill="${COLORS.textMuted}" letter-spacing="2">PRIMARY STRENGTH</text>
  <text x="68" y="312" font-family="Georgia, serif" font-size="38" font-weight="bold"
        fill="${COLORS.text}">${primaryLabel}</text>

  <text x="68" y="370" font-family="Arial, sans-serif" font-size="13"
        fill="${COLORS.textMuted}" letter-spacing="2">SOLID STRENGTH</text>
  <text x="68" y="404" font-family="Georgia, serif" font-size="28"
        fill="${COLORS.secondary}">${solidLabel}</text>

  <text x="68" y="458" font-family="Arial, sans-serif" font-size="13"
        fill="${COLORS.textMuted}" letter-spacing="2">EMERGING STRENGTH</text>
  <text x="68" y="492" font-family="Georgia, serif" font-size="28"
        fill="${COLORS.secondary}">${emergingLabel}</text>

  <!-- Radar chart (centre-right) -->
  <g>
    ${radarSvg(820, 310, 155, scores)}
  </g>

  <!-- Compass (bottom right) -->
  <g>
    ${compassSvg(1090, 440, 78, direction)}
  </g>

  <!-- Divider -->
  <line x1="60" y1="542" x2="${W - 60}" y2="542" stroke="${COLORS.primary}" stroke-width="1" opacity="0.35"/>

  <!-- Call to action -->
  <text x="${W / 2}" y="578" font-family="Arial, sans-serif" font-size="18"
        fill="${COLORS.textMuted}" text-anchor="middle">
    Discover your resilience profile with The Resilience Atlas
  </text>
  <text x="${W / 2}" y="612" font-family="Arial, sans-serif" font-size="17" font-weight="bold"
        fill="${COLORS.primary}" text-anchor="middle">resilienceatlas.com</text>
</svg>`;

    return Buffer.from(svg, 'utf8');
}

module.exports = { generateShareCard };
