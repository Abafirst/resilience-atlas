'use strict';

/**
 * activityRecommendations.js
 *
 * Smart activity recommendation algorithm for IATLAS practitioners.
 * Scores each activity against a client profile and returns a sorted list
 * with a relevance_score (0–100) and match_reasons array.
 *
 * Scoring breakdown (max 100):
 *  - Age appropriateness  : required gate (activity excluded if client age out of range)
 *                           +20 pts when in range
 *  - Goal alignment       : up to +30 pts (10 pts per matched goal, capped at 3 goals)
 *  - Sensory preference   : up to +20 pts (10 pts per sensory match)
 *  - Favourite boost      : +15 pts
 *  - Historical rating    : up to +15 pts (rating × 3)
 *  - Recency penalty      : −10 pts when used within the last 7 days
 */

/**
 * @typedef {Object} ClientGoal
 * @property {string} category  — e.g. 'emotional_regulation', 'social_skills'
 * @property {number} [priority] — 1–5 (higher = more important)
 */

/**
 * @typedef {Object} ClientProfile
 * @property {string}       id
 * @property {number}       age
 * @property {ClientGoal[]} goals
 * @property {string[]}     sensory_preferences — e.g. ['tactile', 'visual']
 * @property {string[]}     [diagnosis_tags]
 */

/**
 * @typedef {Object} Activity
 * @property {string}   id
 * @property {string}   title
 * @property {number}   age_min
 * @property {number}   age_max
 * @property {string[]} categories
 * @property {string[]} tags
 * @property {string[]} sensory_types
 * @property {string[]} skill_targets
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {string}  activity_id
 * @property {number|null} effectiveness_rating
 * @property {string}  used_at — ISO-8601 timestamp
 */

// ── Scoring constants ─────────────────────────────────────────────────────────

/** Points added per effectiveness-rating unit (1–5 → 3–15 pts). */
const EFFECTIVENESS_MULTIPLIER = 3;

/** Activities used within this many days receive a recency-variety penalty. */
const RECENCY_PENALTY_DAYS = 7;

/**
 * @typedef {Object} RecommendedActivity
 * @property {number}   relevance_score — 0–100
 * @property {string[]} match_reasons
 * @property {boolean}  is_favorite
 * @property {string|undefined}  last_used_at
 * @property {number|undefined}  avg_effectiveness_rating
 */

/**
 * Calculate a relevance score for a single activity against a client profile.
 *
 * Returns null when the activity falls outside the client's age range so that
 * callers can filter it out easily.
 *
 * @param {Activity}      activity
 * @param {ClientProfile} client
 * @param {string[]}      favorites  — array of activityId strings already favourited
 * @param {HistoryEntry[]} history   — all usage history for this client (any activity)
 * @returns {(Activity & RecommendedActivity)|null}
 */
function calculateRelevanceScore(activity, client, favorites, history) {
  let score = 0;
  const reasons = [];

  // ── Age gate (required) ───────────────────────────────────────────────────
  const ageMin = typeof activity.age_min === 'number' ? activity.age_min : 0;
  const ageMax = typeof activity.age_max === 'number' ? activity.age_max : 999;

  if (client.age < ageMin || client.age > ageMax) {
    return null; // activity is age-inappropriate — exclude entirely
  }
  score += 20;
  reasons.push('age_appropriate');

  // ── Goal alignment (up to 30 pts) ─────────────────────────────────────────
  const goals  = Array.isArray(client.goals) ? client.goals : [];
  const targets = Array.isArray(activity.skill_targets) ? activity.skill_targets : [];
  const cats    = Array.isArray(activity.categories) ? activity.categories : [];
  const tags    = Array.isArray(activity.tags) ? activity.tags : [];

  const allActivityDescriptors = [
    ...targets.map(t => t.toLowerCase()),
    ...cats.map(c => c.toLowerCase()),
    ...tags.map(t => t.toLowerCase()),
  ];

  const matchedGoals = goals.filter(goal => {
    const cat = (goal.category || '').toLowerCase();
    return allActivityDescriptors.some(d => d.includes(cat) || cat.includes(d));
  });

  if (matchedGoals.length > 0) {
    const goalScore = Math.min(30, matchedGoals.length * 10);
    score += goalScore;
    matchedGoals.forEach(g => reasons.push(`matches_goal_${g.category}`));
  }

  // ── Sensory preference match (up to 20 pts) ───────────────────────────────
  const prefs         = Array.isArray(client.sensory_preferences) ? client.sensory_preferences : [];
  const sensoryTypes  = Array.isArray(activity.sensory_types) ? activity.sensory_types : [];
  const sensoryMatches = prefs.filter(p =>
    sensoryTypes.some(s => s.toLowerCase() === p.toLowerCase())
  );

  if (sensoryMatches.length > 0) {
    score += Math.min(20, sensoryMatches.length * 10);
    sensoryMatches.forEach(s => reasons.push(`sensory_${s}_match`));
  }

  // ── Favourite boost (+15 pts) ─────────────────────────────────────────────
  const isFavorite = Array.isArray(favorites) && favorites.includes(activity.id);
  if (isFavorite) {
    score += 15;
    reasons.push('favorited');
  }

  // ── Historical effectiveness (up to +15, −10 for recency) ────────────────
  const actHistory = (Array.isArray(history) ? history : [])
    .filter(h => h.activity_id === activity.id);

  let lastUsedAt;
  let avgEffectiveness;

  if (actHistory.length > 0) {
    // Sort by most recent first.
    const sorted = [...actHistory].sort(
      (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
    );
    lastUsedAt = sorted[0].used_at;

    const rated = sorted.filter(h => h.effectiveness_rating != null && h.effectiveness_rating > 0);
    if (rated.length > 0) {
      avgEffectiveness = rated.reduce((sum, h) => sum + h.effectiveness_rating, 0) / rated.length;
      score += avgEffectiveness * EFFECTIVENESS_MULTIPLIER;
      reasons.push(`previously_effective_${avgEffectiveness.toFixed(1)}`);
    }

    // Recency penalty — encourage variety.
    const daysSince = (Date.now() - new Date(lastUsedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < RECENCY_PENALTY_DAYS) {
      score -= 10;
      reasons.push('recently_used');
    }
  }

  return {
    ...activity,
    relevance_score:         Math.min(100, Math.max(0, Math.round(score))),
    match_reasons:           reasons,
    is_favorite:             isFavorite,
    last_used_at:            lastUsedAt,
    avg_effectiveness_rating: avgEffectiveness,
  };
}

/**
 * Filter and rank an array of activities for a given client.
 *
 * @param {Activity[]}      activities
 * @param {ClientProfile}   client
 * @param {string[]}        favorites
 * @param {HistoryEntry[]}  history
 * @param {object}          [opts]
 * @param {number}          [opts.limit=20]         — max results
 * @param {string}          [opts.category]         — filter by category string
 * @param {boolean}         [opts.excludeRecentlyUsed=false] — omit activities used < 7 days ago
 * @returns {(Activity & RecommendedActivity)[]}
 */
function getRecommendedActivities(activities, client, favorites, history, opts = {}) {
  const {
    limit               = 20,
    category            = null,
    excludeRecentlyUsed = false,
  } = opts;

  const results = [];

  for (const activity of activities) {
    const scored = calculateRelevanceScore(activity, client, favorites, history);
    if (!scored) continue; // age-filtered

    if (category) {
      const cats = Array.isArray(scored.categories) ? scored.categories : [];
      const tags = Array.isArray(scored.tags) ? scored.tags : [];
      const haystack = [...cats, ...tags].map(s => s.toLowerCase());
      if (!haystack.some(s => s.includes(category.toLowerCase()))) continue;
    }

    if (excludeRecentlyUsed && scored.match_reasons.includes('recently_used')) continue;

    results.push(scored);
  }

  // Sort descending by relevance score.
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return results.slice(0, limit);
}

module.exports = { calculateRelevanceScore, getRecommendedActivities };
