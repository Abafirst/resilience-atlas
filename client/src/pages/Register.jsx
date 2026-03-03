import React, { useState } from 'react';
import { register } from '../api.js';

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 28, fontSize: 14 },
  label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#444' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginBottom: 16, outline: 'none' },
  btn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 },
  success: { color: '#059669', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#ecfdf5', borderRadius: 6 },
  link: { color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', fontSize: 14 },
  footer: { marginTop: 20, textAlign: 'center', color: '#666', fontSize: 14 },
};

export default function Register({ onRegistered, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(username, password);
      setSuccess('Account created! Redirecting to login…');
      setTimeout(onRegistered, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join Resilience Atlas today</p>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Username</label>
          <input style={styles.input} type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <label style={styles.label}>Confirm Password</label>
          <input style={styles.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <div style={styles.footer}>
          Already have an account?{' '}
          <span style={styles.link} onClick={onLogin}>Sign in</span>
        </div>
      </div>
    </div>
  );
}
