/**
 * DimensionProgressRadar.jsx
 * Radar chart overlaying current dimension activity counts vs. 30 days ago.
 *
 * Data source: loadProgress() from gamificationHelpers; completedAt timestamps
 * are used to separate "current" (all time) from "30 days ago" (before current
 * snapshot, i.e. activities completed more than 30 days ago).
 */

import React, { useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { loadProgress } from '../../../utils/gamificationHelpers.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'agentic-generative',    label: 'Agentic' },
  { key: 'somatic-regulative',    label: 'Somatic' },
  { key: 'cognitive-narrative',   label: 'Cognitive' },
  { key: 'relational-connective', label: 'Relational' },
  { key: 'emotional-adaptive',    label: 'Emotional' },
  { key: 'spiritual-existential', label: 'Spiritual' },
];

const COLOR_CURRENT  = '#0097A7';
const COLOR_PREVIOUS = '#1565C0';

// ── Data builder ──────────────────────────────────────────────────────────────

function buildRadarData() {
  const progress = loadProgress();
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // For each dimension, count activities completed (all time) and >30 days ago
  const current  = {};
  const previous = {};

  for (const [dimKey, dimData] of Object.entries(progress)) {
    if (!dimData || typeof dimData !== 'object') continue;

    // Normalise: strip age-group prefix if present (e.g. "age-5-7/agentic-generative")
    const normalizedKey = DIMENSIONS.find(d => dimKey.includes(d.key))?.key ?? dimKey;
    if (!DIMENSIONS.find(d => d.key === normalizedKey)) continue;

    for (const record of Object.values(dimData)) {
      if (!record?.completedAt) continue;
      try {
        const t = new Date(record.completedAt).getTime();
        current[normalizedKey]  = (current[normalizedKey]  || 0) + 1;
        if (now - t > thirtyDaysMs) {
          previous[normalizedKey] = (previous[normalizedKey] || 0) + 1;
        }
      } catch {
        // skip
      }
    }
  }

  const maxVal = Math.max(
    5,
    ...Object.values(current),
    ...Object.values(previous),
  );

  return {
    radarData: DIMENSIONS.map(d => ({
      subject:  d.label,
      Current:  current[d.key]  || 0,
      Previous: previous[d.key] || 0,
      fullMark: maxVal,
    })),
    hasPreviousData: Object.values(previous).some(v => v > 0),
  };
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const cur  = payload.find(p => p.dataKey === 'Current')?.value  ?? 0;
  const prev = payload.find(p => p.dataKey === 'Previous')?.value ?? 0;
  const pct  = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '.82rem',
      boxShadow: '0 2px 8px rgba(0,0,0,.08)',
      minWidth: 150,
    }}>
      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{label}</p>
      <p style={{ margin: '3px 0 0', color: COLOR_CURRENT }}>
        Current: {cur}
      </p>
      <p style={{ margin: '2px 0 0', color: COLOR_PREVIOUS }}>
        30 days ago: {prev}
      </p>
      {pct !== null && (
        <p style={{ margin: '2px 0 0', color: pct >= 0 ? '#10b981' : '#ef4444' }}>
          {pct >= 0 ? `+${pct}%` : `${pct}%`} change
        </p>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DimensionProgressRadar() {
  const { radarData, hasPreviousData } = useMemo(() => buildRadarData(), []);
  const hasAnyData = radarData.some(d => d.Current > 0);

  if (!hasAnyData) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic', padding: '.5rem 0' }}>
        Complete activities to see your dimension progress radar.
      </p>
    );
  }

  return (
    <>
      {!hasPreviousData && (
        <p style={{
          fontSize: '.78rem', color: '#92400e',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 8, padding: '.4rem .75rem',
          marginBottom: '.75rem',
        }}>
          Complete activities for 30 days to unlock progress comparison.
        </p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '.78rem' }}
          />
          <Radar
            name="Current"
            dataKey="Current"
            stroke={COLOR_CURRENT}
            fill={COLOR_CURRENT}
            fillOpacity={0.6}
          />
          {hasPreviousData && (
            <Radar
              name="30 Days Ago"
              dataKey="Previous"
              stroke={COLOR_PREVIOUS}
              fill={COLOR_PREVIOUS}
              fillOpacity={0.4}
              strokeDasharray="5 3"
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </>
  );
}
