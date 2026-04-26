/**
 * OverviewTab.jsx
 * Overview tab for the Analytics Dashboard.
 *
 * Shows:
 *  - Key metric cards (families, children, activities, stars)
 *  - Active vs completed protocols (pie chart)
 *  - Weekly engagement trend (line chart)
 *  - Recent milestones (timeline)
 */

import React, { useMemo } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from './MetricCard.jsx';
import ChartCard from './ChartCard.jsx';
import {
  computeOverviewMetrics,
  buildOverallEngagementSeries,
  buildProtocolCompletionData,
  generateSampleEngagementData,
  formatShortDate,
} from '../../../utils/analyticsHelpers.js';

const COLORS = ['#10b981', '#6366f1', '#e2e8f0'];

// ── Recent milestones timeline ────────────────────────────────────────────────

const TIMELINE_STYLES = `
.ov-timeline {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.ov-milestone {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
}
.ov-milestone-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #6366f1;
  margin-top: .3rem;
  flex-shrink: 0;
}
.ov-milestone-time {
  font-size: .75rem;
  color: #94a3b8;
  white-space: nowrap;
  min-width: 56px;
}
.ov-milestone-text {
  font-size: .85rem;
  color: #334155;
}
[data-theme="dark"] .ov-milestone-text { color: #cbd5e1; }
.ov-empty {
  font-size: .85rem;
  color: #94a3b8;
  font-style: italic;
  padding: .5rem 0;
}
`;

function buildMilestones(profiles, rangeKey) {
  const milestones = [];
  for (const profile of profiles) {
    try {
      const key = `iatlas_progress_${profile.id}_progress`;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const progress = JSON.parse(raw);
      for (const [id, rec] of Object.entries(progress)) {
        if (rec?.completedAt) {
          milestones.push({
            date:  new Date(rec.completedAt),
            child: profile.name,
            label: id.split('/').pop().replace(/-/g, ' '),
            stars: rec.stars || 0,
          });
        }
      }
    } catch { /* skip */ }
  }
  return milestones
    .sort((a, b) => b.date - a.date)
    .slice(0, 6);
}

function timeAgo(date) {
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return formatShortDate(date);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OverviewTab({ profiles = [], rangeKey = '30d', loading }) {
  const hasSampleMode = profiles.length === 0;

  const metrics = useMemo(
    () => computeOverviewMetrics(profiles, rangeKey),
    [profiles, rangeKey],
  );

  const engagementData = useMemo(() => {
    if (hasSampleMode) return generateSampleEngagementData(8);
    return buildOverallEngagementSeries(profiles, rangeKey);
  }, [profiles, rangeKey, hasSampleMode]);

  const protocolData = useMemo(
    () => hasSampleMode
      ? [
          { name: 'Completed (★★★)', value: 12, color: '#10b981' },
          { name: 'In Progress',     value: 8,  color: '#6366f1' },
          { name: 'Not Started',     value: 5,  color: '#e2e8f0' },
        ]
      : buildProtocolCompletionData(profiles),
    [profiles, hasSampleMode],
  );

  const milestones = useMemo(
    () => hasSampleMode ? [] : buildMilestones(profiles, rangeKey),
    [profiles, rangeKey, hasSampleMode],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TIMELINE_STYLES }} />

      {hasSampleMode && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
          padding: '.6rem 1rem', marginBottom: '1.25rem',
          fontSize: '.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '.5rem',
        }} role="status">
          <span aria-hidden="true">📊</span>
          Showing sample data — add child profiles to see real analytics.
        </div>
      )}

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <MetricCard
          icon="👨‍👩‍👧‍👦"
          title="Total Families"
          value={hasSampleMode ? 4 : metrics.totalFamilies}
          subtitle="tracked in IATLAS"
          color="#6366f1"
          tooltip="Total number of child profiles registered across all families."
        />
        <MetricCard
          icon="👶"
          title="Active Children"
          value={hasSampleMode ? 3 : metrics.activeChildren}
          subtitle={`in the last ${rangeKey === '7d' ? '7 days' : rangeKey === '30d' ? '30 days' : rangeKey === '90d' ? '90 days' : 'year'}`}
          color="#10b981"
          tooltip="Children who completed at least one activity in the selected date range."
        />
        <MetricCard
          icon="✅"
          title="Activities Completed"
          value={hasSampleMode ? 47 : metrics.totalActivities}
          subtitle="across all children"
          color="#3b82f6"
          tooltip="Total activities completed by all children in the selected date range."
        />
        <MetricCard
          icon="⭐"
          title="Total Stars Earned"
          value={hasSampleMode ? 112 : metrics.totalStars}
          subtitle="from completed activities"
          color="#f59e0b"
          tooltip="Total star ratings accumulated from all completed activities."
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

        <ChartCard
          title="Weekly Engagement Trend"
          subtitle="Activities completed per week"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={engagementData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
                cursor={{ stroke: '#6366f1', strokeDasharray: '4 2' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Activities"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Protocol Status"
          subtitle="Activity completion breakdown"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={protocolData}
                cx="50%"
                cy="50%"
                outerRadius={85}
                innerRadius={48}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {protocolData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent milestones */}
      <ChartCard
        title="Recent Milestones"
        subtitle="Latest activities completed by children"
        loading={loading}
        minHeight="120px"
      >
        <div className="ov-timeline" role="list" aria-label="Recent milestones">
          {milestones.length === 0 ? (
            <p className="ov-empty">
              {hasSampleMode
                ? 'Add child profiles and complete activities to see milestones here.'
                : 'No activities completed in this date range yet.'}
            </p>
          ) : (
            milestones.map((m, i) => (
              <div key={i} className="ov-milestone" role="listitem">
                <div className="ov-milestone-dot" aria-hidden="true" />
                <span className="ov-milestone-time">{timeAgo(m.date)}</span>
                <span className="ov-milestone-text">
                  <strong>{m.child}</strong> completed&nbsp;
                  <em>{m.label}</em>
                  {m.stars > 0 && <span aria-label={`${m.stars} stars`}> {'⭐'.repeat(m.stars)}</span>}
                </span>
              </div>
            ))
          )}
        </div>
      </ChartCard>
    </>
  );
}
