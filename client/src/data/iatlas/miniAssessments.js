/**
 * miniAssessments.js
 * IATLAS Mini Check-In Assessments — quick 3-question pulse checks for each dimension.
 * Used by practitioners and parents between full assessments.
 */

export const MINI_ASSESSMENTS = {
  'emotional-adaptive': {
    id: 'emotional-adaptive',
    name: 'Emotional Check-In',
    dimension: 'Emotional-Adaptive',
    dimensionKey: 'emotional-adaptive',
    color: '#ec4899',
    colorLight: '#fdf2f8',
    icon: '/icons/emotional-adaptive.svg',
    parentVersion: {
      instructions: 'Answer these 3 questions about your child this week:',
      questions: [
        {
          id: 'ea-mini-1',
          text: 'My child can name their feelings when upset',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'ea-mini-2',
          text: 'My child recovers from frustration within a reasonable time',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'ea-mini-3',
          text: 'My child uses calming strategies when feeling overwhelmed',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
      ],
    },
    practitionerVersion: {
      instructions: 'Rate the client on the following observable behaviors over the past week:',
      questions: [
        {
          id: 'ea-prac-1',
          text: 'Client demonstrates accurate emotion identification and labelling',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'ea-prac-2',
          text: 'Client exhibits adaptive recovery from emotional dysregulation',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'ea-prac-3',
          text: 'Client initiates and applies emotion regulation strategies independently',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
      ],
    },
    scoring: {
      low:    { range: [3, 7],   label: 'Emerging',  message: 'Consider emotion identification activities to build foundational skills.' },
      medium: { range: [8, 11],  label: 'Developing', message: 'Emotion awareness is developing well. Focus on regulation strategies.' },
      high:   { range: [12, 15], label: 'Thriving',  message: 'Strong emotional literacy. Consider peer mentorship opportunities.' },
    },
    recommendedActivities: {
      low:    ['feeling-faces-drawing', 'emotion-wheel', 'body-sensations-map'],
      medium: ['emotion-intensity-tracker', 'feeling-journal', 'mood-weather-report'],
      high:   ['emotion-coaching-others', 'complex-emotion-analysis', 'empathy-in-action'],
    },
  },

  'agentic-generative': {
    id: 'agentic-generative',
    name: 'Goal Power Check-In',
    dimension: 'Agentic-Generative',
    dimensionKey: 'agentic-generative',
    color: '#4f46e5',
    colorLight: '#eef2ff',
    icon: '/icons/agentic-generative.svg',
    parentVersion: {
      instructions: 'Answer these 3 questions about your child this week:',
      questions: [
        {
          id: 'ag-mini-1',
          text: 'My child sets goals and works toward them',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'ag-mini-2',
          text: 'My child bounces back and tries again after setbacks',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'ag-mini-3',
          text: 'My child takes initiative in activities without being prompted',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
      ],
    },
    practitionerVersion: {
      instructions: 'Rate the client on the following observable behaviors over the past week:',
      questions: [
        {
          id: 'ag-prac-1',
          text: 'Client articulates meaningful personal goals and action steps',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'ag-prac-2',
          text: 'Client demonstrates persistence and adaptive problem-solving after failure',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'ag-prac-3',
          text: 'Client shows intrinsic motivation and self-directed action',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
      ],
    },
    scoring: {
      low:    { range: [3, 7],   label: 'Emerging',  message: 'Focus on goal-setting activities and celebrating small wins.' },
      medium: { range: [8, 11],  label: 'Developing', message: 'Goal-setting skills developing. Work on persistence strategies.' },
      high:   { range: [12, 15], label: 'Thriving',  message: 'Strong agentic capacity. Introduce leadership challenges.' },
    },
    recommendedActivities: {
      low:    ['treasure-map', 'wish-list-ladder', 'my-one-brave-thing'],
      medium: ['obstacle-course-planner', 'goal-thermometer', 'resilience-recipe'],
      high:   ['teach-it-back', 'mentor-mission', 'community-challenge'],
    },
  },

  'somatic-regulative': {
    id: 'somatic-regulative',
    name: 'Body Wisdom Check-In',
    dimension: 'Somatic-Regulative',
    dimensionKey: 'somatic-regulative',
    color: '#10b981',
    colorLight: '#d1fae5',
    icon: '/icons/somatic-regulative.svg',
    parentVersion: {
      instructions: 'Answer these 3 questions about your child this week:',
      questions: [
        {
          id: 'sr-mini-1',
          text: 'My child notices body signals (hunger, tiredness, tension)',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'sr-mini-2',
          text: 'My child uses breathing or movement to calm down',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'sr-mini-3',
          text: 'My child maintains healthy sleep and movement routines',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
      ],
    },
    practitionerVersion: {
      instructions: 'Rate the client on the following observable behaviors over the past week:',
      questions: [
        {
          id: 'sr-prac-1',
          text: 'Client demonstrates accurate interoceptive awareness (recognising internal body states)',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'sr-prac-2',
          text: 'Client employs somatic regulation techniques (breath, movement, grounding) effectively',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'sr-prac-3',
          text: 'Client maintains consistent self-care and physiological regulation routines',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
      ],
    },
    scoring: {
      low:    { range: [3, 7],   label: 'Emerging',  message: 'Introduce basic body awareness and breathing activities.' },
      medium: { range: [8, 11],  label: 'Developing', message: 'Body awareness growing. Expand regulation toolkit.' },
      high:   { range: [12, 15], label: 'Thriving',  message: 'Strong somatic regulation. Explore advanced mindfulness.' },
    },
    recommendedActivities: {
      low:    ['body-scan-adventure', 'balloon-breathing', 'body-map-feelings'],
      medium: ['tension-tamer', 'movement-mood-reset', 'sleep-superhero'],
      high:   ['yoga-story-flow', 'mindful-movement-sequence', 'body-wisdom-journal'],
    },
  },

  'cognitive-narrative': {
    id: 'cognitive-narrative',
    name: 'Story Power Check-In',
    dimension: 'Cognitive-Narrative',
    dimensionKey: 'cognitive-narrative',
    color: '#f59e0b',
    colorLight: '#fef3c7',
    icon: '/icons/cognitive-narrative.svg',
    parentVersion: {
      instructions: 'Answer these 3 questions about your child this week:',
      questions: [
        {
          id: 'cn-mini-1',
          text: 'My child talks about challenges in a hopeful way',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'cn-mini-2',
          text: 'My child can think of multiple solutions to a problem',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'cn-mini-3',
          text: 'My child connects their experiences to a sense of personal growth',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
      ],
    },
    practitionerVersion: {
      instructions: 'Rate the client on the following observable behaviors over the past week:',
      questions: [
        {
          id: 'cn-prac-1',
          text: 'Client demonstrates adaptive attributional style and growth-oriented narrative',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'cn-prac-2',
          text: 'Client generates divergent solutions and flexible thinking under pressure',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'cn-prac-3',
          text: 'Client integrates adversity into a coherent, post-traumatic growth narrative',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
      ],
    },
    scoring: {
      low:    { range: [3, 7],   label: 'Emerging',  message: 'Focus on reframing and solution-focused storytelling activities.' },
      medium: { range: [8, 11],  label: 'Developing', message: 'Cognitive flexibility growing. Build on strength stories.' },
      high:   { range: [12, 15], label: 'Thriving',  message: 'Strong narrative resilience. Introduce mentorship storytelling.' },
    },
    recommendedActivities: {
      low:    ['worry-transformer', 'reframe-the-story', 'solution-detective'],
      medium: ['growth-mindset-journal', 'resilience-timeline', 'strengths-spotlight'],
      high:   ['my-resilience-story', 'teach-a-friend-reframe', 'future-letter'],
    },
  },

  'relational-connective': {
    id: 'relational-connective',
    name: 'Connection Check-In',
    dimension: 'Relational-Connective',
    dimensionKey: 'relational-connective',
    color: '#ef4444',
    colorLight: '#fef2f2',
    icon: '/icons/relational-connective.svg',
    parentVersion: {
      instructions: 'Answer these 3 questions about your child this week:',
      questions: [
        {
          id: 'rc-mini-1',
          text: 'My child reaches out to friends or family when they need support',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'rc-mini-2',
          text: 'My child shows empathy and care for others',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'rc-mini-3',
          text: 'My child resolves conflicts with peers in a constructive way',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
      ],
    },
    practitionerVersion: {
      instructions: 'Rate the client on the following observable behaviors over the past week:',
      questions: [
        {
          id: 'rc-prac-1',
          text: 'Client proactively seeks and utilises social support networks',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'rc-prac-2',
          text: 'Client demonstrates perspective-taking and empathic attunement',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'rc-prac-3',
          text: 'Client applies constructive conflict resolution strategies',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
      ],
    },
    scoring: {
      low:    { range: [3, 7],   label: 'Emerging',  message: 'Begin with trust-building and connection activities.' },
      medium: { range: [8, 11],  label: 'Developing', message: 'Social connections growing. Develop empathy and conflict skills.' },
      high:   { range: [12, 15], label: 'Thriving',  message: 'Strong relational skills. Explore community leadership roles.' },
    },
    recommendedActivities: {
      low:    ['kindness-web', 'my-support-circle', 'compliment-cards'],
      medium: ['empathy-walk', 'conflict-resolution-role-play', 'team-challenge'],
      high:   ['peer-mentor-program', 'community-helper-project', 'gratitude-circle'],
    },
  },

  'spiritual-existential': {
    id: 'spiritual-existential',
    name: 'Purpose Check-In',
    dimension: 'Spiritual-Existential',
    dimensionKey: 'spiritual-existential',
    color: '#7c3aed',
    colorLight: '#f5f3ff',
    icon: '/icons/spiritual-existential.svg',
    parentVersion: {
      instructions: 'Answer these 3 questions about your child this week:',
      questions: [
        {
          id: 'se-mini-1',
          text: 'My child expresses a sense of meaning or purpose in their daily activities',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'se-mini-2',
          text: 'My child shows gratitude and appreciates the good in their life',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
        {
          id: 'se-mini-3',
          text: 'My child has a sense of hope about the future',
          scale: [1, 2, 3, 4, 5],
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
        },
      ],
    },
    practitionerVersion: {
      instructions: 'Rate the client on the following observable behaviors over the past week:',
      questions: [
        {
          id: 'se-prac-1',
          text: 'Client articulates a coherent sense of values, meaning, and purpose',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'se-prac-2',
          text: 'Client demonstrates dispositional gratitude and positive meaning-making',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
        {
          id: 'se-prac-3',
          text: 'Client maintains hope and transcendent perspective during adversity',
          scale: [1, 2, 3, 4, 5],
          labels: ['Not observed', 'Rarely', 'Inconsistently', 'Frequently', 'Consistently'],
        },
      ],
    },
    scoring: {
      low:    { range: [3, 7],   label: 'Emerging',  message: 'Introduce values exploration and gratitude practices.' },
      medium: { range: [8, 11],  label: 'Developing', message: 'Sense of purpose emerging. Explore meaning-making activities.' },
      high:   { range: [12, 15], label: 'Thriving',  message: 'Strong existential grounding. Consider legacy and service projects.' },
    },
    recommendedActivities: {
      low:    ['gratitude-jar', 'values-sorting-cards', 'my-why-poster'],
      medium: ['meaning-map', 'hero-story', 'nature-connection-walk'],
      high:   ['purpose-project', 'legacy-letter', 'community-values-act'],
    },
  },
};

/**
 * Calculate score from an array of responses.
 * @param {Array<{questionId: string, score: number}>} responses
 * @returns {number} total score (3–15)
 */
export function calculateMiniAssessmentScore(responses) {
  return responses.reduce((sum, r) => sum + (r.score || 0), 0);
}

/**
 * Get interpretation band for a given score and dimension.
 * @param {string} dimensionKey
 * @param {number} score
 * @returns {{ label: string, message: string } | null}
 */
export function getMiniAssessmentInterpretation(dimensionKey, score) {
  const assessment = MINI_ASSESSMENTS[dimensionKey];
  if (!assessment) return null;
  const { scoring } = assessment;
  for (const band of Object.values(scoring)) {
    const [min, max] = band.range;
    if (score >= min && score <= max) return band;
  }
  return null;
}

/**
 * Get recommended activities for a score.
 * @param {string} dimensionKey
 * @param {number} score
 * @returns {string[]}
 */
export function getRecommendedActivities(dimensionKey, score) {
  const assessment = MINI_ASSESSMENTS[dimensionKey];
  if (!assessment) return [];
  const { scoring, recommendedActivities } = assessment;
  for (const [band, data] of Object.entries(scoring)) {
    const [min, max] = data.range;
    if (score >= min && score <= max) return recommendedActivities[band] || [];
  }
  return [];
}

export const DIMENSION_KEYS = Object.keys(MINI_ASSESSMENTS);
