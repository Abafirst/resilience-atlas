/**
 * ProgressRadarChart.jsx
 * Renders a radar (spider) chart comparing baseline and current dimensional
 * scores using Recharts (already a project dependency).
 *
 * Props:
 *   baseline {object} — { agenticGenerative, somaticRegulative, ... }
 *   current  {object} — same shape as baseline
 */

import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DIMENSION_LABELS = {
  agenticGenerative:    'Agentic-Generative',
  somaticRegulative:    'Somatic-Regulative',
  cognitiveNarrative:   'Cognitive-Interpretive',
  relationalConnective: 'Relational-Connective',
  emotionalAdaptive:    'Emotional-Adaptive',
  spiritualExistential: 'Spiritual-Existential',
};

const DIMENSIONS = Object.keys(DIMENSION_LABELS);

export default function ProgressRadarChart({ baseline = {}, current = {} }) {
  const data = DIMENSIONS.map((dim) => ({
    dimension: DIMENSION_LABELS[dim],
    Baseline:  baseline[dim] ?? 0,
    Current:   current[dim]  ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} tickCount={6} />
        <Radar
          name="Baseline"
          dataKey="Baseline"
          stroke="rgba(148, 163, 184, 0.9)"
          fill="rgba(148, 163, 184, 0.25)"
          strokeWidth={2}
        />
        <Radar
          name="Current"
          dataKey="Current"
          stroke="rgba(79, 70, 229, 0.9)"
          fill="rgba(79, 70, 229, 0.25)"
          strokeWidth={2}
        />
        <Tooltip formatter={(v) => `${v}`} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
