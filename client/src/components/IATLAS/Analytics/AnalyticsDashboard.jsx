/**
 * AnalyticsDashboard.jsx
 * Main container for the IATLAS Advanced Analytics Dashboard.
 *
 * Route: /analytics
 *
 * Tabs:
 *  1. Overview         — High-level metrics and trends
 *  2. Progress         — Individual child progress over time
 *  3. Skill Development — Skill acquisition analytics
 *  4. Comparative      — Cross-child comparisons
 *  5. Reports          — Export and report generation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import DateRangeFilter from './DateRangeFilter.jsx';
import ChildFamilyFilter from './ChildFamilyFilter.jsx';
import OverviewTab from './OverviewTab.jsx';
import ProgressTrackingTab from './ProgressTrackingTab.jsx';
import SkillDevelopmentTab from './SkillDevelopmentTab.jsx';
import ComparativeAnalyticsTab from './ComparativeAnalyticsTab.jsx';
import ReportsTab from './ReportsTab.jsx';
import PersonalAnalyticsTab from './PersonalAnalyticsTab.jsx';

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
/* ── Page shell ── */
.ad-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.25rem 5rem;
}

/* ── Breadcrumb ── */
.ad-breadcrumb {
  display: flex; align-items: center; gap: .4rem;
  font-size: .8rem; color: #6b7280;
  padding: 1.25rem 0 .5rem; flex-wrap: wrap;
}
.ad-breadcrumb a { color: inherit; text-decoration: none; }
.ad-breadcrumb a:hover { color: #4f46e5; text-decoration: underline; }
.ad-breadcrumb-sep { color: #d1d5db; }

/* ── Hero ── */
.ad-hero {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4f46e5 100%);
  border-radius: 20px;
  padding: 2rem 2rem 1.75rem;
  margin: .75rem 0 1.75rem;
  color: #fff;
  position: relative;
  overflow: hidden;
}
.ad-hero::before {
  content: '';
  position: absolute; top: -60px; right: -60px;
  width: 220px; height: 220px; border-radius: 50%;
  background: rgba(255,255,255,.05);
}
.ad-hero::after {
  content: '';
  position: absolute; bottom: -40px; left: -40px;
  width: 160px; height: 160px; border-radius: 50%;
  background: rgba(255,255,255,.04);
}
.ad-hero-inner {
  position: relative; z-index: 1;
  display: flex; align-items: flex-start;
  justify-content: space-between; flex-wrap: wrap; gap: 1rem;
}
.ad-hero-text { flex: 1 1 260px; }
.ad-hero-emoji { font-size: 2.2rem; margin-bottom: .4rem; }
.ad-hero-title { font-size: 1.65rem; font-weight: 900; margin: 0 0 .35rem; line-height: 1.2; }
.ad-hero-sub   { font-size: .9rem; opacity: .85; margin: 0; max-width: 460px; }
.ad-hero-meta  { font-size: .75rem; opacity: .65; margin-top: .5rem; }

/* ── Filter toolbar ── */
.ad-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem 1.5rem;
  align-items: center;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: .75rem 1.25rem;
  margin-bottom: 1.25rem;
}
[data-theme="dark"] .ad-toolbar {
  background: #1e293b;
  border-color: #334155;
}
.ad-toolbar-divider {
  width: 1px; height: 20px;
  background: #e2e8f0;
  flex-shrink: 0;
}
[data-theme="dark"] .ad-toolbar-divider { background: #334155; }
.ad-refresh-btn {
  display: flex; align-items: center; gap: .35rem;
  background: none; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: .3rem .75rem; font-size: .8rem; color: #64748b;
  cursor: pointer; margin-left: auto; white-space: nowrap;
  transition: background .15s, color .15s;
}
.ad-refresh-btn:hover {
  background: #f1f5f9; color: #0f172a;
}
[data-theme="dark"] .ad-refresh-btn {
  border-color: #334155; color: #94a3b8;
}
[data-theme="dark"] .ad-refresh-btn:hover {
  background: #334155; color: #f1f5f9;
}
.ad-refresh-spin { animation: ad-spin .7s linear infinite; display: inline-block; }
@keyframes ad-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ── Tab bar ── */
.ad-tabs {
  display: flex;
  gap: .3rem;
  flex-wrap: wrap;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
  padding-bottom: 0;
}
[data-theme="dark"] .ad-tabs { border-color: #334155; }
.ad-tab {
  display: flex; align-items: center; gap: .35rem;
  padding: .6rem 1.1rem .7rem;
  border: none; background: none;
  font-size: .875rem; font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  border-radius: 4px 4px 0 0;
  transition: color .15s, border-color .15s, background .15s;
  white-space: nowrap;
}
.ad-tab:hover {
  color: #4f46e5;
  background: #f8fafc;
}
.ad-tab.ad-tab-active {
  color: #4f46e5;
  border-bottom-color: #6366f1;
  background: #f8f8ff;
}
[data-theme="dark"] .ad-tab { color: #94a3b8; }
[data-theme="dark"] .ad-tab:hover { color: #a5b4fc; background: #1e293b; }
[data-theme="dark"] .ad-tab.ad-tab-active {
  color: #a5b4fc; border-bottom-color: #818cf8; background: #1e1e3f;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .ad-hero-title { font-size: 1.3rem; }
  .ad-tab { font-size: .78rem; padding: .5rem .75rem .6rem; }
  .ad-toolbar { padding: .6rem .9rem; }
}
`;

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { key: 'overview',     label: 'Overview',     icon: '/icons/compass.svg' },
  { key: 'progress',     label: 'Progress',     icon: '/icons/leaderboards.svg' },
  { key: 'skills',       label: 'Skills',       icon: '/icons/cognitive-narrative.svg' },
  { key: 'comparative',  label: 'Comparative',  icon: '/icons/org-leaderboards.svg' },
  { key: 'reports',      label: 'Reports',      icon: '/icons/journal.svg' },
  { key: 'personal',     label: 'Personal Insights', icon: '/icons/strength.svg' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { profiles, loading: profilesLoading, refreshProfiles } = useProfiles();

  const [activeTab,        setActiveTab]        = useState('overview');
  const [rangeKey,         setRangeKey]         = useState('30d');
  const [selectedChildId,  setSelectedChildId]  = useState('all');
  const [refreshing,       setRefreshing]       = useState(false);
  const [lastUpdated,      setLastUpdated]      = useState(new Date());

  // Keep child filter in sync when profiles change
  useEffect(() => {
    if (profiles.length && selectedChildId !== 'all') {
      const exists = profiles.some(p => p.id === selectedChildId);
      if (!exists) setSelectedChildId('all');
    }
  }, [profiles, selectedChildId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfiles();
      setLastUpdated(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfiles]);

  const tabProps = {
    profiles,
    selectedProfileId: selectedChildId,
    rangeKey,
    loading: profilesLoading,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="ad-page">

        {/* Breadcrumb */}
        <nav className="ad-breadcrumb" aria-label="Breadcrumb">
          <Link to="/iatlas">IATLAS</Link>
          <span className="ad-breadcrumb-sep" aria-hidden="true">›</span>
          <span aria-current="page">Analytics Dashboard</span>
        </nav>

        {/* Hero */}
        <header className="ad-hero">
          <div className="ad-hero-inner">
            <div className="ad-hero-text">
              <div className="ad-hero-emoji" aria-hidden="true">
                <img src="/icons/org-leaderboards.svg" alt="" aria-hidden="true" style={{ width: '2.2rem', height: '2.2rem', objectFit: 'contain' }} />
              </div>
              <h1 className="ad-hero-title">Analytics Dashboard</h1>
              <p className="ad-hero-sub">
                Deep insights into family progress, skill development trends,
                and comparative analytics across children in your care.
              </p>
              <p className="ad-hero-meta">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </header>

        {/* Filter toolbar */}
        <div className="ad-toolbar" role="toolbar" aria-label="Analytics filters">
          <DateRangeFilter value={rangeKey} onChange={setRangeKey} />
          <div className="ad-toolbar-divider" aria-hidden="true" />
          <ChildFamilyFilter
            profiles={profiles}
            selectedId={selectedChildId}
            onChange={setSelectedChildId}
          />
          <button
            className="ad-refresh-btn"
            onClick={handleRefresh}
            aria-label="Refresh analytics data"
            disabled={refreshing}
          >
            <span
              className={refreshing ? 'ad-refresh-spin' : ''}
              aria-hidden="true"
            >
              <img src="/icons/compass.svg" alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} />
            </span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Tab navigation */}
        <nav className="ad-tabs" role="tablist" aria-label="Analytics tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`panel-${tab.key}`}
              className={`ad-tab${activeTab === tab.key ? ' ad-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {typeof tab.icon === 'string' && tab.icon.startsWith('/')
                ? <img src={tab.icon} alt="" aria-hidden="true" style={{ width: '1rem', height: '1rem', objectFit: 'contain' }} />
                : <span aria-hidden="true">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab panels */}
        <main>
          {activeTab === 'overview' && (
            <section id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
              <OverviewTab {...tabProps} />
            </section>
          )}
          {activeTab === 'progress' && (
            <section id="panel-progress" role="tabpanel" aria-labelledby="tab-progress">
              <ProgressTrackingTab {...tabProps} />
            </section>
          )}
          {activeTab === 'skills' && (
            <section id="panel-skills" role="tabpanel" aria-labelledby="tab-skills">
              <SkillDevelopmentTab {...tabProps} />
            </section>
          )}
          {activeTab === 'comparative' && (
            <section id="panel-comparative" role="tabpanel" aria-labelledby="tab-comparative">
              <ComparativeAnalyticsTab {...tabProps} />
            </section>
          )}
          {activeTab === 'reports' && (
            <section id="panel-reports" role="tabpanel" aria-labelledby="tab-reports">
              <ReportsTab profiles={profiles} rangeKey={rangeKey} />
            </section>
          )}
          {activeTab === 'personal' && (
            <section id="panel-personal" role="tabpanel" aria-labelledby="tab-personal">
              <PersonalAnalyticsTab />
            </section>
          )}
        </main>
      </div>
    </>
  );
}
