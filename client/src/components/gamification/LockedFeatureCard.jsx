import React from 'react';

const s = {
  card: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderTop: '3px solid #4f46e5',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(248,250,252,0.40)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    padding: '20px 24px',
    textAlign: 'center',
    borderRadius: 12,
  },
  lockBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#ede9fe',
    border: '1px solid #ddd6fe',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 13,
    fontWeight: 700,
    color: '#7c3aed',
    marginBottom: 10,
    letterSpacing: '0.02em',
  },
  lockMsg: {
    color: '#475569',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 1.5,
  },
  unlockBtn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    padding: '9px 22px',
    borderRadius: 8,
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    letterSpacing: '0.02em',
  },
  preview: {
    opacity: 0.30,
    pointerEvents: 'none',
    userSelect: 'none',
  },
};

/**
 * LockedFeatureCard — wraps any gamification feature in a locked-state overlay.
 *
 * Props:
 *   locked      — boolean: whether to show the locked overlay
 *   tierName    — string: e.g. "Atlas Starter" or "Atlas Navigator"
 *   checkoutUrl — string: href to navigate to for unlock
 *   children    — the feature content (shown as blurred preview when locked)
 */
export default function LockedFeatureCard({ locked, tierName, checkoutUrl, children }) {
  if (!locked) return <>{children}</>;

  return (
    <div style={s.card} aria-label={`Locked — requires ${tierName}`}>
      {/* Blurred preview of the feature */}
      <div style={s.preview} aria-hidden="true">
        {children}
      </div>

      {/* Locked overlay */}
      <div style={s.overlay} role="region" aria-label={`Locked feature: requires ${tierName}`}>
        <div style={s.lockBadge}>
          🔒 Locked
        </div>
        <p style={s.lockMsg}>
          Unlock with <strong style={{ color: '#1e293b' }}>{tierName}</strong> to access this feature
          and start your resilience journey.
        </p>
        <a
          href={checkoutUrl}
          style={s.unlockBtn}
          aria-label={`Unlock with ${tierName}`}
        >
          Unlock with {tierName}
        </a>
      </div>
    </div>
  );
}
