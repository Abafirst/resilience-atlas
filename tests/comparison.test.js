'use strict';

/**
 * Tests for backend/services/comparisonService.js
 */

const {
  analyseProfiles,
  calculateGrowth,
  buildGrowthReport,
  normaliseScores,
  DIMENSIONS,
  DIMENSION_LABELS,
} = require('../backend/services/comparisonService');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const strongScores = { emotional: 80, mental: 85, physical: 75, social: 90, spiritual: 70, financial: 72 };
const weakScores   = { emotional: 30, mental: 35, physical: 25, social: 40, spiritual: 20, financial: 28 };
const midScores    = { emotional: 55, mental: 60, physical: 50, social: 58, spiritual: 45, financial: 52 };

// ── normaliseScores ───────────────────────────────────────────────────────────

describe('normaliseScores', () => {
  test('returns plain numbers unchanged', () => {
    const result = normaliseScores(strongScores);
    for (const dim of DIMENSIONS) {
      expect(result[dim]).toBe(strongScores[dim]);
    }
  });

  test('extracts .percentage from object values', () => {
    const obj = { emotional: { percentage: 70, raw: 35, max: 50 }, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const result = normaliseScores(obj);
    expect(result.emotional).toBe(70);
    expect(result.mental).toBe(60);
  });

  test('defaults missing dimensions to 0', () => {
    const result = normaliseScores({});
    for (const dim of DIMENSIONS) {
      expect(result[dim]).toBe(0);
    }
  });
});

// ── analyseProfiles ───────────────────────────────────────────────────────────

describe('analyseProfiles', () => {
  test('returns object with expected keys', () => {
    const result = analyseProfiles(strongScores, midScores);
    expect(result).toHaveProperty('synergies');
    expect(result).toHaveProperty('complementarities');
    expect(result).toHaveProperty('gaps');
    expect(result).toHaveProperty('teamScore');
    expect(result).toHaveProperty('recommendations');
  });

  test('all values are arrays or numbers', () => {
    const result = analyseProfiles(strongScores, midScores);
    expect(Array.isArray(result.synergies)).toBe(true);
    expect(Array.isArray(result.complementarities)).toBe(true);
    expect(Array.isArray(result.gaps)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(typeof result.teamScore).toBe('number');
  });

  test('identifies synergies when both score >=70', () => {
    // Both have strong scores → synergies for shared dims >= 70
    const result = analyseProfiles(strongScores, strongScores);
    expect(result.synergies.length).toBeGreaterThan(0);
  });

  test('identifies gaps when both score <=45', () => {
    const result = analyseProfiles(weakScores, weakScores);
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  test('identifies complementarities when one is high and other is not', () => {
    const high = { emotional: 80, mental: 80, physical: 80, social: 80, spiritual: 80, financial: 80 };
    const low  = { emotional: 30, mental: 30, physical: 30, social: 30, spiritual: 30, financial: 30 };
    const result = analyseProfiles(high, low);
    expect(result.complementarities.length).toBeGreaterThan(0);
  });

  test('teamScore is within 0–100', () => {
    const result = analyseProfiles(strongScores, weakScores);
    expect(result.teamScore).toBeGreaterThanOrEqual(0);
    expect(result.teamScore).toBeLessThanOrEqual(100);
  });

  test('provides at least one recommendation', () => {
    const result = analyseProfiles(midScores, midScores);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  test('uses provided names in output strings', () => {
    const result = analyseProfiles(strongScores, weakScores, 'Alice', 'Bob');
    const allStrings = [
      ...result.synergies,
      ...result.complementarities,
      ...result.gaps,
      ...result.recommendations,
    ].join(' ');
    // At least one mention of Alice or Bob is expected in the output
    expect(allStrings).toMatch(/Alice|Bob/);
  });
});

// ── calculateGrowth ───────────────────────────────────────────────────────────

describe('calculateGrowth', () => {
  test('returns dimensionTrends for all dimensions', () => {
    const result = calculateGrowth(strongScores, midScores);
    for (const dim of DIMENSIONS) {
      expect(result.dimensionTrends).toHaveProperty(dim);
    }
  });

  test('direction is "improved" when score increased', () => {
    const current  = { emotional: 70, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const previous = { emotional: 50, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const result = calculateGrowth(current, previous);
    expect(result.dimensionTrends.emotional.direction).toBe('improved');
  });

  test('direction is "declined" when score decreased', () => {
    const current  = { emotional: 40, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const previous = { emotional: 60, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const result = calculateGrowth(current, previous);
    expect(result.dimensionTrends.emotional.direction).toBe('declined');
  });

  test('direction is "stable" when unchanged', () => {
    const result = calculateGrowth(midScores, midScores);
    for (const dim of DIMENSIONS) {
      expect(result.dimensionTrends[dim].direction).toBe('stable');
    }
  });

  test('calculates correct delta', () => {
    const current  = { emotional: 70, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const previous = { emotional: 50, mental: 60, physical: 50, social: 55, spiritual: 45, financial: 40 };
    const result = calculateGrowth(current, previous);
    expect(result.dimensionTrends.emotional.delta).toBe(20);
  });

  test('generates milestones for significant improvements', () => {
    const current  = { emotional: 85, mental: 75, physical: 70, social: 80, spiritual: 70, financial: 72 };
    const previous = { emotional: 30, mental: 30, physical: 30, social: 30, spiritual: 30, financial: 30 };
    const result = calculateGrowth(current, previous);
    expect(result.milestones.length).toBeGreaterThan(0);
  });
});

// ── buildGrowthReport ─────────────────────────────────────────────────────────

describe('buildGrowthReport', () => {
  test('returns empty report for empty history', () => {
    const result = buildGrowthReport([]);
    expect(result.overallTrend).toBe(0);
    expect(result.milestones).toEqual([]);
  });

  test('returns baseline message for single assessment', () => {
    const history = [{ date: new Date(), scores: midScores, overall: 55 }];
    const result  = buildGrowthReport(history);
    expect(result.milestones.some(m => m.toLowerCase().includes('first assessment'))).toBe(true);
  });

  test('returns checkpoints array for multiple assessments', () => {
    const history = [
      { date: new Date('2025-01-01'), scores: weakScores, overall: 30 },
      { date: new Date('2025-06-01'), scores: midScores,  overall: 55 },
      { date: new Date('2026-01-01'), scores: strongScores, overall: 79 },
    ];
    const result = buildGrowthReport(history);
    expect(Array.isArray(result.checkpoints)).toBe(true);
    expect(result.checkpoints.length).toBe(3);
  });

  test('sorts assessments oldest-first regardless of input order', () => {
    const history = [
      { date: new Date('2026-01-01'), scores: strongScores, overall: 79 },
      { date: new Date('2025-01-01'), scores: weakScores,   overall: 30 },
    ];
    const result = buildGrowthReport(history);
    expect(new Date(result.checkpoints[0].date).getFullYear()).toBe(2025);
    expect(new Date(result.checkpoints[1].date).getFullYear()).toBe(2026);
  });

  test('overallTrend reflects improvement direction', () => {
    const history = [
      { date: new Date('2025-01-01'), scores: weakScores,   overall: 30 },
      { date: new Date('2026-01-01'), scores: strongScores, overall: 79 },
    ];
    const result = buildGrowthReport(history);
    expect(result.overallTrend).toBeGreaterThan(0);
  });
});

// ── DIMENSION_LABELS completeness ─────────────────────────────────────────────

describe('DIMENSION_LABELS', () => {
  test('has a label for every dimension', () => {
    for (const dim of DIMENSIONS) {
      expect(DIMENSION_LABELS).toHaveProperty(dim);
      expect(typeof DIMENSION_LABELS[dim]).toBe('string');
    }
  });
});
