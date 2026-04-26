/**
 * spiritualExistential.js
 * Skill module definitions for the Spiritual-Existential dimension.
 * Grounded in ACT values work, meaning-making research, and existential psychology.
 */

export const spiritualExistentialModules = [
  // ── Foundation Level ────────────────────────────────────────────────────────
  {
    id: 'spiritual-values-clarification',
    dimension: 'spiritual-existential',
    level: 'foundation',
    order: 1,
    title: 'Values Re-Clarification',
    icon: '/icons/spiritual-reflective.svg',
    duration: '15 minutes',
    xpReward: 10,
    badge: {
      id: 'values-seeker',
      name: 'Values Seeker',
      icon: '🧭',
      requirement: 'Complete a values card sort and write your top 5 with definitions',
    },
    learningObjective: 'Revisit and refine your core values as an existential anchor',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Values clarification is the cornerstone of ACT and one of the most research-supported resilience interventions. Viktor Frankl\'s logotherapy demonstrated that meaning — derived from values — is the most powerful source of resilience. When we are clear about what we stand for, we can endure almost anything. Regular values clarification keeps this anchor strong and alive.',
    },
    instructions: [
      'Below are 30 common human values.',
      'Read through the list and circle all that resonate with you.',
      'Narrow to your top 10.',
      'From those 10, select your absolute top 5.',
      'Write a personal definition for each — what this value means specifically to you.',
      'Rate how well you are currently living each value (1–10).',
    ],
    activity: {
      type: 'worksheet',
      valueSuggestions: [
        'Adventure', 'Achievement', 'Authenticity', 'Balance', 'Beauty',
        'Belonging', 'Compassion', 'Contribution', 'Courage', 'Creativity',
        'Faith', 'Family', 'Freedom', 'Growth', 'Health',
        'Humor', 'Integrity', 'Justice', 'Knowledge', 'Love',
        'Loyalty', 'Mindfulness', 'Nature', 'Peace', 'Purpose',
        'Service', 'Simplicity', 'Spirituality', 'Wisdom', 'Wonder',
      ],
      fields: [
        {
          id: 'value1',
          label: 'Top value #1',
          placeholder: 'e.g., Integrity',
          type: 'text',
        },
        {
          id: 'value1_definition',
          label: 'What this value means to me',
          placeholder: 'e.g., Being honest with myself and others even when it\'s uncomfortable',
          type: 'textarea',
        },
        {
          id: 'value1_living',
          label: 'How well am I living this value right now? (1–10)',
          placeholder: 'e.g., 7',
          type: 'text',
        },
        {
          id: 'value2',
          label: 'Top value #2',
          placeholder: 'e.g., Growth',
          type: 'text',
        },
        {
          id: 'value2_definition',
          label: 'What this value means to me',
          placeholder: 'Describe your personal meaning',
          type: 'textarea',
        },
        {
          id: 'value2_living',
          label: 'Living score (1–10)',
          placeholder: 'e.g., 8',
          type: 'text',
        },
        {
          id: 'value3',
          label: 'Top value #3',
          placeholder: 'e.g., Connection',
          type: 'text',
        },
        {
          id: 'value3_definition',
          label: 'What this value means to me',
          placeholder: 'Describe your personal meaning',
          type: 'textarea',
        },
        {
          id: 'value3_living',
          label: 'Living score (1–10)',
          placeholder: 'e.g., 5',
          type: 'text',
        },
        {
          id: 'neglected_value',
          label: 'The most neglected value in my life right now',
          placeholder: 'Which value has the biggest gap between its importance and your daily living?',
          type: 'textarea',
        },
        {
          id: 'one_change',
          label: 'One concrete change that would close the biggest gap',
          placeholder: 'e.g., To better live Connection, I will schedule a real conversation (not text) with someone I love each week',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'Have your values changed since you last explored them? How?',
      'Where are your actions most out of alignment with your values?',
      'What would a fully values-aligned week look like?',
    ],
    resources: [],
  },
  {
    id: 'spiritual-meaning-making',
    dimension: 'spiritual-existential',
    level: 'foundation',
    order: 2,
    title: 'Meaning-Making Reflection',
    icon: '/icons/spiritual-reflective.svg',
    duration: '15–20 minutes',
    xpReward: 15,
    badge: {
      id: 'meaning-finder',
      name: 'Meaning Finder',
      icon: '💡',
      requirement: 'Complete a meaning-making reflection on one past adversity',
    },
    learningObjective: 'Find meaning in past adversity to strengthen existential resilience',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Viktor Frankl, who survived Nazi concentration camps, argued that the primary human drive is the search for meaning — not pleasure or power. Post-traumatic growth research (Tedeschi & Calhoun) confirms that the capacity to find meaning in adversity is one of the strongest predictors of resilience and recovery. Meaning doesn\'t justify suffering — it transforms it.',
    },
    instructions: [
      'Think of a past difficulty or adversity you\'ve worked through.',
      'This should be something you\'ve processed enough to reflect on (not an acute trauma).',
      'Answer the journaling prompts with honesty and openness.',
      'Notice: you don\'t have to find silver linings — just what is genuinely true.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'difficulty',
          label: 'The difficulty I\'m reflecting on',
          placeholder: 'Brief description — no need for detail',
          type: 'textarea',
        },
        {
          id: 'what_taught',
          label: '"What did this teach me?" (about myself, life, others)',
          placeholder: 'e.g., It taught me that I can survive things I thought would break me',
          type: 'textarea',
        },
        {
          id: 'unexpected_gifts',
          label: 'Unexpected gifts, insights, or growth that came from this',
          placeholder: 'e.g., I became closer with my sister; I discovered what I truly value',
          type: 'textarea',
        },
        {
          id: 'who_i_became',
          label: 'Who I became because of (not despite) this experience',
          placeholder: 'e.g., More compassionate; less naive; clearer about what matters',
          type: 'textarea',
        },
        {
          id: 'meaning_statement',
          label: 'The meaning I make of this experience in one or two sentences',
          placeholder: 'e.g., This experience showed me that love is stronger than loss, and that I have the capacity to begin again',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'How does having a meaning narrative change how you hold this experience?',
      'What would you say to someone going through something similar?',
      'How does this experience connect to your deepest values?',
    ],
    resources: [],
  },
  {
    id: 'spiritual-gratitude-practice',
    dimension: 'spiritual-existential',
    level: 'foundation',
    order: 3,
    title: 'Gratitude Practice',
    icon: '/icons/spiritual-reflective.svg',
    duration: '5 minutes daily',
    xpReward: 10,
    badge: {
      id: 'gratitude-beginner',
      name: 'Gratitude Beginner',
      icon: '🙏',
      requirement: 'Complete the "3 Good Things" practice for 7 consecutive days',
    },
    learningObjective: 'Cultivate appreciative attention to strengthen existential well-being',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Martin Seligman\'s "Three Good Things" exercise is among the most replicated positive psychology interventions. Regular gratitude practice shifts attentional bias from threat to appreciation, increases life satisfaction, reduces depressive symptoms, and strengthens social bonds. It trains the brain to notice what is good — not as toxic positivity, but as accurate perception.',
    },
    instructions: [
      'Each evening before sleep, write 3 specific good things that happened today.',
      '"Good things" can be small: a kind word, a moment of beauty, a task completed.',
      'For each good thing, write WHY it happened (this deepens the gratitude response).',
      'Be specific rather than general: "a delicious cup of coffee at 8am" not "coffee."',
      'Do this for 7 consecutive days.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'day1_good1',
          label: 'Day 1 — Good thing #1 + Why it happened',
          placeholder: 'e.g., My colleague checked in on me / Because she is caring and noticed I seemed stressed',
          type: 'textarea',
        },
        {
          id: 'day1_good2',
          label: 'Day 1 — Good thing #2 + Why',
          placeholder: 'Good thing + why it happened',
          type: 'textarea',
        },
        {
          id: 'day1_good3',
          label: 'Day 1 — Good thing #3 + Why',
          placeholder: 'Good thing + why it happened',
          type: 'textarea',
        },
        {
          id: 'day7_reflection',
          label: 'After 7 days — what I notice about my attention and mood',
          placeholder: 'e.g., I\'m noticing small good things throughout the day now; I feel less negative than before',
          type: 'textarea',
        },
        {
          id: 'recurring_themes',
          label: 'Recurring gratitude themes across the 7 days',
          placeholder: 'e.g., Most of my gratitude is for people — relationships matter most to me',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'How did your noticing of good things change over 7 days?',
      'What surprising things made it onto your list?',
      'How might this practice connect to your deepest values and sources of meaning?',
    ],
    resources: [],
  },
  {
    id: 'spiritual-purpose-statement',
    dimension: 'spiritual-existential',
    level: 'foundation',
    order: 4,
    title: 'Purpose Statement Draft',
    icon: '/icons/spiritual-reflective.svg',
    duration: '15–20 minutes',
    xpReward: 15,
    badge: {
      id: 'purpose-seeker',
      name: 'Purpose Seeker',
      icon: '🎯',
      requirement: 'Draft a personal purpose statement',
    },
    learningObjective: 'Articulate your personal "why" — the purpose that grounds your resilience',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Friedrich Nietzsche wrote "He who has a why can endure almost any how" — and resilience research confirms it. People with a clear sense of purpose show faster recovery from adversity, greater physical health, lower mortality rates, and higher engagement in meaningful activity. Your purpose statement is your existential anchor when circumstances are hardest.',
    },
    instructions: [
      'Answer the reflection questions below honestly.',
      'Look for patterns across your answers.',
      'Draft a purpose statement: "My purpose is to [contribution] so that [impact] because [value]."',
      'Keep it true to you — not what sounds impressive, but what actually moves you.',
      'Revisit and refine it over time.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'flow_activities',
          label: 'Activities that make me lose track of time (flow states)',
          placeholder: 'e.g., Mentoring others, writing, solving complex problems, creating music',
          type: 'textarea',
        },
        {
          id: 'world_problem',
          label: 'If I could solve one problem in the world, what would it be?',
          placeholder: 'e.g., Loneliness in elderly people; lack of access to mental health support',
          type: 'textarea',
        },
        {
          id: 'impact_memory',
          label: 'Times when I felt I made a real difference to someone or something',
          placeholder: 'e.g., When I helped my nephew through a hard year; when my project created real change',
          type: 'textarea',
        },
        {
          id: 'legacy',
          label: 'What I want to be remembered for',
          placeholder: 'e.g., Being a caring presence; contributing something meaningful; raising children who flourished',
          type: 'textarea',
        },
        {
          id: 'purpose_draft',
          label: 'My purpose statement draft',
          placeholder: 'My purpose is to [what I do/contribute] so that [the impact] because [the value/why it matters to me]',
          type: 'textarea',
        },
        {
          id: 'gut_check',
          label: 'When I read my purpose statement, how does it feel? (gut check)',
          placeholder: 'e.g., True and a little daunting; excited; peaceful; or — needs more work',
          type: 'text',
        },
      ],
    },
    reflectionPrompts: [
      'Does your purpose statement surprise you, or did you know it all along?',
      'How does having a purpose statement change how you see your daily activities?',
      'What would need to change in your life to live more fully in alignment with this purpose?',
    ],
    resources: [],
  },
  {
    id: 'spiritual-daily-reflection',
    dimension: 'spiritual-existential',
    level: 'foundation',
    order: 5,
    title: 'Daily Reflection Ritual',
    icon: '/icons/spiritual-reflective.svg',
    duration: '5–10 minutes daily',
    xpReward: 10,
    badge: {
      id: 'reflective-soul',
      name: 'Reflective Soul',
      icon: '🌙',
      requirement: 'Complete 7 days of evening reflection',
    },
    learningObjective: 'Build a contemplative practice for integration and meaning-making',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Contemplative practices — including journaling, reflection, meditation, and prayer — are associated with greater psychological integration, reduced rumination, and stronger sense of life meaning. The act of reviewing a day with intention transforms raw experience into wisdom. Daily reflection is how lived experience becomes learning.',
    },
    instructions: [
      'Each evening, find 5–10 minutes of quiet.',
      'Put away screens. Sit comfortably.',
      'Work through the evening reflection prompts below.',
      'Write whatever comes — no need for polished prose.',
      'End with one intention for tomorrow.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'date',
          label: 'Date',
          placeholder: 'Today\'s date',
          type: 'text',
        },
        {
          id: 'peak_moment',
          label: 'The peak moment of today (what mattered most)',
          placeholder: 'e.g., The conversation with my daughter at dinner',
          type: 'textarea',
        },
        {
          id: 'hard_moment',
          label: 'The hardest moment of today',
          placeholder: 'e.g., The email from my manager that felt critical',
          type: 'textarea',
        },
        {
          id: 'what_i_gave',
          label: 'What I gave today (my contribution)',
          placeholder: 'e.g., Listened carefully to a colleague; finished the project on time',
          type: 'textarea',
        },
        {
          id: 'tomorrow_intention',
          label: 'One intention for tomorrow',
          placeholder: 'e.g., Be more present with my family; start the hard task first thing',
          type: 'text',
        },
      ],
    },
    reflectionPrompts: [
      'What themes are emerging across your weekly reflections?',
      'How does taking this time change the quality of your evenings?',
      'What does your pattern of "peak moments" tell you about your values?',
    ],
    resources: [],
  },

  // ── Building Level ───────────────────────────────────────────────────────────
  {
    id: 'spiritual-existential-journaling',
    dimension: 'spiritual-existential',
    level: 'building',
    order: 6,
    title: 'Existential Journaling',
    icon: '/icons/spiritual-reflective.svg',
    duration: '20–30 minutes',
    xpReward: 25,
    badge: {
      id: 'philosopher',
      name: 'Philosopher',
      icon: '📖',
      requirement: 'Complete existential journaling prompts across 3 big questions',
    },
    learningObjective: 'Explore fundamental questions of meaning, mortality, freedom, and connection',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Existential psychology (Yalom, Frankl, May) identifies four ultimate concerns: death, freedom, isolation, and meaninglessness. Engaging with these questions rather than avoiding them is associated with greater equanimity, reduced anxiety, and deeper life engagement. ACT explicitly encourages contact with what matters most — and what matters most is often revealed when we face our finitude.',
    },
    instructions: [
      'Choose one of the three existential prompts below.',
      'Set aside 20–30 minutes of uninterrupted time.',
      'Write honestly — this is for your eyes only.',
      'Don\'t aim for resolution; aim for honest engagement.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'prompt_choice',
          label: 'The prompt I am exploring',
          placeholder: 'Choose: Mortality / Freedom / Meaning',
          type: 'text',
        },
        {
          id: 'mortality_reflection',
          label: 'MORTALITY: If I knew I had 1 year to live, how would I live differently?',
          placeholder: 'Write freely — what would you stop? Start? What matters most when you remove the assumption of endless time?',
          type: 'textarea',
        },
        {
          id: 'freedom_reflection',
          label: 'FREEDOM: In what areas of my life am I pretending I have no choice?',
          placeholder: 'Where are you avoiding responsibility for your choices? What would it mean to fully own your freedom?',
          type: 'textarea',
        },
        {
          id: 'meaning_reflection',
          label: 'MEANING: What would make my life feel meaningful even if I never achieved external success?',
          placeholder: 'What inherent meaning exists in your daily life that you might be taking for granted?',
          type: 'textarea',
        },
        {
          id: 'key_insight',
          label: 'The most important insight from this journaling session',
          placeholder: 'What emerged that you want to carry forward?',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What uncomfortable truth did this exercise bring up?',
      'How does engaging with big questions change your relationship to everyday concerns?',
      'What would you do differently starting tomorrow based on what emerged?',
    ],
    resources: [],
  },
  {
    id: 'spiritual-alignment-audit',
    dimension: 'spiritual-existential',
    level: 'building',
    order: 7,
    title: 'Values-Action Alignment Audit',
    icon: '/icons/spiritual-reflective.svg',
    duration: '20 minutes',
    xpReward: 20,
    badge: {
      id: 'alignment-auditor',
      name: 'Alignment Auditor',
      icon: '⚖️',
      requirement: 'Complete a full weekly alignment audit across all core values',
    },
    learningObjective: 'Systematically check whether your actions match your values each week',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Values are only meaningful if they shape action. Research on values-behavior congruence shows that the gap between stated values and actual behavior is a primary source of shame, low self-esteem, and inauthenticity. Regular alignment audits create accountability to yourself — not to an external judge — and close the gap between who you are and who you aspire to be.',
    },
    instructions: [
      'List your top 5 values.',
      'For each value, score how well your actions aligned with it this week (0–10).',
      'For any score under 7, identify the specific gap — what were you doing instead?',
      'For each gap, identify one action to improve alignment next week.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'value1_name',
          label: 'Value #1 name',
          placeholder: 'e.g., Integrity',
          type: 'text',
        },
        {
          id: 'value1_score',
          label: 'Value #1 alignment this week (0–10)',
          placeholder: 'e.g., 8',
          type: 'text',
        },
        {
          id: 'value1_gap',
          label: 'Value #1 gap (if score < 7)',
          placeholder: 'e.g., Said yes to things I didn\'t want to do; avoided a hard conversation',
          type: 'textarea',
        },
        {
          id: 'value2_name',
          label: 'Value #2 name',
          placeholder: 'e.g., Growth',
          type: 'text',
        },
        {
          id: 'value2_score',
          label: 'Value #2 alignment this week (0–10)',
          placeholder: 'e.g., 6',
          type: 'text',
        },
        {
          id: 'value2_gap',
          label: 'Value #2 gap',
          placeholder: 'e.g., Spent evenings watching TV instead of learning; skipped my reading',
          type: 'textarea',
        },
        {
          id: 'overall_score',
          label: 'Overall values alignment this week (0–10)',
          placeholder: 'e.g., 7',
          type: 'text',
        },
        {
          id: 'biggest_gap',
          label: 'The biggest alignment gap this week',
          placeholder: 'e.g., Connection — I isolated and barely spoke to anyone I care about',
          type: 'textarea',
        },
        {
          id: 'next_week_action',
          label: 'One action next week to close the biggest gap',
          placeholder: 'e.g., Schedule a call with my sister; go to the community group',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What patterns emerge across multiple weeks of audits?',
      'Which value is consistently hardest to live? Why?',
      'How does the audit change your experience of Monday morning?',
    ],
    resources: [],
  },

  // ── Mastery Level ────────────────────────────────────────────────────────────
  {
    id: 'spiritual-transcendence',
    dimension: 'spiritual-existential',
    level: 'mastery',
    order: 8,
    title: 'Transcendence Practice',
    icon: '/icons/spiritual-reflective.svg',
    duration: '45–60 minutes',
    xpReward: 30,
    badge: {
      id: 'transcendence-explorer',
      name: 'Transcendence Explorer',
      icon: '✨',
      requirement: 'Complete an awe walk and reflection, then describe your transcendent experience',
    },
    learningObjective: 'Connect to something larger than yourself through awe and transcendent experience',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Research on awe — the feeling of being in the presence of something vast that transcends current understanding — shows remarkable effects: reduced self-centeredness, increased prosocial behavior, greater humility, reduced inflammation markers, and stronger sense of meaning. Dacher Keltner\'s work suggests awe is a fundamental human need. Transcendence practices connect the individual to the larger web of existence — one of the most powerful sources of existential resilience.',
    },
    instructions: [
      'AWE WALK: Go for a 20–30 minute walk with the specific intention of noticing awe.',
      'Look for: vast scales (sky, horizon, ancient trees), beauty (light, natural patterns), unexpected complexity (how things work), profound goodness (kindness between people).',
      'When you feel awe, stop. Stay with it for at least 30 seconds.',
      'After your walk, complete the reflection below.',
      'Then consider: what form of transcendence is most natural and accessible for you?',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'awe_moments',
          label: 'Awe moments during my walk',
          placeholder: 'Describe 2–3 moments where you felt something larger than yourself: what you saw, how your body felt, what happened to your sense of self',
          type: 'textarea',
        },
        {
          id: 'self_dissolution',
          label: 'Did you notice any "small self" dissolution — a temporary lessening of your usual concerns?',
          placeholder: 'e.g., For a moment, my worries about work felt very small. I was just part of something larger.',
          type: 'textarea',
        },
        {
          id: 'what_is_transcendence',
          label: 'What does "something larger than myself" mean to me?',
          placeholder: 'e.g., Nature, human goodness, the universe, God, the flow of generations, love, art, music',
          type: 'textarea',
        },
        {
          id: 'access_practices',
          label: 'Practices that help me access transcendence',
          placeholder: 'e.g., Being in nature, music, prayer, meditation, deep conversation, art, service to others',
          type: 'textarea',
        },
        {
          id: 'integration',
          label: 'How transcendence connects to my daily life and resilience',
          placeholder: 'How does touching something larger help you navigate the small and difficult?',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'When in your life have you felt most connected to something greater than yourself?',
      'How might more regular transcendence experiences change your relationship to adversity?',
      'What is the opposite of transcendence — and how does it feel?',
    ],
    resources: [],
  },
];
