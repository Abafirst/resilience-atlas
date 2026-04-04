import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

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
 *   checkoutUrl — string: checkout URL containing the tier, e.g. "/checkout?tier=atlas-starter"
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
  returnPath,
  children,
}) {
  const { isAuthenticated, loginWithRedirect, user } = useAuth0();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState('');

  if (!locked) return <>{children}</>;

  /** Extract the tier ID from a URL like '/checkout?tier=atlas-starter'. */
  function getTierFromUrl(url) {
    try {
      return new URLSearchParams((url || '').split('?')[1] || '').get('tier') || '';
    } catch {
      return '';
    }
  }

  async function handleUnlock() {
    const tier = getTierFromUrl(checkoutUrl);

    if (!isAuthenticated) {
      // Not signed in — go to Auth0 login first, then return here with the
      // checkout tier encoded in the URL so the dashboard can auto-start it.
      const returnTo = `/gamification?checkout=${encodeURIComponent(tier)}`;
      loginWithRedirect({ appState: { returnTo } });
      return;
    }

    // Already authenticated — call the checkout API directly (same pattern as
    // ResultsPage.handleUpgrade) to avoid redirect/callback-URL mismatch errors.
    const email = user?.email || '';
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email, ...(returnPath ? { returnPath } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Could not start checkout. Please try again.');
      setCheckoutLoading(false);
    }
  }

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
      <button
        type="button"
        onClick={handleUnlock}
        disabled={checkoutLoading}
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
          cursor: checkoutLoading ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'opacity .15s',
          opacity: checkoutLoading ? .7 : 1,
        }}
        onMouseEnter={e => { if (!checkoutLoading) e.currentTarget.style.opacity = '.88'; }}
        onMouseLeave={e => { if (!checkoutLoading) e.currentTarget.style.opacity = '1'; }}
      >
        <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} />
        {checkoutLoading ? 'Redirecting…' : `Unlock with ${tierName}`}
      </button>

      {checkoutError && (
        <p role="alert" style={{ margin: 0, fontSize: '.8rem', color: '#dc2626', textAlign: 'center' }}>
          {checkoutError}
        </p>
      )}
    </div>
  );
}
