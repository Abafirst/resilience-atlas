import React from 'react';
import { getWebUrl, openExternalUrl } from '../utils/platform.js';

/**
 * InAppWebsiteOnlyNotice — inline replacement for pricing/paywall UI when
 * the app is running inside the Capacitor Android native wrapper.
 *
 * Renders a neutral, on-brand card that:
 *   - Explains that purchases are managed on the website.
 *   - Provides an "Open website" button that opens the landing page in the
 *     system browser (Chrome Custom Tabs on Android).
 *
 * Props:
 *   title        {string}  Optional heading override.
 *   description  {string}  Optional body text override.
 *   style        {object}  Optional additional container style.
 */
export default function InAppWebsiteOnlyNotice({
  title = 'Available on the website',
  description = 'Plans and purchases are managed on our website. Visit us there to get started.',
  style,
}) {
  function handleOpenWeb() {
    openExternalUrl(getWebUrl('/'));
  }

  return (
    <div
      style={{
        background:   '#f0f4ff',
        border:       '1px solid #c7d2fe',
        borderTop:    '3px solid #4f46e5',
        borderRadius: 12,
        padding:      '2rem 1.5rem',
        textAlign:    'center',
        maxWidth:     480,
        margin:       '0 auto',
        ...style,
      }}
    >
      <img
        src="/icons/compass.svg"
        alt=""
        aria-hidden="true"
        style={{ width: 40, height: 40, marginBottom: 12 }}
      />
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>
        {title}
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 1.25rem' }}>
        {description}
      </p>
      <button
        type="button"
        onClick={handleOpenWeb}
        style={{
          display:      'inline-block',
          padding:      '0.7rem 1.75rem',
          background:   'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color:        '#fff',
          border:       'none',
          borderRadius: 8,
          fontSize:     '0.9rem',
          fontWeight:   700,
          cursor:       'pointer',
          fontFamily:   'inherit',
        }}
      >
        <img
          src="/icons/compass.svg"
          alt=""
          aria-hidden="true"
          style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 6, filter: 'brightness(0) invert(1)' }}
        />
        Open website
      </button>
    </div>
  );
}
