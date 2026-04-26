import React from 'react';
import { ADULT_BADGES, IARF_SKILL_BADGES, DIMENSION_COLORS, SKILL_PATHWAYS } from '../../data/adultGames.js';
import { computeXPLevel, getStreakBadgeTier } from '../../data/gamificationContent.js';
import ReinforcementMenu from './ReinforcementMenu.jsx';
import DimensionalBalanceWheel from './DimensionalBalanceWheel.jsx';

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
  xpBar: {
    width: '100%', height: 8, background: 'rgba(255,255,255,0.08)',
    borderRadius: 4, overflow: 'hidden', marginTop: 8,
  },
  xpBarFill: (pct, color) => ({
    height: '100%', width: `${pct}%`, borderRadius: 4,
    background: color || '#4f46e5',
    transition: 'width 0.8s ease',
  }),
  dimStreakRow: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
  },
  dimStreakCard: (accent) => ({
    flex: '1 1 130px', minWidth: 110,
    background: `${accent}08`,
    border: `1px solid ${accent}22`,
    borderRadius: 8, padding: '10px 12px',
    textAlign: 'center',
  }),
  dimStreakVal: (accent) => ({ fontSize: 20, fontWeight: 800, color: accent }),
  dimStreakLabel: { fontSize: 10, color: '#718096', marginTop: 2 },
  dimStreakBadge: { fontSize: 10, marginTop: 2 },
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
        <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 24, height: 24, marginBottom: 12 }} />
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
  const dimensionalStreaks = progress.dimensionalStreaks || [];

  // XP level computation
  const xpLevel = computeXPLevel(totalPoints);

  function getLevelsDone(dim) {
    return pathwayEntries.filter(p => p.dimension === dim).length;
  }

  function getDimStreak(dim) {
    return dimensionalStreaks.find(d => d.dimension === dim) || { current: 0, longest: 0, totalCount: 0 };
  }

  const isNavigator = tier === 'atlas-navigator';

  // Combine ADULT_BADGES and IARF_SKILL_BADGES for display
  const baseAdultBadges = ADULT_BADGES.filter(b => b.tier === 'starter' || (isNavigator && b.tier === 'navigator'));
  const iarlBadges = (IARF_SKILL_BADGES || []).filter(b => b.tier === 'starter' || (isNavigator && b.tier === 'navigator'));
  const relevantBadges = [...baseAdultBadges, ...iarlBadges];

  return (
    <div>
      {/* XP Level Banner */}
      <div style={{ ...s.section, background: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.8))`, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{xpLevel.tierIcon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: xpLevel.tierColor }}>
                  Level {xpLevel.level} — {xpLevel.tierName}
                </div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                  {xpLevel.xp.toLocaleString()} XP
                  {xpLevel.nextLevelXP ? ` / ${xpLevel.nextLevelXP.toLocaleString()} XP to next level` : ' — Max level reached!'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '4px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0' }}>{totalPoints * 10}</div>
              <div style={{ fontSize: 10, color: '#718096' }}>Total XP</div>
            </div>
          </div>
        </div>
        {/* XP Progress Bar */}
        {xpLevel.nextLevelXP && (
          <div style={{ marginTop: 12 }}>
            <div style={s.xpBar} role="progressbar" aria-valuenow={xpLevel.progressPct} aria-valuemin={0} aria-valuemax={100}>
              <div style={s.xpBarFill(xpLevel.progressPct, xpLevel.tierColor)} />
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'right' }}>
              {xpLevel.progressPct}% to Level {xpLevel.level + 1}
            </div>
          </div>
        )}
      </div>

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

      {/* Dimensional Streaks */}
      {dimensionalStreaks.length > 0 && (
        <div style={{ ...s.section, marginBottom: 24 }}>
          <h3 style={s.sectionTitle}>🔥 Active Dimension Streaks</h3>
          <div style={s.dimStreakRow}>
            {DIMENSIONS.map(dim => {
              const ds     = getDimStreak(dim);
              const meta   = DIMENSION_COLORS[dim] || {};
              const accent = meta.accent || '#818cf8';
              const badgeTier = getStreakBadgeTier(ds.current);
              if (!ds.current && !ds.longest) return null;
              return (
                <div key={dim} style={s.dimStreakCard(accent)}>
                  <img src={DIM_ICONS[dim]} alt="" aria-hidden="true" width={18} height={18} />
                  <div style={s.dimStreakVal(accent)} aria-label={`${dim} streak: ${ds.current} days`}>
                    🔥 {ds.current}
                  </div>
                  <div style={s.dimStreakLabel}>{dim.split('-')[0]} streak</div>
                  {badgeTier && (
                    <div style={s.dimStreakBadge}>{badgeTier.label}</div>
                  )}
                  {ds.longest > 0 && (
                    <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>Best: {ds.longest}d</div>
                  )}
                </div>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}

      {/* Dimensional Balance Wheel */}
      {isNavigator && (
        <div style={{ ...s.section, marginBottom: 24 }}>
          <DimensionalBalanceWheel
            scores={Object.fromEntries(
              DIMENSIONS.map(dim => {
                const done = getLevelsDone(dim);
                return [dim, Math.round((done / 3) * 100)];
              })
            )}
          />
        </div>
      )}

      {/* Badges */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Achievement Badges</h3>
        <div style={s.badgeGrid}>
          {relevantBadges.map(badge => {
            const earned = earnedBadgeNames.has(badge.label);
            return (
              <div key={badge.id} style={s.badgeCard(earned, badge.rarity)} title={earned ? badge.description : `${badge.description || 'Not yet earned'}`}>
                <div style={s.badgeIcon}>
                  {badge.emoji
                    ? <span style={{ fontSize: 16 }}>{badge.emoji}</span>
                    : <img src={badge.icon} alt="" aria-hidden="true" width={20} height={20} style={{ verticalAlign: 'middle' }} />
                  }
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
