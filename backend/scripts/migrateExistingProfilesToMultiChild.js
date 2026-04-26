'use strict';

/**
 * migrateExistingProfilesToMultiChild.js
 *
 * Migration script for existing IATLAS users who have already accumulated
 * progress in localStorage but have not yet been assigned a named child profile.
 *
 * What it does:
 *   1. Finds all users with an active IATLAS subscription.
 *   2. For each user, checks whether they already have at least one child profile.
 *   3. If not, creates a default "Child 1" profile for them so their existing
 *      localStorage progress maps to a real profile.
 *
 * The script is IDEMPOTENT — running it more than once will not create duplicate
 * default profiles.
 *
 * Usage:
 *   MONGODB_URI=<uri> node backend/scripts/migrateExistingProfilesToMultiChild.js
 */

const path     = require('path');
const crypto   = require('crypto');
const mongoose = require('mongoose');
const dotenv   = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI environment variable is not set.');
  process.exit(1);
}

// ── Lazy-require models after connection ─────────────────────────────────────

async function run() {
  console.log('Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.\n');

  const ChildProfile = require(path.join(__dirname, '../models/ChildProfile'));
  const db           = mongoose.connection.db;

  // Find all users with an active IATLAS subscription.
  const subscriptions = await db
    .collection('iatlas_subscriptions')
    .find({ status: { $in: ['active', 'trialing'] } })
    .toArray();

  console.log(`Found ${subscriptions.length} active IATLAS subscriber(s).\n`);

  let created = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    const userId = sub.userId;
    if (!userId) {
      console.warn(`  ⚠️  Subscription ${sub._id} has no userId — skipping.`);
      skipped++;
      continue;
    }

    const existingCount = await ChildProfile.countDocuments({
      userId:   userId.toString(),
      archived: false,
    });

    if (existingCount > 0) {
      console.log(`  ⏭️  User ${userId} already has ${existingCount} profile(s) — skipping.`);
      skipped++;
      continue;
    }

    await ChildProfile.create({
      profileId: crypto.randomUUID(),
      userId:    userId.toString(),
      name:      'Child 1',
      ageGroup:  null,
      avatar:    '🧒',
      progress:  {},
      archived:  false,
    });

    console.log(`  ✅  Created default profile for user ${userId}`);
    created++;
  }

  console.log(`
Migration complete.
  Created : ${created}
  Skipped : ${skipped}
  Total   : ${subscriptions.length}
`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌  Migration failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
