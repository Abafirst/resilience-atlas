/**
 * SessionPlansPage.jsx
 * IATLAS Clinical — Session Plans management page.
 *
 * Route: /iatlas/clinical/session-plans
 *
 * Access: Practitioner, Practice, Enterprise tiers only.
 * Free/Individual/Family/Complete users see an upgrade prompt.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import SessionPlanList from '../components/IATLAS/Clinical/SessionPlanList.jsx';
import SessionPlanBuilder from '../components/IATLAS/Clinical/SessionPlanBuilder.jsx';
import SessionPlanView from '../components/IATLAS/Clinical/SessionPlanView.jsx';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import { hasProfessionalAccess } from '../utils/iatlasGating.js';
import { apiUrl } from '../api/baseUrl.js';

// View modes
const MODE_LIST    = 'list';
const MODE_CREATE  = 'create';
const MODE_EDIT    = 'edit';
const MODE_VIEW    = 'view';

export default function SessionPlansPage() {
  const { getAccessTokenSilently } = useAuth0();

  const [mode, setMode]           = useState(MODE_LIST);
  const [plans, setPlans]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [hasPro, setHasPro]             = useState(null); // null = checking

  // ── Dark mode ────────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  // ── Tier check ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const pro = hasProfessionalAccess();
    setHasPro(pro);
    if (!pro) setShowUpgrade(true);
  }, []);

  // ── Fetch plans ──────────────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      let token = '';
      try { token = await getAccessTokenSilently(); } catch (tokenErr) {
        console.warn('[SessionPlansPage] Could not get access token:', tokenErr?.message);
      }

      const res = await fetch(apiUrl('/api/iatlas/clinical/session-plans'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load session plans.');
      }
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    if (hasPro) fetchPlans();
  }, [hasPro, fetchPlans]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSave = (saved) => {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.sessionPlanId === saved.sessionPlanId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setMode(MODE_LIST);
    setSelectedPlan(null);
  };

  const handleDelete = async (sessionPlanId) => {
    try {
      let token = '';
      try { token = await getAccessTokenSilently(); } catch (tokenErr) {
        console.warn('[SessionPlansPage] Could not get access token for delete:', tokenErr?.message);
      }
      const res = await fetch(
        apiUrl(`/api/iatlas/clinical/session-plans/${sessionPlanId}`),
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to archive plan.');
      }
      setPlans(prev => prev.filter(p => p.sessionPlanId !== sessionPlanId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleView = (plan) => { setSelectedPlan(plan); setMode(MODE_VIEW); };
  const handleEdit = (plan) => { setSelectedPlan(plan); setMode(MODE_EDIT);  };
  const handleNew  = ()     => { setSelectedPlan(null); setMode(MODE_CREATE); };
  const handleBack = ()     => { setSelectedPlan(null); setMode(MODE_LIST);  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />

      {/* Tier gate — show upgrade modal for non-professional users */}
      {showUpgrade && (
        <IATLASUnlockModal
          variant="professional"
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <main id="main-content" className="spp-page">
        {/* ── Breadcrumb ── */}
        <nav className="spp-breadcrumb" aria-label="Breadcrumb">
          <Link to="/iatlas">IATLAS</Link>
          <span> › </span>
          <span>Clinical</span>
          <span> › </span>
          <span>Session Plans</span>
        </nav>

        {/* ── Header ── */}
        <div className="spp-header">
          <div>
            <h1 className="spp-title">
              🩺 Session Plans
            </h1>
            <p className="spp-subtitle">
              Create, manage, and track clinical session plans for your clients.
            </p>
          </div>
          {mode === MODE_LIST && hasPro && (
            <button className="spp-btn-new" onClick={handleNew}>
              + New Session Plan
            </button>
          )}
          {mode !== MODE_LIST && (
            <button className="spp-btn-back" onClick={handleBack}>
              ← Back to List
            </button>
          )}
        </div>

        {/* ── Content ── */}
        <div className="spp-content">

          {/* Tier paywall message (non-blocking — modal handles it) */}
          {hasPro === false && !showUpgrade && (
            <div className="spp-upgrade-banner">
              <p>
                Session Plans are available for <strong>Practitioner</strong>,{' '}
                <strong>Practice</strong>, and <strong>Enterprise</strong> tiers.
              </p>
              <button className="spp-btn-new" onClick={() => setShowUpgrade(true)}>
                Upgrade to Practitioner
              </button>
            </div>
          )}

          {/* Error */}
          {fetchError && (
            <div className="spp-error">
              <strong>Error:</strong> {fetchError}
              <button className="spp-retry-btn" onClick={fetchPlans}>Retry</button>
            </div>
          )}

          {/* List mode */}
          {hasPro && mode === MODE_LIST && (
            <SessionPlanList
              plans={plans}
              loading={loading}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNew={handleNew}
            />
          )}

          {/* Create mode */}
          {hasPro && mode === MODE_CREATE && (
            <div className="spp-form-wrap">
              <h2 className="spp-form-title">New Session Plan</h2>
              <SessionPlanBuilder
                plan={null}
                onSave={handleSave}
                onCancel={handleBack}
                getTokenFn={getAccessTokenSilently}
              />
            </div>
          )}

          {/* Edit mode */}
          {hasPro && mode === MODE_EDIT && selectedPlan && (
            <div className="spp-form-wrap">
              <h2 className="spp-form-title">Edit Session Plan</h2>
              <SessionPlanBuilder
                plan={selectedPlan}
                onSave={handleSave}
                onCancel={handleBack}
                getTokenFn={getAccessTokenSilently}
              />
            </div>
          )}

          {/* View mode */}
          {hasPro && mode === MODE_VIEW && selectedPlan && (
            <SessionPlanView
              plan={selectedPlan}
              onClose={handleBack}
              onEdit={handleEdit}
            />
          )}

        </div>
      </main>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PAGE_CSS = `
.spp-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0 0 4rem;
}

.spp-breadcrumb {
  padding: 1rem 1.5rem 0;
  font-size: 0.82rem;
  color: #94a3b8;
}
.spp-breadcrumb a { color: #059669; text-decoration: none; }
.spp-breadcrumb a:hover { text-decoration: underline; }

.spp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem;
  max-width: 960px;
  margin: 0 auto;
}

.spp-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.spp-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin: 0.25rem 0 0;
}

.spp-btn-new {
  background: #059669;
  color: #fff;
  border: none;
  padding: 0.65rem 1.4rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.spp-btn-new:hover { background: #047857; }

.spp-btn-back {
  background: #f1f5f9;
  color: #374151;
  border: 1.5px solid #cbd5e1;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.spp-btn-back:hover { background: #e2e8f0; }

.spp-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.spp-form-wrap {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.75rem;
}
.spp-form-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.spp-error {
  background: #fee2e2;
  border: 1.5px solid #fca5a5;
  border-radius: 10px;
  padding: 1rem;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.spp-retry-btn {
  background: #dc2626; color: #fff; border: none;
  padding: 0.4rem 0.9rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;
}
.spp-retry-btn:hover { background: #b91c1c; }

.spp-upgrade-banner {
  background: #d1fae5;
  border: 1.5px solid #6ee7b7;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.spp-upgrade-banner p { margin: 0; color: #065f46; }

@media (max-width: 640px) {
  .spp-header { padding: 1rem; }
  .spp-content { padding: 0 1rem; }
  .spp-title { font-size: 1.35rem; }
  .spp-form-wrap { padding: 1.25rem; border-radius: 12px; }
}

[data-theme="dark"] .spp-page { background: #0f172a; }
[data-theme="dark"] .spp-title   { color: #f8fafc; }
[data-theme="dark"] .spp-subtitle { color: #94a3b8; }
[data-theme="dark"] .spp-form-wrap { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .spp-form-title { color: #f1f5f9; border-color: #334155; }
`;
