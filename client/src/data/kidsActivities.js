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
    meta: 'Relational-Connective · The Connector · Ages 7–12',
    preview: 'Maya loves drawing — but she always works alone. When a huge class project threatens to bury her, she discovers that asking for help might be the most powerful thing she can do.',
    body: [
      "Maya had a secret: she was terrible at asking for help. It wasn't that she was proud. Well, maybe a little. But mostly she worried — what if people thought she wasn't smart enough? What if they said no and she felt even worse?",
      "So when her teacher, Ms. Rivera, announced a huge project — build a model city out of recycled materials, in teams of three — Maya's stomach did a flip. Not because of the project. Because of the team part.",
      "Maya ended up with Leo and Priya, two kids she barely knew. Leo was quiet and always had earbuds in. Priya carried a color-coded planner. Maya drew in her sketchbook. 'I'll handle the park area,' Maya said on day one, because it felt safest to work alone.",
      "For two weeks, she worked at her kitchen table, surrounded by cardboard rolls, tissue paper, and glue. She made trees out of green pom-poms and benches out of Popsicle sticks. It looked beautiful — but it was only one section, and it was taking forever.",
      "One night, Maya sat in the middle of her mess and cried. There was too much to do. The project was due Friday. She hadn't talked to Leo or Priya in five days.",
      "Her grandmother sat down next to her. 'Tell me,' she said simply. Maya explained — the project, the team, the not-asking. Her grandmother was quiet for a moment. Then she said: 'You know, the strongest spider webs are woven by many threads. One thread alone breaks easily.'",
      "The next morning, Maya texted Leo and Priya: 'Hey. I think I need help. Can we meet today?' Leo replied in two minutes: 'Yes! I've been designing the whole layout on my tablet. I didn't want to bother you.' Priya replied in one: 'FINALLY. I have a full schedule planned. Come over at 4?'",
      "They met at Priya's house. Maya brought her park section. Leo brought his digital blueprint. Priya spread out her schedule on the kitchen table. 'We wasted two weeks not talking,' Leo said. 'We still have five days,' Priya said. 'We've got this.'",
      "And they did. Leo's layout guided where everything went. Priya made sure they stayed on track. Maya's artwork covered every building, bridge, and street corner in color and life. On presentation day, Ms. Rivera paused in front of their city longer than any other. 'This one has a soul,' she told the class.",
      "After school, Maya walked home smiling. She had built something beautiful — not alone, but together. That week, she started a new habit. Every time she felt stuck, she asked herself: Who could help me right now? And then — the scary part — she actually asked.",
    ],
    lesson: "The Connector's Lesson: We don't have to face hard things alone. When things feel too big, reaching out brings people together and makes you stronger than you'd ever be on your own.",
  },
  {
    icon: '/icons/cognitive-narrative.svg',
    subtitle: 'Cognitive-Narrative · The Thinker',
    title: 'Alex and the Flooded Experiment',
    meta: 'Cognitive-Narrative · The Thinker · Ages 8–13',
    preview: 'Alex\'s perfectly planned science fair experiment gets wrecked by the wind. With three days left and no backup plan, can he flip the problem into a brand-new discovery?',
    body: [
      "Alex had been planning his science fair experiment for three weeks. His idea was simple and brilliant (he thought): test which type of soil holds the most water. He'd set up four cups with four different soils, pour the same amount of water into each, and measure how much drained through.",
      "On the day of the experiment, Alex carefully arranged everything on his back porch. Sandy soil. Clay soil. Potting mix. Garden soil from the backyard. He labeled each cup, filled his measuring cup with exactly 100ml of water, and — a sudden gust of wind knocked everything off the table.",
      "All four cups. All four soil samples. Mixed together on the porch floor. Alex stood very still. His science fair was in three days. He had no backup plan.",
      "He went inside, sat on the couch, and stared at the ceiling. His older sister Lena found him there twenty minutes later. 'What happened?' 'Everything's ruined,' he said flatly.",
      "'Okay. Worst case, what could you do?' 'Nothing. Start over. There's no time.' 'What's the fastest experiment you could do instead?' Alex said nothing. 'Come on,' she said. 'You're the problem-solver. What do you know about water and soil that you haven't tested yet?'",
      "Something clicked. Alex sat up slowly. He'd been reading about how plants affect soil drainage. Could plant roots change how fast water drains? He ran to the backyard. He dug up two small plants — a grass clump and a weed — and replanted them in two cups of the same garden soil. He set up a third cup with just soil, no plant.",
      "Then he poured 100ml of water into each and timed how long it took to drain. He ran the test three times. The results surprised him: the grass plant drained water fastest. The bare soil drained slowest. He had a new experiment. And honestly, it was more interesting than the first one.",
      "At the science fair, his display board read: 'Do Plant Roots Change Soil Drainage?' One judge — a real soil scientist from the university — stopped at his table for fifteen minutes. 'What made you choose this angle?' she asked. Alex grinned. 'My first plan didn't work out.' She laughed and wrote something on her judging sheet.",
      "He didn't win first place. But he got a Creativity Award, and the soil scientist gave him her business card. On the drive home, Alex thought about his sister's question: What do you know that you haven't tested yet? It was just a new way of looking at the same problem.",
      "He started keeping that question in his back pocket — for science, for school, for life. When things fall apart, flip the angle.",
    ],
    lesson: "The Thinker's Lesson: When something goes wrong, ask yourself: What can I control? What can I learn? What haven't I tried yet? Changing the angle can turn a problem into a discovery.",
  },
  {
    icon: '/icons/somatic-regulative.svg',
    subtitle: 'Somatic-Regulative · The Grounder',
    title: 'Sam and the Big Game',
    meta: 'Somatic-Regulative · The Grounder · Ages 6–12',
    preview: 'Sam loves soccer, but before the championship game her body goes haywire — heart racing, hands cold, stomach in knots. Her coach knows a secret: calm starts in the body.',
    body: [
      "Sam had been playing soccer since she was five years old. She loved the game — the running, the teamwork, the way time seemed to stop when the ball was at her feet. But today was different. Today was the regional championship, and Sam's body would not cooperate.",
      "From the moment she woke up, something felt wrong. Her heart was beating too fast. Her hands were cold even inside the house. When she ate breakfast, her stomach clenched and she could only manage half a piece of toast. Just nerves, she told herself. Everyone gets nervous.",
      "But by the time the team van pulled into the stadium parking lot, Sam felt dizzy. Her coach, Dani, noticed her sitting apart from the others, staring at the ground. 'Talk to me,' Coach Dani said, sitting beside her. 'I feel sick. Not sick-sick. But like... everything is tight. And shaky.'",
      "Coach Dani nodded. 'Your body is on high alert. It thinks something dangerous is coming. We're going to tell it the truth.' She led Sam to a quiet corner of the locker room and sat across from her.",
      "'Put your feet flat on the floor,' she said. Sam did. 'Feel the ground under your feet. Really feel it. Solid.' Sam pressed her feet down. The floor was cold and real.",
      "'Now breathe in slowly. Count with me: one, two, three, four.' Sam breathed in. 'Hold: one, two. Out slowly: one, two, three, four, five, six.' They did it three times.",
      "'Now,' Coach Dani said, 'notice three things you can see.' Sam looked around. Yellow lockers. A water bottle with a smiley sticker. A poster of the World Cup. 'Three things you can hear.' Sam listened. Distant cheering from outside. Her teammates talking. The hum of the lights.",
      "'Three things you can feel.' The floor under her feet. The bench against the back of her legs. Her own heartbeat — which was slower now. Sam blinked. The dizziness was almost gone. 'What just happened?' she asked.",
      "'You came back into your body,' Coach Dani said. 'Anxiety pulls your mind into the future — all the what-ifs. Grounding brings you back to right now.'",
      "Sam played that game. Their team lost by one goal. But in the second half, when the pressure was highest, she noticed herself starting to spiral — and she did it on her own: feet on the ground, slow breath, look around. She came back every time. On the drive home, her teammate leaned over. 'You looked so calm out there in the second half. How?' Sam smiled. 'I remembered where I was.'",
    ],
    lesson: "The Grounder's Lesson: When your body feels out of control, you can bring it back. Feel your feet on the ground. Breathe slowly. Look around. Your body knows how to calm down — you just have to remind it.",
  },
  {
    icon: '/icons/emotional-adaptive.svg',
    subtitle: 'Emotional-Adaptive · The Feeler',
    title: 'Jordan and the Invisible Knot',
    meta: 'Emotional-Adaptive · The Feeler · Ages 5–10',
    preview: 'Since Grandma Bea moved away, Jordan has a heavy feeling she can\'t name. When her teacher shows the class a Feelings Wheel, Jordan finds the words — and the knot begins to loosen.',
    body: [
      "Jordan was seven, and something was wrong. She just didn't know what to call it.",
      "It started after Grandma Bea moved to Florida. Grandma Bea was the person Jordan called every day after school. She always asked about Jordan's day like it was the most important news in the world. She made the best cocoa with tiny marshmallows and let Jordan stay up an extra hour when she visited.",
      "Now she was far away. And Jordan had a knot in her chest that wouldn't go away. Jordan's mom noticed. 'Are you sad about Grandma?' 'Maybe,' Jordan said. But it didn't feel like just sad. It was more tangled than that.",
      "One afternoon, Jordan's teacher Ms. Okafor pulled out a big colorful chart during circle time. It was called the Feelings Wheel. In the middle was a simple word: sad. Then it branched out into other feelings: lonely, disappointed, heartbroken, left out, empty, lost.",
      "'Sometimes,' Ms. Okafor said, 'we feel something big and we can't find the right word. But feelings need names. When we name a feeling, we're not trapped inside it anymore. We can look at it.' Jordan stared at the wheel. Her finger moved across it slowly.",
      "Lonely. Yes. Disappointed. Yes. Missing. Also yes — but that one wasn't on the chart.",
      "After school, Jordan sat with the chart her teacher had photocopied for everyone and circled three words: lonely, missing, and a little bit scared. That night, her mom found her in her room, still looking at the chart. 'What did you find?' her mom asked.",
      "'I'm not just sad,' Jordan said. 'I'm lonely because Grandma isn't close anymore. And I'm missing — like, missing-her missing. And also a little scared that she might not... be here forever.' Her mom was quiet for a moment. Then she pulled Jordan into a hug. 'Those are real feelings,' she said. 'And they make sense. Want to call Grandma right now and tell her?'",
      "They called Grandma Bea on video. Jordan told her about the Feelings Wheel. 'Oh my sweet girl,' Grandma said, her face filling the screen. 'I have that knot too. Let's not let it stay secret, okay? Let's name it every time.'",
      "They started a new ritual: every Sunday call, they each named one feeling they'd had that week. Jordan still missed Grandma. But the knot loosened a little. Because it had a name. And names, she learned, were the beginning of understanding.",
    ],
    lesson: "The Feeler's Lesson: All feelings are okay — even the hard ones. When we give a feeling a name, it loses some of its power over us. Feelings are messages, not enemies.",
  },
  {
    icon: '/icons/spiritual-reflective.svg',
    subtitle: 'Spiritual-Reflective · The Guide',
    title: 'River and the Compass',
    meta: 'Spiritual-Reflective · The Guide · Ages 9–14',
    preview: 'After moving to a new city, River feels invisible and lost — like nothing matters. A quiet conversation with her dad and a packet of basil seeds help her find her way back to herself.',
    body: [
      "River was eleven when her family moved from a small town in Oregon to a busy city in Texas. Everything was different. The school was three times bigger. The streets were loud and unfamiliar. The kids already had their groups, their inside jokes, their routines.",
      "River had none of that. She sat at the end of long lunch tables feeling invisible. She went through the school days like a gray fog — going where she was told, learning things she couldn't care about, waiting for something to feel like it meant something.",
      "One evening, her dad found her staring out the window. 'What are you looking for?' he asked. 'I don't know,' she said honestly. Her dad sat down. He was quiet for a while. Then he said, 'When explorers were lost at sea, they didn't wait for the land to find them. They looked for a compass point — one true thing to navigate by.'",
      "'That sounds like something from a book.' He smiled. 'It is. But it's also real. What's one thing that, no matter where you are, still feels like you?' River thought about it. For a long time, nothing came. Then: 'Watching things grow. Like plants. I used to grow tomatoes at the old house.' 'Could you do that here?'",
      "She shrugged. 'Maybe.' The next Saturday, River went to a garden center with her dad. She bought a packet of basil seeds and a small clay pot. She set it on her windowsill.",
      "It didn't fix everything. But watching for the first green sprout each morning gave her something to come back to. A tiny anchor.",
      "A few weeks later, she noticed a school flyer for a garden club that met Thursday afternoons. She almost threw it away. Then she thought of the basil. She went. Nervously. Sat near the edge of the group. But the girl next to her leaned over and whispered, 'Have you ever grown anything before?'",
      "'Tomatoes,' River said. 'And basil. You?' 'Sunflowers,' the girl said. 'I'm Deja.' River smiled. Slow. Careful. Real.",
      "She didn't find herself in the new city all at once. But she found a thread — something she cared about — and followed it. That thread led to a club. The club led to Deja. Deja led to other things.",
      "Her dad had been right. You don't find your compass. You look for the one true thing, and it points the way.",
    ],
    lesson: "The Guide's Lesson: When everything feels unfamiliar and hard, look for the one thing that still feels like you. Your values and what you love are your compass — they'll show you which way to go.",
  },
  {
    icon: '/icons/agentic-generative.svg',
    subtitle: 'Agentic-Generative · The Builder',
    title: 'Kai and the Six-String Mountain',
    meta: 'Agentic-Generative · The Builder · Ages 8–14',
    preview: 'Kai has wanted to play guitar for four years — but fear of failing has kept the guitar against the wall. One friend\'s blunt question changes everything: why not just be bad at it first?',
    body: [
      "Kai was twelve years old and had wanted to play guitar since he was eight. He knew what it felt like to want something for a long time without doing anything about it. The guitar sat in his uncle's garage — an old acoustic with scratched wood and six real strings — and every time Kai visited, he looked at it. But he never picked it up.",
      "Because what if he was bad at it? What if he tried and failed and everyone knew? The day his uncle said, 'That guitar's yours if you want it,' Kai carried it home, propped it against his bedroom wall, and then went to do homework.",
      "For two weeks, the guitar just stood there. Then one day Kai's friend Abby came over and spotted it. 'You play?' she asked. 'No.' 'Why not?' 'I don't know how.' She picked it up and strummed it randomly. It made a screechy, untuned sound and she laughed. 'You learn by being bad first,' she said. 'That's how everything works.'",
      "That night, Kai looked up 'beginner guitar, very first lesson' on his tablet. The video was eleven minutes long. He watched it twice. It showed exactly one thing: how to make a G chord. Just one chord. Three fingers on three strings.",
      "He picked up the guitar. His fingers didn't reach right. The strings hurt his fingertips. The sound was buzzy and muted. He tried for fifteen minutes. Then his fingers were sore, so he stopped. But he had made something close to a G chord.",
      "The next day, he tried again. And the day after that. On day five, his G chord finally rang clear. He played it over and over just to hear the sound. 'ONE small step,' he texted Abby. She sent back a hundred fire emojis.",
      "He added a second chord that weekend. Then a third. By the end of the month, he could play a very slow, very imperfect version of his favorite song.",
      "His mom heard it from the kitchen and came to the doorway. 'Was that real?' she asked. 'Kind of,' he said. 'Almost.' She smiled. 'That's how everything starts.'",
      "Kai thought about the guitar standing against the wall for two weeks. All that time, he'd thought he needed to know how to play before he could begin. But that wasn't it. You just needed one chord. One small step. The next one comes after.",
      "He still wasn't very good. But he was better than yesterday. And that, he decided, was exactly enough.",
    ],
    lesson: "The Builder's Lesson: You don't need to be ready before you begin. You just need one small step. The next step will come after — but only if you start.",
  },
];

export const KIDS_MORE_STORIES = [
  {
    icon: '/icons/relational-connective.svg',
    subtitle: 'Relational-Connective · The Connector · Ages 5–8',
    title: "Jamal's Birthday Party",
    meta: "Relational-Connective · The Connector · Ages 5–8",
    preview: "Jamal's best friend moved away and his birthday is coming up. When he finally tells his teacher he's nervous, he discovers something surprising: saying \"I'm scared\" opens the door to real friendship.",
    body: [
      "Jamal's birthday was in two weeks, and this year was supposed to be different. His best friend Omar had always been at every birthday — every single one since they were three years old. But last summer, Omar's family moved to another city. Now there was a Jamal-shaped hole in the friend group.",
      "Jamal sat at the kitchen table, staring at a blank birthday invitation. His mom had bought a pack of ten. Ten. That meant ten friends. Jamal could only think of maybe four kids he kind of knew.",
      "He put the invitations in his backpack and didn't hand any out for three days.",
      "On Wednesday, his teacher Ms. Kim noticed he was quiet. 'Everything okay?' she asked after class. Jamal shrugged. Then, because she waited, he finally said: 'My birthday's coming up and I don't really have friends here yet. I'm scared the party will be sad.'",
      "Ms. Kim nodded slowly. 'That took courage to say,' she told him. 'Can I ask — is there anyone in class you've had fun talking to, even just once?' Jamal thought about it. There was Marcus, who always had good ideas during art. And Priya, who made him laugh once when they were in the lunch line.",
      "'What if,' Ms. Kim said, 'instead of ten people, you invited just two? And you planned something you'd actually love to do?' Jamal thought about it. He loved building with Legos. What if they just... built something together?",
      "He handed Marcus and Priya invitations the next day. He told them: 'It's small. We're going to build Lego things. You don't have to come if you don't want.' Both of them said yes before he finished the sentence.",
      "On Saturday, the three of them spent two hours building a spaceship, a submarine, and something that was maybe a hospital or maybe a robot. Jamal laughed so hard his stomach hurt. When Marcus left, he said: 'Same time next month?'",
      "That night, Jamal found a birthday card in his room from Omar, mailed from across the country. 'Happy birthday, best friend. Hope you find new people who are almost as cool as me. 😂 Miss you.'",
      "Jamal smiled and put it on his desk. He had asked for help. He had been honest. And he had two new friends — and one very good old one.",
    ],
    lesson: "The Connector's Lesson: Saying \"I'm scared\" or \"I need help\" isn't weak — it's how real connections begin. Start with one honest conversation, and see what grows.",
  },
  {
    icon: '/icons/cognitive-narrative.svg',
    subtitle: 'Cognitive-Narrative · The Thinker · Ages 8–11',
    title: 'Sofia and the Big Test',
    meta: 'Cognitive-Narrative · The Thinker · Ages 8–11',
    preview: 'Sofia studied so hard for her math test — and still got a C. When she\'s ready to give up, her grandmother shows her the difference between a fixed story and a growing one.',
    body: [
      "Sofia had been studying for the math test all week. Every night: flashcards, practice problems, her mom quizzing her at the dinner table. She went to bed the night before feeling ready.",
      "She got a C-minus.",
      "On the drive home, Sofia sat in the back seat with the test face-down on her lap. Her hands felt cold. 'I studied so hard,' she finally said. 'It doesn't matter.'",
      "Her abuela was visiting that week. That night at dinner, she asked Sofia how school was. Sofia told her. 'I worked and worked and it made no difference. Maybe I'm just not a math person.'",
      "Abuela was quiet for a moment. Then she said: 'When I was your age, I believed I was not a sewing person. For years. Do you know what changed?' Sofia shook her head. 'I stopped telling myself the story that I couldn't, and started asking: what haven't I tried yet?'",
      "'But I tried everything.' 'Did you? Or did you try harder at the same things?' Abuela leaned forward. 'There is a difference between working hard and working differently. One repeats. One discovers.'",
      "Sofia thought about that. She had done the same flashcards, the same problems. She had never asked why she kept getting the same type of question wrong.",
      "The next week, instead of just drilling answers, Sofia wrote down every problem she got wrong and asked: why did I miss this one? She found a pattern — she always made errors when converting fractions. She watched a video on just that. She practiced just that.",
      "The next test: B-plus. Not perfect. But different. And she knew why.",
      "That night, Abuela hugged her. 'You didn't just work harder,' she said. 'You worked like a thinker. Welcome to the best club there is.'",
    ],
    lesson: "The Thinker's Lesson: When something isn't working, don't just try harder — try differently. Ask: what haven't I noticed yet? The answer is usually in the question you haven't asked.",
  },
  {
    icon: '/icons/somatic-regulative.svg',
    subtitle: 'Somatic-Regulative · The Grounder · Ages 11–14',
    title: 'Marcus and Moving Day',
    meta: 'Somatic-Regulative · The Grounder · Ages 11–14',
    preview: 'Moving across the country during eighth grade feels like the end of the world to Marcus. His body is stuck in panic mode — until he learns a tool that brings him back every single time.',
    body: [
      "Marcus had lived in the same house, gone to the same school, and walked the same four blocks to the corner store every Saturday for his whole life. Then his dad got a new job and they moved — across the country — the summer before eighth grade.",
      "The new school was bigger. The hallways were wider but felt tighter somehow. Everyone had their groups, their jokes, their shorthand. Marcus felt like he was watching from behind glass.",
      "The worst part wasn't the loneliness. It was what his body did. Every morning before school, his chest felt like someone was sitting on it. His hands went cold and sweaty at the same time. In the middle of class, he sometimes couldn't hear what the teacher was saying because there was a low hum in his ears.",
      "He didn't know what panic was. He just thought something was wrong with him.",
      "A school counselor named Mr. Osei noticed Marcus sitting outside the cafeteria one day instead of eating. He asked if Marcus wanted to talk. Marcus said no. Mr. Osei said: 'That's fine. We can just sit.'",
      "They sat for a while. Then Mr. Osei said: 'Can I show you something? It's a trick my track coach taught me.' He put both feet flat on the floor. 'Feel the ground. Solid, right?' Marcus nodded. 'Now breathe in — four counts — then out — six counts. Slow.' They did it together.",
      "'Now name five things you see.' Marcus looked around. Blue lockers. A scuff on the floor. A poster about clubs. A water fountain. Mr. Osei's sneakers. 'Good. That thing you just did — it's called grounding. Your body was stuck in alarm mode. We just turned it down a notch.'",
      "Marcus used it every morning before entering the building. Just two minutes: feet on pavement, slow breath, five things he could see. The hum got quieter. The chest loosened.",
      "He still missed home. He still had hard days. But now, when his body went into alarm mode, he had a way back. He wasn't at the mercy of his own nervous system anymore.",
      "By October, Marcus had joined the track team. Not because he was fast, but because Mr. Osei had mentioned it. 'Running is the original grounding tool,' he'd said. 'Try it.' Marcus tried it. He found he wasn't bad.",
    ],
    lesson: "The Grounder's Lesson: When your body goes into alarm mode, you can bring it back. Feet on the ground, slow breath, look around. You are here. You are okay. That's where recovery begins.",
  },
  {
    icon: '/icons/emotional-adaptive.svg',
    subtitle: 'Emotional-Adaptive · The Feeler · Ages 7–11',
    title: 'Lily and the Lunch Table',
    meta: 'Emotional-Adaptive · The Feeler · Ages 7–11',
    preview: "Lily doesn't know why she feels angry every single lunchtime. With help from a school counselor and a simple feelings chart, she uncovers the emotion hiding underneath the anger.",
    body: [
      "Every day at lunch, Lily felt angry. Not kind of angry — genuinely, fully angry. She didn't know why. Nothing specific happened. It was just always there, sitting on her chest like a heavy stone, from the moment she walked into the cafeteria.",
      "One day she snapped at her friend Camille for taking the last chocolate milk. Camille cried. Lily felt terrible. 'I don't know why I did that,' she said afterward. And she meant it.",
      "Her school counselor, Ms. Park, had been told about what happened. She asked Lily to come in during free reading time. 'I heard lunch was hard,' she said, without making it sound like Lily was in trouble.",
      "'I keep getting angry at lunch,' Lily admitted. 'But nothing bad even happens.' 'Hmm,' Ms. Park said. She pulled out a big feelings wheel — a circle with lots of words arranged in layers. 'Let's look at this. Anger is usually on top of something else. What's underneath the anger?'",
      "Lily stared at the wheel. Frustrated. Excluded. Invisible. Worried. She pointed slowly to 'invisible.' 'I feel invisible at lunch,' she said. 'I sit with the same people every day but nobody talks to me about anything real. I feel like I could disappear and nobody would notice.'",
      "That was different from anger. Anger had felt like fire. This felt like cold fog. But it was more true.",
      "Ms. Park helped Lily see that the anger was a signal — a message that something underneath was hurting. 'Anger isn't bad,' she said. 'It's your body saying: something isn't right. The question is, what? Once you know what, you can actually do something about it.'",
      "That week, Lily tried something different at lunch. She asked Camille one real question: 'What's the best thing that happened to you this week?' Camille paused, surprised. Then told her about her dog learning a new trick. They talked for the whole lunch.",
      "The invisible feeling got a little smaller. The anger got quieter. And Lily started keeping a small notebook where she could write what she actually felt — not just the first, biggest feeling, but the one underneath it.",
      "Feelings, she was learning, were like onions. There was always another layer.",
    ],
    lesson: "The Feeler's Lesson: Anger is often a cover for a deeper feeling — sadness, loneliness, fear, or something else that needs attention. When you find the feeling underneath, you find the real message.",
  },
  {
    icon: '/icons/spiritual-reflective.svg',
    subtitle: 'Spiritual-Reflective · The Guide · Ages 11–15',
    title: "Diego's Dream",
    meta: "Spiritual-Reflective · The Guide · Ages 11–15",
    preview: "Diego wants to be an engineer, but his family needs him to work after school. One conversation with a mentor shows him that values don't disappear when life gets hard — they get stronger.",
    body: [
      "Diego had wanted to be an engineer since the fourth grade. He loved how things worked — how bridges held up thousands of cars, how circuits moved electricity, how a code could tell a machine what to do. He had a notebook full of drawings and plans. His teachers said he had a gift.",
      "But Diego's family didn't have money. His dad worked long hours at a restaurant. His older sister was applying to college and there was talk about how to pay for it. When Diego turned thirteen, his dad asked if he could help out on weekends at the restaurant. Just for a while. Just until things settled.",
      "Diego said yes. He was good at that — saying yes when he needed to say it. But inside, something tightened. He worried that \"just for a while\" could become forever. He worried that his notebook would just stay a notebook.",
      "His mentor at the after-school program was a woman named Dr. Reyes — a real engineer who came in every Tuesday to work with students. One afternoon, Diego told her what was happening. 'I feel like I'm choosing between my family and my dream,' he said.",
      "Dr. Reyes was quiet for a moment. Then: 'Can I ask you something? What do you actually value most in your life?' Diego thought. 'Family. And... making things. Building things. Solving problems.' 'Interesting,' she said. 'Those aren't in conflict. One just feels urgent right now.'",
      "'The thing about values,' she continued, 'is that they don't disappear when life gets hard. They get tested. And the way you respond — helping your family, staying committed — that IS the engineering mindset. Every engineer I've ever met learned to solve problems with limited resources.'",
      "She helped Diego apply for a Saturday STEM program — free, transportation provided, only four hours a week. He still worked Sundays. He still helped his family. But he had a place where the notebook could grow.",
      "The program led to a summer internship. The internship led to a scholarship application. None of it happened in a straight line. But his values — family and building things — never pointed in different directions. They just required creativity to honor both at once.",
      "Diego put a quote on his notebook: 'The obstacle is the way.' He wasn't sure he fully believed it yet. But he was starting to.",
    ],
    lesson: "The Guide's Lesson: Your values don't disappear when life gets hard — they get tested. When you know what you truly care about, you find creative ways to honor it, even in difficult circumstances.",
  },
  {
    icon: '/icons/agentic-generative.svg',
    subtitle: 'Agentic-Generative · The Builder · Ages 5–8',
    title: 'Zoe and the Swimming Race',
    meta: 'Agentic-Generative · The Builder · Ages 5–8',
    preview: 'Zoe came in last at her first swim meet and cried all the way home. But when her dad asks one simple question — "What\'s one thing you could do differently?" — something shifts inside her.',
    body: [
      "Zoe was six years old, and she came in last.",
      "It was her first real swim meet. Not practice. Not a game. A real meet, with whistles and timers and parents in the stands. Zoe had practiced for months. She could do freestyle, backstroke, and almost-breaststroke. She was ready.",
      "She was not ready.",
      "In the water, everything went wrong. She swallowed a mouthful. She lost count of her strokes. The girl in the next lane finished so fast it seemed like she was using rocket boots. When Zoe touched the wall and looked up, everyone else was already out of the pool.",
      "She cried the whole drive home. Her chin was on her chest and she didn't look out the window once.",
      "Her dad let her cry for a while. He didn't say 'you did great' because she hadn't. He didn't say 'it doesn't matter' because it did. When they got home and had hot chocolate, he just asked one question:",
      "'What's one thing you could do differently next time?'",
      "Zoe thought about it for a long time. She sniffled. 'Maybe... practice turning at the wall. I kept missing it.' 'Good,' her dad said. 'That's one thing.' 'And breathe better. I breathed too much.' 'Two things. See? You already know what to work on.'",
      "That night, Zoe got out a piece of paper and drew two swimmers. The first one: last place, crying. The second one: practicing wall turns. Under the second one she wrote: ME NEXT TIME.",
      "She put it on the refrigerator. Every morning for three weeks, she looked at it before school.",
      "At the next swim meet, she still didn't win. But she didn't come in last. And she turned at the wall — both times — exactly right. She touched the wall and looked up, and her dad was cheering from the stands like she'd won the whole thing.",
      "Because for her, she had.",
    ],
    lesson: "The Builder's Lesson: Losing isn't the end — it's the beginning of learning. When something goes wrong, ask: what's one thing I can do differently? That one thing is enough to start.",
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
