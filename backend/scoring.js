/**
 * scoring.js
 *
 * Comprehensive 6-type resilience scoring algorithm for the Resilience Atlas
 * 72-question assessment. Questions are grouped into 6 dimensions (12 per dimension):
 *   - Agentic-Generative    (Q1–Q12)
 *   - Relational-Connective (Q13–Q24)
 *   - Spiritual-Reflective  (Q25–Q36)
 *   - Emotional-Adaptive    (Q37–Q48)
 *   - Somatic-Regulative    (Q49–Q60)
 *   - Cognitive-Narrative   (Q61–Q72)
 *
 * Each answer is expected on a scale of 1–5 (1 = Never/Poor, 5 = Always/Excellent).
 * Category scores are normalized to a 0–100 percentage.
 */

// Map question indices (0-based) to resilience dimensions
// Canonical reference: backend/routes/quiz.js RESILIENCE_CATEGORIES
const CATEGORY_MAP = {
    'Agentic-Generative':   [ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11], // Q1–Q12
    'Relational-Connective':[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], // Q13–Q24
    'Spiritual-Reflective': [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35], // Q25–Q36
    'Emotional-Adaptive':   [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47], // Q37–Q48
    'Somatic-Regulative':   [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59], // Q49–Q60
    'Cognitive-Narrative':  [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71], // Q61–Q72
};

const MAX_SCORE_PER_QUESTION = 5;

/**
 * Calculate resilience scores from an array of 72 answers (1–5 each).
 * @param {number[]} answers - Array of 72 numeric answers
 * @returns {Object} - { categories, overall, dominantType }
 */
function calculateResilienceScores(answers) {
    if (!Array.isArray(answers) || answers.length < 72) {
        throw new Error('Expected at least 72 answers.');
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
        'Agentic-Generative':   'Set concrete goals, break challenges into manageable steps, and build a bias toward purposeful action.',
        'Relational-Connective':'Nurture key relationships, practice active listening, and invest in community connections.',
        'Spiritual-Reflective': 'Explore values-based practices such as meditation, gratitude journaling, or community service.',
        'Emotional-Adaptive':   'Practice daily mindfulness, emotion-naming exercises, or reflective journaling to strengthen emotional awareness.',
        'Somatic-Regulative':   'Build a consistent exercise routine, prioritize sleep and recovery, and maintain body-aware habits.',
        'Cognitive-Narrative':  'Engage in cognitive reframing, structured reflection, and storytelling to integrate life experiences constructively.',
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
