/**
 * FamilyDashboard.jsx
 * Centralized family dashboard for parents/caregivers.
 *
 * Shows aggregated metrics, multi-child activity feeds, upcoming sessions,
 * progress analytics, notifications, and quick-action navigation.
 *
 * Route: /iatlas/family-dashboard
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfiles } from '../../../contexts/ProfileContext.jsx';
import AddChildModal from '../Profiles/AddChildModal.jsx';
import EditProfileModal from '../Profiles/EditProfileModal.jsx';
import { exportFamilyReportAsCSV } from '../../../utils/familyReportExport.js';
import {
  loadKidsProgress,
  getTotalKidsStars,
  getKidsLevelInfo,
  getCompletedCountPerAgeGroup,
  loadKidsJSON,
  KIDS_STORAGE_KEYS,
} from '../../../utils/kidsProgressHelpers.js';
import { AGE_GROUP_LABELS } from '../../../data/kidsGamification.js';
import { KIDS_ACTIVITIES } from '../../../data/kidsActivities.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const PROFILE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

function getProfileColor(index) {
  return PROFILE_COLORS[index % PROFILE_COLORS.length];
}

/** Build profile-namespaced storage keys — mirrors useKidsProgress.js */
function getProfileStorageKeys(profileId) {
  if (!profileId) return KIDS_STORAGE_KEYS;
  const prefix = `iatlas_progress_${profileId}`;
  return {
    PROGRESS:     `${prefix}_progress`,
    STARS:        `${prefix}_stars`,
    BADGES:       `${prefix}_badges`,
    LEVEL:        `${prefix}_level`,
    CERTIFICATES: `${prefix}_certificates`,
    STREAKS:      `${prefix}_streaks`,
    PARENT_NOTES: `${prefix}_parent_notes`,
    ADVENTURES:   `${prefix}_adventures`,
  };
}

function timeAgo(iso) {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    if (mins < 2)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch { return ''; }
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return ''; }
}

/** Count activities completed this week for a progress map */
function countThisWeek(progress) {
  const now      = Date.now();
  const oneWeek  = 7 * 24 * 60 * 60 * 1000;
  return Object.values(progress).filter(r => {
    try { return now - new Date(r.completedAt).getTime() < oneWeek; }
    catch { return false; }
  }).length;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const STYLES = `
/* ── Layout ── */
.fd-root {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 5rem;
}

/* ── Page header ── */
.fd-page-header {
  margin-bottom: 2rem;
}
.fd-page-title {
  font-size: 1.6rem;
  font-weight: 900;
  color: #0f172a;
  margin: 0 0 .35rem;
}
[data-theme="dark"] .fd-page-title { color: #f1f5f9; }
.fd-page-sub {
  font-size: .88rem;
  color: #64748b;
  margin: 0;
}

/* ── Summary stats grid ── */
.fd-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: .85rem;
  margin-bottom: 1.75rem;
}
@media (min-width: 600px) {
  .fd-stats-grid { grid-template-columns: repeat(4, 1fr); }
}
.fd-stat-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 1.1rem 1rem;
  text-align: center;
  transition: box-shadow .15s;
}
.fd-stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
[data-theme="dark"] .fd-stat-card {
  background: #1e293b;
  border-color: #334155;
}
.fd-stat-icon { width: 30px; height: 30px; margin: 0 auto .45rem; display: block; }
.fd-stat-value {
  font-size: 1.65rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1;
  margin-bottom: .25rem;
}
[data-theme="dark"] .fd-stat-value { color: #f1f5f9; }
.fd-stat-label {
  font-size: .68rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
}

/* ── Quick actions ── */
.fd-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .65rem;
  margin-bottom: 1.75rem;
}
.fd-action-btn {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  padding: .6rem 1.1rem;
  border-radius: 10px;
  font-size: .83rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  border: none;
  transition: opacity .15s, transform .1s;
}
.fd-action-btn:hover { opacity: .88; transform: translateY(-1px); }
.fd-action-btn:active { transform: translateY(0); }
.fd-action-btn-primary   { background: #6366f1; color: #fff; }
.fd-action-btn-secondary { background: #10b981; color: #fff; }
.fd-action-btn-tertiary  { background: #f59e0b; color: #fff; }
.fd-action-btn-ghost     { background: #f1f5f9; color: #475569; }
[data-theme="dark"] .fd-action-btn-ghost { background: #334155; color: #cbd5e1; }

/* ── Two-column layout for wide screens ── */
.fd-two-col {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}
@media (min-width: 768px) {
  .fd-two-col { grid-template-columns: 1fr 1fr; }
}

/* ── Card ── */
.fd-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}
[data-theme="dark"] .fd-card {
  background: #1e293b;
  border-color: #334155;
}
.fd-card-flush { margin-bottom: 0; }

.fd-section-title {
  font-size: .95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 .9rem;
  display: flex;
  align-items: center;
  gap: .5rem;
}
[data-theme="dark"] .fd-section-title { color: #f1f5f9; }
.fd-section-icon { width: 20px; height: 20px; }

/* ── Children grid ── */
.fd-children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: .85rem;
}
.fd-child-card {
  border: 2px solid;
  border-radius: 14px;
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow .15s, transform .12s;
  background: #fff;
}
[data-theme="dark"] .fd-child-card { background: #0f172a; }
.fd-child-card:hover { box-shadow: 0 4px 18px rgba(0,0,0,.1); transform: translateY(-2px); }
.fd-child-card-header {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin-bottom: .65rem;
}
.fd-child-edit-btn {
  margin-left: auto;
  background: none;
  border: 1.5px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  color: #94a3b8;
  padding: .15rem .4rem;
  line-height: 1;
  transition: all .15s;
  flex-shrink: 0;
}
.fd-child-edit-btn:hover { color: #6366f1; border-color: #c7d2fe; background: #eef2ff; }
.fd-child-avatar {
  font-size: 1.6rem;
  line-height: 1;
}
.fd-child-name {
  font-size: .95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
[data-theme="dark"] .fd-child-name { color: #f1f5f9; }
.fd-child-age {
  font-size: .7rem;
  color: #64748b;
  margin: .1rem 0 0;
}
.fd-child-stats {
  display: flex;
  gap: .75rem;
  font-size: .72rem;
  color: #475569;
  flex-wrap: wrap;
}
[data-theme="dark"] .fd-child-stats { color: #94a3b8; }
.fd-child-stat { display: flex; align-items: center; gap: .25rem; }
.fd-child-progress-bar-wrap {
  height: 6px;
  background: #f1f5f9;
  border-radius: 6px;
  overflow: hidden;
  margin-top: .65rem;
}
[data-theme="dark"] .fd-child-progress-bar-wrap { background: #334155; }
.fd-child-progress-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width .5s ease;
}
.fd-child-progress-label {
  font-size: .65rem;
  color: #94a3b8;
  margin-top: .25rem;
  text-align: right;
}

/* ── Activity feed ── */
.fd-feed { display: flex; flex-direction: column; gap: .5rem; }
.fd-feed-item {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  padding: .6rem .75rem;
  background: #f8fafc;
  border-radius: 10px;
  font-size: .8rem;
  color: #374151;
}
[data-theme="dark"] .fd-feed-item { background: #0f172a; color: #cbd5e1; }
.fd-feed-avatar {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: .05rem;
  width: 22px;
  text-align: center;
}
.fd-feed-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: .1rem;
}
.fd-feed-text { flex: 1; line-height: 1.4; }
.fd-feed-time {
  font-size: .66rem;
  color: #94a3b8;
  flex-shrink: 0;
  margin-top: .1rem;
  white-space: nowrap;
}
.fd-feed-chip {
  display: inline-block;
  font-size: .62rem;
  font-weight: 700;
  padding: .1rem .45rem;
  border-radius: 20px;
  color: #fff;
  margin-left: .35rem;
}

/* ── Filter bar ── */
.fd-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin-bottom: .9rem;
}
.fd-filter-btn {
  padding: .3rem .75rem;
  border-radius: 20px;
  font-size: .75rem;
  font-weight: 600;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: background .12s, border-color .12s, color .12s;
}
.fd-filter-btn.active,
.fd-filter-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}
[data-theme="dark"] .fd-filter-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
[data-theme="dark"] .fd-filter-btn.active,
[data-theme="dark"] .fd-filter-btn:hover {
  background: #6366f1;
  border-color: #6366f1;
  color: #fff;
}

/* ── Calendar ── */
.fd-calendar-list { display: flex; flex-direction: column; gap: .5rem; }
.fd-calendar-item {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .65rem .85rem;
  background: #f8fafc;
  border-radius: 10px;
  font-size: .82rem;
  color: #374151;
}
[data-theme="dark"] .fd-calendar-item { background: #0f172a; color: #cbd5e1; }
.fd-calendar-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fd-calendar-info { flex: 1; }
.fd-calendar-title { font-weight: 700; color: #0f172a; }
[data-theme="dark"] .fd-calendar-title { color: #f1f5f9; }
.fd-calendar-sub { font-size: .72rem; color: #64748b; }
.fd-calendar-badge {
  font-size: .65rem;
  font-weight: 700;
  padding: .15rem .5rem;
  border-radius: 8px;
}

/* ── Progress bars ── */
.fd-progress-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  margin-bottom: .55rem;
}
.fd-progress-label {
  font-size: .78rem;
  font-weight: 600;
  color: #475569;
  min-width: 110px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
[data-theme="dark"] .fd-progress-label { color: #94a3b8; }
.fd-progress-bar-wrap {
  flex: 1;
  height: 8px;
  background: #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
}
[data-theme="dark"] .fd-progress-bar-wrap { background: #334155; }
.fd-progress-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width .5s ease;
}
.fd-progress-count {
  font-size: .72rem;
  color: #64748b;
  min-width: 45px;
  text-align: right;
  flex-shrink: 0;
}

/* ── Notifications ── */
.fd-notif-list { display: flex; flex-direction: column; gap: .5rem; }
.fd-notif-item {
  display: flex;
  align-items: flex-start;
  gap: .65rem;
  padding: .65rem .85rem;
  border-radius: 10px;
  font-size: .82rem;
  line-height: 1.45;
}
.fd-notif-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: .05rem; }
.fd-notif-text { flex: 1; color: #374151; }
[data-theme="dark"] .fd-notif-text { color: #cbd5e1; }
.fd-notif-time {
  font-size: .66rem;
  color: #94a3b8;
  flex-shrink: 0;
  margin-top: .15rem;
}
.fd-notif-info    { background: #eff6ff; }
.fd-notif-success { background: #f0fdf4; }
.fd-notif-warn    { background: #fffbeb; }
[data-theme="dark"] .fd-notif-info    { background: #1e3a5f22; }
[data-theme="dark"] .fd-notif-success { background: #052e1622; }
[data-theme="dark"] .fd-notif-warn    { background: #451a0322; }

/* ── Empty state ── */
.fd-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: #94a3b8;
  font-size: .85rem;
}
.fd-empty-icon {
  font-size: 2.5rem;
  margin-bottom: .65rem;
  display: block;
}

/* ── Nav links panel ── */
.fd-nav-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  gap: .75rem;
}
.fd-nav-link {
  display: flex;
  align-items: center;
  gap: .55rem;
  padding: .8rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: .82rem;
  font-weight: 700;
  color: #374151;
  text-decoration: none;
  transition: background .12s, border-color .12s, color .12s, transform .1s;
}
.fd-nav-link:hover {
  background: #ede9fe;
  border-color: #a5b4fc;
  color: #4338ca;
  transform: translateY(-1px);
}
[data-theme="dark"] .fd-nav-link { background: #0f172a; border-color: #334155; color: #cbd5e1; }
[data-theme="dark"] .fd-nav-link:hover { background: #1e1b4b; border-color: #818cf8; color: #a5b4fc; }
.fd-nav-link-icon { width: 20px; height: 20px; flex-shrink: 0; }

/* ── Loading & error ── */
.fd-loading {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  font-size: .9rem;
}
.fd-error {
  text-align: center;
  padding: 2rem;
  color: #ef4444;
  font-size: .85rem;
}

/* ── Tabs ── */
.fd-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.25rem;
  overflow-x: auto;
}
[data-theme="dark"] .fd-tabs { border-bottom-color: #334155; }
.fd-tab {
  padding: .6rem 1.1rem;
  font-size: .83rem;
  font-weight: 700;
  color: #64748b;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2.5px solid transparent;
  margin-bottom: -2px;
  white-space: nowrap;
  transition: color .12s, border-color .12s;
}
.fd-tab.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
}
.fd-tab:hover:not(.active) { color: #374151; }
[data-theme="dark"] .fd-tab:hover:not(.active) { color: #cbd5e1; }

/* ── Responsive ── */
@media (max-width: 480px) {
  .fd-root { padding: 1rem .75rem 4rem; }
  .fd-page-title { font-size: 1.3rem; }
}
`;

// ── Dimension icon map (normalized lowercase keys) ────────────────────────────

const DIM_ICON_MAP = {
  'emotional-adaptive':    '/icons/emotional-adaptive.svg',
  'somatic-regulative':    '/icons/somatic-regulative.svg',
  'relational-connective': '/icons/relational-connective.svg',
  'agentic-generative':    '/icons/agentic-generative.svg',
  'spiritual-reflective':  '/icons/spiritual-reflective.svg',
  'cognitive-narrative':   '/icons/cognitive-narrative.svg',
};

// ── Total activities in the KIDS_ACTIVITIES dataset ──────────────────────────

const TOTAL_ACTIVITIES = Object.values(KIDS_ACTIVITIES).reduce(
  (acc, arr) => acc + arr.length, 0
);

// ── Component ─────────────────────────────────────────────────────────────────

export default function FamilyDashboard() {
  const navigate = useNavigate();
  const { profiles, loading: profilesLoading, error: profilesError, errorCode: profilesErrorCode, switchProfile, refreshProfiles, loginWithRedirect } = useProfiles();

  const [showAddChild,    setShowAddChild]    = useState(false);
  const [editingProfile,  setEditingProfile]  = useState(null);
  const [activeTab,       setActiveTab]       = useState('overview');
  const [feedFilter,      setFeedFilter]      = useState('all'); // 'all' | profileId
  const [feedSort,        setFeedSort]        = useState('recent'); // 'recent' | 'stars'
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fd_dismissed_notifs') || '[]'); }
    catch { return []; }
  });

  // ── Per-profile data from localStorage ───────────────────────────────────

  const profileData = useMemo(() => {
    return profiles.map((p, idx) => {
      const keys     = getProfileStorageKeys(p.profileId);
      const progress = loadKidsProgress(keys);
      const stars    = getTotalKidsStars(keys);
      const level    = getKidsLevelInfo(keys);
      const byAge    = getCompletedCountPerAgeGroup(progress);
      const totalCompleted = Object.keys(progress).length;
      const thisWeek = countThisWeek(progress);
      const color    = getProfileColor(idx);

      // Recent activities with profile info attached
      const recentActivities = Object.values(progress)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 10)
        .map(r => ({ ...r, profileId: p.profileId, profileName: p.name, profileAvatar: p.avatar, profileColor: color }));

      // Notes
      const notes = loadKidsJSON(keys.PARENT_NOTES, []);

      // Overall completion percentage
      const pct = TOTAL_ACTIVITIES > 0
        ? Math.round((totalCompleted / TOTAL_ACTIVITIES) * 100)
        : 0;

      return { profile: p, progress, stars, level, byAge, totalCompleted, thisWeek, color, recentActivities, notes, pct };
    });
  }, [profiles]);

  // ── Aggregated summary metrics ─────────────────────────────────────────────

  const summaryMetrics = useMemo(() => {
    const totalChildren      = profiles.length;
    const totalActivitiesWeek = profileData.reduce((s, d) => s + d.thisWeek, 0);
    const totalCompleted     = profileData.reduce((s, d) => s + d.totalCompleted, 0);
    const totalStars         = profileData.reduce((s, d) => s + d.stars, 0);
    return { totalChildren, totalActivitiesWeek, totalCompleted, totalStars };
  }, [profiles.length, profileData]);

  // ── Aggregated activity feed ──────────────────────────────────────────────

  const allActivities = useMemo(() => {
    const activities = profileData.flatMap(d => d.recentActivities);
    const filtered   = feedFilter === 'all'
      ? activities
      : activities.filter(a => a.profileId === feedFilter);

    const sorted = [...filtered].sort((a, b) => {
      if (feedSort === 'stars') return (b.starsEarned || 0) - (a.starsEarned || 0);
      return new Date(b.completedAt) - new Date(a.completedAt);
    });

    return sorted.slice(0, 20);
  }, [profileData, feedFilter, feedSort]);

  // ── Notifications ─────────────────────────────────────────────────────────

  const notifications = useMemo(() => {
    const notifs = [];

    profileData.forEach(({ profile, thisWeek, totalCompleted, level, color }) => {
      // Milestone: first activity
      if (totalCompleted === 1) {
        notifs.push({
          id:   `first-${profile.profileId}`,
          type: 'success',
          icon: '/icons/star-burst.svg',
          text: `${profile.name} completed their first activity! Great start!`,
        });
      }
      // Streak-like: active this week
      if (thisWeek >= 3) {
        notifs.push({
          id:   `active-${profile.profileId}`,
          type: 'success',
          icon: '/icons/fire.svg',
          text: `${profile.name} has completed ${thisWeek} activities this week. Keep it up!`,
        });
      }
      // Level milestone
      if (level.level >= 3) {
        notifs.push({
          id:   `level-${profile.profileId}-${level.level}`,
          type: 'info',
          icon: '/icons/star.svg',
          text: `${profile.name} reached Level ${level.level}: ${level.title}!`,
        });
      }
    });

    if (profiles.length === 0) {
      notifs.push({
        id:   'no-profiles',
        type: 'info',
        icon: '/icons/network.svg',
        text: "Welcome! Add your first child profile to get started with the family dashboard.",
      });
    }

    // General reminder
    notifs.push({
      id:   'weekly-reminder',
      type: 'warn',
      icon: '/icons/journal.svg',
      text: 'Reminder: schedule 2–3 resilience activities per week for best results.',
    });

    return notifs.filter(n => !dismissedNotifs.includes(n.id));
  }, [profileData, profiles.length, dismissedNotifs]);

  const dismissNotif = useCallback((id) => {
    setDismissedNotifs(prev => {
      const updated = [...prev, id];
      try { localStorage.setItem('fd_dismissed_notifs', JSON.stringify(updated)); } catch { /* noop */ }
      return updated;
    });
  }, []);

  // ── Calendar events (upcoming sessions placeholder + completed activities) ─

  const calendarEvents = useMemo(() => {
    const events = [];

    // Recent completions shown as calendar entries
    profileData.forEach(({ profile, recentActivities, color }) => {
      recentActivities.slice(0, 3).forEach(r => {
        events.push({
          id:     `act-${r.activityId}-${profile.profileId}`,
          title:  r.activityId?.split('/')[1]?.replace(/-/g, ' ') || 'Activity',
          child:  profile.name,
          date:   r.completedAt,
          status: 'completed',
          color,
        });
      });
    });

    // Sort by most recent
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return events.slice(0, 12);
  }, [profileData]);

  // ── Handle child card click (switch profile + navigate) ─────────────────

  const handleChildClick = useCallback((profileId) => {
    switchProfile(profileId);
    navigate('/kids');
  }, [switchProfile, navigate]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (profilesLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="fd-loading" role="status" aria-live="polite">Loading family dashboard…</div>
      </>
    );
  }

  if (profilesError) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="fd-error" role="alert">
          <p>Error loading profiles: {profilesError}</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={refreshProfiles}
              style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Retry
            </button>
            {profilesErrorCode === 'auth' && (
              <button
                onClick={() => loginWithRedirect()}
                style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Log In Again
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="fd-root">

        {/* ── Page Header ── */}
        <header className="fd-page-header">
          <h1 className="fd-page-title">
            <img src="/icons/network.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Family Dashboard
          </h1>
          <p className="fd-page-sub">
            Manage all children's resilience journeys in one place.
          </p>
        </header>

        {/* ── Summary Stats ── */}
        <section aria-label="Summary statistics">
          <div className="fd-stats-grid">
            <div className="fd-stat-card">
              <img src="/icons/relational-connective.svg" alt="" aria-hidden="true" className="fd-stat-icon" />
              <div className="fd-stat-value">{summaryMetrics.totalChildren}</div>
              <div className="fd-stat-label">Children</div>
            </div>
            <div className="fd-stat-card">
              <img src="/icons/checkmark.svg" alt="" aria-hidden="true" className="fd-stat-icon" />
              <div className="fd-stat-value">{summaryMetrics.totalActivitiesWeek}</div>
              <div className="fd-stat-label">This Week</div>
            </div>
            <div className="fd-stat-card">
              <img src="/icons/star.svg" alt="" aria-hidden="true" className="fd-stat-icon" />
              <div className="fd-stat-value">{summaryMetrics.totalStars}</div>
              <div className="fd-stat-label">Total Stars</div>
            </div>
            <div className="fd-stat-card">
              <img src="/icons/badges.svg" alt="" aria-hidden="true" className="fd-stat-icon" />
              <div className="fd-stat-value">{summaryMetrics.totalCompleted}</div>
              <div className="fd-stat-label">Activities Done</div>
            </div>
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section aria-label="Quick actions">
          <div className="fd-quick-actions">
            <button
              className="fd-action-btn fd-action-btn-primary"
              onClick={() => setShowAddChild(true)}
              aria-label="Add new child profile"
            >
              ＋ Add Child
            </button>
            <Link
              to="/kids"
              className="fd-action-btn fd-action-btn-secondary"
              aria-label="Start a new activity"
            >
              ▶ Start Activity
            </Link>
            <Link
              to="/iatlas/clinical/session-plans"
              className="fd-action-btn fd-action-btn-tertiary"
              aria-label="Create a session plan"
            >
              Session Plan
            </Link>
            <Link
              to="/iatlas/clinical/aba-protocols"
              className="fd-action-btn fd-action-btn-ghost"
              aria-label="View protocol library"
            >
              Protocol Library
            </Link>
            <button
              className="fd-action-btn fd-action-btn-ghost"
              onClick={() => exportFamilyReportAsCSV(summaryMetrics, profileData)}
              aria-label="Export family progress report"
            >
              📊 Export Report
            </button>
          </div>
        </section>

        {/* ── Tabs ── */}
        <div role="tablist" aria-label="Dashboard sections" className="fd-tabs">
          {[
            { id: 'overview',      label: 'Overview'     },
            { id: 'activity',      label: 'Activity Feed' },
            { id: 'calendar',      label: 'Calendar'     },
            { id: 'progress',      label: 'Progress'     },
            { id: 'notifications', label: `Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`fd-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div role="tabpanel" aria-label="Overview">

            {/* Children grid */}
            <div className="fd-card">
              <h2 className="fd-section-title">
                <img src="/icons/relational-connective.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Children
              </h2>
              {profiles.length === 0 ? (
                <div className="fd-empty">
                  <span className="fd-empty-icon" aria-hidden="true"><img src="/icons/kids-spark.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                  No child profiles yet.
                  <br />
                  <button
                    onClick={() => setShowAddChild(true)}
                    style={{ marginTop: '.75rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '.5rem 1.2rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add First Child
                  </button>
                </div>
              ) : (
                <div className="fd-children-grid">
                  {profileData.map(({ profile, totalCompleted, stars, level, pct, color }) => (
                    <article
                      key={profile.profileId}
                      className="fd-child-card"
                      style={{ borderColor: color }}
                      onClick={() => handleChildClick(profile.profileId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChildClick(profile.profileId); } }}
                      aria-label={`View ${profile.name}'s profile`}
                    >
                      <div className="fd-child-card-header">
                        <span className="fd-child-avatar" aria-hidden="true"><img src={profile.avatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                        <div style={{ flex: 1 }}>
                          <p className="fd-child-name">{profile.name}</p>
                          {profile.ageGroup && (
                            <p className="fd-child-age">Ages {profile.ageGroup.replace('-', '–')}</p>
                          )}
                        </div>
                        <button
                          className="fd-child-edit-btn"
                          onClick={e => { e.stopPropagation(); setEditingProfile(profile.profileId); }}
                          aria-label={`Edit ${profile.name}'s profile`}
                          title="Edit profile"
                        >
                          ⋯
                        </button>
                      </div>
                      <div className="fd-child-stats">
                        <span className="fd-child-stat"><img src="/icons/success.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {totalCompleted} done</span>
                        <span className="fd-child-stat"><img src="/icons/star.svg" alt="" aria-hidden="true" className="icon icon-sm" /> {stars} stars</span>
                        <span className="fd-child-stat"><img src="/icons/trophy.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Lv {level.level}</span>
                      </div>
                      <div
                        className="fd-child-progress-bar-wrap"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${profile.name}: ${pct}% of activities completed`}
                      >
                        <div className="fd-child-progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <p className="fd-child-progress-label">{pct}% overall</p>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Recent activity (short preview) */}
            <div className="fd-card">
              <h2 className="fd-section-title">
                <img src="/icons/streaks.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Recent Activity
              </h2>
              {allActivities.length === 0 ? (
                <p className="fd-empty" style={{ padding: '1rem 0' }}>No activities yet. Encourage your children to start their first activity!</p>
              ) : (
                <div className="fd-feed">
                  {allActivities.slice(0, 5).map((r) => (
                    <div key={`${r.activityId}-${r.profileId}`} className="fd-feed-item">
                      <span className="fd-feed-avatar" aria-hidden="true"><img src={r.profileAvatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                      <img
                        src={DIM_ICON_MAP[r.dimension] || '/icons/compass.svg'}
                        alt=""
                        aria-hidden="true"
                        className="fd-feed-icon"
                      />
                      <div className="fd-feed-text">
                        <strong>{r.activityId?.split('/')[1]?.replace(/-/g, ' ') || 'Activity'}</strong>
                        {' — '}
                        <span style={{ textTransform: 'capitalize' }}>{r.dimension?.replace(/-/g, ' ')}</span>
                        <span
                          className="fd-feed-chip"
                          style={{ background: r.profileColor }}
                          aria-label={`Child: ${r.profileName}`}
                        >
                          {r.profileName}
                        </span>
                      </div>
                      <span className="fd-feed-time">{timeAgo(r.completedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
              {allActivities.length > 5 && (
                <button
                  onClick={() => setActiveTab('activity')}
                  style={{ marginTop: '.75rem', background: 'none', border: 'none', color: '#6366f1', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', padding: 0 }}
                >
                  View all {allActivities.length} activities →
                </button>
              )}
            </div>

            {/* Navigation links */}
            <div className="fd-card">
              <h2 className="fd-section-title">
                <img src="/icons/compass.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Navigate
              </h2>
              <nav aria-label="Dashboard navigation links">
                <div className="fd-nav-links">
                  <Link to="/kids" className="fd-nav-link">
                    <img src="/icons/badges.svg" alt="" aria-hidden="true" className="fd-nav-link-icon" />
                    Kids Curriculum
                  </Link>
                  <Link to="/iatlas/kids" className="fd-nav-link">
                    <img src="/icons/agentic-generative.svg" alt="" aria-hidden="true" className="fd-nav-link-icon" />
                    IATLAS Kids
                  </Link>
                  <Link to="/iatlas/clinical/session-plans" className="fd-nav-link">
                    <img src="/icons/compass.svg" alt="" aria-hidden="true" className="fd-nav-link-icon" />
                    Session Plans
                  </Link>
                  <Link to="/iatlas/clinical/aba-protocols" className="fd-nav-link">
                    <img src="/icons/story.svg" alt="" aria-hidden="true" className="fd-nav-link-icon" />
                    ABA Protocols
                  </Link>
                  <Link to="/iatlas" className="fd-nav-link">
                    <img src="/icons/checkmark.svg" alt="" aria-hidden="true" className="fd-nav-link-icon" />
                    IATLAS Curriculum
                  </Link>
                  <Link to="/dashboard" className="fd-nav-link">
                    <img src="/icons/star.svg" alt="" aria-hidden="true" className="fd-nav-link-icon" />
                    My Dashboard
                  </Link>
                </div>
              </nav>
            </div>

          </div>
        )}

        {/* ── Activity Feed Tab ── */}
        {activeTab === 'activity' && (
          <div role="tabpanel" aria-label="Activity feed">
            <div className="fd-card">
              <h2 className="fd-section-title">
                <img src="/icons/streaks.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Activity Feed
              </h2>

              {/* Filter & sort controls */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginBottom: '1rem', alignItems: 'center' }}>
                <div className="fd-filter-bar" style={{ margin: 0 }}>
                  <button
                    className={`fd-filter-btn${feedFilter === 'all' ? ' active' : ''}`}
                    onClick={() => setFeedFilter('all')}
                  >
                    All Children
                  </button>
                  {profileData.map(({ profile, color }) => (
                    <button
                      key={profile.profileId}
                      className={`fd-filter-btn${feedFilter === profile.profileId ? ' active' : ''}`}
                      onClick={() => setFeedFilter(profile.profileId)}
                      style={feedFilter === profile.profileId ? { background: color, borderColor: color } : {}}
                    >
                      {profile.name}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '.45rem', flexShrink: 0 }}>
                  <label htmlFor="fd-sort-select" style={{ fontSize: '.75rem', color: '#64748b', alignSelf: 'center' }}>Sort:</label>
                  <select
                    id="fd-sort-select"
                    value={feedSort}
                    onChange={e => setFeedSort(e.target.value)}
                    style={{ fontSize: '.78rem', padding: '.3rem .6rem', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#374151', cursor: 'pointer' }}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="stars">Most Stars</option>
                  </select>
                </div>
              </div>

              {allActivities.length === 0 ? (
                <div className="fd-empty">
                  <span className="fd-empty-icon" aria-hidden="true"><img src="/icons/goal.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                  No activities found. Try selecting "All Children" or start some activities!
                </div>
              ) : (
                <div className="fd-feed">
                  {allActivities.map((r) => (
                    <div key={`${r.activityId}-${r.profileId}-${r.completedAt}`} className="fd-feed-item">
                      <span className="fd-feed-avatar" aria-hidden="true"><img src={r.profileAvatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                      <img
                        src={DIM_ICON_MAP[r.dimension] || '/icons/compass.svg'}
                        alt=""
                        aria-hidden="true"
                        className="fd-feed-icon"
                      />
                      <div className="fd-feed-text">
                        <strong>{r.activityId?.split('/')[1]?.replace(/-/g, ' ') || 'Activity'}</strong>
                        {' — '}
                        <span style={{ textTransform: 'capitalize' }}>{r.dimension?.replace(/-/g, ' ')}</span>
                        {r.ageGroup && ` — ${AGE_GROUP_LABELS[r.ageGroup] || r.ageGroup}`}
                        {r.starsEarned ? ` (+${r.starsEarned} ★)` : ''}
                        <span
                          className="fd-feed-chip"
                          style={{ background: r.profileColor }}
                          aria-label={`Child: ${r.profileName}`}
                        >
                          {r.profileName}
                        </span>
                      </div>
                      <span className="fd-feed-time">{timeAgo(r.completedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Calendar Tab ── */}
        {activeTab === 'calendar' && (
          <div role="tabpanel" aria-label="Calendar">
            <div className="fd-card">
              <h2 className="fd-section-title">
                <img src="/icons/streaks.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Activity Calendar
              </h2>
              <p style={{ fontSize: '.82rem', color: '#64748b', marginBottom: '1rem' }}>
                Recent completed activities across all children. For clinical session schedules, visit{' '}
                <Link to="/iatlas/clinical/session-plans" style={{ color: '#6366f1', fontWeight: 700 }}>Session Plans</Link>.
              </p>

              {calendarEvents.length === 0 ? (
                <div className="fd-empty">
                  <span className="fd-empty-icon" aria-hidden="true"><img src="/icons/journal.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                  No activity history yet.
                </div>
              ) : (
                <div className="fd-calendar-list">
                  {calendarEvents.map(event => (
                    <div key={event.id} className="fd-calendar-item">
                      <div className="fd-calendar-dot" style={{ background: event.color }} aria-hidden="true" />
                      <div className="fd-calendar-info">
                        <div className="fd-calendar-title">{event.title}</div>
                        <div className="fd-calendar-sub">{event.child} · {formatDate(event.date)}</div>
                      </div>
                      <span
                        className="fd-calendar-badge"
                        style={{
                          background: event.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color:      event.status === 'completed' ? '#15803d' : '#92400e',
                        }}
                      >
                        {event.status === 'completed' ? '✓ Done' : 'Planned'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1.5px solid #f1f5f9' }}>
                <p style={{ fontSize: '.82rem', color: '#64748b', marginBottom: '.65rem' }}>Manage clinical sessions:</p>
                <Link to="/iatlas/clinical/session-plans" className="fd-action-btn fd-action-btn-tertiary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                  View Session Plans
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Progress Tab ── */}
        {activeTab === 'progress' && (
          <div role="tabpanel" aria-label="Progress analytics">
            {profileData.length === 0 ? (
              <div className="fd-card">
                <div className="fd-empty">
                  <span className="fd-empty-icon" aria-hidden="true"><img src="/icons/org-leaderboards.svg" alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                  Add children to see their progress analytics.
                </div>
              </div>
            ) : (
              profileData.map(({ profile, totalCompleted, stars, level, byAge, color, pct }) => {
                const ageGroups = [
                  { id: 'age-5-7',   label: 'Ages 5–7',   total: (KIDS_ACTIVITIES['age-5-7']   || []).length },
                  { id: 'age-8-10',  label: 'Ages 8–10',  total: (KIDS_ACTIVITIES['age-8-10']  || []).length },
                  { id: 'age-11-14', label: 'Ages 11–14', total: (KIDS_ACTIVITIES['age-11-14'] || []).length },
                  { id: 'age-15-18', label: 'Ages 15–18', total: (KIDS_ACTIVITIES['age-15-18'] || []).length },
                ];
                return (
                  <div
                    key={profile.profileId}
                    className="fd-card"
                    style={{ borderLeftWidth: 4, borderLeftColor: color }}
                    role="region"
                    aria-label={`${profile.name}'s progress`}
                  >
                    <h2 className="fd-section-title">
                      <span aria-hidden="true"><img src={profile.avatar || '/icons/kids-spark.svg'} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span>
                      {profile.name}
                    </h2>

                    {/* Summary chips */}
                    <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      <div className="fd-stat-card" style={{ flex: '1', minWidth: 80 }}>
                        <div className="fd-stat-value" style={{ fontSize: '1.25rem' }}>{totalCompleted}</div>
                        <div className="fd-stat-label">Activities</div>
                      </div>
                      <div className="fd-stat-card" style={{ flex: '1', minWidth: 80 }}>
                        <div className="fd-stat-value" style={{ fontSize: '1.25rem', color: '#f59e0b' }}>{stars}</div>
                        <div className="fd-stat-label">Stars</div>
                      </div>
                      <div className="fd-stat-card" style={{ flex: '1', minWidth: 80 }}>
                        <div className="fd-stat-value" style={{ fontSize: '1.25rem', color: color }}>{level.level}</div>
                        <div className="fd-stat-label">Level</div>
                      </div>
                      <div className="fd-stat-card" style={{ flex: '1', minWidth: 80 }}>
                        <div className="fd-stat-value" style={{ fontSize: '1.25rem' }}>{pct}%</div>
                        <div className="fd-stat-label">Overall</div>
                      </div>
                    </div>

                    {/* Level info */}
                    <p style={{ fontSize: '.82rem', fontWeight: 700, color: level.color || color, marginBottom: '.25rem' }}>
                      Level {level.level}: {level.title}
                    </p>
                    <p style={{ fontSize: '.78rem', color: '#64748b', marginBottom: '1rem' }}>{level.message}</p>

                    {/* Progress by age group */}
                    <h3 style={{ fontSize: '.85rem', fontWeight: 700, color: '#374151', margin: '0 0 .75rem' }}>
                      Progress by Age Group
                    </h3>
                    {ageGroups.map(ag => {
                      const done = byAge[ag.id] || 0;
                      const agPct = ag.total > 0 ? Math.round((done / ag.total) * 100) : 0;
                      return (
                        <div key={ag.id} className="fd-progress-row">
                          <span className="fd-progress-label">{ag.label}</span>
                          <div
                            className="fd-progress-bar-wrap"
                            role="progressbar"
                            aria-valuenow={agPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${ag.label}: ${agPct}% complete`}
                          >
                            <div className="fd-progress-bar-fill" style={{ width: `${agPct}%`, background: color }} />
                          </div>
                          <span className="fd-progress-count">{done}/{ag.total}</span>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => handleChildClick(profile.profileId)}
                      style={{ marginTop: '.85rem', background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '.5rem 1.1rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}
                      aria-label={`View ${profile.name}'s full profile`}
                    >
                      View Full Profile →
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === 'notifications' && (
          <div role="tabpanel" aria-label="Notifications">
            <div className="fd-card">
              <h2 className="fd-section-title">
                <img src="/icons/badges.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Notifications
              </h2>
              {notifications.length === 0 ? (
                <div className="fd-empty">
                  <span className="fd-empty-icon" aria-hidden="true">🔔</span>
                  No notifications right now. Check back after your children complete more activities!
                </div>
              ) : (
                <div className="fd-notif-list">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`fd-notif-item fd-notif-${notif.type}`} role="alert">
                      <span className="fd-notif-icon" aria-hidden="true"><img src={notif.icon} alt="" aria-hidden="true" className="icon icon-sm" /></span>
                      <span className="fd-notif-text">{notif.text}</span>
                      <button
                        onClick={() => dismissNotif(notif.id)}
                        aria-label="Dismiss notification"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', padding: '0 .25rem', flexShrink: 0 }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="fd-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
              <h2 className="fd-section-title" style={{ color: '#15803d' }}>
                <img src="/icons/relational-connective.svg" alt="" aria-hidden="true" className="fd-section-icon" />
                Family Tips
              </h2>
              <ul style={{ margin: 0, padding: '0 0 0 1.1rem', fontSize: '.83rem', color: '#166534', lineHeight: 1.8 }}>
                <li>Schedule 2–3 short resilience activities per week for each child.</li>
                <li>Celebrate completions together — even small wins matter!</li>
                <li>Use celebration notes in each child's profile to reinforce growth.</li>
                <li>Try activities across different dimensions for balanced development.</li>
                <li>Clinical session plans can be scheduled at{' '}
                  <Link to="/iatlas/clinical/session-plans" style={{ color: '#15803d', fontWeight: 700 }}>Session Plans</Link>.
                </li>
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* ── Add Child Modal ── */}
      {showAddChild && (
        <AddChildModal
          onClose={() => setShowAddChild(false)}
          currentCount={profiles.length}
        />
      )}

      {/* ── Edit Profile Modal ── */}
      {editingProfile && (() => {
        const prof = profiles.find(p => p.profileId === editingProfile);
        return prof ? (
          <EditProfileModal
            profile={prof}
            onClose={() => setEditingProfile(null)}
            onUpdated={() => { setEditingProfile(null); refreshProfiles(); }}
            onDeleted={() => { setEditingProfile(null); refreshProfiles(); }}
          />
        ) : null;
      })()}
    </>
  );
}
