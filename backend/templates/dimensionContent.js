'use strict';

/**
 * dimensionContent.js — Rich content library for all 6 resilience dimensions.
 *
 * Provides personalized insights, micro-practices, weekly progressions,
 * real-world applications, and benchmark data for:
 *   - Cognitive-Narrative
 *   - Relational-Connective
 *   - Agentic-Generative
 *   - Emotional-Adaptive
 *   - Spiritual-Reflective
 *   - Somatic-Regulative
 *
 * Content is keyed by score band: 'high' (80+), 'mid' (50–79), 'low' (<50).
 *
 * Safety language: uses "may", "often", "can help" — not clinical claims.
 */

const DIMENSION_CONTENT = {
    'Cognitive-Narrative': {
        label: 'Cognitive-Narrative',
        tagline: 'The stories you tell shape the resilience you build.',
        description:
            'Cognitive-Narrative resilience reflects your capacity to make meaning from ' +
            'adversity, reframe challenges constructively, and hold a coherent story of ' +
            'your own growth. It encompasses cognitive flexibility, adaptive thinking, ' +
            'and the ability to revise unhelpful narratives with more empowering ones.',

        insight: {
            high:
                'Your Cognitive-Narrative score suggests a highly developed capacity to ' +
                'reframe difficulties and construct empowering stories about your experiences. ' +
                'You likely approach setbacks with curiosity rather than catastrophising, and ' +
                'your ability to find meaning in adversity may serve as an anchor for those ' +
                'around you.\n\n' +
                'Consider how you can mentor others in developing this skill. Sharing how you ' +
                'reframe challenges — through conversations, writing, or coaching — can ' +
                'compound the impact of this strength well beyond yourself.',
            mid:
                'Your Cognitive-Narrative score reflects a healthy ability to reframe ' +
                'difficulties, with some room to deepen that practice. You likely have periods ' +
                'of strong cognitive clarity alongside moments when old stories or limiting ' +
                'beliefs surface and challenge your perspective.\n\n' +
                'This is a rich growth zone. Small daily habits — like journaling about what a ' +
                'challenge taught you, or asking "what story am I telling myself right now?" — ' +
                'can steadily strengthen your narrative resilience over time.',
            low:
                'A lower Cognitive-Narrative score is an invitation, not a verdict. It may ' +
                'suggest that certain thought patterns or self-stories have been creating ' +
                'unnecessary suffering, or that life\'s challenges have felt hard to make sense ' +
                'of recently.\n\n' +
                'The good news is that narrative resilience is one of the most learnable forms ' +
                'of resilience. Even small shifts — noticing when you\'re telling yourself a ' +
                'catastrophic story and asking "is there another way to see this?" — can begin ' +
                'to rewire how you relate to adversity. Be patient and compassionate with ' +
                'yourself as you explore this dimension.',
        },

        strengths: {
            high: [
                'Strong capacity for cognitive reframing under pressure',
                'Ability to find meaning and lessons in adversity',
                'Narrative coherence — can tell a growth story about challenges',
                'Cognitive flexibility when faced with uncertainty',
                'Empowering self-talk and inner dialogue',
            ],
            mid: [
                'Emerging ability to reframe setbacks constructively',
                'Awareness of the stories you tell yourself',
                'Capacity to learn from difficult experiences',
                'Growing cognitive flexibility in familiar contexts',
            ],
            low: [
                'Willingness to reflect and explore your inner narrative',
                'Awareness that thought patterns affect resilience',
                'Openness to learning new cognitive approaches',
            ],
        },

        growthOpportunities: {
            high: [
                'Explore how to teach narrative reframing to others in your circle',
                'Deepen your practice by working with more complex or painful narratives',
            ],
            mid: [
                'Develop a consistent journaling practice focused on meaning-making',
                'Practice noticing and questioning automatic negative thoughts daily',
                'Explore cognitive reframing techniques (CBT, narrative therapy concepts)',
            ],
            low: [
                'Begin with a simple daily reflection: "What is one thing I learned today?"',
                'Explore whether any recurring thought patterns are limiting your resilience',
                'Consider working with a coach or therapist to explore narrative shifts',
            ],
        },

        microPractice:
            'The "Story Flip" (5 min): Write down one challenge you\'re currently facing. ' +
            'Then write out the story you\'re telling yourself about it. Finally, write a ' +
            'second version of the story that emphasises what you\'re learning and how you\'re ' +
            'growing through it. Notice how your emotional state shifts between the two versions.',

        weeklyProgression: [
            'Week 1 — Foundation: Spend 5 minutes each morning writing one empowering statement about yourself. This begins rewiring your narrative baseline.',
            'Week 2 — Awareness: Keep a "thought log" — note three automatic thoughts each day and categorise them as helpful or unhelpful. Awareness precedes change.',
            'Week 3 — Reframing: Take your most common unhelpful thought pattern and practice writing three alternative, more balanced interpretations each time it appears.',
            'Week 4 — Integration: Write your personal "resilience story" — a 1-page narrative of how you have grown through a past challenge. Read it aloud to yourself or share it with someone you trust.',
        ],

        realWorldApplication:
            'At work, strong Cognitive-Narrative resilience often shows up as an ability to ' +
            'stay solution-focused under pressure, communicate constructively during conflict, ' +
            'and learn quickly from failure without excessive self-criticism.\n\n' +
            'In relationships, it may manifest as the capacity to understand your partner\'s or ' +
            'friend\'s perspective even when emotions are high, and to hold a long-term view of ' +
            'the relationship rather than reacting only to immediate events. In personal ' +
            'challenges, it is the voice that says "this is hard, and I can grow through it."',

        lifeApplications: {
            relationships:
                'In intimate relationships, your narrative capacity helps you reframe conflicts as growth opportunities rather than threats. You can hold a larger story of the relationship beyond a single difficult moment, supporting repair and deeper understanding.',
            friendships:
                'With friends, your ability to find meaning in shared challenges creates deeper bonds. You may be the friend who helps others make sense of difficult experiences, offering perspective when emotions cloud clarity.',
            parenting:
                'As a parent or caregiver, this strength lets you model a growth mindset for children. Narrating challenges as learning experiences — "we didn\'t fail, we learned what doesn\'t work" — builds children\'s resilience from an early age.',
            work:
                'At work, strong narrative resilience means you can reframe setbacks as data, stay solution-focused under pressure, and help your team see possibility in difficult situations — a core leadership skill in complex environments.',
            personalGrowth:
                'Practices like journaling, narrative therapy, and reflective writing are particularly powerful for you. Writing the story of your challenges — then rewriting it from a growth perspective — is a transformative personal practice.',
        },

        benchmark: {
            populationMean: 62,
            percentileMap: { 90: 85, 75: 72, 50: 62, 25: 48, 10: 35 },
        },
    },

    'Relational-Connective': {
        label: 'Relational-Connective',
        tagline: 'Deep connections are the scaffolding of human resilience.',
        description:
            'Relational-Connective resilience reflects your capacity to build, nurture, and ' +
            'draw sustenance from meaningful relationships. It encompasses trust, empathy, ' +
            'vulnerability, boundary-setting, and the ability to both give and receive support ' +
            'during difficult times.',

        insight: {
            high:
                'Your Relational-Connective score reflects a rich capacity for deep, ' +
                'meaningful connection. You likely find that your relationships are a major ' +
                'source of strength during adversity, and that you are naturally skilled at ' +
                'both offering and receiving support.\n\n' +
                'One area worth exploring at this level of strength: are you applying this ' +
                'relational intelligence equally to your relationship with yourself? ' +
                'Self-compassion and inner connection are the often-overlooked dimension of ' +
                'relational resilience, and may be worth deepening alongside your external bonds.',
            mid:
                'Your Relational-Connective score suggests meaningful connections are present ' +
                'in your life, alongside some areas to deepen. Perhaps there are relationships ' +
                'you\'ve been neglecting, or patterns of isolation during stress that this ' +
                'dimension is pointing to.\n\n' +
                'Even small investments — a regular check-in call with a close friend, being ' +
                'more honest about your struggles with someone you trust — can significantly ' +
                'strengthen this dimension.',
            low:
                'A lower Relational-Connective score may reflect experiences of isolation, ' +
                'difficulty trusting others, or patterns of pulling away during times of stress. ' +
                'This is more common than you might think, and it doesn\'t define you.\n\n' +
                'Human beings are wired for connection, and even small steps toward reaching ' +
                'out can have a profound effect on resilience. You don\'t need a large social ' +
                'circle — depth matters more than breadth. Consider who in your life you feel ' +
                'even slightly safe with, and start there.',
        },

        strengths: {
            high: [
                'Deep empathy and emotional attunement with others',
                'Capacity to build trust quickly and authentically',
                'Comfort with vulnerability and open communication',
                'Strong support network to draw on during adversity',
                'Ability to give and receive help without ego',
            ],
            mid: [
                'Genuine care for the people in your life',
                'Capacity for meaningful one-on-one connection',
                'Awareness of when you need support from others',
                'Willingness to invest in important relationships',
            ],
            low: [
                'Recognition that connection matters for resilience',
                'Potential depth in close relationships you do have',
                'Capacity to connect when conditions feel safe',
            ],
        },

        growthOpportunities: {
            high: [
                'Develop your capacity for self-compassion and inner connection',
                'Explore how to teach relational skills to others (mentoring, coaching)',
            ],
            mid: [
                'Schedule one meaningful connection per week — quality over quantity',
                'Practice vulnerability: share something real with someone you trust',
                'Identify and nurture your two or three most important relationships',
            ],
            low: [
                'Begin with low-risk connection: a brief check-in with one person weekly',
                'Explore any past experiences that may be limiting trust or openness',
                'Practice the skill of asking for help — start small and notice what happens',
            ],
        },

        microPractice:
            'The "Connection Ping" (5 min): Reach out to one person today with a genuine, ' +
            'specific message — not "how are you?" but something like "I was thinking of you ' +
            'because..." or "I wanted to say thank you for...". This micro-act of intentional ' +
            'connection builds the relational muscle even in small doses.',

        weeklyProgression: [
            'Week 1 — Mapping: Write down the 5 people who mean most to you. For each, note when you last had a meaningful conversation. This creates awareness of your relational investment.',
            'Week 2 — Deepening: Schedule one uninterrupted, phone-free conversation with someone important to you. Practice asking open questions and listening without fixing.',
            'Week 3 — Vulnerability: Share something you\'ve been carrying alone with one trusted person. Notice what happens to the weight of the challenge when it is shared.',
            'Week 4 — Reciprocity: Ask someone in your life how they are — really. Practice being fully present for their answer. Reciprocal care strengthens relational bonds.',
        ],

        realWorldApplication:
            'In professional settings, high Relational-Connective resilience often translates ' +
            'to strong collaboration, effective conflict resolution, and the ability to build ' +
            'psychological safety in teams. Leaders with this strength tend to create ' +
            'environments where people feel seen and heard.\n\n' +
            'In personal life, this dimension is the foundation of lasting partnerships, ' +
            'deep friendships, and the kind of community support that helps people navigate ' +
            'major life challenges. It is also protective against the isolation that ' +
            'can amplify mental health struggles.',

        lifeApplications: {
            relationships:
                'In intimate partnerships, relational resilience means you can maintain connection even during conflict — staying present, listening deeply, and prioritising the relationship over being right. This is the foundation of lasting love.',
            friendships:
                'With friends, this strength creates the depth and longevity that makes friendships feel like family. You invest in reciprocal care, show up authentically, and create the safety that allows true vulnerability.',
            parenting:
                'As a parent, relational resilience translates to secure attachment — being emotionally available, responsive, and consistent. Children who experience this foundation are significantly more resilient across all dimensions.',
            work:
                'In professional settings, this dimension drives collaboration, psychological safety, and the kind of team trust that unlocks peak performance. Leaders here create environments where people feel genuinely seen and valued.',
            personalGrowth:
                'Your growth edge is often turning this relational intelligence toward yourself — building self-compassion, inner connection, and the ability to be with your own experience as generously as you are with others.',
        },

        benchmark: {
            populationMean: 60,
            percentileMap: { 90: 83, 75: 71, 50: 60, 25: 47, 10: 33 },
        },
    },

    'Agentic-Generative': {
        label: 'Agentic-Generative',
        tagline: 'Agency is the courage to act, even in uncertainty.',
        description:
            'Agentic-Generative resilience reflects your sense of personal agency — the ' +
            'belief that your actions matter and that you have the capacity to create, ' +
            'generate, and initiate positive change. It encompasses self-efficacy, ' +
            'proactive problem-solving, initiative, and a generative orientation toward ' +
            'challenges.',

        insight: {
            high:
                'Your Agentic-Generative score reflects a strong sense of personal agency and ' +
                'self-efficacy. You likely approach challenges as problems to be solved rather ' +
                'than fates to be endured, and you may be the person others turn to when they ' +
                'need someone to take action and drive change.\n\n' +
                'A potential shadow side of high agency worth exploring: the tendency to ' +
                'over-function or resist receiving help. True resilience includes knowing when ' +
                'to act and when to rest, when to lead and when to follow.',
            mid:
                'Your Agentic-Generative score suggests a healthy foundation of personal ' +
                'agency with room to deepen. You likely take action in some areas of your ' +
                'life with confidence while experiencing hesitation or self-doubt in others.\n\n' +
                'Building this dimension often comes from accumulating evidence of your own ' +
                'capability — starting with small, concrete actions and noting the impact they ' +
                'have. Each completed action builds the neural circuitry of agency.',
            low:
                'A lower Agentic-Generative score may suggest feelings of helplessness, ' +
                'being stuck, or a sense that your actions don\'t fully matter. This is often ' +
                'a response to genuinely difficult circumstances rather than a fixed trait.\n\n' +
                'The path forward begins with the smallest possible action. Not a plan, not a ' +
                'strategy — just one thing you can do today that moves you one step in a ' +
                'direction you care about. Agency is rebuilt one action at a time.',
        },

        strengths: {
            high: [
                'Strong self-efficacy and belief in your own capacity',
                'Proactive orientation — acts before problems escalate',
                'Creative problem-solving under pressure',
                'Ability to initiate change rather than waiting for it',
                'Generates momentum and energy in challenging situations',
            ],
            mid: [
                'Capacity for decisive action in familiar contexts',
                'Growing confidence in your ability to create change',
                'Problem-solving orientation when engaged',
                'Willingness to take initiative when the path is clear',
            ],
            low: [
                'Awareness that agency is important for resilience',
                'Capacity for action when supported by others',
                'Potential for growth through structured challenges',
            ],
        },

        growthOpportunities: {
            high: [
                'Explore the balance between action and reflection — are you acting from choice or compulsion?',
                'Practice delegation and trusting others\' agency as a form of generativity',
            ],
            mid: [
                'Set one small, specific, time-bound goal each week and complete it',
                'Identify the areas where you feel most helpless and take one small action there',
                'Build a "wins journal" to accumulate evidence of your own capability',
            ],
            low: [
                'Start with a "tiny wins" practice: one small, completable task each day',
                'Identify one area of your life where you do feel some agency, and expand from there',
                'Explore any past experiences that may have taught you that your actions don\'t matter',
            ],
        },

        microPractice:
            '"The One Thing" (10 min): Each morning, identify the single most important ' +
            'action you could take today that would move your life forward. Do it first. ' +
            'The act of completing this one intentional action — however small — strengthens ' +
            'the neural pathways of agency and generates momentum for the day.',

        weeklyProgression: [
            'Week 1 — Activation: Complete one small, meaningful action each day that you choose deliberately. Document each one. The goal is to build evidence of your own agency.',
            'Week 2 — Expansion: Identify one area of your life where you\'ve been feeling stuck. Take three small, concrete steps toward movement — not a plan, just actions.',
            'Week 3 — Challenge: Take on one thing that is slightly outside your comfort zone — a conversation you\'ve been avoiding, a project you\'ve been delaying. Agentic resilience grows at the edge of comfort.',
            'Week 4 — Integration: Reflect on the month: What did you create or initiate? How does it feel to look back at concrete evidence of your own agency? Set one meaningful goal for the next 30 days.',
        ],

        realWorldApplication:
            'In professional contexts, Agentic-Generative resilience often manifests as ' +
            'entrepreneurial thinking, comfort with ambiguity, and the ability to move ' +
            'projects forward without needing complete certainty. It is associated with ' +
            'leadership effectiveness and career resilience.\n\n' +
            'In personal life, this dimension helps you navigate major life transitions — ' +
            'career changes, relationship challenges, health setbacks — with a sense that ' +
            'you have choices, even when the path is unclear. It is the antidote to ' +
            'learned helplessness.',

        lifeApplications: {
            relationships:
                'In relationships, personal agency means you can initiate difficult conversations, take responsibility for your part in challenges, and proactively invest in the health of the relationship rather than waiting for things to improve on their own.',
            friendships:
                'You\'re the friend who follows through — who remembers to check in, who initiates the gathering, who takes action when someone is struggling. This reliability and initiative makes you a deeply valued presence in others\' lives.',
            parenting:
                'With children, modeling agency is one of the greatest gifts you can offer. Teaching children that their choices matter, that effort leads to growth, and that they can create change — these lessons protect against learned helplessness and build lifelong confidence.',
            work:
                'Professionally, this dimension is the engine of entrepreneurship, leadership, and career resilience. You navigate change proactively, drive initiatives forward, and don\'t wait for permission to create value — making you highly adaptable.',
            personalGrowth:
                'Your personal growth accelerates when you take deliberate, consistent action on your development — setting specific goals, completing micro-challenges, and building a track record of intentional change that compounds over time.',
        },

        benchmark: {
            populationMean: 65,
            percentileMap: { 90: 87, 75: 76, 50: 65, 25: 52, 10: 38 },
        },
    },

    'Emotional-Adaptive': {
        label: 'Emotional-Adaptive',
        tagline: 'Emotions are data, not directives. Mastering them is mastering resilience.',
        description:
            'Emotional-Adaptive resilience reflects your capacity to recognise, experience, ' +
            'and regulate emotions without being overwhelmed by them. It encompasses ' +
            'emotional awareness, emotional regulation skills, tolerance for difficult ' +
            'feelings, and the ability to process emotions in healthy ways rather than ' +
            'suppressing or being controlled by them.',

        insight: {
            high:
                'Your Emotional-Adaptive score suggests a well-developed capacity for ' +
                'emotional awareness and regulation. You likely have a rich emotional ' +
                'vocabulary, can sit with difficult feelings without being destabilised, and ' +
                'process emotions in ways that support rather than undermine your resilience.\n\n' +
                'At this level, consider how you can use this emotional intelligence to ' +
                'support others. The capacity to hold space for someone else\'s emotional ' +
                'experience — without trying to fix it or making it about you — is a gift ' +
                'that can profoundly impact those around you.',
            mid:
                'Your Emotional-Adaptive score reflects a meaningful capacity for emotional ' +
                'awareness with areas to develop further. You likely handle certain emotions ' +
                'well while others — perhaps anger, sadness, or anxiety — still have a way ' +
                'of taking over in certain situations.\n\n' +
                'Growing this dimension is largely about expanding your emotional range: ' +
                'getting more comfortable with the full spectrum of human feeling, including ' +
                'the uncomfortable ones. Emotions that are resisted tend to persist; ' +
                'those that are allowed to move tend to pass.',
            low:
                'A lower Emotional-Adaptive score may suggest that emotions are often ' +
                'overwhelming, hard to identify, or that you tend to push them away to ' +
                'keep functioning. Many people have learned to survive by minimising ' +
                'emotional experience — this is often adaptive in harsh environments.\n\n' +
                'Building emotional resilience is gradual work. It begins with simply ' +
                'noticing what you feel — not fixing it, not judging it, just naming it. ' +
                '"I notice I\'m feeling anxious" is an act of emotional courage. ' +
                'Be compassionate with yourself as you explore this territory.',
        },

        strengths: {
            high: [
                'Rich emotional vocabulary and awareness',
                'Capacity to experience difficult emotions without being overwhelmed',
                'Strong emotional regulation skills under pressure',
                'Ability to process and release emotions in healthy ways',
                'Empathy and emotional attunement with others',
            ],
            mid: [
                'Meaningful self-awareness about emotional states',
                'Capacity to manage emotions in lower-stress situations',
                'Growing tolerance for emotional discomfort',
                'Awareness of how emotions affect your behaviour',
            ],
            low: [
                'Awareness that emotional wellbeing matters for resilience',
                'Capacity for emotional connection in safe environments',
                'Willingness to explore this dimension further',
            ],
        },

        growthOpportunities: {
            high: [
                'Deepen your capacity to hold space for others\' emotional experiences',
                'Explore shadow emotions — the ones you still tend to avoid or minimise',
            ],
            mid: [
                'Practice naming emotions with precision — there are hundreds of words, not just "good" and "bad"',
                'Develop a regular emotion-processing practice: journaling, art, movement, or therapy',
                'Identify your most common emotional triggers and practise responding rather than reacting',
            ],
            low: [
                'Start with the simplest practice: at the end of each day, name one emotion you felt',
                'Explore whether there are emotions you were taught were "not allowed" — this is often at the root of emotional disconnection',
                'Consider working with a therapist or counsellor who specialises in emotional processing',
            ],
        },

        microPractice:
            '"The RAIN Practice" (10 min): When you notice a difficult emotion:\n' +
            '  R — Recognise what you are feeling. Name it.\n' +
            '  A — Allow it to be there without trying to fix or suppress it.\n' +
            '  I — Investigate with gentle curiosity: where do you feel it in your body?\n' +
            '  N — Nurture with self-compassion: what would you say to a friend feeling this?\n' +
            'This 4-step practice builds emotional resilience one experience at a time.',

        weeklyProgression: [
            'Week 1 — Naming: Practice naming emotions as they arise throughout the day. Use a "feelings wheel" to expand your emotional vocabulary beyond "good" and "bad".',
            'Week 2 — Body Awareness: Notice where emotions live in your body. Stress in the chest, sadness as heaviness, anxiety as tightening — building this awareness is a form of emotional intelligence.',
            'Week 3 — Expression: Find one healthy way to express an emotion that you\'ve been holding: write it, draw it, move it, say it to someone safe. Emotions need expression, not just management.',
            'Week 4 — Integration: Reflect on what your emotions have been trying to tell you this month. Emotions are information — what information have you been receiving?',
        ],

        realWorldApplication:
            'In professional settings, Emotional-Adaptive resilience is a core component ' +
            'of effective leadership, team dynamics, and conflict resolution. The capacity ' +
            'to remain emotionally regulated under pressure, to empathise with colleagues, ' +
            'and to process difficult feedback without defensiveness is increasingly ' +
            'recognised as a critical professional skill.\n\n' +
            'In personal life, this dimension underpins the quality of all close ' +
            'relationships. The capacity to express vulnerability, to sit with a partner\'s ' +
            'pain, and to repair ruptures through emotional honesty is the foundation of ' +
            'lasting intimate bonds.',

        lifeApplications: {
            relationships:
                'Emotional intelligence is the primary currency of intimate relationships. The capacity to express your own feelings clearly, receive your partner\'s emotions without defensiveness, and repair ruptures through emotional honesty is the basis of lasting connection.',
            friendships:
                'With friends, emotional resilience means you can be present for their struggles without either minimising or absorbing their pain. You create the rare kind of friendship where both people feel genuinely understood.',
            parenting:
                'Parents who model emotional regulation give children one of the most valuable life skills. Naming your emotions, processing them openly and appropriately, and helping children navigate their own emotional worlds builds emotional intelligence from the earliest years.',
            work:
                'In professional contexts, emotional regulation is increasingly recognised as a critical leadership competency — staying grounded under pressure, receiving critical feedback without defensiveness, and managing team emotional dynamics effectively.',
            personalGrowth:
                'Your emotional life is a rich source of information about what you value, what you need, and where you are growing. Developing practices to process and express emotions — rather than suppress or be overwhelmed by them — accelerates growth in all dimensions.',
        },

        benchmark: {
            populationMean: 58,
            percentileMap: { 90: 82, 75: 70, 50: 58, 25: 45, 10: 30 },
        },
    },

    'Spiritual-Reflective': {
        label: 'Spiritual-Reflective',
        tagline: 'A sense of purpose is the deepest anchor in life\'s storms.',
        description:
            'Spiritual-Reflective resilience encompasses your sense of meaning, purpose, ' +
            'and connection to something larger than yourself. It includes values clarification, ' +
            'existential grounding, reflective practice, and the capacity to find coherence ' +
            'and significance in your life — regardless of religious or non-religious orientation.',

        insight: {
            high:
                'Your Spiritual-Reflective score suggests a deep connection to meaning, ' +
                'purpose, and the larger arc of your life. You likely have a clear sense of ' +
                'what matters most to you, and this clarity may serve as a compass during ' +
                'periods of uncertainty or loss.\n\n' +
                'At this level of reflective depth, consider how you carry and share this ' +
                'orientation with others. Meaning-making is contagious — the way you ' +
                'articulate purpose and navigate existential challenges can provide profound ' +
                'support to those around you who are searching.',
            mid:
                'Your Spiritual-Reflective score suggests a meaningful connection to purpose ' +
                'with room to deepen. Perhaps life\'s busyness has crowded out reflection, ' +
                'or certain existential questions feel unresolved.\n\n' +
                'This dimension often grows through dedicated stillness and intentional ' +
                'reflection — practices like meditation, journaling, time in nature, or ' +
                'meaningful community. Even 10 minutes a day of reflective practice can ' +
                'steadily strengthen this dimension.',
            low:
                'A lower Spiritual-Reflective score may reflect a period of existential ' +
                'uncertainty, a sense that life lacks meaning or direction, or simply that ' +
                'this inner dimension hasn\'t been tended to amid the demands of life.\n\n' +
                'This is a powerful area to explore. The question "what do I care about?" ' +
                'is not abstract — it points toward the activities, relationships, and ' +
                'contributions that are most worthy of your limited time and energy. ' +
                'Begin there.',
        },

        strengths: {
            high: [
                'Clear and stable sense of personal values and purpose',
                'Capacity to find meaning even in suffering',
                'Rich reflective practice that deepens self-understanding',
                'Connection to something larger — community, nature, legacy, or transcendence',
                'Existential groundedness during major life transitions',
            ],
            mid: [
                'Awareness of what matters most to you',
                'Capacity for self-reflection and introspection',
                'Growing connection to personal values',
                'Openness to existential questions and exploration',
            ],
            low: [
                'Willingness to explore meaning and purpose',
                'Capacity for reflection when given space',
                'Openness to developing this dimension',
            ],
        },

        growthOpportunities: {
            high: [
                'Explore how to transmit your sense of meaning and purpose to others',
                'Deepen contemplative practices that challenge comfortable assumptions',
            ],
            mid: [
                'Establish a daily reflective practice — even 10 minutes of journaling or meditation',
                'Clarify your top 3-5 personal values and examine whether your daily life aligns with them',
                'Engage with a community, cause, or practice that connects you to something larger',
            ],
            low: [
                'Start with the "purpose question": what do you care about enough to still be doing in 10 years?',
                'Explore nature, art, music, or any domain that creates a sense of awe or transcendence',
                'Consider a values clarification exercise to identify what actually matters to you',
            ],
        },

        microPractice:
            '"The Gratitude Anchor" (5 min): Each evening, write down three things you are ' +
            'genuinely grateful for — not generic statements but specific moments, people, ' +
            'or experiences from the day. Then write one sentence about what gave your day ' +
            'meaning. This simple practice steadily builds the neural pathways of purpose ' +
            'and meaning-making.',

        weeklyProgression: [
            'Week 1 — Values Audit: Write down your top 5 personal values. Then assess: on a scale of 1-10, how much does your daily life reflect each value? The gap is your growth edge.',
            'Week 2 — Stillness: Commit to 10 minutes of intentional stillness each day — meditation, mindful walking, or simply sitting without a device. Reflection requires space.',
            'Week 3 — Legacy Letter: Write a one-page letter from your future self, looking back on a life well-lived. What did you create? How did you show up? This exercise clarifies what matters most.',
            'Week 4 — Community: Connect with a community, cause, or practice that expresses your values — volunteer work, a spiritual community, a creative collective. Purpose is amplified in relationship.',
        ],

        realWorldApplication:
            'At work, Spiritual-Reflective resilience often manifests as clarity of ' +
            'purpose, principled decision-making, and the ability to maintain integrity ' +
            'under pressure. Leaders with high scores here tend to inspire others through ' +
            'the quality of their conviction and the coherence of their values.\n\n' +
            'In personal life, this dimension is the source of what Viktor Frankl called ' +
            '"the last human freedom" — the ability to choose one\'s attitude toward ' +
            'unavoidable suffering. When life is genuinely hard, a strong sense of meaning ' +
            'is often the difference between endurance and despair.',

        lifeApplications: {
            relationships:
                'When both people in a relationship share a sense of purpose or values, it creates a depth of connection that transcends the practical. Clarifying and sharing your values with loved ones builds a shared compass for navigating life together.',
            friendships:
                'Friendships grounded in shared meaning and genuine inquiry have a particular depth. You may find your most nourishing friendships involve conversations that leave you more alive — exploring what matters, what you believe, and how to live well.',
            parenting:
                'Helping children develop their own sense of meaning and values — rather than just imposing yours — is a profound parenting practice. Creating family rituals, shared traditions, and space for deep questions builds spiritual resilience for the next generation.',
            work:
                'Purpose-driven work is consistently associated with higher performance, greater wellbeing, and lower burnout. Connecting your daily work to a larger purpose — even in small ways — transforms the quality of your engagement and the sustainability of your effort.',
            personalGrowth:
                'Reflective practices — meditation, journaling, time in nature, contemplative reading — are the primary tools for developing this dimension. Even 10 minutes of intentional reflection daily can steadily build existential groundedness over time.',
        },

        benchmark: {
            populationMean: 55,
            percentileMap: { 90: 80, 75: 68, 50: 55, 25: 42, 10: 28 },
        },
    },

    'Somatic-Regulative': {
        label: 'Somatic-Regulative',
        tagline: 'The body keeps the score — and it also holds the solution.',
        description:
            'Somatic-Regulative resilience reflects your capacity to regulate your nervous ' +
            'system, listen to your body\'s signals, and use physical and somatic practices ' +
            'to restore balance after stress. It encompasses body awareness, physical ' +
            'self-care, breathwork, movement, sleep, and the connection between physical ' +
            'and emotional states.',

        insight: {
            high:
                'Your Somatic-Regulative score suggests a well-developed connection to your ' +
                'body\'s wisdom and a strong capacity for physical and nervous-system ' +
                'regulation. You likely notice stress early in your body — before it becomes ' +
                'overwhelming — and have effective practices for returning to balance.\n\n' +
                'At this level, consider how somatic intelligence can be shared or taught. ' +
                'Many people are deeply disconnected from their bodies and don\'t know how to ' +
                'use physical practices for emotional regulation. You may be able to model ' +
                'and teach this skill in meaningful ways.',
            mid:
                'Your Somatic-Regulative score reflects a meaningful connection to physical ' +
                'wellbeing with room to deepen body-based regulation. Perhaps you have some ' +
                'physical practices in place but they are inconsistent, or stress tends to ' +
                'accumulate in your body before you attend to it.\n\n' +
                'Small, consistent physical practices — even 10 minutes of intentional ' +
                'movement or breathwork each day — can significantly strengthen this ' +
                'dimension and create a more regulated nervous system baseline.',
            low:
                'A lower Somatic-Regulative score may reflect a pattern of disconnection ' +
                'from physical experience — living primarily "from the neck up" — or a ' +
                'period in which self-care has been depleted by stress or circumstance.\n\n' +
                'The body is an extraordinary resource for resilience that many people ' +
                'never fully access. Even the simplest practices — three slow, deep breaths ' +
                'before a stressful meeting, a 10-minute walk, a moment of noticing physical ' +
                'sensation — can begin to restore the somatic foundation of resilience.',
        },

        strengths: {
            high: [
                'Strong nervous system regulation and recovery capacity',
                'Attunement to body signals before they become overwhelming',
                'Consistent physical self-care practices',
                'Effective use of breathwork, movement, or other somatic tools',
                'Physical vitality as a foundation for emotional resilience',
            ],
            mid: [
                'Awareness of the connection between physical and emotional states',
                'Some physical self-care practices in place',
                'Capacity for nervous system regulation in lower-stress periods',
                'Recognition of the body as a resilience resource',
            ],
            low: [
                'Awareness that physical wellbeing affects resilience',
                'Capacity for regulation with guidance or support',
                'Openness to developing a physical practice',
            ],
        },

        growthOpportunities: {
            high: [
                'Explore more advanced somatic practices (yoga nidra, trauma-sensitive yoga, etc.)',
                'Share somatic tools with others — model nervous-system regulation',
            ],
            mid: [
                'Establish a consistent daily movement practice, even if only 10 minutes',
                'Learn and practise one breathwork technique for stress regulation',
                'Prioritise sleep as a non-negotiable pillar of somatic resilience',
            ],
            low: [
                'Begin with one small daily act of physical self-care: a walk, a stretch, three deep breaths',
                'Practice the "body scan" before sleep — notice and release physical tension progressively',
                'Explore any patterns of disconnection from your body — this is often protective but worth examining',
            ],
        },

        microPractice:
            '"The 4-7-8 Reset" (3 min): When you notice stress building, use this breath:\n' +
            '  Inhale for 4 counts\n' +
            '  Hold for 7 counts\n' +
            '  Exhale slowly for 8 counts\n' +
            'Repeat 4 times. This activates the parasympathetic nervous system and can shift ' +
            'your state within minutes. Use it before difficult conversations, meetings, or ' +
            'any moment when you need to return to calm.',

        weeklyProgression: [
            'Week 1 — Body Baseline: Spend 5 minutes each morning doing a simple body scan — notice where you hold tension, where you feel ease. This builds the interoceptive awareness that underlies somatic resilience.',
            'Week 2 — Movement: Add 20 minutes of intentional movement each day — walking, yoga, dancing, whatever feels right. Notice how movement affects your emotional state and energy levels.',
            'Week 3 — Breathwork: Learn and practise one breathwork technique daily (box breathing, 4-7-8, or diaphragmatic breathing). Conscious breath is the most accessible nervous-system regulation tool.',
            'Week 4 — Sleep & Recovery: Audit your sleep practices this week. Create a consistent wind-down routine: no screens 30 minutes before bed, a brief body relaxation, consistent sleep and wake times. Recovery is the foundation of resilience.',
        ],

        realWorldApplication:
            'In high-pressure professional environments, Somatic-Regulative resilience is ' +
            'the difference between reactive decision-making and grounded leadership. The ' +
            'capacity to regulate your nervous system in real time — to return to calm ' +
            'before responding — is a critical executive function skill.\n\n' +
            'In personal life, somatic resilience underpins energy, mood, and the capacity ' +
            'to be fully present with the people you love. When the body is chronically ' +
            'dysregulated by stress, everything else — relationships, creativity, purpose — ' +
            'becomes harder. Tending to this dimension creates the physical foundation for ' +
            'all other forms of resilience.',

        lifeApplications: {
            relationships:
                'Physical co-regulation is a powerful dimension of intimate relationships. When you are calm and grounded, your nervous system communicates safety to your partner\'s. Developing somatic awareness helps you show up as a regulating presence rather than a dysregulating one.',
            friendships:
                'Shared physical activities — walking, sport, dance, cooking together — are not just pleasant; they are powerful nervous system regulators. Embodied connection often creates the safety for deeper conversations than sitting face to face.',
            parenting:
                'Children regulate their nervous systems through co-regulation with calm caregivers. Your physical presence, your tone, your breath, and your body language communicate safety or danger to children before any words are spoken. Somatic resilience is transmitted, not just taught.',
            work:
                'Physical wellbeing directly affects cognitive performance, emotional regulation, and creative capacity. Sleep, movement, and breath are not lifestyle extras — they are professional tools. Leaders who prioritise somatic health consistently perform more sustainably.',
            personalGrowth:
                'Your body is your most immediate and accessible resilience tool. Daily movement, conscious breathing, adequate sleep, and mindful physical experience are the foundation on which all other growth is built. Start here when rebuilding resilience from the ground up.',
        },

        benchmark: {
            populationMean: 57,
            percentileMap: { 90: 81, 75: 69, 50: 57, 25: 44, 10: 29 },
        },
    },
};

/**
 * Get the score band ('high', 'mid', or 'low') for a given percentage score.
 * @param {number} percentage
 * @returns {'high' | 'mid' | 'low'}
 */
function getScoreBand(percentage) {
    if (percentage >= 80) return 'high';
    if (percentage >= 50) return 'mid';
    return 'low';
}

/**
 * Calculate the approximate percentile rank for a score within a dimension.
 * @param {string} dimension - Dimension name
 * @param {number} percentage - Score percentage
 * @returns {number} Estimated percentile (0–99)
 */
function calculatePercentile(dimension, percentage) {
    const content = DIMENSION_CONTENT[dimension];
    if (!content) return 50;
    const { percentileMap } = content.benchmark;

    const thresholds = Object.keys(percentileMap)
        .map(Number)
        .sort((a, b) => b - a);

    for (const score of thresholds) {
        if (percentage >= percentileMap[score]) {
            return score;
        }
    }
    return 5;
}

/**
 * Get the level label for a given percentage score.
 * @param {number} percentage
 * @returns {'strong' | 'solid' | 'developing' | 'emerging'}
 */
function getLevel(percentage) {
    if (percentage >= 80) return 'strong';
    if (percentage >= 65) return 'solid';
    if (percentage >= 50) return 'developing';
    return 'emerging';
}

module.exports = {
    DIMENSION_CONTENT,
    getScoreBand,
    calculatePercentile,
    getLevel,
};
