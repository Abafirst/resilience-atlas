import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { CHOICE_SCENARIOS } from '../../data/adultGames.js';

const s = {
  wrap: { maxWidth: 580, margin: '0 auto' },
  header: { marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7aafc8', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px' },
  context: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '16px 20px', fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 20,
  },
  question: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 },
  choiceBtn: (selected, revealed) => ({
    width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: 10, marginBottom: 10,
    border: selected && !revealed ? '1px solid rgba(79,70,229,0.5)' :
            selected && revealed  ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
    background: selected && !revealed ? 'rgba(79,70,229,0.12)' :
                selected && revealed  ? 'rgba(79,70,229,0.08)' : 'rgba(255,255,255,0.02)',
    color: selected ? '#818cf8' : '#94a3b8',
    cursor: revealed ? 'default' : 'pointer', fontSize: 13, lineHeight: 1.5, transition: 'all 0.15s',
  }),
  choiceKey: { fontWeight: 700, marginRight: 10, color: '#7aafc8' },
  feedbackBox: {
    background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.15)',
    borderRadius: 10, padding: '20px', marginTop: 4, marginBottom: 20,
  },
  fbTitle: { fontSize: 13, fontWeight: 700, color: '#818cf8', marginBottom: 6 },
  fbPrinciple: { fontSize: 11, color: '#7aafc8', marginBottom: 10 },
  fbText: { fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 },
  navBtns: { display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 8 },
  backBtn: {
    padding: '10px 20px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
    color: '#718096', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  nextBtn: {
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  doneBox: {
    textAlign: 'center', padding: '32px 24px',
    background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)',
    borderRadius: 12,
  },
  doneIcon: { fontSize: 36, marginBottom: 12 },
  doneTitle: { fontSize: 18, fontWeight: 700, color: '#34d399', margin: '0 0 8px' },
  doneText: { fontSize: 13, color: '#6b7280', margin: '0 0 20px', lineHeight: 1.6 },
};

export default function ChoiceScenario({ onBack }) {
  const { getAccessTokenSilently } = useAuth0();
  // Pick a random scenario (or cycle through them)
  const [scenarioIndex] = useState(() => Math.floor(Math.random() * CHOICE_SCENARIOS.length));
  const [selected, setSelected]     = useState(null);
  const [revealed, setRevealed]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);

  const scenario = CHOICE_SCENARIOS[scenarioIndex];

  async function handleSubmit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    const choice = scenario.choices.find(c => c.key === selected);
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
      await fetch('/api/gamification/choice-quest', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scenarioId:   scenario.id,
          choiceKey:    selected,
          actPrinciple: choice?.actPrinciple || '',
        }),
      });
    } catch {}
    setRevealed(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div style={s.doneBox}>
        <div style={s.doneIcon}>✦</div>
        <h3 style={s.doneTitle}>Scenario Complete</h3>
        <p style={s.doneText}>Your response has been recorded. Consistent engagement with ACT-aligned scenario practice builds psychological flexibility over time.</p>
        <button style={s.nextBtn} onClick={onBack}>Return to Pathways</button>
      </div>
    );
  }

  const selectedChoice = scenario.choices.find(c => c.key === selected);

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <p style={s.eyebrow}>Daily Choice Scenario · ACT Practice</p>
        <h2 style={s.title}>{scenario.title}</h2>
      </div>
      <div style={s.context}>{scenario.context}</div>
      <p style={s.question}>{scenario.question}</p>
      {scenario.choices.map(choice => (
        <button
          key={choice.key}
          style={s.choiceBtn(selected === choice.key, revealed)}
          onClick={() => !revealed && setSelected(choice.key)}
          disabled={revealed}
          aria-pressed={selected === choice.key}
        >
          <span style={s.choiceKey}>{choice.key}.</span>{choice.text}
        </button>
      ))}

      {revealed && selectedChoice && (
        <div style={s.feedbackBox}>
          <div style={s.fbTitle}>Values-Aligned Reinforcement</div>
          <div style={s.fbPrinciple}>
            <span style={{ color: '#818cf8' }}>ACT:</span> {selectedChoice.actPrinciple} &nbsp;·&nbsp;
            <span style={{ color: '#34d399' }}>ABA:</span> {selectedChoice.abaPrinciple}
          </div>
          <p style={s.fbText}>{selectedChoice.feedback}</p>
        </div>
      )}

      <div style={s.navBtns}>
        <button style={s.backBtn} onClick={onBack}>Back</button>
        {!revealed ? (
          <button
            style={{ ...s.nextBtn, opacity: selected ? 1 : 0.4, cursor: selected ? 'pointer' : 'default' }}
            onClick={handleSubmit}
            disabled={!selected || submitting}
          >
            {submitting ? 'Saving…' : 'Confirm Choice'}
          </button>
        ) : (
          <button style={s.nextBtn} onClick={() => setDone(true)}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
