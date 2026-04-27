'use strict';

/**
 * mlEngine.js — Statistical / heuristic ML engine for Resilience Atlas.
 *
 * Because a true ML runtime (Python XGBoost, LightGBM, etc.) is not
 * available in the Node.js process, this module implements an evidence-
 * based statistical approximation that produces clinically meaningful
 * results.  All algorithms are deterministic, unit-testable, and designed
 * to be replaced with real model calls once an ML micro-service is deployed.
 *
 * All functions are pure (no side-effects, no I/O) so they can be tested
 * in isolation without a database.
 *
 * Key algorithms:
 *   predictActivityEffectiveness — score each activity against client profile
 *   detectRegressionRisk         — flag dimensions with concerning trends
 *   recommendSessionFrequency    — optimal cadence based on progress rate
 *   scoreGoalProbability         — probability that a goal will be achieved
 *   generateTreatmentPlan        — week-by-week activity plan
 *   explainPrediction            — natural-language explanation for any output
 */

// ── Constants ──────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  'agenticGenerative',
  'relationalConnective',
  'somaticRegulative',
  'cognitiveNarrative',
  'emotionalAdaptive',
  'spiritualExistential',
];

const DIMENSION_LABELS = {
  agenticGenerative:    'Agentic-Generative',
  relationalConnective: 'Relational-Connective',
  somaticRegulative:    'Somatic-Regulative',
  cognitiveNarrative:   'Cognitive-Narrative',
  emotionalAdaptive:    'Emotional-Adaptive',
  spiritualExistential: 'Spiritual-Existential',
};

/** Minimum number of snapshots required to compute trend. */
const MIN_TREND_SNAPSHOTS = 3;

/** Standard-deviation threshold for "sudden drop" detection. */
const SUDDEN_DROP_SD_THRESHOLD = 1.5;

/** Negative slope threshold for "consistent decline" detection. */
const DECLINING_SLOPE_THRESHOLD = -0.3;

/** Engine version exposed in all prediction records. */
const ENGINE_VERSION = '1.0.0';

/** Baseline score below this value is considered "low" — creates high growth potential. */
const LOW_BASELINE_THRESHOLD = 40;

/** Progress rate below this value (pts/session) is considered "slow" — triggers frequency increase suggestion. */
const SLOW_PROGRESS_THRESHOLD = 0.5;

// ── Statistical helpers ────────────────────────────────────────────────────────

/**
 * Arithmetic mean of a numeric array. Returns 0 for empty arrays.
 * @param {number[]} arr
 * @returns {number}
 */
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/**
 * Population standard deviation of a numeric array. Returns 0 for arrays with fewer than 2 elements.
 * @param {number[]} arr
 * @returns {number}
 */
function stdDev(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Least-squares linear regression slope over [y0, y1, y2, …].
 * Returns a positive value for improving trends, negative for declining.
 * @param {number[]} values
 * @returns {number}
 */
function linearSlope(values) {
  const n = values.length;
  if (n < 2) return 0;
  const xs = values.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(values);
  const num   = xs.reduce((s, x, i) => s + (x - mx) * (values[i] - my), 0);
  const denom = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  return denom === 0 ? 0 : num / denom;
}

/**
 * Count how many consecutive values at the end of an array are strictly
 * less than their predecessor (i.e. a declining run).
 * @param {number[]} values
 * @returns {number}
 */
function countConsecutiveDeclines(values) {
  let count = 0;
  for (let i = values.length - 1; i > 0; i--) {
    if (values[i] < values[i - 1]) count++;
    else break;
  }
  return count;
}

/**
 * Clamp a number between min and max.
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// ── 1. Activity Effectiveness Predictor ───────────────────────────────────────

/**
 * Predict the expected score improvement for each activity candidate.
 *
 * The heuristic combines:
 *  - Client's current dimension score (lower baseline → larger expected gain)
 *  - Historical average effectiveness rating for the activity (if any)
 *  - Activity-to-dimension alignment (via category / skill_targets tags)
 *  - Client age alignment
 *
 * @param {object}   client              — ClientProfile document
 * @param {object}   baselineScores      — { dimensionKey: number, … } (0–100)
 * @param {object[]} activities          — array of activity documents
 * @param {object[]} history             — ClientActivityHistory documents
 * @param {string}   targetDimension     — IATLAS dimension key
 * @returns {{ activityId, predictedImprovement, confidence, explanation }[]}
 */
function predictActivityEffectiveness(client, baselineScores, activities, history, targetDimension) {
  const currentScore = (baselineScores && baselineScores[targetDimension]) || 50;

  // Lower baseline → more room for improvement → higher multiplier.
  const headroomFactor = (100 - currentScore) / 100; // 0–1

  const clientAge = client && client.age ? client.age : 10;

  const predictions = activities.map(activity => {
    // ── Base score from headroom ────────────────────────────────────────────
    let base = headroomFactor * 3.0; // max ~3 pts when baseline is 0

    // ── Historical effectiveness boost ────────────────────────────────────
    const actHistory = (history || []).filter(h => {
      const id = h.activityId || h.activity_id;
      return id && id.toString() === activity._id?.toString();
    });
    let avgRating = null;
    if (actHistory.length > 0) {
      const rated = actHistory.filter(h => h.effectivenessRating != null && h.effectivenessRating > 0);
      if (rated.length > 0) {
        avgRating = rated.reduce((s, h) => s + h.effectivenessRating, 0) / rated.length;
        // Rating 1–5 → add 0–1.0 to predicted improvement.
        base += (avgRating - 1) / 4;
      }
    }

    // ── Dimension alignment ────────────────────────────────────────────────
    const dimLabel  = (DIMENSION_LABELS[targetDimension] || '').toLowerCase();
    const actTags   = [
      ...(Array.isArray(activity.categories)   ? activity.categories   : []),
      ...(Array.isArray(activity.tags)          ? activity.tags          : []),
      ...(Array.isArray(activity.skill_targets) ? activity.skill_targets : []),
    ].map(t => t.toLowerCase());

    const dimWord = dimLabel.split('-')[0]; // e.g. "agentic", "emotional"
    const aligned = actTags.some(t => t.includes(dimWord) || dimWord.includes(t));
    if (aligned) base += 0.5;

    // ── Age appropriateness ────────────────────────────────────────────────
    const ageMin = activity.age_min ?? 0;
    const ageMax = activity.age_max ?? 99;
    const ageOk  = clientAge >= ageMin && clientAge <= ageMax;
    if (!ageOk) base *= 0.4; // severe penalty for age mismatch

    // ── Confidence ────────────────────────────────────────────────────────
    let confidence = 50;
    if (actHistory.length >= 3) confidence += 25; // solid history
    else if (actHistory.length >= 1) confidence += 10;
    if (aligned)  confidence += 10;
    if (ageOk)    confidence += 10;
    if (avgRating != null) confidence += 5;
    confidence = clamp(confidence, 10, 95);

    // ── Explanation ────────────────────────────────────────────────────────
    const parts = [];
    if (currentScore < LOW_BASELINE_THRESHOLD)  parts.push(`low baseline in ${DIMENSION_LABELS[targetDimension]} creates high growth potential`);
    if (avgRating != null)   parts.push(`historically rated ${avgRating.toFixed(1)}/5 for this client`);
    if (aligned)             parts.push(`directly targets ${DIMENSION_LABELS[targetDimension]}`);
    if (!ageOk)              parts.push('age range mismatch reduces effectiveness');
    if (actHistory.length === 0) parts.push('limited data — prediction based on client profile only');

    const explanation = parts.length > 0
      ? parts.join('; ')
      : `Estimated improvement based on ${DIMENSION_LABELS[targetDimension]} baseline score`;

    return {
      activityId:           activity._id?.toString() || activity.id,
      activityTitle:        activity.title || 'Unknown activity',
      predictedImprovement: Math.round(clamp(base, 0, 10) * 10) / 10,
      confidence:           confidence,
      explanation,
    };
  });

  // Sort descending by predicted improvement.
  return predictions.sort((a, b) => b.predictedImprovement - a.predictedImprovement);
}

// ── 2. Early Regression Detection ────────────────────────────────────────────

/**
 * Analyse a client's recent progress snapshots and return a list of risk flags.
 *
 * @param {object[]} recentSnapshots — up to 10 most-recent ClientProgressSnapshot docs
 * @param {object}   historicalAvg   — { dimensionKey: number, … } long-term average
 * @param {number}   missedSessions  — count of missed sessions in last 30 days
 * @returns {{ dimension?, type, severity, message }[]}
 */
function detectRegressionRisk(recentSnapshots, historicalAvg, missedSessions) {
  const risks = [];
  if (!recentSnapshots || recentSnapshots.length === 0) return risks;

  for (const dim of DIMENSIONS) {
    const scores = recentSnapshots
      .map(s => {
        const ds = s.dimensionScores || s.scores || {};
        return ds[dim];
      })
      .filter(v => v != null);

    if (scores.length < MIN_TREND_SNAPSHOTS) continue;

    const currentAvg = mean(scores);
    const sd         = stdDev(scores);
    const histAvg    = (historicalAvg && historicalAvg[dim]) || currentAvg;
    const slope      = linearSlope(scores);
    const consDeclines = countConsecutiveDeclines(scores);

    // ── Sudden drop ──────────────────────────────────────────────────────
    if (currentAvg < histAvg - SUDDEN_DROP_SD_THRESHOLD * Math.max(sd, 1)) {
      const delta = Math.abs(currentAvg - histAvg).toFixed(1);
      risks.push({
        dimension: dim,
        type:      'sudden_drop',
        severity:  'high',
        message:   `${DIMENSION_LABELS[dim]} dropped ${delta} points below historical average`,
      });
    }

    // ── Consistent decline ────────────────────────────────────────────────
    if (slope < DECLINING_SLOPE_THRESHOLD) {
      risks.push({
        dimension: dim,
        type:      'declining_trend',
        severity:  'medium',
        message:   `${DIMENSION_LABELS[dim]} has been declining for ${consDeclines} consecutive session(s)`,
      });
    }
  }

  // ── Attendance risk ───────────────────────────────────────────────────────
  if (typeof missedSessions === 'number' && missedSessions > 2) {
    risks.push({
      type:     'attendance',
      severity: 'high',
      message:  `Client missed ${missedSessions} session(s) in the last 30 days`,
    });
  }

  return risks;
}

// ── 3. Optimal Session Frequency Recommender ─────────────────────────────────

/**
 * Recommend an optimal session frequency based on the client's progress rate.
 *
 * @param {object[]} snapshots      — all progress snapshots (oldest first)
 * @param {number}   currentFreqPerWeek — current sessions per week
 * @param {number}   [maxPerMonth=8]    — insurance / budget cap
 * @returns {{ currentFrequency, recommendedFrequency, rationale, confidenceScore }}
 */
function recommendSessionFrequency(snapshots, currentFreqPerWeek, maxPerMonth = 8) {
  const freq    = Math.max(1, currentFreqPerWeek || 1);
  const maxPerW = Math.floor(maxPerMonth / 4); // ~= sessions per week

  if (!snapshots || snapshots.length < 4) {
    return {
      currentFrequency:     freq,
      recommendedFrequency: freq,
      rationale:            'Insufficient data — continue current frequency and reassess after 4+ sessions.',
      confidenceScore:      30,
    };
  }

  // Calculate per-session improvement rates across all dimensions.
  const overallScores = snapshots.map(s => {
    const ds = s.dimensionScores || s.scores || {};
    const vals = DIMENSIONS.map(d => ds[d]).filter(v => v != null);
    return vals.length > 0 ? mean(vals) : null;
  }).filter(v => v != null);

  if (overallScores.length < 2) {
    return {
      currentFrequency:     freq,
      recommendedFrequency: freq,
      rationale:            'Insufficient scoring data for frequency analysis.',
      confidenceScore:      25,
    };
  }

  const totalImprovement = overallScores[overallScores.length - 1] - overallScores[0];
  const ratePerSession   = totalImprovement / (overallScores.length - 1);

  // If progress is slow (below SLOW_PROGRESS_THRESHOLD pt / session) and we have headroom, suggest
  // increasing frequency.
  let recommended = freq;
  let rationale;
  let confidence = 55;

  if (ratePerSession < SLOW_PROGRESS_THRESHOLD && freq < maxPerW) {
    recommended = Math.min(freq + 1, maxPerW);
    rationale   = `Progress rate is ${ratePerSession.toFixed(2)} pts/session — increasing to ${recommended}×/week is expected to accelerate outcomes.`;
    confidence  = 65;
  } else if (ratePerSession > 2.0 && freq > 1) {
    recommended = Math.max(1, freq - 1);
    rationale   = `Excellent progress rate (${ratePerSession.toFixed(2)} pts/session) — current frequency may be reduced without impact.`;
    confidence  = 60;
  } else {
    rationale   = `Progress rate of ${ratePerSession.toFixed(2)} pts/session is on track — current frequency is appropriate.`;
    confidence  = 70;
  }

  return {
    currentFrequency:     freq,
    recommendedFrequency: recommended,
    expectedImprovementDelta: ratePerSession > 0
      ? `+${((recommended / freq - 1) * ratePerSession * 100).toFixed(0)}% faster progress`
      : 'maintain current rate',
    rationale,
    confidenceScore: confidence,
  };
}

// ── 4. Goal Achievement Probability Scorer ────────────────────────────────────

/**
 * Score the probability that a goal will be achieved by its target date.
 *
 * @param {object} goal          — { dimension, targetScore, targetDate }
 * @param {object} clientProfile — { age, attendanceRate (0–1) }
 * @param {object} baselineScores — { dimensionKey: number }
 * @param {number} freqPerWeek   — sessions per week
 * @returns {{ probability, expectedCompletionDate, riskFactors, suggestions }}
 */
function scoreGoalProbability(goal, clientProfile, baselineScores, freqPerWeek) {
  const dim          = goal.dimension;
  const targetScore  = goal.targetScore || 80;
  const targetDate   = goal.targetDate ? new Date(goal.targetDate) : null;
  const currentScore = (baselineScores && baselineScores[dim]) || 50;
  const gap          = Math.max(0, targetScore - currentScore);
  const freq         = Math.max(1, freqPerWeek || 1);
  const attendance   = clamp(clientProfile?.attendanceRate ?? 0.8, 0.1, 1.0);

  // Assume ~0.5 pts improvement per session on average
  const ptPerSession  = 0.5 * attendance;
  const sessionsNeeded = gap / ptPerSession;
  const weeksNeeded    = sessionsNeeded / freq;
  const expectedDate   = new Date(Date.now() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);

  // Base probability
  let probability = 75;

  // Adjust for timeline feasibility
  if (targetDate) {
    const weeksAvailable = (targetDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000);
    const timeRatio      = weeksAvailable / Math.max(1, weeksNeeded);
    if      (timeRatio >= 1.5) probability += 15;
    else if (timeRatio >= 1.0) probability += 5;
    else if (timeRatio >= 0.7) probability -= 10;
    else                       probability -= 25;
  }

  // Age factor (younger clients tend to improve faster)
  if (clientProfile?.age < 12) probability += 5;
  else if (clientProfile?.age > 40) probability -= 5;

  // Attendance factor
  if (attendance > 0.9)  probability += 10;
  else if (attendance < 0.6) probability -= 15;

  // Frequency factor
  if (freq >= 2)  probability += 5;

  probability = clamp(Math.round(probability), 5, 95);

  // Risk factors
  const riskFactors = [];
  if (targetDate) {
    const weeksAvailable = (targetDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000);
    if (weeksAvailable < weeksNeeded * 0.8) {
      riskFactors.push(`Target date may be ambitious — similar goals typically take ${Math.round(weeksNeeded)} weeks`);
    }
  }
  if (attendance < 0.7) riskFactors.push('Low attendance rate reduces progress speed');
  if (gap > 30)         riskFactors.push('Large score gap requires sustained effort over multiple months');

  // Suggestions
  const suggestions = [];
  if (targetDate) {
    const extendedDate = new Date(expectedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const extProb = Math.min(95, probability + 12);
    suggestions.push(`Extend target to ${extendedDate.toISOString().slice(0, 10)} → ~${extProb}% probability`);
  }
  if (freq < 2) {
    suggestions.push(`Increase to 2× sessions/week → ~${Math.min(95, probability + 8)}% probability`);
  }

  return {
    probability,
    expectedCompletionDate: expectedDate.toISOString().slice(0, 10),
    weeksToCompletion:      Math.round(weeksNeeded),
    riskFactors,
    suggestions,
  };
}

// ── 5. Treatment Plan Generator ───────────────────────────────────────────────

/**
 * Generate a week-by-week treatment plan.
 *
 * @param {object}   client        — ClientProfile
 * @param {object}   baselineScores — { dimensionKey: number }
 * @param {object[]} goals         — [{ dimension, targetScore }]
 * @param {number}   totalWeeks    — plan duration (e.g. 12)
 * @param {object[]} activities    — available activity documents
 * @param {object[]} history       — ClientActivityHistory
 * @returns {{ weeks: object[], forecastedScores, successProbability }}
 */
function generateTreatmentPlan(client, baselineScores, goals, totalWeeks, activities, history) {
  const weeks = Math.max(1, totalWeeks || 12);

  // Build priority order — most-deficient dimensions first.
  const dimGaps = DIMENSIONS.map(d => ({
    dim:  d,
    gap:  Math.max(0, (goals.find(g => g.dimension === d)?.targetScore || 0) - ((baselineScores && baselineScores[d]) || 50)),
    base: (baselineScores && baselineScores[d]) || 50,
  }));

  // Only include dimensions with active goals.
  const goalDims = dimGaps
    .filter(dg => goals.some(g => g.dimension === dg.dim))
    .sort((a, b) => b.gap - a.gap);

  if (goalDims.length === 0) {
    return { weeks: [], forecastedScores: {}, successProbability: 0, message: 'No goals provided.' };
  }

  // Assign focus dimensions per phase (3-week blocks).
  const phaseSize = 3;
  const plan      = [];
  const simScores = { ...(baselineScores || {}) };

  // Pre-rank activities by effectiveness prediction per dimension.
  const dimActivityMap = {};
  for (const { dim } of goalDims) {
    const preds = predictActivityEffectiveness(client, baselineScores, activities, history, dim);
    dimActivityMap[dim] = preds.slice(0, 3);
  }

  for (let w = 1; w <= weeks; w++) {
    // Determine focus for this week's phase.
    const phaseIndex = Math.floor((w - 1) / phaseSize);
    const focusDim   = goalDims[phaseIndex % goalDims.length].dim;
    const topActs    = dimActivityMap[focusDim] || [];

    // Simulate improvement: 0.3–0.8 pts/week based on activities available.
    const weeklyGain = topActs.length > 0
      ? mean(topActs.map(a => a.predictedImprovement)) / (weeks / phaseSize)
      : 0.3;
    simScores[focusDim] = Math.min(100, (simScores[focusDim] || 50) + weeklyGain);

    // Identify milestones.
    const milestones = [];
    for (const g of goals) {
      if (g.dimension === focusDim && simScores[focusDim] >= (g.targetScore || 80) * 0.95) {
        milestones.push(`Approaching goal for ${DIMENSION_LABELS[focusDim]}`);
      }
    }

    plan.push({
      week:               w,
      focusDimension:     focusDim,
      focusDimensionLabel: DIMENSION_LABELS[focusDim] || focusDim,
      suggestedActivities: topActs.map(a => ({
        activityId:    a.activityId,
        activityTitle: a.activityTitle,
        predictedGain: a.predictedImprovement,
      })),
      expectedWeeklyGain:  Math.round(weeklyGain * 10) / 10,
      milestones,
    });
  }

  // Goals achieved count.
  const goalsAchieved = goals.filter(g => (simScores[g.dimension] || 0) >= (g.targetScore || 80));
  const successProb   = goals.length > 0
    ? Math.round((goalsAchieved.length / goals.length) * 100)
    : 0;

  return {
    totalWeeks:          weeks,
    weeks:               plan,
    forecastedScores:    simScores,
    goalsAchievedCount:  goalsAchieved.length,
    totalGoals:          goals.length,
    successProbability:  successProb,
  };
}

// ── 6. Prediction Explainer ───────────────────────────────────────────────────

/**
 * Generate a structured, human-readable explanation for a stored prediction.
 *
 * @param {object} predictionDoc — MLPrediction document
 * @returns {object}
 */
function explainPrediction(predictionDoc) {
  const type   = predictionDoc.predictionType;
  const output = predictionDoc.predictionOutput || {};
  const input  = predictionDoc.inputFeatures    || {};

  const baseExplanation = predictionDoc.explanation || 'No explanation available.';

  const featureImportance = [];

  switch (type) {
    case 'activity':
      featureImportance.push(
        { feature: 'Client baseline score',    impact: 'high',   detail: `Current score: ${input.currentScore ?? 'N/A'}` },
        { feature: 'Historical effectiveness', impact: 'medium', detail: 'Based on past activity ratings for this client' },
        { feature: 'Dimension alignment',      impact: 'medium', detail: 'How well activity targets the focus dimension' },
        { feature: 'Age appropriateness',      impact: 'low',    detail: `Client age: ${input.clientAge ?? 'N/A'}` },
      );
      break;

    case 'regression':
      featureImportance.push(
        { feature: 'Score trend slope',        impact: 'high',   detail: 'Linear regression over recent sessions' },
        { feature: 'Standard deviation',       impact: 'medium', detail: 'Variability of recent scores' },
        { feature: 'Attendance rate',          impact: 'high',   detail: `Missed sessions: ${input.missedSessions ?? 0}` },
      );
      break;

    case 'goal':
      featureImportance.push(
        { feature: 'Score gap to target',      impact: 'high',   detail: `Gap: ${input.scoreGap ?? 'N/A'} points` },
        { feature: 'Time to target date',      impact: 'high',   detail: `Weeks available: ${input.weeksAvailable ?? 'N/A'}` },
        { feature: 'Session frequency',        impact: 'medium', detail: `${input.freqPerWeek ?? 1}×/week` },
        { feature: 'Attendance rate',          impact: 'medium', detail: `${Math.round((input.attendanceRate ?? 0.8) * 100)}%` },
      );
      break;

    case 'frequency':
      featureImportance.push(
        { feature: 'Progress rate per session', impact: 'high',  detail: `${input.ratePerSession ?? 'N/A'} pts/session` },
        { feature: 'Current frequency',         impact: 'high',  detail: `${input.currentFrequency ?? 1}×/week` },
        { feature: 'Budget / session cap',      impact: 'low',   detail: `Max ${input.maxPerMonth ?? 8}/month` },
      );
      break;

    case 'plan':
      featureImportance.push(
        { feature: 'Dimension gaps',            impact: 'high',  detail: 'Dimensions furthest from target are prioritised' },
        { feature: 'Activity effectiveness',    impact: 'high',  detail: 'Top-ranked activities per dimension phase' },
        { feature: 'Timeline',                  impact: 'medium', detail: `${input.totalWeeks ?? 12}-week plan` },
      );
      break;

    default:
      featureImportance.push({ feature: 'Unknown prediction type', impact: 'unknown', detail: '' });
  }

  return {
    predictionId:     predictionDoc._id?.toString() || predictionDoc.id,
    predictionType:   type,
    confidence:       predictionDoc.confidence,
    explanation:      baseExplanation,
    featureImportance,
    modelVersion:     predictionDoc.modelVersion || ENGINE_VERSION,
    humanInTheLoop:   'All AI recommendations require practitioner review before application.',
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  ENGINE_VERSION,
  DIMENSIONS,
  DIMENSION_LABELS,
  // Statistical helpers (exposed for unit tests)
  mean,
  stdDev,
  linearSlope,
  countConsecutiveDeclines,
  // Core prediction functions
  predictActivityEffectiveness,
  detectRegressionRisk,
  recommendSessionFrequency,
  scoreGoalProbability,
  generateTreatmentPlan,
  explainPrediction,
};
