/**
 * InvitePractitionerModal.jsx  (Practice/ version)
 * Full-featured invite modal with role selection, seat availability check,
 * and copyable invite link display after a successful send.
 *
 * Props:
 *   isOpen       {bool}
 *   onClose      {fn}
 *   onInvite     {fn}    async (email, role) => { inviteUrl? } — called on submit
 *   loading      {bool}
 *   error        {string|null}
 *   success      {string|null}
 *   inviteUrl    {string|null}  If set, display a copyable invite link
 *   seatsUsed    {number}
 *   seatLimit    {number}
 */

import React, { useState, useEffect } from 'react';

const ROLES = [
  { value: 'clinician', label: 'Clinician' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'admin',     label: 'Admin' },
  { value: 'observer',  label: 'Observer' },
];

export default function InvitePractitionerModal({
  isOpen,
  onClose,
  onInvite,
  loading,
  error,
  success,
  inviteUrl,
  seatsUsed,
  seatLimit,
}) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('clinician');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setRole('clinician');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const seatsAvailable = seatLimit != null && seatsUsed != null ? seatLimit - seatsUsed : null;
  const seatsFull = seatsAvailable !== null && seatsAvailable <= 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (email.trim() && role && !seatsFull) {
      onInvite(email.trim(), role);
    }
  }

  function handleCopyLink() {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />

      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <h2 id="invite-modal-title" style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
          Invite Practitioner
        </h2>
        {seatsAvailable !== null && (
          <p style={{ fontSize: 13, color: seatsFull ? '#dc2626' : '#6b7280', marginBottom: 20 }}>
            {seatsFull
              ? 'No seats available. Upgrade your plan to invite more practitioners.'
              : `${seatsAvailable} seat${seatsAvailable !== 1 ? 's' : ''} remaining`}
          </p>
        )}

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
              disabled={seatsFull}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box', opacity: seatsFull ? 0.5 : 1 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Role
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={seatsFull}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, background: '#fff', outline: 'none', boxSizing: 'border-box', opacity: seatsFull ? 0.5 : 1 }}
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

          {success && !inviteUrl && (
            <div style={{ background: '#d1fae5', color: '#059669', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {success}
            </div>
          )}

          {inviteUrl && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', marginBottom: 6 }}>
                ✅ Invitation sent — share this link:
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <code style={{ flex: 1, fontSize: 11, color: '#374151', background: '#fff', padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  {inviteUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{ background: copied ? '#d1fae5' : '#e0f2fe', color: copied ? '#059669' : '#0369a1', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {inviteUrl ? 'Done' : 'Cancel'}
            </button>
            {!inviteUrl && (
              <button
                type="submit"
                disabled={loading || !email.trim() || seatsFull}
                style={{ background: (loading || seatsFull) ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: (loading || seatsFull) ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Sending…' : 'Send Invitation'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
