'use strict';

/**
 * archetypes.js — Profile archetype definitions for The Resilience Atlas™.
 *
 * Archetypes are assigned based on an individual's top 1–2 dominant dimensions.
 * They provide a memorable, narrative identity that helps users understand
 * their unique resilience profile and how it shows up in the world.
 *
 * Each archetype includes:
 *   - name: the archetype label
 *   - emoji: visual identifier
 *   - description: rich narrative description
 *   - superpowers: what this archetype naturally excels at
 *   - blindSpots: common challenge areas for this archetype
 *   - stressResponse: how this archetype responds under pressure
 *   - copingStrategies: personalised coping approaches
 *   - groundingTechniques: physical/somatic grounding approaches
 *   - teamRole: how this archetype typically shows up in teams
 *   - partnershipTips: relationship dynamics and recommendations
 */

const ARCHETYPES = {
    'The Thinker': {
        name: 'The Thinker',
        primaryDimension: 'Cognitive-Narrative',
        emoji: '🧠',
        description:
            'The Thinker is the master storyteller of resilience — someone who processes ' +
            'adversity through the power of meaning-making, cognitive reframing, and the ' +
            'ability to construct empowering narratives from difficult experiences. You ' +
            'likely approach challenges analytically, seeking understanding before action, ' +
            'and find that clarity of thought is one of your most powerful resilience tools.\n\n' +
            'The Thinker\'s gift is perspective. Where others see crisis, you often find ' +
            'pattern. Where others see failure, you find data. This cognitive flexibility ' +
            'makes you particularly resilient in complex, ambiguous environments.',
        superpowers: [
            'Reframing challenges as growth opportunities',
            'Finding meaning and lessons in adversity',
            'Cognitive flexibility under uncertainty',
            'Strategic thinking and long-term perspective',
            'Helping others make sense of difficult experiences',
        ],
        blindSpots: [
            'Can over-analyse rather than feel and process emotions',
            'May intellectualise pain rather than allowing full emotional processing',
            'Risk of analysis paralysis — thinking as a substitute for action',
            'May struggle when logic cannot resolve an emotionally complex situation',
        ],
        stressResponse:
            'Under pressure, The Thinker typically retreats into cognitive processing — ' +
            'analysing, planning, strategising. This can be a powerful resilience asset when ' +
            'clear thinking is needed, but may lead to emotional bypassing when what\'s ' +
            'really needed is to feel and release.',
        copingStrategies: [
            'Journaling to externalise and organise thoughts under stress',
            'The "5 Whys" — drilling down to the root of what\'s really challenging you',
            'Seeking a trusted thinking partner to process challenges aloud',
            'Scheduled "thinking time" to contain rumination and prevent overthinking',
            'Deliberate pauses between thought and action to avoid reactive decisions',
        ],
        groundingTechniques: [
            'Brief body scans to reconnect with physical experience when over-thinking',
            'The "name 5 things you can see" sensory grounding exercise',
            'Walking meditation to combine cognitive and somatic regulation',
            'Cold water on the face or wrists to quickly shift nervous system state',
        ],
        teamRole:
            'In teams, The Thinker often serves as the strategic analyst and sense-maker — ' +
            'the person who can step back and see the bigger picture, reframe setbacks, and ' +
            'help others find meaning in challenging work. Watch for a tendency to dominate ' +
            'discussions with analysis at the expense of emotional attunement.',
        partnershipTips: [
            'Partners who complement your analytical strength with emotional warmth may help balance your profile',
            'Practice "listening to understand" rather than "listening to solve" in close relationships',
            'Regularly ask yourself: am I being present right now, or am I in my head?',
            'Your insights are a gift — share them generously, but check that the other person wants input, not just to be heard',
        ],
    },

    'The Connector': {
        name: 'The Connector',
        primaryDimension: 'Relational-Connective',
        emoji: '🤝',
        description:
            'The Connector is the relational heart of any community — someone who draws ' +
            'strength from and gives strength through deep, authentic connections. Your ' +
            'resilience is fundamentally interpersonal: you process, heal, create, and ' +
            'thrive in relationship with others.\n\n' +
            'The Connector\'s gift is belonging. You create environments where others feel ' +
            'seen, heard, and valued — and this social magnetism means you are rarely ' +
            'navigating difficulty alone. Your network is your net worth in the most ' +
            'profound sense of the word.',
        superpowers: [
            'Building trust and psychological safety quickly',
            'Sustaining meaningful relationships through adversity',
            'Deep empathy and emotional attunement',
            'Creating belonging and community',
            'Mobilising support from others when needed',
        ],
        blindSpots: [
            'May over-extend in service of others at the expense of self',
            'Risk of codependency or difficulty maintaining healthy boundaries',
            'May struggle with decisions that require prioritising self over relationship',
            'Isolation or disconnection during stress can feel particularly destabilising',
        ],
        stressResponse:
            'Under pressure, The Connector typically seeks others — reaching out, ' +
            'processing aloud, drawing on their support network. This is a healthy and ' +
            'effective stress response, but it\'s important to also develop self-soothing ' +
            'capacity so that not all regulation is dependent on external connection.',
        copingStrategies: [
            'Reaching out to a trusted person within 24 hours of a significant stressor',
            'Community or group activities that restore a sense of belonging',
            'Scheduled check-ins with close connections during extended difficult periods',
            'The practice of also self-connecting — journaling, self-compassion, inner dialogue',
            'Setting intentional limits on how much you take on for others during high-stress periods',
        ],
        groundingTechniques: [
            'Heart-centred breathing — breathing into the heart space to activate relational safety',
            'Physical touch (hugs, hand-holding) as a regulation tool with trusted others',
            'Communal activities: cooking with others, shared meals, group movement',
            'Loving-kindness meditation for self and others',
        ],
        teamRole:
            'In teams, The Connector is often the social glue and culture-keeper — the ' +
            'person who notices when someone is struggling, who builds bridges between ' +
            'individuals, and who creates the psychological safety that allows teams to ' +
            'perform at their best. Watch for the tendency to prioritise harmony over ' +
            'necessary conflict or honest feedback.',
        partnershipTips: [
            'Your relational capacity is extraordinary — ensure it includes yourself as fully as it includes others',
            'Practise asking for what you need rather than always attending to others\' needs first',
            'Healthy boundaries are not barriers to connection — they are what make deep connection sustainable',
            'Partners who can match your depth of connection while also supporting your independence may be most nourishing',
        ],
    },

    'The Navigator': {
        name: 'The Navigator',
        primaryDimension: 'Agentic-Generative',
        emoji: '🧭',
        description:
            'The Navigator is the action-oriented architect of resilience — someone who ' +
            'responds to adversity by generating movement, creating options, and trusting ' +
            'their capacity to find a way through. Your resilience is fundamentally ' +
            'agentic: you believe in your ability to shape your circumstances, and this ' +
            'conviction becomes self-fulfilling.\n\n' +
            'The Navigator\'s gift is momentum. Where others freeze, you move. Where others ' +
            'see walls, you look for doors. This generative orientation means that ' +
            'stagnation is your most uncomfortable state — and forward motion your most ' +
            'reliable medicine.',
        superpowers: [
            'Proactive problem-solving and rapid response to challenges',
            'Strong self-efficacy and belief in your own agency',
            'Ability to generate options when others see only constraints',
            'Initiative and entrepreneurial thinking',
            'Persistence and forward momentum under adversity',
        ],
        blindSpots: [
            'May act too quickly without adequate reflection or emotional processing',
            'Risk of bypassing grief, loss, or difficult emotions with premature "solution mode"',
            'Can become frustrated with others who process more slowly or need more support',
            'Overextension and burnout from constant action without adequate rest',
        ],
        stressResponse:
            'Under pressure, The Navigator tends to accelerate — generating plans, taking ' +
            'action, driving toward resolution. This is a powerful strength but can lead ' +
            'to exhaustion or to missing important emotional signals that need processing ' +
            'before action is wise. Learning when to pause is a critical edge for this archetype.',
        copingStrategies: [
            'Identifying one specific, meaningful action to take when feeling stuck',
            'Breaking large, overwhelming challenges into smallest possible next steps',
            'Structuring "rest sprints" — deliberate recovery periods between intense action phases',
            'Journaling to process emotions before moving to solution mode',
            'Consulting trusted people before acting on major decisions under stress',
        ],
        groundingTechniques: [
            'Progressive muscle relaxation to discharge action-oriented nervous system activation',
            'Cold exposure (cold shower, fresh air) to reset and clear the system',
            'High-intensity physical movement to metabolise stress hormones',
            'The "pause and breathe" practice — 3 full breaths before responding to any stressor',
        ],
        teamRole:
            'In teams, The Navigator is typically the initiator and driver — the person who ' +
            'moves projects forward, generates options when teams are stuck, and brings ' +
            'energy and momentum to collective challenges. Watch for the tendency to move ' +
            'faster than the team can follow, or to undervalue the reflective contributions ' +
            'of slower-moving team members.',
        partnershipTips: [
            'Practice the art of fully receiving others — not just listening to respond or solve',
            'Your agency is a gift; help others develop theirs rather than doing for them',
            'Rest is a form of resilience — build recovery into your partnership patterns',
            'Partners who can match your energy and pace while also inviting you to slow down may be most growth-promoting',
        ],
    },

    'The Feeler': {
        name: 'The Feeler',
        primaryDimension: 'Emotional-Adaptive',
        emoji: '💛',
        description:
            'The Feeler is the emotionally intelligent anchor of resilience — someone who ' +
            'processes and navigates the world through rich emotional experience and deep ' +
            'attunement to their own and others\' inner lives. Your resilience has an ' +
            'emotional quality: you bounce back not by bypassing feeling but by moving ' +
            'fully through it.\n\n' +
            'The Feeler\'s gift is depth. You notice things others miss, feel things others ' +
            'avoid, and process experience with an authenticity that can be profoundly ' +
            'healing — both for yourself and for those privileged to know you well.',
        superpowers: [
            'Deep emotional intelligence and self-awareness',
            'Authentic processing of difficult experiences',
            'Powerful empathy and emotional attunement',
            'Capacity to create emotional safety for others',
            'Resilience through feeling rather than bypassing',
        ],
        blindSpots: [
            'May be overwhelmed by intense emotions or by absorbing others\' emotional states',
            'Risk of emotional rumination rather than resolution',
            'Can struggle to take action when emotions are unresolved',
            'May experience the world as more emotionally intense than others and feel misunderstood',
        ],
        stressResponse:
            'Under pressure, The Feeler typically experiences a wave of emotional intensity ' +
            'before finding ground. The key is learning to stay present with emotion without ' +
            'being destabilised — moving through the feeling rather than either suppressing ' +
            'it or drowning in it. This process, though intense, is ultimately the most ' +
            'genuine form of emotional healing.',
        copingStrategies: [
            'Emotional expression practices: journaling, art, music, movement, trusted conversation',
            'The RAIN practice (Recognise, Allow, Investigate, Nurture) for difficult emotions',
            'Scheduled emotional processing time rather than carrying feelings all day',
            'Self-compassion practices to reduce the suffering that comes from fighting difficult feelings',
            'Boundaries with emotional absorbers who consistently deplete your emotional reserves',
        ],
        groundingTechniques: [
            'Grounded breathing — slow, deep breaths while feeling the weight of the body',
            'Physical movement to metabolise intense emotional states',
            'Nature immersion — water, trees, open sky as emotional regulators',
            'Warm physical comfort — baths, blankets, gentle self-touch — as somatic anchors',
        ],
        teamRole:
            'In teams, The Feeler is the emotional thermometer and heart — the person who ' +
            'notices the unspoken dynamics, holds space for others\' experiences, and creates ' +
            'the kind of emotional safety that allows teams to do their best work. Watch for ' +
            'the tendency to absorb team stress or to avoid necessary direct conversations ' +
            'out of concern for others\' feelings.',
        partnershipTips: [
            'Your emotional depth is a profound gift in close relationships — honour it rather than apologising for it',
            'Develop discernment about which feelings belong to you and which you are absorbing from others',
            'Partners who can meet your emotional depth without being threatened or overwhelmed may be most nourishing',
            'Practice asking for what you need emotionally rather than hoping others will intuit it',
        ],
    },

    'The Guide': {
        name: 'The Guide',
        primaryDimension: 'Spiritual-Reflective',
        emoji: '🌟',
        description:
            'The Guide is the meaning-centred sage of resilience — someone who navigates ' +
            'adversity through a deep connection to purpose, values, and the larger arc of ' +
            'their life. Your resilience has a spiritual quality: you find sustenance in ' +
            'what is most meaningful, and this inner compass rarely wavers even when ' +
            'external circumstances are turbulent.\n\n' +
            'The Guide\'s gift is perspective and purpose. You can hold the long view when ' +
            'others are consumed by the immediate, find the sacred in the ordinary, and ' +
            'remind those around you of what truly matters — even in the darkest of times.',
        superpowers: [
            'Deep connection to personal values and purpose',
            'Capacity to find meaning in adversity',
            'Reflective wisdom that holds the long view',
            'Ability to inspire others through clarity of purpose',
            'Existential groundedness during major life transitions',
        ],
        blindSpots: [
            'May over-spiritualise or find it difficult to engage with practical, immediate challenges',
            'Risk of withdrawal into reflection when action is required',
            'Can be impatient with others who seem uninterested in depth or meaning',
            'May struggle to balance contemplative needs with the demands of busy daily life',
        ],
        stressResponse:
            'Under pressure, The Guide tends to seek stillness, meaning, and perspective — ' +
            'retreating into reflective practices, prayer, meditation, or nature. This is ' +
            'deeply restorative but can occasionally delay necessary action or practical ' +
            'responses. The edge for this archetype is integrating contemplative wisdom ' +
            'with timely action.',
        copingStrategies: [
            'Reconnecting with core values when stress creates confusion about priorities',
            'Dedicated reflective practices — meditation, prayer, journaling — during adversity',
            'Seeking time in nature or other environments that restore a sense of the sacred',
            'Community with others who share your depth and orientation toward meaning',
            'The "purpose question" during crisis: what does this challenge want to teach me?',
        ],
        groundingTechniques: [
            'Contemplative breathing — slow, intentional breath as a form of meditation',
            'Walking in nature as a spiritual and somatic reset',
            'Gratitude practice to reconnect with what is already present and meaningful',
            'Body prayer or mindful movement practices (yoga, tai chi, contemplative dance)',
        ],
        teamRole:
            'In teams, The Guide is often the ethical compass and wisdom-keeper — the person ' +
            'who asks "why are we doing this?" and "what does this say about who we are?" ' +
            'They provide moral and purpose-driven grounding that can anchor teams during ' +
            'challenging periods. Watch for a tendency to disengage from practical details ' +
            'or to set unrealistically high standards for meaning and alignment.',
        partnershipTips: [
            'Your depth of purpose can be profoundly inspiring to partners who are searching for meaning',
            'Practise being fully present with the practical dimensions of shared life, not just the profound ones',
            'Partners who share your reflective orientation may be most nourishing for sustained connection',
            'Remember that others may find meaning differently than you — diversity of purpose is also wisdom',
        ],
    },

    'The Regulator': {
        name: 'The Regulator',
        primaryDimension: 'Somatic-Regulative',
        emoji: '⚡',
        description:
            'The Regulator is the embodied foundation of resilience — someone who maintains ' +
            'and restores equilibrium through a finely tuned awareness of the body and a ' +
            'sophisticated capacity for nervous-system regulation. Your resilience is ' +
            'somatic: you know how to read your body\'s signals, respond to stress at the ' +
            'physical level, and create the physiological conditions for sustained ' +
            'performance and recovery.\n\n' +
            'The Regulator\'s gift is groundedness. Where others are swept away by the ' +
            'storm, you find the eye of it. Your physical self-awareness is an anchor not ' +
            'only for yourself but for those who feel steadied simply by being in your presence.',
        superpowers: [
            'Rapid nervous system regulation and recovery from stress',
            'Deep body awareness and physical self-knowledge',
            'Ability to stay grounded under intense pressure',
            'Physical vitality and sustainable energy management',
            'Somatic intelligence — reading body signals before they become problems',
        ],
        blindSpots: [
            'May over-focus on physical regulation while under-developing cognitive or emotional processing',
            'Risk of using physical activity as avoidance rather than genuine regulation',
            'Can struggle when physical health is compromised — the primary regulation tool is unavailable',
            'May underestimate others\' needs for verbal processing or emotional expression',
        ],
        stressResponse:
            'Under pressure, The Regulator turns to the body — movement, breath, physical ' +
            'activity, rest. This is a highly effective stress response that many people ' +
            'wish they had. The edge for this archetype is ensuring that somatic regulation ' +
            'is complemented by cognitive and emotional processing, not used as a substitute.',
        copingStrategies: [
            'Physical movement as a primary stress release — prioritise it during high-pressure periods',
            'The "regulate first, respond later" principle — regulate your nervous system before making important decisions',
            'Sleep as a non-negotiable recovery tool — protect it fiercely during adversity',
            'Breath-based techniques for immediate regulation in any context',
            'Body scan practices to catch stress accumulation early before it becomes overwhelming',
        ],
        groundingTechniques: [
            '4-7-8 breathing — the most accessible nervous-system regulation tool',
            'Cold water exposure — face, wrists, or full cold shower for rapid state change',
            'Progressive muscle relaxation — systematically tensing and releasing muscle groups',
            'Grounding through the senses — feet on the floor, hands on a surface, breath in the body',
        ],
        teamRole:
            'In teams, The Regulator is often the calm, grounded presence — the person who ' +
            'slows the room down when panic is rising, who models physical self-care as a ' +
            'professional practice, and whose equanimity helps others regulate by proximity. ' +
            'Watch for a tendency to undervalue or underparticipate in conversations that feel ' +
            'too abstract, emotional, or unrelated to practical action.',
        partnershipTips: [
            'Your grounded physical presence can be enormously stabilising for partners who struggle with regulation',
            'Ensure your partnership includes intellectual and emotional depth alongside physical connection',
            'Partners who value physical self-care and embody similar somatic awareness may be most naturally compatible',
            'Practice the art of sitting with emotional complexity without rushing to physical resolution',
        ],
    },

    'The Balanced': {
        name: 'The Balanced',
        primaryDimension: null,
        emoji: '⚖️',
        description:
            'The Balanced profile is one of the rarest and most integrated forms of ' +
            'resilience — someone who draws strength from multiple dimensions rather than ' +
            'having a single dominant trait. Your resilience is holistic: you adapt your ' +
            'approach to the demands of each situation, drawing on different capacities as ' +
            'needed.\n\n' +
            'The Balanced\'s gift is versatility. You are unlikely to be destabilised in ' +
            'any single dimension because your resilience foundation is broad. The growth ' +
            'edge for this archetype is depth — moving from broad competence to genuine ' +
            'mastery in the areas that matter most to you.',
        superpowers: [
            'Adaptability across diverse challenges and contexts',
            'Well-rounded resilience that doesn\'t have a single point of failure',
            'Capacity to understand and bridge different resilience styles',
            'Versatility in stress response and coping approaches',
            'Holistic self-awareness across multiple dimensions',
        ],
        blindSpots: [
            'May lack a distinctive strength that serves as an anchor during extreme adversity',
            'Risk of spreading growth efforts too thinly without meaningful depth',
            'Can appear to have "no edge" — sometimes the distinctive strength is what inspires others',
            'May defer to others\' approaches rather than developing a distinct and personal resilience identity',
        ],
        stressResponse:
            'Under pressure, The Balanced draws on different dimensions depending on the ' +
            'nature of the stressor — cognitive reframing for complex challenges, relational ' +
            'support for interpersonal difficulties, somatic tools for physical stress. ' +
            'This flexibility is a significant strength; the edge is knowing which tool to ' +
            'reach for and when.',
        copingStrategies: [
            'Identify which resilience dimension is most relevant to the current stressor and draw on it specifically',
            'Build a diverse coping toolkit that spans all 6 dimensions',
            'Regular reassessment of which dimensions need the most attention at each life stage',
            'Cross-dimensional practices — activities that strengthen multiple dimensions simultaneously',
            'Connecting with people who have deep mastery in one dimension as a complement to your breadth',
        ],
        groundingTechniques: [
            'Whichever somatic technique resonates most with you in the moment',
            'Breath as a universal anchor available to all dimensions',
            'Nature immersion as a cross-dimensional regulator',
            'Movement practices that integrate body, emotion, and awareness',
        ],
        teamRole:
            'In teams, The Balanced often serves as the integrator and bridge — the person ' +
            'who understands the different strengths that others bring and can synthesise ' +
            'diverse approaches into a coherent whole. Watch for the tendency to "smooth over" ' +
            'rather than engaging with the genuine creative tension that comes from truly ' +
            'different perspectives.',
        partnershipTips: [
            'Your versatility makes you potentially compatible with many different relationship styles',
            'Look for partners who deepen you rather than just complementing you',
            'Explore which dimension of your resilience profile you most want to deepen in this season of life',
            'Your balanced profile can be a gift in managing the inevitable tensions of close relationships',
        ],
    },
};

/**
 * Determine the archetype based on top-scoring dimensions.
 * @param {Object} scores - { dimension: { percentage } } object
 * @returns {{ archetype: Object, topDimensions: string[] }}
 */
function assignArchetype(scores) {
    const ranked = Object.entries(scores)
        .map(([dim, data]) => ({ dim, pct: typeof data === 'object' ? data.percentage : data }))
        .sort((a, b) => b.pct - a.pct);

    const topDimensions = ranked.slice(0, 3).map((r) => r.dim);
    const topTwo = ranked.slice(0, 2).map((r) => r.pct);

    // Check for balanced profile (top 3 within 12 points of each other)
    const top3Pcts = ranked.slice(0, 3).map((r) => r.pct);
    const top3Range = Math.max(...top3Pcts) - Math.min(...top3Pcts);
    if (top3Range <= 12) {
        return { archetype: ARCHETYPES['The Balanced'], topDimensions };
    }

    // Map dominant dimensions to archetypes
    const dimensionToArchetype = {
        'Cognitive-Narrative':  'The Thinker',
        'Relational-Connective': 'The Connector',
        'Agentic-Generative':   'The Navigator',
        'Emotional-Adaptive':   'The Feeler',
        'Spiritual-Reflective': 'The Guide',
        'Somatic-Regulative':   'The Regulator',
    };

    const dominant = ranked[0].dim;
    const archetypeName = dimensionToArchetype[dominant] || 'The Balanced';
    return { archetype: ARCHETYPES[archetypeName], topDimensions };
}

/**
 * Generate a stress response analysis based on dimension scores.
 * @param {Object} scores - { dimension: { percentage } } object
 * @returns {Object} stress response profile
 */
function generateStressResponseProfile(scores, archetype) {
    const ranked = Object.entries(scores)
        .map(([dim, data]) => ({ dim, pct: typeof data === 'object' ? data.percentage : data }))
        .sort((a, b) => b.pct - a.pct);

    const strengthsUnderStress = ranked
        .filter((r) => r.pct >= 65)
        .map((r) => r.dim);

    const vulnerabilitiesUnderStress = ranked
        .filter((r) => r.pct < 50)
        .map((r) => r.dim);

    return {
        overallResilience: archetype.stressResponse,
        strengthsUnderStress,
        vulnerabilitiesUnderStress,
        copingStrategies: archetype.copingStrategies,
        groundingTechniques: archetype.groundingTechniques,
    };
}

/**
 * Generate relationship insights based on archetype.
 * @param {Object} archetype
 * @returns {Object} relationship insights
 */
function generateRelationshipInsights(archetype) {
    return {
        communicationStyle: archetype.teamRole,
        teamDynamics: archetype.teamRole,
        partnershipRecommendations: archetype.partnershipTips,
    };
}

module.exports = {
    ARCHETYPES,
    assignArchetype,
    generateStressResponseProfile,
    generateRelationshipInsights,
};
