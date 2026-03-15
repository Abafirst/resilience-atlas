'use strict';

/**
 * Tests for backend/services/teamReportGenerator.js
 */

const {
  generateTeamNarrativeReport,
  buildIntroduction,
  buildDimensionAnalysis,
  buildBenchmarkSummary,
  buildTrendSummary,
  buildRiskSummary,
} = require('../backend/services/teamReportGenerator');

// ── Test fixtures ─────────────────────────────────────────────────────────────

const MOCK_ANALYTICS = {
  memberCount: 12,
  teamAverages: {
    relational: 75,
    cognitive:  80,
    somatic:    38,
    emotional:  55,
    spiritual:  45,
    agentic:    72,
    overall:    61,
  },
  distribution: {
    relational: { high: 60, medium: 30, low: 10 },
    cognitive:  { high: 70, medium: 20, low: 10 },
    somatic:    { high: 10, medium: 40, low: 50 },
    emotional:  { high: 30, medium: 55, low: 15 },
    spiritual:  { high: 20, medium: 50, low: 30 },
    agentic:    { high: 58, medium: 32, low: 10 },
  },
  trend: {
    hasData: true,
    current:  { overall: 61, relational: 75, cognitive: 80, somatic: 38, emotional: 55, spiritual: 45, agentic: 72 },
    previous: { overall: 55, relational: 68, cognitive: 74, somatic: 40, emotional: 50, spiritual: 42, agentic: 65 },
    delta:    { overall: 6,  relational: 7,  cognitive: 6,  somatic: -2, emotional: 5,  spiritual: 3,  agentic: 7 },
  },
  atRisk: [
    { id: 'user1', overall: 32, emailDomain: 'example.com' },
    { id: 'user2', overall: 28, emailDomain: 'example.com' },
  ],
  benchmarks: [
    { dim: 'relational', label: 'Relational-Connective', teamScore: 75, baseline: 62, delta: 13, direction: 'above' },
    { dim: 'cognitive',  label: 'Cognitive-Narrative',   teamScore: 80, baseline: 65, delta: 15, direction: 'above' },
    { dim: 'somatic',    label: 'Somatic-Behavioral',    teamScore: 38, baseline: 58, delta: -20, direction: 'below' },
    { dim: 'emotional',  label: 'Emotional-Adaptive',    teamScore: 55, baseline: 60, delta: -5,  direction: 'below' },
    { dim: 'spiritual',  label: 'Spiritual-Existential', teamScore: 45, baseline: 55, delta: -10, direction: 'below' },
    { dim: 'agentic',    label: 'Agentic-Generative',    teamScore: 72, baseline: 63, delta: 9,   direction: 'above' },
  ],
  heatmap: [],
};

// ── generateTeamNarrativeReport ───────────────────────────────────────────────

describe('generateTeamNarrativeReport', () => {
  let report;

  beforeAll(() => {
    report = generateTeamNarrativeReport(MOCK_ANALYTICS, { orgName: 'Acme Corp' });
  });

  test('returns expected top-level fields', () => {
    expect(report).toHaveProperty('title');
    expect(report).toHaveProperty('generatedAt');
    expect(report).toHaveProperty('memberCount');
    expect(report).toHaveProperty('overallScore');
    expect(report).toHaveProperty('sections');
    expect(report).toHaveProperty('branding');
  });

  test('title includes org name', () => {
    expect(report.title).toContain('Acme Corp');
  });

  test('memberCount matches analytics input', () => {
    expect(report.memberCount).toBe(MOCK_ANALYTICS.memberCount);
  });

  test('overallScore matches analytics input rounded', () => {
    expect(report.overallScore).toBe(Math.round(MOCK_ANALYTICS.teamAverages.overall));
  });

  test('generatedAt is an ISO date string', () => {
    expect(() => new Date(report.generatedAt)).not.toThrow();
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
  });

  test('sections contains all expected keys', () => {
    const sections = report.sections;
    expect(sections).toHaveProperty('introduction');
    expect(sections).toHaveProperty('dimensionAnalysis');
    expect(sections).toHaveProperty('benchmarks');
    expect(sections).toHaveProperty('trend');
    expect(sections).toHaveProperty('riskSummary');
  });

  test('uses default org name when not provided', () => {
    const r = generateTeamNarrativeReport(MOCK_ANALYTICS);
    expect(r.title).toContain('Your Organization');
  });
});

// ── buildIntroduction ─────────────────────────────────────────────────────────

describe('buildIntroduction', () => {
  test('returns heading and text', () => {
    const intro = buildIntroduction(MOCK_ANALYTICS, 'Acme Corp');
    expect(intro).toHaveProperty('heading');
    expect(intro).toHaveProperty('text');
    expect(typeof intro.heading).toBe('string');
    expect(typeof intro.text).toBe('string');
  });

  test('text mentions member count', () => {
    const intro = buildIntroduction(MOCK_ANALYTICS, 'Acme Corp');
    expect(intro.text).toContain('12');
  });

  test('text mentions org name', () => {
    const intro = buildIntroduction(MOCK_ANALYTICS, 'Acme Corp');
    expect(intro.text).toContain('Acme Corp');
  });

  test('text mentions overall score', () => {
    const intro = buildIntroduction(MOCK_ANALYTICS, 'Acme Corp');
    expect(intro.text).toContain('61%');
  });
});

// ── buildDimensionAnalysis ────────────────────────────────────────────────────

describe('buildDimensionAnalysis', () => {
  let analysis;

  beforeAll(() => {
    analysis = buildDimensionAnalysis(MOCK_ANALYTICS);
  });

  test('returns 6 dimension entries', () => {
    expect(analysis).toHaveLength(6);
  });

  test('each entry has expected fields', () => {
    for (const item of analysis) {
      expect(item).toHaveProperty('dimension');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('score');
      expect(item).toHaveProperty('strengthLabel');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('analysis');
      expect(item).toHaveProperty('recommendations');
    }
  });

  test('sorts dimensions by score (highest first)', () => {
    for (let i = 0; i < analysis.length - 1; i++) {
      expect(analysis[i].score).toBeGreaterThanOrEqual(analysis[i + 1].score);
    }
  });

  test('highest-scoring dimension gets "strong" label', () => {
    // cognitive (80) and relational (75) are strong
    const top = analysis[0];
    expect(top.strengthLabel).toBe('strong');
  });

  test('low-scoring dimension gets "needs attention" label', () => {
    // somatic (38) < 40
    const somatic = analysis.find((a) => a.dimension === 'somatic');
    expect(somatic.strengthLabel).toBe('needs attention');
  });

  test('recommendations is a non-empty array', () => {
    for (const item of analysis) {
      expect(Array.isArray(item.recommendations)).toBe(true);
      expect(item.recommendations.length).toBeGreaterThan(0);
    }
  });

  test('analysis text includes distribution percentages when available', () => {
    const relational = analysis.find((a) => a.dimension === 'relational');
    expect(relational.analysis).toContain('%');
  });
});

// ── buildBenchmarkSummary ─────────────────────────────────────────────────────

describe('buildBenchmarkSummary', () => {
  test('returns heading, text, and items', () => {
    const summary = buildBenchmarkSummary(MOCK_ANALYTICS);
    expect(summary).toHaveProperty('heading');
    expect(summary).toHaveProperty('text');
    expect(summary).toHaveProperty('items');
  });

  test('text mentions above-average dimensions', () => {
    const summary = buildBenchmarkSummary(MOCK_ANALYTICS);
    expect(summary.text).toContain('above');
  });

  test('text mentions below-average dimensions', () => {
    const summary = buildBenchmarkSummary(MOCK_ANALYTICS);
    expect(summary.text).toContain('gap');
  });

  test('returns null when benchmarks are empty', () => {
    const summary = buildBenchmarkSummary({ ...MOCK_ANALYTICS, benchmarks: [] });
    expect(summary).toBeNull();
  });

  test('items array mirrors the benchmarks input', () => {
    const summary = buildBenchmarkSummary(MOCK_ANALYTICS);
    expect(summary.items).toHaveLength(MOCK_ANALYTICS.benchmarks.length);
  });
});

// ── buildTrendSummary ─────────────────────────────────────────────────────────

describe('buildTrendSummary', () => {
  test('returns "no data" message when trend hasData is false', () => {
    const summary = buildTrendSummary({ ...MOCK_ANALYTICS, trend: { hasData: false } });
    expect(summary.text).toMatch(/second assessment cycle/i);
  });

  test('returns heading and text when trend data exists', () => {
    const summary = buildTrendSummary(MOCK_ANALYTICS);
    expect(summary).toHaveProperty('heading');
    expect(summary).toHaveProperty('text');
    expect(typeof summary.text).toBe('string');
    expect(summary.text.length).toBeGreaterThan(0);
  });

  test('describes overall improvement when delta.overall > 0', () => {
    const summary = buildTrendSummary(MOCK_ANALYTICS);
    expect(summary.text).toMatch(/improved/i);
  });

  test('describes overall decline when delta.overall < 0', () => {
    const declining = {
      ...MOCK_ANALYTICS,
      trend: { hasData: true, delta: { overall: -5, relational: -3, cognitive: -2, somatic: 0, emotional: -1, spiritual: 0, agentic: 0 } },
    };
    const summary = buildTrendSummary(declining);
    expect(summary.text).toMatch(/declined/i);
  });

  test('includes delta data in returned object', () => {
    const summary = buildTrendSummary(MOCK_ANALYTICS);
    expect(summary).toHaveProperty('delta');
  });
});

// ── buildRiskSummary ──────────────────────────────────────────────────────────

describe('buildRiskSummary', () => {
  test('returns no-risk message when atRisk is empty', () => {
    const summary = buildRiskSummary({ ...MOCK_ANALYTICS, atRisk: [] });
    expect(summary.text).toMatch(/no team members/i);
  });

  test('includes count when members are flagged', () => {
    const summary = buildRiskSummary(MOCK_ANALYTICS);
    expect(summary).toHaveProperty('count', 2);
  });

  test('mentions anonymised identities in text', () => {
    const summary = buildRiskSummary(MOCK_ANALYTICS);
    expect(summary.text).toMatch(/anonymis/i);
  });

  test('returns heading and text fields', () => {
    const summary = buildRiskSummary(MOCK_ANALYTICS);
    expect(summary).toHaveProperty('heading');
    expect(summary).toHaveProperty('text');
  });
});
