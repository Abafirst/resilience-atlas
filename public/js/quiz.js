/* =====================================================
   quiz.js — Quiz state management and submission
   ===================================================== */

'use strict';

// ── Question bank (36 questions, 6 per resilience type) ─
const QUESTIONS = [

  // Somatic-Behavioral (Q1-6)
  { id: 1, category: 'Somatic-Behavioral', text: 'Physical movement helps me regulate stress.' },
  { id: 2, category: 'Somatic-Behavioral', text: 'I notice how my body reacts to stress.' },
  { id: 3, category: 'Somatic-Behavioral', text: 'Healthy routines help me stay grounded.' },
  { id: 4, category: 'Somatic-Behavioral', text: 'Breathing or physical grounding helps me reset.' },
  { id: 5, category: 'Somatic-Behavioral', text: 'Sleep and rest influence my resilience.' },
  { id: 6, category: 'Somatic-Behavioral', text: 'Exercise or movement improves my mood.' },

  // Cognitive-Narrative (Q7-12)
  { id: 7, category: 'Cognitive-Narrative', text: 'I reflect on difficult experiences to learn from them.' },
  { id: 8, category: 'Cognitive-Narrative', text: 'I can reframe setbacks in a constructive way.' },
  { id: 9, category: 'Cognitive-Narrative', text: 'My personal story helps me understand challenges.' },
  { id: 10, category: 'Cognitive-Narrative', text: 'I find meaning in difficult experiences.' },
  { id: 11, category: 'Cognitive-Narrative', text: 'I actively interpret events in ways that support growth.' },
  { id: 12, category: 'Cognitive-Narrative', text: 'Reflection helps me move forward after adversity.' },

  // Emotional-Adaptive (Q13-18)
  { id: 13, category: 'Emotional-Adaptive', text: 'I can adapt emotionally to stressful situations.' },
  { id: 14, category: 'Emotional-Adaptive', text: 'I manage difficult emotions effectively.' },
  { id: 15, category: 'Emotional-Adaptive', text: 'I recover emotionally after setbacks.' },
  { id: 16, category: 'Emotional-Adaptive', text: 'I can tolerate emotional discomfort when needed.' },
  { id: 17, category: 'Emotional-Adaptive', text: 'I regulate my emotional reactions well.' },
  { id: 18, category: 'Emotional-Adaptive', text: 'My emotions help guide my decisions.' },

  // Relational (Q19-24)
  { id: 19, category: 'Relational', text: 'I reach out to others when I need support.' },
  { id: 20, category: 'Relational', text: 'I maintain supportive relationships.' },
  { id: 21, category: 'Relational', text: 'I feel connected to my community.' },
  { id: 22, category: 'Relational', text: 'I contribute to the well-being of others.' },
  { id: 23, category: 'Relational', text: 'I communicate openly with people I trust.' },
  { id: 24, category: 'Relational', text: 'My relationships help me through challenges.' },

  // Agentic-Generative (Q25-30)
  { id: 25, category: 'Agentic-Generative', text: 'I take action to improve difficult situations.' },
  { id: 26, category: 'Agentic-Generative', text: 'I pursue meaningful goals even during stress.' },
  { id: 27, category: 'Agentic-Generative', text: 'I create opportunities even when things are hard.' },
  { id: 28, category: 'Agentic-Generative', text: 'I stay motivated when facing adversity.' },
  { id: 29, category: 'Agentic-Generative', text: 'I generate new possibilities in challenging times.' },
  { id: 30, category: 'Agentic-Generative', text: 'I move forward with purpose after setbacks.' },

  // Spiritual-Existential (Q31-36)
  { id: 31, category: 'Spiritual-Existential', text: 'I have a sense of purpose that guides me.' },
  { id: 32, category: 'Spiritual-Existential', text: 'My values help orient me during difficult times.' },
  { id: 33, category: 'Spiritual-Existential', text: 'I reflect on deeper meaning in life events.' },
  { id: 34, category: 'Spiritual-Existential', text: 'I feel connected to something larger than myself.' },
  { id: 35, category: 'Spiritual-Existential', text: 'My beliefs help me stay grounded.' },
  { id: 36, category: 'Spiritual-Existential', text: 'Purpose gives me strength during adversity.' }
];

// ── State ──────────────────────────────────────────────
const state = {
  firstName: '',
  email: '',
  answers: new Array(QUESTIONS.length).fill(null),
  currentStep: 'info', // 'info' | 0..35 | 'submit'
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

  buildQuestionCards();
  attachNavListeners();
  showStep('info');
}

// ── Build question HTML ────────────────────────────────
function buildQuestionCards() {
  if (!questionContainer) return;
  questionContainer.innerHTML = '';

  QUESTIONS.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'question-step card';
    card.id = `question-${idx}`;
    card.setAttribute('data-index', idx);

    const likertHtml = LIKERT_OPTIONS.map(opt => `
      <button type="button"
              class="likert-btn"
              data-value="${opt.value}"
              data-question="${idx}"
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
    `;

    // Restore any previously selected answer
    if (state.answers[idx] !== null) {
      const btn = card.querySelector(`[data-value="${state.answers[idx]}"]`);
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
}

// ── Navigation ─────────────────────────────────────────
function showStep(step) {
  state.currentStep = step;

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
    const payload = {
      firstName: state.firstName,
      email:     state.email,
      answers:   state.answers,
    };

    const data = await API.post('/api/quiz', payload);

    // Store results for the results page
    Store.set('resilience_results', data);
    Store.set('resilience_name',    state.firstName);
    Store.set('resilience_email',   state.email);

    Spinner.hide();
    window.location.href = 'results.html';
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

// ── Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
