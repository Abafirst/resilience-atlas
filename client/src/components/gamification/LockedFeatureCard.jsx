import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * LockedFeatureCard — shows a clean preview card for locked gamification features.
 *
 * When locked, renders a card styled to match the Navigator pathway cards:
 *   - Light accentColor-tinted background (same approach as Navigator active cards)
 *   - Translucent color border + colored top accent border
 *   - Icon in rounded box
 *   - "Locked" badge chip in the top-right corner (no whole-card opacity wash)
 *   - Full title (readable) + slightly muted description
 *   - Full-width "Unlock with [Tier]" CTA button at bottom (disabled state only on button)
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

/** Convert a hex color to an rgba string with the given alpha (0–1). */
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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
  const { isAuthenticated, loginWithRedirect, user, getAccessTokenSilently } = useAuth0();
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
    // Default returnPath to '/gamification' so users return here after Stripe checkout.
    const effectiveReturnPath = returnPath || '/gamification';
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      let token = null;
      try { token = await getAccessTokenSilently(); } catch (_) { /* proceed without token */ }
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tier, email, returnPath: effectiveReturnPath }),
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

  // Derive light background tint from accentColor — mirrors Navigator active pathwayCard style
  const bgColor    = hexToRgba(accentColor, 0.06);
  const borderColor = hexToRgba(accentColor, 0.22);

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '.75rem',
        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
        transition: 'box-shadow .2s, transform .2s',
        position: 'relative',
      }}
      aria-label={`Locked — requires ${tierName}`}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Icon row + "Locked" badge chip in top-right */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
        {icon && (
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: hexToRgba(accentColor, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img src={icon} alt="" style={{ width: 28, height: 28 }} />
          </div>
        )}
        {/* Lock badge — clearly indicates locked state without washing out the card */}
        <span
          title={`Requires ${tierName}`}
          aria-label={`Locked — requires ${tierName}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.3rem',
            fontSize: '.68rem', fontWeight: 700, padding: '.25rem .6rem',
            borderRadius: 999,
            border: `1px solid ${hexToRgba(accentColor, 0.3)}`,
            background: hexToRgba(accentColor, 0.1),
            color: accentColor,
            textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 10, height: 10 }} />
          Locked
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
          <p style={{ fontSize: '.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            {description}
          </p>
        )}
      </div>

      {/* Tier label — small secondary hint below description */}
      <p style={{ margin: 0, fontSize: '.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
        Requires {tierName}
      </p>

      {/* Unlock CTA button — only the button is styled as a locked/disabled-looking action */}
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
          marginTop: '.25rem',
          background: accentColor,
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
