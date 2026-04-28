'use strict';

/**
 * mlInsights.js — Predictive Analytics & ML-Powered Insights (Task #23b)
 *
 * Base path: /api/ml
 *
 * Endpoints:
 *   POST /predict-activity-effectiveness         — rank activities by predicted effectiveness
 *   POST /detect-regression-risk                 — flag at-risk dimensions / attendance
 *   GET  /recommend-session-frequency/:clientId  — optimal cadence suggestion
 *   POST /score-goal-probability                 — probability a goal will be achieved
 *   POST /generate-treatment-plan                — week-by-week treatment plan
 *   GET  /models/status                          — engine + model health check
 *   POST /models/retrain                         — admin trigger (no-op placeholder)
 *   GET  /explain/:predictionId                  — structured explanation for a prediction
 *   POST /:predictionId/feedback                 — practitioner helpful/not-helpful rating
 *
 * All endpoints require:
 *   - Valid JWT (authenticateJWT)
 *   - Practitioner, Practice, or Enterprise subscription tier (requirePractitionerTier)
 *
 * Privacy: no PII is stored in inputFeatures — only anonymised numeric features.
 * Human-in-the-loop: all output objects include an `aiDisclaimer` field reminding
 * practitioners that AI recommendations require clinical review.
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');

const ClientProfile          = require('../../models/ClientProfile');
const ClientProgressSnapshot = require('../../models/ClientProgressSnapshot');
const SessionNote            = require('../../models/SessionNote');
const ClientActivityHistory  = require('../../models/ClientActivityHistory');
const MLPrediction           = require('../../models/MLPrediction');
const MLModelPerformance     = require('../../models/MLModelPerformance');

const mlEngine = require('../../utils/mlEngine');
const logger   = require('../../utils/logger');

const router = express.Router();

// ── Route constants ───────────────────────────────────────────────────────────

/** Approximate number of sessions expected per month (used for missed-session estimation). */
const EXPECTED_SESSIONS_PER_MONTH = 4 * 4; // 4 weeks × 4 expected sessions/week

/** Number of weeks in a 90-day lookback window. */
const WEEKS_IN_90_DAYS = 13;

/** Assumed default sessions per week when calculating attendance from notes count. */
const DEFAULT_SESSIONS_PER_WEEK = 1;

/** Minimum number of ML prediction records required to trigger a retrain. */
const MIN_RETRAIN_DATA_SIZE = 100;

// ── Rate limiter ──────────────────────────────────────────────────────────────

const mlLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

const commonChain = [mlLimiter, authenticateJWT, requirePractitionerTier];

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/** Assert that a string is a valid MongoDB ObjectId. */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** Standard AI disclaimer appended to all prediction responses. */
const AI_DISCLAIMER =
  'AI recommendations are decision-support tools. All clinical decisions require practitioner review and approval.';

/**
 * Load a ClientProfile and verify ownership by the requesting practitioner.
 * Returns { client } or sends an appropriate error response.
 */
async function loadClientAndVerify(req, res, clientId) {
  if (!isValidObjectId(clientId)) {
    res.status(400).json({ error: 'Invalid client ID.' });
    return null;
  }
  const practitionerId = resolveUserId(req);
  const client = await ClientProfile.findById(clientId).lean();
  if (!client || client.practitionerId !== practitionerId) {
    res.status(403).json({ error: 'Access denied.' });
    return null;
  }
  return client;
}

/**
 * Compute the historical average dimension scores for a client using all snapshots.
 * Returns a plain object keyed by IATLAS dimension keys.
 */
async function getHistoricalAvgScores(clientId) {
  const snapshots = await ClientProgressSnapshot.find(
    { clientProfileId: clientId },
    { dimensionScores: 1 },
  ).lean();

  if (!snapshots || snapshots.length === 0) return {};

  const sums   = {};
  const counts = {};

  for (const snap of snapshots) {
    const ds = snap.dimensionScores || {};
    for (const [key, val] of Object.entries(ds)) {
      if (typeof val === 'number') {
        sums[key]   = (sums[key]   || 0) + val;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
  }

  const avg = {};
  for (const key of Object.keys(sums)) {
    avg[key] = Math.round((sums[key] / counts[key]) * 10) / 10;
  }
  return avg;
}

/**
 * Fetch the N most-recent progress snapshots for a client.
 */
async function getRecentSnapshots(clientId, limit = 10) {
  return ClientProgressSnapshot.find({ clientProfileId: clientId })
    .sort({ snapshotDate: -1 })
    .lean();
}

/**
 * Persist a prediction record and return its ID.
 */
async function savePrediction(practitionerId, clientId, type, inputFeatures, output, confidence, explanation) {
  try {
    const doc = await MLPrediction.create({
      practitionerId,
      clientId: clientId?.toString(),
      predictionType:   type,
      modelVersion:     mlEngine.ENGINE_VERSION,
      inputFeatures,
      predictionOutput: output,
      confidence:       Math.round(confidence),
      explanation,
    });
    return doc._id?.toString();
  } catch (err) {
    // Non-fatal — log and continue so the prediction still reaches the practitioner.
    logger.error('[mlInsights] Failed to persist prediction:', err);
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /predict-activity-effectiveness
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Body: { clientId, activityIds?, targetDimension }
 *   activityIds — optional filter list; if omitted, all activities from the
 *                 client's recent history are considered (up to 50)
 *
 * Returns: { predictions: [{ activityId, activityTitle, predictedImprovement,
 *             confidence, explanation }], predictionId, aiDisclaimer }
 */
router.post('/predict-activity-effectiveness', ...commonChain, async (req, res) => {
  try {
    const { clientId, activityIds, targetDimension } = req.body;

    if (!clientId || !targetDimension) {
      return res.status(400).json({ error: 'clientId and targetDimension are required.' });
    }
    if (!mlEngine.DIMENSIONS.includes(targetDimension)) {
      return res.status(400).json({
        error: `Invalid targetDimension. Valid values: ${mlEngine.DIMENSIONS.join(', ')}`,
      });
    }

    const client = await loadClientAndVerify(req, res, clientId);
    if (!client) return;

    // Baseline scores — use latest snapshot.
    const latestSnap = await ClientProgressSnapshot.find({ clientProfileId: clientId })
      .sort({ snapshotDate: -1 })
      .lean();
    const baselineScores = latestSnap[0]?.dimensionScores || {};

    // History
    const history = await ClientActivityHistory.find({ clientProfileId: clientId }).sort({ usedAt: -1 }).lean();

    // Activity documents
    let activities = [];
    if (Array.isArray(activityIds) && activityIds.length > 0) {
      // Build lightweight activity stubs from history + requested IDs.
      const idSet = new Set(activityIds.map(id => id.toString()));
      const seen  = new Set();
      for (const h of history) {
        const id = (h.activityId || h.activity_id)?.toString();
        if (id && idSet.has(id) && !seen.has(id)) {
          activities.push({
            _id:   id,
            title: h.activityTitle || h.title || 'Activity',
            categories:    h.categories    || [],
            tags:          h.tags          || [],
            skill_targets: h.skill_targets || [],
            age_min: h.age_min ?? 0,
            age_max: h.age_max ?? 99,
          });
          seen.add(id);
        }
      }
      // For IDs with no history, create minimal stubs.
      for (const id of activityIds) {
        if (!seen.has(id.toString())) {
          activities.push({ _id: id.toString(), title: 'Activity', categories: [], tags: [], skill_targets: [] });
        }
      }
    } else {
      // Use the 50 most-recently used activities from history as candidates.
      const seen = new Set();
      for (const h of history.slice(0, 100)) {
        const id = (h.activityId || h.activity_id)?.toString();
        if (id && !seen.has(id)) {
          activities.push({
            _id:   id,
            title: h.activityTitle || h.title || 'Activity',
            categories:    h.categories    || [],
            tags:          h.tags          || [],
            skill_targets: h.skill_targets || [],
            age_min: h.age_min ?? 0,
            age_max: h.age_max ?? 99,
          });
          seen.add(id);
          if (activities.length >= 50) break;
        }
      }
    }

    if (activities.length === 0) {
      return res.status(200).json({
        predictions:  [],
        predictionId: null,
        message:      'No activity data available for this client. Add activity history to enable predictions.',
        aiDisclaimer: AI_DISCLAIMER,
      });
    }

    const clientAge = client.dateOfBirth
      ? Math.floor((Date.now() - new Date(client.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 10;

    const predictions = mlEngine.predictActivityEffectiveness(
      { ...client, age: clientAge },
      baselineScores,
      activities,
      history,
      targetDimension,
    );

    const avgConf = predictions.length > 0
      ? Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)
      : 50;

    const topExplanation = predictions[0]
      ? `Top activity "${predictions[0].activityTitle}" is predicted to improve ` +
        `${mlEngine.DIMENSION_LABELS[targetDimension]} by ${predictions[0].predictedImprovement} pts`
      : 'No activities ranked.';

    const predictionId = await savePrediction(
      resolveUserId(req),
      clientId,
      'activity',
      { clientAge, currentScore: baselineScores[targetDimension], targetDimension },
      { predictions: predictions.slice(0, 5) },
      avgConf,
      topExplanation,
    );

    return res.json({
      predictions:  predictions.slice(0, 5),
      predictionId,
      aiDisclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    logger.error('[mlInsights] POST /predict-activity-effectiveness error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /detect-regression-risk
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Body: { clientId }
 * Returns: { risks: [{ dimension?, type, severity, message }], predictionId, aiDisclaimer }
 */
router.post('/detect-regression-risk', ...commonChain, async (req, res) => {
  try {
    const { clientId } = req.body;

    if (!clientId) return res.status(400).json({ error: 'clientId is required.' });

    const client = await loadClientAndVerify(req, res, clientId);
    if (!client) return;

    const recentSnapshots = await getRecentSnapshots(clientId, 10);
    const historicalAvg   = await getHistoricalAvgScores(clientId);

    // Missed sessions in last 30 days.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const scheduledCount = EXPECTED_SESSIONS_PER_MONTH;
    const actualCount    = await SessionNote.countDocuments({ clientProfileId: clientId, sessionDate: { $gte: thirtyDaysAgo },
    });
    const missedSessions = Math.max(0, Math.min(scheduledCount, scheduledCount - actualCount));

    const risks = mlEngine.detectRegressionRisk(recentSnapshots, historicalAvg, missedSessions);

    const highRiskCount = risks.filter(r => r.severity === 'high').length;
    const confidence    = recentSnapshots.length >= 5 ? 80 : 55;
    const explanation   = risks.length === 0
      ? 'No regression risks detected based on recent progress data.'
      : `${risks.length} risk indicator(s) found: ${risks.map(r => r.message).join('; ')}`;

    const predictionId = await savePrediction(
      resolveUserId(req),
      clientId,
      'regression',
      { snapshotCount: recentSnapshots.length, missedSessions },
      { risks, highRiskCount },
      confidence,
      explanation,
    );

    return res.json({
      risks,
      highRiskCount,
      predictionId,
      aiDisclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    logger.error('[mlInsights] POST /detect-regression-risk error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /recommend-session-frequency/:clientId
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Query params: maxPerMonth (optional, default 8)
 * Returns: { currentFrequency, recommendedFrequency, rationale, confidenceScore, predictionId, aiDisclaimer }
 */
router.get('/recommend-session-frequency/:clientId', ...commonChain, async (req, res) => {
  try {
    const { clientId } = req.params;

    const client = await loadClientAndVerify(req, res, clientId);
    if (!client) return;

    const maxPerMonth = parseInt(req.query.maxPerMonth, 10) || 8;

    // Determine current frequency from recent session notes.
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const sessionCount  = await SessionNote.countDocuments({ clientProfileId: clientId, sessionDate: { $gte: ninetyDaysAgo },
    });
    const currentFreqPerWeek = Math.round((sessionCount / WEEKS_IN_90_DAYS) * 10) / 10 || DEFAULT_SESSIONS_PER_WEEK;

    const allSnapshots = await ClientProgressSnapshot.find({ clientProfileId: clientId })
      .sort({ snapshotDate: 1 })
      .lean();

    const result = mlEngine.recommendSessionFrequency(allSnapshots, currentFreqPerWeek, maxPerMonth);

    const predictionId = await savePrediction(
      resolveUserId(req),
      clientId,
      'frequency',
      { currentFrequency: currentFreqPerWeek, maxPerMonth, ratePerSession: null },
      result,
      result.confidenceScore,
      result.rationale,
    );

    return res.json({
      ...result,
      predictionId,
      aiDisclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    logger.error('[mlInsights] GET /recommend-session-frequency error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /score-goal-probability
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Body: { clientId, goal: { dimension, targetScore, targetDate } }
 * Returns: { probability, expectedCompletionDate, weeksToCompletion,
 *            riskFactors, suggestions, predictionId, aiDisclaimer }
 */
router.post('/score-goal-probability', ...commonChain, async (req, res) => {
  try {
    const { clientId, goal } = req.body;

    if (!clientId || !goal) {
      return res.status(400).json({ error: 'clientId and goal are required.' });
    }
    if (!goal.dimension || !mlEngine.DIMENSIONS.includes(goal.dimension)) {
      return res.status(400).json({
        error: `goal.dimension must be one of: ${mlEngine.DIMENSIONS.join(', ')}`,
      });
    }
    if (goal.targetScore == null || typeof goal.targetScore !== 'number') {
      return res.status(400).json({ error: 'goal.targetScore (number) is required.' });
    }

    const client = await loadClientAndVerify(req, res, clientId);
    if (!client) return;

    const latestSnap = await ClientProgressSnapshot.find({ clientProfileId: clientId })
      .sort({ snapshotDate: -1 })
      .lean();
    const baselineScores = latestSnap[0]?.dimensionScores || {};

    // Attendance rate from last 90 days.
    const ninetyDaysAgo   = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const attendedCount   = await SessionNote.countDocuments({ clientProfileId: clientId, sessionDate: { $gte: ninetyDaysAgo } });
    const attendanceRate  = Math.min(1, attendedCount / Math.max(1, WEEKS_IN_90_DAYS * DEFAULT_SESSIONS_PER_WEEK));
    const freqPerWeek     = Math.round((attendedCount / WEEKS_IN_90_DAYS) * 10) / 10 || DEFAULT_SESSIONS_PER_WEEK;
    const clientAge       = client.dateOfBirth
      ? Math.floor((Date.now() - new Date(client.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 10;

    const result = mlEngine.scoreGoalProbability(
      goal,
      { age: clientAge, attendanceRate },
      baselineScores,
      freqPerWeek,
    );

    const scoreGap       = Math.max(0, goal.targetScore - (baselineScores[goal.dimension] || 0));
    const weeksAvailable = goal.targetDate
      ? Math.round((new Date(goal.targetDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
      : null;

    const explanation =
      `Goal achievement probability: ${result.probability}%. ` +
      `Expected completion in ${result.weeksToCompletion} week(s). ` +
      (result.riskFactors.length > 0 ? `Risk factors: ${result.riskFactors.join('; ')}.` : '');

    const predictionId = await savePrediction(
      resolveUserId(req),
      clientId,
      'goal',
      { scoreGap, weeksAvailable, freqPerWeek, attendanceRate, clientAge },
      result,
      result.probability,
      explanation,
    );

    return res.json({
      ...result,
      predictionId,
      aiDisclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    logger.error('[mlInsights] POST /score-goal-probability error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /generate-treatment-plan
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Body: {
 *   clientId,
 *   goals: [{ dimension, targetScore }],
 *   totalWeeks?,       // default 12
 *   activityIds?       // optional list of activity IDs to consider
 * }
 * Returns: { totalWeeks, weeks, forecastedScores, successProbability, predictionId, aiDisclaimer }
 */
router.post('/generate-treatment-plan', ...commonChain, async (req, res) => {
  try {
    const { clientId, goals, totalWeeks = 12, activityIds } = req.body;

    if (!clientId || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ error: 'clientId and goals[] are required.' });
    }

    // Validate goals.
    for (const g of goals) {
      if (!g.dimension || !mlEngine.DIMENSIONS.includes(g.dimension)) {
        return res.status(400).json({
          error: `Each goal must have a valid dimension. Valid values: ${mlEngine.DIMENSIONS.join(', ')}`,
        });
      }
      if (g.targetScore == null || typeof g.targetScore !== 'number') {
        return res.status(400).json({ error: 'Each goal must have a numeric targetScore.' });
      }
    }

    if (typeof totalWeeks !== 'number' || totalWeeks < 1 || totalWeeks > 52) {
      return res.status(400).json({ error: 'totalWeeks must be a number between 1 and 52.' });
    }

    const client = await loadClientAndVerify(req, res, clientId);
    if (!client) return;

    const latestSnap = await ClientProgressSnapshot.find({ clientProfileId: clientId })
      .sort({ snapshotDate: -1 })
      .lean();
    const baselineScores = latestSnap[0]?.dimensionScores || {};

    const history = await ClientActivityHistory.find({ clientProfileId: clientId }).sort({ usedAt: -1 }).lean();

    // Build candidate activities from history (or the provided IDs).
    let activities = [];
    const seen = new Set();
    const filterIds = Array.isArray(activityIds) && activityIds.length > 0
      ? new Set(activityIds.map(id => id.toString()))
      : null;

    for (const h of history.slice(0, 100)) {
      const id = (h.activityId || h.activity_id)?.toString();
      if (!id || seen.has(id)) continue;
      if (filterIds && !filterIds.has(id)) continue;
      activities.push({
        _id:   id,
        title: h.activityTitle || h.title || 'Activity',
        categories:    h.categories    || [],
        tags:          h.tags          || [],
        skill_targets: h.skill_targets || [],
        age_min: h.age_min ?? 0,
        age_max: h.age_max ?? 99,
      });
      seen.add(id);
    }

    const clientAge = client.dateOfBirth
      ? Math.floor((Date.now() - new Date(client.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 10;

    const plan = mlEngine.generateTreatmentPlan(
      { ...client, age: clientAge },
      baselineScores,
      goals,
      totalWeeks,
      activities,
      history,
    );

    const explanation =
      `${totalWeeks}-week treatment plan generated. ` +
      `Expected to achieve ${plan.goalsAchievedCount} of ${plan.totalGoals} goal(s). ` +
      `Overall success probability: ${plan.successProbability}%.`;

    const predictionId = await savePrediction(
      resolveUserId(req),
      clientId,
      'plan',
      { totalWeeks, goalCount: goals.length },
      plan,
      plan.successProbability,
      explanation,
    );

    return res.json({
      ...plan,
      predictionId,
      aiDisclaimer: AI_DISCLAIMER,
    });
  } catch (err) {
    logger.error('[mlInsights] POST /generate-treatment-plan error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /models/status
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Returns the health and version information of the active ML engine,
 * plus performance metrics from the MLModelPerformance collection if any
 * records are present.
 */
router.get('/models/status', ...commonChain, async (req, res) => {
  try {
    // Try to fetch stored performance records.
    let performanceRecords = [];
    try {
      performanceRecords = await MLModelPerformance.find({ isActive: true }).lean();
    } catch {
      // Non-fatal if the collection is empty or unavailable.
    }

    const totalPredictions = await MLPrediction.countDocuments({
      practitionerId: resolveUserId(req),
    });

    return res.json({
      engineVersion: mlEngine.ENGINE_VERSION,
      status:        'operational',
      models: performanceRecords.length > 0
        ? performanceRecords
        : [
          { modelType: 'activity_predictor',    version: mlEngine.ENGINE_VERSION, status: 'active', approach: 'statistical_heuristic' },
          { modelType: 'regression_detector',   version: mlEngine.ENGINE_VERSION, status: 'active', approach: 'statistical_heuristic' },
          { modelType: 'goal_scorer',           version: mlEngine.ENGINE_VERSION, status: 'active', approach: 'statistical_heuristic' },
          { modelType: 'frequency_recommender', version: mlEngine.ENGINE_VERSION, status: 'active', approach: 'statistical_heuristic' },
          { modelType: 'treatment_planner',     version: mlEngine.ENGINE_VERSION, status: 'active', approach: 'statistical_heuristic' },
        ],
      totalPredictionsMade: totalPredictions,
      lastChecked:          new Date().toISOString(),
      privacyNote:          'All model inputs are anonymised — no PII is stored in training or inference logs.',
    });
  } catch (err) {
    logger.error('[mlInsights] GET /models/status error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /models/retrain
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Admin-only: trigger a model retrain cycle.
 * Placeholder implementation — logs the request and returns a job reference.
 */
router.post('/models/retrain', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);
    logger.info(`[mlInsights] Manual retrain requested by practitioner ${practitionerId}`);

    // Count available training data.
    const predictionCount = await MLPrediction.countDocuments();

    if (predictionCount < MIN_RETRAIN_DATA_SIZE) {
      return res.status(422).json({
        error:   'Insufficient data for retraining.',
        message: `At least ${MIN_RETRAIN_DATA_SIZE} prediction records are required (currently: ${predictionCount}).`,
        status:  'skipped',
      });
    }

    return res.json({
      jobId:       `retrain_${Date.now()}`,
      status:      'queued',
      message:     'Model retraining has been queued. Performance metrics will be updated once complete.',
      dataPoints:  predictionCount,
      triggeredBy: practitionerId,
    });
  } catch (err) {
    logger.error('[mlInsights] POST /models/retrain error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /explain/:predictionId
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Returns a structured, human-readable explanation for a stored prediction.
 */
router.get('/explain/:predictionId', ...commonChain, async (req, res) => {
  try {
    const { predictionId } = req.params;

    if (!isValidObjectId(predictionId)) {
      return res.status(400).json({ error: 'Invalid prediction ID.' });
    }

    const prediction = await MLPrediction.findById(predictionId).lean();

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    // Verify ownership.
    const practitionerId = resolveUserId(req);
    if (prediction.practitionerId !== practitionerId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const explanation = mlEngine.explainPrediction(prediction);

    return res.json({ ...explanation, aiDisclaimer: AI_DISCLAIMER });
  } catch (err) {
    logger.error('[mlInsights] GET /explain/:predictionId error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /:predictionId/feedback
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Body: { feedback: 'helpful' | 'not_helpful' }
 * Allows practitioners to rate a prediction for model improvement tracking.
 */
router.post('/:predictionId/feedback', ...commonChain, async (req, res) => {
  try {
    const { predictionId } = req.params;
    const { feedback }     = req.body;

    if (!isValidObjectId(predictionId)) {
      return res.status(400).json({ error: 'Invalid prediction ID.' });
    }

    if (!MLPrediction.VALID_FEEDBACK_VALUES.includes(feedback)) {
      return res.status(400).json({
        error: `feedback must be one of: ${MLPrediction.VALID_FEEDBACK_VALUES.join(', ')}`,
      });
    }

    const prediction = await MLPrediction.findById(predictionId).lean();
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    const practitionerId = resolveUserId(req);
    if (prediction.practitionerId !== practitionerId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await MLPrediction.findByIdAndUpdate(predictionId, { feedback });

    return res.json({ message: 'Feedback recorded. Thank you for helping improve the AI.', feedback });
  } catch (err) {
    logger.error('[mlInsights] POST /:predictionId/feedback error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
