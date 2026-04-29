import React from 'react';

export default function ProgressBar({ value = 0, max = 100, color = '#4f46e5', height = 8, label, showPct = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ width: '100%' }}>
      {(label || showPct) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          {label && <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>}
          {showPct && <span style={{ fontSize: 13, fontWeight: 600, color }}>{pct}%</span>}
        </div>
      )}
      <div style={{ height, background: '#f3f4f6', borderRadius: height / 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', width: `${pct}%`,
            background: color, borderRadius: height / 2,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}
