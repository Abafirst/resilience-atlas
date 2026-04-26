import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AndroidWebModal from '../AndroidWebModal.jsx';
import { isCapacitorAndroid } from '../../utils/platform.js';

/**
 * Converts a hex color string to an `rgba(r, g, b, alpha)` value.
 * Handles both 3-digit (#abc) and 6-digit (#aabbcc) formats.
 * Returns a transparent fallback for unrecognized input.
 */
function hexToRgba(hex, alpha) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return `rgba(0,0,0,${alpha})`;
  let h = m[1];
  if (h.length === 3) {
    h = `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * LockedFeatureCard — shows a clean preview card for locked gamification features.
 *
 * When locked, renders a card matching the Navigator pathway card visual language:
 *   - Accent-tinted background + colored top & side border
 *   - Icon in rounded box with subtle glow
 *   - Lock chip in top-right corner
 *   - Full title, description, and optional feature-preview bullets
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
 *   features    — string[]: optional short feature-preview bullet items (2–4 items)
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
  features,
  returnPath,
  children,
}) {
  const { isAuthenticated, loginWithRedirect, user, getAccessTokenSilently } = useAuth0();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState('');
  const [showAndroidModal, setShowAndroidModal] = useState(false);

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
    // On Capacitor Android, do not start Stripe checkout — show a modal
    // directing users to the website instead.
    if (isCapacitorAndroid()) {
      setShowAndroidModal(true);
      return;
    }

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

  // Derive rgba color values from the accent so the card is format-safe
  const bgTint      = hexToRgba(accentColor, 0.05);   // very subtle tint
  const borderTint  = hexToRgba(accentColor, 0.25);   // soft border
  const iconBg      = hexToRgba(accentColor, 0.14);   // icon box bg
  const iconShadow  = hexToRgba(accentColor, 0.18);   // icon glow
  const chipBorder  = hexToRgba(accentColor, 0.25);   // lock chip border
  const chipBg      = hexToRgba(accentColor, 0.09);   // lock chip bg
  const cardShadow  = hexToRgba(accentColor, 0.09);   // resting shadow
  const hoverShadow = hexToRgba(accentColor, 0.18);   // hover shadow
  const btnShadow   = hexToRgba(accentColor, 0.31);   // button shadow
  const btnHoverSh  = hexToRgba(accentColor, 0.44);   // button hover shadow

  return (
    <div
      style={{
        background: bgTint,
        border: `1px solid ${borderTint}`,
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '.75rem',
        boxShadow: `0 4px 16px ${cardShadow}`,
        transition: 'box-shadow .2s, transform .2s',
        position: 'relative',
      }}
      aria-label={`Locked — requires ${tierName}`}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 28px ${hoverShadow}`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = `0 4px 16px ${cardShadow}`;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Icon + lock chip row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
        {icon && (
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: iconBg,
              boxShadow: `0 2px 8px ${iconShadow}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img src={icon} alt="" style={{ width: 28, height: 28 }} />
          </div>
        )}
        {/* Lock chip — top-right corner */}
        <span
          title={`Requires ${tierName}`}
          aria-label={`Locked — requires ${tierName}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '.25rem',
            fontSize: '.65rem', fontWeight: 700, padding: '.2rem .5rem',
            borderRadius: 999, border: `1px solid ${chipBorder}`,
            background: chipBg, color: accentColor,
            textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
          }}
        >
          <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 9, height: 9 }} />
          Locked
        </span>
      </div>

      {/* Title + description */}
      <div style={{ flex: 1 }}>
        {title && (
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 .35rem', lineHeight: 1.35 }}>
            {title}
          </h3>
        )}
        {description && (
          <p style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {description}
          </p>
        )}
      </div>

      {/* Feature preview bullets */}
      {Array.isArray(features) && features.length > 0 && (
        <ul
          aria-label="What's included"
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '.3rem',
          }}
        >
          {features.map((feat, idx) => (
            <li
              key={`${feat}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '.4rem',
                fontSize: '.8rem',
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              <span aria-hidden="true" style={{ color: accentColor, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
              {feat}
            </li>
          ))}
        </ul>
      )}

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
          marginTop: '.25rem',
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '.65rem 1.25rem',
          fontSize: '.875rem',
          fontWeight: 700,
          cursor: checkoutLoading ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'opacity .15s, box-shadow .15s',
          opacity: checkoutLoading ? .7 : 1,
          boxShadow: `0 2px 8px ${btnShadow}`,
        }}
        onMouseEnter={e => {
          if (!checkoutLoading) {
            e.currentTarget.style.opacity = '.9';
            e.currentTarget.style.boxShadow = `0 4px 14px ${btnHoverSh}`;
          }
        }}
        onMouseLeave={e => {
          if (!checkoutLoading) {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.boxShadow = `0 2px 8px ${btnShadow}`;
          }
        }}
      >
        <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 14, height: 14, filter: 'brightness(0) invert(1)' }} />
        {checkoutLoading ? 'Redirecting…' : `Unlock with ${tierName}`}
      </button>

      {checkoutError && (
        <p role="alert" style={{ margin: 0, fontSize: '.8rem', color: '#dc2626', textAlign: 'center' }}>
          {checkoutError}
        </p>
      )}

      {showAndroidModal && (
        <AndroidWebModal onClose={() => setShowAndroidModal(false)} />
      )}
    </div>
  );
}
