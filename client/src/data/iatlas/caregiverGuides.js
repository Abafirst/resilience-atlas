/**
 * caregiverGuides.js
 * Structured Caregiver Learning curriculum for the IATLAS Family tier ($39.99/mo).
 *
 * 15 evidence-based parent guides organised by the six IATLAS resilience dimensions
 * plus cross-cutting bonus guides.
 *
 * References:
 *  - Dweck, C. (2006). Mindset: The New Psychology of Success.
 *  - Siegel, D. & Bryson, T. (2011). The Whole-Brain Child.
 *  - Siegel, D. (2020). The Power of Showing Up.
 *  - Kabat-Zinn, J. (1994). Wherever You Go, There You Are.
 *  - van der Kolk, B. (2014). The Body Keeps the Score.
 *  - Neff, K. (2011). Self-Compassion.
 */

export const CAREGIVER_GUIDES = [
  // ── Agentic-Generative ───────────────────────────────────────────────────

  {
    id: 'foster-independence',
    dimension: 'agentic-generative',
    title: 'How to Foster Independence in Your Child',
    ageRange: 'all',
    readingTime: '8 min',
    keyTakeaways: [
      'Age-appropriate independence looks different at every developmental stage',
      'Choice architecture — giving kids limited, safe choices — builds genuine agency',
      'Natural consequences teach more effectively than lectures',
    ],
    sections: [
      {
        heading: 'Why Independence Matters',
        content:
          'Independence is not just a convenience for parents — it is a core building block of resilience. When children experience genuine agency over small decisions, they develop the internal confidence needed to navigate larger challenges. Research consistently shows that children who are allowed to make and learn from mistakes develop stronger problem-solving skills, higher self-efficacy, and greater emotional regulation capacity.',
      },
      {
        heading: 'Age-by-Age Independence Milestones',
        content:
          'Ages 3–5: Let toddlers choose between two outfits, pick a snack, or decide which book to read first. The choice must be real — no taking it back.\n\nAges 6–9: Encourage independent problem-solving by asking "What do you think you could try?" before offering solutions. Allow children to pack their own backpack, manage a small allowance, and resolve minor peer conflicts without immediate adult intervention.\n\nAges 10–13: Expand decision-making to chores, scheduling, and even negotiating reasonable rules. When a child disagrees with a decision, invite them to make their case — then listen.\n\nAges 14–18: Teenagers need autonomy over identity, friendships, and time management. Your role shifts from director to consultant. Offer opinions when asked; hold back unsolicited advice.',
      },
      {
        heading: 'Practical Strategies',
        content:
          '1. Use "Would you rather…?" questions to build daily decision-making muscles.\n2. Let the natural consequence play out when it is safe to do so (a forgotten homework assignment teaches more than a parent rescue).\n3. Narrate their competence: "I watched you figure that out all by yourself." Specific praise reinforces the skill, not just the outcome.\n4. Create a "problem-solving pause" — when your child comes to you frustrated, say "Tell me about it" before immediately offering a fix.',
      },
    ],
    references: [
      'Dweck, C. (2006). Mindset: The New Psychology of Success. Random House.',
      'Siegel, D. & Bryson, T. (2011). The Whole-Brain Child. Delacorte Press.',
      'Lythcott-Haims, J. (2015). How to Raise an Adult. Henry Holt.',
    ],
  },

  {
    id: 'goal-setting-kids',
    dimension: 'agentic-generative',
    title: "Goal-Setting with Kids: A Parent's Guide",
    ageRange: 'all',
    readingTime: '7 min',
    keyTakeaways: [
      'Process goals ("practice for 10 minutes") beat outcome goals ("win the game") for children',
      'Visual goal trackers build momentum and make progress tangible',
      'Celebrating small wins activates the brain\'s reward system without undermining intrinsic motivation',
    ],
    sections: [
      {
        heading: 'Why Kids Need Goal-Setting Practice',
        content:
          "Goal-setting is not a natural skill — it must be taught and practised. Children who learn to set and pursue goals develop executive function skills including planning, impulse control, and working memory. These same skills predict academic success, relationship quality, and wellbeing in adulthood far better than IQ alone.",
      },
      {
        heading: 'The SMART-K Framework for Kids',
        content:
          'Traditional SMART goals work best for adults. For children, adapt the framework:\n\nS — Simple: One goal at a time. Not "be better at school" but "finish my reading before dinner three times this week."\nM — Meaningful: The child must care about it. Goals imposed from outside collapse quickly.\nA — Achievable: A stretch, but reachable within 1–2 weeks for younger children, 1 month for older.\nR — Rewarding: Build in a celebration that the child chooses.\nT — Trackable: Use a sticker chart, app, or journal the child controls.',
      },
      {
        heading: 'Making Goal Reviews Fun, Not Stressful',
        content:
          "Weekly check-ins should feel like a celebration, not a performance review. Try the \"Win-Learn-Change\" format: What was a win this week? What did you learn? What would you change? This frame makes 'failure' instructional rather than shameful.",
      },
    ],
    references: [
      'Duckworth, A. (2016). Grit: The Power of Passion and Perseverance. Scribner.',
      'Mischel, W. (2014). The Marshmallow Test. Little, Brown.',
    ],
  },

  // ── Somatic-Regulative ───────────────────────────────────────────────────

  {
    id: 'co-regulation-basics',
    dimension: 'somatic-regulative',
    title: 'Co-Regulation Basics for Parents',
    ageRange: 'all',
    readingTime: '9 min',
    keyTakeaways: [
      "Your nervous system literally regulates your child's — calm is contagious",
      'Co-regulation comes before self-regulation; children can\'t "calm down" alone until mid-childhood',
      'The 3-step sequence: Connect → Regulate → Reflect (not the reverse)',
    ],
    sections: [
      {
        heading: "What Is Co-Regulation and Why It Matters",
        content:
          "Co-regulation refers to the process by which a calm adult nervous system helps stabilise a dysregulated child's nervous system. This is not metaphorical — it is neurobiological. When you stay calm during your child's meltdown, your regulated heartbeat, slow breathing, and soft tone of voice send safety signals that help their amygdala downshift from threat mode.\n\nChildren's prefrontal cortex — the brain's executive centre — does not fully develop until the mid-20s. This means asking a distressed 7-year-old to 'use their words' or 'calm down' is asking them to operate hardware they don't yet have. They need you to be the external regulation system first.",
      },
      {
        heading: 'The Connect → Regulate → Reflect Sequence',
        content:
          'Step 1 — Connect: Get physically close. Match their energy level slightly (not match their dysregulation, but acknowledge it). Say "I see you\'re really upset." Do not problem-solve yet.\n\nStep 2 — Regulate: Slow your own breathing. Use a warm, low voice. Offer physical comfort if accepted. Allow the emotion to peak and begin to subside without rushing.\n\nStep 3 — Reflect: Only after calm is restored, revisit what happened. "What was that like for you? What do you think set it off?" This builds emotional vocabulary and self-awareness over time.',
      },
      {
        heading: 'Regulating Yourself First',
        content:
          "You cannot pour from an empty cup. If you feel triggered by your child's behaviour (and every parent does sometimes), it is okay to say: 'I need a moment to calm down so I can help you better.' Step away briefly, take 5 deep breaths, and return. Modelling emotional regulation is itself one of the most powerful lessons you can teach.",
      },
    ],
    references: [
      'Siegel, D. & Bryson, T. (2020). The Power of Showing Up. Ballantine Books.',
      'van der Kolk, B. (2014). The Body Keeps the Score. Viking.',
      'Porges, S. (2011). The Polyvagal Theory. W. W. Norton.',
    ],
  },

  {
    id: 'calm-corner',
    dimension: 'somatic-regulative',
    title: 'Building a Calm Corner at Home',
    ageRange: 'all',
    readingTime: '6 min',
    keyTakeaways: [
      'A calm corner is a voluntary regulation space — never a punishment',
      'Children help build it to create ownership and willingness to use it',
      'Simple sensory tools (fidgets, breathing cards, soft items) are more effective than complex setups',
    ],
    sections: [
      {
        heading: 'What a Calm Corner Is (and Is Not)',
        content:
          'A calm corner is a designated, cosy space in your home where a child can go voluntarily when they feel overwhelmed, anxious, or overstimulated. It is not a time-out chair, not a consequence, and not somewhere you send an angry child against their will. The key distinction is agency — the child chooses to go there, or you invite (not instruct) them to use it.',
      },
      {
        heading: 'How to Build One Together',
        content:
          'Involve your child completely in the setup. Walk them through the choices:\n\n• Location: A corner, a nook under the stairs, a bean bag in their room — somewhere slightly removed from the main action but not isolated.\n• Comfort: Cushions, a weighted blanket, or soft lighting.\n• Sensory tools: A fidget cube, a jar of glitter water (the "calm jar"), playdough, or a squeeze ball.\n• Breathing prompts: A laminated card with simple breathing patterns (star breathing, box breathing).\n• Feelings tools: Emotion cards or a simple feelings chart.\n\nLet them decorate it and name it. "The Recharge Zone," "The Cave," "My Chill Spot" — the name matters because it signals ownership.',
      },
      {
        heading: 'Teaching Children to Use It',
        content:
          "Practise visiting the calm corner during neutral times, not crises. 'Let's try out the breathing card together right now, when you're already calm — so your body knows what to do when you really need it.' Over time, you can cue it gently: 'I wonder if the recharge zone might help right now?' If they resist, don't push. Return to connection first.",
      },
    ],
    references: [
      'Shanker, S. (2016). Self-Reg. Penguin Press.',
      'Siegel, D. & Bryson, T. (2014). No-Drama Discipline. Bantam Books.',
    ],
  },

  // ── Cognitive-Narrative ──────────────────────────────────────────────────

  {
    id: 'reframing-bad-days',
    dimension: 'cognitive-narrative',
    title: "Reframing 'Bad Days' Together",
    ageRange: 'all',
    readingTime: '7 min',
    keyTakeaways: [
      'Cognitive flexibility — the ability to shift perspective — is a teachable skill',
      'Story reframes ("And then what happened?") help children find coherence in hard experiences',
      'Validating the feeling first makes the reframe land; skipping validation makes it feel dismissive',
    ],
    sections: [
      {
        heading: "What Cognitive Flexibility Looks Like in Children",
        content:
          "When a child insists 'Today was the worst day ever' after a minor setback, they are experiencing cognitive rigidity — a normal, developmentally expected state. The goal is not to talk them out of their feeling, but to help them hold the difficult moment alongside other truths. This is the essence of cognitive flexibility: the ability to see multiple perspectives and meanings within the same event.",
      },
      {
        heading: 'The Rose-Thorn-Bud Ritual',
        content:
          "A simple family dinner routine builds reframing practice daily:\n\nRose: One good thing that happened today (however small).\nThorn: Something hard or frustrating.\nBud: Something you're looking forward to or curious about.\n\nThe magic is in the structure — it communicates that all three types of experiences are normal and worth noticing. Over time, children internalise this three-part lens and begin applying it independently.",
      },
      {
        heading: "Language Patterns That Build Reframing Skills",
        content:
          "Try these phrases with your child after a difficult day:\n\n• 'That sounds really hard. What part was the hardest?'\n• 'Is there any part of today that was okay, even small?'\n• 'What do you think tomorrow might be like?'\n• 'What would you do differently if you could?'\n\nAvoid: 'It's not that bad' / 'At least...' / 'Other kids have it worse.' These bypass the child's experience and teach them their feelings are unwelcome.",
      },
    ],
    references: [
      'Siegel, D. & Bryson, T. (2011). The Whole-Brain Child. Delacorte Press.',
      'Reivich, K. & Shatté, A. (2002). The Resilience Factor. Broadway Books.',
    ],
  },

  {
    id: 'power-of-yet',
    dimension: 'cognitive-narrative',
    title: "The Power of 'Yet': Growth Mindset Parenting",
    ageRange: 'all',
    readingTime: '8 min',
    keyTakeaways: [
      "Adding 'yet' transforms fixed-mindset statements into growth opportunities",
      'Process praise ("You worked so hard on that") outperforms outcome praise ("You\'re so smart")',
      'Parents model mindset more than they teach it — watch your own self-talk',
    ],
    sections: [
      {
        heading: "The Two Mindsets: Fixed vs. Growth",
        content:
          "Carol Dweck's decades of research at Stanford identified two fundamentally different orientations toward ability:\n\nFixed mindset: 'I'm either good at this or I'm not. Effort doesn't change that. Failure means I'm not smart.'\n\nGrowth mindset: 'Ability is developed through effort and learning. Failure is information, not identity. Trying hard things is how I get better.'\n\nChildren with growth mindsets are more willing to attempt difficult tasks, recover faster from setbacks, and demonstrate higher academic achievement over time — not because they are more talented, but because they approach challenges differently.",
      },
      {
        heading: "The 'Yet' Technique in Practice",
        content:
          "When your child says 'I can't do this,' simply add 'yet.' 'I can't read this chapter yet.' 'I can't ride without training wheels yet.' This single word restructures the sentence from a fixed conclusion to a temporary state.\n\nPair it with the 'Not-Yet Learning Zone' concept: some things are in the 'I know this' zone, some in the 'not yet' zone. Neither is better or worse — the not-yet zone is where growth happens. Make it a neutral, even exciting place.",
      },
      {
        heading: 'Praise for Process, Not Person',
        content:
          "Dweck's research shows that praising intelligence ('You're so smart!') actually undermines resilience — children praised this way avoid challenges to protect their 'smart' identity. Praising process produces the opposite effect:\n\n✅ 'You kept trying even when it was hard — that's what makes the difference.'\n✅ 'I noticed you tried three different strategies before you figured it out.'\n✅ 'That mistake taught you something — what did you learn from it?'\n\n❌ 'You're a natural!'\n❌ 'You're so smart at this.'",
      },
    ],
    references: [
      "Dweck, C. (2006). Mindset: The New Psychology of Success. Random House.",
      "Yeager, D. & Dweck, C. (2012). Mindsets that promote resilience. Educational Psychologist, 47(4), 302–314.",
    ],
  },

  // ── Relational-Connective ────────────────────────────────────────────────

  {
    id: 'daily-connection-rituals',
    dimension: 'relational-connective',
    title: 'Daily Connection Rituals for Busy Families',
    ageRange: 'all',
    readingTime: '6 min',
    keyTakeaways: [
      'Micro-connections (5 minutes of full presence) are more powerful than occasional long stretches',
      'Consistent rituals build a secure base — children know connection is reliable',
      'Transitions (morning, after school, bedtime) are prime ritual moments',
    ],
    sections: [
      {
        heading: 'Why Ritual Matters More Than Duration',
        content:
          "Research on attachment security consistently shows that it is the reliability and quality of connection that matters — not the quantity of time. A parent who is physically present but mentally absent (phone in hand, half-listening) provides far less relational nourishment than one who is fully present for five focused minutes.\n\nRituals create predictability, and predictability is the foundation of emotional security. When a child knows that after school you'll always ask them the same three questions, or that bedtime always ends with a specific phrase, their nervous system relaxes into the routine.",
      },
      {
        heading: '5-Minute Connection Ideas by Time of Day',
        content:
          "Morning: A consistent goodbye ritual — a specific handshake, a phrase ('Tackle the day like a lion'), or a brief check-in question ('What's the one thing you're looking forward to today?').\n\nAfter school: A 'reconnection window' of 10–15 minutes with no agenda — just presence. Let them lead. Offer a snack and sit nearby. Resist the urge to immediately ask about homework.\n\nDinner: One question that goes around the table: 'What made you feel proud today?' or the Rose-Thorn-Bud ritual (see the Reframing Bad Days guide).\n\nBedtime: The 'best-hardest' check-in: 'What was the best part of your day? What was the hardest?' End with a consistent closing phrase or song. Predictability at bedtime is particularly soothing for anxious children.",
      },
      {
        heading: 'Protecting Rituals When Life Gets Busy',
        content:
          "Rituals only work if they are protected. Put them in your mental (or actual) calendar. When a ritual is disrupted — travel, illness, conflict — name it: 'We didn't get to do our usual thing this week. I missed it. How about we do it now?' This models that connection is worth prioritising and recoverable when interrupted.",
      },
    ],
    references: [
      'Gottman, J. & DeClaire, J. (1997). Raising an Emotionally Intelligent Child. Simon & Schuster.',
      'Siegel, D. & Bryson, T. (2020). The Power of Showing Up. Ballantine Books.',
    ],
  },

  {
    id: 'listening-without-fixing',
    dimension: 'relational-connective',
    title: 'Listening Without Fixing',
    ageRange: 'all',
    readingTime: '7 min',
    keyTakeaways: [
      "Most children need to feel heard before they're ready to problem-solve",
      "'Hold the space' means tolerating their discomfort without rushing to remove it",
      'Reflective listening phrases are simple and learnable at any age',
    ],
    sections: [
      {
        heading: "The Fix-It Trap",
        content:
          "Parental instinct is to protect and rescue. When your child is upset, hurt, or overwhelmed, every part of you wants to make it better — immediately. This is love. But premature fixing often communicates (unintentionally): 'Your feelings are a problem to be solved rather than an experience to be had.'\n\nChildren who are chronically rescued from discomfort do not develop the emotional tolerance — the window of distress they can sit in — needed for real resilience. They learn instead to outsource their regulation: 'Someone will fix this for me.'",
      },
      {
        heading: 'What Active Listening Looks Like',
        content:
          "Active listening is less about what you say and more about what you don't do. Try these techniques:\n\n• Get to their physical level: Sit down, kneel, or position yourself at eye level.\n• Reflect back without paraphrasing excessively: 'So it sounds like that really hurt your feelings' not 'So you felt sad because James said something mean, and then you...' Keep it brief.\n• Tolerate silence: A pause after your reflection is not awkward — it is an invitation for them to continue.\n• Ask instead of advise: 'What do you think you want to do about it?' opens a door. 'You should apologise' closes it.",
      },
      {
        heading: 'When You Do Need to Fix',
        content:
          "Active listening is the default mode — but safety and real harm are different. If a child is in danger, if there is bullying that needs adult intervention, if there is a practical problem requiring your knowledge — act. The skill is knowing the difference between 'I need to fix this for them' and 'They need to feel heard first, and then we can fix it together.'",
      },
    ],
    references: [
      'Faber, A. & Mazlish, E. (1980). How to Talk So Kids Will Listen & Listen So Kids Will Talk. Scribner.',
      'Rogers, C. (1961). On Becoming a Person. Houghton Mifflin.',
    ],
  },

  // ── Emotional-Adaptive ───────────────────────────────────────────────────

  {
    id: 'name-it-tame-it',
    dimension: 'emotional-adaptive',
    title: 'Name It to Tame It: Emotion Coaching for Parents',
    ageRange: 'all',
    readingTime: '8 min',
    keyTakeaways: [
      "Naming emotions in words reduces their intensity — this is neuroscience, not theory",
      'Emotion coaching has four steps: Notice, Connect, Name, Problem-solve',
      'You do not have to agree with an emotion to validate it',
    ],
    sections: [
      {
        heading: "The Neuroscience of 'Name It to Tame It'",
        content:
          "Neuroscientist and psychiatrist Dan Siegel coined the phrase 'name it to tame it' to describe a well-replicated finding in affective neuroscience: putting feelings into words (affect labelling) decreases activation in the amygdala — the brain's threat-detection system — and increases prefrontal cortex engagement.\n\nIn plain language: when you help a child name what they're feeling, you are literally helping their thinking brain come back online. The label itself is regulatory.",
      },
      {
        heading: 'The Four Steps of Emotion Coaching',
        content:
          "Developed by psychologist John Gottman, emotion coaching is a parenting approach that treats emotional moments as opportunities for connection and learning:\n\nStep 1 — Notice: Become aware of your child's emotional signals early — before they escalate. Body language, tone, withdrawal, or irritability are early warning signs.\n\nStep 2 — Connect: Approach with curiosity, not alarm. 'You seem like something is bothering you. Do you want to tell me about it?'\n\nStep 3 — Name: Help them label the feeling. 'It sounds like you're feeling left out and a little embarrassed.' Offer options if they struggle: 'Is it more like angry, or more like hurt?'\n\nStep 4 — Problem-solve: Only after connection and naming, gently explore: 'Is this something you want to figure out, or do you just need to feel it for a while first?'",
      },
      {
        heading: 'Building an Emotional Vocabulary',
        content:
          'Research shows that people with more nuanced emotion vocabulary (the ability to distinguish between frustrated and disappointed, or anxious and disappointed) have better emotional regulation outcomes. Introduce new emotion words naturally: "You seem deflated — like the excitement ran out." Read books with complex emotional characters. Use feeling wheels and emotion cards as conversation starters, not tests.',
      },
    ],
    references: [
      'Siegel, D. (1999). The Developing Mind. Guilford Press.',
      'Gottman, J. & DeClaire, J. (1997). Raising an Emotionally Intelligent Child. Simon & Schuster.',
      'Torre, J.B. & Lieberman, M.D. (2018). Putting feelings into words. Affect labelling as implicit emotion regulation. Emotion Review, 10(2), 116–124.',
    ],
  },

  {
    id: 'big-emotions',
    dimension: 'emotional-adaptive',
    title: "When Your Child's Emotions Feel Too Big",
    ageRange: 'all',
    readingTime: '9 min',
    keyTakeaways: [
      'Big emotional reactions are not character flaws — they are developmental, sensory, or stress responses',
      'Trying to suppress big emotions backfires; helping them move through is the goal',
      'Know the difference between a normal emotional storm and a clinical warning sign',
    ],
    sections: [
      {
        heading: "Why Some Children's Emotions Seem 'Too Big'",
        content:
          "Children who appear to have outsized emotional reactions — explosive anger, inconsolable grief over a 'small' thing, panic that seems disproportionate — are often experiencing sensory processing differences, attachment-related stress, anxiety, or simply a developmental stage where emotional intensity is normal (toddlers and early adolescence peak here).\n\nIt is important not to pathologise developmentally appropriate big feelings. A 4-year-old screaming over the 'wrong cup' is not having a psychiatric episode — they are in a developmental window of maximal emotional reactivity with minimal regulatory capacity. Same with many 12-year-olds.",
      },
      {
        heading: 'Strategies When Emotions Escalate',
        content:
          "In the moment of high activation, the goal is safety and de-escalation — not problem-solving, not consequences, not 'teaching moments.'\n\n1. Lower the sensory input: Quieter environment, dimmer lights, lower voice.\n2. Reduce demands: 'You don't have to talk right now. I'm right here.'\n3. Regulate your own body: Slow your breathing — your nervous system influences theirs.\n4. Offer choices (not commands): 'Do you want a hug or do you want space?' gives them agency when they feel out of control.\n5. Wait: Big emotional waves peak and subside. Your job is to weather it with them, not stop it.",
      },
      {
        heading: 'When to Seek Support',
        content:
          "Big emotions are normal; persistent functional impairment is not. Consider seeking professional support if:\n• Emotional outbursts are increasing in frequency or intensity over weeks\n• The child is harming themselves or others during emotional episodes\n• Emotions are significantly disrupting school attendance, friendships, or family life\n• The child expresses hopelessness, persistent sadness, or fear that does not resolve\n• Your gut tells you something is wrong\n\nYour paediatrician, your child's school counsellor, or a child psychologist can help assess what's typical and what may benefit from additional support.",
      },
    ],
    references: [
      'Greene, R.W. (2014). The Explosive Child. Harper Paperbacks.',
      'Neff, K. (2011). Self-Compassion: The Proven Power of Being Kind to Yourself. William Morrow.',
      'Siegel, D. & Bryson, T. (2011). The Whole-Brain Child. Delacorte Press.',
    ],
  },

  // ── Spiritual-Existential ────────────────────────────────────────────────

  {
    id: 'values-with-kids',
    dimension: 'spiritual-existential',
    title: 'Talking About Values with Your Kids',
    ageRange: 'all',
    readingTime: '7 min',
    keyTakeaways: [
      'Values conversations should be exploratory, not instructional — you discover together',
      'Stories (family stories, books, current events) are the entry point for values discussions',
      'Children need to internalise values through experience, not just hear them stated',
    ],
    sections: [
      {
        heading: 'What Values Are and Why They Matter for Resilience',
        content:
          "Values are the principles that guide how we want to live and treat others. When children have a clear sense of their own values — kindness, honesty, courage, curiosity — they have an internal compass for making decisions under pressure. This is particularly important during adversity, when external anchors (peer approval, certainty about the future) are temporarily removed.\n\nResearch on post-traumatic growth consistently finds that a clear values framework is one of the strongest predictors of adaptive functioning after difficulty.",
      },
      {
        heading: 'Age-Appropriate Values Conversations',
        content:
          "Ages 4–7: Use stories. When reading together, ask: 'What do you think that character cared about most?' and 'What would you have done if you were them?' Values emerge through narrative before they can be stated abstractly.\n\nAges 8–12: Introduce values vocabulary explicitly but conversationally: 'That showed real courage — what do you think courage means to you?' Make it a dialogue, not a lesson. Share your own values and how you arrived at them.\n\nTeenagers: Values conversations with adolescents work best when they are provoked by real dilemmas — news stories, films, situations in their lives. Invite their reasoning. Resist the urge to correct; ask instead: 'How does that sit with what you said you believe about fairness?'",
      },
      {
        heading: "Family Values: Creating Your 'North Star'",
        content:
          "Consider creating a family values statement together — not as a rule list, but as an aspiration. Gather as a family and ask: 'What are three things we care about most as a family? What do we want to be known for?'\n\nWrite them down, display them somewhere visible, and refer back to them when decisions come up: 'Does this feel in line with what we said we care about?'",
      },
    ],
    references: [
      'Harris, R. (2009). ACT Made Simple. New Harbinger.',
      'Coles, R. (1997). The Moral Intelligence of Children. Random House.',
    ],
  },

  {
    id: 'purpose-meaning-childhood',
    dimension: 'spiritual-existential',
    title: 'Purpose and Meaning in Childhood',
    ageRange: 'all',
    readingTime: '8 min',
    keyTakeaways: [
      'A sense of purpose is protective against depression and anxiety in children and adults alike',
      'Purpose is found in contribution — helping others, creating, being part of something larger',
      'You cannot give a child purpose, but you can create the conditions for them to find it',
    ],
    sections: [
      {
        heading: "Why Purpose Matters More Than You Think",
        content:
          "Research by psychologist William Damon at Stanford identified a 'purpose gap' in young people — a growing disconnection from meaningful direction that correlates with anxiety, disengagement, and reduced wellbeing. Purpose is not the same as passion (which can be fleeting) or career goals. It is a sustained commitment to something that matters beyond the self.\n\nChildren with even a nascent sense of purpose — 'I care about animals' / 'I want to help people who are sad' — show greater emotional resilience, higher motivation, and better recovery from adversity than those without it.",
      },
      {
        heading: 'How Children Discover Purpose',
        content:
          "Purpose rarely arrives as a revelation — it emerges through experience, contribution, and reflection. Support your child's purpose development by:\n\n1. Exposing them to diverse experiences: Volunteering, community service, creative projects, exposure to different lives and problems.\n2. Noticing what makes them come alive: 'I notice you spend hours drawing — what is it about drawing that you love?'\n3. Connecting their natural interests to larger impact: 'Your love of animals — what do you think the world needs from people who care about animals?'\n4. Telling family stories of contribution: How have people in your family made a difference? Stories create identity.",
      },
      {
        heading: 'The Role of Spirituality (Broadly Defined)',
        content:
          "Spirituality — in the broad sense of connection to something larger than oneself, whether through religion, nature, community, art, or service — is one of the most robust protective factors in resilience research. It does not require specific religious belief. It requires a sense that one's life is part of a larger tapestry.\n\nHelp children access this through: quiet time in nature, community rituals, conversations about what happens after death, stories of human courage and compassion, and simple acts of service.",
      },
    ],
    references: [
      'Damon, W. (2008). The Path to Purpose. Free Press.',
      'Frankl, V. (1946). Man\'s Search for Meaning. Beacon Press.',
      'Emmons, R. (2007). Thanks! How the New Science of Gratitude Can Make You Happier. Houghton Mifflin.',
    ],
  },

  // ── Cross-Cutting / Bonus ────────────────────────────────────────────────

  {
    id: 'screen-time-resilience',
    dimension: 'cross-cutting',
    title: 'Screen Time and Resilience: A Balanced Approach',
    ageRange: 'all',
    readingTime: '8 min',
    keyTakeaways: [
      'Content and context matter far more than raw screen-time minutes',
      'Co-viewing and co-playing transform passive consumption into connection',
      'The goal is not screen abstinence but a healthy relationship with technology',
    ],
    sections: [
      {
        heading: 'What the Research Actually Says',
        content:
          "Screen time debates often generate more heat than light. The research is more nuanced than headlines suggest:\n\n• Passive, solitary consumption (endless scrolling, autoplay videos) correlates with lower wellbeing — particularly for adolescent girls on social media.\n• Active, creative, or social screen use (building in Minecraft, video calls with family, collaborative gaming) shows neutral or positive associations.\n• Context matters enormously: the same app used with a parent's engagement versus used to avoid family interaction produces different outcomes.\n• Pre-sleep screen use specifically disrupts sleep architecture and should be avoided 60+ minutes before bed regardless of content.",
      },
      {
        heading: 'Evidence-Based Screen Guidelines',
        content:
          "Based on American Academy of Pediatrics recommendations and recent research:\n\nUnder 18 months: Video chat with familiar faces only. No passive screen media.\n18–24 months: Parent-selected, high-quality content, watched together.\nAges 2–5: One hour per day of high-quality programming. Co-view when possible.\nAges 6+: Consistent limits on time and content. Ensure screens do not displace sleep, physical activity, homework, and face-to-face social time.\n\nAdolescents: The AAP recommends working with teens to create a Family Media Plan (available at healthychildren.org) rather than imposing top-down limits that invite circumvention.",
      },
      {
        heading: 'Building a Resilient Relationship with Technology',
        content:
          "The goal is to help children develop internal regulation of technology use — a skill they will need throughout their lives. Strategies:\n\n1. Create screen-free zones: mealtimes, bedrooms, the first 30 minutes after school.\n2. Practice delayed gratification: 'Finish your homework first' builds self-regulation.\n3. Use screens together: Your presence transforms the experience.\n4. Talk about media critically: 'What do you think this ad is trying to make you feel?' builds media literacy.\n5. Model the relationship you want them to have: Children notice if your phone is always in your hand.",
      },
    ],
    references: [
      'American Academy of Pediatrics (2016). Media and Young Minds. Pediatrics, 138(5).',
      'Twenge, J. (2017). iGen. Atria Books.',
      'Przybylski, A. & Weinstein, N. (2017). A Large-Scale Test of the Goldilocks Hypothesis. Psychological Science, 28(2), 204–215.',
    ],
  },

  {
    id: 'when-to-worry',
    dimension: 'cross-cutting',
    title: 'When to Worry: Normal vs. Clinical Stress in Kids',
    ageRange: 'all',
    readingTime: '9 min',
    keyTakeaways: [
      'Most childhood stress and anxiety is normal, temporary, and responds to parental support',
      'The key indicator for clinical concern is functional impairment, not intensity alone',
      'Early intervention is almost always better than waiting',
    ],
    sections: [
      {
        heading: 'The Spectrum: Normal Stress to Clinical Anxiety',
        content:
          "Stress and anxiety exist on a spectrum. On one end: normal developmental worries (separation anxiety in toddlers, social anxiety in early adolescence, performance anxiety before exams) that are transient, responsive to reassurance, and do not significantly impair function.\n\nOn the other end: clinical anxiety disorders, depression, trauma responses, and developmental conditions (ADHD, autism) that require professional assessment and support. Between these ends is a large middle zone where many children spend time — struggling but not at clinical threshold, benefiting from enhanced parental support and possibly brief professional consultation.",
      },
      {
        heading: 'Signs That Warrant Professional Consultation',
        content:
          "Consider reaching out to your paediatrician, school counsellor, or a child mental health professional if you notice:\n\n• Persistent sadness or irritability lasting more than 2 weeks\n• Withdrawal from friends, family, or activities they previously enjoyed\n• Significant sleep changes (insomnia or sleeping far more than usual)\n• Appetite changes with associated weight change\n• Declining school performance or frequent school avoidance\n• Physical complaints (stomach aches, headaches) without medical explanation, particularly before school\n• Expressions of hopelessness, worthlessness, or wishes to be dead (take these seriously every time)\n• Self-harm of any kind\n• Dramatic personality changes\n• Panic attacks\n\nAny one of these, if persistent and impairing, is worth a professional conversation.",
      },
      {
        heading: "Trust Your Gut — and Seek Help Early",
        content:
          "Parents are the best early-warning systems for their children's mental health. If something feels persistently wrong, it usually is — even if you cannot name it. The research is unambiguous: early intervention for childhood mental health challenges has significantly better outcomes than delayed intervention.\n\nSeeking a professional assessment is not a failure or an overreaction. It is appropriate parenting. Most assessments will tell you everything is within normal range — and that reassurance is itself valuable. When they identify something that needs support, you have gained the gift of early access to help.",
      },
    ],
    references: [
      'Rapee, R. et al. (2008). Helping Your Anxious Child. New Harbinger.',
      'American Academy of Child and Adolescent Psychiatry (2023). Facts for Families series.',
    ],
  },

  {
    id: 'resilience-through-play',
    dimension: 'cross-cutting',
    title: 'Building Resilience Through Play',
    ageRange: 'all',
    readingTime: '7 min',
    keyTakeaways: [
      'Play is the primary vehicle for social, emotional, and cognitive development in childhood',
      'Unstructured, child-directed play is especially protective — and increasingly rare',
      'Rough-and-tumble play, pretend play, and board games each build different resilience skills',
    ],
    sections: [
      {
        heading: "Why Play Is Serious Business",
        content:
          "Play is not a break from learning — it is the primary medium through which children learn. Through play, children process difficult emotions, rehearse social scenarios, develop executive function, build frustration tolerance, and discover their own agency. The declining time children spend in free, unstructured play — driven by increased screen time, structured activities, and academic pressure — is one of the most significant shifts in childhood over the past 50 years, and correlates with rising anxiety and depression rates.",
      },
      {
        heading: 'Types of Play and What They Build',
        content:
          "Pretend / imaginative play (ages 2–10): Develops theory of mind (understanding others' perspectives), emotional processing (playing out fears and conflicts symbolically), language, and creativity.\n\nRough-and-tumble play (ages 2–12): Builds physical awareness, emotional regulation (stopping before someone actually gets hurt requires reading signals), and comfort with physical risk. Research by Stuart Brown shows this type of play is particularly important for developing impulse control.\n\nBoard games and rule-based games (ages 4+): Teach turn-taking, losing gracefully, strategic thinking, and perseverance. Cooperative games (working together to win) build teamwork; competitive games build frustration tolerance and recovery from setbacks.\n\nFree outdoor play: Builds risk assessment, independence, gross motor development, and restoration of attention. Uneven terrain, heights, and minor physical risk in outdoor play correlate with lower anxiety and better proprioception.",
      },
      {
        heading: 'How Parents Can Protect Play',
        content:
          "1. Resist the urge to over-schedule: Every extracurricular activity displaces unstructured time. Children need both.\n2. Step back: When your child is playing, resist directing. Your presence is welcome; your management is not.\n3. Say yes to some risk: Climbing trees, building forts, navigating conflict with peers — these are healthy challenges.\n4. Play with them (on their terms): Floor play with young children, board games with school-age, pickup sports with teenagers — but let them lead the rules and tone.\n5. Protect screen-free outdoor time: Even 30 minutes of unstructured outdoor time daily has measurable wellbeing benefits.",
      },
    ],
    references: [
      'Gray, P. (2013). Free to Learn. Basic Books.',
      'Brown, S. (2009). Play: How It Shapes the Brain. Avery.',
      'Ginsburg, K.R. (2007). The importance of play in promoting healthy child development. Pediatrics, 119(1), 182–191.',
    ],
  },
];

/**
 * Unique dimensions represented in the guides (plus 'all').
 */
export const CAREGIVER_GUIDE_DIMENSIONS = [
  { key: 'all',                    label: 'All Guides',             icon: '📚' },
  { key: 'agentic-generative',     label: 'Agentic / Generative',   icon: '🚀' },
  { key: 'somatic-regulative',     label: 'Somatic / Regulative',   icon: '🌿' },
  { key: 'cognitive-narrative',    label: 'Cognitive / Narrative',  icon: '🧠' },
  { key: 'relational-connective',  label: 'Relational / Connective', icon: '🤝' },
  { key: 'emotional-adaptive',     label: 'Emotional / Adaptive',    icon: '💛' },
  { key: 'spiritual-existential',  label: 'Spiritual / Existential', icon: '✨' },
  { key: 'cross-cutting',          label: 'Cross-Cutting',           icon: '🌐' },
];

/**
 * Filter guides by dimension key (or return all).
 */
export function getCaregiverGuidesByDimension(dimension) {
  if (!dimension || dimension === 'all') return CAREGIVER_GUIDES;
  return CAREGIVER_GUIDES.filter((g) => g.dimension === dimension);
}

/**
 * Fetch a single guide by ID.
 */
export function getCaregiverGuideById(id) {
  return CAREGIVER_GUIDES.find((g) => g.id === id);
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = 'iatlas_caregiver_guides_read';

export function getReadGuideIds() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function markGuideRead(id) {
  const read = getReadGuideIds();
  if (!read.includes(id)) {
    localStorage.setItem(LS_KEY, JSON.stringify([...read, id]));
  }
}

export function isGuideRead(id) {
  return getReadGuideIds().includes(id);
}
