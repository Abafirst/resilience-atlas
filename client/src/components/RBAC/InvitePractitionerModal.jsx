/**
 * InvitePractitionerModal.jsx
 * Modal dialog for inviting a new practitioner to the practice.
 *
 * Props:
 *   isOpen   {bool}
 *   onClose  {fn}
 *   onInvite {fn}   Called with (email, role)
 *   loading  {bool}
 *   error    {string|null}
 *   success  {string|null}
 */

import React, { useState, useEffect } from 'react';

const ROLES = [
  { value: 'clinician', label: 'Clinician' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'observer',  label: 'Observer'  },
  { value: 'admin',     label: 'Admin'     },
];

export default function InvitePractitionerModal({ isOpen, onClose, onInvite, loading, error, success }) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('clinician');

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setRole('clinician');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (email.trim() && role) {
      onInvite(email.trim(), role);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
      />

      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <h2 id="invite-modal-title" style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>
          Invite Practitioner
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="practitioner@example.com"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Role
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#d1fae5', color: '#059669', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{ background: loading ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
