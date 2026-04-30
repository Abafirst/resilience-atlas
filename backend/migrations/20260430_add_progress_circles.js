'use strict';

/**
 * 20260430_add_progress_circles.js
 *
 * Migration: add Progress Circle fields to Organisation and ChildProfile documents
 * that were created before this feature was introduced.
 *
 * Run once:
 *   node backend/migrations/20260430_add_progress_circles.js
 */

const mongoose  = require('mongoose');
const dotenv    = require('dotenv');

dotenv.config();

const Organization = require('../models/Organization');
const ChildProfile = require('../models/ChildProfile');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set. Aborting migration.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  console.log('Starting progress circle migration...');

  // 1. Add organizationType and related fields to existing organisations.
  const orgResult = await Organization.updateMany(
    { organizationType: { $exists: false } },
    {
      $set: {
        organizationType:     null,
        specialtySettings:    {},
        participatingCircles: [],
      },
    }
  );
  console.log(`Updated ${orgResult.modifiedCount} organisation(s) with progress circle fields.`);

  // 2. Add progress circle fields to existing child profiles.
  const profileResult = await ChildProfile.updateMany(
    { progressCircleId: { $exists: false } },
    {
      $set: {
        progressCircleId: null,
        privacyConsent: {
          sharingEnabled: false,
          consentedBy:    null,
          consentedAt:    null,
          consentVersion: '1.0',
        },
        activityLog: [],
      },
    }
  );
  console.log(`Updated ${profileResult.modifiedCount} child profile(s) with progress circle fields.`);

  console.log('Migration complete!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

module.exports = { migrate };
