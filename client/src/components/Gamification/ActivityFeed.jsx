/**
 * ActivityFeed.jsx
 * Recent activity list component showing gamification events.
 */

import React, { useMemo } from 'react';
import { timeAgo } from '../../utils/gamificationHelpers.js';

const STYLES = `
  .af-root {
    font-family: inherit;
  }

  .af-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 12px;
  }

  .af-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .af-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #e2e8f0;
    transition: background 0.15s;
  }

  .af-item:hover {
    background: #f1f5f9;
  }

  .af-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }

  .af-body {
    flex: 1;
    min-width: 0;
  }

  .af-text {
    font-size: 0.82rem;
    color: #334155;
    line-height: 1.4;
    word-break: break-word;
  }

  .af-xp {
    font-weight: 700;
    color: #059669;
  }

  .af-time {
    font-size: 0.68rem;
    color: #94a3b8;
    margin-top: 2px;
  }

  .af-empty {
    padding: 20px 0;
    text-align: center;
    color: #94a3b8;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  /* Activity type accent colors */
  .af-type-skill_complete    { border-left-color: #059669; }
  .af-type-badge_earned      { border-left-color: #7c3aed; }
  .af-type-level_up          { border-left-color: #eab308; }
  .af-type-quest_complete    { border-left-color: #4f46e5; }
  .af-type-streak_milestone  { border-left-color: #f97316; }

  /* Dark mode */
  .dark-mode .af-title { color: #f1f5f9; }
  .dark-mode .af-item { background: #1e293b; border-left-color: #334155; }
  .dark-mode .af-item:hover { background: #263145; }
  .dark-mode .af-text { color: #cbd5e1; }
  .dark-mode .af-time { color: #64748b; }
  .dark-mode .af-type-skill_complete   { border-left-color: #059669; }
  .dark-mode .af-type-badge_earned     { border-left-color: #7c3aed; }
  .dark-mode .af-type-level_up         { border-left-color: #eab308; }
  .dark-mode .af-type-quest_complete   { border-left-color: #4f46e5; }
  .dark-mode .af-type-streak_milestone { border-left-color: #f97316; }

  @media (max-width: 640px) {
    .af-item { padding: 8px 10px; }
    .af-text { font-size: 0.78rem; }
  }
`;

function formatActivity(activity) {
  const { type } = activity;
  switch (type) {
    case 'skill_complete':
      return {
        icon: '/icons/checkmark.svg',
        text: (
          <>
            Completed <strong>{activity.skillTitle || 'a skill'}</strong>
            {activity.xp > 0 && <> · <span className="af-xp">+{activity.xp} XP</span></>}
          </>
        ),
      };
    case 'badge_earned':
      return {
        icon: '/icons/badges.svg',
        text: (
          <>Badge Unlocked: <strong>{activity.badgeName || 'a badge'}</strong></>
        ),
      };
    case 'level_up':
      return {
        icon: '/icons/star.svg',
        text: (
          <>Level Up! You&apos;re now <strong>{activity.levelTitle || `Level ${activity.level}`}</strong></>
        ),
      };
    case 'quest_complete':
      return {
        icon: '/icons/quest.svg',
        text: (
          <>
            Quest Complete: <strong>{activity.questTitle || 'a quest'}</strong>
            {activity.xp > 0 && <> · <span className="af-xp">+{activity.xp} XP</span></>}
          </>
        ),
      };
    case 'streak_milestone':
      return {
        icon: activity.icon || '/icons/fire.svg',
        text: (
          <><strong>{activity.days}-Day</strong> Streak Milestone: {activity.label || ''}</>
        ),
      };
    default:
      return {
        icon: '/icons/planning.svg',
        text: <>{activity.message || 'Activity recorded'}</>,
      };
  }
}

export default function ActivityFeed({ activities = [], maxItems = 10 }) {
  const items = useMemo(() => activities.slice(0, maxItems), [activities, maxItems]);

  return (
    <div className="af-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="af-title">Recent Activity</div>

      {items.length === 0 ? (
        <div className="af-empty">
          No activity yet.<br />Complete your first skill to get started!
        </div>
      ) : (
        <ul className="af-list" aria-label="Activity feed">
          {items.map((activity, i) => {
            const { icon, text } = formatActivity(activity);
            return (
              <li
                key={activity.id || `${activity.type}-${i}`}
                className={`af-item af-type-${activity.type}`}
              >
                <span className="af-icon" aria-hidden="true">
                  {typeof icon === 'string' && icon.startsWith('/')
                    ? <img src={icon} alt="" width={18} height={18} />
                    : icon}
                </span>
                <div className="af-body">
                  <div className="af-text">{text}</div>
                  {activity.timestamp && (
                    <div className="af-time">{timeAgo(activity.timestamp)}</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
