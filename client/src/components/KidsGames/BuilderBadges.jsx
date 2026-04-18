import React, { useState, useCallback } from 'react';
import { BUILDER_BADGE_CARDS } from '../../data/kidsGames';

/* ── Sub-components for each challenge type ── */

/** Quiz challenge — answer a multiple-choice question */
function QuizChallenge({ card, onComplete }) {
  const { story, prompt, options } = card.challenge;
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);

  const choose = useCallback((opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    setCorrect(opt.correct);
    if (opt.correct) {
      setTimeout(() => onComplete(), 1400);
    }
  }, [answered, onComplete]);

  return (
    <div className="kg-challenge-panel">
      {story && (
        <div className="kg-challenge-story" style={{ background: card.color, borderColor: card.border }}>
          <p style={{ margin: 0 }}>{story}</p>
        </div>
      )}
      <p className="kg-challenge-prompt">{prompt}</p>
      <div className="kg-challenge-options">
        {options.map((opt, i) => {
          let cls = 'kg-challenge-option';
          if (answered && selected === opt) cls += opt.correct ? ' correct' : ' wrong';
          if (answered && opt.correct && selected !== opt) cls += ' show-correct';
          return (
            <button
              key={i}
              className={cls}
              onClick={() => choose(opt)}
              disabled={answered}
              aria-pressed={selected === opt}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      {answered && !correct && (
        <p className="kg-challenge-try-again">
          Not quite — have another look and try again!
          <button
            className="kg-challenge-retry-btn"
            onClick={() => { setSelected(null); setAnswered(false); setCorrect(false); }}
          >
            Try Again
          </button>
        </p>
      )}
      {answered && correct && (
        <p className="kg-challenge-success"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />That's right! Earning your badge now…</p>
      )}
    </div>
  );
}

/** Pick challenge — select N items from a list */
function PickChallenge({ card, onComplete }) {
  const { prompt, options, needed } = card.challenge;
  const [picked, setPicked] = useState(new Set());
  const [done, setDone] = useState(false);

  const toggle = useCallback((id) => {
    if (done) return;
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, [done]);

  const confirm = useCallback(() => {
    if (picked.size < needed || done) return;
    setDone(true);
    setTimeout(() => onComplete(), 1200);
  }, [picked, needed, done, onComplete]);

  return (
    <div className="kg-challenge-panel">
      <p className="kg-challenge-prompt">{prompt}</p>
      <div className="kg-pick-grid">
        {options.map(opt => (
          <button
            key={opt.id}
            className={`kg-pick-option${picked.has(opt.id) ? ' selected' : ''}`}
            onClick={() => toggle(opt.id)}
            aria-pressed={picked.has(opt.id)}
            disabled={done}
            style={picked.has(opt.id) ? { borderColor: card.border, background: card.color } : {}}
          >
            {opt.text}
          </button>
        ))}
      </div>
      <p className="kg-pick-count" aria-live="polite">
        {picked.size}/{needed} selected
      </p>
      {!done && (
        <button
          className="kg-challenge-confirm-btn"
          onClick={confirm}
          disabled={picked.size < needed}
          style={{ background: picked.size >= needed ? card.border : undefined }}
        >
          Done! <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginLeft: 2 }} />
        </button>
      )}
      {done && (
        <p className="kg-challenge-success"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Awesome! Earning your badge now…</p>
      )}
    </div>
  );
}

/** Breathe challenge — tap a bubble to complete N breathing cycles */
function BreatheChallenge({ card, onComplete }) {
  const { prompt, needed } = card.challenge;
  const [phase, setPhase]       = useState('idle');   // idle | in | out
  const [count, setCount]       = useState(0);
  const [done, setDone]         = useState(false);

  const tapBubble = useCallback(() => {
    if (done) return;
    if (phase === 'idle' || phase === 'out') {
      setPhase('in');
    } else if (phase === 'in') {
      setPhase('out');
      setCount(prev => {
        const next = prev + 1;
        if (next >= needed) {
          setDone(true);
          setTimeout(() => onComplete(), 1400);
        }
        return next;
      });
    }
  }, [phase, done, needed, onComplete]);

  const bubbleLabel =
    phase === 'idle' ? 'Tap to breathe in' :
    phase === 'in'   ? 'Breathe in… now tap to breathe out' :
                       count >= needed ? 'Done!' : 'Tap to breathe in again';

  return (
    <div className="kg-challenge-panel kg-breathe-panel">
      <p className="kg-challenge-prompt">{prompt}</p>
      <button
        className={`kg-breathe-bubble${phase === 'in' ? ' expanding' : ''}`}
        onClick={tapBubble}
        aria-label={bubbleLabel}
        disabled={done}
        style={{ background: card.color, borderColor: card.border }}
      >
        <span className="kg-breathe-emoji" aria-hidden="true"><img src="/icons/breathing.svg" alt="" width={20} height={20} style={{ verticalAlign: 'middle' }} /></span>
        <span className="kg-breathe-label">{bubbleLabel}</span>
      </button>
      <p className="kg-pick-count" aria-live="polite">
        {count}/{needed} breaths completed
      </p>
      {done && (
        <p className="kg-challenge-success"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Great breathing! Earning your badge now…</p>
      )}
    </div>
  );
}

/* ── Main BuilderBadges component ── */

/**
 * BuilderBadges — Ages 5–8
 * Complete activities and challenges to earn achievement badges!
 */
export default function BuilderBadges({ onBack, onEarnBadge }) {
  const [unlocked, setUnlocked]       = useState(new Set());
  const [activeCard, setActiveCard]   = useState(null);   // card currently being challenged
  const [activeFeedback, setActiveFeedback] = useState(null);

  const startChallenge = useCallback((card) => {
    if (unlocked.has(card.id)) return;
    setActiveCard(card);
  }, [unlocked]);

  const completeChallenge = useCallback((card) => {
    setActiveCard(null);
    if (unlocked.has(card.id)) return;
    setUnlocked(prev => {
      const next = new Set(prev);
      next.add(card.id);
      return next;
    });
    setActiveFeedback(card);
    if (onEarnBadge) onEarnBadge(card.badgeId);
    setTimeout(() => setActiveFeedback(null), 2800);
  }, [unlocked, onEarnBadge]);

  const allUnlocked = unlocked.size === BUILDER_BADGE_CARDS.length;

  /* If a challenge is active, render it full-screen within the container */
  if (activeCard) {
    const ChallengeComponent =
      activeCard.challenge.type === 'quiz'    ? QuizChallenge  :
      activeCard.challenge.type === 'pick'    ? PickChallenge  :
      activeCard.challenge.type === 'breathe' ? BreatheChallenge : null;

    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={() => setActiveCard(null)} aria-label="Back to badges">
          ← Back to Badges
        </button>

        <div className="kg-game-header">
          <div
            className="kg-game-emoji"
            style={{ background: activeCard.color }}
            aria-hidden="true"
          >
            <img src={activeCard.icon} alt="" width={40} height={40} style={{ verticalAlign: 'middle' }} />
          </div>
          <h2 className="kg-game-title">{activeCard.title}</h2>
          <p className="kg-game-subtitle">{activeCard.desc}</p>
        </div>

        {ChallengeComponent && (
          <ChallengeComponent
            card={activeCard}
            onComplete={() => completeChallenge(activeCard)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>

      <div className="kg-game-header">
        <div className="kg-game-emoji" aria-hidden="true">
          <img src="/icons/star.svg" alt="" width={40} height={40} style={{ verticalAlign: 'middle' }} />
        </div>
        <h2 className="kg-game-title">Builder Badges</h2>
        <p className="kg-game-subtitle">Complete each activity to earn your badge!</p>
        <div className="kg-score-badge" aria-live="polite">
          <img src="/icons/badge.svg" alt="" aria-hidden="true" width={16} height={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {unlocked.size}/{BUILDER_BADGE_CARDS.length} earned
        </div>
      </div>

      {/* Unlock feedback toast */}
      {activeFeedback && (
        <div
          className="kg-badge-toast"
          role="status"
          aria-live="polite"
          style={{ borderColor: activeFeedback.border, background: activeFeedback.color }}
        >
          <span className="kg-badge-toast-emoji" aria-hidden="true">
            <img src={activeFeedback.icon} alt="" width={32} height={32} style={{ verticalAlign: 'middle' }} />
          </span>
          <div>
            <strong>{activeFeedback.title} badge unlocked!</strong>
            <p style={{ margin: 0, fontSize: '.85rem' }}>{activeFeedback.unlockMessage}</p>
          </div>
        </div>
      )}

      {allUnlocked && (
        <div className="kg-completion-panel" aria-live="polite">
          <div className="kg-completion-emoji" aria-hidden="true">
            <img src="/icons/kids-trophy.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
          </div>
          <h3>All badges earned!</h3>
          <p>You're a true Builder! Every challenge you completed shows how amazing you are!</p>
        </div>
      )}

      {/* Badge grid */}
      <div className="kg-badge-grid" role="list" aria-label="Builder badges to earn">
        {BUILDER_BADGE_CARDS.map(card => {
          const isUnlocked = unlocked.has(card.id);
          return (
            <button
              key={card.id}
              className={`kg-badge-card${isUnlocked ? ' kg-badge-unlocked' : ' kg-badge-locked'}`}
              style={{
                background:   isUnlocked ? card.color : '#f8fafc',
                borderColor:  isUnlocked ? card.border : '#e2e8f0',
                cursor: isUnlocked ? 'default' : 'pointer',
              }}
              onClick={() => !isUnlocked && startChallenge(card)}
              aria-label={isUnlocked
                ? `${card.title} badge — earned!`
                : `Start challenge to earn the ${card.title} badge`}
              aria-disabled={isUnlocked}
              role="listitem"
            >
              <div className="kg-badge-card-emoji" aria-hidden="true">
                {isUnlocked
                  ? <img src={card.icon} alt="" width={36} height={36} style={{ verticalAlign: 'middle' }} />
                  : <img src="/icons/lock.svg" alt="" width={36} height={36} style={{ verticalAlign: 'middle' }} />}
              </div>
              <div className="kg-badge-card-title">{card.title}</div>
              <p className="kg-badge-card-desc">
                {isUnlocked
                  ? <><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />Completed!</>
                  : card.desc}
              </p>
              {!isUnlocked && (
                <span className="kg-badge-card-cta" aria-hidden="true">
                  Tap to start →
                </span>
              )}
              {isUnlocked && (
                <span className="kg-badge-card-earned" aria-hidden="true">
                  <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Earned!
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
