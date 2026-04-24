import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { apiUrl } from '../api/baseUrl.js';

export default function CompleteProfilePage() {
  const { user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  // Pre-fill with the Auth0 name if available (filters out email-like values).
  const auth0Name = [user?.name, user?.given_name].find(
    (n) => n && n.trim().length >= 2 && n.trim().length <= 80 && !n.includes('@')
  ) || '';

  const [fullName, setFullName] = useState(auth0Name);
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  // When Auth0 provides a valid name, start in auto-saving state so we skip the form.
  const [autoSaving, setAutoSaving] = useState(!!auth0Name);
  const autoSaveAttempted = useRef(false);

  // If Auth0 already provided a valid name, auto-save it and redirect immediately.
  const userEmail = user?.email;
  useEffect(() => {
    if (!auth0Name || autoSaveAttempted.current) return;
    autoSaveAttempted.current = true;

    // Without an email we cannot identify the user on the backend — skip
    // auto-save and show the form instead (backend requires email in body).
    if (!userEmail) {
      setAutoSaving(false);
      return;
    }

    const save = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(apiUrl('/api/auth/complete-profile'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: userEmail, fullName: auth0Name.trim() }),
        });
        if (res.ok) {
          navigate('/', { replace: true });
          return;
        }
        // Save failed — show the form so the user can confirm their name.
        setError('Could not save your profile automatically. Please confirm your name and try again.');
      } catch {
        setError('Could not save your profile automatically. Please confirm your name and try again.');
      }
      setAutoSaving(false);
    };

    save();
  }, [auth0Name, userEmail, getAccessTokenSilently, navigate]);

  // Show a brief loading state while auto-saving the Auth0 name.
  if (autoSaving) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={{ color: '#64748b', textAlign: 'center', margin: 0 }}>Setting up your profile…</p>
        </div>
      </div>
    );
  }

  const validate = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return 'Full name must be at least 2 characters.';
    if (trimmed.length > 80) return 'Full name must be 80 characters or fewer.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate(fullName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl('/api/auth/complete-profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: userEmail, fullName: fullName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Complete your profile</h1>
        <p style={styles.subtext}>
          Enter your full name so we can personalize your reports and exports.
          Spaces are allowed — use your real display name.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label style={styles.label} htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            maxLength={80}
            required
            disabled={submitting}
            style={styles.input}
            autoFocus
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting || !fullName.trim()} style={styles.button}>
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    padding: '1.5rem',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '2.5rem 2rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
  },
  heading: {
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1a1a2e',
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  subtext: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#334155',
    marginBottom: '0.4rem',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '0.65rem 0.85rem',
    fontSize: '1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    transition: 'border-color 0.15s',
  },
  error: {
    color: '#dc2626',
    fontSize: '0.875rem',
    marginBottom: '0.75rem',
    marginTop: 0,
  },
  button: {
    display: 'block',
    width: '100%',
    padding: '0.75rem',
    background: '#4F46E5',
    color: '#fff',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    opacity: 1,
    transition: 'opacity 0.15s',
  },
};
