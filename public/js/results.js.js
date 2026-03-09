// --- Personalized Report Generator ---
function generatePersonalizedReport(results) {
  let text = `Dear ${results.name || results.firstName || 'Friend'},\n\n`;
  text += `Thank you for completing the Resilience Assessment. Your top profile is: ${results.profileName}.\n\n`;
  text += `Your resilience strengths, in order, are:\n`;
  (results.rankedTypes || []).forEach((type, i) => {
    const score = results.scores[type];
    if (!score) return;
    text += `  ${i+1}. ${type}: ${score.raw} / ${score.max} (${score.percentage}%)\n`;
  });
  text += '\nDetailed Results:\n';
  Object.keys(results.scores || {}).forEach(type => {
    const score = results.scores[type];
    text += `- ${type}: ${score.raw} out of ${score.max} (${score.percentage}%)\n`;
  });
  text += '\n' + (results.summary || 'Keep building your resilience journey!\n');
  return text;
}

// --- Utility: Show Feedback Alert ---
function showAlert(elID, message, type = "success", emoji = "") {
  const el = document.getElementById(elID);
  if (!el) return;
  el.textContent = (emoji ? emoji + " " : "") + message;
  el.classList.remove("alert-success", "alert-error");
  el.classList.add(type === "success" ? "alert-success" : "alert-error");
}

// --- Strength Cards and Summary Population ---
document.addEventListener('DOMContentLoaded', () => {
  const results = JSON.parse(localStorage.getItem('resilience_results'));
  if (!results || !Array.isArray(results.rankedTypes) || !results.scores) {
    showAlert("pdfAlert", "No results found. Please complete the assessment!", "error", "⚠️");
    document.getElementById('primaryStrength').textContent = '—';
    document.getElementById('solidStrength').textContent = '—';
    document.getElementById('emergingStrength').textContent = '—';
    document.getElementById('reportText').textContent = 'No report available. Please finish the assessment.';
    return;
  }
  // Extract types
  const [primaryType, solidType] = results.rankedTypes;
  const emergingType = results.rankedTypes[results.rankedTypes.length - 1];
  // Extract scores
  const primaryScore = results.scores[primaryType]?.percentage ?? '—';
  const solidScore = results.scores[solidType]?.percentage ?? '—';
  const emergingScore = results.scores[emergingType]?.percentage ?? '—';

  // Update strengths cards
  document.getElementById('primaryStrength').textContent = `${primaryType || "—"} (${primaryScore}%)`;
  document.getElementById('solidStrength').textContent = `${solidType || "—"} (${solidScore}%)`;
  document.getElementById('emergingStrength').textContent = `${emergingType || "—"} (${emergingScore}%)`;

  // Update the main narrative/personalized report section
  document.getElementById('reportText').textContent = results.reportText || "No personalized story generated.";

  // Optionally update greeting with user name if stored
  if (results.name) {
    document.getElementById('greeting').textContent = `Your Resilience Profile, ${results.name}`;
  }
});

// --- Download PDF Button ---
document.getElementById('btnDownload')?.addEventListener('click', async () => {
  showAlert("pdfAlert", "Preparing your PDF report...", "success", "📝");
  try {
    const results = JSON.parse(localStorage.getItem('resilience_results'));
    if (!results) throw new Error("No results to download. Please finish the assessment first.");

    // 🟢 Always update the personalized report just before fetch
    results.reportText = generatePersonalizedReport(results);
    localStorage.setItem('resilience_results', JSON.stringify(results)); // Optional: keep it fresh in storage

    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    });

    if (!res.ok) throw new Error("PDF generation failed (status: " + res.status + ")");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resilience-report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    showAlert("pdfAlert", "PDF downloaded! Check your Downloads. 🎉", "success", "✅");
  } catch (e) {
    showAlert("pdfAlert", e.message || "Download failed!", "error", "❌");
  }
});

// --- Retake Quiz Button ---
document.getElementById('btnRetake')?.addEventListener('click', () => {
  localStorage.removeItem('resilience_results');
  window.location.href = "quiz.html";
});

// --- Email Report Button ---
document.getElementById('btnEmail')?.addEventListener('click', async () => {
  const emailInput = document.getElementById('emailInput');
  const email = emailInput.value.trim();
  if (!email) {
    showAlert("emailAlert", "Please enter your email address.", "error", "📧");
    emailInput.focus();
    return;
  }
  showAlert("emailAlert", "Sending your report to " + email + "...", "success", "✉️");
  try {
    const results = JSON.parse(localStorage.getItem('resilience_results'));
    if (!results) throw new Error("No results to send. Please finish the assessment first.");
    
    // 🟢 Always update the personalized report just before fetch
    results.reportText = generatePersonalizedReport(results);
    localStorage.setItem('resilience_results', JSON.stringify(results)); // Optional

    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...results, email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || ("Sending failed (status: " + res.status + ")"));
    showAlert("emailAlert", "Report sent to " + email + "! 🎉", "success", "✅");
  } catch (e) {
    showAlert("emailAlert", e.message || "Failed to send email.", "error", "❌");
  }
});
