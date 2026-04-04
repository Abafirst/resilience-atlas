import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { MICRO_QUESTS, DIMENSION_COLORS, ADULT_BADGES } from '../../data/adultGames.js';

const s = {
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' },
  sectionSub: { fontSize: 13, color: '#718096', margin: '0 0 20px', lineHeight: 1.5 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  card: (dim, completed) => ({
    background: completed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${DIMENSION_COLORS[dim]?.border || 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12,
    padding: '20px',
    transition: 'all 0.2s',
    position: 'relative',
    opacity: completed ? 0.75 : 1,
  }),
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  dimIcon: (dim) => ({
    width: 36, height: 36, borderRadius: 8,
    background: DIMENSION_COLORS[dim]?.bg || '#1e293b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  }),
  cardTitle: { fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: '0 0 2px' },
  cardDim: { fontSize: 12, color: '#718096' },
  cardDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px' },
  duration: {
    display: 'inline-block', fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 4,
    background: 'rgba(14,165,233,0.1)', color: '#7aafc8',
    marginBottom: 12,
  },
  framework: { fontSize: 11, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 },
  btn: (completed) => ({
    width: '100%', padding: '10px 16px', borderRadius: 8,
    border: 'none', cursor: completed ? 'default' : 'pointer',
    fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
    background: completed ? 'rgba(16,185,129,0.1)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: completed ? '#34d399' : '#fff',
  }),
  completedBadge: {
    position: 'absolute', top: 12, right: 12,
    background: 'rgba(16,185,129,0.15)', color: '#34d399',
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
  },
  modal: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalBox: {
    background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '32px', maxWidth: 520, width: '100%',
    maxHeight: '90vh', overflowY: 'auto',
  },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' },
  modalDim: { fontSize: 13, color: '#818cf8', margin: '0 0 20px' },
  modalPrompt: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 8,
    padding: '16px', fontSize: 14, color: '#cbd5e1',
    lineHeight: 1.7, marginBottom: 16,
  },
  reflectionLabel: { fontSize: 12, fontWeight: 700, color: '#7aafc8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  reflectionCue: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' },
  frameworkBox: {
    background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)',
    borderRadius: 8, padding: '12px 16px', marginBottom: 20,
  },
  frameworkRow: { fontSize: 12, color: '#818cf8', marginBottom: 4 },
  modalBtns: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#718096', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  completeBtn: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
};

const DIM_EMOJI = {
  'Agentic-Generative': '⚡',
  'Relational-Connective': '🤝',
  'Emotional-Adaptive': '💛',
  'Spiritual-Reflective': '🧭',
  'Somatic-Regulative': '🌿',
  'Cognitive-Narrative': '💡',
};

export default function StarterMicroQuests({ tier, progress }) {
  const { getAccessTokenSilently } = useAuth0();
  const [activeQuest, setActiveQuest]   = useState(null);
  const [completing, setCompleting]     = useState(false);
  const [localDone, setLocalDone]       = useState(new Set());
  const [newBadge, setNewBadge]         = useState(null);

  const completedIds = new Set([
    ...(progress?.microQuests?.map(q => q.questId) || []),
    ...localDone,
  ]);

  async function handleComplete(quest) {
    if (completedIds.has(quest.id) || completing) return;
    setCompleting(true);
    try {
      let headers = { 'Content-Type': 'application/json' };
      try {
        const token = await getAccessTokenSilently();
        headers.Authorization = `Bearer ${token}`;
      } catch {
        const stored = localStorage.getItem('auth_token');
        if (stored) headers.Authorization = `Bearer ${stored}`;
      }
      const res  = await fetch('/api/gamification/progress/quest-complete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ questId: quest.id, dimension: quest.dimension }),
      });
      const data = await res.json().catch(() => ({}));
      setLocalDone(prev => new Set([...prev, quest.id]));
      if (data.newBadges?.length) setNewBadge(data.newBadges[0]);
      setActiveQuest(null);
    } catch (err) {
      setLocalDone(prev => new Set([...prev, quest.id]));
      setActiveQuest(null);
    } finally {
      setCompleting(false);
    }
  }

  const completedCount = completedIds.size;

  return (
    <div>
      {newBadge && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🏅</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>Badge Earned: {newBadge}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Keep building momentum through consistent micro-commitments.</div>
          </div>
          <button onClick={() => setNewBadge(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      <div style={s.section}>
        <h3 style={s.sectionTitle}>Micro-Commitment Practices</h3>
        <p style={s.sectionSub}>
          Five-minute values-aligned practices — one for each resilience dimension. Each practice is designed around behavioral activation and ACT committed action principles. Progress: {completedCount}/6 completed.
        </p>
        <div style={s.grid}>
          {MICRO_QUESTS.map(quest => {
            const done   = completedIds.has(quest.id);
            const colors = DIMENSION_COLORS[quest.dimension] || {};
            return (
              <div key={quest.id} style={s.card(quest.dimension, done)}>
                {done && <span style={s.completedBadge}>✓ Complete</span>}
                <div style={s.cardHeader}>
                  <div style={{ ...s.dimIcon(quest.dimension), color: colors.accent }}>
                    {DIM_EMOJI[quest.dimension] || '◆'}
                  </div>
                  <div>
                    <div style={s.cardTitle}>{quest.title}</div>
                    <div style={s.cardDim}>{quest.dimension}</div>
                  </div>
                </div>
                <span style={s.duration}>{quest.duration}</span>
                <p style={s.cardDesc}>{quest.description}</p>
                <div style={s.framework}>
                  <span style={{ color: '#818cf8' }}>ABA:</span> {quest.abaPrinciple} &nbsp;·&nbsp;
                  <span style={{ color: '#34d399' }}>ACT:</span> {quest.actPrinciple}
                </div>
                <button
                  style={s.btn(done)}
                  onClick={() => !done && setActiveQuest(quest)}
                  disabled={done}
                  aria-label={done ? `${quest.title} completed` : `Begin ${quest.title}`}
                >
                  {done ? '✓ Practice Complete' : 'Begin Practice'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeQuest && (
        <div style={s.modal} role="dialog" aria-modal="true" aria-label={activeQuest.title}>
          <div style={s.modalBox}>
            <h2 style={s.modalTitle}>{activeQuest.title}</h2>
            <p style={s.modalDim}>{activeQuest.dimension} · {activeQuest.duration}</p>
            <div style={s.modalPrompt}>{activeQuest.prompt}</div>
            <p style={s.reflectionLabel}>Reflection Prompt</p>
            <p style={s.reflectionCue}>{activeQuest.reflectionCue}</p>
            <div style={s.frameworkBox}>
              <div style={s.frameworkRow}><strong>ABA Principle:</strong> {activeQuest.abaPrinciple}</div>
              <div style={s.frameworkRow}><strong>ACT Principle:</strong> {activeQuest.actPrinciple}</div>
            </div>
            <div style={s.modalBtns}>
              <button style={s.cancelBtn} onClick={() => setActiveQuest(null)}>Back</button>
              <button style={s.completeBtn} onClick={() => handleComplete(activeQuest)} disabled={completing}>
                {completing ? 'Recording…' : 'Mark as Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
