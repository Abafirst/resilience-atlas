/**
 * support.js — API client for the IATLAS priority support system.
 *
 * Wraps the backend /api/support/* endpoints.
 * The Auth0 access token is read from the localStorage cache so these
 * helpers can be called outside React component scope.  For components
 * that already have getAccessTokenSilently, pass it via apiFetch directly.
 */

import apiFetch, { getAuth0CachedToken } from '../lib/apiFetch.js';

/**
 * Build a getTokenFn that returns the cached Auth0 token.
 * This lets us call apiFetch the same way as other API helpers.
 */
function cachedTokenFn() {
  return Promise.resolve(getAuth0CachedToken());
}

/**
 * Create a new support ticket.
 *
 * @param {{ category: string, subject: string, description: string, attachments?: string[] }} ticketData
 * @returns {Promise<{ success: boolean, ticket: object, message: string }>}
 */
export async function createSupportTicket(ticketData) {
  const res = await apiFetch(
    '/api/support/tickets',
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(ticketData),
    },
    cachedTokenFn,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create support ticket');
  return data;
}

/**
 * Fetch all support tickets for the authenticated user.
 *
 * @returns {Promise<{ tickets: object[] }>}
 */
export async function fetchUserTickets() {
  const res = await apiFetch('/api/support/tickets', {}, cachedTokenFn);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets');
  return data;
}

/**
 * Fetch a single support ticket by ID.
 *
 * @param {string} ticketId
 * @returns {Promise<{ ticket: object }>}
 */
export async function fetchTicketById(ticketId) {
  const res = await apiFetch(`/api/support/tickets/${ticketId}`, {}, cachedTokenFn);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to fetch ticket');
  return data;
}

/**
 * Add a user reply to an existing support ticket.
 *
 * @param {string}   ticketId
 * @param {string}   message
 * @param {string[]} [attachments=[]]
 * @returns {Promise<{ success: boolean, ticket: object }>}
 */
export async function addTicketReply(ticketId, message, attachments = []) {
  const res = await apiFetch(
    `/api/support/tickets/${ticketId}/reply`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, attachments }),
    },
    cachedTokenFn,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to add reply');
  return data;
}
