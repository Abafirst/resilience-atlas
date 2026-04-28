/**
 * OverviewTab.jsx
 * Overview tab for the Analytics Dashboard.
 *
 * Shows:
 *  - Key metric cards (total XP, activities, badges, streak)
 *  - Dimension completion counts (bar chart)
 *  - XP trend (line chart)
 *  - Recent milestones (timeline)
 *
 * Data source: prefers the server-side `/api/iatlas/analytics/overview`
 * endpoint when an Auth0 token is available, falls back to localStorage.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricCard from './MetricCard.jsx';
import ChartCard from './ChartCard.jsx';
import { getAuth0CachedToken } from '../../../lib/apiFetch.js';
import {
  computeOverviewMetrics,
  buildOverallEngagementSeries,
  generateSampleEngagementData,
  formatShortDate,
} from '../../../utils/analyticsHelpers.js';

const DIM_SHORT = {
  'agentic-generative':    'Agentic',
  'somatic-regulative':    'Somatic',
  'cognitive-narrative':   'Cognitive',
  'relational-connective': 'Relational',
  'emotional-adaptive':    'Emotional',
  'spiritual-existential': 'Spiritual',
};

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

function buildMilestones(profiles) {
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

// ── API fetch helper ──────────────────────────────────────────────────────────

async function fetchOverview(rangeKey, childProfileId) {
  const token = getAuth0CachedToken();
  if (!token) return null;

  const params = new URLSearchParams({ rangeKey });
  if (childProfileId && childProfileId !== 'all') {
    params.set('childProfileId', childProfileId);
  }

  try {
    const res = await fetch(`/api/iatlas/analytics/overview?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.overview || null;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OverviewTab({ profiles = [], selectedProfileId = 'all', rangeKey = '30d', loading }) {
  const [serverOverview, setServerOverview] = useState(null);
  const [fetchingServer, setFetchingServer] = useState(false);

  // Fetch server-side overview whenever rangeKey or selectedProfileId changes
  useEffect(() => {
    let cancelled = false;
    setFetchingServer(true);
    fetchOverview(rangeKey, selectedProfileId).then(data => {
      if (!cancelled) {
        setServerOverview(data);
        setFetchingServer(false);
      }
    });
    return () => { cancelled = true; };
  }, [rangeKey, selectedProfileId]);

  const hasSampleMode = profiles.length === 0;

  // Prefer server data; fall back to local computation
  const localMetrics = useMemo(
    () => computeOverviewMetrics(profiles, rangeKey),
    [profiles, rangeKey],
  );

  const totalXP         = serverOverview?.totalXP          ?? localMetrics.totalXP       ?? 0;
  const totalActivities = serverOverview?.totalActivities   ?? localMetrics.totalActivities ?? 0;
  const totalBadges     = serverOverview?.totalBadges       ?? localMetrics.totalBadges    ?? 0;
  const currentStreak   = serverOverview?.currentStreak     ?? localMetrics.currentStreak  ?? 0;

  // XP trend: server-provided array or fall back to local engagement series
  const xpTrendData = useMemo(() => {
    if (serverOverview?.xpTrend?.length) {
      return serverOverview.xpTrend.map(entry => ({
        week: entry.date.slice(5), // 'MM-DD'
        XP:   entry.xp,
      }));
    }
    if (hasSampleMode) return generateSampleEngagementData(8).map(d => ({ ...d, XP: d.Activities * 25 }));
    return buildOverallEngagementSeries(profiles, rangeKey).map(d => ({ ...d, XP: (d.Activities || 0) * 25 }));
  }, [serverOverview, profiles, rangeKey, hasSampleMode]);

  // Dimension completion chart data
  const dimensionData = useMemo(() => {
    const dp = serverOverview?.dimensionProgress ?? localMetrics.dimensionProgress ?? {};
    return Object.entries(DIM_SHORT).map(([key, label]) => ({
      name:  label,
      Count: dp[key] || 0,
    }));
  }, [serverOverview, localMetrics]);

  const milestones = useMemo(
    () => hasSampleMode ? [] : buildMilestones(profiles),
    [profiles, hasSampleMode],
  );

  const isLoading = loading || fetchingServer;

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
          icon="⚡"
          title="Total XP"
          value={hasSampleMode ? 1250 : totalXP}
          subtitle="experience points earned"
          color="#6366f1"
          tooltip="Total XP accumulated across all activities and badges."
        />
        <MetricCard
          icon="✅"
          title="Activities Completed"
          value={hasSampleMode ? 47 : totalActivities}
          subtitle="across all children"
          color="#10b981"
          tooltip="Total activities completed by all children."
        />
        <MetricCard
          icon="🏅"
          title="Badges Earned"
          value={hasSampleMode ? 8 : totalBadges}
          subtitle="milestone badges unlocked"
          color="#f59e0b"
          tooltip="Total badge milestones unlocked."
        />
        <MetricCard
          icon="🔥"
          title="Current Streak"
          value={hasSampleMode ? 5 : currentStreak}
          subtitle="consecutive active days"
          color="#ef4444"
          tooltip="Longest current daily activity streak."
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

        <ChartCard
          title="XP Trend"
          subtitle={`XP earned over the last ${rangeKey}`}
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={xpTrendData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
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
                dataKey="XP"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Dimension Progress"
          subtitle="Activities completed per dimension"
          loading={isLoading}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dimensionData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent milestones */}
      <ChartCard
        title="Recent Milestones"
        subtitle="Latest activities completed by children"
        loading={isLoading}
        minHeight="120px"
      >
        <div className="ov-timeline" role="list" aria-label="Recent milestones">
          {milestones.length === 0 ? (
            <p className="ov-empty">
              {hasSampleMode
                ? 'Add child profiles and complete activities to see milestones here.'
                : 'No recent milestones found.'}
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
