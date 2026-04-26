/**
 * kidsBadges.js
 * All badge definitions for the IATLAS Kids gamification system.
 *
 * Three categories:
 *   A. Dimension Badges  (24 total: 6 dimensions × 4 age groups)
 *   B. Milestone Badges
 *   C. Character Badges  (6 total)
 */

/** The six resilience dimensions (lowercase keys used throughout) */
export const KIDS_DIMENSIONS = [
  { key: 'emotional-adaptive',    label: 'Emotional-Adaptive',    archetype: 'Feeler',    icon: '/icons/emotional-adaptive.svg',    color: '#ef4444' },
  { key: 'somatic-regulative',    label: 'Somatic-Regulative',    archetype: 'Grounder',  icon: '/icons/somatic-regulative.svg',    color: '#10b981' },
  { key: 'relational-connective', label: 'Relational-Connective', archetype: 'Connector', icon: '/icons/relational-connective.svg', color: '#8b5cf6' },
  { key: 'agentic-generative',    label: 'Agentic-Generative',    archetype: 'Builder',   icon: '/icons/agentic-generative.svg',   color: '#f59e0b' },
  { key: 'spiritual-reflective',  label: 'Spiritual-Reflective',  archetype: 'Guide',     icon: '/icons/spiritual-reflective.svg',  color: '#06b6d4' },
  { key: 'cognitive-narrative',   label: 'Cognitive-Narrative',   archetype: 'Thinker',   icon: '/icons/cognitive-narrative.svg',   color: '#6366f1' },
];

/**
 * Age group config for badge names.
 * Prefix determines the "flavor" of the badge name.
 */
const AGE_GROUP_CONFIGS = [
  { id: 'age-5-7',   prefix: 'Little',   suffix: '' },
  { id: 'age-8-10',  prefix: '',         suffix: 'Learner' },
  { id: 'age-11-14', prefix: '',         suffix: 'Seeker' },
  { id: 'age-15-18', prefix: '',         suffix: 'Leader' },
];

/**
 * Dimension badge descriptions by archetype.
 */
const DIMENSION_BADGE_DESCS = {
  Feeler:    'Complete 3 Emotional-Adaptive activities.',
  Grounder:  'Complete 3 Somatic-Regulative activities.',
  Connector: 'Complete 3 Relational-Connective activities.',
  Builder:   'Complete 3 Agentic-Generative activities.',
  Guide:     'Complete 3 Spiritual-Reflective activities.',
  Thinker:   'Complete 3 Cognitive-Narrative activities.',
};

/** A. Dimension Badges — 24 total (6 × 4) */
export const DIMENSION_BADGES = KIDS_DIMENSIONS.flatMap(({ key, archetype, icon, color }) =>
  AGE_GROUP_CONFIGS.map(({ id, prefix, suffix }) => {
    const nameParts = [prefix, archetype, suffix].filter(Boolean);
    const name = nameParts.join(' ');
    return {
      id:          `dim-${key}-${id}`,
      category:    'dimension',
      name,
      dimension:   key,
      ageGroup:    id,
      icon,
      color:       `${color}22`,
      border:      color,
      description: `${DIMENSION_BADGE_DESCS[archetype]} (${id.replace('age-', 'Ages ').replace('-', '–')})`,
      requirement: { type: 'dimension_activities', dimension: key, ageGroup: id, count: 3 },
    };
  })
);

/** B. Milestone Badges */
export const MILESTONE_BADGES = [
  {
    id:          'first-step',
    category:    'milestone',
    name:        'First Step',
    icon:        '/icons/compass.svg',
    color:       '#fef9c322',
    border:      '#f59e0b',
    description: 'Complete your very first activity.',
    requirement: { type: 'total_activities', count: 1 },
  },
  {
    id:          'dimension-explorer',
    category:    'milestone',
    name:        'Dimension Explorer',
    icon:        '/icons/agentic-generative.svg',
    color:       '#ede9fe22',
    border:      '#7c3aed',
    description: 'Try at least one activity in all 6 resilience dimensions.',
    requirement: { type: 'all_dimensions_tried', count: 1 },
  },
  {
    id:          'streak-3',
    category:    'milestone',
    name:        '3-Day Streak',
    icon:        '/icons/fire.svg',
    color:       '#fff7ed22',
    border:      '#f97316',
    description: 'Complete at least one activity 3 days in a row.',
    requirement: { type: 'streak', days: 3 },
  },
  {
    id:          'streak-7',
    category:    'milestone',
    name:        '7-Day Streak',
    icon:        '/icons/fire.svg',
    color:       '#fff7ed22',
    border:      '#ea580c',
    description: 'Complete at least one activity 7 days in a row.',
    requirement: { type: 'streak', days: 7 },
  },
  {
    id:          'age-graduate',
    category:    'milestone',
    name:        'Age Group Graduate',
    icon:        '/icons/kids-trophy.svg',
    color:       '#ecfdf522',
    border:      '#059669',
    description: 'Complete all activities in any age group.',
    requirement: { type: 'age_group_complete' },
  },
  {
    id:          'family-champion',
    category:    'milestone',
    name:        'Family Champion',
    icon:        '/icons/relational-connective.svg',
    color:       '#ede9fe22',
    border:      '#6d28d9',
    description: 'Receive 5 celebration notes from a parent.',
    requirement: { type: 'parent_notes', count: 5 },
  },
];

/** C. Character Badges — 6 total */
export const CHARACTER_BADGES = [
  {
    id:          'mayas-friend',
    category:    'character',
    name:        "Maya's Friend",
    character:   'Maya',
    dimension:   'relational-connective',
    icon:        '/icons/relational-connective.svg',
    color:       '#ede9fe22',
    border:      '#8b5cf6',
    description: 'Complete 5 Relational-Connective activities.',
    requirement: { type: 'dimension_total', dimension: 'relational-connective', count: 5 },
  },
  {
    id:          'kais-friend',
    category:    'character',
    name:        "Kai's Friend",
    character:   'Kai',
    dimension:   'agentic-generative',
    icon:        '/icons/agentic-generative.svg',
    color:       '#fef9c322',
    border:      '#d97706',
    description: 'Complete 5 Agentic-Generative activities.',
    requirement: { type: 'dimension_total', dimension: 'agentic-generative', count: 5 },
  },
  {
    id:          'alexs-friend',
    category:    'character',
    name:        "Alex's Friend",
    character:   'Alex',
    dimension:   'cognitive-narrative',
    icon:        '/icons/cognitive-narrative.svg',
    color:       '#e0f2fe22',
    border:      '#0284c7',
    description: 'Complete 5 Cognitive-Narrative activities.',
    requirement: { type: 'dimension_total', dimension: 'cognitive-narrative', count: 5 },
  },
  {
    id:          'sams-friend',
    category:    'character',
    name:        "Sam's Friend",
    character:   'Sam',
    dimension:   'somatic-regulative',
    icon:        '/icons/somatic-regulative.svg',
    color:       '#dcfce722',
    border:      '#16a34a',
    description: 'Complete 5 Somatic-Regulative activities.',
    requirement: { type: 'dimension_total', dimension: 'somatic-regulative', count: 5 },
  },
  {
    id:          'jordans-friend',
    category:    'character',
    name:        "Jordan's Friend",
    character:   'Jordan',
    dimension:   'emotional-adaptive',
    icon:        '/icons/emotional-adaptive.svg',
    color:       '#ffe4e622',
    border:      '#be123c',
    description: 'Complete 5 Emotional-Adaptive activities.',
    requirement: { type: 'dimension_total', dimension: 'emotional-adaptive', count: 5 },
  },
  {
    id:          'rivers-friend',
    category:    'character',
    name:        "River's Friend",
    character:   'River',
    dimension:   'spiritual-reflective',
    icon:        '/icons/spiritual-reflective.svg',
    color:       '#d1fae522',
    border:      '#059669',
    description: 'Complete 5 Spiritual-Reflective activities.',
    requirement: { type: 'dimension_total', dimension: 'spiritual-reflective', count: 5 },
  },
];

/** All badges combined */
export const ALL_KIDS_BADGES = [
  ...DIMENSION_BADGES,
  ...MILESTONE_BADGES,
  ...CHARACTER_BADGES,
];

/** Quick lookup by ID */
export function getKidsBadgeById(id) {
  return ALL_KIDS_BADGES.find(b => b.id === id) || null;
}
