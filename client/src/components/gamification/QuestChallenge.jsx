import React, { useState } from 'react';
import { DIMENSION_COLORS } from '../../data/adultGames.js';

const s = {
  wrap: { maxWidth: 640, margin: '0 auto' },
  stepIndicator: { display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center' },
  step: (active, done) => ({
    width: 28, height: 28, borderRadius: '50%', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, cursor: done ? 'pointer' : 'default',
    background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(79,70,229,0.3)' : 'rgba(255,255,255,0.06)',
    color: done ? '#34d399' : active ? '#818cf8' : '#4b5563',
    outline: active ? '2px solid rgba(79,70,229,0.5)' : 'none',
  }),
  stepLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12, padding: '28px',
  },
  eyebrow: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7aafc8', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' },
  subtitle: { fontSize: 13, color: '#718096', margin: '0 0 20px' },
  framework: { fontSize: 12, color: '#818cf8', marginBottom: 20, padding: '8px 12px', background: 'rgba(79,70,229,0.06)', borderRadius: 6 },
  label: { fontSize: 12, fontWeight: 700, color: '#7aafc8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
  body: { fontSize: 14, color: '#cbd5e1', lineHeight: 1.75, marginBottom: 20 },
  optionBtn: (selected, correct, revealed) => ({
    width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 8,
    border: `1px solid ${revealed ? (correct ? 'rgba(16,185,129,0.4)' : selected ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.06)') : selected ? 'rgba(79,70,229,0.4)' : 'rgba(255,255,255,0.06)'}`,
    background: revealed ? (correct ? 'rgba(16,185,129,0.08)' : selected ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)') : selected ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.02)',
    color: revealed ? (correct ? '#34d399' : selected ? '#f87171' : '#94a3b8') : selected ? '#818cf8' : '#94a3b8',
    cursor: revealed ? 'default' : 'pointer', marginBottom: 8,
    fontSize: 13, lineHeight: 1.5,
  }),
  feedbackBox: (correct) => ({
    background: correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
    border: `1px solid ${correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
    borderRadius: 8, padding: '12px 16px', marginTop: 12,
    fontSize: 13, color: correct ? '#34d399' : '#fca5a5', lineHeight: 1.6,
  }),
  textarea: {
    width: '100%', minHeight: 120, padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, color: '#e2e8f0', fontSize: 13, lineHeight: 1.6,
    resize: 'vertical', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  navBtns: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
  prevBtn: {
    padding: '10px 20px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
    color: '#718096', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  },
  nextBtn: (enabled) => ({
    padding: '10px 20px', borderRadius: 8, border: 'none',
    background: enabled ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.06)',
    color: enabled ? '#fff' : '#4b5563', cursor: enabled ? 'pointer' : 'default',
    fontSize: 13, fontWeight: 600, opacity: enabled ? 1 : 0.5,
  }),
};

/**
 * QuestChallenge — displays a multi-step pathway level (knowledge/practice/scenario)
 * Props:
 *   level     — level object from SKILL_PATHWAYS[n].levels[n]
 *   dimension — dimension name string
 *   onComplete(answers) — called when all steps are done
 *   onBack    — called to go back
 */
export default function QuestChallenge({ level, dimension, onComplete, onBack }) {
  const [step, setStep]               = useState(0); // 0 = knowledge, 1 = practice/apply, 2 = reflection
  const [selectedOption, setSelected] = useState(null);
  const [revealed, setRevealed]       = useState(false);
  const [journalText, setJournal]     = useState('');
  const [reflText, setRefl]           = useState('');
  const [answers, setAnswers]         = useState({});

  const content    = level.content;
  const totalSteps = level.level === 1 ? 3 : level.level === 2 ? 2 : 2;

  function handleOptionClick(key) {
    if (revealed) return;
    setSelected(key);
    setRevealed(true);
    setAnswers(a => ({ ...a, knowledgeChoice: key }));
  }

  function canAdvance() {
    if (step === 0 && level.level === 1) return revealed;
    if (step === 1 && level.level === 2) return journalText.trim().length >= 20;
    if (step === 1 && level.level === 3) return journalText.trim().length >= 20;
    return true;
  }

  function handleNext() {
    if (!canAdvance()) return;
    if (step + 1 >= totalSteps) {
      onComplete({ ...answers, journalText, reflText });
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div style={s.wrap}>
      {/* Step indicator */}
      <div style={s.stepIndicator} aria-label={`Step ${step + 1} of ${totalSteps}`}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={s.step(i === step, i < step)}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < totalSteps - 1 && <div style={s.stepLine} />}
          </React.Fragment>
        ))}
      </div>

      <div style={s.card}>
        <p style={s.eyebrow}>{level.framework}</p>
        <h3 style={s.title}>{level.title}</h3>
        <p style={s.subtitle}>{level.subtitle} · {level.duration}</p>

        {/* Step 0: Knowledge check (Level 1) */}
        {step === 0 && level.level === 1 && content.knowledge && (
          <>
            <p style={s.label}>Evidence Base</p>
            <p style={s.body}>{content.knowledge}</p>
            {content.question && (
              <>
                <p style={s.label}>Knowledge Check</p>
                <p style={{ fontSize: 14, color: '#e2e8f0', marginBottom: 12, fontWeight: 500 }}>{content.question}</p>
                {content.options.map(opt => (
                  <button
                    key={opt.key}
                    style={s.optionBtn(selectedOption === opt.key, opt.correct, revealed)}
                    onClick={() => handleOptionClick(opt.key)}
                    aria-pressed={selectedOption === opt.key}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8 }}>{opt.key}.</span>{opt.text}
                  </button>
                ))}
                {revealed && (
                  <div style={s.feedbackBox(content.options.find(o => o.key === selectedOption)?.correct)}>
                    {content.options.find(o => o.key === selectedOption)?.correct
                      ? '✓ Accurate — well identified.'
                      : `The most accurate answer is: ${content.options.find(o => o.correct)?.text}`}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {step === 0 && level.level === 1 && content.reflection && (
          <>
            <p style={{ ...s.label, marginTop: 20 }}>Reflection</p>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic' }}>{content.reflection}</p>
          </>
        )}

        {/* Step 1: Practice / Apply */}
        {((step === 0 && (level.level === 2 || level.level === 3)) || (step === 1 && level.level === 1)) && (
          <>
            {content.practice && (
              <>
                <p style={s.label}>Applied Practice</p>
                <p style={s.body}>{content.practice}</p>
              </>
            )}
            {content.task && (
              <>
                <p style={s.label}>Committed Action Task</p>
                <p style={{ ...s.body, whiteSpace: 'pre-line' }}>{content.task}</p>
              </>
            )}
            {content.scenario && (
              <>
                <p style={s.label}>Scenario</p>
                <p style={s.body}>{content.scenario}</p>
              </>
            )}
            {(content.journalPrompts || content.reflection) && (
              <>
                <p style={{ ...s.label, marginTop: 8 }}>Journal Response</p>
                {content.journalPrompts && (
                  <ul style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.8, paddingLeft: 20, marginBottom: 12 }}>
                    {content.journalPrompts.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                )}
                <textarea
                  style={s.textarea}
                  value={journalText}
                  onChange={e => setJournal(e.target.value)}
                  placeholder="Write your reflection here (minimum 20 characters)…"
                  aria-label="Journal entry"
                />
              </>
            )}
          </>
        )}

        {/* Final step: reflection */}
        {((step === totalSteps - 1) && step > 0) && content.reflection && (
          <>
            <p style={s.label}>Closing Reflection</p>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>{content.reflection}</p>
            <textarea
              style={s.textarea}
              value={reflText}
              onChange={e => setRefl(e.target.value)}
              placeholder="Brief reflection (optional)…"
              aria-label="Closing reflection"
            />
          </>
        )}

        <div style={s.navBtns}>
          <button style={s.prevBtn} onClick={step === 0 ? onBack : () => setStep(s => s - 1)}>
            {step === 0 ? 'Back' : 'Previous'}
          </button>
          <button style={s.nextBtn(canAdvance())} onClick={handleNext} disabled={!canAdvance()}>
            {step + 1 >= totalSteps ? 'Complete Level' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
