import React, { useState, useCallback } from 'react';
import { MAP_ITEMS } from '../../data/kidsGames';

/**
 * MapCollector — Ages 5–8
 * Tap glowing items scattered on a resilience-themed map.
 */
export default function MapCollector({ onBack, onEarnBadge }) {
  const [collected, setCollected] = useState(new Set());
  const [lastCollected, setLastCollected] = useState(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const tapItem = useCallback((item) => {
    if (collected.has(item.id)) return;

    // Compute new collected state synchronously so we can fire onEarnBadge
    // OUTSIDE the state updater (calling it inside causes the modal to not appear).
    const newCollected = new Set(collected);
    newCollected.add(item.id);
    const newSize = newCollected.size;

    setCollected(newCollected);
    setLastCollected(item);
    setScore(s => s + 1);

    if (newSize === 1 && onEarnBadge) onEarnBadge('map-starter');
    if (newSize >= MAP_ITEMS.length) {
      if (onEarnBadge) onEarnBadge('map-master');
      setCompleted(true);
    }

    // Check if all helpers found
    const helperIds = MAP_ITEMS.filter(i => i.id.startsWith('helper')).map(i => i.id);
    const allHelpers = helperIds.every(id => newCollected.has(id));
    if (allHelpers && onEarnBadge) onEarnBadge('helper-finder');
  }, [collected, onEarnBadge]);

  const reset = useCallback(() => {
    setCollected(new Set());
    setLastCollected(null);
    setScore(0);
    setCompleted(false);
  }, []);

  const progress = Math.round((collected.size / MAP_ITEMS.length) * 100);

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>

      <div className="kg-game-header">
        <div className="kg-game-emoji" aria-hidden="true">
          <img src="./icons/game-map.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} />
        </div>
        <h2 className="kg-game-title">Map Collector</h2>
        <p className="kg-game-subtitle">Tap the glowing items to collect them all!</p>
        <div className="kg-score-badge" aria-live="polite">
          <img src="./icons/game-map.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 3 }} />
          {collected.size}/{MAP_ITEMS.length} collected
        </div>
      </div>

      {/* Progress bar */}
      <div className="kg-progress-bar-wrap" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Map progress">
        <div className="kg-progress-bar-fill" style={{ width: `${progress}%` }} />
        <span className="kg-progress-label">{progress}% Complete</span>
      </div>

      {completed ? (
        <div className="kg-completion-panel">
          <div className="kg-completion-emoji" aria-hidden="true">🎉</div>
          <h3>You completed the map!</h3>
          <p>Amazing explorer! You found every item. You're a true Resilience Map Master! 🏅</p>
          <button className="kg-spin-btn" onClick={reset}>Play Again!</button>
        </div>
      ) : (
        <>
          {/* Map area */}
          <div
            className="kg-map-area"
            role="region"
            aria-label="Resilience map with collectible items"
          >
            {/* Decorative background elements */}
            <div className="kg-map-bg-deco" aria-hidden="true">
              <span className="kg-deco-tree" style={{ left: '5%', top: '10%' }}>🌲</span>
              <span className="kg-deco-tree" style={{ left: '90%', top: '5%' }}>🌳</span>
              <span className="kg-deco-tree" style={{ left: '48%', top: '45%' }}>🌿</span>
              <span className="kg-deco-river" style={{ left: '25%', top: '50%' }}>🌊</span>
              <span className="kg-deco-mountain" style={{ left: '75%', top: '40%' }}>⛰️</span>
              <span className="kg-deco-sun" style={{ left: '50%', top: '2%' }}>☀️</span>
            </div>

            {MAP_ITEMS.map(item => {
              const isCollected = collected.has(item.id);
              return (
                <button
                  key={item.id}
                  className={`kg-map-item${isCollected ? ' collected' : ' glowing'}`}
                  style={{ left: `${item.x}%`, top: `${item.y}%`, background: item.color }}
                  onClick={() => tapItem(item)}
                  aria-label={isCollected ? `${item.label} — collected!` : `Tap to collect: ${item.label}`}
                  aria-pressed={isCollected}
                  disabled={isCollected}
                >
                  <span className="kg-map-item-emoji" aria-hidden="true">{item.emoji}</span>
                  {isCollected && <span className="kg-map-item-check" aria-hidden="true"><img src="./icons/checkmark.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle' }} /></span>}
                </button>
              );
            })}
          </div>

          {/* Last collected */}
          {lastCollected && (
            <div
              className="kg-landed-info"
              style={{ background: lastCollected.color }}
              aria-live="polite"
              role="status"
            >
              <strong>{lastCollected.emoji} Found: {lastCollected.label}!</strong>
              <br />
              <span style={{ fontSize: '.82rem', color: '#334155' }}>{lastCollected.dimension}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
