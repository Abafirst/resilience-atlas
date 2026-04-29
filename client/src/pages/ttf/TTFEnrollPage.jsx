/**
 * TTFEnrollPage.jsx
 * Enrollment & payment page for the Train the Facilitator program.
 * Route: /iatlas/ttf/enroll
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import { apiUrl } from '../../api/baseUrl.js';
import { apiFetch } from '../../lib/apiFetch.js';

const TIERS = [
  {
    id:       'professional',
    name:     'Professional Development',
    price:    497,
    features: [
      'Access to all 6 TTF modules',
      'Personal resilience assessment',
      'Cohort community access',
      '3 supervised practicum sessions',
      'Competency assessment',
      'Digital TTF certification',
      'Annual renewal pathway',
    ],
  },
  {
    id:       'group',
    name:     'Group Licensing',
    price:    1997,
    features: [
      'Everything in Professional',
      'Enroll up to 5 team members',
      'Organization-branded certificate',
      'Group cohort option',
      'Priority supervisor assignment',
      'Team progress dashboard',
    ],
  },
  {
    id:       'enterprise',
    name:     'Enterprise',
    price:    null,
    features: [
      'Custom team licensing',
      'Dedicated facilitator/coach',
      'White-label program option',
      'On-site intensive option',
      'Custom CEU accreditation',
      'Quarterly reporting',
    ],
  },
];

const ROLES = [
  'Clinician / Therapist', 'Speech-Language Pathologist', 'Occupational Therapist',
  'Teacher / Educator', 'Caregiver / Family Member', 'Practice Administrator',
  'Group Facilitator', 'Community Support Worker', 'Social Worker / Case Manager', 'Other',
];

const CARD_STYLE = {
  style: {
    base:    { fontSize: '15px', color: '#333', '::placeholder': { color: '#aaa' } },
    invalid: { color: '#dc2626' },
  },
};

function CheckoutForm({ tier, cohortId, formData, onSuccess, getAccessTokenSilently }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setLoading(true);
    try {
      // 1. Create enrollment
      const enrollRes = await apiFetch('/api/ttf/enroll', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...formData, tier, cohortId }),
      }, getAccessTokenSilently);

      if (!enrollRes.ok) {
        const data = await enrollRes.json();
        // If already enrolled redirect to dashboard
        if (enrollRes.status === 409 && data.enrollmentId) {
          onSuccess();
          return;
        }
        throw new Error(data.error || 'Enrollment failed.');
      }
      const { enrollment } = await enrollRes.json();

      // 2. Create PaymentIntent
      const piRes = await apiFetch('/api/ttf/payment-intent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enrollmentId: enrollment._id, tier }),
      }, getAccessTokenSilently);

      if (!piRes.ok) throw new Error('Failed to initialize payment.');
      const { clientSecret } = await piRes.json();

      // 3. Confirm card payment
      const cardEl = elements.getElement(CardElement);
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      if (paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', marginBottom: 20, background: '#fafafa' }}>
        <CardElement options={CARD_STYLE} />
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%', background: '#4f46e5', color: '#fff', border: 'none',
          borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Processing…' : `Pay $${TIERS.find(t => t.id === tier)?.price || 0}`}
      </button>
    </form>
  );
}

export default function TTFEnrollPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [selectedTier, setSelectedTier] = useState('professional');
  const [step, setStep]                 = useState(1); // 1=tier, 2=form, 3=payment
  const [stripePromise, setStripePromise] = useState(null);
  const [formData, setFormData]         = useState({
    userName: '', userEmail: '', userRole: '', organization: '', enrollmentReason: '',
  });
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    document.title = 'Enroll — Train the Facilitator | IATLAS';
    // Load Stripe key
    fetch(apiUrl('/config'))
      .then(r => r.json())
      .then(cfg => {
        if (cfg.stripePublishableKey) setStripePromise(loadStripe(cfg.stripePublishableKey));
      })
      .catch(() => {});
  }, []);

  const selectedTierData = TIERS.find(t => t.id === selectedTier);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isAuthenticated) { loginWithRedirect(); return; }
    if (!agreed) return;
    setStep(3);
  };

  const handleSuccess = () => {
    navigate('/iatlas/ttf/dashboard');
  };

  // Step 1: Tier selection
  if (step === 1) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, color: '#1f2937', marginBottom: 8 }}>
              Enroll in Train the Facilitator
            </h1>
            <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 40 }}>
              Choose your enrollment tier to begin your TTF certification journey.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
              {TIERS.map(tier => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    background:   selectedTier === tier.id ? '#4f46e5' : '#fff',
                    color:        selectedTier === tier.id ? '#fff' : '#1f2937',
                    border:       `2px solid ${selectedTier === tier.id ? '#4f46e5' : '#e5e7eb'}`,
                    borderRadius: 14, padding: 28, cursor: 'pointer',
                    transition:   'all 0.2s',
                  }}
                >
                  <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>{tier.name}</h2>
                  <p style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 800 }}>
                    {tier.price ? `$${tier.price}` : 'Contact Us'}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 14 }}>
                        <span>{selectedTier === tier.id ? '✓' : '→'}</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  background: '#4f46e5', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '14px 36px', fontSize: 16,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                Continue with {selectedTierData?.name} →
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Step 2: Enrollment form
  if (step === 2) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <button
              onClick={() => setStep(1)}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}
            >
              ← Back
            </button>
            <div style={{ background: '#fff', borderRadius: 14, padding: 36, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
                Your Enrollment Details
              </h2>
              <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: 14 }}>
                {selectedTierData?.name} — {selectedTierData?.price ? `$${selectedTierData.price}` : 'Contact Us'}
              </p>
              <form onSubmit={handleFormSubmit}>
                {[
                  { label: 'Full Name *', key: 'userName', type: 'text', required: true },
                  { label: 'Email Address *', key: 'userEmail', type: 'email', required: true },
                  { label: 'Organization (optional)', key: 'organization', type: 'text', required: false },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      required={field.required}
                      value={formData[field.key]}
                      onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                      style={{
                        width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                        borderRadius: 8, fontSize: 15, boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                    Professional Role *
                  </label>
                  <select
                    required
                    value={formData.userRole}
                    onChange={e => setFormData(p => ({ ...p, userRole: e.target.value }))}
                    style={{
                      width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                      borderRadius: 8, fontSize: 15, background: '#fff', boxSizing: 'border-box',
                    }}
                  >
                    <option value="">Select your role…</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#374151' }}>
                    Why are you enrolling in TTF?
                  </label>
                  <textarea
                    rows={4}
                    value={formData.enrollmentReason}
                    onChange={e => setFormData(p => ({ ...p, enrollmentReason: e.target.value }))}
                    placeholder="Share your goals and what draws you to this program…"
                    style={{
                      width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
                      borderRadius: 8, fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 28, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: 2, accentColor: '#4f46e5' }}
                  />
                  <span style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                    I agree to the TTF program terms, including the commitment to complete all modules, practicum sessions, and portfolio requirements.
                  </span>
                </label>

                {!isAuthenticated && (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
                    You must be logged in to enroll. Clicking "Continue to Payment" will take you to the login screen.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!agreed}
                  style={{
                    width: '100%', background: agreed ? '#4f46e5' : '#d1d5db',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '14px', fontSize: 15, fontWeight: 700,
                    cursor: agreed ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue to Payment →
                </button>
              </form>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Step 3: Payment
  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <button
            onClick={() => setStep(2)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}
          >
            ← Back
          </button>
          <div style={{ background: '#fff', borderRadius: 14, padding: 36, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#1f2937' }}>
              Complete Enrollment
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: 15 }}>TTF — {selectedTierData?.name}</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#1f2937' }}>${selectedTierData?.price}</span>
            </div>
            {stripePromise ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  tier={selectedTier}
                  formData={formData}
                  onSuccess={handleSuccess}
                  getAccessTokenSilently={getAccessTokenSilently}
                />
              </Elements>
            ) : (
              <p style={{ color: '#6b7280', fontSize: 14 }}>Loading payment processor…</p>
            )}
            <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              🔒 Payments processed securely by Stripe. We never store card details.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
