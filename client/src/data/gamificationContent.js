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

/** Returns true when the tier grants Atlas Starter (or above) access. */
export function isStarterOrAbove(tier) {
  return ['atlas-starter', 'atlas-navigator', 'atlas-premium'].includes(tier);
}

/** Returns true when the tier grants Atlas Navigator (or above) access. */
export function isNavigatorOrAbove(tier) {
  return ['atlas-navigator', 'atlas-premium'].includes(tier);
}

// ── Navigation Milestones (Atlas Starter) ─────────────────────────────────────
export const NAVIGATION_MILESTONES = [
  {
    id: 'first-assessment',
    title: 'First Step Navigator',
    description: 'Complete your first resilience assessment',
    icon: '🧭',
    dimension: null,
  },
  {
    id: 'agentic',
    title: 'Agentic Explorer',
    description: 'Understand your Agentic-Generative dimension',
    icon: '⚡',
    dimension: 'Agentic-Generative',
  },
  {
    id: 'relational',
    title: 'Relational Connector',
    description: 'Explore your Relational-Connective strengths',
    icon: '🤝',
    dimension: 'Relational-Connective',
  },
  {
    id: 'spiritual',
    title: 'Reflective Wayfinder',
    description: 'Journey through your Spiritual-Reflective landscape',
    icon: '🌟',
    dimension: 'Spiritual-Reflective',
  },
  {
    id: 'emotional',
    title: 'Emotional Adapter',
    description: 'Navigate your Emotional-Adaptive capacity',
    icon: '💚',
    dimension: 'Emotional-Adaptive',
  },
  {
    id: 'somatic',
    title: 'Somatic Regulator',
    description: 'Map your Somatic-Regulative foundation',
    icon: '🌿',
    dimension: 'Somatic-Regulative',
  },
  {
    id: 'cognitive',
    title: 'Narrative Cartographer',
    description: 'Chart your Cognitive-Narrative landscape',
    icon: '🗺️',
    dimension: 'Cognitive-Narrative',
  },
];

// ── Resilience Badges ─────────────────────────────────────────────────────────
export const STARTER_BADGES = [
  { id: 'first-navigator', name: 'First Step Navigator', icon: '🧭', rarity: 'common',    tier: 'atlas-starter',   description: 'Complete your first assessment' },
  { id: 'resilience-explorer', name: 'Resilience Explorer', icon: '🌱', rarity: 'common', tier: 'atlas-starter',   description: 'Download your first report' },
  { id: 'dimension-seeker', name: 'Dimension Seeker', icon: '🔭', rarity: 'uncommon',     tier: 'atlas-starter',   description: 'Review all 6 resilience dimensions' },
  { id: 'atlas-initiate', name: 'Atlas Initiate', icon: '📍', rarity: 'uncommon',         tier: 'atlas-starter',   description: 'Join the Resilience Atlas community' },
];

export const NAVIGATOR_BADGES = [
  { id: 'compass-master', name: 'Compass Master', icon: '🧭', rarity: 'rare',             tier: 'atlas-navigator', description: 'Maintain a 7-day Compass Streak' },
  { id: 'atlas-pathfinder', name: 'Atlas Pathfinder', icon: '🗺️', rarity: 'rare',        tier: 'atlas-navigator', description: 'Complete 3 Navigation Pathways' },
  { id: 'navigator-elite', name: 'Navigator Elite', icon: '⭐', rarity: 'legendary',       tier: 'atlas-navigator', description: 'Reach the top 10 on the Resilience Map' },
  { id: 'streak-30', name: 'Endurance Voyager', icon: '🔥', rarity: 'rare',               tier: 'atlas-navigator', description: 'Maintain a 30-day Compass Streak' },
  { id: 'streak-100', name: 'Century Explorer', icon: '💫', rarity: 'legendary',          tier: 'atlas-navigator', description: 'Maintain a 100-day Compass Streak' },
];

export const ALL_BADGES = [...STARTER_BADGES, ...NAVIGATOR_BADGES];

// ── Navigation Pathways (Atlas Navigator) ─────────────────────────────────────
export const NAVIGATION_PATHWAYS = [
  {
    id: 'agentic-journey',
    title: 'Agentic Power Pathway',
    description: 'A 3-day resilience challenge focused on intentional action and self-direction',
    dimension: 'Agentic-Generative',
    icon: '⚡',
    days: 3,
    reward: 30,
    difficulty: 'medium',
  },
  {
    id: 'relational-journey',
    title: 'Connection Navigator',
    description: 'Explore relational resilience through daily reflection and connection practices',
    dimension: 'Relational-Connective',
    icon: '🤝',
    days: 3,
    reward: 30,
    difficulty: 'easy',
  },
  {
    id: 'emotional-journey',
    title: 'Emotional Compass',
    description: 'Navigate emotional landscapes with adaptive strategies and daily check-ins',
    dimension: 'Emotional-Adaptive',
    icon: '💚',
    days: 3,
    reward: 40,
    difficulty: 'medium',
  },
  {
    id: 'somatic-journey',
    title: 'Somatic Grounding Trail',
    description: 'A body-based resilience pathway — grounding practices for daily regulation',
    dimension: 'Somatic-Regulative',
    icon: '🌿',
    days: 3,
    reward: 35,
    difficulty: 'easy',
  },
  {
    id: 'cognitive-journey',
    title: 'Narrative Reframe Journey',
    description: 'Rewrite limiting stories and build a resilient cognitive map',
    dimension: 'Cognitive-Narrative',
    icon: '🗺️',
    days: 3,
    reward: 40,
    difficulty: 'hard',
  },
  {
    id: 'spiritual-journey',
    title: 'Reflective Wayfinding',
    description: 'A contemplative pathway through meaning, purpose, and inner compass',
    dimension: 'Spiritual-Reflective',
    icon: '🌟',
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
    icon: '🏆',
    rarity: 'legendary',
    requirement: 'Reach top 10 on the Resilience Map',
  },
  {
    id: 'master-cartographer',
    title: 'Master Cartographer',
    description: 'Complete all 6 Navigation Pathways and chart the full resilience landscape',
    icon: '🗺️',
    rarity: 'legendary',
    requirement: 'Complete all Navigation Pathways',
  },
  {
    id: 'resilience-pioneer',
    title: 'Resilience Pioneer',
    description: 'Be among the first to complete all milestones and maintain a 100-day Compass Streak',
    icon: '🌟',
    rarity: 'legendary',
    requirement: '100-day Compass Streak + all milestones',
  },
  {
    id: 'compass-sage',
    title: 'Compass Sage',
    description: 'Demonstrate mastery across all 6 resilience dimensions with consistently high scores',
    icon: '🧭',
    rarity: 'rare',
    requirement: 'Score above 75 in all 6 dimensions',
  },
];
