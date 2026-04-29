/**
 * TTFCertificatePage.jsx
 * Digital credential display for TTF certified facilitators.
 * Route: /iatlas/ttf/certificate
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../../components/SiteHeader.jsx';
import { apiFetch } from '../../lib/apiFetch.js';
import { apiUrl } from '../../api/baseUrl.js';

export default function TTFCertificatePage() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const [cert,    setCert]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    document.title = 'TTF Certificate | IATLAS';
    if (!isAuthenticated) { loginWithRedirect(); return; }
    loadCertificate();
  }, [isAuthenticated]);

  async function loadCertificate() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ttf/certificate', {}, getAccessTokenSilently);
      if (!res.ok) throw new Error('No active certificate found. Complete the program to earn your TTF Certification.');
      const data = await res.json();
      setCert(data.certificate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const shareOnLinkedIn = () => {
    if (!cert) return;
    const url = encodeURIComponent(`${window.location.origin}/iatlas/ttf/verify/${cert.credentialId}`);
    const text = encodeURIComponent('I just earned my Train the Facilitator (TTF) Certification from IATLAS — Integrated Approach to Therapeutic Learning and Adaptive Systems! 🎓');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`, '_blank');
  };

  if (loading) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading certificate…
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SiteHeader activePage="iatlas" />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
          <p style={{ color: '#6b7280', textAlign: 'center', maxWidth: 480 }}>{error}</p>
          <Link to="/iatlas/ttf/dashboard" style={{ color: '#4f46e5' }}>← Back to Dashboard</Link>
        </main>
      </>
    );
  }

  const isActive = cert?.certificationExpiryDate && new Date(cert.certificationExpiryDate) > new Date();

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '0 0 60px' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', padding: '32px 24px', color: '#fff', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800 }}>🏆 TTF Certification</h1>
          <p style={{ margin: 0, opacity: 0.85 }}>Train the Facilitator — Digital Credential</p>
        </div>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>

          {/* Certificate card */}
          <div
            id="ttf-certificate"
            style={{
              background:   'linear-gradient(145deg, #fff 0%, #faf5ff 100%)',
              border:       '3px solid #7c3aed',
              borderRadius: 20,
              padding:      48,
              textAlign:    'center',
              boxShadow:    '0 8px 40px rgba(124,58,237,0.15)',
              marginBottom: 32,
              position:     'relative',
              overflow:     'hidden',
            }}
          >
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(124,58,237,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(79,70,229,0.06)' }} />

            {/* Badge */}
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 40,
            }}>
              🎓
            </div>

            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 2 }}>
              IATLAS Train the Facilitator Program
            </p>
            <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              This certifies that
            </h2>
            <h1 style={{ margin: '0 0 20px', fontSize: 32, fontWeight: 900, color: '#1f2937' }}>
              {cert?.userName || 'Certified Facilitator'}
            </h1>

            <p style={{ margin: '0 0 8px', fontSize: 15, color: '#374151', lineHeight: 1.6 }}>
              has successfully completed all requirements for the
            </p>
            <p style={{ margin: '0 0 28px', fontSize: 19, fontWeight: 800, color: '#4f46e5' }}>
              Train the Facilitator (TTF) Certification
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Issue Date</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1f2937', fontSize: 14 }}>
                  {cert?.certificationIssuedDate ? new Date(cert.certificationIssuedDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expiry Date</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1f2937', fontSize: 14 }}>
                  {cert?.certificationExpiryDate ? new Date(cert.certificationExpiryDate).toLocaleDateString() : '—'}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Credential ID</p>
                <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#7c3aed', fontSize: 14, fontFamily: 'monospace' }}>
                  {cert?.credentialId || '—'}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 20, background: isActive ? '#d1fae5' : '#fee2e2' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#059669' : '#dc2626' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#065f46' : '#991b1b' }}>
                {isActive ? 'Active' : 'Expired'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
            <button
              onClick={() => window.print()}
              style={{
                background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: 8, padding: '12px 22px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              🖨️ Download / Print PDF
            </button>
            <button
              onClick={shareOnLinkedIn}
              style={{
                background: '#0077b5', color: '#fff', border: 'none',
                borderRadius: 8, padding: '12px 22px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              📤 Share on LinkedIn
            </button>
            <Link
              to={`/iatlas/ttf/verify/${cert?.credentialId}`}
              style={{
                display: 'inline-block', background: 'none', border: '1px solid #e5e7eb',
                textDecoration: 'none', borderRadius: 8, padding: '12px 22px',
                fontSize: 14, fontWeight: 600, color: '#374151',
              }}
            >
              🔍 Public Verification Page
            </Link>
          </div>

          {/* Renewal section */}
          {cert?.certificationExpiryDate && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: '#1f2937' }}>
                Credential Renewal
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280' }}>
                Your certification expires on <strong>{new Date(cert.certificationExpiryDate).toLocaleDateString()}</strong>.
                Annual renewal requires:
              </p>
              <ul style={{ margin: '0 0 16px', paddingLeft: 20 }}>
                <li style={{ marginBottom: 6, fontSize: 14, color: '#374151' }}>10 CEU hours of relevant training</li>
                <li style={{ marginBottom: 6, fontSize: 14, color: '#374151' }}>Updated dimensional self-assessment</li>
                <li style={{ marginBottom: 6, fontSize: 14, color: '#374151' }}>Documented community of practice participation</li>
              </ul>
              <Link to="/iatlas/train-the-facilitator" style={{ color: '#4f46e5', fontSize: 14, fontWeight: 600 }}>
                Learn about renewal →
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
