'use strict';

/**
 * auto-generate-reports.js
 *
 * Scheduled job that checks all active organisations and generates a
 * leadership report whenever the response rate reaches ≥50%.
 *
 * Invoke via cron or directly: node backend/jobs/auto-generate-reports.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Organization = require('../models/Organization');
const { maybeAutoGenerate } = require('../services/leadership-report-generator');

/**
 * Run the auto-generation check across all active organisations.
 * Safe to call repeatedly (idempotent per cycle).
 */
async function runAutoGenerateJob() {
  const orgs = await Organization.find({ isActive: true });

  const results = [];

  for (const org of orgs) {
    try {
      const report = await maybeAutoGenerate(org._id);
      if (report) {
        results.push({ orgId: org._id, reportId: report._id, status: 'generated' });
        console.log(`✅ Report generated for org ${org._id}`);
      }
    } catch (err) {
      console.error(`❌ Failed to generate report for org ${org._id}:`, err.message);
      results.push({ orgId: org._id, status: 'error', error: err.message });
    }
  }

  return results;
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
    .then(() => runAutoGenerateJob())
    .then((results) => {
      console.log('Job complete:', JSON.stringify(results));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Job failed:', err);
      process.exit(1);
    });
}

module.exports = { runAutoGenerateJob };
