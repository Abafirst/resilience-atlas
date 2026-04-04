/**
 * adultGames.js
 *
 * ABA/ACT-aligned adult gamification content for Atlas Starter and Navigator tiers.
 * Language: clinical-but-warm, evidence-based, values-affirming.
 *
 * Structure:
 *   MICRO_QUESTS          — Starter tier: one 5-min practice per dimension
 *   SKILL_PATHWAYS        — Navigator tier: 3-level progressions per dimension
 *   CHOICE_SCENARIOS      — Navigator tier: ACT-aligned branching scenarios
 *   REINFORCEMENT_MENU    — Navigator tier: 3-5 practices per dimension
 *   ADULT_BADGES          — Badge definitions for both tiers
 *   DIMENSION_COLORS      — Consistent color map for dimensions
 */

// ── Dimension color map ──────────────────────────────────────────────────────

export const DIMENSION_COLORS = {
  'Agentic-Generative':   { bg: '#fef9c3', accent: '#854d0e', border: '#fde68a', icon: '/icons/agentic-generative.svg' },
  'Relational-Connective':{ bg: '#ede9fe', accent: '#7c3aed', border: '#ddd6fe', icon: '/icons/relational-connective.svg' },
  'Emotional-Adaptive':   { bg: '#ffe4e6', accent: '#be123c', border: '#fecdd3', icon: '/icons/emotional-adaptive.svg' },
  'Spiritual-Reflective': { bg: '#f0fdf4', accent: '#065f46', border: '#bbf7d0', icon: '/icons/spiritual-reflective.svg' },
  'Somatic-Regulative':   { bg: '#dcfce7', accent: '#15803d', border: '#bbf7d0', icon: '/icons/somatic-regulative.svg' },
  'Cognitive-Narrative':  { bg: '#e0f2fe', accent: '#0284c7', border: '#bae6fd', icon: '/icons/cognitive-narrative.svg' },
};

// ── Starter Micro-Quests ─────────────────────────────────────────────────────
// One 5-minute practice per dimension. Completing all 6 earns "Dimension Seeker."

export const MICRO_QUESTS = [
  {
    id:           'mq-agentic',
    dimension:    'Agentic-Generative',
    title:        'Values-Aligned Action',
    duration:     '5 min',
    points:       5,
    description:  'Identify one micro-commitment you can act on today that aligns with a core value.',
    prompt:       'Name a value that matters to you (e.g., contribution, growth, connection). Then write one small, concrete action — something you can do in the next 24 hours — that moves toward that value. This is behavioral activation: linking daily behavior to your identified values.',
    reflectionCue:'What barrier might arise, and what is one way to move through it rather than around it?',
    abaPrinciple: 'Behavioral Activation',
    actPrinciple: 'Committed Action',
    badge:        'Barrier Buster',
  },
  {
    id:           'mq-relational',
    dimension:    'Relational-Connective',
    title:        'Connection Micro-Practice',
    duration:     '5 min',
    points:       5,
    description:  'Strengthen one relational bond through intentional, values-guided outreach.',
    prompt:       'Think of one person in your life who matters to you. Compose a brief, genuine message — not transactional, not obligatory — that expresses something true about what you appreciate or notice in them. Send or plan to send it today.',
    reflectionCue:'What shows up (thoughts, hesitation) when you consider authentic outreach? Can you make room for that and act anyway?',
    abaPrinciple: 'Differential Reinforcement of Prosocial Behavior',
    actPrinciple: 'Values Clarification',
  },
  {
    id:           'mq-emotional',
    dimension:    'Emotional-Adaptive',
    title:        'Emotion Naming Practice',
    duration:     '5 min',
    points:       5,
    description:  'Build emotional flexibility by labeling your current emotional experience with precision.',
    prompt:       'Take 60 seconds and identify what you are feeling right now — use specific words (e.g., "frustrated-but-hopeful," "quietly anxious," "satisfied"). Write 3 emotion words. Then observe: labeling emotions (affect labeling) reduces their intensity. What do you notice after naming?',
    reflectionCue:'What story does your mind tell about these emotions? Can you hold that story lightly, as a passing narrative rather than a fact?',
    abaPrinciple: 'Stimulus Discrimination (internal states)',
    actPrinciple: 'Cognitive Defusion',
  },
  {
    id:           'mq-spiritual',
    dimension:    'Spiritual-Reflective',
    title:        'Values Compass Check-In',
    duration:     '5 min',
    points:       5,
    description:  'Orient your actions toward what gives life meaning through a brief values clarification.',
    prompt:       'Complete this sentence in writing: "What matters most to me right now is ___." Then: "I am living toward that value when I ___." And: "One way I drifted from it this week was ___." This is a committed action audit — non-judgmental and forward-looking.',
    reflectionCue:'Notice any self-critical thoughts that arise. Can you acknowledge them and return, gently, to the question: what do I want to stand for?',
    abaPrinciple: 'Rule-Governed Behavior (self-authored)',
    actPrinciple: 'Values Clarification + Committed Action',
  },
  {
    id:           'mq-somatic',
    dimension:    'Somatic-Regulative',
    title:        'Physiological Reset',
    duration:     '5 min',
    points:       5,
    description:  'Use an evidence-based somatic practice to regulate your nervous system state.',
    prompt:       'Practice the physiological sigh: inhale fully through the nose, take a second short inhale on top of it, then exhale slowly through the mouth. Repeat 3 times. Afterward, notice your body: where is there tension? Where is there ease? Take 2 minutes to simply observe without trying to change anything.',
    reflectionCue:'What does your body tell you about your current stress level? What is one environmental or behavioral cue you could change to support better regulation?',
    abaPrinciple: 'Stimulus Control (somatic cues)',
    actPrinciple: 'Acceptance + Present-Moment Awareness',
  },
  {
    id:           'mq-cognitive',
    dimension:    'Cognitive-Narrative',
    title:        'Narrative Reframe Practice',
    duration:     '5 min',
    points:       5,
    description:  'Apply cognitive defusion to unhelpful self-narratives using the ACT perspective-shift technique.',
    prompt:       'Identify one recurring negative thought or story about yourself (e.g., "I always fall behind," "I\'m not capable of this"). Write it down. Now write it as: "I\'m having the thought that ___." Notice the shift — you are the observer of the thought, not the thought itself. Finally, ask: if a trusted friend heard this story, what evidence would they point to that challenges it?',
    reflectionCue:'What would be possible if you held this narrative more lightly — as one story among many, not as objective truth?',
    abaPrinciple: 'Verbal Behavior (self-rules) modification',
    actPrinciple: 'Cognitive Defusion + Self-as-Context',
  },
];

// ── Navigator Skill Pathways ─────────────────────────────────────────────────
// 3-level progression per dimension.
// Level 1: Knowledge check + reflection (ABA: stimulus discrimination)
// Level 2: Apply practice + journal entry (ABA: shaping; ACT: willingness)
// Level 3: Life scenario integration + committed action plan (ACT: committed action)

export const SKILL_PATHWAYS = [
  {
    dimension:   'Agentic-Generative',
    title:       'Agency Pathway',
    description: 'Build your capacity for purposeful, values-aligned action through behavioral activation and committed action planning.',
    points:      { 1: 10, 2: 25, 3: 40 },
    levels: [
      {
        level:       1,
        title:       'Stimulus Awareness',
        subtitle:    'Knowledge + Reflection',
        framework:   'ABA: Stimulus Discrimination',
        duration:    '10 min',
        content: {
          knowledge: 'Agentic resilience is your capacity to initiate purposeful behavior toward valued outcomes, even in the face of obstacles. In ABA terms, agentic behavior is reinforced when it successfully contacts desired outcomes — but barriers (aversive stimuli) can suppress or redirect behavior. In ACT, agency is expressed through committed action: doing what matters even when difficult.',
          question:  'Which of the following best describes "behavioral activation" in the context of agentic resilience?',
          options: [
            { key: 'A', text: 'Waiting until motivation arrives before taking action', correct: false },
            { key: 'B', text: 'Scheduling valued activities to build momentum, regardless of mood', correct: true },
            { key: 'C', text: 'Eliminating all obstacles before beginning', correct: false },
          ],
          reflection: 'Describe a time when you acted toward a value even when the conditions weren\'t ideal. What made that possible?',
        },
      },
      {
        level:       2,
        title:       'Micro-Commitment in Action',
        subtitle:    'Applied Practice + Journal Entry',
        framework:   'ABA: Shaping; ACT: Willingness',
        duration:    '15 min',
        content: {
          practice: 'Identify one goal you have been deferring. Break it into 3 steps. Complete step 1 now — it should take no longer than 5 minutes. Then write a brief journal entry: What showed up (thoughts, feelings, urges) as you started? What did you notice after completing it?',
          journalPrompts: [
            'What thoughts tried to pull you away from starting?',
            'What did you feel in your body as you began?',
            'What does completing this small step tell you about your capacity?',
          ],
        },
      },
      {
        level:       3,
        title:       'Committed Action Plan',
        subtitle:    'Life Scenario Integration',
        framework:   'ACT: Committed Action; ABA: Behavior Chains',
        duration:    '20 min',
        content: {
          scenario: 'You have identified a meaningful goal (professional, relational, or personal) but notice you have been avoiding it for weeks. Each day you delay, a familiar fusion shows up: "I\'ll be ready when..." or "It\'s not the right time." You also notice low-grade guilt and a sense of drift from your values.',
          task:     'Build a committed action plan using this structure:\n1. Name the value this goal serves.\n2. Identify the specific avoidance pattern (what triggers it, what maintains it).\n3. Design 3 behavioral steps for this week, each with a specific time and context.\n4. Name what you are willing to feel/think in service of this goal.\n5. Identify one person who can serve as an accountability partner.',
          reflection: 'What would it mean for you to show up — imperfectly but consistently — for this goal over the next 30 days?',
        },
      },
    ],
  },
  {
    dimension:   'Relational-Connective',
    title:       'Connection Pathway',
    description: 'Develop skills for authentic, values-grounded relational engagement and social support mobilization.',
    points:      { 1: 10, 2: 25, 3: 40 },
    levels: [
      {
        level:       1,
        title:       'Relational Patterns',
        subtitle:    'Knowledge + Reflection',
        framework:   'ABA: Antecedent-Behavior-Consequence in relationships',
        duration:    '10 min',
        content: {
          knowledge: 'Relational resilience is built through consistent, authentic connection — not just the presence of others, but the quality and safety of those interactions. ABA research shows that social behavior is shaped by reinforcement histories: repeated experiences of connection rewarded with empathy strengthen prosocial patterns. In ACT, relational flexibility means staying present and values-guided even when relational discomfort arises.',
          question:  'In ACT, "relational defusion" refers to:',
          options: [
            { key: 'A', text: 'Distancing yourself from people who cause stress', correct: false },
            { key: 'B', text: 'Noticing unhelpful relational stories without being governed by them', correct: true },
            { key: 'C', text: 'Replacing all negative relationships with positive ones', correct: false },
          ],
          reflection: 'What story does your mind tell about asking for support? How does that story serve you — or limit you?',
        },
      },
      {
        level:       2,
        title:       'Authentic Outreach',
        subtitle:    'Applied Practice + Journal Entry',
        framework:   'ABA: Differential Reinforcement of Prosocial Behavior; ACT: Willingness',
        duration:    '15 min',
        content: {
          practice: 'Identify one relationship you want to deepen or repair. Write a brief, authentic message to that person — not transactional, not obligatory. Share something you genuinely appreciate, have been thinking about, or want to acknowledge. Send it or schedule to send it today.',
          journalPrompts: [
            'What made this feel uncomfortable or risky?',
            'What value were you acting toward by reaching out?',
            'What would you want more of in your relational life, and what is one step toward that?',
          ],
        },
      },
      {
        level:       3,
        title:       'Support Circle Design',
        subtitle:    'Life Scenario Integration',
        framework:   'ACT: Values + Committed Action; ABA: Behavioral Networks',
        duration:    '20 min',
        content: {
          scenario: 'You are going through a demanding period — high workload, emotional strain, or a significant transition. You notice you have been isolating, telling yourself "I don\'t want to burden others" or "No one really understands." This story has been keeping you disconnected from your support network.',
          task:     'Map your relational support system:\n1. List 5 people in your life (name and role).\n2. For each, note what kind of support they offer (emotional, practical, intellectual, spiritual).\n3. Identify one person you have been avoiding reaching out to — and why.\n4. Write one values-aligned reason to reconnect with them.\n5. Draft the first sentence of a message you could send today.',
          reflection: 'What would a richly connected life look like for you? What is one committed action this week toward that vision?',
        },
      },
    ],
  },
  {
    dimension:   'Emotional-Adaptive',
    title:       'Emotional Flexibility Pathway',
    description: 'Cultivate emotional range, tolerance of distress, and values-aligned responses to emotional experience.',
    points:      { 1: 10, 2: 25, 3: 40 },
    levels: [
      {
        level:       1,
        title:       'Emotion Science Foundations',
        subtitle:    'Knowledge + Reflection',
        framework:   'ABA: Stimulus Discrimination (internal states)',
        duration:    '10 min',
        content: {
          knowledge: 'Emotional resilience is not about eliminating difficult emotions — it is about expanding your capacity to experience the full range of emotions without being controlled by them. In ABA, emotional responses are behavior: they can be shaped, extinguished, and reinforced. In ACT, emotions are neither problems to solve nor truths to obey — they are events to be noticed, named, and contextualized.',
          question:  'Affect labeling (naming emotions) has been shown in neuroscience research to:',
          options: [
            { key: 'A', text: 'Increase the intensity of negative emotions', correct: false },
            { key: 'B', text: 'Reduce amygdala reactivity and decrease emotional intensity', correct: true },
            { key: 'C', text: 'Have no measurable effect on emotional experience', correct: false },
          ],
          reflection: 'What emotions do you most often try to suppress or avoid? What function does that suppression serve — and what does it cost you?',
        },
      },
      {
        level:       2,
        title:       'Emotional Expansion Practice',
        subtitle:    'Applied Practice + Journal Entry',
        framework:   'ABA: Shaping emotional tolerance; ACT: Acceptance',
        duration:    '15 min',
        content: {
          practice: 'Sit quietly for 5 minutes. Bring to mind a recent situation that generated a difficult emotion. Instead of analyzing it, practice simply observing: Where do you feel it in your body? What is its texture, weight, temperature? Now name 5 emotion words that describe this experience with precision. Breathe into it rather than away from it.',
          journalPrompts: [
            'What did you notice when you observed the emotion rather than reacting to it?',
            'What narrative was attached to this emotion? Is that narrative helpful or workable?',
            'What would it look like to carry this emotion while still moving toward what matters?',
          ],
        },
      },
      {
        level:       3,
        title:       'Values-Guided Emotional Response',
        subtitle:    'Life Scenario Integration',
        framework:   'ACT: Acceptance + Committed Action; ABA: Functional Behavior Analysis',
        duration:    '20 min',
        content: {
          scenario: 'You receive critical feedback at work (or in a relationship) that triggers a strong emotional reaction — defensive anger, shame, or a sense of failure. Your habitual response is to either shut down, argue, or ruminate for days. This pattern costs you in relationships and forward movement.',
          task:     'Complete a functional emotion analysis:\n1. Identify the trigger (antecedent).\n2. Name the emotional response precisely (not just "upset" — use 3 specific words).\n3. Identify your typical behavioral response (what do you do?).\n4. Name the short-term function (what does this response get you?).\n5. Name the long-term cost.\n6. Design an alternative, values-aligned response for next time, including what you would need to feel/think to execute it.',
          reflection: 'What values would you be honoring by choosing a different response? What are you willing to feel in service of that?',
        },
      },
    ],
  },
  {
    dimension:   'Spiritual-Reflective',
    title:       'Meaning-Making Pathway',
    description: 'Develop a stable, articulated values base and the capacity to orient behavior from a place of grounded purpose.',
    points:      { 1: 10, 2: 25, 3: 40 },
    levels: [
      {
        level:       1,
        title:       'Values Identification',
        subtitle:    'Knowledge + Reflection',
        framework:   'ACT: Values Clarification',
        duration:    '10 min',
        content: {
          knowledge: 'Spiritual resilience, as operationalized in this framework, refers to the capacity to orient behavior from a stable values base — a sense of what matters, what gives life meaning, and what you want to stand for. This is distinct from religious affiliation; it is about psychological coherence and purpose-directed living. In ACT, values are chosen life directions — not goals to achieve, but compasses to orient by.',
          question:  'In ACT, the key distinction between goals and values is:',
          options: [
            { key: 'A', text: 'Goals are flexible; values are rigid', correct: false },
            { key: 'B', text: 'Values are ongoing directions; goals are achievable endpoints', correct: true },
            { key: 'C', text: 'Values are only relevant in spiritual or religious contexts', correct: false },
          ],
          reflection: 'Name 3 values that, if you were living them fully, would make your life feel deeply meaningful. For each, name one specific way your current behavior reflects — or fails to reflect — that value.',
        },
      },
      {
        level:       2,
        title:       'Values-in-Action',
        subtitle:    'Applied Practice + Journal Entry',
        framework:   'ACT: Values + Committed Action',
        duration:    '15 min',
        content: {
          practice: 'Choose one value from your reflection above. For 10 minutes, write about it: When did you first recognize this value in yourself? Who modeled it for you? What happens in your body when you are living this value? When you deviate from it? Write without editing — let the words carry what matters.',
          journalPrompts: [
            'What would living this value more fully require you to let go of?',
            'What committed action — however small — could you take today in service of this value?',
            'What would you want people who know you best to say about how you lived this value?',
          ],
        },
      },
      {
        level:       3,
        title:       'Meaning Architecture',
        subtitle:    'Life Scenario Integration',
        framework:   'ACT: Self-as-Context; ABA: Functional Behavior Chains',
        duration:    '20 min',
        content: {
          scenario: 'You are at a point of transition — a career shift, the end of a relationship, a loss, or simply a season of drift. The familiar structures that gave your life shape have changed. You notice a sense of purposelessness, or you are going through the motions without feeling connected to why.',
          task:     'Build a personal meaning architecture:\n1. Name 5 domains of your life (work, relationships, health, contribution, creativity, etc.).\n2. For each, identify your core value in that domain.\n3. Rate how closely your current behavior aligns with that value (1-10).\n4. For the lowest-scoring domain, design a 2-week committed action experiment.\n5. Write the story you want to tell about this season of your life — from the perspective of your future self looking back.',
          reflection: 'What is one thing you can do today that will make the story you are writing worth reading?',
        },
      },
    ],
  },
  {
    dimension:   'Somatic-Regulative',
    title:       'Body-Based Regulation Pathway',
    description: 'Build physiological flexibility and nervous system resilience through evidence-based somatic practices.',
    points:      { 1: 10, 2: 25, 3: 40 },
    levels: [
      {
        level:       1,
        title:       'Nervous System Literacy',
        subtitle:    'Knowledge + Reflection',
        framework:   'ABA: Stimulus Control (somatic cues)',
        duration:    '10 min',
        content: {
          knowledge: 'Somatic resilience refers to your nervous system\'s capacity to regulate its own activation — to move between states of arousal and recovery without getting stuck. The autonomic nervous system (ANS) governs this, and it is exquisitely sensitive to environmental cues. In ABA terms, somatic states function as both antecedents (triggering behavior) and consequences (reinforcing or punishing). In ACT, somatic acceptance means making room for physical sensations without fusing with them.',
          question:  'The physiological sigh (double inhale + extended exhale) is effective for nervous system regulation because:',
          options: [
            { key: 'A', text: 'It distracts the mind from stress', correct: false },
            { key: 'B', text: 'It rapidly re-inflates collapsed lung alveoli, lowering CO2 and activating the parasympathetic response', correct: true },
            { key: 'C', text: 'It increases heart rate to burn off adrenaline', correct: false },
          ],
          reflection: 'What physical sensations do you notice when under stress? When at ease? How well can you discriminate between your different nervous system states throughout the day?',
        },
      },
      {
        level:       2,
        title:       'Somatic Regulation Practice',
        subtitle:    'Applied Practice + Journal Entry',
        framework:   'ABA: Shaping; ACT: Present-Moment Awareness',
        duration:    '15 min',
        content: {
          practice: 'Complete a 10-minute body scan. Begin at the top of your head and slowly move your attention downward, noting any sensation without trying to change it. When you finish, identify: (1) where tension lives in your body right now, (2) what antecedent (event, thought, environment) might have contributed to it, (3) one micro-intervention you can apply (breath, movement, temperature, posture).',
          journalPrompts: [
            'What did you notice in your body that you had been ignoring?',
            'What environmental or behavioral cue could you adjust to support regulation before stress builds?',
            'What does your body need more of? Less of?',
          ],
        },
      },
      {
        level:       3,
        title:       'Somatic Cue Plan',
        subtitle:    'Life Scenario Integration',
        framework:   'ACT: Acceptance; ABA: Antecedent Modification',
        duration:    '20 min',
        content: {
          scenario: 'You have a recurring high-stress context — a demanding meeting, a difficult conversation, a performance situation — where your body hijacks your behavior. You notice a familiar physiological cascade: racing heart, shallow breathing, muscle tension, cognitive narrowing. This cascade often leads to reactive behavior you later regret.',
          task:     'Build a somatic intervention plan:\n1. Describe the trigger context in detail.\n2. Identify the somatic chain (what happens first, second, third in your body).\n3. Identify the earliest detectable signal — the first moment you could intervene.\n4. Design 2 pre-event regulation practices you can implement before the trigger.\n5. Design 1 in-the-moment regulation technique.\n6. Design 1 post-event recovery practice.\nWrite this as a behavioral protocol you can actually use.',
          reflection: 'What would consistent somatic regulation make possible in your life that is currently blocked by reactivity?',
        },
      },
    ],
  },
  {
    dimension:   'Cognitive-Narrative',
    title:       'Narrative Flexibility Pathway',
    description: 'Develop flexible, adaptive cognitive patterns and the capacity to hold self-narratives lightly.',
    points:      { 1: 10, 2: 25, 3: 40 },
    levels: [
      {
        level:       1,
        title:       'Cognitive Patterns',
        subtitle:    'Knowledge + Reflection',
        framework:   'ACT: Cognitive Defusion; ABA: Verbal Behavior',
        duration:    '10 min',
        content: {
          knowledge: 'Cognitive resilience is not about positive thinking — it is about cognitive flexibility: the ability to hold multiple perspectives, update beliefs in response to new evidence, and recognize when your own mental models are limiting your options. In ABA, verbal behavior (self-talk, rules, narratives) functions as a powerful antecedent for behavior. In ACT, cognitive defusion means noticing thoughts as mental events — not objective truths — so they lose their automatic control over behavior.',
          question:  'Cognitive fusion in ACT refers to:',
          options: [
            { key: 'A', text: 'Using logic to prove your thoughts are correct', correct: false },
            { key: 'B', text: 'Treating thoughts as if they are literal facts that must govern behavior', correct: true },
            { key: 'C', text: 'Combining two different cognitive frameworks', correct: false },
          ],
          reflection: 'What is the most persistent negative story your mind tells about yourself or your future? How much has your behavior been shaped by treating that story as fact?',
        },
      },
      {
        level:       2,
        title:       'Defusion Practice',
        subtitle:    'Applied Practice + Journal Entry',
        framework:   'ACT: Cognitive Defusion',
        duration:    '15 min',
        content: {
          practice: 'Identify one thought or belief that has been limiting you (e.g., "I\'m not the kind of person who succeeds at this," "Things never work out for me"). Write it down. Now practice these defusion techniques:\n1. Say it slowly, noticing it as a string of sounds.\n2. Prefix it with "I notice I\'m having the thought that..."\n3. Ask: "Is this a fact, or a story? What evidence challenges this narrative?"\nFinally, write an alternative narrative — not necessarily positive, just more accurate and workable.',
          journalPrompts: [
            'What has believing this narrative cost you?',
            'What would become available if you held this narrative more lightly?',
            'What evidence from your life challenges this narrative?',
          ],
        },
      },
      {
        level:       3,
        title:       'Narrative Reconstruction',
        subtitle:    'Life Scenario Integration',
        framework:   'ACT: Self-as-Context; ABA: Functional Verbal Behavior Analysis',
        duration:    '20 min',
        content: {
          scenario: 'You notice a recurring pattern in your life: you start things with enthusiasm, then a familiar narrative shows up ("I always lose momentum," "I\'m not disciplined enough") and you disengage before completing them. This story has become a self-fulfilling prophecy — each incomplete project confirms the narrative.',
          task:     'Conduct a narrative reconstruction:\n1. Trace the history of this narrative — when did it begin? Who contributed to it?\n2. Identify 3 times you did NOT follow this pattern — when you completed something meaningful.\n3. What conditions were different in those cases?\n4. Rewrite the narrative using evidence: "I am someone who ___," based on actual behavioral evidence.\n5. Design a 2-week behavioral experiment that will generate new evidence for the updated narrative.',
          reflection: 'What story do you want to be able to tell about yourself 12 months from now? What behavioral evidence would support that story?',
        },
      },
    ],
  },
];

// ── Navigator Choice Scenarios ───────────────────────────────────────────────
// Daily ACT-aligned branching scenarios with 3 choices each.

export const CHOICE_SCENARIOS = [
  {
    id:          'cs-setback-01',
    title:       'Navigating a Setback',
    context:     'You have been working toward an important goal for several weeks. Today, a significant obstacle appeared — progress has stalled, and you notice the familiar pull toward disengagement.',
    question:    'How do you choose to respond?',
    choices: [
      {
        key:          'A',
        text:         'Take direct, values-aligned action — identify the smallest step forward and do it now.',
        actPrinciple: 'Committed Action',
        abaPrinciple: 'Behavioral Activation',
        feedback:     'Direct action in the face of obstacles is the behavioral embodiment of committed action. By choosing movement over avoidance, you are building the reinforcement history that makes persistence more likely in the future. Notice: the action does not have to be large. The contact with forward movement is what matters.',
      },
      {
        key:          'B',
        text:         'Pause to reflect — sit with what this setback means to you and reconnect with your underlying values.',
        actPrinciple: 'Values Clarification',
        abaPrinciple: 'Self-Monitoring',
        feedback:     'Reflective pause is a form of self-directed regulation. Before taking action, reconnecting with your values helps ensure your response is purposeful rather than reactive. This is particularly important when obstacles trigger discouragement — values reconnection restores direction.',
      },
      {
        key:          'C',
        text:         'Reach out for support — connect with someone whose perspective or presence would be helpful.',
        actPrinciple: 'Relational Flexibility',
        abaPrinciple: 'Social Reinforcement',
        feedback:     'Seeking support is a high-functioning coping behavior, not a sign of inadequacy. Mobilizing social resources is evidence-based for resilience. By reaching out, you are both accessing practical help and reinforcing the relational network that sustains you over time.',
      },
    ],
  },
  {
    id:          'cs-avoidance-01',
    title:       'Noticing Avoidance',
    context:     'You have been postponing a difficult conversation, task, or decision for days. Each time it comes to mind, you feel a pull to distract, defer, or rationalize the delay.',
    question:    'What is the most values-aligned response to this pattern?',
    choices: [
      {
        key:          'A',
        text:         'Acknowledge the avoidance without judgment and take one small step toward the avoided thing — right now.',
        actPrinciple: 'Willingness + Committed Action',
        abaPrinciple: 'Graduated Exposure',
        feedback:     'Acknowledging avoidance without self-criticism is an act of psychological flexibility. Taking one step — however small — interrupts the avoidance cycle and begins building a new reinforcement history. Willingness is not the absence of discomfort; it is choosing action in its presence.',
      },
      {
        key:          'B',
        text:         'Investigate what function the avoidance is serving — what are you protecting yourself from?',
        actPrinciple: 'Acceptance + Defusion',
        abaPrinciple: 'Functional Behavior Assessment',
        feedback:     'Understanding the function of avoidance is the first step toward changing it. Avoidance is always serving a purpose — protection from discomfort, uncertainty, or failure. Naming the function (rather than judging the behavior) creates more choice about whether to continue the pattern.',
      },
      {
        key:          'C',
        text:         'Restructure the context — change the time, environment, or approach to reduce the barriers to engagement.',
        actPrinciple: 'Committed Action',
        abaPrinciple: 'Antecedent Modification',
        feedback:     'Modifying antecedents (the conditions before behavior) is a powerful strategy for changing difficult patterns. If the current context is reliably producing avoidance, changing the context changes what behavior is most likely. This is not avoidance of the task — it is strategic problem-solving in service of your values.',
      },
    ],
  },
  {
    id:          'cs-values-conflict-01',
    title:       'Values in Tension',
    context:     'You are facing a situation where two of your core values appear to be in conflict — for example, honesty versus kindness, or individual growth versus relational commitment.',
    question:    'How do you navigate when your values seem to pull in different directions?',
    choices: [
      {
        key:          'A',
        text:         'Clarify the long-term direction — which value, if honored, will you feel prouder of in 5 years?',
        actPrinciple: 'Values Clarification',
        abaPrinciple: 'Delayed Reinforcement',
        feedback:     'Values conflicts are rarely truly irresolvable — often one value takes precedence in a specific context when viewed from a longer time horizon. Asking which choice you will stand behind in the future helps disentangle short-term discomfort from long-term integrity.',
      },
      {
        key:          'B',
        text:         'Explore whether a third option exists that honors both values — creativity as conflict resolution.',
        actPrinciple: 'Psychological Flexibility',
        abaPrinciple: 'Behavioral Repertoire Expansion',
        feedback:     'Values conflicts often feel like binary choices because we are operating with a limited behavioral repertoire. A committed inquiry into third options — approaches that honor both values, or find a different framing — often reveals pathways that weren\'t initially visible. This is psychological flexibility in action.',
      },
      {
        key:          'C',
        text:         'Accept that imperfect choices are part of a values-driven life — choose, act, and adjust as needed.',
        actPrinciple: 'Acceptance + Committed Action',
        abaPrinciple: 'Response Flexibility',
        feedback:     'Perfect alignment of all values in all situations is not the standard. The ACT standard is willingness: taking committed action from a values base, accepting that any meaningful choice involves trade-offs. Choosing imperfectly and adjusting — rather than being paralyzed by the search for a perfect answer — is itself a values-aligned response.',
      },
    ],
  },
  {
    id:          'cs-self-compassion-01',
    title:       'After a Difficult Moment',
    context:     'You responded to a situation in a way that was inconsistent with your values — perhaps reactively, dismissively, or with less care than you intended. You are now experiencing self-critical thoughts.',
    question:    'What response to yourself best serves your growth?',
    choices: [
      {
        key:          'A',
        text:         'Apply the same compassion you would offer a close friend — acknowledge it, learn from it, and move forward.',
        actPrinciple: 'Self-Compassion + Values Clarification',
        abaPrinciple: 'Differential Reinforcement',
        feedback:     'Self-compassion is not permissiveness — it is the psychological foundation for sustained growth. Research consistently shows that self-criticism reduces motivation and increases avoidance. Self-compassion, by contrast, supports honest self-reflection and committed action because it removes the threat of self-punishment from the learning process.',
      },
      {
        key:          'B',
        text:         'Make a concrete repair — identify what you can do to address the impact of your behavior.',
        actPrinciple: 'Committed Action',
        abaPrinciple: 'Behavior Correction',
        feedback:     'Concrete repair is a high-integrity response: it acknowledges impact, demonstrates values-alignment, and creates a new behavioral record. The willingness to repair is itself evidence of your values. Repair does not require excessive self-flagellation — it requires honest acknowledgment and action.',
      },
      {
        key:          'C',
        text:         'Notice the self-critical narrative without fusing with it — observe it as a thought, not a verdict.',
        actPrinciple: 'Cognitive Defusion',
        abaPrinciple: 'Verbal Behavior Modification',
        feedback:     'Self-critical thoughts are verbal behavior — they are governed by reinforcement histories, not objective truths. Defusing from self-criticism means observing it as a mental event: "I notice I\'m having the thought that I am a failure." This creates space to choose a more workable response. The thought does not have to govern behavior.',
      },
    ],
  },
  {
    id:          'cs-momentum-01',
    title:       'After a Streak Break',
    context:     'You have returned to practice after a gap of several days. Your mind is generating familiar narratives: "I always do this," "I\'ve already failed," "What\'s the point of starting again?"',
    question:    'How do you re-engage with your practice?',
    choices: [
      {
        key:          'A',
        text:         'Return without self-judgment — every return is a recommitment, not a failure.',
        actPrinciple: 'Acceptance + Committed Action',
        abaPrinciple: 'Reinstatement',
        feedback:     'Resuming practice after a gap is not a sign of weakness — it is the actual skill of resilience in action. The ability to return, non-judgmentally, is more valuable than an unbroken streak. Each return reinforces the identity of someone who practices values-alignment, regardless of perfect consistency.',
      },
      {
        key:          'B',
        text:         'Investigate what led to the gap — not to assign blame, but to adjust the conditions for next time.',
        actPrinciple: 'Committed Action',
        abaPrinciple: 'Antecedent Analysis',
        feedback:     'Understanding the conditions that led to disengagement provides actionable information for the future. This is not self-criticism — it is functional analysis: what antecedents reliably predict a break in practice? What antecedents predict engagement? Use this information to engineer better conditions.',
      },
      {
        key:          'C',
        text:         'Start with the smallest possible action — lower the threshold to reentry.',
        actPrinciple: 'Willingness',
        abaPrinciple: 'Shaping (graduated reintroduction)',
        feedback:     'When momentum has stalled, the barrier to re-engagement is often psychological, not logistical. Lowering the threshold — "just 3 minutes," "just one reflection" — uses behavioral shaping principles to rebuild the practice incrementally. One small step creates the conditions for the next.',
      },
    ],
  },
];

// ── Reinforcement Menu ───────────────────────────────────────────────────────
// 3-5 evidence-based micro-practices per dimension for the Navigator tier.

export const REINFORCEMENT_MENU = {
  'Agentic-Generative': [
    {
      id:          'rm-ag-01',
      title:       '2-Minute Intention Setting',
      duration:    '2 min',
      type:        'behavioral-activation',
      description: 'Before beginning a task, write one sentence: "I am doing this because it serves my value of ___." This links behavior to values, increasing intrinsic motivation.',
      abaPrinciple:'Rule-Governed Behavior',
      actPrinciple:'Committed Action',
    },
    {
      id:          'rm-ag-02',
      title:       'Obstacle-Behavior Analysis',
      duration:    '5 min',
      type:        'functional-analysis',
      description: 'Identify the main obstacle to a current goal. Describe it precisely (not vaguely). Then generate 3 specific behavioral responses. Choose one and schedule it.',
      abaPrinciple:'Antecedent-Behavior-Consequence Analysis',
      actPrinciple:'Values Clarification',
    },
    {
      id:          'rm-ag-03',
      title:       'Micro-Step Activation',
      duration:    '5 min',
      type:        'behavioral-activation',
      description: 'Choose one deferred task. Break it into steps so small that each takes under 2 minutes. Do the first step now. Notice what happens to motivation after completion.',
      abaPrinciple:'Shaping + Behavioral Momentum',
      actPrinciple:'Committed Action',
    },
    {
      id:          'rm-ag-04',
      title:       'Reinforcement Review',
      duration:    '5 min',
      type:        'self-monitoring',
      description: 'Review this week\'s actions. For each meaningful thing you completed, acknowledge it explicitly: write "I did ___." This is not self-congratulation — it is reinforcement of behavior that deserves to persist.',
      abaPrinciple:'Positive Reinforcement',
      actPrinciple:'Self-as-Context',
    },
    {
      id:          'rm-ag-05',
      title:       'Barrier Buster Protocol',
      duration:    '10 min',
      type:        'problem-solving',
      description: 'Name your most persistent barrier to a values-aligned goal. Generate 5 possible responses (don\'t filter). Circle the most workable one. Plan when and how you will implement it this week.',
      abaPrinciple:'Response Generation + Selection',
      actPrinciple:'Psychological Flexibility',
    },
  ],
  'Relational-Connective': [
    {
      id:          'rm-rc-01',
      title:       'Active Listening Practice',
      duration:    '5 min',
      type:        'relational',
      description: 'In your next conversation, practice full presence: no problem-solving, no advice unless asked, no interrupting. Simply listen and reflect back what you heard. Note what this practice requires of you.',
      abaPrinciple:'Differential Reinforcement of Listening Behavior',
      actPrinciple:'Present-Moment Awareness',
    },
    {
      id:          'rm-rc-02',
      title:       'Gratitude Communication',
      duration:    '3 min',
      type:        'relational',
      description: 'Write and send (or plan to send) a specific message of gratitude to one person. Be specific — not "thanks for everything," but "I noticed when you ___ and it mattered to me because ___."',
      abaPrinciple:'Social Reinforcement',
      actPrinciple:'Values-Based Action',
    },
    {
      id:          'rm-rc-03',
      title:       'Repair Initiation',
      duration:    '10 min',
      type:        'relational',
      description: 'Identify one relationship with unresolved tension. Write what you want to say — without defensiveness, blame, or justification — that acknowledges your part and expresses your values. You don\'t have to send it today; the writing is the first step.',
      abaPrinciple:'Behavior Correction + Prosocial Shaping',
      actPrinciple:'Committed Action',
    },
    {
      id:          'rm-rc-04',
      title:       'Support Mobilization',
      duration:    '5 min',
      type:        'relational',
      description: 'Name one thing you are currently carrying alone. Identify one person who could offer relevant support. Write the first sentence of a message asking for it. Asking for help is a skill — and it builds the relational network that sustains you.',
      abaPrinciple:'Social Reinforcement History',
      actPrinciple:'Willingness',
    },
  ],
  'Emotional-Adaptive': [
    {
      id:          'rm-ea-01',
      title:       'Precision Affect Labeling',
      duration:    '3 min',
      type:        'emotion-regulation',
      description: 'Right now, identify 5 distinct emotion words that describe your current emotional state. Go beyond "stressed" or "fine." The more precise your labeling, the more regulatory benefit you receive.',
      abaPrinciple:'Stimulus Discrimination (internal)',
      actPrinciple:'Present-Moment Awareness',
    },
    {
      id:          'rm-ea-02',
      title:       'Emotional Acceptance Window',
      duration:    '5 min',
      type:        'acceptance',
      description: 'Choose one emotion you have been resisting. Spend 5 minutes simply being with it — locate it in your body, describe its texture and weight, breathe into it rather than away from it. You are not trying to feel better; you are practicing capacity.',
      abaPrinciple:'Extinction of Experiential Avoidance',
      actPrinciple:'Acceptance',
    },
    {
      id:          'rm-ea-03',
      title:       'Narrative Separation',
      duration:    '5 min',
      type:        'defusion',
      description: 'Identify the story attached to a difficult emotion. Write it out. Then write: "I am having the thought/feeling that ___." Notice the shift from fusion to observation. What changes when you see the emotion as an event rather than a verdict?',
      abaPrinciple:'Verbal Behavior Modification',
      actPrinciple:'Cognitive Defusion',
    },
    {
      id:          'rm-ea-04',
      title:       'Emotional Action Audit',
      duration:    '5 min',
      type:        'functional-analysis',
      description: 'Choose one emotional response from this week that you are not proud of. Describe the trigger, the feeling, the behavior, and the outcome. Then design an alternative response for the next similar situation — one that would be consistent with your values.',
      abaPrinciple:'Functional Behavior Analysis',
      actPrinciple:'Values Clarification + Committed Action',
    },
  ],
  'Spiritual-Reflective': [
    {
      id:          'rm-sr-01',
      title:       'Daily Values Compass',
      duration:    '3 min',
      type:        'values-check-in',
      description: 'Begin or end the day with one question: "What value did I live toward today?" Or, if it was difficult: "What value do I want to live toward tomorrow?" No judgment — just orientation.',
      abaPrinciple:'Self-Monitoring',
      actPrinciple:'Values Clarification',
    },
    {
      id:          'rm-sr-02',
      title:       'Meaning Inventory',
      duration:    '10 min',
      type:        'reflective-writing',
      description: 'List 5 things you did this week. For each, write one sentence about why it mattered — or why it didn\'t. Notice which activities felt most and least connected to your values. What does this tell you about how to invest your time?',
      abaPrinciple:'Behavioral Analysis',
      actPrinciple:'Values Clarification',
    },
    {
      id:          'rm-sr-03',
      title:       'Mortality Reflection (5-year lens)',
      duration:    '10 min',
      type:        'reflective-writing',
      description: 'Imagine yourself 5 years from now, looking back on this period. What decisions and actions would Future You be proud of? Which would you regret? Let this perspective guide one decision today.',
      abaPrinciple:'Delayed Reinforcement Awareness',
      actPrinciple:'Values + Committed Action',
    },
    {
      id:          'rm-sr-04',
      title:       'Gratitude with Depth',
      duration:    '5 min',
      type:        'reflective-practice',
      description: 'Write 3 things you are grateful for — but for each, write WHY. Not "my health" but "my health, because it allows me to ___." The why connects gratitude to values and deepens its impact.',
      abaPrinciple:'Positive Reinforcement Awareness',
      actPrinciple:'Present-Moment Awareness',
    },
  ],
  'Somatic-Regulative': [
    {
      id:          'rm-so-01',
      title:       'Physiological Sigh',
      duration:    '1 min',
      type:        'somatic',
      description: 'Double inhale through the nose (fill the lungs fully, then add a brief second inhale), followed by a long, slow exhale through the mouth. Repeat 3 times. This rapidly activates the parasympathetic nervous system. Use it before high-stakes moments.',
      abaPrinciple:'Stimulus Control',
      actPrinciple:'Present-Moment Awareness',
    },
    {
      id:          'rm-so-02',
      title:       'Grounding Practice (5-4-3-2-1)',
      duration:    '3 min',
      type:        'somatic',
      description: 'Name 5 things you can see, 4 you can physically touch, 3 you can hear, 2 you can smell, 1 you can taste. This interrupts the stress cascade by anchoring attention to present sensory experience.',
      abaPrinciple:'Antecedent Control (attentional)',
      actPrinciple:'Present-Moment Awareness',
    },
    {
      id:          'rm-so-03',
      title:       'Body Scan Check-In',
      duration:    '5 min',
      type:        'somatic',
      description: 'Scan your body from head to toe. Note where you are holding tension, where there is ease. Breathe into one area of tension for 3 breaths. You are not trying to eliminate the tension — you are bringing awareness to it, which is itself regulatory.',
      abaPrinciple:'Self-Monitoring',
      actPrinciple:'Acceptance',
    },
    {
      id:          'rm-so-04',
      title:       'Movement Reset',
      duration:    '3 min',
      type:        'somatic',
      description: 'Stand up. Take 3 slow, full breaths. Roll your shoulders, move your neck, stretch what feels tight. Walk slowly for 60 seconds with attention on your feet contacting the floor. Return to your task. Movement is data — your body is communicating. Listen.',
      abaPrinciple:'Behavioral Activation (somatic)',
      actPrinciple:'Present-Moment Awareness',
    },
    {
      id:          'rm-so-05',
      title:       'Sleep Regulation Audit',
      duration:    '5 min',
      type:        'behavioral-health',
      description: 'Review last night\'s sleep: quality, duration, what preceded it. Identify one behavioral antecedent (a choice, habit, or exposure) that helped or harmed your sleep. Make one small adjustment tonight. Consistent sleep is one of the highest-leverage regulatory interventions available.',
      abaPrinciple:'Antecedent Modification',
      actPrinciple:'Committed Action',
    },
  ],
  'Cognitive-Narrative': [
    {
      id:          'rm-cn-01',
      title:       'Thought Record',
      duration:    '5 min',
      type:        'cognitive',
      description: 'Identify one automatic negative thought from today. Write: the trigger, the thought, the emotion it created, the behavior it prompted. Then ask: Is this thought helpful? Is it workable? What is an alternative, evidence-based perspective?',
      abaPrinciple:'Verbal Behavior Analysis',
      actPrinciple:'Cognitive Defusion',
    },
    {
      id:          'rm-cn-02',
      title:       'Evidence Inventory',
      duration:    '5 min',
      type:        'cognitive',
      description: 'Choose a limiting belief about yourself. List 5 pieces of evidence from your life that challenge it. Be specific — name actual events, behaviors, achievements. You are building an evidence-based counter-narrative.',
      abaPrinciple:'Rule Modification (self-rules)',
      actPrinciple:'Cognitive Defusion + Self-as-Context',
    },
    {
      id:          'rm-cn-03',
      title:       'Perspective Expansion',
      duration:    '5 min',
      type:        'cognitive',
      description: 'Describe a current challenge from 3 perspectives: yours, someone who sees you at your best, and a neutral observer. Notice what each perspective reveals that the others don\'t. Psychological flexibility is the capacity to hold multiple perspectives.',
      abaPrinciple:'Stimulus Equivalence / Relational Framing',
      actPrinciple:'Self-as-Context + Cognitive Defusion',
    },
    {
      id:          'rm-cn-04',
      title:       'Adaptive Learning Review',
      duration:    '5 min',
      type:        'cognitive',
      description: 'Review one thing that did not go as planned this week. Instead of labeling it a failure, ask: What did I learn? What would I do differently? What does this teach me about the conditions I need to succeed? Mistakes are behavioral data — mine them.',
      abaPrinciple:'Behavioral Learning',
      actPrinciple:'Values + Committed Action',
    },
  ],
};

// ── Adult Badges ─────────────────────────────────────────────────────────────

export const ADULT_BADGES = [
  // Starter Tier Badges
  {
    id:          'first-step-navigator',
    label:       'First Step Navigator',
    description: 'Completed your first micro-commitment practice.',
    rarity:      'common',
    tier:        'starter',
    icon:        '/icons/compass.svg',
    color:       '#6b7280',
  },
  {
    id:          'dimension-seeker',
    label:       'Dimension Seeker',
    description: 'Completed a practice in all 6 resilience dimensions.',
    rarity:      'rare',
    tier:        'starter',
    icon:        '/icons/star.svg',
    color:       '#7c3aed',
  },
  {
    id:          'barrier-buster',
    label:       'Barrier Buster',
    description: 'Completed 3 micro-commitment practices.',
    rarity:      'uncommon',
    tier:        'starter',
    icon:        '/icons/game-shield.svg',
    color:       '#0369a1',
  },
  {
    id:          'momentum-tracker',
    label:       'Momentum Tracker',
    description: 'Maintained a 7-day flexible engagement streak.',
    rarity:      'uncommon',
    tier:        'starter',
    icon:        '/icons/streaks.svg',
    color:       '#15803d',
  },
  // Navigator Tier Badges
  {
    id:          'pathway-pioneer',
    label:       'Pathway Pioneer',
    description: 'Completed your first Navigator skill pathway level.',
    rarity:      'common',
    tier:        'navigator',
    icon:        '/icons/game-map.svg',
    color:       '#4f46e5',
  },
  {
    id:          'choice-architect',
    label:       'Choice Architect',
    description: 'Completed 5 ACT-aligned choice scenarios.',
    rarity:      'uncommon',
    tier:        'navigator',
    icon:        '/icons/game-scroll.svg',
    color:       '#7c3aed',
  },
  {
    id:          'committed-navigator',
    label:       'Committed Navigator',
    description: 'Completed a full skill pathway (all 3 levels) for one dimension.',
    rarity:      'rare',
    tier:        'navigator',
    icon:        '/icons/game-mountain.svg',
    color:       '#0284c7',
  },
  {
    id:          'compass-sage',
    label:       'Compass Sage',
    description: 'Completed all 6 dimension pathways — all 3 levels each.',
    rarity:      'legendary',
    tier:        'navigator',
    icon:        '/icons/kids-trophy.svg',
    color:       '#854d0e',
  },
];

// ── Return-to-Practice Reentry Pathways ───────────────────────────────────────
// Offered when streak breaks (>3 days without check-in). Navigator tier only.

export const REENTRY_PATHWAYS = [
  {
    id:      'reentry-01',
    title:   'Reorientation Practice',
    step:    1,
    duration:'3 min',
    message: 'Welcome back. There is no judgment here — returning is itself an act of committed action. Begin by simply noticing where you are right now: take 3 slow breaths and name one value you want to move toward today.',
    prompt:  'Complete this sentence: "I am returning to practice because ___." Let your answer be honest, not aspirational.',
  },
  {
    id:      'reentry-02',
    title:   'Gap Analysis (Non-Judgmental)',
    step:    2,
    duration:'5 min',
    message: 'Understanding what led to the gap provides information — not evidence of failure. This is a functional analysis: what conditions were present that made practice less likely?',
    prompt:  'What was happening in your life during the gap? Not to assign blame, but to understand: what conditions make practice sustainable for you? What conditions make it harder?',
  },
  {
    id:      'reentry-03',
    title:   'One Committed Action',
    step:    3,
    duration:'5 min',
    message: 'The return does not need to be large to be real. One small, values-aligned action is enough to reestablish momentum.',
    prompt:  'Name one micro-commitment you will make in the next 24 hours — specific, achievable, values-aligned. Write it as a commitment: "I will ___ at/by ___ because it serves my value of ___."',
  },
];
