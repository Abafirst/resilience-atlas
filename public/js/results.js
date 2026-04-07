// ⚠️ CRITICAL FILE
// Do not replace structure — required for rendering results, radar chart, and report
/*
results.js — Results page logic for Resilience Atlas
*/
'use strict';

// Load saved quiz results FIRST
const results = JSON.parse(localStorage.getItem('resilience_results')) || null;
window.results = results;
// Expose as window.resilience_results for payment-gating.js to access
window.resilience_results = results;
// Backward compatibility
if (results && results.scores && results.scores["Somatic-Regulative"]) {
  results.scores["Somatic-Regulative"] = results.scores["Somatic-Regulative"];
}
// ── Auth0 token helper ────────────────────────────────
function getAuth0Token() {
  try {
    var raw = localStorage.getItem('@@auth0spajs@@');
    if (!raw) return '';
    var parsed = JSON.parse(raw);
    var firstKey = Object.keys(parsed)[0];
    if (!firstKey) return '';
    return (parsed[firstKey][0] && parsed[firstKey][0].body && parsed[firstKey][0].body.access_token) || '';
  } catch (e) {
    return '';
  }
}

// ── HTML escaper (used for safe interpolation) ─────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Dimension accent colors ──────────────────────────
const DIM_COLORS = {
  'Cognitive-Narrative':   '#4F46E5',
  'Relational-Connective': '#059669',
  'Agentic-Generative':    '#D97706',
  'Emotional-Adaptive':    '#DC2626',
  'Spiritual-Reflective':  '#7C3AED',
  'Somatic-Regulative':    '#0891B2',
};

// ── Type descriptions ──────────────────────────────────
const TYPE_DESCRIPTIONS = {
  'Cognitive-Narrative':
    'Your resilience is driven by meaning-making and reframing life experiences. ' +
    'You find strength in narrative coherence and the ability to construct meaningful ' +
    'stories from challenging events.',
  'Relational-Connective':
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
  'Spiritual-Reflective':
    'Your resilience is grounded in purpose, values, and a sense of meaning beyond ' +
    'yourself. You draw strength from a coherent worldview and connection to something larger.',
'Somatic-Regulative':
    'You rely on body awareness and behavioral habits to stabilize and recover from ' +
    'stress. Your physical practices and consistent routines provide a reliable foundation.',
};
// ── Utility: show feedback alert ───────────────────────
const ALERT_ICON_MAP = {
  'warning': '/icons/checkmark.svg',
  'lock':    '/icons/lock.svg',
  'error':   '/icons/lock.svg',
  'email':   '/icons/compass.svg',
  'success': '/icons/checkmark.svg',
  'report':  '/icons/cognitive-narrative.svg',
};

function showAlert(elID, message, type, iconKey) {
  const el = document.getElementById(elID);
  if (!el) return;
  el.innerHTML = '';
  const iconSrc = iconKey ? ALERT_ICON_MAP[iconKey] : null;
  if (iconSrc) {
    const img = document.createElement('img');
    img.src = iconSrc;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.className = 'icon icon-xs';
    img.style.marginRight = '0.35em';
    el.appendChild(img);
  }
  el.appendChild(document.createTextNode(message));
  el.classList.remove('alert-success', 'alert-error');
  el.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
}

// ── Free brief report (compact snapshot card) ──────────
function renderFreeBriefReport(results, primaryStrength, solidStrength, emergingStrength) {
  const overall = results.overall;
  const level =
    overall >= 80 ? 'strong' :
    overall >= 60 ? 'solid'  :
    overall >= 40 ? 'developing' :
    'emerging';

  const dimRows = Object.entries(results.scores)
    .sort((a, b) => b[1].percentage - a[1].percentage)
    .map(function (entry) {
      var dim   = entry[0];
      var score = entry[1];
      var pct   = Math.round(score.percentage);
      var color = DIM_COLORS[dim] || '#667eea';
      return '<div class="fbr-dim-row">' +
        '<span class="fbr-dim-name">' + escapeHtml(dim) + '</span>' +
        '<div class="fbr-dim-bar-wrap" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + escapeHtml(dim) + ' ' + pct + '%">' +
          '<div class="fbr-dim-bar-fill" style="width:' + pct + '%;background:' + escapeHtml(color) + '"></div>' +
        '</div>' +
        '<span class="fbr-dim-pct">' + pct + '%</span>' +
        '</div>';
    }).join('');

  return '<div class="free-brief-report" role="region" aria-label="Your Resilience Snapshot">' +
    '<div class="fbr-hero">' +
      '<div class="fbr-score-circle" aria-label="Overall resilience score ' + overall + '%">' +
        '<span class="fbr-score-num">' + overall + '</span>' +
        '<span class="fbr-score-sym">%</span>' +
      '</div>' +
      '<div class="fbr-hero-info">' +
        '<h2 class="fbr-hero-title">Your Resilience Snapshot</h2>' +
        '<p class="fbr-hero-level">You demonstrate a <strong>' + level + '</strong> resilience foundation.</p>' +
        '<p class="fbr-hero-strength">Primary strength: <strong>' + escapeHtml(primaryStrength) + '</strong></p>' +
      '</div>' +
    '</div>' +
    '<div class="fbr-dims">' +
      '<p class="fbr-dims-label">Six Dimensions — Ranked by Score</p>' +
      dimRows +
    '</div>' +
    '<p class="fbr-hint">Unlock your full report for personalized insights &amp; growth strategies.</p>' +
  '</div>';
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

      <div class="nr-overview">
        <p>Your overall resilience score is <strong>${results.overall}%</strong> — a ${level} across six key dimensions.</p>
      </div>

      <div class="nr-section nr-primary">
        <div class="nr-section-header">
          <span class="nr-label">Primary Strength</span>
          <span class="nr-score" style="background:${DIM_COLORS[primaryStrength] || '#667eea'}">${primary.percentage.toFixed(0)}%</span>
        </div>
        <h3 class="nr-dim-name">${escapeHtml(primaryStrength)}</h3>
        <p class="nr-description">${TYPE_DESCRIPTIONS[primaryStrength] || ''}</p>
        <p class="nr-insight">Leverage this strength as a foundation for growth across other dimensions.</p>
      </div>

      <div class="nr-section nr-solid">
        <div class="nr-section-header">
          <span class="nr-label">Solid Strength</span>
          <span class="nr-score" style="background:${DIM_COLORS[solidStrength] || '#059669'}">${solid.percentage.toFixed(0)}%</span>
        </div>
        <h3 class="nr-dim-name">${escapeHtml(solidStrength)}</h3>
        <p class="nr-description">${TYPE_DESCRIPTIONS[solidStrength] || ''}</p>
        <p class="nr-insight">This complements your primary strength and creates a robust resilience foundation.</p>
      </div>

      <div class="nr-section nr-emerging">
        <div class="nr-section-header">
          <span class="nr-label">Growth Opportunity</span>
          <span class="nr-score nr-score--growth" style="background:${DIM_COLORS[emergingStrength] || '#DC2626'}">${emerging.percentage.toFixed(0)}%</span>
        </div>
        <h3 class="nr-dim-name">${escapeHtml(emergingStrength)}</h3>
        <p class="nr-description">${TYPE_DESCRIPTIONS[emergingStrength] || ''}</p>
        <p class="nr-insight">Intentionally developing this area can significantly expand your overall resilience capacity.</p>
      </div>

      <div class="nr-suggestions">
        <h3 class="nr-suggestions-title">Growth Suggestions</h3>
        <ul class="nr-suggestions-list">
          <li>Build on your <strong>${escapeHtml(primaryStrength)}</strong> strength by helping others develop it</li>
          <li>Practice integrating <strong>${escapeHtml(solidStrength)}</strong> with <strong>${escapeHtml(emergingStrength)}</strong></li>
          <li>Start small with one daily habit that develops <strong>${escapeHtml(emergingStrength)}</strong></li>
          <li>Track your progress monthly to recognize growth patterns</li>
        </ul>
      </div>

    </div>
  `;
}

// ── Personalized plain-text report (for email / PDF body) ─
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
// ── Persist results for payment redirect ─────────────────────
function persistResults(data) {
  try {
    localStorage.setItem('resilience_results', JSON.stringify(data));
  } catch (err) {
    console.warn('⚠️ Could not persist results:', err);
  }
}

// ── Personalized next-steps per dimension ─────────────
const DIMENSION_NEXT_STEPS = {
  'Agentic-Generative': [
    { icon: '🎯', title: 'Set a Micro-Goal', desc: 'Identify one small, concrete action you can take this week toward a goal that matters to you.' },
    { icon: '📋', title: 'Action Planning', desc: 'Write down 3 steps you can take in the next 30 days to move forward on a challenge.' },
    { icon: '💪', title: 'Practice Agency', desc: 'Each morning, choose one thing you have control over and take action on it intentionally.' },
  ],
  'Relational-Connective': [
    { icon: '🤝', title: 'Reach Out', desc: 'Connect with one trusted person this week — share something real about how you\'re doing.' },
    { icon: '🌐', title: 'Strengthen Bonds', desc: 'Schedule a regular check-in with a colleague, friend, or family member to deepen connection.' },
    { icon: '💬', title: 'Vulnerable Conversation', desc: 'Practice asking for support in a low-stakes situation to build comfort with relying on others.' },
  ],
  'Spiritual-Reflective': [
    { icon: '🧘', title: 'Values Reflection', desc: 'Spend 5 minutes writing about what gives your life meaning and how a recent challenge relates to your values.' },
    { icon: '📖', title: 'Gratitude Practice', desc: 'Each evening, note 3 things you\'re grateful for — include at least one thing from a difficult moment.' },
    { icon: '🌅', title: 'Purpose Meditation', desc: 'Try a 10-minute guided meditation focused on purpose and what you want to contribute to the world.' },
  ],
  'Emotional-Adaptive': [
    { icon: '🌊', title: 'Emotion Naming', desc: 'When you notice a strong emotion, pause and name it specifically — this activates your prefrontal cortex and reduces intensity.' },
    { icon: '🌱', title: 'RAIN Practice', desc: 'Use the RAIN technique: Recognize, Allow, Investigate, Nurture. Apply it to one difficult emotion today.' },
    { icon: '📓', title: 'Emotional Journal', desc: 'Write for 5 minutes daily about your emotional experiences — what triggered them and what they may be communicating.' },
  ],
  'Somatic-Regulative': [
    { icon: '🌬️', title: 'Mindful Breathing', desc: 'Practice 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. Do this for 3 cycles when stressed.' },
    { icon: '🚶', title: 'Movement as Medicine', desc: 'Add a 15-minute intentional walk to your daily routine — notice how your body and mood shift.' },
    { icon: '😴', title: 'Sleep Hygiene', desc: 'Establish a consistent sleep-wake schedule this week. A regular rhythm boosts resilience significantly.' },
  ],
  'Cognitive-Narrative': [
    { icon: '✍️', title: 'Morning Pages', desc: 'Write 3 pages of stream-of-consciousness every morning to process your experiences and reframe challenges.' },
    { icon: '🔄', title: 'Reframing Exercise', desc: 'When facing a setback, ask: "What is one alternative way to interpret this?" Write down 3 possibilities.' },
    { icon: '📚', title: 'Story Integration', desc: 'Reflect on a past difficulty: What did you learn? How did it shape who you are? Write your "resilience story."' },
  ],
};

/**
 * Render personalized next-steps cards for the user's lowest-scoring dimensions.
 * @param {Object} scores - { dimensionName: { percentage } }
 * @returns {string} HTML string
 */
function renderPersonalizedNextSteps(scores) {
  const ranked = Object.entries(scores)
    .map(([dim, data]) => ({ dim, pct: typeof data === 'object' ? data.percentage : data }))
    .sort((a, b) => a.pct - b.pct);

  const focusDims = ranked.slice(0, 2);

  const cards = focusDims.map(({ dim, pct }) => {
    const steps = DIMENSION_NEXT_STEPS[dim] || [];
    const color = DIM_COLORS[dim] || '#667eea';
    const pctRounded = Math.round(pct);

    const stepHtml = steps.map(s => `
      <li class="next-step-item">
        <span class="next-step-icon" aria-hidden="true">${s.icon}</span>
        <div class="next-step-content">
          <strong class="next-step-title">${escapeHtml(s.title)}</strong>
          <p class="next-step-desc">${escapeHtml(s.desc)}</p>
        </div>
      </li>
    `).join('');

    return `
      <div class="next-steps-card" style="border-left: 4px solid ${escapeHtml(color)}">
        <div class="next-steps-card-header">
          <span class="next-steps-dim-name" style="color:${escapeHtml(color)}">${escapeHtml(dim)}</span>
          <span class="next-steps-dim-score">${pctRounded}% — Growth Focus</span>
        </div>
        <ul class="next-steps-list" aria-label="Next steps for ${escapeHtml(dim)}">
          ${stepHtml}
        </ul>
      </div>
    `;
  }).join('');

  return `
    <section class="personalized-next-steps card" aria-labelledby="nextStepsHeading">
      <h2 id="nextStepsHeading">🗺️ Your Personalized Next Steps</h2>
      <p class="next-steps-intro">
        Based on your lowest-scoring dimensions, here are actionable practices to build your resilience:
      </p>
      ${cards}
    </section>
  `;
}

// ── Confetti celebration ───────────────────────────────
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;

  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 120 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height - canvas.height,
    r:     4 + Math.random() * 6,
    d:     2 + Math.random() * 3,
    color: ['#4F46E5','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#f59e0b','#10b981'][Math.floor(Math.random() * 8)],
    tilt:  Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: 0.05 + Math.random() * 0.05,
  }));

  let angle = 0;
  let frame;
  const duration = 3000;
  const start = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += p.d;
      p.x += Math.sin(angle) * 0.6;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * 0.5, p.tilt * 0.1, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (Date.now() - start < duration) {
      frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  draw();
}

// ── Reminder opt-in handler ────────────────────────────
function initReminderOptIn(email, firstName, overallScore) {
  const optInSection = document.getElementById('reminderOptInSection');
  if (!optInSection) return;
  optInSection.hidden = false;

  const checkbox = document.getElementById('reminderOptInCheckbox');
  const btn      = document.getElementById('btnReminderOptIn');
  const status   = document.getElementById('reminderOptInStatus');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (checkbox && !checkbox.checked) {
      if (status) status.textContent = 'Please check the box to opt in.';
      return;
    }

    btn.disabled = true;
    if (status) status.textContent = 'Saving your preference…';

    try {
      const res = await fetch('/api/quiz/reminder-optin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, firstName, lastScore: overallScore }),
      });
      const data = await res.json();
      if (res.ok) {
        if (status) {
          status.textContent = '✅ Done! We\'ll remind you in 30 days.';
          status.className = 'reminder-optin-status success';
        }
        if (btn) btn.hidden = true;
      } else {
        if (status) status.textContent = data.error || 'Could not save preference.';
        btn.disabled = false;
      }
    } catch (e) {
      if (status) status.textContent = 'Network error. Please try again.';
      btn.disabled = false;
    }
  });
}

// ── Hide/show insight-progress teaser based on payment tier ──
// The .insight-progress section contains "Upgrade to unlock your complete
// resilience atlas" which is misleading for paid users.
function _applyInsightProgressVisibility() {
  const el = document.querySelector('.insight-progress');
  if (!el) return;
  // Hide the teaser for anyone who has paid — either via current tier in
  // localStorage or via a prior purchase confirmed by the backend.
  const isPaid = (window.PaymentGating && window.PaymentGating.isAnyPaidTier()) ||
                 Boolean(window._hasPriorPdfAccess);
  el.hidden = isPaid;
}

// ── Prior-purchase section renderer ─────────────────────────
// Renders a compact card listing the user's prior purchases.
// Each row with stored assessmentData gets its own "Download PDF" button
// so the user can regenerate the exact report for that specific attempt.
function renderPriorReportsSection(purchases) {
  var TIER_LABELS = {
    'atlas-starter':   'Atlas Starter',
    'atlas-navigator': 'Atlas Navigator',
    'atlas-premium':   'Atlas Premium (Lifetime)',
    'starter':         'Atlas Team Starter',
    'pro':             'Atlas Team Pro',
    'enterprise':      'Atlas Team Enterprise',
  };
  var rowsHtml = purchases.map(function (p, idx) {
    var tierLabel = TIER_LABELS[p.tier] || p.tier;
    var date = p.purchasedAt ? new Date(p.purchasedAt).toLocaleDateString() : 'N/A';
    var hasData = p.assessmentData &&
                  p.assessmentData.overall !== undefined &&
                  p.assessmentData.dominantType &&
                  p.assessmentData.scores;
    var downloadBtn = hasData
      ? '<button type="button" class="btn btn-primary btn-sm prior-report-dl-btn" ' +
          'data-idx="' + idx + '" ' +
          'aria-label="Download PDF for ' + escapeHtml(tierLabel) + ' purchased ' + escapeHtml(date) + '">' +
          '<span aria-hidden="true">&#8681;</span> Download PDF' +
        '</button>'
      : '';
    return '<div class="prior-report-row">' +
      '<div class="prior-report-info">' +
        '<span class="prior-report-tier">' + escapeHtml(tierLabel) + '</span>' +
        '<span class="prior-report-date">Purchased ' + escapeHtml(date) + '</span>' +
      '</div>' +
      (downloadBtn ? '<div class="prior-report-actions">' + downloadBtn + '</div>' : '') +
      '</div>';
  }).join('');

  return '<section class="prior-reports-section" aria-labelledby="priorReportsHeading">' +
    '<h3 id="priorReportsHeading">&#128190; Prior Report Purchases</h3>' +
    '<p class="prior-reports-desc">Each purchased report is always available for download. ' +
      'Use the <strong>Download PDF</strong> button next to a specific purchase to regenerate that exact report.</p>' +
    '<div class="prior-reports-list">' + rowsHtml + '</div>' +
    '</section>';
}

/**
 * Trigger PDF generation and download for a specific set of assessment data.
 * Used by the per-purchase Download PDF buttons in the prior reports section.
 * @param {{ overall: number, dominantType: string, scores: Object }} assessmentData
 * @param {string} email
 */
async function downloadPdfForAssessment(assessmentData, email) {
  var REPORT_MAX_POLL_ATTEMPTS = 60;
  var REPORT_POLL_INTERVAL_MS  = 2000;
  var scoresStr = JSON.stringify(assessmentData.scores);
  var params = {
    overall:      assessmentData.overall,
    dominantType: assessmentData.dominantType,
    scores:       scoresStr,
    email:        email,
  };
  if (window.PdfProgress) {
    return window.PdfProgress.start(params);
  }
  // Inline fallback: generate → poll → download
  var storedToken = getAuth0Token();
  var authHeaders = storedToken ? { 'Authorization': 'Bearer ' + storedToken } : {};
  var emailParam = email ? '&email=' + encodeURIComponent(email) : '';
  var genRes = await fetch(
    '/api/report/generate?overall=' + encodeURIComponent(params.overall) +
    '&dominantType=' + encodeURIComponent(params.dominantType) +
    '&scores=' + encodeURIComponent(scoresStr) +
    emailParam,
    { headers: authHeaders }
  );
  if (!genRes.ok) {
    var body = await genRes.json().catch(function () { return {}; });
    throw new Error(body.error || 'Failed to start report generation');
  }
  var genData = await genRes.json();
  var hash = genData.hash;
  for (var i = 0; i < REPORT_MAX_POLL_ATTEMPTS; i++) {
    await new Promise(function (r) { setTimeout(r, REPORT_POLL_INTERVAL_MS); });
    var statusRes = await fetch('/api/report/status?hash=' + encodeURIComponent(hash), { headers: authHeaders });
    var statusData = await statusRes.json();
    if (statusData.status === 'ready') {
      var dlRes = await fetch('/api/report/download?hash=' + encodeURIComponent(hash), { headers: authHeaders });
      if (!dlRes.ok) throw new Error('Failed to download report (' + dlRes.status + ')');
      var blob = await dlRes.blob();
      var dlUrl = URL.createObjectURL(blob);
      var dlLink = document.createElement('a');
      dlLink.href = dlUrl;
      dlLink.download = 'resilience-atlas-report.pdf';
      dlLink.style.display = 'none';
      document.body.appendChild(dlLink);
      dlLink.click();
      document.body.removeChild(dlLink);
      setTimeout(function () { URL.revokeObjectURL(dlUrl); }, 10000);
      return;
    }
    if (statusData.status === 'failed') throw new Error(statusData.error || 'Report generation failed');
  }
  throw new Error('Report generation timed out. Please try again.');
}

/**
 * Async: query /api/report/access to check whether this email has a prior
 * completed PDF purchase.  If it does, unlock the download button regardless
 * of the current localStorage tier (which may be stale or missing).
 * Also checks assessmentCount to grant free PDF access for the first assessment.
 * This ensures users always retain access to content they have paid for.
 */
async function checkPriorReportAccess(email) {
  if (!email) return;
  try {
    const url = new URL('/api/report/access', window.location.origin);
    url.searchParams.set('email', email);
    const res = await fetch(url.toString());
    if (!res.ok) return;
    const data = await res.json();

    // Grant free access for the first assessment (assessmentCount ≤ 1).
    if (typeof data.assessmentCount === 'number' && data.assessmentCount <= 1) {
      window._isFirstAssessment = true;
    }

    if (!data.hasAccess && !window._isFirstAssessment) return;

    // Flag that access has been verified so the download handler can
    // bypass the tier-gating check on the frontend.
    // Use hasActiveAccess (non-expired purchase) for the current download gate.
    // atlas-starter purchases expire after 30 days; atlas-navigator/premium are permanent.
    if (data.hasActiveAccess) {
      window._hasPriorPdfAccess = true;
    }

    // Unlock the download button if it was showing the locked state.
    const dlBtn = document.getElementById('btnDownload');
    if (dlBtn && dlBtn.classList.contains('btn-locked')) {
      dlBtn.classList.remove('btn-locked');
      dlBtn.removeAttribute('aria-label');
      dlBtn.innerHTML =
        '<span aria-hidden="true">&#8681;</span> ' +
        '<span class="btn-label">Download PDF</span>';
    }

    // Hide the "upgrade to unlock" upsell elements — user has access.
    const upgradeContainerEl = document.getElementById('upgradeCardsContainer');
    if (upgradeContainerEl) upgradeContainerEl.innerHTML = '';
    _applyInsightProgressVisibility();

    // Render the prior purchases card so the user knows their access history.
    const priorSection = document.getElementById('priorReportsSection');
    if (priorSection && data.purchases && data.purchases.length > 0) {
      priorSection.innerHTML = renderPriorReportsSection(data.purchases);
      priorSection.hidden = false;

      // Wire up per-purchase Download PDF buttons.
      const downloadEmail = email;
      priorSection.querySelectorAll('.prior-report-dl-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const idx = parseInt(btn.getAttribute('data-idx'), 10);
          const purchase = data.purchases[idx];
          if (!purchase || !purchase.assessmentData) return;
          btn.disabled = true;
          btn.innerHTML = '<span aria-hidden="true">&#8681;</span> Generating\u2026';
          downloadPdfForAssessment(purchase.assessmentData, downloadEmail)
            .then(function () {
              btn.disabled = false;
              btn.innerHTML = '<span aria-hidden="true">&#8681;</span> Download PDF';
            })
            .catch(function (err) {
              btn.disabled = false;
              btn.innerHTML = '<span aria-hidden="true">&#8681;</span> Download PDF';
              showAlert('pdfAlert', err.message || 'Download failed.', 'error', 'error');
            });
        });
      });
    }
  } catch (err) {
    // Non-fatal: fall back to tier-based gating if the check fails.
    console.warn('[results] Prior access check failed:', err.message);
  }
}

// ── Page initialisation ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Constants for inline generate → poll fallback.
  var REPORT_MAX_POLL_ATTEMPTS = 60;
  var REPORT_POLL_INTERVAL_MS  = 2000;

  // ── Guard: require results ────────────────────────────
  if (!results || !results.scores) {
    const params = new URLSearchParams(window.location.search);
    const isReturnFromPayment = params.get('upgrade') === 'success';
    if (isReturnFromPayment) {
      showAlert('pdfAlert',
        'Your payment was successful! Your assessment results could not be found in this browser — please re-take the assessment to generate your PDF report.',
        'error', 'warning');
    } else {
      showAlert('pdfAlert', 'No results found. Please complete the assessment!', 'error', 'warning');
    }
    ['primaryStrength', 'solidStrength', 'emergingStrength'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    const reportText = document.getElementById('reportText');
    if (reportText) reportText.textContent = 'No report available. Please finish the assessment.';
    return;
  }

  // ── Ensure results are persisted for payment redirect ────────
  persistResults(results);

  // ── Rank resilience types by percentage ─────────────
  const ranked = Object.entries(results.scores)
    .sort((a, b) => b[1].percentage - a[1].percentage);

  const primaryStrength  = ranked[0][0];
  const solidStrength    = ranked[1][0];
  const emergingStrength = ranked[ranked.length - 1][0];

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

  // ── Free brief report (compact snapshot) ─────────────
  const freeBriefEl = document.getElementById('freeBriefReport');
  if (freeBriefEl) {
    freeBriefEl.innerHTML = renderFreeBriefReport(results, primaryStrength, solidStrength, emergingStrength);
  }


  const profileBars = document.getElementById('profileBars');
  if (profileBars && typeof window.renderProfileBars === 'function') {
    const items = Object.entries(results.scores).map(([label, s]) => ({
      label,
      score: s.raw,
      maxScore: s.max,
    }));
    window.renderProfileBars(profileBars, items);
  }

  // ── Radar chart / Resilience Compass ─────────────────────
  const radarContainer = document.getElementById('radarChartContainer');
  if (radarContainer) {
    const compassCanvas = document.getElementById('radarChart');
    if (compassCanvas && typeof window.renderBrandCompass === 'function') {
      try {
        compassCanvas.style.width  = '100%';
        compassCanvas.style.height = '100%';
        window.renderBrandCompass(compassCanvas, results.scores);
      } catch (err) {
        console.warn('[BrandCompass] Canvas render failed:', err);
      }
    }
  }

  // ── Dominant Dimension section ────────────────────────────
  const dominantDimensionEl = document.getElementById('dominantDimensionName');
  if (dominantDimensionEl) {
    dominantDimensionEl.textContent = primaryStrength;
  }

  // ── Narrative report ──────────────────────────────────
  const reportText = document.getElementById('reportText');
  if (reportText) {
    reportText.innerHTML = generateNarrativeReport(results, primaryStrength, solidStrength, emergingStrength);
    reportText.removeAttribute('aria-busy');
  }

  // ── Evidence-Based Practices ──────────────────────────
  const practicesContainer = document.getElementById('evidencePracticesContainer');
  if (practicesContainer && window.EvidencePractices) {
    practicesContainer.innerHTML = window.EvidencePractices.renderPracticesSection(emergingStrength);
    window.EvidencePractices.initPracticeInteractions();
  }

  // ── Personalized Next Steps ───────────────────────────
  const nextStepsContainer = document.getElementById('personalizedNextStepsContainer');
  if (nextStepsContainer) {
    nextStepsContainer.innerHTML = renderPersonalizedNextSteps(results.scores);
  }

  // ── Confetti celebration (brief animation on results load) ────
  setTimeout(triggerConfetti, 600);

  // ── Reminder opt-in ───────────────────────────────────
  const userEmail  = results.email || localStorage.getItem('resilience_email') || '';
  const firstName  = results.firstName || results.name || localStorage.getItem('resilience_name') || '';
  initReminderOptIn(userEmail, firstName, results.overall);

  // ── Store email for payment gating ────────────────────
  const resultEmail = results.email || '';
  if (resultEmail && !localStorage.getItem('resilience_email')) {
    localStorage.setItem('resilience_email', resultEmail);
  }

  // ── Render upgrade cards for free users ───────────────
  const upgradeContainer = document.getElementById('upgradeCardsContainer');
  if (upgradeContainer && window.UpgradeCards) {
    const hasAnyPaidTier = window.PaymentGating && window.PaymentGating.isAnyPaidTier();
    if (!hasAnyPaidTier) {
      upgradeContainer.innerHTML = window.UpgradeCards.renderComparisonCards();
    }
  }

  // ── Re-apply gating after results render ──────────────
  if (window.PaymentGating) {
    window.PaymentGating.applyGating();
  }
  // Hide the "upgrade teaser" progress indicator for paid users — it says
  // "Upgrade to unlock your complete resilience atlas" which is misleading
  // for users who have already purchased.
  _applyInsightProgressVisibility();

  // ── Lock/style the PDF download button for free users ─
  // Show a visual "locked" state so users know purchase is required before clicking.
  const hasAnyPaidTierNow = window.PaymentGating && window.PaymentGating.isAnyPaidTier();
  const downloadBtnEl = document.getElementById('btnDownload');
  if (downloadBtnEl && !hasAnyPaidTierNow) {
    downloadBtnEl.classList.add('btn-locked');
    downloadBtnEl.setAttribute('aria-label', 'Unlock PDF download — requires Atlas Starter or Atlas Navigator');
    downloadBtnEl.innerHTML =
      '<span aria-hidden="true">&#128274;</span> ' +
      '<span class="btn-label">Unlock PDF Download</span>';
  }

  // ── Async: check backend purchase history for prior access ─────
  // A user who paid before may have a stale/cleared localStorage tier.
  // Query the backend with their email to see if a prior purchase exists;
  // if so, unlock the download button without requiring re-purchase.
  const checkEmail = (results.email || localStorage.getItem('resilience_email') || '').trim();
  if (checkEmail) {
    checkPriorReportAccess(checkEmail);
  }

  // ── Fire assessmentComplete event for upsell-system.js ─
  // This triggers the post-assessment upsell modal for free users (with
  // a 24-hour cooldown so it does not annoy users who already dismissed it).
  // The brief delay lets the rest of the page finish rendering first.
  const UPSELL_MODAL_DELAY_MS = 800;
  if (!hasDeepReportNow) {
    setTimeout(function () {
      document.dispatchEvent(new CustomEvent('assessmentComplete'));
    }, UPSELL_MODAL_DELAY_MS);
  }

  // ── Notify other scripts that results are loaded ───────
  window.dominantDimension = primaryStrength;
  document.dispatchEvent(new CustomEvent('resultsLoaded', {
    detail: { dominantDimension: primaryStrength },
  }));

  // ── Listen for post-payment verification success ───────
  // payment-gating.js dispatches this event once the Stripe session is verified.
  // Re-apply gating and hide the upgrade cards so users can immediately use
  // the download/email buttons after being redirected back from Stripe.
  document.addEventListener('paymentVerified', function () {
    if (window.PaymentGating) {
      window.PaymentGating.applyGating();
    }
    // Hide the upgrade teaser — user has just paid.
    _applyInsightProgressVisibility();
    // Hide upgrade cards — user has paid.
    const upgradeContainerEl = document.getElementById('upgradeCardsContainer');
    if (upgradeContainerEl) upgradeContainerEl.innerHTML = '';
    // Clear any stale "requires purchase" alert so users see a clean state.
    const pdfAlertEl = document.getElementById('pdfAlert');
    if (pdfAlertEl && pdfAlertEl.classList.contains('alert-error')) {
      pdfAlertEl.innerHTML = '';
      pdfAlertEl.className = 'alert';
    }
    // Restore the PDF download button from its locked state.
    const dlBtn = document.getElementById('btnDownload');
    if (dlBtn) {
      dlBtn.classList.remove('btn-locked');
      dlBtn.removeAttribute('aria-label');
      dlBtn.innerHTML =
        '<span aria-hidden="true">&#8681;</span> ' +
        '<span class="btn-label">Download PDF</span>';
    }
    // Scroll to the download/email buttons so users can immediately access
    // the report they just paid for, without having to hunt for the buttons.
    const actionsEl = document.querySelector('.results-actions');
    if (actionsEl) {
      setTimeout(function () {
        actionsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  });

  // ── Download PDF button ────────────────────────────────
  const downloadButton = document.getElementById('btnDownload');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      try {
        // Allow download if the user has an active paid tier OR if a prior
        // purchase was confirmed by the backend (window._hasPriorPdfAccess),
        // OR if this is their first assessment (window._isFirstAssessment).
        if (window.PaymentGating && !window.PaymentGating.isAnyPaidTier() && !window._hasPriorPdfAccess && !window._isFirstAssessment) {
          // Direct free users to the upgrade/purchase flow instead of just an alert.
          // Scroll to upgrade cards and show a clear call-to-action.
          const upgradeEl = document.getElementById('upgradeCardsContainer');
          if (upgradeEl && upgradeEl.innerHTML) {
            upgradeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            // Upgrade cards not rendered yet — render them now.
            if (upgradeEl && window.UpgradeCards) {
              upgradeEl.innerHTML = window.UpgradeCards.renderComparisonCards();
              upgradeEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          showAlert('pdfAlert', 'PDF download requires an Atlas Starter or Atlas Navigator purchase. Choose a plan below to unlock.', 'error', 'lock');
          return;
        }
        const emailInputEl = document.getElementById('emailInput');
        const downloadEmail = (emailInputEl?.value || '').trim() || localStorage.getItem('resilience_email') || results.email || '';
        const scoresStr = JSON.stringify(results.scores);

        if (window.PdfProgress) {
          // Async flow: show progress modal and poll for completion.
          window.PdfProgress.start({
            overall: results.overall,
            dominantType: results.dominantType,
            scores: scoresStr,
            email: downloadEmail,
          }).catch((err) => {
            if (err && err.upgradeRequired) {
              showAlert('pdfAlert', 'PDF download requires an Atlas Navigator or Atlas Premium purchase. Please select an option below.', 'error', 'lock');
              const upgradeEl = document.getElementById('upgradeCardsContainer');
              upgradeEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (err && err.message !== 'cancelled') {
              showAlert('pdfAlert', err.message || 'Download failed!', 'error', 'error');
            }
          });
        } else {
          // Fallback: generate → poll → download (no PdfProgress module).
          (async () => {
            try {
              const emailParam = downloadEmail ? `&email=${encodeURIComponent(downloadEmail)}` : '';
              const genRes = await fetch(
                `/api/report/generate?overall=${encodeURIComponent(results.overall)}` +
                `&dominantType=${encodeURIComponent(results.dominantType)}` +
                `&scores=${encodeURIComponent(scoresStr)}${emailParam}`
              );
              if (!genRes.ok) {
                const body = await genRes.json().catch(() => ({}));
                throw new Error(body.error || 'Failed to start report generation');
              }
              const { hash } = await genRes.json();
              for (let i = 0; i < REPORT_MAX_POLL_ATTEMPTS; i++) {
                await new Promise(r => setTimeout(r, REPORT_POLL_INTERVAL_MS));
                const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(hash)}`);
                const status = await statusRes.json();
                if (status.status === 'ready') {
                  window.location.href = `/api/report/download?hash=${encodeURIComponent(hash)}`;
                  return;
                }
                if (status.status === 'failed') throw new Error(status.error || 'Report generation failed');
              }
              throw new Error('Report generation timed out. Please try again.');
            } catch (e) {
              showAlert('pdfAlert', e.message || 'Download failed!', 'error', 'error');
            }
          })();
        }
      } catch (e) {
        showAlert('pdfAlert', e.message || 'Download failed!', 'error', 'error');
      }
    });
  }

  // ── Retake quiz button ─────────────────────────────────
  // Only Atlas Premium ($49.99 Lifetime/Unlimited) and higher tiers allow
  // free retakes.  All other tiers see an upgrade call-to-action instead.
  const retakeButton = document.getElementById('btnRetake');
  const retakeLocked = document.getElementById('retakeLockedMsg');
  if (retakeButton) {
    const canRetake = window.PaymentGating && window.PaymentGating.isAtlasPremium();
    if (canRetake) {
      retakeButton.addEventListener('click', () => {
        localStorage.removeItem('resilience_results');
        // Clear the stored tier so payment gating runs fresh on the next
        // results page visit, ensuring the new assessment is properly gated.
        localStorage.removeItem('resilience_tier');
        window.location.href = '/quiz';
      });
    } else {
      // Hide the plain retake button and show the upgrade prompt instead
      retakeButton.hidden = true;
      if (retakeLocked) retakeLocked.hidden = false;
    }
  }

  // ── Email report button ────────────────────────────────
  const emailButton = document.getElementById('btnEmail');
  if (emailButton) {
    emailButton.addEventListener('click', async () => {
      const emailInput = document.getElementById('emailInput');
      const inputEmail = emailInput?.value.trim();
      const validateEmail = (typeof window !== 'undefined' && typeof window.isValidEmail === 'function')
        ? window.isValidEmail
        : function(value) { return Boolean(value); };
      const isValid = validateEmail(inputEmail || '');
      if (!inputEmail || !isValid) {
        showAlert('emailAlert', 'Please enter a valid email address.', 'error', 'email');
        if (emailInput) emailInput.focus();
        return;
      }
      // Gate: a paid report purchase is required to email the PDF.
      // Allow if the user has an active tier, a prior purchase confirmed by the backend,
      // or this is their first assessment (free PDF).
      if (window.PaymentGating && !window.PaymentGating.isAnyPaidTier() && !window._hasPriorPdfAccess && !window._isFirstAssessment) {
        showAlert('emailAlert', 'Sending your PDF report requires an Atlas Starter or Atlas Navigator purchase.', 'error', 'lock');
        const upgradeEl = document.getElementById('upgradeCardsContainer');
        upgradeEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      showAlert('emailAlert', 'Generating your report…', 'success', 'report');
      try {
        const storedResults = localStorage.getItem('resilience_results');
        const emailResults = storedResults ? JSON.parse(storedResults) : null;
        if (!emailResults) throw new Error('No results to send. Please finish the assessment first.');

        const scoresStr = JSON.stringify(emailResults.scores);
        const params = {
          overall:      emailResults.overall,
          dominantType: emailResults.dominantType,
          scores:       scoresStr,
          email:        inputEmail,
        };

        let hash;
        // Attach the Auth0 bearer token when available.
        const storedToken = getAuth0Token();
        const authHeaders = storedToken ? { 'Authorization': 'Bearer ' + storedToken } : {};

        if (window.PdfProgress) {
          // Use the progress modal: generates, polls, and downloads automatically.
          hash = await window.PdfProgress.start(params);
        } else {
          // Inline fallback: generate → poll.
          const genRes = await fetch(
            `/api/report/generate?overall=${encodeURIComponent(params.overall)}` +
            `&dominantType=${encodeURIComponent(params.dominantType)}` +
            `&scores=${encodeURIComponent(params.scores)}` +
            `&email=${encodeURIComponent(params.email)}`,
            { headers: authHeaders }
          );
          if (!genRes.ok) {
            const body = await genRes.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to start report generation');
          }
          const genData = await genRes.json();
          hash = genData.hash;

          for (let i = 0; i < REPORT_MAX_POLL_ATTEMPTS; i++) {
            await new Promise(r => setTimeout(r, REPORT_POLL_INTERVAL_MS));
            const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(hash)}`, { headers: authHeaders });
            const statusData = await statusRes.json();
            if (statusData.status === 'ready') break;
            if (statusData.status === 'failed') throw new Error(statusData.error || 'Report generation failed');
            if (i === REPORT_MAX_POLL_ATTEMPTS - 1) throw new Error('Report generation timed out. Please try again.');
          }
        }

        // Send the PDF to the provided email address via the backend.
        showAlert('emailAlert', 'Sending report to ' + inputEmail + '…', 'success', 'email');
        const emailRes = await fetch('/api/report/email', {
          method:  'POST',
          headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders),
          body:    JSON.stringify({ hash, email: inputEmail }),
        });
        if (!emailRes.ok) {
          const body = await emailRes.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to send email');
        }
        showAlert('emailAlert', 'Report sent to ' + inputEmail + '!', 'success', 'email');
      } catch (e) {
        if (e && e.upgradeRequired) {
          showAlert('emailAlert', 'Sending your full PDF report requires a Deep Report or Atlas Premium purchase.', 'error', 'lock');
          const upgradeEl = document.getElementById('upgradeCardsContainer');
          upgradeEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (e && e.message !== 'cancelled') {
          showAlert('emailAlert', e.message || 'Failed to send report.', 'error', 'error');
        }
      }
    });
  }
});
