/**
 * mlService.js — Authenticated API wrapper for ML endpoints (Task #23b)
 *
 * All functions accept an optional `getTokenFn` parameter (Auth0's
 * getAccessTokenSilently), forwarded to apiFetch so that every request
 * carries a valid Bearer token.
 *
 * Base path: /api/ml
 */

import { apiFetch } from '../lib/apiFetch.js';

// ── Error class ───────────────────────────────────────────────────────────────

export class MLServiceError extends Error {
  constructor(status, body) {
    super((body && body.error) || 'AI service error');
    this.status    = status;
    this.body      = body;
    this.upgradable = !!(body && body.upgrade === true);
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function mlFetch(url, options = {}, getTokenFn) {
  const res = await apiFetch(url, options, getTokenFn);
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* ignore parse errors */ }
    throw new MLServiceError(res.status, body);
  }
  return res.json();
}

// ── Error handler ─────────────────────────────────────────────────────────────

/**
 * Convert an MLServiceError into a user-friendly message object.
 *
 * @param {MLServiceError|Error} err
 * @returns {{ message: string, upgradeButton?: boolean, upgradeTo?: string }}
 */
export function handleMLError(err) {
  if (!(err instanceof MLServiceError)) {
    return { message: 'AI service temporarily unavailable. Please try again later.' };
  }

  switch (err.status) {
    case 401:
      return { message: 'Please log in to access AI insights.' };

    case 403:
      if (err.upgradable) {
        return {
          message:       '🔒 Upgrade to Practitioner tier to unlock AI-powered insights.',
          upgradeButton: true,
          upgradeTo:     'practitioner',
        };
      }
      return { message: "You don't have access to this client." };

    case 404:
      return { message: 'Client or prediction not found.' };

    case 422: {
      const details = err.body?.details || err.body?.message || err.message;
      return { message: `Invalid request: ${details}` };
    }

    default:
      return { message: 'AI service temporarily unavailable. Please try again later.' };
  }
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Rank activities by predicted score improvement for the given client + dimension.
 *
 * @param {string}   clientId         - MongoDB ObjectId string
 * @param {string}   targetDimension  - One of mlEngine.DIMENSIONS
 * @param {string[]} [activityIds]    - Optional subset of activity IDs to rank
 * @param {Function} [getTokenFn]     - Auth0 getAccessTokenSilently
 */
export async function predictActivityEffectiveness(clientId, targetDimension, activityIds, getTokenFn) {
  return mlFetch('/api/ml/predict-activity-effectiveness', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ clientId, targetDimension, activityIds }),
  }, getTokenFn);
}

/**
 * Detect regression risk signals for the selected client.
 *
 * @param {string}   clientId     - MongoDB ObjectId string
 * @param {Function} [getTokenFn]
 */
export async function detectRegressionRisk(clientId, getTokenFn) {
  return mlFetch('/api/ml/detect-regression-risk', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ clientId }),
  }, getTokenFn);
}

/**
 * Recommend optimal session frequency for a client.
 *
 * @param {string}   clientId       - MongoDB ObjectId string
 * @param {number}   [maxPerMonth]  - Insurance/budget cap
 * @param {Function} [getTokenFn]
 */
export async function recommendSessionFrequency(clientId, maxPerMonth, getTokenFn) {
  const qs = maxPerMonth != null ? `?maxPerMonth=${encodeURIComponent(maxPerMonth)}` : '';
  return mlFetch(`/api/ml/recommend-session-frequency/${encodeURIComponent(clientId)}${qs}`, {}, getTokenFn);
}

/**
 * Score the probability a goal will be achieved by its target date.
 *
 * @param {string}   clientId   - MongoDB ObjectId string
 * @param {object}   goal       - { dimension, targetScore, targetDate, currentScore? }
 * @param {Function} [getTokenFn]
 */
export async function scoreGoalProbability(clientId, goal, getTokenFn) {
  return mlFetch('/api/ml/score-goal-probability', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ clientId, goal }),
  }, getTokenFn);
}

/**
 * Generate a week-by-week AI treatment plan.
 *
 * @param {string}   clientId     - MongoDB ObjectId string
 * @param {object[]} [goals]      - Array of goal objects (optional)
 * @param {number}   [totalWeeks] - Plan duration 1–52 (default: 12)
 * @param {string[]} [activityIds]
 * @param {Function} [getTokenFn]
 */
export async function generateTreatmentPlan(clientId, goals, totalWeeks, activityIds, getTokenFn) {
  return mlFetch('/api/ml/generate-treatment-plan', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ clientId, goals, totalWeeks, activityIds }),
  }, getTokenFn);
}

/**
 * Retrieve ML engine + model health status.
 *
 * @param {Function} [getTokenFn]
 */
export async function getModelStatus(getTokenFn) {
  return mlFetch('/api/ml/models/status', {}, getTokenFn);
}

/**
 * Submit helpful / not-helpful feedback for a prediction.
 *
 * @param {string}   predictionId - _id of the MLPrediction document
 * @param {string}   feedback     - 'helpful' | 'not_helpful'
 * @param {Function} [getTokenFn]
 */
export async function submitFeedback(predictionId, feedback, getTokenFn) {
  return mlFetch(`/api/ml/${encodeURIComponent(predictionId)}/feedback`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ feedback }),
  }, getTokenFn);
}

/**
 * Fetch the practitioner's own client list for the client selector.
 *
 * @param {Function} [getTokenFn]
 * @returns {Promise<{ clients: Array<{_id,firstName,lastName,dateOfBirth,diagnosis}> }>}
 */
export async function fetchClients(getTokenFn) {
  const res = await apiFetch('/api/clinical/clients?limit=200&status=active', {}, getTokenFn);
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* ignore */ }
    throw new MLServiceError(res.status, body);
  }
  return res.json();
}
