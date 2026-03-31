import React, { useState, useEffect } from 'react';

const PERIODS = [
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'alltime', label: 'All-Time' },
];

const s = {
  widget: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: '20px 24px',
  },
  widgetTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a2e',
    margin: '0 0 14px',
  },
  optInMsg: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 14,
    margin: '0 0 14px',
  },
  optInBtn: {
    display: 'inline-block',
    background: '#fff',
    color: '#374151',
    fontWeight: 600,
    fontSize: 13,
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    cursor: 'pointer',
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
    background: active ? '#2563eb' : '#fff',
    color: active ? '#fff' : '#64748b',
    borderColor: active ? '#2563eb' : '#d1d5db',
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
    color: '#64748b',
    borderBottom: '1px solid #e2e8f0',
    fontSize: 12,
  },
  td: {
    padding: '7px 8px',
    borderBottom: '1px solid #f1f5f9',
    color: '#1a1a2e',
  },
  rank: {
    fontWeight: 700,
    width: 30,
  },
  points: {
    fontWeight: 700,
    color: '#2563eb',
    textAlign: 'right',
  },
  streak: {
    textAlign: 'right',
    color: '#64748b',
  },
  empty: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    margin: 0,
  },
  loading: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  errorMsg: {
    fontSize: 13,
    color: '#dc2626',
    margin: 0,
  },
};

/**
 * Displays the opt-in leaderboard with period tabs.
 */
export default function LeaderboardWidget({ progress, fetchLeaderboard, onEnableLeaderboard }) {
  const [period, setPeriod]     = useState('weekly');
  const [entries, setEntries]   = useState([]);
  const [fetching, setFetching] = useState(false);
  const [lbError, setLbError]   = useState(null);

  const optedIn = progress?.leaderboardOptIn;

  useEffect(() => {
    if (!optedIn) return;
    setFetching(true);
    setLbError(null);
    fetchLeaderboard(period)
      .then(data => setEntries(data))
      .catch(err => setLbError(err.message || 'Could not load leaderboard.'))
      .finally(() => setFetching(false));
  }, [optedIn, period, fetchLeaderboard]);

  const periodLabel = PERIODS.find(p => p.value === period)?.label || 'Weekly';

  if (!optedIn) {
    return (
      <div style={s.widget} role="region" aria-label="Leaderboard">
        <h3 style={s.widgetTitle}>Leaderboard</h3>
        <p style={s.optInMsg}>Enable the leaderboard in your preferences to see your ranking.</p>
        <button
          style={s.optInBtn}
          onClick={async () => {
            try {
              await onEnableLeaderboard();
            } catch (_) {
              /* parent hook shows toast on error */
            }
          }}
        >
          Enable Leaderboard
        </button>
      </div>
    );
  }

  return (
    <div style={s.widget} role="region" aria-label={`${periodLabel} leaderboard`}>
      <h3 style={s.widgetTitle}>{periodLabel} Leaderboard</h3>

      <div style={s.tabs} role="tablist" aria-label="Leaderboard period">
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

      {fetching && <p style={s.loading}>Loading…</p>}
      {lbError && <p style={s.errorMsg}>{lbError}</p>}

      {!fetching && !lbError && entries.length === 0 && (
        <p style={s.empty}>No entries yet. Complete practices to appear here.</p>
      )}

      {!fetching && !lbError && entries.length > 0 && (
        <table style={s.table} aria-label="Leaderboard standings">
          <thead>
            <tr>
              <th scope="col" style={{ ...s.th, ...s.rank }}>#</th>
              <th scope="col" style={s.th}>Name</th>
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
                <td style={{ ...s.td, ...s.streak }}>{e.currentStreak} 🔥</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
