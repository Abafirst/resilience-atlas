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

// ── IARF XP Level System ──────────────────────────────────────────────────────

/**
 * XP award amounts for IARF curriculum activities.
 * Used for displaying activity values in the UI.
 */
export const XP_AWARDS = {
  MICROPRACTICE_COMPLETE:   10,
  SKILL_MODULE_COMPLETE:    50,
  WEEKLY_REFLECTION:        25,
  RETAKE_RESILIENCE_ATLAS: 100,
  DIMENSIONAL_IMPROVEMENT: 150,
  HELP_ANOTHER_USER:        75,
  STREAK_BONUS_7:           20,
  STREAK_BONUS_30:          60,
  STREAK_BONUS_90:         150,
  STREAK_BONUS_365:        500,
  QUEST_COMPLETE:           80,
  BALANCE_BONUS:            30,
};

/**
 * XP level tier definitions. Each tier covers a range of XP and levels.
 * XP displayed to users = totalPoints × 10 (scale factor).
 */
export const XP_LEVEL_TIERS = [
  { name: 'Resilience Explorer',  minXP:      0, maxXP:   999, minLevel:  1, maxLevel: 10, icon: '🌱', color: '#22c55e' },
  { name: 'Resilience Builder',   minXP:   1000, maxXP:  4999, minLevel: 11, maxLevel: 20, icon: '⚡', color: '#3b82f6' },
  { name: 'Resilience Architect', minXP:   5000, maxXP: 14999, minLevel: 21, maxLevel: 30, icon: '🏛️', color: '#8b5cf6' },
  { name: 'Resilience Master',    minXP:  15000, maxXP: Infinity, minLevel: 31, maxLevel: Infinity, icon: '👑', color: '#f59e0b' },
];

/**
 * Compute XP level data from a raw points total (internal DB value).
 * XP shown in UI = totalPoints × 10.
 *
 * @param {number} totalPoints
 * @returns {{ xp, level, tierName, tierIcon, tierColor, nextLevelXP, progressPct }}
 */
export function computeXPLevel(totalPoints) {
  const xp = (totalPoints || 0) * 10;
  let tierIdx = 0;

  for (let i = 0; i < XP_LEVEL_TIERS.length; i++) {
    if (xp >= XP_LEVEL_TIERS[i].minXP) tierIdx = i;
  }

  const tier = XP_LEVEL_TIERS[tierIdx];
  const tierRange     = tier.maxXP === Infinity ? 15000 : (tier.maxXP - tier.minXP);
  const levelsInTier  = tier.maxLevel === Infinity ? 10 : (tier.maxLevel - tier.minLevel + 1);
  const xpPerLevel    = Math.floor(tierRange / levelsInTier);
  const xpInTier      = xp - tier.minXP;
  const levelsEarned  = xpPerLevel > 0 ? Math.min(Math.floor(xpInTier / xpPerLevel), levelsInTier - 1) : 0;
  const level         = tier.minLevel + levelsEarned;
  const xpInCurrentLevel = xpPerLevel > 0 ? xpInTier % xpPerLevel : 0;
  const progressPct   = xpPerLevel > 0 ? Math.round((xpInCurrentLevel / xpPerLevel) * 100) : 100;
  const nextLevelXP   = tier.minXP + (levelsEarned + 1) * xpPerLevel;

  return {
    xp,
    level,
    tierName:    tier.name,
    tierIcon:    tier.icon,
    tierColor:   tier.color,
    nextLevelXP: tier.maxXP === Infinity && levelsEarned === levelsInTier - 1 ? null : Math.min(nextLevelXP, tier.maxXP === Infinity ? Infinity : tier.maxXP + 1),
    progressPct: Math.min(progressPct, 100),
  };
}

/**
 * Streak badge tiers for dimension micropractices.
 */
export const STREAK_BADGE_TIERS = [
  { days: 365, label: '💎 Diamond', rarity: 'legendary', xpBonus: 500 },
  { days:  90, label: '🥇 Gold',    rarity: 'rare',      xpBonus: 150 },
  { days:  30, label: '🥈 Silver',  rarity: 'uncommon',  xpBonus:  60 },
  { days:   7, label: '🥉 Bronze',  rarity: 'common',    xpBonus:  20 },
];

/** Get the highest earned streak badge tier for a given streak length. */
export function getStreakBadgeTier(days) {
  for (const tier of STREAK_BADGE_TIERS) {
    if (days >= tier.days) return tier;
  }
  return null;
}

// ── Navigation Milestones (Atlas Starter) ─────────────────────────────────────
// Milestones are earned by completing practices (micro-quests, pathways, or
// reinforcement practices) — not by completing assessments.
export const NAVIGATION_MILESTONES = [
  {
    id: 'first-practice',
    title: 'First Step Navigator',
    description: 'Complete your first micro-quest or practice',
    icon: '/icons/compass.svg',
    dimension: null,
  },
  {
    id: 'agentic',
    title: 'Agentic Explorer',
    description: 'Complete a practice in the Agentic-Generative dimension',
    icon: '/icons/agentic-generative.svg',
    dimension: 'Agentic-Generative',
  },
  {
    id: 'relational',
    title: 'Relational Connector',
    description: 'Complete a practice in the Relational-Connective dimension',
    icon: '/icons/relational-connective.svg',
    dimension: 'Relational-Connective',
  },
  {
    id: 'spiritual',
    title: 'Reflective Wayfinder',
    description: 'Complete a practice in the Spiritual-Reflective dimension',
    icon: '/icons/spiritual-reflective.svg',
    dimension: 'Spiritual-Reflective',
  },
  {
    id: 'emotional',
    title: 'Emotional Adapter',
    description: 'Complete a practice in the Emotional-Adaptive dimension',
    icon: '/icons/emotional-adaptive.svg',
    dimension: 'Emotional-Adaptive',
  },
  {
    id: 'somatic',
    title: 'Somatic Regulator',
    description: 'Complete a practice in the Somatic-Regulative dimension',
    icon: '/icons/somatic-regulative.svg',
    dimension: 'Somatic-Regulative',
  },
  {
    id: 'cognitive',
    title: 'Narrative Cartographer',
    description: 'Complete a practice in the Cognitive-Narrative dimension',
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
