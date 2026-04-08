'use strict';

/**
 * backend/lib/seedResources.js — Shared Resource Library seed logic
 *
 * Exports a single async function `seedResources()` that upserts all
 * curated resources into MongoDB using the existing Mongoose connection.
 *
 * It does NOT call mongoose.connect() or mongoose.disconnect() so it is
 * safe to call from within an already-connected Express request handler.
 *
 * Returns an object: { inserted, updated, skipped, total }
 */

const path      = require('path');
const Resource  = require(path.join(__dirname, '../models/Resource'));
const resources = require(path.join(__dirname, '../scripts/resourceSeedData'));

// ── Helper: build the same URL-safe slug used by the model pre-save hook ──────
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Upsert all resources by slug.  Safe to call repeatedly (idempotent).
 *
 * @returns {{ inserted: number, updated: number, skipped: number, total: number }}
 */
async function seedResources() {
  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const data of resources) {
    const slug = slugify(data.title);
    const doc  = { ...data, slug };

    try {
      const result = await Resource.updateOne(
        { slug },
        { $set: doc },
        { upsert: true, setDefaultsOnInsert: true }
      );

      if (result.upsertedCount > 0) {
        inserted++;
      } else {
        updated++;
      }
    } catch (err) {
      if (err.code === 11000) {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  return { inserted, updated, skipped, total: resources.length };
}

module.exports = { seedResources };
