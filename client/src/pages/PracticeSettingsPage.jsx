/**
 * PracticeSettingsPage.jsx
 * Practice management page — practitioners list, invitations, and case assignments.
 * Route: /practice-settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import PractitionerListCard from '../components/RBAC/PractitionerListCard.jsx';
import InvitePractitionerModal from '../components/RBAC/InvitePractitionerModal.jsx';
import CaseAssignmentManager from '../components/RBAC/CaseAssignmentManager.jsx';
import { hasPermission } from '../components/RBAC/PermissionGate.jsx';
import { apiUrl } from '../api/baseUrl.js';

const TABS = ['Practitioners', 'Case Assignments'];

export default function PracticeSettingsPage() {
  const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();

  const [activeTab, setActiveTab]             = useState('Practitioners');
  const [practitioners, setPractitioners]     = useState([]);
  const [children, setChildren]               = useState([]);
  const [practice, setPractice]               = useState(null);
  const [loadingPractitioners, setLoadingPractitioners] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [error, setError]                     = useState(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLoading, setInviteLoading]     = useState(false);
  const [inviteError, setInviteError]         = useState(null);
  const [inviteSuccess, setInviteSuccess]     = useState(null);

  const [selectedPractitioner, setSelectedPractitioner] = useState(null);
  const [assignedCases, setAssignedCases]               = useState([]);
  const [assignLoading, setAssignLoading]               = useState(false);

  // Derive the current user's role from the practitioners list or fall back to a safe default.
  const currentUserRole = (
    practitioners.find(p => p.email === user?.email)?.role || 'observer'
  );

  const practiceId = practice?.id || practice?._id ||
    (typeof window !== 'undefined' && localStorage.getItem('practiceId'));

  const fetchPractitioners = useCallback(async () => {
    if (!practiceId) return;
    setLoadingPractitioners(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl(`/api/practices/${practiceId}/practitioners`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load practitioners');
      const data = await res.json();
      setPractitioners(Array.isArray(data) ? data : (data.practitioners || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPractitioners(false);
    }
  }, [practiceId, getAccessTokenSilently]);

  const fetchPractice = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl('/api/practices/mine'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPractice(data.practice || data);
    } catch {
      // non-critical
    }
  }, [getAccessTokenSilently]);

  const fetchChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl('/api/children'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load child profiles');
      const data = await res.json();
      setChildren(Array.isArray(data) ? data : (data.children || []));
    } catch {
      // non-critical
    } finally {
      setLoadingChildren(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPractice();
    }
  }, [isAuthenticated, fetchPractice]);

  useEffect(() => {
    if (practiceId) fetchPractitioners();
  }, [practiceId, fetchPractitioners]);

  useEffect(() => {
    if (activeTab === 'Case Assignments') fetchChildren();
  }, [activeTab, fetchChildren]);

  useEffect(() => {
    if (!selectedPractitioner) return;
    const fetchAssigned = async () => {
      try {
        const token = await getAccessTokenSilently();
        const id = selectedPractitioner.id || selectedPractitioner._id;
        const res = await fetch(apiUrl(`/api/practitioners/${id}/assignments`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setAssignedCases(Array.isArray(data) ? data : (data.assignments || []));
      } catch {
        // non-critical
      }
    };
    fetchAssigned();
  }, [selectedPractitioner, getAccessTokenSilently]);

  async function handleInvite(email, role) {
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl(`/api/practices/${practiceId}/invite`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to send invitation');
      }
      setInviteSuccess(`Invitation sent to ${email}`);
      fetchPractitioners();
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleEditRole(practitioner) {
    const newRole = window.prompt(
      `Change role for ${practitioner.name || practitioner.email}.\nEnter new role (admin/clinician/therapist/observer):`,
      practitioner.role
    );
    if (!newRole || newRole === practitioner.role) return;
    try {
      const token = await getAccessTokenSilently();
      const id = practitioner.id || practitioner._id;
      const res = await fetch(apiUrl(`/api/practitioners/${id}/role`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      fetchPractitioners();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemove(practitioner) {
    if (!window.confirm(`Remove ${practitioner.name || practitioner.email} from the practice?`)) return;
    try {
      const token = await getAccessTokenSilently();
      const id = practitioner.id || practitioner._id;
      const res = await fetch(apiUrl(`/api/practitioners/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove practitioner');
      fetchPractitioners();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAssign(childId) {
    setAssignLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const id = selectedPractitioner.id || selectedPractitioner._id;
      await fetch(apiUrl(`/api/practitioners/${id}/assignments`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ childProfileId: childId }),
      });
      const res = await fetch(apiUrl(`/api/practitioners/${id}/assignments`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignedCases(Array.isArray(data) ? data : (data.assignments || []));
    } catch {
      // non-critical
    } finally {
      setAssignLoading(false);
    }
  }

  async function handleUnassign(assignmentId) {
    setAssignLoading(true);
    try {
      const token = await getAccessTokenSilently();
      await fetch(apiUrl(`/api/practitioners/assignments/${assignmentId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const id = selectedPractitioner.id || selectedPractitioner._id;
      const res = await fetch(apiUrl(`/api/practitioners/${id}/assignments`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignedCases(Array.isArray(data) ? data : (data.assignments || []));
    } catch {
      // non-critical
    } finally {
      setAssignLoading(false);
    }
  }

  const canInvite = hasPermission(currentUserRole, 'practitioners', 'invite');

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
              Practice Settings
            </h1>
            {practice && (
              <p style={{ color: '#6b7280', fontSize: 15 }}>{practice.name || 'Your Practice'}</p>
            )}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  marginBottom: -2,
                  padding: '10px 22px',
                  fontSize: 15,
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? '#6366f1' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Practitioners Tab */}
          {activeTab === 'Practitioners' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e' }}>Team Members</h2>
                {canInvite && (
                  <button
                    onClick={() => { setInviteError(null); setInviteSuccess(null); setShowInviteModal(true); }}
                    style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Invite Practitioner
                  </button>
                )}
              </div>

              {loadingPractitioners ? (
                <div style={{ color: '#9ca3af', textAlign: 'center', padding: '3rem' }}>Loading…</div>
              ) : (
                <PractitionerListCard
                  practitioners={practitioners}
                  currentUserRole={currentUserRole}
                  onEditRole={handleEditRole}
                  onRemove={handleRemove}
                />
              )}
            </div>
          )}

          {/* Case Assignments Tab */}
          {activeTab === 'Case Assignments' && (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
              {/* Practitioner selector */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Practitioner
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {practitioners.map(p => (
                    <button
                      key={p.id || p._id}
                      onClick={() => setSelectedPractitioner(p)}
                      style={{
                        background: selectedPractitioner?.id === p.id ? '#eef2ff' : '#fff',
                        border: `1px solid ${selectedPractitioner?.id === p.id ? '#c7d2fe' : '#e5e7eb'}`,
                        borderRadius: 8,
                        padding: '10px 14px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: selectedPractitioner?.id === p.id ? '#4f46e5' : '#1a1a2e',
                        fontWeight: selectedPractitioner?.id === p.id ? 600 : 400,
                        fontSize: 14,
                      }}
                    >
                      {p.name || p.fullName || p.email}
                    </button>
                  ))}
                  {!practitioners.length && (
                    <p style={{ color: '#9ca3af', fontSize: 13 }}>No practitioners found.</p>
                  )}
                </div>
              </div>

              {/* Assignment manager */}
              <CaseAssignmentManager
                practitioner={selectedPractitioner}
                assignedCases={assignedCases}
                availableChildren={loadingChildren ? [] : children}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                loading={assignLoading}
              />
            </div>
          )}
        </div>
      </main>

      <InvitePractitionerModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
        loading={inviteLoading}
        error={inviteError}
        success={inviteSuccess}
      />
    </>
  );
}
