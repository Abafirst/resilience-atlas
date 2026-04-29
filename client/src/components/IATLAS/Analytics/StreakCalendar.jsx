/**
 * StreakCalendar.jsx
 * GitHub-style contribution heatmap for the last 12 weeks (84 days).
 *
 * Data source: loadProgress() from gamificationHelpers — activity records
 * are grouped by calendar day to count completions.
 */

import React, { useMemo, useState } from 'react';
import { loadProgress } from '../../../utils/gamificationHelpers.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function buildDailyMap() {
  const progress = loadProgress();
  const map = {}; // { 'YYYY-MM-DD': count }

  for (const dimData of Object.values(progress)) {
    if (!dimData || typeof dimData !== 'object') continue;
    for (const record of Object.values(dimData)) {
      if (!record?.completedAt) continue;
      try {
        const key = toDateKey(new Date(record.completedAt));
        map[key] = (map[key] || 0) + 1;
      } catch {
        // skip
      }
    }
  }
  return map;
}

function buildGrid(numWeeks = 12) {
  // Build an array of 7*numWeeks days starting from the Sunday numWeeks ago
  const today = new Date();
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + (6 - today.getDay())); // end on next Saturday

  const startDate = new Date(endSunday);
  startDate.setDate(endSunday.getDate() - numWeeks * 7 + 1);

  const days = [];
  const cursor = new Date(startDate);
  while (cursor <= endSunday) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function getColor(count) {
  if (count >= 3) return '#059669'; // dark green
  if (count === 2) return '#10b981'; // medium green
  if (count === 1) return '#d1fae5'; // light green
  return '#f1f5f9'; // missed
}

function getDarkColor(count) {
  if (count >= 3) return '#059669';
  if (count === 2) return '#10b981';
  if (count === 1) return '#065f46';
  return '#1e293b';
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ date, count, style }) {
  if (!date) return null;
  const label = new Date(date).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <div style={{
      position: 'absolute',
      bottom: '125%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0f172a',
      color: '#f1f5f9',
      borderRadius: 6,
      padding: '4px 8px',
      fontSize: '.75rem',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      zIndex: 10,
      ...style,
    }}>
      {label}<br />
      <span style={{ color: '#94a3b8' }}>
        {count === 0 ? 'No activities' : `${count} activit${count === 1 ? 'y' : 'ies'}`}
      </span>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
.sc-wrapper {
  overflow-x: auto;
  padding-bottom: .25rem;
}
.sc-grid {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  grid-auto-flow: column;
  gap: 2px;
  width: max-content;
}
.sc-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: default;
  position: relative;
  transition: opacity .1s;
}
.sc-cell:hover { opacity: .8; }
.sc-month-labels {
  display: flex;
  margin-bottom: 4px;
  width: max-content;
}
.sc-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: .72rem;
  color: #64748b;
  margin-top: .5rem;
}
[data-theme="dark"] .sc-legend { color: #94a3b8; }
.sc-legend-cell {
  width: 12px; height: 12px; border-radius: 2px;
}
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function StreakCalendar() {
  const [tooltip, setTooltip] = useState(null); // { date, count, col, row }

  const { dailyMap, days } = useMemo(() => ({
    dailyMap: buildDailyMap(),
    days: buildGrid(12),
  }), []);

  const today = todayKey();
  const hasData = Object.values(dailyMap).some(v => v > 0);

  // Group days into columns (weeks), calculate month labels
  const numWeeks = Math.ceil(days.length / 7);
  const monthLabels = useMemo(() => {
    const labels = [];
    for (let col = 0; col < numWeeks; col++) {
      const dayIndex = col * 7;
      const d = days[dayIndex];
      if (!d) continue;
      const prevDay = days[Math.max(0, dayIndex - 7)];
      if (col === 0 || (prevDay && d.getMonth() !== prevDay.getMonth())) {
        labels.push({ col, label: MONTHS[d.getMonth()] });
      } else {
        labels.push({ col, label: '' });
      }
    }
    return labels;
  }, [days, numWeeks]);

  if (!hasData) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic', padding: '.5rem 0' }}>
        Complete your first activity to start your streak calendar!
      </p>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="sc-wrapper">
        {/* Month labels */}
        <div className="sc-month-labels">
          {monthLabels.map(({ col, label }) => (
            <div
              key={col}
              style={{ width: `${7 * 14}px`, fontSize: '.7rem', color: '#64748b', flexShrink: 0 }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="sc-grid" style={{ gridTemplateRows: 'repeat(7, 12px)' }}>
          {days.map((date, i) => {
            const key   = toDateKey(date);
            const count = dailyMap[key] || 0;
            const isToday = key === today;
            const col = Math.floor(i / 7);
            const row = i % 7;

            return (
              <div
                key={key}
                className="sc-cell"
                style={{
                  background: getColor(count),
                  outline: isToday ? '2px solid #6366f1' : undefined,
                  outlineOffset: 1,
                }}
                onMouseEnter={() => setTooltip({ date, count, col, row })}
                onMouseLeave={() => setTooltip(null)}
                aria-label={`${date.toLocaleDateString()}: ${count} activit${count === 1 ? 'y' : 'ies'}`}
                role="img"
              >
                {tooltip?.date === date && (
                  <Tooltip date={date} count={count} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="sc-legend">
          <span>Less</span>
          {[0, 1, 2, 3].map(c => (
            <div key={c} className="sc-legend-cell" style={{ background: getColor(c) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </>
  );
}
