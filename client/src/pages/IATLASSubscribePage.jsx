/**
 * IATLASSubscribePage.jsx
 * Subscription checkout redirect page.
 *
 * Route: /iatlas/subscribe?tier=<tier>
 *
 * Behaviour:
 *   • Reads the `tier` query param.
 *   • If the tier is "coming soon" (complete / practitioner / practice), redirects
 *     to the waitlist page.
 *   • If the tier is "enterprise", redirects to the contact-sales email.
 *   • If the tier is "individual" or "family":
 *       – Requires authentication (redirects to Auth0 if not logged in).
 *       – Calls POST /api/iatlas/subscribe to create a Stripe Checkout Session.
 *       – Redirects the browser to the returned Stripe checkout URL.
 *   • Handles errors gracefully with an in-page message and a retry / back link.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import { createIATLASSubscription } from '../api/iatlas.js';

// Tiers that are still coming soon — send to waitlist
const COMING_SOON_TIERS = new Set(['complete', 'practitioner', 'practice']);

// Tiers that can be subscribed to via Stripe
const SUBSCRIBABLE_TIERS = new Set(['individual', 'family']);

const TIER_LABELS = {
  individual: 'IATLAS Individual — $19.99/mo',
  family:     'IATLAS Family — $39.99/mo',
};

export default function IATLASSubscribePage() {
  const [searchParams] = useSearchParams();
  const tier = (searchParams.get('tier') || '').toLowerCase().trim();

  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [status, setStatus]     = useState('idle'); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  const isSubscribable = SUBSCRIBABLE_TIERS.has(tier);

  // ── Stripe checkout effect — only runs for subscribable tiers ──────────────
  useEffect(() => {
    if (!isSubscribable) return;
    if (isLoading) return;

    // Not authenticated → redirect to Auth0 login, then back to this URL
    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: `/iatlas/subscribe?tier=${encodeURIComponent(tier)}` },
      });
      return;
    }

    // Authenticated → create Stripe session and redirect
    if (status !== 'idle') return; // already in-flight or errored
    setStatus('loading');
    (async () => {
      try {
        const token = await getAccessTokenSilently();
        const { url } = await createIATLASSubscription(token, tier);
        // Redirect to Stripe Hosted Checkout
        window.location.href = url;
      } catch (err) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to start checkout. Please try again.');
      }
    })();
  }, [isSubscribable, isLoading, isAuthenticated, tier, loginWithRedirect, getAccessTokenSilently, status, retryCount]);

  // ── Routing guards (no hooks after this point) ─────────────────────────────

  // Enterprise → contact sales (show a prompt so users know what's happening)
  if (tier === 'enterprise') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <SiteHeader activePage="pricing" />
        <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '2rem 1.5rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>🏢</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>Enterprise Inquiry</h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              Enterprise plans are customised to your organisation. Click the button below to contact our sales team.
            </p>
            <a
              href="mailto:hello@theresilienceatlas.com?subject=IATLAS%20Enterprise%20Inquiry"
              style={{ display: 'inline-block', background: '#4f46e5', color: '#fff', padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
            >
              Email Sales Team
            </a>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/iatlas/pricing" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Back to Pricing</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Coming-soon tiers → waitlist
  if (COMING_SOON_TIERS.has(tier)) {
    return <Navigate to={`/iatlas/waitlist?tier=${encodeURIComponent(tier)}`} replace />;
  }

  // Unknown / missing tier → back to pricing
  if (!isSubscribable) {
    return <Navigate to="/iatlas/pricing" replace />;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SiteHeader activePage="pricing" />

      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        padding: '2rem 1.5rem',
      }}>
        {/* Loading / redirecting to Stripe */}
        {(isLoading || status === 'loading') && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid #e0e7ff',
              borderTop: '4px solid #4f46e5',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1.5rem',
            }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
              Preparing your checkout…
            </p>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Setting up <strong>{TIER_LABELS[tier]}</strong>
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div style={{
            background: '#fff',
            border: '1.5px solid #fca5a5',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            maxWidth: 480,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          }}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
              Checkout failed
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {retryCount < MAX_RETRIES && (
                <button
                  onClick={() => { setRetryCount(c => c + 1); setStatus('idle'); }}
                  style={{
                    background: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  Try again
                </button>
              )}
              <Link
                to="/iatlas/pricing"
                style={{
                  background: '#f1f5f9',
                  color: '#374151',
                  border: '1px solid #e2e8f0',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                }}
              >
                Back to Pricing
              </Link>
            </div>
            <p style={{ marginTop: '1.5rem', fontSize: 12, color: '#94a3b8' }}>
              Need help?{' '}
              <a
                href="mailto:hello@theresilienceatlas.com"
                style={{ color: '#4f46e5' }}
              >
                Contact support
              </a>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

