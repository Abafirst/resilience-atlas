'use strict';

/**
 * reportTemplate.js
 *
 * Generates a comprehensive multi-page HTML report for The Resilience Atlas™.
 * Used by backend/routes/report.js via Puppeteer for PDF rendering.
 *
 * Pages:
 *   1  – Cover Page
 *   2  – Executive Summary
 *   3  – Dimension Overview + Radar Chart
 *   4  – Dimension Score Cards
 *   5-10 – Dimension Deep Dives (one per dimension)
 *   11 – Strength Integration Analysis
 *   12 – 30-Day Action Plan
 *   13 – Benchmarking & Context
 *   14 – Stress Response Profile
 *   15 – Relationship & Connection Insights
 *   16 – Resources & Next Steps
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSIONS = [
    'Agentic-Generative',
    'Relational-Connective',
    'Spiritual-Reflective',
    'Emotional-Adaptive',
    'Somatic-Regulative',
    'Cognitive-Narrative',
];

// ── Dimension palette ─────────────────────────────────────────────────────────
// Single source of truth for dimension → accent color mapping.
// Used for CSS variables, bar fills, section accents, and badges.
const DIMENSION_PALETTE = {
    'Agentic-Generative':    { color: '#14B8A6', lightColor: '#f0fdfa', borderColor: '#5eead4' },
    'Relational-Connective': { color: '#FB7185', lightColor: '#fff1f2', borderColor: '#fda4af' },
    'Spiritual-Reflective':  { color: '#8B5CF6', lightColor: '#f5f3ff', borderColor: '#c4b5fd' },
    'Emotional-Adaptive':    { color: '#22C55E', lightColor: '#f0fdf4', borderColor: '#86efac' },
    'Somatic-Regulative':    { color: '#0EA5E9', lightColor: '#f0f9ff', borderColor: '#7dd3fc' },
    'Cognitive-Narrative':   { color: '#F59E0B', lightColor: '#fffbeb', borderColor: '#fcd34d' },
};

/** Convert a dimension key to a CSS utility class name, e.g. "dim-agentic" */
function dimClass(dimensionKey) {
    const map = {
        'Agentic-Generative':    'dim-agentic',
        'Relational-Connective': 'dim-relational',
        'Spiritual-Reflective':  'dim-spiritual',
        'Emotional-Adaptive':    'dim-emotional',
        'Somatic-Regulative':    'dim-somatic',
        'Cognitive-Narrative':   'dim-cognitive',
    };
    return map[dimensionKey] || 'dim-agentic';
}

const DIMENSION_META = {
    'Agentic-Generative': {
        label: 'Agentic-Generative',
        shortLabel: 'Agentic',
        color: DIMENSION_PALETTE['Agentic-Generative'].color,
        lightColor: DIMENSION_PALETTE['Agentic-Generative'].lightColor,
        borderColor: DIMENSION_PALETTE['Agentic-Generative'].borderColor,
        icon: '⚡',
        tagline: 'Agency, Self-Direction & Creative Problem-Solving',
        description:
            'Your capacity to take purposeful action, direct your own path, and generate creative solutions even under pressure.',
        whatItMeans: {
            strong:
                'You demonstrate a strong sense of personal agency — the ability to take initiative, ' +
                'direct your own life, and generate novel solutions to complex challenges. ' +
                'This dimension reflects your confidence in your capacity to influence outcomes, ' +
                'your creative resourcefulness when facing obstacles, and your ability to maintain a ' +
                'proactive stance even in uncertain conditions. People strong in this dimension often ' +
                'serve as catalysts in their teams and communities.',
            developing:
                'You show emerging capacity for self-directed action and creative problem-solving. ' +
                'While you may sometimes feel uncertain about your ability to influence outcomes, ' +
                'there are clear signs of growing agency and resourcefulness. ' +
                'Building on this foundation will help you step more fully into your power and ' +
                'develop greater confidence in navigating life\'s challenges creatively.',
        },
        strengths: {
            strong: [
                'Takes initiative and drives meaningful change',
                'Generates creative, novel solutions under pressure',
                'Maintains proactive orientation even in uncertainty',
                'Influences outcomes through purposeful action',
            ],
            developing: [
                'Beginning to trust your own judgment and direction',
                'Growing capacity to find creative alternatives',
                'Building confidence in taking independent action',
            ],
        },
        growthOpportunities: [
            'Practice daily "micro-agency" — make at least one deliberate, values-aligned choice each day',
            'Explore creative problem-solving frameworks like Design Thinking or SCAMPER',
            'Identify one area where you\'ve been waiting for external permission and take the first step',
        ],
        microPractice:
            'Each morning, write down one action you will take today that reflects your own values and direction — no matter how small.',
        thirtyDayPlan: [
            'Week 1: Map your values and identify areas where you feel most and least agentic',
            'Week 2: Practice saying "yes" to one self-directed project and "no" to one obligation that isn\'t yours',
            'Week 3: Try a new creative problem-solving approach on a current challenge',
            'Week 4: Reflect on how taking ownership has shifted your energy and outcomes',
        ],
        realWorldApplication:
            'In work: You may be seen as a go-getter who gets things done. Channel this by volunteering for ' +
            'leadership roles and innovation projects. In relationships: Be mindful that others may not ' +
            'always share your urgency — practice collaborative problem-solving. In personal life: ' +
            'Use your agency to design routines and environments that support your deepest goals.',
        stressResponse:
            'Under pressure, you tend to activate and take action. This is a strength — but watch for ' +
            'the tendency to over-control or rush past important information. Your best stress strategy: ' +
            'pause briefly to assess before acting, then channel your agency strategically.',
        affirmation: 'I am the author of my own story. I have the power to create meaningful change.',
    },
    'Relational-Connective': {
        label: 'Relational-Connective',
        shortLabel: 'Relational',
        color: DIMENSION_PALETTE['Relational-Connective'].color,
        lightColor: DIMENSION_PALETTE['Relational-Connective'].lightColor,
        borderColor: DIMENSION_PALETTE['Relational-Connective'].borderColor,
        icon: '🤝',
        tagline: 'Connection, Community & Relational Support',
        description:
            'Your capacity to build, maintain, and draw strength from meaningful human connections during challenging times.',
        whatItMeans: {
            strong:
                'You possess a remarkable capacity for authentic human connection — the ability to build ' +
                'trust, maintain meaningful relationships, and draw genuine support from your community. ' +
                'This dimension reflects your natural attunement to others, your skill in creating ' +
                'psychological safety, and your ability to show up vulnerably and consistently in relationships. ' +
                'People high in relational resilience are often the connective tissue of their communities.',
            developing:
                'You are building your relational resilience — your capacity to give and receive support ' +
                'through connection. You may have meaningful relationships but find it challenging to fully ' +
                'lean on others, or you may be rebuilding connections after a period of isolation. ' +
                'Investing in this dimension creates a powerful buffer against life\'s hardships.',
        },
        strengths: {
            strong: [
                'Builds authentic trust quickly with others',
                'Creates psychological safety in groups',
                'Draws genuine sustenance from community',
                'Shows up consistently and vulnerably in relationships',
            ],
            developing: [
                'Values connection even when it feels difficult',
                'Building capacity to ask for help',
                'Growing your support network intentionally',
            ],
        },
        growthOpportunities: [
            'Practice the art of deep listening — put away devices and offer full presence in conversations',
            'Reach out to one person you\'ve been meaning to reconnect with each week',
            'Explore reciprocity — notice where you give freely but struggle to receive',
        ],
        microPractice:
            'Today, send a genuine, specific appreciation to someone in your life. Name what you value about them and why.',
        thirtyDayPlan: [
            'Week 1: Map your support network — identify your 5 closest connections and 5 people you want to deepen',
            'Week 2: Practice one act of vulnerability — share something real with someone you trust',
            'Week 3: Host or initiate a meaningful gathering, even virtually, with people who energize you',
            'Week 4: Reflect on your give/receive balance and identify one relationship to invest in more',
        ],
        realWorldApplication:
            'In work: Your relational strength makes you a natural team builder and culture keeper. ' +
            'Use this in conflict resolution and collaborative projects. In relationships: You have a ' +
            'gift for creating belonging — continue to nurture it while also setting healthy boundaries. ' +
            'In personal life: Your connections are a core resource — invest in them proactively, not just in crisis.',
        stressResponse:
            'Under pressure, you may reach out to your support network — this is healthy. Watch for ' +
            'over-reliance or the tendency to lose yourself in others\' needs. Your best stress strategy: ' +
            'identify 1-2 trusted people to process with, then move toward grounded action.',
        affirmation: 'I am deeply connected and supported. My relationships are a source of strength and renewal.',
    },
    'Spiritual-Reflective': {
        label: 'Spiritual-Reflective',
        shortLabel: 'Spiritual',
        color: DIMENSION_PALETTE['Spiritual-Reflective'].color,
        lightColor: DIMENSION_PALETTE['Spiritual-Reflective'].lightColor,
        borderColor: DIMENSION_PALETTE['Spiritual-Reflective'].borderColor,
        icon: '✨',
        tagline: 'Meaning, Purpose & Values-Based Living',
        description:
            'Your capacity to find meaning, maintain connection to purpose, and draw on transcendent values during adversity.',
        whatItMeans: {
            strong:
                'You have developed a rich inner life anchored in meaning, purpose, and transcendent values. ' +
                'This dimension reflects your ability to find significance even in suffering, your orientation ' +
                'toward something larger than yourself, and your capacity for deep reflection and contemplative ' +
                'practice. People with strong spiritual-reflective resilience often bring wisdom, equanimity, ' +
                'and long-range perspective to difficult situations.',
            developing:
                'You are exploring your relationship with meaning, purpose, and the deeper dimensions of life. ' +
                'Whether through secular contemplation, religious practice, or philosophical inquiry, this ' +
                'dimension invites you to go deeper. Building spiritual-reflective resilience provides an ' +
                'anchor that helps make sense of adversity.',
        },
        strengths: {
            strong: [
                'Finds meaning and purpose even in adversity',
                'Maintains values-based clarity under pressure',
                'Draws on contemplative practices for renewal',
                'Brings long-range wisdom to immediate challenges',
            ],
            developing: [
                'Seeking deeper meaning and purpose',
                'Exploring values and what truly matters',
                'Building a reflective practice',
            ],
        },
        growthOpportunities: [
            'Establish a daily contemplative practice — even 5 minutes of reflection, journaling, or meditation',
            'Clarify your core values and identify where your daily life aligns or diverges from them',
            'Explore the question: "What gives my life meaning, especially when things are hard?"',
        ],
        microPractice:
            'Tonight before sleep, reflect on one moment from today that felt meaningful or connected to something larger than yourself.',
        thirtyDayPlan: [
            'Week 1: Define your top 5 core values — write a brief statement of why each matters to you',
            'Week 2: Try a daily 10-minute contemplative practice (journaling, meditation, prayer, or silent reflection)',
            'Week 3: Explore a tradition or philosophy that resonates with your sense of meaning',
            'Week 4: Write a personal mission statement connecting your values to your daily actions',
        ],
        realWorldApplication:
            'In work: Your values clarity makes you a trustworthy, principled colleague. Use this in ethical ' +
            'decision-making and purpose-driven leadership. In relationships: Your reflective depth enriches ' +
            'conversations — share your inner world more often. In personal life: Regular reflection helps ' +
            'you navigate transitions and find coherence across life chapters.',
        stressResponse:
            'Under pressure, you may turn inward for perspective — this is a gift. Watch for spiritual ' +
            'bypassing (using meaning-making to avoid practical action). Your best stress strategy: ' +
            'use reflection to gain clarity, then engage with concrete next steps.',
        affirmation: 'My life has deep meaning and purpose. I am guided by values that transcend circumstance.',
    },
    'Emotional-Adaptive': {
        label: 'Emotional-Adaptive',
        shortLabel: 'Emotional',
        color: DIMENSION_PALETTE['Emotional-Adaptive'].color,
        lightColor: DIMENSION_PALETTE['Emotional-Adaptive'].lightColor,
        borderColor: DIMENSION_PALETTE['Emotional-Adaptive'].borderColor,
        icon: '💛',
        tagline: 'Emotional Intelligence & Adaptive Flexibility',
        description:
            'Your capacity to recognize, process, and adaptively work with emotions — yours and others\' — especially under pressure.',
        whatItMeans: {
            strong:
                'You possess well-developed emotional intelligence and adaptive flexibility — the ability to ' +
                'recognize and name your emotions accurately, regulate your responses thoughtfully, and remain ' +
                'flexible when circumstances change. This dimension reflects your capacity for nuanced emotional ' +
                'processing, your skill in reading emotional landscapes in relationships and groups, and your ' +
                'resilience in the face of emotional intensity.',
            developing:
                'You are building your emotional adaptability — your ability to work skillfully with feelings ' +
                'and remain flexible under stress. You may find that strong emotions sometimes overwhelm your ' +
                'capacity to respond thoughtfully, or that change feels destabilizing. This is an area of ' +
                'rich potential growth with high impact on overall resilience.',
        },
        strengths: {
            strong: [
                'Accurately identifies and names emotional states',
                'Regulates responses in emotionally charged situations',
                'Remains flexible when plans or circumstances change',
                'Reads emotional dynamics in relationships with skill',
            ],
            developing: [
                'Developing greater emotional vocabulary',
                'Building capacity to sit with difficult emotions',
                'Growing comfort with uncertainty and change',
            ],
        },
        growthOpportunities: [
            'Practice emotion labeling — several times daily, pause and name what you\'re feeling with specificity',
            'Develop a personal toolkit of regulation strategies (breathwork, movement, journaling)',
            'Practice "adaptive thinking" when plans change — ask "What\'s possible now?"',
        ],
        microPractice:
            'Three times today, pause for 30 seconds, notice your emotional state, name it specifically (beyond just "fine" or "stressed"), and take one conscious breath.',
        thirtyDayPlan: [
            'Week 1: Build your emotional vocabulary — learn 5 new emotion words and practice using them',
            'Week 2: Establish a daily emotional check-in practice (morning and evening)',
            'Week 3: Practice one regulation skill (box breathing, 5-4-3-2-1 grounding, or progressive muscle relaxation)',
            'Week 4: Apply your skills in a challenging situation and reflect on what worked',
        ],
        realWorldApplication:
            'In work: Your emotional adaptability makes you effective in high-pressure environments and ' +
            'team dynamics. Use it in negotiations and client relationships. In relationships: Your capacity ' +
            'to stay regulated creates safety for others to open up. In personal life: Emotional agility ' +
            'helps you navigate life transitions with greater ease and less suffering.',
        stressResponse:
            'Under pressure, emotions may intensify and potentially cloud your judgment. Building your ' +
            'regulation toolkit is key. Your best stress strategy: name the emotion first ("I am feeling ' +
            'overwhelmed"), then use a regulation practice before responding.',
        affirmation: 'My emotions are information, not commands. I can feel deeply and respond wisely.',
    },
    'Somatic-Regulative': {
        label: 'Somatic-Regulative',
        shortLabel: 'Somatic',
        color: DIMENSION_PALETTE['Somatic-Regulative'].color,
        lightColor: DIMENSION_PALETTE['Somatic-Regulative'].lightColor,
        borderColor: DIMENSION_PALETTE['Somatic-Regulative'].borderColor,
        icon: '🌿',
        tagline: 'Body Awareness, Nervous System & Physical Vitality',
        description:
            'Your capacity to maintain physical vitality, regulate your nervous system, and work with your body as a resilience resource.',
        whatItMeans: {
            strong:
                'You have developed a strong mind-body connection and somatic intelligence — the ability to ' +
                'listen to and work skillfully with your body\'s signals, maintain physical vitality, and ' +
                'regulate your nervous system effectively. This dimension reflects your capacity for body ' +
                'awareness, your use of physical practices for renewal and regulation, and your understanding ' +
                'of how physical wellbeing underpins all other dimensions of resilience.',
            developing:
                'You are building your somatic awareness and physical resilience — your relationship with ' +
                'your body as a source of information and renewal. You may be working through physical ' +
                'health challenges, or simply haven\'t yet developed regular practices that support your ' +
                'nervous system. This is a foundational dimension that supports all other resilience capacities.',
        },
        strengths: {
            strong: [
                'Maintains physical vitality and energy management',
                'Reads and responds to the body\'s stress signals',
                'Uses physical practices for nervous system regulation',
                'Sustains consistent sleep and recovery practices',
            ],
            developing: [
                'Beginning to notice your body\'s stress signals',
                'Exploring movement and physical care practices',
                'Building awareness of how physical state affects mental/emotional states',
            ],
        },
        growthOpportunities: [
            'Establish a consistent sleep routine targeting 7-9 hours and tracking sleep quality',
            'Incorporate daily movement — even 20 minutes of intentional walking has significant impact',
            'Learn and practice one breathwork technique (4-7-8 breathing, box breathing, or physiological sigh)',
        ],
        microPractice:
            'Right now: take 3 slow, deep breaths, extending the exhale to twice the length of the inhale. ' +
            'Notice how your body responds. Practice this transition technique 5 times throughout your day.',
        thirtyDayPlan: [
            'Week 1: Track your sleep and identify 2 changes to improve sleep quality',
            'Week 2: Establish a daily movement practice (minimum 20 minutes) that you genuinely enjoy',
            'Week 3: Learn and practice a breathwork or body-scan meditation technique',
            'Week 4: Create a "stress to recovery" protocol you can reliably use when activated',
        ],
        realWorldApplication:
            'In work: Physical vitality directly supports cognitive performance and emotional regulation. ' +
            'Protect your recovery time like any other professional commitment. In relationships: Your ' +
            'nervous system regulation sets the tone for interactions — practice arriving regulated to ' +
            'difficult conversations. In personal life: View physical self-care as non-negotiable resilience ' +
            'infrastructure, not a luxury.',
        stressResponse:
            'Under pressure, your body may signal stress through tension, fatigue, or activation. Learning ' +
            'to read these signals early allows for proactive regulation. Your best stress strategy: ' +
            'use breath, movement, or cold exposure to shift your nervous system state before it spirals.',
        affirmation: 'My body is my foundation. I tend to it with care and listen to its wisdom.',
    },
    'Cognitive-Narrative': {
        label: 'Cognitive-Narrative',
        shortLabel: 'Cognitive',
        color: DIMENSION_PALETTE['Cognitive-Narrative'].color,
        lightColor: DIMENSION_PALETTE['Cognitive-Narrative'].lightColor,
        borderColor: DIMENSION_PALETTE['Cognitive-Narrative'].borderColor,
        icon: '🧠',
        tagline: 'Mindset, Cognitive Flexibility & Story-Making',
        description:
            'Your capacity to maintain cognitive flexibility, reframe challenges constructively, and shape a resilient personal narrative.',
        whatItMeans: {
            strong:
                'You possess strong cognitive flexibility and narrative intelligence — the ability to reframe ' +
                'challenges, hold complexity with nuance, and construct a resilient personal narrative that ' +
                'supports growth and recovery. This dimension reflects your mindset agility, your capacity ' +
                'for perspective-taking, and your skill in making meaning from adversity in ways that ' +
                'empower rather than diminish you.',
            developing:
                'You are developing your cognitive resilience — your ability to reframe situations, ' +
                'challenge unhelpful thought patterns, and build a more empowering inner narrative. ' +
                'You may notice a tendency toward fixed thinking, catastrophizing, or stories that limit ' +
                'your sense of possibility. This dimension is highly trainable and yields significant returns.',
        },
        strengths: {
            strong: [
                'Reframes challenges as opportunities for growth',
                'Holds complexity and nuance in difficult situations',
                'Constructs empowering narratives from adversity',
                'Demonstrates growth mindset and cognitive flexibility',
            ],
            developing: [
                'Beginning to question limiting beliefs',
                'Learning to distinguish facts from interpretations',
                'Building capacity to generate alternative perspectives',
            ],
        },
        growthOpportunities: [
            'Practice "cognitive reframing" — when a negative thought arises, ask "What else could be true here?"',
            'Identify your 3 most common limiting beliefs and write evidence that challenges each one',
            'Develop a personal "resilience narrative" — the story of how you\'ve overcome adversity before',
        ],
        microPractice:
            'Tonight, write 3 "What I Learned" statements from today\'s challenges — turning setbacks into evidence of your growth and capability.',
        thirtyDayPlan: [
            'Week 1: Begin a "growth journal" — document one reframe per day',
            'Week 2: Identify your top 3 cognitive distortions (catastrophizing, all-or-nothing thinking, etc.) and challenge each daily',
            'Week 3: Write your personal "resilience origin story" — how past challenges shaped your strengths',
            'Week 4: Practice perspective-taking: view a current challenge through 3 different lenses',
        ],
        realWorldApplication:
            'In work: Cognitive flexibility makes you effective in complex, rapidly changing environments. ' +
            'Use it to navigate ambiguity and lead through uncertainty. In relationships: Your capacity ' +
            'to hold multiple perspectives makes you a skilled mediator and empathetic partner. ' +
            'In personal life: A resilient narrative transforms how you relate to your own history and ' +
            'shapes your sense of what\'s possible.',
        stressResponse:
            'Under pressure, cognitive distortions may amplify — catastrophizing or black-and-white thinking ' +
            'can take over. Building cognitive resilience helps you maintain clear thinking under stress. ' +
            'Your best stress strategy: write down your thoughts, identify the distortion, and generate ' +
            'a more balanced perspective.',
        affirmation: 'My mind is flexible and strong. I can find possibility and meaning in any circumstance.',
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreLevel(pct) {
    if (pct >= 85) return 'strong';
    if (pct >= 70) return 'solid';
    if (pct >= 50) return 'developing';
    if (pct >= 30) return 'emerging';
    return 'foundational';
}

function getScoreLevelLabel(pct) {
    if (pct >= 85) return 'Strong';
    if (pct >= 70) return 'Solid';
    if (pct >= 50) return 'Developing';
    if (pct >= 30) return 'Emerging';
    return 'Foundational';
}

function getOverallLevelLabel(pct) {
    if (pct >= 85) return 'Strong Foundation';
    if (pct >= 70) return 'Solid Foundation';
    if (pct >= 50) return 'Growing Foundation';
    if (pct >= 30) return 'Emerging Foundation';
    return 'Building Foundation';
}

function getPercentile(pct) {
    // Approximate population percentiles (bell-curve model)
    if (pct >= 90) return 95;
    if (pct >= 80) return 82;
    if (pct >= 70) return 65;
    if (pct >= 60) return 48;
    if (pct >= 50) return 35;
    if (pct >= 40) return 22;
    return 12;
}

function getArchetype(scores, dominantType) {
    const meta = DIMENSION_META[dominantType];
    const archetypes = {
        'Agentic-Generative':    { name: 'The Architect',   desc: 'You build and shape reality with deliberate intention.' },
        'Relational-Connective': { name: 'The Connector',   desc: 'You weave people together with warmth and authentic presence.' },
        'Spiritual-Reflective':  { name: 'The Sage',        desc: 'You navigate life with depth, wisdom, and transcendent purpose.' },
        'Emotional-Adaptive':    { name: 'The Empath',      desc: 'You feel and adapt with remarkable sensitivity and grace.' },
        'Somatic-Regulative':    { name: 'The Anchor',      desc: 'You stay grounded through the body when others are swept away.' },
        'Cognitive-Narrative':   { name: 'The Storyteller', desc: 'You transform experience into empowering meaning and narrative.' },
    };
    return archetypes[dominantType] || { name: 'The Resilient', desc: 'You navigate adversity with integrated strength.' };
}

function rankDimensions(scores) {
    return DIMENSIONS
        .filter(d => scores[d])
        .map(d => ({ dimension: d, score: scores[d].percentage || 0 }))
        .sort((a, b) => b.score - a.score);
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Truncate text at a word boundary, appending "…" when truncation occurs.
 * @param {string} text
 * @param {number} maxLen - Maximum character count (inclusive)
 * @returns {string}
 */
function truncateWords(text, maxLen) {
    if (!text || text.length <= maxLen) return text || '';
    const trimmed = text.slice(0, maxLen);
    const lastSpace = trimmed.lastIndexOf(' ');
    return (lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed) + '\u2026';
}

/**
 * Extract the "In relationships" segment from a dimension's realWorldApplication text.
 * Falls back to a generic statement when not found.
 * @param {string} dimensionKey
 * @returns {string}
 */
function getRelationalApplicationText(dimensionKey) {
    const meta = DIMENSION_META[dimensionKey];
    if (!meta) {
        return 'Your unique combination of resilience strengths shapes how you show up for others.';
    }
    const full = meta.realWorldApplication || '';
    const start = full.indexOf('In relationships:');
    if (start === -1) return full;
    const segment = full.slice(start + 'In relationships:'.length);
    const end = segment.indexOf('In personal');
    return (end !== -1 ? segment.slice(0, end) : segment).trim();
}

// ── Radar Chart SVG ───────────────────────────────────────────────────────────

function buildRadarChart(scores) {
    const cx = 260, cy = 260, r = 200;
    const angles = DIMENSIONS.map((_, i) => (i * 2 * Math.PI) / 6 - Math.PI / 2);

    function point(angle, radius) {
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        };
    }

    // Grid lines (4 rings)
    const gridRings = [0.25, 0.5, 0.75, 1.0].map(scale => {
        const pts = angles.map(a => point(a, r * scale));
        return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
    });

    // Axis lines
    const axisLines = angles.map(a => {
        const outer = point(a, r);
        return `M ${cx} ${cy} L ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`;
    });

    // Score polygon
    const scorePoints = DIMENSIONS.map((dim, i) => {
        const pct = (scores[dim] ? scores[dim].percentage : 0) / 100;
        return point(angles[i], r * Math.min(pct, 1));
    });
    const scorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';

    // Dimension labels
    const labels = DIMENSIONS.map((dim, i) => {
        const outer = point(angles[i], r + 32);
        const meta = DIMENSION_META[dim];
        const pct = scores[dim] ? scores[dim].percentage.toFixed(0) : '0';
        const anchor = outer.x < cx - 5 ? 'end' : outer.x > cx + 5 ? 'start' : 'middle';
        return {
            x: outer.x,
            y: outer.y,
            label: meta.shortLabel,
            pct,
            color: meta.color,
            anchor,
        };
    });

    // Dot markers on the polygon vertices
    const dots = scorePoints.map((p, i) => ({
        x: p.x,
        y: p.y,
        color: DIMENSION_META[DIMENSIONS[i]].color,
    }));

    return `
<svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:420px;display:block;margin:0 auto;">
  <defs>
    <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.05"/>
    </radialGradient>
  </defs>
  <!-- Background grid rings -->
  ${gridRings.map((d, i) => `<path d="${d}" fill="${i === 3 ? 'url(#radarGrad)' : 'none'}" stroke="#e2e8f0" stroke-width="${i === 3 ? 1.5 : 1}" />`).join('\n  ')}
  <!-- Axis lines -->
  ${axisLines.map(d => `<path d="${d}" stroke="#cbd5e1" stroke-width="1" />`).join('\n  ')}
  <!-- Score polygon fill -->
  <path d="${scorePath}" fill="#6366f1" fill-opacity="0.18" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round"/>
  <!-- Dot markers -->
  ${dots.map(d => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="5" fill="${d.color}" stroke="white" stroke-width="2"/>`).join('\n  ')}
  <!-- Dimension labels -->
  ${labels.map(l => `
  <text x="${l.x.toFixed(1)}" y="${(l.y - 8).toFixed(1)}" text-anchor="${l.anchor}" font-size="11" font-weight="700" fill="${l.color}" font-family="system-ui,sans-serif">${esc(l.label)}</text>
  <text x="${l.x.toFixed(1)}" y="${(l.y + 8).toFixed(1)}" text-anchor="${l.anchor}" font-size="10" fill="#64748b" font-family="system-ui,sans-serif">${l.pct}%</text>`).join('')}
  <!-- Center label -->
  <text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="12" fill="#94a3b8" font-family="system-ui,sans-serif">Resilience</text>
</svg>`;
}

// ── CSS ───────────────────────────────────────────────────────────────────────

function buildCSS() {
    // Build dimension CSS variables from central palette
    const dimVars = Object.entries(DIMENSION_PALETTE).map(([dim, p]) => {
        const cls = dimClass(dim);
        return `
.${cls} { --dim-color: ${p.color}; --dim-light: ${p.lightColor}; --dim-border: ${p.borderColor}; }`;
    }).join('');

    return `
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Dimension CSS variables ── */
:root {
    --dim-agentic:   ${DIMENSION_PALETTE['Agentic-Generative'].color};
    --dim-relational:${DIMENSION_PALETTE['Relational-Connective'].color};
    --dim-spiritual: ${DIMENSION_PALETTE['Spiritual-Reflective'].color};
    --dim-emotional: ${DIMENSION_PALETTE['Emotional-Adaptive'].color};
    --dim-somatic:   ${DIMENSION_PALETTE['Somatic-Regulative'].color};
    --dim-cognitive: ${DIMENSION_PALETTE['Cognitive-Narrative'].color};
    --brand:         #6366f1;
    --brand-light:   #eef2ff;
    --text-primary:  #0f172a;
    --text-secondary:#475569;
    --text-muted:    #94a3b8;
    --border:        #e2e8f0;
    --surface:       #f8fafc;
}
${dimVars}

body {
    font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
    color: var(--text-primary);
    background: white;
    font-size: 10pt;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
}

/* ── Page layout ── */
.page {
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    /* Bottom padding reserves space for the absolutely-positioned .page-footer
       (bottom: 8mm, ~6mm tall) so content never overlaps the footer. */
    padding: 14mm 14mm 26mm 14mm;
    page-break-after: always;
    position: relative;
    overflow: hidden;
}
.page:last-child { page-break-after: avoid; }

/* ── Branded footer ── */
.page-footer {
    position: absolute;
    bottom: 8mm;
    left: 14mm;
    right: 14mm;
    border-top: 1px solid var(--border);
    padding-top: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7pt;
    color: var(--text-muted);
    letter-spacing: 0.3px;
}

/* ── Cover page (unchanged layout) ── */
.cover {
    background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20mm 18mm;
}
.cover-logo {
    font-size: 13pt;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #a5b4fc;
    margin-bottom: 8mm;
    font-weight: 300;
}
.cover-trademark {
    font-size: 8pt;
    vertical-align: super;
}
.cover-title {
    font-size: 26pt;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 10mm;
    color: white;
}
.cover-score-ring {
    width: 52mm;
    height: 52mm;
    border-radius: 50%;
    background: rgba(99,102,241,0.25);
    border: 3px solid rgba(165,180,252,0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8mm auto;
}
.cover-score-number {
    font-size: 36pt;
    font-weight: 800;
    color: white;
    line-height: 1;
}
.cover-score-label {
    font-size: 8pt;
    color: #a5b4fc;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}
.cover-level-badge {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 24px;
    padding: 6px 20px;
    font-size: 11pt;
    font-weight: 600;
    color: #e0e7ff;
    margin-bottom: 8mm;
}
.cover-meta {
    font-size: 9pt;
    color: #94a3b8;
    margin-bottom: 12mm;
}
.cover-divider {
    width: 40mm;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(165,180,252,0.5), transparent);
    margin: 6mm auto;
}
.cover-tagline {
    font-size: 10pt;
    color: #c7d2fe;
    font-style: italic;
    max-width: 130mm;
    line-height: 1.6;
}
.cover-dimensions-preview {
    display: flex;
    gap: 6px;
    margin-top: 10mm;
    flex-wrap: wrap;
    justify-content: center;
}
.cover-dim-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

/* ── Section headers ── */
.section-header {
    margin-bottom: 7mm;
    border-left: 4px solid var(--brand);
    padding-left: 10px;
}
.section-header.dim-agentic   { border-color: var(--dim-agentic); }
.section-header.dim-relational { border-color: var(--dim-relational); }
.section-header.dim-spiritual  { border-color: var(--dim-spiritual); }
.section-header.dim-emotional  { border-color: var(--dim-emotional); }
.section-header.dim-somatic    { border-color: var(--dim-somatic); }
.section-header.dim-cognitive  { border-color: var(--dim-cognitive); }

.section-eyebrow {
    font-size: 7pt;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 2px;
}
.section-title {
    font-size: 18pt;
    font-weight: 800;
    color: var(--text-primary);
    line-height: 1.15;
    letter-spacing: -0.3px;
}
.section-subtitle {
    font-size: 9.5pt;
    color: var(--text-secondary);
    margin-top: 2px;
    font-weight: 400;
}
h3 { font-size: 11pt; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; letter-spacing: -0.1px; }
h4 { font-size: 10pt; font-weight: 600; color: var(--text-secondary); margin-bottom: 3px; }
p  { margin-bottom: 6px; font-size: 9.5pt; line-height: 1.65; color: var(--text-primary); }
ul { padding-left: 16px; margin-bottom: 6px; }
li { font-size: 9.5pt; margin-bottom: 3px; line-height: 1.6; }

/* ── Highlight / callout boxes ── */
.callout {
    border-left: 3px solid var(--brand);
    background: var(--brand-light);
    padding: 9px 13px;
    border-radius: 0 10px 10px 0;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.callout.green  { border-color: #22C55E; background: #f0fdf4; }
.callout.amber  { border-color: #F59E0B; background: #fffbeb; }
.callout.violet { border-color: #8B5CF6; background: #f5f3ff; }
.callout.blue   { border-color: #0EA5E9; background: #f0f9ff; }
.callout.red    { border-color: #ef4444; background: #fef2f2; }
.callout p { margin-bottom: 0; }

/* ── Executive Summary metric cards (2×2 grid) ── */
.metric-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
}
.metric-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.metric-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--brand);
    border-radius: 12px 12px 0 0;
}
.metric-card.accent-teal::before   { background: var(--dim-agentic); }
.metric-card.accent-coral::before  { background: var(--dim-relational); }
.metric-card.accent-violet::before { background: var(--dim-spiritual); }
.metric-card.accent-lime::before   { background: var(--dim-emotional); }
.metric-card.accent-sky::before    { background: var(--dim-somatic); }
.metric-card.accent-amber::before  { background: var(--dim-cognitive); }
.metric-card-label {
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    margin-bottom: 5px;
}
.metric-card-value {
    font-size: 22pt;
    font-weight: 800;
    color: var(--brand);
    line-height: 1;
}
.metric-card-sub {
    font-size: 8pt;
    color: var(--text-secondary);
    margin-top: 3px;
}

/* ── Legacy stat boxes (kept for other pages) ── */
.stat-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 10px;
}
.stat-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stat-number {
    font-size: 20pt;
    font-weight: 800;
    color: var(--brand);
    line-height: 1;
}
.stat-label {
    font-size: 7.5pt;
    color: var(--text-secondary);
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

/* ── Dimension cards (page 4 overview) ── */
.dim-card {
    border-radius: 12px;
    padding: 11px 13px;
    margin-bottom: 9px;
    border: 1px solid;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.dim-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}
.dim-card-title {
    font-size: 10pt;
    font-weight: 700;
}
.dim-card-pct {
    font-size: 15pt;
    font-weight: 800;
}
.dim-card-level {
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 20px;
    background: rgba(255,255,255,0.75);
    display: inline-block;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}
.progress-bar {
    height: 7px;
    background: rgba(255,255,255,0.55);
    border-radius: 6px;
    overflow: hidden;
    margin: 5px 0;
}
.progress-fill {
    height: 7px;
    border-radius: 6px;
}
.dim-card-desc {
    font-size: 8.5pt;
    line-height: 1.5;
    margin-top: 4px;
    opacity: 0.85;
}

/* ── Dimension pill badge ── */
.dim-pill {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 7.5pt;
    font-weight: 700;
    color: white;
    letter-spacing: 0.4px;
}

/* ── Dimension deep-dive hero ── */
.dim-hero {
    border-radius: 14px;
    padding: 15px 17px;
    margin-bottom: 10px;
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.dim-hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}
.dim-hero-icon { font-size: 22pt; }
.dim-hero-name {
    font-size: 15pt;
    font-weight: 800;
    flex: 1;
    padding: 0 10px;
    letter-spacing: -0.2px;
}
.dim-hero-score {
    font-size: 30pt;
    font-weight: 800;
    line-height: 1;
}
.dim-hero-tagline {
    font-size: 9pt;
    opacity: 0.88;
    font-style: italic;
}

.content-block { margin-bottom: 9px; }
.content-label {
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.8px;
    color: var(--brand);
    margin-bottom: 4px;
    padding-bottom: 3px;
    border-bottom: 1.5px solid var(--brand-light);
}

/* ── Two-column layout ── */
.two-col      { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.two-col-wide { display: grid; grid-template-columns: 3fr 2fr; gap: 12px; }

/* ── Affirmation box ── */
.affirmation {
    background: linear-gradient(135deg, #f0f9ff, #f5f3ff);
    border: 1px solid #c4b5fd;
    border-radius: 12px;
    padding: 11px 15px;
    text-align: center;
    margin: 10px 0;
}
.affirmation-text {
    font-size: 10.5pt;
    font-style: italic;
    font-weight: 600;
    color: #4338ca;
    line-height: 1.55;
}
.affirmation-label {
    font-size: 7pt;
    color: var(--brand);
    text-transform: uppercase;
    letter-spacing: 1.8px;
    margin-bottom: 6px;
    font-weight: 700;
}

/* ── 30-day plan ── */
.week-block {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
    padding: 9px 11px;
    background: var(--surface);
    border-radius: 10px;
    border: 1px solid var(--border);
}
.week-number {
    background: var(--brand);
    color: white;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 8px;
    white-space: nowrap;
    min-width: 52px;
    text-align: center;
    letter-spacing: 0.3px;
}
.week-content { font-size: 9pt; line-height: 1.55; }

/* ── Strength integration ── */
.synergy-card {
    background: linear-gradient(135deg, var(--surface), var(--brand-light));
    border: 1px solid #c7d2fe;
    border-radius: 12px;
    padding: 10px 13px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* ── Table styles ── */
table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
th {
    background: var(--surface);
    text-align: left;
    padding: 7px 10px;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    border-bottom: 2px solid var(--border);
}
td {
    padding: 6px 10px;
    font-size: 9pt;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
}
tr:last-child td { border-bottom: none; }
tr:nth-child(even) td { background: var(--surface); }

/* ── Stress response ── */
.stress-card {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 9px 13px;
    margin-bottom: 7px;
}

/* ── Resources page ── */
.resource-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 13px;
    margin-bottom: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.resource-card-title {
    font-size: 10pt;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
}

/* ── Checklist ── */
.checklist-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 7px 9px;
    margin-bottom: 4px;
    border-radius: 8px;
    background: var(--surface);
    border: 1px solid var(--border);
}
.check-box {
    width: 14px;
    height: 14px;
    border: 2px solid var(--brand);
    border-radius: 4px;
    flex-shrink: 0;
    margin-top: 1px;
}

/* ── Print optimizations ── */
@media print {
    .page { page-break-after: always; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;
}

// ── Page builder functions ────────────────────────────────────────────────────

function pageFooter(pageNum, total) {
    return `
<div class="page-footer">
    <span>The Resilience Atlas™ — Personal Resilience Report</span>
    <span>For personal growth only. Not a clinical assessment.</span>
    <span>Page ${pageNum} of ${total}</span>
</div>`;
}

function page1Cover(overall, dominantType, scores, assessmentDate) {
    const levelLabel = getOverallLevelLabel(overall);
    const ranked = rankDimensions(scores);
    const top3 = ranked.slice(0, 3).map(r => DIMENSION_META[r.dimension]);
    return `
<div class="page cover">
    <div class="cover-logo">The Resilience Atlas<span class="cover-trademark">™</span></div>
    <div class="cover-title">Your Personal<br>Resilience Report</div>
    <div class="cover-score-ring">
        <div class="cover-score-number">${overall}</div>
        <div class="cover-score-label">Overall Score</div>
    </div>
    <div class="cover-level-badge">${esc(levelLabel)}</div>
    <div class="cover-meta">Assessment Date: ${esc(assessmentDate)}</div>
    <div class="cover-divider"></div>
    <div class="cover-tagline">
        A comprehensive analysis of your resilience profile across six core dimensions —
        your strengths, growth opportunities, and a personalized 30-day action plan.
    </div>
    <div class="cover-dimensions-preview">
        ${DIMENSIONS.map(d => `<div class="cover-dim-dot" style="background:${DIMENSION_META[d].color};"></div>`).join('')}
    </div>
    <div style="margin-top:14mm;font-size:8pt;color:#475569;letter-spacing:1px;">
        DOMINANT TYPE: <strong style="color:#a5b4fc;">${esc(dominantType)}</strong>
    </div>
    ${pageFooter(1, 16)}
</div>`;
}

function page2ExecutiveSummary(overall, dominantType, scores) {
    const ranked = rankDimensions(scores);
    const top = ranked[0];
    const bottom = ranked[ranked.length - 1];
    const topMeta = DIMENSION_META[top.dimension];
    const bottomMeta = DIMENSION_META[bottom.dimension];
    const archetype = getArchetype(scores, dominantType);
    const pct = getPercentile(overall);
    const levelLabel = getOverallLevelLabel(overall);
    const domMeta = DIMENSION_META[dominantType];

    const overview =
        `Your resilience profile reflects ${overall >= 70 ? 'a strong and integrated' : overall >= 50 ? 'a growing and promising' : 'an emerging and developing'} capacity ` +
        `to navigate life's challenges. With an overall score of ${overall}% (${levelLabel}), ` +
        `you demonstrate particular strength in ${esc(topMeta.label)} — ${topMeta.tagline.toLowerCase()}. ` +
        `Your profile suggests that ${truncateWords(domMeta.whatItMeans[overall >= 70 ? 'strong' : 'developing'], 160)}...`;

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 2 of 16</div>
        <div class="section-title">Executive Summary</div>
        <div class="section-subtitle">Your resilience profile at a glance</div>
    </div>

    <!-- 2×2 metric card grid -->
    <div class="metric-grid">
        <div class="metric-card">
            <div class="metric-card-label">Overall Score</div>
            <div class="metric-card-value" style="color:#6366f1;">${overall}%</div>
            <div class="metric-card-sub">${esc(levelLabel)}</div>
        </div>
        <div class="metric-card">
            <div class="metric-card-label">Resilience Level</div>
            <div class="metric-card-value" style="font-size:14pt;color:#0f172a;">${esc(levelLabel)}</div>
            <div class="metric-card-sub">Based on ${overall}% overall score</div>
        </div>
        <div class="metric-card" style="border-top-color:${topMeta.color};">
            <div class="metric-card-label">Top Strength</div>
            <div class="metric-card-value" style="font-size:14pt;color:${topMeta.color};">${esc(topMeta.shortLabel)}</div>
            <div class="metric-card-sub">${top.score.toFixed(0)}% — ${esc(getScoreLevelLabel(top.score))}</div>
        </div>
        <div class="metric-card" style="border-top-color:${bottomMeta.color};">
            <div class="metric-card-label">Growth Area</div>
            <div class="metric-card-value" style="font-size:14pt;color:${bottomMeta.color};">${esc(bottomMeta.shortLabel)}</div>
            <div class="metric-card-sub">${bottom.score.toFixed(0)}% — opportunity to grow</div>
        </div>
    </div>

    <div class="callout" style="margin-bottom:10px;">
        <p><strong>Your Resilience Archetype: ${esc(archetype.name)}</strong><br>
        ${esc(archetype.desc)}</p>
    </div>

    <div class="content-block">
        <div class="content-label">Your Resilience Profile</div>
        <p>${overview}</p>
        <p>Across the six dimensions assessed, your profile reveals a distinctive combination of strengths and growth opportunities.
        Your top strength in <strong>${esc(topMeta.label)}</strong> (${top.score.toFixed(0)}%) provides a foundation you can leverage across life domains.
        Your greatest growth opportunity lies in <strong>${esc(bottomMeta.label)}</strong> (${bottom.score.toFixed(0)}%), where focused practice can
        yield significant returns in overall resilience.</p>
    </div>

    <div class="two-col">
        <div>
            <div class="content-label">Key Strengths Identified</div>
            <ul>
                ${ranked.slice(0, 3).map(r =>
                    `<li><span class="dim-pill" style="background:${DIMENSION_META[r.dimension].color};">${esc(DIMENSION_META[r.dimension].shortLabel)}</span> ${r.score.toFixed(0)}% — ${esc(getScoreLevelLabel(r.score))}</li>`
                ).join('')}
            </ul>
        </div>
        <div>
            <div class="content-label">Primary Growth Areas</div>
            <ul>
                ${ranked.slice(-3).reverse().map(r =>
                    `<li><span class="dim-pill" style="background:${DIMENSION_META[r.dimension].color};">${esc(DIMENSION_META[r.dimension].shortLabel)}</span> ${r.score.toFixed(0)}% — ${esc(getScoreLevelLabel(r.score))}</li>`
                ).join('')}
            </ul>
        </div>
    </div>

    <div class="callout green" style="margin-top:8px;">
        <p><strong>What This Report Contains:</strong> Detailed analysis of all 6 resilience dimensions, personalized growth strategies,
        a 30-day action plan, stress response profile, relationship insights, and a complete resource guide.</p>
    </div>

    ${pageFooter(2, 16)}
</div>`;
}

function page3RadarChart(scores) {
    const radarSVG = buildRadarChart(scores);
    const ranked = rankDimensions(scores);

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 3 of 16</div>
        <div class="section-title">Resilience Radar Chart</div>
        <div class="section-subtitle">Your six-dimension resilience profile visualized</div>
    </div>

    <div style="text-align:center;margin-bottom:8px;">
        ${radarSVG}
    </div>

    <p style="text-align:center;font-size:8.5pt;color:#94a3b8;margin-top:-4px;">
        Each axis represents one resilience dimension. The shaded area shows your scored profile.<br>
        The outer ring represents 100%. Wider polygon = stronger overall resilience.
    </p>

    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-top:8px;">
        ${DIMENSIONS.map(d => {
            const meta = DIMENSION_META[d];
            const pct = scores[d] ? scores[d].percentage.toFixed(0) : 0;
            return `<div style="display:flex;align-items:center;gap:5px;">
                <div style="width:10px;height:10px;border-radius:50%;background:${meta.color};"></div>
                <span style="font-size:8pt;color:#475569;">${esc(meta.shortLabel)}: <strong>${pct}%</strong></span>
            </div>`;
        }).join('')}
    </div>

    ${pageFooter(3, 16)}
</div>`;
}

function page4DimensionCards(scores) {
    const ranked = rankDimensions(scores);

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 4 of 16</div>
        <div class="section-title">Dimension Overview</div>
        <div class="section-subtitle">All six resilience dimensions with your scores</div>
    </div>

    ${ranked.map(({ dimension, score }) => {
        const meta = DIMENSION_META[dimension];
        const level = getScoreLevelLabel(score);
        const pct = score.toFixed(0);
        return `
<div class="dim-card" style="background:${meta.lightColor};border-color:${meta.borderColor};">
    <div class="dim-card-header">
        <span style="font-size:16pt;">${meta.icon}</span>
        <span class="dim-card-title" style="flex:1;padding-left:8px;color:${meta.color};">${esc(meta.label)}</span>
        <span class="dim-card-pct" style="color:${meta.color};">${pct}%</span>
    </div>
    <span class="dim-card-level" style="color:${meta.color};border:1px solid ${meta.borderColor};">${esc(level)}</span>
    <div class="progress-bar">
        <div class="progress-fill" style="width:${Math.min(score, 100)}%;background:${meta.color};"></div>
    </div>
    <div class="dim-card-desc">${esc(meta.tagline)}</div>
</div>`;
    }).join('')}

    ${pageFooter(4, 16)}
</div>`;
}

function pageDimensionDeepDive(dimension, scores, pageNum) {
    const meta = DIMENSION_META[dimension];
    const score = scores[dimension] ? scores[dimension].percentage : 0;
    const level = getScoreLevel(score);
    const levelLabel = getScoreLevelLabel(score);
    const isStrong = score >= 70;
    const cls = dimClass(dimension);

    const whatItMeans = meta.whatItMeans[isStrong ? 'strong' : 'developing'];
    const strengths = meta.strengths[isStrong ? 'strong' : 'developing'];

    return `
<div class="page">
    <div class="section-header ${cls}" style="border-color:${meta.color};margin-bottom:10px;">
        <div class="section-eyebrow">Page ${pageNum} of 16 — Dimension Deep Dive</div>
        <div class="section-title" style="color:${meta.color};">${esc(meta.label)}</div>
        <div class="section-subtitle">${esc(meta.tagline)}</div>
    </div>

    <div class="dim-hero" style="background:linear-gradient(135deg,${meta.color},${meta.borderColor});">
        <div class="dim-hero-top">
            <span class="dim-hero-icon">${meta.icon}</span>
            <span class="dim-hero-name">${esc(meta.label)}</span>
            <span class="dim-hero-score">${score.toFixed(0)}%</span>
        </div>
        <div class="dim-hero-tagline">${esc(meta.tagline)}</div>
        <div style="margin-top:6px;">
            <span style="background:rgba(255,255,255,0.22);border-radius:20px;padding:3px 12px;font-size:7.5pt;font-weight:700;letter-spacing:0.5px;">${esc(levelLabel)}</span>
        </div>
    </div>

    <div class="two-col" style="margin-bottom:9px;">
        <div>
            <div class="content-label" style="border-color:${meta.lightColor};color:${meta.color};">What This Means for You</div>
            <p>${esc(whatItMeans)}</p>
        </div>
        <div>
            <div class="content-label" style="border-color:${meta.lightColor};color:${meta.color};">Strengths You Demonstrated</div>
            <ul>
                ${strengths.map(s => `<li>${esc(s)}</li>`).join('')}
            </ul>
            <div class="content-label" style="border-color:${meta.lightColor};color:${meta.color};margin-top:8px;">Growth Opportunities</div>
            <ul>
                ${meta.growthOpportunities.map(g => `<li>${esc(g)}</li>`).join('')}
            </ul>
        </div>
    </div>

    <div class="two-col">
        <div>
            <div class="content-label" style="border-color:${meta.lightColor};color:${meta.color};">Daily Micro-Practice</div>
            <div class="callout" style="border-color:${meta.color};background:${meta.lightColor};">
                <p>${esc(meta.microPractice)}</p>
            </div>
            <div class="content-label" style="border-color:${meta.lightColor};color:${meta.color};margin-top:8px;">Real-World Application</div>
            <p style="font-size:8.5pt;">${esc(meta.realWorldApplication)}</p>
        </div>
        <div>
            <div class="content-label" style="border-color:${meta.lightColor};color:${meta.color};">30-Day Progression</div>
            ${meta.thirtyDayPlan.map((week, i) => `
<div class="week-block" style="background:${meta.lightColor};border-color:${meta.borderColor};">
    <div class="week-number" style="background:${meta.color};">Week ${i + 1}</div>
    <div class="week-content">${esc(week)}</div>
</div>`).join('')}
        </div>
    </div>

    <div class="affirmation">
        <div class="affirmation-label" style="color:${meta.color};">Daily Affirmation</div>
        <div class="affirmation-text" style="color:${meta.color};">"${esc(meta.affirmation)}"</div>
    </div>

    ${pageFooter(pageNum, 16)}
</div>`;
}

function page11StrengthIntegration(scores, dominantType) {
    const ranked = rankDimensions(scores);
    const top3 = ranked.slice(0, 3);
    const archetype = getArchetype(scores, dominantType);
    const domMeta = DIMENSION_META[dominantType];

    // Compute synergy pairs
    const synergies = [
        {
            pair: [top3[0]?.dimension, top3[1]?.dimension].filter(Boolean),
            desc: top3[0] && top3[1]
                ? `Your ${DIMENSION_META[top3[0].dimension]?.shortLabel} strength amplifies your ${DIMENSION_META[top3[1].dimension]?.shortLabel} capacity — together these create a powerful combination for navigating complexity.`
                : '',
        },
        {
            pair: [top3[0]?.dimension, top3[2]?.dimension].filter(Boolean),
            desc: top3[0] && top3[2]
                ? `The interplay between ${DIMENSION_META[top3[0].dimension]?.shortLabel} and ${DIMENSION_META[top3[2].dimension]?.shortLabel} creates unique leverage — drawing on both simultaneously can unlock breakthrough resilience.`
                : '',
        },
    ];

    const gaps = ranked.slice(-2).map(r => ({
        dimension: r.dimension,
        desc: `Growth in ${DIMENSION_META[r.dimension]?.label} would unlock new dimensions of your overall resilience, especially supporting your existing strengths.`,
    }));

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 11 of 16</div>
        <div class="section-title">Strength Integration Analysis</div>
        <div class="section-subtitle">How your resilience dimensions work together</div>
    </div>

    <div class="callout violet" style="margin-bottom:10px;">
        <p><strong>Your Unique Combination:</strong> ${esc(archetype.name)} — ${esc(archetype.desc)}<br>
        Your top three dimensions — ${top3.map(r => `<strong>${esc(DIMENSION_META[r.dimension]?.shortLabel)}</strong>`).join(', ')} — create a
        distinctive resilience signature that shapes how you show up under pressure, in relationships, and in growth.</p>
    </div>

    <div class="content-label">Synergies — Where Strengths Amplify Each Other</div>
    ${synergies.filter(s => s.desc).map(s => `
<div class="synergy-card">
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:5px;">
        ${s.pair.map(d => `<span style="background:${DIMENSION_META[d]?.color};color:white;padding:2px 10px;border-radius:12px;font-size:8.5pt;font-weight:600;">${esc(DIMENSION_META[d]?.shortLabel)}</span>`).join('<span style="color:#94a3b8;">+</span>')}
    </div>
    <p style="font-size:9pt;">${esc(s.desc)}</p>
</div>`).join('')}

    <div class="content-label" style="margin-top:8px;">Potential Gaps — Where Growth Unlocks More</div>
    ${gaps.map(g => `
<div class="stress-card" style="background:${DIMENSION_META[g.dimension]?.lightColor};border-color:${DIMENSION_META[g.dimension]?.borderColor};">
    <h4 style="color:${DIMENSION_META[g.dimension]?.color};">${DIMENSION_META[g.dimension]?.icon} ${esc(DIMENSION_META[g.dimension]?.label)}</h4>
    <p style="font-size:9pt;">${esc(g.desc)}</p>
</div>`).join('')}

    <div class="content-label" style="margin-top:8px;">Your Resilience Blueprint</div>
    <table>
        <thead><tr><th>Dimension</th><th>Score</th><th>Level</th><th>Role in Your Profile</th></tr></thead>
        <tbody>
        ${ranked.map(({ dimension, score }, i) => {
            const meta = DIMENSION_META[dimension];
            const role = i === 0 ? 'Primary Anchor' : i === 1 ? 'Secondary Strength' : i <= 2 ? 'Supporting Capacity' : i >= ranked.length - 2 ? 'Growth Opportunity' : 'Developing Area';
            return `<tr>
                <td><span style="color:${meta.color};font-weight:600;">${meta.icon} ${esc(meta.shortLabel)}</span></td>
                <td><strong>${score.toFixed(0)}%</strong></td>
                <td>${esc(getScoreLevelLabel(score))}</td>
                <td style="font-size:8.5pt;">${esc(role)}</td>
            </tr>`;
        }).join('')}
        </tbody>
    </table>

    ${pageFooter(11, 16)}
</div>`;
}

function page12ActionPlan(scores, dominantType) {
    const ranked = rankDimensions(scores);
    const weekFocus = [
        ranked[ranked.length - 1],
        ranked[ranked.length - 2],
        ranked[0],
        ranked[1],
    ];

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 12 of 16</div>
        <div class="section-title">30-Day Action Plan</div>
        <div class="section-subtitle">A week-by-week progression plan tailored to your profile</div>
    </div>

    <div class="callout" style="margin-bottom:10px;">
        <p><strong>How to use this plan:</strong> Focus on one dimension per week. Combine the micro-practice from
        that dimension's deep-dive page with the weekly focus below. Track your progress with the checklist.</p>
    </div>

    ${weekFocus.map(({ dimension }, i) => {
        const meta = DIMENSION_META[dimension];
        const pct = scores[dimension] ? scores[dimension].percentage.toFixed(0) : 0;
        const weekLabels = ['Foundation Week', 'Growth Week', 'Integration Week', 'Expansion Week'];
        return `
<div class="week-block" style="background:${meta.lightColor};border-color:${meta.borderColor};border-left:4px solid ${meta.color};">
    <div class="week-number" style="background:${meta.color};">Week ${i + 1}</div>
    <div class="week-content">
        <strong style="color:${meta.color};">${weekLabels[i]}: ${esc(meta.label)}</strong> (${pct}%)<br>
        ${esc(meta.thirtyDayPlan[i])}
        <div style="margin-top:5px;font-style:italic;font-size:8.5pt;color:#64748b;">
            Daily Practice: ${esc(truncateWords(meta.microPractice, 120))}
        </div>
    </div>
</div>`;
    }).join('')}

    <div class="content-label" style="margin-top:8px;">Daily Affirmations by Dimension</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        ${DIMENSIONS.map(d => {
            const meta = DIMENSION_META[d];
            return `<div style="background:${meta.lightColor};border:1px solid ${meta.borderColor};border-radius:8px;padding:7px 10px;">
                <div style="font-size:7.5pt;font-weight:600;color:${meta.color};margin-bottom:3px;">${meta.icon} ${esc(meta.shortLabel)}</div>
                <div style="font-size:8pt;font-style:italic;color:#374151;">"${esc(meta.affirmation)}"</div>
            </div>`;
        }).join('')}
    </div>

    <div class="content-label" style="margin-top:10px;">Progress Tracking Checklist</div>
    ${['Complete daily micro-practice (15 min/day)',
       'Journal one insight from the day\'s practice',
       'Review your affirmation each morning',
       'Rate your resilience at week\'s end (1-10)',
       'Identify one real-world application of your growth'].map(item => `
<div class="checklist-item">
    <div class="check-box"></div>
    <span style="font-size:9pt;">${esc(item)}</span>
</div>`).join('')}

    ${pageFooter(12, 16)}
</div>`;
}

function page13Benchmarking(overall, dominantType, scores) {
    const pct = getPercentile(overall);
    const archetype = getArchetype(scores, dominantType);
    const ranked = rankDimensions(scores);

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 13 of 16</div>
        <div class="section-title">Benchmarking & Context</div>
        <div class="section-subtitle">How your resilience compares and what it means</div>
    </div>

    <div class="two-col" style="margin-bottom:10px;">
        <div>
            <div class="content-label">Population Comparison</div>
            <div class="stat-box" style="text-align:center;padding:14px;">
                <div class="stat-number" style="font-size:28pt;">${pct}th</div>
                <div class="stat-label">Percentile</div>
                <p style="margin-top:8px;font-size:8.5pt;color:#475569;">
                    Your overall score of ${overall}% places you in the ${pct}th percentile of assessed individuals,
                    suggesting ${pct >= 70 ? 'above-average' : pct >= 40 ? 'average' : 'developing'} resilience capacity
                    relative to the general population.
                </p>
            </div>
        </div>
        <div>
            <div class="content-label">Your Resilience Archetype</div>
            <div class="synergy-card" style="text-align:center;padding:14px;">
                <div style="font-size:22pt;margin-bottom:6px;">🏛️</div>
                <div style="font-size:14pt;font-weight:700;color:#4338ca;">${esc(archetype.name)}</div>
                <div style="font-size:8.5pt;color:#64748b;margin-top:6px;font-style:italic;">${esc(archetype.desc)}</div>
            </div>
        </div>
    </div>

    <div class="content-label">Dimension-by-Dimension Context</div>
    <table>
        <thead><tr><th>Dimension</th><th>Your Score</th><th>Approx. Percentile</th><th>General Interpretation</th></tr></thead>
        <tbody>
        ${ranked.map(({ dimension, score }) => {
            const meta = DIMENSION_META[dimension];
            const dimPct = getPercentile(score);
            return `<tr>
                <td><span style="color:${meta.color};font-weight:600;">${meta.icon} ${esc(meta.shortLabel)}</span></td>
                <td><strong>${score.toFixed(0)}%</strong></td>
                <td>${dimPct}th</td>
                <td style="font-size:8.5pt;">${esc(getScoreLevelLabel(score))} — ${esc(meta.tagline.split(' & ')[0])}</td>
            </tr>`;
        }).join('')}
        </tbody>
    </table>

    <div class="callout amber" style="margin-top:10px;">
        <p><strong>Growth Trend Opportunity:</strong> Research suggests that resilience is highly trainable.
        Most people who engage in consistent practice for 30–90 days see measurable improvements across multiple dimensions.
        Retake this assessment in 30 days to track your progress.</p>
    </div>

    <div class="content-label" style="margin-top:8px;">What the Research Says</div>
    <p>Studies in positive psychology and resilience science suggest that overall resilience scores above 70% are associated
    with lower rates of burnout, faster recovery from adversity, and higher reported life satisfaction.
    The six dimensions in this assessment align with well-established frameworks including positive psychology,
    somatic therapy, attachment theory, and cognitive-behavioral approaches.</p>

    ${pageFooter(13, 16)}
</div>`;
}

function page14StressResponse(scores, dominantType) {
    const ranked = rankDimensions(scores);

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 14 of 16</div>
        <div class="section-title">Stress Response Profile</div>
        <div class="section-subtitle">How you likely respond under pressure — and your best strategies</div>
    </div>

    <div class="callout red" style="margin-bottom:10px;">
        <p><strong>Important:</strong> This profile is based on your assessment scores and reflects general patterns.
        Stress responses are highly individual — use this as a starting point for self-reflection, not a definitive diagnosis.</p>
    </div>

    <div class="content-label">Your Stress Response by Dimension</div>
    ${ranked.map(({ dimension, score }) => {
        const meta = DIMENSION_META[dimension];
        return `
<div class="stress-card" style="background:${meta.lightColor};border-color:${meta.borderColor};">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <h4 style="color:${meta.color};">${meta.icon} ${esc(meta.label)}</h4>
        <span style="font-size:12pt;font-weight:700;color:${meta.color};">${score.toFixed(0)}%</span>
    </div>
    <p style="font-size:8.5pt;">${esc(meta.stressResponse)}</p>
</div>`;
    }).join('')}

    <div class="content-label" style="margin-top:8px;">Emergency Grounding Techniques</div>
    <div class="two-col">
        <div>
            <h4>5-4-3-2-1 Sensory Grounding</h4>
            <ul>
                <li>Name <strong>5</strong> things you can see</li>
                <li>Name <strong>4</strong> things you can touch</li>
                <li>Name <strong>3</strong> things you can hear</li>
                <li>Name <strong>2</strong> things you can smell</li>
                <li>Name <strong>1</strong> thing you can taste</li>
            </ul>
        </div>
        <div>
            <h4>Box Breathing (4-4-4-4)</h4>
            <ul>
                <li>Inhale for <strong>4</strong> counts</li>
                <li>Hold for <strong>4</strong> counts</li>
                <li>Exhale for <strong>4</strong> counts</li>
                <li>Hold for <strong>4</strong> counts</li>
                <li>Repeat 4 times minimum</li>
            </ul>
        </div>
    </div>

    ${pageFooter(14, 16)}
</div>`;
}

function page15RelationshipInsights(scores, dominantType) {
    const ranked = rankDimensions(scores);
    const relScore = scores['Relational-Connective'] ? scores['Relational-Connective'].percentage : 0;
    const relMeta = DIMENSION_META['Relational-Connective'];

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 15 of 16</div>
        <div class="section-title">Relationship & Connection Insights</div>
        <div class="section-subtitle">How your resilience profile shapes your relationships</div>
    </div>

    <div class="dim-hero" style="background:linear-gradient(135deg,${relMeta.color},${relMeta.borderColor});">
        <div class="dim-hero-top">
            <span class="dim-hero-icon">${relMeta.icon}</span>
            <span class="dim-hero-name">Relational-Connective Score</span>
            <span class="dim-hero-score">${relScore.toFixed(0)}%</span>
        </div>
        <div class="dim-hero-tagline">${esc(relMeta.tagline)}</div>
    </div>

    <div class="two-col" style="margin-bottom:9px;">
        <div>
            <div class="content-label">How Your Profile Shows Up in Relationships</div>
            <p>Your dominant type of <strong>${esc(dominantType)}</strong> influences your relational style.
            ${esc(getRelationalApplicationText(dominantType) || 
              'Your unique combination of resilience strengths shapes how you show up for others.')}</p>

            <div class="content-label" style="margin-top:8px;">Communication Style Insights</div>
            <ul>
                ${ranked.slice(0, 3).map(r => {
                    const meta = DIMENSION_META[r.dimension];
                    return `<li><strong>${esc(meta.shortLabel)}:</strong> ${
                        r.dimension === 'Agentic-Generative' ? 'Direct, initiative-taking communicator' :
                        r.dimension === 'Relational-Connective' ? 'Warm, attuned, connection-centered' :
                        r.dimension === 'Spiritual-Reflective' ? 'Thoughtful, meaning-focused, values-led' :
                        r.dimension === 'Emotional-Adaptive' ? 'Emotionally intelligent, flexible, responsive' :
                        r.dimension === 'Somatic-Regulative' ? 'Grounded, calm, steady under pressure' :
                        'Clear-thinking, perspective-seeking, narrative-shaping'
                    }</li>`;
                }).join('')}
            </ul>
        </div>
        <div>
            <div class="content-label">Team & Partnership Dynamics</div>
            <div class="synergy-card">
                <p style="font-size:8.5pt;"><strong>You bring to teams:</strong></p>
                <ul>
                    ${ranked.slice(0, 3).map(r => {
                        const meta = DIMENSION_META[r.dimension];
                        return `<li style="font-size:8.5pt;">${esc(meta.strengths.strong[0])}</li>`;
                    }).join('')}
                </ul>
            </div>
            <div class="content-label" style="margin-top:8px;">Best Team Complements</div>
            <p style="font-size:8.5pt;">You work best with people who are strong in the dimensions where you are developing:
            ${ranked.slice(-2).map(r => `<strong>${esc(DIMENSION_META[r.dimension]?.shortLabel)}</strong>`).join(' and ')}.
            These partners can complement your profile and create a well-rounded team resilience.</p>
        </div>
    </div>

    <div class="content-label">Relational Growth Practices</div>
    <div class="two-col">
        ${relMeta.growthOpportunities.map(g => `
<div class="callout green">
    <p>${esc(g)}</p>
</div>`).join('')}
    </div>

    ${pageFooter(15, 16)}
</div>`;
}

function page16Resources(overall, dominantType) {
    const domMeta = DIMENSION_META[dominantType];

    return `
<div class="page">
    <div class="section-header">
        <div class="section-eyebrow">Page 16 of 16</div>
        <div class="section-title">Resources & Next Steps</div>
        <div class="section-subtitle">Your roadmap for continued resilience growth</div>
    </div>

    <div class="two-col">
        <div>
            <div class="content-label">Immediate Next Steps</div>
            <div class="resource-card">
                <div class="resource-card-title">📊 Access Your Online Report</div>
                <p style="font-size:8.5pt;">Log in to your Resilience Atlas account to view your interactive dashboard, track progress over time, and access your full digital report.</p>
            </div>
            <div class="resource-card">
                <div class="resource-card-title">🔄 Retake in 30 Days</div>
                <p style="font-size:8.5pt;">Schedule a retake for 30 days from now. Consistent practice creates measurable change — compare your scores to see your growth.</p>
            </div>
            <div class="resource-card">
                <div class="resource-card-title">📱 Daily Practice</div>
                <p style="font-size:8.5pt;">Start with the micro-practice for your lowest-scoring dimension. Commit to just 10 minutes per day for the next 30 days.</p>
            </div>

            <div class="content-label" style="margin-top:8px;">Recommended by Your Profile</div>
            <div class="resource-card" style="background:${domMeta.lightColor};border-color:${domMeta.borderColor};">
                <div class="resource-card-title" style="color:${domMeta.color};">${domMeta.icon} ${esc(domMeta.label)} Workshop</div>
                <p style="font-size:8.5pt;">Since this is your dominant dimension, deepening mastery here creates a strong foundation for developing other areas.</p>
            </div>
        </div>
        <div>
            <div class="content-label">Premium Features Available</div>
            <div class="resource-card" style="border:2px solid #6366f1;">
                <div class="resource-card-title" style="color:#6366f1;">⬆️ Atlas Premium</div>
                <ul style="font-size:8pt;">
                    <li>Unlimited reassessments</li>
                    <li>Team resilience dashboard</li>
                    <li>1-on-1 coaching session</li>
                    <li>Full practice library access</li>
                    <li>Advanced benchmarking</li>
                </ul>
            </div>
            <div class="resource-card">
                <div class="resource-card-title">📚 Practice Library</div>
                <p style="font-size:8.5pt;">Access our curated library of resilience practices organized by dimension and intensity level.</p>
            </div>
            <div class="resource-card">
                <div class="resource-card-title">🎓 Facilitation Guides</div>
                <p style="font-size:8.5pt;">Bring The Resilience Atlas™ to your team or community with our structured facilitation programs.</p>
            </div>
            <div class="resource-card">
                <div class="resource-card-title">📧 Support</div>
                <p style="font-size:8.5pt;">Questions about your report? Visit resilienceatlas.com or email support@resilienceatlas.com</p>
            </div>
        </div>
    </div>

    <div class="affirmation" style="margin-top:10px;">
        <div class="affirmation-label">A Final Note</div>
        <div class="affirmation-text">
            "Resilience is not a fixed trait — it is a dynamic capacity that grows through awareness, practice, and connection.
            You have already taken the most important step: you showed up to understand yourself more deeply.
            That is where all growth begins."
        </div>
        <div style="margin-top:8px;font-size:8pt;color:#6366f1;">— The Resilience Atlas™</div>
    </div>

    <div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        <p style="font-size:7.5pt;color:#64748b;text-align:center;">
            <strong>The Resilience Atlas™</strong> — This report is provided for personal growth and educational purposes only.
            It is not a clinical assessment, diagnosis, or treatment recommendation. If you are experiencing mental health challenges,
            please consult a qualified mental health professional. © ${new Date().getFullYear()} The Resilience Atlas™. All rights reserved.
        </p>
    </div>

    ${pageFooter(16, 16)}
</div>`;
}

// ── Main template builder ─────────────────────────────────────────────────────

/**
 * Build the complete HTML string for the comprehensive PDF report.
 *
 * @param {number} overall       - Overall score (0–100)
 * @param {string} dominantType  - Dominant resilience type name
 * @param {Object} scores        - { [dimension]: { raw, max, percentage } }
 * @param {string} [name]        - Optional user's name
 * @returns {string} Complete HTML document
 */
function buildReportHTML(overall, dominantType, scores, name) {
    const assessmentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    // Normalize scores — accept percentage as a number on the top level or nested
    const normalizedScores = {};
    for (const dim of DIMENSIONS) {
        if (scores[dim]) {
            if (typeof scores[dim] === 'object') {
                normalizedScores[dim] = {
                    raw: scores[dim].raw || 0,
                    max: scores[dim].max || 60,
                    percentage: parseFloat(scores[dim].percentage || 0),
                };
            } else {
                normalizedScores[dim] = { raw: 0, max: 60, percentage: parseFloat(scores[dim]) };
            }
        } else {
            normalizedScores[dim] = { raw: 0, max: 60, percentage: 0 };
        }
    }

    const pages = [
        page1Cover(overall, dominantType, normalizedScores, assessmentDate),
        page2ExecutiveSummary(overall, dominantType, normalizedScores),
        page3RadarChart(normalizedScores),
        page4DimensionCards(normalizedScores),
        ...DIMENSIONS.map((dim, i) => pageDimensionDeepDive(dim, normalizedScores, 5 + i)),
        page11StrengthIntegration(normalizedScores, dominantType),
        page12ActionPlan(normalizedScores, dominantType),
        page13Benchmarking(overall, dominantType, normalizedScores),
        page14StressResponse(normalizedScores, dominantType),
        page15RelationshipInsights(normalizedScores, dominantType),
        page16Resources(overall, dominantType),
    ];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>The Resilience Atlas™ — Personal Resilience Report</title>
    <style>${buildCSS()}</style>
</head>
<body>
${pages.join('\n')}
</body>
</html>`;
}

module.exports = { buildReportHTML };
