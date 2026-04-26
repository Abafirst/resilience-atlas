/**
 * ComparativeAnalyticsTab.jsx
 * Comparative Analytics tab for the IATLAS Analytics Dashboard.
 *
 * Shows:
 *  - Cross-child grouped bar chart
 *  - Age-adjusted benchmark comparison
 *  - Family engagement comparison
 *  - Protocol effectiveness metrics
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import MetricCard from './MetricCard.jsx';
import {
  buildComparativeDimensionData,
  calculateLearningVelocity,
  rangeToStartDate,
  getActivitiesInRange,
  DIMENSION_LABELS,
  generateSampleDimensionData,
} from '../../../utils/analyticsHelpers.js';

const CHILD_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ── Engagement comparison table ───────────────────────────────────────────────

const TABLE_STYLES = `
.ca-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.ca-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .85rem;
}
.ca-table th, .ca-table td {
  padding: .6rem .9rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}
[data-theme="dark"] .ca-table th,
[data-theme="dark"] .ca-table td {
  border-color: #334155;
}
.ca-table th {
  font-weight: 700;
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: #64748b;
  background: #f8fafc;
}
[data-theme="dark"] .ca-table th {
  background: #0f172a;
  color: #94a3b8;
}
.ca-table tr:hover td {
  background: #f8fafc;
}
[data-theme="dark"] .ca-table tr:hover td {
  background: #1e293b;
}
.ca-table td { color: #334155; }
[data-theme="dark"] .ca-table td { color: #cbd5e1; }
.ca-badge {
  display: inline-block;
  padding: .15rem .5rem;
  border-radius: 999px;
  font-size: .72rem;
  font-weight: 700;
}
.ca-badge-high   { background: #d1fae5; color: #065f46; }
.ca-badge-medium { background: #fef3c7; color: #92400e; }
.ca-badge-low    { background: #fee2e2; color: #991b1b; }
[data-theme="dark"] .ca-badge-high   { background: #064e3b; color: #a7f3d0; }
[data-theme="dark"] .ca-badge-medium { background: #78350f; color: #fde68a; }
[data-theme="dark"] .ca-badge-low    { background: #7f1d1d; color: #fca5a5; }
`;

function EngagementTable({ profiles, rangeKey }) {
  const rows = useMemo(() => {
    return profiles.map((profile, i) => {
      const startDate    = rangeToStartDate(rangeKey);
      const acts         = getActivitiesInRange(profile.id, startDate);
      const velocity     = calculateLearningVelocity(profile.id, rangeKey);
      const engagement   = velocity >= 5 ? 'high' : velocity >= 2 ? 'medium' : 'low';
      const color        = CHILD_COLORS[i % CHILD_COLORS.length];
      return { profile, acts: acts.length, velocity, engagement, color };
    });
  }, [profiles, rangeKey]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TABLE_STYLES }} />
      <div className="ca-table-wrap">
        <table className="ca-table" aria-label="Family engagement comparison">
          <thead>
            <tr>
              <th scope="col">Child</th>
              <th scope="col">Activities</th>
              <th scope="col">Velocity (act/wk)</th>
              <th scope="col">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ profile, acts, velocity, engagement, color }) => (
              <tr key={profile.id}>
                <td>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10,
                    borderRadius: '50%', background: color, marginRight: 6,
                  }} aria-hidden="true" />
                  {profile.name}
                </td>
                <td>{acts}</td>
                <td>{velocity}</td>
                <td>
                  <span className={`ca-badge ca-badge-${engagement}`}>
                    {engagement.charAt(0).toUpperCase() + engagement.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                  No data available for the selected range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ComparativeAnalyticsTab({ profiles = [], rangeKey = '30d', loading }) {
  const hasSampleMode = profiles.length === 0;

  const sampleNames = ['Child A', 'Child B', 'Child C'];

  const comparativeData = useMemo(() => {
    if (hasSampleMode) return generateSampleDimensionData(sampleNames);
    return buildComparativeDimensionData(profiles, rangeKey);
  }, [profiles, rangeKey, hasSampleMode]);

  const profileNames = hasSampleMode ? sampleNames : profiles.map(p => p.name);

  // Total activities per child (for simple bar)
  const totalsByChild = useMemo(() => {
    if (hasSampleMode) {
      return sampleNames.map((name, i) => ({
        name,
        activities: Math.floor(Math.random() * 20) + 5,
        color: CHILD_COLORS[i % CHILD_COLORS.length],
      }));
    }
    const startDate = rangeToStartDate(rangeKey);
    return profiles.map((p, i) => ({
      name:  p.name,
      activities: getActivitiesInRange(p.id, startDate).length,
      color: CHILD_COLORS[i % CHILD_COLORS.length],
    }));
  }, [profiles, rangeKey, hasSampleMode]);

  return (
    <>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <MetricCard
          icon="👥"
          title="Children Compared"
          value={hasSampleMode ? 3 : profiles.length}
          subtitle="active child profiles"
          color="#6366f1"
          tooltip="Number of children included in this comparative analysis."
        />
        <MetricCard
          icon="📊"
          title="Domains Analyzed"
          value={6}
          subtitle="resilience dimensions"
          color="#10b981"
          tooltip="All 6 resilience domains are included in comparative charts."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1rem', marginBottom: '1rem' }}>

        {/* Cross-child total activities bar */}
        <ChartCard
          title="Activity Count Per Child"
          subtitle={`Total activities in the selected date range`}
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={totalsByChild} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="activities" name="Activities" radius={[6, 6, 0, 0]}>
                {totalsByChild.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color || CHILD_COLORS[i % CHILD_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Grouped bar per domain */}
        <ChartCard
          title="Cross-Child Domain Comparison"
          subtitle="Activities completed per domain per child"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparativeData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dimension" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              {profileNames.map((name, i) => (
                <Bar
                  key={name}
                  dataKey={name}
                  fill={CHILD_COLORS[i % CHILD_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Engagement comparison table */}
      <ChartCard
        title="Family Engagement Comparison"
        subtitle="Activity rates and engagement levels per child"
        loading={loading}
        minHeight="80px"
      >
        {hasSampleMode ? (
          <div style={{ color: '#94a3b8', fontSize: '.85rem', fontStyle: 'italic', padding: '.5rem 0' }}>
            Add child profiles to see the engagement comparison table.
          </div>
        ) : (
          <EngagementTable profiles={profiles} rangeKey={rangeKey} />
        )}
      </ChartCard>
    </>
  );
}
