'use strict';

/**
 * streakChecker.js
 *
 * Daily cron job: resets broken streaks and logs the results.
 * Run this file directly (node backend/jobs/streakChecker.js) or
 * schedule it via an external cron (e.g. Railway Cron, Heroku Scheduler).
 *
 * Environment variables required:
 *   MONGODB_URI — MongoDB connection string
 */

const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const { runDailyStreakCheck } = require('../services/gamificationService');

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set — cannot run streak check');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const resetCount = await runDailyStreakCheck();
  console.log(`✅ Streak check complete — ${resetCount} streak(s) reset`);

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch((err) => {
  console.error('❌ Streak check failed:', err);
  process.exit(1);
});
