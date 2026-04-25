/**
 * iarf-skill-trees.js
 *
 * IARF (Integrated ABA Resilience Framework) skill tree definitions.
 * Each dimension has three levels:
 *   - Foundation (Beginner):    Basic skills and initial competencies
 *   - Building (Intermediate):  Integrated practices and sustained engagement
 *   - Mastery (Advanced):       Advanced applications and mentorship capabilities
 *
 * Skills drawn from the IARF curriculum skills inventories.
 */

// ── Dimension color and icon map (mirrors DIMENSION_COLORS in adultGames.js) ──

export const IARF_DIMENSION_META = {
  'Agentic-Generative': {
    icon:     '/icons/agentic-generative.svg',
    accent:   '#8b5cf6',
    gradient: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
    shortName:'Agentic',
    emoji:    '🎯',
  },
  'Relational-Connective': {
    icon:     '/icons/relational-connective.svg',
    accent:   '#14b8a6',
    gradient: 'linear-gradient(135deg,#14b8a6,#22c55e)',
    shortName:'Relational',
    emoji:    '💬',
  },
  'Somatic-Regulative': {
    icon:     '/icons/somatic-regulative.svg',
    accent:   '#06b6d4',
    gradient: 'linear-gradient(135deg,#06b6d4,#14b8a6)',
    shortName:'Somatic',
    emoji:    '🧘',
  },
  'Cognitive-Narrative': {
    icon:     '/icons/cognitive-narrative.svg',
    accent:   '#4f46e5',
    gradient: 'linear-gradient(135deg,#4f46e5,#3b82f6)',
    shortName:'Cognitive',
    emoji:    '🔄',
  },
  'Emotional-Adaptive': {
    icon:     '/icons/emotional-adaptive.svg',
    accent:   '#ec4899',
    gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
    shortName:'Emotional',
    emoji:    '💙',
  },
  'Spiritual-Reflective': {
    icon:     '/icons/spiritual-reflective.svg',
    accent:   '#f59e0b',
    gradient: 'linear-gradient(135deg,#f59e0b,#f97316)',
    shortName:'Spiritual',
    emoji:    '✨',
  },
};

/**
 * Skill tree level metadata.
 */
export const SKILL_LEVELS = [
  {
    level: 1,
    name:  'Foundation',
    label: 'Foundation — Beginner',
    description: 'Core skills and initial competencies. The essential building blocks for this dimension.',
    icon:  '🌱',
    xpReward: 50,
    badgeSuffix: 'Foundational',
  },
  {
    level: 2,
    name:  'Building',
    label: 'Building — Intermediate',
    description: 'Integrated practices and sustained engagement. Applied competency in real-world contexts.',
    icon:  '⚡',
    xpReward: 100,
    badgeSuffix: 'Builder',
  },
  {
    level: 3,
    name:  'Mastery',
    label: 'Mastery — Advanced',
    description: 'Advanced applications and mentorship capability. Expert-level integration and teaching.',
    icon:  '🏆',
    xpReward: 200,
    badgeSuffix: 'Master',
  },
];

/**
 * Full IARF skill tree definitions for all 6 dimensions.
 * Each skill has: id, name, description, abaPrinciple, actPrinciple, observable indicators.
 */
export const IARF_SKILL_TREES = [
  {
    dimension: 'Agentic-Generative',
    title:     'Agency Skill Tree',
    description: 'Build your capacity for purposeful, values-aligned action — from basic goal-setting through to mentoring others.',
    levels: [
      {
        level: 1,
        name:  'Foundation',
        skills: [
          {
            id:          'ag-f-01',
            name:        'Values Identification',
            description: 'Identify and articulate core personal values across key life domains.',
            abaPrinciple:'Rule-Governed Behavior (self-authored)',
            actPrinciple:'Values Clarification',
            indicator:   'Can name at least 3 personal values and describe how behavior does or does not align.',
          },
          {
            id:          'ag-f-02',
            name:        'Basic Goal Setting',
            description: 'Translate values or desires into concrete, achievable behavioral goals.',
            abaPrinciple:'Behavioral Activation',
            actPrinciple:'Committed Action',
            indicator:   'Can state a goal in specific, observable terms and identify at least one first step.',
          },
          {
            id:          'ag-f-03',
            name:        'Action Initiation',
            description: 'Begin a task or behavior without excessive delay or external prompting.',
            abaPrinciple:'Shaping (successive approximations)',
            actPrinciple:'Committed Action',
            indicator:   'Demonstrates spontaneous initiation of tasks within reasonable latency.',
          },
          {
            id:          'ag-f-04',
            name:        'Help Seeking',
            description: 'Identify when support is needed and request it appropriately.',
            abaPrinciple:'Differential Reinforcement of Prosocial Behavior',
            actPrinciple:'Relational Flexibility',
            indicator:   'Asks for help from appropriate sources; initiates before crisis.',
          },
          {
            id:          'ag-f-05',
            name:        'Behavioral Activation',
            description: 'Engage in meaningful activities even with low motivation or negative affect.',
            abaPrinciple:'Behavioral Activation',
            actPrinciple:'Willingness',
            indicator:   'Participates in scheduled activities regardless of mood state.',
          },
        ],
      },
      {
        level: 2,
        name:  'Building',
        skills: [
          {
            id:          'ag-b-01',
            name:        'Multi-Step Goal Planning',
            description: 'Construct sequential plans with multiple interdependent steps toward a meaningful goal.',
            abaPrinciple:'Behavior Chains',
            actPrinciple:'Committed Action',
            indicator:   'Creates a written goal plan with at least 3 steps and revises it when circumstances change.',
          },
          {
            id:          'ag-b-02',
            name:        'Flexible Problem Solving',
            description: 'Generate multiple potential solutions and select among them adaptively.',
            abaPrinciple:'Behavioral Repertoire Expansion',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Generates at least 3 candidate solutions; does not rigidly persist with a failed strategy.',
          },
          {
            id:          'ag-b-03',
            name:        'Self-Monitoring',
            description: 'Systematically observe and record own behavior, progress, and outcomes.',
            abaPrinciple:'Self-Recording',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Keeps behavioral records or journals; identifies patterns over time.',
          },
          {
            id:          'ag-b-04',
            name:        'Persistence Through Obstacles',
            description: 'Maintain goal-directed behavior in the face of setbacks and frustration.',
            abaPrinciple:'Extinction Resistance',
            actPrinciple:'Committed Action',
            indicator:   'Returns to goal pursuit after setback; shows reduced time-to-recovery.',
          },
          {
            id:          'ag-b-05',
            name:        'Values-Action Alignment',
            description: 'Actively monitor and adjust behavior to ensure consistency with stated values.',
            abaPrinciple:'Correspondence Training',
            actPrinciple:'Values Clarification + Committed Action',
            indicator:   'Identifies discrepancies between values and behavior; takes corrective action.',
          },
        ],
      },
      {
        level: 3,
        name:  'Mastery',
        skills: [
          {
            id:          'ag-m-01',
            name:        'Long-Range Vision Planning',
            description: 'Identify and pursue goals with 1-5 year horizons, maintaining direction over time.',
            abaPrinciple:'Delayed Reinforcement',
            actPrinciple:'Values-based Committed Action',
            indicator:   'Can articulate a vision 3-5 years forward; maintains behavioral momentum.',
          },
          {
            id:          'ag-m-02',
            name:        'Self-Directed Behavior Change',
            description: 'Independently identify target behaviors, implement change strategies, and evaluate outcomes.',
            abaPrinciple:'Self-Management',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Designs own behavior change plans; evaluates effectiveness and revises independently.',
          },
          {
            id:          'ag-m-03',
            name:        'Mentorship and Leadership',
            description: 'Guide, support, and inspire others in agentic skill development.',
            abaPrinciple:'Modeling + Differential Reinforcement',
            actPrinciple:'Values-based Action',
            indicator:   'Models values-aligned behavior; actively contributes to community resilience.',
          },
          {
            id:          'ag-m-04',
            name:        'Resilient Agency',
            description: 'Sustained agentic functioning over extended periods under ongoing adversity.',
            abaPrinciple:'Generalization and Maintenance',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Demonstrates consistent values-aligned action over 6+ months under stress.',
          },
        ],
      },
    ],
  },

  {
    dimension: 'Relational-Connective',
    title:     'Connection Skill Tree',
    description: 'Develop authentic, values-grounded relational skills — from basic social awareness to facilitating relational resilience in others.',
    levels: [
      {
        level: 1,
        name:  'Foundation',
        skills: [
          {
            id:          'rc-f-01',
            name:        'Social Awareness',
            description: 'Notice and accurately read social cues and relational dynamics.',
            abaPrinciple:'Stimulus Discrimination (social)',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Identifies emotional states in others; distinguishes safe vs. unsafe relational contexts.',
          },
          {
            id:          'rc-f-02',
            name:        'Authentic Expression',
            description: 'Share genuine thoughts, feelings, and experiences with others.',
            abaPrinciple:'Differential Reinforcement of Verbal Behavior',
            actPrinciple:'Values Clarification',
            indicator:   'Expresses personal experience without excessive filtering or performance.',
          },
          {
            id:          'rc-f-03',
            name:        'Active Listening',
            description: 'Fully attend to another person without planning a response while they speak.',
            abaPrinciple:'Attending Behavior',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Maintains eye contact; paraphrases accurately; asks relevant follow-up questions.',
          },
          {
            id:          'rc-f-04',
            name:        'Help Receiving',
            description: 'Accept support from others without excessive deflection or self-sufficiency defenses.',
            abaPrinciple:'Differential Reinforcement',
            actPrinciple:'Acceptance',
            indicator:   'Accepts practical and emotional support; expresses gratitude appropriately.',
          },
          {
            id:          'rc-f-05',
            name:        'Conflict Tolerance',
            description: 'Remain present and functional during interpersonal disagreement or tension.',
            abaPrinciple:'Stimulus Control (relational)',
            actPrinciple:'Acceptance + Defusion',
            indicator:   'Does not withdraw or escalate under mild relational conflict.',
          },
        ],
      },
      {
        level: 2,
        name:  'Building',
        skills: [
          {
            id:          'rc-b-01',
            name:        'Support Network Mapping',
            description: 'Identify and intentionally cultivate a diverse social support system.',
            abaPrinciple:'Behavioral Networks',
            actPrinciple:'Values Clarification',
            indicator:   'Can name 5+ people across different support types; identifies gaps.',
          },
          {
            id:          'rc-b-02',
            name:        'Empathic Responsiveness',
            description: 'Respond to others\' emotional experiences with accuracy and appropriate validation.',
            abaPrinciple:'Social Reinforcement',
            actPrinciple:'Relational Flexibility',
            indicator:   'Validates without minimizing; distinguishes empathy from advice-giving.',
          },
          {
            id:          'rc-b-03',
            name:        'Relational Repair',
            description: 'Take responsibility for relational ruptures and initiate repair.',
            abaPrinciple:'Behavior Correction',
            actPrinciple:'Committed Action',
            indicator:   'Acknowledges impact without excessive defensiveness; follows through on repair actions.',
          },
          {
            id:          'rc-b-04',
            name:        'Boundary Setting',
            description: 'Identify and communicate personal boundaries with clarity and self-respect.',
            abaPrinciple:'Differential Reinforcement',
            actPrinciple:'Values-based Action',
            indicator:   'States limits clearly and consistently; maintains them under social pressure.',
          },
          {
            id:          'rc-b-05',
            name:        'Collaborative Problem Solving',
            description: 'Work with others to resolve shared challenges through mutual respect and flexibility.',
            abaPrinciple:'Cooperative Learning',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Generates solutions with others; integrates diverse perspectives.',
          },
        ],
      },
      {
        level: 3,
        name:  'Mastery',
        skills: [
          {
            id:          'rc-m-01',
            name:        'Relational Leadership',
            description: 'Lead and model relational resilience in teams, families, or communities.',
            abaPrinciple:'Modeling',
            actPrinciple:'Values-based Committed Action',
            indicator:   'Intentionally creates conditions for psychological safety in groups.',
          },
          {
            id:          'rc-m-02',
            name:        'Deep Listening Facilitation',
            description: 'Facilitate reflective listening practices in group or dyadic contexts.',
            abaPrinciple:'Verbal Behavior (facilitation)',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Effectively holds space for others\' emotional experience in group settings.',
          },
          {
            id:          'rc-m-03',
            name:        'Community Resilience Building',
            description: 'Contribute to building relational resilience at a community or organizational level.',
            abaPrinciple:'Generalization (social)',
            actPrinciple:'Values-based Action',
            indicator:   'Initiates or sustains community connection activities; mentors others.',
          },
        ],
      },
    ],
  },

  {
    dimension: 'Somatic-Regulative',
    title:     'Body Regulation Skill Tree',
    description: 'Build physiological flexibility and nervous system resilience through evidence-based somatic practices.',
    levels: [
      {
        level: 1,
        name:  'Foundation',
        skills: [
          {
            id:          'sr-f-01',
            name:        'Nervous System Literacy',
            description: 'Understand and identify autonomic nervous system states in yourself.',
            abaPrinciple:'Stimulus Discrimination (somatic)',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Can distinguish activation vs. regulation states; names somatic sensations accurately.',
          },
          {
            id:          'sr-f-02',
            name:        'Breath Regulation',
            description: 'Use breath-based techniques to regulate physiological activation.',
            abaPrinciple:'Stimulus Control',
            actPrinciple:'Acceptance + Present-Moment Awareness',
            indicator:   'Correctly performs physiological sigh and box breathing; reports measurable relaxation.',
          },
          {
            id:          'sr-f-03',
            name:        'Body Scan Practice',
            description: 'Conduct a systematic, non-judgmental scan of physical sensations throughout the body.',
            abaPrinciple:'Attending Behavior (internal)',
            actPrinciple:'Acceptance',
            indicator:   'Completes 10-minute body scan without avoidance; identifies tension sites.',
          },
          {
            id:          'sr-f-04',
            name:        'Somatic Cue Recognition',
            description: 'Identify specific somatic signals that precede stress responses.',
            abaPrinciple:'Antecedent Recognition',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Names earliest detectable somatic signal before stress cascade.',
          },
          {
            id:          'sr-f-05',
            name:        'Basic Grounding',
            description: 'Use sensory grounding techniques to reorient to the present moment.',
            abaPrinciple:'Stimulus Control',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Can execute 5-4-3-2-1 or feet-on-floor grounding within 60 seconds.',
          },
        ],
      },
      {
        level: 2,
        name:  'Building',
        skills: [
          {
            id:          'sr-b-01',
            name:        'Somatic Regulation Toolkit',
            description: 'Develop a personalized repertoire of 4+ regulation practices.',
            abaPrinciple:'Behavioral Repertoire Expansion',
            actPrinciple:'Committed Action',
            indicator:   'Can name, demonstrate, and select among multiple regulation techniques contextually.',
          },
          {
            id:          'sr-b-02',
            name:        'Antecedent Modification',
            description: 'Identify and modify environmental cues that trigger dysregulation.',
            abaPrinciple:'Antecedent Modification',
            actPrinciple:'Committed Action',
            indicator:   'Maps 2+ environmental triggers; implements structural changes to reduce dysregulation.',
          },
          {
            id:          'sr-b-03',
            name:        'Movement Integration',
            description: 'Integrate intentional movement as a daily somatic regulation practice.',
            abaPrinciple:'Behavioral Activation',
            actPrinciple:'Values-based Action',
            indicator:   'Maintains daily movement practice for 14+ days; reports regulation benefits.',
          },
          {
            id:          'sr-b-04',
            name:        'Sleep and Recovery Hygiene',
            description: 'Implement evidence-based sleep and recovery practices consistently.',
            abaPrinciple:'Stimulus Control (sleep)',
            actPrinciple:'Committed Action',
            indicator:   'Maintains consistent sleep schedule; uses 2+ sleep hygiene practices.',
          },
          {
            id:          'sr-b-05',
            name:        'Somatic Awareness in Emotion',
            description: 'Track the somatic component of emotional experiences in real time.',
            abaPrinciple:'Stimulus Discrimination (somatic-emotional)',
            actPrinciple:'Acceptance',
            indicator:   'Names body location and quality of emotional sensations; links somatic to emotional states.',
          },
        ],
      },
      {
        level: 3,
        name:  'Mastery',
        skills: [
          {
            id:          'sr-m-01',
            name:        'Somatic Intervention Protocol',
            description: 'Design and implement a personalized somatic intervention protocol for high-stress contexts.',
            abaPrinciple:'Behavior Intervention Planning',
            actPrinciple:'Committed Action',
            indicator:   'Has written protocol with pre-event, in-the-moment, and post-event strategies.',
          },
          {
            id:          'sr-m-02',
            name:        'Trauma-Informed Somatic Practice',
            description: 'Apply somatic practices with awareness of trauma history and nervous system sensitization.',
            abaPrinciple:'Shaping',
            actPrinciple:'Acceptance',
            indicator:   'Adapts practices for trauma triggers; maintains pacing and safety.',
          },
          {
            id:          'sr-m-03',
            name:        'Somatic Teaching',
            description: 'Teach somatic regulation practices to others effectively.',
            abaPrinciple:'Modeling + Verbal Instruction',
            actPrinciple:'Values-based Action',
            indicator:   'Guides others through breath/body practices; adapts to individual differences.',
          },
        ],
      },
    ],
  },

  {
    dimension: 'Cognitive-Narrative',
    title:     'Cognitive Flexibility Skill Tree',
    description: 'Develop flexible, adaptive thinking and the capacity to hold self-narratives lightly.',
    levels: [
      {
        level: 1,
        name:  'Foundation',
        skills: [
          {
            id:          'cn-f-01',
            name:        'Cognitive Defusion Basics',
            description: 'Notice thoughts as mental events rather than objective facts.',
            abaPrinciple:'Verbal Behavior Analysis',
            actPrinciple:'Cognitive Defusion',
            indicator:   'Uses "I\'m having the thought that..." prefix; reports reduced thought-behavior fusion.',
          },
          {
            id:          'cn-f-02',
            name:        'Pattern Recognition',
            description: 'Identify recurring cognitive patterns, self-stories, and mental habits.',
            abaPrinciple:'Self-Monitoring',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Names 2+ recurring self-narratives; identifies when patterns are active.',
          },
          {
            id:          'cn-f-03',
            name:        'Perspective Taking',
            description: 'Hold multiple perspectives on a situation simultaneously.',
            abaPrinciple:'Relational Frame Theory application',
            actPrinciple:'Self-as-Context',
            indicator:   'Can articulate 2+ viewpoints on a single event; reports decreased certainty in fixed narratives.',
          },
          {
            id:          'cn-f-04',
            name:        'Evidence Evaluation',
            description: 'Distinguish evidence-based conclusions from emotionally driven assumptions.',
            abaPrinciple:'Rule-Governed Behavior',
            actPrinciple:'Cognitive Defusion',
            indicator:   'Identifies at least one piece of evidence contradicting an unhelpful narrative.',
          },
          {
            id:          'cn-f-05',
            name:        'Adaptive Self-Talk',
            description: 'Replace unhelpful self-talk with accurate, workable alternatives.',
            abaPrinciple:'Verbal Behavior Modification',
            actPrinciple:'Cognitive Defusion + Values',
            indicator:   'Generates specific alternative self-talk grounded in behavioral evidence.',
          },
        ],
      },
      {
        level: 2,
        name:  'Building',
        skills: [
          {
            id:          'cn-b-01',
            name:        'Narrative Reconstruction',
            description: 'Systematically revise limiting self-narratives using behavioral evidence.',
            abaPrinciple:'Verbal Behavior Modification',
            actPrinciple:'Self-as-Context',
            indicator:   'Traces narrative history; identifies counter-evidence; rewrites with specificity.',
          },
          {
            id:          'cn-b-02',
            name:        'Values-Based Interpretation',
            description: 'Interpret ambiguous situations through a values-consistent lens.',
            abaPrinciple:'Rule-Governed Behavior (self-authored)',
            actPrinciple:'Values + Defusion',
            indicator:   'When triggered, pauses to identify a values-aligned interpretation before responding.',
          },
          {
            id:          'cn-b-03',
            name:        'Cognitive Flexibility Training',
            description: 'Practice deliberately shifting cognitive frames under mild stress.',
            abaPrinciple:'Behavioral Repertoire Expansion',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Demonstrates 2+ reframes for the same situation; maintains flexibility under mild pressure.',
          },
          {
            id:          'cn-b-04',
            name:        'Uncertainty Tolerance',
            description: 'Function effectively in ambiguous or uncertain situations without excessive analysis.',
            abaPrinciple:'Extinction (anxiety responses)',
            actPrinciple:'Acceptance',
            indicator:   'Tolerates unresolved uncertainty for 24+ hours without compulsive checking behavior.',
          },
          {
            id:          'cn-b-05',
            name:        'Self-Compassion in Cognition',
            description: 'Apply self-compassion when noticing self-critical or shame-based thoughts.',
            abaPrinciple:'Differential Reinforcement',
            actPrinciple:'Self-as-Context + Defusion',
            indicator:   'Responds to self-critical thoughts with the same tone as a trusted friend.',
          },
        ],
      },
      {
        level: 3,
        name:  'Mastery',
        skills: [
          {
            id:          'cn-m-01',
            name:        'Functional Verbal Behavior Analysis',
            description: 'Conduct a sophisticated analysis of how self-talk functions in maintaining avoidance or enabling action.',
            abaPrinciple:'Functional Assessment',
            actPrinciple:'Defusion + Values',
            indicator:   'Traces function of verbal behavior to identify what it enables or prevents.',
          },
          {
            id:          'cn-m-02',
            name:        'Meaning Architecture',
            description: 'Construct and maintain a coherent, values-aligned meaning framework for life navigation.',
            abaPrinciple:'Rule-Governed Behavior (self-authored)',
            actPrinciple:'Values + Self-as-Context',
            indicator:   'Has articulated a personal meaning architecture across multiple life domains.',
          },
          {
            id:          'cn-m-03',
            name:        'Teaching Cognitive Skills',
            description: 'Effectively teach cognitive defusion and narrative flexibility to others.',
            abaPrinciple:'Modeling + Verbal Instruction',
            actPrinciple:'Values-based Action',
            indicator:   'Guides others through defusion practices; adapts to learner level.',
          },
        ],
      },
    ],
  },

  {
    dimension: 'Emotional-Adaptive',
    title:     'Emotional Flexibility Skill Tree',
    description: 'Cultivate emotional range, tolerance of distress, and values-aligned responses to emotional experience.',
    levels: [
      {
        level: 1,
        name:  'Foundation',
        skills: [
          {
            id:          'ea-f-01',
            name:        'Emotion Naming',
            description: 'Identify and label emotional experiences with precision and nuance.',
            abaPrinciple:'Stimulus Discrimination (internal)',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Uses 10+ distinct emotion words; can identify secondary emotions (e.g., shame under anger).',
          },
          {
            id:          'ea-f-02',
            name:        'Emotion-Body Connection',
            description: 'Track physical sensations associated with different emotional states.',
            abaPrinciple:'Stimulus Discrimination (somatic-emotional)',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Names body location and quality of at least 5 distinct emotions.',
          },
          {
            id:          'ea-f-03',
            name:        'Emotion Acceptance',
            description: 'Allow emotional experiences without suppression, avoidance, or excessive expression.',
            abaPrinciple:'Extinction (avoidance)',
            actPrinciple:'Acceptance + Willingness',
            indicator:   'Practices 3 minutes of emotion observation without behavioral suppression.',
          },
          {
            id:          'ea-f-04',
            name:        'Emotional Trigger Awareness',
            description: 'Identify situations, thoughts, and contexts that reliably trigger specific emotional responses.',
            abaPrinciple:'Antecedent Analysis',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Can map 3+ emotional triggers with their contextual antecedents.',
          },
          {
            id:          'ea-f-05',
            name:        'Self-Compassion Practice',
            description: 'Respond to personal suffering and difficulty with kindness rather than judgment.',
            abaPrinciple:'Differential Reinforcement',
            actPrinciple:'Self-as-Context + Acceptance',
            indicator:   'Can generate a self-compassionate response to a recent difficulty.',
          },
        ],
      },
      {
        level: 2,
        name:  'Building',
        skills: [
          {
            id:          'ea-b-01',
            name:        'Distress Tolerance',
            description: 'Tolerate high-intensity emotional experiences without destructive coping.',
            abaPrinciple:'Extinction (avoidance responses)',
            actPrinciple:'Acceptance + Willingness',
            indicator:   'Maintains values-aligned behavior during moderate-high emotional arousal.',
          },
          {
            id:          'ea-b-02',
            name:        'Values-Led Emotional Response',
            description: 'Choose responses to emotions that align with values rather than automatic reactions.',
            abaPrinciple:'Differential Reinforcement',
            actPrinciple:'Values + Committed Action',
            indicator:   'Can identify values-aligned response options during emotional activation.',
          },
          {
            id:          'ea-b-03',
            name:        'Emotional Regulation Strategies',
            description: 'Apply multiple evidence-based emotion regulation strategies contextually.',
            abaPrinciple:'Behavioral Repertoire Expansion',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Has 4+ specific strategies; selects among them based on context.',
          },
          {
            id:          'ea-b-04',
            name:        'Emotion Communication',
            description: 'Express emotional experience to others with accuracy and appropriate vulnerability.',
            abaPrinciple:'Verbal Behavior (tact training)',
            actPrinciple:'Values-based Action',
            indicator:   'Uses "I feel..." statements accurately; adjusts vulnerability level to relationship context.',
          },
          {
            id:          'ea-b-05',
            name:        'Grief and Loss Navigation',
            description: 'Move through grief and loss processes without prolonged avoidance or complicated grief.',
            abaPrinciple:'Extinction (grief avoidance)',
            actPrinciple:'Acceptance',
            indicator:   'Engages with grief experiences; maintains functioning across grief responses.',
          },
        ],
      },
      {
        level: 3,
        name:  'Mastery',
        skills: [
          {
            id:          'ea-m-01',
            name:        'Functional Emotion Analysis',
            description: 'Conduct a sophisticated behavioral analysis of emotional response functions.',
            abaPrinciple:'Functional Behavior Assessment',
            actPrinciple:'Acceptance + Values',
            indicator:   'Can trace the full A-B-C of an emotional episode and identify function.',
          },
          {
            id:          'ea-m-02',
            name:        'Emotional Intelligence Leadership',
            description: 'Model and facilitate emotional intelligence in relational or team contexts.',
            abaPrinciple:'Modeling',
            actPrinciple:'Values-based Committed Action',
            indicator:   'Creates environments where others feel emotionally safe to be authentic.',
          },
          {
            id:          'ea-m-03',
            name:        'Post-Traumatic Growth Facilitation',
            description: 'Support the development of post-traumatic growth in self and others.',
            abaPrinciple:'Shaping',
            actPrinciple:'Values + Self-as-Context',
            indicator:   'Identifies and amplifies growth-oriented meaning-making after adversity.',
          },
        ],
      },
    ],
  },

  {
    dimension: 'Spiritual-Reflective',
    title:     'Meaning & Values Skill Tree',
    description: 'Develop a stable values base and the capacity to orient behavior from a place of grounded purpose.',
    levels: [
      {
        level: 1,
        name:  'Foundation',
        skills: [
          {
            id:          'sp-f-01',
            name:        'Values Articulation',
            description: 'Identify, name, and describe core personal values with specificity.',
            abaPrinciple:'Rule-Governed Behavior (self-authored)',
            actPrinciple:'Values Clarification',
            indicator:   'Can articulate 5+ values with specific examples of how they manifest in behavior.',
          },
          {
            id:          'sp-f-02',
            name:        'Meaning-Making',
            description: 'Find meaning and purpose in experiences, including difficult ones.',
            abaPrinciple:'Verbal Behavior (self-narratives)',
            actPrinciple:'Values + Defusion',
            indicator:   'Can articulate the meaning in a recent challenge; connects adversity to growth.',
          },
          {
            id:          'sp-f-03',
            name:        'Present-Moment Awareness',
            description: 'Attend to current experience with openness and without judgment.',
            abaPrinciple:'Attending Behavior',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Can maintain present-moment focus for 5+ minutes during brief mindfulness practice.',
          },
          {
            id:          'sp-f-04',
            name:        'Gratitude Practice',
            description: 'Regularly identify and appreciate positive aspects of life and experience.',
            abaPrinciple:'Differential Reinforcement (attending)',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Maintains regular gratitude practice; reports increased noticing of positive.',
          },
          {
            id:          'sp-f-05',
            name:        'Purpose Connection',
            description: 'Link daily activities to a broader sense of purpose or contribution.',
            abaPrinciple:'Motivating Operations (meaning)',
            actPrinciple:'Values Clarification',
            indicator:   'Can identify how a routine activity connects to a core purpose or value.',
          },
        ],
      },
      {
        level: 2,
        name:  'Building',
        skills: [
          {
            id:          'sp-b-01',
            name:        'Values-Action Consistency',
            description: 'Assess and increase alignment between stated values and daily behavior.',
            abaPrinciple:'Correspondence Training',
            actPrinciple:'Committed Action',
            indicator:   'Regularly audits values-behavior alignment; identifies and closes gaps.',
          },
          {
            id:          'sp-b-02',
            name:        'Reflective Practice',
            description: 'Sustain a regular reflective practice that deepens self-knowledge.',
            abaPrinciple:'Self-Recording',
            actPrinciple:'Present-Moment + Values',
            indicator:   'Maintains journaling or reflection practice 3+ times weekly.',
          },
          {
            id:          'sp-b-03',
            name:        'Existential Tolerance',
            description: 'Function effectively in the presence of existential uncertainty and life\'s unanswerable questions.',
            abaPrinciple:'Extinction (existential anxiety)',
            actPrinciple:'Acceptance',
            indicator:   'Reports reduced distress when confronting questions of meaning, mortality, and uncertainty.',
          },
          {
            id:          'sp-b-04',
            name:        'Contemplative Practice',
            description: 'Engage in a regular contemplative practice (meditation, prayer, mindful movement, etc.).',
            abaPrinciple:'Stimulus Control',
            actPrinciple:'Present-Moment Awareness',
            indicator:   'Maintains 10+ minutes of daily contemplative practice for 21+ days.',
          },
          {
            id:          'sp-b-05',
            name:        'Transcendent Connection',
            description: 'Experience and articulate a sense of connection to something larger than oneself.',
            abaPrinciple:'Rule-Governed Behavior',
            actPrinciple:'Self-as-Context',
            indicator:   'Can describe at least one experience of transcendence or connection to something greater.',
          },
        ],
      },
      {
        level: 3,
        name:  'Mastery',
        skills: [
          {
            id:          'sp-m-01',
            name:        'Meaning Architecture Design',
            description: 'Construct and communicate a coherent personal philosophy that guides life decisions.',
            abaPrinciple:'Rule-Governed Behavior (complex)',
            actPrinciple:'Values + Self-as-Context',
            indicator:   'Has articulated personal philosophy across key life domains; uses it in decision-making.',
          },
          {
            id:          'sp-m-02',
            name:        'Wisdom Integration',
            description: 'Synthesize learning from diverse experiences, teachings, and traditions into integrated wisdom.',
            abaPrinciple:'Stimulus Generalization',
            actPrinciple:'Psychological Flexibility',
            indicator:   'Draws on multiple knowledge sources; applies integrated wisdom contextually.',
          },
          {
            id:          'sp-m-03',
            name:        'Spiritual Leadership',
            description: 'Support others in their meaning-making and values-alignment work.',
            abaPrinciple:'Modeling',
            actPrinciple:'Values-based Committed Action',
            indicator:   'Holds space for others\' spiritual/values development with skill and non-imposition.',
          },
        ],
      },
    ],
  },
];

/**
 * Get the skill tree for a specific dimension.
 * @param {string} dimension
 * @returns {object|null}
 */
export function getSkillTree(dimension) {
  return IARF_SKILL_TREES.find(t => t.dimension === dimension) || null;
}

/**
 * Get the level metadata by level number.
 * @param {number} level  — 1, 2, or 3
 * @returns {object|null}
 */
export function getSkillLevelMeta(level) {
  return SKILL_LEVELS.find(l => l.level === level) || null;
}

/**
 * Count total skills across all levels for a dimension.
 * @param {string} dimension
 * @returns {number}
 */
export function getTotalSkillCount(dimension) {
  const tree = getSkillTree(dimension);
  if (!tree) return 0;
  return tree.levels.reduce((sum, lvl) => sum + lvl.skills.length, 0);
}
