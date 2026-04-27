/**
 * developmentalRoadmap.js
 * IATLAS Developmental Milestones data — used by the Circular Evolution Wheel.
 * Defines age-group milestones across all 6 resilience dimensions.
 */

export const DEVELOPMENTAL_MILESTONES = {
  'ages-5-7': {
    label: 'Foundation (Ages 5-7)',
    ageRange: '5-7',
    ring: 1, // Inner ring
    color: '#10b981', // Green
    icon: '/icons/seedling.svg',
    overview: 'Building basic resilience skills through play, exploration, and simple challenges.',
    dimensions: {
      'agentic-generative': {
        title: 'I Can Try!',
        description: 'Simple choices, trying new things, "I can do it" mindset',
        keySkills: [
          'Making simple choices (snack, activity)',
          'Attempting new tasks with encouragement',
          'Expressing preferences ("I want to...")',
          'Completing simple tasks independently',
        ],
        activitiesCount: 8,
        badges: ['first-try-badge', 'choice-maker-badge'],
      },
      'somatic-regulative': {
        title: 'My Body, My Friend',
        description: 'Body awareness, simple movement, energy recognition',
        keySkills: [
          'Identifying body parts and sensations',
          'Simple breathing exercises (balloon breath)',
          'Recognizing energy levels (wiggly vs. calm)',
          'Basic coordination games',
        ],
        activitiesCount: 8,
        badges: ['body-explorer-badge', 'calm-breathing-badge'],
      },
      'cognitive-narrative': {
        title: 'Problem-Solving Play',
        description: 'Concrete thinking, simple puzzles, cause-and-effect',
        keySkills: [
          'Solving simple puzzles and problems',
          'Understanding basic cause-and-effect',
          'Retelling simple stories',
          'Categorizing objects (colors, shapes)',
        ],
        activitiesCount: 8,
        badges: ['puzzle-solver-badge', 'story-teller-badge'],
      },
      'relational-connective': {
        title: 'Sharing & Friends',
        description: 'Turn-taking, cooperation, simple empathy',
        keySkills: [
          'Taking turns in games',
          'Sharing toys and materials',
          "Recognizing others' feelings (happy, sad)",
          'Playing cooperatively',
        ],
        activitiesCount: 8,
        badges: ['sharing-star-badge', 'friend-maker-badge'],
      },
      'emotional-adaptive': {
        title: 'Feeling Faces',
        description: 'Naming emotions, simple coping strategies',
        keySkills: [
          'Identifying basic emotions (happy, sad, mad, scared)',
          'Expressing feelings with words or pictures',
          'Using simple calming strategies (hug, deep breath)',
          'Understanding "big feelings are okay"',
        ],
        activitiesCount: 8,
        badges: ['feelings-detective-badge', 'calm-down-champion-badge'],
      },
      'spiritual-existential': {
        title: 'Wonder & Curiosity',
        description: 'Exploring nature, asking "why?", simple gratitude',
        keySkills: [
          'Asking curious questions about the world',
          'Finding beauty in nature',
          'Expressing gratitude ("Thank you")',
          'Simple mindfulness (listening to sounds)',
        ],
        activitiesCount: 8,
        badges: ['nature-explorer-badge', 'gratitude-buddy-badge'],
      },
    },
  },
  'ages-8-10': {
    label: 'Building (Ages 8-10)',
    ageRange: '8-10',
    ring: 2, // Second ring
    color: '#3b82f6', // Blue
    icon: '/icons/construction.svg',
    overview: 'Developing more complex resilience skills with guided challenges and goal-setting.',
    dimensions: {
      'agentic-generative': {
        title: 'Goal Getter',
        description: 'Setting small goals, planning, persisting through challenges',
        keySkills: [
          'Setting and tracking simple goals',
          'Breaking tasks into steps',
          'Persisting when things are hard',
          'Celebrating effort and progress',
        ],
        activitiesCount: 8,
        badges: ['goal-setter-badge', 'persistence-champion-badge'],
      },
      'somatic-regulative': {
        title: 'Breathwork Basics',
        description: 'Intentional breathing, recognizing stress signals, grounding',
        keySkills: [
          'Using breathwork to calm down (4-7-8, box breathing)',
          'Recognizing body signals of stress (tight tummy, fast heart)',
          'Grounding techniques (5-4-3-2-1)',
          'Simple progressive muscle relaxation',
        ],
        activitiesCount: 8,
        badges: ['breathwork-beginner-badge', 'grounding-guru-badge'],
      },
      'cognitive-narrative': {
        title: 'Critical Thinker',
        description: 'Problem-solving strategies, flexible thinking, planning',
        keySkills: [
          'Brainstorming multiple solutions',
          'Evaluating "good fit" vs. "not a good fit" choices',
          'Thinking flexibly (Plan B thinking)',
          'Understanding perspectives (others see differently)',
        ],
        activitiesCount: 8,
        badges: ['problem-solver-badge', 'flexible-thinker-badge'],
      },
      'relational-connective': {
        title: 'Friendship Skills',
        description: 'Teamwork, listening, conflict resolution basics',
        keySkills: [
          'Active listening ("I heard you say...")',
          'Working in teams toward a shared goal',
          'Resolving small conflicts with words',
          'Showing empathy and kindness',
        ],
        activitiesCount: 8,
        badges: ['team-player-badge', 'empathy-champion-badge'],
      },
      'emotional-adaptive': {
        title: 'Emotion Regulation',
        description: 'Coping strategies, emotional vocabulary, self-soothing',
        keySkills: [
          'Naming complex emotions (frustrated, disappointed, proud)',
          'Choosing coping strategies from a "toolbox"',
          'Understanding emotional triggers',
          'Self-soothing techniques (positive self-talk, safe space)',
        ],
        activitiesCount: 8,
        badges: ['emotion-expert-badge', 'coping-toolbox-badge'],
      },
      'spiritual-existential': {
        title: 'Values Explorer',
        description: 'What matters to me, fairness, belonging',
        keySkills: [
          'Identifying personal values (kindness, honesty, fairness)',
          "Understanding \"what's fair\"",
          'Finding where they belong (groups, hobbies)',
          'Simple meaning-making (why we help others)',
        ],
        activitiesCount: 8,
        badges: ['values-explorer-badge', 'fairness-champion-badge'],
      },
    },
  },
  'ages-11-14': {
    label: 'Explorer (Ages 11-14)',
    ageRange: '11-14',
    ring: 3, // Third ring
    color: '#8b5cf6', // Purple
    icon: '/icons/compass.svg',
    overview: 'Navigating independence, identity, and deeper emotional complexity with advanced strategies.',
    dimensions: {
      'agentic-generative': {
        title: 'Independence Builder',
        description: 'Self-direction, decision-making, owning choices',
        keySkills: [
          'Making independent decisions and owning outcomes',
          'Setting long-term goals (weeks/months)',
          'Advocating for needs and boundaries',
          'Taking initiative without prompting',
        ],
        activitiesCount: 8,
        badges: ['independence-champion-badge', 'decision-maker-badge'],
      },
      'somatic-regulative': {
        title: 'Mind-Body Connection',
        description: 'Advanced regulation, body-emotion link, stress awareness',
        keySkills: [
          'Recognizing how emotions show up in the body',
          'Using movement to shift emotional states',
          'Advanced breathwork (coherent breathing, paced breathing)',
          'Managing stress proactively',
        ],
        activitiesCount: 8,
        badges: ['mind-body-master-badge', 'stress-navigator-badge'],
      },
      'cognitive-narrative': {
        title: 'Abstract Reasoning',
        description: 'Complex problem-solving, reframing, metacognition',
        keySkills: [
          'Thinking abstractly and hypothetically',
          'Reframing negative thoughts (cognitive reframing)',
          'Metacognition (thinking about thinking)',
          'Planning multi-step projects',
        ],
        activitiesCount: 8,
        badges: ['abstract-thinker-badge', 'reframing-pro-badge'],
      },
      'relational-connective': {
        title: 'Conflict Resolution',
        description: 'Healthy boundaries, peer navigation, assertiveness',
        keySkills: [
          'Setting and respecting boundaries',
          'Navigating peer pressure',
          'Assertive communication (I-statements)',
          'Repairing relationships after conflict',
        ],
        activitiesCount: 8,
        badges: ['boundary-setter-badge', 'conflict-navigator-badge'],
      },
      'emotional-adaptive': {
        title: 'Stress Management',
        description: 'Advanced coping, emotional complexity, resilience',
        keySkills: [
          'Managing complex emotions (guilt, shame, anxiety)',
          'Using multiple coping strategies effectively',
          'Building emotional resilience',
          'Supporting others emotionally',
        ],
        activitiesCount: 8,
        badges: ['stress-master-badge', 'resilience-builder-badge'],
      },
      'spiritual-existential': {
        title: 'Identity & Meaning',
        description: 'Who am I? What matters? Purpose exploration',
        keySkills: [
          'Exploring personal identity ("Who am I?")',
          'Understanding personal values deeply',
          'Finding meaning in challenges',
          'Connecting to something bigger (community, purpose)',
        ],
        activitiesCount: 8,
        badges: ['identity-explorer-badge', 'meaning-maker-badge'],
      },
    },
  },
  'ages-15-18': {
    label: 'Mastery (Ages 15-18)',
    ageRange: '15-18',
    ring: 4, // Outer ring
    color: '#f59e0b', // Amber
    icon: '/icons/trophy.svg',
    overview: 'Mastering resilience skills for life transitions, leadership, and complex challenges.',
    dimensions: {
      'agentic-generative': {
        title: 'Leadership & Agency',
        description: 'Self-authorship, leadership, life direction',
        keySkills: [
          'Leading others and projects',
          'Making major life decisions independently',
          'Self-authorship (defining own path)',
          'Mentoring younger peers',
        ],
        activitiesCount: 8,
        badges: ['leadership-badge', 'self-author-badge'],
      },
      'somatic-regulative': {
        title: 'Advanced Regulation',
        description: 'Mastery of somatic tools, teaching others',
        keySkills: [
          'Teaching regulation strategies to others',
          'Customizing regulation toolkit for self',
          'Using somatic awareness in high-stress situations',
          'Advanced mindfulness and meditation',
        ],
        activitiesCount: 8,
        badges: ['regulation-master-badge', 'mindfulness-teacher-badge'],
      },
      'cognitive-narrative': {
        title: 'Complex Problem-Solving',
        description: 'Strategic thinking, systems thinking, creativity',
        keySkills: [
          'Systems thinking (seeing big picture)',
          'Strategic planning for complex goals',
          'Creative problem-solving in ambiguous situations',
          'Critical analysis and evaluation',
        ],
        activitiesCount: 8,
        badges: ['strategic-thinker-badge', 'systems-thinker-badge'],
      },
      'relational-connective': {
        title: 'Healthy Relationships',
        description: 'Mature relationships, interdependence, communication',
        keySkills: [
          'Building and maintaining healthy relationships',
          'Balancing independence and interdependence',
          'Advanced conflict resolution',
          'Navigating romantic relationships healthily',
        ],
        activitiesCount: 8,
        badges: ['relationship-master-badge', 'interdependence-badge'],
      },
      'emotional-adaptive': {
        title: 'Resilience Strategies',
        description: 'Mastery of emotional resilience, supporting others',
        keySkills: [
          'Bouncing back from major setbacks',
          'Supporting others through crisis',
          'Managing chronic stress and uncertainty',
          'Post-traumatic growth mindset',
        ],
        activitiesCount: 8,
        badges: ['resilience-master-badge', 'crisis-supporter-badge'],
      },
      'spiritual-existential': {
        title: 'Life Philosophy',
        description: 'Purpose, worldview, existential questions',
        keySkills: [
          'Articulating personal life philosophy',
          'Finding purpose in suffering',
          'Exploring existential questions (meaning of life)',
          'Connecting personal values to action',
        ],
        activitiesCount: 8,
        badges: ['philosopher-badge', 'purpose-finder-badge'],
      },
    },
  },
};

// Dimension metadata for the wheel
export const DIMENSION_CONFIG = {
  'agentic-generative': {
    name: 'Agentic-Generative',
    shortName: 'Agentic',
    color: '#ef4444', // Red
    angle: 0, // Top (12 o'clock)
    icon: '/icons/agentic-generative.svg',
  },
  'somatic-regulative': {
    name: 'Somatic-Regulative',
    shortName: 'Somatic',
    color: '#f59e0b', // Amber
    angle: 60, // 2 o'clock
    icon: '/icons/somatic-regulative.svg',
  },
  'cognitive-narrative': {
    name: 'Cognitive-Interpretive',
    shortName: 'Cognitive',
    color: '#10b981', // Green
    angle: 120, // 4 o'clock
    icon: '/icons/cognitive-narrative.svg',
  },
  'relational-connective': {
    name: 'Relational-Connective',
    shortName: 'Relational',
    color: '#3b82f6', // Blue
    angle: 180, // 6 o'clock (bottom)
    icon: '/icons/relational-connective.svg',
  },
  'emotional-adaptive': {
    name: 'Emotional-Adaptive',
    shortName: 'Emotional',
    color: '#8b5cf6', // Purple
    angle: 240, // 8 o'clock
    icon: '/icons/emotional-adaptive.svg',
  },
  'spiritual-existential': {
    name: 'Spiritual-Existential',
    shortName: 'Spiritual',
    color: '#ec4899', // Pink
    angle: 300, // 10 o'clock
    icon: '/icons/spiritual-existential.svg',
  },
};
