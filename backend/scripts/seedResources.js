'use strict';

/**
 * seedResources.js — Evidence-Based Resource Library Seed
 *
 * Seeds the Resource collection with curated, evidence-based resources
 * organised by the seven visible categories and multiple content types.
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

const Resource = require(path.join(__dirname, '../models/Resource'));
const resources = require('./resourceSeedData');

// ── Helper: build the same URL-safe slug used by the model pre-save hook ──────
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

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

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const data of resources) {
    const slug = slugify(data.title);
    const doc  = { ...data, slug };

    try {
      // Use updateOne with upsert — the result.upsertedCount field tells us
      // whether a new document was inserted (1) or an existing one updated (0),
      // removing the need for a separate findOne lookup.
      const result = await Resource.updateOne(
        { slug },
        { $set: doc },
        { upsert: true, setDefaultsOnInsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted++;
        console.log(`  [INSERTED] ${data.title}`);
      } else {
        updated++;
        console.log(`  [UPDATED]  ${data.title}`);
      }
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
        console.warn(`  [SKIPPED]  ${data.title} (duplicate key — slug collision)`);
      } else {
        console.error(`  [ERROR]    ${data.title}: ${err.message}`);
      }
    }
  }

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
