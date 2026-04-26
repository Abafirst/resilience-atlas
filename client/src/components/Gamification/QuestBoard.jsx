/**
 * QuestBoard.jsx
 * Quest management board with available, active, and completed sections.
 */

import React, { useMemo } from 'react';
import { ALL_QUESTS } from '../../data/gamification/quests.js';

const TYPE_META = {
  sprint:  { icon: '/icons/game-target.svg', label: 'Sprint', color: '#f97316' },
  monthly: { icon: '/icons/game-mountain.svg', label: 'Monthly', color: '#4f46e5' },
  epic:    { icon: '/icons/star.svg', label: 'Epic', color: '#eab308' },
};

const STYLES = `
  .qb-root {
    font-family: inherit;
  }

  .qb-section {
    margin-bottom: 24px;
  }

  .qb-section-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .qb-section-count {
    font-size: 0.72rem;
    font-weight: 600;
    background: #e2e8f0;
    color: #64748b;
    padding: 2px 8px;
    border-radius: 999px;
  }

  .qb-empty {
    font-size: 0.82rem;
    color: #94a3b8;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    text-align: center;
  }

  .qb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .qb-card {
    background: #fff;
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
    box-sizing: border-box;
  }

  .qb-card-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
  }

  .qb-type-badge {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 7px;
    border-radius: 999px;
    color: #fff;
    flex-shrink: 0;
    align-self: flex-start;
    margin-top: 2px;
  }

  .qb-card-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .qb-card-meta {
    flex: 1;
    min-width: 0;
  }

  .qb-card-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.3;
    margin-bottom: 2px;
  }

  .qb-card-desc {
    font-size: 0.77rem;
    color: #64748b;
    line-height: 1.4;
  }

  .qb-rewards {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    margin-bottom: 10px;
  }

  .qb-reward-pill {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: #f0fdf4;
    color: #059669;
    border: 1px solid #bbf7d0;
  }

  .qb-duration-pill {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: #eff6ff;
    color: #3b82f6;
    border: 1px solid #bfdbfe;
  }

  .qb-start-btn {
    width: 100%;
    padding: 8px 0;
    border-radius: 8px;
    border: none;
    background: #4f46e5;
    color: #fff;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    letter-spacing: 0.02em;
  }

  .qb-start-btn:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  .qb-abandon-btn {
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid #fca5a5;
    background: transparent;
    color: #ef4444;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .qb-abandon-btn:hover {
    background: #fef2f2;
  }

  .qb-progress-track {
    width: 100%;
    height: 6px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    margin-top: 6px;
  }

  .qb-progress-fill {
    height: 100%;
    background: #4f46e5;
    border-radius: 999px;
    transition: width 0.6s ease;
  }

  .qb-active-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .qb-time-left {
    font-size: 0.72rem;
    color: #64748b;
  }

  .qb-completed-date {
    font-size: 0.68rem;
    color: #94a3b8;
    margin-top: 4px;
  }

  .qb-completed-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #059669;
    background: #f0fdf4;
    border-radius: 999px;
    padding: 2px 8px;
    margin-top: 4px;
  }

  /* Dark mode */
  .dark-mode .qb-section-title { color: #f1f5f9; }
  .dark-mode .qb-section-count { background: #334155; color: #94a3b8; }
  .dark-mode .qb-card { background: #1e293b; border-color: #334155; }
  .dark-mode .qb-card-title { color: #f1f5f9; }
  .dark-mode .qb-card-desc { color: #94a3b8; }
  .dark-mode .qb-empty { background: #1e293b; }
  .dark-mode .qb-progress-track { background: #334155; }
  .dark-mode .qb-reward-pill { background: #064e3b; color: #6ee7b7; border-color: #065f46; }
  .dark-mode .qb-duration-pill { background: #1e3a5f; color: #93c5fd; border-color: #1e40af; }
  .dark-mode .qb-time-left { color: #94a3b8; }
  .dark-mode .qb-abandon-btn { border-color: #7f1d1d; color: #f87171; }
  .dark-mode .qb-abandon-btn:hover { background: #1c0404; }

  @media (max-width: 640px) {
    .qb-grid { grid-template-columns: 1fr; }
    .qb-card { padding: 12px; }
  }
`;

function daysRemaining(startedAt, duration) {
  if (!startedAt) return duration;
  const started = new Date(startedAt).getTime();
  const expires = started + duration * 86400000;
  const remaining = Math.ceil((expires - Date.now()) / 86400000);
  return Math.max(0, remaining);
}

function progressPercent(quest) {
  if (!quest.progress) return 0;
  const { current = 0, target = 1, percentage } = quest.progress;
  if (typeof percentage === 'number') return percentage;
  return Math.min(100, Math.round((current / Math.max(1, target)) * 100));
}

export default function QuestBoard({ activeQuests = [], completedQuests = [], onStartQuest, onAbandonQuest }) {
  const activeIds = useMemo(
    () => new Set([...activeQuests, ...completedQuests].map(q => q.questId || q.id)),
    [activeQuests, completedQuests]
  );

  const availableQuests = useMemo(
    () => ALL_QUESTS.filter(q => !activeIds.has(q.id)),
    [activeIds]
  );

  function renderQuestCard(quest, mode, activeData) {
    const tm = TYPE_META[quest.type] || TYPE_META.sprint;
    const pct = mode === 'active' ? progressPercent(activeData || quest) : 0;
    const daysLeft = mode === 'active' ? daysRemaining(activeData?.startedAt, quest.duration) : null;

    return (
      <div className="qb-card" key={quest.id}>
        <div className="qb-card-header">
          <span className="qb-card-icon" aria-hidden="true">
            <img src={quest.icon || tm.icon} alt="" width={24} height={24} />
          </span>
          <div className="qb-card-meta">
            <div className="qb-card-title">{quest.title}</div>
            <div className="qb-card-desc">{quest.description}</div>
          </div>
          <span className="qb-type-badge" style={{ background: tm.color }}>{tm.label}</span>
        </div>

        <div className="qb-rewards">
          <span className="qb-duration-pill">⏱ {quest.duration}d</span>
          {quest.rewards?.xp > 0 && (
            <span className="qb-reward-pill">+{quest.rewards.xp} XP</span>
          )}
          {quest.rewards?.badge && (
            <span className="qb-reward-pill">
              <img src="/icons/badges.svg" alt="" width={12} height={12} aria-hidden="true" /> Badge
            </span>
          )}
        </div>

        {mode === 'available' && onStartQuest && (
          <button
            className="qb-start-btn"
            onClick={() => onStartQuest(quest.id)}
          >
            Start Quest
          </button>
        )}

        {mode === 'active' && (
          <>
            <div className="qb-progress-track">
              <div className="qb-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="qb-active-footer">
              <span className="qb-time-left">
                {daysLeft !== null ? `${daysLeft} days left` : ''}
              </span>
              {onAbandonQuest && (
                <button
                  className="qb-abandon-btn"
                  onClick={() => onAbandonQuest(activeData?.questId || quest.id)}
                >
                  Abandon
                </button>
              )}
            </div>
          </>
        )}

        {mode === 'completed' && (
          <>
            <span className="qb-completed-badge">
              <img src="/icons/checkmark.svg" alt="" width={12} height={12} aria-hidden="true" /> Completed
            </span>
            {activeData?.completedAt && (
              <div className="qb-completed-date">
                {new Date(activeData.completedAt).toLocaleDateString()}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="qb-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="qb-section">
        <div className="qb-section-title">
          <img src="/icons/game-target.svg" alt="" width={16} height={16} aria-hidden="true" />
          Available Quests
          <span className="qb-section-count">{availableQuests.length}</span>
        </div>
        {availableQuests.length === 0 ? (
          <div className="qb-empty">All quests started or completed!</div>
        ) : (
          <div className="qb-grid">
            {availableQuests.map(q => renderQuestCard(q, 'available', null))}
          </div>
        )}
      </div>

      <div className="qb-section">
        <div className="qb-section-title">
          <img src="/icons/streaks.svg" alt="" width={16} height={16} aria-hidden="true" />
          Active Quests
          <span className="qb-section-count">{activeQuests.length}</span>
        </div>
        {activeQuests.length === 0 ? (
          <div className="qb-empty">No active quests. Start one above!</div>
        ) : (
          <div className="qb-grid">
            {activeQuests.map(aq => {
              const template = ALL_QUESTS.find(q => q.id === (aq.questId || aq.id)) || aq;
              return renderQuestCard(template, 'active', aq);
            })}
          </div>
        )}
      </div>

      {completedQuests.length > 0 && (
        <div className="qb-section">
          <div className="qb-section-title">
            <img src="/icons/kids-trophy.svg" alt="" width={16} height={16} aria-hidden="true" />
            Completed
            <span className="qb-section-count">{completedQuests.length}</span>
          </div>
          <div className="qb-grid">
            {completedQuests.map(cq => {
              const template = ALL_QUESTS.find(q => q.id === (cq.questId || cq.id)) || cq;
              return renderQuestCard(template, 'completed', cq);
            })}
          </div>
        </div>
      )}
    </div>
  );
}
