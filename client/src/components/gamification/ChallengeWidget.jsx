import React, { useState } from 'react';

const VALID_DIMENSIONS = [
  'Cognitive-Narrative',
  'Emotional-Somatic',
  'Relational-Social',
  'Agentic-Generative',
  'Somatic-Regulative',
  'Spiritual-Reflective',
];

const DIFFICULTY_COLORS = {
  easy:   { bg: '#d1fae5', text: '#065f46' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  hard:   { bg: '#fee2e2', text: '#991b1b' },
};

const TOTAL_DAYS = 3;

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
  empty: {
    fontSize: 14,
    color: '#64748b',
    margin: '0 0 14px',
  },
  startBtn: {
    display: 'inline-block',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: 13,
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  dimension: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 6,
  },
  diffBadge: (difficulty) => {
    const c = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium;
    return {
      display: 'inline-block',
      background: c.bg,
      color: c.text,
      fontSize: 11,
      fontWeight: 700,
      padding: '2px 10px',
      borderRadius: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: 14,
    };
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  pip: (done) => ({
    fontSize: 22,
    lineHeight: 1,
    color: done ? '#059669' : '#cbd5e1',
  }),
  fraction: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  reward: {
    fontSize: 13,
    color: '#64748b',
  },
  // Modal styles
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    background: '#fff',
    borderRadius: 14,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#1a1a2e',
    marginBottom: 20,
    margin: '0 0 20px',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  select: {
    display: 'block',
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a2e',
    background: '#fff',
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    padding: '10px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    background: '#fff',
    color: '#374151',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    cursor: 'pointer',
  },
  modalError: {
    marginTop: 10,
    fontSize: 13,
    color: '#dc2626',
    minHeight: 20,
  },
};

function ChallengeModal({ onClose, onSubmit }) {
  const [dimension, setDimension]   = useState(VALID_DIMENSIONS[0]);
  const [difficulty, setDifficulty] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const handleConfirm = async () => {
    setSubmitting(true);
    setModalError('');
    try {
      await onSubmit(dimension, difficulty);
      onClose();
    } catch (err) {
      setModalError(err.message || 'Failed to set challenge. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={s.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Start a weekly challenge"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={s.modalBox}>
        <h2 style={s.modalTitle}>Start Weekly Challenge 🎯</h2>

        <label style={s.label} htmlFor="gam-dim-select">Choose a dimension</label>
        <select
          id="gam-dim-select"
          style={s.select}
          value={dimension}
          onChange={e => setDimension(e.target.value)}
        >
          {VALID_DIMENSIONS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <label style={s.label} htmlFor="gam-diff-select">Difficulty</label>
        <select
          id="gam-diff-select"
          style={s.select}
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <div style={s.actions}>
          <button
            style={s.confirmBtn}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Starting…' : 'Start Challenge'}
          </button>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
        </div>

        {modalError && (
          <p style={s.modalError} aria-live="polite">{modalError}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Displays the current weekly challenge, or a prompt to start one.
 */
export default function ChallengeWidget({ progress, onSetChallenge }) {
  const [showModal, setShowModal] = useState(false);
  const ch = progress?.currentChallenge;

  const handleSubmit = async (dimension, difficulty) => {
    await onSetChallenge(dimension, difficulty);
  };

  return (
    <>
      <div style={s.widget} role="region" aria-label={ch?.dimension ? `Weekly challenge: ${ch.dimension}` : 'Weekly challenge'}>
        <h3 style={s.widgetTitle}>Weekly Challenge</h3>

        {!ch || !ch.dimension ? (
          <>
            <p style={s.empty}>No active challenge this week.</p>
            <button style={s.startBtn} onClick={() => setShowModal(true)}>
              Start a Challenge 🎯
            </button>
          </>
        ) : (
          <>
            <div style={s.dimension}>{ch.dimension}</div>
            <span style={s.diffBadge(ch.difficulty || 'medium')}>
              {ch.difficulty || 'medium'}
            </span>

            <div
              style={s.progressRow}
              aria-label={`Progress: ${ch.completedDays ?? 0} of ${TOTAL_DAYS} days completed`}
            >
              {Array.from({ length: TOTAL_DAYS }, (_, i) => (
                <span key={i} style={s.pip(i < (ch.completedDays ?? 0))} aria-hidden="true">
                  {i < (ch.completedDays ?? 0) ? '✅' : '⬜'}
                </span>
              ))}
              <span style={s.fraction}>{ch.completedDays ?? 0}/{TOTAL_DAYS}</span>
            </div>

            <div style={s.reward}>
              🎁 Reward: +{ch.reward ?? 10} pts on completion
            </div>
          </>
        )}
      </div>

      {showModal && (
        <ChallengeModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
