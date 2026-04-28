/**
 * SkillDevelopmentTab.jsx
 * Skill Development tab for the Analytics Dashboard.
 *
 * Shows:
 *  - Skill category stacked bar chart
 *  - Learning velocity metric
 *  - Developmental domain heatmap
 *  - Milestone achievement timeline
 */

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import MetricCard from './MetricCard.jsx';
import {
  buildDimensionBreakdown,
  buildSkillMasterySeries,
  calculateLearningVelocity,
  rangeToStartDate,
  DIMENSION_COLORS,
  DIMENSION_LABELS,
} from '../../../utils/analyticsHelpers.js';

const VELOCITY_DESCRIPTIONS = {
  high:   'Excellent pace — child is consistently engaged.',
  medium: 'Good progress — regular engagement observed.',
  low:    'Slow pace — consider encouraging more frequent sessions.',
};

// ── Heatmap component ─────────────────────────────────────────────────────────

const HEATMAP_STYLES = `
.sd-heatmap {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.sd-heatmap-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  cursor: default;
  transition: opacity .15s;
  position: relative;
}
.sd-heatmap-cell:hover { opacity: .75; }
.sd-heatmap-label-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-top: 4px;
}
.sd-heatmap-label {
  font-size: .68rem;
  color: #94a3b8;
  text-align: center;
}
.sd-legend {
  display: flex;
  align-items: center;
  gap: .5rem;
  margin-top: .75rem;
  flex-wrap: wrap;
}
.sd-legend-item {
  display: flex;
  align-items: center;
  gap: .3rem;
  font-size: .78rem;
  color: #64748b;
}
.sd-legend-dot {
  width: 12px; height: 12px;
  border-radius: 3px;
}
`;

function DomainHeatmap({ data }) {
  const dims = Object.keys(DIMENSION_LABELS).filter(k => k !== 'general');
  const maxCount = Math.max(1, ...data.map(d => d.count));

  const getOpacity = (count) => {
    if (!count) return 0.08;
    return 0.2 + (count / maxCount) * 0.8;
  };

  const getColor = (dim) => DIMENSION_COLORS[dim] || '#6366f1';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HEATMAP_STYLES }} />
      <div role="list" aria-label="Domain activity heatmap">
        <div className="sd-heatmap">
          {dims.map(dim => {
            const entry  = data.find(d => {
              const key = Object.keys(DIMENSION_LABELS).find(k => DIMENSION_LABELS[k] === d.dimension);
              return key === dim;
            });
            const count  = entry?.count || 0;
            const color  = getColor(dim);
            const label  = DIMENSION_LABELS[dim];
            return (
              <div
                key={dim}
                className="sd-heatmap-cell"
                style={{ background: color, opacity: getOpacity(count) }}
                title={`${label}: ${count} activities`}
                role="listitem"
                aria-label={`${label}: ${count} activities`}
              />
            );
          })}
        </div>
        <div className="sd-heatmap-label-row" aria-hidden="true">
          {dims.map(dim => (
            <div key={dim} className="sd-heatmap-label">{DIMENSION_LABELS[dim]}</div>
          ))}
        </div>
        <div className="sd-legend" aria-hidden="true">
          <span className="sd-legend-item">
            <span className="sd-legend-dot" style={{ background: '#6366f1', opacity: 0.1 }} />
            None
          </span>
          <span className="sd-legend-item">
            <span className="sd-legend-dot" style={{ background: '#6366f1', opacity: 0.5 }} />
            Some
          </span>
          <span className="sd-legend-item">
            <span className="sd-legend-dot" style={{ background: '#6366f1' }} />
            High
          </span>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SkillDevelopmentTab({ profiles = [], selectedProfileId = 'all', rangeKey = '30d', loading }) {
  const hasSampleMode = profiles.length === 0;

  const selectedProfiles = useMemo(() => {
    if (selectedProfileId === 'all') return profiles;
    return profiles.filter(p => p.id === selectedProfileId);
  }, [profiles, selectedProfileId]);

  const primaryProfile = selectedProfiles[0];

  const dimBreakdown = useMemo(() => {
    if (hasSampleMode) {
      const dims = Object.values(DIMENSION_LABELS).filter(d => d !== 'General');
      return dims.map(d => ({
        dimension: d,
        count: Math.floor(Math.random() * 12) + 1,
        color: Object.values(DIMENSION_COLORS)[Object.values(DIMENSION_LABELS).indexOf(d)] || '#6366f1',
      }));
    }
    if (!primaryProfile) return [];
    return buildDimensionBreakdown(primaryProfile.id, rangeKey);
  }, [primaryProfile, rangeKey, hasSampleMode]);

  const stackedData = useMemo(() => {
    if (hasSampleMode) {
      const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8'];
      const dims  = ['Agentic', 'Relational', 'Somatic', 'Cognitive'];
      return weeks.map(w => {
        const entry = { week: w };
        dims.forEach(d => { entry[d] = Math.floor(Math.random() * 4); });
        return entry;
      });
    }
    if (!primaryProfile) return [];
    return buildSkillMasterySeries(primaryProfile.id, rangeToStartDate(rangeKey));
  }, [primaryProfile, rangeKey, hasSampleMode]);

  const velocity = useMemo(() => {
    if (hasSampleMode) return 3.5;
    if (!primaryProfile) return 0;
    return calculateLearningVelocity(primaryProfile.id, rangeKey);
  }, [primaryProfile, rangeKey, hasSampleMode]);

  const velocityLevel = velocity >= 5 ? 'high' : velocity >= 2 ? 'medium' : 'low';
  const velocityColor = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' }[velocityLevel];

  const stackedDims = hasSampleMode
    ? ['Agentic', 'Relational', 'Somatic', 'Cognitive']
    : [...new Set(stackedData.flatMap(d => Object.keys(d).filter(k => k !== 'week')))];

  const dimColorMap = {};
  Object.keys(DIMENSION_LABELS).forEach(key => {
    dimColorMap[DIMENSION_LABELS[key]] = DIMENSION_COLORS[key];
  });

  return (
    <>
      {/* Learning velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <MetricCard
          icon="/icons/strength.svg"
          title="Learning Velocity"
          value={velocity}
          subtitle="activities / week"
          color={velocityColor}
          tooltip="Average number of activities completed per week in the selected range."
        />
        <MetricCard
          icon="/icons/cognitive-narrative.svg"
          title="Active Domains"
          value={hasSampleMode ? 5 : dimBreakdown.length}
          subtitle="of 6 resilience domains"
          color="#8b5cf6"
          tooltip="Number of resilience domains with at least one completed activity."
        />
        <MetricCard
          icon="/icons/trophy.svg"
          title="Velocity Insight"
          value={velocityLevel.charAt(0).toUpperCase() + velocityLevel.slice(1)}
          subtitle={VELOCITY_DESCRIPTIONS[velocityLevel]}
          color={velocityColor}
          tooltip="Qualitative classification of the learning velocity."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1rem', marginBottom: '1rem' }}>

        {/* Stacked bar chart */}
        <ChartCard
          title="Skill Categories Over Time"
          subtitle="Weekly breakdown by resilience domain"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stackedData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              {stackedDims.map((dim, i) => (
                <Bar
                  key={dim}
                  dataKey={dim}
                  stackId="a"
                  fill={dimColorMap[dim] || Object.values(DIMENSION_COLORS)[i % Object.keys(DIMENSION_COLORS).length]}
                  radius={i === stackedDims.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Dimension bar */}
        <ChartCard
          title="Domain Activity Breakdown"
          subtitle="Total activities per resilience domain"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={dimBreakdown}
              margin={{ top: 5, right: 24, bottom: 5, left: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="dimension" width={72} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="count" name="Activities" radius={[0, 6, 6, 0]}>
                {dimBreakdown.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Heatmap */}
      <ChartCard
        title="Developmental Domain Heatmap"
        subtitle="Activity intensity per resilience domain"
        loading={loading}
        minHeight="120px"
      >
        <DomainHeatmap data={dimBreakdown} />
      </ChartCard>
    </>
  );
}
