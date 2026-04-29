import React from 'react';

const STATUS_STYLES = {
  'not-started': { background: '#f3f4f6', color: '#6b7280', label: 'Not Started' },
  'in-progress':  { background: '#fef3c7', color: '#d97706', label: 'In Progress' },
  'completed':    { background: '#d1fae5', color: '#059669', label: 'Completed'   },
  'locked':       { background: '#f3f4f6', color: '#9ca3af', label: 'Locked'      },
};

export default function ModuleCard({
  moduleNumber,
  moduleName,
  moduleDescription,
  color,
  bg,
  estimatedDuration,
  sectionCount,
  completedSections,
  status,          // 'not-started' | 'in-progress' | 'completed' | 'locked'
  onStart,
}) {
  const st    = STATUS_STYLES[status] || STATUS_STYLES['not-started'];
  const pct   = sectionCount > 0 ? Math.round((completedSections / sectionCount) * 100) : 0;
  const locked = status === 'locked';

  return (
    <div
      className="ttf-module-card"
      style={{
        background:   locked ? '#f9fafb' : '#ffffff',
        border:       `1px solid ${locked ? '#e5e7eb' : color + '40'}`,
        borderRadius: 12,
        padding:      20,
        opacity:      locked ? 0.7 : 1,
        transition:   'box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: locked ? '#e5e7eb' : bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14,
            color: locked ? '#9ca3af' : color,
            flexShrink: 0,
          }}
        >
          {String(moduleNumber).padStart(2, '0')}
        </div>
        <span
          style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: st.background, color: st.color,
          }}
        >
          {locked && '🔒 '}
          {st.label}
        </span>
      </div>

      {/* Title + Description */}
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: locked ? '#9ca3af' : '#1f2937' }}>
        {moduleName}
      </h3>
      {moduleDescription && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          {moduleDescription}
        </p>
      )}

      {/* Progress bar */}
      {!locked && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{completedSections}/{sectionCount} sections</span>
            <span style={{ fontSize: 12, fontWeight: 600, color }}>{ pct}%</span>
          </div>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
        </div>
      )}

      {/* Duration + CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          ⏱ {estimatedDuration ? `${estimatedDuration} min` : '—'}
        </span>
        {!locked && onStart && (
          <button
            onClick={onStart}
            style={{
              background: status === 'completed' ? '#d1fae5' : color,
              color:       status === 'completed' ? '#059669' : '#fff',
              border:      'none', borderRadius: 8, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {status === 'completed' ? 'Review' : status === 'in-progress' ? 'Continue' : 'Start'}
          </button>
        )}
      </div>
    </div>
  );
}
