import React, { useState, useEffect } from 'react';

const TIER_LABELS = {
  'atlas-navigator': 'Atlas Navigator',
  'atlas-premium': 'Atlas Premium (Lifetime)',
  'starter': 'Atlas Team Starter',
  'pro': 'Atlas Team Pro',
  'enterprise': 'Atlas Team Enterprise',
};

const styles = {
  section: {
    marginTop: 40,
    width: '100%',
    maxWidth: 680,
  },
  heading: {
    color: '#e8f0fe',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
  },
  desc: {
    color: '#a0aec0',
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
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '14px 18px',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  tier: {
    color: '#e8f0fe',
    fontWeight: 600,
    fontSize: 14,
  },
  date: {
    color: '#a0aec0',
    fontSize: 12,
  },
  btn: {
    padding: '6px 14px',
    background: '#4a90d9',
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
    color: '#fc8181',
    background: 'rgba(252,129,129,0.1)',
    border: '1px solid rgba(252,129,129,0.3)',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 13,
  },
};

async function downloadPdfForPurchase(purchase) {
  const { assessmentData } = purchase;
  const scoresStr = JSON.stringify(assessmentData.scores);
  const params = new URLSearchParams({
    overall: String(assessmentData.overall),
    dominantType: assessmentData.dominantType,
    scores: scoresStr,
  });

  const genRes = await fetch(`/api/report/generate?${params.toString()}`);
  if (!genRes.ok) {
    const body = await genRes.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to start report generation');
  }
  const genData = await genRes.json();
  const { hash } = genData;

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const statusRes = await fetch(`/api/report/status?hash=${encodeURIComponent(hash)}`);
    const statusData = await statusRes.json();
    if (statusData.status === 'ready') {
      window.location.href = `/api/report/download?hash=${encodeURIComponent(hash)}`;
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
 */
export default function ResultsHistory({ email }) {
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
      await downloadPdfForPurchase(purchase);
    } catch (err) {
      setDownloadError(err.message || 'Download failed. Please try again.');
    } finally {
      setDownloadingIdx(null);
    }
  };

  return (
    <section style={styles.section} aria-labelledby="priorReportsHeading">
      <h3 id="priorReportsHeading" style={styles.heading}>
        💾 Prior Report Purchases
      </h3>
      <p style={styles.desc}>
        Each purchased report is always available for re-download. Use the{' '}
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
                <span style={styles.tier}>{tierLabel}</span>
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
