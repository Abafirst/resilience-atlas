'use strict';

/**
 * canvas-layout.js
 *
 * SVG layout helpers for the Resilience Atlas insight card generator.
 *
 * Implements the three-layer card design:
 *  1. Headline Layer  — top, emotion-resonant lead text
 *  2. Quote Layer     — center, primary wisdom quote + author
 *  3. Practice Layer  — bottom, micro-practice summary + duration
 *
 * All output is pure SVG markup (strings) that the image-generator.js
 * assembles into full SVG documents.  No binary dependencies are needed.
 */

const { COLORS, TYPOGRAPHY, BRANDING, LAYOUT } = require('../config/design-system');

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Approximate ratio of a character's rendered width to the current font size
 * for proportional sans-serif and serif fonts at typical display sizes.
 * A real canvas context would give exact glyph metrics; this constant provides
 * a reasonable approximation without native dependencies.
 */
const CHAR_WIDTH_RATIO = 0.52;

// ── Text wrapping ─────────────────────────────────────────────────────────────

/**
 * Naïvely split a string into lines that fit within `maxChars`.
 * Real character-width metrics are not available in pure JS without a canvas
 * context; this approximation works well for proportional fonts at typical sizes.
 *
 * @param {string} text
 * @param {number} maxChars - approximate characters per line
 * @returns {string[]}
 */
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ── Gradient background ────────────────────────────────────────────────────────

/**
 * Render a soft neutral gradient background rectangle.
 *
 * @param {number} W - canvas width
 * @param {number} H - canvas height
 * @param {string} gradId - unique gradient id
 * @returns {string} SVG fragment
 */
function renderBackground(W, H, gradId) {
  return `
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${COLORS.bgLight}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${COLORS.bgDark}"  stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#${gradId})"/>`.trim();
}

// ── Compass watermark ─────────────────────────────────────────────────────────

/**
 * Render a subtle compass-rose watermark.
 *
 * @param {number} cx - center X
 * @param {number} cy - center Y
 * @param {number} r  - radius
 * @returns {string} SVG fragment
 */
function renderCompassWatermark(cx, cy, r) {
  const op = LAYOUT.compassOpacity;
  return `
  <g opacity="${op}" aria-hidden="true">
    <!-- outer ring -->
    <circle cx="${cx}" cy="${cy}" r="${r}"
            fill="none" stroke="${COLORS.primary}" stroke-width="${r * 0.035}"/>
    <!-- inner ring -->
    <circle cx="${cx}" cy="${cy}" r="${r * 0.18}"
            fill="none" stroke="${COLORS.primary}" stroke-width="${r * 0.025}"/>
    <!-- center dot -->
    <circle cx="${cx}" cy="${cy}" r="${r * 0.05}" fill="${COLORS.primary}"/>
    <!-- N needle -->
    <polygon points="${cx},${cy - r * 0.9} ${cx - r * 0.09},${cy} ${cx},${cy - r * 0.15} ${cx + r * 0.09},${cy}"
             fill="${COLORS.primary}"/>
    <!-- S needle -->
    <polygon points="${cx},${cy + r * 0.9} ${cx - r * 0.09},${cy} ${cx},${cy + r * 0.15} ${cx + r * 0.09},${cy}"
             fill="${COLORS.secondary}" opacity="0.7"/>
    <!-- cardinal ticks -->
    <line x1="${cx}"       y1="${cy - r * 0.92}" x2="${cx}"       y2="${cy - r * 0.75}" stroke="${COLORS.primary}" stroke-width="${r * 0.04}" stroke-linecap="round"/>
    <line x1="${cx}"       y1="${cy + r * 0.75}" x2="${cx}"       y2="${cy + r * 0.92}" stroke="${COLORS.primary}" stroke-width="${r * 0.025}" stroke-linecap="round"/>
    <line x1="${cx - r * 0.92}" y1="${cy}"       x2="${cx - r * 0.75}" y2="${cy}"       stroke="${COLORS.primary}" stroke-width="${r * 0.025}" stroke-linecap="round"/>
    <line x1="${cx + r * 0.75}" y1="${cy}"       x2="${cx + r * 0.92}" y2="${cy}"       stroke="${COLORS.primary}" stroke-width="${r * 0.025}" stroke-linecap="round"/>
  </g>`.trim();
}

// ── Headline layer ─────────────────────────────────────────────────────────────

/**
 * Render the headline (top) layer.
 *
 * @param {string} headlineText - relatable, emotion-resonant headline
 * @param {number} W            - canvas width
 * @param {number} scale        - scale factor relative to 1080px baseline
 * @returns {string} SVG fragment
 */
function renderHeadline(headlineText, W, scale) {
  const fontSize   = Math.round(TYPOGRAPHY.headline.size * scale);
  const y          = Math.round(LAYOUT.headlineTop * scale + fontSize);
  const pad        = Math.round(LAYOUT.padding * scale);

  return `
  <text
    x="${pad}" y="${y}"
    font-family="${TYPOGRAPHY.headline.family}"
    font-size="${fontSize}"
    font-weight="${TYPOGRAPHY.headline.weight}"
    fill="${COLORS.neutral100}"
    dominant-baseline="auto"
  >${_escapeSvg(headlineText)}</text>`.trim();
}

// ── Quote layer ────────────────────────────────────────────────────────────────

/**
 * Render the quote + author attribution (center layer).
 *
 * @param {string} quoteText   - wisdom quote
 * @param {string} quoteAuthor - attribution string
 * @param {number} W           - canvas width
 * @param {number} scale       - scale factor
 * @returns {string} SVG fragment
 */
function renderQuote(quoteText, quoteAuthor, W, scale) {
  const pad        = Math.round(LAYOUT.padding * scale);
  const maxWidth   = W - pad * 2;
  const fontSize   = Math.round(TYPOGRAPHY.quote.size * scale);
  const lineHeight = Math.round(fontSize * 1.45);
  const authorSize = Math.round(TYPOGRAPHY.author.size * scale);

  // Approximate chars per line based on available width and font size
  const charsPerLine = Math.floor(maxWidth / (fontSize * CHAR_WIDTH_RATIO));
  const lines = wrapText(`"${quoteText}"`, charsPerLine);

  const quoteTop   = Math.round(LAYOUT.quoteTop * scale);
  let   y          = quoteTop + fontSize;

  const lineElems = lines.map((line) => {
    const elem = `
    <tspan x="${pad}" y="${y}">${_escapeSvg(line)}</tspan>`;
    y += lineHeight;
    return elem;
  });

  const authorY = y + Math.round(authorSize * 1.2);

  return `
  <text
    font-family="${TYPOGRAPHY.quote.family}"
    font-size="${fontSize}"
    font-weight="${TYPOGRAPHY.quote.weight}"
    font-style="italic"
    fill="${COLORS.neutral100}"
  >${lineElems.join('')}
  </text>
  <text
    x="${pad}" y="${authorY}"
    font-family="${TYPOGRAPHY.author.family}"
    font-size="${authorSize}"
    font-weight="${TYPOGRAPHY.author.weight}"
    fill="${COLORS.neutral300}"
  >— ${_escapeSvg(quoteAuthor)}</text>`.trim();
}

// ── Practice layer ─────────────────────────────────────────────────────────────

/**
 * Render the micro-practice (bottom) layer inside a semi-transparent box.
 *
 * @param {string} practiceText - short micro-practice description
 * @param {number} W            - canvas width
 * @param {number} scale        - scale factor
 * @returns {string} SVG fragment
 */
function renderPractice(practiceText, W, scale) {
  const pad         = Math.round(LAYOUT.padding * scale);
  const boxX        = pad;
  const boxY        = Math.round(LAYOUT.practiceTop * scale);
  const boxW        = W - pad * 2;
  const boxH        = Math.round((LAYOUT.practiceBottom - LAYOUT.practiceTop) * scale);
  const boxR        = Math.round(12 * scale);

  const fontSize    = Math.round(TYPOGRAPHY.practice.size * scale);
  const lineHeight  = Math.round(fontSize * 1.4);
  const labelSize   = Math.round(TYPOGRAPHY.cta.size * scale * 1.1);

  const innerPad    = Math.round(20 * scale);
  const textX       = boxX + innerPad;
  const labelY      = boxY + innerPad + labelSize;
  const textY       = labelY + Math.round(lineHeight * 0.8);

  const charsPerLine = Math.floor((boxW - innerPad * 2) / (fontSize * CHAR_WIDTH_RATIO));
  const lines = wrapText(practiceText, charsPerLine);

  const lineElems = lines.map((line, i) => {
    const y = textY + i * lineHeight;
    return `<tspan x="${textX}" y="${y}">${_escapeSvg(line)}</tspan>`;
  });

  return `
  <!-- Practice box -->
  <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${boxR}"
        fill="${COLORS.practiceBoxBg}"
        stroke="${COLORS.practiceBoxBorder}"
        stroke-width="1"/>
  <!-- Practice label -->
  <text
    x="${textX}" y="${labelY}"
    font-family="${TYPOGRAPHY.cta.family}"
    font-size="${labelSize}"
    font-weight="600"
    fill="${COLORS.secondary}"
    letter-spacing="1"
  >TODAY'S PRACTICE  ·  3–5 MIN</text>
  <!-- Practice text -->
  <text
    font-family="${TYPOGRAPHY.practice.family}"
    font-size="${fontSize}"
    font-weight="${TYPOGRAPHY.practice.weight}"
    fill="${COLORS.neutral200}"
  >${lineElems.join('')}
  </text>`.trim();
}

// ── Dimension badge ────────────────────────────────────────────────────────────

/**
 * Render a small dimension / subtitle badge above the headline.
 *
 * @param {string} dimension - resilience dimension name
 * @param {string} subtitle  - dimension subtitle
 * @param {number} W         - canvas width
 * @param {number} scale     - scale factor
 * @returns {string} SVG fragment
 */
function renderDimensionBadge(dimension, subtitle, W, scale) {
  const pad      = Math.round(LAYOUT.padding * scale);
  const badgeY   = Math.round(40 * scale);
  const fontSize = Math.round(TYPOGRAPHY.cta.size * scale * 1.15);

  return `
  <text
    x="${pad}" y="${badgeY}"
    font-family="${TYPOGRAPHY.cta.family}"
    font-size="${fontSize}"
    font-weight="${TYPOGRAPHY.cta.weight}"
    fill="${COLORS.secondary}"
    letter-spacing="1.5"
  >${_escapeSvg(dimension.toUpperCase())}  ·  ${_escapeSvg(subtitle.toUpperCase())}</text>`.trim();
}

// ── CTA / Footer ───────────────────────────────────────────────────────────────

/**
 * Render the call-to-action / branding footer.
 *
 * @param {number} W     - canvas width
 * @param {number} H     - canvas height
 * @param {number} scale - scale factor
 * @returns {string} SVG fragment
 */
function renderFooter(W, H, scale) {
  const pad        = Math.round(LAYOUT.padding * scale);
  const ctaSize    = Math.round(TYPOGRAPHY.cta.size * scale);
  const brandSize  = Math.round(TYPOGRAPHY.cta.size * scale * 1.1);
  const lineY      = Math.round(LAYOUT.footerTop * scale);
  const ctaY       = lineY + Math.round(22 * scale);
  const brandY     = H - Math.round(18 * scale);

  return `
  <!-- Divider line -->
  <line x1="${pad}" y1="${lineY}" x2="${W - pad}" y2="${lineY}"
        stroke="${COLORS.neutral400}" stroke-width="1" opacity="0.6"/>
  <!-- CTA text -->
  <text
    x="${W / 2}" y="${ctaY}"
    text-anchor="middle"
    font-family="${TYPOGRAPHY.cta.family}"
    font-size="${ctaSize}"
    font-weight="${TYPOGRAPHY.cta.weight}"
    fill="${COLORS.neutral300}"
  >${_escapeSvg(BRANDING.cta)}</text>
  <!-- Brand URL -->
  <text
    x="${W / 2}" y="${brandY}"
    text-anchor="middle"
    font-family="${TYPOGRAPHY.cta.family}"
    font-size="${brandSize}"
    font-weight="600"
    fill="${COLORS.primary}"
  >${_escapeSvg(BRANDING.url)}</text>`.trim();
}

// ── SVG escape ────────────────────────────────────────────────────────────────

/**
 * Escape special XML/SVG characters to prevent markup injection.
 *
 * @param {string} str
 * @returns {string}
 */
function _escapeSvg(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  wrapText,
  renderBackground,
  renderCompassWatermark,
  renderHeadline,
  renderQuote,
  renderPractice,
  renderDimensionBadge,
  renderFooter,
  _escapeSvg,
};
