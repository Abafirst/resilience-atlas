/**
 * IATLASWaitlistPage.jsx
 * Standalone waitlist page for coming-soon IATLAS subscription tiers.
 * Route: /iatlas/waitlist
 */

import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { submitWaitlistEntry } from '../api/iatlas.js';

const WAITLIST_TIERS = [
  { value: 'complete',      label: 'Complete ($99.99/mo)' },
  { value: 'practitioner',  label: 'Practitioner ($149/mo)' },
  { value: 'practice',      label: 'Practice ($399/mo)' },
];

export default function IATLASWaitlistPage() {
  const [searchParams] = useSearchParams();
  const defaultTier = searchParams.get('tier') || 'complete';

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    organization: '',
    tier: WAITLIST_TIERS.some(t => t.value === defaultTier) ? defaultTier : 'complete',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | duplicate | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.email.trim() || !formData.name.trim()) return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      const result = await submitWaitlistEntry({
        tier: formData.tier,
        email: formData.email.trim(),
        name: formData.name.trim(),
        organization: formData.organization.trim(),
      });

      if (result.alreadyJoined) {
        setStatus('duplicate');
      } else {
        setStatus('success');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to join waitlist. Please try again.');
    }
  }

  const fieldStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: '1.25rem',
  };

  const labelStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
  };

  const inputStyle = {
    padding: '10px 14px',
    borderRadius: 8,
    border: '1.5px solid #d1d5db',
    fontSize: 15,
    color: '#1e293b',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SiteHeader activePage="pricing" />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a2e5a 0%, #4f46e5 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '3.5rem 1.5rem 3rem',
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', marginBottom: 12 }}>
          Coming Soon
        </p>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 800, margin: '0 0 .75rem', lineHeight: 1.2 }}>
          Join the IATLAS Waitlist
        </h1>
        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', maxWidth: 500, margin: '0 auto', lineHeight: 1.65 }}>
          Be the first to know when your chosen tier launches. We'll send you a launch notification and early-adopter offer.
        </p>
      </section>

      {/* Form card */}
      <section style={{ maxWidth: 520, margin: '2.5rem auto', padding: '0 1.5rem 4rem' }}>
        {status === 'success' ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
              You're on the list!
            </h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65, marginBottom: 24 }}>
              We'll notify you as soon as the{' '}
              <strong>{WAITLIST_TIERS.find(t => t.value === formData.tier)?.label}</strong>{' '}
              tier launches. Thanks for your patience!
            </p>
            <Link
              to="/iatlas/pricing"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: '#4f46e5',
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: 15,
              }}
            >
              ← Back to Pricing
            </Link>
          </div>
        ) : status === 'duplicate' ? (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '2.5rem 2rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>
              Already registered!
            </h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65, marginBottom: 24 }}>
              You're already on the waitlist for this tier. We'll be in touch when it launches!
            </p>
            <Link
              to="/iatlas/pricing"
              style={{
                display: 'inline-block',
                padding: '12px 28px',
                background: '#4f46e5',
                color: '#fff',
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: 15,
              }}
            >
              ← Back to Pricing
            </Link>
          </div>
        ) : (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '2rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            border: '1px solid #e5e7eb',
          }}>
            <form onSubmit={handleSubmit} noValidate>
              <div style={fieldStyle}>
                <label htmlFor="wl-name" style={labelStyle}>Name *</label>
                <input
                  id="wl-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  autoComplete="name"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="wl-email" style={labelStyle}>Email *</label>
                <input
                  id="wl-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="wl-org" style={labelStyle}>Organization (optional)</label>
                <input
                  id="wl-org"
                  type="text"
                  value={formData.organization}
                  onChange={e => setFormData(p => ({ ...p, organization: e.target.value }))}
                  placeholder="Your practice, school, or company"
                  autoComplete="organization"
                  style={inputStyle}
                />
              </div>

              <div style={fieldStyle}>
                <label htmlFor="wl-tier" style={labelStyle}>Tier you're interested in *</label>
                <select
                  id="wl-tier"
                  value={formData.tier}
                  onChange={e => setFormData(p => ({ ...p, tier: e.target.value }))}
                  style={{ ...inputStyle, background: '#fff', cursor: 'pointer' }}
                >
                  {WAITLIST_TIERS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {status === 'error' && (
                <p role="alert" style={{ fontSize: 14, color: '#dc2626', marginBottom: '1rem' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: 10,
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                  background: '#f59e0b',
                  color: '#fff',
                  opacity: status === 'submitting' ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {status === 'submitting' ? 'Joining…' : 'Join Waitlist'}
              </button>
            </form>

            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: '1.25rem' }}>
              Already have a plan?{' '}
              <Link to="/iatlas/pricing" style={{ color: '#4f46e5', fontWeight: 600 }}>
                View pricing →
              </Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
