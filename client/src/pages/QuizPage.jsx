/**
 * QuizPage.jsx — Full React implementation of the Resilience Atlas™ assessment.
 *
 * Migrated from: public/quiz.html + public/js/quiz.js
 *
 * Features ported:
 *  • Welcome/info step with name & email validation
 *  • Progress bar (dynamic, per question)
 *  • 72 Likert-scale questions with per-question flag support
 *  • Per-question navigation (Next, Previous, Review & Submit)
 *  • Review/Submit step with POST to /api/quiz
 *  • Autosave to localStorage (7-day expiry), restore banner
 *  • Spinner/loading overlays
 *  • Accessible labels, keyboard support
 *  • On success: clears autosave and redirects to /results
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

// ── Constants ──────────────────────────────────────────────────────────────
const AUTOSAVE_KEY  = 'ra_quiz_progress';
const RESULTS_KEY   = 'resilience_results';
const TIER_KEY      = 'resilience_tier';
const AUTOSAVE_TTL  = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const LIKERT_OPTIONS = [
  { value: 1, label: 'Never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Almost Always' },
];

/**
 * 72 assessment questions (12 per resilience dimension).
 * Order matches backend RESILIENCE_CATEGORIES index groups:
 *   Agentic-Generative [0–11], Relational-Connective [12–23],
 *   Spiritual-Reflective [24–35], Emotional-Adaptive [36–47],
 *   Somatic-Regulative [48–59], Cognitive-Narrative [60–71]
 */
const QUESTIONS = [
  // Agentic-Generative (Q1–12)
  { id: 1,  category: 'Agentic-Generative',    text: 'I take action to improve difficult situations.' },
  { id: 2,  category: 'Agentic-Generative',    text: 'I pursue meaningful goals even during stress.' },
  { id: 3,  category: 'Agentic-Generative',    text: 'I create opportunities even when things are hard.' },
  { id: 4,  category: 'Agentic-Generative',    text: 'I stay motivated when facing adversity.' },
  { id: 5,  category: 'Agentic-Generative',    text: 'I generate new possibilities in challenging times.' },
  { id: 6,  category: 'Agentic-Generative',    text: 'I move forward with purpose after setbacks.' },
  { id: 7,  category: 'Agentic-Generative',    text: 'I take initiative even when outcomes are uncertain.' },
  { id: 8,  category: 'Agentic-Generative',    text: 'I can identify concrete steps to address challenges.' },
  { id: 9,  category: 'Agentic-Generative',    text: 'I feel empowered to create positive change in my life.' },
  { id: 10, category: 'Agentic-Generative',    text: 'I follow through on decisions even when they are difficult.' },
  { id: 11, category: 'Agentic-Generative',    text: 'I view obstacles as opportunities to demonstrate my capability.' },
  { id: 12, category: 'Agentic-Generative',    text: 'I take responsibility for my resilience journey.' },

  // Relational-Connective (Q13–24)
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

  // Spiritual-Reflective (Q25–36)
  { id: 25, category: 'Spiritual-Reflective',  text: 'I have a sense of purpose that guides me.' },
  { id: 26, category: 'Spiritual-Reflective',  text: 'My values help orient me during difficult times.' },
  { id: 27, category: 'Spiritual-Reflective',  text: 'I reflect on deeper meaning in life events.' },
  { id: 28, category: 'Spiritual-Reflective',  text: 'I feel connected to something larger than myself.' },
  { id: 29, category: 'Spiritual-Reflective',  text: 'My beliefs help me stay grounded.' },
  { id: 30, category: 'Spiritual-Reflective',  text: 'Purpose gives me strength during adversity.' },
  { id: 31, category: 'Spiritual-Reflective',  text: 'I understand what gives my life meaning and purpose.' },
  { id: 32, category: 'Spiritual-Reflective',  text: 'I draw on contemplative or spiritual practices to restore inner calm.' },
  { id: 33, category: 'Spiritual-Reflective',  text: 'I find gratitude and appreciation even in the midst of adversity.' },
  { id: 34, category: 'Spiritual-Reflective',  text: 'Adversity deepens my sense of what matters most.' },
  { id: 35, category: 'Spiritual-Reflective',  text: 'I find resilience through spiritual or philosophical practice.' },
  { id: 36, category: 'Spiritual-Reflective',  text: 'A clear sense of meaning helps me endure hardship.' },

  // Emotional-Adaptive (Q37–48)
  { id: 37, category: 'Emotional-Adaptive',    text: 'I can adapt emotionally to stressful situations.' },
  { id: 38, category: 'Emotional-Adaptive',    text: 'I manage difficult emotions effectively.' },
  { id: 39, category: 'Emotional-Adaptive',    text: 'I recover emotionally after setbacks.' },
  { id: 40, category: 'Emotional-Adaptive',    text: 'I can tolerate emotional discomfort when needed.' },
  { id: 41, category: 'Emotional-Adaptive',    text: 'I regulate my emotional reactions well.' },
  { id: 42, category: 'Emotional-Adaptive',    text: 'My emotions help guide my decisions.' },
  { id: 43, category: 'Emotional-Adaptive',    text: 'I can sit with uncomfortable emotions without being overwhelmed.' },
  { id: 44, category: 'Emotional-Adaptive',    text: 'I understand the messages my emotions are sending.' },
  { id: 45, category: 'Emotional-Adaptive',    text: 'I recognize when I need emotional support and actively seek it.' },
  { id: 46, category: 'Emotional-Adaptive',    text: 'I can express difficult emotions in healthy ways.' },
  { id: 47, category: 'Emotional-Adaptive',    text: 'My emotions provide valuable information about my needs.' },
  { id: 48, category: 'Emotional-Adaptive',    text: 'I maintain emotional balance during stressful periods.' },

  // Somatic-Regulative (Q49–60)
  { id: 49, category: 'Somatic-Regulative',    text: 'Physical movement helps me regulate stress.' },
  { id: 50, category: 'Somatic-Regulative',    text: 'I notice how my body reacts to stress.' },
  { id: 51, category: 'Somatic-Regulative',    text: 'Consistent daily habits provide a stable foundation for my well-being.' },
  { id: 52, category: 'Somatic-Regulative',    text: 'Breathing or physical grounding helps me reset.' },
  { id: 53, category: 'Somatic-Regulative',    text: 'Sleep and rest influence my resilience.' },
  { id: 54, category: 'Somatic-Regulative',    text: 'Exercise or movement improves my mood.' },
  { id: 55, category: 'Somatic-Regulative',    text: 'I prioritize rest and recovery as key components of my resilience.' },
  { id: 56, category: 'Somatic-Regulative',    text: 'My body is a resource I actively care for.' },
  { id: 57, category: 'Somatic-Regulative',    text: 'I use nutrition and hydration intentionally to support my energy and mood.' },
  { id: 58, category: 'Somatic-Regulative',    text: 'I maintain consistency in sleep, movement, and nutrition.' },
  { id: 59, category: 'Somatic-Regulative',    text: 'My physical well-being directly impacts my resilience.' },
  { id: 60, category: 'Somatic-Regulative',    text: 'I use somatic techniques (breathing, stretching, etc.) intentionally.' },

  // Cognitive-Narrative (Q61–72)
  { id: 61, category: 'Cognitive-Narrative',   text: 'I reflect on difficult experiences to learn from them.' },
  { id: 62, category: 'Cognitive-Narrative',   text: 'I can reframe setbacks in a constructive way.' },
  { id: 63, category: 'Cognitive-Narrative',   text: 'My personal story helps me understand challenges.' },
  { id: 64, category: 'Cognitive-Narrative',   text: 'I find meaning in difficult experiences.' },
  { id: 65, category: 'Cognitive-Narrative',   text: 'I actively interpret events in ways that support growth.' },
  { id: 66, category: 'Cognitive-Narrative',   text: 'Reflection helps me move forward after adversity.' },
  { id: 67, category: 'Cognitive-Narrative',   text: 'I actively construct meaningful narratives from my experiences.' },
  { id: 68, category: 'Cognitive-Narrative',   text: 'I can identify growth and learning from past difficulties.' },
  { id: 69, category: 'Cognitive-Narrative',   text: 'I use storytelling to make sense of challenges.' },
  { id: 70, category: 'Cognitive-Narrative',   text: 'I challenge unhelpful thinking patterns.' },
  { id: 71, category: 'Cognitive-Narrative',   text: 'I maintain perspective during adversity.' },
  { id: 72, category: 'Cognitive-Narrative',   text: 'I integrate difficult experiences into my life narrative.' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved.savedAt || Date.now() - saved.savedAt > AUTOSAVE_TTL) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return null;
    }
    return saved;
  } catch (_) {
    return null;
  }
}

function clearProgress() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {}
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Spinner overlay — shown during auth check and quiz submission */
function SpinnerOverlay({ active, text }) {
  if (!active) return null;
  return (
    <div className="spinner-overlay active" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="spinner-text">{text || 'Loading\u2026'}</p>
    </div>
  );
}

/** Autosave restore banner */
function RestoreBanner({ saved, onRestore, onFresh }) {
  if (!saved) return null;
  const answeredCount = saved.answers.filter(a => a !== null).length;
  const name = saved.firstName ? `, ${saved.firstName}` : '';
  const msg = `Welcome back${name}! You answered ${answeredCount} of ${QUESTIONS.length} questions. Would you like to continue where you left off?`;
  return (
    <div className="restore-banner" role="alert" aria-live="polite">
      <div className="restore-banner-inner">
        <span className="restore-banner-icon" aria-hidden="true">💾</span>
        <p className="restore-banner-msg">{msg}</p>
        <div className="restore-banner-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={onRestore}>
            Continue Where I Left Off
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onFresh}>
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

/** Single question card with Likert scale and flag button */
function QuestionCard({ question, displayIdx, answer, isFlagged, onAnswer, onToggleFlag }) {
  return (
    <div className="question-step card active">
      <p className="question-text">{question.text}</p>
      <div className="likert-scale" role="group" aria-label="Rate your agreement">
        {LIKERT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`likert-btn${answer === opt.value ? ' selected' : ''}`}
            aria-pressed={answer === opt.value ? 'true' : 'false'}
            aria-label={opt.label}
            onClick={() => onAnswer(displayIdx, opt.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onAnswer(displayIdx, opt.value); }}
          >
            <span className="likert-dot" aria-hidden="true" />
            {opt.label}
          </button>
        ))}
      </div>
      <div className="question-flag-row">
        <button
          type="button"
          className={`btn-flag-question${isFlagged ? ' flagged' : ''}`}
          aria-pressed={isFlagged ? 'true' : 'false'}
          aria-label="Flag this question as confusing"
          title="Flag as confusing"
          onClick={() => onToggleFlag(question.id)}
        >
          <span aria-hidden="true">&#9873;</span>
          <span className="flag-label">{isFlagged ? 'Flagged' : 'Flag as confusing'}</span>
        </button>
      </div>
    </div>
  );
}

// ── Main QuizPage component ────────────────────────────────────────────────
export default function QuizPage() {
  const navigate = useNavigate();

  // ── Auth0 identity ─────────────────────────────────────────────────────
  const { user: auth0User, isAuthenticated, isLoading: auth0Loading } = useAuth0();

  // ── Auth-check spinner (replaces legacy quiz-auth.js spinner) ─────────
  const [authChecked, setAuthChecked] = useState(false);
  const [spinnerText, setSpinnerText] = useState('Checking authentication\u2026');

  // ── Core quiz state ────────────────────────────────────────────────────
  const [step, setStep]                   = useState('info'); // 'info' | 0..71 | 'submit'
  const [answers, setAnswers]             = useState(new Array(QUESTIONS.length).fill(null));
  const [questionOrder, setQuestionOrder] = useState([]);
  const [firstName, setFirstName]         = useState('');
  const [email, setEmail]                 = useState('');
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());

  // ── UI state ───────────────────────────────────────────────────────────
  const [nameError, setNameError]         = useState('');
  const [emailError, setEmailError]       = useState('');
  const [questionError, setQuestionError] = useState(false);
  const [submitError, setSubmitError]     = useState('');
  const [submitting, setSubmitting]       = useState(false);

  // ── Autosave restore banner ────────────────────────────────────────────
  const [savedProgress, setSavedProgress] = useState(null);

  // ── Track whether Auth0 fully pre-filled name+email ───────────────────
  // Used to auto-advance past the info step when the user is already
  // identified via Auth0 and there is no saved progress to restore.
  const [prefilledFromAuth0, setPrefilledFromAuth0] = useState(false);

  // ── Theme toggle state ─────────────────────────────────────────────────
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Set page title
    document.title = 'Take the Assessment \u2014 The Resilience Atlas\u2122';

    try {
      const t = localStorage.getItem('ra-theme');
      let theme;
      if (t === 'dark') {
        theme = 'dark';
      } else if (t === 'light') {
        theme = 'light';
      } else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        theme = 'dark';
      } else {
        theme = 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
      setIsDarkTheme(theme === 'dark');
    } catch (_) {}
  }, []);

  // ── Prefill name/email from Auth0 when authenticated ─────────────────
  // Mirrors the logic in public/js/quiz-auth.js so the React quiz also
  // benefits from Auth0 identity without requiring the user to re-enter
  // their details.  Only fills empty fields so saved progress is preserved.
  useEffect(() => {
    if (auth0Loading || !isAuthenticated || !auth0User) return;

    // Persist email/name to localStorage so the rest of the app finds them.
    if (auth0User.email) {
      try { localStorage.setItem('resilience_email', auth0User.email); } catch (_) {}
    }
    const givenName = auth0User.given_name ||
      (auth0User.name ? auth0User.name.split(' ')[0] : '');
    if (givenName) {
      try { localStorage.setItem('resilience_name', givenName); } catch (_) {}
    }

    // Prefill the form fields only when they are still empty.
    setFirstName(prev => !prev ? givenName : prev);
    setEmail(prev => !prev ? auth0User.email : prev);

    // Mark that Auth0 has provided both name and email so we can
    // auto-advance past the info step (avoiding the redundant form).
    if (givenName && auth0User.email) {
      setPrefilledFromAuth0(true);
    }
  }, [auth0Loading, isAuthenticated, auth0User]);

  // ── Auto-advance past info step when Auth0 pre-fills both fields ──────
  // When the user is already identified via Auth0, skip the name/email
  // confirmation form so they land directly on the first question.
  // Only skips when there is no saved progress awaiting restore.
  useEffect(() => {
    if (!prefilledFromAuth0 || step !== 'info' || savedProgress) return;
    setStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [prefilledFromAuth0, step, savedProgress]);

  // ── Auth check + initial state setup ─────────────────────────────────
  useEffect(() => {
    async function checkAuthAndInit() {
      // Mirror the logic from legacy quiz-auth.js:
      // Attempt to fetch /config to check if Auth0 is configured.
      // If server is unreachable or Auth0 is not configured, allow access.
      try {
        const res = await fetch('/config');
        if (res.ok) {
          const config = await res.json();
          if (config.auth0Domain && config.auth0ClientId) {
            // Auth0 IS configured — the Auth0Provider in App.jsx handles
            // authentication.  We rely on useAuth0 for token management, so
            // we just continue (the SPA is already authenticated by the time
            // this page renders inside the Router).
          }
        }
      } catch (_) {
        // Server unreachable — allow access without blocking
      }

      // Check if user has already completed the quiz
      const existingResults = (() => {
        try { return JSON.parse(localStorage.getItem(RESULTS_KEY)); } catch (_) { return null; }
      })();

      if (existingResults) {
        const tier = localStorage.getItem(TIER_KEY) || 'free';
        const hasUnlimitedRetakes =
          tier === 'atlas-premium' || tier === 'business' ||
          tier === 'starter'       || tier === 'pro'       || tier === 'enterprise';

        if (!hasUnlimitedRetakes) {
          // Not allowed to retake for free — send back to results
          clearProgress();
          navigate('/results', { replace: true });
          return;
        }
        // Premium user — allow fresh retake
        clearProgress();
        const order = shuffleArray(QUESTIONS.map((_, i) => i));
        setQuestionOrder(order);
        setAuthChecked(true);
        return;
      }

      // No completed results — check for saved partial progress
      const saved = loadSavedProgress();
      if (saved && saved.answers && saved.questionOrder && saved.questionOrder.length === QUESTIONS.length) {
        setSavedProgress(saved);
      } else {
        const order = shuffleArray(QUESTIONS.map((_, i) => i));
        setQuestionOrder(order);
      }
      setAuthChecked(true);
    }

    checkAuthAndInit();
  }, [navigate]);

  // ── Redirect Auth0 users with completed assessments to /results ────────
  // When an authenticated Auth0 user arrives at /quiz without having
  // localStorage results (e.g. new device or cleared storage), check the
  // backend for completed assessments and redirect to /results if any exist.
  // Skipped when the user explicitly wants to retake (via `?retake=1`).
  const backendRedirectCheckedRef = useRef(false);
  useEffect(() => {
    if (auth0Loading || !isAuthenticated || !auth0User?.email) return;
    if (!authChecked) return; // wait for localStorage check to complete
    if (backendRedirectCheckedRef.current) return; // only run once per mount
    backendRedirectCheckedRef.current = true;

    // Honour explicit retake intent (?retake=1 query param set by ResultsPage)
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('retake') === '1') return;
    } catch (_) { /* ignore */ }

    // If user has partial quiz progress, let them decide to continue or start fresh
    if (savedProgress !== null) return;

    fetch(`/api/assessment/history?email=${encodeURIComponent(auth0User.email)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.assessments?.length > 0) {
          navigate('/results', { replace: true });
        }
      })
      .catch(() => { /* don't block quiz on network error */ });
  }, [auth0Loading, isAuthenticated, auth0User, authChecked, savedProgress, navigate]);

  // ── Autosave effect — triggered whenever key state changes ────────────
  const saveProgress = useCallback(() => {
    if (!authChecked || savedProgress !== null) return; // don't overwrite during restore selection
    try {
      const snapshot = {
        answers,
        questionOrder,
        currentStep: step,
        firstName,
        email,
        flaggedQuestions: Array.from(flaggedQuestions),
        savedAt: Date.now(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
    } catch (_) {}
  }, [authChecked, savedProgress, answers, questionOrder, step, firstName, email, flaggedQuestions]);

  useEffect(() => {
    if (authChecked && savedProgress === null) {
      saveProgress();
    }
  }, [authChecked, savedProgress, saveProgress]);

  // ── Restore handlers ───────────────────────────────────────────────────
  function handleRestore() {
    const saved = savedProgress;
    setSavedProgress(null);
    setAnswers(saved.answers);
    setQuestionOrder(saved.questionOrder);
    setFirstName(saved.firstName || '');
    setEmail(saved.email || '');
    setFlaggedQuestions(new Set(saved.flaggedQuestions || []));
    const s = saved.currentStep;
    if (s === 'submit' || s === 'info' || typeof s === 'number') {
      setStep(s);
    } else {
      setStep('info');
    }
  }

  function handleStartFresh() {
    clearProgress();
    setSavedProgress(null);
    const order = shuffleArray(QUESTIONS.map((_, i) => i));
    setQuestionOrder(order);
    setStep('info');
  }

  // ── Progress calculation ───────────────────────────────────────────────
  const total = QUESTIONS.length;
  const progressPct = step === 'info'
    ? 0
    : step === 'submit'
      ? 100
      : Math.round(((step + 1) / total) * 100);
  const progressLabel = step === 'info'
    ? `${total} Questions`
    : step === 'submit'
      ? `Question ${total} of ${total}`
      : `Question ${step + 1} of ${total}`;

  // ── Validation ─────────────────────────────────────────────────────────
  function validateInfo() {
    let valid = true;
    const name  = firstName.trim();
    const em    = email.trim();

    if (!name) {
      setNameError('Please enter your first name.');
      valid = false;
    } else {
      setNameError('');
    }

    if (!em || !isValidEmail(em)) {
      setEmailError('Please enter a valid email address.');
      valid = false;
    } else {
      setEmailError('');
    }

    return valid;
  }

  // ── Navigation handlers ────────────────────────────────────────────────
  function handleNext() {
    if (step === 'info') {
      if (!validateInfo()) return;
      // Persist name/email to autosave immediately
      try {
        const saved = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) || '{}');
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
          ...saved,
          firstName: firstName.trim(),
          email: email.trim(),
          savedAt: Date.now(),
        }));
      } catch (_) {}
      setStep(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (typeof step === 'number') {
      const idx = step;
      if (answers[idx] === null) {
        setQuestionError(true);
        return;
      }
      setQuestionError(false);
      if (idx === QUESTIONS.length - 1) {
        setStep('submit');
      } else {
        setStep(idx + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  function handlePrev() {
    if (step === 'submit') {
      setStep(QUESTIONS.length - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (typeof step === 'number') {
      const idx = step;
      setQuestionError(false);
      if (idx === 0) {
        setStep('info');
      } else {
        setStep(idx - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  // ── Answer & flag handlers ─────────────────────────────────────────────
  function handleAnswer(displayIdx, value) {
    setAnswers(prev => {
      const next = [...prev];
      next[displayIdx] = value;
      return next;
    });
    if (questionError && typeof step === 'number') {
      setQuestionError(false);
    }
  }

  function handleToggleFlag(qid) {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qid)) {
        next.delete(qid);
      } else {
        next.add(qid);
      }
      return next;
    });
  }

  // ── Submit quiz ────────────────────────────────────────────────────────
  async function submitQuiz() {
    // Final check: all questions answered
    const unansweredIdx = answers.findIndex(a => a === null);
    if (unansweredIdx !== -1) {
      setStep(unansweredIdx);
      setQuestionError(true);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSpinnerText('Generating your personalized report\u2026');

    try {
      // Reorder answers from display order back to QUESTIONS order
      // so the backend index-based scoring works correctly.
      const orderedAnswers = new Array(QUESTIONS.length).fill(null);
      questionOrder.forEach((origIdx, displayIdx) => {
        orderedAnswers[origIdx] = answers[displayIdx];
      });

      const payload = {
        firstName: firstName.trim(),
        email:     email.trim(),
        answers:   orderedAnswers,
      };

      const res = await fetch('/api/quiz', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      // Persist results for ResultsPage
      try {
        localStorage.setItem(RESULTS_KEY, JSON.stringify(data));
        localStorage.setItem('resilience_name',  firstName.trim());
        localStorage.setItem('resilience_email', email.trim());
      } catch (_) {}

      // Send flagged questions (non-blocking, best-effort)
      const flags = Array.from(flaggedQuestions);
      if (flags.length > 0) {
        fetch('/api/quiz/feedback', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:            email.trim(),
            firstName:        firstName.trim(),
            flaggedQuestions: flags,
            feedbackText:     '',
          }),
        }).catch(() => {});
      }

      // Clear autosave on successful submission
      clearProgress();
      setSubmitting(false);

      navigate('/results');
    } catch (err) {
      setSubmitting(false);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    }
  }

  // ── Theme toggle handler ───────────────────────────────────────────────
  function handleThemeToggle() {
    try {
      const next = isDarkTheme ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ra-theme', next);
      setIsDarkTheme(next === 'dark');
    } catch (_) {}
  }

  // ── Render ─────────────────────────────────────────────────────────────
  // Determine the current question for the question step
  const currentQ = typeof step === 'number' && questionOrder.length > 0
    ? QUESTIONS[questionOrder[step]]
    : null;

  const currentAnswer = typeof step === 'number' ? answers[step] : null;
  const currentFlagged = currentQ ? flaggedQuestions.has(currentQ.id) : false;

  // Show prev button
  const showPrev = step !== 'info';
  const prevHidden = step === 'info';
  // Next button label
  const nextLabel = step === 'info'
    ? 'Start Quiz'
    : typeof step === 'number' && step === QUESTIONS.length - 1
      ? 'Review \u0026 Submit'
      : 'Next';
  const showNext = step !== 'submit';

  return (
    <>
      {/* ── Spinner overlay ────────────────────────────── */}
      {(!authChecked || submitting) && (
        <SpinnerOverlay
          active
          text={submitting ? spinnerText : 'Loading assessment\u2026'}
        />
      )}

      {/* ── Dark-mode readability hint ──────────────────── */}
      <DarkModeHint />

      {/* ── Autosave restore banner ─────────────────────── */}
      {savedProgress && authChecked && (
        <RestoreBanner
          saved={savedProgress}
          onRestore={handleRestore}
          onFresh={handleStartFresh}
        />
      )}

      {/* ── Header ─────────────────────────────────────── */}
      <SiteHeader
        activePage="assessment"
        ctaButton={null}
        onThemeChange={(isDark) => setIsDarkTheme(isDark)}
      />

      {/* ── Main quiz area ─────────────────────────────── */}
      <main>
        <div className="quiz-page">
          <div className="quiz-wrapper">

            {/* Progress bar */}
            <div className="progress-container" role="region" aria-label="Quiz progress">
              <div className="progress-header">
                <span id="progressLabel">{progressLabel}</span>
                <span id="progressPct">{step !== 'info' ? `${progressPct}%` : ''}</span>
              </div>
              <div className="progress-bar-track" aria-hidden="true">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* ── Step 1: Name & Email ────────────────────── */}
            {step === 'info' && (
              <div className="info-step card active">
                <h2>Welcome to The Resilience Atlas&#8482;</h2>
                <p className="description">
                  This 72-question assessment takes about 15–20 minutes to complete.
                  Please answer each question honestly — there are no right or wrong
                  answers. Enter your details below to get started.
                </p>

                {/* Auth0 session notice when authenticated */}
                {isAuthenticated && auth0User?.email && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 20,
                      fontSize: 13,
                      color: '#10b981',
                    }}
                    role="status"
                  >
                    <span style={{ fontSize: 16 }}>✓</span>
                    <span>
                      Signed in as <strong>{auth0User.email}</strong> — your details have been prefilled.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="firstName">
                    First Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    placeholder="Your first name"
                    required
                    aria-required="true"
                    aria-describedby="nameError"
                    className={nameError ? 'error' : ''}
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); if (nameError) setNameError(''); }}
                  />
                  <span
                    id="nameError"
                    className={`field-error${nameError ? ' visible' : ''}`}
                    role="alert"
                  >
                    {nameError}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    Email Address <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    aria-required="true"
                    aria-describedby="emailError"
                    className={emailError ? 'error' : ''}
                    value={email}
                    readOnly={isAuthenticated && !!auth0User?.email}
                    style={isAuthenticated && auth0User?.email ? { background: 'rgba(16,185,129,0.06)', cursor: 'default' } : undefined}
                    onChange={(e) => {
                      if (isAuthenticated && auth0User?.email) return;
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                  />
                  <span
                    id="emailError"
                    className={`field-error${emailError ? ' visible' : ''}`}
                    role="alert"
                  >
                    {emailError}
                  </span>
                </div>
              </div>
            )}

            {/* ── Step 2: Questions ────────────────────────── */}
            {typeof step === 'number' && currentQ && (
              <>
                <QuestionCard
                  key={step}
                  question={currentQ}
                  displayIdx={step}
                  answer={currentAnswer}
                  isFlagged={currentFlagged}
                  onAnswer={handleAnswer}
                  onToggleFlag={handleToggleFlag}
                />
                {questionError && (
                  <p
                    className="alert alert-error visible"
                    role="alert"
                    style={{ marginTop: '.25rem' }}
                  >
                    Please select an answer to continue.
                  </p>
                )}
              </>
            )}

            {/* ── Step 3: Review & Submit ──────────────────── */}
            {step === 'submit' && (
              <div className="submit-step card active">
                <h2>You have answered all {QUESTIONS.length} questions!</h2>
                <p>
                  Click <strong>Submit</strong> to generate your personalized
                  resilience report. This usually takes just a moment.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={submitQuiz}
                  disabled={submitting}
                >
                  <span className="btn-label">Submit &amp; See My Results</span>
                </button>
                {submitError && (
                  <div className="alert alert-error visible" role="alert" style={{ marginTop: '1rem' }}>
                    {submitError}
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation bar ───────────────────────────── */}
            <div className="quiz-nav">
              {/* Previous button */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ visibility: prevHidden ? 'hidden' : 'visible' }}
                onClick={handlePrev}
                aria-hidden={prevHidden ? 'true' : 'false'}
                tabIndex={prevHidden ? -1 : 0}
              >
                <span aria-hidden="true">&larr;</span>
                <span className="btn-label">Previous</span>
              </button>

              {/* Next button — hidden on submit step */}
              {showNext && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  <span className="btn-label">{nextLabel}</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              )}
            </div>

          </div>{/* /.quiz-wrapper */}
        </div>{/* /.quiz-page */}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="privacy-guarantee" role="note" aria-label="Data privacy guarantee">
        <span className="privacy-guarantee__icon" aria-hidden="true">
          <img src="/icons/lock.svg" alt="" width={16} height={16} style={{ verticalAlign: 'middle' }} />
        </span>
        <span className="privacy-guarantee__text">
          <strong>You control your data.</strong>
          {' '}Delete your account and results anytime —{' '}
          <a href="/privacy">Learn about data control</a>.
        </span>
      </div>

    </>
  );
}
