/**
 * familyChallenges.js
 * Collaborative Family Challenge activities for the IATLAS Family tier ($39.99/mo).
 *
 * Each challenge is designed for parent + child(ren) to complete together,
 * spanning all 6 resilience dimensions.
 */

export const FAMILY_CHALLENGES = [
  // ── Agentic-Generative ────────────────────────────────────────────────────
  {
    id: 'fc-agentic-001',
    dimension: 'agentic-generative',
    title: 'Family Goal Setting Week',
    description: 'Work together to set and track one shared family goal for the week.',
    ageRange: 'all',
    difficulty: 'foundation',
    duration: '7 days',
    participants: 'parent + 1+ kids',
    instructions: [
      'Parent and child(ren) brainstorm 3 possible family goals together',
      'Vote on one goal to focus on this week',
      'Create a visual tracker (poster, chart, or digital)',
      'Check in daily as a family on progress',
      'Celebrate completion together at the end of the week',
    ],
    parentNote:
      'This challenge helps kids practice collaborative decision-making and see how shared goals require teamwork. Model positive goal-setting language and celebrate effort, not just outcomes.',
    xpReward: 150,
    badgesUnlocked: ['family-goal-setter'],
    materials: ['Paper/poster board', 'Markers', 'Stickers (optional)'],
  },
  {
    id: 'fc-agentic-002',
    dimension: 'agentic-generative',
    title: 'Family "Yes, And…" Improv Night',
    description:
      'Build creative agency together by playing improv storytelling games that require each person to build on what came before.',
    ageRange: 'all',
    difficulty: 'building',
    duration: '45 minutes',
    participants: 'whole family',
    instructions: [
      'Sit in a circle and start a sentence like "One day, a dragon found a sock…"',
      'Each person adds exactly one sentence using "Yes, and…" to continue the story',
      'Keep going for at least 3 complete rounds',
      'Invent a silly title for your story and write it down',
      'Repeat with a new story starter — try to top the last one!',
    ],
    parentNote:
      'Improv games build creative confidence, active listening, and collaborative thinking. Model enthusiasm and avoid "blocking" — accept every story contribution joyfully.',
    xpReward: 100,
    badgesUnlocked: ['family-storyteller'],
    materials: ['Notebook (optional)', 'Pen'],
  },

  // ── Somatic-Regulative ────────────────────────────────────────────────────
  {
    id: 'fc-somatic-001',
    dimension: 'somatic-regulative',
    title: 'Family Breathwork Morning',
    description: 'Start the day together with 5 minutes of guided breathwork as a family.',
    ageRange: 'all',
    difficulty: 'foundation',
    duration: '5 min/day × 7 days',
    participants: 'parent + 1+ kids',
    instructions: [
      'Gather the family in a quiet space each morning',
      'Practice 4-7-8 breathing together (parent leads): inhale 4 counts, hold 7, exhale 8',
      'Everyone shares one word about how they feel after',
      'Track 7 consecutive days for completion',
    ],
    parentNote:
      'This builds a somatic regulation ritual that becomes a shared family anchor. Keep it short and playful — kids will model your calm energy.',
    xpReward: 120,
    badgesUnlocked: ['family-breathwork-champion'],
    materials: ['Quiet space', 'Optional: guided breathwork audio'],
  },
  {
    id: 'fc-somatic-002',
    dimension: 'somatic-regulative',
    title: 'Nature Walk Body Scan',
    description:
      'Take a 20-minute family walk outside and practice a moving body-scan, noticing physical sensations together.',
    ageRange: 'all',
    difficulty: 'foundation',
    duration: '20–30 minutes',
    participants: 'parent + 1+ kids',
    instructions: [
      'Head outside for a walk in a park, neighborhood, or backyard',
      'Every 5 minutes the parent calls a "body check" — everyone names one sensation they feel (e.g., "my feet are warm", "my shoulders are relaxed")',
      'Notice and name 3 things you can see, 2 you can hear, 1 you can smell',
      'After returning home, each person draws or writes their favorite sensation from the walk',
    ],
    parentNote:
      'Grounding in the physical world helps regulate the nervous system. Encourage curiosity over "correctness" — there are no wrong answers in a body scan.',
    xpReward: 90,
    badgesUnlocked: ['mindful-explorer'],
    materials: ['Comfortable walking shoes', 'Paper & crayons (for debrief)'],
  },

  // ── Cognitive-Narrative ──────────────────────────────────────────────────
  {
    id: 'fc-cognitive-001',
    dimension: 'cognitive-narrative',
    title: 'Family Reframe Challenge',
    description:
      'Practice turning "bad day" stories into resilience-building narratives by finding the hidden strength in difficult moments.',
    ageRange: 'all',
    difficulty: 'building',
    duration: '20 minutes/day × 5 days',
    participants: 'parent + 1+ kids',
    instructions: [
      'At dinner, each person shares one challenge or "hard thing" from their day',
      'The family works together to find ONE strength or learning hidden in that challenge',
      'Parent models the reframe first: "Today I was stressed about the project. The hidden strength was that I care deeply about doing good work."',
      'Write or draw the reframe in a family journal',
      'Complete 5 days to earn the badge',
    ],
    parentNote:
      'Cognitive reframing is a foundational resilience skill. Avoid toxic positivity — the goal is to find genuine meaning, not to pretend hard things aren\'t hard.',
    xpReward: 130,
    badgesUnlocked: ['family-reframe-champion'],
    materials: ['Family journal', 'Pens'],
  },
  {
    id: 'fc-cognitive-002',
    dimension: 'cognitive-narrative',
    title: 'Resilience Role Models Research',
    description:
      'Research a resilient person your family admires, then share what you learned.',
    ageRange: 'all',
    difficulty: 'foundation',
    duration: '2 hours (across 2 days)',
    participants: 'parent + 1+ kids',
    instructions: [
      'Together, choose a person (historical figure, athlete, community member) who showed remarkable resilience',
      'Each person researches one aspect of their story (can use books, internet, or ask a grandparent)',
      'Host a "mini presentation night" where each person shares what they learned',
      'Discuss: which of the 6 resilience dimensions did this person show?',
      'Draw or write one way you can apply their story to your own life',
    ],
    parentNote:
      'Narrative role models are powerful. Let kids choose someone they genuinely admire — the research will be more meaningful and the conversation more authentic.',
    xpReward: 110,
    badgesUnlocked: ['resilience-historian'],
    materials: ['Internet or library access', 'Paper for notes'],
  },

  // ── Relational-Connective ─────────────────────────────────────────────────
  {
    id: 'fc-relational-001',
    dimension: 'relational-connective',
    title: 'Gratitude Circle Ritual',
    description: 'Build a nightly family ritual of sharing gratitude and appreciations.',
    ageRange: 'all',
    difficulty: 'foundation',
    duration: '10 min/day × 14 days',
    participants: 'whole family',
    instructions: [
      'Gather after dinner or before bedtime',
      'Each person shares 1 thing they\'re grateful for today',
      'Each person gives 1 appreciation to another family member',
      'Parent writes down appreciations in a family journal',
      'Complete 14 consecutive days to earn badge',
    ],
    parentNote:
      'This strengthens relational bonds and creates a culture of appreciation. Model vulnerability by sharing specific, heartfelt gratitudes.',
    xpReward: 180,
    badgesUnlocked: ['gratitude-circle-keeper'],
    materials: ['Family journal', 'Pen'],
  },
  {
    id: 'fc-relational-002',
    dimension: 'relational-connective',
    title: 'Family Acts of Kindness Week',
    description:
      'Complete one deliberate act of kindness as a family each day for 7 days.',
    ageRange: 'all',
    difficulty: 'building',
    duration: '7 days',
    participants: 'whole family',
    instructions: [
      'At the start of each day, the family plans one act of kindness together (e.g., bake for a neighbor, write a thank-you card, pick up litter)',
      'Everyone participates in the act',
      'In the evening, each person shares how the act felt',
      'Track acts on a "kindness chart" — aim for 7 by the end of the week',
    ],
    parentNote:
      'Relational resilience grows when we give to others. Choose acts that are genuinely feasible — small, consistent kindness is more powerful than grand gestures.',
    xpReward: 140,
    badgesUnlocked: ['family-kindness-crew'],
    materials: ['Kindness chart (paper)', 'Craft materials (optional)'],
  },

  // ── Emotional-Adaptive ────────────────────────────────────────────────────
  {
    id: 'fc-emotional-001',
    dimension: 'emotional-adaptive',
    title: 'Feelings Weather Report',
    description:
      'Create a daily family ritual of sharing emotions using weather metaphors to build emotional vocabulary.',
    ageRange: 'all',
    difficulty: 'foundation',
    duration: '5 min/day × 10 days',
    participants: 'parent + 1+ kids',
    instructions: [
      'Each morning at breakfast, everyone gives their "feelings weather report" (e.g., "I\'m partly cloudy with a chance of excited")',
      'The parent normalises all weather types — no emotion is "wrong"',
      'At bedtime, check if the weather changed and why',
      'Keep a "family weather journal" for 10 days',
      'At the end, find your most common weather and celebrate what it tells you about your emotional range',
    ],
    parentNote:
      'Metaphors make emotions accessible for children. Avoid correcting their weather — the goal is self-awareness, not accuracy.',
    xpReward: 110,
    badgesUnlocked: ['feelings-forecaster'],
    materials: ['Feelings weather journal', 'Coloured pens or crayons'],
  },
  {
    id: 'fc-emotional-002',
    dimension: 'emotional-adaptive',
    title: 'Family Emotion Mapping',
    description:
      'Create a shared "emotion map" as a family art project that gives everyone a visual vocabulary for feelings.',
    ageRange: 'all',
    difficulty: 'building',
    duration: '1–2 hours',
    participants: 'whole family',
    instructions: [
      'Lay out a large sheet of paper (poster board works great)',
      'Draw a simple body outline in the center',
      'Each family member marks where they feel different emotions in the body (e.g., "anger in my chest", "joy in my belly")',
      'Use different colors for different emotions',
      'Display the finished map somewhere visible and reference it during emotional moments',
    ],
    parentNote:
      'Somatic-emotional mapping helps children connect body signals to feelings before they become overwhelming. Contribute authentically — your vulnerability models emotional intelligence.',
    xpReward: 100,
    badgesUnlocked: ['emotion-cartographer'],
    materials: ['Poster board', 'Coloured markers', 'Tape for display'],
  },

  // ── Spiritual-Existential ─────────────────────────────────────────────────
  {
    id: 'fc-spiritual-001',
    dimension: 'spiritual-existential',
    title: 'Family Values Discovery',
    description:
      'Uncover your family\'s shared core values and create a visual family values statement.',
    ageRange: 'all',
    difficulty: 'building',
    duration: '1–2 hours',
    participants: 'whole family',
    instructions: [
      'Each person writes or draws 5 things they believe are most important in life',
      'Share with the family and look for overlapping themes',
      'Together, choose 3–5 shared family values',
      'Create a "Family Values Poster" with each value illustrated by a different family member',
      'Hang it somewhere visible and refer to it when making decisions',
    ],
    parentNote:
      'Shared values create a sense of meaning and purpose that anchors the whole family during difficult times. Let each person\'s definition stand — values are personal, and diversity is a strength.',
    xpReward: 160,
    badgesUnlocked: ['family-values-champion'],
    materials: ['Paper or poster board', 'Markers', 'Magazines for collage (optional)'],
  },
  {
    id: 'fc-spiritual-002',
    dimension: 'spiritual-existential',
    title: 'Family Legacy Letter',
    description:
      'Each family member writes a short "legacy letter" — a message to their future self about what matters most to them right now.',
    ageRange: 'all',
    difficulty: 'mastery',
    duration: '1 hour',
    participants: 'whole family',
    instructions: [
      'Give each person paper and a quiet space for 20 minutes',
      'Each person writes (or draws) a letter to themselves 10 years in the future',
      'Focus on: "What do I hope you remember about this time? What matters most to you now?"',
      'Share your letters aloud — as much or as little as each person is comfortable with',
      'Seal the letters in envelopes, write the date, and store them in a "family time capsule" box',
    ],
    parentNote:
      'Legacy and meaning-making are core spiritual-existential resilience skills. Younger children can draw pictures instead of writing — the reflection process is what matters.',
    xpReward: 170,
    badgesUnlocked: ['family-legacy-keeper'],
    materials: ['Paper', 'Pens', 'Envelopes', 'A box or container for storage'],
  },
];

/**
 * Returns all FAMILY_CHALLENGES filtered by dimension.
 * @param {string} dimension — dimension key, or 'all'
 * @returns {Array}
 */
export function getFamilyChallengesByDimension(dimension) {
  if (!dimension || dimension === 'all') return FAMILY_CHALLENGES;
  return FAMILY_CHALLENGES.filter((c) => c.dimension === dimension);
}

/**
 * Returns a single challenge by ID.
 * @param {string} id
 * @returns {object|undefined}
 */
export function getFamilyChallengeById(id) {
  return FAMILY_CHALLENGES.find((c) => c.id === id);
}

export const FAMILY_CHALLENGE_DIMENSIONS = [
  { key: 'all',                    label: 'All Dimensions',         icon: '🌐' },
  { key: 'agentic-generative',     label: 'Agentic / Generative',   icon: '🚀' },
  { key: 'somatic-regulative',     label: 'Somatic / Regulative',   icon: '🌿' },
  { key: 'cognitive-narrative',    label: 'Cognitive / Narrative',  icon: '🧠' },
  { key: 'relational-connective',  label: 'Relational / Connective', icon: '🤝' },
  { key: 'emotional-adaptive',     label: 'Emotional / Adaptive',    icon: '💛' },
  { key: 'spiritual-existential',  label: 'Spiritual / Existential', icon: '✨' },
];
