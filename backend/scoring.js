/**
 * scoring.js
 *
 * Comprehensive 6-type resilience scoring algorithm for the Resilience Atlas
 * 36-question assessment. Questions are grouped into 6 categories:
 *   - Emotional  (Q1–Q10)
 *   - Mental     (Q11–Q20)
 *   - Physical   (Q21–Q31)
 *   - Social     (Q32–Q34) — mapped from General category
 *   - Spiritual  (Q35)     — mapped from General category
 *   - Financial  (Q36)     — mapped from General category
 *
 * Each answer is expected on a scale of 1–5 (1 = Never/Poor, 5 = Always/Excellent).
 * Category scores are normalised to a 0–100 percentage.
 */

// Map question indices (0-based) to resilience categories
const CATEGORY_MAP = {
    emotional:  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],    // Q1-Q10
    mental:     [10, 11, 12, 13, 14, 15, 16, 17, 18, 19], // Q11-Q20
    physical:   [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], // Q21-Q31
    social:     [31, 33],                              // Q32, Q34
    spiritual:  [34],                                  // Q35
    financial:  [35]                                   // Q36
};

const MAX_SCORE_PER_QUESTION = 5;

/**
 * Calculate resilience scores from an array of 36 answers (1–5 each).
 * @param {number[]} answers - Array of 36 numeric answers
 * @returns {Object} - { categories, overall, dominantType }
 */
function calculateResilienceScores(answers) {
    if (!Array.isArray(answers) || answers.length !== 36) {
        throw new Error('Expected exactly 36 answers.');
    }

    const categories = {};
    let totalScore = 0;
    let totalQuestions = 0;

    for (const [category, indices] of Object.entries(CATEGORY_MAP)) {
        const rawScore = indices.reduce((sum, idx) => sum + (Number(answers[idx]) || 0), 0);
        const maxRaw = indices.length * MAX_SCORE_PER_QUESTION;
        const percentage = Math.round((rawScore / maxRaw) * 100);
        categories[category] = percentage;
        totalScore += rawScore;
        totalQuestions += indices.length;
    }

    const overall = Math.round((totalScore / (totalQuestions * MAX_SCORE_PER_QUESTION)) * 100);

    // Dominant type = highest scoring category
    const dominantType = Object.entries(categories).reduce(
        (best, [cat, score]) => (score > best[1] ? [cat, score] : best),
        ['', -1]
    )[0];

    return { categories, overall, dominantType };
}

/**
 * Generate a human-readable resilience report.
 * @param {Object} scores - Output from calculateResilienceScores
 * @returns {Object} - Report object with summary text and structured data
 */
function generateReport(scores) {
    const { categories, overall, dominantType } = scores;

    const levelLabel = (pct) => {
        if (pct >= 85) return 'Excellent';
        if (pct >= 70) return 'Good';
        if (pct >= 50) return 'Moderate';
        if (pct >= 30) return 'Developing';
        return 'Needs Attention';
    };

    const recommendations = {
        emotional:  'Practice daily journaling, mindfulness, or speak with a therapist to strengthen emotional resilience.',
        mental:     'Engage in brain-stimulating activities, set structured goals, and practice cognitive reframing.',
        physical:   'Build a consistent exercise routine, prioritise sleep, and maintain a balanced diet.',
        social:     'Nurture relationships, join community groups, and practise active listening.',
        spiritual:  'Explore values-based practices such as meditation, gratitude journaling, or community service.',
        financial:  'Create a budget, build an emergency fund, and seek financial literacy resources.'
    };

    const level = levelLabel(overall);

    const categoryLines = Object.entries(categories)
        .map(([cat, score]) => `• ${capitalize(cat)}: ${score}% (${levelLabel(score)})`)
        .join('\n');

    const summary =
        `Your overall resilience score is ${overall}% — ${level}.\n\n` +
        `Category breakdown:\n${categoryLines}\n\n` +
        `Your strongest resilience type is ${capitalize(dominantType)}. ` +
        (categories[dominantType] < 70
            ? `There is still room to grow — ${recommendations[dominantType]}`
            : `Keep building on this strength while also developing weaker areas.`);

    return {
        overall,
        dominantType,
        categories,
        level,
        summary
    };
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { calculateResilienceScores, generateReport };
