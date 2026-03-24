'use strict';

/**
 * image-generator.js
 *
 * Generates professional, shareable insight card graphics for the Resilience
 * Atlas daily insight system.
 *
 * Output is SVG markup (UTF-8 Buffer) which can be served directly or converted
 * to PNG by the client.  Three canonical formats are supported:
 *
 *   • square  — 1080 × 1080 px  (Instagram feed / social sharing)
 *   • story   — 1080 × 1920 px  (Instagram Stories / vertical mobile)
 *   • feed    — 1200 ×  630 px  (Facebook / LinkedIn / email headers)
 *
 * Implementation approach
 * -----------------------
 * SVG is used (instead of Canvas / Puppeteer) because:
 *   - It requires no native binary dependencies.
 *   - It matches the pattern already established in shareCardGenerator.js.
 *   - It is natively supported by modern browsers and social platforms.
 *   - It can be converted to PNG client-side if needed.
 */

const { FORMATS, LAYOUT } = require('../config/design-system');
const {
  renderBackground,
  renderCompassWatermark,
  renderDimensionBadge,
  renderHeadline,
  renderQuote,
  renderPractice,
  renderFooter,
} = require('./canvas-layout');

// ── Headline selection ─────────────────────────────────────────────────────────

/**
 * Map each resilience dimension to a relatable, emotion-resonant headline.
 */
const DIMENSION_HEADLINES = {
  'Cognitive-Narrative':   'When you need a fresh perspective',
  'Agentic-Generative':    'When you need to move forward',
  'Relational-Connective':            'When connection matters most',
  'Emotional-Adaptive':    'When emotions feel complex',
  'Spiritual-Reflective': 'When searching for meaning',
  'Somatic-Regulative':    'When stress feels overwhelming',
};

const DEFAULT_HEADLINE = 'A daily insight for your resilience journey';

/**
 * Return a relatable headline for the given dimension.
 *
 * @param {string} dimension - Resilience dimension name
 * @returns {string}
 */
function getHeadlineForDimension(dimension) {
  return DIMENSION_HEADLINES[dimension] || DEFAULT_HEADLINE;
}

// ── Core SVG builder ──────────────────────────────────────────────────────────

/**
 * Build a complete SVG insight card for the given insight data and format.
 *
 * @param {Object} insight - Structured insight object (from buildInsight)
 * @param {Object} format  - Format descriptor from FORMATS
 * @returns {Buffer} SVG content as a UTF-8 Buffer
 */
function buildSvgCard(insight, format) {
  const { width: W, height: H } = format;

  // Scale all layout constants proportionally to the baseline 1080×1080 square.
  const scale    = W / 1080;
  const gradId   = `bgGrad_${format.key}`;

  // Compass watermark centerd in the upper area
  const compassCX = W / 2;
  const compassCY = Math.round(LAYOUT.compassY * scale);
  const compassR  = Math.round(LAYOUT.compassR  * scale);

  const headline = getHeadlineForDimension(insight.dimension);

  const layers = [
    renderBackground(W, H, gradId),
    renderCompassWatermark(compassCX, compassCY, compassR),
    renderDimensionBadge(insight.dimension, insight.subtitle, W, scale),
    renderHeadline(headline, W, scale),
    renderQuote(insight.quoteText, insight.quoteAuthor, W, scale),
    renderPractice(insight.microPractice, W, scale),
    renderFooter(W, H, scale),
  ];

  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"`,
    `     role="img" aria-label="The Resilience Atlas™ insight card — ${_escapeSvgAttr(insight.dimension)}">`,
    `  <title>The Resilience Atlas™ — ${_escapeSvgAttr(insight.dimension)}</title>`,
    `  <desc>${_escapeSvgAttr(insight.quoteText)} — ${_escapeSvgAttr(insight.quoteAuthor)}</desc>`,
    ...layers,
    '</svg>',
  ].join('\n');

  return Buffer.from(svg, 'utf8');
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Generate an insight card for a specific format.
 *
 * @param {Object} insight    - Structured insight (from buildInsight / generateContentBundle)
 * @param {string} formatKey  - One of 'square', 'story', 'feed'
 * @returns {{ buffer: Buffer, format: Object, mimeType: string }}
 */
function generateGraphic(insight, formatKey) {
  const format = FORMATS[formatKey];
  if (!format) {
    throw new Error(
      `Unknown format "${formatKey}". Valid options: ${Object.keys(FORMATS).join(', ')}.`
    );
  }

  const buffer = buildSvgCard(insight, format);

  return {
    buffer,
    format,
    mimeType:  'image/svg+xml',
    extension: 'svg',
  };
}

/**
 * Generate insight cards for all three canonical formats.
 *
 * @param {Object} insight - Structured insight object
 * @returns {Object} Map of formatKey → { buffer, format, mimeType, extension }
 */
function generateAllGraphics(insight) {
  const result = {};
  for (const key of Object.keys(FORMATS)) {
    result[key] = generateGraphic(insight, key);
  }
  return result;
}

/**
 * Return metadata about all available graphics formats without generating the
 * actual image buffers.  Useful for the "list available formats" API endpoint.
 *
 * @param {Object} insight - Structured insight object
 * @returns {Object[]} Array of format descriptors with insight details
 */
function getGraphicsMetadata(insight) {
  return Object.values(FORMATS).map((fmt) => ({
    key:      fmt.key,
    label:    fmt.label,
    width:    fmt.width,
    height:   fmt.height,
    uses:     fmt.uses,
    mimeType: 'image/svg+xml',
    headline: getHeadlineForDimension(insight.dimension),
  }));
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _escapeSvgAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  getHeadlineForDimension,
  generateGraphic,
  generateAllGraphics,
  getGraphicsMetadata,
  DIMENSION_HEADLINES,
};
