import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COMPASS_WORDS } from '../../data/kidsGames';

/**
 * CompassSpinner — Ages 5–8
 * Spin the compass and match the target resilience word to earn points.
 */
export default function CompassSpinner({ onBack, onEarnBadge }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [landed, setLanded] = useState(null);
  const [target, setTarget] = useState(() => COMPASS_WORDS[Math.floor(Math.random() * COMPASS_WORDS.length)]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [matched, setMatched] = useState(0);
  const spinRef = useRef(false);

  const pickNewTarget = useCallback(() => {
    setTarget(COMPASS_WORDS[Math.floor(Math.random() * COMPASS_WORDS.length)]);
    setLanded(null);
    setFeedback(null);
  }, []);

  const spin = useCallback(() => {
    if (spinRef.current) return;
    spinRef.current = true;
    setSpinning(true);
    setLanded(null);
    setFeedback(null);

    const totalDeg = 360 * (5 + Math.floor(Math.random() * 5));
    const wordIndex = Math.floor(Math.random() * COMPASS_WORDS.length);
    const finalAngle = rotation + totalDeg + (wordIndex * (360 / COMPASS_WORDS.length));

    setRotation(finalAngle);

    setTimeout(() => {
      const word = COMPASS_WORDS[wordIndex];
      setLanded(word);
      setSpinning(false);
      spinRef.current = false;

      if (word.word === target.word) {
        setScore(s => {
          const next = s + 2;
          if (next >= 10 && onEarnBadge) onEarnBadge('word-master');
          return next;
        });
        setMatched(m => m + 1);
        setFeedback({ type: 'match', msg: `🎉 You found "${word.word}"! +2 stars!` });
        setTimeout(pickNewTarget, 1800);
      } else {
        setScore(s => s + 1);
        setFeedback({ type: 'miss', msg: `Good spin! You landed on "${word.word}". Try again to find "${target.word}"! +1 star` });
      }
    }, 3000);
  }, [rotation, target, pickNewTarget, onEarnBadge]);

  useEffect(() => {
    if (score >= 5 && onEarnBadge) onEarnBadge('spinner-first');
    if (matched >= 1 && onEarnBadge) onEarnBadge('courage-finder');
  }, [score, matched, onEarnBadge]);

  const segmentSize = 360 / COMPASS_WORDS.length;

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>

      <div className="kg-game-header">
        <div className="kg-game-emoji" aria-hidden="true">
          <img src="/icons/games/compass-spinner.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
        </div>
        <h2 className="kg-game-title">Compass Spinner</h2>
        <p className="kg-game-subtitle">Spin and find the resilience word!</p>
        <div className="kg-score-badge" aria-live="polite">
          <img src="/icons/star.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {score} stars
        </div>
      </div>

      {/* Target word */}
      <div className="kg-target-box">
        <p className="kg-target-label">Find this word:</p>
        <div className="kg-target-word" style={{ background: target.color }}>
          <span className="kg-target-emoji" aria-hidden="true">{target.emoji}</span>
          <span className="kg-target-text">{target.word}</span>
        </div>
        <p className="kg-target-hint">{target.hint}</p>
      </div>

      {/* Spinner wheel */}
      <div className="kg-spinner-wrapper" aria-label="Compass spinner wheel">
        <div
          className="kg-spinner-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
          }}
          role="img"
          aria-label="Spinning compass"
        >
          {COMPASS_WORDS.map((w, i) => (
            <div
              key={w.word}
              className="kg-spinner-segment"
              style={{
                transform: `rotate(${i * segmentSize}deg)`,
                background: w.color,
              }}
              aria-hidden="true"
            >
              <div className="kg-segment-label" style={{ transform: `rotate(${segmentSize / 2}deg) translateY(-42%)` }}>
                <span>{w.emoji}</span>
                <span className="kg-segment-word">{w.word}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="kg-spinner-needle" aria-hidden="true">▼</div>
      </div>

      {/* Spin button */}
      <button
        className="kg-spin-btn"
        onClick={spin}
        disabled={spinning}
        aria-label="Spin the compass"
      >
        {spinning ? 'Spinning…' : '🌀 Spin!'}
      </button>

      {/* Feedback */}
      {feedback && (
        <div
          className={`kg-feedback ${feedback.type === 'match' ? 'kg-feedback-match' : 'kg-feedback-miss'}`}
          aria-live="polite"
          role="status"
        >
          {feedback.msg}
        </div>
      )}

      {/* Landed word info */}
      {landed && (
        <div className="kg-landed-info" style={{ background: landed.color }} aria-live="polite">
          <strong>{landed.emoji} {landed.word}:</strong> {landed.hint}
        </div>
      )}
    </div>
  );
}
