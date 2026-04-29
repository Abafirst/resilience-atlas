/**
 * TTFVerifyPage.jsx
 * Public credential verification page.
 * Route: /iatlas/ttf/verify/:credentialId
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteHeader from '../../components/SiteHeader.jsx';
import { apiUrl } from '../../api/baseUrl.js';

export default function TTFVerifyPage() {
  const { credentialId: urlCredId } = useParams();
  const [credentialId, setCredentialId] = useState(urlCredId || '');
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(!!urlCredId);
  const [error,    setError]    = useState('');

  useEffect(() => {
    document.title = 'Verify TTF Credential | IATLAS';
    if (urlCredId) verify(urlCredId);
  }, [urlCredId]);

  async function verify(id) {
    if (!id) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(apiUrl(`/api/ttf/verify/${encodeURIComponent(id)}`));
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || 'Credential not found or invalid.');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    verify(credentialId.trim());
  };

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '60px 24px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#ede9fe', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 32, margin: '0 auto 16px',
            }}>
              🔍
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800, color: '#1f2937' }}>
              Verify TTF Credential
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 15 }}>
              Enter a TTF Credential ID to verify a facilitator's certification status.
            </p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <input
              type="text"
              value={credentialId}
              onChange={e => setCredentialId(e.target.value)}
              placeholder="e.g. TTF-2026-A3F2B1C4D5"
              style={{
                flex: 1, padding: '12px 16px', border: '2px solid #e5e7eb',
                borderRadius: 10, fontSize: 15, fontFamily: 'monospace',
              }}
            />
            <button
              type="submit"
              disabled={loading || !credentialId.trim()}
              style={{
                background: '#7c3aed', color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 22px',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1, whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Checking…' : 'Verify'}
            </button>
          </form>

          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #fca5a5',
              borderRadius: 10, padding: 20, textAlign: 'center',
              color: '#991b1b', fontSize: 14,
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 20 }}>❌</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {result && (
            <div style={{
              background:   result.active ? '#fff' : '#fafafa',
              border:       `2px solid ${result.active ? '#7c3aed' : '#d1d5db'}`,
              borderRadius: 14,
              padding:      32,
              textAlign:    'center',
            }}>
              {/* Status badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 18px', borderRadius: 20, marginBottom: 24,
                background: result.active ? '#d1fae5' : '#fee2e2',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: result.active ? '#059669' : '#dc2626' }} />
                <span style={{ fontWeight: 700, color: result.active ? '#065f46' : '#991b1b', fontSize: 14 }}>
                  {result.active ? 'Active Certification' : 'Expired Certification'}
                </span>
              </div>

              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Certified Facilitator
              </p>
              <h2 style={{ margin: '0 0 24px', fontSize: 28, fontWeight: 900, color: '#1f2937' }}>
                {result.holder}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Credential ID</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#7c3aed', fontSize: 13, fontFamily: 'monospace' }}>{result.credentialId}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Issued</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#1f2937', fontSize: 13 }}>
                    {new Date(result.issuedDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Expires</p>
                  <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#1f2937', fontSize: 13 }}>
                    {new Date(result.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                This credential was issued by the IATLAS Train the Facilitator program
                and verifies that the holder has demonstrated competency in trauma-informed,
                culturally responsive resilience facilitation.
              </p>
            </div>
          )}

          <p style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>
            Are you a certified facilitator?{' '}
            <Link to="/iatlas/ttf/certificate" style={{ color: '#7c3aed', fontWeight: 600 }}>
              View your certificate
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
