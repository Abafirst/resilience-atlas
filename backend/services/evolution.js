'use strict';

/**
 * Evolution tracking engine for The Resilience Atlas.
 *
 * Compares the most recent assessment with the previous one and returns
 * change metrics, a compass-direction interpretation, and a human-readable
 * evolution summary.
 *
 * Compass mapping (aligned with the Atlas concept):
 *   North  → Cognitive-Narrative  (cognitive growth)
 *   East   → Relational-Connective (relational expansion)
 *   South  → Somatic-Regulative   (somatic grounding)
 *   West   → Emotional-Adaptive + Spiritual-Reflective (emotional/spiritual integration)
 *   Agentic-Generative contributes diagonally between North and East (NE axis)
 */

const DIMENSIONS = ['Agentic-Generative', 'Relational-Connective', 'Spiritual-Reflective', 'Emotional-Adaptive', 'Somatic-Regulative', 'Cognitive-Narrative'];

const DIRECTION_DESCRIPTIONS = {
    N:  'Your compass points North — indicating growth in cognitive and narrative resilience.',
    NE: 'Your compass points Northeast — reflecting growth in both cognitive and relational dimensions.',
    E:  'Your compass points East — highlighting expansion in relational and connective resilience.',
    SE: 'Your compass points Southeast — suggesting development in relational and somatic areas.',
    S:  'Your compass points South — indicating grounding in somatic and regulative resilience.',
    SW: 'Your compass points Southwest — reflecting integration of somatic and emotional resilience.',
    W:  'Your compass points West — indicating deepening of emotional and spiritual resilience.',
    NW: 'Your compass points Northwest — reflecting integration of emotional and cognitive growth.',
};

/**
 * Map an angle (degrees, 0 = North, clockwise) to an 8-point compass bearing.
 *
 * @param {number} deg - Angle in degrees (0 = North, 90 = East)
 * @returns {string} One of: N, NE, E, SE, S, SW, W, NW
 */
function angleToBearing(deg) {
    const normalized = ((deg % 360) + 360) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
}

/**
 * Calculate the compass direction and magnitude of change.
 *
 * Axes:
 *   N-S: Cognitive-Narrative improvement (N) vs Somatic-Regulative improvement (S)
 *   E-W: Relational-Connective improvement (E) vs Emotional-Adaptive+Spiritual-Reflective improvement (W)
 *
 * @param {Object} changes - Per-dimension change values
 * @returns {{ primary: string, magnitude: number }}
 */
function calculateDirection(changes) {
    // North-South axis: positive = Cognitive-Narrative (North), negative = Somatic-Regulative (South)
    const northward = (changes['Cognitive-Narrative'] || 0) - (changes['Somatic-Regulative'] || 0);

    // East-West axis: positive = Relational-Connective (East), negative = Emotional-Adaptive+Spiritual-Reflective (West)
    const eastward = (changes['Relational-Connective'] || 0) - ((changes['Emotional-Adaptive'] || 0) + (changes['Spiritual-Reflective'] || 0));

    const magnitude = Math.sqrt(northward ** 2 + eastward ** 2);

    if (magnitude < 0.5) {
        return { primary: 'N', magnitude: 0 };
    }

    // atan2 gives angle where East = 0, North = π/2.
    // We convert to compass bearing: North = 0, East = 90 (clockwise).
    const radians = Math.atan2(eastward, northward);
    const degrees = 90 - (radians * 180) / Math.PI;

    // Normalize magnitude to a 0–10 scale (assuming max ~50-point change)
    const normalizedMagnitude = Math.min(10, Math.round((magnitude / 50) * 10));

    return {
        primary: angleToBearing(degrees),
        magnitude: normalizedMagnitude,
    };
}

/**
 * Generate a human-readable interpretation of the evolution.
 *
 * @param {number} overallChange - Change in overall score
 * @param {Object} changes       - Per-dimension changes
 * @param {{ primary: string, magnitude: number }} direction - Compass direction
 * @returns {string}
 */
function generateInterpretation(overallChange, changes, direction) {
    const allZero = DIMENSIONS.every((d) => changes[d] === 0);
    if (allZero) {
        return (
            'Your resilience profile remains stable since your last assessment. ' +
            'Consistency may suggest your current practices are well-anchored.'
        );
    }

    const improved = DIMENSIONS.filter((d) => changes[d] > 0);
    const declined = DIMENSIONS.filter((d) => changes[d] < 0);

    let text = '';

    if (overallChange > 0) {
        text += `Your overall resilience has grown by ${overallChange} points since your last assessment, which may suggest meaningful progress in your resilience journey. `;
    } else if (overallChange < 0) {
        text += `Your overall resilience has shifted by ${Math.abs(overallChange)} points. Fluctuations can often indicate areas of active exploration and growth. `;
    } else {
        text += 'Your overall resilience score is similar to your previous assessment. ';
    }

    if (improved.length > 0) {
        text += `Dimensions showing growth include: ${improved.join(', ')}. `;
    }

    if (declined.length > 0) {
        text += `Areas for continued attention include: ${declined.join(', ')}. `;
    }

    const dirDesc = DIRECTION_DESCRIPTIONS[direction.primary] || '';
    if (dirDesc) {
        text += dirDesc;
    }

    return text.trim();
}

/**
 * Compare the current assessment with the previous one and return evolution data.
 *
 * @param {Object} current - Current assessment: { categories, overall, dominantType }
 *   current.categories must be { 'Agentic-Generative', 'Relational-Connective', 'Spiritual-Reflective',
 *                                 'Emotional-Adaptive', 'Somatic-Regulative', 'Cognitive-Narrative' }
 * @param {Object|null} previous - Previous ResilienceAssessment document (or null if first)
 * @returns {Object} Evolution data
 */
function calculateEvolution(current, previous) {
    if (!previous) {
        return {
            overallChange: null,
            changes: Object.fromEntries(DIMENSIONS.map((d) => [d, null])),
            direction: { primary: 'N', magnitude: 0 },
            interpretation:
                "You've mapped the first point on The Resilience Atlas\u2122. " +
                'Return in 30 days to see how your resilience evolves.',
            isFirstAssessment: true,
        };
    }

    const prevScores = previous.scores || {};
    const currScores = current.categories || {};

    const changes = {};
    for (const dim of DIMENSIONS) {
        const curr = currScores[dim] ?? 0;
        const prev = prevScores[dim] ?? 0;
        changes[dim] = curr - prev;
    }

    const overallChange = (current.overall ?? 0) - (previous.overall ?? 0);
    const direction = calculateDirection(changes);
    const interpretation = generateInterpretation(overallChange, changes, direction);

    return {
        overallChange,
        changes,
        direction,
        interpretation,
        isFirstAssessment: false,
    };
}

module.exports = { calculateEvolution, calculateDirection, angleToBearing };
