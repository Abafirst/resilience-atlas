/**
 * mlService.js — API client for Predictive Analytics & ML-Powered Insights (Task #23b).
 *
 * Wraps the backend /api/ml/* and /api/clinical/clients endpoints.
 * Auth0 access token is read from the localStorage cache automatically via
 * getAuth0CachedToken(), following the same pattern as other API service modules
 * in this codebase (e.g. client/src/api/support.js).
 */

import apiFetch, { getAuth0CachedToken } from '../lib/apiFetch.js';

// ── Token helper ──────────────────────────────────────────────────────────────

/** Returns a Promise that resolves to the cached Auth0 access token. */
function cachedTokenFn() {
  return Promise.resolve(getAuth0CachedToken());
}

// ── Error mapping ─────────────────────────────────────────────────────────────

/**
 * Parse an error HTTP response into a user-friendly Error object.
 * The returned error includes `.status` (HTTP status code) and, for 403 tier
 * errors, `.isTierUpgrade = true`.
 *
 * @param {Response} res
 * @returns {Promise<Error>}
 */
async function parseErrorResponse(res) {
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    return Object.assign(new Error('Please log in to access AI insights'), { status: 401 });
  }

  if (res.status === 403) {
    const isTier = typeof data.error === 'string' && data.error.toLowerCase().includes('tier');
    return isTier
      ? Object.assign(
          new Error('Upgrade to Practitioner tier to unlock AI-powered insights'),
          { status: 403, isTierUpgrade: true },
        )
      : Object.assign(new Error("You don't have access to this client"), { status: 403 });
  }

  if (res.status === 404) {
    return Object.assign(new Error('Client or prediction not found'), { status: 404 });
  }

  if (res.status === 422) {
    return Object.assign(
      new Error(data.error || 'Validation error. Please check your inputs.'),
      { status: 422 },
    );
  }

  return Object.assign(
    new Error('AI service temporarily unavailable. Please try again.'),
    { status: res.status },
  );
}

// ── Client list ───────────────────────────────────────────────────────────────

/**
 * Fetch the list of active clinical clients for the authenticated practitioner.
 *
 * @returns {Promise<object[]>} Array of ClientProfile objects
 */
export async function fetchClients() {
  const res = await apiFetch(
    '/api/clinical/clients?status=active&limit=100',
    {},
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  const data = await res.json();
  return data.clients || [];
}

// ── ML prediction endpoints ───────────────────────────────────────────────────

/**
 * Predict activity effectiveness for a client and target dimension.
 * POST /api/ml/predict-activity-effectiveness
 *
 * @param {string}   clientId
 * @param {string}   targetDimension  — IATLAS dimension key
 * @param {string[]} [activityIds]    — optional list of activity IDs to consider
 * @returns {Promise<{ predictions: object[], predictionId: string, aiDisclaimer: string }>}
 */
export async function predictActivityEffectiveness(clientId, targetDimension, activityIds) {
  const body = { clientId, targetDimension };
  if (Array.isArray(activityIds) && activityIds.length > 0) body.activityIds = activityIds;

  const res = await apiFetch(
    '/api/ml/predict-activity-effectiveness',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    },
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/**
 * Detect regression risk indicators for a client.
 * POST /api/ml/detect-regression-risk
 *
 * @param {string} clientId
 * @returns {Promise<{ risks: object[], highRiskCount: number, predictionId: string, aiDisclaimer: string }>}
 */
export async function detectRegressionRisk(clientId) {
  const res = await apiFetch(
    '/api/ml/detect-regression-risk',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ clientId }),
    },
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/**
 * Recommend an optimal session frequency for a client.
 * GET /api/ml/recommend-session-frequency/:clientId
 *
 * @param {string} clientId
 * @param {number} [maxPerMonth] — optional cap on sessions per month (default: 8)
 * @returns {Promise<{ currentFrequency: number, recommendedFrequency: number,
 *                     rationale: string, confidenceScore: number,
 *                     expectedImprovementDelta: string, predictionId: string, aiDisclaimer: string }>}
 */
export async function recommendSessionFrequency(clientId, maxPerMonth) {
  const qs  = maxPerMonth ? `?maxPerMonth=${encodeURIComponent(maxPerMonth)}` : '';
  const res = await apiFetch(
    `/api/ml/recommend-session-frequency/${encodeURIComponent(clientId)}${qs}`,
    {},
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/**
 * Score the probability that a goal will be achieved by its target date.
 * POST /api/ml/score-goal-probability
 *
 * @param {string} clientId
 * @param {{ dimension: string, targetScore: number, targetDate?: string }} goal
 * @returns {Promise<{ probability: number, expectedCompletionDate: string,
 *                     weeksToCompletion: number, riskFactors: string[],
 *                     suggestions: string[], predictionId: string, aiDisclaimer: string }>}
 */
export async function scoreGoalProbability(clientId, goal) {
  const res = await apiFetch(
    '/api/ml/score-goal-probability',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ clientId, goal }),
    },
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/**
 * Generate a week-by-week treatment plan for a client.
 * POST /api/ml/generate-treatment-plan
 *
 * @param {string}   clientId
 * @param {{ dimension: string, targetScore: number }[]} goals
 * @param {number}   totalWeeks
 * @param {string[]} [activityIds] — optional list of activity IDs to consider
 * @returns {Promise<{ totalWeeks: number, weeks: object[], forecastedScores: object,
 *                     successProbability: number, predictionId: string, aiDisclaimer: string }>}
 */
export async function generateTreatmentPlan(clientId, goals, totalWeeks, activityIds) {
  const body = { clientId, goals, totalWeeks };
  if (Array.isArray(activityIds) && activityIds.length > 0) body.activityIds = activityIds;

  const res = await apiFetch(
    '/api/ml/generate-treatment-plan',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    },
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/**
 * Fetch ML model health and engine status.
 * GET /api/ml/models/status
 *
 * @returns {Promise<{ engineVersion: string, status: string, models: object[],
 *                     totalPredictionsMade: number, lastChecked: string }>}
 */
export async function getModelStatus() {
  const res = await apiFetch('/api/ml/models/status', {}, cachedTokenFn);
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}

/**
 * Submit practitioner feedback for a prediction.
 * POST /api/ml/:predictionId/feedback
 *
 * @param {string} predictionId
 * @param {'helpful'|'not_helpful'} feedback
 * @returns {Promise<{ message: string, feedback: string }>}
 */
export async function submitFeedback(predictionId, feedback) {
  const res = await apiFetch(
    `/api/ml/${encodeURIComponent(predictionId)}/feedback`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ feedback }),
    },
    cachedTokenFn,
  );
  if (!res.ok) throw await parseErrorResponse(res);
  return res.json();
}
