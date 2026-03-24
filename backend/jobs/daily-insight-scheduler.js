'use strict';

/**
 * daily-insight-scheduler.js
 *
 * Scheduled job that generates and persists today's philosophical insight.
 *
 * Run manually or via cron / system scheduler:
 *   node backend/jobs/daily-insight-scheduler.js
 *
 * The job is idempotent: running it multiple times on the same day is safe
 * because DailyInsight uses a unique index on insightDate.
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');

dotenv.config();

const DailyInsight = require('../models/DailyInsight');
const { getDailyBundle } = require('../services/philosophical-content-engine');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return UTC midnight for the given date (or today if omitted).
 * @param {Date} [date]
 * @returns {Date}
 */
function utcMidnight(date) {
  const d = date ? new Date(date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Return the 1-based day-of-year for the given UTC date.
 * @param {Date} [date]
 * @returns {number}
 */
function dayOfYear(date) {
  const d     = date ? new Date(date) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.floor((d - start) / 86_400_000) + 1;
}

// ── Core job ──────────────────────────────────────────────────────────────────

/**
 * Generate and persist the daily insight for the given date.
 * If an insight already exists for that date the existing record is returned.
 *
 * @param {Date} [date] - Target date (defaults to today UTC)
 * @returns {Promise<Object>} The DailyInsight document
 */
async function runDailyInsightJob(date) {
  const targetDate = utcMidnight(date);
  const day        = dayOfYear(targetDate);

  // Idempotency check — don't regenerate if a record already exists
  const existing = await DailyInsight.findOne({ insightDate: targetDate });
  if (existing) {
    console.log(`ℹ️  Insight for ${targetDate.toISOString().slice(0, 10)} already exists (id: ${existing._id}).`);
    return existing;
  }

  const bundle = getDailyBundle(day);

  const doc = await DailyInsight.create({
    dayNumber:           day,
    insightDate:         targetDate,
    quoteId:             bundle.insight.quoteId,
    resilienceDimension: bundle.insight.dimension,
    insight:             bundle.insight,
    email:               bundle.email,
    xPost:               bundle.xPost,
    linkedIn:            bundle.linkedIn,
    graphicPrompt:       bundle.graphicPrompt,
    videoScript:         bundle.videoScript,
    emailSent:           false,
  });

  console.log(
    `✅ Daily insight created for ${targetDate.toISOString().slice(0, 10)} ` +
    `(day ${day}, quote "${bundle.insight.quoteId}").`
  );

  return doc;
}

module.exports = { runDailyInsightJob, utcMidnight, dayOfYear };

// ── Entry point (direct script execution) ─────────────────────────────────────

/* istanbul ignore next */
if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  mongoose
    .connect(uri)
    .then(() => runDailyInsightJob())
    .then((doc) => {
      console.log('Job complete. Document id:', doc._id);
      return mongoose.disconnect();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Job failed:', err);
      process.exit(1);
    });
}
