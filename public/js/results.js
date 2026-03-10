/* =====================================================
   results.js — Psychometric assessment report display
   ===================================================== */

'use strict';

// ── Type interpretations ───────────────────────────────
var TYPE_INTERPRETATIONS = {
  'Cognitive-Narrative':   'your ability to think through challenges and construct meaningful narratives from your experiences',
  'Relational':            'your capacity to build and maintain meaningful connections with others',
  'Agentic-Generative':    'your power to adapt, create change, and generate new possibilities',
  'Emotional-Adaptive':    'your capacity to recognize, regulate, and adapt to emotional experiences',
  'Spiritual-Existential': 'your sense of meaning, purpose, and connection to something larger than yourself',
  'Somatic-Behavioral':    'your body awareness, physical well-being, and behavioral consistency',
};

// ── Recommendations per type ───────────────────────────
var TYPE_RECOMMENDATIONS = {
  'Cognitive-Narrative':   [
    'Keep a reflective journal to develop and refine your personal narratives.',
    'Practice cognitive reframing techniques to challenge limiting beliefs.',
    'Read broadly and engage in storytelling to expand your narrative repertoire.',
  ],
  'Relational':            [
    'Schedule regular quality time with your support network.',
    'Practice active listening and vulnerability to deepen connections.',
    'Join a community group aligned with your interests or values.',
  ],
  'Agentic-Generative':    [
    'Set one meaningful goal each week and track your progress.',
    'Experiment with creative problem-solving strategies when facing obstacles.',
    'Celebrate small wins to reinforce your sense of personal agency.',
  ],
  'Emotional-Adaptive':    [
    'Practice mindfulness or breathing exercises to regulate emotional responses.',
    'Name your emotions daily using an emotions wheel or journal.',
    'Seek out a therapist or counselor to deepen emotional awareness.',
  ],
  'Spiritual-Existential': [
    'Explore values clarification exercises to anchor your sense of purpose.',
    'Spend time in nature, meditation, or practices that connect you to something larger.',
    'Engage with philosophy, spirituality, or community service aligned with your beliefs.',
  ],
  'Somatic-Behavioral':    [
    'Build a consistent movement routine — even short daily walks make a difference.',
    'Prioritize sleep hygiene and rest as foundations of resilience.',
    'Tune in to bodily sensations through yoga, breathwork, or body-scan meditation.',
  ],
};

// ── Utility: show alert ────────────────────────────────
function showAlert(elId, message, type, emoji) {
  type  = type  || 'success';
  emoji = emoji || '';
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = (emoji ? emoji + ' ' : '') + message;
  el.classList.remove('alert-success', 'alert-error');
  el.classList.add(type === 'success' ? 'alert-success' : 'alert-error');
}

// ── Generate narrative report HTML ────────────────────
function generateNarrativeReport(results, primary, solid, emerging) {
  var overall     = results.overall;
  var primaryPct  = results.scores[primary].percentage;
  var solidPct    = results.scores[solid].percentage;
  var emergingPct = results.scores[emerging].percentage;
  var firstName   = (typeof Store !== 'undefined') ? Store.get('resilience_name') : null;
  var greeting    = firstName ? firstName + ', your' : 'Your';
  var level       = overall >= 80 ? 'strong' : overall >= 60 ? 'solid' : 'developing';

  var safe = (typeof escapeHtml === 'function') ? escapeHtml : function(s) { return s; };

  return `<p>${greeting} overall resilience score is <strong>${overall}%</strong>, indicating a <strong>${level}</strong> foundation of resilience.</p>` +
    `<p>Your dominant resilience strength is <strong>${safe(primary)}</strong> (${primaryPct.toFixed(1)}%). ` +
    `This reflects ${TYPE_INTERPRETATIONS[primary] || 'a core area of personal strength'}.</p>` +
    `<p>You also demonstrate solid capacity in <strong>${safe(solid)}</strong> (${solidPct.toFixed(1)}%), ` +
    `which complements and reinforces your primary strength, creating a robust resilience foundation.</p>` +
    `<p>Your greatest opportunity for growth lies in <strong>${safe(emerging)}</strong> (${emergingPct.toFixed(1)}%). ` +
    `Strengthening ${TYPE_INTERPRETATIONS[emerging] || 'this dimension'} can further expand your resilience profile ` +
    `and provide additional resources during challenging times.</p>`;
}

// ── Generate recommendations HTML ─────────────────────
function generateRecommendations(results, ranked) {
  var growthType  = ranked[ranked.length - 1][0];
  var primaryType = ranked[0][0];
  var safe = (typeof escapeHtml === 'function') ? escapeHtml : function(s) { return s; };
  var html = [];

  html.push('<div class="recommendation-group growth-area">');
  html.push('<h3 class="rec-heading">&#127331; Grow Your <em>' + safe(growthType) + '</em> Resilience</h3>');
  html.push('<ul class="rec-list">');
  (TYPE_RECOMMENDATIONS[growthType] || []).forEach(function(tip) {
    html.push('<li>' + safe(tip) + '</li>');
  });
  html.push('</ul></div>');

  html.push('<div class="recommendation-group primary-area">');
  html.push('<h3 class="rec-heading">&#11088; Leverage Your <em>' + safe(primaryType) + '</em> Strength</h3>');
  html.push('<ul class="rec-list">');
  (TYPE_RECOMMENDATIONS[primaryType] || []).forEach(function(tip) {
    html.push('<li>' + safe(tip) + '</li>');
  });
  html.push('</ul></div>');

  return html.join('');
}

// ── Build plain-text report for PDF/email ─────────────
function generatePersonalizedReport(results) {
  var firstName = (results && (results.firstName || results.name)) ||
    ((typeof Store !== 'undefined') ? Store.get('resilience_name') : null) || 'Friend';

  if (!results || !results.scores) return 'No results available.';

  var ranked = Object.entries(results.scores)
    .sort(function(a, b) { return b[1].percentage - a[1].percentage; });

  var primary  = ranked[0][0];
  var solid    = ranked[1][0];
  var emerging = ranked[ranked.length - 1][0];

  return [
    'Dear ' + firstName + ',',
    '',
    'Overall Resilience Score: ' + results.overall + '%',
    '',
    'Primary Strength: ' + primary + ' (' + results.scores[primary].percentage.toFixed(1) + '%)',
    'Solid Strength:   ' + solid   + ' (' + results.scores[solid].percentage.toFixed(1)   + '%)',
    'Growth Area:      ' + emerging + ' (' + results.scores[emerging].percentage.toFixed(1) + '%)',
    '',
    'Full Breakdown:',
    ranked.map(function(entry) {
      return '  ' + entry[0] + ': ' + entry[1].raw + '/' + entry[1].max + ' (' + entry[1].percentage.toFixed(1) + '%)';
    }).join('\n'),
  ].join('\n');
}

// ── Main init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  var results   = (typeof Store !== 'undefined') ? Store.get('resilience_results') : null;
  var firstName = (typeof Store !== 'undefined') ? Store.get('resilience_name')    : null;

  // ── No results fallback ────────────────────────────
  if (!results || !results.scores || !Object.keys(results.scores).length) {
    showAlert('pdfAlert', 'No results found. Please complete the assessment first!', 'error', '⚠️');
    ['primaryStrength', 'solidStrength', 'emergingStrength'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    var reportEl = document.getElementById('reportText');
    if (reportEl) reportEl.textContent = 'No report available. Please finish the assessment.';
    return;
  }

  // ── Report header ──────────────────────────────────
  var dateEl = document.getElementById('reportDate');
  if (dateEl) {
    dateEl.textContent = 'Generated: ' + new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
  var nameEl = document.getElementById('respondentName');
  if (nameEl && firstName) {
    nameEl.textContent = 'Respondent: ' + firstName;
  }

  // ── Overall score circle ───────────────────────────
  var scoreCircle = document.getElementById('scoreCircle');
  if (scoreCircle) scoreCircle.textContent = results.overall + '/100';

  var interpEl = document.getElementById('scoreInterpretation');
  if (interpEl) {
    var overall = results.overall;
    interpEl.textContent = overall >= 80
      ? 'Strong resilience foundation'
      : overall >= 60
      ? 'Solid resilience capacity'
      : 'Developing resilience — room for meaningful growth';
  }

  // ── Rank resilience types ──────────────────────────
  var ranked = Object.entries(results.scores)
    .sort(function(a, b) { return b[1].percentage - a[1].percentage; });

  var primaryType  = ranked[0][0];
  var solidType    = ranked[1][0];
  var emergingType = ranked[ranked.length - 1][0];

  // ── Strength ranking cards ─────────────────────────
  var elPrimary  = document.getElementById('primaryStrength');
  var elSolid    = document.getElementById('solidStrength');
  var elEmerging = document.getElementById('emergingStrength');
  if (elPrimary)  elPrimary.textContent  = primaryType;
  if (elSolid)    elSolid.textContent    = solidType;
  if (elEmerging) elEmerging.textContent = emergingType;

  var elPrimaryScore  = document.getElementById('primaryStrengthScore');
  var elSolidScore    = document.getElementById('solidStrengthScore');
  var elEmergingScore = document.getElementById('emergingStrengthScore');
  if (elPrimaryScore)  elPrimaryScore.textContent  = results.scores[primaryType].percentage.toFixed(1) + '%';
  if (elSolidScore)    elSolidScore.textContent    = results.scores[solidType].percentage.toFixed(1)   + '%';
  if (elEmergingScore) elEmergingScore.textContent = results.scores[emergingType].percentage.toFixed(1) + '%';

  // ── Radar chart ────────────────────────────────────
  var radarContainer = document.getElementById('radarChart');
  if (radarContainer && typeof renderRadarChart === 'function') {
    var radarData = {};
    Object.entries(results.scores).forEach(function(entry) {
      radarData[entry[0]] = entry[1].percentage;
    });
    renderRadarChart(radarContainer, radarData);
  }

  // ── Profile bars (detailed scores) ────────────────
  var barsContainer = document.getElementById('profileBars');
  if (barsContainer && typeof renderProfileBars === 'function') {
    var barItems = ranked.map(function(entry) {
      return { label: entry[0], score: entry[1].raw, maxScore: entry[1].max };
    });
    renderProfileBars(barsContainer, barItems);
  }

  // ── Narrative report ──────────────────────────────
  var reportEl = document.getElementById('reportText');
  if (reportEl) {
    reportEl.innerHTML = generateNarrativeReport(results, primaryType, solidType, emergingType);
  }

  // ── Recommendations ───────────────────────────────
  var recEl = document.getElementById('recommendations');
  if (recEl) {
    recEl.innerHTML = generateRecommendations(results, ranked);
  }
});

// ── Download PDF ───────────────────────────────────────
document.getElementById('btnDownload') && document.getElementById('btnDownload').addEventListener('click', function() {
  showAlert('pdfAlert', 'Preparing your PDF report…', 'success', '📝');
  var results = (typeof Store !== 'undefined') ? Store.get('resilience_results') : null;
  if (!results) {
    showAlert('pdfAlert', 'No results to download. Please finish the assessment first.', 'error', '❌');
    return;
  }
  results.reportText = generatePersonalizedReport(results);
  fetch('/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results),
  }).then(function(res) {
    if (!res.ok) throw new Error('PDF generation failed (status: ' + res.status + ')');
    return res.blob();
  }).then(function(blob) {
    var url = window.URL.createObjectURL(blob);
    var a   = document.createElement('a');
    a.href     = url;
    a.download = 'resilience-report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showAlert('pdfAlert', 'PDF downloaded! Check your Downloads. 🎉', 'success', '✅');
  }).catch(function(e) {
    showAlert('pdfAlert', e.message || 'Download failed!', 'error', '❌');
  });
});

// ── Retake Quiz ────────────────────────────────────────
document.getElementById('btnRetake') && document.getElementById('btnRetake').addEventListener('click', function() {
  if (typeof Store !== 'undefined') Store.remove('resilience_results');
  window.location.href = 'quiz.html';
});

// ── Email Report ───────────────────────────────────────
document.getElementById('btnEmail') && document.getElementById('btnEmail').addEventListener('click', function() {
  var emailInput = document.getElementById('emailInput');
  var email      = emailInput ? emailInput.value.trim() : '';
  if (!email) {
    showAlert('emailAlert', 'Please enter your email address.', 'error', '📧');
    if (emailInput) emailInput.focus();
    return;
  }
  showAlert('emailAlert', 'Sending your report to ' + email + '…', 'success', '✉️');
  var results = (typeof Store !== 'undefined') ? Store.get('resilience_results') : null;
  if (!results) {
    showAlert('emailAlert', 'No results to send. Please finish the assessment first.', 'error', '❌');
    return;
  }
  results.reportText = generatePersonalizedReport(results);
  fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({}, results, { email: email })),
  }).then(function(res) {
    return res.json().then(function(data) { return { ok: res.ok, data: data }; });
  }).then(function(result) {
    if (!result.ok) throw new Error(result.data.error || 'Sending failed (status unknown)');
    showAlert('emailAlert', 'Report sent to ' + email + '! 🎉', 'success', '✅');
  }).catch(function(e) {
    showAlert('emailAlert', e.message || 'Failed to send email.', 'error', '❌');
  });
});
