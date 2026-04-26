/**
 * relationalConnective.js
 * Skill module definitions for the Relational-Connective dimension.
 * Grounded in social support research, ACT values, and communication science.
 */

export const relationalConnectiveModules = [
  // ── Foundation Level ────────────────────────────────────────────────────────
  {
    id: 'relational-support-map',
    dimension: 'relational-connective',
    level: 'foundation',
    order: 1,
    title: 'Support Network Map',
    icon: '/icons/relational-connective.svg',
    duration: '10–15 minutes',
    xpReward: 10,
    badge: {
      id: 'network-mapper',
      name: 'Network Mapper',
      icon: '🗺️',
      requirement: 'Complete the concentric circles mapping exercise',
    },
    learningObjective: 'Identify and understand your circle of support across different relationship types',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Social support is one of the most powerful protective factors for resilience, mental health, and even physical health. Research consistently shows that people with strong social networks recover faster from adversity and have better health outcomes. Mapping your support network makes invisible resources visible and helps identify gaps to address.',
    },
    instructions: [
      'Draw three concentric circles (or use the exercise below).',
      'Inner circle: Your 1–3 closest people — those you can call in crisis at any hour.',
      'Middle circle: Your 5–10 reliable supporters — friends, family, colleagues you trust.',
      'Outer circle: Your broader community — neighbors, mentors, groups, online connections.',
      'For each circle, name the people in it.',
      'Note what kind of support each person typically provides (emotional, practical, informational).',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'inner_circle',
          label: 'Inner circle (1–3 people closest to you)',
          placeholder: 'Names and what support they provide: e.g., Alex — emotional support, calls me back immediately',
          type: 'textarea',
        },
        {
          id: 'middle_circle',
          label: 'Middle circle (5–10 reliable supporters)',
          placeholder: 'Names and support type: e.g., Jordan — practical help, moves furniture; Maya — professional advice',
          type: 'textarea',
        },
        {
          id: 'outer_circle',
          label: 'Outer circle (broader community)',
          placeholder: 'Groups, mentors, communities: e.g., yoga class, online support group, neighborhood watch',
          type: 'textarea',
        },
        {
          id: 'gaps',
          label: 'Support gaps I notice (what type of support do I lack?)',
          placeholder: 'e.g., No one to help with childcare in emergencies; need more professional connections',
          type: 'textarea',
        },
        {
          id: 'strengthen',
          label: 'One relationship I want to strengthen this month',
          placeholder: 'e.g., Reconnect with Sam — haven\'t spoken in 6 months',
          type: 'text',
        },
      ],
    },
    reflectionPrompts: [
      'Were you surprised by how many — or how few — people are in your circles?',
      'Which circle feels most solid? Which feels most fragile?',
      'What would it take to move one person from the outer circle to the middle?',
    ],
    resources: [],
  },
  {
    id: 'relational-asking-for-help',
    dimension: 'relational-connective',
    level: 'foundation',
    order: 2,
    title: 'Asking for Help Script',
    icon: '/icons/relational-connective.svg',
    duration: '10–15 minutes',
    xpReward: 15,
    badge: {
      id: 'help-seeker',
      name: 'Help Seeker',
      icon: '🤝',
      requirement: 'Write and use one help-seeking script in a real situation',
    },
    learningObjective: 'Practice vulnerability and effective help-seeking as resilience strengths',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Asking for help is one of the most underused resilience behaviors. Many people feel shame or fear judgment when they need support — yet research by Brené Brown and others shows that vulnerability is the birthplace of connection. In ACT, help-seeking is a values-aligned action: if connection matters to you, asking for help IS the courageous act.',
    },
    instructions: [
      'Identify a current need where you could genuinely use help.',
      'Choose someone from your support network who could realistically help.',
      'Use the template below to draft your request.',
      'Practice saying it aloud once before sending or saying it.',
      'Send it — and record what happened.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'my_need',
          label: 'What I genuinely need help with right now',
          placeholder: 'e.g., I\'m overwhelmed with work and need someone to talk to; I need help moving this weekend',
          type: 'textarea',
        },
        {
          id: 'person',
          label: 'The person I will ask',
          placeholder: 'e.g., My friend Jordan',
          type: 'text',
        },
        {
          id: 'script',
          label: 'My help-seeking script (fill in the blanks)',
          placeholder: '"Hey [name], I\'m going through [brief situation] and I could really use [specific help]. Would you be willing to [specific request]? No pressure if you can\'t — I just wanted to ask."',
          type: 'textarea',
        },
        {
          id: 'what_stopped_me',
          label: 'What has stopped me from asking for help before?',
          placeholder: 'e.g., Fear of burdening others; worry about looking weak',
          type: 'textarea',
        },
        {
          id: 'what_happened',
          label: 'What actually happened when I asked',
          placeholder: 'Fill in after you ask: e.g., They said yes immediately and seemed glad I asked',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What was it like to ask? What feelings came up?',
      'How did the actual response compare to what you feared?',
      'What does this experience tell you about asking for help in the future?',
    ],
    resources: [],
  },
  {
    id: 'relational-gratitude-letter',
    dimension: 'relational-connective',
    level: 'foundation',
    order: 3,
    title: 'Gratitude Letter',
    icon: '/icons/relational-connective.svg',
    duration: '15–20 minutes',
    xpReward: 15,
    badge: {
      id: 'gratitude-giver',
      name: 'Gratitude Giver',
      icon: '💌',
      requirement: 'Write and send one gratitude letter',
    },
    learningObjective: 'Strengthen relationships and your own well-being through expressed appreciation',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Martin Seligman\'s gratitude letter exercise is one of the most replicated positive psychology interventions. Writing and especially delivering a gratitude letter produces lasting increases in happiness and reductions in depression. It also deepens relational bonds by expressing appreciation that is often felt but rarely spoken.',
    },
    instructions: [
      'Think of someone who has positively impacted your life — a mentor, friend, family member, teacher.',
      'Write them a 3–4 paragraph letter: what they did, what it meant to you, how it changed your life.',
      'Be specific — not "you\'ve been great" but "when you said X, I felt Y and it led to Z."',
      'If possible, deliver the letter in person and read it aloud.',
      'If distance prevents this, send it with a personal note.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'recipient',
          label: 'Who I am writing this letter to',
          placeholder: 'Name and your relationship to them',
          type: 'text',
        },
        {
          id: 'what_they_did',
          label: 'What they did (be specific)',
          placeholder: 'Describe the specific thing they did that impacted you',
          type: 'textarea',
        },
        {
          id: 'what_it_meant',
          label: 'What it meant to you',
          placeholder: 'Describe the impact — emotionally, practically, long-term',
          type: 'textarea',
        },
        {
          id: 'gratitude_letter',
          label: 'My full gratitude letter',
          placeholder: 'Write your complete letter here before sending it',
          type: 'textarea',
        },
        {
          id: 'delivery_method',
          label: 'How I will deliver this letter',
          placeholder: 'e.g., In person, by email, by post, phone call',
          type: 'text',
        },
        {
          id: 'reaction',
          label: 'Their reaction (fill in after)',
          placeholder: 'What happened when they received it?',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What did writing this letter stir up in you?',
      'Who else in your life deserves a gratitude letter?',
      'How often do you express appreciation to the people who matter most?',
    ],
    resources: [],
  },
  {
    id: 'relational-boundary-setting',
    dimension: 'relational-connective',
    level: 'foundation',
    order: 4,
    title: 'Boundary Setting 101',
    icon: '/icons/relational-connective.svg',
    duration: '15 minutes',
    xpReward: 15,
    badge: {
      id: 'boundary-builder',
      name: 'Boundary Builder',
      icon: '🛡️',
      requirement: 'Write 3 boundary statements for real situations',
    },
    learningObjective: 'Communicate personal limits respectfully and clearly',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Healthy boundaries are an act of values-aligned living, not selfishness. Boundaries protect your energy, self-respect, and relational health. ACT research shows that acting in alignment with values — including the value of self-care — is essential for sustainable resilience. Clear boundaries prevent resentment and protect relationships long-term.',
    },
    instructions: [
      'Identify 3 situations where you feel resentful, drained, or violated.',
      'For each, identify the limit you wish existed.',
      'Write a clear, respectful boundary statement using the template: "I\'m not able to [X]. I\'m willing to [Y]."',
      'Practice saying each statement aloud.',
      'Choose one boundary to communicate this week.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'situation1',
          label: 'Situation 1 where I feel resentful or drained',
          placeholder: 'e.g., My coworker constantly interrupts my focused work time',
          type: 'textarea',
        },
        {
          id: 'boundary1',
          label: 'Boundary statement for Situation 1',
          placeholder: 'e.g., "I\'m not able to respond immediately when I\'m in focus time. I\'m willing to check messages every 2 hours."',
          type: 'textarea',
        },
        {
          id: 'situation2',
          label: 'Situation 2',
          placeholder: 'e.g., Family members call very late and expect me to be available',
          type: 'textarea',
        },
        {
          id: 'boundary2',
          label: 'Boundary statement for Situation 2',
          placeholder: 'e.g., "I\'m not able to take calls after 9pm. I\'m willing to talk during the day or early evening."',
          type: 'textarea',
        },
        {
          id: 'situation3',
          label: 'Situation 3',
          placeholder: 'Describe a third situation where a boundary is needed',
          type: 'textarea',
        },
        {
          id: 'boundary3',
          label: 'Boundary statement for Situation 3',
          placeholder: 'Write your clear, respectful boundary',
          type: 'textarea',
        },
        {
          id: 'this_week',
          label: 'The boundary I will communicate this week',
          placeholder: 'Choose one and describe how you\'ll communicate it',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What makes it hard for you to set boundaries? What fear comes up?',
      'What have unclear boundaries cost you in the past?',
      'How might clear boundaries actually improve your relationships?',
    ],
    resources: [],
  },
  {
    id: 'relational-connection-ritual',
    dimension: 'relational-connective',
    level: 'foundation',
    order: 5,
    title: 'Weekly Connection Ritual',
    icon: '/icons/relational-connective.svg',
    duration: '10 minutes to design, 10–30 minutes weekly',
    xpReward: 10,
    badge: {
      id: 'ritual-keeper',
      name: 'Ritual Keeper',
      icon: '🔗',
      requirement: 'Design and practice your connection ritual for 3 weeks',
    },
    learningObjective: 'Maintain meaningful relationships during stress through intentional rituals',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Relationships require maintenance, especially under stress — when we most need connection and least want to initiate it. Research on relationship longevity shows that small, consistent rituals of connection (check-ins, shared meals, traditions) are more predictive of relationship quality than grand gestures. Designing a ritual makes connection automatic rather than effortful.',
    },
    instructions: [
      'Choose 1–3 people you want to maintain regular connection with.',
      'Design a simple weekly ritual: a recurring check-in, walk, call, meal, or shared activity.',
      'Make it specific: same day, same time, same format where possible.',
      'Keep it small enough to actually do every week even when busy.',
      'Record your ritual and commit to trying it for 3 weeks.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'connection_person',
          label: 'Person(s) I want to stay connected with',
          placeholder: 'e.g., My sister, my college roommate',
          type: 'text',
        },
        {
          id: 'ritual_description',
          label: 'My weekly connection ritual',
          placeholder: 'e.g., Sunday evening 30-minute video call with sister; Tuesday lunchtime walk text-chain with college group',
          type: 'textarea',
        },
        {
          id: 'ritual_schedule',
          label: 'When and how often (be specific)',
          placeholder: 'e.g., Every Sunday 7pm; first Tuesday of each month',
          type: 'text',
        },
        {
          id: 'week1_reflection',
          label: 'Week 1 reflection',
          placeholder: 'How did it go? What did you feel?',
          type: 'textarea',
        },
        {
          id: 'week2_reflection',
          label: 'Week 2 reflection',
          placeholder: 'What\'s working? What needs adjusting?',
          type: 'textarea',
        },
        {
          id: 'week3_reflection',
          label: 'Week 3 reflection',
          placeholder: 'Is this becoming a ritual? What impact has it had?',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'How did having a scheduled ritual change your sense of connection?',
      'What got in the way, and how did you handle it?',
      'What does regular connection do for your resilience and mood?',
    ],
    resources: [],
  },

  // ── Building Level ───────────────────────────────────────────────────────────
  {
    id: 'relational-conflict-resolution',
    dimension: 'relational-connective',
    level: 'building',
    order: 6,
    title: 'Conflict Resolution Framework',
    icon: '/icons/relational-connective.svg',
    duration: '20 minutes',
    xpReward: 25,
    badge: {
      id: 'peacemaker',
      name: 'Peacemaker',
      icon: '⚖️',
      requirement: 'Apply the XYZ framework to a real conflict',
    },
    learningObjective: 'Navigate disagreements skillfully using evidence-based communication',
    whyItMatters: {
      framework: 'Both',
      rationale:
        'Unresolved conflict is one of the greatest sources of relational stress. The XYZ statement structure ("When you do X, in situation Y, I feel Z") is grounded in non-blaming communication research and is highly effective for de-escalating conflict. Research on relationships shows that how couples (and people generally) handle disagreement predicts relationship quality more than how often they disagree.',
    },
    instructions: [
      'Think of a current or recent conflict with someone important to you.',
      'Identify what you observed (X), when it happened (Y), and how you felt (Z).',
      'Write your XYZ statement — keeping X behavioral (what they did), not character-based (who they are).',
      'Add what you need or want to happen differently.',
      'Practice the full statement until it feels calm and clear.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'conflict_situation',
          label: 'The conflict situation',
          placeholder: 'Brief description of the conflict',
          type: 'textarea',
        },
        {
          id: 'x_behavior',
          label: 'X — the specific behavior I observed (not interpretation)',
          placeholder: 'e.g., When you raised your voice during our discussion',
          type: 'textarea',
        },
        {
          id: 'y_situation',
          label: 'Y — the specific situation/context',
          placeholder: 'e.g., During our family dinner last Sunday',
          type: 'text',
        },
        {
          id: 'z_feeling',
          label: 'Z — how I felt (emotion word, not thought)',
          placeholder: 'e.g., I felt hurt and dismissed',
          type: 'text',
        },
        {
          id: 'xyz_statement',
          label: 'My complete XYZ statement',
          placeholder: '"When you raised your voice during our family dinner last Sunday, I felt hurt and dismissed."',
          type: 'textarea',
        },
        {
          id: 'my_need',
          label: 'What I need or want to be different',
          placeholder: 'e.g., "What I\'d like is for us to be able to disagree without raising our voices"',
          type: 'textarea',
        },
        {
          id: 'what_happened',
          label: 'What happened when you communicated this',
          placeholder: 'Fill in after: how did they respond?',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'How did the XYZ structure change how you approached the conversation?',
      'What was hardest — identifying the behavior, the situation, or your feeling?',
      'What would regular use of this framework do for your important relationships?',
    ],
    resources: [],
  },
  {
    id: 'relational-empathy-expansion',
    dimension: 'relational-connective',
    level: 'building',
    order: 7,
    title: 'Empathy Expansion',
    icon: '/icons/relational-connective.svg',
    duration: '20 minutes',
    xpReward: 20,
    badge: {
      id: 'empathy-builder',
      name: 'Empathy Builder',
      icon: '💗',
      requirement: 'Complete an empathy map for a challenging relationship',
    },
    learningObjective: 'Expand your perspective-taking capacity in challenging relationships',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'Empathy is not just a feeling — it\'s a skill that can be deliberately practiced. ACT emphasizes "flexible perspective-taking" as a core component of psychological flexibility. Research shows empathy practice reduces interpersonal conflict, increases prosocial behavior, and is one of the strongest predictors of relationship satisfaction.',
    },
    instructions: [
      'Think of someone with whom you\'re having difficulty.',
      'Complete the empathy map by stepping into their perspective.',
      'Answer each question as if you were them — based on what you know of their life.',
      'This isn\'t about excusing their behavior; it\'s about understanding their world.',
      'Reflect on how this shifts your approach.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'person',
          label: 'The person I\'m mapping',
          placeholder: 'Name/role (e.g., my manager, my parent)',
          type: 'text',
        },
        {
          id: 'think_feel',
          label: 'What might they be THINKING and FEELING right now?',
          placeholder: 'Imagine their internal world: worries, hopes, fears, pressures',
          type: 'textarea',
        },
        {
          id: 'see',
          label: 'What are they SEEING in this situation?',
          placeholder: 'From their perspective, what are the relevant facts and signals?',
          type: 'textarea',
        },
        {
          id: 'hear',
          label: 'What are they HEARING from others around them?',
          placeholder: 'Who is influencing them? What messages are they receiving?',
          type: 'textarea',
        },
        {
          id: 'say_do',
          label: 'What do they SAY and DO (vs. what they might feel inside)?',
          placeholder: 'The gap between their outward behavior and inner experience',
          type: 'textarea',
        },
        {
          id: 'insight',
          label: 'What new insight do I have about this person after this exercise?',
          placeholder: 'What do you understand about them that you didn\'t before?',
          type: 'textarea',
        },
        {
          id: 'behavior_change',
          label: 'How might this change how I approach them?',
          placeholder: 'One concrete change you could make in how you interact',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What surprised you most about stepping into their perspective?',
      'How does understanding someone\'s world change your feelings toward them?',
      'Who else in your life could benefit from you doing this exercise about them?',
    ],
    resources: [],
  },

  // ── Mastery Level ────────────────────────────────────────────────────────────
  {
    id: 'relational-interdependence',
    dimension: 'relational-connective',
    level: 'mastery',
    order: 8,
    title: 'Interdependence Practice',
    icon: '/icons/relational-connective.svg',
    duration: '30 minutes',
    xpReward: 30,
    badge: {
      id: 'interdependence-master',
      name: 'Interdependence Master',
      icon: '🌐',
      requirement: 'Complete the interdependence audit and design a reciprocal support plan',
    },
    learningObjective: 'Balance autonomy and connection through intentional interdependence',
    whyItMatters: {
      framework: 'ACT',
      rationale:
        'The highest level of relational resilience is interdependence — not isolation (too much autonomy) and not enmeshment (too much dependence), but the ability to give and receive support in a balanced, values-aligned way. Research on resilient communities shows that reciprocal support networks — where support flows in both directions — are the most robust against collective adversity.',
    },
    instructions: [
      'Reflect on your current relationship patterns: Do you tend toward over-giving, over-relying, or isolation?',
      'Audit your support relationships: who do you give to, who do you receive from?',
      'Identify any imbalances — relationships where the exchange is too one-sided.',
      'Design a plan for greater reciprocity and interdependence.',
      'Reflect on what interdependence as a value means to you.',
    ],
    activity: {
      type: 'worksheet',
      fields: [
        {
          id: 'pattern',
          label: 'My typical relational pattern (over-giver / over-reliant / isolated / balanced)',
          placeholder: 'Honestly assess your default pattern',
          type: 'textarea',
        },
        {
          id: 'give_more',
          label: 'People I give to more than I receive from',
          placeholder: 'Names and the nature of the imbalance',
          type: 'textarea',
        },
        {
          id: 'receive_more',
          label: 'People I receive from more than I give to',
          placeholder: 'Names and the nature of the imbalance',
          type: 'textarea',
        },
        {
          id: 'rebalance_plan',
          label: 'How I will move toward greater reciprocity',
          placeholder: 'e.g., Ask for help from Sarah more often; offer specific support to my mentor',
          type: 'textarea',
        },
        {
          id: 'interdependence_meaning',
          label: 'What interdependence as a value means to me',
          placeholder: 'Write a personal definition of healthy interdependence',
          type: 'textarea',
        },
      ],
    },
    reflectionPrompts: [
      'What would fuller interdependence look like in your life?',
      'What fears or beliefs keep you from both giving and receiving freely?',
      'How does interdependence connect to your other core values?',
    ],
    resources: [],
  },
];
