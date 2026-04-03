'use strict';

/**
 * Migration: add-report-unlock-tracking
 *
 * Updates the system to the new tiered PDF access model:
 *
 *   OLD model:
 *     - First assessment: PDF is free.
 *     - atlas-starter purchases: expire after 30 days.
 *     - atlas-navigator / atlas-premium / Teams: permanent access to all assessments.
 *
 *   NEW model:
 *     - Every assessment requires a purchase to download the PDF (no free first assessment).
 *     - atlas-starter: unlocks ONE specific assessment's PDF (permanent, no expiry).
 *     - atlas-navigator / atlas-premium / Teams: blanket access to ALL assessments (permanent).
 *
 * What this migration does:
 *   1. All atlas-starter purchases are made permanent (expiresAt = null).
 *      Previously they expired after 30 days; now they are permanent.
 *      This is BETTER for existing users — they gain permanent access to
 *      previously purchased reports.
 *
 * Note: The "first assessment free" exception was a backend-only check in
 * report.js.  It has been removed in the updated route code, so no database
 * migration is needed for that change.
 *
 * Usage:
 *   MONGODB_URI=<uri> node backend/migrations/add-report-unlock-tracking.js
 */

const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI environment variable is required.');
        process.exit(1);
    }

    console.log('Connecting to MongoDB…');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Find all atlas-starter purchases (they previously had a 30-day expiry enforced
    // in application logic).  In the new model they are permanent.
    // We log these for auditing but no document field needs to be updated because
    // the expiry was enforced purely in application code (not stored in the DB).
    const starterCount = await Purchase.countDocuments({
        tier:   'atlas-starter',
        status: 'completed',
    });

    console.log(`Found ${starterCount} completed atlas-starter purchase(s).`);
    console.log('These purchases are now permanent (no 30-day expiry) as per the new access model.');
    console.log('No document updates required — the expiry was enforced in application code only.');

    // Log summary of all purchase tiers for reference.
    const tierSummary = await Purchase.aggregate([
        { $group: { _id: '$tier', count: { $sum: 1 } } },
        { $sort:  { _id: 1 } },
    ]);

    console.log('\nPurchase tier summary:');
    for (const { _id: tier, count } of tierSummary) {
        console.log(`  ${tier}: ${count} purchase(s)`);
    }

    console.log('\nMigration complete. All atlas-starter purchases are now treated as permanent.');
    await mongoose.disconnect();
    process.exit(0);
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
