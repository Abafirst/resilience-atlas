/**
 * Analytics wrapper for tracking user events.
 * Supports Mixpanel, Google Analytics (gtag), and PostHog.
 *
 * Set VITE_ANALYTICS_ENABLED=true in your environment to send events
 * to the configured providers. When disabled, events are logged to
 * the console instead (useful during development).
 */

const ANALYTICS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';

/**
 * Track a named event with optional properties.
 *
 * @param {string} eventName - The event name (e.g. 'Practice Created')
 * @param {Object} [properties] - Key/value metadata to attach to the event
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

  // Google Analytics (gtag)
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }

  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, properties);
  }
}

/**
 * Identify the current user so that subsequent events are attributed to them.
 *
 * @param {string} userId - The user's unique ID (e.g. Auth0 sub)
 * @param {Object} [traits] - User-level properties (name, email, tier, etc.)
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
