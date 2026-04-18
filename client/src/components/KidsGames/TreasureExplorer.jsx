import React, { useState, useCallback } from 'react';
import { TREASURE_ISLANDS } from '../../data/kidsGameQuests';

/**
 * TreasureExplorer — Ages 8–12
 * Explore islands, complete challenges, unlock story treasures.
 */
export default function TreasureExplorer({ onBack, onEarnBadge }) {
  const [view, setView] = useState('map'); // 'map' | 'island' | 'treasure'
  const [activeIsland, setActiveIsland] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(new Set());
  const [showTreasure, setShowTreasure] = useState(false);

  const enterIsland = useCallback((island) => {
    setActiveIsland(island);
    setSelectedAnswer(null);
    setAnswerChecked(false);
    setShowTreasure(false);
    setView('island');
  }, []);

  const checkAnswer = useCallback(() => {
    setAnswerChecked(true);
    if (selectedAnswer === activeIsland.challengeCorrect) {
      // Correct!
      setTimeout(() => {
        // Compute new unlocked state synchronously so we can determine which
        // badges to award OUTSIDE the state updater (calling onEarnBadge inside
        // a state updater function is an anti-pattern that prevents the modal
        // from appearing).
        const newUnlocked = new Set(unlocked);
        newUnlocked.add(activeIsland.id);
        setUnlocked(newUnlocked);

        if (onEarnBadge) {
          // Collect badges to earn as a Set to avoid duplicates
          const badgesToEarn = new Set();
          if (newUnlocked.size === 1) badgesToEarn.add('treasure-hunter');
          if (newUnlocked.size === TREASURE_ISLANDS.length) badgesToEarn.add('treasure-master');
          if (activeIsland.badge) badgesToEarn.add(activeIsland.badge);
          badgesToEarn.forEach(b => onEarnBadge(b));
        }
        setShowTreasure(true);
      }, 1000);
    }
  }, [selectedAnswer, activeIsland, onEarnBadge, unlocked]);

  if (view === 'map') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true"><img src="/icons/games/treasure-explorer.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} /></div>
          <h2 className="kg-game-title">Treasure Explorer</h2>
          <p className="kg-game-subtitle">Explore islands and find hidden story treasures!</p>
          <div className="kg-score-badge" aria-live="polite"><img src="/icons/games/treasure-explorer.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />{unlocked.size}/{TREASURE_ISLANDS.length} treasures found</div>
        </div>

        <div className="kg-island-grid" role="list" aria-label="Islands to explore">
          {TREASURE_ISLANDS.map(island => {
            const isUnlocked = unlocked.has(island.id);
            return (
              <button
                key={island.id}
                className={`kg-island-card${isUnlocked ? ' kg-island-done' : ''}`}
                style={{ background: island.color, borderColor: island.accentColor }}
                onClick={() => enterIsland(island)}
                role="listitem"
                aria-label={`${island.name} — ${isUnlocked ? 'treasure found!' : 'explore to find treasure'}`}
              >
                <div className="kg-island-emoji" aria-hidden="true"><img src={island.icon} alt="" width={24} height={24} style={{ verticalAlign: 'middle' }} /></div>
                <div className="kg-island-name">{island.name}</div>
                <div className="kg-island-dim" style={{ color: island.accentColor }}>{island.dimension}</div>
                {isUnlocked
                  ? <div className="kg-island-unlocked" aria-hidden="true"><img src="/icons/games/treasure-explorer.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />Treasure Found!</div>
                  : <div className="kg-island-hint">Tap to explore →</div>
                }
              </button>
            );
          })}
        </div>

        {unlocked.size === TREASURE_ISLANDS.length && (
          <div className="kg-completion-panel">
            <div className="kg-completion-emoji" aria-hidden="true"><img src="/icons/kids-trophy.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} /></div>
            <h3>All treasures found!</h3>
            <p>You're a legendary Treasure Explorer! You've discovered the wisdom of all four islands!</p>
          </div>
        )}
      </div>
    );
  }

  const isUnlocked = unlocked.has(activeIsland.id);
  const isCorrect = answerChecked && selectedAnswer === activeIsland.challengeCorrect;
  const isWrong = answerChecked && selectedAnswer !== activeIsland.challengeCorrect;

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={() => setView('map')} aria-label="Back to map">← Map</button>

      <div className="kg-island-header" style={{ background: activeIsland.color }}>
        <span className="kg-island-header-emoji" aria-hidden="true"><img src={activeIsland.icon} alt="" width={24} height={24} style={{ verticalAlign: 'middle' }} /></span>
        <div>
          <h2 className="kg-island-header-name">{activeIsland.name}</h2>
          <p style={{ fontSize: '.82rem', color: activeIsland.accentColor, margin: 0 }}>{activeIsland.dimension}</p>
        </div>
      </div>

      <p className="kg-island-desc">{activeIsland.description}</p>

      {showTreasure ? (
        <div className="kg-treasure-reveal" style={{ borderColor: activeIsland.accentColor }}>
          <div className="kg-treasure-icon" aria-hidden="true"><img src="/icons/games/treasure-explorer.svg" alt="" width={32} height={32} style={{ verticalAlign: 'middle' }} /></div>
          <h3 className="kg-treasure-title">Treasure Unlocked!</h3>
          <p className="kg-treasure-story-title"><strong>{activeIsland.treasureTitle}</strong></p>
          <p className="kg-treasure-preview">{activeIsland.treasurePreview}</p>
          <button
            className="kg-advance-btn"
            style={{ background: activeIsland.accentColor }}
            onClick={() => setView('map')}
          >
            <img src="/icons/game-map.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
            Back to Map
          </button>
        </div>
      ) : (
        <>
          <div className="kg-challenge-box" style={{ borderColor: activeIsland.accentColor }}>
            <p className="kg-challenge-label">{activeIsland.challenge}</p>
            <p className="kg-challenge-question">{activeIsland.challengeQuestion}</p>
            <div className="kg-choice-grid" role="group" aria-label="Answer the challenge">
              {activeIsland.challengeOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`kg-choice-btn${selectedAnswer === i ? ' selected' : ''}${answerChecked && i === activeIsland.challengeCorrect ? ' correct' : ''}${answerChecked && selectedAnswer === i && i !== activeIsland.challengeCorrect ? ' wrong' : ''}`}
                  onClick={() => !answerChecked && setSelectedAnswer(i)}
                  aria-pressed={selectedAnswer === i}
                  disabled={answerChecked && isCorrect}
                >
                  {opt}
                </button>
              ))}
            </div>

            {isCorrect && (
              <div className="kg-feedback kg-feedback-match" role="status" aria-live="polite">
                That's right! You're unlocking the treasure now…
              </div>
            )}
            {isWrong && (
              <div className="kg-feedback kg-feedback-miss" role="status" aria-live="polite">
                Not quite! Try again — you can do it!
              </div>
            )}
          </div>

          {!answerChecked && selectedAnswer !== null && (
            <button
              className="kg-advance-btn"
              style={{ background: activeIsland.accentColor }}
              onClick={checkAnswer}
            >
              Check Answer
            </button>
          )}
          {isWrong && (
            <button
              className="kg-advance-btn"
              style={{ background: activeIsland.accentColor }}
              onClick={() => { setSelectedAnswer(null); setAnswerChecked(false); }}
            >
              Try Again →
            </button>
          )}
        </>
      )}
    </div>
  );
}
