/* =====================================================
   quiz.js — Quiz state management and submission
   ===================================================== */

'use strict';

// ── Autosave key ───────────────────────────────────────
const AUTOSAVE_KEY = 'ra_quiz_progress';

// ── Results / retake keys ──────────────────────────────
const RESULTS_KEY = 'resilience_results';
const TIER_KEY    = 'resilience_tier';

// ── Autosave helpers ───────────────────────────────────
function saveProgress() {
  try {
    const snapshot = {
      answers:       state.answers,
      questionOrder: state.questionOrder,
      currentStep:   state.currentStep,
      firstName:     state.firstName,
      email:         state.email,
      flaggedQuestions: Array.from(state.flaggedQuestions),
      savedAt:       Date.now(),
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    // localStorage may be unavailable — fail silently
  }
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Discard saves older than 7 days
    if (!saved.savedAt || Date.now() - saved.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return null;
    }
    return saved;
  } catch (e) {
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (e) {
    // ignore
  }
}

// Likert scale options
const LIKERT_OPTIONS = [
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Almost Always" }
];
// ── Question bank (72 questions, 12 per resilience type) ─
// Order matches backend RESILIENCE_CATEGORIES index groups:
//   Agentic-Generative [0–11], Relational [12–23], Spiritual-Existential [24–35],
//   Emotional-Adaptive [36–47], Somatic-Regulative [48–59], Cognitive-Narrative [60–71]
const QUESTIONS = [

  // Agentic-Generative (Q1-12)
  { id: 1,  category: 'Agentic-Generative', text: 'I take action to improve difficult situations.' },
  { id: 2,  category: 'Agentic-Generative', text: 'I pursue meaningful goals even during stress.' },
  { id: 3,  category: 'Agentic-Generative', text: 'I create opportunities even when things are hard.' },
  { id: 4,  category: 'Agentic-Generative', text: 'I stay motivated when facing adversity.' },
  { id: 5,  category: 'Agentic-Generative', text: 'I generate new possibilities in challenging times.' },
  { id: 6,  category: 'Agentic-Generative', text: 'I move forward with purpose after setbacks.' },
  { id: 7,  category: 'Agentic-Generative', text: 'I take initiative even when outcomes are uncertain.' },
  { id: 8,  category: 'Agentic-Generative', text: 'I can identify concrete steps to address challenges.' },
  { id: 9,  category: 'Agentic-Generative', text: 'I feel empowered to create positive change in my life.' },
  { id: 10, category: 'Agentic-Generative', text: 'I follow through on decisions even when they are difficult.' },
  { id: 11, category: 'Agentic-Generative', text: 'I view obstacles as opportunities to demonstrate my capability.' },
  { id: 12, category: 'Agentic-Generative', text: 'I take responsibility for my resilience journey.' },

  // Relational (Q13-24)
  { id: 13, category: 'Relational-Connective', text: 'I reach out to others when I need support.' },
  { id: 14, category: 'Relational-Connective', text: 'I maintain supportive relationships.' },
  { id: 15, category: 'Relational-Connective', text: 'I feel connected to my community.' },
  { id: 16, category: 'Relational-Connective', text: 'I contribute to the well-being of others.' },
  { id: 17, category: 'Relational-Connective', text: 'I communicate openly with people I trust.' },
  { id: 18, category: 'Relational-Connective', text: 'My relationships help me through challenges.' },
  { id: 19, category: 'Relational-Connective', text: 'I have people I can trust with my struggles.' },
  { id: 20, category: 'Relational-Connective', text: 'I ask for help without shame or hesitation.' },
  { id: 21, category: 'Relational-Connective', text: 'I repair and reconcile relationships after conflict or misunderstanding.' },
  { id: 22, category: 'Relational-Connective', text: 'I set healthy boundaries in relationships to protect my own well-being.' },
  { id: 23, category: 'Relational-Connective', text: 'I feel seen and understood by people close to me.' },
  { id: 24, category: 'Relational-Connective', text: 'I invest time in nurturing important relationships.' },

  // Spiritual-Existential (Q25-36)
  { id: 25, category: 'Spiritual-Reflective', text: 'I have a sense of purpose that guides me.' },
  { id: 26, category: 'Spiritual-Reflective', text: 'My values help orient me during difficult times.' },
  { id: 27, category: 'Spiritual-Reflective', text: 'I reflect on deeper meaning in life events.' },
  { id: 28, category: 'Spiritual-Reflective', text: 'I feel connected to something larger than myself.' },
  { id: 29, category: 'Spiritual-Reflective', text: 'My beliefs help me stay grounded.' },
  { id: 30, category: 'Spiritual-Reflective', text: 'Purpose gives me strength during adversity.' },
  { id: 31, category: 'Spiritual-Reflective', text: 'I understand what gives my life meaning and purpose.' },
  { id: 32, category: 'Spiritual-Reflective', text: 'I draw on contemplative or spiritual practices to restore inner calm.' },
  { id: 33, category: 'Spiritual-Reflective', text: 'I find gratitude and appreciation even in the midst of adversity.' },
  { id: 34, category: 'Spiritual-Reflective', text: 'Adversity deepens my sense of what matters most.' },
  { id: 35, category: 'Spiritual-Reflective', text: 'I find resilience through spiritual or philosophical practice.' },
  { id: 36, category: 'Spiritual-Reflective', text: 'A clear sense of meaning helps me endure hardship.' },

  // Emotional-Adaptive (Q37-48)
  { id: 37, category: 'Emotional-Adaptive', text: 'I can adapt emotionally to stressful situations.' },
  { id: 38, category: 'Emotional-Adaptive', text: 'I manage difficult emotions effectively.' },
  { id: 39, category: 'Emotional-Adaptive', text: 'I recover emotionally after setbacks.' },
  { id: 40, category: 'Emotional-Adaptive', text: 'I can tolerate emotional discomfort when needed.' },
  { id: 41, category: 'Emotional-Adaptive', text: 'I regulate my emotional reactions well.' },
  { id: 42, category: 'Emotional-Adaptive', text: 'My emotions help guide my decisions.' },
  { id: 43, category: 'Emotional-Adaptive', text: 'I can sit with uncomfortable emotions without being overwhelmed.' },
  { id: 44, category: 'Emotional-Adaptive', text: 'I understand the messages my emotions are sending.' },
  { id: 45, category: 'Emotional-Adaptive', text: 'I recognize when I need emotional support and actively seek it.' },
  { id: 46, category: 'Emotional-Adaptive', text: 'I can express difficult emotions in healthy ways.' },
  { id: 47, category: 'Emotional-Adaptive', text: 'My emotions provide valuable information about my needs.' },
  { id: 48, category: 'Emotional-Adaptive', text: 'I maintain emotional balance during stressful periods.' },

  // Somatic-Regulative (Q49-60)
  { id: 49, category: 'Somatic-Regulative', text: 'Physical movement helps me regulate stress.' },
  { id: 50, category: 'Somatic-Regulative', text: 'I notice how my body reacts to stress.' },
  { id: 51, category: 'Somatic-Regulative', text: 'Consistent daily habits provide a stable foundation for my well-being.' },
  { id: 52, category: 'Somatic-Regulative', text: 'Breathing or physical grounding helps me reset.' },
  { id: 53, category: 'Somatic-Regulative', text: 'Sleep and rest influence my resilience.' },
  { id: 54, category: 'Somatic-Regulative', text: 'Exercise or movement improves my mood.' },
  { id: 55, category: 'Somatic-Regulative', text: 'I prioritize rest and recovery as key components of my resilience.' },
  { id: 56, category: 'Somatic-Regulative', text: 'My body is a resource I actively care for.' },
  { id: 57, category: 'Somatic-Regulative', text: 'I use nutrition and hydration intentionally to support my energy and mood.' },
  { id: 58, category: 'Somatic-Regulative', text: 'I maintain consistency in sleep, movement, and nutrition.' },
  { id: 59, category: 'Somatic-Regulative', text: 'My physical well-being directly impacts my resilience.' },
  { id: 60, category: 'Somatic-Regulative', text: 'I use somatic techniques (breathing, stretching, etc.) intentionally.' },

  // Cognitive-Narrative (Q61-72)
  { id: 61, category: 'Cognitive-Narrative', text: 'I reflect on difficult experiences to learn from them.' },
  { id: 62, category: 'Cognitive-Narrative', text: 'I can reframe setbacks in a constructive way.' },
  { id: 63, category: 'Cognitive-Narrative', text: 'My personal story helps me understand challenges.' },
  { id: 64, category: 'Cognitive-Narrative', text: 'I find meaning in difficult experiences.' },
  { id: 65, category: 'Cognitive-Narrative', text: 'I actively interpret events in ways that support growth.' },
  { id: 66, category: 'Cognitive-Narrative', text: 'Reflection helps me move forward after adversity.' },
  { id: 67, category: 'Cognitive-Narrative', text: 'I actively construct meaningful narratives from my experiences.' },
  { id: 68, category: 'Cognitive-Narrative', text: 'I can identify growth and learning from past difficulties.' },
  { id: 69, category: 'Cognitive-Narrative', text: 'I use storytelling to make sense of challenges.' },
  { id: 70, category: 'Cognitive-Narrative', text: 'I challenge unhelpful thinking patterns.' },
  { id: 71, category: 'Cognitive-Narrative', text: 'I maintain perspective during adversity.' },
  { id: 72, category: 'Cognitive-Narrative', text: 'I integrate difficult experiences into my life narrative.' },
];

// ── Shuffle utility ────────────────────────────────────
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── State ──────────────────────────────────────────────
const state = {
  firstName: '',
  email: '',
  // answers[displayIdx] stores the user's response for the question shown at that position
  answers: new Array(QUESTIONS.length).fill(null),
  // questionOrder[displayIdx] = originalIdx in QUESTIONS (populated at init time)
  questionOrder: [],
  currentStep: 'info', // 'info' | 0..71 | 'submit'
  // Set of question IDs (1-based, as in QUESTIONS[i].id) the user flagged as confusing
  flaggedQuestions: new Set(),
};

// ── DOM refs ───────────────────────────────────────────
let infoStep, questionContainer, submitStep;
let progressFill, progressLabel;
let btnStart, btnPrev, btnNext, btnSubmit;
let nameInput, emailInput, nameError, emailError;
let submitAlert;

function init() {
  infoStep          = document.getElementById('infoStep');
  questionContainer = document.getElementById('questionContainer');
  submitStep        = document.getElementById('submitStep');
  progressFill      = document.getElementById('progressFill');
  progressLabel     = document.getElementById('progressLabel');
  btnStart          = document.getElementById('btnStart');
  btnPrev           = document.getElementById('btnPrev');
  btnNext           = document.getElementById('btnNext');
  btnSubmit         = document.getElementById('btnSubmit');
  nameInput         = document.getElementById('firstName');
  emailInput        = document.getElementById('email');
  nameError         = document.getElementById('nameError');
  emailError        = document.getElementById('emailError');
  submitAlert       = document.getElementById('submitAlert');

  // If the user has already completed the quiz (results exist in localStorage),
  // never show the "resume incomplete quiz" banner.  Only atlas-premium users
  // may retake freely; everyone else is sent back to their results page.
  const existingResults = (() => {
    try { return JSON.parse(localStorage.getItem(RESULTS_KEY)); } catch (e) { return null; }
  })();

  if (existingResults) {
    const tier = localStorage.getItem(TIER_KEY) || 'free';
    // NOTE: payment-gating.js is not loaded on quiz.html, so we replicate the
    // isAtlasPremium() check inline (mirrors PaymentGating.isAtlasPremium()).
    const hasUnlimitedRetakes =
      tier === 'atlas-premium' || tier === 'business' ||
      tier === 'starter'       || tier === 'pro'       || tier === 'enterprise';

    if (!hasUnlimitedRetakes) {
      // Not allowed to retake for free — send them back to their results
      clearProgress();
      window.location.href = 'results.html';
      return;
    }

    // atlas-premium (or higher): allow a fresh retake — discard any stale
    // partial progress so we never ask to "resume" a completed quiz.
    clearProgress();
    state.questionOrder = shuffleArray(QUESTIONS.map((_, i) => i));
    buildQuestionCards();
    attachNavListeners();
    showStep('info');
    return;
  }

  // No completed results — check for genuinely incomplete saved progress
  const saved = loadSavedProgress();
  if (saved && saved.answers && saved.questionOrder && saved.questionOrder.length === QUESTIONS.length) {
    showRestoreBanner(saved);
  } else {
    // Generate a shuffled display order for question randomization
    state.questionOrder = shuffleArray(QUESTIONS.map((_, i) => i));
    buildQuestionCards();
    attachNavListeners();
    showStep('info');
  }
}

// ── Restore banner ─────────────────────────────────────
function showRestoreBanner(saved) {
  const banner = document.getElementById('restoreBanner');
  if (!banner) {
    // If no banner in HTML, just initialize fresh
    startFresh();
    return;
  }

  banner.hidden = false;

  const answeredCount = saved.answers.filter(a => a !== null).length;
  const bannerMsg = banner.querySelector('#restoreBannerMsg');
  if (bannerMsg) {
    const name = saved.firstName ? `, ${saved.firstName}` : '';
    bannerMsg.textContent = `Welcome back${name}! You answered ${answeredCount} of ${QUESTIONS.length} questions. Would you like to continue where you left off?`;
  }

  const btnRestore = banner.querySelector('#btnRestoreProgress');
  const btnFresh   = banner.querySelector('#btnStartFresh');

  if (btnRestore) {
    btnRestore.addEventListener('click', () => {
      banner.hidden = true;
      restoreProgress(saved);
    });
  }

  if (btnFresh) {
    btnFresh.addEventListener('click', () => {
      banner.hidden = true;
      clearProgress();
      startFresh();
    });
  }
}

function startFresh() {
  state.questionOrder = shuffleArray(QUESTIONS.map((_, i) => i));
  buildQuestionCards();
  attachNavListeners();
  showStep('info');
}

function restoreProgress(saved) {
  state.answers       = saved.answers;
  state.questionOrder = saved.questionOrder;
  state.firstName     = saved.firstName || '';
  state.email         = saved.email     || '';
  state.flaggedQuestions = new Set(saved.flaggedQuestions || []);

  // Pre-fill the info form fields
  if (nameInput  && state.firstName) nameInput.value  = state.firstName;
  if (emailInput && state.email)     emailInput.value = state.email;

  buildQuestionCards();
  attachNavListeners();

  // Restore to the saved step
  const step = saved.currentStep;
  if (step === 'submit' || step === 'info' || typeof step === 'number') {
    showStep(step);
  } else {
    showStep('info');
  }
}

// ── Build question HTML ────────────────────────────────
function buildQuestionCards() {
  if (!questionContainer) return;
  questionContainer.innerHTML = '';

  state.questionOrder.forEach((origIdx, displayIdx) => {
    const q = QUESTIONS[origIdx];
    const card = document.createElement('div');
    card.className = 'question-step card';
    card.id = `question-${displayIdx}`;
    card.setAttribute('data-index', displayIdx);

    const isFlagged = state.flaggedQuestions.has(q.id);

    const likertHtml = LIKERT_OPTIONS.map(opt => `
      <button type="button"
              class="likert-btn"
              data-value="${opt.value}"
              data-question="${displayIdx}"
              aria-pressed="false"
              aria-label="${opt.label}">
        <span class="likert-dot" aria-hidden="true"></span>
        ${opt.label}
      </button>
    `).join('');

    card.innerHTML = `
      <p class="question-text">${q.text}</p>
      <div class="likert-scale" role="group" aria-label="Rate your agreement">
        ${likertHtml}
      </div>
      <div class="question-flag-row">
        <button type="button"
                class="btn-flag-question${isFlagged ? ' flagged' : ''}"
                data-qid="${q.id}"
                data-display="${displayIdx}"
                aria-pressed="${isFlagged}"
                aria-label="Flag this question as confusing"
                title="Flag as confusing">
          <span aria-hidden="true">&#9873;</span>
          <span class="flag-label">${isFlagged ? 'Flagged' : 'Flag as confusing'}</span>
        </button>
      </div>
    `;

    // Restore any previously selected answer
    if (state.answers[displayIdx] !== null) {
      const btn = card.querySelector(`[data-value="${state.answers[displayIdx]}"]`);
      if (btn) {
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
      }
    }

    questionContainer.appendChild(card);
  });

  // Delegated click handler for Likert buttons
  questionContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.likert-btn');
    if (!btn) return;
    const idx = parseInt(btn.dataset.question, 10);
    const val = parseInt(btn.dataset.value, 10);
    selectAnswer(idx, val);
  });

  // Delegated click handler for flag buttons
  questionContainer.addEventListener('click', (e) => {
    const flagBtn = e.target.closest('.btn-flag-question');
    if (!flagBtn) return;
    toggleFlag(flagBtn);
  });
}

function toggleFlag(flagBtn) {
  const qid = parseInt(flagBtn.dataset.qid, 10);
  const isFlagged = state.flaggedQuestions.has(qid);

  if (isFlagged) {
    state.flaggedQuestions.delete(qid);
    flagBtn.classList.remove('flagged');
    flagBtn.setAttribute('aria-pressed', 'false');
    const lbl = flagBtn.querySelector('.flag-label');
    if (lbl) lbl.textContent = 'Flag as confusing';
  } else {
    state.flaggedQuestions.add(qid);
    flagBtn.classList.add('flagged');
    flagBtn.setAttribute('aria-pressed', 'true');
    const lbl = flagBtn.querySelector('.flag-label');
    if (lbl) lbl.textContent = 'Flagged';
  }

  saveProgress();
}

function selectAnswer(questionIdx, value) {
  state.answers[questionIdx] = value;

  const card = document.getElementById(`question-${questionIdx}`);
  if (!card) return;
  card.querySelectorAll('.likert-btn').forEach(b => {
    const selected = parseInt(b.dataset.value, 10) === value;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });

  // Autosave after each answer
  saveProgress();
}

// ── Navigation ─────────────────────────────────────────
function showStep(step) {
  state.currentStep = step;

  // Autosave on every step change
  saveProgress();

  // Hide all
  if (infoStep) infoStep.classList.remove('active');
  document.querySelectorAll('.question-step').forEach(el => el.classList.remove('active'));
  if (submitStep) submitStep.classList.remove('active');

  if (step === 'info') {
    if (infoStep) infoStep.classList.add('active');
    if (btnPrev) btnPrev.style.visibility = 'hidden';
    if (btnNext) { btnNext.style.display = 'inline-flex'; btnNext.querySelector('.btn-label').textContent = 'Start Quiz'; }
    updateProgress(0, QUESTIONS.length);
    return;
  }

  if (step === 'submit') {
    if (submitStep) submitStep.classList.add('active');
    if (btnPrev) { btnPrev.style.visibility = 'visible'; btnPrev.style.display = 'inline-flex'; }
    if (btnNext) btnNext.style.display = 'none';
    updateProgress(QUESTIONS.length, QUESTIONS.length);
    return;
  }

  // Numeric question step
  const idx = step;
  const card = document.getElementById(`question-${idx}`);
  if (card) card.classList.add('active');

  if (btnPrev) {
    btnPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
    btnPrev.style.display = 'inline-flex';
  }
  if (btnNext) {
    btnNext.style.display = 'inline-flex';
    btnNext.querySelector('.btn-label').textContent = idx === QUESTIONS.length - 1 ? 'Review & Submit' : 'Next';
  }

  updateProgress(idx + 1, QUESTIONS.length);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(current, total) {
  const pct = total ? Math.round((current / total) * 100) : 0;
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressLabel) progressLabel.textContent = `Question ${current} of ${total}`;
}

function attachNavListeners() {
  // Start Quiz button
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      showStep(0);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (state.currentStep === 'info') {
        if (!validateInfo()) return;
        showStep(0);
        return;
      }
      if (typeof state.currentStep === 'number') {
        const idx = state.currentStep;
        if (state.answers[idx] === null) {
          showQuestionError(idx);
          return;
        }
        clearQuestionError(idx);
        if (idx === QUESTIONS.length - 1) {
          showStep('submit');
        } else {
          showStep(idx + 1);
        }
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (state.currentStep === 'submit') { showStep(QUESTIONS.length - 1); return; }
      if (typeof state.currentStep === 'number') {
        const idx = state.currentStep;
        if (idx === 0) { showStep('info'); } else { showStep(idx - 1); }
      }
    });
  }

  if (btnSubmit) btnSubmit.addEventListener('click', submitQuiz);

  // Keyboard: Enter on Likert buttons
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('likert-btn')) {
      e.target.click();
    }
  });
}

// ── Validation ─────────────────────────────────────────
function validateInfo() {
  let valid = true;
  const name  = nameInput?.value.trim() || '';
  const email = emailInput?.value.trim() || '';

  if (!name) {
    if (nameError) { nameError.textContent = 'Please enter your first name.'; nameError.classList.add('visible'); }
    if (nameInput) nameInput.classList.add('error');
    valid = false;
  } else {
    if (nameError) nameError.classList.remove('visible');
    if (nameInput) nameInput.classList.remove('error');
  }

  if (!email || !isValidEmail(email)) {
    if (emailError) { emailError.textContent = 'Please enter a valid email address.'; emailError.classList.add('visible'); }
    if (emailInput) emailInput.classList.add('error');
    valid = false;
  } else {
    if (emailError) emailError.classList.remove('visible');
    if (emailInput) emailInput.classList.remove('error');
  }

  if (valid) {
    state.firstName = name;
    state.email     = email;
    // Autosave name/email on validation
    saveProgress();
  }

  return valid;
}

function showQuestionError(idx) {
  const card = document.getElementById(`question-${idx}`);
  if (!card) return;
  let err = card.querySelector('.question-error');
  if (!err) {
    err = document.createElement('p');
    err.className = 'alert alert-error visible question-error';
    err.style.marginTop = '.25rem';
    err.textContent = 'Please select an answer to continue.';
    card.querySelector('.likert-scale')?.after(err);
  }
  err.classList.add('visible');
}

function clearQuestionError(idx) {
  const card = document.getElementById(`question-${idx}`);
  if (!card) return;
  const err = card.querySelector('.question-error');
  if (err) err.remove();
}

// ── Submission ─────────────────────────────────────────
async function submitQuiz() {
  // Final check: all answered
  const unanswered = state.answers.findIndex(a => a === null);
  if (unanswered !== -1) {
    showStep(unanswered);
    showQuestionError(unanswered);
    return;
  }

  Spinner.show('Generating your personalized report…');
  if (submitAlert) Alert.hide(submitAlert);

  try {
    // Reorder answers from display order back to original QUESTIONS order
    // so the backend index-based scoring works correctly.
    const orderedAnswers = new Array(QUESTIONS.length).fill(null);
    state.questionOrder.forEach((origIdx, displayIdx) => {
      orderedAnswers[origIdx] = state.answers[displayIdx];
    });

    const payload = {
      firstName: state.firstName,
      email:     state.email,
      answers:   orderedAnswers,
    };

    const data = await API.post('/api/quiz', payload);

    // Store results for the results page
    Store.set('resilience_results', data);
    Store.set('resilience_name',    state.firstName);
    Store.set('resilience_email',   state.email);

    // Send flagged questions + feedback to backend (non-blocking)
    const flags = Array.from(state.flaggedQuestions);
    if (flags.length > 0) {
      fetch('/api/quiz/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:            state.email,
          firstName:        state.firstName,
          flaggedQuestions: flags,
          feedbackText:     '',
        }),
      }).catch(() => {});
    }

    // Clear autosave now that submission succeeded
    clearProgress();

    Spinner.hide();

    // Always show the feedback modal after a successful quiz submission
    // (it lets users flag question issues and share improvement suggestions)
    showFeedbackModal(() => {
      window.location.href = 'results.html';
    });
  } catch (err) {
    Spinner.hide();
    if (submitAlert) {
      Alert.show(
        submitAlert,
        err.message || 'Something went wrong. Please try again.',
        'error'
      );
    }
  }
}

// ── Post-quiz feedback modal ───────────────────────────
function showFeedbackModal(onComplete) {
  const modal = document.getElementById('feedbackModal');
  if (!modal) {
    onComplete();
    return;
  }

  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');

  const btnSkip   = modal.querySelector('#btnFeedbackSkip');
  const btnSubmit = modal.querySelector('#btnFeedbackSubmit');
  const textArea  = modal.querySelector('#feedbackTextarea');
  const status    = modal.querySelector('#feedbackStatus');

  function closeAndContinue() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    onComplete();
  }

  if (btnSkip) {
    btnSkip.addEventListener('click', closeAndContinue, { once: true });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener('click', async () => {
      const text = textArea ? textArea.value.trim() : '';
      btnSubmit.disabled = true;
      try {
        await fetch('/api/quiz/feedback', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:            state.email,
            firstName:        state.firstName,
            flaggedQuestions: Array.from(state.flaggedQuestions),
            feedbackText:     text,
          }),
        });
        if (status) status.textContent = 'Thank you for your feedback!';
        setTimeout(closeAndContinue, 1200);
      } catch (e) {
        if (status) status.textContent = 'Could not send feedback, but your results are saved.';
        setTimeout(closeAndContinue, 1500);
      }
    }, { once: true });
  }
}

// ── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);