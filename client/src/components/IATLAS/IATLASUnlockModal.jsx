/**
 * IATLASUnlockModal.jsx
 * Tier-specific IATLAS unlock modals for payment gating.
 *
 * IATLAS is a separate product line from Atlas Start / Atlas Navigator
 * with its own pricing tiers.
 *
 * Variants:
 *   kids         — Kids Games/Curriculum (Individual $19.99 / Family $39.99 / Complete $99.99)
 *   caregiver    — Caregiver Resources (Family $39.99 / Complete $99.99)
 *   professional — Professional Materials (Practitioner $149 / Practice $399 / Enterprise custom)
 *
 * Props:
 *   variant  {'kids'|'caregiver'|'professional'}
 *   onClose  {func}
 *   token    {string}  — Auth bearer token (optional); enables direct Stripe Checkout
 */

import React, { useEffect, useRef, useState } from 'react';
import { createIATLASSubscription } from '../../api/iatlas.js';
import { getAuth0CachedToken } from '../../lib/apiFetch.js';

const MODAL_STYLES = `
  .iatlas-unlock-modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .iatlas-unlock-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem 1.5rem;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    text-align: center;
    position: relative;
  }

  .dark-mode .iatlas-unlock-card {
    background: #1e293b;
  }

  .iatlas-unlock-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    background: #eef2ff;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .iatlas-unlock-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 0.5rem;
  }

  .dark-mode .iatlas-unlock-title {
    color: #f1f5f9;
  }

  .iatlas-unlock-desc {
    font-size: 0.9rem;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 1.25rem;
  }

  .dark-mode .iatlas-unlock-desc {
    color: #94a3b8;
  }

  .iatlas-unlock-tiers {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    margin: 0 0 1.25rem;
    text-align: left;
  }

  .dark-mode .iatlas-unlock-tiers {
    background: #0f172a;
    border-color: #334155;
  }

  .iatlas-unlock-tiers-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin: 0 0 0.6rem;
  }

  .iatlas-unlock-tier-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #1e293b;
    margin-bottom: 0.4rem;
    line-height: 1.4;
  }

  .dark-mode .iatlas-unlock-tier-row {
    color: #e2e8f0;
  }

  .iatlas-unlock-tier-row:last-child {
    margin-bottom: 0;
  }

  .iatlas-unlock-check {
    color: #22c55e;
    font-weight: 700;
    flex-shrink: 0;
    font-size: 0.85rem;
  }

  .iatlas-unlock-actions {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .iatlas-unlock-btn-primary {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;
    display: inline-block;
  }

  .iatlas-unlock-btn-primary:hover {
    background: #4338ca;
  }

  .iatlas-unlock-btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .iatlas-unlock-btn-secondary {
    background: transparent;
    color: #64748b;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: 0.65rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: border-color 0.15s, color 0.15s;
    display: inline-block;
  }

  .iatlas-unlock-btn-secondary:hover {
    border-color: #4f46e5;
    color: #4f46e5;
  }

  .dark-mode .iatlas-unlock-btn-secondary {
    color: #94a3b8;
    border-color: #334155;
  }

  .iatlas-unlock-compare {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    color: #94a3b8;
  }

  .iatlas-unlock-compare a {
    color: #6366f1;
    text-decoration: none;
  }

  .iatlas-unlock-compare a:hover {
    text-decoration: underline;
  }

  .iatlas-unlock-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
    padding: 0.25rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 0.15s;
  }

  .iatlas-unlock-close:hover {
    background: #f1f5f9;
    color: #1e293b;
  }

  .dark-mode .iatlas-unlock-close:hover {
    background: #334155;
    color: #f1f5f9;
  }

  .iatlas-unlock-error {
    color: #dc2626;
    font-size: 0.82rem;
    margin-top: 0.5rem;
  }
`;

// Map each variant to the best default Stripe tier for the primary CTA
const VARIANT_DEFAULT_TIER = {
  kids:         'family',
  caregiver:    'family',
  professional: 'practitioner',
};

const VARIANT_CONFIG = {
  kids: {
    icon: '🎮',
    iconBg: '#fef3c7',
    title: 'Unlock Kids Resilience Games',
    desc: 'These interactive games teach emotional regulation, stress management, and resilience skills through play.',
    tiersLabel: 'Included with:',
    tiers: [
      { label: 'IATLAS Individual ($19.99/mo)', note: '1 child profile', tier: 'individual' },
      { label: 'IATLAS Family ($39.99/mo)', note: 'Up to 5 child profiles', tier: 'family' },
      { label: 'IATLAS Complete ($99.99/mo)', note: 'Full curriculum access', tier: 'complete' },
    ],
    primaryLabel: 'Subscribe — Family $39.99/mo',
    primaryTier: 'family',
    primaryHref: '/pricing/iatlas',
    secondaryLabel: 'Maybe Later',
  },
  caregiver: {
    icon: '👨‍👩‍👧',
    iconBg: '#d1fae5',
    title: 'Caregiver Resources',
    desc: 'Parent guides, family activities, and progress tracking tools to support your child\'s resilience journey.',
    tiersLabel: 'Included with:',
    tiers: [
      { label: 'IATLAS Family ($39.99/mo)', note: null, tier: 'family' },
      { label: 'IATLAS Complete ($99.99/mo)', note: null, tier: 'complete' },
    ],
    primaryLabel: 'Subscribe — Family $39.99/mo',
    primaryTier: 'family',
    primaryHref: '/pricing/iatlas',
    secondaryLabel: 'View All IATLAS Plans',
    secondaryHref: '/pricing/iatlas',
  },
  professional: {
    icon: '🩺',
    iconBg: '#d1fae5',
    title: 'Professional Practice Materials',
    desc: 'Clinical assessments, session plans, and client resources for mental health practitioners.',
    tiersLabel: 'Included with:',
    tiers: [
      { label: 'IATLAS Practitioner ($149/mo)', note: 'Individual practice', tier: 'practitioner' },
      { label: 'IATLAS Practice ($399/mo)', note: 'Group practice', tier: 'practice' },
      { label: 'IATLAS Enterprise (Custom)', note: 'Organizations', tier: null },
    ],
    primaryLabel: 'Subscribe — Practitioner $149/mo',
    primaryTier: 'practitioner',
    primaryHref: '/pricing/iatlas',
    secondaryLabel: 'Contact Sales',
    secondaryHref: 'mailto:sales@resilienceatlas.com',
  },
};

export default function IATLASUnlockModal({ variant = 'kids', onClose, token }) {
  const cardRef = useRef(null);
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.kids;
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    if (cardRef.current) cardRef.current.focus();
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  /**
   * Initiate Stripe Checkout for a given IATLAS tier.
   * Falls back to the pricing page if no auth token is available.
   */
  async function handleSubscribe(tier) {
    const authToken = token || getAuth0CachedToken();
    if (!authToken) {
      // Not authenticated — redirect to pricing page
      window.location.href = config.primaryHref;
      return;
    }

    setLoading(true);
    setCheckoutError('');

    try {
      const { url } = await createIATLASSubscription(authToken, tier);
      if (url) {
        window.location.href = url;
      } else {
        setCheckoutError('Unable to start checkout. Please try again.');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MODAL_STYLES }} />
      <div
        className="iatlas-unlock-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="iatlas-unlock-modal-title"
        onClick={handleBackdropClick}
      >
        <div
          className="iatlas-unlock-card"
          ref={cardRef}
          tabIndex={-1}
          style={{ outline: 'none' }}
        >
          <button
            className="iatlas-unlock-close"
            onClick={onClose}
            aria-label="Close"
          >
            &#x2715;
          </button>

          <div
            className="iatlas-unlock-icon"
            aria-hidden="true"
            style={{ background: config.iconBg }}
          >
            {config.icon}
          </div>

          <h2 className="iatlas-unlock-title" id="iatlas-unlock-modal-title">
            {config.title}
          </h2>

          <p className="iatlas-unlock-desc">{config.desc}</p>

          <div className="iatlas-unlock-tiers" aria-label="IATLAS plans that include this content">
            <p className="iatlas-unlock-tiers-label">{config.tiersLabel}</p>
            {config.tiers.map((tier) => (
              <div key={tier.label} className="iatlas-unlock-tier-row">
                <span className="iatlas-unlock-check" aria-hidden="true">✓</span>
                <span>
                  <strong>{tier.label}</strong>
                  {tier.note && <span style={{ color: '#64748b', fontWeight: 400 }}> — {tier.note}</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="iatlas-unlock-actions">
            {config.primaryTier ? (
              <button
                className="iatlas-unlock-btn-primary"
                onClick={() => handleSubscribe(config.primaryTier)}
                disabled={loading}
              >
                {loading ? 'Redirecting to checkout…' : config.primaryLabel}
              </button>
            ) : (
              <a
                href={config.primaryHref}
                className="iatlas-unlock-btn-primary"
              >
                {config.primaryLabel}
              </a>
            )}
            {config.secondaryHref ? (
              <a
                href={config.secondaryHref}
                className="iatlas-unlock-btn-secondary"
              >
                {config.secondaryLabel}
              </a>
            ) : (
              <button
                className="iatlas-unlock-btn-secondary"
                onClick={onClose}
              >
                {config.secondaryLabel}
              </button>
            )}
          </div>

          {checkoutError && (
            <p className="iatlas-unlock-error" role="alert">{checkoutError}</p>
          )}

          <p className="iatlas-unlock-compare">
            <a href="/pricing/iatlas">Compare all IATLAS plans →</a>
          </p>
        </div>
      </div>
    </>
  );
}
