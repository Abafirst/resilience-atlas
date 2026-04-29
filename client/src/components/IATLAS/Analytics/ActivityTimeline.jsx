/**
 * ActivityTimeline.jsx
 * Vertical chronological timeline of the last 30 days of completed activities.
 *
 * Data source: loadProgress() from gamificationHelpers — all skill records with
 * completedAt timestamps, enriched with dimension and XP info.
 */

import React, { useMemo } from 'react';
import { loadProgress } from '../../../utils/gamificationHelpers.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSION_MAP = {
  'agentic-generative':    { label: 'Agentic',    color: '#6366f1' },
  'somatic-regulative':    { label: 'Somatic',    color: '#f59e0b' },
  'cognitive-narrative':   { label: 'Cognitive',  color: '#3b82f6' },
  'relational-connective': { label: 'Relational', color: '#10b981' },
  'emotional-adaptive':    { label: 'Emotional',  color: '#ef4444' },
  'spiritual-existential': { label: 'Spiritual',  color: '#8b5cf6' },
};

const DEFAULT_DIM = { label: 'General', color: '#6b7280' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function normaliseDimension(dimKey) {
  for (const [key, cfg] of Object.entries(DIMENSION_MAP)) {
    if (dimKey === key || dimKey.includes(key)) return cfg;
  }
  return DEFAULT_DIM;
}

function formatActivityName(skillId) {
  // skillId is typically something like "emotional-adaptive/skill-name-here"
  const part = skillId.includes('/') ? skillId.split('/').pop() : skillId;
  return part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDateTime(date) {
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatDateHeader(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function toDateKey(date) {
  return date.toDateString();
}

function buildTimeline() {
  const progress = loadProgress();
  const cutoff   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const entries  = [];

  for (const [dimKey, dimData] of Object.entries(progress)) {
    if (!dimData || typeof dimData !== 'object') continue;
    for (const [skillId, record] of Object.entries(dimData)) {
      if (!record?.completedAt) continue;
      try {
        const date = new Date(record.completedAt);
        if (date < cutoff) continue;
        entries.push({
          date,
          name:      formatActivityName(skillId),
          dimension: normaliseDimension(dimKey),
          xp:        record.xpEarned || 0,
        });
      } catch {
        // skip
      }
    }
  }

  // Sort newest first
  entries.sort((a, b) => b.date - a.date);

  // Group by date
  const groups = [];
  let currentKey = null;
  let current    = null;
  for (const entry of entries) {
    const key = toDateKey(entry.date);
    if (key !== currentKey) {
      current = { header: formatDateHeader(entry.date), items: [] };
      groups.push(current);
      currentKey = key;
    }
    current.items.push(entry);
  }
  return groups;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
.at-scroll {
  max-height: 600px;
  overflow-y: auto;
  padding-right: .25rem;
}
.at-date-header {
  font-size: .75rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: .05em;
  margin: 1rem 0 .5rem;
}
.at-date-header:first-child { margin-top: 0; }
.at-entry {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .7rem .85rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: .5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow .15s;
}
.at-entry:hover { box-shadow: 0 3px 8px rgba(0,0,0,.08); }
[data-theme="dark"] .at-entry {
  background: #1e293b;
  border-color: #334155;
  box-shadow: none;
}
.at-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  margin-top: .35rem;
  flex-shrink: 0;
}
.at-body { flex: 1; min-width: 0; }
.at-time {
  font-size: .72rem;
  color: #94a3b8;
  margin-bottom: .15rem;
}
.at-name {
  font-size: .88rem;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 340px;
}
[data-theme="dark"] .at-name { color: #f1f5f9; }
.at-badges {
  display: flex;
  gap: .35rem;
  margin-top: .3rem;
  flex-wrap: wrap;
}
.at-badge {
  font-size: .7rem;
  font-weight: 600;
  padding: .15rem .5rem;
  border-radius: 20px;
  color: #fff;
  white-space: nowrap;
}
.at-xp-badge {
  font-size: .7rem;
  font-weight: 700;
  padding: .15rem .45rem;
  border-radius: 20px;
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
  white-space: nowrap;
}
[data-theme="dark"] .at-xp-badge {
  background: #14532d;
  color: #86efac;
  border-color: #15803d;
}
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActivityTimeline() {
  const groups = useMemo(() => buildTimeline(), []);
  const isEmpty = groups.length === 0;

  if (isEmpty) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic', padding: '.5rem 0' }}>
        Complete your first activity to see your timeline!
      </p>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="at-scroll">
        {groups.map((group, gi) => (
          <div key={gi}>
            <div className="at-date-header">{group.header}</div>
            {group.items.map((item, ii) => (
              <div key={ii} className="at-entry">
                <div
                  className="at-dot"
                  style={{ background: item.dimension.color }}
                  aria-hidden="true"
                />
                <div className="at-body">
                  <div className="at-time">{formatDateTime(item.date)}</div>
                  <div className="at-name">{item.name}</div>
                  <div className="at-badges">
                    <span
                      className="at-badge"
                      style={{ background: item.dimension.color }}
                    >
                      {item.dimension.label}
                    </span>
                    {item.xp > 0 && (
                      <span className="at-xp-badge">+{item.xp} XP</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
