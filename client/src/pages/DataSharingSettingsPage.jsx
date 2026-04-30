/**
 * DataSharingSettingsPage.jsx — Privacy & data sharing control panel.
 *
 * Route: /settings/privacy
 *
 * Allows authenticated users to:
 *   • View current consent status for scores and curriculum sharing
 *   • Update their sharing preferences at any time
 *   • View the history of all consent changes
 *   • Set default preferences for future assessments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import SiteHeader from '../components/SiteHeader.jsx';
import { apiUrl } from '../api/baseUrl.js';

// ── Styles ─────────────────────────────────────────────────────────────────

const s = {
  page: {
    minHeight:  '100vh',
    background: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  hero: {
    background:  'linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%)',
    color:       '#fff',
    padding:     '4rem 1.5rem 3rem',
    textAlign:   'center',
  },
  heroTitle: {
    fontSize:   '2rem',
    fontWeight: 800,
    margin:     '0 0 .5rem',
  },
  heroSub: {
    fontSize:   '1rem',
    color:      '#a5b4fc',
    margin:     0,
  },
  container: {
    maxWidth:   720,
    margin:     '0 auto',
    padding:    '2rem 1.5rem',
  },
  card: {
    background:   '#fff',
    borderRadius: '.875rem',
    boxShadow:    '0 2px 16px rgba(0,0,0,.07)',
    padding:      '1.5rem',
    marginBottom: '1.5rem',
  },
  cardTitle: {
    fontSize:     '1rem',
    fontWeight:   700,
    color:        '#1e293b',
    margin:       '0 0 .25rem',
    display:      'flex',
    alignItems:   'center',
    gap:          '.5rem',
  },
  badge: (active) => ({
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '.25rem',
    background:    active ? '#dcfce7' : '#f1f5f9',
    color:         active ? '#15803d' : '#64748b',
    borderRadius:  '99px',
    padding:       '.2rem .65rem',
    fontSize:      '.75rem',
    fontWeight:    700,
  }),
  divider: {
    border:      'none',
    borderTop:   '1px solid #f1f5f9',
    margin:      '.75rem 0',
  },
  label: {
    display:     'block',
    fontSize:    '.83rem',
    color:       '#475569',
    fontWeight:  600,
    marginBottom: '.3rem',
  },
  textarea: {
    width:        '100%',
    minHeight:    72,
    padding:      '.5rem .75rem',
    border:       '1px solid #e2e8f0',
    borderRadius: '.5rem',
    fontSize:     '.85rem',
    resize:       'vertical',
    fontFamily:   'inherit',
    marginBottom: '.75rem',
    boxSizing:    'border-box',
  },
  checkRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '.5rem',
    marginBottom: '.75rem',
  },
  checkbox: {
    width:       18,
    height:      18,
    flexShrink:  0,
    cursor:      'pointer',
    accentColor: '#4f46e5',
  },
  btnPrimary: {
    background:   '#4f46e5',
    color:        '#fff',
    border:       'none',
    borderRadius: '.5rem',
    padding:      '.6rem 1.2rem',
    fontWeight:   700,
    fontSize:     '.875rem',
    cursor:       'pointer',
    marginRight:  '.5rem',
  },
  btnDanger: {
    background:   'transparent',
    color:        '#dc2626',
    border:       '1px solid #fca5a5',
    borderRadius: '.5rem',
    padding:      '.6rem 1.2rem',
    fontWeight:   600,
    fontSize:     '.875rem',
    cursor:       'pointer',
  },
  meta: {
    fontSize:  '.78rem',
    color:     '#94a3b8',
    marginTop: '.25rem',
  },
  historyRow: {
    display:        'flex',
    alignItems:     'center',
    gap:            '.75rem',
    padding:        '.6rem 0',
    borderBottom:   '1px solid #f1f5f9',
    fontSize:       '.83rem',
    color:          '#475569',
  },
  pill: (action) => ({
    background:   action === 'granted' ? '#dcfce7' : '#fee2e2',
    color:        action === 'granted' ? '#166534' : '#991b1b',
    borderRadius: '99px',
    padding:      '.15rem .6rem',
    fontWeight:   700,
    fontSize:     '.75rem',
    flexShrink:   0,
  }),
};

// ── Component ──────────────────────────────────────────────────────────────

export default function DataSharingSettingsPage() {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [orgName,       setOrgName]       = useState('your organization');
  const [consentData,   setConsentData]   = useState(null);
  const [history,       setHistory]       = useState([]);

  // Local editable state
  const [scoresEnabled,      setScoresEnabled]      = useState(false);
  const [scoresGoals,        setScoresGoals]        = useState('');
  const [curriculumEnabled,  setCurriculumEnabled]  = useState(false);
  const [curriculumGoals,    setCurriculumGoals]    = useState('');

  const fetchConsent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getAccessTokenSilently();

      const [consentRes, historyRes] = await Promise.all([
        fetch(apiUrl('/api/user/consent'),         { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/user/consent/history'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!consentRes.ok) throw new Error('Failed to load consent settings.');
      const data    = await consentRes.json();
      const histObj = historyRes.ok ? await historyRes.json() : {};

      setConsentData(data);
      setScoresEnabled(     data.scoresEnabled     === true);
      setScoresGoals(       data.scoresGoals        || '');
      setCurriculumEnabled( data.curriculumEnabled  === true);
      setCurriculumGoals(   data.curriculumGoals    || '');
      setHistory((histObj.history || []).slice().reverse());

      // Fetch org name
      if (data.organizationId) {
        try {
          const orgRes = await fetch(apiUrl('/api/orgs/' + data.organizationId), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (orgRes.ok) {
            const orgData = await orgRes.json();
            setOrgName(orgData.name || orgData.company_name || 'your organization');
          }
        } catch (_) {}
      }
    } catch (err) {
      setError(err.message || 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  useEffect(() => {
    document.title = 'Privacy & Data Sharing — The Resilience Atlas™';
    if (!isLoading && isAuthenticated) fetchConsent();
    else if (!isLoading && !isAuthenticated) setLoading(false);
  }, [isLoading, isAuthenticated, fetchConsent]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl('/api/user/consent'), {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          scores:          scoresEnabled,
          scoresGoals:     scoresGoals.trim(),
          curriculum:      curriculumEnabled,
          curriculumGoals: curriculumGoals.trim(),
          context:         'settings_change',
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save settings.');
      }
      setSuccessMsg('Your preferences have been saved.');
      await fetchConsent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(type) {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(apiUrl('/api/user/consent/revoke/' + type), {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to revoke consent.');
      }
      setSuccessMsg(`${type === 'scores' ? 'Assessment scores' : 'Curriculum progress'} sharing has been disabled.`);
      await fetchConsent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (_) { return dateStr; }
  }

  if (!isAuthenticated && !isLoading) {
    return (
      <div style={s.page}>
        <SiteHeader />
        <div style={{ ...s.container, textAlign: 'center', paddingTop: '4rem' }}>
          <p>Please <a href="/login">sign in</a> to manage your privacy settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <SiteHeader />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <h1 style={s.heroTitle}>Privacy &amp; Data Sharing</h1>
        <p style={s.heroSub}>Control exactly what you share with {orgName}</p>
      </section>

      <div style={s.container}>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Loading your settings…
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '.5rem', padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.875rem' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#dcfce7', color: '#166534', borderRadius: '.5rem', padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.875rem' }}>
            ✓ {successMsg}
          </div>
        )}

        {!loading && !consentData?.organizationId && (
          <div style={{ ...s.card, textAlign: 'center', color: '#64748b' }}>
            <p>You are not currently a member of any organization. Sharing settings will appear once you join one.</p>
          </div>
        )}

        {!loading && consentData?.organizationId && (
          <>
            {/* ── Assessment Scores Card ──────────────────────────────── */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.5rem' }}>
                <h2 style={s.cardTitle}>
                  Assessment Scores
                  <span style={s.badge(scoresEnabled)}>
                    {scoresEnabled ? '✓ Sharing' : '🔒 Private'}
                  </span>
                </h2>
              </div>

              <div style={s.checkRow}>
                <input
                  id="scores-toggle"
                  type="checkbox"
                  style={s.checkbox}
                  checked={scoresEnabled}
                  onChange={(e) => setScoresEnabled(e.target.checked)}
                />
                <label htmlFor="scores-toggle" style={{ fontSize: '.9rem', color: '#374151', cursor: 'pointer' }}>
                  Share my assessment scores with <strong>{orgName}</strong>
                </label>
              </div>

              {scoresEnabled && (
                <>
                  <label style={s.label} htmlFor="scores-goals-input">
                    Your goal <span style={{ fontWeight: 400 }}>(optional — helps {orgName} support you)</span>
                  </label>
                  <textarea
                    id="scores-goals-input"
                    style={s.textarea}
                    placeholder="e.g., I want my manager to understand my professional development priorities…"
                    value={scoresGoals}
                    onChange={(e) => setScoresGoals(e.target.value)}
                    maxLength={500}
                  />
                </>
              )}

              <p style={s.meta}>
                {consentData.scoresConsentDate
                  ? `Sharing enabled: ${formatDate(consentData.scoresConsentDate)}`
                  : 'Not yet set'}
                {consentData.scoresLastUpdated && ` · Last updated: ${formatDate(consentData.scoresLastUpdated)}`}
              </p>

              <hr style={s.divider} />

              <p style={{ margin: '0 0 .5rem', fontSize: '.83rem', color: '#475569', fontWeight: 600 }}>What's included when you share:</p>
              <ul style={{ margin: '0 0 .5rem', paddingLeft: '1.25rem', fontSize: '.82rem', color: '#64748b' }}>
                <li>Dimension scores (Cognitive, Relational, Emotional, etc.)</li>
                <li>Overall resilience percentage</li>
                <li>Assessment completion dates</li>
              </ul>
              <p style={{ margin: '0 0 .5rem', fontSize: '.83rem', color: '#475569', fontWeight: 600 }}>What always stays private:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '.82rem', color: '#64748b' }}>
                <li>Your individual question responses</li>
                <li>Detailed narrative interpretations</li>
                <li>Personal notes and reflections</li>
              </ul>
            </div>

            {/* ── Curriculum Progress Card ────────────────────────────── */}
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem', marginBottom: '.5rem' }}>
                <h2 style={s.cardTitle}>
                  Curriculum Progress
                  <span style={s.badge(curriculumEnabled)}>
                    {curriculumEnabled ? '✓ Sharing' : '🔒 Private'}
                  </span>
                </h2>
              </div>

              <div style={s.checkRow}>
                <input
                  id="curriculum-toggle"
                  type="checkbox"
                  style={s.checkbox}
                  checked={curriculumEnabled}
                  onChange={(e) => setCurriculumEnabled(e.target.checked)}
                />
                <label htmlFor="curriculum-toggle" style={{ fontSize: '.9rem', color: '#374151', cursor: 'pointer' }}>
                  Share my curriculum progress with <strong>{orgName}</strong>
                </label>
              </div>

              {curriculumEnabled && (
                <>
                  <label style={s.label} htmlFor="curriculum-goals-input">
                    Your goal <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    id="curriculum-goals-input"
                    style={s.textarea}
                    placeholder="e.g., I want to show my commitment to professional growth…"
                    value={curriculumGoals}
                    onChange={(e) => setCurriculumGoals(e.target.value)}
                    maxLength={500}
                  />
                </>
              )}

              <p style={s.meta}>
                {consentData.curriculumConsentDate
                  ? `Sharing enabled: ${formatDate(consentData.curriculumConsentDate)}`
                  : 'Not yet set'}
                {consentData.curriculumLastUpdated && ` · Last updated: ${formatDate(consentData.curriculumLastUpdated)}`}
              </p>

              <hr style={s.divider} />

              <p style={{ margin: '0 0 .5rem', fontSize: '.83rem', color: '#475569', fontWeight: 600 }}>What's included when you share:</p>
              <ul style={{ margin: '0 0 .5rem', paddingLeft: '1.25rem', fontSize: '.82rem', color: '#64748b' }}>
                <li>Modules and activities completed</li>
                <li>Skills you're developing (from IATLAS curriculum)</li>
                <li>Learning streaks and engagement metrics</li>
              </ul>
              <p style={{ margin: '0 0 .5rem', fontSize: '.83rem', color: '#475569', fontWeight: 600 }}>What always stays private:</p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '.82rem', color: '#64748b' }}>
                <li>Content of your personal reflections</li>
                <li>Quiz and exercise responses</li>
                <li>Detailed activity submissions</li>
              </ul>
            </div>

            {/* ── Save button ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                type="button"
                style={s.btnPrimary}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Preferences'}
              </button>
              {(consentData.scoresEnabled === true) && (
                <button
                  type="button"
                  style={s.btnDanger}
                  onClick={() => handleRevoke('scores')}
                  disabled={saving}
                >
                  Stop Sharing Scores
                </button>
              )}
              {(consentData.curriculumEnabled === true) && (
                <button
                  type="button"
                  style={s.btnDanger}
                  onClick={() => handleRevoke('curriculum')}
                  disabled={saving}
                >
                  Stop Sharing Curriculum
                </button>
              )}
            </div>

            {/* ── Sharing History ─────────────────────────────────────── */}
            {history.length > 0 && (
              <div style={s.card}>
                <h2 style={{ ...s.cardTitle, marginBottom: '.75rem' }}>Sharing History</h2>
                {history.map((entry, i) => (
                  <div key={i} style={s.historyRow}>
                    <span style={s.pill(entry.action)}>{entry.action}</span>
                    <span style={{ flexShrink: 0, fontWeight: 600 }}>
                      {entry.type === 'scores' ? 'Assessment Scores' : 'Curriculum Progress'}
                    </span>
                    <span style={{ color: '#94a3b8', marginLeft: 'auto', flexShrink: 0 }}>
                      {formatDate(entry.date)}
                    </span>
                    {entry.context && (
                      <span style={{ color: '#cbd5e1', fontSize: '.75rem', flexShrink: 0 }}>
                        via {entry.context.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Explainer ───────────────────────────────────────────── */}
            <div style={{ ...s.card, background: '#f0f4ff' }}>
              <h3 style={{ margin: '0 0 .5rem', fontSize: '.95rem', color: '#1e293b' }}>What this means</h3>
              <p style={{ margin: '0 0 .5rem', fontSize: '.83rem', color: '#475569' }}>
                <strong>When you share assessment scores:</strong> Organization admins see your dimension scores, your data contributes to anonymous team averages, and your progress appears in team reports.
              </p>
              <p style={{ margin: '0 0 .5rem', fontSize: '.83rem', color: '#475569' }}>
                <strong>When you share curriculum progress:</strong> Organization admins see which modules you've completed, your learning activities appear in team development metrics, and your engagement supports team learning initiatives.
              </p>
              <p style={{ margin: 0, fontSize: '.83rem', color: '#475569' }}>
                Your name is only visible to organization administrators. Aggregated reports anonymize individual data. You can revoke consent at any time.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
