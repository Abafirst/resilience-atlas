/**
 * gamificationContent.js — All gamification feature definitions,
 * tier gates, copy, and badge/milestone/achievement data.
 *
 * Terminology:
 *   - "Atlas Starter"   → basic individual tier
 *   - "Atlas Navigator" → enhanced individual tier (lifetime)
 */

// ── Stripe checkout paths (relative) ─────────────────────────────────────────
export const CHECKOUT_URLS = {
  'atlas-starter':   '/checkout?tier=atlas-starter',
  'atlas-navigator': '/checkout?tier=atlas-navigator',
};

// ── Tier helpers ──────────────────────────────────────────────────────────────
export const TIER_DISPLAY = {
  'atlas-starter':   'Atlas Starter',
  'atlas-navigator': 'Atlas Navigator',
};

/** Tiers that include Atlas Starter access (or above). Includes all paid Teams tiers.
 *  Note: legacy short names ('starter', 'pro', 'enterprise') are mapped to canonical
 *  individual tiers by fetchUserTier() before these arrays are consulted. */
const STARTER_AND_ABOVE = [
  'atlas-starter', 'atlas-navigator', 'atlas-premium',
  'teams-starter', 'teams-pro', 'teams-enterprise',
];

/** Tiers that include Atlas Navigator access (or above). Teams Pro and above.
 *  Note: legacy short names are normalized upstream before these arrays are consulted. */
const NAVIGATOR_AND_ABOVE = [
  'atlas-navigator', 'atlas-premium',
  'teams-pro', 'teams-enterprise',
];

/** Returns true when the tier grants Atlas Starter (or above) access. */
export function isStarterOrAbove(tier) {
  return STARTER_AND_ABOVE.includes(tier);
}

/** Returns true when the tier grants Atlas Navigator (or above) access. */
export function isNavigatorOrAbove(tier) {
  return NAVIGATOR_AND_ABOVE.includes(tier);
}

// ── Navigation Milestones (Atlas Starter) ─────────────────────────────────────
export const NAVIGATION_MILESTONES = [
  {
    id: 'first-assessment',
    title: 'First Step Navigator',
    description: 'Complete your first resilience assessment',
    icon: '/icons/compass.svg',
    dimension: null,
  },
  {
    id: 'agentic',
    title: 'Agentic Explorer',
    description: 'Understand your Agentic-Generative dimension',
    icon: '/icons/agentic-generative.svg',
    dimension: 'Agentic-Generative',
  },
  {
    id: 'relational',
    title: 'Relational Connector',
    description: 'Explore your Relational-Connective strengths',
    icon: '/icons/relational-connective.svg',
    dimension: 'Relational-Connective',
  },
  {
    id: 'spiritual',
    title: 'Reflective Wayfinder',
    description: 'Journey through your Spiritual-Reflective landscape',
    icon: '/icons/spiritual-reflective.svg',
    dimension: 'Spiritual-Reflective',
  },
  {
    id: 'emotional',
    title: 'Emotional Adapter',
    description: 'Navigate your Emotional-Adaptive capacity',
    icon: '/icons/emotional-adaptive.svg',
    dimension: 'Emotional-Adaptive',
  },
  {
    id: 'somatic',
    title: 'Somatic Regulator',
    description: 'Map your Somatic-Regulative foundation',
    icon: '/icons/somatic-regulative.svg',
    dimension: 'Somatic-Regulative',
  },
  {
    id: 'cognitive',
    title: 'Narrative Cartographer',
    description: 'Chart your Cognitive-Narrative landscape',
    icon: '/icons/cognitive-narrative.svg',
    dimension: 'Cognitive-Narrative',
  },
];

// ── Resilience Badges ─────────────────────────────────────────────────────────
export const STARTER_BADGES = [
  { id: 'first-navigator', name: 'First Step Navigator', icon: '/icons/compass.svg', rarity: 'common',    tier: 'atlas-starter',   description: 'Complete your first assessment' },
  { id: 'resilience-explorer', name: 'Resilience Explorer', icon: '/icons/growth.svg', rarity: 'common', tier: 'atlas-starter',   description: 'Download your first report' },
  { id: 'dimension-seeker', name: 'Dimension Seeker', icon: '/icons/star.svg', rarity: 'uncommon',     tier: 'atlas-starter',   description: 'Review all 6 resilience dimensions' },
  { id: 'atlas-initiate', name: 'Atlas Initiate', icon: '/icons/badge.svg', rarity: 'uncommon',         tier: 'atlas-starter',   description: 'Join the Resilience Atlas community' },
];

export const NAVIGATOR_BADGES = [
  { id: 'compass-master', name: 'Compass Master', icon: '/icons/compass.svg', rarity: 'rare',             tier: 'atlas-navigator', description: 'Maintain a 7-day Compass Streak' },
  { id: 'atlas-pathfinder', name: 'Atlas Pathfinder', icon: '/icons/game-map.svg', rarity: 'rare',        tier: 'atlas-navigator', description: 'Complete 3 Navigation Pathways' },
  { id: 'navigator-elite', name: 'Navigator Elite', icon: '/icons/star.svg', rarity: 'legendary',       tier: 'atlas-navigator', description: 'Reach the top 10 on the Resilience Map' },
  { id: 'streak-30', name: 'Endurance Voyager', icon: '/icons/streaks.svg', rarity: 'rare',               tier: 'atlas-navigator', description: 'Maintain a 30-day Compass Streak' },
  { id: 'streak-100', name: 'Century Explorer', icon: '/icons/kids-spark.svg', rarity: 'legendary',          tier: 'atlas-navigator', description: 'Maintain a 100-day Compass Streak' },
];

export const ALL_BADGES = [...STARTER_BADGES, ...NAVIGATOR_BADGES];

// ── Navigation Pathways (Atlas Navigator) ─────────────────────────────────────
export const NAVIGATION_PATHWAYS = [
  {
    id: 'agentic-journey',
    title: 'Agentic Power Pathway',
    description: 'A 3-day resilience challenge focused on intentional action and self-direction',
    dimension: 'Agentic-Generative',
    icon: '/icons/agentic-generative.svg',
    days: 3,
    reward: 30,
    difficulty: 'medium',
  },
  {
    id: 'relational-journey',
    title: 'Connection Navigator',
    description: 'Explore relational resilience through daily reflection and connection practices',
    dimension: 'Relational-Connective',
    icon: '/icons/relational-connective.svg',
    days: 3,
    reward: 30,
    difficulty: 'easy',
  },
  {
    id: 'emotional-journey',
    title: 'Emotional Compass',
    description: 'Navigate emotional landscapes with adaptive strategies and daily check-ins',
    dimension: 'Emotional-Adaptive',
    icon: '/icons/emotional-adaptive.svg',
    days: 3,
    reward: 40,
    difficulty: 'medium',
  },
  {
    id: 'somatic-journey',
    title: 'Somatic Grounding Trail',
    description: 'A body-based resilience pathway — grounding practices for daily regulation',
    dimension: 'Somatic-Regulative',
    icon: '/icons/somatic-regulative.svg',
    days: 3,
    reward: 35,
    difficulty: 'easy',
  },
  {
    id: 'cognitive-journey',
    title: 'Narrative Reframe Journey',
    description: 'Rewrite limiting stories and build a resilient cognitive map',
    dimension: 'Cognitive-Narrative',
    icon: '/icons/cognitive-narrative.svg',
    days: 3,
    reward: 40,
    difficulty: 'hard',
  },
  {
    id: 'spiritual-journey',
    title: 'Reflective Wayfinding',
    description: 'A contemplative pathway through meaning, purpose, and inner compass',
    dimension: 'Spiritual-Reflective',
    icon: '/icons/spiritual-reflective.svg',
    days: 3,
    reward: 35,
    difficulty: 'medium',
  },
];

// ── Explorer Achievements (Atlas Navigator) ────────────────────────────────────
export const EXPLORER_ACHIEVEMENTS = [
  {
    id: 'hall-of-fame',
    title: "Explorer's Hall of Fame",
    description: 'Earn a position in the Navigator Rankings by achieving top-tier resilience scores',
    icon: '/icons/kids-trophy.svg',
    rarity: 'legendary',
    requirement: 'Reach top 10 on the Resilience Map',
  },
  {
    id: 'master-cartographer',
    title: 'Master Cartographer',
    description: 'Complete all 6 Navigation Pathways and chart the full resilience landscape',
    icon: '/icons/game-map.svg',
    rarity: 'legendary',
    requirement: 'Complete all Navigation Pathways',
  },
  {
    id: 'resilience-pioneer',
    title: 'Resilience Pioneer',
    description: 'Be among the first to complete all milestones and maintain a 100-day Compass Streak',
    icon: '/icons/star.svg',
    rarity: 'legendary',
    requirement: '100-day Compass Streak + all milestones',
  },
  {
    id: 'compass-sage',
    title: 'Compass Sage',
    description: 'Demonstrate mastery across all 6 resilience dimensions with consistently high scores',
    icon: '/icons/compass.svg',
    rarity: 'rare',
    requirement: 'Score above 75 in all 6 dimensions',
  },
];
