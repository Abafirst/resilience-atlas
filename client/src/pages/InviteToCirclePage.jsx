import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import RoleSelector from '../components/ProgressCircle/RoleSelector.jsx';
import PermissionCustomizer from '../components/ProgressCircle/PermissionCustomizer.jsx';
import { DEFAULT_PERMISSIONS_BY_ROLE } from '../constants/progressCircles.js';

/**
 * InviteToCirclePage — invite a new stakeholder to a Progress Circle.
 *
 * Features:
 * - Email input with validation
 * - Categorised role selector
 * - Permission customiser (pre-filled with role defaults)
 * - Optional specialty context fields
 */
export default function InviteToCirclePage() {
  const { id }            = useParams();   // circle ID
  const navigate          = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [email,            setEmail]            = useState('');
  const [role,             setRole]             = useState('');
  const [permissions,      setPermissions]      = useState({});
  const [sessionFrequency, setSessionFrequency] = useState('');
  const [primaryFocus,     setPrimaryFocus]     = useState('');
  const [loading,          setLoading]          = useState(false);
  const [error,            setError]            = useState('');
  const [success,          setSuccess]          = useState(false);

  // When the role changes, seed permissions with role defaults.
  function handleRoleChange(newRole) {
    setRole(newRole);
    setPermissions(DEFAULT_PERMISSIONS_BY_ROLE[newRole] || {});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!role)          { setError('Please select a role.');      return; }

    setLoading(true);
    setError('');
    try {
      const token = await getAccessTokenSilently();
      const body = {
        email:       email.trim().toLowerCase(),
        role,
        permissions,
        specialtyContext: {
          sessionFrequency: sessionFrequency.trim() || undefined,
          primaryFocus:     primaryFocus.split(',').map(s => s.trim()).filter(Boolean),
        },
      };
      const res = await fetch(`/api/progress-circles/${id}/invite`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send invitation.');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: '32px 36px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 600, margin: '0 auto',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
  const sectionStyle = { marginBottom: 24 };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: 48, margin: '0 0 12px' }}>🎉</p>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#111827' }}>Invitation Sent!</h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6b7280' }}>
            An email has been sent to <strong>{email}</strong> with instructions to join the circle.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSuccess(false); setEmail(''); setRole(''); setPermissions({}); }}
              style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Invite Another
            </button>
            <button
              onClick={() => navigate(`/iatlas/circles/${id}`)}
              style={{ padding: '10px 20px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px' }}>
      <div style={cardStyle}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#111827' }}>👋 Invite a Stakeholder</h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#6b7280' }}>
          Invite someone to join this Progress Circle. They'll receive an email with a link to accept.
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ marginBottom: 20, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 14px', color: '#b91c1c', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Email Address *</label>
            <input
              style={inputStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="stakeholder@example.com"
              required
              autoFocus
            />
          </div>

          {/* Role */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, marginBottom: 12 }}>Select Role *</label>
            <RoleSelector value={role} onChange={handleRoleChange} />
          </div>

          {/* Specialty context (shown for clinical roles) */}
          {['slp', 'ot', 'bcba', 'therapist', 'counselor', 'teacher', 'coach'].includes(role) && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '16px 18px', marginBottom: 24 }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Specialty Context (Optional)</p>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Session Frequency</label>
                <input
                  style={inputStyle}
                  value={sessionFrequency}
                  onChange={(e) => setSessionFrequency(e.target.value)}
                  placeholder="e.g. 2x weekly, daily"
                />
              </div>
              <div>
                <label style={labelStyle}>Primary Focus Areas (comma-separated)</label>
                <input
                  style={inputStyle}
                  value={primaryFocus}
                  onChange={(e) => setPrimaryFocus(e.target.value)}
                  placeholder="e.g. articulation, social communication"
                />
              </div>
            </div>
          )}

          {/* Permissions customiser */}
          {role && (
            <div style={sectionStyle}>
              <label style={{ ...labelStyle, marginBottom: 12 }}>Permissions</label>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
                Default permissions for the <strong>{role}</strong> role are pre-selected. Adjust as needed.
              </p>
              <PermissionCustomizer permissions={permissions} onChange={setPermissions} />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate(`/iatlas/circles/${id}`)}
              style={{ padding: '10px 20px', background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email || !role}
              style={{ padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, opacity: loading || !email || !role ? 0.6 : 1 }}
            >
              {loading ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
