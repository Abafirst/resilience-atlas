import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 28, fontSize: 14 },
  btn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  link: { color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 },
  footer: { marginTop: 20, textAlign: 'center', color: '#666', fontSize: 14 },
};

export default function Login() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Resilience Atlas</h1>
        <p style={styles.subtitle}>Sign in to access your assessment</p>
        <button style={styles.btn} onClick={() => loginWithRedirect()}>
          Sign In
        </button>
        <div style={styles.footer}>
          Don&apos;t have an account?{' '}
          <span
            style={styles.link}
            onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}
          >
            Create one
          </span>
        </div>
      </div>
    </div>
  );
}