import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import { apiFetch } from '../lib/apiFetch.js';

/**
 * TeamManagementPage — Self-service team management for org admins.
 *
 * Features:
 *  - View team roster
 *  - Invite members (single or bulk via comma/newline separated list)
 *  - Remove members
 *  - Assign roles (Admin vs Member)
 *
 * Route: /team-management/:orgId
 * Protected: requires Auth0 login + org admin role
 */

const styles = `
  .tm-page {
    min-height: 100vh;
    background: #f8fafc;
    padding-bottom: 3rem;
  }
  .tm-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
  .tm-header {
    margin-bottom: 2rem;
  }
  .tm-header h1 {
    font-size: 1.8rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 0.25rem;
  }
  .tm-header p {
    color: #64748b;
    font-size: 0.95rem;
  }
  .tm-section {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .tm-section h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 1rem;
  }
  .tm-invite-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .tm-invite-textarea {
    flex: 1;
    min-width: 220px;
    padding: 0.65rem 0.9rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.93rem;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    color: #0f172a;
  }
  .tm-invite-textarea:focus {
    outline: none;
    border-color: #4F46E5;
  }
  .tm-invite-role {
    padding: 0.65rem 0.9rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.93rem;
    background: #fff;
    color: #0f172a;
  }
  .tm-btn {
    padding: 0.65rem 1.25rem;
    border-radius: 8px;
    font-size: 0.93rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: background 150ms;
  }
  .tm-btn-primary {
    background: #4F46E5;
    color: #fff;
  }
  .tm-btn-primary:hover { background: #4338CA; }
  .tm-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .tm-btn-danger {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  .tm-btn-danger:hover { background: #fee2e2; }
  .tm-btn-secondary {
    background: #f1f5f9;
    color: #334155;
    border: 1px solid #e2e8f0;
  }
  .tm-btn-secondary:hover { background: #e2e8f0; }

  .tm-roster-table {
    width: 100%;
    border-collapse: collapse;
  }
  .tm-roster-table th {
    text-align: left;
    padding: 0.6rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
  }
  .tm-roster-table td {
    padding: 0.7rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.9rem;
    color: #374151;
    vertical-align: middle;
  }
  .tm-roster-table tr:last-child td { border-bottom: none; }
  .tm-role-badge {
    display: inline-block;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .tm-role-admin { background: #dbeafe; color: #1e40af; }
  .tm-role-member { background: #f1f5f9; color: #475569; }
  .tm-empty {
    text-align: center;
    padding: 2rem;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  .tm-alert {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.88rem;
    margin-bottom: 1rem;
  }
  .tm-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
  .tm-alert-error   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .tm-alert-info    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
  .tm-seat-info {
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.5rem;
  }
  .tm-pending-tag {
    font-size: 0.75rem;
    background: #fef3c7;
    color: #92400e;
    padding: 0.1rem 0.45rem;
    border-radius: 4px;
    margin-left: 0.4rem;
  }
  @media (max-width: 640px) {
    .tm-invite-row { flex-direction: column; }
  }
`;

export default function TeamManagementPage() {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();

  // Derive orgId from URL path parameter
  const orgId = window.location.pathname.split('/team-management/')[1]?.split('/')[0] || '';

  const [org, setOrg] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId || !isAuthenticated) return;
    try {
      setLoading(true);
      setError('');
      const [orgRes, usersRes] = await Promise.all([
        apiFetch(`/api/organizations/${orgId}`, {}, getAccessTokenSilently),
        apiFetch(`/api/organizations/${orgId}/users`, {}, getAccessTokenSilently),
      ]);
      setOrg(orgRes.organization || orgRes);
      setUsers(usersRes.users || []);
    } catch (err) {
      setError('Failed to load team data. Are you an org admin?');
    } finally {
      setLoading(false);
    }
  }, [orgId, isAuthenticated, getAccessTokenSilently]);

  useEffect(() => {
    if (!isLoading) fetchData();
  }, [isLoading, fetchData]);

  const handleInvite = async () => {
    if (!inviteEmails.trim()) return;
    const emails = inviteEmails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@'));
    if (emails.length === 0) {
      setError('Please enter at least one valid email address.');
      return;
    }
    setInviting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await apiFetch(
        `/api/org/${orgId}/invite`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails, role: inviteRole }),
        },
        getAccessTokenSilently
      );
      setSuccessMsg(`✓ ${res.invites_sent || emails.length} invitation(s) sent.`);
      setInviteEmails('');
      fetchData();
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes('Seat limit')) {
        setError(msg);
      } else {
        setError('Failed to send invitations. ' + msg);
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch(
        `/api/orgs-advanced/${orgId}/roles/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        },
        getAccessTokenSilently
      );
      setSuccessMsg('Role updated.');
      fetchData();
    } catch (err) {
      setError('Failed to update role.');
    }
  };

  if (isLoading || loading) {
    return (
      <>
        <style>{styles}</style>
        <SiteHeader />
        <div className="tm-page">
          <div className="tm-container">
            <div className="tm-empty">Loading team data…</div>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <style>{styles}</style>
        <SiteHeader />
        <div className="tm-page">
          <div className="tm-container">
            <div className="tm-alert tm-alert-error">Please log in to manage your team.</div>
          </div>
        </div>
      </>
    );
  }

  const tierName = org?.plan || org?.tier || 'unknown';
  const maxUsers = org?.settings?.max_users || (tierName === 'enterprise' ? '∞' : tierName.includes('pro') ? 30 : 15);

  return (
    <>
      <style>{styles}</style>
      <SiteHeader />
      <div className="tm-page">
        <div className="tm-container">
          <div className="tm-header">
            <h1>Team Management</h1>
            <p>
              {org?.company_name || org?.name || 'Your Organization'} ·{' '}
              <strong>{tierName}</strong> plan · {users.length} / {maxUsers} seats used
            </p>
          </div>

          {error && <div className="tm-alert tm-alert-error">{error}</div>}
          {successMsg && <div className="tm-alert tm-alert-success">{successMsg}</div>}

          {/* ── Invite Section ─────────────────────────────────────────────── */}
          <div className="tm-section">
            <h2>Invite Members</h2>
            <div className="tm-invite-row">
              <textarea
                className="tm-invite-textarea"
                placeholder="Enter email addresses (one per line, or comma-separated)"
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                aria-label="Email addresses to invite"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <select
                  className="tm-invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  aria-label="Role for invitees"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  className="tm-btn tm-btn-primary"
                  onClick={handleInvite}
                  disabled={inviting}
                  type="button"
                >
                  {inviting ? 'Sending…' : 'Send Invitations'}
                </button>
              </div>
            </div>
            <p className="tm-seat-info">
              Bulk invite supported — one email per line or comma-separated. Seat limits are enforced server-side.
            </p>
          </div>

          {/* ── Roster ─────────────────────────────────────────────────────── */}
          <div className="tm-section">
            <h2>Team Roster ({users.length})</h2>
            {users.length === 0 ? (
              <div className="tm-empty">No team members yet. Invite your first members above.</div>
            ) : (
              <table className="tm-roster-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.firstName || u.name || '—'}</td>
                      <td>{u.email || '—'}</td>
                      <td>
                        <span className={`tm-role-badge ${u.role === 'admin' ? 'tm-role-admin' : 'tm-role-member'}`}>
                          {u.role || 'member'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button
                            className="tm-btn tm-btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                            onClick={() => handleRoleChange(u._id, 'admin')}
                            type="button"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            className="tm-btn tm-btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}
                            onClick={() => handleRoleChange(u._id, 'member')}
                            type="button"
                          >
                            Make Member
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Invited Emails (pending) ──────────────────────────────────── */}
          {org?.invitedEmails?.length > 0 && (
            <div className="tm-section">
              <h2>Pending Invitations</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {org.invitedEmails.map((email) => (
                  <li
                    key={email}
                    style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#374151' }}
                  >
                    {email} <span className="tm-pending-tag">pending</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
