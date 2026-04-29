/**
 * PaywallModal.jsx
 * Displayed when a user attempts to access a feature that requires an
 * IATLAS subscription tier they do not currently hold.
 *
 * Props:
 *   requiredTier  {string}   — the tier needed to access the feature
 *   currentTier   {string}   — the user's current tier
 *   onClose       {Function} — called when the user dismisses the modal
 */

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { track } from '../lib/analytics.js';

const TIER_DISPLAY = {
  free:         'Free',
  individual:   'IATLAS Individual',
  family:       'IATLAS Family',
  complete:     'IATLAS Complete',
  practitioner: 'IATLAS Practitioner',
  practice:     'IATLAS Practice',
  enterprise:   'IATLAS Enterprise',
};

export default function PaywallModal({ requiredTier, currentTier, onClose, feature = 'practice_dashboard' }) {
  const overlayRef = useRef(null);

  // Track paywall impression on mount
  useEffect(() => {
    track('Paywall Shown', {
      requiredTier,
      currentTier,
      feature,
    });
  }, [requiredTier, currentTier, feature]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close when clicking outside the modal box
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const requiredLabel = TIER_DISPLAY[requiredTier] || requiredTier;
  const currentLabel  = TIER_DISPLAY[currentTier]  || currentTier;

  return (
    <>
      <style>{`
        .paywall-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(15, 23, 42, 0.6);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .paywall-box {
          background: #fff;
          border-radius: 16px;
          padding: 2rem 2rem 1.75rem;
          max-width: 420px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,.25);
          text-align: center;
        }
        .paywall-icon {
          width: 56px; height: 56px;
          background: #fef3c7;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.75rem;
          margin: 0 auto 1.25rem;
        }
        .paywall-title {
          font-size: 1.25rem; font-weight: 800;
          color: #1e293b; margin: 0 0 .5rem;
        }
        .paywall-desc {
          font-size: .95rem; color: #64748b;
          margin: 0 0 .75rem; line-height: 1.55;
        }
        .paywall-current {
          font-size: .85rem; color: #94a3b8;
          margin: 0 0 1.5rem;
        }
        .paywall-current strong { color: #64748b; }
        .paywall-actions {
          display: flex; flex-direction: column; gap: .75rem;
        }
        .paywall-btn-primary {
          display: block;
          background: #4f46e5; color: #fff;
          font-size: .95rem; font-weight: 700;
          padding: .75rem 1rem; border-radius: 10px;
          text-decoration: none; border: none; cursor: pointer;
          transition: background .15s;
        }
        .paywall-btn-primary:hover { background: #4338ca; }
        .paywall-btn-close {
          background: none; border: none; cursor: pointer;
          font-size: .9rem; color: #94a3b8;
          padding: .5rem; border-radius: 8px;
          transition: color .15s;
        }
        .paywall-btn-close:hover { color: #475569; }
      `}</style>

      <div
        className="paywall-overlay"
        ref={overlayRef}
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        <div className="paywall-box">
          <div className="paywall-icon" aria-hidden="true">🔒</div>
          <h2 className="paywall-title" id="paywall-title">
            Upgrade to {requiredLabel}
          </h2>
          <p className="paywall-desc">
            This feature requires an active <strong>{requiredLabel}</strong> subscription.
          </p>
          <p className="paywall-current">
            Your current plan: <strong>{currentLabel}</strong>
          </p>
          <div className="paywall-actions">
            <Link
              to="/pricing/iatlas"
              className="paywall-btn-primary"
              onClick={() => track('Upgrade Clicked', { from: currentTier, to: requiredTier, source: 'paywall' })}
            >
              View Plans &amp; Upgrade
            </Link>
            <button className="paywall-btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
