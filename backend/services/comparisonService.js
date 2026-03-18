'use strict';

/**
 * comparisonService.js
 *
 * Generates analysis objects for resilience profile comparisons:
 *   - Synergies     : dimensions where both participants score high
 *   - Complementarities : dimensions that offset each other
 *   - Gaps          : dimensions where both participants score low
 *   - Team score    : combined strength rating
 *   - Recommendations : actionable collaboration / growth suggestions
 *
 * Also handles growth-tracking helpers for historical comparisons.
 */

const DIMENSIONS = ['emotional', 'mental', 'physical', 'social', 'spiritual', 'financial'];

const DIMENSION_LABELS = {
    emotional:  'Emotional Resilience',
    mental:     'Mental Resilience',
    physical:   'Physical Resilience',
    social:     'Social Resilience',
    spiritual:  'Spiritual Resilience',
    financial:  'Financial Resilience',
};

// Thresholds
const HIGH_THRESHOLD   = 70;  // ≥ 70 → strength
const LOW_THRESHOLD    = 45;  // ≤ 45 → growth area

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Capitalise the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
function cap(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Normalise a scores object to plain percentages (0–100).
 * Handles both {percentage, raw, max} objects and plain numbers.
 *
 * @param {Object} scores
 * @returns {Object} — { emotional, mental, physical, social, spiritual, financial }
 */
function normaliseScores(scores) {
    const out = {};
    for (const dim of DIMENSIONS) {
        const val = scores[dim];
        if (val == null) {
            out[dim] = 0;
        } else if (typeof val === 'object' && val.percentage != null) {
            out[dim] = Number(val.percentage);
        } else {
            out[dim] = Number(val);
        }
    }
    return out;
}

// ── Core analysis ─────────────────────────────────────────────────────────────

/**
 * Analyse two score objects and return a comparisonAnalysis object.
 *
 * @param {Object} scores1  — { emotional, mental, … } (0–100)
 * @param {Object} scores2  — { emotional, mental, … } (0–100)
 * @param {string} [name1='You']
 * @param {string} [name2='Colleague']
 * @returns {Object} comparisonAnalysis
 */
function analyseProfiles(scores1, scores2, name1 = 'You', name2 = 'Colleague') {
    const s1 = normaliseScores(scores1);
    const s2 = normaliseScores(scores2);

    const synergies         = [];
    const complementarities = [];
    const gaps              = [];
    const recommendations   = [];

    for (const dim of DIMENSIONS) {
        const v1 = s1[dim];
        const v2 = s2[dim];
        const label = DIMENSION_LABELS[dim];

        if (v1 >= HIGH_THRESHOLD && v2 >= HIGH_THRESHOLD) {
            synergies.push(
                `Both ${name1} and ${name2} share a strong ${label} (${v1}% / ${v2}%), ` +
                `creating a resilient foundation for collaboration.`
            );
        } else if (v1 >= HIGH_THRESHOLD && v2 < HIGH_THRESHOLD) {
            complementarities.push(
                `${name1}'s ${label} strength (${v1}%) can support ${name2}'s development in this area (${v2}%).`
            );
            recommendations.push(
                `${name1} can mentor ${name2} in ${label} — share strategies and routines.`
            );
        } else if (v2 >= HIGH_THRESHOLD && v1 < HIGH_THRESHOLD) {
            complementarities.push(
                `${name2}'s ${label} strength (${v2}%) can support ${name1}'s development in this area (${v1}%).`
            );
            recommendations.push(
                `Lean on ${name2}'s ${label} strength — ask for strategies and routines you can adopt.`
            );
        } else if (v1 <= LOW_THRESHOLD && v2 <= LOW_THRESHOLD) {
            gaps.push(
                `Both ${name1} and ${name2} have growth potential in ${label} (${v1}% / ${v2}%). ` +
                `Working on this together could create significant gains.`
            );
            recommendations.push(
                `Co-create a ${label} development plan — learning together accelerates progress.`
            );
        }
    }

    // Default recommendation if nothing specific
    if (recommendations.length === 0) {
        recommendations.push(
            'Your profiles are well-matched. Schedule a regular check-in to share resilience strategies.'
        );
    }

    // Team score: average of both overall scores minus gap penalty
    const overall1 = DIMENSIONS.reduce((sum, d) => sum + s1[d], 0) / DIMENSIONS.length;
    const overall2 = DIMENSIONS.reduce((sum, d) => sum + s2[d], 0) / DIMENSIONS.length;
    const gapPenalty = gaps.length * 2;
    const teamScore  = Math.min(100, Math.round((overall1 + overall2) / 2 + synergies.length * 3 - gapPenalty));

    return { synergies, complementarities, gaps, teamScore, recommendations };
}

// ── Growth tracking ───────────────────────────────────────────────────────────

/**
 * Calculate dimension-by-dimension growth between two assessments.
 *
 * @param {Object} currentScores   — { emotional, mental, … }
 * @param {Object} previousScores  — { emotional, mental, … }
 * @returns {Object} growth report
 */
function calculateGrowth(currentScores, previousScores) {
    const current  = normaliseScores(currentScores);
    const previous = normaliseScores(previousScores);

    const dimensionTrends = {};
    let totalDelta = 0;

    for (const dim of DIMENSIONS) {
        const delta = current[dim] - previous[dim];
        totalDelta += delta;
        dimensionTrends[dim] = {
            current:  current[dim],
            previous: previous[dim],
            delta,
            pctChange: previous[dim] > 0
                ? Math.round((delta / previous[dim]) * 100)
                : 0,
            direction: delta > 0 ? 'improved' : delta < 0 ? 'declined' : 'stable',
        };
    }

    const overallTrend = Math.round(totalDelta / DIMENSIONS.length);

    const milestones = [];
    for (const dim of DIMENSIONS) {
        const t = dimensionTrends[dim];
        if (t.delta >= 10) {
            milestones.push(`Significant improvement in ${DIMENSION_LABELS[dim]} (+${t.delta}%)`);
        } else if (t.current >= HIGH_THRESHOLD && t.previous < HIGH_THRESHOLD) {
            milestones.push(`Reached strength level in ${DIMENSION_LABELS[dim]}!`);
        }
    }

    const recommendations = [];
    for (const dim of DIMENSIONS) {
        const t = dimensionTrends[dim];
        if (t.current <= LOW_THRESHOLD) {
            recommendations.push(
                `Continue focusing on ${DIMENSION_LABELS[dim]} — currently at ${t.current}%.`
            );
        } else if (t.direction === 'declined') {
            recommendations.push(
                `${DIMENSION_LABELS[dim]} declined by ${Math.abs(t.delta)}% — consider revisiting practices.`
            );
        }
    }

    return {
        overallTrend,
        dimensionTrends,
        milestones,
        recommendations,
    };
}

/**
 * Build a full growth history report for a series of assessments (sorted
 * oldest-first).
 *
 * @param {Array<{date, scores, overall, _id}>} history
 * @returns {Object}
 */
function buildGrowthReport(history) {
    if (!history || history.length === 0) {
        return { overallTrend: 0, dimensionTrends: {}, milestones: [], recommendations: [] };
    }

    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sorted.length === 1) {
        return {
            overallTrend: 0,
            dimensionTrends: {},
            milestones: ['Completed your first assessment — this is your baseline!'],
            recommendations: ['Retake the assessment in 90 days to measure your growth.'],
        };
    }

    const first  = sorted[0];
    const latest = sorted[sorted.length - 1];

    const growth = calculateGrowth(latest.scores, first.scores);

    // Annotate each checkpoint with delta from previous
    const checkpoints = sorted.map((item, i) => ({
        date:    item.date,
        overall: item.overall,
        scores:  normaliseScores(item.scores),
        deltaFromPrev: i === 0 ? null : (() => {
            const prev = sorted[i - 1];
            const curr = item;
            const prevNorm = normaliseScores(prev.scores);
            const currNorm = normaliseScores(curr.scores);
            return DIMENSIONS.reduce((acc, d) => {
                acc[d] = currNorm[d] - prevNorm[d];
                return acc;
            }, {});
        })(),
    }));

    return { ...growth, checkpoints };
}

module.exports = {
    analyseProfiles,
    calculateGrowth,
    buildGrowthReport,
    normaliseScores,
    DIMENSIONS,
    DIMENSION_LABELS,
};
