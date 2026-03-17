'use strict';

/**
 * teamAnalyticsCron.js — Daily team analytics snapshot job.
 *
 * Iterates over all active organizations and builds (or refreshes) their
 * team analytics snapshot.  Safe to call repeatedly — each run creates a
 * new snapshot and appends a trend entry.
 *
 * Invoke via an external cron scheduler or directly:
 *   node backend/jobs/teamAnalyticsCron.js
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');

dotenv.config();

const Organization          = require('../models/Organization');
const { buildTeamAnalytics } = require('../services/teamAnalyticsService');

/**
 * Run the daily team analytics snapshot across all active organizations.
 *
 * @returns {Promise<Array<{orgId, status, profileId?, error?}>>}
 */
async function runTeamAnalyticsJob() {
  const orgs = await Organization.find({ isActive: true }).lean();

  const results = [];

  for (const org of orgs) {
    try {
      const profile = await buildTeamAnalytics(org._id, { save: true });
      results.push({ orgId: org._id, status: 'generated', profileId: profile._id });
      console.log(`✅ Team analytics generated for org ${org._id}`);
    } catch (err) {
      console.error(`❌ Failed to generate team analytics for org ${org._id}:`, err.message);
      results.push({ orgId: org._id, status: 'error', error: err.message });
    }
  }

  return results;
}

/* istanbul ignore next */
if (require.main === module) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  mongoose
    .connect(uri)
    .then(() => runTeamAnalyticsJob())
    .then((results) => {
      console.log('Job complete:', JSON.stringify(results));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Job failed:', err);
      process.exit(1);
    });
}

module.exports = { runTeamAnalyticsJob };
