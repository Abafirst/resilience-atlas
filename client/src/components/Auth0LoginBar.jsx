import React from 'react';
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
};

export default function Auth0LoginBar() {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout } = useAuth0();

  if (isLoading) {
    return (
      <div style={styles.bar}>
        <span style={styles.loading}>Loading…</span>
      </div>
    );
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
        <button
          style={{ ...styles.button, ...styles.loginBtn }}
          onClick={() => loginWithRedirect()}
        >
          Log In with Auth0
        </button>
      )}
    </div>
  );
}
