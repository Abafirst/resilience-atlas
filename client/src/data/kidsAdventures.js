/**
 * kidsAdventures.js
 * Adventure (quest) definitions for the IATLAS Kids gamification system.
 * Adventures are grouped by age group and tracked in localStorage.
 */

/** Adventure reward types */
export const ADVENTURE_REWARDS = {
  stars:       'stars',
  badge:       'badge',
  certificate: 'certificate',
};

/** All adventure definitions keyed by age group */
export const KIDS_ADVENTURES = {

  /* ── Ages 5–7: Simple Adventures ── */
  'age-5-7': [
    {
      id:          'feelings-detective',
      title:       'Feelings Detective',
      description: 'Become an expert at spotting and naming feelings!',
      icon:        '/icons/emotional-adaptive.svg',
      color:       '#f59e0b',
      ageGroup:    'age-5-7',
      totalSteps:  3,
      steps: [
        { id: 'step-1', label: 'Do any Emotional-Adaptive activity', dimension: 'emotional-adaptive' },
        { id: 'step-2', label: 'Do a second Emotional-Adaptive activity', dimension: 'emotional-adaptive' },
        { id: 'step-3', label: 'Do a third Emotional-Adaptive activity', dimension: 'emotional-adaptive' },
      ],
      requirement: { type: 'dimension_activities', dimension: 'emotional-adaptive', ageGroup: 'age-5-7', count: 3 },
      rewards:     [{ type: 'stars', amount: 8 }, { type: 'certificate', id: 'adventure-complete' }],
    },
    {
      id:          'calm-breathing-expert',
      title:       'Calm Breathing Expert',
      description: 'Learn to calm your body and mind with breathing!',
      icon:        '/icons/somatic-regulative.svg',
      color:       '#10b981',
      ageGroup:    'age-5-7',
      totalSteps:  3,
      steps: [
        { id: 'step-1', label: 'Do any Somatic-Regulative activity', dimension: 'somatic-regulative' },
        { id: 'step-2', label: 'Do a second Somatic-Regulative activity', dimension: 'somatic-regulative' },
        { id: 'step-3', label: 'Do a third Somatic-Regulative activity', dimension: 'somatic-regulative' },
      ],
      requirement: { type: 'dimension_activities', dimension: 'somatic-regulative', ageGroup: 'age-5-7', count: 3 },
      rewards:     [{ type: 'stars', amount: 8 }],
    },
    {
      id:          'helper-hero',
      title:       'Helper Hero',
      description: 'Discover the power of connection and helping others!',
      icon:        '/icons/relational-connective.svg',
      color:       '#8b5cf6',
      ageGroup:    'age-5-7',
      totalSteps:  3,
      steps: [
        { id: 'step-1', label: 'Do any Relational-Connective activity', dimension: 'relational-connective' },
        { id: 'step-2', label: 'Do a second Relational-Connective activity', dimension: 'relational-connective' },
        { id: 'step-3', label: 'Do a third Relational-Connective activity', dimension: 'relational-connective' },
      ],
      requirement: { type: 'dimension_activities', dimension: 'relational-connective', ageGroup: 'age-5-7', count: 3 },
      rewards:     [{ type: 'stars', amount: 8 }],
    },
  ],

  /* ── Ages 8–10: Multi-Day Adventures ── */
  'age-8-10': [
    {
      id:          '5-day-resilience',
      title:       '5-Day Resilience Adventure',
      description: 'Try a different resilience skill each day for 5 days!',
      icon:        '/icons/compass.svg',
      color:       '#10b981',
      ageGroup:    'age-8-10',
      totalSteps:  5,
      durationDays: 5,
      steps: [
        { id: 'step-1', label: 'Complete an Emotional-Adaptive activity',    dimension: 'emotional-adaptive'    },
        { id: 'step-2', label: 'Complete a Somatic-Regulative activity',     dimension: 'somatic-regulative'    },
        { id: 'step-3', label: 'Complete a Relational-Connective activity',  dimension: 'relational-connective' },
        { id: 'step-4', label: 'Complete an Agentic-Generative activity',    dimension: 'agentic-generative'    },
        { id: 'step-5', label: 'Complete a Cognitive-Narrative activity',    dimension: 'cognitive-narrative'   },
      ],
      requirement: { type: 'all_dimensions_tried', count: 1 },
      rewards:     [{ type: 'stars', amount: 15 }, { type: 'certificate', id: 'adventure-complete' }],
    },
    {
      id:          'dimension-deep-dive',
      title:       'Dimension Deep Dive',
      description: 'Go all-in on one resilience dimension and become an expert!',
      icon:        '/icons/agentic-generative.svg',
      color:       '#6366f1',
      ageGroup:    'age-8-10',
      totalSteps:  4,
      steps: [
        { id: 'step-1', label: 'Complete 1 activity in your chosen dimension', dimension: null },
        { id: 'step-2', label: 'Complete 2 activities in your chosen dimension', dimension: null },
        { id: 'step-3', label: 'Complete 3 activities in your chosen dimension', dimension: null },
        { id: 'step-4', label: 'Complete 4 activities in your chosen dimension', dimension: null },
      ],
      requirement: { type: 'any_dimension_activities', ageGroup: 'age-8-10', count: 4 },
      rewards:     [{ type: 'stars', amount: 15 }],
    },
  ],

  /* ── Ages 11–14: Real-World Challenges ── */
  'age-11-14': [
    {
      id:          'resilience-challenge-week',
      title:       'Resilience Challenge Week',
      description: 'A 7-day challenge using a different resilience skill each day.',
      icon:        '/icons/game-target.svg',
      color:       '#6366f1',
      ageGroup:    'age-11-14',
      totalSteps:  7,
      durationDays: 7,
      steps: [
        { id: 'step-1', label: 'Day 1: Emotional-Adaptive activity',    dimension: 'emotional-adaptive'    },
        { id: 'step-2', label: 'Day 2: Somatic-Regulative activity',     dimension: 'somatic-regulative'    },
        { id: 'step-3', label: 'Day 3: Relational-Connective activity',  dimension: 'relational-connective' },
        { id: 'step-4', label: 'Day 4: Agentic-Generative activity',     dimension: 'agentic-generative'    },
        { id: 'step-5', label: 'Day 5: Cognitive-Narrative activity',    dimension: 'cognitive-narrative'   },
        { id: 'step-6', label: 'Day 6: Spiritual-Reflective activity',   dimension: 'spiritual-reflective'  },
        { id: 'step-7', label: 'Day 7: Complete any activity',           dimension: null                    },
      ],
      requirement: { type: 'streak', days: 7 },
      rewards:     [{ type: 'stars', amount: 25 }, { type: 'certificate', id: 'adventure-complete' }],
    },
    {
      id:          'balance-builder',
      title:       'Balance Builder',
      description: 'Build true resilience balance by practicing all 6 dimensions.',
      icon:        '/icons/badges.svg',
      color:       '#8b5cf6',
      ageGroup:    'age-11-14',
      totalSteps:  6,
      steps: [
        { id: 'step-1', label: '2 Emotional-Adaptive activities',    dimension: 'emotional-adaptive'    },
        { id: 'step-2', label: '2 Somatic-Regulative activities',    dimension: 'somatic-regulative'    },
        { id: 'step-3', label: '2 Relational-Connective activities', dimension: 'relational-connective' },
        { id: 'step-4', label: '2 Agentic-Generative activities',    dimension: 'agentic-generative'    },
        { id: 'step-5', label: '2 Cognitive-Narrative activities',   dimension: 'cognitive-narrative'   },
        { id: 'step-6', label: '2 Spiritual-Reflective activities',  dimension: 'spiritual-reflective'  },
      ],
      requirement: { type: 'all_dimensions_min', ageGroup: 'age-11-14', count: 2 },
      rewards:     [{ type: 'stars', amount: 20 }],
    },
  ],

  /* ── Ages 15–18: Purpose-Driven Journeys ── */
  'age-15-18': [
    {
      id:          '21-day-builder',
      title:       '21-Day Resilience Builder',
      description: 'A 3-week progressive journey through all resilience dimensions.',
      icon:        '/icons/trophy.svg',
      color:       '#8b5cf6',
      ageGroup:    'age-15-18',
      totalSteps:  21,
      durationDays: 21,
      steps: Array.from({ length: 21 }, (_, i) => ({
        id:        `step-${i + 1}`,
        label:     `Day ${i + 1}: Complete any activity`,
        dimension: null,
      })),
      requirement: { type: 'total_activities', count: 21 },
      rewards:     [
        { type: 'stars', amount: 50 },
        { type: 'certificate', id: 'resilience-hero' },
      ],
    },
    {
      id:          'leadership-path',
      title:       'Leadership Path',
      description: 'Mentor younger resilience learners. Coming soon!',
      icon:        '/icons/relational-connective.svg',
      color:       '#06b6d4',
      ageGroup:    'age-15-18',
      totalSteps:  1,
      comingSoon:  true,
      steps: [
        { id: 'step-1', label: 'Mentor a younger learner', dimension: null },
      ],
      requirement: { type: 'manual' },
      rewards:     [{ type: 'stars', amount: 30 }],
    },
  ],
};

/** Flat list of all adventures */
export const ALL_KIDS_ADVENTURES = Object.values(KIDS_ADVENTURES).flat();

/** Look up an adventure by ID */
export function getKidsAdventureById(id) {
  return ALL_KIDS_ADVENTURES.find(a => a.id === id) || null;
}
