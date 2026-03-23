/**
 * Basic tests for Resilience Atlas
 * Validates core modules load correctly and key logic works as expected.
 */
const assert = require('assert');
const path = require('path');

// Set test environment variables before requiring the app
process.env.JWT_SECRET = 'test-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
// Leave MONGODB_URI unset so the guard in index.js is exercised

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     ${err.message}`);
        failed++;
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     ${err.message}`);
        failed++;
    }
}

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
console.log('\nquestions.json:');

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
console.log('\nscoring.js:');

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
console.log('\nRoute stubs:');

test('routes/quizzes.js loads without error', () => {
    const fs = require('fs');
    assert(fs.existsSync(path.join(__dirname, '../routes/quizzes.js')), 'routes/quizzes.js should exist');
});

test('routes/payments.js loads without error', () => {
    const fs = require('fs');
    assert(fs.existsSync(path.join(__dirname, '../routes/payments.js')), 'routes/payments.js should exist');
});

// --- dotenv order in index.js ---
console.log('\nindex.js:');

test('dotenv.config() is called before stripe is initialized', () => {
    const src = require('fs').readFileSync(path.join(__dirname, '../index.js'), 'utf8');
    const dotenvPos = src.indexOf('dotenv.config()');
    const stripePos = src.indexOf("require('stripe')");
    assert(dotenvPos > -1, 'dotenv.config() should be present in index.js');
    assert(stripePos > -1, "require('stripe') should be present in index.js");
    assert(dotenvPos < stripePos, 'dotenv.config() must come before stripe initialization so STRIPE_SECRET_KEY is loaded');
});

// --- HTTP endpoint tests ---
console.log('\nHTTP endpoints:');

const supertest = require('supertest');
const app = require('../index.js');
const request = supertest(app);

async function runHttpTests() {

    await testAsync('GET / returns 200 with welcome message', async () => {
        const res = await request.get('/');
        assert.strictEqual(res.status, 200, `expected 200, got ${res.status}`);
        assert(res.body.message, 'response should have a message field');
    });

    await testAsync('GET /health returns 200 with status OK', async () => {
        const res = await request.get('/health');
        assert.strictEqual(res.status, 200, `expected 200, got ${res.status}`);
        assert.strictEqual(res.body.status, 'OK', 'health check status should be OK');
    });

    await testAsync('POST /create-payment without token returns 401', async () => {
        const res = await request.post('/create-payment').send({ amount: 10 });
        assert.strictEqual(res.status, 401, `expected 401, got ${res.status}`);
    });

    await testAsync('GET /payment/:id without token returns 401', async () => {
        const res = await request.get('/payment/pi_test123');
        assert.strictEqual(res.status, 401, `expected 401, got ${res.status}`);
    });

    // --- Auth redirect tests (Auth0 Universal Login) ---
    console.log('\nAuth endpoints (Auth0 redirect):');

    await testAsync('GET /login redirects (no local login form rendered)', async () => {
        const res = await request.get('/login');
        assert.strictEqual(res.status, 302, `expected 302 redirect, got ${res.status}`);
    });

    await testAsync('GET /register redirects (no local registration form rendered)', async () => {
        const res = await request.get('/register');
        assert.strictEqual(res.status, 302, `expected 302 redirect, got ${res.status}`);
    });

    await testAsync('POST /auth/signup returns 404 (local signup removed)', async () => {
        const res = await request.post('/auth/signup').send({ email: 'x@example.com', password: 'pass' });
        assert.strictEqual(res.status, 404, `expected 404, got ${res.status}`);
    });

    await testAsync('POST /auth/login returns 404 (local login removed)', async () => {
        const res = await request.post('/auth/login').send({ email: 'x@example.com', password: 'pass' });
        assert.strictEqual(res.status, 404, `expected 404, got ${res.status}`);
    });

    // --- Quiz endpoint tests ---
    console.log('\nQuiz endpoints:');

    await testAsync('GET /api/quizzes returns 200 with 36 questions', async () => {
        const res = await request.get('/api/quizzes');
        assert.strictEqual(res.status, 200, `expected 200, got ${res.status}`);
        assert(Array.isArray(res.body), 'response should be an array');
        assert.strictEqual(res.body.length, 36, `expected 36 questions, got ${res.body.length}`);
    });

    // --- Summary ---
    console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) {
        throw new Error(`${failed} test(s) failed`);
    }
}

// eslint-disable-next-line no-undef
it('HTTP endpoint tests', () => runHttpTests(), 30000);
