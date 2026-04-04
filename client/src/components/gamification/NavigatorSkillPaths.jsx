import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { SKILL_PATHWAYS, DIMENSION_COLORS } from '../../data/adultGames.js';
import QuestChallenge from './QuestChallenge.jsx';
import ChoiceScenario from './ChoiceScenario.jsx';

const s = {
  intro: { marginBottom: 24 },
  introTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' },
  introSub: { fontSize: 13, color: '#718096', margin: 0, lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 },
  pathCard: (dim, allDone) => ({
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${allDone ? 'rgba(16,185,129,0.3)' : (DIMENSION_COLORS[dim]?.border || 'rgba(255,255,255,0.08)')}`,
    borderRadius: 12, padding: '20px', cursor: 'pointer',
    transition: 'all 0.2s',
    outline: allDone ? '1px solid rgba(16,185,129,0.15)' : 'none',
  }),
  pathHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  pathTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 2px' },
  pathDim: { fontSize: 12, color: '#718096' },
  levels: { display: 'flex', gap: 6, marginTop: 12, marginBottom: 8 },
  levelDot: (done, active) => ({
    flex: 1, height: 4, borderRadius: 2,
    background: done ? '#34d399' : active ? '#818cf8' : 'rgba(255,255,255,0.1)',
  }),
  pathDesc: { fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginTop: 8 },
  completedTag: { fontSize: 11, color: '#34d399', fontWeight: 600 },
  pts: { fontSize: 11, color: '#7aafc8' },
};

const DIM_ICONS = {
  'Agentic-Generative':   '/icons/agentic-generative.svg',
  'Relational-Connective': '/icons/relational-connective.svg',
  'Emotional-Adaptive':   '/icons/emotional-adaptive.svg',
  'Spiritual-Reflective': '/icons/spiritual-reflective.svg',
  'Somatic-Regulative':   '/icons/somatic-regulative.svg',
  'Cognitive-Narrative':  '/icons/cognitive-narrative.svg',
};

export default function NavigatorSkillPaths({ progress }) {
  const { getAccessTokenSilently } = useAuth0();
  const [activePathway, setActivePathway]     = useState(null); // { dimension, levelIndex }
  const [localComplete, setLocalComplete]     = useState({}); // { 'dim-level': true }
  const [completing, setCompleting]           = useState(false);
  const [earnedBadge, setEarnedBadge]         = useState(null);
  const [showChoiceScenario, setShowChoiceScenario] = useState(false);

  // Build completed set from progress + local state
  const serverDone = new Set(
    (progress?.skillPathways || []).map(p => `${p.dimension}-${p.level}`)
  );
  const isDone = (dim, lvl) => serverDone.has(`${dim}-${lvl}`) || localComplete[`${dim}-${lvl}`];

  async function handleLevelComplete(pathway, level, answers) {
    const key = `${pathway.dimension}-${level.level}`;
    if (completing) return;
    setCompleting(true);
    try {
      let headers = { 'Content-Type': 'application/json' };
      try {
        const token = await getAccessTokenSilently();
        headers.Authorization = `Bearer ${token}`;
      } catch (authErr) {
        console.warn('Auth0 token unavailable, falling back to stored token:', authErr?.message);
        const stored = localStorage.getItem('auth_token');
        if (stored) headers.Authorization = `Bearer ${stored}`;
      }
      const res  = await fetch('/api/gamification/progress/pathway-complete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ dimension: pathway.dimension, level: level.level }),
      });
      const data = await res.json().catch(() => ({}));
      setLocalComplete(prev => ({ ...prev, [key]: true }));
      if (data.newBadges?.length) setEarnedBadge(data.newBadges[0]);
    } catch {
      setLocalComplete(prev => ({ ...prev, [key]: true }));
    } finally {
      setCompleting(false);
      setActivePathway(null);
    }
  }

  if (activePathway) {
    const pathway = SKILL_PATHWAYS.find(p => p.dimension === activePathway.dimension);
    const level   = pathway?.levels?.[activePathway.levelIndex];
    if (!pathway || !level) return null;
    return (
      <div>
        <QuestChallenge
          level={level}
          dimension={activePathway.dimension}
          onComplete={(answers) => handleLevelComplete(pathway, level, answers)}
          onBack={() => setActivePathway(null)}
        />
      </div>
    );
  }

  if (showChoiceScenario) {
    return (
      <div>
        <ChoiceScenario onBack={() => setShowChoiceScenario(false)} />
      </div>
    );
  }

  return (
    <div>
      {earnedBadge && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icons/game-mountain.svg" alt="" aria-hidden="true" width={20} height={20} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Achievement Unlocked: {earnedBadge}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Your commitment to this pathway is reflected in your progress record.</div>
          </div>
          <button onClick={() => setEarnedBadge(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      <div style={s.intro}>
        <h3 style={s.introTitle}>6 Skill Pathways</h3>
        <p style={s.introSub}>
          Multi-level, ABA/ACT-aligned progressions — one per resilience dimension. Each pathway has 3 levels: stimulus awareness, applied practice, and life integration. Complete all 6 to earn Compass Sage status.
        </p>
      </div>

      <div style={s.grid}>
        {SKILL_PATHWAYS.map(pathway => {
          const completedLevels = pathway.levels.filter(l => isDone(pathway.dimension, l.level)).length;
          const allDone   = completedLevels === 3;
          const nextLevel = pathway.levels.find(l => !isDone(pathway.dimension, l.level));
          const totalPts  = Object.values(pathway.points).reduce((a, b) => a + b, 0);

          return (
            <div
              key={pathway.dimension}
              style={s.pathCard(pathway.dimension, allDone)}
              onClick={() => !allDone && nextLevel && setActivePathway({ dimension: pathway.dimension, levelIndex: nextLevel.level - 1 })}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && !allDone && nextLevel && setActivePathway({ dimension: pathway.dimension, levelIndex: nextLevel.level - 1 })}
              aria-label={`${pathway.title}: ${completedLevels} of 3 levels complete`}
            >
              <div style={s.pathHeader}>
                <div>
                  <div style={s.pathTitle}>
                    <img src={DIM_ICONS[pathway.dimension]} alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {pathway.title}
                  </div>
                  <div style={s.pathDim}>{pathway.dimension}</div>
                </div>
                {allDone ? (
                  <span style={s.completedTag}>
                    <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={11} height={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    Complete
                  </span>
                ) : (
                  <span style={s.pts}>{totalPts} pts</span>
                )}
              </div>
              <div style={s.levels} aria-label={`${completedLevels} of 3 levels completed`}>
                {pathway.levels.map(l => (
                  <div key={l.level} style={s.levelDot(isDone(pathway.dimension, l.level), l.level === nextLevel?.level)} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                Level {completedLevels + 1} of 3 {!allDone && nextLevel ? `— ${nextLevel.subtitle}` : allDone ? '— Pathway Complete' : ''}
              </div>
              <p style={s.pathDesc}>{pathway.description}</p>
            </div>
          );
        })}
      </div>

      {/* Choice Scenario section */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>Daily Choice Scenario</h3>
        <p style={{ fontSize: 13, color: '#718096', margin: '0 0 16px', lineHeight: 1.5 }}>
          ACT-aligned branching scenarios — choose your approach to a real-life challenge and receive evidence-based reinforcement feedback tailored to your choice.
        </p>
        <button
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          onClick={() => setShowChoiceScenario(true)}
        >
          Begin Today's Scenario
        </button>
      </div>
    </div>
  );
}
