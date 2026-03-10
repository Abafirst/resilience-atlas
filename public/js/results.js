/* =====================================================
   results.js — Results page logic for Resilience Atlas
   ===================================================== */

'use strict';

// ── Type descriptions ──────────────────────────────────
const TYPE_DESCRIPTIONS = {
  'Cognitive-Narrative':
    'Your resilience is driven by meaning-making and reframing life experiences. ' +
    'You find strength in narrative coherence and the ability to construct meaningful ' +
    'stories from challenging events.',
  'Relational':
    'Your resilience is strengthened through connection, trust, and supportive ' +
    'relationships. You thrive when you have people to lean on and meaningful bonds ' +
    'that sustain you.',
  'Agentic-Generative':
    'You demonstrate resilience through purposeful action and forward momentum. ' +
    'You are energized by taking charge, creating change, and generating new ' +
    'possibilities even in difficulty.',
  'Emotional-Adaptive':
    'You show flexibility in managing emotions and adapting to stress. You can ' +
    'recognize, tolerate, and work skillfully with a wide range of emotional experiences.',
  'Spiritual-Existential':
    'Your resilience is grounded in purpose, values, and a sense of meaning beyond ' +
    'yourself. You draw strength from a coherent worldview and connection to something larger.',
  'Somatic-Behavioral':
    'You rely on body awareness and behavioral habits to stabilize and recover from ' +
    'stress. Your physical practices and consistent routines provide a reliable foundation.',
};

// ── Utility: show feedback alert ───────────────────────
function showAlert(elID, message, type, emoji) {
  const el = document.getElementById(elID);
  if (!el) return;
  el.textContent = (emoji ? emoji + ' ' : '') + message;
  el.classList.remove('alert-success', 'alert-error');
  el.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
}

// ── Narrative report generator ─────────────────────────
function generateNarrativeReport(results, primaryStrength, solidStrength, emergingStrength) {
  const primary  = results.scores[primaryStrength];
  const solid    = results.scores[solidStrength];
  const emerging = results.scores[emergingStrength];

  const level =
    results.overall >= 80 ? 'strong foundation' :
    results.overall >= 60 ? 'solid foundation'  :
    results.overall >= 40 ? 'developing foundation' :
    'emerging foundation';

  return `
    <div class="narrative-report">

      <section class="report-overview">
        <h3>Your Resilience Profile Overview</h3>
        <p>
          Your overall resilience score is <strong>${results.overall}%</strong>.
          This indicates a ${level} of resilience across six key dimensions.
        </p>
      </section>

      <section class="report-primary">
        <h3>Your Primary Strength: ${escapeHtml(primaryStrength)}</h3>
        <p class="score-badge">${primary.percentage.toFixed(1)}%</p>
        <p>${TYPE_DESCRIPTIONS[primaryStrength] || ''}</p>
        <p>
          Your highest score in ${escapeHtml(primaryStrength)} suggests this is your most
          developed resilience capacity. Leverage this strength as a foundation for growth
          in other dimensions.
        </p>
      </section>

      <section class="report-solid">
        <h3>Your Solid Strength: ${escapeHtml(solidStrength)}</h3>
        <p class="score-badge">${solid.percentage.toFixed(1)}%</p>
        <p>${TYPE_DESCRIPTIONS[solidStrength] || ''}</p>
        <p>
          Your strong performance in ${escapeHtml(solidStrength)} complements your primary
          strength and creates a robust foundation for resilience.
        </p>
      </section>

      <section class="report-emerging">
        <h3>Your Growth Opportunity: ${escapeHtml(emergingStrength)}</h3>
        <p class="score-badge">${emerging.percentage.toFixed(1)}%</p>
        <p>${TYPE_DESCRIPTIONS[emergingStrength] || ''}</p>
        <p>
          While ${escapeHtml(emergingStrength)} is your lowest-scoring dimension, it also
          represents your greatest opportunity for growth. Intentionally developing this
          area can significantly expand your overall resilience capacity.
        </p>
      </section>

      <section class="report-development">
        <h3>Growth Suggestions</h3>
        <ul>
          <li>Build on your <strong>${escapeHtml(primaryStrength)}</strong> strength by helping others develop it</li>
          <li>Practice integrating <strong>${escapeHtml(solidStrength)}</strong> with <strong>${escapeHtml(emergingStrength)}</strong></li>
          <li>Start small with one habit that develops <strong>${escapeHtml(emergingStrength)}</strong></li>
          <li>Track your progress monthly to recognize growth patterns</li>
        </ul>
      </section>

    </div>
  `;
}

// ── Personalised plain-text report (for email / PDF body) ─
function generatePersonalizedReport(results) {
  let text = `Dear ${results.firstName || results.name || 'Friend'},\n\n`;
  text += `Thank you for completing the Resilience Assessment.\n`;
  text += `Your overall score is: ${results.overall}%.\n`;
  text += `Your dominant resilience type is: ${results.dominantType}.\n\n`;
  text += `Your resilience scores:\n`;
  Object.entries(results.scores || {}).forEach(([type, score]) => {
    const pct = typeof score === 'object' ? score.percentage : score;
    text += `  - ${type}: ${pct}%\n`;
  });
  text += '\nKeep building your resilience journey!\n';
  return text;
}

// ── Page initialisation ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const results = JSON.parse(localStorage.getItem('resilience_results'));

  if (!results || !results.scores) {
    showAlert('pdfAlert', 'No results found. Please complete the assessment!', 'error', '⚠️');
    ['primaryStrength', 'solidStrength', 'emergingStrength'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    const reportText = document.getElementById('reportText');
    if (reportText) reportText.textContent = 'No report available. Please finish the assessment.';
    return;
  }

  // ── Rank resilience types by percentage ─────────────
  const ranked = Object.entries(results.scores)
    .sort((a, b) => b[1].percentage - a[1].percentage);

  const primaryStrength  = ranked[0][0];
  const solidStrength    = ranked[1][0];
  const emergingStrength = ranked[ranked.length - 1][0];

  console.log('Primary:',  primaryStrength,  results.scores[primaryStrength].percentage);
  console.log('Solid:',    solidStrength,    results.scores[solidStrength].percentage);
  console.log('Emerging:', emergingStrength, results.scores[emergingStrength].percentage);

  // ── Greeting ─────────────────────────────────────────
  const name = results.firstName || results.name || localStorage.getItem('resilience_name') || '';
  const greetingEl = document.getElementById('greeting');
  if (greetingEl && name) greetingEl.textContent = `Your Resilience Profile, ${name}`;

  const subtitleEl = document.getElementById('resultsSubtitle');
  if (subtitleEl) subtitleEl.textContent = `Overall Score: ${results.overall}% — Dominant Type: ${results.dominantType}`;

  // ── Strength cards ────────────────────────────────────
  const primaryEl = document.getElementById('primaryStrength');
  if (primaryEl) primaryEl.textContent = `${primaryStrength} (${results.scores[primaryStrength].percentage.toFixed(1)}%)`;

  const solidEl = document.getElementById('solidStrength');
  if (solidEl) solidEl.textContent = `${solidStrength} (${results.scores[solidStrength].percentage.toFixed(1)}%)`;

  const emergingEl = document.getElementById('emergingStrength');
  if (emergingEl) emergingEl.textContent = `${emergingStrength} (${results.scores[emergingStrength].percentage.toFixed(1)}%)`;

  // ── Radar chart ───────────────────────────────────────
  const radarContainer = document.getElementById('radarChartContainer');
  if (radarContainer && typeof renderRadarChart === 'function') {
    renderRadarChart(radarContainer, results.scores);
  }

  // ── Bar chart ─────────────────────────────────────────
  const profileBars = document.getElementById('profileBars');
  if (profileBars && typeof renderProfileBars === 'function') {
    const items = Object.entries(results.scores).map(([label, s]) => ({
      label,
      score: s.raw,
      maxScore: s.max,
    }));
    renderProfileBars(profileBars, items);
  }

  // ── Narrative report ──────────────────────────────────
  const reportText = document.getElementById('reportText');
  if (reportText) {
    reportText.innerHTML = generateNarrativeReport(results, primaryStrength, solidStrength, emergingStrength);
  }

  // ── Evidence-Based Practices ──────────────────────────
  const practicesContainer = document.getElementById('evidencePracticesContainer');
  if (practicesContainer && window.EvidencePractices) {
    practicesContainer.innerHTML = window.EvidencePractices.renderPracticesSection(emergingStrength);
    window.EvidencePractices.initPracticeInteractions();
  }

  // ── Store email for payment gating ────────────────────
  const email = results.email || '';
  if (email && !localStorage.getItem('resilience_email')) {
    localStorage.setItem('resilience_email', email);
  }

  // ── Render upgrade cards for free users ───────────────
  const upgradeContainer = document.getElementById('upgradeCardsContainer');
  if (upgradeContainer && window.UpgradeCards && window.PaymentGating) {
    if (!window.PaymentGating.isDeepReport()) {
      upgradeContainer.innerHTML = window.UpgradeCards.renderComparisonCards();
    }
  }

  // ── Re-apply gating after results render ──────────────
  if (window.PaymentGating) {
    window.PaymentGating.applyGating();
  }
});

// ── Download PDF button ────────────────────────────────
document.getElementById('btnDownload')?.addEventListener('click', () => {
  try {
    const results = JSON.parse(localStorage.getItem('resilience_results'));
    if (!results) throw new Error('No results to download. Please finish the assessment first.');

    // Gate PDF behind Deep Report purchase.
    if (window.PaymentGating && !window.PaymentGating.isDeepReport()) {
      showAlert('pdfAlert', 'PDF download requires a Deep Report or Atlas Premium purchase.', 'error', '🔒');
      if (window.UpgradeCards) {
        const upgradeContainer = document.getElementById('upgradeCardsContainer');
        if (upgradeContainer && !upgradeContainer.innerHTML.trim()) {
          upgradeContainer.innerHTML = window.UpgradeCards.renderComparisonCards();
        }
        upgradeContainer?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const email = localStorage.getItem('resilience_email') || results.email || '';
    const scoresStr = encodeURIComponent(JSON.stringify(results.scores));
    const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';
    window.location.href = `/api/report/download?overall=${results.overall}&dominantType=${encodeURIComponent(results.dominantType)}&scores=${scoresStr}${emailParam}`;
  } catch (e) {
    showAlert('pdfAlert', e.message || 'Download failed!', 'error', '❌');
  }
});

// ── Retake quiz button ─────────────────────────────────
document.getElementById('btnRetake')?.addEventListener('click', () => {
  localStorage.removeItem('resilience_results');
  window.location.href = 'quiz.html';
});

// ── Email report button ────────────────────────────────
document.getElementById('btnEmail')?.addEventListener('click', async () => {
  const emailInput = document.getElementById('emailInput');
  const email = emailInput?.value.trim();
  if (!email) {
    showAlert('emailAlert', 'Please enter your email address.', 'error', '📧');
    if (emailInput) emailInput.focus();
    return;
  }
  showAlert('emailAlert', 'Sending your report to ' + email + '...', 'success', '✉️');
  try {
    const results = JSON.parse(localStorage.getItem('resilience_results'));
    if (!results) throw new Error('No results to send. Please finish the assessment first.');

    results.reportText = generatePersonalizedReport(results);

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...results, email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || ('Sending failed (status: ' + res.status + ')'));
    showAlert('emailAlert', 'Report sent to ' + email + '! 🎉', 'success', '✅');
  } catch (e) {
    showAlert('emailAlert', e.message || 'Failed to send email.', 'error', '❌');
  }
});
