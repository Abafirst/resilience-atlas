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
