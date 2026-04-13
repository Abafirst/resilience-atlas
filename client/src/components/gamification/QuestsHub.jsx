import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ADULT_QUESTS, DIMENSION_COLORS } from '../../data/adultGames.js';
import { isNavigatorOrAbove, isStarterOrAbove, CHECKOUT_URLS } from '../../data/gamificationContent.js';
import { playQuestCompleteSound, isSfxEnabled } from '../../utils/soundEffects.js';

// ── Local-storage helpers ────────────────────────────────────────────────────
const LS_KEY = 'ra_quest_progress';

function loadQuestProgress() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

function saveQuestProgress(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (_) { /* storage unavailable */ }
}

// ── Styles ───────────────────────────────────────────────────────────────────
const q = {
  wrap: {
    fontFamily: "'Inter','Segoe UI',sans-serif",
    color: '#1e293b',
  },
  intro: {
    background: 'linear-gradient(135deg,#fffbeb 0%,#fef9c3 100%)',
    border: '1px solid #fde68a',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 24,
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  introText: { fontSize: 13, color: '#92400e', lineHeight: 1.6, flex: 1 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
    gap: 16,
  },
  card: (dim, locked) => ({
    borderRadius: 12,
    border: `1.5px solid ${locked ? '#e2e8f0' : (DIMENSION_COLORS[dim]?.border || '#e2e8f0')}`,
    background: locked ? '#f8fafc' : (DIMENSION_COLORS[dim]?.bg || '#f8fafc'),
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    position: 'relative',
    opacity: locked ? 0.75 : 1,
    transition: 'box-shadow .18s, transform .18s',
    cursor: locked ? 'default' : 'pointer',
    boxShadow: locked ? 'none' : '0 2px 8px rgba(0,0,0,.04)',
  }),
  cardDimTag: (dim) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: DIMENSION_COLORS[dim]?.accent || '#64748b',
    background: 'rgba(255,255,255,0.6)',
    padding: '3px 8px',
    borderRadius: 20,
    width: 'fit-content',
  }),
  cardTitle: {
    fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.3,
  },
  cardTagline: {
    fontSize: 12, color: '#475569', lineHeight: 1.55, margin: 0,
  },
  cardMeta: {
    display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', marginTop: 2,
  },
  progressBar: (pct) => ({
    height: 5, borderRadius: 3,
    background: `linear-gradient(90deg, #4f46e5 ${pct}%, #e2e8f0 ${pct}%)`,
    marginTop: 4,
  }),
  progressLabel: {
    fontSize: 10, color: '#64748b', fontWeight: 600, marginTop: 3,
  },
  startBtn: (dim) => ({
    marginTop: 4, padding: '8px 14px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    background: DIMENSION_COLORS[dim]?.accent || '#4f46e5',
    color: '#fff', fontSize: 12, fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: 5,
    transition: 'opacity .15s',
  }),
  lockedBadge: {
    position: 'absolute', top: 12, right: 12,
    background: '#e2e8f0', borderRadius: 999, padding: '3px 8px',
    fontSize: 10, fontWeight: 700, color: '#64748b',
    display: 'flex', alignItems: 'center', gap: 4,
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px',
  },
  modalBox: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540,
    maxHeight: '88vh', overflowY: 'auto',
    boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
  },
  modalHeader: (dim) => ({
    background: DIMENSION_COLORS[dim]?.gradient || 'linear-gradient(135deg,#4f46e5,#3b82f6)',
    padding: '20px 24px 16px',
    borderRadius: '16px 16px 0 0',
    color: '#fff',
  }),
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  stepNum: {
    display: 'inline-block', background: '#ede9fe', color: '#5b21b6',
    fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 10,
    marginBottom: 6,
  },
  prompt: {
    background: '#f8fafc', borderRadius: 10, padding: '14px 16px',
    fontSize: 13, color: '#334155', lineHeight: 1.7,
    border: '1px solid #e2e8f0',
  },
  reflectionLabel: {
    fontSize: 11, fontWeight: 700, color: '#7c3aed',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 4,
  },
  reflection: {
    background: '#faf5ff', borderRadius: 10, padding: '12px 14px',
    fontSize: 13, color: '#4b2a8a', lineHeight: 1.65,
    border: '1px solid #ede9fe',
    fontStyle: 'italic',
  },
  textarea: {
    width: '100%', minHeight: 80, borderRadius: 8, border: '1.5px solid #c4b5fd',
    padding: '10px 12px', fontSize: 13, lineHeight: 1.6, color: '#1e293b',
    fontFamily: "'Inter','Segoe UI',sans-serif",
    resize: 'vertical', background: '#faf5ff',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 4 },
  backBtn: {
    padding: '9px 18px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  nextBtn: (dim) => ({
    padding: '9px 20px', borderRadius: 8, border: 'none',
    background: DIMENSION_COLORS[dim]?.accent || '#4f46e5',
    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  }),
  celebrationBox: {
    textAlign: 'center', padding: '32px 24px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  celebrationIcon: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 0 12px rgba(245,158,11,0.12)',
  },
  celebrationTitle: {
    fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0,
  },
  celebrationSub: {
    fontSize: 14, color: '#475569', maxWidth: 360, lineHeight: 1.6, margin: 0,
  },
  starsBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'linear-gradient(135deg,#fef9c3,#fde68a)',
    border: '2px solid #f59e0b', borderRadius: 40,
    padding: '10px 20px', fontSize: 16, fontWeight: 800, color: '#92400e',
  },
  lockedOverlay: {
    borderRadius: 12, border: '1.5px dashed #c4b5fd', background: '#faf5ff',
    padding: '28px 24px', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    marginTop: 16,
  },
};

// ── QuestCard ─────────────────────────────────────────────────────────────────
function QuestCard({ quest, questProg, onStart, locked }) {
  const completedSteps = questProg?.completedSteps?.length || 0;
  const totalSteps = quest.steps.length;
  const pct = Math.round((completedSteps / totalSteps) * 100);
  const done = completedSteps >= totalSteps;
  const started = completedSteps > 0 && !done;
  const dimColors = DIMENSION_COLORS[quest.dimension] || {};

  return (
    <div style={q.card(quest.dimension, locked)}>
      {locked && (
        <div style={q.lockedBadge}>
          <img src="/icons/lock.svg" alt="" width={10} height={10} />
          Navigator
        </div>
      )}

      <div style={q.cardDimTag(quest.dimension)}>
        <img
          src={quest.icon}
          alt=""
          width={12}
          height={12}
          style={{ opacity: 0.85 }}
          onError={e => { e.currentTarget.src = '/icons/quest.svg'; }}
        />
        {quest.dimension}
      </div>

      <h3 style={q.cardTitle}>{quest.title}</h3>
      <p style={q.cardTagline}>{quest.tagline}</p>

      <div style={q.cardMeta}>
        <span>{quest.duration}</span>
        <span>{totalSteps} steps</span>
        <span>+{quest.totalPoints} stars</span>
      </div>

      {started && (
        <>
          <div style={q.progressBar(pct)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
          <div style={q.progressLabel}>Step {completedSteps}/{totalSteps} complete</div>
        </>
      )}

      {done && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669' }}>
          <img src="/icons/checkmark.svg" alt="" width={14} height={14} />
          Quest Complete — {quest.totalPoints} stars earned
        </div>
      )}

      {!locked && !done && (
        <button
          style={q.startBtn(quest.dimension)}
          onClick={() => onStart(quest)}
          aria-label={started ? `Continue ${quest.title}` : `Start ${quest.title}`}
        >
          <img src="/icons/quest.svg" alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} />
          {started ? 'Continue Quest' : 'Start Quest'}
        </button>
      )}
    </div>
  );
}

// ── QuestModal: step-by-step quest progress ───────────────────────────────────
function QuestModal({ quest, questProg, onClose, onComplete }) {
  const completedSteps = new Set(questProg?.completedSteps || []);
  const firstIncomplete = quest.steps.findIndex(s => !completedSteps.has(s.id));
  const [activeStepIdx, setActiveStepIdx] = useState(
    firstIncomplete >= 0 ? firstIncomplete : quest.steps.length - 1
  );
  const [notes, setNotes] = useState({});
  const [completing, setCompleting] = useState(false);
  const allDone = quest.steps.every(s => completedSteps.has(s.id));
  const celebSoundRef = useRef(false);

  useEffect(() => {
    if (allDone && !celebSoundRef.current && isSfxEnabled()) {
      celebSoundRef.current = true;
      playQuestCompleteSound();
    }
  }, [allDone]);

  if (allDone) {
    return (
      <div style={q.modal} role="dialog" aria-modal="true" aria-label={quest.title}>
        <div style={q.modalBox}>
          <div style={q.celebrationBox}>
            <div style={q.celebrationIcon}>
              <img src="/icons/quest.svg" alt="" width={36} height={36} style={{ filter: 'brightness(0) invert(1)' }} />
            </div>
            <h2 style={q.celebrationTitle}>Quest Complete!</h2>
            <p style={q.celebrationSub}>
              You have completed <strong>{quest.title}</strong>. Excellent work building your{' '}
              <strong>{quest.dimension}</strong> resilience.
            </p>
            <div style={q.starsBadge}>
              <img src="/icons/star.svg" alt="" width={18} height={18} />
              {quest.totalPoints} Stars Earned
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Badge unlocked: <strong>{quest.badgeLabel}</strong>
            </div>
            <button
              style={{ ...q.nextBtn(quest.dimension), marginTop: 8 }}
              onClick={onClose}
            >
              Back to Quests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const step = quest.steps[activeStepIdx];
  const stepDone = completedSteps.has(step.id);

  function handleCompleteStep() {
    if (completing) return;
    setCompleting(true);
    onComplete(quest.id, step.id, notes[step.id] || '');
    // Move to next step or close
    const nextIdx = quest.steps.findIndex((s, i) => i > activeStepIdx && !completedSteps.has(s.id));
    setTimeout(() => {
      setCompleting(false);
      if (nextIdx >= 0) {
        setActiveStepIdx(nextIdx);
      } else {
        // All steps done — re-render will show celebration
      }
    }, 300);
  }

  return (
    <div style={q.modal} role="dialog" aria-modal="true" aria-label={quest.title}>
      <div style={q.modalBox}>
        {/* Header */}
        <div style={q.modalHeader(quest.dimension)}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.75, marginBottom: 4 }}>
            {quest.dimension}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>{quest.title}</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {quest.steps.map((s, i) => (
              <div
                key={s.id}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: completedSteps.has(s.id) ? 'rgba(255,255,255,0.9)' : (i === activeStepIdx ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'),
                  border: i === activeStepIdx ? '2px solid #fff' : '2px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800,
                  color: completedSteps.has(s.id) ? (DIMENSION_COLORS[quest.dimension]?.accent || '#4f46e5') : '#fff',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveStepIdx(i)}
                title={`Step ${i + 1}`}
              >
                {completedSteps.has(s.id) ? (
                  <img src="/icons/checkmark.svg" alt="Done" width={12} height={12} style={{ filter: "brightness(0) invert(0.25)" }} />
                ) : (i + 1)}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={q.modalBody}>
          <div>
            <span style={q.stepNum}>Step {step.stepNum} of {quest.steps.length}</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '4px 0 0' }}>{step.title}</h3>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{step.duration} · +{step.points} stars</div>
          </div>

          <div style={q.prompt}>{step.prompt}</div>

          <div>
            <div style={q.reflectionLabel}>Reflection Prompt</div>
            <div style={q.reflection}>{step.reflection}</div>
          </div>

          {!stepDone && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Your notes (optional)
              </div>
              <textarea
                style={q.textarea}
                placeholder="Jot down your thoughts, reflections, or key insights…"
                value={notes[step.id] || ''}
                onChange={e => setNotes(prev => ({ ...prev, [step.id]: e.target.value }))}
                aria-label={`Notes for step: ${step.title}`}
              />
            </div>
          )}

          {stepDone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              <img src="/icons/checkmark.svg" alt="" width={16} height={16} />
              <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Step complete — {step.points} stars earned</span>
            </div>
          )}

          <div style={q.btnRow}>
            <button style={q.backBtn} onClick={onClose}>Back to Quests</button>
            {!stepDone && (
              <button
                style={q.nextBtn(quest.dimension)}
                onClick={handleCompleteStep}
                disabled={completing}
              >
                {completing ? 'Saving…' : `Complete Step ${step.stepNum}`}
              </button>
            )}
            {stepDone && activeStepIdx < quest.steps.length - 1 && (
              <button
                style={q.nextBtn(quest.dimension)}
                onClick={() => setActiveStepIdx(i => i + 1)}
              >
                Next Step
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main QuestsHub ────────────────────────────────────────────────────────────
/**
 * QuestsHub — full quest experience for Atlas Navigator users.
 * Starter users see a locked preview of the first quest + upgrade CTA.
 * Uses localStorage for quest progress (no backend dependency).
 */
export default function QuestsHub({ tier }) {
  const isNavigator = isNavigatorOrAbove(tier);
  const isStarter = isStarterOrAbove(tier);

  const [questProgress, setQuestProgress] = useState(() => loadQuestProgress());
  const [activeQuest, setActiveQuest] = useState(null);

  const handleComplete = useCallback((questId, stepId) => {
    setQuestProgress(prev => {
      const updated = { ...prev };
      const qp = updated[questId] || { completedSteps: [], starsEarned: 0 };
      if (!qp.completedSteps.includes(stepId)) {
        const questDef = ADULT_QUESTS.find(q => q.id === questId);
        const step = questDef?.steps.find(s => s.id === stepId);
        qp.completedSteps = [...qp.completedSteps, stepId];
        qp.starsEarned = (qp.starsEarned || 0) + (step?.points || 0);
      }
      updated[questId] = qp;
      saveQuestProgress(updated);
      return updated;
    });
  }, []);

  // Updated questProgress ref after setQuestProgress fires — pass into modal
  const getQuestProg = (questId) => questProgress[questId] || null;

  const totalStarsEarned = Object.values(questProgress).reduce((acc, qp) => acc + (qp?.starsEarned || 0), 0);
  const completedQuestCount = ADULT_QUESTS.filter(q => {
    const qp = questProgress[q.id];
    return qp && qp.completedSteps.length >= q.steps.length;
  }).length;

  return (
    <div style={q.wrap}>
      {/* Active quest modal */}
      {activeQuest && (
        <QuestModal
          quest={activeQuest}
          questProg={getQuestProg(activeQuest.id)}
          onClose={() => setActiveQuest(null)}
          onComplete={handleComplete}
        />
      )}

      {/* Intro / summary bar */}
      <div style={q.intro}>
        <img
          src="/icons/quest.svg"
          alt=""
          width={32}
          height={32}
          style={{ flexShrink: 0, marginTop: 2 }}
          onError={e => { e.currentTarget.src = '/icons/game-mountain.svg'; }}
        />
        <div style={q.introText}>
          <strong>Resilience Quests</strong> are structured multi-day missions — 3 focused steps per quest, each
          targeting a different resilience dimension. Complete all steps to earn stars and unlock a dimension badge.
          {isNavigator && totalStarsEarned > 0 && (
            <span style={{ marginLeft: 8, background: '#fef9c3', color: '#92400e', fontWeight: 700, borderRadius: 20, padding: '2px 8px', fontSize: 12 }}>
              {totalStarsEarned} quest stars · {completedQuestCount}/{ADULT_QUESTS.length} quests complete
            </span>
          )}
        </div>
      </div>

      {/* Navigator: full quest grid */}
      {isNavigator ? (
        <div style={q.grid}>
          {ADULT_QUESTS.map(quest => (
            <QuestCard
              key={quest.id}
              quest={quest}
              questProg={getQuestProg(quest.id)}
              onStart={setActiveQuest}
              locked={false}
            />
          ))}
        </div>
      ) : isStarter ? (
        <>
          {/* Starter: show first quest as preview, rest locked */}
          <div style={q.grid}>
            {ADULT_QUESTS.slice(0, 1).map(quest => (
              <QuestCard
                key={quest.id}
                quest={quest}
                questProg={null}
                onStart={() => {}}
                locked={true}
              />
            ))}
          </div>
          <div style={q.lockedOverlay}>
            <img
              src="/icons/quest.svg"
              alt=""
              width={40}
              height={40}
              onError={e => { e.currentTarget.src = '/icons/game-mountain.svg'; }}
            />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Quests — Navigator Only</div>
            <div style={{ fontSize: 13, color: '#475569', maxWidth: 380, lineHeight: 1.6 }}>
              Unlock all 6 multi-day resilience quests with Atlas Navigator. Each quest builds deep skills
              across a different dimension — with structured steps, reflection prompts, and dimension badges.
            </div>
            <a
              href={CHECKOUT_URLS['atlas-navigator']}
              style={{
                marginTop: 4, padding: '10px 22px', borderRadius: 8,
                background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13,
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <img src="/icons/compass.svg" alt="" width={14} height={14} style={{ filter: 'brightness(0) invert(1)' }} />
              Unlock Quests — Atlas Navigator
            </a>
          </div>
        </>
      ) : (
        <div style={q.lockedOverlay}>
          <img
            src="/icons/quest.svg"
            alt=""
            width={40}
            height={40}
            onError={e => { e.currentTarget.src = '/icons/game-mountain.svg'; }}
          />
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Sign In to Access Quests</div>
          <div style={{ fontSize: 13, color: '#475569', maxWidth: 380, lineHeight: 1.6 }}>
            Multi-day resilience quests require Atlas Navigator access. Sign in to check your tier,
            or upgrade to Navigator to start your first quest.
          </div>
          <a
            href={CHECKOUT_URLS['atlas-navigator']}
            style={{
              marginTop: 4, padding: '10px 22px', borderRadius: 8,
              background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            Get Atlas Navigator
          </a>
        </div>
      )}
    </div>
  );
}
