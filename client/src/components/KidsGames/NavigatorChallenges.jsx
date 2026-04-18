import React, { useState, useCallback, useEffect, useRef } from 'react';
import { NAVIGATOR_CHALLENGES } from '../../data/kidsGameChallenges';

const ROUND_SIZE = 5;
const TIME_PER_QUESTION = 20; // seconds

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * NavigatorChallenges — Ages 12+
 * Timed resilience challenges with scoring and personal best.
 */
export default function NavigatorChallenges({ onBack, onEarnBadge }) {
  const [view, setView] = useState('intro'); // 'intro' | 'playing' | 'results'
  const [questions, setQuestions] = useState([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [personalBest, setPersonalBest] = useState(() => {
    try { return parseInt(localStorage.getItem('kg-nav-best') || '0', 10); } catch { return 0; }
  });
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);
  const handleAnswerRef = useRef(null);

  const startGame = useCallback(() => {
    const shuffled = shuffle(NAVIGATOR_CHALLENGES).slice(0, ROUND_SIZE);
    setQuestions(shuffled);
    setQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelected(null);
    setAnswered(false);
    setTimeLeft(TIME_PER_QUESTION);
    setResults([]);
    setView('playing');
  }, []);

  const handleAnswer = useCallback((optionIdx, timedOut = false) => {
    clearInterval(timerRef.current);
    setSelected(optionIdx);
    setAnswered(true);

    const q = questions[questionIdx];
    const correct = !timedOut && optionIdx === q.correct;

    setResults(prev => [...prev, { q, selected: optionIdx, correct, timedOut }]);

    if (correct) {
      setScore(s => {
        const ns = s + 1;
        return ns;
      });
      setStreak(s => {
        const ns = s + 1;
        setMaxStreak(m => Math.max(m, ns));
        if (ns >= 3 && onEarnBadge) onEarnBadge('streak-3');
        return ns;
      });
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      if (questionIdx + 1 >= ROUND_SIZE) {
        // End of round
        const finalScore = correct ? score + 1 : score;
        if (finalScore === ROUND_SIZE && onEarnBadge) onEarnBadge('quiz-master');
        if (onEarnBadge) onEarnBadge('challenge-taker');
        // Save personal best
        try {
          const prev = parseInt(localStorage.getItem('kg-nav-best') || '0', 10);
          if (finalScore > prev) {
            localStorage.setItem('kg-nav-best', String(finalScore));
            setPersonalBest(finalScore);
          }
        } catch {}
        setView('results');
      } else {
        setQuestionIdx(i => i + 1);
        setSelected(null);
        setAnswered(false);
        setTimeLeft(TIME_PER_QUESTION);
      }
    }, 1500);
  }, [questions, questionIdx, score, onEarnBadge]);

  // Keep ref in sync so timer can call latest version without stale closure
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  }, [handleAnswer]);

  // Timer
  useEffect(() => {
    if (view !== 'playing' || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAnswerRef.current(null, true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [view, questionIdx, answered]);

  if (view === 'intro') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true">
            <img src="./icons/game-target.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
          </div>
          <h2 className="kg-game-title">Navigator Challenges</h2>
          <p className="kg-game-subtitle">Quick-fire resilience scenarios. {ROUND_SIZE} questions, {TIME_PER_QUESTION} seconds each!</p>
          {personalBest > 0 && (
            <div className="kg-score-badge">
              <img src="./icons/badge.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              Personal Best: {personalBest}/{ROUND_SIZE}
            </div>
          )}
        </div>
        <div className="kg-intro-rules">
          <p><strong>📋 How to play:</strong></p>
          <ul>
            <li>You'll get {ROUND_SIZE} resilience scenarios</li>
            <li>You have {TIME_PER_QUESTION} seconds per question</li>
            <li>Pick the best response to each situation</li>
            <li>Build streaks for bonus encouragement!</li>
          </ul>
        </div>
        <button className="kg-spin-btn" onClick={startGame}>
          🎯 Start Challenge!
        </button>
      </div>
    );
  }

  if (view === 'results') {
    const finalScore = results.filter(r => r.correct).length;
    return (
      <div className="kg-game-container">
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true">
            <img src="./icons/game-target.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
          </div>
          <h2 className="kg-game-title">Challenge Complete!</h2>
        </div>
        <div className="kg-results-summary">
          <div className="kg-results-score">{finalScore}<span>/{ROUND_SIZE}</span></div>
          <p className="kg-results-label">
            {finalScore === ROUND_SIZE
              ? <><img src="./icons/kids-trophy.svg" alt="" aria-hidden="true" width={18} height={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />Perfect score!</>
              : finalScore >= 4 ? '🌟 Outstanding!'
              : finalScore >= 3 ? '💪 Great effort!'
              : '🌱 Keep growing!'}
          </p>
          {maxStreak >= 3 && <p className="kg-streak-note" aria-live="polite"><img src="./icons/streaks.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />Best streak: {maxStreak} in a row!</p>}
          {finalScore > personalBest && (
            <p className="kg-pb-note" aria-live="polite"><img src="./icons/badge.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />New personal best!</p>
          )}
        </div>

        {/* Review answers */}
        <div className="kg-results-review">
          {results.map((r, i) => (
            <div key={i} className={`kg-result-item ${r.correct ? 'correct' : 'incorrect'}`}>
              <div className="kg-result-q">{r.q.scenario}</div>
              <div className="kg-result-answer">
                {r.timedOut
                  ? <span className="kg-result-miss">Time ran out</span>
                  : r.correct
                    ? <span className="kg-result-correct">
                        <img src="./icons/checkmark.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                        {r.q.options[r.selected]}
                      </span>
                    : <span className="kg-result-miss">✗ {r.q.options[r.selected]}</span>
                }
              </div>
              {!r.correct && <p className="kg-result-explain">{r.q.explanation}</p>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="kg-spin-btn" onClick={startGame}>🔄 Play Again</button>
          <button className="kg-back-btn" style={{ position: 'static' }} onClick={onBack}>← Back to Games</button>
        </div>
      </div>
    );
  }

  const q = questions[questionIdx];
  const timerPct = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="kg-game-container">
      {/* HUD */}
      <div className="kg-challenge-hud">
        <div className="kg-hud-score">
          <img src="./icons/star.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {score}
        </div>
        <div className="kg-hud-progress">{questionIdx + 1}/{ROUND_SIZE}</div>
        <div className={`kg-hud-timer${timeLeft <= 5 ? ' urgent' : ''}`} aria-live="polite">
          {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div className="kg-timer-bar-wrap" role="progressbar" aria-valuenow={timeLeft} aria-valuemin={0} aria-valuemax={TIME_PER_QUESTION}>
        <div className="kg-timer-bar-fill" style={{ width: `${timerPct}%`, background: timeLeft <= 5 ? '#ef4444' : '#4f46e5' }} />
      </div>

      {/* Streak */}
      {streak >= 2 && (
        <div className="kg-streak-toast" aria-live="polite">
          <img src="./icons/streaks.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {streak} in a row!
        </div>
      )}

      {/* Question */}
      <div className="kg-challenge-card">
        <div className="kg-challenge-dimension">{q.dimension}</div>
        <p className="kg-challenge-scenario">{q.scenario}</p>

        <div className="kg-choice-grid" role="group" aria-label="Choose the best response">
          {q.options.map((opt, i) => {
            let extra = '';
            if (answered) {
              if (i === q.correct) extra = ' correct';
              else if (i === selected) extra = ' wrong';
            }
            return (
              <button
                key={i}
                className={`kg-choice-btn${selected === i && !answered ? ' selected' : ''}${extra}`}
                onClick={() => !answered && handleAnswer(i)}
                disabled={answered}
                aria-pressed={selected === i}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`kg-feedback ${selected === q.correct ? 'kg-feedback-match' : 'kg-feedback-miss'}`}
            aria-live="polite"
            role="status"
          >
            {selected === q.correct
              ? <><img src="./icons/checkmark.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Correct! {q.explanation}</>
              : `${q.explanation}`
            }
          </div>
        )}
      </div>
    </div>
  );
}
