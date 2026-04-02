import React, { useState, useCallback } from 'react';
import { BUILDER_BADGE_CARDS } from '../../data/kidsGames';

/**
 * BuilderBadges — Ages 5–8
 * Tap badges to unlock them and collect achievements.
 */
export default function BuilderBadges({ onBack, onEarnBadge }) {
  const [unlocked, setUnlocked] = useState(new Set());
  const [activeFeedback, setActiveFeedback] = useState(null);

  const unlockBadge = useCallback((card) => {
    if (unlocked.has(card.id)) return;
    setUnlocked(prev => {
      const next = new Set(prev);
      next.add(card.id);
      return next;
    });
    setActiveFeedback(card);
    if (onEarnBadge) onEarnBadge(card.badgeId);
    setTimeout(() => setActiveFeedback(null), 2500);
  }, [unlocked, onEarnBadge]);

  const allUnlocked = unlocked.size === BUILDER_BADGE_CARDS.length;

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>

      <div className="kg-game-header">
        <div className="kg-game-emoji" aria-hidden="true">🌟</div>
        <h2 className="kg-game-title">Builder Badges</h2>
        <p className="kg-game-subtitle">Tap a badge to earn it! Collect them all!</p>
        <div className="kg-score-badge" aria-live="polite">🏅 {unlocked.size}/{BUILDER_BADGE_CARDS.length} badges</div>
      </div>

      {/* Unlock feedback toast */}
      {activeFeedback && (
        <div className="kg-badge-toast" role="status" aria-live="polite" style={{ borderColor: activeFeedback.border, background: activeFeedback.color }}>
          <span className="kg-badge-toast-emoji" aria-hidden="true">{activeFeedback.emoji}</span>
          <div>
            <strong>{activeFeedback.title} badge unlocked!</strong>
            <p style={{ margin: 0, fontSize: '.85rem' }}>{activeFeedback.unlockMessage}</p>
          </div>
        </div>
      )}

      {allUnlocked && (
        <div className="kg-completion-panel" aria-live="polite">
          <div className="kg-completion-emoji" aria-hidden="true">🏆</div>
          <h3>All badges collected!</h3>
          <p>You're a true Builder! Every badge you earned shows how amazing you are! ✨</p>
        </div>
      )}

      {/* Badge grid */}
      <div className="kg-badge-grid" role="list" aria-label="Builder badges to collect">
        {BUILDER_BADGE_CARDS.map(card => {
          const isUnlocked = unlocked.has(card.id);
          return (
            <button
              key={card.id}
              className={`kg-badge-card${isUnlocked ? ' kg-badge-unlocked' : ''}`}
              style={{
                background: isUnlocked ? card.color : '#f8fafc',
                borderColor: isUnlocked ? card.border : '#e2e8f0',
              }}
              onClick={() => unlockBadge(card)}
              aria-label={isUnlocked ? `${card.title} badge — earned!` : `Tap to earn the ${card.title} badge`}
              aria-pressed={isUnlocked}
              role="listitem"
            >
              <div className="kg-badge-card-emoji" aria-hidden="true">
                {isUnlocked ? card.emoji : '🔒'}
              </div>
              <div className="kg-badge-card-title">{card.title}</div>
              <p className="kg-badge-card-desc">{card.desc}</p>
              {isUnlocked && (
                <span className="kg-badge-card-earned" aria-hidden="true">✓ Earned!</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
