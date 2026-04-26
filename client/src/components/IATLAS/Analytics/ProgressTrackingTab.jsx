/**
 * ProgressTrackingTab.jsx
 * Progress Tracking tab for the Analytics Dashboard.
 *
 * Shows:
 *  - Multi-line progress chart (one line per child)
 *  - Protocol completion horizontal bar chart
 *  - Skill mastery radar chart
 *  - Session/activity area chart
 */

import React, { useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard.jsx';
import {
  buildMultiChildProgressSeries,
  buildWeeklyEngagementSeries,
  buildRadarData,
  buildDimensionBreakdown,
  rangeToStartDate,
  generateSampleProgressData,
  generateSampleRadarData,
  DIMENSION_COLORS,
  DIMENSION_LABELS,
} from '../../../utils/analyticsHelpers.js';

const CHILD_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ProgressTrackingTab({ profiles = [], selectedProfileId = 'all', rangeKey = '30d', loading }) {
  const hasSampleMode = profiles.length === 0;

  const selectedProfiles = useMemo(() => {
    if (selectedProfileId === 'all') return profiles;
    return profiles.filter(p => p.id === selectedProfileId);
  }, [profiles, selectedProfileId]);

  const progressData = useMemo(() => {
    if (hasSampleMode) return generateSampleProgressData(['Child A', 'Child B', 'Child C'], 8);
    return buildMultiChildProgressSeries(selectedProfiles, rangeKey);
  }, [selectedProfiles, rangeKey, hasSampleMode]);

  const profileNames = hasSampleMode
    ? ['Child A', 'Child B', 'Child C']
    : selectedProfiles.map(p => p.name);

  const singleProfile = selectedProfiles.length === 1 ? selectedProfiles[0] : null;

  const radarData = useMemo(() => {
    if (hasSampleMode) return generateSampleRadarData();
    if (!singleProfile) return [];
    return buildRadarData(singleProfile.id, rangeToStartDate(rangeKey));
  }, [singleProfile, rangeKey, hasSampleMode]);

  const dimBreakdown = useMemo(() => {
    if (hasSampleMode) {
      const dims = ['Agentic', 'Relational', 'Somatic', 'Cognitive', 'Emotional', 'Spiritual'];
      return dims.map(d => ({
        dimension: d,
        count: Math.floor(Math.random() * 10) + 1,
        color: '#6366f1',
      }));
    }
    const pid = singleProfile?.id || (selectedProfiles[0]?.id);
    if (!pid) return [];
    return buildDimensionBreakdown(pid, rangeKey);
  }, [singleProfile, selectedProfiles, rangeKey, hasSampleMode]);

  const areaData = useMemo(() => {
    if (hasSampleMode) return generateSampleProgressData(['Activities'], 8).map(d => ({ ...d, activities: d['Activities'] }));
    const pid = singleProfile?.id || selectedProfiles[0]?.id;
    if (!pid) return [];
    const startDate = rangeToStartDate(rangeKey);
    return buildWeeklyEngagementSeries(pid, startDate).map(d => ({ ...d, activities: d.count }));
  }, [singleProfile, selectedProfiles, rangeKey, hasSampleMode]);

  return (
    <>
      {/* Multi-child progress lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1rem', marginBottom: '1rem' }}>

        <ChartCard
          title="Child Progress Over Time"
          subtitle="Activities completed per week per child"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={progressData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              {profileNames.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={CHILD_COLORS[i % CHILD_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Skill mastery radar */}
        <ChartCard
          title="Skill Mastery Radar"
          subtitle={singleProfile ? `${singleProfile.name}'s domain balance` : 'Select a single child for radar view'}
          loading={loading}
        >
          {(radarData.length > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 9 }} />
                <Radar
                  name="Activities"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Legend />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, color: '#94a3b8', fontSize: '.9rem', fontStyle: 'italic' }}>
              Select a single child to view radar chart
            </div>
          )}
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1rem' }}>

        {/* Dimension breakdown horizontal bar */}
        <ChartCard
          title="Protocol Completion by Domain"
          subtitle="Activities completed per resilience dimension"
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
                  <cell key={`cell-${i}`} fill={entry.color || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Session frequency area chart */}
        <ChartCard
          title="Session Frequency"
          subtitle="Activity volume over time"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={areaData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: '.85rem', border: '1px solid #e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="activities"
                name="Activities"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
