/**
 * AccessDeniedPage.jsx
 * Shown when a user tries to access a resource they lack permission for.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

export default function AccessDeniedPage({ message, requiredRole }) {
  const navigate = useNavigate();

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 480, textAlign: 'center', background: '#fff', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>Access Denied</h1>
          <p style={{ color: '#6b7280', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
            {message || "You don't have permission to access this page."}
          </p>
          {requiredRole && (
            <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
              Required role: <strong>{requiredRole}</strong>
            </p>
          )}
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
            If you believe this is an error, please contact your practice administrator.
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            Go Back
          </button>
        </div>
      </main>
    </>
  );
}
