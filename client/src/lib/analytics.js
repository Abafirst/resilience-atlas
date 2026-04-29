/**
 * analytics.js
 * Analytics wrapper for tracking user events.
 * Supports Mixpanel, Google Analytics, and PostHog.
 *
 * Enable analytics by setting VITE_ANALYTICS_ENABLED=true in your environment.
 * When disabled (default in development), events are logged to the console.
 */

const ANALYTICS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';

/**
 * Track an event with optional properties.
 *
 * @param {string} eventName - Name of the event (e.g. 'Practice Created')
 * @param {Object} [properties={}] - Key/value pairs describing the event
 */
export function track(eventName, properties = {}) {
  if (!ANALYTICS_ENABLED) {
    console.log('[Analytics]', eventName, properties);
    return;
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(eventName, properties);
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }

  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties);
  }
}

/**
 * Identify a user for person-level analytics.
 *
 * @param {string} userId - Unique user identifier (e.g. Auth0 sub)
 * @param {Object} [traits={}] - User properties (name, email, tier, etc.)
 */
export function identify(userId, traits = {}) {
  if (!ANALYTICS_ENABLED) {
    console.log('[Analytics] Identify:', userId, traits);
    return;
  }

  if (window.mixpanel) {
    window.mixpanel.identify(userId);
    window.mixpanel.people.set(traits);
  }

  if (window.posthog) {
    window.posthog.identify(userId, traits);
  }
}
