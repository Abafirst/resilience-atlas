'use strict';

const { calculateResilienceScores, generateReport } = require('../backend/scoring');

describe('calculateResilienceScores', () => {
    // Build a valid 72-answer array where every answer is 5 (maximum).
    const allFives = Array(72).fill(5);
    // Build a valid 72-answer array where every answer is 1 (minimum).
    const allOnes = Array(72).fill(1);

    test('throws when answers array is missing', () => {
        expect(() => calculateResilienceScores()).toThrow('Expected at least 72 answers.');
    });

    test('throws when answers array has wrong length', () => {
        expect(() => calculateResilienceScores([1, 2, 3])).toThrow('Expected at least 72 answers.');
    });

    test('returns 100% overall score for all-5 answers', () => {
        const result = calculateResilienceScores(allFives);
        expect(result.overall).toBe(100);
    });

    test('returns 20% overall score for all-1 answers', () => {
        // 1 out of 5 max → 20%
        const result = calculateResilienceScores(allOnes);
        expect(result.overall).toBe(20);
    });

    test('result contains all six dimension keys', () => {
        const result = calculateResilienceScores(allFives);
        expect(Object.keys(result.categories)).toEqual(
            expect.arrayContaining(['Agentic-Generative', 'Relational-Connective', 'Spiritual-Reflective', 'Emotional-Adaptive', 'Somatic-Regulative', 'Cognitive-Narrative'])
        );
    });

    test('dominantType is one of the six dimensions', () => {
        const validDimensions = ['Agentic-Generative', 'Relational-Connective', 'Spiritual-Reflective', 'Emotional-Adaptive', 'Somatic-Regulative', 'Cognitive-Narrative'];
        const result = calculateResilienceScores(allFives);
        expect(validDimensions).toContain(result.dominantType);
    });

    test('category scores are between 0 and 100', () => {
        const result = calculateResilienceScores(allFives);
        for (const score of Object.values(result.categories)) {
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        }
    });

    test('dominantType reflects the highest-scoring dimension', () => {
        // Set all answers to 1, then boost Agentic-Generative questions (indices 0–11) to 5.
        const answers = Array(72).fill(1);
        for (let i = 0; i <= 11; i++) answers[i] = 5;

        const result = calculateResilienceScores(answers);
        expect(result.dominantType).toBe('Agentic-Generative');
    });
});

describe('generateReport', () => {
    const scores = calculateResilienceScores(Array(72).fill(3));

    test('returns a report with overall, dominantType, categories, level, and summary', () => {
        const report = generateReport(scores);
        expect(report).toHaveProperty('overall');
        expect(report).toHaveProperty('dominantType');
        expect(report).toHaveProperty('categories');
        expect(report).toHaveProperty('level');
        expect(report).toHaveProperty('summary');
    });

    test('level is one of the expected label strings', () => {
        const validLevels = ['Excellent', 'Good', 'Moderate', 'Developing', 'Needs Attention'];
        const report = generateReport(scores);
        expect(validLevels).toContain(report.level);
    });

    test('summary is a non-empty string', () => {
        const report = generateReport(scores);
        expect(typeof report.summary).toBe('string');
        expect(report.summary.length).toBeGreaterThan(0);
    });

    test('summary mentions the overall score', () => {
        const report = generateReport(scores);
        expect(report.summary).toContain(`${report.overall}%`);
    });
});
