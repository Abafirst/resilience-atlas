import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Converts a hex colour string to an `rgba(r, g, b, alpha)` value.
 * Handles both 3-digit (#abc) and 6-digit (#aabbcc) formats.
 * Returns a transparent fallback for unrecognised input.
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
<<<<<<< copilot/update-locked-gamification-cards
 * When locked, renders a card styled to match the Navigator pathway cards:
 *   - Light accentColor-tinted background (same approach as Navigator active cards)
 *   - Translucent color border + colored top accent border
 *   - Icon in rounded box
 *   - "Locked" badge chip in the top-right corner (no whole-card opacity wash)
 *   - Full title (readable) + slightly muted description
 *   - Full-width "Unlock with [Tier]" CTA button at bottom (disabled state only on button)
=======
 * When locked, renders a card matching the Navigator pathway card visual language:
 *   - Accent-tinted background + colored top & side border
 *   - Icon in rounded box with subtle glow
 *   - Lock chip in top-right corner
 *   - Full title, description, and optional feature-preview bullets
 *   - Full-width "Unlock with [Tier]" button at bottom
>>>>>>> main
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

/** Convert a hex color to an rgba string with the given alpha (0–1). Falls back to the original hex on invalid input. */
function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return `rgba(79,70,229,${alpha})`;
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return `rgba(79,70,229,${alpha})`;
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
  features,
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

<<<<<<< copilot/update-locked-gamification-cards
  // Derive light background tint from accentColor — mirrors Navigator active pathwayCard style
  const bgColor = hexToRgba(accentColor, 0.06);
  const borderColor = hexToRgba(accentColor, 0.22);
=======
  // Derive rgba colour values from the accent so the card is format-safe
  const bgTint      = hexToRgba(accentColor, 0.05);   // very subtle tint
  const borderTint  = hexToRgba(accentColor, 0.25);   // soft border
  const iconBg      = hexToRgba(accentColor, 0.13);   // icon box bg
  const iconShadow  = hexToRgba(accentColor, 0.18);   // icon glow
  const chipBorder  = hexToRgba(accentColor, 0.25);   // lock chip border
  const chipBg      = hexToRgba(accentColor, 0.09);   // lock chip bg
  const cardShadow  = hexToRgba(accentColor, 0.09);   // resting shadow
  const hoverShadow = hexToRgba(accentColor, 0.18);   // hover shadow
  const btnShadow   = hexToRgba(accentColor, 0.31);   // button shadow
  const btnHoverSh  = hexToRgba(accentColor, 0.44);   // button hover shadow
>>>>>>> main

  return (
    <div
      style={{
<<<<<<< copilot/update-locked-gamification-cards
        background: bgColor,
        border: `1px solid ${borderColor}`,
=======
        background: bgTint,
        border: `1px solid ${borderTint}`,
>>>>>>> main
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '.75rem',
<<<<<<< copilot/update-locked-gamification-cards
        boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
=======
        boxShadow: `0 4px 16px ${cardShadow}`,
>>>>>>> main
        transition: 'box-shadow .2s, transform .2s',
        position: 'relative',
      }}
      aria-label={`Locked — requires ${tierName}`}
<<<<<<< copilot/update-locked-gamification-cards
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Icon row + "Locked" badge chip in top-right */}
=======
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
>>>>>>> main
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
        {icon && (
          <div
            aria-hidden="true"
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
<<<<<<< copilot/update-locked-gamification-cards
              background: hexToRgba(accentColor, 0.12),
=======
              background: iconBg,
              boxShadow: `0 2px 8px ${iconShadow}`,
>>>>>>> main
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img src={icon} alt="" style={{ width: 28, height: 28 }} />
          </div>
        )}
<<<<<<< copilot/update-locked-gamification-cards
        {/* Lock badge — clearly indicates locked state without washing out the card */}
=======
        {/* Lock chip — top-right corner */}
>>>>>>> main
        <span
          title={`Requires ${tierName}`}
          aria-label={`Locked — requires ${tierName}`}
          style={{
<<<<<<< copilot/update-locked-gamification-cards
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
=======
            display: 'inline-flex', alignItems: 'center', gap: '.25rem',
            fontSize: '.65rem', fontWeight: 700, padding: '.2rem .5rem',
            borderRadius: 999, border: `1px solid ${chipBorder}`,
            background: chipBg, color: accentColor,
            textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap',
          }}
        >
          <img src="/icons/lock.svg" alt="" aria-hidden="true" style={{ width: 9, height: 9, filter: 'none', opacity: 0.85 }} />
          {tierName}
>>>>>>> main
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
<<<<<<< copilot/update-locked-gamification-cards
          <p style={{ fontSize: '.88rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
=======
          <p style={{ fontSize: '.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
>>>>>>> main
            {description}
          </p>
        )}
      </div>

<<<<<<< copilot/update-locked-gamification-cards
      {/* Tier label — small secondary hint below description */}
      <p style={{ margin: 0, fontSize: '.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
        Requires {tierName}
      </p>

      {/* Unlock CTA button — only the button is styled as a locked/disabled-looking action */}
=======
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
>>>>>>> main
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
<<<<<<< copilot/update-locked-gamification-cards
          background: accentColor,
=======
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
>>>>>>> main
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
    </div>
  );
}
