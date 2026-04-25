/**
 * quests.js
 * Quest template definitions for the IATLAS gamification system.
 */

export const SPRINT_QUESTS = [
  {
    id: 'sprint-foundation-explorer',
    title: '7-Day Foundation Sprint',
    description: 'Complete 7 Foundation skills across any dimensions in 7 days.',
    duration: 7,
    type: 'sprint',
    icon: '/icons/game-target.svg',
    difficulty: 'beginner',
    requirements: { skillsComplete: 7, level: 'foundation' },
    rewards: { xp: 100, badge: 'sprint-champion' },
  },
  {
    id: 'sprint-dimension-deep-dive',
    title: 'Dimension Deep Dive',
    description: 'Complete 5 skills in a single dimension in 7 days.',
    duration: 7,
    type: 'sprint',
    icon: '/icons/planning.svg',
    difficulty: 'beginner',
    requirements: { skillsComplete: 5, sameDimension: true },
    rewards: { xp: 75, badge: null },
  },
  {
    id: 'sprint-balanced-week',
    title: 'Balanced Week',
    description: 'Complete at least 1 skill in 4 or more different dimensions in 7 days.',
    duration: 7,
    type: 'sprint',
    icon: '/icons/compass.svg',
    difficulty: 'intermediate',
    requirements: { dimensionsCount: 4 },
    rewards: { xp: 120, badge: null },
  },
];

export const MONTHLY_QUESTS = [
  {
    id: 'monthly-dimension-mastery',
    title: '30-Day Dimension Mastery',
    description: 'Complete an entire dimension curriculum (Foundation + Building + Mastery) in 30 days.',
    duration: 30,
    type: 'monthly',
    icon: '/icons/game-mountain.svg',
    difficulty: 'intermediate',
    requirements: { dimensionComplete: true },
    rewards: { xp: 300, badge: 'dimension-master' },
  },
  {
    id: 'monthly-consistency-king',
    title: 'Consistency Champion',
    description: 'Complete at least 1 skill every day for 30 days.',
    duration: 30,
    type: 'monthly',
    icon: '/icons/streaks.svg',
    difficulty: 'hard',
    requirements: { dailyStreak: 30 },
    rewards: { xp: 200, badge: 'month-legend' },
  },
  {
    id: 'monthly-reflection-master',
    title: 'Reflection Master',
    description: 'Complete reflection prompts on 15 or more skills.',
    duration: 30,
    type: 'monthly',
    icon: '/icons/reflection.svg',
    difficulty: 'intermediate',
    requirements: { reflectionsComplete: 15 },
    rewards: { xp: 150, badge: null },
  },
];

export const EPIC_QUESTS = [
  {
    id: 'epic-six-dimension-hero',
    title: '90-Day Six-Dimension Hero',
    description: 'Complete Foundation level in all 6 dimensions within 90 days.',
    duration: 90,
    type: 'epic',
    icon: '/icons/star.svg',
    difficulty: 'hard',
    requirements: { dimensionsComplete: 6, level: 'foundation' },
    rewards: { xp: 500, badge: 'renaissance-resilience', title: 'Renaissance Scholar' },
  },
  {
    id: 'epic-90-day-streak',
    title: '90-Day Streak Legend',
    description: 'Maintain a daily practice streak for 90 consecutive days.',
    duration: 90,
    type: 'epic',
    icon: '/icons/fire.svg',
    difficulty: 'legendary',
    requirements: { overallStreak: 90 },
    rewards: { xp: 300, badge: 'diamond-dedication' },
  },
  {
    id: 'epic-ultimate-scholar',
    title: 'Ultimate Scholar',
    description: 'Complete 40 or more total skills across all dimensions.',
    duration: 90,
    type: 'epic',
    icon: '/icons/kids-trophy.svg',
    difficulty: 'legendary',
    requirements: { totalSkills: 40 },
    rewards: { xp: 400, badge: 'meta-learner' },
  },
];

export const ALL_QUESTS = [...SPRINT_QUESTS, ...MONTHLY_QUESTS, ...EPIC_QUESTS];

/** Get quest by ID */
export function getQuestById(id) {
  return ALL_QUESTS.find(q => q.id === id) || null;
}
