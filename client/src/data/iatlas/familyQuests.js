/**
 * familyQuests.js
 * Multi-step Family Quest definitions for the IATLAS Family tier.
 *
 * Quests combine multiple Family Challenges into a structured progression
 * that earns bonus XP, badges, and certificates upon completion.
 */

export const FAMILY_QUESTS = [
  {
    id: 'fq-001',
    title: 'Resilience Builders: Family Foundations',
    description:
      'Complete 5 family challenges across all 6 dimensions to become a certified Resilience Family.',
    tier: 'family',
    totalSteps: 5,
    steps: [
      {
        stepId: 1,
        title: 'Agentic Challenge',
        description: 'Complete any Family Challenge from the Agentic-Generative dimension',
        requiredChallenges: 1,
        dimension: 'agentic-generative',
      },
      {
        stepId: 2,
        title: 'Somatic Challenge',
        description: 'Complete any Family Challenge from the Somatic-Regulative dimension',
        requiredChallenges: 1,
        dimension: 'somatic-regulative',
      },
      {
        stepId: 3,
        title: 'Cognitive Challenge',
        description: 'Complete any Family Challenge from the Cognitive-Narrative dimension',
        requiredChallenges: 1,
        dimension: 'cognitive-narrative',
      },
      {
        stepId: 4,
        title: 'Relational Challenge',
        description: 'Complete any Family Challenge from the Relational-Connective dimension',
        requiredChallenges: 1,
        dimension: 'relational-connective',
      },
      {
        stepId: 5,
        title: 'Emotional or Spiritual Challenge',
        description:
          'Complete any Family Challenge from Emotional-Adaptive OR Spiritual-Existential',
        requiredChallenges: 1,
        dimension: ['emotional-adaptive', 'spiritual-existential'],
      },
    ],
    rewards: {
      xp: 500,
      badges: ['resilience-family-certified'],
      certificate: 'family-foundations-certificate',
    },
  },
  {
    id: 'fq-002',
    title: '30-Day Family Resilience Challenge',
    description:
      'Complete 10 family challenges in 30 days to build lasting resilience habits together.',
    tier: 'family',
    totalSteps: 4,
    steps: [
      {
        stepId: 1,
        title: 'Week 1: Foundation',
        description: 'Complete 3 Family Challenges',
        requiredChallenges: 3,
      },
      {
        stepId: 2,
        title: 'Week 2: Building',
        description: 'Complete 3 more Family Challenges',
        requiredChallenges: 3,
      },
      {
        stepId: 3,
        title: 'Week 3: Deepening',
        description: 'Complete 2 Family Challenges',
        requiredChallenges: 2,
      },
      {
        stepId: 4,
        title: 'Week 4: Mastery',
        description: 'Complete 2 final Family Challenges',
        requiredChallenges: 2,
      },
    ],
    rewards: {
      xp: 1000,
      badges: ['family-resilience-champion'],
      certificate: '30-day-family-challenge-certificate',
    },
  },
  {
    id: 'fq-003',
    title: 'All-Dimensions Explorer',
    description:
      'Complete at least one Family Challenge in every single resilience dimension to become an All-Dimensions Explorer.',
    tier: 'family',
    totalSteps: 6,
    steps: [
      {
        stepId: 1,
        title: 'Agentic-Generative',
        description: 'Complete a Family Challenge in the Agentic-Generative dimension',
        requiredChallenges: 1,
        dimension: 'agentic-generative',
      },
      {
        stepId: 2,
        title: 'Somatic-Regulative',
        description: 'Complete a Family Challenge in the Somatic-Regulative dimension',
        requiredChallenges: 1,
        dimension: 'somatic-regulative',
      },
      {
        stepId: 3,
        title: 'Cognitive-Narrative',
        description: 'Complete a Family Challenge in the Cognitive-Narrative dimension',
        requiredChallenges: 1,
        dimension: 'cognitive-narrative',
      },
      {
        stepId: 4,
        title: 'Relational-Connective',
        description: 'Complete a Family Challenge in the Relational-Connective dimension',
        requiredChallenges: 1,
        dimension: 'relational-connective',
      },
      {
        stepId: 5,
        title: 'Emotional-Adaptive',
        description: 'Complete a Family Challenge in the Emotional-Adaptive dimension',
        requiredChallenges: 1,
        dimension: 'emotional-adaptive',
      },
      {
        stepId: 6,
        title: 'Spiritual-Existential',
        description: 'Complete a Family Challenge in the Spiritual-Existential dimension',
        requiredChallenges: 1,
        dimension: 'spiritual-existential',
      },
    ],
    rewards: {
      xp: 750,
      badges: ['all-dimensions-explorer'],
      certificate: 'all-dimensions-certificate',
    },
  },
];

/**
 * Returns a single quest by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getFamilyQuestById(id) {
  return FAMILY_QUESTS.find((q) => q.id === id);
}
