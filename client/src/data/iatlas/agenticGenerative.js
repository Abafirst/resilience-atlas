/**
 * agenticGenerative.js
 * Skill module definitions for the Agentic-Generative dimension.
 * Grounded in ACT (Committed Action, Values) and ABA (goal-setting, shaping).
 */

export const agenticGenerativeModules = [
  // ── Foundation Level ────────────────────────────────────────────────────────
  {
    id: 'agentic-values-compass',
    dimension: 'agentic-generative',
    level: 'foundation',
    order: 1,
    title: 'Values Compass Exercise',
    icon: '/icons/compass.svg',
    duration: '5–10 minutes',
    xpReward: 10,
    badge: {
      id: 'values-explorer',
      name: 'Values Explorer',
      icon: '🧭',
      requirement: 'Complete all 3 values statements',
    },
    learningObjective: 'Identify your top 3 core values to guide goal-setting',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Values are the compass that directs committed action in ACT. When you know what truly matters to you, every goal becomes purposeful and setbacks become navigable. Research shows that values-driven action is one of the strongest predictors of sustained motivation and psychological well-being.',
    },
    instructions: [
      'Review the values list in the worksheet below.',
      'Circle 10 values that resonate most strongly with you.',
      'Narrow your list to 5 values that feel essential to who you are.',
      'Rank your top 3 in order of personal importance.',
      'Write one sentence for each: "This value matters to me because…"',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'value1',
          label: 'My #1 Core Value',
          placeholder: 'e.g., Integrity',
          type: 'text',
        },
        {
          id: 'value1_why',
          label: 'Why this value matters to me',
          placeholder: 'This value matters to me because…',
          type: 'textarea',
        },
        {
          id: 'value2',
          label: 'My #2 Core Value',
          placeholder: 'e.g., Connection',
          type: 'text',
        },
        {
          id: 'value2_why',
          label: 'Why this value matters to me',
          placeholder: 'This value matters to me because…',
          type: 'textarea',
        },
        {
          id: 'value3',
          label: 'My #3 Core Value',
          placeholder: 'e.g., Growth',
          type: 'text',
        },
        {
          id: 'value3_why',
          label: 'Why this value matters to me',
          placeholder: 'This value matters to me because…',
          type: 'textarea',
        },
      ],
      valueSuggestions: [
        'Integrity', 'Connection', 'Growth', 'Courage', 'Compassion',
        'Creativity', 'Freedom', 'Justice', 'Loyalty', 'Service',
        'Wisdom', 'Adventure', 'Health', 'Family', 'Humor',
        'Achievement', 'Spirituality', 'Contribution', 'Authenticity', 'Resilience',
      ],
    },
    reflectionPrompts: [
      'How do your current daily actions align with these values?',
      'Which value feels most neglected right now?',
      'What is one small action you could take today that honors your #1 value?',
    ],
    resources: [],
  },
  {
    id: 'agentic-smart-goals',
    dimension: 'agentic-generative',
    level: 'foundation',
    order: 2,
    title: 'SMART Goals Template',
    icon: '/icons/game-target.svg',
    duration: '10–15 minutes',
    xpReward: 15,
    badge: {
      id: 'goal-architect',
      name: 'Goal Architect',
      icon: '🎯',
      requirement: 'Write one complete SMART goal',
    },
    learningObjective: 'Transform vague intentions into specific, actionable goals',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'In ABA, observable and measurable goals are foundational to effective behavior change. SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) bridge the gap between intention and committed action — making progress trackable and success recognizable.',
    },
    instructions: [
      'Think of one meaningful goal you want to pursue.',
      'Use the SMART framework to refine it: make it Specific, Measurable, Achievable, Relevant, and Time-bound.',
      'Write the goal clearly in one sentence.',
      'Identify three concrete actions you will take toward this goal.',
      'Set a specific check-in date to review your progress.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'vague_goal',
          label: 'My vague intention (starting point)',
          placeholder: 'e.g., I want to be healthier',
          type: 'text',
        },
        {
          id: 'specific',
          label: 'Specific — What exactly will I do?',
          placeholder: 'e.g., Walk 30 minutes every weekday morning',
          type: 'textarea',
        },
        {
          id: 'measurable',
          label: 'Measurable — How will I track progress?',
          placeholder: 'e.g., Log walks in my phone calendar; count steps with a pedometer',
          type: 'textarea',
        },
        {
          id: 'achievable',
          label: 'Achievable — Is this realistic for me right now?',
          placeholder: 'e.g., Yes — I have 30 minutes free most mornings',
          type: 'textarea',
        },
        {
          id: 'relevant',
          label: 'Relevant — How does this connect to my values?',
          placeholder: 'e.g., Health is my #1 value; this supports energy and longevity',
          type: 'textarea',
        },
        {
          id: 'time_bound',
          label: 'Time-bound — By when? What is my check-in date?',
          placeholder: 'e.g., I will do this for 4 weeks; check-in on [date]',
          type: 'text',
        },
        {
          id: 'smart_goal',
          label: 'My complete SMART goal statement',
          placeholder: 'I will walk for 30 minutes every weekday morning for 4 weeks, tracking in my calendar, to build energy and support my health value.',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What might get in the way of this goal? How will you handle it?',
      'How will you celebrate when you reach the 2-week mark?',
      'Who could you share this goal with to increase accountability?',
    ],
    resources: [],
  },
  {
    id: 'agentic-one-percent-action',
    dimension: 'agentic-generative',
    level: 'foundation',
    order: 3,
    title: 'The 1% Action Plan',
    icon: '/icons/agentic-generative.svg',
    duration: '10–15 minutes',
    xpReward: 20,
    badge: {
      id: 'momentum-builder',
      name: 'Momentum Builder',
      icon: '⚡',
      requirement: 'Complete the milestone ladder and 7-day tracker',
    },
    learningObjective: 'Break a big goal into tiny daily actions that build momentum',
    whyItMatters: {
      framework: 'ABA',
      rationale:
        'Behavioral shaping — breaking large behavior changes into small, achievable steps — is one of the most evidence-based principles in ABA. Starting with 1% improvement reduces avoidance and builds the momentum needed for sustained change. Small wins compound into major transformation.',
    },
    instructions: [
      'Choose one big goal from your SMART Goals exercise.',
      'Imagine the goal is 100% complete. What does that look like?',
      'Work backwards: identify 5 milestones (20%, 40%, 60%, 80%, 100%).',
      'For your first milestone (20%), identify one tiny daily action — so small it takes less than 5 minutes.',
      'Write your 7-day action tracker with this tiny daily action.',
      'Commit to doing just this one small thing every day for 7 days.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'big_goal',
          label: 'My big goal',
          placeholder: 'e.g., Write and publish my book',
          type: 'text',
        },
        {
          id: 'milestone_20',
          label: 'Milestone 1 (20%) — What does partial progress look like?',
          placeholder: 'e.g., Complete outline and first chapter',
          type: 'text',
        },
        {
          id: 'milestone_40',
          label: 'Milestone 2 (40%)',
          placeholder: 'e.g., Chapters 2–5 drafted',
          type: 'text',
        },
        {
          id: 'milestone_60',
          label: 'Milestone 3 (60%)',
          placeholder: 'e.g., Full draft complete',
          type: 'text',
        },
        {
          id: 'milestone_80',
          label: 'Milestone 4 (80%)',
          placeholder: 'e.g., Edited and revised',
          type: 'text',
        },
        {
          id: 'milestone_100',
          label: 'Milestone 5 (100%) — Goal fully achieved',
          placeholder: 'e.g., Published and available to readers',
          type: 'text',
        },
        {
          id: 'tiny_daily_action',
          label: 'My tiny daily action (under 5 minutes)',
          placeholder: 'e.g., Write 3 sentences every morning before coffee',
          type: 'text',
        },
        {
          id: 'day1', label: 'Day 1 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
        {
          id: 'day2', label: 'Day 2 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
        {
          id: 'day3', label: 'Day 3 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
        {
          id: 'day4', label: 'Day 4 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
        {
          id: 'day5', label: 'Day 5 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
        {
          id: 'day6', label: 'Day 6 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
        {
          id: 'day7', label: 'Day 7 — Did I do it? Notes', type: 'text', placeholder: 'Yes/No — notes',
        },
      ],
    },
    reflectionPrompts: [
      'What did you notice after 7 days of tiny actions?',
      'Was the action small enough? If not, how could you shrink it further?',
      'What made it easier or harder to show up each day?',
    ],
    resources: [],
  },
  {
    id: 'agentic-barrier-busting',
    dimension: 'agentic-generative',
    level: 'foundation',
    order: 4,
    title: 'Barrier Busting Protocol',
    icon: '/icons/planning.svg',
    duration: '10–15 minutes',
    xpReward: 15,
    badge: {
      id: 'barrier-breaker',
      name: 'Barrier Breaker',
      icon: '🛡️',
      requirement: 'Identify and solve 2 real barriers',
    },
    learningObjective: 'Identify and overcome obstacles using problem-solving techniques from ABA',
    whyItMatters: {
      framework: 'ABA',
      rationale:
        'Obstacle identification and problem-solving are core ABA skills. Anticipating barriers and pre-planning solutions dramatically increases follow-through. This process transforms "I couldn\'t do it because…" into "I planned for this and here\'s what I did."',
    },
    instructions: [
      'Think of a goal you have struggled to follow through on.',
      'List all the barriers you\'ve encountered or anticipate.',
      'For each barrier, brainstorm 2–3 possible solutions.',
      'Choose the most practical solution for each barrier.',
      'Write your "If-Then" plan: "If [barrier] happens, then I will [solution]."',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'goal',
          label: 'The goal I am working on',
          placeholder: 'e.g., Exercise 3x per week',
          type: 'text',
        },
        {
          id: 'barrier1',
          label: 'Barrier #1',
          placeholder: 'e.g., I\'m too tired after work',
          type: 'text',
        },
        {
          id: 'solution1',
          label: 'Solution for Barrier #1',
          placeholder: 'e.g., Switch to morning workouts; prepare clothes the night before',
          type: 'textarea',
        },
        {
          id: 'ifthen1',
          label: 'If-Then Plan for Barrier #1',
          placeholder: 'If I\'m too tired after work, then I will do a 10-minute morning walk instead',
          type: 'textarea',
        },
        {
          id: 'barrier2',
          label: 'Barrier #2',
          placeholder: 'e.g., Bad weather',
          type: 'text',
        },
        {
          id: 'solution2',
          label: 'Solution for Barrier #2',
          placeholder: 'e.g., Have an indoor workout alternative ready',
          type: 'textarea',
        },
        {
          id: 'ifthen2',
          label: 'If-Then Plan for Barrier #2',
          placeholder: 'If it\'s raining, then I will do a 20-minute YouTube workout at home',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'Which barrier has stopped you most often in the past?',
      'How does having a plan in advance change how you feel about obstacles?',
      'Who could support you when you hit a barrier?',
    ],
    resources: [],
  },
  {
    id: 'agentic-committed-action-log',
    dimension: 'agentic-generative',
    level: 'foundation',
    order: 5,
    title: 'Committed Action Log',
    icon: '/icons/compass.svg',
    duration: '5 minutes daily',
    xpReward: 10,
    badge: {
      id: 'action-logger',
      name: 'Action Logger',
      icon: '📖',
      requirement: 'Complete 3 days of action log entries',
    },
    learningObjective: 'Track values-aligned actions daily to build consistency and self-awareness',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Committed action is the behavioral component of ACT — choosing to act in alignment with your values even when feelings make it hard. Daily logging creates self-monitoring, which is a powerful ABA tool for sustaining behavior change. Tracking gives you data on your own patterns.',
    },
    instructions: [
      'Each evening, spend 2–3 minutes reviewing your day.',
      'Identify one action you took that aligned with your top value.',
      'Identify one opportunity you missed and what got in the way.',
      'Rate your values alignment today from 1–10.',
      'Set one committed action for tomorrow.',
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
          id: 'aligned_action',
          label: 'One action I took today that aligned with my values',
          placeholder: 'e.g., Called my mom even though I was busy — honoring Connection',
          type: 'textarea',
        },
        {
          id: 'missed_opportunity',
          label: 'One opportunity I missed and why',
          placeholder: 'e.g., Skipped my workout because I felt anxious about work',
          type: 'textarea',
        },
        {
          id: 'alignment_rating',
          label: 'My values alignment today (1–10)',
          placeholder: 'e.g., 7',
          type: 'text',
        },
        {
          id: 'tomorrow_action',
          label: 'One committed action I will take tomorrow',
          placeholder: 'e.g., Write for 15 minutes before checking email',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What patterns do you notice in your alignment ratings over time?',
      'What makes it easier to act on your values?',
      'What would a "10" day look like for you?',
    ],
    resources: [],
  },

  // ── Building Level ───────────────────────────────────────────────────────────
  {
    id: 'agentic-multi-step-planning',
    dimension: 'agentic-generative',
    level: 'building',
    order: 6,
    title: 'Multi-Step Planning',
    icon: '/icons/planning.svg',
    duration: '20–30 minutes',
    xpReward: 25,
    badge: {
      id: 'strategic-planner',
      name: 'Strategic Planner',
      icon: '🗺️',
      requirement: 'Complete a full if-then planning worksheet',
    },
    learningObjective: 'Create detailed action plans with built-in contingencies for obstacles',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Implementation intentions (if-then plans) are one of the most replicated findings in behavioral science. Planning contingencies reduces decision fatigue and increases follow-through by up to 300%. This skill builds on barrier-busting to create comprehensive action roadmaps.',
    },
    instructions: [
      'Choose a goal that requires multiple steps over several weeks.',
      'Break the goal into phases (Week 1, Week 2, etc.).',
      'For each phase, list the specific actions required.',
      'Identify the most likely obstacle for each phase.',
      'Write if-then plans for each identified obstacle.',
      'Schedule a weekly 10-minute review to assess progress.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'goal',
          label: 'My multi-step goal',
          placeholder: 'e.g., Launch my freelance consulting practice',
          type: 'text',
        },
        {
          id: 'phase1_actions',
          label: 'Phase 1 actions (Week 1–2)',
          placeholder: 'e.g., Create service list, set pricing, build simple website',
          type: 'textarea',
        },
        {
          id: 'phase1_obstacle',
          label: 'Phase 1 most likely obstacle',
          placeholder: 'e.g., Perfectionism — endlessly tweaking website',
          type: 'text',
        },
        {
          id: 'phase1_ifthen',
          label: 'Phase 1 if-then plan',
          placeholder: 'If I spend more than 3 hours on the website, then I will publish it "good enough" and iterate later',
          type: 'textarea',
        },
        {
          id: 'phase2_actions',
          label: 'Phase 2 actions (Week 3–4)',
          placeholder: 'e.g., Reach out to 10 potential clients, schedule discovery calls',
          type: 'textarea',
        },
        {
          id: 'phase2_obstacle',
          label: 'Phase 2 most likely obstacle',
          placeholder: 'e.g., Fear of rejection — avoiding outreach',
          type: 'text',
        },
        {
          id: 'phase2_ifthen',
          label: 'Phase 2 if-then plan',
          placeholder: 'If I feel scared to reach out, then I will send one message immediately — before I can talk myself out of it',
          type: 'textarea',
        },
        {
          id: 'review_schedule',
          label: 'My weekly review time',
          placeholder: 'e.g., Every Sunday evening at 7pm',
          type: 'text',
        },
      ],
    },
    reflectionPrompts: [
      'What surprised you about the planning process?',
      'Which phase feels most challenging? Why?',
      'How does having a plan affect your confidence about this goal?',
    ],
    resources: [],
  },
  {
    id: 'agentic-behavioral-activation',
    dimension: 'agentic-generative',
    level: 'building',
    order: 7,
    title: 'Behavioral Activation',
    icon: '/icons/agentic-generative.svg',
    duration: '15–20 minutes',
    xpReward: 20,
    badge: {
      id: 'activation-pro',
      name: 'Activation Pro',
      icon: '🎬',
      requirement: 'Schedule and complete 3 rewarding activities in one week',
    },
    learningObjective: 'Schedule rewarding activities to combat low motivation and improve mood',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Behavioral activation is a highly effective, evidence-based approach for low motivation and depression. The core insight is that action precedes motivation — you don\'t wait to feel ready to act; you act and motivation follows. Scheduling pleasant and mastery activities directly increases positive reinforcement.',
    },
    instructions: [
      'List 10 activities that used to bring you joy, energy, or a sense of accomplishment.',
      'Rate each activity for: (a) Pleasure (1–5) and (b) Mastery/achievement (1–5).',
      'Choose 3 activities — ideally a mix of pleasure and mastery.',
      'Schedule each activity into your calendar this week with a specific time.',
      'After each activity, rate your mood before and after (1–10).',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'activity1',
          label: 'Activity 1',
          placeholder: 'e.g., 30-minute walk in the park',
          type: 'text',
        },
        {
          id: 'activity1_schedule',
          label: 'Scheduled time for Activity 1',
          placeholder: 'e.g., Tuesday 7am',
          type: 'text',
        },
        {
          id: 'activity1_mood',
          label: 'Mood before → after Activity 1 (1–10)',
          placeholder: 'e.g., 4 → 7',
          type: 'text',
        },
        {
          id: 'activity2',
          label: 'Activity 2',
          placeholder: 'e.g., Cook a new recipe',
          type: 'text',
        },
        {
          id: 'activity2_schedule',
          label: 'Scheduled time for Activity 2',
          placeholder: 'e.g., Thursday 6pm',
          type: 'text',
        },
        {
          id: 'activity2_mood',
          label: 'Mood before → after Activity 2 (1–10)',
          placeholder: 'e.g., 5 → 8',
          type: 'text',
        },
        {
          id: 'activity3',
          label: 'Activity 3',
          placeholder: 'e.g., Call a friend',
          type: 'text',
        },
        {
          id: 'activity3_schedule',
          label: 'Scheduled time for Activity 3',
          placeholder: 'e.g., Saturday 2pm',
          type: 'text',
        },
        {
          id: 'activity3_mood',
          label: 'Mood before → after Activity 3 (1–10)',
          placeholder: 'e.g., 3 → 7',
          type: 'text',
        },
      ],
    },
    reflectionPrompts: [
      'What did you notice about mood changes after the activities?',
      'Which activity gave you the biggest boost? Why do you think that is?',
      'How might you include more of these activities in your regular week?',
    ],
    resources: [],
  },

  // ── Mastery Level ────────────────────────────────────────────────────────────
  {
    id: 'agentic-goal-cascading',
    dimension: 'agentic-generative',
    level: 'mastery',
    order: 8,
    title: 'Advanced Goal Cascading',
    icon: '/icons/game-target.svg',
    duration: '30–45 minutes',
    xpReward: 30,
    badge: {
      id: 'vision-architect',
      name: 'Vision Architect',
      icon: '🏔️',
      requirement: 'Build a complete goal hierarchy across 3 time horizons',
    },
    learningObjective: 'Align short-term daily actions with long-term values and life vision',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Goal cascading integrates ACT values work with strategic planning. When daily actions are explicitly connected to medium-term goals, which are connected to long-term vision, which is rooted in core values — every small task carries meaning. This vertical alignment is the foundation of resilient motivation.',
    },
    instructions: [
      'Start with your core values (revisit your Values Compass).',
      'Write your 5-year life vision: what does a life fully lived by your values look like?',
      'Identify 3 one-year goals that move toward this vision.',
      'For each one-year goal, identify 2–3 quarterly milestones.',
      'For this quarter, identify your most important weekly actions.',
      'Review the full cascade: does each layer connect to the one above?',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'core_values',
          label: 'My top 3 core values',
          placeholder: 'e.g., Growth, Connection, Service',
          type: 'text',
        },
        {
          id: 'five_year_vision',
          label: 'My 5-year life vision',
          placeholder: 'Describe what your life looks like in 5 years if you fully live your values',
          type: 'textarea',
        },
        {
          id: 'year_goal1',
          label: 'One-year Goal #1',
          placeholder: 'e.g., Complete a psychology graduate program',
          type: 'text',
        },
        {
          id: 'year_goal2',
          label: 'One-year Goal #2',
          placeholder: 'e.g., Build a meaningful support community',
          type: 'text',
        },
        {
          id: 'year_goal3',
          label: 'One-year Goal #3',
          placeholder: 'e.g., Publish first research article',
          type: 'text',
        },
        {
          id: 'quarter_milestones',
          label: 'This quarter\'s key milestones (2–3)',
          placeholder: 'e.g., Complete first 2 courses; attend 3 networking events',
          type: 'textarea',
        },
        {
          id: 'weekly_actions',
          label: 'This week\'s most important actions',
          placeholder: 'e.g., Study 1 hour Mon/Wed/Fri; reach out to 2 colleagues',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'Does every weekly action connect clearly to your long-term vision?',
      'What would you need to remove from your life to focus on what matters most?',
      'How does this cascade change how you feel about your daily tasks?',
    ],
    resources: [],
  },
  {
    id: 'agentic-self-efficacy',
    dimension: 'agentic-generative',
    level: 'mastery',
    order: 9,
    title: 'Self-Efficacy Building',
    icon: '/icons/agentic-generative.svg',
    duration: '20–30 minutes',
    xpReward: 25,
    badge: {
      id: 'self-efficacy-master',
      name: 'Self-Efficacy Master',
      icon: '💪',
      requirement: 'Complete a 10-entry success log and write 3 capability statements',
    },
    learningObjective: 'Strengthen belief in your capacity through mastery experiences and evidence review',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Bandura\'s self-efficacy research shows that belief in your own capability is the single greatest predictor of whether you attempt challenging tasks. Building evidence of past success and creating capability statements re-trains the brain to expect success rather than failure. This is enhanced by ABA-style reinforcement of adaptive self-talk.',
    },
    instructions: [
      'Recall 10 past accomplishments — big or small — that you\'re proud of.',
      'For each, note: what challenge did you overcome? What strengths did you use?',
      'Identify 3 capability themes across your accomplishments (e.g., "I persist through difficulty").',
      'Write 3 capability statements starting with "I am someone who…"',
      'Read these statements aloud each morning for one week.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'success1',
          label: 'Past success #1',
          placeholder: 'Describe an accomplishment and the strengths it demonstrated',
          type: 'textarea',
        },
        {
          id: 'success2',
          label: 'Past success #2',
          placeholder: 'Describe an accomplishment and the strengths it demonstrated',
          type: 'textarea',
        },
        {
          id: 'success3',
          label: 'Past success #3',
          placeholder: 'Describe an accomplishment and the strengths it demonstrated',
          type: 'textarea',
        },
        {
          id: 'capability_theme1',
          label: 'Capability theme #1',
          placeholder: 'e.g., I persist when things are hard',
          type: 'text',
        },
        {
          id: 'capability_theme2',
          label: 'Capability theme #2',
          placeholder: 'e.g., I find creative solutions under pressure',
          type: 'text',
        },
        {
          id: 'capability_theme3',
          label: 'Capability theme #3',
          placeholder: 'e.g., I build trust with people quickly',
          type: 'text',
        },
        {
          id: 'capability_statement1',
          label: 'Capability statement #1 ("I am someone who…")',
          placeholder: 'I am someone who persists through difficulty and finds a way forward',
          type: 'textarea',
        },
        {
          id: 'capability_statement2',
          label: 'Capability statement #2',
          placeholder: 'I am someone who…',
          type: 'textarea',
        },
        {
          id: 'capability_statement3',
          label: 'Capability statement #3',
          placeholder: 'I am someone who…',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What patterns do you notice across your accomplishments?',
      'When you read your capability statements, what do you feel?',
      'What challenge have you been avoiding that this evidence suggests you can handle?',
    ],
    resources: [],
  },
];
