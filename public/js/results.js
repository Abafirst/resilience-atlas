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

// ── Page initialisation ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Constants for inline generate → poll fallback.
  var REPORT_MAX_POLL_ATTEMPTS = 60;
  var REPORT_POLL_INTERVAL_MS  = 2000;

  // ── Guard: require results ────────────────────────────
  if (!results || !results.scores) {
    showAlert('pdfAlert', 'No results found. Please complete the assessment!', 'error', 'warning');
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

  // ── Store email for payment gating ────────────────────
  const resultEmail = results.email || '';
  if (resultEmail && !localStorage.getItem('resilience_email')) {
    localStorage.setItem('resilience_email', resultEmail);
  }

  // ── Render upgrade cards for free users ───────────────
  const upgradeContainer = document.getElementById('upgradeCardsContainer');
  if (upgradeContainer && window.UpgradeCards) {
    const hasDeepReport = window.PaymentGating && window.PaymentGating.isDeepReport();
    if (!hasDeepReport) {
      upgradeContainer.innerHTML = window.UpgradeCards.renderComparisonCards();
    }
  }

  // ── Re-apply gating after results render ──────────────
  if (window.PaymentGating) {
    window.PaymentGating.applyGating();
  }

  // ── Download PDF button ────────────────────────────────
  const downloadButton = document.getElementById('btnDownload');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      try {
        if (window.PaymentGating && !window.PaymentGating.isDeepReport()) {
          showAlert('pdfAlert', 'PDF download requires a Deep Report or Atlas Premium purchase.', 'error', 'lock');
          const upgradeEl = document.getElementById('upgradeCardsContainer');
          upgradeEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              showAlert('pdfAlert', 'PDF download requires a Deep Report or Atlas Premium purchase.', 'error', 'lock');
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
  const retakeButton = document.getElementById('btnRetake');
  if (retakeButton) {
    retakeButton.addEventListener('click', () => {
      localStorage.removeItem('resilience_results');
      window.location.href = 'quiz.html';
    });
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
        if (window.PdfProgress) {
          // Use the progress modal: generates, polls, and downloads automatically.
          hash = await window.PdfProgress.start(params);
        } else {
          // Inline fallback: generate → poll.
          const genRes = await fetch(
            `/api/report/generate?overall=${encodeURIComponent(params.overall)}` +
            `&dominantType=${encodeURIComponent(params.dominantType)}` +
            `&scores=${encodeURIComponent(params.scores)}` +
            `&email=${encodeURIComponent(params.email)}`
          );
          if (!genRes.ok) {
            const body = await genRes.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to start report generation');
          }
          const genData = await genRes.json();
          hash = genData.hash;

          for (let i = 0; i < REPORT_MAX_POLL_ATTEMPTS; i++) {
            await new Promise(r => setTimeout(r, REPORT_POLL_INTERVAL_MS));
            const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(hash)}`);
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
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ hash, email: inputEmail }),
        });
        if (!emailRes.ok) {
          const body = await emailRes.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to send email');
        }
        showAlert('emailAlert', 'Report sent to ' + inputEmail + '!', 'success', 'email');
      } catch (e) {
        if (e && e.message !== 'cancelled') {
          showAlert('emailAlert', e.message || 'Failed to send report.', 'error', 'error');
        }
      }
    });
  }
});
