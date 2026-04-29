/**
 * PersonalAnalyticsTab.jsx
 * Advanced Personal Analytics for the IATLAS Complete tier ($99.99/mo).
 *
 * Displays a 2×2 grid of:
 *  - Weekly XP Trend (line chart)
 *  - Dimension Progress Radar (radar chart, current vs 30 days ago)
 *  - Streak Calendar Heatmap (GitHub-style contribution graph)
 *  - Activity Timeline (chronological list, last 30 days)
 *
 * Access: Complete, Practitioner, Practice, or Enterprise tier only.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ChartCard from './ChartCard.jsx';
import WeeklyXPTrend from './WeeklyXPTrend.jsx';
import DimensionProgressRadar from './DimensionProgressRadar.jsx';
import StreakCalendar from './StreakCalendar.jsx';
import ActivityTimeline from './ActivityTimeline.jsx';
import { hasCompleteAccess } from '../../../utils/iatlasGating.js';

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
.pat-header {
  margin-bottom: 1.25rem;
}
.pat-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 .2rem;
}
[data-theme="dark"] .pat-title { color: #f1f5f9; }
.pat-subtitle {
  font-size: .85rem;
  color: #64748b;
  margin: 0;
}
.pat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}
.pat-export-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: .75rem;
}
.pat-export-btn {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: .35rem .85rem;
  font-size: .8rem;
  color: #64748b;
  cursor: pointer;
  transition: background .15s, color .15s;
  position: relative;
}
.pat-export-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}
[data-theme="dark"] .pat-export-btn {
  border-color: #334155;
  color: #94a3b8;
}
[data-theme="dark"] .pat-export-btn:hover {
  background: #334155;
  color: #f1f5f9;
}
.pat-tooltip-popup {
  position: absolute;
  bottom: calc(100% + 6px);
  right: 0;
  background: #0f172a;
  color: #f1f5f9;
  font-size: .72rem;
  border-radius: 6px;
  padding: 4px 8px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
}

/* ── Upsell card ── */
.pat-upsell {
  border-radius: 20px;
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #a78bfa 100%);
  padding: 2.5rem 2rem;
  color: #fff;
  text-align: center;
  max-width: 600px;
  margin: 2rem auto;
}
.pat-upsell-icon { font-size: 2.8rem; margin-bottom: .75rem; }
.pat-upsell-title { font-size: 1.35rem; font-weight: 800; margin: 0 0 .5rem; }
.pat-upsell-body  { font-size: .9rem; opacity: .9; margin: 0 0 1.25rem; line-height: 1.6; }
.pat-upsell-features {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.pat-upsell-feature {
  background: rgba(255,255,255,.15);
  border-radius: 20px;
  padding: .3rem .75rem;
  font-size: .8rem;
  font-weight: 600;
}
.pat-upsell-cta {
  display: inline-block;
  background: #fff;
  color: #7c3aed;
  font-weight: 800;
  font-size: .95rem;
  border-radius: 10px;
  padding: .65rem 1.5rem;
  text-decoration: none;
  transition: opacity .15s;
}
.pat-upsell-cta:hover { opacity: .9; }
`;

// ── Upsell card ───────────────────────────────────────────────────────────────

function UpsellCard() {
  return (
    <div className="pat-upsell" role="region" aria-label="Upgrade to Complete">
      <div className="pat-upsell-icon" aria-hidden="true">🏆</div>
      <h2 className="pat-upsell-title">Unlock Advanced Analytics</h2>
      <p className="pat-upsell-body">
        Deep insights into your resilience journey are available on the
        <strong> IATLAS Complete</strong> plan&nbsp;($99.99/mo).
        Track weekly XP trends, compare dimension growth over time, and
        visualise your daily activity streaks.
      </p>
      <div className="pat-upsell-features">
        {[
          'Weekly XP Trend',
          'Dimension Radar',
          'Streak Heatmap',
          'Activity Timeline',
        ].map(f => (
          <span key={f} className="pat-upsell-feature">{f}</span>
        ))}
      </div>
      <Link to="/iatlas" className="pat-upsell-cta">
        Upgrade to Complete →
      </Link>
    </div>
  );
}

// ── Export button ─────────────────────────────────────────────────────────────

function ExportButton() {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      className="pat-export-btn"
      aria-label="Export analytics report (coming soon)"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {}}
    >
      <img src="/icons/journal.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} />
      Export Report
      {hovered && (
        <span className="pat-tooltip-popup" role="tooltip">Coming soon</span>
      )}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PersonalAnalyticsTab() {
  const canAccess = hasCompleteAccess();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {!canAccess ? (
        <UpsellCard />
      ) : (
        <>
          <div className="pat-header">
            <h2 className="pat-title">Advanced Analytics</h2>
            <p className="pat-subtitle">
              Unlock deeper insights into your resilience journey
            </p>
          </div>

          <div className="pat-export-row">
            <ExportButton />
          </div>

          <div className="pat-grid">
            <ChartCard
              title="Weekly XP Trend"
              subtitle="XP earned per week over the last 12 weeks"
            >
              <WeeklyXPTrend />
            </ChartCard>

            <ChartCard
              title="Dimension Progress"
              subtitle="Current vs. 30 days ago (radar overlay)"
            >
              <DimensionProgressRadar />
            </ChartCard>

            <ChartCard
              title="Activity Streak"
              subtitle="Daily activity heatmap for the last 12 weeks"
              minHeight="160px"
            >
              <StreakCalendar />
            </ChartCard>

            <ChartCard
              title="Activity Timeline"
              subtitle="Recently completed activities (last 30 days)"
              minHeight="200px"
            >
              <ActivityTimeline />
            </ChartCard>
          </div>
        </>
      )}
    </>
  );
}
