import React, { useState, useEffect } from 'react';

const PERIODS = [
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'alltime', label: 'All-Time' },
];

const s = {
  widget: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '20px 24px',
  },
  subtitle: {
    color: '#7aafc8',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e8f0fe',
    margin: '0 0 16px',
  },
  optInMsg: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
  },
  optInBtn: {
    display: 'inline-block',
    background: 'rgba(14,165,233,0.15)',
    color: '#38bdf8',
    fontWeight: 600,
    fontSize: 13,
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid rgba(14,165,233,0.3)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabs: {
    display: 'flex',
    gap: 6,
    marginBottom: 14,
  },
  tab: (active) => ({
    padding: '5px 14px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid',
    cursor: 'pointer',
    background: active ? '#0ea5e9' : 'transparent',
    color: active ? '#fff' : '#64748b',
    borderColor: active ? '#0ea5e9' : 'rgba(255,255,255,0.12)',
    transition: 'all 0.15s',
  }),
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '6px 8px',
    fontWeight: 600,
    color: '#4a5568',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  td: {
    padding: '8px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    color: '#e2e8f0',
  },
  rank: {
    fontWeight: 700,
    width: 32,
    color: '#7aafc8',
  },
  points: {
    fontWeight: 700,
    color: '#38bdf8',
    textAlign: 'right',
  },
  streak: {
    textAlign: 'right',
    color: '#fcd34d',
  },
  empty: {
    fontSize: 13,
    color: '#4a5568',
    fontStyle: 'italic',
  },
  loading: {
    fontSize: 13,
    color: '#64748b',
  },
  errorMsg: {
    fontSize: 12,
    color: '#f87171',
  },
};

/**
 * ResilienceMap — Atlas Navigator feature.
 * Opt-in leaderboard/map showing navigator rankings.
 *
 * Props:
 *   progress          — gamification progress object
 *   fetchLeaderboard  — function(period) → Promise<entries>
 *   onEnableLeaderboard — function() → Promise<void>
 */
export default function ResilienceMap({ progress, fetchLeaderboard, onEnableLeaderboard }) {
  const [period, setPeriod]     = useState('weekly');
  const [entries, setEntries]   = useState([]);
  const [fetching, setFetching] = useState(false);
  const [lbError, setLbError]   = useState(null);

  const optedIn = progress?.leaderboardOptIn;

  useEffect(() => {
    if (!optedIn || !fetchLeaderboard) return;
    setFetching(true);
    setLbError(null);
    fetchLeaderboard(period)
      .then(data => setEntries(data))
      .catch(err => setLbError(err.message || 'Could not load the Resilience Map.'))
      .finally(() => setFetching(false));
  }, [optedIn, period, fetchLeaderboard]);

  const periodLabel = PERIODS.find(p => p.value === period)?.label || 'Weekly';

  if (!optedIn) {
    return (
      <div style={s.widget} role="region" aria-label="Resilience Map">
        <div style={s.subtitle}>Atlas Navigator</div>
        <h3 style={s.widgetTitle}>🗺️ Your Resilience Map</h3>
        <p style={s.optInMsg}>
          Join the Navigator Rankings — an opt-in map showing resilience progress across
          the Atlas community. Your position is highlighted.
        </p>
        <button
          style={s.optInBtn}
          onClick={async () => {
            try { await onEnableLeaderboard(); } catch (_) { /* toasts handled by hook */ }
          }}
        >
          Join Navigator Rankings 🗺️
        </button>
      </div>
    );
  }

  return (
    <div style={s.widget} role="region" aria-label={`${periodLabel} Navigator Rankings`}>
      <div style={s.subtitle}>Atlas Navigator</div>
      <h3 style={s.widgetTitle}>🗺️ Navigator Rankings — {periodLabel}</h3>

      <div style={s.tabs} role="tablist" aria-label="Rankings period">
        {PERIODS.map(p => (
          <button
            key={p.value}
            style={s.tab(period === p.value)}
            role="tab"
            aria-selected={period === p.value}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {fetching && <p style={s.loading}>Loading navigator rankings…</p>}
      {lbError  && <p style={s.errorMsg}>{lbError}</p>}

      {!fetching && !lbError && entries.length === 0 && (
        <p style={s.empty}>No navigators yet. Complete resilience practices to appear here.</p>
      )}

      {!fetching && !lbError && entries.length > 0 && (
        <table style={s.table} aria-label="Navigator leaderboard standings">
          <thead>
            <tr>
              <th scope="col" style={{ ...s.th, ...s.rank }}>#</th>
              <th scope="col" style={s.th}>Navigator</th>
              <th scope="col" style={{ ...s.th, textAlign: 'right' }}>Points</th>
              <th scope="col" style={{ ...s.th, textAlign: 'right' }}>Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.rank}>
                <td style={{ ...s.td, ...s.rank }}>{e.rank}</td>
                <td style={s.td}>{e.username}</td>
                <td style={{ ...s.td, ...s.points }}>{e.totalPoints}</td>
                <td style={{ ...s.td, ...s.streak }}>{e.currentStreak} 🧭</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
