'use strict';

/**
 * cacheCleanup.js
 *
 * Maintenance job that removes expired PDF caches from the ResilienceReport
 * collection and optionally purges very old report documents.
 *
 * Deletion strategy
 * ─────────────────
 * 1. Expired cache entries  — any ResilienceReport where `cacheExpiry < now`
 *    has its pdfBuffer cleared and `cached` set to false.  The parent document
 *    is kept (it still stores the reportText / pdfUrl).
 * 2. Very old reports       — documents older than REPORT_MAX_AGE_DAYS (90) with
 *    no PDF buffer are hard-deleted to keep the collection lean.
 *
 * Invoke via cron or directly:
 *   node backend/jobs/cacheCleanup.js
 *
 * Schedule suggestion (crontab):
 *   0 3 * * *   node /app/backend/jobs/cacheCleanup.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ResilienceReport = require('../models/ResilienceReport');

/** How long (in days) to keep report documents even without an active cache. */
const REPORT_MAX_AGE_DAYS = 90;

/**
 * Clear expired pdfBuffer data and hard-delete very old empty documents.
 *
 * @returns {Promise<{ expiredCleared: number, oldDocsDeleted: number }>}
 */
async function runCacheCleanupJob() {
    const now = new Date();

    // ── Step 1: Clear pdfBuffer on documents whose cache TTL has passed ───────
    const expiredResult = await ResilienceReport.updateMany(
        {
            cached: true,
            cacheExpiry: { $lt: now },
        },
        {
            $set: {
                cached: false,
                pdfBuffer: null,
            },
        }
    );

    const expiredCleared = expiredResult.modifiedCount;
    if (expiredCleared > 0) {
        console.log(`[cacheCleanup] Cleared expired PDF cache on ${expiredCleared} document(s)`);
    }

    // ── Step 2: Delete old documents that no longer carry any useful data ─────
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - REPORT_MAX_AGE_DAYS);

    const oldDocsResult = await ResilienceReport.deleteMany({
        cached: false,
        pdfBuffer: null,
        createdAt: { $lt: cutoff },
    });

    const oldDocsDeleted = oldDocsResult.deletedCount;
    if (oldDocsDeleted > 0) {
        console.log(`[cacheCleanup] Deleted ${oldDocsDeleted} old report document(s) (>90 days, no cached PDF)`);
    }

    return { expiredCleared, oldDocsDeleted };
}

/* istanbul ignore next */
// Entry-point when run directly as a script
if (require.main === module) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set');
        process.exit(1);
    }

    mongoose
        .connect(uri)
        .then(() => runCacheCleanupJob())
        .then((result) => {
            console.log('[cacheCleanup] Job complete:', JSON.stringify(result));
            process.exit(0);
        })
        .catch((err) => {
            console.error('[cacheCleanup] Job failed:', err);
            process.exit(1);
        });
}

module.exports = { runCacheCleanupJob, REPORT_MAX_AGE_DAYS };
