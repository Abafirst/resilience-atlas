#!/usr/bin/env node
'use strict';

/**
 * migrateLocalStorageToBackend.js
 *
 * One-time migration script that imports progress data exported from a user's
 * browser localStorage into MongoDB via the /api/progress/sync endpoint.
 *
 * This is intended for the "first login after the backend persistence feature
 * ships" scenario.  On the frontend, the useProgressSync hook handles this
 * automatically by merging server state into localStorage on mount and syncing
 * on every update.
 *
 * This script is provided for:
 *   1. Manual / admin migrations (e.g. importing a JSON file a user exports).
 *   2. Bulk back-fill for existing users who have provided their progress data.
 *
 * Usage:
 *   MONGODB_URI=<uri> API_BASE_URL=<url> AUTH_TOKEN=<jwt> node \
 *     backend/scripts/migrateLocalStorageToBackend.js \
 *     --file /path/to/progress-export.json \
 *     [--childProfileId <id>]
 *
 * The JSON file should be the raw localStorage export containing the keys:
 *   - iatlas_progress
 *   - iatlas_badges_earned
 *   - iatlas_overall_streak
 *   - iatlas_streak
 *   - iatlas_active_quests
 *   - iatlas_activity_feed
 *   (and/or their iatlas_progress_<profileId>_* counterparts for kids)
 */

const https  = require('https');
const http   = require('http');
const path   = require('path');
const fs     = require('fs');
const url    = require('url');
const mongoose = require('mongoose');

// ── CLI argument parsing ──────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const filePath      = getArg('--file');
const childProfileId = getArg('--childProfileId') || null;

// ── Environment ───────────────────────────────────────────────────────────────

const MONGODB_URI  = process.env.MONGODB_URI;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const AUTH_TOKEN   = process.env.AUTH_TOKEN;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required.');
  process.exit(1);
}

if (!AUTH_TOKEN) {
  console.error('ERROR: AUTH_TOKEN environment variable is required (a valid JWT for the user).');
  process.exit(1);
}

if (!filePath) {
  console.error('ERROR: --file <path> argument is required.');
  process.exit(1);
}

// ── Read the localStorage export ──────────────────────────────────────────────

let rawData;
try {
  rawData = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
} catch (err) {
  console.error('ERROR: Could not read or parse the export file:', err.message);
  process.exit(1);
}

// ── Transform localStorage keys into progressData payload ─────────────────────

function parseJSONField(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch (_) { return fallback; }
}

function buildAdultProgressData(storage) {
  const skillProgress = parseJSONField(storage['iatlas_progress'], {});
  const badgeObjects  = parseJSONField(storage['iatlas_badges_earned'], []);
  const overallStreak = parseJSONField(storage['iatlas_overall_streak'], {});
  const dimStreaks     = parseJSONField(storage['iatlas_streak'], {});
  const quests        = parseJSONField(storage['iatlas_active_quests'], []);
  const activityFeed  = parseJSONField(storage['iatlas_activity_feed'], []);

  let xp = 0;
  for (const dimProgress of Object.values(skillProgress)) {
    if (dimProgress && typeof dimProgress === 'object') {
      for (const skillData of Object.values(dimProgress)) {
        xp += (skillData && typeof skillData === 'object' ? skillData.xpEarned || 0 : 0);
      }
    }
  }

  return {
    skillProgress,
    completedModules: Object.keys(skillProgress),
    xp,
    badges: Array.isArray(badgeObjects)
      ? badgeObjects.map(b => b.id || b.name).filter(Boolean)
      : [],
    streaks: {
      current:          overallStreak.current  || 0,
      longest:          overallStreak.longest  || 0,
      lastActivityDate: overallStreak.lastDate || null,
    },
    quests: Array.isArray(quests)
      ? quests.map(q => ({
          questId:     q.questId,
          status:      q.status,
          progress:    q.progress?.percentage || 0,
          completedAt: q.completedAt || null,
        }))
      : [],
    rawAdultData: {
      dimensionStreaks: dimStreaks,
      activityFeed:     activityFeed.slice(-50),
    },
  };
}

function buildKidsProgressData(storage, profileId) {
  const prefix = profileId ? `iatlas_progress_${profileId}` : 'iatlas_kids';

  const kidsActivities = parseJSONField(storage[`${prefix}_progress`] || storage['iatlas_kids_progress'], {});
  const kidsBadgeRaw   = parseJSONField(storage[`${prefix}_badges`]   || storage['iatlas_kids_badges'], []);
  const kidsStreaksRaw = parseJSONField(storage[`${prefix}_streaks`]  || storage['iatlas_kids_streaks'], {});
  const adventures     = parseJSONField(storage[`${prefix}_adventures`] || storage['iatlas_kids_adventures'], []);

  return {
    kidsActivities,
    kidsBadges: Array.isArray(kidsBadgeRaw)
      ? kidsBadgeRaw.map(b => b.id || b.name || b).filter(Boolean)
      : [],
    kidsStreaks: {
      current:          kidsStreaksRaw.current  || 0,
      longest:          kidsStreaksRaw.longest  || 0,
      lastActivityDate: kidsStreaksRaw.lastDate || null,
    },
    kidsAdventures: Array.isArray(adventures) ? adventures : [],
  };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function postJSON(endpoint, body) {
  return new Promise((resolve, reject) => {
    const parsed  = new url.URL(endpoint);
    const isHttps = parsed.protocol === 'https:';
    const lib     = isHttps ? https : http;

    const payload = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (isHttps ? 443 : 80),
      path:     parsed.pathname + (parsed.search || ''),
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Authorization':  `Bearer ${AUTH_TOKEN}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.\n');

  const UserProgress = require(path.join(__dirname, '..', 'models', 'UserProgress'));

  const isKids        = childProfileId !== null;
  const progressData  = isKids
    ? buildKidsProgressData(rawData, childProfileId)
    : buildAdultProgressData(rawData);

  console.log(`📦 Progress type: ${isKids ? 'kids' : 'adult'}`);
  if (isKids) console.log(`👶 Child profile ID: ${childProfileId}`);
  console.log('📤 Syncing to backend via API...');

  const endpoint = `${API_BASE_URL}/api/progress/sync`;
  const result   = await postJSON(endpoint, {
    childProfileId,
    progressData,
  });

  if (result.status === 200 || result.status === 201) {
    console.log('✅ Progress successfully migrated to backend!');
    console.log('🕐 Last synced at:', result.body?.lastSyncedAt || 'unknown');
  } else {
    console.error('❌ Migration failed with HTTP', result.status);
    console.error('Response:', JSON.stringify(result.body, null, 2));
    await mongoose.disconnect();
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log('\n✅ Migration complete.');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
