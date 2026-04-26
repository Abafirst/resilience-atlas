/**
 * NavigatorQuests.jsx
 *
 * Full end-to-end Quests experience for the Resilience Adventure Hub.
 *
 * Tier behavior:
 *   Navigator → all quests unlocked; full start → step → complete workflow.
 *   Starter   → 'starter'-tier quests playable; 'navigator'-tier quests
 *               show a locked preview card with upgrade CTA.
 *
 * State machine per quest:
 *   IDLE → ACTIVE (start quest) → STEP (step detail) → DONE (celebration)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { ADULT_QUESTS, DIMENSION_COLORS } from '../../data/adultGames.js';
import { isStarterOrAbove, isNavigatorOrAbove, CHECKOUT_URLS } from '../../data/gamificationContent.js';
import { apiUrl } from '../../api/baseUrl.js';
import { playQuestCompleteSound, isSfxEnabled } from '../../utils/soundEffects.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIM_ICONS = {
  'Agentic-Generative':    '/icons/agentic-generative.svg',
  'Relational-Connective': '/icons/relational-connective.svg',
  'Emotional-Adaptive':    '/icons/emotional-adaptive.svg',
  'Spiritual-Reflective':  '/icons/spiritual-reflective.svg',
  'Somatic-Regulative':    '/icons/somatic-regulative.svg',
  'Cognitive-Narrative':   '/icons/cognitive-narrative.svg',
  'All Dimensions':        '/icons/compass.svg',
};

function stepIdsDone(quest, completedIds) {
  return quest.steps.filter(s => completedIds.has(s.id)).length;
}

function questFullyDone(quest, completedIds) {
  return quest.steps.every(s => completedIds.has(s.id));
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: { fontFamily: "'Inter','Segoe UI',sans-serif", color: '#1e293b' },
  intro: {
    fontSize: 13, color: '#64748b', lineHeight: 1.65,
    marginBottom: 24, maxWidth: 540,
  },

  /* Quest cards grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
  },
  card: (color, accentColor, done) => ({
    background: done ? '#f0fdf4' : color || '#f8fafc',
    border: `2px solid ${done ? '#86efac' : accentColor || '#e2e8f0'}`,
    borderRadius: 14,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'box-shadow 0.18s, transform 0.15s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }),
  cardLocked: {
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: 14,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    opacity: 0.8,
  },
  cardSubtitle: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.09em', color: '#94a3b8', marginBottom: 6,
  },
  cardTitle: { fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.25 },
  cardDesc: { fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 14px' },
  cardMeta: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' },
  metaChip: (accent) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 11, fontWeight: 600,
    padding: '3px 9px', borderRadius: 20,
    background: accent ? `${accent}18` : '#f1f5f9',
    color: accent || '#475569',
    border: `1px solid ${accent ? `${accent}33` : '#e2e8f0'}`,
  }),
  rewardRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 12, color: '#64748b', marginBottom: 16,
  },
  startBtn: (accent) => ({
    width: '100%', padding: '10px 16px',
    borderRadius: 8, border: 'none',
    background: accent || '#3b82f6',
    color: '#fff', fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  }),
  continueBtn: (accent) => ({
    width: '100%', padding: '10px 16px',
    borderRadius: 8, border: `2px solid ${accent || '#3b82f6'}`,
    background: 'transparent',
    color: accent || '#3b82f6', fontWeight: 700, fontSize: 13,
    cursor: 'pointer',
  }),
  doneChip: {
    position: 'absolute', top: 12, right: 12,
    background: '#dcfce7', color: '#15803d',
    fontSize: 11, fontWeight: 700, padding: '3px 10px',
    borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
  },
  progressBar: (pct, accent) => ({
    height: 6, borderRadius: 3,
    background: `linear-gradient(90deg, ${accent || '#3b82f6'} ${pct}%, #e2e8f0 ${pct}%)`,
    marginBottom: 12,
  }),

  /* Step progress pills in card */
  stepsRow: { display: 'flex', gap: 6, marginBottom: 14 },
  stepPill: (done, accent) => ({
    width: 28, height: 6, borderRadius: 3,
    background: done ? (accent || '#3b82f6') : '#e2e8f0',
    transition: 'background 0.2s',
  }),

  /* Quest detail view */
  detailWrap: { fontFamily: "'Inter','Segoe UI',sans-serif", color: '#1e293b' },
  detailHeader: (color, accent) => ({
    background: color || '#eff6ff',
    borderRadius: 12, padding: '20px 22px', marginBottom: 20,
    borderLeft: `4px solid ${accent || '#3b82f6'}`,
  }),
  detailBack: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center',
    gap: 4, marginBottom: 12, padding: 0, fontWeight: 600,
  },
  detailTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' },
  detailSub: { fontSize: 13, color: '#475569', lineHeight: 1.6, marginTop: 4 },
  stepList: { listStyle: 'none', margin: '0 0 20px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 },
  stepItem: (active, done, accent) => ({
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '14px 16px', borderRadius: 10,
    border: `1px solid ${active ? (accent || '#3b82f6') : done ? '#bbf7d0' : '#e2e8f0'}`,
    background: active ? `${accent || '#3b82f6'}0a` : done ? '#f0fdf4' : '#fff',
    transition: 'all 0.15s',
    cursor: active ? 'pointer' : 'default',
  }),
  stepNum: (active, done, accent) => ({
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700,
    background: done ? '#dcfce7' : active ? (accent || '#3b82f6') : '#f1f5f9',
    color: done ? '#15803d' : active ? '#fff' : '#94a3b8',
    border: `2px solid ${done ? '#86efac' : active ? (accent || '#3b82f6') : '#e2e8f0'}`,
  }),
  stepBody: { flex: 1, minWidth: 0 },
  stepTitle: (active) => ({ fontSize: 14, fontWeight: 700, color: active ? '#0f172a' : '#374151', margin: '0 0 2px' }),
  stepSubtitle: { fontSize: 12, color: '#94a3b8' },
  stepDuration: { fontSize: 11, color: '#64748b', marginTop: 4 },

  /* Step modal */
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: 20,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '28px 26px',
    maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16,
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 20, color: '#94a3b8', lineHeight: 1, padding: 0,
  },
  modalEyebrow: (accent) => ({
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.09em', color: accent || '#3b82f6', marginBottom: 4,
  }),
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' },
  modalDim: { fontSize: 13, color: '#64748b', marginBottom: 18 },
  promptBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '14px 16px', fontSize: 14, color: '#374151',
    lineHeight: 1.7, marginBottom: 14,
  },
  reflLabel: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 6,
  },
  reflBox: {
    fontSize: 13, color: '#64748b', lineHeight: 1.65,
    fontStyle: 'italic', marginBottom: 20,
    background: '#fefce8', border: '1px solid #fef08a',
    borderRadius: 8, padding: '10px 14px',
  },
  actionRow: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', color: '#64748b', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
  },
  completeBtn: (accent) => ({
    padding: '10px 24px', borderRadius: 8, border: 'none',
    background: accent || '#3b82f6', color: '#fff',
    cursor: 'pointer', fontSize: 13, fontWeight: 700,
  }),
  errorMsg: {
    marginBottom: 12, padding: '10px 14px', borderRadius: 8,
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
    color: '#ef4444', fontSize: 13, lineHeight: 1.5,
  },

  /* Celebration modal */
  celebWrap: { textAlign: 'center' },
  celebIcon: { marginBottom: 14 },
  celebTitle: { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' },
  celebSub: { fontSize: 14, color: '#475569', lineHeight: 1.65, marginBottom: 18 },
  celebBadge: {
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
    background: '#fefce8', border: '2px solid #fde68a',
    borderRadius: 14, padding: '16px 24px', marginBottom: 20,
    gap: 6,
  },
  celebBadgeLabel: { fontSize: 13, fontWeight: 700, color: '#92400e' },

  /* Locked card */
  lockedOverlay: {
    position: 'absolute', inset: 0, borderRadius: 14,
    background: 'rgba(248,250,252,0.90)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: 20, textAlign: 'center',
    backdropFilter: 'blur(2px)',
  },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function QuestCard({ quest, completedIds, isUnlocked, onStart, onContinue }) {
  const doneCount = stepIdsDone(quest, completedIds);
  const finished  = questFullyDone(quest, completedIds);
  const started   = doneCount > 0 && !finished;
  const pct       = Math.round((doneCount / quest.steps.length) * 100);

  if (!isUnlocked) {
    return (
      <div style={s.cardLocked}>
        {/* Blurred preview */}
        <div style={{ opacity: 0.3, pointerEvents: 'none' }}>
          <div style={s.cardSubtitle}>{quest.days}</div>
          <h3 style={s.cardTitle}>{quest.title}</h3>
          <p style={s.cardDesc}>{quest.description}</p>
        </div>
        <div style={s.lockedOverlay}>
          <img src="/icons/lock.svg" alt="" width={28} height={28} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>Navigator Only</div>
          <div style={{ fontSize: 12, color: '#475569', marginBottom: 14, lineHeight: 1.5, maxWidth: 200 }}>
            Unlock this quest with Atlas Navigator.
          </div>
          <a
            href={CHECKOUT_URLS['atlas-navigator']}
            style={{ padding: '8px 18px', borderRadius: 8, background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <img src="/icons/compass.svg" alt="" width={13} height={13} />
            Upgrade to Navigator
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={s.card(quest.color, quest.accentColor, finished)}
      role="button"
      tabIndex={0}
      aria-label={`${quest.title} — ${finished ? 'completed' : started ? 'in progress' : 'not started'}`}
      onClick={() => finished ? null : started ? onContinue(quest) : onStart(quest)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && !finished && (started ? onContinue(quest) : onStart(quest))}
    >
      {finished && (
        <div style={s.doneChip} aria-hidden="true">
          <img src="/icons/checkmark.svg" alt="" width={11} height={11} />
          Complete
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <img src={quest.icon} alt="" width={36} height={36} style={{ borderRadius: 8, flexShrink: 0 }} onError={e => { e.currentTarget.src = '/icons/compass.svg'; e.currentTarget.onerror = null; }} />
        <div>
          <div style={s.cardSubtitle}>{quest.subtitle}</div>
          <h3 style={{ ...s.cardTitle, fontSize: 15 }}>{quest.title}</h3>
        </div>
      </div>

      <p style={s.cardDesc}>{quest.description}</p>

      <div style={s.cardMeta}>
        <span style={s.metaChip(quest.accentColor)}>{quest.days}</span>
        <span style={s.metaChip(DIM_ICONS[quest.dimension] ? quest.accentColor : null)}>
          {quest.dimension}
        </span>
      </div>

      <div style={s.stepsRow} aria-label={`${doneCount} of ${quest.steps.length} steps done`}>
        {quest.steps.map((step, i) => (
          <div key={step.id} style={s.stepPill(i < doneCount, quest.accentColor)} aria-hidden="true" />
        ))}
      </div>

      <div style={s.rewardRow}>
        <img src="/icons/star.svg" alt="" width={14} height={14} />
        <span>+{quest.steps.reduce((sum, step) => sum + (step.points || 0), 0)} stars</span>
        <span style={{ color: '#e2e8f0' }}>·</span>
        <img src={quest.reward.badgeIcon} alt="" width={14} height={14} onError={e => { e.currentTarget.src = '/icons/badges.svg'; e.currentTarget.onerror = null; }} />
        <span>{quest.reward.badgeName} badge</span>
      </div>

      {!finished && (
        <button
          style={started ? s.continueBtn(quest.accentColor) : s.startBtn(quest.accentColor)}
          onClick={e => { e.stopPropagation(); started ? onContinue(quest) : onStart(quest); }}
        >
          {started ? `Continue — Step ${doneCount + 1} of ${quest.steps.length}` : 'Begin Quest'}
        </button>
      )}
      {finished && (
        <div style={{ fontSize: 13, color: '#15803d', fontWeight: 600, textAlign: 'center', paddingTop: 4 }}>
          You completed this quest!
        </div>
      )}
    </div>
  );
}

function StepModal({ step, questAccent, completing, errorMsg, onComplete, onClose }) {
  return (
    <div style={s.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={step.title}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <div style={s.modalEyebrow(questAccent)}>{step.dimension} · {step.duration}</div>
        <h2 style={s.modalTitle}>{step.title}</h2>
        <p style={s.modalDim}>{step.subtitle}</p>

        <div style={s.promptBox}>{step.prompt}</div>

        <div style={s.reflLabel}>Reflection prompt</div>
        <div style={s.reflBox}>{step.reflection}</div>

        {errorMsg && <div style={s.errorMsg}>{errorMsg}</div>}

        <div style={s.actionRow}>
          <button style={s.cancelBtn} onClick={onClose}>Back</button>
          <button
            style={s.completeBtn(questAccent)}
            onClick={() => onComplete(step)}
            disabled={completing}
          >
            {completing ? 'Recording…' : 'Mark as Complete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CelebrationModal({ quest, onClose }) {
  const hasPlayedRef = useRef(false);
  useEffect(() => {
    if (!hasPlayedRef.current && isSfxEnabled()) {
      hasPlayedRef.current = true;
      playQuestCompleteSound();
    }
  }, []);

  return (
    <div style={s.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Quest complete!">
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        <div style={s.celebWrap}>
          <div style={s.celebIcon}>
            <img src="/icons/trophy.svg" alt="" width={64} height={64} />
          </div>
          <h2 style={s.celebTitle}>Quest Complete!</h2>
          <p style={s.celebSub}>
            You finished the <strong>{quest.title}</strong> quest. You've built real resilience today.
          </p>
          <div style={s.celebBadge}>
            <img
              src={quest.reward.badgeIcon}
              alt=""
              width={48}
              height={48}
              onError={e => { e.currentTarget.src = '/icons/badges.svg'; e.currentTarget.onerror = null; }}
            />
            <div style={s.celebBadgeLabel}>{quest.reward.badgeName}</div>
            <div style={{ fontSize: 11, color: '#a16207', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.07em' }}>{quest.reward.badgeRarity} badge earned</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22, color: '#d97706', fontWeight: 700, fontSize: 16 }}>
            <img src="/icons/star.svg" alt="" width={20} height={20} />
            +{quest.reward.stars} stars earned
          </div>
          <button
            style={{ ...s.startBtn(quest.accentColor), maxWidth: 220, margin: '0 auto' }}
            onClick={onClose}
          >
            Keep building
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestDetailView({ quest, completedIds, onBack, onStepSelect }) {
  const doneCount = stepIdsDone(quest, completedIds);

  return (
    <div style={s.detailWrap}>
      <button style={s.detailBack} onClick={onBack} aria-label="Back to quests list">
        <span aria-hidden="true">←</span> All Quests
      </button>
      <div style={s.detailHeader(quest.color, quest.accentColor)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <img src={quest.icon} alt="" width={40} height={40} style={{ borderRadius: 8 }} onError={e => { e.currentTarget.src = '/icons/compass.svg'; e.currentTarget.onerror = null; }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: quest.accentColor }}>{quest.subtitle}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>{quest.title}</h2>
          </div>
        </div>
        <p style={s.detailSub}>{quest.description}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <span style={s.metaChip(quest.accentColor)}>{quest.days}</span>
          <span style={s.metaChip(quest.accentColor)}>
            <img src="/icons/star.svg" alt="" width={12} height={12} />
            +{quest.reward.stars} stars on completion
          </span>
          <span style={s.metaChip(quest.accentColor)}>
            <img src={quest.reward.badgeIcon} alt="" width={12} height={12} onError={e => { e.currentTarget.src = '/icons/badges.svg'; e.currentTarget.onerror = null; }} />
            {quest.reward.badgeName} badge
          </span>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
            Progress: {doneCount} / {quest.steps.length} steps
          </div>
          <div style={s.progressBar(Math.round((doneCount / quest.steps.length) * 100), quest.accentColor)} />
        </div>
      </div>

      <ol style={s.stepList}>
        {quest.steps.map((step, i) => {
          const done   = completedIds.has(step.id);
          const active = !done && i === doneCount;
          return (
            <li
              key={step.id}
              style={s.stepItem(active, done, quest.accentColor)}
              onClick={() => active ? onStepSelect(step) : undefined}
              role={active ? 'button' : undefined}
              tabIndex={active ? 0 : undefined}
              onKeyDown={active ? (e => (e.key === 'Enter' || e.key === ' ') && onStepSelect(step)) : undefined}
              aria-label={active ? `Start step ${i + 1}: ${step.title}` : undefined}
            >
              <div style={s.stepNum(active, done, quest.accentColor)} aria-hidden="true">
                {done
                  ? <img src="/icons/checkmark.svg" alt="" width={14} height={14} />
                  : i + 1}
              </div>
              <div style={s.stepBody}>
                <div style={s.stepTitle(active)}>{step.title}</div>
                <div style={s.stepSubtitle}>{step.subtitle}</div>
                <div style={s.stepDuration}>{step.dimension} · {step.duration}</div>
                {active && (
                  <button
                    style={{ ...s.startBtn(quest.accentColor), marginTop: 10, width: 'auto', padding: '8px 18px', fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); onStepSelect(step); }}
                  >
                    Start this step →
                  </button>
                )}
                {done && (
                  <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700, marginTop: 4, display: 'inline-block' }}>
                    Completed
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function NavigatorQuests({ tier, progress }) {
  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();

  const isNavigator = isNavigatorOrAbove(tier);
  const isStarter   = isStarterOrAbove(tier);

  /* Build a Set of all completed step IDs from the microQuests array */
  const completedIds = new Set(
    (progress?.microQuests || []).map(q => q.questId)
  );

  const [view, setView]             = useState('list');   // 'list' | 'detail'
  const [activeQuest, setActiveQuest] = useState(null);
  const [activeStep, setActiveStep]   = useState(null);
  const [completing, setCompleting]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState(null);
  const [celebration, setCelebration] = useState(null);   // quest to celebrate
  const [localDone, setLocalDone]     = useState(new Set());

  /* Merged completed ids (server + local) */
  const allDone = new Set([...completedIds, ...localDone]);

  function handleStart(quest) {
    setActiveQuest(quest);
    setView('detail');
  }

  function handleContinue(quest) {
    setActiveQuest(quest);
    setView('detail');
  }

  function handleStepSelect(step) {
    setActiveStep(step);
    setErrorMsg(null);
  }

  async function handleStepComplete(step) {
    setCompleting(true);
    setErrorMsg(null);
    try {
      const token = await getAccessTokenSilently().catch(() => null);
      if (!token) {
        loginWithRedirect({ appState: { returnTo: '/gamification' } });
        return;
      }
      const res = await fetch(apiUrl('/api/gamification/progress/quest-complete'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ questId: step.id, dimension: step.dimension }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      /* Mark locally so UI updates immediately */
      setLocalDone(prev => new Set([...prev, step.id]));
      setActiveStep(null);

      /* Check if quest is now fully done */
      const nowDone = new Set([...allDone, step.id]);
      if (activeQuest && questFullyDone(activeQuest, nowDone)) {
        /* Award badge for quest completion */
        await fetch(apiUrl('/api/gamification/progress/award-badge'), {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({
            badgeName:   activeQuest.reward.badgeName,
            badgeIcon:   activeQuest.reward.badgeIcon,
            badgeRarity: activeQuest.reward.badgeRarity,
            bonusStars:  activeQuest.reward.stars,
          }),
        }).catch(() => null);
        setCelebration(activeQuest);
        setView('list');
        setActiveQuest(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setCompleting(false);
    }
  }

  if (!isStarter) {
    return (
      <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
        <img src="/icons/lock.svg" alt="" width={40} height={40} style={{ marginBottom: 12, opacity: 0.5 }} />
        <p style={{ fontSize: 14, maxWidth: 340, margin: '0 auto 16px', lineHeight: 1.65 }}>
          Sign up for Atlas Starter to begin your resilience quests.
        </p>
        <a
          href={CHECKOUT_URLS['atlas-starter']}
          style={{ padding: '10px 22px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}
        >
          Get Atlas Starter
        </a>
      </div>
    );
  }

  /* ── Detail view ── */
  if (view === 'detail' && activeQuest) {
    return (
      <div style={s.detailWrap}>
        <QuestDetailView
          quest={activeQuest}
          completedIds={allDone}
          onBack={() => { setView('list'); setActiveQuest(null); }}
          onStepSelect={handleStepSelect}
        />
        {activeStep && (
          <StepModal
            step={activeStep}
            questAccent={activeQuest.accentColor}
            completing={completing}
            errorMsg={errorMsg}
            onComplete={handleStepComplete}
            onClose={() => { setActiveStep(null); setErrorMsg(null); }}
          />
        )}
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div style={s.container}>
      {celebration && (
        <CelebrationModal
          quest={celebration}
          onClose={() => setCelebration(null)}
        />
      )}

      <p style={s.intro}>
        Quests are structured resilience missions — each one guides you through a meaningful
        sequence of practices toward a clear goal and reward. Complete all steps to earn your
        quest badge and stars.
      </p>

      <div style={s.grid}>
        {ADULT_QUESTS.map(quest => {
          const unlocked = quest.tier === 'starter' ? isStarter : isNavigator;
          return (
            <QuestCard
              key={quest.id}
              quest={quest}
              completedIds={allDone}
              isUnlocked={unlocked}
              onStart={handleStart}
              onContinue={handleContinue}
            />
          );
        })}
      </div>
    </div>
  );
}
