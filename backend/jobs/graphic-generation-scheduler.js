'use strict';

/**
 * graphic-generation-scheduler.js
 *
 * Scheduled job that generates and distributes the daily insight graphics
 * package.  Designed to run at 06:00 UTC every day.
 *
 * Usage
 * -----
 * Run manually:
 *   node backend/jobs/graphic-generation-scheduler.js
 *
 * Schedule via system cron (add to crontab -e):
 *   0 6 * * * node /path/to/backend/jobs/graphic-generation-scheduler.js
 *
 * Or via a process manager like PM2:
 *   pm2 start backend/jobs/graphic-generation-scheduler.js --cron "0 6 * * *"
 *
 * The job is idempotent within a calendar day — re-running it on the same date
 * returns the already-generated package without re-generating.
 */

const { distributeForDay } = require('../services/content-distributor');
const { FORMATS }          = require('../config/design-system');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Return the 1-based day-of-year for the given UTC date (or today).
 *
 * @param {Date} [date]
 * @returns {number}
 */
function dayOfYear(date) {
  const d     = date ? new Date(date) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor((d - start) / 86_400_000) + 1;
}

/**
 * Return the ISO date string (YYYY-MM-DD) for the given UTC date.
 *
 * @param {Date} [date]
 * @returns {string}
 */
function isoDate(date) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 10);
}

// ── Core job ──────────────────────────────────────────────────────────────────

/**
 * Generate and log the daily insight graphics package.
 *
 * Responsibilities:
 *  1. Determine today's day number.
 *  2. Build the full distribution package (insight + graphics metadata + social).
 *  3. Log a summary of what was generated.
 *  4. Return the package for downstream use.
 *
 * Actual asset storage and channel publishing are delegated to the stub
 * methods in content-distributor.js, which can be wired to real services
 * (S3, Mailchimp, Twitter API, etc.) without changing this scheduler.
 *
 * @param {Date} [date] - Target date (defaults to today UTC)
 * @returns {Object} The distribution package
 */
function runGraphicGenerationJob(date) {
  const targetDate = date ? new Date(date) : new Date();
  const day        = dayOfYear(targetDate);
  const dateStr    = isoDate(targetDate);

  console.log(`🎨 [GraphicScheduler] Starting daily graphic generation for ${dateStr} (day ${day})…`);

  const pkg = distributeForDay(day);

  // Log generated formats
  const formatList = Object.values(FORMATS)
    .map((f) => `${f.key} (${f.width}×${f.height}px)`)
    .join(', ');

  console.log(`✅ [GraphicScheduler] Graphics package ready for quote "${pkg.quoteId}".`);
  console.log(`   Dimension:  ${pkg.dimension} — ${pkg.subtitle}`);
  console.log(`   Formats:    ${formatList}`);
  console.log(`   Social:     Twitter, LinkedIn, Instagram, Facebook, Email, Video`);

  return pkg;
}

module.exports = { runGraphicGenerationJob, dayOfYear, isoDate };

// ── Entry point (direct script execution) ─────────────────────────────────────

/* istanbul ignore next */
if (require.main === module) {
  try {
    const pkg = runGraphicGenerationJob();
    console.log('\n📦 Distribution package summary:');
    console.log(`   Quote ID:   ${pkg.quoteId}`);
    console.log(`   Generated:  ${pkg.generatedAt}`);
    console.log(`   Status:     ${pkg.status}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ [GraphicScheduler] Job failed:', err.message);
    process.exit(1);
  }
}
