/**
 * SessionTrendChart.jsx
 * Line chart showing session-by-session subjective and objective outcome scores.
 *
 * Props:
 *   sessions {object[]} — array of session history entries, each with:
 *     sessionNumber, sessionDate, outcomeMeasures: { subjective, objective }
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function SessionTrendChart({ sessions = [] }) {
  const data = sessions.map((s) => ({
    name:       s.sessionNumber ? `S${s.sessionNumber}` : formatDate(s.sessionDate),
    Subjective: s.outcomeMeasures?.subjective ?? null,
    Objective:  s.outcomeMeasures?.objective  ?? null,
  }));

  if (data.length === 0) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
        No session data available to chart yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} tickCount={6} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v, name) => [`${v}/10`, name]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="Subjective"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="Objective"
          stroke="#059669"
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function formatDate(dateVal) {
  if (!dateVal) return '—';
  try {
    return new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return '—';
  }
}
