/**
 * WeeklyXPTrend.jsx
 * Line chart showing XP earned per week for the last 12 weeks.
 *
 * Data source: loadProgress() from gamificationHelpers, grouping
 * skill-completion XP by week via completedAt timestamps.
 */

import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { loadProgress } from '../../../utils/gamificationHelpers.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekStart(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function buildWeeklyXP(numWeeks = 12) {
  const progress = loadProgress();
  const xpByWeek = {};

  // Collect all skill records
  for (const dimData of Object.values(progress)) {
    if (!dimData || typeof dimData !== 'object') continue;
    for (const record of Object.values(dimData)) {
      if (!record?.completedAt) continue;
      try {
        const d = new Date(record.completedAt);
        const ws = getWeekStart(d);
        const key = ws.getTime();
        xpByWeek[key] = (xpByWeek[key] || 0) + (record.xpEarned || 0);
      } catch {
        // skip malformed
      }
    }
  }

  // Build ordered series for the last numWeeks weeks
  const now = new Date();
  const series = [];
  for (let i = numWeeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const ws = getWeekStart(d);
    series.push({
      week: `Week of ${weekLabel(ws)}`,
      XP: xpByWeek[ws.getTime()] || 0,
    });
  }
  return series;
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '.82rem',
      boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{label}</p>
      <p style={{ margin: '2px 0 0', color: '#0097A7' }}>
        {payload[0].value} XP earned
      </p>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WeeklyXPTrend() {
  const data = useMemo(() => buildWeeklyXP(12), []);
  const hasData = data.some(d => d.XP > 0);

  if (!hasData) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic', padding: '.5rem 0' }}>
        Complete activities to see your weekly XP trend.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 5, left: -10 }}>
        <defs>
          <linearGradient id="xpLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1565C0" />
            <stop offset="100%" stopColor="#0097A7" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 10 }}
          tickFormatter={v => v.replace('Week of ', '')}
          interval="preserveStartEnd"
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="XP"
          stroke="url(#xpLineGradient)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#0097A7', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#1565C0' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
