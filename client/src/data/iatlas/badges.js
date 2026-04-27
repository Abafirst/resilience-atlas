/**
 * badges.js
 * IATLAS Badge & XP System
 *
 * Badges are unlocked based on COMPLETION milestones only — never by
 * assessment scores, performance ratings, or comparisons to others.
 */

// ── Badge definitions ─────────────────────────────────────────────────────────

export const BADGE_DEFINITIONS = {

  // ── Starter badges (first steps) ───────────────────────────────────────────
  'first-activity': {
    id: 'first-activity',
    name: 'First Steps',
    description: 'Completed your very first IATLAS activity!',
    icon: '/icons/badges/first-steps.svg',
    xpReward: 50,
    unlockCondition: { type: 'activity_count', threshold: 1 },
  },
  'early-explorer': {
    id: 'early-explorer',
    name: 'Early Explorer',
    description: 'Completed 5 activities',
    icon: '/icons/badges/early-explorer.svg',
    xpReward: 100,
    unlockCondition: { type: 'activity_count', threshold: 5 },
  },
  'skill-builder': {
    id: 'skill-builder',
    name: 'Skill Builder',
    description: 'Completed 10 activities',
    icon: '/icons/badges/skill-builder.svg',
    xpReward: 200,
    unlockCondition: { type: 'activity_count', threshold: 10 },
  },

  // ── Dimension-specific badges ───────────────────────────────────────────────
  'agentic-beginner': {
    id: 'agentic-beginner',
    name: 'I Can Do It!',
    description: 'Completed 5 Agentic-Generative activities',
    icon: '/icons/badges/agentic-beginner.svg',
    dimension: 'agentic-generative',
    xpReward: 150,
    unlockCondition: { type: 'dimension_count', dimension: 'agentic-generative', threshold: 5 },
  },
  'somatic-beginner': {
    id: 'somatic-beginner',
    name: 'Body Awareness Pro',
    description: 'Completed 5 Somatic-Regulative activities',
    icon: '/icons/badges/somatic-beginner.svg',
    dimension: 'somatic-regulative',
    xpReward: 150,
    unlockCondition: { type: 'dimension_count', dimension: 'somatic-regulative', threshold: 5 },
  },
  'cognitive-beginner': {
    id: 'cognitive-beginner',
    name: 'Problem Solver',
    description: 'Completed 5 Cognitive-Narrative activities',
    icon: '/icons/badges/cognitive-beginner.svg',
    dimension: 'cognitive-narrative',
    xpReward: 150,
    unlockCondition: { type: 'dimension_count', dimension: 'cognitive-narrative', threshold: 5 },
  },
  'relational-beginner': {
    id: 'relational-beginner',
    name: 'Friend Maker',
    description: 'Completed 5 Relational-Connective activities',
    icon: '/icons/badges/relational-beginner.svg',
    dimension: 'relational-connective',
    xpReward: 150,
    unlockCondition: { type: 'dimension_count', dimension: 'relational-connective', threshold: 5 },
  },
  'emotional-beginner': {
    id: 'emotional-beginner',
    name: 'Feelings Detective',
    description: 'Completed 5 Emotional-Adaptive activities',
    icon: '/icons/badges/emotional-beginner.svg',
    dimension: 'emotional-adaptive',
    xpReward: 150,
    unlockCondition: { type: 'dimension_count', dimension: 'emotional-adaptive', threshold: 5 },
  },
  'spiritual-beginner': {
    id: 'spiritual-beginner',
    name: 'Wonder Seeker',
    description: 'Completed 5 Spiritual-Existential activities',
    icon: '/icons/badges/spiritual-beginner.svg',
    dimension: 'spiritual-existential',
    xpReward: 150,
    unlockCondition: { type: 'dimension_count', dimension: 'spiritual-existential', threshold: 5 },
  },

  // ── Streak badges ──────────────────────────────────────────────────────────
  'streak-3': {
    id: 'streak-3',
    name: 'Getting Started',
    description: '3-day activity streak',
    icon: '/icons/badges/streak-3.svg',
    xpReward: 100,
    unlockCondition: { type: 'streak', threshold: 3 },
  },
  'streak-7': {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7-day activity streak',
    icon: '/icons/badges/streak-7.svg',
    xpReward: 250,
    unlockCondition: { type: 'streak', threshold: 7 },
  },
  'streak-30': {
    id: 'streak-30',
    name: 'Monthly Master',
    description: '30-day activity streak',
    icon: '/icons/badges/streak-30.svg',
    xpReward: 1000,
    unlockCondition: { type: 'streak', threshold: 30 },
  },

  // ── Milestone badges ───────────────────────────────────────────────────────
  'balanced-explorer': {
    id: 'balanced-explorer',
    name: 'Balanced Explorer',
    description: 'Completed at least 3 activities in all 6 dimensions',
    icon: '/icons/badges/balanced.svg',
    xpReward: 500,
    unlockCondition: { type: 'balanced_dimensions', threshold: 3 },
  },
  'dimension-master': {
    id: 'dimension-master',
    name: 'Dimension Master',
    description: 'Completed all 8 activities in one dimension',
    icon: '/icons/badges/dimension-master.svg',
    xpReward: 300,
    unlockCondition: { type: 'dimension_mastery', threshold: 8 },
  },
  'iatlas-champion': {
    id: 'iatlas-champion',
    name: 'IATLAS Champion',
    description: 'Completed 50 activities',
    icon: '/icons/badges/champion.svg',
    xpReward: 1000,
    unlockCondition: { type: 'activity_count', threshold: 50 },
  },
};

// ── XP rewards for actions ────────────────────────────────────────────────────

export const XP_REWARDS = {
  activity_completed:     25,
  first_activity_of_day:  10,
  streak_bonus_3:         50,
  streak_bonus_7:        150,
  streak_bonus_30:       500,
  badge_unlocked:          0, // XP comes from the badge definition itself
  reflection_added:       15,
};

// ── Journey milestones ────────────────────────────────────────────────────────

export const MILESTONES = {
  'welcome-to-iatlas': {
    id: 'welcome-to-iatlas',
    title: 'Welcome to IATLAS!',
    description: 'Started your resilience-building journey',
    icon: '/icons/milestones/welcome.svg',
    autoUnlock: true,
  },
  'first-week': {
    id: 'first-week',
    title: 'First Week Complete',
    description: 'Active for 7 days',
    icon: '/icons/milestones/first-week.svg',
    unlockCondition: { type: 'days_active', threshold: 7 },
  },
  'all-dimensions-explored': {
    id: 'all-dimensions-explored',
    title: 'All Dimensions Explored',
    description: 'Tried at least one activity in every dimension',
    icon: '/icons/milestones/all-dimensions.svg',
    unlockCondition: { type: 'dimensions_touched', threshold: 6 },
  },
  'halfway-hero': {
    id: 'halfway-hero',
    title: 'Halfway Hero',
    description: 'Completed 48 of 96 activities',
    icon: '/icons/milestones/halfway.svg',
    unlockCondition: { type: 'activity_count', threshold: 48 },
  },
  'iatlas-graduate': {
    id: 'iatlas-graduate',
    title: 'IATLAS Graduate',
    description: 'Completed all 96 activities!',
    icon: '/icons/milestones/graduate.svg',
    unlockCondition: { type: 'activity_count', threshold: 96 },
  },
};
