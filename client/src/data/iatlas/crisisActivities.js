/**
 * crisisActivities.js
 * IATLAS Crisis Intervention Activities — SOS Activity Library for acute stress moments.
 * These activities are designed for use during or after high-distress episodes.
 *
 * IMPORTANT: These are supportive tools, not replacements for professional crisis intervention.
 * Always follow your organisation's crisis protocols and seek professional help when needed.
 */

export const CRISIS_DISCLAIMER = 'These activities support emotional regulation during difficult moments. They are not a substitute for professional mental health crisis intervention. If a child is in immediate danger or expressing thoughts of self-harm, contact emergency services immediately.';

export const CRISIS_ACTIVITIES = {
  panic: {
    label: 'Panic & Anxiety',
    color: '#6366f1',
    colorLight: '#eef2ff',
    icon: '/icons/panic.svg',
    description: 'Quick grounding activities for panic attacks, acute anxiety, or overwhelming worry.',
    activities: [
      {
        id: 'crisis-54321-grounding',
        title: '5-4-3-2-1 Grounding',
        duration: '3 min',
        intensity: 'mild-moderate',
        ageGroups: ['ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'somatic-regulative',
        instructions: [
          'Name 5 things you can SEE right now',
          'Name 4 things you can TOUCH (and touch them)',
          'Name 3 things you can HEAR',
          'Name 2 things you can SMELL',
          'Name 1 thing you can TASTE',
        ],
        scienceNote: 'Activates sensory cortex to interrupt the amygdala panic response.',
        parentNote: 'Guide your child through this calmly. Your calm voice is the most important tool.',
        whenToUse: 'During panic attacks, high anxiety, feeling disconnected from reality.',
        adaptations: {
          younger: 'Use only 3-2-1 (see, hear, touch) for younger or overwhelmed children.',
          sensory: 'Skip smell/taste if sensory sensitivities are present.',
        },
      },
      {
        id: 'crisis-box-breathing',
        title: 'Box Breathing',
        duration: '2 min',
        intensity: 'mild',
        ageGroups: ['ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'somatic-regulative',
        instructions: [
          'Breathe IN for 4 counts (trace the top of a square)',
          'HOLD for 4 counts (trace the right side)',
          'Breathe OUT for 4 counts (trace the bottom)',
          'HOLD for 4 counts (trace the left side)',
          'Repeat 4 times',
        ],
        scienceNote: 'Activates the parasympathetic nervous system within 2-4 breath cycles.',
        parentNote: 'Do it WITH your child — your regulated nervous system co-regulates theirs.',
        whenToUse: 'Before a panic attack peaks. Best used at first signs of anxiety.',
        adaptations: {
          younger: 'Use 3 counts instead of 4 for younger children.',
          visual: 'Draw a square and trace it with a finger for a visual anchor.',
        },
      },
      {
        id: 'crisis-cold-water',
        title: 'Temperature Reset',
        duration: '1 min',
        intensity: 'moderate-severe',
        ageGroups: ['ages-11-14', 'ages-15-18'],
        dimension: 'somatic-regulative',
        instructions: [
          'Run cold water over your wrists and inner arms for 30 seconds',
          'Or hold ice cubes for 30 seconds',
          'Or splash cold water on your face',
          'Focus entirely on the sensation of cold',
          'Take slow deep breaths while you do this',
        ],
        scienceNote: 'Cold water activates the dive reflex, rapidly reducing heart rate and anxiety.',
        parentNote: 'A DBT (Dialectical Behavior Therapy) technique known as "TIP Skills." Highly effective.',
        whenToUse: 'During intense panic, before self-harm urges escalate, or when other techniques aren\'t working.',
        adaptations: {
          safety: 'Use a cold cloth or cool drink as a gentler alternative for sensitive children.',
        },
      },
      {
        id: 'crisis-safe-place-visualisation',
        title: 'Safe Place Visualisation',
        duration: '5 min',
        intensity: 'mild-moderate',
        ageGroups: ['ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'cognitive-narrative',
        instructions: [
          'Close your eyes and take 3 slow breaths',
          'Imagine a place where you feel completely safe and peaceful',
          'Notice every detail: what do you see, hear, smell, feel?',
          'Spend 3 minutes in your safe place',
          'Before you leave, choose a word that represents this place',
          'Use that word as an anchor whenever you need to return',
        ],
        scienceNote: 'Activates the prefrontal cortex and promotes parasympathetic response.',
        parentNote: 'Help your child build their safe place during a calm time so it\'s ready when needed.',
        whenToUse: 'Panic, overwhelming worry, nighttime anxiety, before stressful events.',
        adaptations: {
          younger: 'Guide younger children through this verbally with a "magic carpet" or "favourite place" theme.',
        },
      },
    ],
  },

  anger: {
    label: 'Anger & Aggression',
    color: '#ef4444',
    colorLight: '#fef2f2',
    icon: '/icons/anger.svg',
    description: 'Activities for de-escalating anger, redirecting aggression, and processing intense emotions safely.',
    activities: [
      {
        id: 'crisis-movement-release',
        title: 'Safe Energy Release',
        duration: '3 min',
        intensity: 'moderate-severe',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        dimension: 'somatic-regulative',
        instructions: [
          'Go somewhere with space (outside or in a safe room)',
          'Do 20 jumping jacks OR run on the spot for 2 minutes',
          'OR do 10 push-ups against a wall',
          'Shake out your hands and arms',
          'Take 5 deep slow breaths',
        ],
        scienceNote: 'Physical movement metabolises stress hormones (cortisol, adrenaline) within minutes.',
        parentNote: 'Provide a safe space for physical expression. Do NOT engage in power struggles during this time.',
        whenToUse: 'When anger is physical (throwing, hitting urges) or the body feels "ready to explode".',
        safetyNote: 'Ensure the space is physically safe. Redirect — do not restrain unless there is immediate danger.',
        adaptations: {
          sensory: 'Weighted blanket or pillow squeezing for children with sensory issues.',
        },
      },
      {
        id: 'crisis-anger-map',
        title: 'My Anger Map',
        duration: '10 min',
        intensity: 'mild-moderate',
        ageGroups: ['ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'emotional-adaptive',
        instructions: [
          'Draw your body outline on paper',
          'Mark WHERE in your body you feel the anger (red marks)',
          'Write WHAT triggered the anger (outside the body)',
          'Write what the anger is SAYING (it\'s always protecting something)',
          'Write what you actually NEED right now',
        ],
        scienceNote: 'Externalising anger through drawing activates the prefrontal cortex, reducing amygdala reactivity.',
        parentNote: 'This works best in the 15-30 minutes AFTER the initial anger peak, not during.',
        whenToUse: 'After the immediate anger has dropped slightly. Helps process the emotion rather than just contain it.',
        adaptations: {
          younger: 'Use emotion faces or a simple 1-10 anger scale with younger children.',
        },
      },
      {
        id: 'crisis-ice-cube-control',
        title: 'Ice Cube Control',
        duration: '2 min',
        intensity: 'moderate',
        ageGroups: ['ages-8-10', 'ages-11-14'],
        dimension: 'somatic-regulative',
        instructions: [
          'Hold an ice cube in each hand',
          'Squeeze hard for 30 seconds',
          'Focus entirely on the cold, not the anger',
          'Release and take 3 deep breaths',
          'Repeat if needed',
        ],
        scienceNote: 'Pain/cold sensation interrupts the anger circuit. A safe physical outlet for intense emotion.',
        parentNote: 'A DBT distress tolerance technique. Safe and effective alternative to self-harm.',
        whenToUse: 'When the urge to self-harm or physical aggression is present.',
      },
    ],
  },

  grief: {
    label: 'Grief & Loss',
    color: '#64748b',
    colorLight: '#f8fafc',
    icon: '/icons/grief.svg',
    description: 'Gentle activities for supporting children through loss, grief, and deep sadness.',
    activities: [
      {
        id: 'crisis-memory-box',
        title: 'Memory Box',
        duration: '30 min',
        intensity: 'mild',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'cognitive-narrative',
        instructions: [
          'Find a special box or make one from a shoebox',
          'Fill it with items that remind you of the person or thing you\'ve lost',
          'Include photos, drawings, small objects, written memories',
          'Keep the box somewhere special',
          'Visit it when you want to feel close to what you\'ve lost',
        ],
        scienceNote: 'Continuing bonds theory — maintaining connection with what is lost supports healthy grief.',
        parentNote: 'Do not rush this process. There is no timeline for grief.',
        whenToUse: 'Any time after a significant loss. Can be started immediately or weeks later.',
      },
      {
        id: 'crisis-grief-waves',
        title: 'Riding the Grief Wave',
        duration: '15 min',
        intensity: 'moderate',
        ageGroups: ['ages-11-14', 'ages-15-18'],
        dimension: 'emotional-adaptive',
        instructions: [
          'Draw a wave on paper',
          'Mark the crest — what does peak grief feel like?',
          'Mark the trough — what does the grief lull feel like?',
          'Write: "This wave will pass" at the bottom',
          'Identify what helps you ride waves (people, activities, practices)',
          'Remember: waves don\'t last forever',
        ],
        scienceNote: 'Grief waves are neurobiological. Understanding them reduces fear and supports tolerance.',
        parentNote: 'Normalise grief waves for your child. "It\'s supposed to come in waves — that\'s healthy."',
        whenToUse: 'When grief feels uncontrollable or overwhelming.',
      },
      {
        id: 'crisis-tears-are-okay',
        title: 'Permission to Cry',
        duration: '5 min',
        intensity: 'mild',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14'],
        dimension: 'emotional-adaptive',
        instructions: [
          'Find a private safe space',
          'Give yourself full permission to cry',
          'Don\'t try to stop the tears — just let them come',
          'After crying, place your hands on your heart',
          'Whisper: "I am allowed to be sad. Sadness means I love."',
        ],
        scienceNote: 'Tears contain cortisol and stress hormones — crying is a biological stress release.',
        parentNote: 'Model this for your child. Children who see adults cry healthily learn to cry healthily.',
        whenToUse: 'When grief or sadness is being suppressed. Encourage tears as healthy.',
      },
    ],
  },

  overwhelm: {
    label: 'Overwhelm & Shutdown',
    color: '#7c3aed',
    colorLight: '#f5f3ff',
    icon: '/icons/overwhelm.svg',
    description: 'Activities for children who are shutting down, dissociating, or feeling completely overwhelmed.',
    activities: [
      {
        id: 'crisis-one-thing',
        title: 'One Thing at a Time',
        duration: '5 min',
        intensity: 'mild-moderate',
        ageGroups: ['ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'agentic-generative',
        instructions: [
          'Stop and write down everything overwhelming you',
          'Circle just ONE small thing you can do right now',
          'Do ONLY that one thing — nothing else',
          'When it\'s done, cross it off',
          'Breathe. Then choose the next one small thing.',
        ],
        scienceNote: 'Overwhelm is often the result of the executive function system being overloaded. Narrowing focus restores function.',
        parentNote: 'Help your child identify the ONE thing. Do not give them a list — give them a single task.',
        whenToUse: 'When a child is paralysed by too many demands, to-dos, or worries.',
      },
      {
        id: 'crisis-grounding-tether',
        title: 'Grounding Tether',
        duration: '3 min',
        intensity: 'moderate',
        ageGroups: ['ages-5-7', 'ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'somatic-regulative',
        instructions: [
          'Put both feet flat on the floor',
          'Press down hard — feel the ground under your feet',
          'Press your back into the chair or wall behind you',
          'Say out loud: "I am here. I am safe. The ground is holding me."',
          'Repeat 5 times while continuing to press your feet down',
        ],
        scienceNote: 'Proprioceptive input (pressure) activates the body\'s regulatory system and helps with dissociation.',
        parentNote: 'Speak slowly and calmly. Place your own feet on the floor and breathe — your regulated state helps.',
        whenToUse: 'Dissociation, shutdown, feeling "not real", extreme overwhelm.',
      },
      {
        id: 'crisis-safe-person',
        title: 'Call Your Safe Person',
        duration: '5 min',
        intensity: 'moderate-severe',
        ageGroups: ['ages-8-10', 'ages-11-14', 'ages-15-18'],
        dimension: 'relational-connective',
        instructions: [
          'Identify your safe person (parent, trusted adult, friend)',
          'Reach out — call, text, or go to them',
          'You don\'t have to explain everything — just say "I need help right now"',
          'Let them be with you. You don\'t have to be alone in this.',
          'If your safe person isn\'t available, contact a helpline.',
        ],
        scienceNote: 'Co-regulation — being with a calm, regulated person — is the most effective nervous system intervention.',
        parentNote: 'Being available as a "safe person" is the most powerful thing you can do. Just be present.',
        whenToUse: 'Any crisis. Reaching out is always the right first step.',
        resources: [
          { name: 'Crisis Text Line', contact: 'Text HOME to 741741 (US)' },
          { name: 'Kids Help Phone (Canada)', contact: '1-800-668-6868 or text HELLO to 686868' },
          { name: 'Lifeline (Australia)', contact: '13 11 14' },
          { name: 'Samaritans (UK)', contact: '116 123' },
        ],
      },
    ],
  },
};

export const WHEN_TO_SEEK_HELP = {
  title: 'When to Seek Immediate Professional Help',
  urgentSigns: [
    'Child expresses thoughts of suicide or self-harm',
    'Child threatens to harm others',
    'Child is completely unresponsive or dissociated',
    'Child is in immediate physical danger',
    'Crisis lasts more than 1 hour without improvement',
    'Child refuses all support and is escalating',
  ],
  resources: [
    { name: 'Emergency Services', contact: '911 (US) / 999 (UK) / 000 (Australia)' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741 (US/Canada/UK)' },
    { name: 'National Alliance on Mental Illness (NAMI)', contact: '1-800-950-NAMI (US)' },
    { name: 'Kids Help Phone (Canada)', contact: '1-800-668-6868' },
    { name: 'Lifeline (Australia)', contact: '13 11 14' },
    { name: 'Childline (UK)', contact: '0800 1111' },
  ],
};

export const SAFETY_PLANNING_TEMPLATE = {
  title: 'My Safety Plan',
  description: 'Complete this during a calm time to prepare for difficult moments.',
  sections: [
    {
      id: 'warning-signs',
      title: '1. My Warning Signs',
      prompt: 'What are the signs that I\'m starting to feel really bad?',
      examples: ['I stop talking', 'My stomach hurts', 'I isolate in my room'],
    },
    {
      id: 'coping-strategies',
      title: '2. Things I Can Do to Help Myself',
      prompt: 'What can I do on my own to feel better?',
      examples: ['Go for a walk', 'Listen to my calm playlist', 'Draw'],
    },
    {
      id: 'safe-people',
      title: '3. People I Can Talk To',
      prompt: 'Who can I reach out to when I\'m struggling?',
      fields: ['Name', 'Phone number', 'What I can say to them'],
    },
    {
      id: 'professional-help',
      title: '4. Professionals I Can Contact',
      prompt: 'Who are the professionals I can call?',
      fields: ['Practitioner name and number', 'Crisis line', 'Emergency'],
    },
    {
      id: 'safe-environment',
      title: '5. Making My Environment Safer',
      prompt: 'What can we remove or change to make my environment safer?',
    },
    {
      id: 'reasons',
      title: '6. My Reasons to Stay Safe',
      prompt: 'What are the most important reasons for me to stay safe?',
      examples: ['My dog', 'My friend', 'My future self'],
    },
  ],
};

/**
 * Get all crisis activities as a flat list.
 * @returns {Array}
 */
export function getAllCrisisActivities() {
  return Object.entries(CRISIS_ACTIVITIES).flatMap(([type, data]) =>
    data.activities.map(act => ({ ...act, crisisType: type, crisisLabel: data.label }))
  );
}

/**
 * Get crisis activities for a specific type.
 * @param {'panic'|'anger'|'grief'|'overwhelm'} type
 * @returns {Array}
 */
export function getCrisisActivitiesByType(type) {
  return CRISIS_ACTIVITIES[type]?.activities || [];
}

/**
 * Get crisis activities appropriate for an age group.
 * @param {string} ageGroup
 * @returns {Array}
 */
export function getCrisisActivitiesForAge(ageGroup) {
  return getAllCrisisActivities().filter(act => act.ageGroups.includes(ageGroup));
}
