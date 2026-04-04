import React from 'react';

/**
 * LockedFeatureCard — shows a clean preview card for locked gamification features.
 *
 * When locked, renders a card matching the Teams Resources GamificationCard style:
 *   - Colored top border
 *   - Icon in rounded box + tier badge
 *   - Full title and description (no blur, no opacity tricks)
 *   - Full-width "Unlock with [Tier]" button at bottom
 *
 * When unlocked, renders children directly.
 *
 * Props:
 *   locked      — boolean: whether to show the locked card
 *   tierName    — string: e.g. "Atlas Starter" or "Atlas Navigator"
 *   checkoutUrl — string: href to navigate to for unlock
 *   icon        — string: path to SVG icon, e.g. "/icons/compass.svg"
 *   title       — string: feature title
 *   description — string: feature description
 *   accentColor — string: hex color for top border and icon background (default: '#4f46e5')
 *   children    — the feature content (rendered when unlocked)
 */
export default function LockedFeatureCard({
  locked,
  tierName,
  checkoutUrl,
  icon,
  title,
  description,
  accentColor = '#4f46e5',
  children,
}) {
  if (!locked) return <>{children}</>;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,.06)',
        transition: 'box-shadow .2s, transform .2s',
      }}
      aria-label={`Locked — requires ${tierName}`}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Icon + tier badge row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
        {icon && (
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: `${accentColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img src={icon} alt="" style={{ width: 28, height: 28 }} />
          </div>
        )}
        <span
          title={`Requires ${tierName}`}
          aria-label={`Requires ${tierName}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.25rem',
            fontSize: '.7rem', fontWeight: 700, padding: '.2rem .55rem',
            borderRadius: 999, border: '1px solid rgba(124,58,237,0.25)',
            background: '#ede9fe', color: '#7c3aed',
            textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap',
          }}
        >
          <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 10, height: 10 }} /> {tierName}
        </span>
      </div>

      {/* Title + description */}
      <div style={{ flex: 1 }}>
        {title && (
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .4rem', lineHeight: 1.35 }}>
            {title}
          </h3>
        )}
        {description && (
          <p style={{ fontSize: '.88rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {description}
          </p>
        )}
      </div>

      {/* Unlock button */}
      <a
        href={checkoutUrl}
        aria-label={`Unlock with ${tierName}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '.5rem',
          marginTop: '.5rem',
          background: 'linear-gradient(135deg,#4F46E5,#7c3aed)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '.7rem 1.25rem',
          fontSize: '.9rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          textDecoration: 'none',
          boxSizing: 'border-box',
          transition: 'opacity .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} /> Unlock with {tierName}
      </a>
    </div>
  );
}
