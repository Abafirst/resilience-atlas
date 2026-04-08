'use strict';

/**
 * validateResources.js — Resource Seed Validation Script
 *
 * Validates that every resource defined in resourceSeedData.js conforms to
 * the Resource model schema before the seed is applied to the database.
 *
 * Checks performed:
 *   1. Required fields present (title, type, url or pdfUrl)
 *   2. Enum values valid (type, category, difficulty, dimensions, status,
 *      videoProvider)
 *   3. String length constraints (title ≤ 200, description ≤ 1000,
 *      excerpt ≤ 500)
 *   4. URL format validation (basic HTTP/HTTPS check)
 *   5. Type-specific fields: expert → expertName, video → videoProvider,
 *      pdf → pdfUrl
 *   6. No duplicate titles / slugs within the seed data
 *   7. Coverage: at least 5 resources per category, at least 1 per type
 *
 * Usage:
 *   node backend/scripts/validateResources.js
 *
 * Or via npm script (from the backend/ directory):
 *   npm run validate:resources
 *
 * Exit code 0 = all resources valid (warnings are non-blocking)
 * Exit code 1 = one or more schema errors found
 */

const resources = require('./resourceSeedData');

// ── Schema constraints mirrored from backend/models/Resource.js ───────────────

const VALID_TYPES        = ['article', 'video', 'pdf', 'quiz', 'podcast', 'expert'];
const VALID_CATEGORIES   = ['nutrition', 'exercise', 'meditation', 'sleep', 'relationships', 'career', 'general'];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const VALID_DIMENSIONS   = [
  'Cognitive-Narrative',
  'Emotional-Somatic',
  'Relational-Social',
  'Agentic-Generative',
  'Somatic-Regulative',
  'Spiritual-Reflective',
];
const VALID_STATUSES        = ['draft', 'published', 'archived'];
const VALID_VIDEO_PROVIDERS = ['youtube', 'vimeo', 'other', null];

// ── URL validation ────────────────────────────────────────────────────────────

function isValidUrl(str) {
  if (!str) return false;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ── Slug helper (mirrors the model pre-save hook) ─────────────────────────────

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ── Validate ──────────────────────────────────────────────────────────────────

let errors   = 0;
let warnings = 0;
const seenTitles = new Set();
const seenSlugs  = new Set();

console.log(`Validating ${resources.length} resources from resourceSeedData.js…\n`);

for (let i = 0; i < resources.length; i++) {
  const r    = resources[i];
  const idx  = String(i + 1).padStart(2, '0');
  const name = r.title || `(no title at index ${i})`;
  const errs  = [];
  const warns = [];

  // 1. Required: title
  if (!r.title || typeof r.title !== 'string' || r.title.trim() === '') {
    errs.push('Missing required field: title');
  } else if (r.title.length > 200) {
    errs.push(`title exceeds 200 chars (${r.title.length})`);
  }

  // 2. Required: type
  if (!r.type) {
    errs.push('Missing required field: type');
  } else if (!VALID_TYPES.includes(r.type)) {
    errs.push(`Invalid type: "${r.type}". Must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // 3. Category enum
  if (r.category !== undefined && !VALID_CATEGORIES.includes(r.category)) {
    errs.push(`Invalid category: "${r.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // 4. Difficulty enum
  if (r.difficulty !== undefined && !VALID_DIFFICULTIES.includes(r.difficulty)) {
    errs.push(`Invalid difficulty: "${r.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }

  // 5. Status enum
  if (r.status !== undefined && !VALID_STATUSES.includes(r.status)) {
    errs.push(`Invalid status: "${r.status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // 6. Dimensions enum
  if (r.dimensions !== undefined) {
    if (!Array.isArray(r.dimensions)) {
      errs.push('dimensions must be an array');
    } else {
      for (const d of r.dimensions) {
        if (!VALID_DIMENSIONS.includes(d)) {
          errs.push(`Invalid dimension: "${d}". Must be one of: ${VALID_DIMENSIONS.join(', ')}`);
        }
      }
    }
  }

  // 7. URL — at least one of url/pdfUrl required
  const primaryUrl = r.url || r.pdfUrl;
  if (!primaryUrl) {
    errs.push('Missing url or pdfUrl — at least one is required');
  } else if (!isValidUrl(primaryUrl)) {
    errs.push(`Invalid URL: "${primaryUrl}"`);
  }
  // Also validate pdfUrl if separately present
  if (r.pdfUrl && r.pdfUrl !== primaryUrl && !isValidUrl(r.pdfUrl)) {
    errs.push(`Invalid pdfUrl: "${r.pdfUrl}"`);
  }

  // 8. String length constraints
  if (r.description && r.description.length > 1000) {
    errs.push(`description exceeds 1000 chars (${r.description.length})`);
  }
  if (r.excerpt && r.excerpt.length > 500) {
    errs.push(`excerpt exceeds 500 chars (${r.excerpt.length})`);
  }

  // 9. videoProvider enum — only validate if the field is explicitly set
  if (r.videoProvider !== undefined && r.videoProvider !== null &&
      !VALID_VIDEO_PROVIDERS.includes(r.videoProvider)) {
    errs.push(`Invalid videoProvider: "${r.videoProvider}". Must be one of: youtube, vimeo, other, null`);
  }

  // 10. Type-specific field warnings
  if (r.type === 'expert' && !r.expertName) {
    warns.push('expert type should have expertName set');
  }
  if (r.type === 'video' && !r.videoProvider) {
    warns.push('video type should have videoProvider set');
  }
  if (r.type === 'pdf' && !r.pdfUrl) {
    warns.push('pdf type should have pdfUrl set (pdfUrl is separate from url)');
  }

  // 11. Duplicate title / slug detection
  const slug = r.title ? slugify(r.title) : null;
  if (r.title) {
    if (seenTitles.has(r.title)) {
      errs.push(`Duplicate title: "${r.title}"`);
    } else {
      seenTitles.add(r.title);
    }
  }
  if (slug) {
    if (seenSlugs.has(slug)) {
      errs.push(`Duplicate slug: "${slug}"`);
    } else {
      seenSlugs.add(slug);
    }
  }

  // ── Report per resource ────────────────────────────────────────────────────
  if (errs.length > 0) {
    console.error(`[${idx}] FAIL  "${name}"`);
    for (const e of errs)  console.error(`       ERROR: ${e}`);
    errors += errs.length;
  } else if (warns.length > 0) {
    console.warn(`[${idx}] WARN  "${name}"`);
    for (const w of warns) console.warn(`       WARN:  ${w}`);
    warnings += warns.length;
  } else {
    console.log(`[${idx}] OK    "${name}"`);
  }
}

// ── Coverage report ───────────────────────────────────────────────────────────

console.log('\n── Coverage Report ─────────────────────────────────────────────────────────\n');

const byCategory = {};
const byType     = {};

for (const r of resources) {
  const cat  = r.category || 'general';
  const type = r.type     || 'unknown';
  byCategory[cat]  = (byCategory[cat]  || 0) + 1;
  byType[type]     = (byType[type]     || 0) + 1;
}

console.log('By category:');
for (const cat of VALID_CATEGORIES) {
  const count = byCategory[cat] || 0;
  const flag  = count < 5 ? '  ← fewer than 5 resources' : '';
  console.log(`  ${cat.padEnd(15)} ${count}${flag}`);
  if (count < 5) warnings++;
}

console.log('\nBy type:');
for (const type of VALID_TYPES) {
  const count = byType[type] || 0;
  const flag  = count === 0 ? '  ← no resources of this type' : '';
  console.log(`  ${type.padEnd(12)} ${count}${flag}`);
  if (count === 0) warnings++;
}

// ── Final summary ─────────────────────────────────────────────────────────────

console.log('\n── Summary ─────────────────────────────────────────────────────────────────\n');
console.log(`  Total resources validated:  ${resources.length}`);
console.log(`  Errors:                     ${errors}`);
console.log(`  Warnings:                   ${warnings}`);

if (errors > 0) {
  console.error('\nValidation FAILED. Fix the errors above before running the seed.\n');
  process.exit(1);
} else {
  console.log('\nValidation PASSED. All resources conform to the schema.');
  if (warnings > 0) {
    console.warn(`  (${warnings} warning(s) — review recommended but not blocking)\n`);
  } else {
    console.log('');
  }
  process.exit(0);
}
