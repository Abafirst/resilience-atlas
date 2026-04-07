import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { STARTER_PRICE_LABEL } from '../constants/unlockPricing.js';
import { apiFetch } from '../lib/apiFetch.js';

/**
 * AssessmentHistory — shows all past assessments with unlock status.
 *
 * For each assessment:
 *   - If PDF is unlocked: shows "Download PDF" button.
 *   - If PDF is locked: shows "Unlock PDF" button + pricing.
 *
 * Props:
 *   email          {string}    User email for fetching history.
 *   onUnlock       {function}  Called with (tier, assessmentHash) when unlock is requested.
 *   checkoutLoading {string}   Tier ID currently loading (or '').
 *   getTokenFn     {function}  Auth0 getAccessTokenSilently (optional) for authenticated requests.
 */

const s = {
  section: {
    marginTop:  40,
    width:      '100%',
    maxWidth:   680,
  },
  heading: {
    color:        '#2d3748',
    fontSize:     18,
    fontWeight:   700,
    marginBottom: 6,
    display:      'flex',
    alignItems:   'center',
    gap:          8,
  },
  desc: {
    color:        '#718096',
    fontSize:     13,
    marginBottom: 16,
    lineHeight:   1.5,
  },
  list: {
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
  },
  row: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    background:     '#ffffff',
    border:         '1px solid #e2e8f0',
    borderRadius:   10,
    padding:        '14px 18px',
    boxShadow:      '0 1px 6px rgba(0,0,0,0.04)',
    gap:            12,
    flexWrap:       'wrap',
  },
  info: {
    display:       'flex',
    flexDirection: 'column',
    gap:           4,
    flex:          1,
  },
  scoreRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
  },
  overallScore: {
    color:      '#1a202c',
    fontWeight: 700,
    fontSize:   15,
  },
  dominantType: {
    color:      '#667eea',
    fontSize:   13,
    fontWeight: 600,
  },
  date: {
    color:    '#718096',
    fontSize: 12,
  },
  badge: (unlocked) => ({
    display:      'inline-flex',
    alignItems:   'center',
    gap:          4,
    padding:      '2px 8px',
    borderRadius: 20,
    fontSize:     11,
    fontWeight:   600,
    background:   unlocked ? '#dcfce7' : '#fef3c7',
    color:        unlocked ? '#16a34a' : '#92400e',
    border:       `1px solid ${unlocked ? '#bbf7d0' : '#fde68a'}`,
  }),
  actions: {
    display:    'flex',
    gap:        8,
    alignItems: 'center',
    flexShrink: 0,
  },
  btn: (variant, disabled) => ({
    padding:      '7px 14px',
    background:   variant === 'download' ? '#667eea' : '#f8fafc',
    color:        variant === 'download' ? '#fff' : '#4a5568',
    border:       variant === 'download' ? 'none' : '1.5px solid #e2e8f0',
    borderRadius: 7,
    fontSize:     13,
    fontWeight:   600,
    cursor:       disabled ? 'not-allowed' : 'pointer',
    opacity:      disabled ? 0.65 : 1,
    whiteSpace:   'nowrap',
    flexShrink:   0,
  }),
  unlockNote: {
    fontSize:  12,
    color:     '#718096',
    textAlign: 'right',
  },
  errorBox: {
    marginTop:  10,
    color:      '#991b1b',
    background: '#fee2e2',
    border:     '1px solid #fecaca',
    borderRadius: 6,
    padding:    '8px 12px',
    fontSize:   13,
  },
  emptyState: {
    textAlign:    'center',
    padding:      '32px 16px',
    color:        '#718096',
    fontSize:     14,
    background:   '#f8fafc',
    borderRadius: 10,
    border:       '1px dashed #e2e8f0',
  },
};

const MAX_POLL = 60;
const POLL_MS  = 2000;

async function downloadPdfByHash(hash, overall, dominantType, scores, email, getTokenFn) {
  const params = new URLSearchParams({
    overall:      String(overall),
    dominantType: dominantType || '',
    scores:       JSON.stringify(scores || {}),
  });
  if (email) params.set('email', email);

  /**
   * Get an Auth0 Authorization header object, or throw a user-friendly error
   * if the token is unavailable or the user is not authenticated.
   */
  async function getAuthHeaders() {
    if (typeof getTokenFn !== 'function') {
      throw new Error('Authentication required. Please log in and try again.');
    }
    try {
      const token = await getTokenFn();
      if (!token) throw new Error('empty token');
      return { 'Authorization': `Bearer ${token}` };
    } catch (err) {
      const msg = (err && err.message) || '';
      if (msg && msg !== 'empty token') {
        console.warn('[AssessmentHistory] Token error:', msg);
      }
      throw new Error('Authentication error. Please refresh the page and try again.');
    }
  }

  const authHeaders = await getAuthHeaders();

  const genRes = await fetch(`/api/report/generate?${params.toString()}`, { headers: authHeaders });
  if (!genRes.ok) {
    const body = await genRes.json().catch(() => ({}));
    if (genRes.status === 401) {
      throw new Error('Authentication failed. Please log in again and retry.');
    }
    throw new Error(body.error || 'Failed to start report generation');
  }
  const { hash: jobHash } = await genRes.json();

  for (let i = 0; i < MAX_POLL; i++) {
    await new Promise(r => setTimeout(r, POLL_MS));
    const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(jobHash)}`, { headers: authHeaders });
    if (!statusRes.ok) {
      if (statusRes.status === 401) {
        throw new Error('Authentication expired during report generation. Please log in again and retry.');
      }
      throw new Error('Failed to check report status. Please try again.');
    }
    const st = await statusRes.json();
    if (st.status === 'ready') {
      const dlRes = await fetch(`/api/report/download?hash=${encodeURIComponent(jobHash)}`, { headers: authHeaders });
      if (!dlRes.ok) {
        if (dlRes.status === 401) {
          throw new Error('Authentication expired. Please log in again and retry.');
        }
        const body = await dlRes.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to download report');
      }
      const blob = await dlRes.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'resilience-atlas-report.pdf';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return;
    }
    if (st.status === 'failed') throw new Error(st.error || 'Report generation failed');
  }
  throw new Error('Report generation timed out. Please try again.');
}

export default function AssessmentHistory({ email, onUnlock, checkoutLoading, getTokenFn }) {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [loading, setLoading]           = useState(true);
  const [hasNavigatorAccess, setHasNavigatorAccess] = useState(false);
  const [assessments, setAssessments]   = useState([]);
  const [downloadingIdx, setDownloadingIdx] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    apiFetch(`/api/assessment/history?email=${encodeURIComponent(email)}`, {}, getTokenFn)
      .then(r => r.json())
      .then(data => {
        setHasNavigatorAccess(!!data.hasNavigatorAccess);
        if (Array.isArray(data.assessments)) {
          setAssessments(
            data.assessments.filter(a => a.overall !== undefined && a.dominantType)
          );
        }
      })
      .catch(err => console.warn('[AssessmentHistory] fetch error:', err.message))
      .finally(() => setLoading(false));
  }, [email]);

  if (loading || assessments.length === 0) return null;

  const handleDownload = async (assessment, idx) => {
    // If unauthenticated, prompt login and return to the current page.
    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search },
      });
      return;
    }
    setDownloadingIdx(idx);
    setDownloadError('');
    try {
      await downloadPdfByHash(
        assessment.hash,
        assessment.overall,
        assessment.dominantType,
        assessment.scores,
        email,
        getTokenFn
      );
    } catch (err) {
      setDownloadError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloadingIdx(null);
    }
  };

  const handleUnlock = (assessment) => {
    if (onUnlock) onUnlock(assessment);
  };

  return (
    <section style={s.section} aria-labelledby="assessmentHistoryHeading">
      <h3 id="assessmentHistoryHeading" style={s.heading}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <polyline points="21 8 21 21 3 21 3 8"/>
          <rect x="1" y="3" width="22" height="5"/>
          <line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
        Assessment History
      </h3>
      <p style={s.desc}>
        {hasNavigatorAccess
          ? 'As an Atlas Navigator member you can download all your reports at any time.'
          : 'Previously unlocked reports are always available for re-download. Unlock new reports to access the PDF.'}
      </p>

      {assessments.length === 0 ? (
        <div style={s.emptyState}>No previous assessments found.</div>
      ) : (
        <div style={s.list}>
          {assessments.map((a, idx) => {
            const date        = a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'N/A';
            const unlocked    = a.pdfUnlocked;
            const isDownloading = downloadingIdx === idx;
            const isUnlocking   = checkoutLoading !== '' && !unlocked;

            return (
              <div key={a.hash || idx} style={s.row}>
                <div style={s.info}>
                  <div style={s.scoreRow}>
                    <span style={s.overallScore}>{Math.round(a.overall)}% Overall</span>
                    <span aria-label={unlocked ? 'PDF unlocked' : 'PDF locked'} style={s.badge(unlocked)}>
                      {unlocked
                        ? <><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />Unlocked</>
                        : <><img src="/icons/lock.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />Locked</>}
                    </span>
                  </div>
                  {a.dominantType && (
                    <span style={s.dominantType}>
                      <img src="/icons/compass.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                      {a.dominantType}
                    </span>
                  )}
                  <span style={s.date}>Taken {date}</span>
                </div>
                <div style={s.actions}>
                  {unlocked ? (
                    <button
                      type="button"
                      style={s.btn('download', isDownloading)}
                      disabled={isDownloading}
                      aria-label={`Download PDF for ${Math.round(a.overall)}% assessment from ${date}`}
                      onClick={() => handleDownload(a, idx)}
                    >
                      {isDownloading ? '⏳ Generating…' : '⬇ Download PDF'}
                    </button>
                  ) : (
                    <div>
                      <button
                        type="button"
                        style={s.btn('unlock', isUnlocking)}
                        disabled={!!checkoutLoading}
                        aria-label={`Unlock PDF for assessment from ${date}`}
                        onClick={() => handleUnlock(a)}
                      >
                        🔓 Unlock PDF
                      </button>
                      <div style={s.unlockNote}>from {STARTER_PRICE_LABEL}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {downloadError && (
        <div style={s.errorBox} role="alert">{downloadError}</div>
      )}
    </section>
  );
}
