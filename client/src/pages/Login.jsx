import React, { useState } from 'react';
import { login } from '../api.js';

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 28, fontSize: 14 },
  label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#444' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginBottom: 16, outline: 'none' },
  btn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 },
  link: { color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 },
  footer: { marginTop: 20, textAlign: 'center', color: '#666', fontSize: 14 },
};

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Resilience Atlas</h1>
        <p style={styles.subtitle}>Sign in to access your assessment</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div style={styles.footer}>
          Don&apos;t have an account?{' '}
          <span style={styles.link} onClick={onRegister}>Create one</span>
        </div>
      </div>
    </div>
  );
}