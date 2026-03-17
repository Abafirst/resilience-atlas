'use strict';

/**
 * Tests for the comprehensive report generation service.
 * Covers: dimensionContent, archetypes, and reportService.buildComprehensiveReport
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('winston', () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    return {
        createLogger: jest.fn(() => logger),
        format: {
            combine: jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors: jest.fn(() => ({})),
            splat: jest.fn(() => ({})),
            json: jest.fn(() => ({})),
            colorize: jest.fn(() => ({})),
            printf: jest.fn((fn) => fn),
        },
        transports: { Console: function () {}, File: function () {} },
    };
});

jest.mock('pdfkit', () => {
    const EventEmitter = require('events');
    class PDFDocument extends EventEmitter {
        constructor() { super(); }
        fontSize() { return this; }
        font() { return this; }
        text() { return this; }
        moveDown() { return this; }
        end() { setImmediate(() => this.emit('end')); return this; }
    }
    return PDFDocument;
});

const {
    DIMENSION_CONTENT,
    getScoreBand,
    calculatePercentile,
    getLevel,
} = require('../backend/templates/dimensionContent');

const {
    ARCHETYPES,
    assignArchetype,
    generateStressResponseProfile,
    generateRelationshipInsights,
} = require('../backend/templates/archetypes');

const {
    buildComprehensiveReport,
    buildDimensionAnalysis,
    generate30DayPlan,
    generateStrengthIntegration,
    generateExecutiveSummary,
    generateRecommendedResources,
} = require('../backend/services/reportService');

// ── Sample scores fixtures ────────────────────────────────────────────────────

const SAMPLE_SCORES_HIGH = {
    'Cognitive-Narrative':  { raw: 57, max: 60, percentage: 95.00 },
    'Relational-Connective':{ raw: 46, max: 60, percentage: 76.67 },
    'Agentic-Generative':   { raw: 44, max: 60, percentage: 73.33 },
    'Emotional-Adaptive':   { raw: 40, max: 60, percentage: 66.67 },
    'Spiritual-Reflective': { raw: 38, max: 60, percentage: 63.33 },
    'Somatic-Regulative':   { raw: 30, max: 60, percentage: 50.00 },
};

const SAMPLE_SCORES_LOW = {
    'Cognitive-Narrative':  { raw: 20, max: 60, percentage: 33.33 },
    'Relational-Connective':{ raw: 18, max: 60, percentage: 30.00 },
    'Agentic-Generative':   { raw: 22, max: 60, percentage: 36.67 },
    'Emotional-Adaptive':   { raw: 25, max: 60, percentage: 41.67 },
    'Spiritual-Reflective': { raw: 15, max: 60, percentage: 25.00 },
    'Somatic-Regulative':   { raw: 28, max: 60, percentage: 46.67 },
};

const SAMPLE_SCORES_BALANCED = {
    'Cognitive-Narrative':  { raw: 40, max: 60, percentage: 66.67 },
    'Relational-Connective':{ raw: 39, max: 60, percentage: 65.00 },
    'Agentic-Generative':   { raw: 41, max: 60, percentage: 68.33 },
    'Emotional-Adaptive':   { raw: 38, max: 60, percentage: 63.33 },
    'Spiritual-Reflective': { raw: 40, max: 60, percentage: 66.67 },
    'Somatic-Regulative':   { raw: 37, max: 60, percentage: 61.67 },
};

// ── dimensionContent tests ────────────────────────────────────────────────────

describe('dimensionContent', () => {
    test('DIMENSION_CONTENT has all 6 dimensions', () => {
        const expected = [
            'Cognitive-Narrative',
            'Relational-Connective',
            'Agentic-Generative',
            'Emotional-Adaptive',
            'Spiritual-Reflective',
            'Somatic-Regulative',
        ];
        for (const dim of expected) {
            expect(DIMENSION_CONTENT).toHaveProperty(dim);
        }
    });

    test('each dimension has required fields', () => {
        for (const [dim, content] of Object.entries(DIMENSION_CONTENT)) {
            expect(content).toHaveProperty('label');
            expect(content).toHaveProperty('description');
            expect(content).toHaveProperty('insight');
            expect(content.insight).toHaveProperty('high');
            expect(content.insight).toHaveProperty('mid');
            expect(content.insight).toHaveProperty('low');
            expect(content).toHaveProperty('strengths');
            expect(content).toHaveProperty('growthOpportunities');
            expect(content).toHaveProperty('microPractice');
            expect(content).toHaveProperty('weeklyProgression');
            expect(Array.isArray(content.weeklyProgression)).toBe(true);
            expect(content.weeklyProgression).toHaveLength(4);
            expect(content).toHaveProperty('realWorldApplication');
            expect(content).toHaveProperty('benchmark');
            expect(content.benchmark).toHaveProperty('populationMean');
        }
    });

    describe('getScoreBand', () => {
        test('returns "high" for 80+', () => expect(getScoreBand(85)).toBe('high'));
        test('returns "high" for exactly 80', () => expect(getScoreBand(80)).toBe('high'));
        test('returns "mid" for 50-79', () => {
            expect(getScoreBand(50)).toBe('mid');
            expect(getScoreBand(75)).toBe('mid');
        });
        test('returns "low" for below 50', () => {
            expect(getScoreBand(49)).toBe('low');
            expect(getScoreBand(0)).toBe('low');
        });
    });

    describe('getLevel', () => {
        test('returns "strong" for 80+', () => expect(getLevel(85)).toBe('strong'));
        test('returns "solid" for 65-79', () => expect(getLevel(70)).toBe('solid'));
        test('returns "developing" for 50-64', () => expect(getLevel(55)).toBe('developing'));
        test('returns "emerging" below 50', () => expect(getLevel(40)).toBe('emerging'));
    });

    describe('calculatePercentile', () => {
        test('returns a number between 1 and 99', () => {
            const pct = calculatePercentile('Cognitive-Narrative', 70);
            expect(pct).toBeGreaterThanOrEqual(1);
            expect(pct).toBeLessThanOrEqual(99);
        });

        test('higher score yields higher or equal percentile', () => {
            const low = calculatePercentile('Cognitive-Narrative', 30);
            const high = calculatePercentile('Cognitive-Narrative', 90);
            expect(high).toBeGreaterThanOrEqual(low);
        });

        test('returns 50 for unknown dimension', () => {
            expect(calculatePercentile('Unknown-Dimension', 60)).toBe(50);
        });
    });
});

// ── archetypes tests ──────────────────────────────────────────────────────────

describe('archetypes', () => {
    test('ARCHETYPES has all expected archetype keys', () => {
        const expected = [
            'The Thinker', 'The Connector', 'The Navigator',
            'The Feeler', 'The Guide', 'The Regulator', 'The Balanced',
        ];
        for (const name of expected) {
            expect(ARCHETYPES).toHaveProperty(name);
        }
    });

    test('each archetype has required fields', () => {
        for (const [name, arch] of Object.entries(ARCHETYPES)) {
            expect(arch).toHaveProperty('name');
            expect(arch).toHaveProperty('description');
            expect(arch).toHaveProperty('superpowers');
            expect(Array.isArray(arch.superpowers)).toBe(true);
            expect(arch).toHaveProperty('stressResponse');
            expect(arch).toHaveProperty('copingStrategies');
            expect(arch).toHaveProperty('groundingTechniques');
        }
    });

    describe('assignArchetype', () => {
        test('assigns The Thinker for dominant Cognitive-Narrative', () => {
            const { archetype } = assignArchetype(SAMPLE_SCORES_HIGH);
            expect(archetype.name).toBe('The Thinker');
        });

        test('assigns The Balanced for balanced profile', () => {
            const { archetype } = assignArchetype(SAMPLE_SCORES_BALANCED);
            expect(archetype.name).toBe('The Balanced');
        });

        test('returns topDimensions array of length 3', () => {
            const { topDimensions } = assignArchetype(SAMPLE_SCORES_HIGH);
            expect(Array.isArray(topDimensions)).toBe(true);
            expect(topDimensions).toHaveLength(3);
        });

        test('assigns The Navigator for dominant Agentic-Generative', () => {
            const scores = {
                'Agentic-Generative':   { raw: 58, max: 60, percentage: 96 },
                'Cognitive-Narrative':  { raw: 40, max: 60, percentage: 66 },
                'Relational-Connective':{ raw: 38, max: 60, percentage: 63 },
                'Emotional-Adaptive':   { raw: 35, max: 60, percentage: 58 },
                'Spiritual-Reflective': { raw: 30, max: 60, percentage: 50 },
                'Somatic-Regulative':   { raw: 28, max: 60, percentage: 46 },
            };
            const { archetype } = assignArchetype(scores);
            expect(archetype.name).toBe('The Navigator');
        });
    });

    describe('generateStressResponseProfile', () => {
        test('returns expected structure', () => {
            const { archetype } = assignArchetype(SAMPLE_SCORES_HIGH);
            const profile = generateStressResponseProfile(SAMPLE_SCORES_HIGH, archetype);
            expect(profile).toHaveProperty('overallResilience');
            expect(profile).toHaveProperty('strengthsUnderStress');
            expect(profile).toHaveProperty('vulnerabilitiesUnderStress');
            expect(profile).toHaveProperty('copingStrategies');
            expect(profile).toHaveProperty('groundingTechniques');
            expect(Array.isArray(profile.copingStrategies)).toBe(true);
        });

        test('strengthsUnderStress contains high-scoring dimensions', () => {
            const { archetype } = assignArchetype(SAMPLE_SCORES_HIGH);
            const profile = generateStressResponseProfile(SAMPLE_SCORES_HIGH, archetype);
            expect(profile.strengthsUnderStress).toContain('Cognitive-Narrative');
        });
    });
});

// ── reportService comprehensive report tests ─────────────────────────────────

describe('buildComprehensiveReport', () => {
    let report;

    beforeAll(() => {
        report = buildComprehensiveReport({
            userId: 'test-user-123',
            overall: 73,
            dominantType: 'Cognitive-Narrative',
            scores: SAMPLE_SCORES_HIGH,
        });
    });

    test('returns report with all top-level fields', () => {
        expect(report).toHaveProperty('userId', 'test-user-123');
        expect(report).toHaveProperty('overall', 73);
        expect(report).toHaveProperty('dominantType', 'Cognitive-Narrative');
        expect(report).toHaveProperty('executiveSummary');
        expect(report).toHaveProperty('dimensionAnalysis');
        expect(report).toHaveProperty('strengthIntegration');
        expect(report).toHaveProperty('stressResponse');
        expect(report).toHaveProperty('relationshipInsights');
        expect(report).toHaveProperty('thirtyDayPlan');
        expect(report).toHaveProperty('profileArchetype');
        expect(report).toHaveProperty('profileDescription');
        expect(report).toHaveProperty('topDimensions');
        expect(report).toHaveProperty('recommendedResources');
        expect(report).toHaveProperty('disclaimer');
    });

    test('executiveSummary is a non-empty string', () => {
        expect(typeof report.executiveSummary).toBe('string');
        expect(report.executiveSummary.length).toBeGreaterThan(50);
    });

    test('dimensionAnalysis has entries for all input dimensions', () => {
        for (const dim of Object.keys(SAMPLE_SCORES_HIGH)) {
            expect(report.dimensionAnalysis).toHaveProperty(dim);
        }
    });

    test('each dimensionAnalysis entry has the expected structure', () => {
        for (const [dim, analysis] of Object.entries(report.dimensionAnalysis)) {
            expect(analysis).toHaveProperty('percentage');
            expect(analysis).toHaveProperty('level');
            expect(analysis).toHaveProperty('personalizedInsight');
            expect(analysis).toHaveProperty('strengthsDemonstrated');
            expect(Array.isArray(analysis.strengthsDemonstrated)).toBe(true);
            expect(analysis).toHaveProperty('growthOpportunities');
            expect(analysis).toHaveProperty('dailyMicroPractice');
            expect(analysis).toHaveProperty('weeklyProgression');
            expect(analysis).toHaveProperty('realWorldApplication');
            expect(analysis).toHaveProperty('benchmark');
            expect(analysis.benchmark).toHaveProperty('percentile');
            expect(analysis.benchmark).toHaveProperty('populationMean');
        }
    });

    test('high-scoring dimension gets "high" band insight', () => {
        const cnAnalysis = report.dimensionAnalysis['Cognitive-Narrative'];
        // Score 91.67 → high band
        expect(cnAnalysis.personalizedInsight).toMatch(/mentor|others|help/i);
    });

    test('low-scoring dimension gets "low" band insight', () => {
        const srAnalysis = report.dimensionAnalysis['Somatic-Regulative'];
        // Score 50.0 → mid band (exactly 50)
        expect(typeof srAnalysis.personalizedInsight).toBe('string');
        expect(srAnalysis.personalizedInsight.length).toBeGreaterThan(10);
    });

    test('strengthIntegration has required fields', () => {
        expect(report.strengthIntegration).toHaveProperty('topThreeCombo');
        expect(report.strengthIntegration).toHaveProperty('synergies');
        expect(report.strengthIntegration).toHaveProperty('gaps');
        expect(report.strengthIntegration).toHaveProperty('blueprint');
        expect(Array.isArray(report.strengthIntegration.synergies)).toBe(true);
    });

    test('thirtyDayPlan has all 4 weeks', () => {
        expect(report.thirtyDayPlan).toHaveProperty('week1');
        expect(report.thirtyDayPlan).toHaveProperty('week2');
        expect(report.thirtyDayPlan).toHaveProperty('week3');
        expect(report.thirtyDayPlan).toHaveProperty('week4');
        for (const week of Object.values(report.thirtyDayPlan)) {
            expect(week).toHaveProperty('focus');
            expect(week).toHaveProperty('exercises');
            expect(week).toHaveProperty('affirmation');
        }
    });

    test('recommendedResources has all four resource categories', () => {
        expect(report.recommendedResources).toHaveProperty('workshops');
        expect(report.recommendedResources).toHaveProperty('videos');
        expect(report.recommendedResources).toHaveProperty('practices');
        expect(report.recommendedResources).toHaveProperty('readingMaterials');
        for (const list of Object.values(report.recommendedResources)) {
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBeGreaterThan(0);
        }
    });

    test('assigns correct archetype for The Thinker profile', () => {
        expect(report.profileArchetype).toBe('The Thinker');
    });

    test('handles userId default when not provided', () => {
        const r = buildComprehensiveReport({
            overall: 60,
            dominantType: 'Emotional-Adaptive',
            scores: SAMPLE_SCORES_LOW,
        });
        expect(r.userId).toBe('anonymous');
    });

    test('handles unknown dimension gracefully', () => {
        const scoresWithUnknown = {
            ...SAMPLE_SCORES_HIGH,
            'Unknown-Dimension': { raw: 30, max: 60, percentage: 50 },
        };
        const r = buildComprehensiveReport({
            overall: 70,
            dominantType: 'Cognitive-Narrative',
            scores: scoresWithUnknown,
        });
        expect(r.dimensionAnalysis).toHaveProperty('Unknown-Dimension');
        expect(r.dimensionAnalysis['Unknown-Dimension'].personalizedInsight).toBe('');
    });
});

describe('buildDimensionAnalysis', () => {
    test('high band returns correct level and band insight', () => {
        const analysis = buildDimensionAnalysis('Cognitive-Narrative', { raw: 55, max: 60, percentage: 91.67 });
        expect(analysis.level).toBe('strong');
        expect(analysis.benchmark.percentile).toBeGreaterThanOrEqual(75);
    });

    test('accepts number directly as scoreData', () => {
        const analysis = buildDimensionAnalysis('Emotional-Adaptive', 55);
        expect(analysis.percentage).toBe(55);
        expect(analysis.level).toBe('developing');
    });

    test('returns empty personalizedInsight for unknown dimension', () => {
        const analysis = buildDimensionAnalysis('Not-A-Dimension', 70);
        expect(analysis.personalizedInsight).toBe('');
        expect(analysis.strengthsDemonstrated).toEqual([]);
    });
});

describe('generate30DayPlan', () => {
    test('returns 4-week plan', () => {
        const plan = generate30DayPlan(SAMPLE_SCORES_HIGH);
        expect(plan).toHaveProperty('week1');
        expect(plan).toHaveProperty('week2');
        expect(plan).toHaveProperty('week3');
        expect(plan).toHaveProperty('week4');
    });

    test('week4 always has fixed habit-formation exercises', () => {
        const plan = generate30DayPlan(SAMPLE_SCORES_LOW);
        expect(plan.week4.exercises).toHaveLength(3);
        expect(plan.week4.affirmation).toMatch(/resilient/i);
    });
});

describe('generateStrengthIntegration', () => {
    test('topThreeCombo is a non-empty string', () => {
        const integration = generateStrengthIntegration(SAMPLE_SCORES_HIGH);
        expect(typeof integration.topThreeCombo).toBe('string');
        expect(integration.topThreeCombo.length).toBeGreaterThan(0);
    });

    test('synergies is an array of strings', () => {
        const integration = generateStrengthIntegration(SAMPLE_SCORES_HIGH);
        expect(Array.isArray(integration.synergies)).toBe(true);
        expect(integration.synergies.every((s) => typeof s === 'string')).toBe(true);
    });

    test('gaps references low-scoring dimensions', () => {
        const integration = generateStrengthIntegration(SAMPLE_SCORES_HIGH);
        expect(Array.isArray(integration.gaps)).toBe(true);
        expect(integration.gaps.length).toBeGreaterThan(0);
    });
});

describe('generateRecommendedResources', () => {
    test('returns non-empty resource lists for known dimensions', () => {
        const resources = generateRecommendedResources(SAMPLE_SCORES_LOW);
        expect(resources.workshops.length).toBeGreaterThan(0);
        expect(resources.readingMaterials.length).toBeGreaterThan(0);
    });

    test('deduplicates resources across dimensions', () => {
        const resources = generateRecommendedResources(SAMPLE_SCORES_HIGH);
        const uniqueWorkshops = new Set(resources.workshops);
        expect(uniqueWorkshops.size).toBe(resources.workshops.length);
    });
});
