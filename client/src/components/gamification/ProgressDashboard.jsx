import React from 'react';
import { ADULT_BADGES, DIMENSION_COLORS, SKILL_PATHWAYS } from '../../data/adultGames.js';
import ReinforcementMenu from './ReinforcementMenu.jsx';

const DIMENSIONS = ['Agentic-Generative','Relational-Connective','Emotional-Adaptive','Spiritual-Reflective','Somatic-Regulative','Cognitive-Narrative'];
const DIM_ICONS = {
  'Agentic-Generative':   '/icons/agentic-generative.svg',
  'Relational-Connective': '/icons/relational-connective.svg',
  'Emotional-Adaptive':   '/icons/emotional-adaptive.svg',
  'Spiritual-Reflective': '/icons/spiritual-reflective.svg',
  'Somatic-Regulative':   '/icons/somatic-regulative.svg',
  'Cognitive-Narrative':  '/icons/cognitive-narrative.svg',
};

const s = {
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 16px', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 },
  statCard: {
    flex: '1 1 140px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '16px',
    minWidth: 120,
  },
  statVal: { fontSize: 28, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#718096', marginTop: 4 },
  badgeGrid: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  badgeCard: (earned, rarity) => {
    const borderColor = rarity === 'legendary' ? 'rgba(234,179,8,0.3)' : rarity === 'rare' ? 'rgba(99,102,241,0.3)' : rarity === 'uncommon' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)';
    const bg = rarity === 'legendary' ? 'rgba(234,179,8,0.04)' : 'rgba(255,255,255,0.02)';
    return {
      padding: '10px 14px', borderRadius: 8, textAlign: 'center',
      border: `1px solid ${earned ? borderColor : 'rgba(255,255,255,0.04)'}`,
      background: earned ? bg : 'rgba(255,255,255,0.01)',
      opacity: earned ? 1 : 0.35, minWidth: 100,
    };
  },
  badgeIcon: { fontSize: 20, marginBottom: 4 },
  badgeLabel: { fontSize: 11, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.2 },
  badgeRarity: (rarity) => ({
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: rarity === 'legendary' ? '#eab308' : rarity === 'rare' ? '#818cf8' : rarity === 'uncommon' ? '#34d399' : '#6b7280',
    marginTop: 2,
  }),
  pathwayRow: { display: 'flex', flexDirection: 'column', gap: 10 },
  pathwayItem: { display: 'flex', alignItems: 'center', gap: 12 },
  pathwayLabel: { width: 180, fontSize: 13, color: '#94a3b8', flexShrink: 0 },
  progressBar: { flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill: (pct, dim) => ({
    height: '100%', width: `${pct}%`, borderRadius: 3,
    background: DIMENSION_COLORS[dim]?.accent || '#4f46e5',
    transition: 'width 0.6s ease',
  }),
  pathwayPct: { fontSize: 12, color: '#718096', width: 36, textAlign: 'right', flexShrink: 0 },
  streakBox: {
    display: 'flex', gap: 20, flexWrap: 'wrap',
    background: 'rgba(14,165,233,0.04)', border: '1px solid rgba(14,165,233,0.1)',
    borderRadius: 10, padding: '16px 20px', marginBottom: 24,
  },
  streakStat: { textAlign: 'center' },
  streakVal: { fontSize: 26, fontWeight: 800, color: '#7aafc8' },
  streakLabel: { fontSize: 11, color: '#718096' },
};

export default function ProgressDashboard({ tier, progress, loading, tierBlocked }) {
  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#718096', fontSize: 14 }}>
        Loading progress data…
      </div>
    );
  }

  if (tierBlocked) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#718096', fontSize: 14 }}>
        <div style={{ fontSize: 20, marginBottom: 12 }}>🔒</div>
        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>Upgrade required</div>
        <div>A paid Atlas plan is required to access gamification features and track your resilience progress.</div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#718096', fontSize: 14 }}>
        No progress data yet. Start completing practices to begin tracking your resilience journey!
      </div>
    );
  }

  const earnedBadgeNames  = new Set(progress.badges?.map(b => b.name) || []);
  const totalPoints        = progress.totalPoints || 0;
  const currentStreak      = progress.currentStreak?.days || 0;
  const longestStreak      = progress.longestStreak || 0;
  const microQuestCount    = progress.microQuests?.length || 0;
  const pathwayEntries     = progress.skillPathways || [];

  function getLevelsDone(dim) {
    return pathwayEntries.filter(p => p.dimension === dim).length;
  }

  const isNavigator = tier === 'atlas-navigator';

  const relevantBadges = ADULT_BADGES.filter(b => b.tier === 'starter' || (isNavigator && b.tier === 'navigator'));

  return (
    <div>
      {/* Stats Overview */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Progress Overview</h3>
        <div style={s.statsRow}>
          <div style={s.statCard}>
            <div style={s.statVal}>{totalPoints}</div>
            <div style={s.statLabel}>Total Points</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statVal}>{currentStreak}</div>
            <div style={s.statLabel}>Current Streak (days)</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statVal}>{longestStreak}</div>
            <div style={s.statLabel}>Longest Streak</div>
          </div>
          <div style={s.statCard}>
            <div style={s.statVal}>{microQuestCount}</div>
            <div style={s.statLabel}>Practices Completed</div>
          </div>
          {isNavigator && (
            <div style={s.statCard}>
              <div style={s.statVal}>{pathwayEntries.length}</div>
              <div style={s.statLabel}>Pathway Levels Done</div>
            </div>
          )}
        </div>
      </div>

      {/* Streak */}
      {(currentStreak > 0 || longestStreak > 0) && (
        <div style={s.streakBox}>
          <div style={s.streakStat}>
            <div style={s.streakVal}>{currentStreak}</div>
            <div style={s.streakLabel}>Current Streak</div>
          </div>
          <div style={s.streakStat}>
            <div style={s.streakVal}>{longestStreak}</div>
            <div style={s.streakLabel}>Longest Streak</div>
          </div>
          <div style={{ flex: 1, fontSize: 13, color: '#718096', lineHeight: 1.6, alignSelf: 'center' }}>
            Flexible engagement tracking — consistent, values-aligned practice is the goal; strict daily completion is not required.
          </div>
        </div>
      )}

      {/* Badges */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Achievement Badges</h3>
        <div style={s.badgeGrid}>
          {relevantBadges.map(badge => {
            const earned = earnedBadgeNames.has(badge.label);
            return (
              <div key={badge.id} style={s.badgeCard(earned, badge.rarity)} title={earned ? badge.description : 'Not yet earned'}>
                <div style={s.badgeIcon}>
                  <img src={badge.icon} alt="" aria-hidden="true" width={20} height={20} style={{ verticalAlign: 'middle' }} />
                </div>
                <div style={s.badgeLabel}>{badge.label}</div>
                <div style={s.badgeRarity(badge.rarity)}>{badge.rarity}</div>
                {earned && <div style={{ fontSize: 9, color: '#34d399', marginTop: 2 }}>Earned</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigator: Pathway Completion */}
      {isNavigator && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Skill Pathway Progress</h3>
          <div style={s.pathwayRow}>
            {DIMENSIONS.map(dim => {
              const done = getLevelsDone(dim);
              const pct  = Math.round((done / 3) * 100);
              return (
                <div key={dim} style={s.pathwayItem}>
                  <div style={s.pathwayLabel}>
                    <img src={DIM_ICONS[dim]} alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {dim.split('-')[0]}
                  </div>
                  <div style={s.progressBar} aria-label={`${dim} pathway: ${pct}% complete`}>
                    <div style={s.progressFill(pct, dim)} />
                  </div>
                  <div style={s.pathwayPct}>{pct}%</div>
                </div>
              );
            })}
          </div>
          {DIMENSIONS.every(dim => getLevelsDone(dim) === 3) && (
            <div style={{ marginTop: 16, textAlign: 'center', padding: '16px', background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>✦</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#eab308', marginTop: 4 }}>Compass Sage</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>All 6 dimension pathways complete. Elite status achieved.</div>
            </div>
          )}
        </div>
      )}

      {/* Navigator: Reinforcement Menu */}
      {isNavigator && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Reinforcement Practice Menu</h3>
          <ReinforcementMenu progress={progress} />
        </div>
      )}
    </div>
  );
}
