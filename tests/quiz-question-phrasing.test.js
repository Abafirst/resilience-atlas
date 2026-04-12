'use strict';

/**
 * quiz-question-phrasing.test.js
 *
 * Validates that:
 *  1. The assessment frequency-prompt header is "How often is this true for you?"
 *  2. All 72 questions start with "In general, I "
 *
 * Reads both sources of truth:
 *  - public/js/quiz.js  (legacy HTML quiz)
 *  - client/src/pages/QuizPage.jsx  (React quiz)
 */

const fs   = require('fs');
const path = require('path');

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractQuestions(src) {
    const match = src.match(/const QUESTIONS\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) throw new Error('Could not locate QUESTIONS array');
    // eslint-disable-next-line no-new-func
    return new Function(`return ${match[1]}`)();
}

function extractFrequencyPrompt(src) {
    // Matches both JSX and HTML attribute variants
    const match = src.match(/question-frequency-prompt[^>]*>([^<]+)</);
    if (!match) throw new Error('Could not locate question-frequency-prompt text');
    return match[1].trim();
}

// ── Load source files ─────────────────────────────────────────────────────────

const quizJsSrc  = fs.readFileSync(
    path.resolve(__dirname, '../public/js/quiz.js'), 'utf8');
const quizJsxSrc = fs.readFileSync(
    path.resolve(__dirname, '../client/src/pages/QuizPage.jsx'), 'utf8');

const EXPECTED_HEADER   = 'How often is this true for you?';
const EXPECTED_PREFIX   = 'In general, I ';
const EXPECTED_Q_COUNT  = 72;

// ── Tests: public/js/quiz.js ──────────────────────────────────────────────────

describe('public/js/quiz.js — assessment header', () => {
    test('frequency prompt is "How often is this true for you?"', () => {
        const prompt = extractFrequencyPrompt(quizJsSrc);
        expect(prompt).toBe(EXPECTED_HEADER);
    });
});

describe('public/js/quiz.js — question phrasing', () => {
    let questions;
    beforeAll(() => { questions = extractQuestions(quizJsSrc); });

    test(`has exactly ${EXPECTED_Q_COUNT} questions`, () => {
        expect(questions).toHaveLength(EXPECTED_Q_COUNT);
    });

    test('every question starts with "In general, I "', () => {
        const bad = questions.filter(q => !q.text.startsWith(EXPECTED_PREFIX));
        if (bad.length > 0) {
            const details = bad.map(q => `  Q${q.id}: "${q.text}"`).join('\n');
            throw new Error(
                `${bad.length} question(s) do not start with "${EXPECTED_PREFIX}":\n${details}`
            );
        }
    });
});

// ── Tests: client/src/pages/QuizPage.jsx ─────────────────────────────────────

describe('QuizPage.jsx — assessment header', () => {
    test('frequency prompt is "How often is this true for you?"', () => {
        const prompt = extractFrequencyPrompt(quizJsxSrc);
        expect(prompt).toBe(EXPECTED_HEADER);
    });
});

describe('QuizPage.jsx — question phrasing', () => {
    let questions;
    beforeAll(() => { questions = extractQuestions(quizJsxSrc); });

    test(`has exactly ${EXPECTED_Q_COUNT} questions`, () => {
        expect(questions).toHaveLength(EXPECTED_Q_COUNT);
    });

    test('every question starts with "In general, I "', () => {
        const bad = questions.filter(q => !q.text.startsWith(EXPECTED_PREFIX));
        if (bad.length > 0) {
            const details = bad.map(q => `  Q${q.id}: "${q.text}"`).join('\n');
            throw new Error(
                `${bad.length} question(s) do not start with "${EXPECTED_PREFIX}":\n${details}`
            );
        }
    });

    test('ids are 1–72 without gaps', () => {
        const ids = questions.map(q => q.id).sort((a, b) => a - b);
        expect(ids).toEqual(Array.from({ length: EXPECTED_Q_COUNT }, (_, i) => i + 1));
    });
});
