/**
 * PracticeSetupPage.jsx
 * Three-step wizard for creating a new group practice.
 *
 * Step 1 — Practice name
 * Step 2 — Plan selection (Practice-5, Practice-10, Practice-25, Custom)
 * Step 3 — Stripe checkout (redirects to Stripe) → success lands on /iatlas/practice/dashboard
 *
 * Route: /iatlas/practice/setup
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import apiFetch from '../lib/apiFetch.js';

const PLANS = [
  {
    id: 'practice-5',
    label: 'Practice-5',
    seats: 5,
    price: '$399/mo',
    overage: '+$80/seat/mo',
    recommended: false,
    color: '#4f46e5',
  },
  {
    id: 'practice-10',
    label: 'Practice-10',
    seats: 10,
    price: '$699/mo',
    overage: '+$70/seat/mo',
    recommended: true,
    color: '#059669',
  },
  {
    id: 'practice-25',
    label: 'Practice-25',
    seats: 25,
    price: '$1,499/mo',
    overage: '+$60/seat/mo',
    recommended: false,
    color: '#d97706',
  },
  {
    id: 'custom',
    label: 'Custom',
    seats: 'Unlimited',
    price: 'Contact us',
    overage: 'N/A',
    recommended: false,
    color: '#374151',
  },
];

const SEAT_LIMITS = { 'practice-5': 5, 'practice-10': 10, 'practice-25': 25, custom: 0 };

export default function PracticeSetupPage() {
  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [step, setStep]           = useState(1);
  const [practiceName, setPracticeName] = useState('');
  const [plan, setPlan]           = useState('practice-5');
  const [creating, setCreating]   = useState(false);
  const [error, setError]         = useState(null);

  async function handleCreatePractice() {
    if (!practiceName.trim()) return;
    if (plan === 'custom') {
      // Redirect to contact / enterprise flow
      const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'hello@theresilienceatlas.com';
      window.location.href = `mailto:${contactEmail}?subject=IATLAS%20Practice%20Custom%20Plan`;
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await apiFetch('/api/practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: practiceName.trim(),
          plan,
          seatLimit: SEAT_LIMITS[plan] || 5,
        }),
      }, getAccessTokenSilently);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create practice.');
      }

      const data = await res.json();
      const practice = data.practice;
      const practiceId = practice?._id || practice?.id || '';

      // Redirect to Stripe checkout for Practice tier
      const checkoutRes = await apiFetch('/api/iatlas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'practice', practiceId, plan }),
      }, getAccessTokenSilently);

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start checkout.');
      }

      const { url } = await checkoutRes.json();
      if (url) {
        window.location.href = url;
      } else {
        // No Stripe configured — go directly to dashboard
        navigate('/iatlas/practice/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  }

  const stepLabels = ['Practice Name', 'Select Plan', 'Subscribe'];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SiteHeader />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '2.5rem', alignItems: 'center', justifyContent: 'center' }}>
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const active  = step === num;
            const done    = step > num;
            return (
              <React.Fragment key={num}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 80 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 15,
                    background: done ? '#059669' : active ? '#4f46e5' : '#e5e7eb',
                    color: done || active ? '#fff' : '#9ca3af',
                    transition: 'background 0.3s',
                  }}>
                    {done ? '✓' : num}
                  </div>
                  <span style={{ fontSize: 11, color: active ? '#4f46e5' : '#9ca3af', fontWeight: active ? 700 : 400 }}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > num ? '#059669' : '#e5e7eb', marginBottom: 18, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2.5rem' }}>

          {/* ── Step 1: Practice Name ── */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
                Name Your Practice
              </h1>
              <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 28 }}>
                This is the name your team members will see when they receive an invitation.
              </p>

              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Practice Name
              </label>
              <input
                type="text"
                value={practiceName}
                onChange={e => setPracticeName(e.target.value)}
                placeholder="e.g. Green Valley Therapy Center"
                maxLength={128}
                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #d1d5db', fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 28 }}
                onKeyDown={e => e.key === 'Enter' && practiceName.trim() && setStep(2)}
              />

              <button
                disabled={!practiceName.trim()}
                onClick={() => setStep(2)}
                style={{ width: '100%', padding: '14px', background: practiceName.trim() ? '#4f46e5' : '#e5e7eb', color: practiceName.trim() ? '#fff' : '#9ca3af', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: practiceName.trim() ? 'pointer' : 'not-allowed' }}
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2: Plan Selection ── */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
                Choose Your Plan
              </h1>
              <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>
                Select the number of practitioner seats for <strong>{practiceName}</strong>.
                You can upgrade at any time.
              </p>

              <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
                {PLANS.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    style={{
                      border: `2px solid ${plan === p.id ? p.color : '#e5e7eb'}`,
                      borderRadius: 12,
                      padding: '1.25rem 1.5rem',
                      cursor: 'pointer',
                      background: plan === p.id ? `${p.color}08` : '#fff',
                      position: 'relative',
                      transition: 'border 0.2s, background 0.2s',
                    }}
                  >
                    {p.recommended && (
                      <span style={{ position: 'absolute', top: -11, right: 16, background: '#059669', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '2px 10px' }}>
                        RECOMMENDED
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e' }}>{p.label}</div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                          {typeof p.seats === 'number' ? `${p.seats} practitioner seats` : p.seats}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: p.color }}>{p.price}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{p.overage !== 'N/A' ? `Overage: ${p.overage}` : 'Custom pricing'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  style={{ flex: 2, padding: '14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  Continue →
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Confirm & Subscribe ── */}
          {step === 3 && (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
                Confirm & Subscribe
              </h1>
              <p style={{ color: '#6b7280', fontSize: 15, marginBottom: 24 }}>
                Review your selection and proceed to secure checkout.
              </p>

              <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Practice Name</span>
                  <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>{practiceName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Plan</span>
                  <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>{PLANS.find(p => p.id === plan)?.label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: 14 }}>Price</span>
                  <span style={{ fontWeight: 700, color: '#4f46e5', fontSize: 16 }}>{PLANS.find(p => p.id === plan)?.price}</span>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(2)}
                  disabled={creating}
                  style={{ flex: 1, padding: '14px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreatePractice}
                  disabled={creating}
                  style={{ flex: 2, padding: '14px', background: creating ? '#a5b4fc' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer' }}
                >
                  {creating ? 'Setting up…' : plan === 'custom' ? 'Contact Sales' : 'Proceed to Checkout →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
