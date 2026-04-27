'use strict';

/**
 * clientAlerts.js — Generate actionable alerts for practitioners based on
 * client activity, progress trends, and goal health.
 *
 * All functions are pure (no DB access) so they can be unit-tested in
 * isolation and composed with whatever data-fetching layer is preferred.
 */

const { calculateProgressTrend } = require('./progressCalculations');

// ── Types (documented via JSDoc, not enforced at runtime) ─────────────────────

/**
 * @typedef {'no_recent_session'|'declining_progress'|'goal_at_risk'} AlertType
 *
 * @typedef {{
 *   clientId:   string,
 *   alertType:  AlertType,
 *   priority:   'low'|'medium'|'high',
 *   message:    string,
 *   actionUrl?: string,
 * }} ClientAlert
 */

// ── Constants ─────────────────────────────────────────────────────────────────

/** Number of days of inactivity before a "no recent session" alert fires. */
const NO_SESSION_THRESHOLD_DAYS = 14;

/** Number of days since a goal was last updated before it is considered "at risk". */
const GOAL_AT_RISK_DAYS = 30;

// ── Alert generators ──────────────────────────────────────────────────────────

/**
 * Generate a "no recent session" alert if the client hasn't had a session
 * within the threshold window.
 *
 * @param {string}    clientId
 * @param {Date|null} lastSessionDate
 * @returns {ClientAlert|null}
 */
function noRecentSessionAlert(clientId, lastSessionDate) {
  const now     = Date.now();
  const threshold = NO_SESSION_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  const isOverdue = !lastSessionDate ||
    (now - new Date(lastSessionDate).getTime()) > threshold;

  if (!isOverdue) return null;

  const days = lastSessionDate
    ? Math.floor((now - new Date(lastSessionDate).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return {
    clientId,
    alertType: 'no_recent_session',
    priority:  'high',
    message:   days !== null
      ? `No session in ${days} days`
      : `No sessions recorded yet`,
    actionUrl: `/clinical/clients/${clientId}/sessions/new`,
  };
}

/**
 * Generate a "declining progress" alert if the client's progress trend is
 * declining across recent snapshots.
 *
 * @param {string} clientId
 * @param {Array}  progressSnapshots  — array of snapshot objects with `overallScore`
 * @returns {ClientAlert|null}
 */
function decliningProgressAlert(clientId, progressSnapshots) {
  if (!Array.isArray(progressSnapshots) || progressSnapshots.length < 2) return null;

  const trend = calculateProgressTrend(progressSnapshots);
  if (trend !== 'declining') return null;

  return {
    clientId,
    alertType: 'declining_progress',
    priority:  'medium',
    message:   'Progress trend is declining — consider adjusting treatment approach',
    actionUrl: `/clinical/clients/${clientId}/progress`,
  };
}

/**
 * Generate "goal at risk" alerts for active goals that have had no update
 * within the threshold window.
 *
 * @param {string} clientId
 * @param {Array}  goals  — array of goal objects with `status`, `goal` (text), `updatedAt`
 * @returns {ClientAlert[]}
 */
function goalAtRiskAlerts(clientId, goals) {
  if (!Array.isArray(goals)) return [];

  const now       = Date.now();
  const threshold = GOAL_AT_RISK_DAYS * 24 * 60 * 60 * 1000;

  return goals
    .filter(g => g.status === 'active' || g.status === 'in-progress')
    .reduce((acc, goal) => {
      const lastUpdated = goal.updatedAt ? new Date(goal.updatedAt).getTime() : 0;
      if (!lastUpdated || (now - lastUpdated) > threshold) {
        const daysSince = lastUpdated
          ? Math.floor((now - lastUpdated) / (24 * 60 * 60 * 1000))
          : null;

        acc.push({
          clientId,
          alertType: 'goal_at_risk',
          priority:  'low',
          message:   daysSince !== null
            ? `Goal "${goal.goal || 'Unnamed goal'}" has no updates in ${daysSince} days`
            : `Goal "${goal.goal || 'Unnamed goal'}" has never been updated`,
          actionUrl: `/clinical/clients/${clientId}/goals`,
        });
      }
      return acc;
    }, []);
}

/**
 * Aggregate all alert generators for a single client into one array.
 *
 * @param {string}    clientId
 * @param {Date|null} lastSessionDate
 * @param {Array}     progressSnapshots
 * @param {Array}     goals
 * @returns {ClientAlert[]}
 */
function generateClientAlerts(clientId, lastSessionDate, progressSnapshots, goals) {
  const alerts = [];

  const sessionAlert = noRecentSessionAlert(clientId, lastSessionDate);
  if (sessionAlert) alerts.push(sessionAlert);

  const progressAlert = decliningProgressAlert(clientId, progressSnapshots);
  if (progressAlert) alerts.push(progressAlert);

  alerts.push(...goalAtRiskAlerts(clientId, goals));

  return alerts;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  NO_SESSION_THRESHOLD_DAYS,
  GOAL_AT_RISK_DAYS,
  noRecentSessionAlert,
  decliningProgressAlert,
  goalAtRiskAlerts,
  generateClientAlerts,
};
