/**
 * Resilience Atlas — Kids Activity Database
 * Centralized activity data for the Kids Resilience Program (ages 5–18+).
 * Each activity maps to one of the six resilience dimensions.
 */

export const KIDS_DIMENSION_ICON_MAP = {
  'Emotional-Adaptive':    '/icons/emotional-adaptive.svg',
  'Somatic-Regulative':    '/icons/somatic-regulative.svg',
  'Relational-Connective': '/icons/relational-connective.svg',
  'Agentic-Generative':    '/icons/agentic-generative.svg',
  'Spiritual-Reflective':  '/icons/spiritual-reflective.svg',
  'Cognitive-Narrative':   '/icons/cognitive-narrative.svg',
};

export const KIDS_ACTIVITIES = {

  /* ── Ages 5–7 (Early Elementary) ── */
  'age-5-7': [
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Feeling Faces Drawing',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'Draw a face showing how you feel right now. Give the feeling a color. Share it with a grown-up and tell them one thing about it.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Bubble Breathing',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'Breathe in slowly like you\'re blowing up the biggest bubble in the world. Let it out even slower. Do it three times and notice how your body feels after.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'My Helper List',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Draw or write the names of three people you trust. Practice saying "Can you help me?" out loud — it gets easier every time you try!',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'My Superhero Power',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Draw yourself as a superhero. What is your special power? What challenge does your superhero solve? You get to choose!',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'My Happy Thought Box',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Decorate a small box or draw a picture of one. Put little notes inside with things that make you happy, things you love, and people who matter to you.',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'What Can I Change?',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Draw a big circle. Inside, draw or write things you CAN change. Outside the circle, draw things you can\'t change. Focus on the inside!',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'Support Circle Drawing',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Draw yourself in the middle of the page. Around you, draw the faces or names of people who help you — family, friends, teachers. You have more helpers than you think!',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Gratitude Jar',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Find a jar or draw one. Each day, write or draw one good thing that happened and put it inside. When you feel sad, open the jar and remember the good things.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'Star of the Day',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Draw a big star. Inside each point, write or draw one thing you did today that you\'re proud of — big or small! Every small step makes you a star.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Feelings Color Wheel',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'Draw a circle and divide it into six slices like a pie. Color each slice a different color for a different feeling — happy, sad, angry, scared, excited, calm. Which colors fill your wheel today?',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Butterfly Hug',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'Cross your arms over your chest like butterfly wings. Gently tap left, right, left, right — slowly. Breathe in and out. This calms your body when feelings get too big.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Different Perspectives Game',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Think of something at home — like the family dog or your favorite toy. Now imagine: how does it see the world? Draw or tell a story from that different point of view!',
      time: '10 min',
      level: 'beginner'
    }
  ],

  /* ── Ages 8–10 (Upper Elementary) ── */
  'age-8-10': [
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Feelings Journal',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'Each day for one week, write one feeling you had and what caused it. Notice patterns. Are there certain times or situations that bring up certain feelings?',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: '5-4-3-2-1 Grounding',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'When you feel anxious, name 5 things you see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. It brings you back to right now.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'Buddy Check-In',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Pick one friend or classmate to check in with this week. Ask them how they\'re really doing — and really listen. Then share something about your own week too.',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'Goal and Steps Map',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Choose something you want to achieve. Draw a path with five stepping-stone shapes. Write one small action on each stone. Start with the first one this week.',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Flip-It Challenge',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Think of something that went wrong. Rewrite it as a learning story: "I used to think... but now I know..." How does the new version feel different?',
      time: '10 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Values Sorting',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Write 10 things you care about on slips of paper. Sort them from most important to least. Talk with someone about why your top three matter so much to you.',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'My Help Menu',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Create a "Help Menu" like a restaurant menu. List different ways people can support you — a listening ear, homework help, a fun distraction, a pep talk. Share it with a trusted adult.',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Thought Journal',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Write down a thought you had today. Now ask: Is this thought true? Is it helpful? What would I tell a friend who had this thought? Practice being your own kind coach.',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Breathing Ladder',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'Try three different breathing patterns this week: (1) 4 counts in, 4 out. (2) 4 in, hold 4, 8 out. (3) Belly breathing for 2 minutes. Which one works best for you?',
      time: '10 min',
      level: 'beginner'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'Habit Tracker',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Pick one good habit to practice for 5 days — reading, exercising, drawing, or something you want to get better at. Track it on a chart. Celebrate every checkmark!',
      time: '5 min/day',
      level: 'beginner'
    },
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Emotions Scale',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'Draw a scale from 1–10. 1 is super calm, 10 is very intense. When you feel a big emotion today, where on the scale is it? What number feels manageable?',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Inspiration Board',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Start an inspiration journal. Collect quotes, words, or pictures that make you feel hopeful and strong. Look at it when you need a boost.',
      time: '15 min',
      level: 'beginner'
    }
  ],

  /* ── Ages 11–14 (Early Teen / Middle School) ── */
  'age-11-14': [
    {
      icon: '/icons/relational-connective.svg',
      title: 'Resilience Interview',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Interview an adult you admire about a hard time in their life. Ask: What happened? How did you get through it? Who helped you? What did you learn? Reflect on what you hear.',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Reframing Practice',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Write about a current challenge. Then write three different perspectives on it: a friend\'s view, a future self\'s view, and a scientist\'s view. Which perspective opens up new solutions?',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Body Scan Journal',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'Each morning for a week, do a 2-minute body scan: close your eyes and notice each body part from toes to head. Where is tension? Where is calm? Write what you notice.',
      time: '10 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Emotion Mapping',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'For one week, track your emotions with a chart: time, feeling, intensity (1–10), what triggered it. At the end of the week, look for patterns. What do they tell you?',
      time: '10 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Purpose Letter',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Write a letter to your future self (5 years from now). What do you hope matters to you? What kind of person do you want to be? What will you have done that felt meaningful?',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: '30-Day Challenge',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Choose one small habit to build over 30 days — something that takes just 5 minutes. Track it daily. At the end, reflect: How did starting small lead to something bigger?',
      time: '5 min/day',
      level: 'intermediate'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Strengths Inventory',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Ask three people who know you well to name two strengths they see in you. Compare their answers with your own list. Which strengths surprise you? How can you use them more often?',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'Support Plan',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Create a personal support plan: who do you go to for school help? For emotional support? For fun? For big life decisions? Write a name next to each category — then reach out to one person this week.',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Values Debate',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Pick two values that sometimes feel like they conflict — like "loyalty" and "honesty." Write about a time when they pulled in opposite directions. How did you decide what to do?',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Trigger Journal',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'Keep track of moments when you felt a strong emotion suddenly shift. What was happening just before? Identifying your triggers is the first step to responding instead of reacting.',
      time: '10 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'Accountability Partner',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Find a classmate or friend. Share one goal each. Check in with each other twice this week. Accountability makes goals three times more likely to happen — science says so!',
      time: '10 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Movement Reset',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'When stress builds up, do a 5-minute movement reset: walk, stretch, shake your hands, roll your shoulders. Notice how your mind clears when your body moves.',
      time: '5 min',
      level: 'beginner'
    }
  ],

  /* ── Ages 15–18 (High School / Older Teen) ── */
  'age-15-18': [
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Identity Collage',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Create a visual collage — digital or physical — that represents the different parts of who you are: roles, interests, values, questions, and contradictions. Notice which parts feel most and least like "you."',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Feelings Temperature Check',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'Rate your emotional intensity on a scale of 1–10 three times a day for a week. Note the time, the feeling, and what was happening. Track patterns: when are your highs? Your lows? What shifts your temperature?',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Movement Playlist',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'Build three playlists: one for high-energy moments, one for calm and focus, one for processing hard feelings. Notice how music changes how your body and mood feel — then use it intentionally, not just as background noise.',
      time: '15 min',
      level: 'beginner'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'Relationship Map',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Draw yourself in the center of a page. Place the people in your life at different distances around you. Ask: who energizes you? Who drains you? Which relationships support your growth, and which feel one-sided?',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Values Compass',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'List 15 things you care about, then narrow to your top 5. For each one, write: how does this value show up in how I spend my time? Where is there a gap between what I value and how I actually live?',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'Small Wins Tracker',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Each night for two weeks, write one thing you did that moved you forward — however small. Review at the end of the week. Progress is often invisible day to day but undeniable week to week.',
      time: '5 min',
      level: 'beginner'
    },
    {
      icon: '/icons/somatic-regulative.svg',
      title: 'Digital Audit',
      dimension: 'Somatic-Regulative',
      subtype: 'The Grounder',
      desc: 'Check your screen time data for the past week. Ask: which apps leave you energized? Which leave you anxious or empty? Try a 24-hour intentional-use experiment — only pick up your phone with a clear purpose — and journal what changes.',
      time: '10 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Stress Audit',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'List every stressor in your life right now. Sort them into three columns: Can Control, Can Influence, Can\'t Control. Focus 80% of your energy on what you can control or influence — and let the rest go with intention.',
      time: '15 min',
      level: 'intermediate'
    },
    {
      icon: '/icons/agentic-generative.svg',
      title: 'Personal Leadership Plan',
      dimension: 'Agentic-Generative',
      subtype: 'The Builder',
      desc: 'Identify one area where you want to lead — in school, at home, or in your community. Define what leadership looks like there. Write 3 actions you\'ll take this month to step up.',
      time: '20 min',
      level: 'advanced'
    },
    {
      icon: '/icons/emotional-adaptive.svg',
      title: 'Emotional Cycle Tracker',
      dimension: 'Emotional-Adaptive',
      subtype: 'The Feeler',
      desc: 'For two weeks, track not just your emotions but the full cycle: trigger → feeling → response → outcome. Look for patterns. Where could you shift the cycle to get a better outcome?',
      time: '10 min',
      level: 'advanced'
    },
    {
      icon: '/icons/cognitive-narrative.svg',
      title: 'Personal Philosophy Statement',
      dimension: 'Cognitive-Narrative',
      subtype: 'The Thinker',
      desc: 'Draft a one-paragraph personal philosophy: what do you believe about how people should treat each other, how to handle failure, and what makes life worth living? Revise it until it feels authentically yours.',
      time: '20 min',
      level: 'advanced'
    },
    {
      icon: '/icons/relational-connective.svg',
      title: 'Vulnerability as Strength',
      dimension: 'Relational-Connective',
      subtype: 'The Connector',
      desc: 'Reflect on a time you showed vulnerability — admitted a mistake, asked for help, or shared a fear — and it deepened a relationship. Write about what happened. What did it cost you? What did it gain you?',
      time: '15 min',
      level: 'advanced'
    },
    {
      icon: '/icons/spiritual-reflective.svg',
      title: 'Contribution Map',
      dimension: 'Spiritual-Reflective',
      subtype: 'The Guide',
      desc: 'Draw a map of the different circles of your life — school, home, community, world. Where can your unique strengths contribute something meaningful? Plan one action to contribute in each circle this month.',
      time: '20 min',
      level: 'advanced'
    }
  ]

};

/* ── Characters ── */
export const KIDS_CHARACTERS = [
  {
    name: 'Maya — The Connector',
    title: 'Connection Skill · Relational-Connective',
    dimension: 'Relational-Connective',
    icon: '/icons/relational-connective.svg',
    avatarBg: '#ede9fe',
    tagBg: '#ede9fe',
    tagColor: '#5b21b6',
    desc: 'Maya is warm, caring, and always the first to notice when someone looks left out. She believes the best things in life happen between people — and she\'s always learning that asking for help is a sign of strength, not weakness.',
    skill: 'Maya teaches us that we don\'t have to face hard things alone. When life gets tough, reaching out to someone we trust — a friend, a family member, a teacher — is one of the most powerful things we can do.',
  },
  {
    name: 'Alex — The Thinker',
    title: 'Thinking Skill · Cognitive-Narrative',
    dimension: 'Cognitive-Narrative',
    icon: '/icons/cognitive-narrative.svg',
    avatarBg: '#e0f2fe',
    tagBg: '#e0f2fe',
    tagColor: '#075985',
    desc: 'Alex loves puzzles, questions, and figuring things out. When a problem seems impossible, Alex slows down, looks at it from a new angle, and finds a way through. Curious and calm, Alex helps us see that most hard things have solutions.',
    skill: 'Alex shows us "flip-it thinking" — when something goes wrong, we can ask "What can I learn here?" or "What can I control?" Changing the way we look at a problem can change everything.',
  },
  {
    name: 'Sam — The Grounder',
    title: 'Body Skill · Somatic-Regulative',
    dimension: 'Somatic-Regulative',
    icon: '/icons/somatic-regulative.svg',
    avatarBg: '#dcfce7',
    tagBg: '#dcfce7',
    tagColor: '#15803d',
    desc: 'Sam is steady and grounded, even when big feelings swirl around. Sam knows that our bodies carry our emotions — and that the fastest way to feel calmer is to start with a breath, a slow walk, or feeling our feet on the floor.',
    skill: 'Sam teaches us to listen to our body\'s signals — like a tight chest or shaky hands — and use simple tools like breathing and movement to come back to calm.',
  },
  {
    name: 'Jordan — The Feeler',
    title: 'Feelings Skill · Emotional-Adaptive',
    dimension: 'Emotional-Adaptive',
    icon: '/icons/emotional-adaptive.svg',
    avatarBg: '#ffe4e6',
    tagBg: '#ffe4e6',
    tagColor: '#be123c',
    desc: 'Jordan feels everything deeply — joy, sadness, worry, and wonder. Instead of hiding feelings, Jordan has learned that naming them is the first step to understanding them. Jordan helps others know that all feelings are okay.',
    skill: 'Jordan shows us that when we name a feeling — "I feel lonely" or "I feel scared" — it loses some of its power over us. Feelings are messengers, not enemies.',
  },
  {
    name: 'River — The Guide',
    title: 'Meaning Skill · Spiritual-Reflective',
    dimension: 'Spiritual-Reflective',
    icon: '/icons/spiritual-reflective.svg',
    avatarBg: '#f0fdf4',
    tagBg: '#d1fae5',
    tagColor: '#065f46',
    desc: 'River is thoughtful, curious about the world, and always looking for the deeper meaning in things. Even when life is confusing, River searches for what matters most — and follows it like a compass pointing north.',
    skill: 'River teaches us that knowing what we care about — our values, what brings us joy, what makes us feel like ourselves — can guide us through hard times and help us find our way back.',
  },
  {
    name: 'Kai — The Builder',
    title: 'Action Skill · Agentic-Generative',
    dimension: 'Agentic-Generative',
    icon: '/icons/agentic-generative.svg',
    avatarBg: '#fef9c3',
    tagBg: '#fef9c3',
    tagColor: '#854d0e',
    desc: 'Kai is brave, determined, and always ready to try. Kai knows the secret to doing big things: start with one tiny step. Even when scared or unsure, Kai keeps moving — because action, however small, is always possible.',
    skill: 'Kai teaches us that we don\'t need to have it all figured out before we begin. One small step, then another, is how every big journey starts. We have more power than we think.',
  },
];

/* ── Stories ── */
export const KIDS_STORIES = [
  {
    icon: '/icons/relational-connective.svg',
    subtitle: 'Relational-Connective · The Connector',
    title: 'Maya and the Mountain of Cardboard',
    preview: 'Maya loves drawing — but she always works alone. When a huge class project threatens to bury her, she discovers that asking for help might be the most powerful thing she can do.',
  },
  {
    icon: '/icons/cognitive-narrative.svg',
    subtitle: 'Cognitive-Narrative · The Thinker',
    title: 'Alex and the Flooded Experiment',
    preview: 'Alex\'s perfectly planned science fair experiment gets wrecked by the wind. With three days left and no backup plan, can he flip the problem into a brand-new discovery?',
  },
  {
    icon: '/icons/somatic-regulative.svg',
    subtitle: 'Somatic-Regulative · The Grounder',
    title: 'Sam and the Big Game',
    preview: 'Sam loves soccer, but before the championship game her body goes haywire — heart racing, hands cold, stomach in knots. Her coach knows a secret: calm starts in the body.',
  },
  {
    icon: '/icons/emotional-adaptive.svg',
    subtitle: 'Emotional-Adaptive · The Feeler',
    title: 'Jordan and the Invisible Knot',
    preview: 'Since Grandma Bea moved away, Jordan has a heavy feeling she can\'t name. When her teacher shows the class a Feelings Wheel, Jordan finds the words — and the knot begins to loosen.',
  },
  {
    icon: '/icons/spiritual-reflective.svg',
    subtitle: 'Spiritual-Reflective · The Guide',
    title: 'River and the Compass',
    preview: 'After moving to a new city, River feels invisible and lost — like nothing matters. A quiet conversation with her dad and a packet of basil seeds help her find her way back to herself.',
  },
  {
    icon: '/icons/agentic-generative.svg',
    subtitle: 'Agentic-Generative · The Builder',
    title: 'Kai and the Six-String Mountain',
    preview: 'Kai has wanted to play guitar for four years — but fear of failing has kept the guitar against the wall. One friend\'s blunt question changes everything: why not just be bad at it first?',
  },
];

export const KIDS_MORE_STORIES = [
  {
    icon: '/icons/relational-connective.svg',
    subtitle: 'Relational-Connective · The Connector · Ages 5–8',
    title: "Jamal's Birthday Party",
    preview: "Jamal's best friend moved away and his birthday is coming up. When he finally tells his teacher he's nervous, he discovers something surprising: saying \"I'm scared\" opens the door to real friendship.",
  },
  {
    icon: '/icons/cognitive-narrative.svg',
    subtitle: 'Cognitive-Narrative · The Thinker · Ages 8–11',
    title: 'Sofia and the Big Test',
    preview: 'Sofia studied so hard for her math test — and still got a C. When she\'s ready to give up, her grandmother shows her the difference between a fixed story and a growing one.',
  },
  {
    icon: '/icons/somatic-regulative.svg',
    subtitle: 'Somatic-Regulative · The Grounder · Ages 11–14',
    title: 'Marcus and Moving Day',
    preview: 'Moving across the country during eighth grade feels like the end of the world to Marcus. His body is stuck in panic mode — until he learns a tool that brings him back every single time.',
  },
  {
    icon: '/icons/emotional-adaptive.svg',
    subtitle: 'Emotional-Adaptive · The Feeler · Ages 7–11',
    title: 'Lily and the Lunch Table',
    preview: "Lily doesn't know why she feels angry every single lunchtime. With help from a school counselor and a simple feelings chart, she uncovers the emotion hiding underneath the anger.",
  },
  {
    icon: '/icons/spiritual-reflective.svg',
    subtitle: 'Spiritual-Reflective · The Guide · Ages 11–15',
    title: "Diego's Dream",
    preview: "Diego wants to be an engineer, but his family needs him to work after school. One conversation with a mentor shows him that values don't disappear when life gets hard — they get stronger.",
  },
  {
    icon: '/icons/agentic-generative.svg',
    subtitle: 'Agentic-Generative · The Builder · Ages 5–8',
    title: 'Zoe and the Swimming Race',
    preview: 'Zoe came in last at her first swim meet and cried all the way home. But when her dad asks one simple question — "What\'s one thing you could do differently?" — something shifts inside her.',
  },
];

/* ── Skill Builders ── */
export const KIDS_SKILL_BUILDERS = [
  {
    icon: '/icons/relational-connective.svg',
    name: 'Ask for Help',
    tag: 'Relational-Connective · The Connector',
    tagBg: '#ede9fe', tagColor: '#5b21b6',
    desc: 'Think of three people you could ask for help — one for schoolwork, one for feelings, and one for fun. Write their names and what makes them a good helper.',
    type: 'reflection',
    fields: [
      { id: 'help-school', label: 'Who helps me with schoolwork or hard problems?' },
      { id: 'help-feelings', label: 'Who can I talk to when I have big feelings?' },
      { id: 'help-fun', label: 'Who makes things feel better and more fun?' },
    ],
    quote: 'The Connector says: You have more helpers than you think. This week, reach out to one of them — even just to say hi.',
    quoteColor: '#5b21b6',
  },
  {
    icon: '/icons/cognitive-narrative.svg',
    name: 'Problem-Solving Challenge',
    tag: 'Cognitive-Narrative · The Thinker',
    tagBg: '#e0f2fe', tagColor: '#075985',
    desc: 'Think of something that isn\'t going the way you wanted. Use "flip-it" thinking to look at it from a new angle and find one step you can take.',
    type: 'reflection',
    fields: [
      { id: 'ps-problem', label: 'What is the problem?' },
      { id: 'ps-control', label: 'What part of this CAN I control?' },
      { id: 'ps-learn', label: 'What could I learn from this?' },
      { id: 'ps-step', label: 'One small step I can take today:' },
    ],
    quote: "The Thinker says: You don't have to solve everything at once. One new angle at a time.",
    quoteColor: '#075985',
  },
  {
    icon: '/icons/emotional-adaptive.svg',
    name: 'Feelings Detective',
    tag: 'Emotional-Adaptive · The Feeler',
    tagBg: '#ffe4e6', tagColor: '#be123c',
    desc: 'Pick the feeling that is closest to what you are feeling right now. Then get a reflection prompt to help you understand it a little better.',
    type: 'emotions',
    emotions: ['Happy', 'Sad', 'Angry', 'Worried', 'Lonely', 'Excited', 'Confused', 'Proud', 'Scared', 'Calm'],
    prompts: {
      happy:   'What made you feel happy today? How can you hold onto that feeling?',
      sad:     'Sadness is okay. What do you need right now — some quiet time, a hug, or to talk to someone?',
      angry:   'Anger has a message. What is it trying to tell you? What would help you feel heard right now?',
      worried: 'Worries feel big, but most things work out. What\'s the one thing you can control about this?',
      lonely:  'Loneliness is real and it hurts. Is there one person you could reach out to today?',
      excited: 'That energy is powerful! How can you channel your excitement into something creative or useful?',
      confused: 'Confusion is just your brain working hard. What\'s one small thing you could do to get more clarity?',
      proud:   'You should be proud! What did you do that made you feel this way? Remember it.',
      scared:  'Fear is normal. Name your fear out loud. Then ask: what\'s the realistic chance of that happening?',
      calm:    'Calm is your natural state. Notice how this feels in your body — you can come back here anytime.',
    },
    quote: 'The Feeler says: All feelings are okay. It\'s what you do with them that matters.',
    quoteColor: '#be123c',
  },
  {
    icon: '/icons/spiritual-reflective.svg',
    name: 'What Matters Most',
    tag: 'Spiritual-Reflective · The Guide',
    tagBg: '#d1fae5', tagColor: '#065f46',
    desc: 'Choose up to three values that feel most like you. Your values are your compass — they help you know what direction to go when things feel confusing.',
    type: 'values',
    values: ['Kindness', 'Family', 'Creativity', 'Nature', 'Learning', 'Fairness', 'Friendship', 'Courage', 'Fun', 'Honesty', 'Adventure', 'Helping Others'],
    quote: 'The Guide says: When something feels hard or wrong, check it against your values. They\'ll help you know what to do.',
    quoteColor: '#065f46',
  },
  {
    icon: '/icons/agentic-generative.svg',
    name: 'One Small Step',
    tag: 'Agentic-Generative · The Builder',
    tagBg: '#fef9c3', tagColor: '#854d0e',
    desc: 'Think of something you\'ve been wanting to do but haven\'t started. Break it into tiny steps. Then commit to just the first one — that\'s all you need.',
    type: 'reflection',
    fields: [
      { id: 'step-goal', label: 'What do I want to do or get better at?' },
      { id: 'step-one', label: 'The tiniest first step I could take (even in 5 minutes):' },
      { id: 'step-when', label: 'When will I do it?' },
    ],
    quote: "The Builder says: You don't need to see the whole staircase. Just take the first step.",
    quoteColor: '#854d0e',
  },
  {
    icon: '/icons/relational-connective.svg',
    name: 'Gratitude Booster',
    tag: 'Relational-Connective · The Connector',
    tagBg: '#ede9fe', tagColor: '#5b21b6',
    desc: 'Think of someone who has helped you or made you smile recently. Write them a short note of thanks — and notice how it feels to say "thank you" on purpose.',
    type: 'reflection',
    fields: [
      { id: 'gratitude-who', label: 'Who am I thanking?' },
      { id: 'gratitude-what', label: 'What did they do that helped me?' },
      { id: 'gratitude-feel', label: 'How did it make me feel?' },
    ],
    quote: 'The Connector says: Gratitude doesn\'t just help the person you thank — it helps you feel more connected and happy too.',
    quoteColor: '#5b21b6',
  },
  {
    icon: '/icons/cognitive-narrative.svg',
    name: 'Thought Reframer',
    tag: 'Cognitive-Narrative · The Thinker',
    tagBg: '#e0f2fe', tagColor: '#075985',
    desc: 'Turn a negative thought into a growth thought. This isn\'t about pretending — it\'s about finding the part of the story you can change.',
    type: 'reflection',
    fields: [
      { id: 'rf-thought', label: 'A thought I keep having:' },
      { id: 'rf-true', label: 'Is this 100% true? What\'s the evidence?' },
      { id: 'rf-reframe', label: 'A growth version of this thought:' },
    ],
    quote: "The Thinker says: You don't have to believe every thought you have. You get to choose which story you grow.",
    quoteColor: '#075985',
  },
  {
    icon: '/icons/somatic-regulative.svg',
    name: 'Body Check-In',
    tag: 'Somatic-Regulative · The Grounder',
    tagBg: '#dcfce7', tagColor: '#15803d',
    desc: 'Your body holds clues about how you\'re really feeling. Take two minutes to notice what your body is telling you right now — no fixing, just noticing.',
    type: 'reflection',
    fields: [
      { id: 'body-head', label: 'My head and face feel:' },
      { id: 'body-chest', label: 'My chest and stomach feel:' },
      { id: 'body-hands', label: 'My hands and arms feel:' },
      { id: 'body-message', label: 'If my body had a message for me right now, it would say:' },
    ],
    quote: "The Grounder says: Your body is always talking. When you listen to it, you can work with it instead of against it.",
    quoteColor: '#15803d',
  },
];
