'use strict';

/**
 * philosophical-content-engine.js
 *
 * Selects the daily insight from the philosophical quote library and formats
 * it for multiple publishing platforms.
 *
 * Design principles
 * -----------------
 * • No external runtime dependencies beyond the quote data module.
 * • Stateless: the "current day" is supplied by the caller so the engine is
 *   easily testable and decoupled from the system clock.
 * • Safe / non-clinical language throughout.
 * • The 365-day cycle wraps automatically — no repetition within a cycle.
 */

const { PHILOSOPHICAL_QUOTES } = require('../data/philosophical-quotes');

const CALL_TO_ACTION = 'Discover your resilience profile with The Resilience Atlas.';
const TOTAL_QUOTES   = PHILOSOPHICAL_QUOTES.length;

// ── Core selector ─────────────────────────────────────────────────────────────

/**
 * Return the quote entry for the given 1-based day number (1–365).
 * After the full library has cycled the selection wraps back to the first entry.
 *
 * @param {number} [dayNumber] - 1-based day within the year (defaults to today)
 * @returns {Object} Raw quote entry from the library
 */
function getQuoteForDay(dayNumber) {
  const day = (dayNumber != null) ? dayNumber : _dayOfYear();
  const index = (day - 1) % TOTAL_QUOTES;
  return PHILOSOPHICAL_QUOTES[index];
}

/**
 * Return the quote for a specific resilience dimension for the given day.
 * Cycles through the dimension-filtered subset independently.
 *
 * @param {string} dimension - Resilience dimension name
 * @param {number} [dayNumber] - 1-based day within the year (defaults to today)
 * @returns {Object|null} Quote entry or null if dimension not found
 */
function getQuoteForDimension(dimension, dayNumber) {
  const pool = PHILOSOPHICAL_QUOTES.filter(q => q.resilienceDimension === dimension);
  if (!pool.length) return null;

  const day   = (dayNumber != null) ? dayNumber : _dayOfYear();
  const index = (day - 1) % pool.length;
  return pool[index];
}

// ── Platform formatters ───────────────────────────────────────────────────────

/**
 * Build the canonical insight object used as the source for all platform formats.
 *
 * @param {Object} entry - Quote library entry
 * @returns {Object} Structured daily insight
 */
function buildInsight(entry) {
  return {
    dimension:          entry.resilienceDimension,
    subtitle:           entry.subtitle,
    quoteText:          entry.quoteText,
    quoteAuthor:        entry.quoteAuthor,
    microPractice:      entry.microPractice,
    reflectionQuestion: entry.reflectionQuestion,
    callToAction:       CALL_TO_ACTION,
    quoteId:            entry.id,
  };
}

/**
 * Format the insight as a plain-text email body.
 *
 * @param {Object} insight - Result of buildInsight()
 * @returns {Object} { subject, html, text }
 */
function formatEmail(insight) {
  const subject = `Your Daily Resilience Insight — ${insight.dimension}`;

  const text = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Resilience Atlas — Daily Insight',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `${insight.dimension}`,
    `${insight.subtitle}`,
    '',
    `"${insight.quoteText}"`,
    `— ${insight.quoteAuthor}`,
    '',
    'Practice (1–5 minutes)',
    insight.microPractice,
    '',
    'Reflection',
    insight.reflectionQuestion,
    '',
    '─────────────────────────────────────────',
    insight.callToAction,
    '─────────────────────────────────────────',
  ].join('\n');

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
  <div style="background: linear-gradient(135deg, #2c5f8a, #1a3a5c); padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Resilience Atlas</h1>
    <p style="color: #b3d4f0; margin: 4px 0 0; font-size: 14px;">Daily Insight</p>
  </div>

  <div style="background: #f7f9fc; padding: 32px; border-radius: 0 0 8px 8px;">
    <p style="color: #2c5f8a; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">
      ${insight.dimension}
    </p>
    <p style="color: #64748b; font-size: 13px; margin: 0 0 24px;">${insight.subtitle}</p>

    <blockquote style="border-left: 4px solid #2c5f8a; margin: 0 0 8px; padding: 12px 20px; background: #eef4fb; border-radius: 0 4px 4px 0;">
      <p style="font-size: 18px; line-height: 1.6; font-style: italic; color: #1a1a2e; margin: 0;">
        "${insight.quoteText}"
      </p>
    </blockquote>
    <p style="color: #64748b; font-size: 14px; margin: 0 0 28px; text-align: right;">— ${insight.quoteAuthor}</p>

    <h3 style="color: #2c5f8a; font-size: 15px; margin: 0 0 8px;">Practice <span style="color: #64748b; font-weight: normal; font-size: 12px;">(1–5 minutes)</span></h3>
    <p style="color: #1a1a2e; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${insight.microPractice}</p>

    <h3 style="color: #2c5f8a; font-size: 15px; margin: 0 0 8px;">Reflection</h3>
    <p style="color: #1a1a2e; font-size: 15px; line-height: 1.6; font-style: italic; margin: 0 0 32px;">${insight.reflectionQuestion}</p>

    <div style="background: #2c5f8a; color: #ffffff; padding: 16px 20px; border-radius: 6px; text-align: center;">
      <p style="margin: 0; font-size: 14px;">${insight.callToAction}</p>
    </div>
  </div>
</div>
`.trim();

  return { subject, html, text };
}

/**
 * Format the insight as an X / Twitter post (≤280 characters).
 *
 * @param {Object} insight - Result of buildInsight()
 * @returns {string} Post text
 */
function formatXPost(insight) {
  const quote   = `"${insight.quoteText}" — ${insight.quoteAuthor}`;
  const hashtag = `#ResilienceAtlas #${insight.dimension.replace(/-/g, '')}`;

  // Truncate the quote if needed so the full post fits within 280 characters
  const maxQuoteLen = 280 - hashtag.length - 2; // 2 for newlines
  const truncated   = quote.length > maxQuoteLen
    ? quote.slice(0, maxQuoteLen - 1) + '…'
    : quote;

  return `${truncated}\n${hashtag}`;
}

/**
 * Format the insight as a LinkedIn post.
 *
 * @param {Object} insight - Result of buildInsight()
 * @returns {string} Post text
 */
function formatLinkedInPost(insight) {
  return [
    `💡 ${insight.dimension} | ${insight.subtitle}`,
    '',
    `"${insight.quoteText}"`,
    `— ${insight.quoteAuthor}`,
    '',
    `📌 Today's Practice (1–5 min):`,
    insight.microPractice,
    '',
    `🪞 Reflection:`,
    insight.reflectionQuestion,
    '',
    `#ResilienceAtlas #Resilience #${insight.dimension.replace(/-/g, '')} #PersonalGrowth`,
    '',
    insight.callToAction,
  ].join('\n');
}

/**
 * Generate a prompt that can be sent to an image-generation tool to produce
 * a shareable graphic for the insight.
 *
 * @param {Object} insight - Result of buildInsight()
 * @returns {string} Graphic generation prompt
 */
function formatGraphicPrompt(insight) {
  return (
    `Create a calm, uplifting, minimalist social media graphic (1080×1080 px). ` +
    `Background: soft gradient in muted teal and deep navy. ` +
    `Top label: "${insight.dimension} — ${insight.subtitle}" in small uppercase sans-serif. ` +
    `Centre: the quote "${insight.quoteText}" in elegant serif font. ` +
    `Below: "— ${insight.quoteAuthor}" in italics. ` +
    `Bottom: "Resilience Atlas" logo wordmark. ` +
    `Mood: reflective, hopeful, professional. No stock-photo people.`
  );
}

/**
 * Generate a short video script outline for the insight.
 *
 * @param {Object} insight - Result of buildInsight()
 * @returns {string} Script outline
 */
function formatVideoScript(insight) {
  return [
    `VIDEO SCRIPT — ${insight.dimension}`,
    `Duration: ~60 seconds`,
    '',
    `[OPEN — 0:00–0:05]`,
    `Gentle ambient music. Slow fade in on a calming nature scene or abstract visual.`,
    `Voice-over: "A daily insight from The Resilience Atlas."`,
    '',
    `[QUOTE — 0:05–0:25]`,
    `Text animates in on screen.`,
    `Voice-over: "${insight.quoteText}"`,
    `Text: "— ${insight.quoteAuthor}"`,
    '',
    `[DIMENSION — 0:25–0:35]`,
    `Graphic: "${insight.dimension} | ${insight.subtitle}"`,
    `Voice-over: "Today we explore ${insight.dimension} — ${insight.subtitle}."`,
    '',
    `[PRACTICE — 0:35–0:50]`,
    `Voice-over: "Today's practice: ${insight.microPractice}"`,
    '',
    `[REFLECTION — 0:50–0:58]`,
    `Voice-over: "${insight.reflectionQuestion}"`,
    '',
    `[CLOSE — 0:58–1:00]`,
    `Logo fade in.`,
    `Voice-over: "${insight.callToAction}"`,
  ].join('\n');
}

/**
 * Generate the full multi-platform content bundle for a single insight.
 *
 * @param {Object} entry  - Raw quote entry from the library
 * @returns {Object} Content bundle with keys: insight, email, xPost, linkedIn,
 *                   graphicPrompt, videoScript
 */
function generateContentBundle(entry) {
  const insight = buildInsight(entry);
  return {
    insight,
    email:         formatEmail(insight),
    xPost:         formatXPost(insight),
    linkedIn:      formatLinkedInPost(insight),
    graphicPrompt: formatGraphicPrompt(insight),
    videoScript:   formatVideoScript(insight),
  };
}

/**
 * Convenience: return the complete content bundle for the given day number.
 *
 * @param {number} [dayNumber] - 1-based day within the year (defaults to today)
 * @returns {Object} Full content bundle
 */
function getDailyBundle(dayNumber) {
  const entry = getQuoteForDay(dayNumber);
  return generateContentBundle(entry);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Return the 1-based day-of-year for today's UTC date.
 * @returns {number}
 */
function _dayOfYear() {
  const now   = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return Math.floor((now - start) / 86_400_000) + 1;
}

module.exports = {
  TOTAL_QUOTES,
  getQuoteForDay,
  getQuoteForDimension,
  buildInsight,
  formatEmail,
  formatXPost,
  formatLinkedInPost,
  formatGraphicPrompt,
  formatVideoScript,
  generateContentBundle,
  getDailyBundle,
};
