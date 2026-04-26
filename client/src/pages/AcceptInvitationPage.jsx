/**
 * AcceptInvitationPage.jsx
 * Allows a practitioner to accept a practice invitation via a token link.
 * Route: /invite/accept?token=XXX
 */

import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import { apiUrl } from '../api/baseUrl.js';

export default function AcceptInvitationPage() {
  const { isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  const [invitation, setInvitation]     = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError]   = useState(null);
  const [accepting, setAccepting]       = useState(false);
  const [accepted, setAccepted]         = useState(false);
  const [acceptError, setAcceptError]   = useState(null);

  const token = (() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('token') || '';
    }
    return '';
  })();

  useEffect(() => {
    if (!token) {
      setInviteError('No invitation token provided.');
      setLoadingInvite(false);
      return;
    }

    const fetchInvitation = async () => {
      setLoadingInvite(true);
      try {
        const res = await fetch(apiUrl(`/api/practitioners/invitations/${encodeURIComponent(token)}`));
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Invitation not found or has expired.');
        }
        const data = await res.json();
        setInvitation(data.invitation || data);
      } catch (err) {
        setInviteError(err.message);
      } finally {
        setLoadingInvite(false);
      }
    };

    fetchInvitation();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setAcceptError(null);
    try {
      const authToken = await getAccessTokenSilently();
      const res = await fetch(apiUrl(`/api/practitioners/invitations/${encodeURIComponent(token)}/accept`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to accept invitation.');
      }
      setAccepted(true);
    } catch (err) {
      setAcceptError(err.message);
    } finally {
      setAccepting(false);
    }
  }

  function formatExpiry(date) {
    if (!date) return null;
    try { return new Date(date).toLocaleDateString(undefined, { dateStyle: 'long' }); }
    catch { return date; }
  }

  const roleLabels = { admin: 'Admin', clinician: 'Clinician', therapist: 'Therapist', observer: 'Observer' };

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 500, width: '100%', background: '#fff', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>

          {/* Loading invitation */}
          {loadingInvite && (
            <div style={{ color: '#9ca3af', fontSize: 16 }}>Loading invitation…</div>
          )}

          {/* Invalid token */}
          {!loadingInvite && inviteError && (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>Invalid Invitation</h1>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6 }}>{inviteError}</p>
            </>
          )}

          {/* Accepted success state */}
          {accepted && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>You're in!</h1>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                You've successfully joined <strong>{invitation?.practiceName || 'the practice'}</strong> as a{' '}
                <strong>{roleLabels[invitation?.role] || invitation?.role}</strong>.
              </p>
              <a
                href="/practice-settings"
                style={{ display: 'inline-block', background: '#6366f1', color: '#fff', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
              >
                Go to Practice Settings
              </a>
            </>
          )}

          {/* Valid invitation, ready to accept */}
          {!loadingInvite && !inviteError && !accepted && invitation && (
            <>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>You've been invited!</h1>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
                You have been invited to join{' '}
                <strong>{invitation.practiceName || 'a practice'}</strong> as a{' '}
                <strong>{roleLabels[invitation.role] || invitation.role}</strong>.
              </p>

              {invitation.expiresAt && (
                <p style={{ color: '#d97706', fontSize: 13, marginBottom: 20 }}>
                  This invitation expires on {formatExpiry(invitation.expiresAt)}.
                </p>
              )}

              {acceptError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
                  {acceptError}
                </div>
              )}

              {isLoading && (
                <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>Checking authentication…</div>
              )}

              {!isLoading && isAuthenticated && (
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  style={{ background: accepting ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: accepting ? 'not-allowed' : 'pointer' }}
                >
                  {accepting ? 'Accepting…' : 'Accept Invitation'}
                </button>
              )}

              {!isLoading && !isAuthenticated && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
                    You need to be logged in to accept this invitation.
                  </p>
                  <button
                    onClick={() => loginWithRedirect({ appState: { returnTo: window.location.href } })}
                    style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Log In to Accept
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
