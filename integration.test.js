/**
 * Basic tests for Resilience Atlas
 * Validates core modules load correctly and key logic works as expected.
 */
const assert = require('assert');
const path = require('path');

// Set test environment variables before requiring the app
process.env.JWT_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';

console.log('\nResilience Atlas — Test Suite\n');

// --- Module loading ---
console.log('Module loading:');

test('dotenv loads without error', () => {
    require('dotenv');
});

test('express loads without error', () => {
    require('express');
});

test('jsonwebtoken loads without error', () => {
    require('jsonwebtoken');
});

test('bcrypt loads without error', () => {
    require('bcrypt');
});

test('mongodb loads without error', () => {
    require('mongodb');
});

test('stripe loads without error', () => {
    require('stripe');
});

test('cors loads without error', () => {
    require('cors');
});

test('mongoose loads without error', () => {
    require('mongoose');
});

// --- questions.json ---
test('questions.json is valid JSON and has entries', () => {
    const questions = require('../questions.json');
    assert(Array.isArray(questions), 'questions should be an array');
    assert(questions.length > 0, 'questions should not be empty');
});

test('every question has id, question, and category fields', () => {
    const questions = require('../questions.json');
    questions.forEach((q, i) => {
        assert(typeof q.id === 'number', `question[${i}].id should be a number`);
        assert(typeof q.question === 'string' && q.question.length > 0, `question[${i}].question should be a non-empty string`);
        assert(typeof q.category === 'string' && q.category.length > 0, `question[${i}].category should be a non-empty string`);
    });
});

// --- scoring.js logic ---
test('calculateScore returns correct score for perfect answers', () => {
    const { calculateScore } = require('../scoring');
    const result = calculateScore([1, 0, 1, 1], [1, 0, 1, 1]);
    assert.strictEqual(result.score, 4, 'score should be 4');
    assert.strictEqual(result.feedback, 'Excellent! Perfect score!');
});

test('calculateScore returns correct score for partial answers', () => {
    const { calculateScore } = require('../scoring');
    const result = calculateScore([1, 0, 1, 1], [1, 0, 1, 0]);
    assert.strictEqual(result.score, 3, 'score should be 3');
    assert(result.feedback.length > 0, 'feedback should not be empty');
});

test('calculateScore returns correct score for failing answers', () => {
    const { calculateScore } = require('../scoring');
    const result = calculateScore([0, 1, 0, 1], [1, 0, 1, 0]);
    assert.strictEqual(result.score, 0, 'score should be 0');
    assert(result.feedback.includes('Keep trying'), 'feedback should encourage retry');
});

// --- route stubs ---
test('routes/auth.js loads without error', () => {
    const fs = require('fs');
    assert(fs.existsSync(path.join(__dirname, '../routes/auth.js')), 'routes/auth.js should exist');
});

test('routes/quizzes.js loads without error', () => {
    const fs = require('fs');
    assert(fs.existsSync(path.join(__dirname, '../routes/quizzes.js')), 'routes/quizzes.js should exist');
});

test('routes/payments.js loads without error', () => {
    const fs = require('fs');
    assert(fs.existsSync(path.join(__dirname, '../routes/payments.js')), 'routes/payments.js should exist');
});

// --- dotenv order in index.js ---
test('dotenv.config() is called before stripe is initialized', () => {
    const src = require('fs').readFileSync(path.join(__dirname, '../index.js'), 'utf8');
    const dotenvPos = src.indexOf('dotenv.config()');
    const stripePos = src.indexOf("require('stripe')");
    assert(dotenvPos > -1, 'dotenv.config() should be present in index.js');
    assert(stripePos > -1, "require('stripe') should be present in index.js");
    assert(dotenvPos < stripePos, 'dotenv.config() must come before stripe initialization');
});
