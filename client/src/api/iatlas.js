/**
 * iatlas.js — IATLAS subscription API client functions.
 *
 * All functions require a valid Auth0/JWT bearer token.
 */

import { apiUrl } from './baseUrl.js';

/**
 * Create an IATLAS subscription Stripe Checkout Session.
 *
 * @param {string} token - Bearer auth token
 * @param {string} tier  - One of: individual, family, complete, practitioner, practice
 * @returns {Promise<{ sessionId: string, url: string }>}
 */
export async function createIATLASSubscription(token, tier) {
    const response = await fetch(apiUrl('/api/iatlas/subscribe'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create subscription.');
    }

    return response.json();
}

/**
 * Get the current IATLAS subscription status for the authenticated user.
 *
 * @param {string} token - Bearer auth token
 * @returns {Promise<{ tier: string, status: string, currentPeriodEnd?: Date, cancelAtPeriodEnd?: boolean }>}
 */
export async function getIATLASSubscriptionStatus(token) {
    const response = await fetch(apiUrl('/api/iatlas/subscription-status'), {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get subscription status.');
    }

    return response.json();
}

/**
 * Cancel the IATLAS subscription at the end of the current billing period.
 *
 * @param {string} token - Bearer auth token
 * @returns {Promise<{ message: string, currentPeriodEnd: number }>}
 */
export async function cancelIATLASSubscription(token) {
    const response = await fetch(apiUrl('/api/iatlas/cancel-subscription'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to cancel subscription.');
    }

    return response.json();
}
