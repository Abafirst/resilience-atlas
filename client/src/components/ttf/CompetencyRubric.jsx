import React, { useState } from 'react';

const COMPETENCIES = [
  { id: 'trauma_informed',    label: 'Trauma-Informed Facilitation' },
  { id: 'cultural_responsiveness', label: 'Cultural Responsiveness' },
  { id: 'protocol_fidelity',  label: 'Protocol Fidelity' },
  { id: 'group_dynamics',     label: 'Group Dynamics Management' },
  { id: 'dimensional_assessment', label: 'Dimensional Assessment Interpretation' },
  { id: 'micropractice_design', label: 'Micropractice Design' },
  { id: 'ethical_practice',   label: 'Ethical Practice' },
];

const RUBRIC = {
  1: 'Does not yet demonstrate this competency',
  2: 'Developing — shows understanding but inconsistent application',
  3: 'Proficient — consistently demonstrates this competency',
  4: 'Exemplary — models this competency and can teach it to others',
};

export default function CompetencyRubric({ scores, onChange, readOnly = false }) {
  const [tooltipId, setTooltipId] = useState(null);

  const currentScores = scores || {};
  const values = COMPETENCIES.map(c => currentScores[c.id]).filter(v => typeof v === 'number');
  const average = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : null;
  const passed  = average !== null && parseFloat(average) >= 3.0;

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', color: '#374151', width: '40%' }}>Competency</th>
              {[1, 2, 3, 4].map(n => (
                <th key={n} style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', color: '#374151', width: '15%' }}>
                  {n} — {n === 1 ? 'Developing' : n === 2 ? 'Progressing' : n === 3 ? 'Proficient' : 'Exemplary'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPETENCIES.map((comp, idx) => {
              const score = currentScores[comp.id];
              return (
                <tr
                  key={comp.id}
                  style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff' }}
                  onMouseEnter={() => setTooltipId(comp.id)}
                  onMouseLeave={() => setTooltipId(null)}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1f2937' }}>
                    {comp.label}
                    {tooltipId === comp.id && score && (
                      <div style={{
                        fontSize: 12, color: '#6b7280', fontWeight: 400, marginTop: 2
                      }}>
                        {RUBRIC[score]}
                      </div>
                    )}
                  </td>
                  {[1, 2, 3, 4].map(n => (
                    <td key={n} style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <input
                        type="radio"
                        name={comp.id}
                        value={n}
                        checked={score === n}
                        disabled={readOnly}
                        onChange={() => onChange && onChange({ ...currentScores, [comp.id]: n })}
                        style={{
                          width: 20, height: 20, cursor: readOnly ? 'default' : 'pointer',
                          accentColor: n >= 3 ? '#059669' : '#d97706',
                        }}
                        title={RUBRIC[n]}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {average !== null && (
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 10,
          background: passed ? '#d1fae5' : '#fef3c7',
          border: `1px solid ${passed ? '#6ee7b7' : '#fde68a'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: passed ? '#065f46' : '#92400e' }}>
              Average Score: {average} / 4.0
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: passed ? '#059669' : '#d97706', color: '#fff',
            }}>
              {passed ? '✓ Passing' : 'Below Passing (3.0 required)'}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: passed ? '#065f46' : '#92400e' }}>
            {passed
              ? 'Congratulations! This score meets the certification requirement (≥3.0 average).'
              : 'A minimum average score of 3.0 is required to earn TTF Certification.'}
          </p>
        </div>
      )}

      {/* Rubric legend */}
      <div style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Scoring Rubric
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
          {Object.entries(RUBRIC).map(([n, desc]) => (
            <p key={n} style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              <strong style={{ color: '#374151' }}>{n}</strong> — {desc}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
