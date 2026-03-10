/* =====================================================
   evidence-based-practices.js
   Evidence-Based Micro-Practice System for Resilience Atlas
   Grounded in Applied Behavior Analysis (ABA) and
   Acceptance and Commitment Therapy (ACT) frameworks.

   EDUCATIONAL DISCLAIMER: These practices are educational
   and supportive, not therapeutic or clinical treatment.
   ===================================================== */

'use strict';

// ── Practice Library ──────────────────────────────────────────────────────────
// 3–5 practices per resilience type (25 total), each grounded in ACT and ABA.

const EVIDENCE_BASED_PRACTICES = [

  // ── Cognitive-Narrative ──────────────────────────────────────────────────
  {
    id: 'cn-01',
    practiceTitle: 'Reframing Journal',
    resilience_type: 'Cognitive-Narrative',
    duration: '5 minutes',
    emoji: '📓',
    instructions: [
      'Find a quiet place and open a journal or notebook.',
      'Write down one challenging situation you faced recently.',
      'Describe how you initially interpreted it (your first story).',
      'Now write an alternative story: What strengths did you use? What did you learn?',
      'End with one sentence about how this experience contributes to your growth.'
    ],
    actPrinciple: {
      name: 'Cognitive Defusion',
      description: 'Stepping back from unhelpful thoughts rather than being fused with them.',
      targetArea: 'Thought patterns and narrative flexibility'
    },
    abaPrinciple: {
      name: 'Reframing Behavior',
      description: 'Systematically practicing alternative interpretations to reshape automatic thought patterns.',
      mechanism: 'Differential reinforcement of adaptive narrative responses'
    },
    reflectionQuestion: 'How does this new story change how you feel about moving forward?',
    difficulty: 'beginner',
    outcomes: [
      'Greater narrative flexibility',
      'Reduced catastrophising',
      'Increased sense of personal agency'
    ]
  },
  {
    id: 'cn-02',
    practiceTitle: 'Leaves on a Stream',
    resilience_type: 'Cognitive-Narrative',
    duration: '5 minutes',
    emoji: '🍃',
    instructions: [
      'Sit comfortably and close your eyes.',
      'Imagine a gently flowing stream with leaves drifting on the surface.',
      'As thoughts arise, place each one on a leaf and watch it float away.',
      'If you get caught up in a thought, gently return to watching the stream.',
      'Notice that you are the observer of thoughts, not the thoughts themselves.'
    ],
    actPrinciple: {
      name: 'Cognitive Defusion',
      description: 'Observing thoughts as passing events rather than facts about reality.',
      targetArea: 'Detachment from unhelpful mental content'
    },
    abaPrinciple: {
      name: 'Attention Control',
      description: 'Training attentional focus away from ruminative thought patterns.',
      mechanism: 'Stimulus control through mindful redirection of attention'
    },
    reflectionQuestion: 'What did you notice about the nature of your thoughts during this practice?',
    difficulty: 'beginner',
    outcomes: [
      'Reduced thought-action fusion',
      'Improved attentional flexibility',
      'Greater psychological distance from worry'
    ]
  },
  {
    id: 'cn-03',
    practiceTitle: 'Perspective Shift Ladder',
    resilience_type: 'Cognitive-Narrative',
    duration: '7 minutes',
    emoji: '🔭',
    instructions: [
      'Identify a situation that feels overwhelming or stuck.',
      'Describe it from your own point of view (Step 1).',
      'Now describe it from the perspective of a trusted friend watching you (Step 2).',
      'Describe it as a future version of yourself looking back one year from now (Step 3).',
      'Write down one insight from each perspective.'
    ],
    actPrinciple: {
      name: 'Perspective Taking',
      description: 'Flexibly adopting different viewpoints to reduce rigidity and expand awareness.',
      targetArea: 'Self-as-context and cognitive flexibility'
    },
    abaPrinciple: {
      name: 'Reframing Behavior',
      description: 'Practicing multiple interpretations of the same event to expand behavioral repertoires.',
      mechanism: 'Shaping of flexible perspective-taking responses'
    },
    reflectionQuestion: 'Which perspective felt most helpful, and why?',
    difficulty: 'intermediate',
    outcomes: [
      'Broader perspective-taking ability',
      'Reduced cognitive rigidity',
      'Enhanced empathy and self-compassion'
    ]
  },
  {
    id: 'cn-04',
    practiceTitle: 'Strength Storyline',
    resilience_type: 'Cognitive-Narrative',
    duration: '8 minutes',
    emoji: '✍️',
    instructions: [
      'Think of a past difficulty you successfully navigated.',
      'Write a short paragraph describing that experience.',
      'Identify at least three specific strengths you used to get through it.',
      'Rewrite the story centering those strengths as the main characters.',
      'Read it aloud to yourself as your personal resilience story.'
    ],
    actPrinciple: {
      name: 'Perspective Taking',
      description: 'Constructing a strengths-based narrative to cultivate a flexible, positive self-view.',
      targetArea: 'Self-narrative and identity'
    },
    abaPrinciple: {
      name: 'Attention Control',
      description: 'Directing attention to strengths-based aspects of one\'s history to build adaptive self-concept.',
      mechanism: 'Positive reinforcement of strengths-focused narrative behavior'
    },
    reflectionQuestion: 'How does recognising your strengths in this story change how you see your current challenges?',
    difficulty: 'intermediate',
    outcomes: [
      'Stronger strengths-based identity',
      'Increased confidence in handling challenges',
      'Improved narrative coherence'
    ]
  },

  // ── Relational ───────────────────────────────────────────────────────────
  {
    id: 're-01',
    practiceTitle: 'Gratitude Outreach',
    resilience_type: 'Relational',
    duration: '5 minutes',
    emoji: '💌',
    instructions: [
      'Think of one person who has supported or inspired you recently.',
      'Write them a short message (text, email, or handwritten note).',
      'Specifically name what they did and how it affected you.',
      'Send or deliver the message.',
      'Notice how the act of expressing gratitude feels in your body.'
    ],
    actPrinciple: {
      name: 'Connection',
      description: 'Actively nurturing valued relationships as a core component of psychological flexibility.',
      targetArea: 'Social engagement and relational values'
    },
    abaPrinciple: {
      name: 'Social Reinforcement',
      description: 'Increasing prosocial behaviors through the natural reinforcement of expressing gratitude.',
      mechanism: 'Positive reinforcement strengthens relationship-building behaviors'
    },
    reflectionQuestion: 'How did reaching out to this person connect with your values?',
    difficulty: 'beginner',
    outcomes: [
      'Strengthened social bonds',
      'Increased positive emotions',
      'Reinforced prosocial behavior patterns'
    ]
  },
  {
    id: 're-02',
    practiceTitle: 'Active Listening Practice',
    resilience_type: 'Relational',
    duration: '10 minutes',
    emoji: '👂',
    instructions: [
      'In your next conversation, set an intention to fully listen.',
      'Put away distractions (phone, other tasks).',
      'Reflect back what the person says before responding: "What I hear you saying is…"',
      'Ask one open-ended follow-up question.',
      'Afterwards, write down one thing you learned about the other person.'
    ],
    actPrinciple: {
      name: 'Acceptance of Others\' Experience',
      description: 'Fully receiving another\'s communication without immediately evaluating or problem-solving.',
      targetArea: 'Relational presence and acceptance'
    },
    abaPrinciple: {
      name: 'Behavior Shaping',
      description: 'Progressively building active listening skills through structured practice steps.',
      mechanism: 'Shaping successive approximations of skilled interpersonal behavior'
    },
    reflectionQuestion: 'What did you discover when you listened without planning your response?',
    difficulty: 'beginner',
    outcomes: [
      'Deeper mutual understanding',
      'Improved communication quality',
      'Increased empathic responsiveness'
    ]
  },
  {
    id: 're-03',
    practiceTitle: 'Self-Compassion Break',
    resilience_type: 'Relational',
    duration: '5 minutes',
    emoji: '🤲',
    instructions: [
      'Notice a moment of difficulty or self-criticism.',
      'Place one hand on your heart.',
      'Acknowledge: "This is a moment of suffering. Suffering is part of life."',
      'Say to yourself: "May I be kind to myself in this moment."',
      'Take three slow, deep breaths, receiving this kindness as you would from a caring friend.'
    ],
    actPrinciple: {
      name: 'Compassion',
      description: 'Extending the same warmth to yourself that you would offer a close friend in difficulty.',
      targetArea: 'Self-relational patterns and psychological acceptance'
    },
    abaPrinciple: {
      name: 'Social Reinforcement',
      description: 'Internalising supportive social responses to reduce self-critical behavior patterns.',
      mechanism: 'Differential reinforcement of self-compassionate responses over self-criticism'
    },
    reflectionQuestion: 'What would you say to a good friend going through exactly what you\'re experiencing?',
    difficulty: 'beginner',
    outcomes: [
      'Reduced self-criticism',
      'Increased emotional self-support',
      'Greater resilience to personal failure'
    ]
  },
  {
    id: 're-04',
    practiceTitle: 'Connection Ritual',
    resilience_type: 'Relational',
    duration: '7 minutes',
    emoji: '🌐',
    instructions: [
      'Identify one relationship that is important to you but feels neglected.',
      'Plan one small, specific act to nurture it (a call, a shared meal, a check-in).',
      'Schedule it in your calendar right now.',
      'Before the connection, set an intention: "I want to show up for this person by…"',
      'After the connection, briefly note how you both seemed to feel.'
    ],
    actPrinciple: {
      name: 'Committed Action',
      description: 'Taking deliberate steps to live out relational values through concrete behavior.',
      targetArea: 'Values-consistent relational action'
    },
    abaPrinciple: {
      name: 'Behavior Shaping',
      description: 'Building consistent relationship-maintenance habits through scheduled, planned behaviors.',
      mechanism: 'Behavioral momentum through implementation intentions and reinforcement schedules'
    },
    reflectionQuestion: 'What does this connection reveal about what you value most in relationships?',
    difficulty: 'intermediate',
    outcomes: [
      'Stronger social support network',
      'Increased relationship satisfaction',
      'Alignment between relational values and behavior'
    ]
  },

  // ── Agentic-Generative ───────────────────────────────────────────────────
  {
    id: 'ag-01',
    practiceTitle: 'One Small Step',
    resilience_type: 'Agentic-Generative',
    duration: '5 minutes',
    emoji: '👟',
    instructions: [
      'Think of a goal or aspiration you\'ve been putting off.',
      'Identify the very smallest first step that would move you toward it.',
      'Make it so small it feels almost too easy (e.g., write one sentence, make one call).',
      'Do that one step right now or schedule it for today.',
      'Celebrate the completion — acknowledge that you moved forward.'
    ],
    actPrinciple: {
      name: 'Committed Action',
      description: 'Building momentum toward values-consistent goals through small, achievable steps.',
      targetArea: 'Behavioral activation and goal pursuit'
    },
    abaPrinciple: {
      name: 'Goal Shaping',
      description: 'Using progressive approximation to build complex goal-directed behavior from small steps.',
      mechanism: 'Shaping through reinforcement of successive approximations to the target behavior'
    },
    reflectionQuestion: 'What does taking this step — however small — tell you about your capacity to act?',
    difficulty: 'beginner',
    outcomes: [
      'Reduced procrastination',
      'Increased self-efficacy',
      'Behavioral momentum toward meaningful goals'
    ]
  },
  {
    id: 'ag-02',
    practiceTitle: 'Values Compass Check',
    resilience_type: 'Agentic-Generative',
    duration: '5 minutes',
    emoji: '🧭',
    instructions: [
      'Write down three things you care most deeply about (values, not goals).',
      'Look at how you spent your time and energy in the past 48 hours.',
      'Rate each value: How much did your actions align with it? (1–10)',
      'Identify one area where you\'d like more alignment.',
      'Name one specific action you can take tomorrow to move toward that alignment.'
    ],
    actPrinciple: {
      name: 'Values Alignment',
      description: 'Clarifying and acting in accordance with personally meaningful values as a guide for behavior.',
      targetArea: 'Values clarification and values-action alignment'
    },
    abaPrinciple: {
      name: 'Goal Shaping',
      description: 'Defining values-consistent behaviors and systematically reinforcing them over time.',
      mechanism: 'Behavioral goal setting with values as motivating operations'
    },
    reflectionQuestion: 'When your actions align with your values, what feels different about your energy and motivation?',
    difficulty: 'beginner',
    outcomes: [
      'Clearer personal values',
      'Increased purposeful action',
      'Greater sense of integrity and direction'
    ]
  },
  {
    id: 'ag-03',
    practiceTitle: 'Action Experiment',
    resilience_type: 'Agentic-Generative',
    duration: '10 minutes',
    emoji: '🔬',
    instructions: [
      'Identify one area where you feel stuck or uncertain about what to do.',
      'Frame it as an experiment: "What if I tried _____ for 3 days?"',
      'Define the specific action, the time period, and how you\'ll measure the result.',
      'Start the experiment today.',
      'At the end of the period, write down what you observed and learned.'
    ],
    actPrinciple: {
      name: 'Committed Action',
      description: 'Taking bold, experimental action in the service of values, treating outcomes as learning.',
      targetArea: 'Behavioral experimentation and flexible action'
    },
    abaPrinciple: {
      name: 'Progressive Approximation',
      description: 'Using time-limited behavioral experiments to build new repertoires with low-risk exposure.',
      mechanism: 'Shaping of novel behaviors through structured experimentation with reinforcing feedback'
    },
    reflectionQuestion: 'What did you learn about yourself from trying this experiment?',
    difficulty: 'intermediate',
    outcomes: [
      'Increased willingness to try new approaches',
      'Reduced fear of failure',
      'Expanded behavioral flexibility'
    ]
  },
  {
    id: 'ag-04',
    practiceTitle: 'Progress Celebration',
    resilience_type: 'Agentic-Generative',
    duration: '3 minutes',
    emoji: '🎉',
    instructions: [
      'Take a moment to look back at the past week.',
      'Write down three things you accomplished — no matter how small.',
      'For each one, acknowledge the effort it took.',
      'Choose a small way to celebrate or honor that progress (a walk, a treat, a kind word to yourself).',
      'Share one accomplishment with someone who will genuinely appreciate it.'
    ],
    actPrinciple: {
      name: 'Values Alignment',
      description: 'Recognising progress as evidence of living in accordance with your values.',
      targetArea: 'Motivational renewal and positive self-regard'
    },
    abaPrinciple: {
      name: 'Goal Shaping',
      description: 'Using positive reinforcement of completed behaviors to strengthen and maintain goal-directed action.',
      mechanism: 'Schedules of reinforcement to maintain behavioral momentum'
    },
    reflectionQuestion: 'How does acknowledging your progress affect your motivation for what comes next?',
    difficulty: 'beginner',
    outcomes: [
      'Increased motivation',
      'Stronger sense of accomplishment',
      'Reinforcement of persistence behaviors'
    ]
  },

  // ── Emotional-Adaptive ───────────────────────────────────────────────────
  {
    id: 'ea-01',
    practiceTitle: 'Emotion Labeling',
    resilience_type: 'Emotional-Adaptive',
    duration: '4 minutes',
    emoji: '🏷️',
    instructions: [
      'Pause and tune into your emotional state right now.',
      'Identify the emotion as specifically as you can (not just "bad" — try "anxious," "frustrated," "sad").',
      'Name it aloud or write it down: "Right now I\'m feeling ___."',
      'Notice where you feel it in your body.',
      'Simply acknowledge it without trying to change or judge it.'
    ],
    actPrinciple: {
      name: 'Acceptance',
      description: 'Allowing emotions to be present without struggling against them or avoiding them.',
      targetArea: 'Emotional awareness and acceptance'
    },
    abaPrinciple: {
      name: 'Coping Routines',
      description: 'Building a consistent emotional check-in routine to increase emotional regulation capacity.',
      mechanism: 'Stimulus control through pairing the label with reduced emotional reactivity'
    },
    reflectionQuestion: 'What happens to the intensity of an emotion when you name it precisely?',
    difficulty: 'beginner',
    outcomes: [
      'Increased emotional granularity',
      'Reduced emotional overwhelm',
      'Greater capacity to respond rather than react'
    ]
  },
  {
    id: 'ea-02',
    practiceTitle: 'Box Breathing Reset',
    resilience_type: 'Emotional-Adaptive',
    duration: '4 minutes',
    emoji: '🔲',
    instructions: [
      'Sit upright in a comfortable position.',
      'Exhale completely to empty your lungs.',
      'Inhale slowly through your nose for 4 counts.',
      'Hold your breath for 4 counts.',
      'Exhale slowly through your mouth for 4 counts.',
      'Hold empty for 4 counts.',
      'Repeat the cycle 4–6 times, focusing on the rhythm.'
    ],
    actPrinciple: {
      name: 'Willingness',
      description: 'Creating physiological space to be with difficult emotions without avoidance.',
      targetArea: 'Autonomic regulation and present-moment stabilisation'
    },
    abaPrinciple: {
      name: 'Coping Routines',
      description: 'Establishing a reliable, structured breathing routine as a coping behavior under stress.',
      mechanism: 'Behavioral contingency: breathing cue → calm response → reduced arousal'
    },
    reflectionQuestion: 'How does your body feel before versus after the breathing exercise?',
    difficulty: 'beginner',
    outcomes: [
      'Reduced physiological stress response',
      'Increased emotional regulation',
      'Reliable coping tool available anywhere'
    ]
  },
  {
    id: 'ea-03',
    practiceTitle: 'Urge Surfing',
    resilience_type: 'Emotional-Adaptive',
    duration: '7 minutes',
    emoji: '🏄',
    instructions: [
      'When you notice a strong urge or uncomfortable emotion, pause.',
      'Instead of acting on it or suppressing it, observe it like a wave.',
      'Rate the urge\'s intensity from 1–10.',
      'Notice where it sits in your body and what sensations accompany it.',
      'Watch it naturally rise, peak, and fall without you having to do anything.',
      'Notice: waves always pass.'
    ],
    actPrinciple: {
      name: 'Defusion and Willingness',
      description: 'Observing emotional and behavioral urges without being controlled by them.',
      targetArea: 'Impulse tolerance and emotional flexibility'
    },
    abaPrinciple: {
      name: 'Behavioral Contingencies',
      description: 'Using extinction of automatic urge-driven responses by breaking the antecedent-behavior-consequence chain.',
      mechanism: 'Extinction of avoidance behavior through non-reinforced exposure to emotional stimuli'
    },
    reflectionQuestion: 'What did you learn about the lifespan of a strong urge or emotion?',
    difficulty: 'intermediate',
    outcomes: [
      'Increased tolerance of distressing emotions',
      'Reduced impulsive responding',
      'Greater sense of self-efficacy with difficult states'
    ]
  },
  {
    id: 'ea-04',
    practiceTitle: 'Daily Emotional Check-In',
    resilience_type: 'Emotional-Adaptive',
    duration: '3 minutes',
    emoji: '🌡️',
    instructions: [
      'Choose a consistent time each day for this check-in (morning, midday, or evening).',
      'Pause and ask: "What am I feeling right now?"',
      'Rate your overall emotional wellbeing on a 1–10 scale.',
      'Identify one thing contributing to that rating.',
      'Respond with one kind or practical action: rest, reach out, move your body, or simply acknowledge the feeling.'
    ],
    actPrinciple: {
      name: 'Acceptance',
      description: 'Developing a daily practice of open, non-judgmental contact with emotional experience.',
      targetArea: 'Emotional self-awareness and adaptive responding'
    },
    abaPrinciple: {
      name: 'Coping Routines',
      description: 'Establishing a daily behavioral routine to proactively regulate emotional wellbeing.',
      mechanism: 'Fixed-time schedule of reinforcement for self-monitoring behavior'
    },
    reflectionQuestion: 'What patterns do you notice across your emotional check-ins over time?',
    difficulty: 'beginner',
    outcomes: [
      'Proactive emotional awareness',
      'Early identification of stress',
      'Consistent self-care behavior'
    ]
  },

  // ── Spiritual-Existential ────────────────────────────────────────────────
  {
    id: 'se-01',
    practiceTitle: 'Values Reflection',
    resilience_type: 'Spiritual-Existential',
    duration: '7 minutes',
    emoji: '🌟',
    instructions: [
      'Find a quiet moment and sit comfortably.',
      'Ask yourself: "What matters most to me in life?"',
      'Write down 5–7 values (e.g., integrity, connection, creativity, courage).',
      'Choose the top 3 that feel most alive and essential to who you are.',
      'For each, write one sentence about what living that value looks like today.'
    ],
    actPrinciple: {
      name: 'Values Clarification',
      description: 'Identifying personally meaningful values to serve as a compass for purposeful living.',
      targetArea: 'Existential direction and motivational grounding'
    },
    abaPrinciple: {
      name: 'Values-Driven Behavior',
      description: 'Using clarified values as establishing operations that motivate and guide daily behavior.',
      mechanism: 'Values as conditioned motivating operations for committed action'
    },
    reflectionQuestion: 'What would your life look like if you lived even 10% more aligned with these values?',
    difficulty: 'beginner',
    outcomes: [
      'Clearer sense of personal direction',
      'Increased intrinsic motivation',
      'Greater alignment between values and daily choices'
    ]
  },
  {
    id: 'se-02',
    practiceTitle: 'Purpose Journaling',
    resilience_type: 'Spiritual-Existential',
    duration: '8 minutes',
    emoji: '🌱',
    instructions: [
      'Open a journal and respond to this prompt: "When I am at my best, I am…"',
      'Write for 5 minutes without editing or stopping.',
      'Read what you wrote and underline phrases that feel especially true.',
      'Write one sentence completing this: "My life has meaning because…"',
      'Place this somewhere you\'ll see it throughout the week.'
    ],
    actPrinciple: {
      name: 'Purpose Alignment',
      description: 'Connecting to a sense of larger meaning that transcends immediate challenges.',
      targetArea: 'Existential grounding and motivational resilience'
    },
    abaPrinciple: {
      name: 'Reinforcement Schedules',
      description: 'Using regular journaling as a reinforced behavior that builds purposeful self-reflection over time.',
      mechanism: 'Variable ratio reinforcement of insight-generating behavior'
    },
    reflectionQuestion: 'What does this writing reveal about what gives your life meaning?',
    difficulty: 'beginner',
    outcomes: [
      'Increased sense of purpose',
      'Greater resilience in adversity',
      'Clearer existential direction'
    ]
  },
  {
    id: 'se-03',
    practiceTitle: 'Gratitude and Meaning Practice',
    resilience_type: 'Spiritual-Existential',
    duration: '5 minutes',
    emoji: '🙏',
    instructions: [
      'At the end of the day, write down three things you are grateful for.',
      'For each one, write why it is meaningful or significant to you.',
      'Go deeper than surface level: What does this tell you about what matters?',
      'Notice any theme across the three items.',
      'Take a moment to simply appreciate these sources of meaning.'
    ],
    actPrinciple: {
      name: 'Values Clarification',
      description: 'Using gratitude as a window into personal values and sources of meaning.',
      targetArea: 'Positive emotion and meaning-making'
    },
    abaPrinciple: {
      name: 'Reinforcement Schedules',
      description: 'Daily gratitude practice reinforces attention to positive, meaningful life events.',
      mechanism: 'Positive reinforcement of gratitude behavior through increased positive affect'
    },
    reflectionQuestion: 'What themes emerge in what you\'re grateful for, and what do they reveal about your values?',
    difficulty: 'beginner',
    outcomes: [
      'Increased positive emotions',
      'Stronger sense of meaning',
      'Greater life satisfaction'
    ]
  },
  {
    id: 'se-04',
    practiceTitle: 'Morning Intention Setting',
    resilience_type: 'Spiritual-Existential',
    duration: '4 minutes',
    emoji: '🌅',
    instructions: [
      'Before checking your phone or email, take 4 minutes in the morning.',
      'Ask yourself: "Who do I want to be today?"',
      'Choose one value or quality to embody (e.g., patience, curiosity, courage).',
      'Set one specific intention: "Today I will show up with [value] by doing ___."',
      'Return to this intention at least once during the day.'
    ],
    actPrinciple: {
      name: 'Purpose Alignment',
      description: 'Anchoring each day in values-consistent intentions before reactive demands take hold.',
      targetArea: 'Purposeful daily engagement'
    },
    abaPrinciple: {
      name: 'Values-Driven Behavior',
      description: 'Using morning intention as a behavioral cue that primes values-consistent behavior throughout the day.',
      mechanism: 'Stimulus control: morning intention as antecedent for purposeful behavior'
    },
    reflectionQuestion: 'How did living your intention today affect how you experienced the day?',
    difficulty: 'beginner',
    outcomes: [
      'Greater sense of daily purpose',
      'Improved alignment between intentions and actions',
      'Increased proactive engagement with values'
    ]
  },

  // ── Somatic-Behavioral ───────────────────────────────────────────────────
  {
    id: 'sb-01',
    practiceTitle: 'Body Scan',
    resilience_type: 'Somatic-Behavioral',
    duration: '7 minutes',
    emoji: '🧘',
    instructions: [
      'Lie down or sit comfortably with eyes closed.',
      'Begin at the top of your head and slowly move your attention downward.',
      'Pause at each body region: head, neck, shoulders, chest, belly, arms, hands, hips, legs, feet.',
      'Simply notice any sensations — tension, warmth, tingling, ease — without trying to change them.',
      'When you reach your feet, take three deep breaths and gently open your eyes.'
    ],
    actPrinciple: {
      name: 'Present-Moment Awareness',
      description: 'Making deliberate, non-judgmental contact with current body sensations.',
      targetArea: 'Somatic awareness and grounded presence'
    },
    abaPrinciple: {
      name: 'Behavioral Habit Loops',
      description: 'Building a consistent body awareness routine that becomes a reliable self-regulation habit.',
      mechanism: 'Habit loop: cue (sit/lie) → routine (scan) → reward (relaxation/awareness)'
    },
    reflectionQuestion: 'What areas of your body held the most tension, and what might that tell you?',
    difficulty: 'beginner',
    outcomes: [
      'Increased somatic self-awareness',
      'Reduced physical tension',
      'Improved mind-body connection'
    ]
  },
  {
    id: 'sb-02',
    practiceTitle: 'Walking Meditation',
    resilience_type: 'Somatic-Behavioral',
    duration: '10 minutes',
    emoji: '🚶',
    instructions: [
      'Find a safe space to walk — indoors or outside.',
      'Walk at about half your usual pace.',
      'With each step, notice the sensation of your foot lifting, moving forward, and landing.',
      'Notice the movement in your legs, hips, and arms.',
      'When your mind wanders, gently return attention to the physical act of walking.',
      'End by standing still for 30 seconds, noticing how your body feels.'
    ],
    actPrinciple: {
      name: 'Present-Moment Awareness',
      description: 'Using movement as an anchor to the present moment, integrating mindfulness with physical activity.',
      targetArea: 'Embodied presence and mindful movement'
    },
    abaPrinciple: {
      name: 'Stimulus Control',
      description: 'Pairing a daily activity (walking) with mindful attention to create an accessible awareness habit.',
      mechanism: 'Behavioral chaining: physical movement cue → mindful attention → relaxation response'
    },
    reflectionQuestion: 'What was different about walking when you paid deliberate attention to each step?',
    difficulty: 'beginner',
    outcomes: [
      'Increased present-moment awareness',
      'Reduced mental chatter',
      'Integration of movement and mindfulness'
    ]
  },
  {
    id: 'sb-03',
    practiceTitle: 'Posture Awareness Reset',
    resilience_type: 'Somatic-Behavioral',
    duration: '3 minutes',
    emoji: '🪑',
    instructions: [
      'Wherever you are sitting or standing, pause.',
      'Notice your current posture without judging it.',
      'Gently adjust: feet flat, spine tall, shoulders soft and back, chin slightly tucked.',
      'Take three slow, expansive breaths in this aligned posture.',
      'Set a reminder to do this every 2 hours throughout your day.'
    ],
    actPrinciple: {
      name: 'Present-Moment Awareness',
      description: 'Using posture as a mindfulness anchor that connects physical state to psychological awareness.',
      targetArea: 'Embodied self-regulation'
    },
    abaPrinciple: {
      name: 'Behavioral Habit Loops',
      description: 'Using scheduled prompts to build automatic posture-check behavior that supports wellbeing.',
      mechanism: 'Stimulus control via timed cues to trigger consistent posture-adjustment behavior'
    },
    reflectionQuestion: 'How does your posture reflect your mental state, and how does changing it affect how you feel?',
    difficulty: 'beginner',
    outcomes: [
      'Improved postural habits',
      'Reduced physical fatigue',
      'Greater body-mind integration'
    ]
  },
  {
    id: 'sb-04',
    practiceTitle: 'Grounding 5-4-3-2-1',
    resilience_type: 'Somatic-Behavioral',
    duration: '5 minutes',
    emoji: '🌍',
    instructions: [
      'When feeling overwhelmed, anxious, or disconnected, pause wherever you are.',
      'Name 5 things you can see around you.',
      'Name 4 things you can physically feel (your feet on the floor, air on skin, etc.).',
      'Name 3 things you can hear.',
      'Name 2 things you can smell (or recall two favourite scents).',
      'Name 1 thing you can taste.',
      'Take one deep breath. You are here, present, and safe.'
    ],
    actPrinciple: {
      name: 'Present-Moment Awareness',
      description: 'Using multisensory grounding to anchor awareness in the present and interrupt anxiety spirals.',
      targetArea: 'Grounding and distress tolerance'
    },
    abaPrinciple: {
      name: 'Stimulus Control',
      description: 'Using sensory stimuli as anchors that control attentional behavior and interrupt stress responses.',
      mechanism: 'Sensory discrimination training to redirect attention from internal distress to external environment'
    },
    reflectionQuestion: 'What did you notice about your anxiety or overwhelm after completing this exercise?',
    difficulty: 'beginner',
    outcomes: [
      'Rapid reduction in acute anxiety',
      'Improved ability to return to the present',
      'Reliable tool for moments of overwhelm'
    ]
  },
  {
    id: 'sb-05',
    practiceTitle: 'Mindful Movement Break',
    resilience_type: 'Somatic-Behavioral',
    duration: '5 minutes',
    emoji: '🤸',
    instructions: [
      'Set a timer for 5 minutes.',
      'Stand up and gently move your body: roll your neck, shrug your shoulders, stretch your arms overhead.',
      'Do slow hip circles and gentle knee bends.',
      'With each movement, pay attention to the sensations — don\'t just go through the motions.',
      'End with 30 seconds standing still, noticing how your body feels now compared to before.'
    ],
    actPrinciple: {
      name: 'Mindfulness',
      description: 'Bringing intentional, non-judgmental attention to bodily sensations during movement.',
      targetArea: 'Somatic mindfulness and behavioral activation'
    },
    abaPrinciple: {
      name: 'Behavioral Habit Loops',
      description: 'Using brief movement breaks as reinforced behavioral routines that reset physiological and mental state.',
      mechanism: 'Negative reinforcement: movement removes discomfort of prolonged sitting; positive reinforcement via increased energy'
    },
    reflectionQuestion: 'How do regular movement breaks change your energy, focus, and mood throughout the day?',
    difficulty: 'intermediate',
    outcomes: [
      'Reduced sedentary behavior',
      'Improved energy and focus',
      'Stronger body-awareness habits'
    ]
  }
];

// ── Helper: escape HTML ───────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── localStorage progress tracking ───────────────────────────────────────────
const STORAGE_KEY = 'resilience_practice_completions';

function getCompletions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveCompletion(practiceId, reflectionResponse) {
  const completions = getCompletions();
  completions[practiceId] = {
    completedAt: new Date().toISOString(),
    reflectionResponse: reflectionResponse || ''
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(completions));

  // Persist to backend (non-blocking)
  persistCompletion(practiceId, reflectionResponse).catch(() => {});
}

function isCompleted(practiceId) {
  return Boolean(getCompletions()[practiceId]);
}

function getWeeklyCompletionCount() {
  const completions = getCompletions();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return Object.values(completions).filter(c => new Date(c.completedAt) >= oneWeekAgo).length;
}

async function persistCompletion(practiceId, reflectionResponse) {
  const practice = EVIDENCE_BASED_PRACTICES.find(p => p.id === practiceId);
  if (!practice) return;

  const payload = {
    practiceId,
    reflectionResponse: reflectionResponse || '',
    difficulty_level: practice.difficulty,
    framework_principles_engaged: [
      practice.actPrinciple.name,
      practice.abaPrinciple.name
    ]
  };

  await fetch('/api/evidence-practices/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// ── Practice filtering by resilience type ────────────────────────────────────
function getPracticesForType(resilienceType) {
  return EVIDENCE_BASED_PRACTICES.filter(p => p.resilience_type === resilienceType);
}

// ── UI: Render practice card ──────────────────────────────────────────────────
function renderPracticeCard(practice) {
  const completed = isCompleted(practice.id);
  const instructionItems = practice.instructions
    .map((step, i) => `<li>${escHtml(step)}</li>`)
    .join('');
  const outcomeItems = practice.outcomes
    .map(o => `<li>${escHtml(o)}</li>`)
    .join('');

  return `
    <article class="ep-card${completed ? ' ep-card--completed' : ''}" data-practice-id="${escHtml(practice.id)}" aria-label="Practice: ${escHtml(practice.practiceTitle)}">
      <div class="ep-card__header">
        <span class="ep-card__emoji" aria-hidden="true">${escHtml(practice.emoji)}</span>
        <div class="ep-card__meta">
          <h4 class="ep-card__title">${escHtml(practice.practiceTitle)}</h4>
          <div class="ep-card__tags">
            <span class="ep-tag ep-tag--duration" aria-label="Duration">⏱ ${escHtml(practice.duration)}</span>
            <span class="ep-tag ep-tag--difficulty ep-tag--${escHtml(practice.difficulty)}">${escHtml(practice.difficulty)}</span>
            ${completed ? '<span class="ep-tag ep-tag--done" aria-label="Completed">✅ Completed</span>' : ''}
          </div>
        </div>
      </div>

      <div class="ep-card__badges">
        <div class="ep-badge ep-badge--act" title="Acceptance and Commitment Therapy principle">
          <span class="ep-badge__label">ACT</span>
          <span class="ep-badge__name">${escHtml(practice.actPrinciple.name)}</span>
        </div>
        <div class="ep-badge ep-badge--aba" title="Applied Behavior Analysis principle">
          <span class="ep-badge__label">ABA</span>
          <span class="ep-badge__name">${escHtml(practice.abaPrinciple.name)}</span>
        </div>
      </div>

      <details class="ep-card__details">
        <summary class="ep-card__summary">View Instructions &amp; Details</summary>
        <div class="ep-card__body">
          <h5>Instructions</h5>
          <ol class="ep-instructions">${instructionItems}</ol>

          <div class="ep-principles">
            <div class="ep-principle ep-principle--act">
              <h6><span aria-hidden="true">🌿</span> ACT Principle: ${escHtml(practice.actPrinciple.name)}</h6>
              <p>${escHtml(practice.actPrinciple.description)}</p>
              <p class="ep-principle__detail"><strong>Target area:</strong> ${escHtml(practice.actPrinciple.targetArea)}</p>
            </div>
            <div class="ep-principle ep-principle--aba">
              <h6><span aria-hidden="true">🔬</span> ABA Principle: ${escHtml(practice.abaPrinciple.name)}</h6>
              <p>${escHtml(practice.abaPrinciple.description)}</p>
              <p class="ep-principle__detail"><strong>Mechanism:</strong> ${escHtml(practice.abaPrinciple.mechanism)}</p>
            </div>
          </div>

          <div class="ep-outcomes">
            <h5>Expected Outcomes</h5>
            <ul>${outcomeItems}</ul>
          </div>
        </div>
      </details>

      ${window.Affirmations ? window.Affirmations.renderAffirmationForPractice(practice.id) : ''}

      <div class="ep-card__action">
        <button
          class="ep-btn-practice${completed ? ' ep-btn-practice--done' : ''}"
          data-practice-id="${escHtml(practice.id)}"
          aria-label="${completed ? 'Practice completed' : 'Mark practice as complete'}"
          ${completed ? 'disabled' : ''}>
          ${completed ? '✅ Practice Complete' : '▶ Practice Now'}
        </button>
      </div>
    </article>
  `;
}

// ── UI: Render reflection modal ───────────────────────────────────────────────
function renderReflectionModal(practice) {
  const affirmationHtml = window.Affirmations
    ? window.Affirmations.renderAffirmationForPractice(practice.id)
        .replace('aff-practice-hint', 'aff-reflection-prompt')
        .replace('aff-practice-hint__label', 'aff-practice-hint__label')
        .replace('aff-practice-hint__text', 'aff-practice-hint__text')
    : '';

  return `
    <div class="ep-modal-overlay" id="ep-modal" role="dialog" aria-modal="true" aria-labelledby="ep-modal-title">
      <div class="ep-modal">
        <h4 id="ep-modal-title">${escHtml(practice.emoji)} Reflection: ${escHtml(practice.practiceTitle)}</h4>
        ${affirmationHtml}
        <p class="ep-modal__prompt">${escHtml(practice.reflectionQuestion)}</p>
        <label for="ep-reflection-input" class="hidden">Your reflection</label>
        <textarea
          id="ep-reflection-input"
          class="ep-modal__textarea"
          placeholder="Take a moment to write your reflection… (optional)"
          rows="4"
          maxlength="1000"
          aria-label="Reflection response"></textarea>
        <div class="ep-modal__actions">
          <button class="ep-btn-primary" id="ep-modal-complete">Complete Practice</button>
          <button class="ep-btn-secondary" id="ep-modal-skip">Skip Reflection</button>
        </div>
      </div>
    </div>
  `;
}

// ── UI: Render the full practices section ────────────────────────────────────
function renderPracticesSection(emergingStrength) {
  const practices = getPracticesForType(emergingStrength);
  if (!practices.length) return '';

  const weeklyCount = getWeeklyCompletionCount();
  const totalPractices = EVIDENCE_BASED_PRACTICES.length;
  const allCompletedCount = Object.keys(getCompletions()).length;
  const progressPct = Math.round((allCompletedCount / totalPractices) * 100);

  const cards = practices.map(p => renderPracticeCard(p)).join('');

  return `
    <section class="ep-section" aria-labelledby="ep-section-heading">
      <div class="ep-section__header">
        <h2 id="ep-section-heading">Your Next Steps in the Resilience Atlas</h2>
        <p class="ep-section__subtitle">
          Practices to Strengthen Your Growth Edge: <strong>${escHtml(emergingStrength)}</strong>
        </p>
        <p class="ep-disclaimer">
          <span aria-hidden="true">ℹ️</span>
          <strong>Educational Disclaimer:</strong> These practices are educational and supportive,
          not therapeutic or clinical treatment. If you are experiencing significant distress,
          please consult a qualified mental health professional.
        </p>
      </div>

      <div class="ep-framework-intro">
        <div class="ep-framework-card ep-framework-card--act">
          <h3>🌿 About ACT</h3>
          <p>
            <strong>Acceptance and Commitment Therapy (ACT)</strong> is an evidence-based approach
            that builds <em>psychological flexibility</em> — the ability to be present, open to
            experience, and take meaningful action in line with your values.
          </p>
          <a href="https://contextualscience.org/act" target="_blank" rel="noopener noreferrer" class="ep-link">
            Learn more about ACT →
          </a>
        </div>
        <div class="ep-framework-card ep-framework-card--aba">
          <h3>🔬 About ABA</h3>
          <p>
            <strong>Applied Behavior Analysis (ABA)</strong> is an evidence-based science that
            applies principles of learning and behavior to build positive, meaningful behavioral
            change through structured practice and reinforcement.
          </p>
          <a href="https://www.abainternational.org/about-us/behavior-analysis.aspx" target="_blank" rel="noopener noreferrer" class="ep-link">
            Learn more about ABA →
          </a>
        </div>
      </div>

      <div class="ep-progress-bar-container" aria-label="Practice progress">
        <div class="ep-progress-label">
          <span>Practices Completed This Week: <strong>${weeklyCount}</strong></span>
          <span>Overall: <strong>${allCompletedCount} / ${totalPractices}</strong></span>
        </div>
        <div class="ep-progress-track" role="progressbar" aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100">
          <div class="ep-progress-fill" style="width: ${progressPct}%"></div>
        </div>
      </div>

      <div class="ep-cards-grid" id="ep-cards-grid">
        ${cards}
      </div>

      <div class="ep-reassessment-prompt">
        <p>
          <span aria-hidden="true">🔄</span>
          Return to The Resilience Atlas in <strong>30 days</strong> to see how your resilience
          profile evolves as you practise.
        </p>
        <a href="quiz.html" class="ep-btn-secondary ep-reassessment-link">Retake Assessment</a>
      </div>

    </section>
  `;
}

// ── UI: Initialise practice interactions ─────────────────────────────────────
function initPracticeInteractions() {
  const grid = document.getElementById('ep-cards-grid');
  if (!grid) return;

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-practice-id].ep-btn-practice:not([disabled])');
    if (!btn) return;

    const practiceId = btn.getAttribute('data-practice-id');
    const practice = EVIDENCE_BASED_PRACTICES.find(p => p.id === practiceId);
    if (!practice) return;

    showReflectionModal(practice);
  });
}

function showReflectionModal(practice) {
  // Remove any existing modal
  document.getElementById('ep-modal')?.remove();

  const div = document.createElement('div');
  div.innerHTML = renderReflectionModal(practice);
  document.body.appendChild(div.firstElementChild);

  const modal = document.getElementById('ep-modal');
  const textarea = document.getElementById('ep-reflection-input');
  textarea?.focus();

  function completeAndClose() {
    const reflection = textarea?.value.trim() || '';
    saveCompletion(practice.id, reflection);
    modal.remove();
    refreshPracticeCard(practice.id);
    updateProgressBar();
    showCompletionToast(practice.practiceTitle);
  }

  document.getElementById('ep-modal-complete')?.addEventListener('click', completeAndClose);

  document.getElementById('ep-modal-skip')?.addEventListener('click', () => {
    saveCompletion(practice.id, '');
    modal.remove();
    refreshPracticeCard(practice.id);
    updateProgressBar();
    showCompletionToast(practice.practiceTitle);
  });

  // Close on overlay click
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      saveCompletion(practice.id, textarea?.value.trim() || '');
      modal.remove();
      refreshPracticeCard(practice.id);
      updateProgressBar();
      showCompletionToast(practice.practiceTitle);
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function handleEsc(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEsc);
    }
  });
}

function refreshPracticeCard(practiceId) {
  const practice = EVIDENCE_BASED_PRACTICES.find(p => p.id === practiceId);
  if (!practice) return;
  const existing = document.querySelector(`[data-practice-id="${practiceId}"].ep-card`);
  if (!existing) return;
  const newCard = document.createElement('div');
  newCard.innerHTML = renderPracticeCard(practice);
  existing.replaceWith(newCard.firstElementChild);
}

function updateProgressBar() {
  const completions = getCompletions();
  const weeklyCount = getWeeklyCompletionCount();
  const allCount = Object.keys(completions).length;
  const total = EVIDENCE_BASED_PRACTICES.length;
  const pct = Math.round((allCount / total) * 100);

  const fill = document.querySelector('.ep-progress-fill');
  if (fill) {
    fill.style.width = `${pct}%`;
    fill.closest('[role="progressbar"]')?.setAttribute('aria-valuenow', pct);
  }

  const labels = document.querySelectorAll('.ep-progress-label strong');
  if (labels[0]) labels[0].textContent = weeklyCount;
  if (labels[1]) labels[1].textContent = `${allCount} / ${total}`;
}

function showCompletionToast(title) {
  const toast = document.createElement('div');
  toast.className = 'ep-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = `✅ "${title}" marked as complete!`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('ep-toast--visible'), 10);
  setTimeout(() => {
    toast.classList.remove('ep-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Public API ────────────────────────────────────────────────────────────────
window.EvidencePractices = {
  renderPracticesSection,
  initPracticeInteractions,
  EVIDENCE_BASED_PRACTICES,
  getPracticesForType,
};
