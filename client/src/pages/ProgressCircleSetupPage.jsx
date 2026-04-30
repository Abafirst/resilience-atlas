import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import PrivacyLevelSelector from '../components/ProgressCircle/PrivacyLevelSelector.jsx';

/**
 * ProgressCircleSetupPage — 3-step wizard for creating a Progress Circle.
 *
 * Step 1: Name the circle
 * Step 2: Choose privacy level
 * Step 3: Review consent and create
 *
 * URL param: ?profileId=<childProfileId>
 */
export default function ProgressCircleSetupPage() {
  const { getAccessTokenSilently } = useAuth0();
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const childProfileId = params.get('profileId');

  const [step,         setStep]         = useState(1);
  const [circleName,   setCircleName]   = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('aggregated');
  const [consent,      setConsent]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const TOTAL_STEPS = 3;

  async function handleCreate() {
    if (!consent) {
      setError('You must agree to the consent statement before creating a circle.');
      return;
    }
    if (!childProfileId) {
      setError('No child profile selected. Please go back and select a profile.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch('/api/progress-circles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ childProfileId, name: circleName.trim(), privacyLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.circleId) {
          // Circle already exists — redirect to it.
          navigate(`/iatlas/circles/${data.circleId}`);
          return;
        }
        throw new Error(data.error || 'Failed to create Progress Circle.');
      }
      navigate(`/iatlas/circles/${data._id}/invite`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: '32px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 560, margin: '0 auto',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none',
  };
  const btnStyle = (primary) => ({
    padding: '10px 24px', border: primary ? 'none' : '1.5px solid #d1d5db',
    borderRadius: 8, background: primary ? '#4f46e5' : '#fff',
    color: primary ? '#fff' : '#374151', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: 14, fontWeight: 600, opacity: loading ? 0.6 : 1,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            style={{
              width: 28, height: 6, borderRadius: 3,
              background: i < step ? '#4f46e5' : i === step - 1 ? '#818cf8' : '#e5e7eb',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      <div style={cardStyle}>
        {/* Step 1: Name */}
        {step === 1 && (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#111827' }}>🌱 Create a Progress Circle</h2>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>
              Give your circle a name so stakeholders know who it's for.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Circle Name *
            </label>
            <input
              style={inputStyle}
              value={circleName}
              onChange={(e) => setCircleName(e.target.value)}
              placeholder={`e.g. "Emma's Care Team"`}
              maxLength={80}
              autoFocus
            />
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#9ca3af' }}>
              {circleName.length}/80 characters
            </p>
          </>
        )}

        {/* Step 2: Privacy level */}
        {step === 2 && (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#111827' }}>🔒 Choose Privacy Level</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
              Control how much detail stakeholders can see. You can change this at any time.
            </p>
            <PrivacyLevelSelector value={privacyLevel} onChange={setPrivacyLevel} />
          </>
        )}

        {/* Step 3: Review & Consent */}
        {step === 3 && (
          <>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#111827' }}>✅ Review & Create</h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b7280' }}>
              Please review your settings and provide consent before creating the circle.
            </p>

            {/* Summary */}
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Circle name:</strong> {circleName || '—'}</p>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}><strong>Privacy level:</strong> {privacyLevel}</p>
              <p style={{ margin: 0, fontSize: 14 }}><strong>Child profile:</strong> {childProfileId || '—'}</p>
            </div>

            {/* Consent */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: 2, accentColor: '#4f46e5', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                I understand that by creating a Progress Circle I am enabling selected stakeholders to view
                my child's resilience progress data according to the privacy level chosen above. I can
                revoke or modify access at any time.
              </span>
            </label>

            {error && (
              <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', color: '#b91c1c', fontSize: 13 }}>
                {error}
              </div>
            )}
          </>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28 }}>
          <button
            type="button"
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={btnStyle(false)}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <button
            type="button"
            disabled={loading || (step === 1 && !circleName.trim())}
            onClick={() => step < TOTAL_STEPS ? setStep(s => s + 1) : handleCreate()}
            style={btnStyle(true)}
          >
            {step < TOTAL_STEPS ? 'Next →' : loading ? 'Creating…' : 'Create Circle 🌱'}
          </button>
        </div>
      </div>
    </div>
  );
}
