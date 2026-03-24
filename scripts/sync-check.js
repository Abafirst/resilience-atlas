#!/usr/bin/env node
'use strict';

/**
 * sync-check.js — Verify that all 7 tier definitions are consistently
 * defined across the key payment and frontend files.
 *
 * Run: node scripts/sync-check.js
 * Should exit 0 with "✅ All sync checks passed!" when everything is in sync.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** The canonical set of tiers that must be defined in every checked file. */
const REQUIRED_TIERS = [
    'free',
    'atlas-navigator',
    'atlas-premium',
    'business',
    'starter',
    'pro',
    'enterprise',
];

/**
 * Files that must each contain a definition for every required tier.
 * A tier is considered "defined" when its string literal appears in the file.
 */
const CHECKED_FILES = [
    'public/js/payment-gating.js',
    'backend/routes/payments.js',
    'backend/routes/quiz.js',
];

// ─────────────────────────────────────────────────────────────────────────────

const issues = [];

console.log('🔍 Running tier sync checks...\n');

// Load each file and record which tiers it mentions.
const tierPresence = {}; // { filePath: Set<tier> }

for (const relPath of CHECKED_FILES) {
    const absPath = path.join(ROOT, relPath);
    let src;
    try {
        src = fs.readFileSync(absPath, 'utf8');
    } catch (err) {
        console.warn(`  ⚠️  Could not read ${relPath}: ${err.message}`);
        continue;
    }

    const present = new Set();
    for (const tier of REQUIRED_TIERS) {
        if (src.includes(`'${tier}'`) || src.includes(`"${tier}"`)) {
            present.add(tier);
        }
    }
    tierPresence[relPath] = present;
    const count = present.size;
    const total = REQUIRED_TIERS.length;
    const status = count === total ? '✅' : '⚠️ ';
    console.log(`  ${status} ${relPath}: ${count}/${total} tiers defined`);
}

console.log('');

// Find tiers that are missing from any file or only defined in one location.
for (const tier of REQUIRED_TIERS) {
    const filesWithTier = CHECKED_FILES.filter(
        (f) => tierPresence[f] && tierPresence[f].has(tier)
    );

    if (filesWithTier.length === 0) {
        issues.push(`❌ Tier "${tier}" is not defined in any checked file`);
    } else if (filesWithTier.length < CHECKED_FILES.length) {
        const missing = CHECKED_FILES.filter((f) => !filesWithTier.includes(f));
        issues.push(
            `⚠️  Tier "${tier}" defined in only ${filesWithTier.length} location(s) — missing from: ${missing.join(', ')}`
        );
    }
}

// ── Report ────────────────────────────────────────────────────────────────────

console.log('---\n');

if (issues.length === 0) {
    console.log('✅ All sync checks passed! All 7 tiers are consistently defined.\n');
    process.exit(0);
} else {
    console.log(`❌ Found ${issues.length} sync issue(s):\n`);
    issues.forEach((issue) => console.log('  ' + issue));
    console.log('');
    process.exit(1);
}
