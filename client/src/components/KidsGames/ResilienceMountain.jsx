import React, { useState, useCallback } from 'react';
import { MOUNTAIN_PEAKS } from '../../data/kidsGames';

/**
 * ResilienceMountain — Ages 8–12
 * Climb a visual mountain with 6 peaks (one per dimension).
 */
export default function ResilienceMountain({ onBack, onEarnBadge }) {
  const [peakProgress, setPeakProgress] = useState(() =>
    Object.fromEntries(MOUNTAIN_PEAKS.map(p => [p.id, { completed: new Set(), level: 0 }]))
  );
  const [activePeak, setActivePeak] = useState(null);
  const [allSummits, setAllSummits] = useState(new Set());

  const completeActivity = useCallback((peakId, activity) => {
    setPeakProgress(prev => {
      const peak = prev[peakId];
      if (peak.completed.has(activity.id)) return prev;

      const nextCompleted = new Set(peak.completed);
      nextCompleted.add(activity.id);
      const nextLevel = nextCompleted.size;

      // Earn badge if it's the final activity on this peak
      if (activity.badge && onEarnBadge) {
        onEarnBadge(activity.badge);
        // Track summits
        setAllSummits(s => {
          const next = new Set(s);
          next.add(peakId);
          if (next.size === MOUNTAIN_PEAKS.length && onEarnBadge) {
            onEarnBadge('summit-legend');
          }
          return next;
        });
      }

      if (nextLevel === 1 && onEarnBadge) onEarnBadge('climber');

      return { ...prev, [peakId]: { completed: nextCompleted, level: nextLevel } };
    });
  }, [onEarnBadge]);

  return (
    <div className="kg-game-container">
      <button
        className="kg-back-btn"
        onClick={activePeak ? () => setActivePeak(null) : onBack}
        aria-label={activePeak ? 'Back to mountain' : 'Back to games'}
      >
        ← {activePeak ? 'Mountain' : 'Back'}
      </button>

      {!activePeak ? (
        <>
          <div className="kg-game-header">
            <div className="kg-game-emoji" aria-hidden="true">🏔️</div>
            <h2 className="kg-game-title">Resilience Mountain</h2>
            <p className="kg-game-subtitle">Climb each peak and reach the summit!</p>
            <div className="kg-score-badge" aria-live="polite">
              🏔️ {allSummits.size}/{MOUNTAIN_PEAKS.length} peaks summited
            </div>
          </div>

          {/* Mountain visual */}
          <div className="kg-mountain-grid" role="list" aria-label="Six resilience peaks to climb">
            {MOUNTAIN_PEAKS.map(peak => {
              const progress = peakProgress[peak.id];
              const levelPct = Math.round((progress.level / peak.totalLevels) * 100);
              const isSummited = allSummits.has(peak.id);

              return (
                <button
                  key={peak.id}
                  className={`kg-peak-card${isSummited ? ' kg-peak-summited' : ''}`}
                  style={{ background: peak.color, borderColor: peak.accentColor }}
                  onClick={() => setActivePeak(peak)}
                  role="listitem"
                  aria-label={`${peak.name} — ${progress.level}/${peak.totalLevels} activities done`}
                >
                  <div className="kg-peak-emoji" aria-hidden="true">{peak.emoji}</div>
                  <div className="kg-peak-name">{peak.name}</div>
                  <div className="kg-peak-char" style={{ color: peak.accentColor }}>{peak.character}</div>
                  <div className="kg-peak-progress-wrap">
                    <div
                      className="kg-peak-progress-fill"
                      style={{ width: `${levelPct}%`, background: peak.accentColor }}
                    />
                  </div>
                  <div className="kg-peak-level">{progress.level}/{peak.totalLevels}</div>
                  {isSummited && <div className="kg-peak-summit-flag" aria-hidden="true">🚩</div>}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        /* Peak detail view */
        <div className="kg-peak-detail">
          <div className="kg-peak-detail-header" style={{ background: activePeak.color }}>
            <span className="kg-peak-detail-emoji" aria-hidden="true">{activePeak.emoji}</span>
            <div>
              <h2 className="kg-peak-detail-name">{activePeak.name}</h2>
              <p className="kg-peak-detail-char" style={{ color: activePeak.accentColor }}>{activePeak.character}</p>
            </div>
          </div>

          <p className="kg-peak-intro">
            Complete each activity to climb higher! Reach the summit to earn a badge.
          </p>

          <div className="kg-peak-activities" role="list" aria-label={`Activities for ${activePeak.name}`}>
            {activePeak.activities.map((activity, i) => {
              const progress = peakProgress[activePeak.id];
              const isDone = progress.completed.has(activity.id);
              const isLocked = i > 0 && !progress.completed.has(activePeak.activities[i - 1].id);

              return (
                <div
                  key={activity.id}
                  className={`kg-activity-step${isDone ? ' done' : isLocked ? ' locked' : ''}`}
                  role="listitem"
                >
                  <div className="kg-activity-step-num" style={{ background: isDone ? activePeak.accentColor : '#e2e8f0' }}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div className="kg-activity-step-content">
                    <p className="kg-activity-step-title">{activity.title}</p>
                    {activity.badge && (
                      <span className="kg-activity-badge-label">🏅 Badge reward</span>
                    )}
                  </div>
                  {!isDone && !isLocked && (
                    <button
                      className="kg-activity-complete-btn"
                      style={{ background: activePeak.accentColor }}
                      onClick={() => completeActivity(activePeak.id, activity)}
                      aria-label={`Mark "${activity.title}" as done`}
                    >
                      Done! ✓
                    </button>
                  )}
                  {isLocked && <span className="kg-activity-locked" aria-label="Locked">🔒</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
