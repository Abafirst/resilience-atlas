'use strict';

/**
 * seedResources.js — Evidence-Based Resource Library Seed
 *
 * Seeds the Resource collection with curated, evidence-based resources
 * organized by the seven visible categories and multiple content types.
 *
 * Focused on: ABA, ACT, Resilience Studies, Cross-Cultural Research,
 *             Psychology, Positive Psychology, Behavioral Science.
 *
 * The script is IDEMPOTENT — running it more than once will not create
 * duplicates.  Each resource is matched by its slug and upserted.
 *
 * Usage:
 *   MONGODB_URI=<uri> node backend/scripts/seedResources.js
 *
 * Or via npm script (from the backend/ directory):
 *   MONGODB_URI=<uri> npm run seed:resources
 */

const path     = require('path');
const mongoose = require('mongoose');

const { seedResources } = require(path.join(__dirname, '../lib/seedResources'));
const resources         = require('./resourceSeedData');

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    console.error('Usage: MONGODB_URI=<uri> node backend/scripts/seedResources.js');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  const { inserted, updated, skipped } = await seedResources();

  console.log(`\nSeed complete.`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Total processed: ${resources.length}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
