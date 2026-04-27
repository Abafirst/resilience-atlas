/**
 * clinical.js — API client for IATLAS clinical outcome reports.
 *
 * Wraps the /api/iatlas/clinical/outcome-reports/* endpoints.
 * Pass `getTokenFn` (Auth0 getAccessTokenSilently) to every call.
 */

import { apiUrl } from './baseUrl.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildHeaders(getTokenFn, extra = {}) {
  const headers = { ...extra };
  if (typeof getTokenFn === 'function') {
    try {
      const token = await getTokenFn();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (_) { /* token unavailable — proceed unauthenticated */ }
  }
  return headers;
}

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * List all client progress records for the authenticated practitioner.
 *
 * @param {Function} getTokenFn - Auth0 getAccessTokenSilently
 * @returns {Promise<object[]>}
 */
export async function listClientProgressRecords(getTokenFn) {
  const headers = await buildHeaders(getTokenFn);
  const res = await fetch(apiUrl('/api/iatlas/clinical/outcome-reports'), { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load client progress records.');
  }
  return res.json();
}

/**
 * Create (or upsert) a client progress record.
 *
 * @param {Function} getTokenFn
 * @param {{ clientId: string, baselineAssessment?: object, treatmentGoals?: object[] }} body
 * @returns {Promise<object>}
 */
export async function createClientProgressRecord(getTokenFn, body) {
  const headers = await buildHeaders(getTokenFn, { 'Content-Type': 'application/json' });
  const res = await fetch(apiUrl('/api/iatlas/clinical/outcome-reports'), {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create client progress record.');
  }
  return res.json();
}

/**
 * Fetch raw JSON progress data for a specific client.
 *
 * @param {Function} getTokenFn
 * @param {string}   clientId
 * @returns {Promise<object>}
 */
export async function getClientProgressData(getTokenFn, clientId) {
  const headers = await buildHeaders(getTokenFn);
  const res = await fetch(
    apiUrl(`/api/iatlas/clinical/outcome-reports/${encodeURIComponent(clientId)}/progress`),
    { headers }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load client progress data.');
  }
  return res.json();
}

/**
 * Append a session entry to the client's history.
 *
 * @param {Function} getTokenFn
 * @param {string}   clientId
 * @param {object}   sessionData
 * @returns {Promise<object>}
 */
export async function addClientSession(getTokenFn, clientId, sessionData) {
  const headers = await buildHeaders(getTokenFn, { 'Content-Type': 'application/json' });
  const res = await fetch(
    apiUrl(`/api/iatlas/clinical/outcome-reports/${encodeURIComponent(clientId)}/session`),
    { method: 'PUT', headers, body: JSON.stringify(sessionData) }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to add session entry.');
  }
  return res.json();
}

/**
 * Update treatment goals for a client.
 *
 * @param {Function} getTokenFn
 * @param {string}   clientId
 * @param {object[]} treatmentGoals
 * @returns {Promise<object>}
 */
export async function updateClientGoals(getTokenFn, clientId, treatmentGoals) {
  const headers = await buildHeaders(getTokenFn, { 'Content-Type': 'application/json' });
  const res = await fetch(
    apiUrl(`/api/iatlas/clinical/outcome-reports/${encodeURIComponent(clientId)}/goals`),
    { method: 'PUT', headers, body: JSON.stringify({ treatmentGoals }) }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update treatment goals.');
  }
  return res.json();
}

/**
 * Update a baseline or current dimensional assessment.
 *
 * @param {Function}            getTokenFn
 * @param {string}              clientId
 * @param {'baseline'|'current'} type
 * @param {object}              dimensionScores
 * @param {Date|string}         [date]
 * @returns {Promise<object>}
 */
export async function updateClientAssessment(getTokenFn, clientId, type, dimensionScores, date) {
  const headers = await buildHeaders(getTokenFn, { 'Content-Type': 'application/json' });
  const res = await fetch(
    apiUrl(`/api/iatlas/clinical/outcome-reports/${encodeURIComponent(clientId)}/assessment`),
    { method: 'PUT', headers, body: JSON.stringify({ type, dimensionScores, date }) }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to update assessment scores.');
  }
  return res.json();
}

/**
 * Generate and download a PDF outcome report for a client.
 *
 * Fetches the PDF from the backend and triggers a browser download.
 *
 * @param {Function} getTokenFn
 * @param {string}   clientId
 * @returns {Promise<void>}
 */
export async function generateClientOutcomeReport(getTokenFn, clientId) {
  const headers = await buildHeaders(getTokenFn);
  const res = await fetch(
    apiUrl(`/api/iatlas/clinical/outcome-reports/${encodeURIComponent(clientId)}`),
    { headers }
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to generate outcome report.');
  }

  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `client-outcome-report-${clientId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
