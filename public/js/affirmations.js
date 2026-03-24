/* =====================================================
   affirmations.js
   Resilience Affirmation & Strength-Statement System
   Grounded in ACT (Acceptance and Commitment Therapy)
   and ABA (Applied Behavior Analysis) frameworks.

   EDUCATIONAL DISCLAIMER: These affirmations are for
   educational and self-reflection purposes only, not
   therapeutic or clinical treatment.
   ===================================================== */

'use strict';

// ── Affirmation Library ───────────────────────────────────────────────────────
// 7 affirmations per resilience type (42 total).

const AFFIRMATION_LIBRARY = [

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

  // ── Spiritual-Existential ─────────────────────────────────────────────────
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
    text: "I am present in my body and its capabilities.",
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

// ── Local Storage Keys ────────────────────────────────────────────────────────
const AFF_STORAGE_KEY = 'resilience_affirmations';
const AFF_FAVORITES_KEY = 'resilience_affirmation_favorites';
const AFF_CUSTOM_KEY = 'resilience_affirmations_custom';
const AFF_DAILY_KEY = 'resilience_affirmation_daily';

// ── HTML escaping utility ─────────────────────────────────────────────────────
function affEscHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function getAffirmationData() {
  try {
    return JSON.parse(localStorage.getItem(AFF_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAffirmationData(data) {
  try {
    localStorage.setItem(AFF_STORAGE_KEY, JSON.stringify(data));
  } catch { /* storage full or unavailable */ }
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(AFF_FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(AFF_FAVORITES_KEY, JSON.stringify(favs));
  } catch { /* storage full or unavailable */ }
}

function getCustomAffirmations() {
  try {
    return JSON.parse(localStorage.getItem(AFF_CUSTOM_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCustomAffirmations(customs) {
  try {
    localStorage.setItem(AFF_CUSTOM_KEY, JSON.stringify(customs));
  } catch { /* storage full or unavailable */ }
}

// ── Rating helpers ────────────────────────────────────────────────────────────
function rateAffirmation(affirmationId, rating) {
  const data = getAffirmationData();
  data[affirmationId] = {
    ...(data[affirmationId] || {}),
    rating,
    lastEngaged: new Date().toISOString(),
    engagementCount: ((data[affirmationId] || {}).engagementCount || 0) + 1,
  };
  saveAffirmationData(data);
  persistAffirmationRating(affirmationId, rating).catch(() => {});
}

function toggleFavorite(affirmationId) {
  const favs = getFavorites();
  const idx = favs.indexOf(affirmationId);
  if (idx === -1) {
    favs.push(affirmationId);
  } else {
    favs.splice(idx, 1);
  }
  saveFavorites(favs);
  persistAffirmationFavorite(affirmationId, idx === -1).catch(() => {});
  return idx === -1; // returns whether it is now favorited
}

function isFavorited(affirmationId) {
  return getFavorites().includes(affirmationId);
}

function getRating(affirmationId) {
  return (getAffirmationData()[affirmationId] || {}).rating || 0;
}

// ── API persistence (optional — gracefully degrades) ──────────────────────────
async function persistAffirmationRating(affirmationId, rating) {
  try {
    await fetch('/api/affirmations/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affirmationId, rating }),
    });
  } catch { /* network unavailable */ }
}

async function persistAffirmationFavorite(affirmationId, isFav) {
  try {
    await fetch('/api/affirmations/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ affirmationId, isFavorited: isFav }),
    });
  } catch { /* network unavailable */ }
}

async function persistCustomAffirmation(text, resilience_type) {
  try {
    await fetch('/api/affirmations/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, resilience_type }),
    });
  } catch { /* network unavailable */ }
}

// ── Filter helpers ────────────────────────────────────────────────────────────
function getAffirmationsForType(resilienceType) {
  return AFFIRMATION_LIBRARY.filter(a => a.resilience_type === resilienceType);
}

function getTopAffirmationsForType(resilienceType, count = 3) {
  const all = getAffirmationsForType(resilienceType);
  const data = getAffirmationData();
  const favs = getFavorites();

  // Sort by: favorited first, then by rating desc, then foundational first
  const diffOrder = { foundational: 0, developing: 1, advanced: 2 };
  return [...all]
    .sort((a, b) => {
      const aFav = favs.includes(a.affirmationId) ? 1 : 0;
      const bFav = favs.includes(b.affirmationId) ? 1 : 0;
      if (bFav !== aFav) return bFav - aFav;
      const aRating = (data[a.affirmationId] || {}).rating || 0;
      const bRating = (data[b.affirmationId] || {}).rating || 0;
      if (bRating !== aRating) return bRating - aRating;
      return (diffOrder[a.difficulty] || 0) - (diffOrder[b.difficulty] || 0);
    })
    .slice(0, count);
}

// ── Daily affirmation ─────────────────────────────────────────────────────────
function getDailyAffirmation(resilienceType) {
  const today = new Date().toDateString();
  try {
    const stored = JSON.parse(localStorage.getItem(AFF_DAILY_KEY) || '{}');
    if (stored.date === today && stored.type === resilienceType && stored.affirmationId) {
      const found = AFFIRMATION_LIBRARY.find(a => a.affirmationId === stored.affirmationId);
      if (found) return found;
    }
  } catch { /* fall through */ }

  // Pick a new daily affirmation
  const pool = getAffirmationsForType(resilienceType).filter(a => a.difficulty === 'foundational');
  const source = pool.length ? pool : getAffirmationsForType(resilienceType);
  if (!source.length) return null;

  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000
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

// ── Custom affirmation creation ───────────────────────────────────────────────
function createCustomAffirmation(text, resilienceType) {
  const customs = getCustomAffirmations();
  const custom = {
    affirmationId: `custom-${Date.now()}`,
    text: text.trim(),
    resilience_type: resilienceType,
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
  customs.push(custom);
  saveCustomAffirmations(customs);
  persistCustomAffirmation(text.trim(), resilienceType).catch(() => {});
  return custom;
}

// ── UI: Render a single affirmation card ──────────────────────────────────────
function renderAffirmationCard(affirmation, opts = {}) {
  const { compact = false } = opts;
  const fav = isFavorited(affirmation.affirmationId);
  const rating = getRating(affirmation.affirmationId);
  const isCustom = !!affirmation.isCustom;

  const ratingStars = [1, 2, 3, 4, 5]
    .map(n => `
      <button
        class="aff-star${rating >= n ? ' aff-star--active' : ''}"
        data-aff-id="${affEscHtml(affirmation.affirmationId)}"
        data-rating="${n}"
        aria-label="Rate ${n} out of 5"
        title="Rate ${n} out of 5"
        type="button"
      >★</button>
    `)
    .join('');

  const difficultyBadge = !isCustom ? `
    <span class="aff-badge aff-badge--${affEscHtml(affirmation.difficulty)}">
      ${affEscHtml(affirmation.difficulty)}
    </span>
  ` : '';

  const frameworkBadge = !isCustom ? `
    <span class="aff-badge aff-badge--framework">
      ${affEscHtml(affirmation.framework)}
    </span>
  ` : '<span class="aff-badge aff-badge--custom">custom</span>';

  const actPrincipleHtml = !isCustom && !compact ? `
    <p class="aff-principle"><strong>ACT:</strong> ${affEscHtml(affirmation.actPrinciple)}</p>
    <p class="aff-principle"><strong>ABA:</strong> ${affEscHtml(affirmation.abaPrinciple)}</p>
  ` : '';

  return `
    <div
      class="aff-card${compact ? ' aff-card--compact' : ''}"
      data-affirmation-id="${affEscHtml(affirmation.affirmationId)}"
      role="article"
      aria-label="Affirmation"
    >
      <div class="aff-card__badges">
        ${difficultyBadge}
        ${frameworkBadge}
      </div>

      <blockquote class="aff-card__text">
        &ldquo;${affEscHtml(affirmation.text)}&rdquo;
      </blockquote>

      ${actPrincipleHtml}

      <div class="aff-card__actions">
        <button
          class="aff-fav-btn${fav ? ' aff-fav-btn--active' : ''}"
          data-aff-id="${affEscHtml(affirmation.affirmationId)}"
          aria-label="${fav ? 'Remove from favorites' : 'Add to favorites'}"
          aria-pressed="${fav}"
          title="${fav ? 'Remove from favorites' : 'Save as favorite'}"
          type="button"
        >${fav ? '❤️' : '🤍'} ${fav ? 'Saved' : 'Save'}</button>

        <div class="aff-rating" role="group" aria-label="Rate this affirmation">
          ${ratingStars}
        </div>
      </div>
    </div>
  `;
}

// ── UI: Render custom affirmation form ────────────────────────────────────────
function renderCustomAffirmationForm(resilienceType) {
  return `
    <div class="aff-custom-form" id="aff-custom-form">
      <h4 class="aff-custom-form__title">✍️ Write Your Own Affirmation</h4>
      <label for="aff-custom-input" class="aff-custom-form__label">
        What personal strength statement resonates most with you?
      </label>
      <textarea
        id="aff-custom-input"
        class="aff-custom-form__textarea"
        rows="3"
        maxlength="300"
        placeholder="e.g. I trust myself to find a way through difficult moments."
        aria-label="Write your own affirmation"
      ></textarea>
      <div class="aff-custom-form__footer">
        <span class="aff-custom-form__hint">Max 300 characters. For personal reflection only.</span>
        <button
          type="button"
          class="aff-btn aff-btn--primary"
          id="aff-custom-save"
          data-resilience-type="${affEscHtml(resilienceType)}"
        >Save My Affirmation</button>
      </div>
    </div>
  `;
}

// ── UI: Render daily affirmation widget ───────────────────────────────────────
function renderDailyAffirmationWidget(resilienceType) {
  const daily = getDailyAffirmation(resilienceType);
  if (!daily) return '';

  const fav = isFavorited(daily.affirmationId);

  return `
    <div class="aff-daily-widget" role="region" aria-labelledby="aff-daily-heading">
      <div class="aff-daily-widget__header">
        <span class="aff-daily-widget__icon" aria-hidden="true">🌟</span>
        <h3 id="aff-daily-heading" class="aff-daily-widget__title">Your Affirmation for Today</h3>
      </div>
      <blockquote class="aff-daily-widget__text">
        &ldquo;${affEscHtml(daily.text)}&rdquo;
      </blockquote>
      <div class="aff-daily-widget__footer">
        <span class="aff-daily-widget__type">${affEscHtml(daily.resilience_type)}</span>
        <button
          class="aff-fav-btn${fav ? ' aff-fav-btn--active' : ''}"
          data-aff-id="${affEscHtml(daily.affirmationId)}"
          aria-label="${fav ? 'Remove from favorites' : 'Save this affirmation'}"
          aria-pressed="${fav}"
          type="button"
        >${fav ? '❤️' : '🤍'} ${fav ? 'Saved' : 'Save'}</button>
      </div>
    </div>
  `;
}

// ── UI: Render the full affirmations section ──────────────────────────────────
function renderAffirmationsSection(primaryType) {
  const topAffirmations = getTopAffirmationsForType(primaryType, 7);
  const customs = getCustomAffirmations().filter(c => c.resilience_type === primaryType);
  const allCards = [...topAffirmations, ...customs]
    .map(a => renderAffirmationCard(a))
    .join('');

  return `
    <section class="aff-section" aria-labelledby="aff-section-heading" id="aff-section">

      <div class="aff-section__header">
        <h2 id="aff-section-heading">Your Resilience Affirmations</h2>
        <p class="aff-section__subtitle">
          Strength statements aligned with your <strong>${affEscHtml(primaryType)}</strong> resilience profile.
          Rate affirmations to personalize your experience.
        </p>
        <p class="aff-disclaimer">
          <span aria-hidden="true">ℹ️</span>
          <strong>Educational Note:</strong> These affirmations support self-reflection and
          psychological flexibility. They are not therapeutic statements or clinical treatment.
        </p>
      </div>

      ${renderDailyAffirmationWidget(primaryType)}

      <div class="aff-cards-grid" id="aff-cards-grid">
        ${allCards}
      </div>

      ${renderCustomAffirmationForm(primaryType)}

    </section>
  `;
}

// ── UI: Compact affirmation for practice card ─────────────────────────────────
function renderAffirmationForPractice(practiceId) {
  const related = AFFIRMATION_LIBRARY.filter(a =>
    Array.isArray(a.relatedPractices) && a.relatedPractices.includes(practiceId)
  );
  if (!related.length) return '';

  const favs = getFavorites();
  const data = getAffirmationData();

  // Prioritize saved favorites, then highest-rated, then first
  const pick = related.sort((a, b) => {
    const aFav = favs.includes(a.affirmationId) ? 1 : 0;
    const bFav = favs.includes(b.affirmationId) ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    const aR = (data[a.affirmationId] || {}).rating || 0;
    const bR = (data[b.affirmationId] || {}).rating || 0;
    return bR - aR;
  })[0];

  if (!pick) return '';

  return `
    <div class="aff-practice-hint" aria-label="Related affirmation">
      <span class="aff-practice-hint__label" aria-hidden="true">💬</span>
      <em class="aff-practice-hint__text">&ldquo;${affEscHtml(pick.text)}&rdquo;</em>
    </div>
  `;
}

// ── UI: Interaction handlers ──────────────────────────────────────────────────
function initAffirmationInteractions() {
  // Delegate events on the affirmations section
  document.addEventListener('click', e => {
    // Favorite button
    const favBtn = e.target.closest('.aff-fav-btn[data-aff-id]');
    if (favBtn) {
      const id = favBtn.getAttribute('data-aff-id');
      const nowFav = toggleFavorite(id);
      favBtn.textContent = `${nowFav ? '❤️' : '🤍'} ${nowFav ? 'Saved' : 'Save'}`;
      favBtn.setAttribute('aria-pressed', nowFav);
      favBtn.setAttribute('aria-label', nowFav ? 'Remove from favorites' : 'Save this affirmation');
      favBtn.classList.toggle('aff-fav-btn--active', nowFav);
      return;
    }

    // Rating star
    const starBtn = e.target.closest('.aff-star[data-aff-id]');
    if (starBtn) {
      const id = starBtn.getAttribute('data-aff-id');
      const rating = parseInt(starBtn.getAttribute('data-rating'), 10);
      rateAffirmation(id, rating);

      // Update all stars for this affirmation
      const card = starBtn.closest('[data-affirmation-id]');
      if (card) {
        card.querySelectorAll('.aff-star').forEach(star => {
          const n = parseInt(star.getAttribute('data-rating'), 10);
          star.classList.toggle('aff-star--active', n <= rating);
        });
      }
      return;
    }

    // Custom affirmation save
    const saveBtn = e.target.closest('#aff-custom-save');
    if (saveBtn) {
      const textarea = document.getElementById('aff-custom-input');
      const resilienceType = saveBtn.getAttribute('data-resilience-type');
      const text = textarea ? textarea.value.trim() : '';
      if (!text) {
        textarea && textarea.focus();
        return;
      }
      if (text.length > 300) {
        showAffirmationToast('Please keep your affirmation under 300 characters.', true);
        return;
      }
      const custom = createCustomAffirmation(text, resilienceType);
      if (textarea) textarea.value = '';

      // Append new card to grid
      const grid = document.getElementById('aff-cards-grid');
      if (grid) {
        const div = document.createElement('div');
        div.innerHTML = renderAffirmationCard(custom);
        grid.appendChild(div.firstElementChild);
      }
      showAffirmationToast('Your affirmation has been saved! ✨');
      return;
    }
  });
}

function showAffirmationToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `aff-toast${isError ? ' aff-toast--error' : ''}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('aff-toast--visible'), 10);
  setTimeout(() => {
    toast.classList.remove('aff-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Public API ────────────────────────────────────────────────────────────────
window.Affirmations = {
  AFFIRMATION_LIBRARY,
  getAffirmationsForType,
  getTopAffirmationsForType,
  getDailyAffirmation,
  createCustomAffirmation,
  renderAffirmationsSection,
  renderDailyAffirmationWidget,
  renderAffirmationCard,
  renderAffirmationForPractice,
  initAffirmationInteractions,
  rateAffirmation,
  toggleFavorite,
  isFavorited,
  getRating,
};
