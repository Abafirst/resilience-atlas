'use strict';

/**
 * Pattern-based narrative report generator for The Resilience Atlas.
 *
 * Detects score patterns and generates structured, supportive narrative
 * reports using educational language. Reports are non-diagnostic and
 * avoid deterministic or clinical claims.
 *
 * Safety language:
 *   ✅ "may suggest", "often indicates", "can help strengthen"
 *   ❌ "confirms", "diagnoses", "you will", "guaranteed"
 */

const DIMENSIONS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];

const DIMENSION_LABELS = {
    emotional: 'Emotional',
    mental:    'Mental',
    physical:  'Physical',
    social:    'Social',
    spiritual: 'Spiritual',
    financial: 'Financial',
};

const DIMENSION_DESCRIPTIONS = {
    emotional: 'your ability to recognize and regulate emotions, maintaining balance under pressure',
    mental:    'your cognitive flexibility and capacity to reframe challenges constructively',
    physical:  'your physical well-being, energy management, and somatic awareness',
    social:    'your capacity to build and sustain meaningful connections during difficult times',
    spiritual: 'your sense of meaning, purpose, and connection to values larger than yourself',
    financial: 'your sense of financial security and ability to navigate economic challenges',
};

const DIMENSION_GROWTH_ACTIONS = {
    emotional: 'Explore mindfulness practices, emotion-naming exercises, or reflective journaling to strengthen emotional awareness.',
    mental:    'Engage in cognitive reframing techniques and structured goal-setting to build mental agility.',
    physical:  'Invest in consistent movement, sleep hygiene, and body-awareness practices such as breathwork or yoga.',
    social:    'Schedule regular quality time with your support network and practice active listening and vulnerability.',
    spiritual: 'Explore values clarification, gratitude practices, or community engagement that connects you to a larger purpose.',
    financial: 'Build a clear financial plan, establish an emergency fund, and engage with financial literacy resources.',
};

const LEVEL_KEYS = {
    excellent:  (s) => s >= 85,
    good:       (s) => s >= 70,
    moderate:   (s) => s >= 50,
    developing: (s) => s >= 30,
    attention:  ()  => true,
};

const LEVEL_LABELS = {
    excellent:  'Excellent',
    good:       'Good',
    moderate:   'Moderate',
    developing: 'Developing',
    attention:  'Needs Attention',
};

function getLevel(score) {
    for (const [key, test] of Object.entries(LEVEL_KEYS)) {
        if (test(score)) return key;
    }
    return 'attention';
}

// ── Pattern detection ─────────────────────────────────────────────────────────

/**
 * Detect resilience score patterns for richer narrative interpretation.
 *
 * @param {Object} scores    - Category scores { emotional, mental, ... }
 * @param {Object|null} evolution - Evolution data from evolution.js
 * @returns {string[]} List of detected pattern keys
 */
function detectPatterns(scores, evolution) {
    const patterns = [];
    const values = DIMENSIONS.map((d) => scores[d] || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sorted = [...values].sort((a, b) => b - a);

    // dominant_high: one dimension > 75 and > 15 points above the next highest
    if (sorted[0] > 75 && sorted[0] - sorted[1] > 15) {
        patterns.push('dominant_high');
    }

    // balanced_profile: all dimensions within 10 points of each other
    if (max - min <= 10) {
        patterns.push('balanced_profile');
    }

    // dual_strength_profile: two or more dimensions above 70
    if (values.filter((v) => v > 70).length >= 2) {
        patterns.push('dual_strength_profile');
    }

    // Evolution-dependent patterns
    if (evolution && !evolution.isFirstAssessment && evolution.changes) {
        const changeValues = DIMENSIONS.map((d) => evolution.changes[d] || 0);

        // growth_gap: large improvement > 15 points in any dimension
        if (changeValues.some((v) => v > 15)) {
            patterns.push('growth_gap');
        }

        // emerging_strength: 5–15 point increase in any dimension
        if (changeValues.some((v) => v >= 5 && v <= 15)) {
            patterns.push('emerging_strength');
        }

        // plateau: no significant change (all within ±5 points)
        if (changeValues.every((v) => Math.abs(v) < 5)) {
            patterns.push('plateau');
        }
    }

    return patterns;
}

// ── Dimension ranking ─────────────────────────────────────────────────────────

/**
 * Rank dimensions by score (descending).
 *
 * @param {Object} scores - Category scores
 * @returns {Array<{ dimension: string, score: number }>}
 */
function rankDimensions(scores) {
    return DIMENSIONS
        .map((d) => ({ dimension: d, score: scores[d] || 0 }))
        .sort((a, b) => b.score - a.score);
}

// ── Report section generators ─────────────────────────────────────────────────

function generateOverview(overall, patterns, dominantType) {
    const level = LEVEL_LABELS[getLevel(overall)];
    let overview =
        `Your overall resilience score of ${overall}% reflects a ${level} level of resilience capacity. `;

    if (patterns.includes('balanced_profile')) {
        overview +=
            'Your profile may suggest a well-integrated resilience foundation, ' +
            'with strengths distributed evenly across multiple dimensions. ';
    } else if (patterns.includes('dominant_high')) {
        const label = DIMENSION_LABELS[dominantType] || dominantType;
        overview +=
            `Your ${label} resilience stands out as a primary resource, ` +
            'and may indicate a distinctive area of strength that can support other areas of your life. ';
    } else if (patterns.includes('dual_strength_profile')) {
        overview +=
            'You appear to draw strength from multiple resilience domains, ' +
            'which often indicates a robust capacity to adapt across varied circumstances. ';
    } else {
        overview +=
            'This assessment offers a window into your unique resilience profile — ' +
            'a starting point for intentional growth and self-discovery. ';
    }

    overview +=
        'This report is provided for personal growth and self-reflection. ' +
        'It is not a clinical assessment.';

    return overview;
}

function generatePrimaryStrength(ranked) {
    const primary = ranked[0];
    const label   = DIMENSION_LABELS[primary.dimension];
    const desc    = DIMENSION_DESCRIPTIONS[primary.dimension];
    const level   = LEVEL_LABELS[getLevel(primary.score)];

    return (
        `Your primary resilience strength is ${label} (${primary.score}%) — ${level} level. ` +
        `This often indicates ${desc}. ` +
        'This dimension may serve as an anchor during challenging times, ' +
        'offering a reliable internal resource you can draw upon.'
    );
}

function generateSecondaryStrength(ranked) {
    const secondary = ranked[1];
    if (!secondary) return '';

    const label = DIMENSION_LABELS[secondary.dimension];
    const desc  = DIMENSION_DESCRIPTIONS[secondary.dimension];

    return (
        `Your secondary strength in ${label} (${secondary.score}%) can help strengthen ` +
        'your resilience across situations. ' +
        `This area reflects ${desc}. ` +
        'Combined with your primary strength, this may suggest a multi-layered capacity ' +
        'to navigate adversity.'
    );
}

function generateEmergingStrength(ranked) {
    const emerging = ranked[ranked.length - 1];
    const label    = DIMENSION_LABELS[emerging.dimension];
    const action   = DIMENSION_GROWTH_ACTIONS[emerging.dimension];

    return (
        `Your ${label} dimension (${emerging.score}%) may represent your most significant ` +
        'growth opportunity. This is not a weakness — it is an invitation to explore an ' +
        'underdeveloped area of your resilience profile. ' +
        action
    );
}

function generateGrowthSuggestions(ranked, patterns) {
    const suggestions = [];

    // Suggest focus on the lowest-scoring dimensions
    const bottom = ranked.slice(-2);
    for (const { dimension } of bottom) {
        suggestions.push(DIMENSION_GROWTH_ACTIONS[dimension]);
    }

    if (patterns.includes('balanced_profile')) {
        suggestions.push(
            'To build on your balanced profile, consider deepening one dimension at a time ' +
            'through targeted practice over 30-day cycles.'
        );
    }

    if (patterns.includes('dominant_high')) {
        suggestions.push(
            'Consider channeling your primary strength to support the development of ' +
            'lower-scoring dimensions — resilience can often transfer across domains.'
        );
    }

    suggestions.push(
        'Retaking this assessment in 30 days can help you track how your resilience ' +
        'evolves over time.'
    );

    return suggestions.slice(0, 4);
}

function generateEvolutionSummary(evolution) {
    if (!evolution || evolution.isFirstAssessment) {
        return (
            "You've mapped the first point on The Resilience Atlas\u2122. " +
            'Each assessment creates a new data point in your personal resilience journey. ' +
            'Return in 30 days to see how your resilience evolves and track your progress.'
        );
    }

    let summary = evolution.interpretation + ' ';

    const { changes } = evolution;
    if (changes) {
        const mostImproved = DIMENSIONS
            .filter((d) => changes[d] !== null && changes[d] > 0)
            .sort((a, b) => (changes[b] || 0) - (changes[a] || 0))[0];

        if (mostImproved) {
            const label = DIMENSION_LABELS[mostImproved];
            summary += `Your ${label} dimension has shown the most notable growth since your last assessment. `;
        }
    }

    summary += 'Continue exploring The Resilience Atlas\u2122 by retaking the assessment in 30 days.';
    return summary;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a complete narrative report based on scores and evolution data.
 *
 * @param {Object} scores       - Category scores { emotional, mental, ... }
 * @param {number} overall      - Overall score (0–100)
 * @param {string} dominantType - Dominant resilience type
 * @param {Object|null} evolution - Evolution data from evolution.js (null = first assessment)
 * @returns {Object} Report with individual sections and a combined fullReport string
 */
function generateNarrativeReport(scores, overall, dominantType, evolution) {
    const ranked          = rankDimensions(scores);
    const patterns        = detectPatterns(scores, evolution);
    const overview        = generateOverview(overall, patterns, dominantType);
    const primaryStrength = generatePrimaryStrength(ranked);
    const secondaryStrength = generateSecondaryStrength(ranked);
    const emergingStrength  = generateEmergingStrength(ranked);
    const growthSuggestions = generateGrowthSuggestions(ranked, patterns);
    const evolutionSummary  = generateEvolutionSummary(evolution);

    const fullReport = [
        '## Overview\n'                  + overview,
        '## Primary Strength\n'          + primaryStrength,
        '## Secondary Strength\n'        + secondaryStrength,
        '## Growth Opportunity\n'        + emergingStrength,
        '## Practical Growth Suggestions\n' +
            growthSuggestions.map((s, i) => `${i + 1}. ${s}`).join('\n'),
        '## Your Resilience Journey\n'   + evolutionSummary,
    ].join('\n\n');

    return {
        overview,
        primaryStrength,
        secondaryStrength,
        emergingStrength,
        growthSuggestions,
        evolutionSummary,
        patterns,
        fullReport,
        disclaimer:
            'This assessment provides insights for personal growth. It is not a clinical assessment.',
    };
}

module.exports = { generateNarrativeReport, detectPatterns, rankDimensions };
