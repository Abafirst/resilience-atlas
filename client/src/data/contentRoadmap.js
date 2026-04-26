/**
 * contentRoadmap.js
 * IATLAS Content Development Roadmap — 3-phase strategic rollout plan.
 */

export const ROADMAP_PHASES = [
  {
    id: 'phase-1',
    phase: 1,
    title: 'Foundation',
    subtitle: 'MVP Launch',
    timeframe: 'Months 1–3',
    goal: 'Launch minimum viable curriculum for immediate use',
    color: '#10b981',
    colorLight: '#d1fae5',
    icon: '/icons/agentic-generative.svg',
    status: 'in-progress',
    deliverables: [
      {
        id: 'p1-adult',
        category: 'Adult Curriculum',
        icon: '/icons/strength.svg',
        items: [
          'Foundation level complete — 5–7 skills per dimension × 6 = 30–42 skills',
          'At least 2–3 Building level skills per dimension (12–18 skills)',
          '1 Mastery skill per dimension (6 skills)',
          'Target total: ~50–65 adult skills',
        ],
        target: 65,
        current: 42,
      },
      {
        id: 'p1-kids',
        category: 'Kids Curriculum',
        icon: '/icons/kids-spark.svg',
        items: [
          'Ages 5–7: 4 activities per dimension (24 total)',
          'Ages 8–10: 4 activities per dimension (24 total)',
          'Ages 11–14: 4 activities per dimension (24 total)',
          'Ages 15–18: 4 activities per dimension (24 total)',
          'Target total: ~96 kids activities',
        ],
        target: 96,
        current: 96,
      },
      {
        id: 'p1-gamification',
        category: 'Gamification (Basic)',
        icon: '/icons/trophy.svg',
        items: [
          'XP system functional',
          '20 starter badges',
          '3 simple quests (7-day, 30-day, Foundation Complete)',
          'Progress dashboard with radar chart',
        ],
        target: 4,
        current: 4,
      },
      {
        id: 'p1-resources',
        category: 'Resources',
        icon: '/icons/reflection.svg',
        items: [
          '10 downloadable PDF worksheets',
          '3 guided audio practices (breathwork, body scan, meditation)',
        ],
        target: 13,
        current: 0,
      },
    ],
    completionCriteria: 'Users can complete a full dimension Foundation → Building progression with gamified tracking.',
  },
  {
    id: 'phase-2',
    phase: 2,
    title: 'Expansion',
    subtitle: 'Full Curriculum',
    timeframe: 'Months 4–6',
    goal: 'Complete all skill levels + advanced gamification',
    color: '#6366f1',
    colorLight: '#eef2ff',
    icon: '/icons/game-target.svg',
    status: 'planned',
    deliverables: [
      {
        id: 'p2-adult',
        category: 'Adult Curriculum',
        icon: '/icons/strength.svg',
        items: [
          'Building level complete — 5–7 skills per dimension × 6 = 30–42 skills',
          'Mastery level complete — 5–7 skills per dimension × 6 = 30–42 skills',
          'Target total: ~100–130 adult skills (all levels)',
        ],
        target: 130,
        current: 42,
      },
      {
        id: 'p2-kids',
        category: 'Kids Curriculum',
        icon: '/icons/kids-spark.svg',
        items: [
          'All age groups: 5+ activities per dimension (120+ total)',
          'Age-specific progression paths',
          'Parent and teacher implementation guides',
        ],
        target: 120,
        current: 96,
      },
      {
        id: 'p2-gamification',
        category: 'Gamification (Advanced)',
        icon: '/icons/trophy.svg',
        items: [
          'Full badge system (68+ badges)',
          'Quest system with 15+ quests',
          'Streak system with milestones',
          'Leaderboards (opt-in)',
        ],
        target: 4,
        current: 3,
      },
      {
        id: 'p2-resources',
        category: 'Resources',
        icon: '/icons/reflection.svg',
        items: [
          '30+ downloadable worksheets',
          '10+ guided audio/video practices',
          'Dimension-specific practice libraries',
        ],
        target: 40,
        current: 0,
      },
    ],
    completionCriteria: 'Users can complete entire IATLAS journey (Foundation → Mastery) across all 6 dimensions.',
  },
  {
    id: 'phase-3',
    phase: 3,
    title: 'Enrichment',
    subtitle: 'Premium Features',
    timeframe: 'Months 7–12',
    goal: 'Advanced personalization + specialized content',
    color: '#d97706',
    colorLight: '#fef3c7',
    icon: '/icons/star.svg',
    status: 'planned',
    deliverables: [
      {
        id: 'p3-personalized',
        category: 'Personalized Pathways',
        icon: '/icons/compass.svg',
        items: [
          'Assessment-driven skill recommendations',
          'Adaptive difficulty based on progress',
          'Custom learning plans',
        ],
        target: 3,
        current: 0,
      },
      {
        id: 'p3-team',
        category: 'Team/School Editions',
        icon: '/icons/facilitation-team.svg',
        items: [
          'Group activities for classrooms',
          'Team resilience challenges',
          'Facilitator guides for teachers/coaches',
        ],
        target: 3,
        current: 0,
      },
      {
        id: 'p3-kids-advanced',
        category: 'Advanced Kids Content',
        icon: '/icons/kids-spark.svg',
        items: [
          'Interactive web games (dimension-specific)',
          'Animated video skill explainers',
          'Kids resilience self-assessment',
        ],
        target: 3,
        current: 0,
      },
      {
        id: 'p3-community',
        category: 'Community Features',
        icon: '/icons/connection.svg',
        items: [
          'Practice sharing (opt-in)',
          'Peer support forums',
          'Live workshops and webinars',
        ],
        target: 3,
        current: 0,
      },
    ],
    completionCriteria: 'IATLAS is a comprehensive, personalized, community-driven resilience ecosystem.',
  },
];

export const QUALITY_CHECKLIST = [
  { id: 'evidence-based',     label: 'Evidence-based (cites ABA/ACT principle)' },
  { id: 'learning-objective', label: 'Clear learning objective' },
  { id: 'step-by-step',       label: 'Step-by-step instructions' },
  { id: 'practical-activity', label: 'Practical activity (not just theory)' },
  { id: 'reflection-prompts', label: 'Reflection prompts' },
  { id: 'age-appropriate',    label: 'Age-appropriate (for kids content)' },
  { id: 'accessibility',      label: 'Accessibility tested (screen reader, keyboard nav)' },
  { id: 'mobile-responsive',  label: 'Mobile-responsive' },
  { id: 'visual-consistency', label: 'Visual consistency (brand icons, colors)' },
  { id: 'proofread',          label: 'Proofread (no typos, 8th-grade reading level)' },
];

export const DEVELOPMENT_WORKFLOW = [
  {
    step: 1,
    title: 'Research',
    time: '30 min',
    icon: '/icons/reflection.svg',
    tasks: [
      'Review ABA/ACT literature',
      'Find evidence-based practices',
      'Identify target behavior/skill',
    ],
  },
  {
    step: 2,
    title: 'Draft',
    time: '60 min',
    icon: '/icons/writing.svg',
    tasks: [
      'Write learning objective',
      'Create step-by-step instructions',
      'Design activity/worksheet',
      'Write reflection prompts',
    ],
  },
  {
    step: 3,
    title: 'Review',
    time: '20 min',
    icon: '/icons/checkmark.svg',
    tasks: [
      'Check against quality checklist',
      'Simplify language (Hemingway App)',
      'Add visual aids',
    ],
  },
  {
    step: 4,
    title: 'Implement',
    time: '30 min',
    icon: '/icons/planning.svg',
    tasks: [
      'Add to data files',
      'Create UI components',
      'Test interactivity',
    ],
  },
  {
    step: 5,
    title: 'Test',
    time: '15 min',
    icon: '/icons/game-target.svg',
    tasks: [
      'Try activity yourself',
      'Get peer/user feedback',
      'Iterate',
    ],
  },
];

export const DOWNLOADABLE_RESOURCES = {
  worksheets: [
    { id: 'values-compass',       title: 'Values Compass Worksheet',        status: 'planned', dimension: 'agentic-generative' },
    { id: 'smart-goals',          title: 'SMART Goals Template',            status: 'planned', dimension: 'agentic-generative' },
    { id: 'action-planner',       title: '1% Action Planner',               status: 'planned', dimension: 'agentic-generative' },
    { id: 'thought-record',       title: 'Thought Record Worksheet',        status: 'planned', dimension: 'cognitive-narrative' },
    { id: 'reframing-practice',   title: 'Reframing Practice Sheet',        status: 'planned', dimension: 'cognitive-narrative' },
    { id: 'support-network-map',  title: 'Support Network Map',             status: 'planned', dimension: 'relational-connective' },
    { id: 'emotion-tracker',      title: 'Emotion Tracker Log',             status: 'planned', dimension: 'emotional-adaptive' },
    { id: 'body-scan-guide',      title: 'Body Scan Guide',                 status: 'planned', dimension: 'somatic-regulative' },
    { id: 'gratitude-journal',    title: 'Gratitude Journal Template',      status: 'planned', dimension: 'spiritual-existential' },
    { id: 'meaning-making',       title: 'Meaning-Making Reflection Sheet', status: 'planned', dimension: 'spiritual-existential' },
  ],
  audioGuides: [
    { id: '478-breathing',   title: '4-7-8 Breathing (5 min)',               status: 'planned', dimension: 'somatic-regulative' },
    { id: 'box-breathing',   title: 'Box Breathing (5 min)',                  status: 'planned', dimension: 'somatic-regulative' },
    { id: 'body-scan',       title: 'Body Scan for Beginners (10 min)',       status: 'planned', dimension: 'somatic-regulative' },
    { id: 'pmr',             title: 'Progressive Muscle Relaxation (15 min)', status: 'planned', dimension: 'somatic-regulative' },
    { id: 'act-defusion',    title: 'ACT Defusion Meditation (8 min)',        status: 'planned', dimension: 'cognitive-narrative' },
  ],
  videoContent: [
    { id: 'what-is-iatlas',        title: 'What is IATLAS? (2 min)',        status: 'future' },
    { id: 'how-to-use-dashboard',  title: 'How to Use the Dashboard (3 min)', status: 'future' },
    { id: 'dimension-explainers',  title: 'Dimension Explainers (6 × 2 min)', status: 'future' },
    { id: 'skill-demos',           title: 'Skill Demos (select skills)',      status: 'future' },
  ],
};

export const PIPELINE_STATS = {
  adult: {
    foundation: { target: 42, current: 42, label: 'Adult Foundation' },
    building:   { target: 42, current: 12, label: 'Adult Building' },
    mastery:    { target: 42, current: 6,  label: 'Adult Mastery' },
  },
  kids: {
    'ages-5-7':   { target: 24, current: 24, label: 'Kids 5–7' },
    'ages-8-10':  { target: 24, current: 24, label: 'Kids 8–10' },
    'ages-11-14': { target: 24, current: 24, label: 'Kids 11–14' },
    'ages-15-18': { target: 24, current: 24, label: 'Kids 15–18' },
  },
  resources: {
    worksheets:   { target: 30, current: 0, label: 'Worksheets' },
    audioGuides:  { target: 10, current: 0, label: 'Audio Guides' },
    videoContent: { target: 10, current: 0, label: 'Video Content' },
  },
};
