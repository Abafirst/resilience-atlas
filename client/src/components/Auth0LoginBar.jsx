import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    padding: '10px 24px',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: 14,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    border: '2px solid #4a90d9',
  },
  name: {
    fontWeight: 600,
    color: '#e8f0fe',
  },
  email: {
    color: '#a0aec0',
    fontSize: 12,
  },
  button: {
    padding: '7px 18px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    transition: 'background 0.2s',
  },
  loginBtn: {
    background: '#4a90d9',
    color: '#fff',
  },
  logoutBtn: {
    background: 'transparent',
    color: '#a0aec0',
    border: '1px solid #4a4a6a',
  },
  loading: {
    color: '#a0aec0',
    fontSize: 13,
    padding: '7px 0',
  },
  emailForm: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  emailInput: {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #4a4a6a',
    background: '#0d0d1f',
    color: '#e8f0fe',
    fontSize: 14,
    outline: 'none',
    minWidth: 220,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginRight: 4,
  },
};

export default function Auth0LoginBar() {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

  const [email, setEmail]           = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError]           = useState(null);

  if (isLoading) {
    return (
      <div style={styles.bar}>
        <span style={styles.loading}>Loading…</span>
      </div>
    );
  }

  /**
   * Handle the "Continue" button click.
   *
   * 1. Validates the email format locally.
   * 2. Calls GET /api/sso/lookup?email= to check whether the domain has a
   *    configured SSO/SAML connection.
   * 3a. SSO domain  → loginWithRedirect with connection + login_hint.
   * 3b. Plain domain → loginWithRedirect with login_hint only (password flow).
   */
  async function handleContinue(e) {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/sso/lookup?email=${encodeURIComponent(trimmed)}`);

      if (!res.ok) {
        // Non-2xx response — fall back to standard login to avoid blocking the user.
        loginWithRedirect({ login_hint: trimmed, appState: { returnTo: '/' } });
        return;
      }

      const data = await res.json();

      if (data.sso && data.connection) {
        // Enterprise SSO — skip the Auth0 Universal Login password screen.
        loginWithRedirect({
          connection: data.connection,
          login_hint: trimmed,
          appState: { returnTo: '/' },
        });
      } else {
        // Standard login — pre-fill the email so the user only has to type once.
        loginWithRedirect({
          login_hint: trimmed,
          appState: { returnTo: '/' },
        });
      }
    } catch (_err) {
      // Network failure — fall back to a plain login to keep the path unblocked.
      loginWithRedirect({ login_hint: trimmed, appState: { returnTo: '/' } });
    } finally {
      setIsLookingUp(false);
    }
  }

  return (
    <div style={styles.bar}>
      {isAuthenticated && user ? (
        <>
          <div style={styles.userInfo}>
            {user.picture && (
              <img src={user.picture} alt={user.name || 'User avatar'} style={styles.avatar} />
            )}
            <div>
              <div style={styles.name}>{user.name}</div>
              <div style={styles.email}>{user.email}</div>
            </div>
          </div>
          <button
            style={{ ...styles.button, ...styles.logoutBtn }}
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Log Out
          </button>
        </>
      ) : (
        <form style={styles.emailForm} onSubmit={handleContinue} noValidate>
          {error && <span style={styles.errorText}>{error}</span>}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            style={styles.emailInput}
            aria-label="Email address"
            autoComplete="email"
            disabled={isLookingUp}
          />
          <button
            type="submit"
            style={{ ...styles.button, ...styles.loginBtn, opacity: isLookingUp ? 0.7 : 1 }}
            disabled={isLookingUp}
          >
            {isLookingUp ? 'Checking…' : 'Continue'}
          </button>
        </form>
      )}
    </div>
  );
}
