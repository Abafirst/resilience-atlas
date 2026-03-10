/* =====================================================
   quiz.js — Quiz state management and submission
   ===================================================== */

'use strict';

// ── Question bank (36 questions, 6 per resilience type) ─
const QUESTIONS = [
  // Adaptive Resilience (Q1–6)
  { id: 1,  category: 'Adaptive Resilience',    text: 'I adjust my plans when unexpected changes arise.' },
  { id: 2,  category: 'Adaptive Resilience',    text: 'I see challenges as opportunities to learn and grow.' },
  { id: 3,  category: 'Adaptive Resilience',    text: 'When one approach fails, I quickly try a different strategy.' },
  { id: 4,  category: 'Adaptive Resilience',    text: 'I recover my equilibrium fairly quickly after setbacks.' },
  { id: 5,  category: 'Adaptive Resilience',    text: 'I remain productive even during periods of uncertainty.' },
  { id: 6,  category: 'Adaptive Resilience',    text: 'I am comfortable with ambiguity and not having all the answers.' },

  // Relational Resilience (Q7–12)
  { id: 7,  category: 'Relational Resilience',  text: 'I reach out to others when I need support.' },
  { id: 8,  category: 'Relational Resilience',  text: 'I have people in my life I can count on during hard times.' },
  { id: 9,  category: 'Relational Resilience',  text: 'I contribute to the well-being of people around me.' },
  { id: 10, category: 'Relational Resilience',  text: 'I feel a genuine sense of belonging in my community.' },
  { id: 11, category: 'Relational Resilience',  text: 'I maintain close relationships even when life gets busy.' },
  { id: 12, category: 'Relational Resilience',  text: 'I am able to set healthy boundaries while staying connected.' },

  // Existential Resilience (Q13–18)
  { id: 13, category: 'Existential Resilience', text: 'I have a clear sense of purpose that guides my decisions.' },
  { id: 14, category: 'Existential Resilience', text: 'I can find meaning even in difficult or painful experiences.' },
  { id: 15, category: 'Existential Resilience', text: 'My values provide a stable foundation when things go wrong.' },
  { id: 16, category: 'Existential Resilience', text: 'I feel that my life contributes something meaningful to the world.' },
  { id: 17, category: 'Existential Resilience', text: 'I draw on spiritual or philosophical beliefs during tough times.' },
  { id: 18, category: 'Existential Resilience', text: 'I have a sense of hope about the future, even when it is uncertain.' },

  // Emotional Resilience (Q19–24)
  { id: 19, category: 'Emotional Resilience',   text: 'I am aware of my emotions and can name them accurately.' },
  { id: 20, category: 'Emotional Resilience',   text: 'I manage strong emotions without them overwhelming me.' },
  { id: 21, category: 'Emotional Resilience',   text: 'I allow myself to grieve or feel pain without getting stuck in it.' },
  { id: 22, category: 'Emotional Resilience',   text: 'I can regulate my stress response in high-pressure moments.' },
  { id: 23, category: 'Emotional Resilience',   text: 'I use healthy strategies (e.g., exercise, breathing) to cope.' },
  { id: 24, category: 'Emotional Resilience',   text: 'I bounce back emotionally after disappointment or loss.' },

  // Physical Resilience (Q25–30)
  { id: 25, category: 'Physical Resilience',    text: 'I prioritize sleep and feel adequately rested most days.' },
  { id: 26, category: 'Physical Resilience',    text: 'I engage in regular physical movement or exercise.' },
  { id: 27, category: 'Physical Resilience',    text: 'I nourish my body with food that supports my energy and focus.' },
  { id: 28, category: 'Physical Resilience',    text: "I listen to my body's signals and rest when I need to." },
  { id: 29, category: 'Physical Resilience',    text: "My physical health supports my ability to handle life's demands." },
  { id: 30, category: 'Physical Resilience',    text: 'I take proactive steps to maintain or improve my physical well-being.' },

  // Cognitive Resilience (Q31–36)
  { id: 31, category: 'Cognitive Resilience',   text: 'I challenge negative self-talk and replace it with balanced thinking.' },
  { id: 32, category: 'Cognitive Resilience',   text: 'I can focus on what I can control rather than what I cannot.' },
  { id: 33, category: 'Cognitive Resilience',   text: 'I break overwhelming problems into manageable steps.' },
  { id: 34, category: 'Cognitive Resilience',   text: 'I maintain perspective and avoid catastrophizing difficult situations.' },
  { id: 35, category: 'Cognitive Resilience',   text: 'I am open to changing my mind when new information is available.' },
  { id: 36, category: 'Cognitive Resilience',   text: 'I use reflection and learning as tools to navigate future challenges.' },
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
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
