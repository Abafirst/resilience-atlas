/**
 * Resilience Atlas — Teams Content Database
 * Centralized data for team-building activities, handouts, and visual resources.
 */

export const TEAMS_CONTENT = {

  /* ══════════════════════════════════════════════════════════════════════════
     ACTIVITIES  (20+ across 6 dimensions)
  ══════════════════════════════════════════════════════════════════════════ */
  activities: [

    // ── Connection / Relational-Connective ──────────────────────────────────
    {
      id: 'act-001',
      title: 'Trust Circle Exercise',
      dimension: 'connection',
      dimensionLabel: 'Connection',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '15 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Build interpersonal trust through structured, low-risk sharing.',
      instructions: 'Arrange participants in a circle. Each person completes two prompts in turn: "One thing most people don\'t know about me…" and "One thing I need from my teammates…". Facilitator models vulnerability first.',
      materials: ['Open space or chairs in a circle', 'Optional: talking object'],
      facilitationTips: [
        'Start with yourself to model psychological safety.',
        'Remind participants there are no wrong answers.',
        'Watch for discomfort and gently redirect if sharing becomes too personal.',
        'Allow silence — it signals people are thinking, not disengaged.'
      ],
      reflectionPrompts: [
        'What surprised you about what you heard?',
        'How might knowing this about each other change how you work together?',
        'What one word describes how you feel right now compared to when we started?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Break into circles of 8–10, then share highlights with the full group.' },
        { size: 'Remote teams', note: 'Use a virtual circle in Zoom/Teams breakout rooms; use the chat box for sharing.' }
      ],
      printable: true
    },
    {
      id: 'act-002',
      title: 'Support Mapping',
      dimension: 'connection',
      dimensionLabel: 'Connection',
      teamSize: ['10-30'],
      duration: '20 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Identify internal and external support networks and strengthen connection.',
      instructions: 'Each person draws three concentric circles on paper. The innermost = people they turn to first; middle = people who help sometimes; outer = broader community. Participants share one insight from their map in pairs, then discuss as a team.',
      materials: ['Blank paper', 'Pens/markers'],
      facilitationTips: [
        'Emphasize this is personal — sharing is optional.',
        'Prompt: "Are there any gaps in your inner circle you\'d like to fill?"',
        'Debrief around team implications: how can the team be a stronger support?'
      ],
      reflectionPrompts: [
        'Who in this room could be a stronger resource for you?',
        'What gets in the way of asking for support?',
        'What one thing could we do as a team to strengthen our inner circle?'
      ],
      variations: [
        { size: 'Small teams (5-10)', note: 'Share full maps with the group for richer discussion.' }
      ],
      printable: true
    },
    {
      id: 'act-003',
      title: 'Peer Listening Pairs',
      dimension: 'connection',
      dimensionLabel: 'Connection',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '25 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Build empathy and psychological safety through structured deep listening.',
      instructions: 'Pair participants. Partner A speaks for 4 minutes on "a current challenge I\'m navigating." Partner B listens without interrupting, then reflects back for 2 minutes (no advice, just "I heard you say…"). Switch. Full group debrief on the experience.',
      materials: ['Timer'],
      facilitationTips: [
        'Explicitly coach listeners: no advice, no fixing — just listening.',
        'After exercise, ask: "How did it feel to be truly heard?"',
        'Normalize that this feels unusual — it\'s not how we typically interact.'
      ],
      reflectionPrompts: [
        'What did it feel like to be listened to without advice?',
        'What was hard about listening without responding?',
        'How could we bring more of this into our regular conversations?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use breakout rooms; set a visible timer in chat.' }
      ],
      printable: true
    },
    {
      id: 'act-004',
      title: 'Team Story Circle',
      dimension: 'connection',
      dimensionLabel: 'Connection',
      teamSize: ['10-30'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'intermediate',
      objective: 'Build vulnerability and trust by sharing stories of interdependence.',
      instructions: 'Each participant shares a brief story (2 min) about a time they asked for help or someone showed up for them unexpectedly. Facilitator notes themes. Group discusses what the stories reveal about the team\'s culture of support.',
      materials: ['Story prompt cards (optional)', 'Flip chart to note themes'],
      facilitationTips: [
        'Frame stories as gifts — not performances.',
        'Thank each storyteller specifically.',
        'Look for recurring themes: trust, timing, courage to ask.'
      ],
      reflectionPrompts: [
        'What pattern do you notice across our stories?',
        'What does this tell us about who we are as a team?',
        'How do we want to grow our capacity for asking for and giving help?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Use small groups of 5-6 for story sharing, then share one story per group with the full team.' }
      ],
      printable: true
    },
    {
      id: 'act-005',
      title: 'Relationship Mapper',
      dimension: 'connection',
      dimensionLabel: 'Connection',
      teamSize: ['5-10', '10-30'],
      duration: '20 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Visually map team relationships and identify strength gaps.',
      instructions: 'Create a visual map on a whiteboard with team member names. Draw lines between people who collaborate regularly (solid) and occasionally (dashed). Identify clusters, gaps, and isolated nodes. Discuss what the map reveals and what you\'d like to change.',
      materials: ['Whiteboard or large paper', 'Markers'],
      facilitationTips: [
        'Make it collaborative — everyone contributes lines.',
        'Note isolated individuals without blame or shame.',
        'Focus on structural opportunities, not individual failures.'
      ],
      reflectionPrompts: [
        'Who is most connected? Who might feel most isolated?',
        'Are there collaboration opportunities we\'re missing?',
        'What\'s one relationship we could intentionally strengthen this month?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a virtual whiteboard (Miro, FigJam) with sticky notes.' }
      ],
      printable: true
    },

    // ── Thinking / Cognitive-Narrative ─────────────────────────────────────
    {
      id: 'act-006',
      title: 'Perspective Gallery Walk',
      dimension: 'thinking',
      dimensionLabel: 'Thinking',
      teamSize: ['10-30', '30-50'],
      duration: '25 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Challenge thinking patterns by viewing a shared problem from multiple angles.',
      instructions: 'Post 4-6 large papers around the room, each with a different lens written at the top (e.g., Customer, Skeptic, Optimist, Researcher, Future Self). Teams rotate and add sticky notes from each perspective. Debrief on what surprised them.',
      materials: ['Large paper/flip chart pages', 'Sticky notes', 'Markers', 'Wall space'],
      facilitationTips: [
        'Encourage wild ideas — there are no wrong perspectives.',
        'Prompt quiet participants to add at least one note per station.',
        'Look for contradictions — they often contain the most insight.'
      ],
      reflectionPrompts: [
        'Which perspective was hardest to inhabit? Why?',
        'What did you notice that you hadn\'t considered before?',
        'How might we use multiple perspectives more deliberately in our work?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a virtual whiteboard with labelled zones; use timers for rotation.' }
      ],
      printable: true
    },
    {
      id: 'act-007',
      title: 'Assumption Audit',
      dimension: 'thinking',
      dimensionLabel: 'Thinking',
      teamSize: ['5-10', '10-30'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'intermediate',
      objective: 'Surface hidden assumptions in team decisions and practice perspective-shifting.',
      instructions: 'Present a recent team decision. Each person individually lists 5 assumptions that underpin that decision. Share and cluster assumptions. For each cluster, ask: "What if the opposite were true?" Discuss implications.',
      materials: ['Sticky notes', 'Pens', 'A real recent decision to examine'],
      facilitationTips: [
        'Pick a safe, past decision — not a contentious current one for the first time.',
        'Normalize that assumptions aren\'t errors — they\'re human.',
        'Focus on learning, not blame.'
      ],
      reflectionPrompts: [
        'Which assumption surprised you most?',
        'What decisions might we make differently given what we uncovered?',
        'How could we build assumption-checking into our regular process?'
      ],
      variations: [
        { size: 'Small teams (5-10)', note: 'Go deeper on fewer assumptions rather than breadth.' }
      ],
      printable: true
    },
    {
      id: 'act-008',
      title: 'Narrative Reframing Workshop',
      dimension: 'thinking',
      dimensionLabel: 'Thinking',
      teamSize: ['10-30'],
      duration: '40 min',
      durationCategory: 'long',
      difficulty: 'advanced',
      objective: 'Transform limiting team stories into growth-oriented narratives.',
      instructions: 'Identify a "stuck story" the team tells about itself (e.g., "We always struggle with X"). In small groups, explore: What\'s true about this story? What\'s missing? What\'s possible? Write a new "possibility story" and share with the full group.',
      materials: ['Flip chart', 'Markers', 'Worksheet: Story Reframe Template'],
      facilitationTips: [
        'Honor the pain in the old story before pivoting.',
        'New stories should be honest, not falsely positive.',
        'Ground new narratives in specific evidence, not wishful thinking.'
      ],
      reflectionPrompts: [
        'What would change if we lived from the new story instead of the old one?',
        'Who or what has reinforced our old story?',
        'How will we remind ourselves of the new story when the old one resurfaces?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Work on different stuck stories in parallel small groups; share outcomes.' }
      ],
      printable: true
    },
    {
      id: 'act-009',
      title: 'Critical Thinking Challenge',
      dimension: 'thinking',
      dimensionLabel: 'Thinking',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '20 min',
      durationCategory: 'short',
      difficulty: 'intermediate',
      objective: 'Practice collaborative reasoning to solve complex problems.',
      instructions: 'Present a realistic but fictional workplace dilemma. Teams have 10 minutes to analyze it using a structured framework: What do we know? What do we assume? What do we need to find out? What are 3 possible paths forward? Groups compare reasoning.',
      materials: ['Printed or projected dilemma scenario', 'Worksheet: Critical Thinking Frame'],
      facilitationTips: [
        'Choose a dilemma relevant to your team\'s actual challenges.',
        'Celebrate process, not just conclusions.',
        'Ask teams to compare their reasoning, not just their answers.'
      ],
      reflectionPrompts: [
        'Where did we get stuck? What helped us move forward?',
        'What reasoning patterns do we tend to rely on?',
        'How could we improve our collective thinking process?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Breakout rooms for analysis, main room for comparison.' }
      ],
      printable: true
    },
    {
      id: 'act-010',
      title: 'Future Visioning',
      dimension: 'thinking',
      dimensionLabel: 'Thinking',
      teamSize: ['10-30', '30-50'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'beginner',
      objective: 'Build shared vision of an ideal future and plan the pathway forward.',
      instructions: 'Guide team through a brief visualization (eyes closed, 2 min): Imagine your team 2 years from now at its very best. What do you see? Hear? Feel? Participants draw or write their vision, share in pairs, then create a collective "vision mural" capturing shared themes.',
      materials: ['Blank paper', 'Markers', 'Large paper for mural', 'Soft music (optional)'],
      facilitationTips: [
        'Give permission to dream without constraint.',
        'Notice what themes appear across multiple visions — these are signals of shared values.',
        'Connect vision to current actions: "What\'s one step toward this future?"'
      ],
      reflectionPrompts: [
        'What elements of this vision most energize you?',
        'What would have to be true for this vision to become real?',
        'What is one thing we can do this week that moves us closer?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Use breakout groups to create vision posters; gallery walk to see all visions.' }
      ],
      printable: true
    },

    // ── Action / Agentic-Generative ────────────────────────────────────────
    {
      id: 'act-011',
      title: 'Goal-Setting Workshop',
      dimension: 'action',
      dimensionLabel: 'Action',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '45 min',
      durationCategory: 'long',
      difficulty: 'intermediate',
      objective: 'Set SMART team and individual goals and build accountability structures.',
      instructions: 'Start with a 5-min review of team purpose. Each person sets 1 team goal and 1 personal goal using the SMART framework (handout provided). Share goals in pairs for accountability. Create a team goal wall. Establish a check-in cadence.',
      materials: ['SMART Goal Worksheet', 'Sticky notes', 'Goal Wall (large paper)', 'Markers'],
      facilitationTips: [
        'Distinguish between outcome goals and process goals.',
        'Pair people strategically for accountability — across different roles.',
        'Build in a follow-up date before people leave the room.'
      ],
      reflectionPrompts: [
        'What makes this goal meaningful to you personally?',
        'What obstacles can you predict, and how will you handle them?',
        'Who will you tell about this goal to increase your commitment?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a shared digital document; pairs connect in breakout rooms.' }
      ],
      printable: true
    },
    {
      id: 'act-012',
      title: 'Habit Building Challenge',
      dimension: 'action',
      dimensionLabel: 'Action',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: 'Ongoing (30 days)',
      durationCategory: 'long',
      difficulty: 'intermediate',
      objective: 'Create team habits for resilience and track progress over 30 days.',
      instructions: 'Each team member chooses one small resilience habit (e.g., daily 2-min reflection, weekly peer check-in). Use the 30-Day Habit Tracker to log daily. Weekly team check-ins (5 min) to share wins and challenges. Celebrate at 30 days.',
      materials: ['30-Day Habit Tracker (printable)', 'Weekly check-in agenda'],
      facilitationTips: [
        'Emphasize: habits should be tiny (under 2 min at first).',
        'Make progress visible — post tracker somewhere the team sees it.',
        'Celebrate streaks AND recovery from breaks — consistency over perfection.'
      ],
      reflectionPrompts: [
        'What did you notice when you stuck with the habit? When you didn\'t?',
        'What helped you most to maintain it?',
        'How has this habit affected your team interactions?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a shared digital tracker (spreadsheet or app); post wins in team chat.' }
      ],
      printable: true
    },
    {
      id: 'act-013',
      title: 'Decision-Making Framework',
      dimension: 'action',
      dimensionLabel: 'Action',
      teamSize: ['10-30'],
      duration: '25 min',
      durationCategory: 'short',
      difficulty: 'intermediate',
      objective: 'Practice structured decision-making and build confidence in team choices.',
      instructions: 'Use a real pending team decision. Apply the WRAP framework: Widen options, Reality-test assumptions, Attain distance (consider future self), Prepare to be wrong. Teams work through each step together, then compare their output to their intuitive first choice.',
      materials: ['WRAP Decision Framework Worksheet', 'The actual decision to analyze'],
      facilitationTips: [
        'The goal is process improvement, not a perfect decision.',
        'Let teams sit with uncertainty — resist providing the "right" answer.',
        'Ask: "How confident are we now vs. before this process?"'
      ],
      reflectionPrompts: [
        'What did the framework reveal that intuition missed?',
        'Which step was hardest for our team?',
        'How might we use this process for future decisions?'
      ],
      variations: [
        { size: 'Small teams (5-10)', note: 'Work through a decision that affects all members directly.' }
      ],
      printable: true
    },
    {
      id: 'act-014',
      title: 'Project Planning Sprint',
      dimension: 'action',
      dimensionLabel: 'Action',
      teamSize: ['5-10', '10-30'],
      duration: '60 min',
      durationCategory: 'long',
      difficulty: 'advanced',
      objective: 'Plan a complex project with clear action items, roles, and momentum.',
      instructions: 'Start with a 5-min goal alignment. Teams use a planning canvas: Purpose, Success Metrics, Key Actions, Owners, Timeline, Risks, First Step. Fill in each section collaboratively. End with each person stating their first action aloud.',
      materials: ['Project Planning Canvas (large format)', 'Markers', 'Sticky notes', 'Timer'],
      facilitationTips: [
        'Keep early sections brief — spend most time on actions and owners.',
        'Don\'t let planning become a substitute for doing. Close with commitments.',
        'The "First Step" section is the most important — make it happen within 24 hours.'
      ],
      reflectionPrompts: [
        'What\'s the biggest risk we haven\'t planned for?',
        'Who is most excited? How do we leverage that energy?',
        'What would make this planning session a success, looking back?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a shared virtual canvas (Miro, Notion, or similar).' }
      ],
      printable: true
    },
    {
      id: 'act-015',
      title: 'Rapid Experimentation',
      dimension: 'action',
      dimensionLabel: 'Action',
      teamSize: ['5-10', '10-30'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'intermediate',
      objective: 'Test new approaches quickly and build a culture of learning from iteration.',
      instructions: 'Identify one thing the team wants to try differently. Design a small experiment using the format: Hypothesis / Method / How we\'ll know it worked / Time to try. Teams run the experiment within the next week, then debrief results.',
      materials: ['Experiment Design Card (printable)', 'Markers'],
      facilitationTips: [
        'Experiments fail — that\'s the point. Normalize that.',
        'Keep experiments small enough to complete in one week.',
        'Celebrate learning, even from failed experiments.'
      ],
      reflectionPrompts: [
        'What did we learn, regardless of outcome?',
        'What would we do differently next time?',
        'What new experiment does this inspire?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Multiple teams run parallel experiments and compare learnings.' }
      ],
      printable: true
    },

    // ── Feeling / Emotional-Adaptive ───────────────────────────────────────
    {
      id: 'act-016',
      title: 'Emotional Safety Workshop',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      teamSize: ['5-10', '10-30'],
      duration: '35 min',
      durationCategory: 'medium',
      difficulty: 'intermediate',
      objective: 'Build psychological safety and practice emotional awareness as a team.',
      instructions: 'Begin with a brief overview of psychological safety. In pairs, discuss: "When do you feel safest to speak up? When do you hold back?" Share themes. Create a "Team Safety Commitments" list together — concrete behaviors the team agrees to practice.',
      materials: ['Flip chart', 'Markers', 'Psychological Safety Overview handout'],
      facilitationTips: [
        'This activity requires genuine safety to discuss safety — model openness first.',
        'Focus on behaviors, not feelings (feelings are valid; behaviors are actionable).',
        'Have the team sign the commitments poster — make them tangible.'
      ],
      reflectionPrompts: [
        'What one behavior, if everyone practiced it, would most increase our safety?',
        'What do you personally commit to doing differently?',
        'How will we hold each other accountable to these commitments?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use anonymous polling for initial safety check before open discussion.' }
      ],
      printable: true
    },
    {
      id: 'act-017',
      title: 'Stress Response Mapping',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'beginner',
      objective: 'Identify team stress signals and create team protocols for collective support.',
      instructions: 'Individually list personal stress signals (physical, emotional, behavioral) and what helps. Share in small groups. Together, create a "Team Stress Protocol" — what signals tell us someone needs support, and what we\'ll do about it.',
      materials: ['Stress Signal Worksheet', 'Flip chart for Team Protocol'],
      facilitationTips: [
        'Normalize stress — everyone has it.',
        'Focus on observable signals rather than internal states.',
        'The protocol should be specific: "If X, then Y" — not vague promises.'
      ],
      reflectionPrompts: [
        'What stress signal are you most likely to miss in yourself? In others?',
        'What prevents us from asking for help when stressed?',
        'How will we revisit and update our protocol over time?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Create departmental protocols, then share across teams.' }
      ],
      printable: true
    },
    {
      id: 'act-018',
      title: 'Collective Calming Practice',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '20 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Practice a shared wellness ritual that the team can use together and independently.',
      instructions: 'Guide the team through three calming practices (5 min each): (1) Box breathing together, (2) Progressive muscle release (shoulders, hands, jaw), (3) Gratitude share (one thing each). Debrief: which felt most useful? When could we use this together?',
      materials: ['Calming Practice Guide handout', 'Optional: timer/soft music'],
      facilitationTips: [
        'Keep it optional — some people don\'t feel comfortable with body practices in groups.',
        'Model each practice yourself rather than just instructing.',
        'Let silence be comfortable — don\'t fill it with chatter.'
      ],
      reflectionPrompts: [
        'Which practice felt most accessible for you?',
        'When in our work day/week might we use this as a team?',
        'What does it mean to take care of our collective energy together?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Works well on video call — ask participants to turn cameras on.' }
      ],
      printable: true
    },
    {
      id: 'act-019',
      title: 'Conflict Navigation Skill-Builder',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      teamSize: ['10-30'],
      duration: '45 min',
      durationCategory: 'long',
      difficulty: 'advanced',
      objective: 'Practice difficult conversations and build healthy conflict resolution skills.',
      instructions: 'Introduce a 3-step conflict framework: (1) Name the impact without blame, (2) Listen for the intent, (3) Create a joint plan. Practice in triads using a low-stakes scenario. Debrief what was hard and what helped.',
      materials: ['Conflict Framework card', 'Scenario scripts (printable)', 'Observer guide'],
      facilitationTips: [
        'Use fictional scenarios — NOT real team conflicts for practice.',
        'Observer role is critical: they provide neutral reflection.',
        'Debrief emotions as well as technique.'
      ],
      reflectionPrompts: [
        'What part of the framework felt most natural? Most challenging?',
        'How might this change how you handle conflict going forward?',
        'What do we need from each other to make this safe in real situations?'
      ],
      variations: [
        { size: 'Small teams (5-10)', note: 'Use real (but low-stakes) team tensions with full consent from those involved.' }
      ],
      printable: true
    },
    {
      id: 'act-020',
      title: 'Celebration & Recognition',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '20 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Build a culture of intentional appreciation and positive recognition.',
      instructions: 'Each person writes 2-3 specific appreciations for teammates (on cards or sticky notes): one strength they\'ve noticed, one contribution that mattered, one quality they\'re grateful for. Share aloud or pass to recipients. Debrief the experience.',
      materials: ['Recognition cards (printable)', 'Pens'],
      facilitationTips: [
        'Specific > generic: "I appreciated when you…" not "You\'re great."',
        'Give people time to receive — don\'t rush through appreciations.',
        'This is most powerful at the close of a hard project or difficult period.'
      ],
      reflectionPrompts: [
        'How did it feel to receive specific appreciation?',
        'What do you notice when you look for strengths in others?',
        'How might more intentional recognition change our team culture?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a shared digital board; or send cards via email before the session.' }
      ],
      printable: true
    },

    // ── Hope / Spiritual-Reflective ────────────────────────────────────────
    {
      id: 'act-021',
      title: 'Purpose Clarification Workshop',
      dimension: 'hope',
      dimensionLabel: 'Hope',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '40 min',
      durationCategory: 'long',
      difficulty: 'intermediate',
      objective: 'Connect individual and team work to deeper meaning and shared purpose.',
      instructions: 'Each person reflects on three questions (5 min): What do I do best? What do others need from me? What matters most to me about this work? Share in pairs, then small groups identify shared themes. Draft a team purpose statement together.',
      materials: ['Purpose Worksheet', 'Flip chart', 'Markers'],
      facilitationTips: [
        'Purpose doesn\'t have to be profound — it can be practical and genuine.',
        'Look for overlap between individual and team purpose.',
        'Purpose statements should be living — revisit and refine over time.'
      ],
      reflectionPrompts: [
        'What surprised you about what you and your teammates value?',
        'How does your individual purpose connect to the team\'s?',
        'When do you feel most on-purpose in your work?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Small group drafts; synthesize across groups for organizational purpose.' }
      ],
      printable: true
    },
    {
      id: 'act-022',
      title: 'Values Alignment Exercise',
      dimension: 'hope',
      dimensionLabel: 'Hope',
      teamSize: ['5-10', '10-30'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'beginner',
      objective: 'Identify shared team values and align daily actions with what matters most.',
      instructions: 'Each person selects their top 5 values from a list of 50. Share in groups of 3-4. Identify values that appear frequently. As a full team, select 3-5 shared values. For each, discuss: How does this value show up in our best work? Where do we fall short?',
      materials: ['Values Cards set (printable, 50 values)', 'Flip chart'],
      facilitationTips: [
        'Values cards make this concrete and fast.',
        'Debate is healthy — it shows people care.',
        'Don\'t force consensus — shared values emerge, they aren\'t imposed.'
      ],
      reflectionPrompts: [
        'Which values feel most alive in our team right now?',
        'Where is there the biggest gap between stated and lived values?',
        'What one decision could we make today that would honor our top value?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Digital values card sort (use a spreadsheet or poll).' }
      ],
      printable: true
    },
    {
      id: 'act-023',
      title: 'Inspiration Gallery',
      dimension: 'hope',
      dimensionLabel: 'Hope',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '25 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Share stories of hope and resilience to build collective optimism.',
      instructions: 'Each person brings or shares (verbally or on paper) an image, quote, or story that represents hope or resilience to them. Post on a gallery wall. Participants walk the gallery, leave sticky note reactions, then discuss: What patterns emerge?',
      materials: ['Printed images or drawings', 'Sticky notes', 'Wall space', 'Markers'],
      facilitationTips: [
        'Set the tone with your own contribution — share first.',
        'Allow silence during the gallery walk.',
        'Debrief themes — notice what the team finds inspiring collectively.'
      ],
      reflectionPrompts: [
        'What do our choices tell us about what we find inspiring?',
        'How does this collection represent who we are as a team?',
        'Where can we find inspiration in our everyday work?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a shared digital board; participants add images, quotes, or links.' }
      ],
      printable: true
    },
    {
      id: 'act-024',
      title: 'Mentorship Matching',
      dimension: 'hope',
      dimensionLabel: 'Hope',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '20 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Connect team members for mutual learning and growth partnerships.',
      instructions: 'Each person lists 2 skills they want to develop and 2 skills they can teach. Facilitate a "marketplace" where people find matches. Establish brief mentorship pairs or triads with a 30-day check-in commitment.',
      materials: ['Skills Inventory cards (printable)', 'Connection map'],
      facilitationTips: [
        'Everyone has something to teach — emphasize mutual, not hierarchical, mentorship.',
        'The matching process itself is valuable — let it take time.',
        'Set a specific check-in date before ending the session.'
      ],
      reflectionPrompts: [
        'What did you learn about your teammates\' hidden skills?',
        'What makes mentorship feel safe and valuable to you?',
        'How might peer learning change how we grow as a team?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Use breakout groups by function, then cross-functional matching.' }
      ],
      printable: true
    },

    // ── Meaning / Strengths ────────────────────────────────────────────────
    {
      id: 'act-025',
      title: 'Strengths Finder Workshop',
      dimension: 'meaning',
      dimensionLabel: 'Meaning',
      teamSize: ['5-10', '10-30'],
      duration: '35 min',
      durationCategory: 'medium',
      difficulty: 'intermediate',
      objective: 'Identify individual and team strengths and plan how to leverage them.',
      instructions: 'Each person lists their top 5 strengths (from memory or a tool like VIA). Share in groups of 3. Create a team Strengths Map on a flip chart. Identify underutilized strengths. Plan one concrete way to deploy each person\'s strengths more intentionally.',
      materials: ['Strengths Cards (printable)', 'Team Strengths Map template', 'Markers'],
      facilitationTips: [
        'Strengths should be energizing, not just skills. Ask: "What feels effortless?"',
        'Look for complementary strengths — teams shine when differences align.',
        'Make the Strengths Map visible in the team\'s workspace.'
      ],
      reflectionPrompts: [
        'When do you feel most in your strengths in this role?',
        'Whose strengths complement yours most?',
        'What project or challenge would benefit from each person\'s strengths?'
      ],
      variations: [
        { size: 'Remote teams', note: 'Use a shared virtual strengths map; update asynchronously.' }
      ],
      printable: true
    },
    {
      id: 'act-026',
      title: 'Skills Inventory',
      dimension: 'meaning',
      dimensionLabel: 'Meaning',
      teamSize: ['5-10', '10-30', '30-50'],
      duration: '25 min',
      durationCategory: 'short',
      difficulty: 'beginner',
      objective: 'Map team skills and knowledge to identify gaps and opportunities.',
      instructions: 'Create a skills matrix: list key skills on one axis, team members on the other. Each person rates their proficiency (1-4) and interest level. Identify: Who is a hidden expert? Where are critical gaps? Who wants to grow in each area?',
      materials: ['Skills Matrix template', 'Pens or colored dots'],
      facilitationTips: [
        'Include both hard and soft skills.',
        'Interest matters as much as proficiency — motivation drives performance.',
        'Use results for actual planning, not just awareness.'
      ],
      reflectionPrompts: [
        'What skill surprised you to see in a teammate?',
        'Where do we have concerning gaps as a team?',
        'How might we use this data in our next project planning?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Use a digital shared spreadsheet for real-time input.' }
      ],
      printable: true
    },
    {
      id: 'act-027',
      title: 'Contribution Stories',
      dimension: 'meaning',
      dimensionLabel: 'Meaning',
      teamSize: ['10-30'],
      duration: '30 min',
      durationCategory: 'medium',
      difficulty: 'beginner',
      objective: 'Build meaning and connection by sharing how each person\'s work contributes.',
      instructions: 'Each person completes: "My work contributes to ___ by ___. The person who benefits most is ___." Share in groups of 4. Groups identify common threads. Full group: What does our work ultimately contribute to? What motivates us?',
      materials: ['Contribution Story cards (printable)', 'Flip chart for common threads'],
      facilitationTips: [
        'Encourage specificity — "my reports help the finance team make faster decisions."',
        'Connect individual contribution to team and organizational impact.',
        'This is especially powerful during difficult or uninspiring periods.'
      ],
      reflectionPrompts: [
        'When is your contribution most visible? When is it most invisible?',
        'What contribution do you make that you\'re most proud of?',
        'How might knowing this about each other change how we collaborate?'
      ],
      variations: [
        { size: 'Small teams (5-10)', note: 'Share full stories with the whole group for maximum impact.' }
      ],
      printable: true
    },
    {
      id: 'act-028',
      title: 'Legacy Conversation',
      dimension: 'meaning',
      dimensionLabel: 'Meaning',
      teamSize: ['5-10', '10-30'],
      duration: '40 min',
      durationCategory: 'long',
      difficulty: 'advanced',
      objective: 'Connect to deeper impact and contribution to build sense of meaning and purpose.',
      instructions: 'In pairs, discuss: "If this team accomplished one truly lasting thing, what would you want it to be?" Then: "What would you want to be remembered for in this role?" Share themes. Create a "Team Legacy Statement" together.',
      materials: ['Legacy Conversation Guide', 'Flip chart', 'Markers'],
      facilitationTips: [
        'Encourage boldness — legacy conversations tend toward the modest at first.',
        'Connect legacy to current decisions: "Are our choices today building this legacy?"',
        'This works especially well at project kickoffs and team transitions.'
      ],
      reflectionPrompts: [
        'What would have to change for us to build the legacy we described?',
        'What gets in the way of this kind of long-term thinking in our daily work?',
        'How does this legacy connect to your personal sense of purpose?'
      ],
      variations: [
        { size: 'Large groups (30+)', note: 'Department or function-level legacy statements; share across groups.' }
      ],
      printable: true
    }

  ],

  /* ══════════════════════════════════════════════════════════════════════════
     HANDOUTS  (15+ downloadable resources)
  ══════════════════════════════════════════════════════════════════════════ */
  handouts: [
    // Workshop Guides
    {
      id: 'hand-001',
      title: 'Connection Dimension Workshop Guide',
      type: 'workshop-guide',
      typeLabel: 'Workshop Guide',
      dimension: 'connection',
      dimensionLabel: 'Connection',
      pages: 8,
      description: 'Complete facilitation guide for the Connection dimension including discussion prompts, 3 activities, reflection questions, and facilitator tips.',
      icon: '/icons/relational-connective.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-002',
      title: 'Thinking Dimension Workshop Guide',
      type: 'workshop-guide',
      typeLabel: 'Workshop Guide',
      dimension: 'thinking',
      dimensionLabel: 'Thinking',
      pages: 8,
      description: 'Complete facilitation guide for the Thinking dimension with reframing activities, critical thinking exercises, and discussion frameworks.',
      icon: '/icons/cognitive-narrative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-003',
      title: 'Action Dimension Workshop Guide',
      type: 'workshop-guide',
      typeLabel: 'Workshop Guide',
      dimension: 'action',
      dimensionLabel: 'Action',
      pages: 8,
      description: 'Complete facilitation guide for the Action dimension with goal-setting templates, habit tracking tools, and accountability frameworks.',
      icon: '/icons/agentic-generative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-004',
      title: 'Feeling Dimension Workshop Guide',
      type: 'workshop-guide',
      typeLabel: 'Workshop Guide',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      pages: 8,
      description: 'Complete facilitation guide for the Feeling dimension with psychological safety building, stress protocol development, and emotional regulation tools.',
      icon: '/icons/emotional-adaptive.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-005',
      title: 'Hope Dimension Workshop Guide',
      type: 'workshop-guide',
      typeLabel: 'Workshop Guide',
      dimension: 'hope',
      dimensionLabel: 'Hope',
      pages: 8,
      description: 'Complete facilitation guide for the Hope dimension with purpose clarification exercises, values alignment, and vision-building tools.',
      icon: '/icons/spiritual-reflective.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-006',
      title: 'Meaning Dimension Workshop Guide',
      type: 'workshop-guide',
      typeLabel: 'Workshop Guide',
      dimension: 'meaning',
      dimensionLabel: 'Meaning',
      pages: 8,
      description: 'Complete facilitation guide for the Meaning dimension with strengths mapping, contribution storytelling, and legacy conversation tools.',
      icon: '/icons/spiritual-reflective.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },

    // Templates
    {
      id: 'hand-007',
      title: 'Team Resilience Snapshot Template',
      type: 'template',
      typeLabel: 'Template',
      dimension: 'all',
      dimensionLabel: 'All Dimensions',
      pages: 4,
      description: 'One-page team resilience profile with dimension scores, strengths, and growth edges. Pre/post assessment version included.',
      icon: '/icons/compass.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-008',
      title: '30-Day Team Habit Tracker',
      type: 'template',
      typeLabel: 'Template',
      dimension: 'action',
      dimensionLabel: 'Action',
      pages: 2,
      description: 'Printable 30-day habit tracker for individual and team resilience habits. Includes celebration milestones and reflection prompts.',
      icon: '/icons/agentic-generative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-009',
      title: 'Team Action Planning Worksheet',
      type: 'template',
      typeLabel: 'Template',
      dimension: 'all',
      dimensionLabel: 'All Dimensions',
      pages: 3,
      description: 'Structured template for translating team insights into specific actions with owners, timelines, and success metrics.',
      icon: '/icons/agentic-generative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-010',
      title: 'Discussion Prompt Sheets (6-Pack)',
      type: 'prompt-sheet',
      typeLabel: 'Discussion Prompts',
      dimension: 'all',
      dimensionLabel: 'All Dimensions',
      pages: 6,
      description: 'Color-coded discussion starter sheets, one per dimension. Organized by difficulty: warm-up, explore, deepen. Includes psychological safety reminders.',
      icon: '/icons/relational-connective.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'starter',
      minTierLabel: 'Teams Starter'
    },
    {
      id: 'hand-011',
      title: 'Individual Reflection Journal',
      type: 'template',
      typeLabel: 'Template',
      dimension: 'all',
      dimensionLabel: 'All Dimensions',
      pages: 12,
      description: 'Personal reflection journal for team members. Includes guided prompts per dimension, weekly check-ins, and learning capture pages.',
      icon: '/icons/cognitive-narrative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-012',
      title: 'Psychological Safety Checklist',
      type: 'facilitation',
      typeLabel: 'Facilitation Resource',
      dimension: 'feeling',
      dimensionLabel: 'Feeling',
      pages: 2,
      description: 'Pre-workshop checklist for facilitators to assess and build psychological safety. Includes warning signs and quick interventions.',
      icon: '/icons/emotional-adaptive.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-013',
      title: 'Team Kickoff Script',
      type: 'facilitation',
      typeLabel: 'Facilitation Resource',
      dimension: 'all',
      dimensionLabel: 'All Dimensions',
      pages: 3,
      description: 'Word-for-word script for opening your first team resilience session. Includes framing, ground rules, and first activity setup.',
      icon: '/icons/relational-connective.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-014',
      title: 'Values Cards Set (50 Cards)',
      type: 'activity-cards',
      typeLabel: 'Activity Cards',
      dimension: 'hope',
      dimensionLabel: 'Hope',
      pages: 6,
      description: '50 printable values cards for the Values Alignment Exercise. Cut and sort. Works for small groups and large teams.',
      icon: '/icons/spiritual-reflective.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-015',
      title: 'Strengths Cards Set (40 Cards)',
      type: 'activity-cards',
      typeLabel: 'Activity Cards',
      dimension: 'meaning',
      dimensionLabel: 'Meaning',
      pages: 5,
      description: '40 printable strengths cards for the Strengths Finder Workshop. Includes brief description and reflection prompt on each card.',
      icon: '/icons/agentic-generative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-016',
      title: 'SMART Goal Worksheet',
      type: 'template',
      typeLabel: 'Template',
      dimension: 'action',
      dimensionLabel: 'Action',
      pages: 2,
      description: 'Structured goal-setting worksheet using the SMART framework with team and individual goal sections. Includes accountability partner space.',
      icon: '/icons/agentic-generative.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'hand-017',
      title: 'Facilitator Troubleshooting Guide',
      type: 'facilitation',
      typeLabel: 'Facilitation Resource',
      dimension: 'all',
      dimensionLabel: 'All Dimensions',
      pages: 4,
      description: 'Practical guide for handling common facilitation challenges: resistant participants, dominant voices, emotional moments, and time management.',
      icon: '/icons/compass.svg',
      downloadUrl: '#',
      format: 'PDF',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    }
  ],

  /* ══════════════════════════════════════════════════════════════════════════
     VISUAL RESOURCES  (12+ infographics, posters, reference cards)
  ══════════════════════════════════════════════════════════════════════════ */
  visuals: [
    {
      id: 'vis-001',
      title: 'Six Dimensions Overview Card Set',
      type: 'dimension-card',
      typeLabel: 'Reference Cards',
      description: 'Six-card set, one per dimension. Icon, name, description, key behaviors at high and low levels, and sample practices. Print-ready.',
      icon: '/icons/spiritual-reflective.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '4"×6" (per card)',
      minTier: 'starter',
      minTierLabel: 'Teams Starter'
    },
    {
      id: 'vis-002',
      title: 'Team Resilience Radar Interpretation Guide',
      type: 'infographic',
      typeLabel: 'Infographic',
      description: 'Visual guide to reading and interpreting team radar charts. Shows what each section means, common profiles, and how to identify growth priorities.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '8.5"×11"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-003',
      title: 'Team Building Timeline — 6-Month Plan',
      type: 'timeline',
      typeLabel: 'Planning Timeline',
      description: 'Month-by-month workshop sequence with activities mapped to dimensions. Shows progression from awareness to practice to integration.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '11"×17"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-004',
      title: 'Dimension Spectrum Infographic',
      type: 'infographic',
      typeLabel: 'Infographic',
      description: 'Visual spectrum showing each dimension from low to high. Illustrates development trajectory, common patterns, and key turning points.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '8.5"×11"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-005',
      title: 'Team Resilience Development Pathway',
      type: 'pathway',
      typeLabel: 'Development Map',
      description: '6-month progression map with activities, expected outcomes, measurement points, and wins at each stage. High-level visual roadmap.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '11"×17"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-006',
      title: 'Activity Selection Matrix',
      type: 'matrix',
      typeLabel: 'Decision Matrix',
      description: 'Visual grid to choose the right activity for your team\'s needs. Organized by time available, group size, and learning objective.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '8.5"×11"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-007',
      title: 'Connection Dimension Workshop Poster',
      type: 'poster',
      typeLabel: 'Workshop Poster',
      description: 'Large-format poster for the Connection dimension. Motivational messaging, key concepts, and discussion starters. Print for workshop walls.',
      icon: '/icons/relational-connective.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '18"×24"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-008',
      title: 'Thinking Dimension Workshop Poster',
      type: 'poster',
      typeLabel: 'Workshop Poster',
      description: 'Large-format poster for the Thinking dimension. Reframing prompts, perspective-shifting visuals, and key principles.',
      icon: '/icons/cognitive-narrative.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '18"×24"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-009',
      title: 'Action Dimension Workshop Poster',
      type: 'poster',
      typeLabel: 'Workshop Poster',
      description: 'Large-format poster for the Action dimension. Goal-setting reminders, momentum principles, and accountability prompts.',
      icon: '/icons/agentic-generative.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '18"×24"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-010',
      title: 'Feeling Dimension Workshop Poster',
      type: 'poster',
      typeLabel: 'Workshop Poster',
      description: 'Large-format poster for the Feeling dimension. Emotional safety cues, calming practice reminders, and recognition prompts.',
      icon: '/icons/emotional-adaptive.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '18"×24"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-011',
      title: 'Hope Dimension Workshop Poster',
      type: 'poster',
      typeLabel: 'Workshop Poster',
      description: 'Large-format poster for the Hope dimension. Purpose prompts, values anchors, and vision-building inspiration.',
      icon: '/icons/spiritual-reflective.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '18"×24"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-012',
      title: 'Meaning Dimension Workshop Poster',
      type: 'poster',
      typeLabel: 'Workshop Poster',
      description: 'Large-format poster for the Meaning dimension. Strengths affirmations, contribution questions, and legacy prompts.',
      icon: '/icons/spiritual-reflective.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '18"×24"',
      minTier: 'pro',
      minTierLabel: 'Teams Pro'
    },
    {
      id: 'vis-013',
      title: 'Team Resilience Culture Poster',
      type: 'poster',
      typeLabel: 'Culture Poster',
      description: 'All six dimensions in one integrated visual. Shows how dimensions interact, team culture elements, and shared language.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '24"×36"',
      minTier: 'enterprise',
      minTierLabel: 'Teams Enterprise'
    },
    {
      id: 'vis-014',
      title: 'Quick Reference Cards (6-Card Set)',
      type: 'reference-card',
      typeLabel: 'Quick Reference',
      description: 'Pocket-sized reference cards, one per dimension. Key practices, prompts, and guidance for when to use each dimension in daily leadership.',
      icon: '/icons/compass.svg',
      format: 'PDF',
      downloadUrl: '#',
      printSize: '3"×5" (per card)',
      minTier: 'starter',
      minTierLabel: 'Teams Starter'
    }
  ]

};
/* eslint-enable */
