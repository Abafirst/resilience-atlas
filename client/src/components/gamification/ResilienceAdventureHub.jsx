import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import useGamification from '../../hooks/useGamification.js';
import { MICRO_QUESTS, ADULT_BADGES, DIMENSION_COLORS, SKILL_PATHWAYS } from '../../data/adultGames.js';
import { isStarterOrAbove, isNavigatorOrAbove, CHECKOUT_URLS } from '../../data/gamificationContent.js';
import GamificationToast from './GamificationToast.jsx';
import StarterMicroQuests from './StarterMicroQuests.jsx';
import NavigatorSkillPaths from './NavigatorSkillPaths.jsx';
import ProgressDashboard from './ProgressDashboard.jsx';
import { apiUrl } from '../../api/baseUrl.js';

async function fetchUserTier(email, token) {
  if (!email) return 'free';
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(apiUrl(`/api/report/access?email=${encodeURIComponent(email)}`), { headers });
  if (!res.ok) throw new Error(`Access check failed (${res.status})`);
  const data = await res.json();
  if (!data.hasAccess) return 'free';
  const purchases = Array.isArray(data.purchases) ? data.purchases : [];
  const tiers = purchases.map(p => p.tier);
  if (tiers.some(t => t === 'atlas-premium')) return 'atlas-navigator';
  if (tiers.some(t => t === 'atlas-navigator') || data.hasNavigatorAccess) return 'atlas-navigator';
  if (tiers.some(t => t === 'atlas-starter')) return 'atlas-starter';
  if (tiers.some(t => t === 'teams-enterprise' || t === 'enterprise')) return 'atlas-navigator';
  if (tiers.some(t => t === 'teams-pro' || t === 'pro')) return 'atlas-navigator';
  if (tiers.some(t => t === 'teams-starter' || t === 'starter')) return 'atlas-starter';
  if (purchases.length === 0) return 'atlas-starter';
  return 'free';
}

const RECOMMENDED_IDS = ['mq-agentic', 'mq-emotional', 'mq-somatic'];

const s = {
  wrap: {
    fontFamily: "'Inter','Segoe UI',sans-serif",
    color: '#1e293b',
    background: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  hero: {
    background: 'linear-gradient(135deg,#0d2137 0%,#1e40af 60%,#0369a1 100%)',
    padding: '32px 28px 28px',
    color: '#fff',
  },
  eyebrow: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: '#93c5fd', marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24, fontWeight: 800, margin: '0 0 8px',
    color: '#fff', lineHeight: 1.2,
  },
  heroSub: {
    fontSize: 13, color: '#bae6fd', margin: '0 0 16px', lineHeight: 1.6, maxWidth: 460,
  },
  tierPill: (tier) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: isNavigatorOrAbove(tier) ? 'rgba(79,70,229,0.25)' : isStarterOrAbove(tier) ? 'rgba(14,165,233,0.25)' : 'rgba(100,116,139,0.25)',
    color: isNavigatorOrAbove(tier) ? '#a5b4fc' : isStarterOrAbove(tier) ? '#7dd3fc' : '#cbd5e1',
    border: `1px solid ${isNavigatorOrAbove(tier) ? 'rgba(79,70,229,0.5)' : isStarterOrAbove(tier) ? 'rgba(14,165,233,0.5)' : 'rgba(100,116,139,0.4)'}`,
    marginBottom: 12,
  }),
  ctaRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  ctaPrimary: {
    padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
    transition: 'background 0.15s',
  },
  ctaSecondary: {
    padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: 'transparent', color: '#93c5fd',
    border: '1px solid rgba(147,197,253,0.5)', cursor: 'pointer',
  },
  progressPanel: {
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '16px 24px',
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  progItem: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
  },
  progVal: {
    fontWeight: 700, fontSize: 18, color: '#0f172a',
  },
  progLabel: {
    color: '#64748b', fontSize: 11, lineHeight: 1.3,
  },
  infoBtn: {
    background: 'none', border: 'none', cursor: 'pointer', padding: 2,
    color: '#94a3b8', display: 'inline-flex', alignItems: 'center',
  },
  nextBadge: {
    marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
    background: '#f1f5f9', borderRadius: 8, padding: '6px 12px',
    fontSize: 12,
  },
  tabs: {
    display: 'flex', gap: 4, padding: '14px 24px',
    borderBottom: '1px solid #e2e8f0', background: '#fff',
  },
  tab: (active) => ({
    padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
    background: active ? '#eff6ff' : 'transparent',
    color: active ? '#1d4ed8' : '#64748b',
    outline: active ? '1px solid #bfdbfe' : '1px solid transparent',
  }),
  content: { padding: '24px' },
  sectionTitle: {
    fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  recommendedGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
    gap: 12, marginBottom: 28,
  },
  recCard: (dim) => ({
    background: DIMENSION_COLORS[dim]?.bg || '#f8fafc',
    border: `1px solid ${DIMENSION_COLORS[dim]?.border || '#e2e8f0'}`,
    borderRadius: 10, padding: '14px',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }),
  recLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 4 },
  recTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 },
  recDim: (dim) => ({ fontSize: 11, color: DIMENSION_COLORS[dim]?.accent || '#4f46e5', fontWeight: 600 }),
  lockedOverlay: {
    position: 'absolute', inset: 0, borderRadius: 10,
    background: 'rgba(248,250,252,0.88)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 16, textAlign: 'center',
    backdropFilter: 'blur(2px)',
  },
  badgeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12,
  },
  badgeCard: (earned, rarity) => {
    const borderColor = rarity === 'legendary' ? 'rgba(234,179,8,0.35)' : rarity === 'rare' ? 'rgba(99,102,241,0.3)' : 'rgba(226,232,240,0.8)';
    return {
      background: earned ? '#fff' : '#f8fafc',
      border: `1px solid ${earned ? borderColor : '#e2e8f0'}`,
      borderRadius: 10, padding: '14px 12px', textAlign: 'center',
      opacity: earned ? 1 : 0.6, cursor: 'pointer',
      transition: 'box-shadow 0.15s, transform 0.15s',
      boxShadow: earned ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
    };
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 20,
  },
  modalBox: {
    background: '#fff', borderRadius: 16, padding: '28px 24px',
    maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 20, color: '#94a3b8', lineHeight: 1,
  },
};

function InfoModal({ type, onClose }) {
  const content = {
    stars: {
      title: 'What are Stars?',
      body: 'Stars are points you earn each time you complete a resilience practice. They reflect your engagement and effort. Stars accumulate over time and unlock badges as you reach milestones.',
      icon: '/icons/star.svg',
    },
    badges: {
      title: 'What are Badges?',
      body: 'Badges are milestone achievements you earn as you build resilience. Each badge represents a meaningful step in your journey — from completing your first practice to mastering all 6 dimensions.',
      icon: '/icons/badges.svg',
    },
    streak: {
      title: 'What is a Streak?',
      body: 'A streak tracks your consecutive days of practice. Maintaining a streak shows consistent commitment to your resilience journey. Missing a day resets your current streak, but your longest streak is always saved.',
      icon: '/icons/fire.svg',
    },
  }[type] || {};

  return (
    <div style={s.modal} onClick={onClose} role="dialog" aria-modal="true" aria-label={content.title}>
      <div style={s.modalBox} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <img src={content.icon} alt="" width={48} height={48} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>{content.title}</h2>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, margin: 0 }}>{content.body}</p>
        <button
          onClick={onClose}
          style={{ marginTop: 20, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function BadgeModal({ badge, earned, onClose }) {
  if (!badge) return null;
  const rarityColor = badge.rarity === 'legendary' ? '#d97706' : badge.rarity === 'rare' ? '#7c3aed' : badge.rarity === 'uncommon' ? '#059669' : '#6b7280';
  return (
    <div style={s.modal} onClick={onClose} role="dialog" aria-modal="true" aria-label={badge.label}>
      <div style={s.modalBox} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <img src={badge.icon} alt="" width={56} height={56} style={{ opacity: earned ? 1 : 0.4 }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: rarityColor }}>
            {badge.rarity}
          </span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', textAlign: 'center' }}>{badge.label}</h2>
        <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 16px', textAlign: 'center' }}>{badge.description}</p>
        {!earned && (
          <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            <strong style={{ color: '#374151' }}>How to earn:</strong>{' '}
            {badge.description}
            {badge.tier === 'navigator' && (
              <span style={{ display: 'block', marginTop: 6, color: '#6366f1', fontWeight: 600 }}>
                Requires Atlas Navigator plan
              </span>
            )}
          </div>
        )}
        {earned && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', textAlign: 'center', fontWeight: 600 }}>
            <img src="/icons/checkmark.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Earned
          </div>
        )}
        <button
          onClick={onClose}
          style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function CelebrationModal({ data, onClose }) {
  if (!data) return null;
  return (
    <div style={s.modal} onClick={onClose} role="dialog" aria-modal="true" aria-label="Practice complete">
      <div style={{ ...s.modalBox, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <div style={{ marginBottom: 16 }}>
          <img src="/icons/trophy.svg" alt="" width={56} height={56} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>Practice Complete!</h2>
        {data.starsEarned > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            <img src="/icons/star.svg" alt="" width={20} height={20} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#d97706' }}>+{data.starsEarned} stars earned</span>
          </div>
        )}
        {data.badgeProgress && (
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 12px' }}>
            Badge progress: <strong>{data.badgeProgress}</strong>
          </p>
        )}
        {data.nextRecommended && (
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1d4ed8', marginBottom: 16, fontWeight: 500 }}>
            Next recommended: {data.nextRecommended}
          </div>
        )}
        <button
          onClick={onClose}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
        >
          Keep going
        </button>
      </div>
    </div>
  );
}

export default function ResilienceAdventureHub({ tier: tierProp }) {
  const { user, isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently } = useAuth0();
  const { progress, loading, tierBlocked, toasts, dismissToast } = useGamification();

  const [tier, setTier] = useState(() => {
    if (tierProp) return tierProp;
    try { return localStorage.getItem('resilience_tier') || null; } catch (_) { return null; }
  });
  const [tierLoading, setTierLoading] = useState(!tierProp);
  const [activeSection, setActiveSection] = useState('games');
  const [infoModal, setInfoModal] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [celebrationModal, setCelebrationModal] = useState(null);

  useEffect(() => {
    if (tierProp) {
      setTier(tierProp);
      setTierLoading(false);
      return;
    }
    if (auth0Loading) return;
    if (isAuthenticated && user?.email) {
      getAccessTokenSilently()
        .catch(() => null)
        .then(token => fetchUserTier(user.email, token))
        .then(t => {
          setTier(t);
          try { localStorage.setItem('resilience_tier', t); } catch (_) {}
        })
        .catch(() => setTier(current => current || 'free'))
        .finally(() => setTierLoading(false));
    } else if (!isAuthenticated) {
      setTier('free');
      setTierLoading(false);
    }
  }, [auth0Loading, isAuthenticated, user?.email, getAccessTokenSilently, tierProp]);

  const isNavigator = isNavigatorOrAbove(tier);
  const isStarter = isStarterOrAbove(tier);
  const tierLabel = isNavigator ? 'Atlas Navigator' : isStarter ? 'Atlas Starter' : 'Free';

  const earnedBadgeIds = new Set((progress?.badges || []).map(b => b.id || b.name));
  const totalBadges = ADULT_BADGES.filter(b => b.tier === 'starter' || (isNavigator && b.tier === 'navigator')).length;
  const earnedCount = ADULT_BADGES.filter(b => earnedBadgeIds.has(b.id)).length;
  const nextBadge = ADULT_BADGES.find(b => !earnedBadgeIds.has(b.id) && (b.tier === 'starter' || isNavigator));
  const currentStreak = progress?.currentStreak?.days || 0;
  const totalStars = progress?.totalPoints || 0;

  const recommendedQuests = MICRO_QUESTS.filter(q => RECOMMENDED_IDS.includes(q.id));

  const sections = [
    { id: 'games', label: 'Games', available: isStarter },
    { id: 'quests', label: 'Quests', available: isNavigator },
    { id: 'badges', label: 'Badges', available: isStarter },
  ];

  if (tierLoading) {
    return (
      <div style={s.wrap}>
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
          Loading your adventure hub…
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      {toasts.map(t => <GamificationToast key={t.id} toast={t} onDismiss={dismissToast} />)}

      {/* Hero */}
      <div style={s.hero}>
        <p style={s.eyebrow}>Resilience Adventure Hub</p>
        <h2 style={s.heroTitle}>Your Resilience Adventure</h2>
        <p style={s.heroSub}>
          {isNavigator
            ? 'Full access: micro-practices, skill pathways, quests, and all badge tiers.'
            : isStarter
              ? 'Starter access: micro-practices and starter badges. Upgrade for skill pathways and quests.'
              : 'Sign in and get Atlas Starter to begin your resilience adventure.'}
        </p>
        <div style={s.tierPill(tier)}>
          <img src={isNavigator ? '/icons/compass.svg' : isStarter ? '/icons/star.svg' : '/icons/lock.svg'} alt="" width={14} height={14} />
          {tierLabel}
        </div>
        <div style={s.ctaRow}>
          {isNavigator && (
            <button style={s.ctaPrimary} onClick={() => setActiveSection('games')}>
              Play today&apos;s recommended practice
            </button>
          )}
          {isStarter && !isNavigator && (
            <>
              <button style={s.ctaPrimary} onClick={() => setActiveSection('games')}>
                Play a Starter practice
              </button>
              <a href={CHECKOUT_URLS['atlas-navigator']} style={{ ...s.ctaSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <img src="/icons/compass.svg" alt="" width={14} height={14} />
                Unlock all games — Navigator
              </a>
            </>
          )}
          {!isStarter && (
            <a href={CHECKOUT_URLS['atlas-starter']} style={{ ...s.ctaPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Get Atlas Starter to begin
            </a>
          )}
        </div>
      </div>

      {/* Progress Panel */}
      {isStarter && (
        <div style={s.progressPanel}>
          <div style={s.progItem}>
            <img src="/icons/star.svg" alt="" width={22} height={22} />
            <div>
              <div style={s.progVal}>{totalStars}</div>
              <div style={s.progLabel}>Stars earned</div>
            </div>
            <button style={s.infoBtn} onClick={() => setInfoModal('stars')} aria-label="What are stars?">
              <img src="/icons/info.svg" alt="" width={14} height={14} />
            </button>
          </div>
          <div style={{ width: 1, background: '#e2e8f0', alignSelf: 'stretch', margin: '0 4px' }} />
          <div style={s.progItem}>
            <img src="/icons/badges.svg" alt="" width={22} height={22} />
            <div>
              <div style={s.progVal}>{earnedCount}/{totalBadges}</div>
              <div style={s.progLabel}>Badges unlocked</div>
            </div>
            <button style={s.infoBtn} onClick={() => setInfoModal('badges')} aria-label="What are badges?">
              <img src="/icons/info.svg" alt="" width={14} height={14} />
            </button>
          </div>
          {currentStreak > 0 && (
            <>
              <div style={{ width: 1, background: '#e2e8f0', alignSelf: 'stretch', margin: '0 4px' }} />
              <div style={s.progItem}>
                <img src="/icons/fire.svg" alt="" width={22} height={22} />
                <div>
                  <div style={s.progVal}>{currentStreak}</div>
                  <div style={s.progLabel}>Day streak</div>
                </div>
                <button style={s.infoBtn} onClick={() => setInfoModal('streak')} aria-label="What is a streak?">
                  <img src="/icons/info.svg" alt="" width={14} height={14} />
                </button>
              </div>
            </>
          )}
          {nextBadge && (
            <div style={s.nextBadge}>
              <img src={nextBadge.icon} alt="" width={20} height={20} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#374151' }}>Next badge</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{nextBadge.label}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section Tabs */}
      <div style={s.tabs}>
        {sections.map(sec => (
          sec.available ? (
            <button
              key={sec.id}
              style={s.tab(activeSection === sec.id)}
              onClick={() => setActiveSection(sec.id)}
              aria-pressed={activeSection === sec.id}
            >
              {sec.label}
            </button>
          ) : (
            <button
              key={sec.id}
              style={{ ...s.tab(false), opacity: 0.45, cursor: 'not-allowed' }}
              title={sec.id === 'quests' ? 'Available with Atlas Navigator' : 'Available with Atlas Starter'}
              disabled
            >
              <img src="/icons/lock.svg" alt="" width={11} height={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
              {sec.label}
            </button>
          )
        ))}
      </div>

      {/* Content */}
      <div style={s.content}>

        {/* ── Games Section ── */}
        {activeSection === 'games' && (
          <>
            {/* Recommended for you today */}
            {isStarter && (
              <div style={{ marginBottom: 28 }}>
                <div style={s.sectionTitle}>
                  <img src="/icons/game-target.svg" alt="" width={18} height={18} />
                  Recommended for you today
                </div>
                <div style={s.recommendedGrid}>
                  {recommendedQuests.map(q => (
                    <div key={q.id} style={s.recCard(q.dimension)}>
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <img src={DIMENSION_COLORS[q.dimension]?.icon || '/icons/star.svg'} alt="" width={18} height={18} />
                      </div>
                      <div style={s.recLabel}>Recommended</div>
                      <h3 style={s.recTitle}>{q.title}</h3>
                      <div style={s.recDim(q.dimension)}>{q.dimension}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{q.duration} · +{q.points} stars</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Micro-Quests (Starter) */}
            {isStarter && (
              <div style={{ marginBottom: 24 }}>
                <div style={s.sectionTitle}>
                  <img src="/icons/star.svg" alt="" width={16} height={16} />
                  Starter Practices
                </div>
                <StarterMicroQuests tier={tier} progress={progress} />
              </div>
            )}

            {/* Skill Pathways (Navigator — shown locked for Starter) */}
            <div style={{ marginBottom: 24 }}>
              <div style={s.sectionTitle}>
                <img src="/icons/game-map.svg" alt="" width={16} height={16} />
                Skill Pathways
                {!isNavigator && (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>
                    — Navigator only
                  </span>
                )}
              </div>
              {isNavigator ? (
                <NavigatorSkillPaths progress={progress} />
              ) : (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', minHeight: 120, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  {/* Preview blur */}
                  <div style={{ padding: 20, opacity: 0.25, pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {SKILL_PATHWAYS.slice(0, 3).map(p => (
                        <div key={p.id} style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', flex: '1 1 140px', minWidth: 130 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{p.dimension}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{p.levels?.length || 3} levels</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={s.lockedOverlay}>
                    <img src="/icons/lock.svg" alt="" width={32} height={32} style={{ marginBottom: 10 }} />
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Navigator Only</div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 14, lineHeight: 1.5 }}>
                      Unlock 6 dimension-specific skill pathways with 3 progressive levels each.
                    </div>
                    <a
                      href={CHECKOUT_URLS['atlas-navigator']}
                      style={{ padding: '8px 18px', borderRadius: 7, background: '#4f46e5', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}
                    >
                      Upgrade to Navigator
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Progress at bottom of games */}
            {isStarter && (
              <div style={{ marginTop: 8 }}>
                <ProgressDashboard tier={tier} progress={progress} loading={loading} tierBlocked={tierBlocked} />
              </div>
            )}
          </>
        )}

        {/* ── Quests Section ── */}
        {activeSection === 'quests' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <img src="/icons/game-mountain.svg" alt="" width={56} height={56} style={{ marginBottom: 16, opacity: 0.7 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Quests — Coming Soon</h3>
            <p style={{ fontSize: 14, color: '#64748b', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.65 }}>
              Quests are structured multi-day resilience missions. Complete a series of practices across dimensions to earn special quest badges and unlock deeper insights.
            </p>
            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Dimension Mastery Quest', 'Values Discovery Quest', 'Regulation Sprint'].map(title => (
                <div key={title} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#64748b' }}>
                  {title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Badges Section ── */}
        {activeSection === 'badges' && (
          <>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.65 }}>
              Badges are milestones you earn as you build resilience. Click any badge to learn how to earn it.
            </p>
            <div style={{ marginBottom: 16 }}>
              <div style={s.sectionTitle}>
                <img src="/icons/badges.svg" alt="" width={16} height={16} />
                Starter Badges
              </div>
              <div style={s.badgeGrid}>
                {ADULT_BADGES.filter(b => b.tier === 'starter').map(badge => {
                  const earned = earnedBadgeIds.has(badge.id);
                  return (
                    <button
                      key={badge.id}
                      style={{ ...s.badgeCard(earned, badge.rarity), background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => setSelectedBadge({ badge, earned })}
                      aria-label={`${badge.label} — ${earned ? 'earned' : 'not yet earned'}`}
                    >
                      <img src={badge.icon} alt="" width={36} height={36} style={{ marginBottom: 8, opacity: earned ? 1 : 0.4 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 3, lineHeight: 1.2 }}>{badge.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: badge.rarity === 'legendary' ? '#d97706' : badge.rarity === 'rare' ? '#7c3aed' : badge.rarity === 'uncommon' ? '#059669' : '#9ca3af' }}>
                        {badge.rarity}
                      </div>
                      {earned && (
                        <div style={{ marginTop: 4 }}>
                          <img src="/icons/checkmark.svg" alt="Earned" width={14} height={14} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={s.sectionTitle}>
                <img src="/icons/compass.svg" alt="" width={16} height={16} />
                Navigator Badges
                {!isNavigator && (
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, marginLeft: 4 }}>— Navigator only</span>
                )}
              </div>
              {isNavigator ? (
                <div style={s.badgeGrid}>
                  {ADULT_BADGES.filter(b => b.tier === 'navigator').map(badge => {
                    const earned = earnedBadgeIds.has(badge.id);
                    return (
                      <button
                        key={badge.id}
                        style={{ ...s.badgeCard(earned, badge.rarity), background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={() => setSelectedBadge({ badge, earned })}
                        aria-label={`${badge.label} — ${earned ? 'earned' : 'not yet earned'}`}
                      >
                        <img src={badge.icon} alt="" width={36} height={36} style={{ marginBottom: 8, opacity: earned ? 1 : 0.4 }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 3, lineHeight: 1.2 }}>{badge.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: badge.rarity === 'legendary' ? '#d97706' : badge.rarity === 'rare' ? '#7c3aed' : '#9ca3af' }}>
                          {badge.rarity}
                        </div>
                        {earned && (
                          <div style={{ marginTop: 4 }}>
                            <img src="/icons/checkmark.svg" alt="Earned" width={14} height={14} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', minHeight: 100, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ padding: 20, opacity: 0.2, pointerEvents: 'none', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {ADULT_BADGES.filter(b => b.tier === 'navigator').map(b => (
                      <div key={b.id} style={{ background: '#fff', borderRadius: 8, padding: 12, textAlign: 'center', minWidth: 100 }}>
                        <div style={{ fontSize: 12 }}>{b.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={s.lockedOverlay}>
                    <img src="/icons/lock.svg" alt="" width={28} height={28} style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>Navigator Only</div>
                    <a
                      href={CHECKOUT_URLS['atlas-navigator']}
                      style={{ padding: '7px 16px', borderRadius: 7, background: '#4f46e5', color: '#fff', fontWeight: 600, fontSize: 12, textDecoration: 'none', display: 'inline-block' }}
                    >
                      Upgrade to Navigator
                    </a>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {infoModal && <InfoModal type={infoModal} onClose={() => setInfoModal(null)} />}
      {selectedBadge && <BadgeModal badge={selectedBadge.badge} earned={selectedBadge.earned} onClose={() => setSelectedBadge(null)} />}
      {celebrationModal && <CelebrationModal data={celebrationModal} onClose={() => setCelebrationModal(null)} />}
    </div>
  );
}
