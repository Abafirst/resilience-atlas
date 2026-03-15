#!/usr/bin/env node
/* =====================================================
   audit-quiz-questions.js — Duplicate detection tool
   Reads the 72 questions from public/js/quiz.js and
   reports exact, near, and semantic duplicates.
   Outputs: reports/question-audit.json
   ===================================================== */
'use strict';

const fs   = require('fs');
const path = require('path');

// ── Extract QUESTIONS array from quiz.js ──────────────
const quizSrc = fs.readFileSync(
  path.resolve(__dirname, '../public/js/quiz.js'),
  'utf8'
);

// Parse questions via a sandboxed eval pattern
const match = quizSrc.match(/const QUESTIONS\s*=\s*(\[[\s\S]*?\]);/);
if (!match) {
  console.error('ERROR: Could not locate QUESTIONS array in public/js/quiz.js');
  process.exit(1);
}

// Use Function constructor to evaluate the array literal safely
// (no network / file-system access in this expression)
// eslint-disable-next-line no-new-func
const QUESTIONS = new Function(`return ${match[1]}`)();
console.log(`✅ Loaded ${QUESTIONS.length} questions from public/js/quiz.js\n`);

// ── Tokenisation helpers ──────────────────────────────

/** Normalise text: lowercase, strip punctuation, collapse whitespace */
function normalise(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Word-token set for a question */
function tokenSet(text) {
  const stopWords = new Set([
    'i', 'me', 'my', 'the', 'a', 'an', 'and', 'or', 'in', 'of',
    'to', 'is', 'it', 'on', 'for', 'with', 'that', 'this', 'can',
    'am', 'are', 'be', 'have', 'has', 'do', 'does', 'at', 'by',
    'from', 'when', 'even', 'what', 'how', 'who', 'which', 'but',
    'as', 'not', 'no', 'so', 'if', 'up', 'out', 'there', 'they',
    'their', 'after', 'during', 'without',
  ]);
  return new Set(
    normalise(text)
      .split(' ')
      .filter(w => w.length > 2 && !stopWords.has(w))
  );
}

// ── Similarity algorithms ─────────────────────────────

/** Jaccard similarity on token sets (0–1) */
function jaccardSimilarity(a, b) {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union        = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/** Levenshtein edit distance */
function levenshtein(a, b) {
  const na = normalise(a), nb = normalise(b);
  const la = na.length, lb = nb.length;
  const dp = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = na[i - 1] === nb[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[la][lb];
}

/** Edit-distance similarity (0–1) */
function editSimilarity(a, b) {
  const na = normalise(a), nb = normalise(b);
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

/**
 * Combined similarity score (0–1):
 * 60 % Jaccard (semantic overlap) + 40 % edit distance.
 */
function similarity(a, b) {
  return 0.6 * jaccardSimilarity(a, b) + 0.4 * editSimilarity(a, b);
}

// ── Thresholds ────────────────────────────────────────
const EXACT_THRESHOLD  = 1.00;   // identical (after normalisation)
const NEAR_THRESHOLD   = 0.70;   // very close phrasing
const SEMANTIC_THRESHOLD = 0.50; // same idea, different words

// ── Pair-wise comparison ──────────────────────────────
const pairs = [];

for (let i = 0; i < QUESTIONS.length; i++) {
  for (let j = i + 1; j < QUESTIONS.length; j++) {
    const score = similarity(QUESTIONS[i].text, QUESTIONS[j].text);

    if (score < SEMANTIC_THRESHOLD) continue;

    let type;
    if (score >= EXACT_THRESHOLD)  type = 'exact';
    else if (score >= NEAR_THRESHOLD) type = 'near';
    else                              type = 'semantic';

    pairs.push({
      q1: { id: QUESTIONS[i].id, category: QUESTIONS[i].category, text: QUESTIONS[i].text },
      q2: { id: QUESTIONS[j].id, category: QUESTIONS[j].category, text: QUESTIONS[j].text },
      similarityScore: Math.round(score * 100),
      type,
    });
  }
}

// Sort: highest similarity first
pairs.sort((a, b) => b.similarityScore - a.similarityScore);

// ── Category breakdown ────────────────────────────────
const byCategory = {};
pairs.forEach(p => {
  const cat = p.q1.category === p.q2.category ? p.q1.category : 'cross-category';
  byCategory[cat] = (byCategory[cat] || 0) + 1;
});

// ── Console report ────────────────────────────────────
console.log('══════════════════════════════════════════════════');
console.log('           QUIZ DUPLICATE DETECTION REPORT        ');
console.log('══════════════════════════════════════════════════');

const exactPairs    = pairs.filter(p => p.type === 'exact');
const nearPairs     = pairs.filter(p => p.type === 'near');
const semanticPairs = pairs.filter(p => p.type === 'semantic');

console.log(`\n📊 Summary`);
console.log(`  Total questions    : ${QUESTIONS.length}`);
console.log(`  Exact duplicates   : ${exactPairs.length} pairs`);
console.log(`  Near duplicates    : ${nearPairs.length} pairs`);
console.log(`  Semantic duplicates: ${semanticPairs.length} pairs`);
console.log(`  Total flagged pairs: ${pairs.length}`);

if (exactPairs.length > 0) {
  console.log('\n🔴 EXACT DUPLICATES');
  exactPairs.forEach(p => {
    console.log(`  Q${p.q1.id} ≡ Q${p.q2.id} [${p.similarityScore}%]`);
    console.log(`    "${p.q1.text}"`);
    console.log(`    "${p.q2.text}"`);
  });
}

if (nearPairs.length > 0) {
  console.log('\n🟠 NEAR DUPLICATES');
  nearPairs.forEach(p => {
    console.log(`  Q${p.q1.id} ≈ Q${p.q2.id} [${p.similarityScore}%] (${p.q1.category})`);
    console.log(`    "${p.q1.text}"`);
    console.log(`    "${p.q2.text}"`);
  });
}

if (semanticPairs.length > 0) {
  console.log('\n🟡 SEMANTIC DUPLICATES');
  semanticPairs.forEach(p => {
    console.log(`  Q${p.q1.id} ~ Q${p.q2.id} [${p.similarityScore}%] (${p.q1.category})`);
    console.log(`    "${p.q1.text}"`);
    console.log(`    "${p.q2.text}"`);
  });
}

console.log('\n📁 Category breakdown of flagged pairs:');
Object.entries(byCategory).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} pair(s)`);
});

// ── Write JSON report ─────────────────────────────────
const reportsDir = path.resolve(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const reportPath = path.join(reportsDir, 'question-audit.json');
const report = {
  generatedAt: new Date().toISOString(),
  totalQuestions: QUESTIONS.length,
  summary: {
    exactDuplicates:    exactPairs.length,
    nearDuplicates:     nearPairs.length,
    semanticDuplicates: semanticPairs.length,
    totalFlaggedPairs:  pairs.length,
  },
  categoryBreakdown: byCategory,
  flaggedPairs: pairs,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(`\n✅ JSON report written to: ${reportPath}`);

if (pairs.length === 0) {
  console.log('\n🎉 No duplicate or similar questions detected!');
} else {
  console.log(`\n⚠️  Action needed: review the ${pairs.length} flagged pair(s) above.`);
}
