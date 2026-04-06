import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const TIER_LABELS = {
  'atlas-starter': 'Atlas Starter',
  'atlas-navigator': 'Atlas Navigator',
  'atlas-premium': 'Atlas Premium (Lifetime)',
  'starter': 'Atlas Team Basic',
  'pro': 'Atlas Team Premium',
  'enterprise': 'Atlas Enterprise',
};

const styles = {
  section: {
    marginTop: 40,
    width: '100%',
    maxWidth: 680,
  },
  heading: {
    color: '#2d3748',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  desc: {
    color: '#718096',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '14px 18px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  tierRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tier: {
    color: '#1a202c',
    fontWeight: 600,
    fontSize: 14,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '2px 7px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    background: '#dcfce7',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
  },
  date: {
    color: '#718096',
    fontSize: 12,
  },
  btn: {
    padding: '6px 14px',
    background: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    marginLeft: 12,
  },
  btnDisabled: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },
  errorBox: {
    marginTop: 10,
    color: '#991b1b',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
  },
};

async function downloadPdfForPurchase(purchase, email, getTokenFn) {
  const { assessmentData } = purchase;
  const scoresStr = JSON.stringify(assessmentData.scores);
  const params = new URLSearchParams({
    overall: String(assessmentData.overall),
    dominantType: assessmentData.dominantType,
    scores: scoresStr,
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
        console.warn('[ResultsHistory] Token error:', msg);
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
  const genData = await genRes.json();
  const { hash } = genData;

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(hash)}`, { headers: authHeaders });
    if (!statusRes.ok) {
      if (statusRes.status === 401) {
        throw new Error('Authentication expired during report generation. Please log in again and retry.');
      }
      throw new Error('Failed to check report status. Please try again.');
    }
    const statusData = await statusRes.json();
    if (statusData.status === 'ready') {
      // Fetch the PDF as a blob to send the Authorization header.
      const dlRes = await fetch(`/api/report/download?hash=${encodeURIComponent(hash)}`, { headers: authHeaders });
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
    if (statusData.status === 'failed') {
      throw new Error(statusData.error || 'Report generation failed');
    }
  }
  throw new Error('Report generation timed out. Please try again.');
}

/**
 * ResultsHistory — lists prior PDF report purchases for the authenticated
 * user and provides a per-purchase "Download PDF" button so they can
 * re-download the exact report for each specific assessment attempt.
 *
 * Each purchase displays an "Unlocked" badge since the new access model makes
 * all purchases permanent — there is no expiry for previously paid reports.
 */
export default function ResultsHistory({ email }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIdx, setDownloadingIdx] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    fetch(`/api/report/access?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.hasAccess && Array.isArray(data.purchases)) {
          setPurchases(
            data.purchases.filter(
              p => p.assessmentData &&
                   p.assessmentData.overall !== undefined &&
                   p.assessmentData.dominantType &&
                   p.assessmentData.scores
            )
          );
        }
      })
      .catch(err => {
        console.warn('[ResultsHistory] Failed to load purchase history:', err.message);
      })
      .finally(() => setLoading(false));
  }, [email]);

  if (loading || purchases.length === 0) return null;

  const handleDownload = async (purchase, idx) => {
    setDownloadingIdx(idx);
    setDownloadError('');
    try {
      await downloadPdfForPurchase(purchase, email, getAccessTokenSilently);
    } catch (err) {
      console.error('[ResultsHistory] Download failed:', err);
      setDownloadError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloadingIdx(null);
    }
  };

  return (
    <section style={styles.section} aria-labelledby="priorReportsHeading">
      <h3 id="priorReportsHeading" style={styles.heading}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
          <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
        Prior Report Purchases
      </h3>
      <p style={styles.desc}>
        Each purchased report is permanently available for re-download. Use the{' '}
        <strong>Download PDF</strong> button next to a specific purchase to
        regenerate that exact report.
      </p>
      <div style={styles.list}>
        {purchases.map((purchase, idx) => {
          const tierLabel = TIER_LABELS[purchase.tier] || purchase.tier;
          const date = purchase.purchasedAt
            ? new Date(purchase.purchasedAt).toLocaleDateString()
            : 'N/A';
          const isDownloading = downloadingIdx === idx;
          return (
            <div key={`${purchase.tier}-${purchase.purchasedAt || idx}`} style={styles.row}>
              <div style={styles.info}>
                <div style={styles.tierRow}>
                  <span style={styles.tier}>{tierLabel}</span>
                  <span style={styles.badge}>✓ Unlocked</span>
                </div>
                <span style={styles.date}>Purchased {date}</span>
              </div>
              <button
                type="button"
                style={{ ...styles.btn, ...(isDownloading ? styles.btnDisabled : {}) }}
                disabled={isDownloading}
                aria-label={`Download PDF for ${tierLabel} purchased ${date}`}
                onClick={() => handleDownload(purchase, idx)}
              >
                {isDownloading ? '⏳ Generating…' : '⬇ Download PDF'}
              </button>
            </div>
          );
        })}
      </div>
      {downloadError && (
        <div style={styles.errorBox} role="alert">
          {downloadError}
        </div>
      )}
    </section>
  );
}
