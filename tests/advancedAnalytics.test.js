'use strict';

/**
 * Tests for backend/services/advancedAnalytics.js
 */

const {
  computeDistribution,
  buildHeatmap,
  computeBenchmarks,
  flagAtRisk,
  DIMENSIONS,
  DIMENSION_LABELS,
  INDUSTRY_BASELINES,
} = require('../backend/services/advancedAnalytics');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResult(scores, overall = null) {
  return {
    _id:   Math.random().toString(36).slice(2),
    email: `user_${Math.random().toString(36).slice(2)}@example.com`,
    overall: overall !== null ? overall : Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / Object.values(scores).length),
    ...scores,
  };
}

// ── computeDistribution ───────────────────────────────────────────────────────

describe('computeDistribution', () => {
  test('returns an entry for every dimension', () => {
    const results = [makeResult({ relational: 80, cognitive: 50, somatic: 30, emotional: 60, spiritual: 45, agentic: 70 })];
    const dist = computeDistribution(results);

    for (const dim of DIMENSIONS) {
      expect(dist).toHaveProperty(dim);
      expect(dist[dim]).toHaveProperty('high');
      expect(dist[dim]).toHaveProperty('medium');
      expect(dist[dim]).toHaveProperty('low');
      expect(dist[dim]).toHaveProperty('label');
    }
  });

  test('classifies high scores (>=70) correctly', () => {
    const results = [makeResult({ relational: 90, cognitive: 70, somatic: 50, emotional: 40, spiritual: 20, agentic: 0 })];
    const dist = computeDistribution(results);
    expect(dist.relational.high).toBe(100);
    expect(dist.relational.medium).toBe(0);
    expect(dist.relational.low).toBe(0);
    expect(dist.cognitive.high).toBe(100);  // exactly 70 → high
  });

  test('classifies medium scores (40–69) correctly', () => {
    const results = [makeResult({ relational: 50, cognitive: 50, somatic: 50, emotional: 50, spiritual: 50, agentic: 50 })];
    const dist = computeDistribution(results);
    for (const dim of DIMENSIONS) {
      expect(dist[dim].medium).toBe(100);
      expect(dist[dim].high).toBe(0);
      expect(dist[dim].low).toBe(0);
    }
  });

  test('classifies low scores (<40) correctly', () => {
    const results = [makeResult({ relational: 10, cognitive: 30, somatic: 39, emotional: 20, spiritual: 5, agentic: 0 })];
    const dist = computeDistribution(results);
    for (const dim of DIMENSIONS) {
      expect(dist[dim].low).toBe(100);
    }
  });

  test('handles mixed score bands across team members', () => {
    const results = [
      makeResult({ relational: 80, cognitive: 80, somatic: 80, emotional: 80, spiritual: 80, agentic: 80 }),
      makeResult({ relational: 50, cognitive: 50, somatic: 50, emotional: 50, spiritual: 50, agentic: 50 }),
      makeResult({ relational: 20, cognitive: 20, somatic: 20, emotional: 20, spiritual: 20, agentic: 20 }),
    ];
    const dist = computeDistribution(results);
    // 1/3 high, 1/3 medium, 1/3 low → 33% each
    for (const dim of DIMENSIONS) {
      expect(dist[dim].high).toBe(33);
      expect(dist[dim].medium).toBe(33);
      expect(dist[dim].low).toBe(33);
    }
  });

  test('returns zeros for empty results array', () => {
    const dist = computeDistribution([]);
    for (const dim of DIMENSIONS) {
      expect(dist[dim].high).toBe(0);
      expect(dist[dim].medium).toBe(0);
      expect(dist[dim].low).toBe(0);
    }
  });

  test('includes dimension label from DIMENSION_LABELS', () => {
    const dist = computeDistribution([makeResult({ relational: 80, cognitive: 50, somatic: 30, emotional: 60, spiritual: 45, agentic: 70 })]);
    for (const dim of DIMENSIONS) {
      expect(dist[dim].label).toBe(DIMENSION_LABELS[dim]);
    }
  });
});

// ── buildHeatmap ──────────────────────────────────────────────────────────────

describe('buildHeatmap', () => {
  test('returns one entry per dimension', () => {
    const averages = { relational: 75, cognitive: 60, somatic: 30, emotional: 55, spiritual: 45, agentic: 70 };
    const heatmap = buildHeatmap(averages);
    expect(heatmap).toHaveLength(DIMENSIONS.length);
  });

  test('classifies strong dimensions (>=70)', () => {
    const heatmap = buildHeatmap({ relational: 80, cognitive: 70, somatic: 30, emotional: 55, spiritual: 45, agentic: 65 });
    const relational = heatmap.find((h) => h.dim === 'relational');
    const cognitive  = heatmap.find((h) => h.dim === 'cognitive');
    expect(relational.strength).toBe('strong');
    expect(cognitive.strength).toBe('strong');  // exactly 70 → strong
  });

  test('classifies moderate dimensions (40–69)', () => {
    const heatmap = buildHeatmap({ relational: 50, cognitive: 40, somatic: 30, emotional: 55, spiritual: 45, agentic: 65 });
    const relational = heatmap.find((h) => h.dim === 'relational');
    const cognitive  = heatmap.find((h) => h.dim === 'cognitive');
    expect(relational.strength).toBe('moderate');
    expect(cognitive.strength).toBe('moderate');  // exactly 40 → moderate
  });

  test('classifies weak dimensions (<40)', () => {
    const heatmap = buildHeatmap({ relational: 39, cognitive: 10, somatic: 0, emotional: 25, spiritual: 5, agentic: 30 });
    for (const item of heatmap) {
      expect(item.strength).toBe('weak');
    }
  });

  test('includes score and label fields', () => {
    const averages = { relational: 75, cognitive: 60, somatic: 30, emotional: 55, spiritual: 45, agentic: 70 };
    const heatmap = buildHeatmap(averages);
    for (const item of heatmap) {
      expect(typeof item.score).toBe('number');
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  test('defaults missing dimensions to 0', () => {
    const heatmap = buildHeatmap({});
    for (const item of heatmap) {
      expect(item.score).toBe(0);
      expect(item.strength).toBe('weak');
    }
  });
});

// ── computeBenchmarks ─────────────────────────────────────────────────────────

describe('computeBenchmarks', () => {
  test('returns one entry per dimension', () => {
    const averages = { relational: 75, cognitive: 60, somatic: 30, emotional: 55, spiritual: 45, agentic: 70 };
    const benchmarks = computeBenchmarks(averages);
    expect(benchmarks).toHaveLength(DIMENSIONS.length);
  });

  test('calculates correct delta values', () => {
    const averages = { relational: 70, cognitive: 60, somatic: 40, emotional: 55, spiritual: 45, agentic: 70 };
    const benchmarks = computeBenchmarks(averages, {
      relational: 60, cognitive: 65, somatic: 50, emotional: 50, spiritual: 40, agentic: 60,
    });

    const relational = benchmarks.find((b) => b.dim === 'relational');
    const cognitive  = benchmarks.find((b) => b.dim === 'cognitive');

    expect(relational.delta).toBe(10);
    expect(relational.direction).toBe('above');
    expect(cognitive.delta).toBe(-5);
    expect(cognitive.direction).toBe('below');
  });

  test('uses default INDUSTRY_BASELINES when not provided', () => {
    const averages = { relational: 62, cognitive: 65, somatic: 58, emotional: 60, spiritual: 55, agentic: 63 };
    const benchmarks = computeBenchmarks(averages);
    for (const b of benchmarks) {
      expect(b.baseline).toBe(INDUSTRY_BASELINES[b.dim]);
    }
  });

  test('includes label, teamScore, direction fields', () => {
    const averages = { relational: 70, cognitive: 60, somatic: 40, emotional: 55, spiritual: 45, agentic: 70 };
    const benchmarks = computeBenchmarks(averages);
    for (const b of benchmarks) {
      expect(typeof b.label).toBe('string');
      expect(typeof b.teamScore).toBe('number');
      expect(['above', 'below']).toContain(b.direction);
    }
  });
});

// ── flagAtRisk ────────────────────────────────────────────────────────────────

describe('flagAtRisk', () => {
  test('flags members below default threshold (40)', () => {
    const results = [
      { _id: '1', email: 'a@test.com', overall: 35 },
      { _id: '2', email: 'b@test.com', overall: 50 },
      { _id: '3', email: 'c@test.com', overall: 25 },
    ];
    const flagged = flagAtRisk(results);
    expect(flagged).toHaveLength(2);
    expect(flagged.map((r) => r.id)).toEqual(expect.arrayContaining(['1', '3']));
  });

  test('flags members below custom threshold', () => {
    const results = [
      { _id: '1', email: 'a@test.com', overall: 55 },
      { _id: '2', email: 'b@test.com', overall: 70 },
    ];
    const flagged = flagAtRisk(results, 60);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].id).toBe('1');
  });

  test('returns empty array when no one is at risk', () => {
    const results = [
      { _id: '1', email: 'a@test.com', overall: 80 },
      { _id: '2', email: 'b@test.com', overall: 65 },
    ];
    const flagged = flagAtRisk(results);
    expect(flagged).toHaveLength(0);
  });

  test('anonymises email to domain only', () => {
    const results = [{ _id: '1', email: 'john.doe@company.com', overall: 25 }];
    const flagged = flagAtRisk(results);
    expect(flagged[0].emailDomain).toBe('company.com');
    expect(flagged[0]).not.toHaveProperty('email');
  });

  test('skips members with null overall score', () => {
    const results = [
      { _id: '1', email: 'a@test.com', overall: null },
      { _id: '2', email: 'b@test.com', overall: 20 },
    ];
    const flagged = flagAtRisk(results);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].id).toBe('2');
  });
});
