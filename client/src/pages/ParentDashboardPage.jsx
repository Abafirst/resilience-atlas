/**
 * ParentDashboardPage.jsx
 * Family tier parent dashboard — view all children's IATLAS progress.
 * Route: /iatlas/parent-dashboard
 *
 * Gated to Family tier+ subscribers (family, complete, practice, enterprise).
 * Shows activity completions, badges, streaks, dimension progress, and
 * suggested next activities — WITHOUT scores or performance ratings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import { getIATLASTier, hasCaregiverAccess, IATLAS_TIER_CONFIG } from '../utils/iatlasGating.js';
import { apiUrl } from '../api/baseUrl.js';

// ── Dimension meta ────────────────────────────────────────────────────────────

const DIMENSION_META = {
  'agentic-generative':    { title: 'Agentic-Generative',    emoji: '🎯', color: '#4f46e5' },
  'somatic-regulative':    { title: 'Somatic-Regulative',    emoji: '🧘', color: '#059669' },
  'cognitive-narrative':   { title: 'Cognitive-Narrative',   emoji: '🧠', color: '#0284c7' },
  'relational-connective': { title: 'Relational-Connective', emoji: '🤝', color: '#d97706' },
  'emotional-adaptive':    { title: 'Emotional-Adaptive',    emoji: '💚', color: '#db2777' },
  'spiritual-existential': { title: 'Spiritual-Existential', emoji: '✨', color: '#7c3aed' },
};

const DIMENSION_KEYS = Object.keys(DIMENSION_META);

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
  .ppd-page {
    background: #f8fafc;
    min-height: 100vh;
  }
  [data-theme="dark"] .ppd-page,
  .dark-mode .ppd-page {
    background: #0f172a;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .ppd-page {
      background: #0f172a;
    }
  }

  .ppd-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }

  /* Breadcrumb */
  .ppd-breadcrumb {
    display: flex; align-items: center; gap: .4rem;
    font-size: .8rem; color: #6b7280;
    padding: 1.25rem 0 .5rem; flex-wrap: wrap;
  }
  .ppd-breadcrumb a { color: inherit; text-decoration: none; }
  .ppd-breadcrumb a:hover { color: #0891b2; text-decoration: underline; }
  .ppd-breadcrumb-sep { color: #d1d5db; }

  /* Hero */
  .ppd-hero {
    background: linear-gradient(135deg, #0891b2 0%, #0e7490 55%, #155e75 100%);
    border-radius: 20px; padding: 2.5rem 2rem 2rem;
    margin: .75rem 0 2rem; color: #fff; position: relative; overflow: hidden;
  }
  .ppd-hero::before {
    content: '';
    position: absolute; top: -40px; right: -40px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(255,255,255,.07);
  }
  .ppd-hero::after {
    content: '';
    position: absolute; bottom: -20px; left: -20px;
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(255,255,255,.04);
  }
  .ppd-hero-emoji { font-size: 2.4rem; margin-bottom: .5rem; }
  .ppd-hero-title { font-size: 1.6rem; font-weight: 800; margin: 0 0 .4rem; line-height: 1.2; position: relative; z-index: 1; }
  .ppd-hero-sub { font-size: .9rem; opacity: .85; margin: 0; position: relative; z-index: 1; }

  /* Tier badge */
  .ppd-tier-badge {
    display: inline-flex; align-items: center; gap: .35rem;
    background: rgba(255,255,255,.18);
    border-radius: 999px; padding: .3rem .8rem;
    font-size: .78rem; font-weight: 700; color: #fff;
    margin-bottom: .9rem;
  }

  /* Upgrade card (for gated users) */
  .ppd-upgrade {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 3rem 2rem; text-align: center; margin: 2rem 0;
  }
  .ppd-upgrade-emoji { font-size: 3rem; margin-bottom: 1rem; }
  .ppd-upgrade-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 .5rem; }
  .ppd-upgrade-sub { color: #64748b; font-size: .9rem; margin: 0 0 1.5rem; max-width: 440px; margin-left: auto; margin-right: auto; }
  .ppd-upgrade-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    background: #0891b2; color: #fff; border: none;
    border-radius: 10px; padding: .75rem 1.5rem;
    font-weight: 700; font-size: .9rem; cursor: pointer;
    text-decoration: none;
  }
  .ppd-upgrade-btn:hover { background: #0e7490; }

  /* Child selector tabs */
  .ppd-tabs-bar {
    display: flex; gap: .5rem; overflow-x: auto; padding-bottom: .25rem;
    margin-bottom: 1.75rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .ppd-tabs-bar::-webkit-scrollbar { display: none; }
  .ppd-tab {
    display: flex; align-items: center; gap: .45rem;
    background: #fff; border: 2px solid #e2e8f0;
    border-radius: 10px; padding: .55rem 1rem;
    font-weight: 600; font-size: .85rem; color: #64748b;
    cursor: pointer; white-space: nowrap;
    min-height: 44px; min-width: 44px;
    transition: border-color .15s, color .15s;
    font-family: inherit;
  }
  .ppd-tab:hover { border-color: #0891b2; color: #0891b2; }
  .ppd-tab.active { border-color: #0891b2; color: #0891b2; background: #ecfeff; }
  .ppd-tab-avatar { font-size: 1.1rem; }
  [data-theme="dark"] .ppd-tab,
  .dark-mode .ppd-tab { background: #1e293b; border-color: #334155; color: #94a3b8; }
  [data-theme="dark"] .ppd-tab.active,
  .dark-mode .ppd-tab.active { border-color: #0891b2; color: #38bdf8; background: rgba(8,145,178,.12); }

  /* Stats cards */
  .ppd-stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .ppd-stat-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 1.25rem 1rem; text-align: center;
  }
  .ppd-stat-value { font-size: 2.2rem; font-weight: 800; color: #0891b2; line-height: 1; }
  .ppd-stat-label { font-size: .75rem; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin-top: .35rem; }
  [data-theme="dark"] .ppd-stat-card,
  .dark-mode .ppd-stat-card { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .ppd-stat-label,
  .dark-mode .ppd-stat-label { color: #94a3b8; }

  /* Section cards */
  .ppd-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 1.5rem; margin-bottom: 1.25rem;
  }
  [data-theme="dark"] .ppd-card,
  .dark-mode .ppd-card { background: #1e293b; border-color: #334155; }
  .ppd-card-title {
    font-size: .95rem; font-weight: 700; color: #1e293b;
    margin: 0 0 1rem; display: flex; align-items: center; gap: .45rem;
  }
  [data-theme="dark"] .ppd-card-title,
  .dark-mode .ppd-card-title { color: #f1f5f9; }

  /* Dimension progress rows */
  .ppd-dim-list { display: flex; flex-direction: column; gap: .6rem; }
  .ppd-dim-row {
    display: flex; align-items: center; gap: .75rem;
  }
  .ppd-dim-emoji { font-size: 1.1rem; flex-shrink: 0; width: 22px; text-align: center; }
  .ppd-dim-name { font-size: .85rem; font-weight: 600; color: #334155; flex: 1; }
  [data-theme="dark"] .ppd-dim-name,
  .dark-mode .ppd-dim-name { color: #e2e8f0; }
  .ppd-dim-bar-wrap { flex: 2; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  [data-theme="dark"] .ppd-dim-bar-wrap,
  .dark-mode .ppd-dim-bar-wrap { background: #334155; }
  .ppd-dim-bar { height: 100%; border-radius: 999px; transition: width .4s; }
  .ppd-dim-count { font-size: .78rem; font-weight: 700; color: #64748b; width: 40px; text-align: right; flex-shrink: 0; }
  [data-theme="dark"] .ppd-dim-count,
  .dark-mode .ppd-dim-count { color: #94a3b8; }

  /* Badge gallery */
  .ppd-badge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: .75rem;
  }
  .ppd-badge {
    background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px;
    padding: .75rem .5rem; text-align: center;
  }
  .ppd-badge-icon { font-size: 1.5rem; }
  .ppd-badge-name { font-size: .72rem; font-weight: 700; color: #92400e; margin: .3rem 0 0; word-break: break-word; }
  .ppd-badge-date { font-size: .68rem; color: #b45309; margin: .15rem 0 0; }
  .ppd-empty-msg { color: #94a3b8; font-size: .85rem; font-style: italic; }

  /* Activity timeline */
  .ppd-activity-list { list-style: none; padding: 0; margin: 0; }
  .ppd-activity-item {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: .6rem 0; border-bottom: 1px solid #f1f5f9; font-size: .85rem;
  }
  [data-theme="dark"] .ppd-activity-item,
  .dark-mode .ppd-activity-item { border-color: #334155; }
  .ppd-activity-item:last-child { border-bottom: none; }
  .ppd-activity-name { color: #334155; flex: 1; padding-right: 1rem; }
  [data-theme="dark"] .ppd-activity-name,
  .dark-mode .ppd-activity-name { color: #e2e8f0; }
  .ppd-activity-date { color: #94a3b8; white-space: nowrap; font-size: .78rem; }

  /* Suggestions */
  .ppd-suggestion-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: .75rem;
  }
  .ppd-suggestion-card {
    background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px;
    padding: 1rem; text-decoration: none; color: inherit;
    display: flex; flex-direction: column; gap: .3rem;
    transition: transform .15s, box-shadow .15s;
    min-height: 44px;
  }
  .ppd-suggestion-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
  .ppd-suggestion-card.priority { background: #ecfeff; border-color: #67e8f9; }
  .ppd-suggestion-emoji { font-size: 1.4rem; }
  .ppd-suggestion-title { font-size: .85rem; font-weight: 700; color: #15803d; }
  .ppd-suggestion-card.priority .ppd-suggestion-title { color: #0e7490; }
  .ppd-suggestion-count { font-size: .75rem; color: #64748b; }
  .ppd-suggestion-badge {
    display: inline-block; background: #67e8f9; color: #0c4a6e;
    border-radius: 999px; font-size: .65rem; font-weight: 700;
    padding: .1rem .45rem;
  }
  [data-theme="dark"] .ppd-suggestion-card,
  .dark-mode .ppd-suggestion-card { background: rgba(16,185,129,.08); border-color: #065f46; }
  [data-theme="dark"] .ppd-suggestion-title,
  .dark-mode .ppd-suggestion-title { color: #34d399; }

  /* Print button */
  .ppd-print-btn {
    display: inline-flex; align-items: center; gap: .4rem;
    background: #0891b2; color: #fff; border: none;
    border-radius: 10px; padding: .7rem 1.4rem;
    font-weight: 700; font-size: .875rem; cursor: pointer;
    font-family: inherit; text-decoration: none;
  }
  .ppd-print-btn:hover { background: #0e7490; }

  /* No children empty state */
  .ppd-no-children {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
    padding: 3rem 2rem; text-align: center; margin: 1.5rem 0;
  }
  [data-theme="dark"] .ppd-no-children,
  .dark-mode .ppd-no-children { background: #1e293b; border-color: #334155; }
  .ppd-no-children-emoji { font-size: 2.5rem; margin-bottom: .75rem; }
  .ppd-no-children-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 .4rem; }
  [data-theme="dark"] .ppd-no-children-title,
  .dark-mode .ppd-no-children-title { color: #f1f5f9; }
  .ppd-no-children-sub { color: #64748b; font-size: .875rem; margin: 0 0 1.25rem; }
  [data-theme="dark"] .ppd-no-children-sub,
  .dark-mode .ppd-no-children-sub { color: #94a3b8; }

  /* Loading spinner */
  .ppd-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 40vh; gap: 1rem;
    color: #64748b; font-size: .9rem;
  }
  .ppd-spinner {
    width: 32px; height: 32px; border: 3px solid #e2e8f0;
    border-top-color: #0891b2; border-radius: 50%;
    animation: ppd-spin .7s linear infinite;
  }
  @keyframes ppd-spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .ppd-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .ppd-stats-grid .ppd-stat-card:last-child { grid-column: span 2; }
    .ppd-suggestion-grid { grid-template-columns: repeat(2, 1fr); }
    .ppd-hero { padding: 1.75rem 1.25rem 1.5rem; }
    .ppd-hero-title { font-size: 1.3rem; }
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ParentDashboardPage() {
  const { getAccessTokenSilently } = useAuth0();

  const [children,       setChildren]       = useState([]);
  const [selectedId,     setSelectedId]     = useState(null);
  const [suggestions,    setSuggestions]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error,          setError]          = useState(null);

  const tier            = getIATLASTier();
  const hasAccess       = hasCaregiverAccess();
  const tierConfig      = IATLAS_TIER_CONFIG[tier] || {};

  // ── Dark-mode theme sync ──────────────────────────────────────────────────

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  // ── Fetch helpers ─────────────────────────────────────────────────────────

  const getToken = useCallback(async () => {
    try {
      return await getAccessTokenSilently();
    } catch {
      return '';
    }
  }, [getAccessTokenSilently]);

  // Fetch all children + their progress.
  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res   = await fetch(apiUrl('/api/iatlas/parent/children-progress'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = data.children || [];
      setChildren(list);
      if (list.length > 0) setSelectedId(list[0].childId);
    } catch (err) {
      console.error('[ParentDashboard] Failed to load children:', err);
      setError('Failed to load children progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Fetch activity suggestions for a specific child.
  const fetchSuggestions = useCallback(async (childId) => {
    if (!childId) return;
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const token = await getToken();
      const res   = await fetch(
        apiUrl(`/api/iatlas/parent/suggested-activities/${encodeURIComponent(childId)}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('[ParentDashboard] Failed to load suggestions:', err);
    } finally {
      setSuggestLoading(false);
    }
  }, [getToken]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasAccess) {
      fetchChildren();
    } else {
      setLoading(false);
    }
  }, [hasAccess, fetchChildren]);

  useEffect(() => {
    if (selectedId) fetchSuggestions(selectedId);
  }, [selectedId, fetchSuggestions]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const selectedChild = children.find((c) => c.childId === selectedId) || null;
  const progress      = selectedChild?.progress || null;

  const completedCount  = progress?.completedActivities?.length  || 0;
  const badgesCount     = progress?.unlockedBadges?.length        || 0;
  const currentStreak   = progress?.currentStreak                 || 0;
  const dp              = progress?.dimensionProgress             || {};

  // Max completions across all dimensions (for bar scaling).
  const maxDimCount = Math.max(1, ...DIMENSION_KEYS.map((k) => dp[k] || 0));

  const recentActivities = [...(progress?.completedActivities || [])]
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    .slice(0, 10);

  // ── Print report handler ──────────────────────────────────────────────────

  const handlePrintReport = useCallback(async () => {
    if (!selectedId) return;
    try {
      const token = await getToken();
      const url   = apiUrl(
        `/api/iatlas/parent/progress-report/${encodeURIComponent(selectedId)}`
      );
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const win  = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err) {
      console.error('[ParentDashboard] Failed to open print report:', err);
    }
  }, [selectedId, getToken]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{STYLES}</style>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <main id="main-content" className="ppd-page">
        <div className="ppd-wrap">

          {/* Breadcrumb */}
          <nav className="ppd-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="ppd-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Parent Dashboard</span>
          </nav>

          {/* Hero */}
          <div className="ppd-hero" role="banner">
            <div className="ppd-tier-badge" aria-label={`Current tier: ${tierConfig.displayName || tier}`}>
              <span aria-hidden="true">{tierConfig.badge || '👨‍👩‍👧‍👦'}</span>
              {tierConfig.displayName || 'Family Plan'}
            </div>
            <div className="ppd-hero-emoji" aria-hidden="true">👨‍👩‍👧‍👦</div>
            <h1 className="ppd-hero-title">Parent Dashboard</h1>
            <p className="ppd-hero-sub">
              Track your children's IATLAS resilience journey — completions, badges, and suggested next steps.
            </p>
          </div>

          {/* ── Tier gate ────────────────────────────────────────────────── */}
          {!hasAccess && (
            <div className="ppd-upgrade" role="region" aria-label="Upgrade required">
              <div className="ppd-upgrade-emoji" aria-hidden="true">🔒</div>
              <h2 className="ppd-upgrade-title">Family Tier Required</h2>
              <p className="ppd-upgrade-sub">
                The Parent Dashboard is available on the IATLAS Family plan ($39.99/mo) and above.
                Upgrade to track all your children's resilience progress in one place.
              </p>
              <Link to="/iatlas" className="ppd-upgrade-btn">
                👨‍👩‍👧‍👦 Upgrade to Family Plan
              </Link>
            </div>
          )}

          {/* ── Loading state ─────────────────────────────────────────────── */}
          {hasAccess && loading && (
            <div className="ppd-loading" role="status" aria-live="polite">
              <div className="ppd-spinner" aria-hidden="true" />
              <span>Loading children&rsquo;s progress&hellip;</span>
            </div>
          )}

          {/* ── Error state ───────────────────────────────────────────────── */}
          {hasAccess && !loading && error && (
            <div className="ppd-card" role="alert" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}>
              <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>{error}</p>
              <button
                onClick={fetchChildren}
                style={{ marginTop: '.75rem', background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '.5rem 1rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Retry
              </button>
            </div>
          )}

          {/* ── No children state ─────────────────────────────────────────── */}
          {hasAccess && !loading && !error && children.length === 0 && (
            <div className="ppd-no-children">
              <div className="ppd-no-children-emoji" aria-hidden="true">🧒</div>
              <h2 className="ppd-no-children-title">No child profiles yet</h2>
              <p className="ppd-no-children-sub">
                Add a child profile to start tracking their IATLAS resilience journey.
              </p>
              <Link
                to="/iatlas/profiles"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: '#0891b2', color: '#fff', borderRadius: 10,
                  padding: '.7rem 1.4rem', fontWeight: 700, textDecoration: 'none',
                  fontSize: '.875rem',
                }}
              >
                ➕ Add Child Profile
              </Link>
            </div>
          )}

          {/* ── Dashboard content ─────────────────────────────────────────── */}
          {hasAccess && !loading && !error && children.length > 0 && (
            <>
              {/* Child selector tabs */}
              <nav className="ppd-tabs-bar" aria-label="Select child">
                {children.map((child) => (
                  <button
                    key={child.childId}
                    className={`ppd-tab${child.childId === selectedId ? ' active' : ''}`}
                    onClick={() => setSelectedId(child.childId)}
                    aria-pressed={child.childId === selectedId}
                    aria-label={`View ${child.name}'s progress`}
                  >
                    <span className="ppd-tab-avatar" aria-hidden="true">{child.avatar || '🧒'}</span>
                    {child.name}
                  </button>
                ))}
                <Link
                  to="/iatlas/profiles"
                  className="ppd-tab"
                  style={{ color: '#0891b2', borderStyle: 'dashed' }}
                  aria-label="Manage child profiles"
                  title="Add or manage profiles"
                >
                  ➕ Manage Profiles
                </Link>
              </nav>

              {selectedChild && (
                <>
                  {/* Stats overview */}
                  <div className="ppd-stats-grid" role="region" aria-label={`${selectedChild.name}'s summary stats`}>
                    <div className="ppd-stat-card">
                      <div className="ppd-stat-value" aria-label={`${completedCount} activities completed`}>
                        {completedCount}
                      </div>
                      <div className="ppd-stat-label">Activities Completed</div>
                    </div>
                    <div className="ppd-stat-card">
                      <div className="ppd-stat-value" aria-label={`${badgesCount} badges earned`}>
                        {badgesCount}
                      </div>
                      <div className="ppd-stat-label">Badges Earned</div>
                    </div>
                    <div className="ppd-stat-card">
                      <div className="ppd-stat-value" aria-label={`${currentStreak} day streak`}>
                        {currentStreak}
                      </div>
                      <div className="ppd-stat-label">Day Streak</div>
                    </div>
                  </div>

                  {/* Dimension progress */}
                  <div className="ppd-card" role="region" aria-label={`${selectedChild.name}'s dimension progress`}>
                    <h2 className="ppd-card-title">
                      <span aria-hidden="true">🧭</span> Dimension Progress
                    </h2>
                    <div className="ppd-dim-list">
                      {DIMENSION_KEYS.map((key) => {
                        const meta  = DIMENSION_META[key];
                        const count = dp[key] || 0;
                        const pct   = Math.round((count / maxDimCount) * 100);
                        return (
                          <div key={key} className="ppd-dim-row">
                            <span className="ppd-dim-emoji" aria-hidden="true">{meta.emoji}</span>
                            <span className="ppd-dim-name">{meta.title}</span>
                            <div className="ppd-dim-bar-wrap" role="progressbar"
                              aria-valuenow={count} aria-valuemin={0} aria-valuemax={maxDimCount}
                              aria-label={`${meta.title}: ${count} activities`}>
                              <div
                                className="ppd-dim-bar"
                                style={{ width: `${pct}%`, background: meta.color }}
                              />
                            </div>
                            <span className="ppd-dim-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="ppd-card" role="region" aria-label={`${selectedChild.name}'s badges`}>
                    <h2 className="ppd-card-title">
                      <span aria-hidden="true">🏅</span> Badges Earned
                    </h2>
                    {badgesCount === 0 ? (
                      <p className="ppd-empty-msg">No badges earned yet — keep exploring!</p>
                    ) : (
                      <div className="ppd-badge-grid" role="list">
                        {(progress?.unlockedBadges || []).map((b, i) => (
                          <div key={`${b.badgeId}-${i}`} className="ppd-badge" role="listitem">
                            <div className="ppd-badge-icon" aria-hidden="true">🏅</div>
                            <p className="ppd-badge-name">{b.badgeId || 'Badge'}</p>
                            {b.unlockedAt && (
                              <p className="ppd-badge-date">
                                {new Date(b.unlockedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Activity timeline */}
                  <div className="ppd-card" role="region" aria-label={`${selectedChild.name}'s recent activity`}>
                    <h2 className="ppd-card-title">
                      <span aria-hidden="true">📅</span> Recent Activity
                    </h2>
                    {recentActivities.length === 0 ? (
                      <p className="ppd-empty-msg">No activities completed yet.</p>
                    ) : (
                      <ul className="ppd-activity-list" aria-label="Recent activities">
                        {recentActivities.map((a, i) => (
                          <li key={`${a.activityId}-${i}`} className="ppd-activity-item">
                            <span className="ppd-activity-name">
                              {a.activityId}
                              {a.dimension && ` · ${a.dimension}`}
                            </span>
                            <span className="ppd-activity-date">
                              {a.completedAt
                                ? new Date(a.completedAt).toLocaleDateString()
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Suggested next activities */}
                  <div className="ppd-card" role="region" aria-label={`Suggested activities for ${selectedChild.name}`}>
                    <h2 className="ppd-card-title">
                      <span aria-hidden="true">💡</span> Suggested Next Activities
                    </h2>
                    {suggestLoading ? (
                      <p className="ppd-empty-msg">Loading suggestions&hellip;</p>
                    ) : suggestions.length === 0 ? (
                      <p className="ppd-empty-msg">No suggestions available yet.</p>
                    ) : (
                      <div className="ppd-suggestion-grid">
                        {suggestions.map((s) => (
                          <Link
                            key={s.dimension}
                            to={s.browseUrl || `/iatlas/kids/catalog`}
                            className={`ppd-suggestion-card${s.isPriority ? ' priority' : ''}`}
                            aria-label={`Explore ${s.title} activities${s.isPriority ? ' (not started yet)' : ''}`}
                          >
                            <span className="ppd-suggestion-emoji" aria-hidden="true">{s.emoji}</span>
                            <span className="ppd-suggestion-title">{s.title}</span>
                            <span className="ppd-suggestion-count">
                              {s.completions === 0
                                ? 'Not started yet'
                                : `${s.completions} done`}
                            </span>
                            {s.isPriority && (
                              <span className="ppd-suggestion-badge">New area</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Print report */}
                  <div className="ppd-card" role="region" aria-label="Print progress report">
                    <h2 className="ppd-card-title">
                      <span aria-hidden="true">🖨️</span> Progress Report
                    </h2>
                    <p style={{ margin: '0 0 1rem', fontSize: '.875rem', color: '#64748b' }}>
                      Generate a printable progress summary for {selectedChild.name}.
                      The report shows activities completed, badges earned, and dimension progress.
                    </p>
                    <button
                      className="ppd-print-btn"
                      onClick={handlePrintReport}
                      aria-label={`Print progress report for ${selectedChild.name}`}
                    >
                      🖨️ Open Print Report
                    </button>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </main>
    </>
  );
}
