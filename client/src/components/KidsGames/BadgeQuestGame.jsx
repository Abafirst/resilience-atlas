import React, { useState, useCallback, useMemo } from 'react';
import { AGE_GROUP_MAP, QUESTIONS_PER_SESSION, pickQuestions } from '../../data/badgeQuestQuestions';

/* ─────────────────────────────────────────────────────────
   QuestionCard — renders the current question + answer options
───────────────────────────────────────────────────────── */
function QuestionCard({ question, questionIndex, total, onAnswer }) {
  const [selected, setSelected]   = useState(null);
  const [answered, setAnswered]   = useState(false);

  const choose = useCallback((opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
  }, [answered]);

  const handleNext = useCallback(() => {
    if (!answered) return;
    onAnswer(selected.correct, question);
  }, [answered, selected, question, onAnswer]);

  const handleQuit = useCallback(() => {
    onAnswer(null, question);   // null signals quit
  }, [question, onAnswer]);

  return (
    <div className="bq-question-card" role="main">
      {/* Progress */}
      <div className="bq-progress" aria-label={`Question ${questionIndex + 1} of ${total}`}>
        <div className="bq-progress-label">Question {questionIndex + 1} of {total}</div>
        <div className="bq-progress-bar" role="progressbar" aria-valuenow={questionIndex + 1} aria-valuemax={total}>
          <div
            className="bq-progress-fill"
            style={{ width: `${((questionIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question text */}
      <div className="bq-question-text" aria-live="polite">
        {question.question}
      </div>

      {/* Answer options */}
      <div className="bq-options" role="group" aria-label="Answer choices">
        {question.options.map((opt, i) => {
          let cls = 'bq-option';
          if (answered) {
            if (opt.correct)              cls += ' bq-option-correct';
            else if (selected === opt)    cls += ' bq-option-wrong';
            else                         cls += ' bq-option-dim';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => choose(opt)}
              disabled={answered}
              aria-pressed={selected === opt}
              aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt.text}`}
            >
              <span className="bq-option-letter" aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="bq-option-text">{opt.text}</span>
              {answered && opt.correct  && <span className="bq-option-icon" aria-hidden="true"><img src="/icons/checkmark.svg" alt="" width={16} height={16} style={{ verticalAlign: 'middle' }} /></span>}
              {answered && selected === opt && !opt.correct && <span className="bq-option-icon" aria-hidden="true" style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div
          className={`bq-feedback ${selected?.correct ? 'bq-feedback-correct' : 'bq-feedback-wrong'}`}
          role="status"
          aria-live="polite"
        >
          {selected?.correct ? (
            <>
              <span className="bq-feedback-icon" aria-hidden="true">🎉</span>
              <div>
                <strong>Correct!</strong>
                <p>{question.explanation}</p>
              </div>
            </>
          ) : (
            <>
              <span className="bq-feedback-icon" aria-hidden="true">💡</span>
              <div>
                <strong>Not quite!</strong>
                <p>
                  The correct answer was:{' '}
                  <strong>{question.options.find(o => o.correct)?.text}</strong>
                </p>
                <p>{question.explanation}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="bq-action-row">
        {!answered ? (
          <button className="bq-btn-primary" disabled aria-label="Select an answer first">
            Select an Answer
          </button>
        ) : (
          <>
            <button className="bq-btn-primary" onClick={handleNext}>
              {questionIndex + 1 < total ? 'Next Question →' : 'See Results 🏆'}
            </button>
            <button className="bq-btn-secondary" onClick={handleQuit}>
              Quit
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   ResultsCard — shown after all questions are answered
───────────────────────────────────────────────────────── */
function ResultsCard({ score, total, earnedBadges, bestScore, onPlayAgain, onBack }) {
  const stars = score === total ? 3 : score >= Math.ceil(total / 2) ? 2 : score > 0 ? 1 : 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="bq-results-card" role="main" aria-label="Quiz results">
      <div className="bq-results-trophy" aria-hidden="true">
        <img src="/icons/kids-trophy.svg" alt="" width={64} height={64} style={{ verticalAlign: 'middle' }} />
      </div>
      <h2 className="bq-results-title">Quiz Complete!</h2>

      {/* Star rating */}
      <div className="bq-results-stars" aria-label={`${stars} out of 3 stars`}>
        {[1, 2, 3].map(s => (
          <span
            key={s}
            className={`bq-star ${s <= stars ? 'bq-star-lit' : 'bq-star-dim'}`}
            aria-hidden="true"
          >
            <img src="/icons/star.svg" alt="" width={20} height={20} style={{ verticalAlign: 'middle' }} />
          </span>
        ))}
      </div>

      <p className="bq-results-score" aria-label={`Score: ${score} out of ${total}`}>
        Your Score: <strong>{score}/{total}</strong> ({percentage}%)
      </p>

      {/* Badges earned */}
      {earnedBadges.length > 0 && (
        <div className="bq-results-badges" aria-label={`You earned ${earnedBadges.length} badge${earnedBadges.length !== 1 ? 's' : ''}`}>
          <p className="bq-results-badges-label">
            🎉 You earned {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''}!
          </p>
          <div className="bq-results-badge-row">
            {earnedBadges.map((b, i) => (
              <div key={i} className="bq-result-badge bq-result-badge-spin" aria-label={b.name}>
                <span className="bq-result-badge-emoji" aria-hidden="true">
                  <img src={b.icon} alt="" width={28} height={28} style={{ verticalAlign: 'middle' }} />
                </span>
                <span className="bq-result-badge-name">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {score === 0 && (
        <p className="bq-results-encourage">
          Keep trying — every question you attempt makes you stronger! 💪
        </p>
      )}

      {/* Best score */}
      {bestScore !== null && bestScore > score && (
        <p className="bq-results-best" aria-label={`Best score so far: ${bestScore} out of ${total}`}>
          Best Score: {bestScore}/{total}
        </p>
      )}

      <div className="bq-action-row">
        <button className="bq-btn-primary" onClick={onPlayAgain}>
          Play Again 🔄
        </button>
        <button className="bq-btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BadgeQuestGame — main component
   Props:
     onBack        — called when the player exits
     onEarnBadge   — called with a badgeId each time a badge is earned
     ageGroup      — 'young' | 'middle' | 'older'
───────────────────────────────────────────────────────── */
export default function BadgeQuestGame({ onBack, onEarnBadge, ageGroup = 'young' }) {
  const ageKey = AGE_GROUP_MAP[ageGroup] ?? 'ages_5_7';

  /* Generate a fresh set of questions */
  const freshQuestions = useCallback(
    () => pickQuestions(ageKey, QUESTIONS_PER_SESSION),
    [ageKey],
  );

  const [questions, setQuestions]       = useState(() => freshQuestions());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore]               = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [phase, setPhase]               = useState('intro'); // intro | playing | results
  const [bestScore, setBestScore]       = useState(null);
  /* key resets QuestionCard state when navigating to the next question */
  const [cardKey, setCardKey]           = useState(0);

  const total = questions.length;

  const startQuiz = useCallback(() => setPhase('playing'), []);

  const handleAnswer = useCallback((correct, question) => {
    /* null means the player hit "Quit" */
    if (correct === null) {
      onBack();
      return;
    }

    const newScore = correct ? score + 1 : score;
    const newBadges = correct
      ? [...earnedBadges, question.badge]
      : earnedBadges;

    if (correct) {
      setScore(newScore);
      setEarnedBadges(newBadges);
      if (onEarnBadge) onEarnBadge(question.badge.id);
    }

    if (questionIndex + 1 < total) {
      setQuestionIndex(qi => qi + 1);
      setCardKey(k => k + 1);
    } else {
      /* Session complete */
      setBestScore(prev => (prev === null || newScore > prev ? newScore : prev));
      setPhase('results');
    }
  }, [score, earnedBadges, questionIndex, total, onEarnBadge, onBack]);

  const handlePlayAgain = useCallback(() => {
    setQuestions(freshQuestions());
    setQuestionIndex(0);
    setScore(0);
    setEarnedBadges([]);
    setCardKey(k => k + 1);
    setPhase('playing');
  }, [freshQuestions]);

  /* ── Intro screen ── */
  if (phase === 'intro') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>

        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true">
            <img src="/icons/game-target.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
          </div>
          <h2 className="kg-game-title">Badge Quest Challenge</h2>
          <p className="kg-game-subtitle">
            Answer {total} resilience questions to earn badges!
          </p>
        </div>

        <div className="bq-intro-panel">
          <ul className="bq-intro-list" aria-label="How to play">
            <li>📋 {total} multiple-choice questions</li>
            <li>✅ Each correct answer earns you a badge</li>
            <li>🔀 Questions are different every time</li>
            <li>🏆 See how many you can get right!</li>
          </ul>
          <button className="bq-btn-primary bq-btn-large" onClick={startQuiz}>
            Start Quest! 🚀
          </button>
        </div>
      </div>
    );
  }

  /* ── Results screen ── */
  if (phase === 'results') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <ResultsCard
          score={score}
          total={total}
          earnedBadges={earnedBadges}
          bestScore={bestScore}
          onPlayAgain={handlePlayAgain}
          onBack={onBack}
        />
      </div>
    );
  }

  /* ── Playing screen ── */
  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>

      <div className="kg-game-header">
        <div className="kg-game-emoji" aria-hidden="true">
          <img src="/icons/game-target.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
        </div>
        <h2 className="kg-game-title">Badge Quest Challenge</h2>
        <div className="kg-score-badge" aria-live="polite">
          <img src="/icons/badge.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {score}/{total} badges earned
        </div>
      </div>

      <QuestionCard
        key={cardKey}
        question={questions[questionIndex]}
        questionIndex={questionIndex}
        total={total}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
