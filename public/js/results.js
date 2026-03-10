/* =====================================================
   results.js — Results page for 6-type resilience model
   ===================================================== */

'use strict';

// ── Narrative descriptions per resilience type ─────────
const TYPE_INFO = {
  'Cognitive-Narrative': {
    capacity: 'construct meaningful narratives and reframe challenges with clarity and purpose',
    complement: 'interpret experiences through a powerful personal lens, enabling adaptive thinking',
    growth: 'challenge limiting beliefs and build richer, more empowering inner stories',
    action: 'practice reflective journaling and cognitive reframing exercises daily',
  },
  'Relational': {
    capacity: 'build and sustain supportive connections that buffer adversity',
    complement: 'draw on a strong network of trust and mutual care during difficult times',
    growth: 'deepen vulnerability and reciprocity in your most important relationships',
    action: 'schedule regular check-ins with key people in your life and practice active listening',
  },
  'Agentic-Generative': {
    capacity: 'take purposeful action, adapt quickly, and generate creative solutions under pressure',
    complement: 'maintain momentum and initiative even when circumstances are uncertain',
    growth: 'strengthen your sense of personal agency and expand your problem-solving repertoire',
    action: 'set small, achievable goals each week and celebrate the progress you make',
  },
  'Emotional-Adaptive': {
    capacity: 'recognize, regulate, and adaptively respond to a full range of emotions',
    complement: 'process difficult feelings without being overwhelmed, maintaining emotional balance',
    growth: 'expand your emotional vocabulary and develop more nuanced coping strategies',
    action: 'practice mindfulness, breathing techniques, or speak with a counselor to build emotional flexibility',
  },
  'Spiritual-Existential': {
    capacity: 'draw on a deep sense of meaning, purpose, and values as an anchor during adversity',
    complement: 'align your actions with core beliefs, giving life direction and coherence',
    growth: 'explore and articulate the values and sources of meaning that sustain you',
    action: 'engage in reflective practices such as meditation, gratitude journaling, or values-clarification exercises',
  },
  'Somatic-Behavioral': {
    capacity: 'maintain physical well-being and healthy behavioral routines that sustain resilience',
    complement: 'ground your resilience in embodied habits of rest, movement, and nourishment',
    growth: 'develop consistent physical self-care routines that support your energy and focus',
    action: 'prioritize sleep, regular exercise, and balanced nutrition as a foundation for resilience',
  },
};

// ── Utility: minimal HTML escaping ─────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Email validation (fallback if app.js not loaded) ──
function _isValidEmail(email) {
  if (typeof isValidEmail === 'function') return isValidEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// ── Show alert helper ──────────────────────────────────
function showAlert(elId, message, type = 'success', emoji = '') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = (emoji ? emoji + ' ' : '') + message;
  el.classList.remove('alert-success', 'alert-error');
  el.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
  el.classList.add('visible');
}

// ── Format percentage to 1 decimal place ──────────────
function fmtPct(val) {
  return parseFloat(val).toFixed(1);
}

// ── Rank resilience types by percentage desc ──────────
function rankTypes(scores) {
  return Object.entries(scores).sort((a, b) => b[1].percentage - a[1].percentage);
}

// ── Generate personalized narrative ───────────────────
function generateNarrative(results, ranked) {
  const primaryType   = ranked[0][0];
  const solidType     = ranked[1][0];
  const emergingType  = ranked[ranked.length - 1][0];

  const pi = TYPE_INFO[primaryType]  || {};
  const si = TYPE_INFO[solidType]    || {};
  const ei = TYPE_INFO[emergingType] || {};

  return [
    `Your overall resilience score is ${results.overall}%.`,
    '',
    `Your dominant resilience strength is ${primaryType}. This reflects your exceptional ability to ${pi.capacity || 'navigate challenges with strength and clarity'}.`,
    '',
    `You also demonstrate solid capacity in ${solidType}, which complements your primary strength and enables you to ${si.complement || 'draw on a broad set of resilience resources'}.`,
    '',
    `Your greatest opportunity for growth lies in ${emergingType}. Developing this dimension can help you ${ei.growth || 'build a more balanced resilience profile'}. Consider: ${ei.action || 'focusing on intentional practice in this area'}.`,
    '',
    `By intentionally strengthening ${emergingType}, you can further expand your resilience profile and build a more balanced approach to life's challenges.`,
  ].join('\n');
}

// ── Populate overall score badge ──────────────────────
function renderOverallScore(overall) {
  const el = document.getElementById('overallScore');
  if (!el) return;
  el.textContent = overall + '%';

  // Color-code based on score
  el.classList.remove('score-excellent', 'score-good', 'score-moderate', 'score-developing');
  if (overall >= 85)      el.classList.add('score-excellent');
  else if (overall >= 70) el.classList.add('score-good');
  else if (overall >= 50) el.classList.add('score-moderate');
  else                    el.classList.add('score-developing');
}

// ── Main init ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const results = Store.get('resilience_results');
  const name    = Store.get('resilience_name') || (results && results.firstName) || '';

  if (!results || !results.scores || typeof results.scores !== 'object') {
    showAlert('pdfAlert', 'No results found. Please complete the assessment!', 'error', '⚠️');
    ['primaryStrength', 'solidStrength', 'emergingStrength'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    const reportEl = document.getElementById('reportText');
    if (reportEl) reportEl.textContent = 'No report available. Please finish the assessment.';
    return;
  }

  // ── Greeting ────────────────────────────────────────
  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    greetingEl.textContent = name
      ? `Your Resilience Profile, ${name}`
      : 'Your Resilience Profile';
  }

  const subtitleEl = document.getElementById('resultsSubtitle');
  if (subtitleEl) {
    subtitleEl.textContent = 'Personalized results based on your 36-question assessment.';
  }

  // ── Overall score ────────────────────────────────────
  renderOverallScore(results.overall || 0);

  // ── Rank types ───────────────────────────────────────
  const ranked = rankTypes(results.scores);
  const primaryType  = ranked[0][0];
  const solidType    = ranked[1][0];
  const emergingType = ranked[ranked.length - 1][0];

  // ── Strength cards ───────────────────────────────────
  const primaryEl  = document.getElementById('primaryStrength');
  const solidEl    = document.getElementById('solidStrength');
  const emergingEl = document.getElementById('emergingStrength');

  if (primaryEl)  primaryEl.textContent  = `${primaryType} (${fmtPct(results.scores[primaryType].percentage)}%)`;
  if (solidEl)    solidEl.textContent    = `${solidType} (${fmtPct(results.scores[solidType].percentage)}%)`;
  if (emergingEl) emergingEl.textContent = `${emergingType} (${fmtPct(results.scores[emergingType].percentage)}%)`;

  // ── Profile bars ─────────────────────────────────────
  const barsContainer = document.getElementById('profileBars');
  if (barsContainer && typeof renderProfileBars === 'function') {
    const items = ranked.map(([type, data]) => ({
      label:    type,
      score:    data.raw,
      maxScore: data.max,
      pct:      data.percentage,
    }));
    renderProfileBars(barsContainer, items);
  }

  // ── Radar chart ──────────────────────────────────────
  const radarCanvas = document.getElementById('radarChart');
  if (radarCanvas && typeof renderRadarChart === 'function') {
    const radarData = ranked.map(([type, data]) => ({
      label: type,
      value: data.percentage,
    }));
    renderRadarChart(radarCanvas, radarData);
  }

  // ── Narrative report ──────────────────────────────────
  const reportEl = document.getElementById('reportText');
  if (reportEl) {
    reportEl.textContent = generateNarrative(results, ranked);
  }

  // ── Report date ───────────────────────────────────────
  const reportDateEl = document.getElementById('reportDate');
  if (reportDateEl) {
    reportDateEl.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
});

// ── Download PDF ───────────────────────────────────────
document.getElementById('btnDownload')?.addEventListener('click', async () => {
  showAlert('pdfAlert', 'Preparing your PDF report...', 'success', '📝');
  try {
    const results = Store.get('resilience_results');
    if (!results) throw new Error('No results to download. Please finish the assessment first.');

    const ranked = rankTypes(results.scores);
    results.reportText = generateNarrative(results, ranked);
    Store.set('resilience_results', results);

    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    });

    if (!res.ok) throw new Error('PDF generation failed (status: ' + res.status + ')');

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'resilience-report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showAlert('pdfAlert', 'PDF downloaded! Check your Downloads. 🎉', 'success', '✅');
  } catch (e) {
    showAlert('pdfAlert', e.message || 'Download failed!', 'error', '❌');
  }
});

// ── Retake quiz ────────────────────────────────────────
document.getElementById('btnRetake')?.addEventListener('click', () => {
  Store.remove('resilience_results');
  window.location.href = 'quiz.html';
});

// ── Email report ───────────────────────────────────────
document.getElementById('btnEmail')?.addEventListener('click', async () => {
  const emailInput = document.getElementById('emailInput');
  const email = (emailInput && emailInput.value.trim()) || '';
  if (!email || !_isValidEmail(email)) {
    showAlert('emailAlert', 'Please enter a valid email address.', 'error', '📧');
    if (emailInput) emailInput.focus();
    return;
  }
  showAlert('emailAlert', 'Sending your report to ' + email + '...', 'success', '✉️');
  try {
    const results = Store.get('resilience_results');
    if (!results) throw new Error('No results to send. Please finish the assessment first.');

    const ranked = rankTypes(results.scores);
    results.reportText = generateNarrative(results, ranked);
    Store.set('resilience_results', results);

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...results, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Sending failed (status: ' + res.status + ')');
    showAlert('emailAlert', 'Report sent to ' + email + '! 🎉', 'success', '✅');
  } catch (e) {
    showAlert('emailAlert', e.message || 'Failed to send email.', 'error', '❌');
  }
});