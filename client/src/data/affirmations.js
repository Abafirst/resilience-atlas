/* =====================================================
   affirmations.js  (ES module)
   Resilience Affirmation & Strength-Statement System
   Grounded in ACT (Acceptance and Commitment Therapy)
   and ABA (Applied Behavior Analysis) frameworks.

   EDUCATIONAL DISCLAIMER: These affirmations are for
   educational and self-reflection purposes only, not
   therapeutic or clinical treatment.
   ===================================================== */

// ── Affirmation Library ───────────────────────────────────────────────────────
// 7 affirmations per resilience type (42 total).

export const AFFIRMATION_LIBRARY = [

  // ── Cognitive-Narrative ──────────────────────────────────────────────────
  {
    affirmationId: 'cn-aff-01',
    text: 'I can reinterpret setbacks in a way that helps me move forward.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'both',
    actPrinciple: 'Cognitive Defusion',
    abaPrinciple: 'Differential Reinforcement of Adaptive Interpretations',
    difficulty: 'foundational',
    relatedPractices: ['cn-01', 'cn-02'],
  },
  {
    affirmationId: 'cn-aff-02',
    text: 'When things go wrong, I try to find meaning in the experience.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'ACT',
    actPrinciple: 'Values Clarification',
    abaPrinciple: 'Establishing Operations for Meaning-Seeking Behavior',
    difficulty: 'foundational',
    relatedPractices: ['cn-01', 'cn-03'],
  },
  {
    affirmationId: 'cn-aff-03',
    text: 'I can step back and see challenges from a broader perspective.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'ACT',
    actPrinciple: 'Self-as-Context',
    abaPrinciple: 'Observational Learning and Perspective-Taking',
    difficulty: 'developing',
    relatedPractices: ['cn-02', 'cn-04'],
  },
  {
    affirmationId: 'cn-aff-04',
    text: 'My past challenges have taught me valuable lessons.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'ABA',
    actPrinciple: 'Present Moment Awareness',
    abaPrinciple: 'History of Reinforcement and Behavioral Repertoire',
    difficulty: 'foundational',
    relatedPractices: ['cn-01', 'cn-05'],
  },
  {
    affirmationId: 'cn-aff-05',
    text: 'I can choose how I interpret difficult situations.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'both',
    actPrinciple: 'Cognitive Defusion',
    abaPrinciple: 'Stimulus Control and Response Flexibility',
    difficulty: 'developing',
    relatedPractices: ['cn-01', 'cn-02'],
  },
  {
    affirmationId: 'cn-aff-06',
    text: 'Setbacks are opportunities to strengthen my perspective.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'both',
    actPrinciple: 'Acceptance',
    abaPrinciple: 'Positive Reinforcement of Growth-Oriented Responses',
    difficulty: 'developing',
    relatedPractices: ['cn-02', 'cn-03'],
  },
  {
    affirmationId: 'cn-aff-07',
    text: 'I create stories that empower me, not limit me.',
    resilience_type: 'Cognitive-Narrative',
    framework: 'ACT',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Verbal Behavior and Self-Efficacy Statements',
    difficulty: 'advanced',
    relatedPractices: ['cn-03', 'cn-04', 'cn-05'],
  },

  // ── Relational ───────────────────────────────────────────────────────────
  {
    affirmationId: 're-aff-01',
    text: 'I feel comfortable reaching out to others when I need support.',
    resilience_type: 'Relational-Connective',
    framework: 'both',
    actPrinciple: 'Values Clarification',
    abaPrinciple: 'Social Reinforcement and Help-Seeking Behavior',
    difficulty: 'foundational',
    relatedPractices: ['re-01', 're-04'],
  },
  {
    affirmationId: 're-aff-02',
    text: 'I maintain strong relationships during stressful times.',
    resilience_type: 'Relational-Connective',
    framework: 'both',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Behavioral Maintenance Through Social Contingencies',
    difficulty: 'developing',
    relatedPractices: ['re-04', 're-05'],
  },
  {
    affirmationId: 're-aff-03',
    text: 'Talking with trusted people helps me regain perspective.',
    resilience_type: 'Relational-Connective',
    framework: 'both',
    actPrinciple: 'Acceptance',
    abaPrinciple: 'Social Reinforcement of Help-Seeking Behavior',
    difficulty: 'foundational',
    relatedPractices: ['re-01', 're-02'],
  },
  {
    affirmationId: 're-aff-04',
    text: 'I am worthy of love and connection.',
    resilience_type: 'Relational-Connective',
    framework: 'ACT',
    actPrinciple: 'Self-Compassion and Values',
    abaPrinciple: 'Self-Efficacy Statements and Emotional Regulation',
    difficulty: 'foundational',
    relatedPractices: ['re-01', 're-03'],
  },
  {
    affirmationId: 're-aff-05',
    text: 'My relationships are a source of strength.',
    resilience_type: 'Relational-Connective',
    framework: 'both',
    actPrinciple: 'Values Clarification',
    abaPrinciple: 'Identifying Social Motivating Operations',
    difficulty: 'foundational',
    relatedPractices: ['re-01', 're-04'],
  },
  {
    affirmationId: 're-aff-06',
    text: 'I can be vulnerable without losing my dignity.',
    resilience_type: 'Relational-Connective',
    framework: 'ACT',
    actPrinciple: 'Acceptance',
    abaPrinciple: 'Differential Reinforcement of Authentic Disclosure',
    difficulty: 'advanced',
    relatedPractices: ['re-02', 're-03'],
  },
  {
    affirmationId: 're-aff-07',
    text: 'I contribute positively to the relationships that matter to me.',
    resilience_type: 'Relational-Connective',
    framework: 'both',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Positive Reinforcement of Prosocial Contributions',
    difficulty: 'developing',
    relatedPractices: ['re-01', 're-04', 're-05'],
  },

  // ── Agentic-Generative ───────────────────────────────────────────────────
  {
    affirmationId: 'ag-aff-01',
    text: 'I have the power to create positive change in my life.',
    resilience_type: 'Agentic-Generative',
    framework: 'both',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Self-Efficacy and Behavioral Activation',
    difficulty: 'foundational',
    relatedPractices: ['ag-01', 'ag-02'],
  },
  {
    affirmationId: 'ag-aff-02',
    text: 'I can take meaningful action even when uncertain.',
    resilience_type: 'Agentic-Generative',
    framework: 'ACT',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Behavioral Momentum and Tolerance of Ambiguity',
    difficulty: 'developing',
    relatedPractices: ['ag-02', 'ag-03'],
  },
  {
    affirmationId: 'ag-aff-03',
    text: 'My efforts matter and create real impact.',
    resilience_type: 'Agentic-Generative',
    framework: 'ABA',
    actPrinciple: 'Values Clarification',
    abaPrinciple: 'Positive Reinforcement of Goal-Directed Behavior',
    difficulty: 'foundational',
    relatedPractices: ['ag-01', 'ag-04'],
  },
  {
    affirmationId: 'ag-aff-04',
    text: 'I am capable of achieving my goals.',
    resilience_type: 'Agentic-Generative',
    framework: 'ABA',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Self-Efficacy Statements and Goal-Setting Behavior',
    difficulty: 'foundational',
    relatedPractices: ['ag-01', 'ag-02'],
  },
  {
    affirmationId: 'ag-aff-05',
    text: 'I generate possibilities where others see obstacles.',
    resilience_type: 'Agentic-Generative',
    framework: 'both',
    actPrinciple: 'Creative Hopelessness and Flexibility',
    abaPrinciple: 'Generative Problem-Solving Repertoire',
    difficulty: 'advanced',
    relatedPractices: ['ag-03', 'ag-05'],
  },
  {
    affirmationId: 'ag-aff-06',
    text: 'My agency is a source of strength and resilience.',
    resilience_type: 'Agentic-Generative',
    framework: 'both',
    actPrinciple: 'Values Clarification',
    abaPrinciple: 'Behavioral Self-Management and Empowerment',
    difficulty: 'developing',
    relatedPractices: ['ag-01', 'ag-04'],
  },
  {
    affirmationId: 'ag-aff-07',
    text: 'I can move forward one step at a time.',
    resilience_type: 'Agentic-Generative',
    framework: 'both',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Shaping — Reinforcing Successive Approximations',
    difficulty: 'foundational',
    relatedPractices: ['ag-02', 'ag-03'],
  },

  // ── Emotional-Adaptive ───────────────────────────────────────────────────
  {
    affirmationId: 'ea-aff-01',
    text: 'I can feel emotions fully without being overwhelmed by them.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'ACT',
    actPrinciple: 'Acceptance',
    abaPrinciple: 'Emotional Regulation and Distress Tolerance',
    difficulty: 'developing',
    relatedPractices: ['ea-01', 'ea-02'],
  },
  {
    affirmationId: 'ea-aff-02',
    text: 'My emotions are valid and provide important information.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'ACT',
    actPrinciple: 'Present Moment Awareness',
    abaPrinciple: 'Identifying Emotional Antecedents and Functions',
    difficulty: 'foundational',
    relatedPractices: ['ea-03', 'ea-04'],
  },
  {
    affirmationId: 'ea-aff-03',
    text: 'I can adapt to change and challenging emotions.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'both',
    actPrinciple: 'Psychological Flexibility',
    abaPrinciple: 'Behavioral Flexibility and Adaptive Responding',
    difficulty: 'developing',
    relatedPractices: ['ea-01', 'ea-05'],
  },
  {
    affirmationId: 'ea-aff-04',
    text: 'I have the capacity to regulate my emotions skillfully.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'both',
    actPrinciple: 'Acceptance',
    abaPrinciple: 'Self-Regulation Repertoire',
    difficulty: 'developing',
    relatedPractices: ['ea-02', 'ea-03'],
  },
  {
    affirmationId: 'ea-aff-05',
    text: 'Difficult emotions are temporary and manageable.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'ACT',
    actPrinciple: 'Defusion from Emotional Content',
    abaPrinciple: 'Extinction of Avoidance Behaviors',
    difficulty: 'foundational',
    relatedPractices: ['ea-01', 'ea-02'],
  },
  {
    affirmationId: 'ea-aff-06',
    text: 'I can sit with discomfort and still move forward.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'ACT',
    actPrinciple: 'Willingness and Acceptance',
    abaPrinciple: 'Graduated Exposure and Tolerance Building',
    difficulty: 'advanced',
    relatedPractices: ['ea-01', 'ea-03'],
  },
  {
    affirmationId: 'ea-aff-07',
    text: 'My emotional flexibility is a strength.',
    resilience_type: 'Emotional-Adaptive',
    framework: 'both',
    actPrinciple: 'Psychological Flexibility',
    abaPrinciple: 'Broad Behavioral Repertoire for Emotional Situations',
    difficulty: 'advanced',
    relatedPractices: ['ea-04', 'ea-05'],
  },

  // ── Spiritual-Reflective ──────────────────────────────────────────────────
  {
    affirmationId: 'se-aff-01',
    text: 'My life has meaning and purpose.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'ACT',
    actPrinciple: 'Values Clarification',
    abaPrinciple: 'Values as Motivating Operations for Behavior',
    difficulty: 'foundational',
    relatedPractices: ['se-01', 'se-02'],
  },
  {
    affirmationId: 'se-aff-02',
    text: 'I am connected to something larger than myself.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'ACT',
    actPrinciple: 'Self-as-Context',
    abaPrinciple: 'Identifying Community and Social Reinforcers',
    difficulty: 'foundational',
    relatedPractices: ['se-03', 'se-05'],
  },
  {
    affirmationId: 'se-aff-03',
    text: 'My values guide me through uncertainty.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'ACT',
    actPrinciple: 'Values as Compass',
    abaPrinciple: 'Rule-Governed Behavior Aligned with Personal Values',
    difficulty: 'developing',
    relatedPractices: ['se-01', 'se-04'],
  },
  {
    affirmationId: 'se-aff-04',
    text: 'I can find meaning even in difficult experiences.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'both',
    actPrinciple: 'Acceptance and Meaning-Making',
    abaPrinciple: 'Conditioned Reinforcers in Adversity',
    difficulty: 'advanced',
    relatedPractices: ['se-02', 'se-03'],
  },
  {
    affirmationId: 'se-aff-05',
    text: 'My existence matters and contributes to the world.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'both',
    actPrinciple: 'Self-as-Context',
    abaPrinciple: 'Social Reinforcement of Contribution Behaviors',
    difficulty: 'foundational',
    relatedPractices: ['se-01', 'se-05'],
  },
  {
    affirmationId: 'se-aff-06',
    text: 'I am aligned with what truly matters to me.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'ACT',
    actPrinciple: 'Values-Based Living',
    abaPrinciple: 'Behavioral Consistency with Conditioned Motivating Operations',
    difficulty: 'developing',
    relatedPractices: ['se-01', 'se-04'],
  },
  {
    affirmationId: 'se-aff-07',
    text: 'My purpose gives me resilience and direction.',
    resilience_type: 'Spiritual-Reflective',
    framework: 'both',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Purpose as a Motivating Operation for Sustained Behavior',
    difficulty: 'advanced',
    relatedPractices: ['se-02', 'se-04', 'se-05'],
  },

  // ── Somatic-Regulative ────────────────────────────────────────────────────
  {
    affirmationId: 'sb-aff-01',
    text: 'My body is a source of wisdom and grounding.',
    resilience_type: 'Somatic-Regulative',
    framework: 'both',
    actPrinciple: 'Present Moment Awareness',
    abaPrinciple: 'Interoceptive Awareness as Discriminative Stimulus',
    difficulty: 'foundational',
    relatedPractices: ['sb-01', 'sb-02'],
  },
  {
    affirmationId: 'sb-aff-02',
    text: "I can trust my body's signals and respond with care.",
    resilience_type: 'Somatic-Regulative',
    framework: 'both',
    actPrinciple: 'Acceptance',
    abaPrinciple: 'Responding to Internal Discriminative Stimuli Adaptively',
    difficulty: 'developing',
    relatedPractices: ['sb-01', 'sb-03'],
  },
  {
    affirmationId: 'sb-aff-03',
    text: 'My physical practices strengthen my resilience.',
    resilience_type: 'Somatic-Regulative',
    framework: 'ABA',
    actPrinciple: 'Committed Action',
    abaPrinciple: 'Behavioral Habit Stacking and Positive Reinforcement',
    difficulty: 'foundational',
    relatedPractices: ['sb-02', 'sb-04'],
  },
  {
    affirmationId: 'sb-aff-04',
    text: 'I can move through the world with awareness and ease.',
    resilience_type: 'Somatic-Regulative',
    framework: 'both',
    actPrinciple: 'Present Moment Awareness',
    abaPrinciple: 'Behavioral Fluency Through Consistent Practice',
    difficulty: 'developing',
    relatedPractices: ['sb-02', 'sb-05'],
  },
  {
    affirmationId: 'sb-aff-05',
    text: 'My body deserves attention, movement, and rest.',
    resilience_type: 'Somatic-Regulative',
    framework: 'both',
    actPrinciple: 'Self-Compassion and Values',
    abaPrinciple: 'Differential Reinforcement of Self-Care Behaviors',
    difficulty: 'foundational',
    relatedPractices: ['sb-01', 'sb-03'],
  },
  {
    affirmationId: 'sb-aff-06',
    text: 'I am present in my body and its capabilities.',
    resilience_type: 'Somatic-Regulative',
    framework: 'ACT',
    actPrinciple: 'Present Moment Awareness',
    abaPrinciple: 'Mindfulness-Based Behavioral Activation',
    difficulty: 'developing',
    relatedPractices: ['sb-01', 'sb-02'],
  },
  {
    affirmationId: 'sb-aff-07',
    text: 'My embodied awareness is a foundation for resilience.',
    resilience_type: 'Somatic-Regulative',
    framework: 'both',
    actPrinciple: 'Psychological Flexibility',
    abaPrinciple: 'Somatic Awareness as a Behavioral Regulatory Resource',
    difficulty: 'advanced',
    relatedPractices: ['sb-03', 'sb-04', 'sb-05'],
  },
];

// ── Affirmations grouped by dimension ────────────────────────────────────────
// Maps the six resilience dimensions to their affirmations.
export const AFFIRMATIONS_BY_DIMENSION = {
  'Agentic':    AFFIRMATION_LIBRARY.filter(a => a.resilience_type === 'Agentic-Generative'),
  'Relational': AFFIRMATION_LIBRARY.filter(a => a.resilience_type === 'Relational-Connective'),
  'Spiritual':  AFFIRMATION_LIBRARY.filter(a => a.resilience_type === 'Spiritual-Reflective'),
  'Emotional':  AFFIRMATION_LIBRARY.filter(a => a.resilience_type === 'Emotional-Adaptive'),
  'Somatic':    AFFIRMATION_LIBRARY.filter(a => a.resilience_type === 'Somatic-Regulative'),
  'Cognitive':  AFFIRMATION_LIBRARY.filter(a => a.resilience_type === 'Cognitive-Narrative'),
};

// ── Utility: get all affirmations for a resilience type ───────────────────────
export function getAffirmationsForType(resilienceType) {
  return AFFIRMATION_LIBRARY.filter(a => a.resilience_type === resilienceType);
}

const MS_PER_DAY = 86400000;

// ── Utility: get a deterministic daily affirmation for a resilience type ──────
export function getDailyAffirmation(resilienceType) {
  const AFF_DAILY_KEY = 'resilience_affirmation_daily';
  const today = new Date().toDateString();

  try {
    const stored = JSON.parse(localStorage.getItem(AFF_DAILY_KEY) || '{}');
    if (stored.date === today && stored.type === resilienceType && stored.affirmationId) {
      const found = AFFIRMATION_LIBRARY.find(a => a.affirmationId === stored.affirmationId);
      if (found) return found;
    }
  } catch { /* fall through */ }

  const pool = getAffirmationsForType(resilienceType).filter(a => a.difficulty === 'foundational');
  const source = pool.length ? pool : getAffirmationsForType(resilienceType);
  if (!source.length) return null;

  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 1)) / MS_PER_DAY
  );
  const pick = source[dayOfYear % source.length];

  try {
    localStorage.setItem(AFF_DAILY_KEY, JSON.stringify({
      date: today,
      type: resilienceType,
      affirmationId: pick.affirmationId,
    }));
  } catch { /* storage unavailable */ }

  return pick;
}

// ── Utility: pick a daily affirmation across all dimensions ───────────────────
export function getDailyAffirmationAny() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 1)) / MS_PER_DAY
  );
  const foundational = AFFIRMATION_LIBRARY.filter(a => a.difficulty === 'foundational');
  const source = foundational.length ? foundational : AFFIRMATION_LIBRARY;
  return source[dayOfYear % source.length] || null;
}
