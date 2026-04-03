import React, { useState, useEffect } from 'react';
import { STARTER_PRICE_LABEL } from '../constants/unlockPricing.js';

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

async function downloadPdfByHash(hash, overall, dominantType, scores, email) {
  const params = new URLSearchParams({
    overall:      String(overall),
    dominantType: dominantType || '',
    scores:       JSON.stringify(scores || {}),
  });
  if (email) params.set('email', email);

  const genRes = await fetch(`/api/report/generate?${params.toString()}`);
  if (!genRes.ok) {
    const body = await genRes.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to start report generation');
  }
  const { hash: jobHash } = await genRes.json();

  for (let i = 0; i < MAX_POLL; i++) {
    await new Promise(r => setTimeout(r, POLL_MS));
    const st = await fetch(`/api/report/status?hash=${encodeURIComponent(jobHash)}`).then(r => r.json());
    if (st.status === 'ready') {
      window.location.href = `/api/report/download?hash=${encodeURIComponent(jobHash)}`;
      return;
    }
    if (st.status === 'failed') throw new Error(st.error || 'Report generation failed');
  }
  throw new Error('Report generation timed out. Please try again.');
}

export default function AssessmentHistory({ email, onUnlock, checkoutLoading }) {
  const [loading, setLoading]           = useState(true);
  const [hasNavigatorAccess, setHasNavigatorAccess] = useState(false);
  const [assessments, setAssessments]   = useState([]);
  const [downloadingIdx, setDownloadingIdx] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    fetch(`/api/assessment/history?email=${encodeURIComponent(email)}`)
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
    setDownloadingIdx(idx);
    setDownloadError('');
    try {
      await downloadPdfByHash(
        assessment.hash,
        assessment.overall,
        assessment.dominantType,
        assessment.scores,
        email
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
                      {unlocked ? '✓ Unlocked' : '🔒 Locked'}
                    </span>
                  </div>
                  {a.dominantType && (
                    <span style={s.dominantType}>🧭 {a.dominantType}</span>
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
