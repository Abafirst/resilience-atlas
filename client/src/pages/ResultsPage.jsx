import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiFetch } from '../lib/apiFetch.js';
import ResultsHistory from '../components/ResultsHistory.jsx';
import IntegratedResilienceWheel from '../components/IntegratedResilienceWheel.jsx';
import GameIcon from '../components/GameIcon.jsx';
import UnlockReportModal from '../components/UnlockReportModal.jsx';
import AssessmentHistory from '../components/AssessmentHistory.jsx';
import DimensionModal from '../components/DimensionModal.jsx';
import { isStarterOrAbove, isNavigatorOrAbove } from '../data/gamificationContent.js';
import DarkModeHint from '../components/DarkModeHint.jsx';
import AndroidWebModal from '../components/AndroidWebModal.jsx';
import InAppWebsiteOnlyNotice from '../components/InAppWebsiteOnlyNotice.jsx';
import { isCapacitorAndroid } from '../utils/platform.js';

const GAME_ICON_PATH_RE = /^\/icons\/games\/([a-z0-9-]+)\.svg$/i;

// ── Branded SVG Icon set ───────────────────────────────────────────────────
const BRAND_ICONS = {
  chart: (
    <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>
  ),
  compass: (
    <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></>
  ),
  map: (
    <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></>
  ),
  document: (
    <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>
  ),
  flask: (
    <><path d="M6 2v6l-2 3.5A4 4 0 0 0 7.5 18h9a4 4 0 0 0 3.5-6.5L18 8V2"/><line x1="6" y1="2" x2="18" y2="2"/><line x1="9" y1="11" x2="15" y2="11"/></>
  ),
  target: (
    <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>
  ),
  sparkle: (
    <><path d="M12 2 L14.4 9.6 L22 12 L14.4 14.4 L12 22 L9.6 14.4 L2 12 L9.6 9.6 Z"/></>
  ),
  star: (
    <><path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 22 12 17.8 5.8 22l2.4-8.1L2 9.4h7.6z"/></>
  ),
  bell: (
    <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>
  ),
  megaphone: (
    <><path d="M3 11l19-9-9 19-2-8-8-2z"/></>
  ),
  users: (
    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
  ),
  archive: (
    <><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></>
  ),
  lock: (
    <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>
  ),
  mail: (
    <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>
  ),
};

function BrandIcon({ name, size = 18, color = 'currentColor', style: extraStyle }) {
  const paths = BRAND_ICONS[name];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...extraStyle }}
    >
      {paths}
    </svg>
  );
}

// ── Upsell system constants (ported from upsell-system.js) ─────────────────
const UPSELL_COOLDOWN_KEY   = 'upsell_cooldown';
const UPSELL_SESSION_KEY    = 'upsell_session_id';
const UPSELL_VARIANT_KEY    = 'upsell_ab_variant';
const UPSELL_COOLDOWN_MS    = 24 * 60 * 60 * 1000; // 24 hours
const UPSELL_OFFER_HOURS    = 48;
const UPSELL_FIRST_VISIT_KEY = 'first_visit_ts';
const UPSELL_VARIANTS       = ['control', 'variant_a', 'variant_b', 'variant_c'];

// A/B variant copy matrix
const UPSELL_VARIANT_COPY = {
  control: {
    'atlas-navigator': {
      headline: 'Unlock Your Full Resilience Analysis',
      subtext:  'Get personalized insights for all 6 dimensions, a downloadable PDF report, and tailored growth strategies — one-time payment, lifetime access.',
      ctaLabel: 'Get Deep Report — $49.99',
      offer:    null,
    },
    'atlas-premium': {
      headline: 'Take Your Resilience Journey Further',
      subtext:  'Track progress over time, compare results, and access unlimited reassessments with a lifetime Atlas Premium license.',
      ctaLabel: 'Upgrade to Atlas Premium — $49.99',
      offer:    null,
    },
  },
  variant_a: {
    'atlas-navigator': {
      headline: "You're in the Top 20% — Unlock What's Holding You Back",
      subtext:  'Your free report shows your strengths. The Deep Report reveals your hidden growth frontiers with expert strategies for every dimension.',
      ctaLabel: 'Unlock My Deep Report ($49.99)',
      offer:    null,
    },
    'atlas-premium': {
      headline: 'Most People See Results in 30 Days',
      subtext:  'Atlas Premium members track their resilience growth over time. Lifetime access, zero subscriptions.',
      ctaLabel: 'Start My Journey — $49.99',
      offer:    null,
    },
  },
  variant_b: {
    'atlas-navigator': {
      headline: 'Complete Your Resilience Atlas',
      subtext:  "You've completed the assessment — now go deeper. Full dimension analysis, personalized strategies, and a beautiful PDF to keep forever.",
      ctaLabel: 'Get the Full Report — $49.99 Lifetime',
      offer:    { label: 'Limited Offer: Founding Member Price', savingText: 'Lifetime access for just $49.99' },
    },
    'atlas-premium': {
      headline: 'Lifetime Access — No Subscriptions Ever',
      subtext:  'One payment. Unlimited reassessments, evolution tracking, growth pathways, and priority support. No recurring charges.',
      ctaLabel: 'Unlock Atlas Premium — $49.99 Lifetime',
      offer:    { label: 'Limited Offer: Founding Member Price', savingText: 'Lifetime access for just $49.99' },
    },
  },
  variant_c: {
    'atlas-navigator': {
      headline: 'Your Resilience Profile Is Only Half Complete',
      subtext:  'The free report covers the basics. Upgrade to uncover the full picture: all 6 dimensions, your stress profile, and a 30-day action plan.',
      ctaLabel: 'Complete My Profile — $49.99',
      offer:    null,
    },
    'atlas-premium': {
      headline: 'Compare. Grow. Repeat.',
      subtext:  'Atlas Premium unlocks side-by-side comparisons, historical trends, and unlimited retakes — so you can measure real progress.',
      ctaLabel: 'Get Lifetime Access — $49.99',
      offer:    null,
    },
  },
};

// Value propositions catalog
const UPSELL_VALUE_PROPS = {
  detailed_analytics:  { icon: '/icons/leaderboards.svg', text: 'Detailed analytics across all 6 resilience dimensions' },
  comparison:          { icon: '/icons/growth.svg', text: 'Side-by-side comparison with your previous assessments' },
  priority_support:    { icon: '/icons/connection.svg', text: 'Priority email support from our resilience coaches' },
  ad_free:             { icon: '/icons/lock.svg', text: 'Completely ad-free experience throughout the app' },
  pdf_download:        { icon: '/icons/story.svg', text: 'Beautiful downloadable PDF report you keep forever' },
  unlimited_retakes:   { icon: '/icons/compass.svg', text: 'Unlimited reassessments to track your growth' },
  growth_roadmap:      { icon: '/icons/game-map.svg', text: 'Full 30-day in-app practice roadmap + daily email guidance' },
  benchmarking:        { icon: '/icons/advanced-leaderboards.svg', text: 'See how you rank against thousands of users' },
};

// ── Upsell helpers ────────────────────────────────────────────────────────
function upsellGetSessionId() {
  try {
    let id = localStorage.getItem(UPSELL_SESSION_KEY);
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2, 10) +
           Math.random().toString(36).slice(2, 10);
      localStorage.setItem(UPSELL_SESSION_KEY, id);
    }
    return id;
  } catch (_) { return 'sess_unknown'; }
}

function upsellGetVariant() {
  try {
    let v = localStorage.getItem(UPSELL_VARIANT_KEY);
    if (!v || !UPSELL_VARIANTS.includes(v)) {
      const id   = upsellGetSessionId();
      const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      v = UPSELL_VARIANTS[hash % UPSELL_VARIANTS.length];
      localStorage.setItem(UPSELL_VARIANT_KEY, v);
    }
    return v;
  } catch (_) { return 'control'; }
}

function upsellGetCopy(targetTier) {
  const variant = upsellGetVariant();
  return (UPSELL_VARIANT_COPY[variant] || UPSELL_VARIANT_COPY.control)[targetTier] ||
         UPSELL_VARIANT_COPY.control[targetTier];
}

function upsellIsOnCooldown() {
  try {
    const last = parseInt(localStorage.getItem(UPSELL_COOLDOWN_KEY) || '0', 10);
    return Date.now() - last < UPSELL_COOLDOWN_MS;
  } catch (_) { return false; }
}

function upsellSetCooldown() {
  try { localStorage.setItem(UPSELL_COOLDOWN_KEY, String(Date.now())); } catch (_) {}
}

function upsellIsOfferActive() {
  try {
    const metaEl = document.querySelector('meta[name="upsell-offer"]');
    if (metaEl) {
      const exp = metaEl.getAttribute('data-expires');
      if (exp) return Date.now() < new Date(exp).getTime();
      return true;
    }
    const firstVisit = parseInt(localStorage.getItem(UPSELL_FIRST_VISIT_KEY) || String(Date.now()), 10);
    if (!localStorage.getItem(UPSELL_FIRST_VISIT_KEY)) {
      localStorage.setItem(UPSELL_FIRST_VISIT_KEY, String(firstVisit));
    }
    return Date.now() - firstVisit < UPSELL_OFFER_HOURS * 60 * 60 * 1000;
  } catch (_) { return false; }
}

function upsellTrack(eventType, trigger, targetTier, extra) {
  try {
    const payload = {
      sessionId:  upsellGetSessionId(),
      trigger,
      variant:    upsellGetVariant(),
      targetTier,
      eventType,
      userTier:   (localStorage.getItem('resilience_tier') || 'free'),
      offerShown: Boolean(extra && extra.offerShown),
      campaign:   (extra && extra.campaign) || null,
      pageUrl:    window.location.pathname,
    };
    fetch('/api/upsell/event', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    }).catch(() => {});
  } catch (_) {}
}

// ── UpsellModal component ─────────────────────────────────────────────────
function UpsellModal({ targetTier, trigger, onClose, onUpgrade }) {
  const copy        = upsellGetCopy(targetTier);
  const offerActive = upsellIsOfferActive() && Boolean(copy && copy.offer);
  const propKeys    = targetTier === 'atlas-navigator'
    ? ['detailed_analytics', 'pdf_download', 'growth_roadmap', 'benchmarking']
    : ['comparison', 'unlimited_retakes', 'detailed_analytics', 'ad_free'];

  // Capture stable copies so the effect closure never goes stale.
  const tierRef    = useRef(targetTier);
  const triggerRef = useRef(trigger);
  const offerRef   = useRef(offerActive);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    const t = tierRef.current, tr = triggerRef.current, of = offerRef.current;
    upsellTrack('impression', tr, t, { offerShown: of });

    function onKey(e) {
      if (e.key === 'Escape') {
        upsellTrack('dismiss', tr, t, { offerShown: of });
        upsellSetCooldown();
        onCloseRef.current();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleDismiss() {
    upsellTrack('dismiss', trigger, targetTier, { offerShown: offerActive });
    upsellSetCooldown();
    onClose();
  }

  function handleCta() {
    upsellTrack('click', trigger, targetTier, { offerShown: offerActive });
    onClose();
    onUpgrade(targetTier);
  }

  return (
    <div
      className="upsell-modal-backdrop"
      id="upsell-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upsell-modal-title"
      onClick={e => { if (e.target.id === 'upsell-modal-backdrop') handleDismiss(); }}
    >
      <div className="upsell-modal">
        <button
          className="upsell-modal__close"
          id="upsell-modal-dismiss"
          aria-label="Dismiss upgrade prompt"
          onClick={handleDismiss}
        >
          &#10005;
        </button>

        {offerActive && copy.offer && (
          <>
            <div className="upsell-offer-badge">{copy.offer.label}</div>
            <p className="upsell-offer-saving">{copy.offer.savingText}</p>
          </>
        )}

        <div className="upsell-modal__header">
          <span className="upsell-premium-badge">
            <img src="/icons/star.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Premium
          </span>
          <h2 id="upsell-modal-title" className="upsell-modal__title">{copy.headline}</h2>
          <p className="upsell-modal__subtext">{copy.subtext}</p>
        </div>

        <ul className="upsell-value-list" aria-label="Included features">
          {propKeys.map(k => {
            const p = UPSELL_VALUE_PROPS[k];
            if (!p) return null;
            return (
              <li key={k} className="upsell-value-prop">
                <span className="upsell-value-prop__icon" aria-hidden="true"><img src={p.icon} alt="" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /></span>
                <span>{p.text}</span>
              </li>
            );
          })}
        </ul>

        <div className="upsell-modal__actions">
          <button
            className="btn upsell-cta-btn"
            id="upsell-cta"
            data-tier={targetTier}
            aria-label={copy.ctaLabel}
            onClick={handleCta}
          >
            {copy.ctaLabel}
          </button>
          <button className="upsell-maybe-later" id="upsell-maybe-later" onClick={handleDismiss}>
            Maybe later
          </button>
        </div>

        <p className="upsell-trust-note">
          <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
          Secure checkout · One-time payment · No recurring charges
        </p>
      </div>
    </div>
  );
}

// ── UpgradeCardsSection component ─────────────────────────────────────────
const STARTER_FEATURES   = [
  'Full PDF summary report',
  'Overall resilience score',
  'Top dimension highlights',
  '12 in-app starter micro-practices',
  'No daily micro-practice emails',
];
const NAVIGATOR_FEATURES = [
  'Detailed explanation of all 6 resilience dimensions',
  'Deeper interpretation of your strengths',
  'Personalized narrative analysis',
  'Recommended growth strategies',
  'All 30 in-app micro-practices (30-day track)',
  'Daily micro-practice email (1 per day)',
  'Downloadable PDF report: 1 every 30 days (per user)',
  'One-time purchase — use anytime',
];

/**
 * Generate and trigger download of an .ics calendar event file.
 * @param {string} dateStr  ISO date string for the event start time.
 */
function downloadIcsReminder(dateStr) {
  const eventDate = dateStr ? new Date(dateStr) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const dtStart = fmt(eventDate);
  const dtEnd   = fmt(new Date(eventDate.getTime() + 60 * 60 * 1000)); // +1 hour
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Resilience Atlas//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    'SUMMARY:Resilience Atlas: PDF report available',
    'DESCRIPTION:Your Atlas Navigator PDF report is now available. Visit https://app.resilienceatlas.com to download it.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'resilience-atlas-reminder.ics';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Modal shown when the Atlas Navigator 30-day PDF quota is exceeded.
 */
function PdfQuotaModal({ nextAvailableAt, onClose }) {
  const dateLabel = React.useMemo(() => {
    if (!nextAvailableAt) return 'in 30 days';
    try {
      return new Date(nextAvailableAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch (_) { return 'in 30 days'; }
  }, [nextAvailableAt]);

  const handleRemind = React.useCallback(() => {
    downloadIcsReminder(nextAvailableAt);
    onClose();
  }, [nextAvailableAt, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-quota-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, padding: '2rem 2rem 1.5rem',
        maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: 8 }} aria-hidden="true"><img src="/icons/compass.svg" alt="" width={36} height={36} /></div>
        <h2 id="pdf-quota-title" style={{ margin: '0 0 0.75rem', fontSize: '1.2rem', color: '#1e293b' }}>
          Report Limit Reached
        </h2>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Your next report will be available on <strong>{dateLabel}</strong>.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.6rem 1.4rem', borderRadius: 8, border: '1px solid #cbd5e1',
              background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            OK
          </button>
          <button
            type="button"
            onClick={handleRemind}
            style={{
              padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Remind me in 30 days
          </button>
        </div>
      </div>
    </div>
  );
}

function UpgradeCardsSection({ getPrice, onUpgrade, checkoutLoading }) {
  return (
    <div className="upgrade-comparison" role="region" aria-label="Upgrade options" id="upgradeCardsContainer">
      <h2 className="upgrade-comparison__title">Unlock Your Full Resilience Report</h2>
      <p className="upgrade-comparison__subtitle">
        Your on-screen summary is always free. Upgrade to Atlas Starter or Atlas Navigator to download/email the full PDF report and unlock premium practice pathways.
      </p>
      <div className="upgrade-cards-grid">
        {/* Atlas Starter */}
        <div className="upgrade-card upgrade-card--atlas-starter" role="article" aria-labelledby="upgrade-title-atlas-starter">
          <div className="upgrade-card__header">
            <span className="upgrade-badge badge-green">STARTER</span>
            <h3 id="upgrade-title-atlas-starter" className="upgrade-card__title">Atlas Starter</h3>
            <p className="upgrade-card__price" data-price-tier="atlas-starter">{getPrice('atlas-starter')}</p>
            <p className="upgrade-card__description">
              Unlock this assessment’s full PDF report with download + email delivery, plus the 12-practice starter track.
            </p>
          </div>
          <ul className="upgrade-card__features" aria-label="Features included in Atlas Starter">
            {STARTER_FEATURES.map(f => (
              <li key={f}><span aria-hidden="true">&#10003;</span> {f}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-upgrade"
            data-tier="atlas-starter"
            aria-label={`Unlock Atlas Starter for ${getPrice('atlas-starter')}`}
            onClick={() => onUpgrade('atlas-starter')}
            disabled={!!checkoutLoading}
            aria-busy={checkoutLoading === 'atlas-starter'}
          >
            {checkoutLoading === 'atlas-starter'
              ? 'Redirecting…'
              : `Get Starter Report — ${getPrice('atlas-starter')}`}
          </button>
          <p className="upgrade-card__trust">
            <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Secure checkout via Stripe &nbsp;|&nbsp; No subscription required
          </p>
        </div>

        {/* Atlas Navigator */}
        <div className="upgrade-card upgrade-card--atlas-navigator" role="article" aria-labelledby="upgrade-title-atlas-navigator">
          <div className="upgrade-card__header">
            <span className="upgrade-badge badge-blue">POPULAR</span>
            <h3 id="upgrade-title-atlas-navigator" className="upgrade-card__title">Atlas Navigator</h3>
            <p className="upgrade-card__price" data-price-tier="atlas-navigator">{getPrice('atlas-navigator')}</p>
            <p className="upgrade-card__description">
              Download/email your complete Deep Resilience Report PDF. Includes all 30 in-app practices plus daily practice emails.
            </p>
          </div>
          <ul className="upgrade-card__features" aria-label="Features included in Atlas Navigator">
            {NAVIGATOR_FEATURES.map(f => (
              <li key={f}><span aria-hidden="true">&#10003;</span> {f}</li>
            ))}
          </ul>
          <button
            type="button"
            className="btn btn-upgrade"
            data-tier="atlas-navigator"
            aria-label={`Unlock Atlas Navigator for ${getPrice('atlas-navigator')}`}
            onClick={() => onUpgrade('atlas-navigator')}
            disabled={!!checkoutLoading}
            aria-busy={checkoutLoading === 'atlas-navigator'}
          >
            {checkoutLoading === 'atlas-navigator'
              ? 'Redirecting…'
              : `Get My Deep Report — ${getPrice('atlas-navigator')}`}
          </button>
          <p className="upgrade-card__trust">
            <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: "middle", marginRight: 5 }} />Secure checkout via Stripe &nbsp;|&nbsp; No subscription required
          </p>
        </div>
      </div>
      <p className="upgrade-comparison__disclaimer">
        For educational and self-reflection purposes only. Not a clinical diagnosis.
      </p>
    </div>
  );
}

// ── Dimension accent colors (mirror results.js / scoring.js) ─────────────
const DIM_COLORS = {
  'Cognitive-Narrative':   '#4F46E5',
  'Relational-Connective': '#059669',
  'Agentic-Generative':    '#D97706',
  'Emotional-Adaptive':    '#DC2626',
  'Spiritual-Reflective':  '#7C3AED',
  'Somatic-Regulative':    '#0891B2',
};

const DIM_ICONS = {
  'Cognitive-Narrative':   '/icons/cognitive-narrative.svg',
  'Relational-Connective': '/icons/relational-connective.svg',
  'Agentic-Generative':    '/icons/agentic-generative.svg',
  'Emotional-Adaptive':    '/icons/emotional-adaptive.svg',
  'Spiritual-Reflective':  '/icons/spiritual-reflective.svg',
  'Somatic-Regulative':    '/icons/somatic-regulative.svg',
};

const TIER_FEATURES = {
  'atlas-starter': [
    'Full PDF report for this assessment',
    'Email the full PDF to your inbox',
    'Overall resilience score',
    'Top dimension highlights',
    '12 in-app starter micro-practices',
    'No daily micro-practice emails',
  ],
  'atlas-navigator': [
    'Detailed explanation of all 6 resilience dimensions',
    'Deeper interpretation of your strengths',
    'Personalized narrative analysis',
    'Recommended growth strategies',
    'All 30 in-app micro-practices (30-day track)',
    'Daily micro-practice email (1 per day)',
    'Downloadable + emailable full PDF report',
  ],
  'atlas-premium': [
    'Everything in Atlas Navigator',
    'Resilience evolution tracking (historical comparison)',
    'Unlimited reassessments',
    'Personalized growth pathway',
    'Micro-practice progress tracking',
  ],
};

// ── Type descriptions (ported from legacy results.js) ─────────────────────
const TYPE_DESCRIPTIONS = {
  'Cognitive-Narrative':
    'Your resilience is driven by meaning-making and reframing life experiences. ' +
    'You find strength in narrative coherence and the ability to construct meaningful ' +
    'stories from challenging events.',
  'Relational-Connective':
    'Your resilience is strengthened through connection, trust, and supportive ' +
    'relationships. You thrive when you have people to lean on and meaningful bonds ' +
    'that sustain you.',
  'Agentic-Generative':
    'You demonstrate resilience through purposeful action and forward momentum. ' +
    'You are energized by taking charge, creating change, and generating new ' +
    'possibilities even in difficulty.',
  'Emotional-Adaptive':
    'You show flexibility in managing emotions and adapting to stress. You can ' +
    'recognize, tolerate, and work skillfully with a wide range of emotional experiences.',
  'Spiritual-Reflective':
    'Your resilience is grounded in purpose, values, and a sense of meaning beyond ' +
    'yourself. You draw strength from a coherent worldview and connection to something larger.',
  'Somatic-Regulative':
    'You rely on body awareness and behavioral habits to stabilize and recover from ' +
    'stress. Your physical practices and consistent routines provide a reliable foundation.',
};

// ── Personalized next steps per dimension (ported from legacy results.js) ──
const DIMENSION_NEXT_STEPS = {
  'Agentic-Generative': [
    { icon: '/icons/goal.svg', title: 'Set a Micro-Goal', desc: 'Identify one small, concrete action you can take this week toward a goal that matters to you.' },
    { icon: '/icons/planning.svg', title: 'Action Planning', desc: 'Write down 3 steps you can take in the next 30 days to move forward on a challenge.' },
    { icon: '/icons/strength.svg', title: 'Practice Agency', desc: 'Each morning, choose one thing you have control over and take action on it intentionally.' },
  ],
  'Relational-Connective': [
    { icon: '/icons/connection.svg', title: 'Reach Out', desc: "Connect with one trusted person this week — share something real about how you're doing." },
    { icon: '/icons/network.svg', title: 'Strengthen Bonds', desc: 'Schedule a regular check-in with a colleague, friend, or family member to deepen connection.' },
    { icon: '/icons/dialog.svg', title: 'Vulnerable Conversation', desc: 'Practice asking for support in a low-stakes situation to build comfort with relying on others.' },
  ],
  'Spiritual-Reflective': [
    { icon: '/icons/mindfulness.svg', title: 'Values Reflection', desc: 'Spend 5 minutes writing about what gives your life meaning and how a recent challenge relates to your values.' },
    { icon: '/icons/reflection.svg', title: 'Gratitude Practice', desc: "Each evening, note 3 things you're grateful for — include at least one thing from a difficult moment." },
    { icon: '/icons/meditation.svg', title: 'Purpose Meditation', desc: 'Try a 10-minute guided meditation focused on purpose and what you want to contribute to the world.' },
  ],
  'Emotional-Adaptive': [
    { icon: '/icons/emotion.svg', title: 'Emotion Naming', desc: 'When you notice a strong emotion, pause and name it specifically — this activates your prefrontal cortex and reduces intensity.' },
    { icon: '/icons/growth.svg', title: 'RAIN Practice', desc: 'Use the RAIN technique: Recognize, Allow, Investigate, Nurture. Apply it to one difficult emotion today.' },
    { icon: '/icons/journal.svg', title: 'Emotional Journal', desc: 'Write for 5 minutes daily about your emotional experiences — what triggered them and what they may be communicating.' },
  ],
  'Somatic-Regulative': [
    { icon: '/icons/breathing.svg', title: 'Mindful Breathing', desc: 'Practice 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8. Do this for 3 cycles when stressed.' },
    { icon: '/icons/movement.svg', title: 'Movement as Medicine', desc: 'Add a 15-minute intentional walk to your daily routine — notice how your body and mood shift.' },
    { icon: '/icons/sleep.svg', title: 'Sleep Hygiene', desc: 'Establish a consistent sleep-wake schedule this week. A regular rhythm boosts resilience significantly.' },
  ],
  'Cognitive-Narrative': [
    { icon: '/icons/writing.svg', title: 'Morning Pages', desc: 'Write 3 pages of stream-of-consciousness every morning to process your experiences and reframe challenges.' },
    { icon: '/icons/reframe.svg', title: 'Reframing Exercise', desc: 'When facing a setback, ask: "What is one alternative way to interpret this?" Write down 3 possibilities.' },
    { icon: '/icons/story.svg', title: 'Story Integration', desc: 'Reflect on a past difficulty: What did you learn? How did it shape who you are? Write your "resilience story."' },
  ],
};

// ── Affirmations (condensed — 3 per dimension, from affirmations.js) ─────────
const AFFIRMATIONS = {
  'Cognitive-Narrative': [
    'I can reinterpret setbacks in a way that helps me move forward.',
    'When things go wrong, I try to find meaning in the experience.',
    'I can step back and see challenges from a broader perspective.',
  ],
  'Relational-Connective': [
    'I am worthy of support, and I am willing to ask for it.',
    'My connections with others are a genuine source of strength.',
    'I can be vulnerable with safe people and grow through it.',
  ],
  'Agentic-Generative': [
    'I am capable of taking meaningful action, even in difficult circumstances.',
    'Each step forward — no matter how small — is evidence of my resilience.',
    'I create change by focusing on what I can control.',
  ],
  'Emotional-Adaptive': [
    'My emotions are information, not obstacles.',
    'I can feel difficult emotions and still move forward with purpose.',
    'I am learning to respond to stress with awareness rather than reaction.',
  ],
  'Spiritual-Reflective': [
    'My life has meaning and purpose, even in difficult moments.',
    'I am grounded in my values, and they guide me through uncertainty.',
    'I find strength in connecting to something larger than myself.',
  ],
  'Somatic-Regulative': [
    'My body is a resource for resilience, and I am learning to listen to it.',
    'I can return to calm through breath, movement, and rest.',
    'My physical habits are the foundation of my emotional strength.',
  ],
};

// ── Evidence-based practices (condensed — 2 per dimension, from evidence-based-practices.js) ──
const EVIDENCE_PRACTICES = {
  'Cognitive-Narrative': [
    { icon: '/icons/cognitive-narrative.svg', title: 'Reframing Journal', duration: '5 min', difficulty: 'beginner',
      instructions: ['Write down one recent challenge.', 'Describe your first interpretation.', 'Now write an alternative story: What strengths did you use? What did you learn?', 'End with one sentence about how this contributes to your growth.'],
      actPrinciple: 'Cognitive Defusion', abaPrinciple: 'Differential Reinforcement of Adaptive Interpretations' },
    { icon: '/icons/cognitive-narrative.svg', title: 'Leaves on a Stream', duration: '5 min', difficulty: 'beginner',
      instructions: ['Sit comfortably and close your eyes.', 'Imagine a gently flowing stream with leaves drifting on the surface.', 'As thoughts arise, place each one on a leaf and watch it float away.', 'Notice that you are the observer of thoughts, not the thoughts themselves.'],
      actPrinciple: 'Cognitive Defusion', abaPrinciple: 'Attention Control' },
  ],
  'Relational-Connective': [
    { icon: '/icons/relational-connective.svg', title: 'Empathic Listening', duration: '10 min', difficulty: 'beginner',
      instructions: ['Choose a conversation today where you focus entirely on listening.', 'Resist the urge to offer advice or share your own experience.', 'Reflect back what you heard: "It sounds like you feel…"', 'Notice how the other person responds when they feel truly heard.'],
      actPrinciple: 'Values Alignment', abaPrinciple: 'Behavioral Shaping' },
    { icon: '/icons/relational-connective.svg', title: 'Connection Scheduling', duration: '5 min', difficulty: 'beginner',
      instructions: ['Identify two people you care about but haven\'t connected with recently.', 'Schedule a specific time to reach out — call, message, or meet.', 'Commit to the connection in your calendar.', 'After connecting, notice any shift in your mood or sense of belonging.'],
      actPrinciple: 'Committed Action', abaPrinciple: 'Behavior Shaping' },
  ],
  'Agentic-Generative': [
    { icon: '/icons/agentic-generative.svg', title: 'One Small Step', duration: '5 min', difficulty: 'beginner',
      instructions: ['Think of a goal or aspiration you\'ve been putting off.', 'Identify the very smallest first step that would move you toward it.', 'Make it so small it feels almost too easy.', 'Do that one step right now or schedule it for today.'],
      actPrinciple: 'Committed Action', abaPrinciple: 'Goal Shaping' },
    { icon: '/icons/agentic-generative.svg', title: 'Values Compass Check', duration: '5 min', difficulty: 'beginner',
      instructions: ['Write down three things you care most deeply about.', 'Look at how you spent your time and energy in the past 48 hours.', 'Rate each value: How much did your actions align with it? (1–10)', 'Name one specific action you can take tomorrow to move toward that alignment.'],
      actPrinciple: 'Values Alignment', abaPrinciple: 'Goal Shaping' },
  ],
  'Emotional-Adaptive': [
    { icon: '/icons/emotional-adaptive.svg', title: 'Emotion Labeling', duration: '3 min', difficulty: 'beginner',
      instructions: ['When you notice a strong emotion, pause.', 'Name it specifically — not just "bad" but "frustrated" or "anxious".', 'Say to yourself: "I notice I am feeling ___."', 'Observe how naming it changes your relationship to the feeling.'],
      actPrinciple: 'Cognitive Defusion', abaPrinciple: 'Functional Behavior Analysis' },
    { icon: '/icons/emotional-adaptive.svg', title: 'RAIN Practice', duration: '5 min', difficulty: 'beginner',
      instructions: ['Recognize: Name the emotion you\'re experiencing.', 'Allow: Let the feeling be present without pushing it away.', 'Investigate: With curiosity, notice where you feel it in your body.', 'Nurture: Offer yourself a kind word or gesture.'],
      actPrinciple: 'Acceptance', abaPrinciple: 'Differential Reinforcement' },
  ],
  'Spiritual-Reflective': [
    { icon: '/icons/spiritual-reflective.svg', title: 'Values Reflection', duration: '5 min', difficulty: 'beginner',
      instructions: ['Spend 5 minutes writing about what gives your life meaning.', 'How does a recent challenge relate to your values?', 'What does this experience reveal about what matters most to you?', 'Write one sentence connecting your challenge to your purpose.'],
      actPrinciple: 'Values Clarification', abaPrinciple: 'Establishing Operations for Meaning-Seeking' },
    { icon: '/icons/spiritual-reflective.svg', title: 'Gratitude Practice', duration: '3 min', difficulty: 'beginner',
      instructions: ['Each evening, note 3 things you\'re grateful for.', 'Include at least one thing from a difficult moment.', 'For each, briefly write why it matters to you.', 'Notice any shift in your perspective after this practice.'],
      actPrinciple: 'Values Alignment', abaPrinciple: 'Positive Reinforcement of Adaptive Cognition' },
  ],
  'Somatic-Regulative': [
    { icon: '/icons/somatic-regulative.svg', title: '4-7-8 Breathing', duration: '3 min', difficulty: 'beginner',
      instructions: ['Sit comfortably with your back straight.', 'Inhale through your nose for 4 counts.', 'Hold your breath for 7 counts.', 'Exhale completely through your mouth for 8 counts.', 'Repeat 3–4 cycles.'],
      actPrinciple: 'Present-Moment Awareness', abaPrinciple: 'Physiological Self-Regulation' },
    { icon: '/icons/somatic-regulative.svg', title: 'Movement as Medicine', duration: '15 min', difficulty: 'beginner',
      instructions: ['Schedule a 15-minute intentional walk today.', 'Leave your phone in your pocket and walk without a destination.', 'Notice physical sensations — your breath, the ground underfoot.', 'Observe how your mood shifts during and after the walk.'],
      actPrinciple: 'Present-Moment Awareness', abaPrinciple: 'Behavioral Activation' },
  ],
};

// ── Confetti animation (ported from legacy results.js) ──────────────────────
function runConfetti(canvas) {
  if (!canvas) return;
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 120 }, () => ({
    x:         Math.random() * canvas.width,
    y:         Math.random() * canvas.height - canvas.height,
    r:         4 + Math.random() * 6,
    d:         2 + Math.random() * 3,
    color:     ['#4F46E5','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#f59e0b','#10b981'][Math.floor(Math.random() * 8)],
    tilt:      Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: 0.05 + Math.random() * 0.05,
  }));

  let angle = 0;
  let frame;
  const duration = 3000;
  const start = Date.now();

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += p.d;
      p.x += Math.sin(angle) * 0.6;
      p.tilt = Math.sin(p.tiltAngle) * 12;
      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * 0.5, p.tilt * 0.1, 0, 2 * Math.PI);
      ctx.fill();
    });
    if (Date.now() - start < duration) {
      frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  draw();
  return () => { cancelAnimationFrame(frame); };
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = {
  // ── Site Header ──
  siteHeader: {
    background: 'rgba(255,255,255,0.97)',
    borderBottom: '1px solid #e2e8f0',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    padding: '0 24px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  headerInner: {
    maxWidth: 1100,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 62,
    gap: 16,
  },
  headerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#1a202c',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  headerNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  navLink: {
    color: '#4a5568',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
  },
  retakeBtn: {
    padding: '7px 16px',
    background: 'rgba(102,126,234,0.1)',
    color: '#667eea',
    border: '1px solid rgba(102,126,234,0.4)',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  journeyNavLink: {
    color: '#7c3aed',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
  },
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 60%, #f0fbff 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#1a202c',
    padding: '40px 20px 80px',
  },
  container: {
    maxWidth: 800,
    margin: '0 auto',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#718096',
    textDecoration: 'none',
    fontSize: 14,
    marginBottom: 28,
  },
  // ── No-results state ──
  emptyCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '48px 32px',
    textAlign: 'center',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: 700, marginBottom: 12, color: '#1a202c' },
  emptyDesc: { color: '#718096', fontSize: 15, marginBottom: 28, lineHeight: 1.6 },
  // ── Banner ──
  banner: (type) => ({
    borderRadius: 10,
    padding: '14px 18px',
    marginBottom: 24,
    fontSize: 14,
    lineHeight: 1.5,
    background: type === 'success'
      ? '#dcfce7'
      : type === 'warning'
        ? '#fef9c3'
        : '#fee2e2',
    border: `1px solid ${type === 'success' ? '#bbf7d0' : type === 'warning' ? '#fde68a' : '#fecaca'}`,
    color: type === 'success' ? '#065f46' : type === 'warning' ? '#92400e' : '#991b1b',
  }),
  // ── Score hero ──
  scoreHero: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '32px',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 28,
    flexWrap: 'wrap',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4a90d9, #7c3aed)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreNum: { fontSize: 30, fontWeight: 800, lineHeight: 1, color: '#ffffff' },
  scorePct: { fontSize: 13, opacity: 0.85, color: '#ffffff' },
  scoreInfo: { flex: 1 },
  scoreName: { fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#1a202c' },
  scoreSub: { color: '#718096', fontSize: 14, lineHeight: 1.5 },
  // ── Dimension bars ──
  dimSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  dimHeading: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#2d3748' },
  dimRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  dimLabel: { minWidth: 190, fontSize: 13, color: '#374151' },
  dimBarWrap: {
    flex: 1,
    background: '#e2e8f0',
    borderRadius: 4,
    height: 10,
    overflow: 'hidden',
  },
  dimBarFill: (color, pct) => ({
    width: `${pct}%`,
    height: '100%',
    background: color,
    borderRadius: 4,
    transition: 'width 0.6s ease',
  }),
  dimPct: { minWidth: 38, textAlign: 'right', fontSize: 13, color: '#718096' },
  // ── Upgrade section ──
  upgradeHeading: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
    textAlign: 'center',
  },
  upgradeSubheading: {
    color: '#718096',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  upgradeCards: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  upgradeCard: (highlight) => ({
    flex: '1 1 240px',
    background: highlight ? '#faf5ff' : '#f0f7ff',
    border: `1px solid ${highlight ? 'rgba(124,58,237,0.4)' : 'rgba(74,144,217,0.3)'}`,
    borderRadius: 14,
    padding: '24px 22px',
    boxShadow: highlight ? '0 4px 20px rgba(124,58,237,0.1)' : '0 2px 12px rgba(0,0,0,0.04)',
  }),
  tierIcon: { fontSize: 28, marginBottom: 10 },
  tierBadge: (color) => ({
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    marginBottom: 10,
    textTransform: 'uppercase',
  }),
  tierName: { fontSize: 17, fontWeight: 700, marginBottom: 4, color: '#1a202c' },
  tierPrice: { fontSize: 26, fontWeight: 800, marginBottom: 2, color: '#1a202c' },
  tierBilling: { color: '#718096', fontSize: 12, marginBottom: 14 },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: 13, color: '#374151', lineHeight: 1.9 },
  checkmark: { color: '#10b981', marginRight: 6 },
  buyBtn: (color, disabled) => ({
    display: 'block',
    width: '100%',
    padding: '11px 0',
    background: disabled ? '#e2e8f0' : color,
    color: disabled ? '#718096' : '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'center',
  }),
  // ── PDF download section ──
  downloadSection: {
    background: '#f0fdf4',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 28,
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(16,185,129,0.08)',
  },
  downloadHeading: { fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#065f46' },
  downloadDesc: { color: '#4b5563', fontSize: 13, marginBottom: 20, lineHeight: 1.5 },
  downloadBtn: (loading) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 28px',
    background: loading ? 'rgba(16,185,129,0.4)' : '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
  }),
  // ── Primary CTA (quiz) button ──
  primaryBtn: {
    display: 'inline-block',
    padding: '13px 36px',
    background: '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 4px 20px rgba(74,144,217,0.35)',
  },
  secondaryBtn: {
    display: 'inline-block',
    padding: '13px 36px',
    background: 'transparent',
    color: '#4a90d9',
    border: '1px solid #4a90d9',
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'none',
    marginTop: 12,
    fontFamily: 'inherit',
  },
  retakeRow: {
    textAlign: 'center',
    marginTop: 12,
  },
  retakeLink: {
    color: '#718096',
    fontSize: 13,
    textDecoration: 'underline',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  // ── Narrative / guidance section ──
  narrativeSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  narrativeHeading: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 },
  strengthRow: (color) => ({
    borderLeft: `3px solid ${color}`,
    paddingLeft: 14,
    marginBottom: 18,
  }),
  strengthLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#718096',
    marginBottom: 2,
  },
  strengthName: (color) => ({
    fontSize: 15,
    fontWeight: 700,
    color,
    marginBottom: 4,
  }),
  strengthDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.6,
    margin: 0,
  },
  // ── Next steps section ──
  nextStepsSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  nextStepsHeading: { fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 },
  nextStepsIntro: { color: '#718096', fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
  nextStepsCard: (color) => ({
    borderLeft: `4px solid ${color}`,
    background: '#f8fafc',
    borderRadius: 8,
    padding: '14px 16px',
    marginBottom: 14,
  }),
  nextStepsCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nextStepsDimName: (color) => ({ fontSize: 14, fontWeight: 700, color }),
  nextStepsDimScore: { fontSize: 12, color: '#718096' },
  nextStepsList: { listStyle: 'none', padding: 0, margin: 0 },
  nextStepItem: {
    display: 'flex',
    gap: 10,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  nextStepIcon: { fontSize: 18, flexShrink: 0, lineHeight: 1.4 },
  nextStepIconImg: { width: 22, height: 22, flexShrink: 0, marginTop: 1 },
  nextStepTitle: { fontSize: 13, fontWeight: 600, color: '#1a202c', display: 'block', marginBottom: 2 },
  nextStepDesc: { fontSize: 12, color: '#718096', lineHeight: 1.5, margin: 0 },
  // ── Reminder opt-in section ──
  reminderSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  reminderHeading: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 },
  reminderDesc: { color: '#718096', fontSize: 13, marginBottom: 14, lineHeight: 1.5 },
  reminderCheckRow: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  reminderCheckbox: { marginTop: 2, accentColor: '#10b981', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 },
  reminderCheckLabel: { fontSize: 13, color: '#374151', lineHeight: 1.5, cursor: 'pointer' },
  reminderBtn: (disabled) => ({
    padding: '10px 22px',
    background: disabled ? 'rgba(16,185,129,0.3)' : '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  reminderStatus: (success) => ({
    marginTop: 10,
    fontSize: 13,
    color: success ? '#6ee7b7' : '#fc8181',
    lineHeight: 1.5,
  }),
  // ── Confetti canvas ──
  confettiCanvas: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 9999,
    display: 'none',
  },
  // ── Social share section ──
  shareSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  shareHeading: { fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 },
  shareDesc: { color: '#718096', fontSize: 13, marginBottom: 16, lineHeight: 1.5 },
  shareButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  sharePreview: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  shareInstagramHint: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 1.5,
    margin: 0,
  },
  // ── Quicklinks / footer nav section ──
  quicklinksSection: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 32,
    marginTop: 8,
    marginBottom: 24,
  },
  quicklinksGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 32,
    marginBottom: 24,
  },
  quicklinksGroup: {
    flex: '1 1 140px',
    minWidth: 120,
  },
  quicklinksGroupHeading: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#718096',
    marginBottom: 10,
  },
  quicklinksGroupLinks: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  quicklinkAnchor: {
    color: '#718096',
    fontSize: 13,
    textDecoration: 'none',
    lineHeight: 2,
    display: 'block',
    transition: 'color 0.15s',
  },
  socialFollowRow: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  socialFollowLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  footerBottom: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 16,
    fontSize: 12,
    color: '#4a5568',
    lineHeight: 1.8,
    textAlign: 'center',
  },
  // ── Free Brief Report ──
  freeBriefReport: {
    background: 'rgba(102,126,234,0.06)',
    border: '1px solid rgba(102,126,234,0.2)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(102,126,234,0.06)',
  },
  fbrHeading: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 },
  fbrHint: { fontSize: 12, color: '#718096', marginTop: 12, fontStyle: 'italic', lineHeight: 1.5 },
  // ── Primary Resilience Mode ──
  primaryTypeCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  primaryTypeHeading: { fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 10 },
  primaryTypeName: (color) => ({
    fontSize: 22,
    fontWeight: 800,
    color: color || '#1a202c',
    marginBottom: 10,
  }),
  primaryTypeDesc: { fontSize: 14, color: '#718096', lineHeight: 1.7, margin: 0 },
  // ── Insight Progress Indicator (free users) ──
  insightProgress: {
    background: 'rgba(102,126,234,0.06)',
    border: '1px solid rgba(102,126,234,0.2)',
    borderRadius: 12,
    padding: '16px 24px',
    marginBottom: 24,
    textAlign: 'center',
  },
  insightProgressLabel: { fontSize: 13, color: '#4a5568', marginBottom: 8 },
  insightProgressBarWrap: {
    background: '#e2e8f0',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  insightProgressBarFill: {
    width: '40%',
    height: '100%',
    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
    borderRadius: 999,
    transition: 'width 0.8s ease',
  },
  insightProgressHint: { fontSize: 12, color: '#718096', margin: 0 },
  // ── Personalized Report ──
  reportSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  reportHeading: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 },
  reportOverview: { fontSize: 14, color: '#4a5568', marginBottom: 16, lineHeight: 1.7 },
  reportNrSection: (color) => ({
    borderLeft: `3px solid ${color}`,
    paddingLeft: 14,
    marginBottom: 18,
  }),
  reportNrHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportNrLabel: { fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: '0.06em' },
  reportNrScore: (color) => ({
    background: color,
    color: '#fff',
    borderRadius: 4,
    padding: '1px 8px',
    fontSize: 12,
    fontWeight: 700,
  }),
  reportNrName: (color) => ({ fontSize: 15, fontWeight: 700, color, marginBottom: 4 }),
  reportNrDesc: { fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 4 },
  reportNrInsight: { fontSize: 12, color: '#718096', fontStyle: 'italic', lineHeight: 1.5, margin: 0 },
  reportSuggestions: { marginTop: 16, paddingTop: 14, borderTop: '1px solid #e2e8f0' },
  reportSuggestionsTitle: { fontSize: 13, fontWeight: 700, color: '#2d3748', marginBottom: 8 },
  reportSuggestionsList: { listStyle: 'none', padding: 0, margin: 0, fontSize: 13, color: '#4a5568', lineHeight: 1.9 },
  reportSuggestionsLi: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  // ── Deep Analysis locked section ──
  deepAnalysisSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  deepAnalysisHeading: { fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 10 },
  deepAnalysisBlur: { filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', color: '#4a5568', fontSize: 13, lineHeight: 1.7 },
  deepAnalysisOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(255,255,255,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
    borderRadius: 14,
  },
  deepAnalysisOverlayInner: { textAlign: 'center', padding: '24px 32px' },
  deepAnalysisLockIcon: { fontSize: 28, marginBottom: 10 },
  deepAnalysisOverlayTitle: { fontSize: 16, fontWeight: 700, color: '#1a202c', marginBottom: 8 },
  deepAnalysisOverlayDesc: { fontSize: 13, color: '#4a5568', marginBottom: 16, lineHeight: 1.6 },
  deepAnalysisUnlockBtn: (loading) => ({
    padding: '10px 24px',
    background: loading ? 'rgba(74,144,217,0.4)' : '#4a90d9',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
  }),
  // ── Email section ──
  emailSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  emailHeading: { fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  emailDesc: { fontSize: 13, color: '#4a5568', marginBottom: 16, lineHeight: 1.5 },
  emailInputRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emailInput: {
    flex: '1 1 220px',
    maxWidth: 320,
    padding: '10px 14px',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    color: '#1a202c',
    fontSize: 14,
    outline: 'none',
  },
  emailBtn: (loading) => ({
    padding: '10px 20px',
    background: loading ? 'rgba(20,184,166,0.4)' : '#0d9488',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    flexShrink: 0,
  }),
  emailAlert: (success) => ({
    fontSize: 13,
    color: success ? '#6ee7b7' : '#fc8181',
    marginTop: 6,
    lineHeight: 1.5,
  }),
  // ── Evidence-based practices ──
  practicesSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  practicesHeading: { fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 },
  practicesSubheading: { fontSize: 13, color: '#4a5568', marginBottom: 16, lineHeight: 1.5 },
  practiceCard: (color) => ({
    borderLeft: `4px solid ${color}`,
    background: '#f8fafc',
    borderRadius: 8,
    padding: '16px 18px',
    marginBottom: 14,
  }),
  practiceCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  practiceEmoji: { fontSize: 20, flexShrink: 0 },
  practiceTitle: { fontSize: 14, fontWeight: 700, color: '#1a202c', flex: 1 },
  practiceTags: { display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  practiceTag: {
    background: '#f1f5f9',
    color: '#4a5568',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
  },
  practicePrinciples: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  practicePrincipleBadge: (color) => ({
    background: color,
    color: '#fff',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.04em',
  }),
  practiceSteps: { listStyle: 'decimal', paddingLeft: 18, margin: '0 0 10px', fontSize: 12, color: '#4a5568', lineHeight: 2 },
  practiceDimHeader: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: color,
    borderBottom: `2px solid ${color}`,
    paddingBottom: 8,
    marginBottom: 14,
    marginTop: 20,
  }),
  // ── Gamification (Atlas Starter+) ──
  gamHeader: {
    background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
    border: '1px solid #a7f3d0',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
  },
  gamStats: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  gamStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 60,
  },
  gamStatValue: { fontSize: 20, fontWeight: 800, color: '#065f46', lineHeight: 1 },
  gamStatLabel: { fontSize: 10, color: '#047857', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 },
  gamProgressTrack: {
    background: '#d1fae5',
    borderRadius: 99,
    height: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  gamProgressFill: (pct) => ({
    background: 'linear-gradient(90deg, #10b981, #059669)',
    borderRadius: 99,
    height: '100%',
    width: `${pct}%`,
    transition: 'width 0.4s ease',
  }),
  gamProgressLabel: { fontSize: 11, color: '#065f46', fontWeight: 600 },
  gamBadgesRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  gamBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: '#fff',
    border: '1px solid #6ee7b7',
    borderRadius: 99,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 700,
    color: '#065f46',
  },
  gamActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  gamCompleteBtn: (done) => ({
    padding: '6px 14px',
    borderRadius: 8,
    border: done ? '1.5px solid #10b981' : '1.5px solid #d1d5db',
    background: done ? '#ecfdf5' : '#fff',
    color: done ? '#065f46' : '#374151',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.2s',
  }),
  gamTimerBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    border: '1.5px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  gamTimerDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#eff6ff',
    border: '1.5px solid #bfdbfe',
    borderRadius: 8,
    padding: '4px 12px',
  },
  gamTimerCount: { fontSize: 16, fontWeight: 800, color: '#1d4ed8', fontVariantNumeric: 'tabular-nums', minWidth: 40 },
  gamTimerPauseBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1d4ed8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 6px',
  },
  gamTimerStopBtn: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6b7280',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
  },
  gamCompleteCard: {
    opacity: 0.75,
  },
  // ── Affirmations section ──
  affirmationsSection: {
    background: 'rgba(124,58,237,0.05)',
    border: '1px solid rgba(124,58,237,0.2)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(124,58,237,0.06)',
  },
  affirmationsHeading: { fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 },
  affirmationsSubtitle: { fontSize: 13, color: '#4a5568', marginBottom: 16, lineHeight: 1.5 },
  affirmationDailyWidget: {
    background: 'rgba(124,58,237,0.08)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 10,
    padding: '16px 20px',
    marginBottom: 16,
    textAlign: 'center',
  },
  affirmationDailyTitle: { fontSize: 12, fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' },
  affirmationDailyText: { fontSize: 15, color: '#1a202c', lineHeight: 1.7, fontStyle: 'italic', margin: 0 },
  affirmationCardsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  affirmationCard: {
    background: '#ffffff',
    border: '1px solid #e8e0ff',
    borderRadius: 10,
    padding: '14px 18px',
    fontSize: 13,
    color: '#374151',
    lineHeight: 1.65,
    fontStyle: 'italic',
  },
  // ── Invite colleagues ──
  inviteSection: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  inviteHeading: { fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 },
  inviteDesc: { fontSize: 13, color: '#4a5568', marginBottom: 16, lineHeight: 1.5 },
  inviteForm: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  inviteInput: {
    flex: '1 1 220px',
    maxWidth: 300,
    padding: '10px 14px',
    background: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    color: '#1a202c',
    fontSize: 14,
    outline: 'none',
  },
  inviteBtn: (loading) => ({
    padding: '10px 20px',
    background: loading ? 'rgba(79,70,229,0.4)' : '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    flexShrink: 0,
  }),
  inviteStatus: (success) => ({
    fontSize: 13,
    color: success ? '#6ee7b7' : '#fc8181',
    marginTop: 10,
    lineHeight: 1.5,
  }),
  // ── Privacy guarantee ──
  privacyGuarantee: {
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 10,
    padding: '14px 20px',
    marginBottom: 24,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    fontSize: 13,
    color: '#4a5568',
    lineHeight: 1.6,
  },
  privacyIcon: { fontSize: 18, flexShrink: 0 },
  privacyText: { margin: 0 },
  privacyLink: { color: '#059669', textDecoration: 'underline' },
};

// ── Social share URLs ──────────────────────────────────────────────────────
const SOCIAL_URLS = {
  linkedin:  'https://www.linkedin.com/company/theresilienceatlas',
  twitter:   'https://x.com/atlasresilience',
  facebook:  'https://www.facebook.com/profile.php?id=100076220534241',
  instagram: 'https://www.instagram.com/atlas.resilience/',
  youtube:   'https://www.youtube.com/@janeenstalnaker8395',
};

function buildShareText(dominantDimension) {
  const dim = dominantDimension || 'Resilience';
  return (
    `My strongest resilience dimension is ${dim}. What\u2019s yours? ` +
    'Take the Resilience Atlas assessment to map your Six Dimensions of Resilience.'
  );
}

function shareLinkedIn(dominantDimension) {
  const url = encodeURIComponent(window.location.origin + '/quiz');
  const text = encodeURIComponent(buildShareText(dominantDimension));
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
    '_blank', 'width=600,height=520,noopener,noreferrer'
  );
}

function shareTwitter(dominantDimension) {
  const url  = encodeURIComponent(window.location.origin + '/quiz');
  const text = encodeURIComponent(buildShareText(dominantDimension));
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    '_blank', 'width=600,height=400,noopener,noreferrer'
  );
}

function shareFacebook() {
  window.open(SOCIAL_URLS.facebook, '_blank', 'noopener,noreferrer');
}

function shareYouTube() {
  window.open(SOCIAL_URLS.youtube, '_blank', 'noopener,noreferrer');
}

function trackShareEvent(platform, dimension) {
  try {
    fetch('/api/growth/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'results_shared',
        properties: { platform, dimension },
      }),
    }).catch(() => {});
  } catch (_) {}
}

// ── Inline share-button style ──────────────────────────────────────────────
function shareBtnStyle(bg, hovered) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 16px',
    background: hovered ? bg : bg + 'cc',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.12s',
    transform: hovered ? 'translateY(-1px)' : 'none',
    boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
    outline: 'none',
    flexShrink: 0,
  };
}

// ── Social follow link style ──────────────────────────────────────────────
function socialFollowBtnStyle(bg, hovered) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    background: hovered ? bg : '#f8fafc',
    color: hovered ? '#fff' : '#4a5568',
    border: `1px solid ${hovered ? bg : '#e2e8f0'}`,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
    flexShrink: 0,
  };
}

// ── ShareButton sub-component ──────────────────────────────────────────────
function ShareButton({ label, icon, bg, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={shareBtnStyle(bg, hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={onClick}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

// ── SocialFollowLink sub-component ────────────────────────────────────────
function SocialFollowLink({ label, icon, href, bg }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={socialFollowBtnStyle(bg, hovered)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={label}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </a>
  );
}

// ── PDF download helper ────────────────────────────────────────────────────
const MAX_POLLING_ATTEMPTS = 60;   // 2 minutes at 2 s intervals
const POLLING_INTERVAL_MS  = 2000; // 2 seconds between status checks

async function triggerPdfDownload(results, email, getTokenFn) {
  const scoresStr = JSON.stringify(results.scores);
  const params = new URLSearchParams({
    overall: String(results.overall),
    dominantType: results.dominantType,
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
        console.warn('[PDF download] Token error:', msg);
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
    const err = new Error(body.error || 'Failed to start report generation');
    if (genRes.status === 402) err.upgradeRequired = true;
    if (genRes.status === 429 && body.quotaExceeded) {
      err.quotaExceeded = true;
      err.nextAvailableAt = body.next_available_at || null;
    }
    throw err;
  }
  const { hash } = await genRes.json();

  for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, POLLING_INTERVAL_MS));
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
      if (!hash) {
        throw new Error('Report hash is missing. Please try generating the report again.');
      }
      const dlParams = new URLSearchParams({ hash: String(hash) });
      if (email) dlParams.set('email', email);
      const dlRes = await fetch(`/api/report/download?${dlParams.toString()}`, { headers: authHeaders });
      if (!dlRes.ok) {
        if (dlRes.status === 401) {
          throw new Error('Authentication expired. Please log in again and retry.');
        }
        const body = await dlRes.json().catch(() => ({}));
        const err = new Error(body.error || 'Failed to download report');
        if (dlRes.status === 402) err.upgradeRequired = true;
        throw err;
      }
      // Explicitly create a PDF blob to ensure the correct MIME type is used
      // across all browsers, regardless of what Content-Type the server sends.
      const blob = new Blob([await dlRes.arrayBuffer()], { type: 'application/pdf' });
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

// ── Resilience level label ─────────────────────────────────────────────────
function resilienceLevel(overall) {
  if (overall >= 80) return 'strong';
  if (overall >= 60) return 'solid';
  if (overall >= 40) return 'developing';
  return 'emerging';
}

// ── Get stored email (from results object or resilience_email key) ─────────
function getStoredEmail() {
  try {
    const r = JSON.parse(localStorage.getItem('resilience_results') || '{}');
    return r.email || localStorage.getItem('resilience_email') || '';
  } catch (_) { return ''; }
}

// ── Map tier ID to a human-readable access label ──────────────────────────
function tierLabel(tierId) {
  switch (tierId) {
    case 'atlas-premium':   return 'Atlas Premium (Lifetime)';
    case 'atlas-starter':   return 'Atlas Starter';
    case 'atlas-navigator': return 'Atlas Navigator';
    default:                return tierId || 'premium';
  }
}

// ── Returns true for any tier that grants paid report access ──────────────
// isPaidTier: alias of isStarterOrAbove — returns true for any paid tier.
const isPaidTier = isStarterOrAbove;
// Tiers that unlock the full 30-day in-app practice track + daily emails.
const hasFullPracticeTier = isNavigatorOrAbove;

// ── Gamification helpers ───────────────────────────────────────────────────
const GAM_KEY = 'resilience_gamification';

const GAM_BADGE_DEFS = [
  { name: 'First Step',       icon: '/icons/badge.svg',           desc: 'Completed your first practice',                 test: (c)        => Object.keys(c).length >= 1  },
  { name: 'Week Warrior',     icon: '/icons/game-shield.svg',     desc: '5 practices completed',                         test: (c)        => Object.keys(c).length >= 5  },
  { name: 'Dimension Master', icon: '/icons/game-map.svg',        desc: '10 practices completed across dimensions',       test: (c)        => Object.keys(c).length >= 10 },
  { name: 'Champion',         icon: '/icons/kids-trophy.svg',     desc: 'Complete your full practice track!',            test: (c, _, targetCount) => Object.keys(c).length >= targetCount },
  { name: 'Streak Master',    icon: '/icons/streaks.svg',         desc: '7 consecutive days of practice',                test: (_, streak) => streak >= 7                },
];

function calcGamStreak(completions) {
  const dates = [...new Set(Object.values(completions).map(c => c.date))].sort();
  if (dates.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let checkDate = today;
  for (let i = dates.length - 1; i >= 0; i--) {
    if (dates[i] === checkDate) {
      streak++;
      // Parse year/month/day to avoid timezone-related shifts
      const [y, mo, dy] = checkDate.split('-').map(Number);
      const d = new Date(y, mo - 1, dy - 1);
      checkDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else if (dates[i] < checkDate) {
      break;
    }
  }
  return streak;
}

function calcGamBadges(completions, streak, targetCount) {
  return GAM_BADGE_DEFS.filter(b => b.test(completions, streak, targetCount)).map((b) => {
    if (b.name === 'Champion') {
      return { ...b, desc: `All ${targetCount} practices completed!` };
    }
    return { name: b.name, icon: b.icon, desc: b.desc };
  });
}

/** Parse a duration string like "3 min", "5 min", "15 min" to seconds. */
function parseDurationSecs(durStr) {
  if (!durStr) return 0;
  const m = durStr.match(/(\d+)\s*min/);
  if (m) return parseInt(m[1], 10) * 60;
  const s = durStr.match(/(\d+)\s*sec/);
  if (s) return parseInt(s[1], 10);
  return 0;
}

/** Format seconds as M:SS. */
function fmtSecs(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const GAM_EMPTY = { completions: {}, streak: 0, lastDate: null, points: 0, badges: [] };

function loadGamData() {
  try { return JSON.parse(localStorage.getItem(GAM_KEY)) || GAM_EMPTY; } catch { return GAM_EMPTY; }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const params = new URLSearchParams(window.location.search);
  const upgradeParam  = params.get('upgrade');   // 'success' | 'canceled'
  const sessionId     = params.get('session_id');
  const hashParam     = params.get('hash');      // assessment hash from email CTA deep link

  // ── Auth0 ──────────────────────────────────────────────────────────────
  const { user: auth0User, isAuthenticated, isLoading: auth0Loading, loginWithRedirect, getAccessTokenSilently } = useAuth0();

  // ── State ──────────────────────────────────────────────────────────────
  const [results, setResults]         = useState(null);
  const [tier, setTier]               = useState('free'); // 'free' | 'atlas-starter' | 'atlas-navigator' | 'atlas-premium'
  const [tierLoading, setTierLoading] = useState(false);
  const [tiers, setTiers]             = useState([]);     // pricing from API
  const [banner, setBanner]           = useState(null);   // { type, message }
  const [checkoutLoading, setCheckoutLoading] = useState(''); // tier id being purchased
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [pdfError, setPdfError]       = useState('');
  const [priorAccess, setPriorAccess] = useState(false);  // true if /api/report/access confirms prior purchase
  const [hasNavigatorAccess, setHasNavigatorAccess] = useState(false); // true when backend confirms full/blanket practice tier
  // Tracks whether both tier checks (payments/status and report/access) have completed.
  // The download button is only shown once the backend has confirmed the tier, preventing
  // stale localStorage values from granting premature access.
  const [tierCheckComplete, setTierCheckComplete] = useState(false);
  // Whether the current assessment's PDF has been unlocked (either via Navigator or Starter).
  // null = not yet loaded from backend.
  const [isCurrentAssessmentUnlocked, setIsCurrentAssessmentUnlocked] = useState(null);
  // Whether user has unlock modal open (shown automatically for users without PDF access).
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  // Whether to show the Atlas Navigator PDF quota exceeded modal.
  const [showPdfQuotaModal, setShowPdfQuotaModal] = useState(false);
  const [pdfQuotaNextDate, setPdfQuotaNextDate]   = useState(null); // ISO string | null
  // Whether to show the "Available on the web" modal on Capacitor Android.
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  // True while loading results from the API via a ?hash= deep link.
  const [hashLoading, setHashLoading] = useState(!!hashParam);
  // True while auto-fetching the user's latest assessment from history when
  // results is null (no localStorage/hash) but the user has a known email.
  const [latestAssessmentLoading, setLatestAssessmentLoading] = useState(false);

  // ── Upsell modal state ────────────────────────────────────────────────
  const [upsellModal, setUpsellModal] = useState(null);   // null | { tier, trigger }

  // ── Reminder opt-in state ──────────────────────────────────────────────
  const [reminderChecked, setReminderChecked]   = useState(false);
  const [reminderLoading, setReminderLoading]   = useState(false);
  const [reminderStatus, setReminderStatus]     = useState('');  // '' | 'success' | 'error'
  const [reminderMessage, setReminderMessage]   = useState('');
  const [reminderDone, setReminderDone]         = useState(false);

  // ── Copy-link state (social sharing) ─────────────────────────────────
  const [copyLabel, setCopyLabel] = useState('Copy Link');

  // ── Email report state ────────────────────────────────────────────────
  const [emailInput, setEmailInput]     = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailAlert, setEmailAlert]     = useState(null); // { success, message }

  // ── Invite colleague state ────────────────────────────────────────────
  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteStatus, setInviteStatus]   = useState(null); // { success, message }

  // ── Gamification state (Atlas Starter+ localStorage-based) ─────────────
  const [gamData, setGamData] = useState(() => loadGamData());
  // null | { practiceKey, secondsLeft, total, running }
  const [timerData, setTimerData] = useState(null);
  const timerIntervalRef = useRef(null);

  // ── Dimension modal state ─────────────────────────────────────────────
  // null | string (dimension name)
  const [activeDimModal, setActiveDimModal] = useState(null);
  const dimModalTriggerRef = useRef(null);

  // ── 30-day micro-practice plan state ─────────────────────────────────
  // Persisted in localStorage so the plan is stable across visits.
  // Key: 'micro_plan_start' — ISO date string YYYY-MM-DD
  const [practicePlanDay, setPracticePlanDay] = useState(() => {
    try {
      const start = localStorage.getItem('micro_plan_start');
      if (start) {
        const startDate = new Date(start + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        return Math.min(Math.max(diff + 1, 1), 30); // clamp to 1-30
      }
    } catch (_) { /* ignore */ }
    return 1; // default to day 1
  });
  // Whether to show all practices (expanded view) or just today's
  const [showAllPractices, setShowAllPractices] = useState(false);

  // ── Confetti canvas ref ────────────────────────────────────────────────
  const confettiRef = useRef(null);

  // ── Persist gamification data to localStorage whenever it changes ──────
  useEffect(() => {
    try { localStorage.setItem(GAM_KEY, JSON.stringify(gamData)); } catch (_) { /* ignore */ }
  }, [gamData]);

  // ── Timer tick effect ──────────────────────────────────────────────────
  const timerRunning = timerData ? timerData.running : false;
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerData(prev => {
          if (!prev || !prev.running) return prev;
          const next = prev.secondsLeft - 1;
          if (next <= 0) {
            clearInterval(timerIntervalRef.current);
            return { ...prev, secondsLeft: 0, running: false };
          }
          return { ...prev, secondsLeft: next };
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timerRunning]);

  // ── Resolve the current user's email from all available sources ────────
  // Prefers the email embedded in the current assessment results, then Auth0,
  // then the value stored in localStorage.  Use this helper throughout the
  // component to avoid repeating the same fallback chain.
  const getEffectiveEmail = useCallback(
    () => (results && results.email) || (isAuthenticated && auth0User?.email) || getStoredEmail(),
    [results, isAuthenticated, auth0User]
  );

  // ── Sync Auth0 email to localStorage so the rest of the page finds it ─
  // When an Auth0 user is authenticated, persist their email to localStorage
  // under the same key used by the quiz flow.  This ensures getStoredEmail()
  // and downstream payment / access checks can find the email even when the
  // user navigates directly to /results without completing a new assessment.
  // Always write (not only when absent) so that if the Auth0 email differs
  // from any stale value, the stored email stays current.
  useEffect(() => {
    if (!auth0Loading && isAuthenticated && auth0User?.email) {
      try {
        localStorage.setItem('resilience_email', auth0User.email);
      } catch (_) { /* ignore storage errors */ }
    }
  }, [auth0Loading, isAuthenticated, auth0User]);

  // ── Load results from localStorage ────────────────────────────────────
  useEffect(() => {
    // When arriving from an email deep link (?hash=...) do not load from
    // localStorage — results will be fetched from the API by the hash effect.
    if (hashParam) return;
    try {
      const raw = localStorage.getItem('resilience_results');
      if (raw) {
        const parsed = JSON.parse(raw);
        setResults(parsed);
        // Expose to window so payment-gating.js can access email and scores
        // without an additional localStorage parse step.
        window.resilience_results = parsed;
        // Ensure resilience_email is set so PaymentGating.startCheckout()
        // finds the email without prompting the user.
        if (parsed.email) {
          try {
            if (!localStorage.getItem('resilience_email')) {
              localStorage.setItem('resilience_email', parsed.email);
            }
          } catch (_) { /* ignore storage errors */ }
        }
      }
    } catch (_) { /* ignore parse errors */ }
  }, [hashParam]);

  // ── Load results from API when URL contains ?hash= (email deep link) ──
  // Flow:
  //  1. User clicks "View Full Report" in email → /login?returnTo=/results?hash=...
  //  2. After Auth0 login, user lands on /results?hash=<hash>
  //  3. This effect fetches the assessment data from the backend.
  //  4. If the user is not authenticated, they are redirected to login with
  //     returnTo preserved so the flow completes after sign-in.
  useEffect(() => {
    if (!hashParam) return;

    // Wait for Auth0 to finish initializing before deciding on auth state.
    if (auth0Loading) return;

    if (!isAuthenticated) {
      // Redirect to Auth0 login.  The returnTo includes the hash so the user
      // lands on the correct deep link after logging in.
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search },
      });
      return;
    }

    // Authenticated — fetch assessment data from the server.
    let canceled = false;
    setHashLoading(true);

    (async () => {
      try {
        const data = await apiFetch(
          `/api/assessment/by-hash?hash=${encodeURIComponent(hashParam)}`,
          {},
          getAccessTokenSilently
        ).then(r => r.json());

        if (canceled) return;

        if (data && data.overall !== undefined) {
          setResults(data);
          window.resilience_results = data;
        } else {
          setBanner({
            type: 'error',
            message: data.error || 'Assessment not found. It may have been deleted or is not linked to your account.',
          });
        }
      } catch (err) {
        if (!canceled) {
          setBanner({
            type: 'error',
            message: 'Unable to load assessment. Please try again or re-take the quiz.',
          });
        }
      } finally {
        if (!canceled) setHashLoading(false);
      }
    })();

    return () => { canceled = true; };
  }, [hashParam, auth0Loading, isAuthenticated]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-load latest assessment when results is null and user has email ─
  // When the user navigates to /results without in-memory/localStorage results
  // (and without a ?hash= deep link), automatically fetch their most recent
  // assessment from history so the full results UI renders instead of the
  // empty/history-only state.
  // Does NOT run when hashParam is present — that flow has its own loader above.
  useEffect(() => {
    if (hashParam) return;           // hash flow handles its own loading
    if (results) return;             // already have results — nothing to do
    if (auth0Loading) return;        // wait for Auth0 to finish initializing

    const email = (isAuthenticated && auth0User?.email) || getStoredEmail();
    if (!email) return;              // no email — cannot fetch history

    let canceled = false;
    setLatestAssessmentLoading(true);

    apiFetch(`/api/assessment/history?email=${encodeURIComponent(email)}`, {}, getAccessTokenSilently)
      .then(r => r.json())
      .then(data => {
        if (canceled) return;
        const list = Array.isArray(data.assessments) ? data.assessments : [];
        // Filter to items that have actual result data
        const valid = list.filter(a => a.overall !== undefined && a.dominantType);
        if (valid.length === 0) return;
        // Pick the most recent by createdAt; do not assume server ordering.
        const latest = valid.reduce((best, a) => {
          const bDate = best.createdAt ? new Date(best.createdAt).getTime() : 0;
          const aDate = a.createdAt   ? new Date(a.createdAt).getTime()   : 0;
          return aDate > bDate ? a : best;
        }, valid[0]);
        setResults(latest);
        window.resilience_results = latest;
        // Persist email so downstream access checks find it.
        if (latest.email) {
          try {
            if (!localStorage.getItem('resilience_email')) {
              localStorage.setItem('resilience_email', latest.email);
            }
          } catch (_) { /* ignore */ }
        }
      })
      .catch(err => {
        if (!canceled) {
          console.warn('[ResultsPage] Auto-fetch latest assessment failed:', err.message);
        }
      })
      .finally(() => {
        if (!canceled) setLatestAssessmentLoading(false);
      });

    return () => { canceled = true; };
  }, [hashParam, results, auth0Loading, isAuthenticated, auth0User]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Confetti celebration — fire 600 ms after results load ─────────────
  useEffect(() => {
    if (!results) return;
    let confettiCleanup;
    const timer = setTimeout(() => {
      confettiCleanup = runConfetti(confettiRef.current);
    }, 600);
    return () => {
      clearTimeout(timer);
      if (confettiCleanup) confettiCleanup();
    };
  }, [results]);

  // ── 30-day practice plan: initialize start date on first view ──────────
  useEffect(() => {
    if (!results) return;
    try {
      if (!localStorage.getItem('micro_plan_start')) {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('micro_plan_start', today);
        setPracticePlanDay(1);
      }
    } catch (_) { /* ignore */ }
  }, [results]);

  // ── Smart unlock modal trigger (replaces old upsell modal for new assessments) ─
  // Show the UnlockReportModal automatically 1.5 s after results load when the
  // backend has confirmed this assessment is NOT yet unlocked.
  // Only fires once per page load; respects the existing upsell cooldown.
  const unlockModalFiredRef = useRef(false);

  useEffect(() => {
    if (!results || !tierCheckComplete) return;
    if (isCurrentAssessmentUnlocked) return;  // already unlocked — no need to prompt
    if (unlockModalFiredRef.current) return;  // already fired this session
    if (upsellIsOnCooldown()) return;

    const timer = setTimeout(() => {
      if (isCurrentAssessmentUnlocked) return;
      unlockModalFiredRef.current = true;
      setShowUnlockModal(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [results, tierCheckComplete, isCurrentAssessmentUnlocked]);

  // ── Smart upsell triggers (scroll, exit intent, timer) ─────────────────
  // Still active for free users to promote upgrade via the existing upsell cards.
  const upsellScrollFiredRef = useRef(false);
  const upsellScrollTargetRef = useRef(null);

  useEffect(() => {
    if (!results) return;
    const isFree = tier === 'free' && !priorAccess;
    if (!isFree) return;
    if (upsellIsOnCooldown()) return;
    // Do not show upsell/promo popups inside the native Android app —
    // purchases are handled on the website.
    if (isCapacitorAndroid()) return;

    // 2. Scroll trigger — fire when the upgrade cards section scrolls into view.
    const scrollTarget = document.getElementById('upgradeCardsContainer') ||
                         document.querySelector('[data-upsell-scroll-target]');
    upsellScrollTargetRef.current = scrollTarget;
    let scrollObserver;
    if (scrollTarget && typeof IntersectionObserver !== 'undefined') {
      scrollObserver = new IntersectionObserver((entries) => {
        if (!upsellScrollFiredRef.current && entries[0].isIntersecting) {
          upsellScrollFiredRef.current = true;
          scrollObserver.disconnect();
        }
      }, { threshold: 0.5 });
      scrollObserver.observe(scrollTarget);
    }

    // 3. Exit-intent trigger (desktop only — mouse leaves viewport upward).
    function onMouseLeave(e) {
      if (e.clientY < 20) {
        document.removeEventListener('mouseleave', onMouseLeave);
        if (!upsellIsOnCooldown()) {
          setUpsellModal({ tier: 'atlas-navigator', trigger: 'exit_intent' });
        }
      }
    }
    if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
      document.addEventListener('mouseleave', onMouseLeave);
    }

    // 4. Timer trigger — show after 90 seconds of engagement.
    const timerHandle = setTimeout(() => {
      if (!upsellIsOnCooldown()) {
        setUpsellModal({ tier: 'atlas-navigator', trigger: 'timer' });
      }
    }, 90 * 1000);

    return () => {
      clearTimeout(timerHandle);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (scrollObserver) scrollObserver.disconnect();
    };
  }, [results, tier, priorAccess]);

  // ── Load tier pricing from API ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/payments/tiers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data.tiers)) setTiers(data.tiers); })
      .catch(() => { /* use fallback prices */ });
  }, []);

  // ── Handle return from Stripe checkout ────────────────────────────────
  useEffect(() => {
    if (upgradeParam === 'canceled') {
      setBanner({ type: 'warning', message: 'Payment was canceled. Your free results are still available below.' });
      // Clean query string without reloading
      window.history.replaceState({}, '', '/results');
      return;
    }

    if (upgradeParam === 'success' && sessionId) {
      // When payment-gating.js is loaded it handles verification via its
      // DOMContentLoaded handler (which fires before React mounts).
      // React only needs to read the tier it already wrote to localStorage and
      // let the paymentVerified event listener (below) apply any live update.
      if (window.PaymentGating && typeof window.PaymentGating.handleUpgradeSuccess === 'function') {
        // Read tier that PaymentGating may have already written to localStorage.
        // PaymentGating only writes this after successful backend verification,
        // so it is safe to trust here. The /api/report/access check (below, in
        // a separate useEffect) provides an additional backstop — if the tier is
        // somehow stale it will be cleared when that check completes.
        try {
          const stored = localStorage.getItem('resilience_tier');
          if (stored && stored !== 'free') {
            setTier(stored);
            setTierCheckComplete(true);
            setBanner({ type: 'success', message: `✅ Purchase confirmed! You now have ${tierLabel(stored)} access.` });
          } else {
            // PaymentGating verification may still be in-flight; the
            // paymentVerified listener will update state and set tierCheckComplete
            // when it resolves.
            setBanner({ type: 'success', message: '✅ Payment successful! Verifying your purchase…' });
          }
        } catch (_) { /* ignore */ }
        return;
      }

      // Fallback: PaymentGating not loaded — verify inline.
      setTierLoading(true);
      setBanner({ type: 'success', message: '✅ Payment successful! Verifying your purchase…' });
      fetch(`/api/payments/verify?session_id=${encodeURIComponent(sessionId)}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.tier) {
            setTier(data.tier);
            setTierCheckComplete(true);
            // Persist tier to localStorage so the upgrade cards stay hidden on reload
            try { localStorage.setItem('resilience_tier', data.tier); } catch (_) { /* ignore */ }
            setBanner({ type: 'success', message: `✅ Purchase confirmed! You now have ${tierLabel(data.tier)} access.` });
          } else {
            setBanner({ type: 'error', message: data.error || 'Could not verify payment. Please contact support.' });
          }
        })
        .catch(() => {
          setBanner({ type: 'error', message: 'Failed to verify payment. Please contact support or refresh.' });
        })
        .finally(() => {
          setTierLoading(false);
          window.history.replaceState({}, '', '/results');
        });
      return;
    }

    // ── Check persisted tier from prior payment ──────────────────────────
    // When no email is available we cannot perform a backend check.
    // tierCheckComplete is set by the /api/report/access useEffect below
    // (which also handles the no-email case), so we do not set it here.
    // If the localStorage tier is stale the download attempt will fail with
    // 402 and handleDownloadPdf will reset the state at that point.
    const email = getEffectiveEmail();

    if (!email) {
      try {
        const stored = localStorage.getItem('resilience_tier');
        if (stored && stored !== 'free') {
          setTier(stored);
        }
      } catch (_) { /* ignore */ }
      return;
    }

    // ── Verify tier with the backend (email available) ─────────────────────
    // Do NOT read localStorage here — only trust the backend response so that
    // a stale 'atlas-navigator' in localStorage does not grant false access.
    apiFetch(`/api/payments/status?email=${encodeURIComponent(email)}`, {}, getAccessTokenSilently)
      .then(r => r.json())
      .then(data => {
        if (data.tier && data.tier !== 'free') {
          setTier(data.tier);
          try { localStorage.setItem('resilience_tier', data.tier); } catch (_) { /* ignore */ }
        } else {
          // Backend confirmed free tier — clear any stale paid tier from localStorage.
          setTier('free');
          try { localStorage.removeItem('resilience_tier'); } catch (_) { /* ignore */ }
        }
      })
      .catch(() => { /* non-fatal — tier stays 'free' */ });
  }, [upgradeParam, sessionId, auth0Loading, isAuthenticated, auth0User, results]);

  // ── Listen for paymentVerified from payment-gating.js ─────────────────
  // payment-gating.js dispatches this event after backend-confirmed payment
  // so the React UI can unlock features instantly without a full page reload.
  useEffect(() => {
    function onPaymentVerified(e) {
      const { tier: newTier } = (e && e.detail) || {};
      if (newTier) {
        setTier(newTier);
        setTierCheckComplete(true);
        setBanner({
          type: 'success',
          message: `✅ Purchase confirmed! You now have ${tierLabel(newTier)} access.`,
        });
      }
    }
    document.addEventListener('paymentVerified', onPaymentVerified);
    return () => document.removeEventListener('paymentVerified', onPaymentVerified);
  }, []);

  // ── Check prior report access (/api/report/access) ────────────────────
  // Checks whether the current assessment's PDF is unlocked, and whether the
  // user has any existing purchases.  Passes assessment data to the endpoint
  // so the backend can check per-assessment access for Atlas Starter users.
  // Sets tierCheckComplete so the download UI only renders after backend responds.
  // Waits for Auth0 to finish loading so the user's email is available.
  // Also waits when loading from a hash deep link (hashLoading) so the results
  // state is populated before the access check runs.
  useEffect(() => {
    if (auth0Loading) {
      // Auth0 is still initializing — hold off until we know the user's identity.
      return;
    }

    // If we are still loading assessment data via a hash deep link, wait until
    // that completes so `results` is populated before we run the access check.
    if (hashLoading) return;

    const email = getEffectiveEmail();
    if (!email) {
      // No email to check with — mark as complete so UI renders (tier stays 'free').
        setIsCurrentAssessmentUnlocked(false);
        setHasNavigatorAccess(false);
        setTierCheckComplete(true);
        return;
      }

    // Build URL with current assessment data so the backend can check per-assessment unlock.
    // Prefer the already-resolved `results` state over a fresh localStorage read so that
    // hash-loaded assessments (from the email deep link) are also checked correctly.
    let accessUrl = `/api/report/access?email=${encodeURIComponent(email)}`;
    try {
      const r = results || (() => {
        try { return JSON.parse(localStorage.getItem('resilience_results') || 'null'); } catch { return null; }
      })();
      if (r && r.overall !== undefined && r.scores) {
        accessUrl += `&overall=${encodeURIComponent(String(r.overall))}`;
        accessUrl += `&dominantType=${encodeURIComponent(r.dominantType || '')}`;
        accessUrl += `&scores=${encodeURIComponent(JSON.stringify(r.scores))}`;
      }
    } catch (_) { /* ignore */ }

    apiFetch(accessUrl, {}, getAccessTokenSilently)
      .then(r => r.json())
      .then(data => {
        // isCurrentAssessmentUnlocked: this specific assessment's PDF is accessible.
        const unlocked = data.isCurrentAssessmentUnlocked ?? (data.hasActiveAccess ?? data.hasAccess);
        setIsCurrentAssessmentUnlocked(!!unlocked);
        setHasNavigatorAccess(!!data.hasNavigatorAccess);
        if (unlocked) {
          setPriorAccess(true);
        } else {
          // Backend confirmed no access for this assessment — clear stale localStorage tier.
          setTier('free');
          try { localStorage.removeItem('resilience_tier'); } catch (_) { /* ignore */ }
        }
      })
      .catch(err => {
        console.warn('[ResultsPage] Prior access check failed:', err.message);
        setIsCurrentAssessmentUnlocked(false);
      })
      .finally(() => {
        setTierCheckComplete(true);
      });
  }, [auth0Loading, isAuthenticated, auth0User, results, hashLoading]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stripe checkout ────────────────────────────────────────────────────
  const handleUpgrade = useCallback(async (tierId) => {
    // On Capacitor Android, do not start Stripe checkout — show a modal
    // directing users to the website instead.
    if (isCapacitorAndroid()) {
      setShowAndroidModal(true);
      return;
    }
    // Call the checkout API directly to avoid Auth0 intermediate redirects
    // that can cause callback URL mismatch errors.
    const email = getEffectiveEmail();
    if (!email) {
      setBanner({ type: 'error', message: 'Please complete the assessment first so we know where to send your report.' });
      return;
    }
    setCheckoutLoading(tierId);
    try {
      const body = {
        tier: tierId,
        email,
        ...(results && {
          overall:      results.overall,
          dominantType: results.dominantType,
          scores:       results.scores,
        }),
      };
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err) {
      setBanner({ type: 'error', message: err.message || 'Could not start checkout. Please try again.' });
      setCheckoutLoading('');
    }
  }, [results, isAuthenticated, auth0User, getEffectiveEmail]);

  // ── PDF download ───────────────────────────────────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    if (!results) return;
    // If the user is not authenticated, prompt them to sign in rather than
    // showing a dead-end "Authentication required" error message.
    if (!isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search },
      });
      return;
    }
    const email = getEffectiveEmail();
    setPdfLoading(true);
    setPdfError('');
    try {
      await triggerPdfDownload(results, email, getAccessTokenSilently);
    } catch (err) {
      if (err && err.quotaExceeded) {
        // Atlas Navigator 30-day quota exceeded — show quota modal
        setPdfQuotaNextDate(err.nextAvailableAt || null);
        setShowPdfQuotaModal(true);
      } else if (err && err.upgradeRequired) {
        // Backend denied access — reset to locked state and show unlock modal
        setTier('free');
        setPriorAccess(false);
        setIsCurrentAssessmentUnlocked(false);
        try { localStorage.removeItem('resilience_tier'); } catch (_) { /* ignore */ }
        setShowUnlockModal(true);
      } else {
        setPdfError(err.message || 'Download failed. Please try again.');
      }
    } finally {
      setPdfLoading(false);
    }
  }, [results, isAuthenticated, auth0User, getEffectiveEmail, getAccessTokenSilently, loginWithRedirect]);

  // ── Reminder opt-in handler (ported from legacy results.js) ───────────
  const handleReminderOptIn = useCallback(async () => {
    if (!reminderChecked) {
      setReminderStatus('error');
      setReminderMessage('Please check the box to opt in.');
      return;
    }
    const email     = getEffectiveEmail();
    const firstName = (results && (results.firstName || results.name)) || localStorage.getItem('resilience_name') || '';
    const lastScore = results ? results.overall : 0;
    setReminderLoading(true);
    setReminderMessage('Saving your preference…');
    setReminderStatus('');
    try {
      const res = await fetch('/api/quiz/reminder-optin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, firstName, lastScore }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminderStatus('success');
        setReminderMessage("✅ Done! We'll remind you in 30 days.");
        setReminderDone(true);
      } else {
        setReminderStatus('error');
        setReminderMessage(data.error || 'Could not save preference.');
        setReminderLoading(false);
      }
    } catch (_) {
      setReminderStatus('error');
      setReminderMessage('Network error. Please try again.');
      setReminderLoading(false);
    }
  }, [results, reminderChecked, getEffectiveEmail]);

  // ── Copy link handler ─────────────────────────────────────────────────
  const handleCopyLink = useCallback(() => {
    const link = window.location.origin + '/quiz';
    const dim  = (results && results.dominantType) || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link)
        .then(() => {
          setCopyLabel('✓ Copied!');
          setTimeout(() => setCopyLabel('Copy Link'), 2500);
          trackShareEvent('copy_link', dim);
        })
        .catch(() => setCopyLabel('Copy Link'));
    } else {
      // Fallback: textarea trick for browsers without Clipboard API
      try {
        const ta = document.createElement('textarea');
        ta.value = link;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopyLabel('✓ Copied!');
        setTimeout(() => setCopyLabel('Copy Link'), 2500);
        trackShareEvent('copy_link', dim);
      } catch (_) {
        setCopyLabel('Copy failed');
        setTimeout(() => setCopyLabel('Copy Link'), 2500);
      }
    }
  }, [results]);

  // ── Email report handler ───────────────────────────────────────────────
  const handleEmailReport = useCallback(async () => {
    const email = emailInput.trim() || getEffectiveEmail();
    if (!email) {
      setEmailAlert({ success: false, message: 'Please enter your email address.' });
      return;
    }
    // Basic structural email validation without regex backtracking risk.
    const atIdx = email.indexOf('@');
    if (atIdx < 1 || atIdx !== email.lastIndexOf('@') || !email.slice(atIdx + 1).includes('.')) {
      setEmailAlert({ success: false, message: 'Please enter a valid email address.' });
      return;
    }
    setEmailLoading(true);
    setEmailAlert(null);
    try {
      const res = await fetch('/api/quiz/email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: (results && (results.firstName || results.name)) || '',
          overall: results ? results.overall : 0,
          dominantType: (results && results.dominantType) || '',
          scores: results ? results.scores : {},
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmailAlert({ success: true, message: '✅ Email sent! Check your inbox.' });
        setEmailInput('');
      } else if (res.status === 429) {
        setEmailAlert({ success: false, message: 'Too many requests. Please wait a moment and try again.' });
      } else {
        setEmailAlert({ success: false, message: data.error || 'Could not send report. Please try again.' });
      }
    } catch (_) {
      setEmailAlert({ success: false, message: 'Network error. Please check your connection and try again.' });
    } finally {
      setEmailLoading(false);
    }
  }, [results, emailInput, getEffectiveEmail]);

  // ── Invite colleague handler ───────────────────────────────────────────
  const handleInviteColleague = useCallback(async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      setInviteStatus({ success: false, message: 'Please enter your colleague\'s email.' });
      return;
    }
    setInviteLoading(true);
    setInviteStatus(null);
    try {
      const senderEmail = getEffectiveEmail();
      const res = await fetch('/api/quiz/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeEmail: email,
          senderEmail,
          senderName: (results && (results.firstName || results.name)) || '',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteStatus({ success: true, message: '✅ Invite sent! Your colleague will receive an email shortly.' });
        setInviteEmail('');
      } else {
        setInviteStatus({ success: false, message: data.error || 'Could not send invite. Please try again.' });
      }
    } catch (_) {
      setInviteStatus({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setInviteLoading(false);
    }
  }, [results, inviteEmail, getEffectiveEmail]);

  // ── Download radar chart as PNG ────────────────────────────────────────
  const handleDownloadRadar = useCallback(() => {
    try {
      // Find the exact SVG element displayed on the page by its unique ID
      const svg =
        document.getElementById('resilience-radar-chart') ||
        document.querySelector('svg[aria-label="Integrated resilience wheel showing skill proficiency levels and developmental roadmap"]');

      if (!svg) {
        alert('Radar chart not found. Please wait for the chart to load.');
        return;
      }

      // Get rendered dimensions
      const bbox = svg.getBoundingClientRect();
      const width = bbox.width || 340;
      const height = bbox.height || 340;

      // Clone SVG to avoid modifying the live DOM, then set explicit dimensions
      const svgClone = svg.cloneNode(true);
      svgClone.setAttribute('width', width);
      svgClone.setAttribute('height', height);

      // Remove all SVG animation elements from the clone.
      // animateTransform uses additive="replace" and restarts from from="0" when
      // the SVG is loaded as an <img>, which overrides the correct static
      // transform attribute and makes the needle point to the wrong dimension.
      // Removing the animations preserves the final static rotation (needleDeg).
      svgClone.querySelectorAll('animateTransform, animate, animateMotion').forEach(el => el.remove());

      // Remove interactive UI elements so the downloaded image is clean.
      // All removable text elements are tagged with data-label-type in
      // IntegratedResilienceWheel.jsx (ring-level, dimension-name,
      // score-percentage, skill-level, info-icon, background-pill).
      svgClone.querySelectorAll('[data-label-type]').forEach(el => el.remove());

      // Fallback: remove any remaining text elements not covered by data-label-type
      // (legacy RadarChart classes and any other text nodes).
      svgClone.querySelectorAll('.irw-info-icon, .dimension-info-icon').forEach(el => el.remove());
      svgClone.querySelectorAll('.irw-label-text, .dimension-label-text').forEach(el => {
        el.style.textDecoration = 'none';
      });
      // Remove percentage score labels from the downloaded image so shared
      // radar charts show dimension names and skill levels but not scores.
      svgClone.querySelectorAll('[data-score-label]').forEach(el => el.remove());
      // Also clear any inline underline styles on other text nodes (belt and
      // suspenders — covers any future changes to the SVG structure).
      svgClone.querySelectorAll('text').forEach(el => {
        el.remove();
      });

      // Serialize to a data URL (avoids blob: URLs that CSP img-src may block)
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(
        encodeURIComponent(svgString).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1))
      );

      // Draw onto an offscreen canvas at 2× for high-DPI quality
      const offscreen = document.createElement('canvas');
      offscreen.width = width * 2;
      offscreen.height = height * 2;
      const ctx = offscreen.getContext('2d');
      ctx.scale(2, 2);

      // Leave canvas transparent (no background fill) so the exported PNG has
      // a transparent background instead of white.

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);

        offscreen.toBlob((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `resilience-radar-${Date.now()}.png`;
          link.href = blobUrl;
          link.click();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          trackShareEvent('download_radar', (results && results.dominantType) || '');
        }, 'image/png');
      };
      img.onerror = () => {
        alert('Could not download radar chart. Please try taking a screenshot.');
      };
      img.src = svgDataUrl;
    } catch (_) {
      alert('Could not download radar chart. Please try taking a screenshot.');
    }
  }, [results]);

  // ── Gamification: toggle practice completion ───────────────────────────
  const togglePractice = useCallback((practiceKey) => {
    setGamData(prev => {
      const newCompletions = { ...prev.completions };
      const today = new Date().toISOString().slice(0, 10);
      if (newCompletions[practiceKey]) {
        delete newCompletions[practiceKey];
      } else {
        newCompletions[practiceKey] = { date: today };
      }
      const streak = calcGamStreak(newCompletions);
      const points = Object.keys(newCompletions).length * 10;
      const targetCount = hasFullPracticeTier(tier) ? 30 : 12;
      const badges = calcGamBadges(newCompletions, streak, targetCount);
      return { completions: newCompletions, streak, lastDate: today, points, badges };
    });
  }, [tier]);

  // ── Gamification: timer controls ──────────────────────────────────────
  const startTimer = useCallback((practiceKey, totalSecs) => {
    clearInterval(timerIntervalRef.current);
    setTimerData({ practiceKey, secondsLeft: totalSecs, total: totalSecs, running: true });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerData(prev => prev ? { ...prev, running: !prev.running } : prev);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerIntervalRef.current);
    setTimerData(null);
  }, []);

  /** Combined handler: toggle practice completion and stop its timer if running. */
  const handleTogglePractice = useCallback((practiceKey, isTimerActive) => {
    togglePractice(practiceKey);
    if (isTimerActive) stopTimer();
  }, [togglePractice, stopTimer]);

  // ── Derived values ─────────────────────────────────────────────────────
  // hasPremiumAccess is only true once the backend has confirmed the tier
  // (tierCheckComplete) AND the current assessment is unlocked.
  //
  // New access model:
  //   - Atlas Navigator: blanket access to all assessments (isCurrentAssessmentUnlocked = true)
  //   - Atlas Starter: per-assessment access (isCurrentAssessmentUnlocked = true only for
  //     assessments with a matching purchase)
  //   - No "first assessment free" exception.
  const hasPremiumAccess = tierCheckComplete && (isCurrentAssessmentUnlocked === true || isPaidTier(tier) || priorAccess);
  const hasFullPracticeAccess = hasPremiumAccess && (hasFullPracticeTier(tier) || hasNavigatorAccess);
  const isAtlasPremium   = tier === 'atlas-premium';

  const rankedDims = results
    ? Object.entries(results.scores).sort((a, b) => b[1].percentage - a[1].percentage)
    : [];

  const dominantType = rankedDims.length > 0 ? rankedDims[0][0] : '';

  // ── Build deterministic 30-day micro-practice plan ─────────────────────
  const thirtyDayPracticePlan = (() => {
    if (!results || !results.scores) return null;
    const dims = Object.keys(EVIDENCE_PRACTICES);
    const weights = dims.map((dim) => {
      const pct = (results.scores[dim] && results.scores[dim].percentage != null)
        ? results.scores[dim].percentage : 50;
      return Math.max(1, 100 - Math.round(pct));
    });

    let seed = Math.round((results.overall || 50) * 137);
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    };

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const pool = [];
    dims.forEach((dim, i) => {
      const extra = Math.max(1, Math.round((weights[i] / totalWeight) * 24));
      pool.push({ dim, idx: 0 });
      for (let e = 0; e < extra; e++) {
        pool.push({ dim, idx: nextRand() > 0.5 ? 1 : 0 });
      }
    });

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    while (pool.length < 30) {
      const extra = pool[Math.floor(nextRand() * pool.length)];
      pool.push({ ...extra });
    }

    const planEntries = pool.slice(0, 30).map((entry, idx) => {
      const practices = EVIDENCE_PRACTICES[entry.dim] || [];
      const practice = practices[entry.idx] || practices[0];
      return practice ? { day: idx + 1, dim: entry.dim, practice } : null;
    }).filter(Boolean);

    return planEntries.length ? planEntries : null;
  })();

  const todaysPractice = thirtyDayPracticePlan
    ? (thirtyDayPracticePlan.find((entry) => entry.day === practicePlanDay) || null)
    : null;

  const starterPracticeList = (() => {
    let dayCounter = 0;
    return Object.entries(EVIDENCE_PRACTICES).flatMap(([dim, practices]) =>
      practices.map((practice) => {
        dayCounter += 1;
        return {
          day: dayCounter,
          dim,
          practice,
          starterKey: practice.title,
        };
      })
    );
  })();

  const getPrice = (tierId) => {
    const t = tiers.find(t => t.id === tierId);
    if (!t) {
      if (tierId === 'atlas-starter') return '$9.99';
      if (tierId === 'atlas-navigator') return '$49.99';
      if (tierId === 'atlas-premium') return '$49.99';
      return '$49.99';
    }
    return `$${Number(t.price).toFixed(2)}`;
  };

  // ── Render: no results ─────────────────────────────────────────────────
  if (!results) {
    // While Auth0 is still initializing we don't know the user's identity yet.
    // Show a loading spinner rather than the empty state so we don't flash
    // "No assessment results found" for authenticated users.
    if (auth0Loading || hashLoading || latestAssessmentLoading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fc' }}>
          <span style={{ color: '#718096', fontSize: 16 }}>Loading your results…</span>
        </div>
      );
    }

    const isReturnFromPayment = upgradeParam === 'success';
    // Determine if we have an email (from Auth0 or localStorage) to show
    // assessment history even without current localStorage results.
    const historyEmail = (isAuthenticated && auth0User?.email) || getStoredEmail();

    return (
      <>
        {/* Site Header */}
        <header style={s.siteHeader} role="banner">
          <div style={s.headerInner}>
            <a href="/" style={s.headerLogo}>
              <img src="/assets/logo-256x256.png?v=2026-04-13" alt="The Resilience Atlas™" width="32" height="32" />
              The Resilience Atlas&#8482;
            </a>
            <nav style={s.headerNav} aria-label="Main navigation">
              <a href="/" style={s.navLink}>Home</a>
              <a href="/assessment.html" style={s.navLink}>Assessment</a>
              <a href="/iatlas" style={s.navLink}>IATLAS Curriculum</a>
              <a href="/research.html" style={s.navLink}>Research</a>
              <a href="/resources" style={s.navLink}>Resources</a>
              <a href="/teams" style={s.navLink}>Teams</a>
              <a href="/kids.html" style={s.navLink}>Kids</a>
              <a href="/about.html" style={s.navLink}>About</a>
              {isPaidTier(tier) && (
                <a href="/gamification" style={s.journeyNavLink} aria-label="Resilience Journey — your practices and progress"><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{width:16,height:16,verticalAlign:"middle",marginRight:5}} />Resilience Journey</a>
              )}
              <a href="/quiz?retake=1" style={s.retakeBtn}>Retake Quiz</a>
            </nav>
          </div>
        </header>
        <DarkModeHint />
        {/* ── Android "Available on the web" Modal ─────────────────── */}
        {showAndroidModal && (
          <AndroidWebModal onClose={() => setShowAndroidModal(false)} />
        )}
        <div style={s.page} className="storytelling-page results-story">
          <div style={s.container} className="story-results-wrap">
            {historyEmail ? (
              // Authenticated user (or has stored email): show their history
              // even when there are no current localStorage results.
              <>
                <div style={s.emptyCard} className="story-results-card">
                  <div style={s.emptyIcon}>
                    {isReturnFromPayment
                      ? <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={48} height={48} />
                      : <img src="/icons/compass.svg" alt="" aria-hidden="true" width={48} height={48} />}
                  </div>
                  <div style={s.emptyTitle}>
                    {isReturnFromPayment ? 'Payment confirmed!' : 'Your Assessment History'}
                  </div>
                  <p style={s.emptyDesc}>
                    {isReturnFromPayment
                      ? 'Thank you! Your payment was successful. Re-take the assessment to generate your latest PDF report, or download a prior report below.'
                      : 'Your assessment results and purchase history are shown below. Take a new assessment or download a prior report.'
                    }
                  </p>
                  <a href="/quiz?retake=1" style={s.primaryBtn}>
                    {isReturnFromPayment ? 'Re-take Assessment' : 'Take New Assessment'}
                  </a>
                  {!isReturnFromPayment && isAuthenticated && tierCheckComplete && isPaidTier(tier) && (
                    <a
                      href="/gamification"
                      style={{ ...s.primaryBtn, background: '#7c3aed', marginLeft: 12, marginTop: 8 }}
                      aria-label="Start your Resilience Journey — go to micro-practices"
                    >
                      <img src="/icons/compass.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Start Practice
                    </a>
                  )}
                </div>
                <ResultsHistory email={historyEmail} />
                <AssessmentHistory
                  email={historyEmail}
                  onUnlock={(assessment) => {
                    // On Capacitor Android, do not start Stripe checkout — show
                    // the "Available on the web" modal instead.
                    if (isCapacitorAndroid()) {
                      setShowAndroidModal(true);
                      return;
                    }
                    // Persist the hash so the checkout success flow can link the
                    // purchase to this specific assessment.
                    try {
                      if (assessment.hash) {
                        sessionStorage.setItem('pending_unlock_hash', assessment.hash);
                      }
                    } catch (_) { /* ignore */ }
                    // Start checkout for the Atlas Starter tier.
                    handleUpgrade('atlas-starter');
                  }}
                  checkoutLoading={checkoutLoading}
                  getTokenFn={getAccessTokenSilently}
                />
              </>
            ) : (
              // No email available — show the original empty state with a sign-in option.
               <div style={s.emptyCard} className="story-results-card">
                <div style={s.emptyIcon}>
                  {isReturnFromPayment
                    ? <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={48} height={48} />
                    : <img src="/icons/compass.svg" alt="" aria-hidden="true" width={48} height={48} />}
                </div>
                <div style={s.emptyTitle}>
                  {isReturnFromPayment ? 'Payment confirmed!' : 'No assessment results found'}
                </div>
                <p style={s.emptyDesc}>
                  {isReturnFromPayment
                    ? 'Thank you! Your payment was successful. Your results could not be found in this browser — please re-take the assessment to generate your PDF report.'
                    : isAuthenticated
                      ? 'Complete the free assessment to see your personalized resilience profile.'
                      : 'Complete the free assessment to see your personalized resilience profile, or sign in to access your previous results.'
                  }
                </p>
                <a href="/quiz" style={{...s.primaryBtn}} title="For adults 18+">
                  {isReturnFromPayment ? 'Re-take Assessment' : 'Start Free Assessment'} <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span>
                </a>
                {!isReturnFromPayment && !isAuthenticated && (
                  <button
                    type="button"
                    style={s.secondaryBtn}
                    onClick={() => loginWithRedirect({ appState: { returnTo: '/results' } })}
                  >
                    Sign In to View Previous Results
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Render: results ────────────────────────────────────────────────────
  const level = resilienceLevel(results.overall);
  const name  = results.firstName || results.name || '';

  return (
    <>
      {/* Confetti canvas — positioned fixed, above all content */}
      <canvas ref={confettiRef} style={s.confettiCanvas} aria-hidden="true" />

      {/* ── Dark-mode readability hint ──────────────────── */}
      <DarkModeHint />

      {/* ── Upsell modal (smart-triggered) ───────────────────────────── */}
      {upsellModal && !upsellIsOnCooldown() && !isCapacitorAndroid() && (
        <UpsellModal
          targetTier={upsellModal.tier}
          trigger={upsellModal.trigger}
          onClose={() => setUpsellModal(null)}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* ── Dimension detail modal ────────────────────────────────────── */}
      {activeDimModal && (
        <DimensionModal
          dimension={activeDimModal}
          onClose={() => setActiveDimModal(null)}
          triggerRef={dimModalTriggerRef}
        />
      )}

      {/* ── Unlock Report Modal ───────────────────────────────────────── */}
      {showUnlockModal && (
        <UnlockReportModal
          results={results}
          onClose={() => setShowUnlockModal(false)}
          onUnlock={(tierId) => {
            setShowUnlockModal(false);
            handleUpgrade(tierId);
          }}
          onUnlockSuccess={() => {
            setShowUnlockModal(false);
            setIsCurrentAssessmentUnlocked(true);
            setPriorAccess(true);
            // Auto-download the PDF now that the report is unlocked
            handleDownloadPdf();
          }}
          checkoutLoading={checkoutLoading}
        />
      )}

      {/* ── Android "Available on the web" Modal ────────────────────── */}
      {showAndroidModal && (
        <AndroidWebModal onClose={() => setShowAndroidModal(false)} />
      )}

      {/* ── PDF Quota Modal (Atlas Navigator 30-day limit) ───────────── */}
      {showPdfQuotaModal && (
        <PdfQuotaModal
          nextAvailableAt={pdfQuotaNextDate}
          onClose={() => setShowPdfQuotaModal(false)}
        />
      )}

      {/* ── Site Header ──────────────────────────────────────────────── */}
      <header style={s.siteHeader} role="banner">
        <div style={s.headerInner}>
          <a href="/" style={s.headerLogo}>
            <img src="/assets/logo-256x256.png?v=2026-04-13" alt="The Resilience Atlas™" width="32" height="32" />
            The Resilience Atlas&#8482;
          </a>
          <nav style={s.headerNav} aria-label="Main navigation">
            <a href="/" style={s.navLink}>Home</a>
            <a href="/assessment.html" style={s.navLink}>Assessment</a>
            <a href="/iatlas" style={s.navLink}>IATLAS Curriculum</a>
            <a href="/research.html" style={s.navLink}>Research</a>
            <a href="/resources" style={s.navLink}>Resources</a>
            <a href="/teams" style={s.navLink}>Teams</a>
            <a href="/kids.html" style={s.navLink}>Kids</a>
            <a href="/about.html" style={s.navLink}>About</a>
            {isPaidTier(tier) && (
              <a href="/gamification" style={s.journeyNavLink} aria-label="Resilience Journey — your practices and progress"><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{width:16,height:16,verticalAlign:"middle",marginRight:5}} />Resilience Journey</a>
            )}
            <a href="/quiz?retake=1" style={s.retakeBtn}>Retake Quiz</a>
          </nav>
        </div>
      </header>

      <div style={s.page} className="storytelling-page results-story">
      <div style={s.container} className="story-results-wrap">

        {/* Banner */}
        {banner && (
          <div style={s.banner(banner.type)} role="alert">
            {banner.message}
          </div>
        )}

        {/* ── Results header / greeting ─────────────────────────────── */}
        <div style={s.scoreHero} className="story-results-card">
          <div style={s.scoreCircle} aria-label={`Overall resilience score ${results.overall}%`}>
            <span style={s.scoreNum}>{results.overall}</span>
            <span style={s.scorePct}>%</span>
          </div>
          <div style={s.scoreInfo}>
            <div style={s.scoreName}>
              {name ? `${name}'s Resilience Map` : 'Your Resilience Map'}
            </div>
            <p style={s.scoreSub}>
              This is where you stand. An honest, multidimensional portrait of how you navigate
              adversity across six key capacities.{' '}
              You demonstrate a <strong style={{ color: '#2d3748' }}>{level}</strong> resilience
              foundation.{' '}
              {rankedDims[0] && (
                <>
                  Your primary strength is{' '}
                  <strong style={{ color: DIM_COLORS[rankedDims[0][0]] || '#667eea' }}>
                    {rankedDims[0][0]}
                  </strong>
                  {' '}({Math.round(rankedDims[0][1].percentage)}%).
                </>
              )}
            </p>
          </div>
        </div>

        {/* ── Integrated Resilience Wheel ───────────────────────────── */}
        {results && results.scores && (
          <section className="irw-section" aria-labelledby="irwHeading">
            <div className="irw-section-header">
              <div style={{ fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 4, letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} id="irwHeading">
                <BrandIcon name="compass" size={17} color="#667eea" /> Your Resilience Compass &amp; Skills Landscape
              </div>
              <p>
                Your score is shown as a hexagonal overlay. The color-coded rings show your current skill
                proficiency (Foundation → Building → Mastery) for each dimension. The needle points to your
                strongest dimension. Click any label or segment to explore skill-building resources.
              </p>
            </div>
            <IntegratedResilienceWheel
              scores={results.scores}
              interactive={true}
              showLabels={true}
              showSkillRings={true}
              showScorePolygon={true}
              showNeedle={true}
              onDimensionClick={(dim) => {
                setActiveDimModal(dim);
              }}
            />
            <div className="irw-legend" aria-label="Skills wheel legend">
              <span><span className="irw-legend-icon">🌟</span> Developed (Mastery)</span>
              <span><span className="irw-legend-icon">🌱</span> Building</span>
              <span><span className="irw-legend-icon">⚡</span> Foundation</span>
            </div>
            {dominantType && (
              <p style={{ fontSize: 13, color: '#718096', marginTop: 10, textAlign: 'center' }}>
                Your strongest resilience dimension is:{' '}
                <strong style={{ color: DIM_COLORS[dominantType] || '#667eea' }}>{dominantType}</strong>
              </p>
            )}
          </section>
        )}

        {/* ── Primary Resilience Mode ───────────────────────────────── */}
        {dominantType && (() => {
          const topScore    = rankedDims[0] ? Math.round(rankedDims[0][1].percentage) : 0;
          const secondDim   = rankedDims[1] ? rankedDims[1][0] : null;
          const secondScore = rankedDims[1] ? Math.round(rankedDims[1][1].percentage) : 0;
          const lowestDim   = rankedDims.length > 0 ? rankedDims[rankedDims.length - 1][0] : null;
          const gap         = topScore - secondScore;
          const isBlend     = secondDim && gap <= 8;
          const modeColor   = DIM_COLORS[dominantType] || '#667eea';
          return (
            <section
              style={{
                ...s.primaryTypeCard,
                borderTop: `4px solid ${modeColor}`,
                background: 'linear-gradient(135deg, #fafbff 0%, #ffffff 100%)',
              }}
              aria-labelledby="primaryTypeHeading"
            >
              {/* Header row: label + match pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <div style={s.primaryTypeHeading} id="primaryTypeHeading">Your Primary Resilience Mode</div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: isBlend ? '#fef9c3' : `${modeColor}18`,
                  color: isBlend ? '#854d0e' : modeColor,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}>
                  {isBlend ? 'Blend' : 'Strong Match'}
                </span>
              </div>

              {/* Mode name + icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <img src={DIM_ICONS[dominantType]} alt="" aria-hidden="true" style={{ width: 28, height: 28, flexShrink: 0 }} />
                <div style={s.primaryTypeName(modeColor)}>
                  {dominantType}
                </div>
              </div>

              {/* Static description */}
              <p style={{ ...s.primaryTypeDesc, marginBottom: 16 }}>
                {TYPE_DESCRIPTIONS[dominantType] || ''}
              </p>

              {/* Why this is your mode */}
              <div style={{
                background: `${modeColor}0d`,
                border: `1px solid ${modeColor}30`,
                borderRadius: 10,
                padding: '12px 14px',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: modeColor, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  Why this is your mode
                </div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                  <span style={{ display: 'block', marginBottom: 4 }}>
                    Your <strong style={{ color: modeColor }}>{dominantType}</strong> dimension leads at{' '}
                    <strong>{topScore}%</strong>{gap > 0 ? ` — ${gap} points ahead of your next dimension` : ''}.
                  </span>
                  {isBlend && secondDim && (
                    <span style={{ display: 'block' }}>
                      Your <strong style={{ color: DIM_COLORS[secondDim] || '#667eea' }}>{secondDim}</strong> dimension
                      is close behind at <strong>{secondScore}%</strong>, giving you a blended resilience profile that draws on both modes.
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic CTA */}
              {lowestDim && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <a
                    href="/resources"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      background: modeColor,
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 14px',
                      textDecoration: 'none',
                      transition: 'opacity .15s',
                    }}
                  >
                    <img src={DIM_ICONS[dominantType]} alt="" aria-hidden="true" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} />
                    Explore {dominantType.split('-')[0]} resources
                  </a>
                  <a
                    href="/resources"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: DIM_COLORS[lowestDim] || '#667eea',
                      background: `${DIM_COLORS[lowestDim] || '#667eea'}12`,
                      border: `1px solid ${DIM_COLORS[lowestDim] || '#667eea'}30`,
                      borderRadius: 8,
                      padding: '8px 14px',
                      textDecoration: 'none',
                      transition: 'opacity .15s',
                    }}
                  >
                    <img src={DIM_ICONS[lowestDim]} alt="" aria-hidden="true" style={{ width: 15, height: 15 }} />
                    Grow your {lowestDim.split('-')[0]} capacity
                  </a>
                </div>
              )}
            </section>
          );
        })()}

        {/* ── Resilience Journey CTA (paid users) ──────────────────── */}
        {hasPremiumAccess && tierCheckComplete && (
          <section
            style={{
              background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
              border: '1px solid #ddd6fe',
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              flexWrap: 'wrap',
              boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
            }}
            aria-labelledby="journeyCTAHeading"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 200 }}>
              <img src="/icons/practice-banner.svg" alt="" aria-hidden="true" style={{ width: 40, height: 40, flexShrink: 0 }} />
              <div>
                <div id="journeyCTAHeading" style={{ fontSize: 16, fontWeight: 700, color: '#4c1d95', marginBottom: 4 }}>
                  Ready to build your practice?
                </div>
                <p style={{ fontSize: 13, color: '#6d28d9', margin: 0, lineHeight: 1.5 }}>
                  {hasFullPracticeAccess
                    ? 'You have full access: all 30 in-app practices plus daily micro-practice emails.'
                    : 'Starter access includes 12 in-app practices. Upgrade to Atlas Navigator for all 30 practices and daily micro-practice emails.'}
                </p>
              </div>
            </div>
            <a
              href="/gamification"
              style={{
                display: 'inline-block',
                padding: '10px 22px',
                background: '#7c3aed',
                color: '#ffffff',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
              aria-label="Start your Resilience Journey — go to micro-practices"
            >
              Start Your Practice →
            </a>
          </section>
        )}

        {/* ── Insight Progress Indicator (free users only) ──────────── */}
        {!hasPremiumAccess && tierCheckComplete && (
          <div style={s.insightProgress} aria-hidden="true">
            <p style={s.insightProgressLabel}>Your resilience insights unlocked</p>
            <div style={s.insightProgressBarWrap} role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100}>
              <div style={s.insightProgressBarFill} />
            </div>
            <p style={s.insightProgressHint}>Upgrade to unlock your complete resilience atlas</p>
          </div>
        )}

        {/* ── Core Strengths Grid ───────────────────────────────────── */}
        {rankedDims.length >= 3 && (
          <div style={s.narrativeSection}>
            <div style={s.narrativeHeading}><BrandIcon name="map" size={17} color="#0891B2" /> Your Resilience Constellation</div>
            {[
              { label: 'Primary Strength', dimEntry: rankedDims[0] },
              { label: 'Secondary Strength',   dimEntry: rankedDims[1] },
              { label: 'Emerging Edge', dimEntry: rankedDims[rankedDims.length - 1] },
            ].map(({ label, dimEntry }) => {
              const [dim, score] = dimEntry;
              const color = DIM_COLORS[dim] || '#667eea';
              const desc  = TYPE_DESCRIPTIONS[dim] || '';
              return (
                <div key={dim} style={s.strengthRow(color)}>
                  <div style={s.strengthLabel}>{label}</div>
                  <div style={s.strengthName(color)}>
                    {dim} ({Math.round(score.percentage)}%)
                  </div>
                  {desc && <p style={s.strengthDesc}>{desc}</p>}
                </div>
              );
            })}
            <p style={{ margin: '16px 0 0', fontSize: 12, color: '#718096', lineHeight: 1.5 }}>
              Your primary strength is your anchor under pressure. Cultivating your emerging edge will
              significantly expand your overall resilience capacity.
            </p>
          </div>
        )}

        {/* ── Personalized Report (narrative analysis) ─────────────── */}
        {rankedDims.length >= 3 && (
          <section style={s.reportSection} aria-labelledby="reportHeading">
            <div style={s.reportHeading} id="reportHeading"><BrandIcon name="document" size={17} color="#667eea" /> Your Resilience Map Report</div>
            <p style={s.reportOverview}>
              Your overall resilience dimension profile is <strong style={{ color: '#2d3748' }}>{results.overall}%</strong> — a{' '}
              {level === 'strong' ? 'strong foundation' : level === 'solid' ? 'solid foundation' : level === 'developing' ? 'developing foundation' : 'emerging foundation'}{' '}
              across six interconnected dimensions. Not a final destination. A starting point.
            </p>
            {[
              { sectionLabel: 'Primary Strength', entry: rankedDims[0], insight: 'Leverage this strength as a foundation for growth across other dimensions.' },
              { sectionLabel: 'Secondary Strength',   entry: rankedDims[1], insight: 'This complements your primary strength and creates a robust resilience foundation.' },
              { sectionLabel: 'Emerging Edge', entry: rankedDims[rankedDims.length - 1], insight: 'This is where you\'re still building capacity. Edges are where growth happens.' },
            ].map(({ sectionLabel, entry, insight }) => {
              const [dim, score] = entry;
              const color = DIM_COLORS[dim] || '#667eea';
              const desc  = TYPE_DESCRIPTIONS[dim] || '';
              return (
                <div key={dim} style={s.reportNrSection(color)}>
                  <div style={s.reportNrHeader}>
                    <span style={s.reportNrLabel}>{sectionLabel}</span>
                    <span style={s.reportNrScore(color)}>{Math.round(score.percentage)}%</span>
                  </div>
                  <div style={s.reportNrName(color)}>{dim}</div>
                  {desc && <p style={s.reportNrDesc}>{desc}</p>}
                  <p style={s.reportNrInsight}>{insight}</p>
                </div>
              );
            })}
            <div style={s.reportSuggestions}>
              <div style={s.reportSuggestionsTitle}>Compass Points for Your Journey</div>
              <ul style={s.reportSuggestionsList}>
                {[
                  `Strengthen your ${rankedDims[0][0]} capacity by helping others develop it`,
                  `Explore how ${rankedDims[1][0]} and ${rankedDims[rankedDims.length - 1][0]} connect in your daily life`,
                  `Start small: one daily practice to cultivate ${rankedDims[rankedDims.length - 1][0]}`,
                  'Track your progress monthly to recognize how your constellation shifts',
                ].map(s2 => (
                  <li key={s2} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span aria-hidden="true" style={{ color: '#10b981', flexShrink: 0 }}>✓</span>
                    <span>{s2}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Upgrade Cards (free users) — shown only after backend confirms free tier ─── */}
        {!hasPremiumAccess && tierCheckComplete && (
          <>
            {/* ── Why Resilience Matters (selling the bigger picture) ─── */}
            <section
              style={{
                background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '28px 24px',
                marginBottom: 24,
              }}
              aria-labelledby="whyResilienceHeading"
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7c3aed', marginBottom: 8 }}>
                Why This Matters
              </div>
              <h2 id="whyResilienceHeading" style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.25 }}>
                Resilience isn't a personality trait. It's a learnable skill.
              </h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: '0 0 20px' }}>
                Most people think of resilience as something you either have or you don't.
                The research tells a different story. Resilience is a dynamic, multi-dimensional
                capacity that can be measured, understood, and deliberately grown. You just took
                the first step: measuring it.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                {[
                  { icon: '/icons/strength.svg', title: 'Science-backed', desc: 'Built on ACT, positive psychology, and ABA research spanning 40+ years of resilience science.' },
                  { icon: '/icons/compass.svg', title: 'Six dimensions', desc: 'Unlike one-dimensional stress tests, we measure the full landscape of how you navigate adversity.' },
                  { icon: '/icons/growth.svg', title: 'Growable', desc: 'Every dimension you see here can be strengthened with targeted practices — your score is a starting point, not a ceiling.' },
                  { icon: '/icons/goal.svg', title: 'Actionable', desc: 'Your results translate directly into evidence-based micro-practices tailored to your specific profile.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: 8 }} aria-hidden="true">
                      <img src={icon} alt="" width={24} height={24} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
              {!isCapacitorAndroid() && (
              <div style={{ background: '#fff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>What upgrading gives you:</div>
                <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 13, color: '#334155', lineHeight: 1.9 }}>
                  <li><strong>Atlas Starter ($9.99)</strong> — Full PDF download + email for this assessment, dimension explanations, and 12 in-app starter practices</li>
                  <li><strong>Atlas Navigator ($49.99)</strong> — Deep analysis of all 6 dimensions, personalized growth strategies, full PDF download + email (1 every 30 days), all 30 in-app practices, and daily micro-practice emails</li>
                </ul>
              </div>
              )}
            </section>

            {isCapacitorAndroid() ? (
              <InAppWebsiteOnlyNotice
                title="Full report on the website"
                description="To unlock your full PDF report and premium features, visit our website."
                style={{ margin: '0 0 24px' }}
              />
            ) : (
            <UpgradeCardsSection
              getPrice={getPrice}
              onUpgrade={handleUpgrade}
              checkoutLoading={checkoutLoading}
            />
            )}
          </>
        )}

        {/* ── Prior Purchases / ResultsHistory ─────────────────────── */}
        <ResultsHistory
          email={getEffectiveEmail()}
        />

        {/* ── Assessment History with unlock status ────────────────── */}
        <AssessmentHistory
          email={getEffectiveEmail()}
          onUnlock={(assessment) => {
            // On Capacitor Android, skip the Stripe modal entirely and direct
            // the user to the website for purchase instead.
            if (isCapacitorAndroid()) {
              setShowAndroidModal(true);
              return;
            }
            // Store the assessment hash in sessionStorage so the checkout
            // success flow can link the purchase to this specific assessment.
            try {
              sessionStorage.setItem('pending_unlock_hash', assessment.hash || '');
            } catch (_) { /* ignore */ }
            setShowUnlockModal(true);
          }}
          checkoutLoading={checkoutLoading}
          getTokenFn={getAccessTokenSilently}
        />

        {/* ── PDF Download + Action Buttons ─────────────────────────── */}
        {hasPremiumAccess && (
          <div style={s.downloadSection}>
            <div style={s.downloadHeading}>
              <img src="/icons/success.svg" alt="" aria-hidden="true" width={20} height={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Your Full Report is Ready
            </div>
            <p style={s.downloadDesc}>
              {isAtlasPremium
                ? 'Your Atlas Premium access lets you download this report any time.'
                : tier === 'atlas-starter'
                  ? 'Your Atlas Starter report is ready. Download your personalized PDF report now.'
                  : tier === 'atlas-navigator'
                    ? 'Your Atlas Navigator lifetime access lets you download a new report every 30 days.'
                    : 'Your report is ready. Download your personalized PDF now.'
              }
            </p>
            {pdfError && (
              <div style={{ color: '#fc8181', fontSize: 13, marginBottom: 12 }}>{pdfError}</div>
            )}
            <button
              id="downloadPdfReportBtn"
              type="button"
              data-ignore-gating="true"
              style={s.downloadBtn(pdfLoading || tierLoading)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.__DEBUG_PDF) console.log('[PDF] Download click');
                handleDownloadPdf();
              }}
              disabled={pdfLoading || tierLoading}
              aria-busy={pdfLoading}
            >
              {pdfLoading ? 'Generating PDF…' : 'Download PDF Report'}
            </button>
          </div>
        )}

        {/* ── Locked PDF Download (users without access to this assessment) ── */}
        {!hasPremiumAccess && (
          <div id="pdfAlert" role="alert" className="btn-locked-row">
            {!tierCheckComplete ? (
              <button
                type="button"
                className="btn btn-locked btn-locked-pdf"
                disabled
                aria-label="Verifying your access…"
              >
                Verifying your access…
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-locked btn-locked-pdf"
                onClick={() => setShowUnlockModal(true)}
                aria-label="Unlock PDF Download — requires Atlas Starter or Atlas Navigator"
              >
                <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                Unlock PDF Download
              </button>
            )}
          </div>
        )}

        {/* Retake row */}
        <div style={s.retakeRow}>
          <button
            type="button"
            style={s.retakeLink}
            onClick={() => {
              // Clear stored assessment data so quiz.js doesn't detect existing
              // results and redirect back here before the new quiz starts.
              try {
                localStorage.removeItem('resilience_tier');
                localStorage.removeItem('resilience_results');
                localStorage.removeItem('resilience_email');
              } catch (_) { /* ignore */ }
              window.location.href = '/quiz?retake=1';
            }}
          >
            ↺ Re-take the assessment
          </button>
        </div>

        {/* ── Email Report Section ──────────────────────────────────── */}
        <section style={s.emailSection} aria-labelledby="emailHeading">
          <div style={s.emailHeading} id="emailHeading"><BrandIcon name="mail" size={17} color="#0891B2" /> Email Your Brief Summary</div>
          <p style={s.emailDesc}>
            Free users can email a brief summary. Full PDF report email delivery requires Atlas Starter or Atlas Navigator.
          </p>
          <div style={s.emailInputRow}>
            <input
              type="email"
              value={emailInput || (results && results.email) || ''}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address to send report"
              style={s.emailInput}
              autoComplete="email"
            />
            <button
              type="button"
              style={s.emailBtn(emailLoading)}
              onClick={handleEmailReport}
              disabled={emailLoading}
              aria-busy={emailLoading}
            >
              {emailLoading ? 'Sending…' : 'Send Brief Summary'}
            </button>
          </div>
          {emailAlert && (
            <div style={s.emailAlert(emailAlert.success)} role="alert">{emailAlert.message}</div>
          )}
        </section>

        {/* ── Evidence-Based Practices ──────────────────────────────── */}
        {Object.keys(EVIDENCE_PRACTICES).length > 0 && (
          <section style={s.practicesSection} aria-labelledby="practicesHeading">
            <div style={s.practicesHeading} id="practicesHeading"><BrandIcon name="flask" size={17} color="#10b981" /> Evidence-Based Micro-Practices</div>
            <p style={s.practicesSubheading}>
              {showAllPractices
                ? hasFullPracticeAccess
                  ? 'All 30 practices in your full resilience journey — grounded in ACT and ABA.'
                  : 'Starter track: 12 in-app practices. Daily practice emails unlock with Atlas Navigator or above.'
                : hasFullPracticeAccess
                  ? `Your 30-day resilience journey — one practice per day, tailored to your results. Day ${practicePlanDay} of 30.`
                  : `Starter track: 12 in-app practices and no daily emails. Practice ${((practicePlanDay - 1) % 12) + 1} of 12.`}
            </p>

            {/* ── Gamification header (Atlas Starter+) ────────────────── */}
            {hasPremiumAccess && (() => {
              const allPracticeKeys = hasFullPracticeAccess
                ? Array.from({ length: 30 }, (_, idx) => `day-${idx + 1}`)
                : starterPracticeList.map((entry) => entry.starterKey);
              const totalAll = allPracticeKeys.length;
              const completedAll = allPracticeKeys.filter(k => gamData.completions[k]).length;
              const progressPct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;
              return (
                <div style={s.gamHeader} role="region" aria-label="Practice progress dashboard">
                  <div style={s.gamStats}>
                    <div style={s.gamStat}>
                      <span style={s.gamStatValue}>{completedAll}/{totalAll}</span>
                      <span style={s.gamStatLabel}>Completed</span>
                    </div>
                    <div style={s.gamStat}>
                      <span style={s.gamStatValue}>
                        <GameIcon name="star-earned" alt="" size={18} className="game-stat-icon" />
                        {gamData.points}
                      </span>
                      <span style={s.gamStatLabel}>Points</span>
                    </div>
                    <div style={s.gamStat}>
                      <span style={s.gamStatValue}>
                        <img src="/icons/streaks.svg" alt="" aria-hidden="true" width="16" height="16" style={{ verticalAlign: 'middle', marginRight: 2 }} />
                        {gamData.streak}
                      </span>
                      <span style={s.gamStatLabel}>Day Streak</span>
                    </div>
                  </div>
                  <div style={s.gamProgressTrack} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label={`${progressPct}% of all practices completed`}>
                    <div style={s.gamProgressFill(progressPct)} />
                  </div>
                  <div style={s.gamProgressLabel}>{progressPct}% of all practices completed</div>
                  {gamData.badges.length > 0 && (
                    <div style={s.gamBadgesRow} aria-label="Earned badges">
                      {gamData.badges.map(b => (
                        <div key={b.name} style={s.gamBadge} title={b.desc} role="img" aria-label={`Badge: ${b.name} — ${b.desc}`}>
                          {b.icon && GAME_ICON_PATH_RE.test(b.icon)
                            ? <GameIcon name={b.icon.replace(GAME_ICON_PATH_RE, '$1')} alt="" size={20} />
                            : b.icon && b.icon.startsWith('/icons/')
                            ? <img src={b.icon} alt="" aria-hidden="true" width="20" height="20" />
                            : <span aria-hidden="true">{b.icon}</span>}
                          <span>{b.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Today's practice (paced 30-day delivery) ──────────────── */}
            {!showAllPractices && (hasFullPracticeAccess ? todaysPractice : starterPracticeList[((practicePlanDay - 1) % 12)]) && (() => {
              const entry = hasFullPracticeAccess
                ? todaysPractice
                : starterPracticeList[((practicePlanDay - 1) % 12)];
              const { day, dim, practice } = entry;
              const color = DIM_COLORS[dim] || '#667eea';
              const practiceKey = hasFullPracticeAccess ? `day-${day}` : practice.title;
              const isCompleted = !!(gamData.completions[practiceKey]);
              const isTimerActive = timerData && timerData.practiceKey === practiceKey;
              const timerFinished = isTimerActive && timerData.secondsLeft === 0;
              const durSecs = parseDurationSecs(practice.duration);
              return (
                <div>
                  {/* Day badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 12,
                  }}>
                    <span style={{
                      background: color + '18', color, border: `1px solid ${color}30`,
                      borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                    }}>
                      <img src="/icons/story.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                      {hasFullPracticeAccess ? `Day ${day} of 30` : `Practice ${day} of 12`}
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {dim}
                    </span>
                  </div>

                  {/* Practice card */}
                  <div
                    style={{ ...s.practiceCard(color), ...(isCompleted ? s.gamCompleteCard : {}) }}
                  >
                    <div style={{ ...s.practiceCardHeader, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={practice.icon} alt="" aria-hidden="true" width="20" height="20" style={{ flexShrink: 0 }} />
                        <span style={{ ...s.practiceTitle, textDecoration: isCompleted ? 'line-through' : 'none' }}>{practice.title}</span>
                      </div>
                      {isCompleted && <span style={{ fontSize: 16 }} aria-label="Completed"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={16} height={16} style={{ verticalAlign: 'middle' }} /></span>}
                    </div>
                    <div style={s.practiceTags}>
                      <span style={s.practiceTag}>{practice.duration}</span>
                      <span style={s.practiceTag}>{practice.difficulty}</span>
                    </div>
                    <div style={s.practicePrinciples}>
                      <span style={s.practicePrincipleBadge('rgba(79,70,229,0.7)')}>ACT: {practice.actPrinciple}</span>
                      <span style={s.practicePrincipleBadge('rgba(5,150,105,0.7)')}>ABA: {practice.abaPrinciple}</span>
                    </div>
                    <ol style={s.practiceSteps}>
                      {practice.instructions.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <p style={{ fontSize: 11, color: '#4a5568', margin: 0, fontStyle: 'italic' }}>
                      Educational note: These practices support self-reflection. Not therapeutic treatment.
                    </p>

                    {/* ── Gamification controls (Atlas Starter+) ────────── */}
                    {hasPremiumAccess && (
                      <div style={s.gamActions}>
                        {durSecs > 0 && !isCompleted && !isTimerActive && (
                          <button
                            type="button"
                            style={s.gamTimerBtn}
                            onClick={() => startTimer(practiceKey, durSecs)}
                            aria-label={`Start ${practice.duration} timer for ${practice.title}`}
                          >
                            ⏱ Start Timer
                          </button>
                        )}
                        {isTimerActive && (
                          <div style={s.gamTimerDisplay} role="timer" aria-label={`Timer: ${fmtSecs(timerData.secondsLeft)} remaining`}>
                            <span style={s.gamTimerCount}>{fmtSecs(timerData.secondsLeft)}</span>
                            {!timerFinished && (
                              <button type="button" style={s.gamTimerPauseBtn} onClick={pauseTimer} aria-label={timerData.running ? 'Pause timer' : 'Resume timer'}>
                                {timerData.running ? '⏸' : '▶'}
                              </button>
                            )}
                            <button type="button" style={s.gamTimerStopBtn} onClick={stopTimer} aria-label="Stop timer">✕</button>
                          </div>
                        )}
                        <button
                          type="button"
                          style={s.gamCompleteBtn(isCompleted)}
                          onClick={() => handleTogglePractice(practiceKey, isTimerActive)}
                          aria-pressed={isCompleted}
                          aria-label={isCompleted ? `Unmark ${practice.title} as complete` : `Mark ${practice.title} as complete`}
                        >
                          {isCompleted
                            ? <><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Completed!</>
                            : '☐ Mark Complete'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upcoming preview */}
                  <div style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 10, padding: '14px 16px', marginTop: 12,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                      <img src="/icons/compass.svg" alt="" aria-hidden="true" width={12} height={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />
                      {hasFullPracticeAccess ? 'Coming up in your 30-day plan:' : 'More starter practices:'}
                    </div>
                    {[1, 2, 3].map((offset) => {
                      const nextDay = day + offset;
                      const previewEntry = hasFullPracticeAccess
                        ? (thirtyDayPracticePlan || []).find((p) => p.day === nextDay)
                        : starterPracticeList.find((p) => p.day === nextDay);
                      if (!previewEntry) return null;
                      return (
                        <div key={offset} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'flex', gap: 8 }}>
                          <span style={{ fontWeight: 600, color: '#64748b', minWidth: 72 }}>
                            {hasFullPracticeAccess ? `Day ${nextDay}:` : `Practice ${nextDay}:`}
                          </span>
                          <span>{previewEntry.dim}</span>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      style={{
                        marginTop: 10, fontSize: 12, color: '#4f46e5', background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                        textDecoration: 'underline',
                      }}
                      onClick={() => setShowAllPractices(true)}
                    >
                      View all practices →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Full practices list (expanded view) ───────────────────── */}
            {showAllPractices && (
              <>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    type="button"
                    style={{
                      fontSize: 12, color: '#4f46e5', background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0, fontFamily: 'inherit', textDecoration: 'underline',
                    }}
                    onClick={() => setShowAllPractices(false)}
                  >
                    ← Back to today's practice
                  </button>
                </div>
                {(hasFullPracticeAccess ? (thirtyDayPracticePlan || []) : starterPracticeList).map((entry) => {
                  const { day, dim, practice } = entry;
                  const color = DIM_COLORS[dim] || '#667eea';
                  const dimIcon = DIM_ICONS[dim];
                  const practiceKey = hasFullPracticeAccess ? `day-${day}` : practice.title;
                  const isCompleted = !!(gamData.completions[practiceKey]);
                  const isTimerActive = timerData && timerData.practiceKey === practiceKey;
                  const timerFinished = isTimerActive && timerData.secondsLeft === 0;
                  const durSecs = parseDurationSecs(practice.duration);
                  return (
                    <div key={practiceKey}>
                      <div style={s.practiceDimHeader(color)} aria-label={`${dim} practices`}>
                        {dimIcon && (
                          <img src={dimIcon} alt="" aria-hidden="true" width="20" height="20"
                            style={{ verticalAlign: 'middle', marginRight: 6, flexShrink: 0 }} />
                        )}
                        <span>{hasFullPracticeAccess ? `Day ${day} · ${dim}` : dim}</span>
                      </div>
                      <div
                        style={{ ...s.practiceCard(color), ...(isCompleted ? s.gamCompleteCard : {}) }}
                      >
                        <div style={{ ...s.practiceCardHeader, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={practice.icon} alt="" aria-hidden="true" width="20" height="20" style={{ flexShrink: 0 }} />
                            <span style={{ ...s.practiceTitle, textDecoration: isCompleted ? 'line-through' : 'none' }}>{practice.title}</span>
                          </div>
                          {isCompleted && <span style={{ fontSize: 16 }} aria-label="Completed"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={16} height={16} style={{ verticalAlign: 'middle' }} /></span>}
                        </div>
                        <div style={s.practiceTags}>
                          <span style={s.practiceTag}>{practice.duration}</span>
                          <span style={s.practiceTag}>{practice.difficulty}</span>
                        </div>
                        <div style={s.practicePrinciples}>
                          <span style={s.practicePrincipleBadge('rgba(79,70,229,0.7)')}>ACT: {practice.actPrinciple}</span>
                          <span style={s.practicePrincipleBadge('rgba(5,150,105,0.7)')}>ABA: {practice.abaPrinciple}</span>
                        </div>
                        <ol style={s.practiceSteps}>
                          {practice.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                        <p style={{ fontSize: 11, color: '#4a5568', margin: 0, fontStyle: 'italic' }}>
                          Educational note: These practices support self-reflection. Not therapeutic treatment.
                        </p>

                        {/* ── Gamification controls (Atlas Starter+) ────────── */}
                        {hasPremiumAccess && (
                          <div style={s.gamActions}>
                            {durSecs > 0 && !isCompleted && !isTimerActive && (
                              <button
                                type="button"
                                style={s.gamTimerBtn}
                                onClick={() => startTimer(practiceKey, durSecs)}
                                aria-label={`Start ${practice.duration} timer for ${practice.title}`}
                              >
                                ⏱ Start Timer
                              </button>
                            )}
                            {isTimerActive && (
                              <div style={s.gamTimerDisplay} role="timer" aria-label={`Timer: ${fmtSecs(timerData.secondsLeft)} remaining`}>
                                <span style={s.gamTimerCount}>{fmtSecs(timerData.secondsLeft)}</span>
                                {!timerFinished && (
                                  <button type="button" style={s.gamTimerPauseBtn} onClick={pauseTimer} aria-label={timerData.running ? 'Pause timer' : 'Resume timer'}>
                                    {timerData.running ? '⏸' : '▶'}
                                  </button>
                                )}
                                <button type="button" style={s.gamTimerStopBtn} onClick={stopTimer} aria-label="Stop timer">✕</button>
                              </div>
                            )}
                            <button
                              type="button"
                              style={s.gamCompleteBtn(isCompleted)}
                              onClick={() => handleTogglePractice(practiceKey, isTimerActive)}
                              aria-pressed={isCompleted}
                              aria-label={isCompleted ? `Unmark ${practice.title} as complete` : `Mark ${practice.title} as complete`}
                            >
                              {isCompleted
                                ? <><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Completed!</>
                                : '☐ Mark Complete'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        )}

        {/* ── Personalized Next Steps ──────────────────────────────── */}
        {rankedDims.length > 0 && (
          <div style={s.nextStepsSection}>
            <div style={s.nextStepsHeading}><BrandIcon name="target" size={17} color="#f59e0b" /> Your Personalized Next Steps</div>
            <p style={s.nextStepsIntro}>
              {rankedDims.length === 1
                ? 'Here are actionable practices to build your resilience:'
                : 'Based on your emerging dimensions, here are compass points to develop your resilience:'
              }
            </p>
            {rankedDims.slice(-Math.min(2, rankedDims.length)).reverse().map(([dim, score]) => {
              const color = DIM_COLORS[dim] || '#667eea';
              const steps = DIMENSION_NEXT_STEPS[dim] || [];
              const pct   = Math.round(score.percentage);
              return (
                <div key={dim} style={s.nextStepsCard(color)}>
                  <div style={s.nextStepsCardHeader}>
                    {DIM_ICONS[dim] && (
                      <img src={DIM_ICONS[dim]} alt="" aria-hidden="true" width="18" height="18"
                        style={{ verticalAlign: 'middle', marginRight: 4, flexShrink: 0 }} />
                    )}
                    <span style={s.nextStepsDimName(color)}>{dim}</span>
                    <span style={s.nextStepsDimScore}>{pct}% — Growth Focus</span>
                  </div>
                  <ul style={s.nextStepsList} aria-label={`Next steps for ${dim}`}>
                    {steps.map(step => (
                      <li key={step.title} style={s.nextStepItem}>
                        {step.icon && step.icon.startsWith('/icons/') ? (
                          <img src={step.icon} alt="" aria-hidden="true" style={s.nextStepIconImg} />
                        ) : (
                          <span style={s.nextStepIcon} aria-hidden="true">{step.icon}</span>
                        )}
                        <div>
                          <strong style={s.nextStepTitle}>{step.title}</strong>
                          <p style={s.nextStepDesc}>{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Resilience Affirmations ───────────────────────────────── */}
        {dominantType && AFFIRMATIONS[dominantType] && (
          <section style={s.affirmationsSection} aria-labelledby="affirmationsHeading">
            <div style={s.affirmationsHeading} id="affirmationsHeading"><BrandIcon name="sparkle" size={17} color="#7c3aed" /> Your Resilience Affirmations</div>
            <p style={s.affirmationsSubtitle}>
              Strength statements aligned with your{' '}
              <strong style={{ color: DIM_COLORS[dominantType] || '#667eea' }}>{dominantType}</strong> resilience profile.
            </p>
            <p style={{ fontSize: 11, color: '#4a5568', marginBottom: 14, lineHeight: 1.5 }}>
              ℹ️ <strong style={{ color: '#718096' }}>Educational Note:</strong> These affirmations support self-reflection and psychological flexibility.
              They are not therapeutic statements or clinical treatment.
            </p>
            {/* Daily affirmation widget */}
            {AFFIRMATIONS[dominantType][0] && (
              <div style={s.affirmationDailyWidget}>
                <div style={s.affirmationDailyTitle}><BrandIcon name="star" size={14} color="#6d28d9" /> Your Affirmation for Today</div>
                <blockquote style={s.affirmationDailyText}>
                  &ldquo;{AFFIRMATIONS[dominantType][0]}&rdquo;
                </blockquote>
              </div>
            )}
            {/* All affirmation cards */}
            <div style={s.affirmationCardsGrid}>
              {AFFIRMATIONS[dominantType].slice(1).map((text, i) => (
                <div key={i} style={s.affirmationCard}>
                  &ldquo;{text}&rdquo;
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Reminder Opt-In ──────────────────────────────────────── */}
        {results && (results.email || localStorage.getItem('resilience_email')) && !reminderDone && (
          <div style={s.reminderSection} aria-labelledby="reminderOptInHeading">
            <div style={s.reminderHeading} id="reminderOptInHeading"><BrandIcon name="bell" size={17} color="#10b981" /> Set a Reassessment Reminder</div>
            <p style={s.reminderDesc}>
              Resilience grows over time. Would you like a reminder to retake the assessment in 30 days
              to track your progress?
            </p>
            <div style={s.reminderCheckRow}>
              <input
                id="reminderOptInCheckbox"
                type="checkbox"
                style={s.reminderCheckbox}
                checked={reminderChecked}
                onChange={e => setReminderChecked(e.target.checked)}
              />
              <label htmlFor="reminderOptInCheckbox" style={s.reminderCheckLabel}>
                Yes, remind me in 30 days to retake the assessment
              </label>
            </div>
            <button
              type="button"
              style={s.reminderBtn(reminderLoading)}
              onClick={handleReminderOptIn}
              disabled={reminderLoading}
            >
              {reminderLoading ? 'Saving…' : 'Set Reminder'}
            </button>
            {reminderMessage && (
              <div style={s.reminderStatus(reminderStatus === 'success')} role="status">
                {reminderMessage}
              </div>
            )}
          </div>
        )}

        {/* ── Social Sharing + Quicklinks ───────────────────────────── */}
        {results && (
          <section style={s.shareSection} aria-labelledby="shareResultsHeading">
            <div style={s.shareHeading} id="shareResultsHeading"><BrandIcon name="megaphone" size={17} color="#0891B2" /> Share Your Resilience Dimension</div>
            <p style={s.shareDesc}>
              Discovered your strongest dimension? Share it and invite others to map theirs.
            </p>
            <div style={s.shareButtons} role="group" aria-label="Share options">
              <ShareButton
                label="LinkedIn"
                icon="in"
                bg="#0a66c2"
                onClick={() => {
                  shareLinkedIn(dominantType);
                  trackShareEvent('linkedin', dominantType);
                }}
              />
              <ShareButton
                label="X / Twitter"
                icon="𝕏"
                bg="#000000"
                onClick={() => {
                  shareTwitter(dominantType);
                  trackShareEvent('twitter', dominantType);
                }}
              />
              <ShareButton
                label="Instagram"
                icon={<img src="/icons/video.svg" alt="" width={14} height={14} style={{ verticalAlign: "middle", filter: "brightness(0) invert(1)" }} />}
                bg="#e1306c"
                onClick={() => {
                  trackShareEvent('instagram', dominantType);
                  window.open(SOCIAL_URLS.instagram, '_blank', 'noopener,noreferrer');
                }}
              />
              <ShareButton
                label="Facebook"
                icon="f"
                bg="#1877f2"
                onClick={() => {
                  shareFacebook();
                  trackShareEvent('facebook', dominantType);
                }}
              />
              <ShareButton
                label="YouTube"
                icon="▶"
                bg="#C41E3A"
                onClick={() => {
                  shareYouTube();
                  trackShareEvent('youtube', dominantType);
                }}
              />
              <ShareButton
                label={copyLabel}
                icon={<img src="/icons/network.svg" alt="" width={14} height={14} style={{ verticalAlign: "middle", filter: "brightness(0) invert(1)" }} />}
                bg="#4a5568"
                onClick={handleCopyLink}
              />
              <ShareButton
                label="Download Radar"
                icon={<img src="/icons/checkmark.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle', filter: 'brightness(0) invert(1)' }} />}
                bg="#0891B2"
                onClick={handleDownloadRadar}
              />
            </div>
            {dominantType && (
              <p style={s.sharePreview} aria-live="polite">
                &ldquo;{buildShareText(dominantType)}&rdquo;
              </p>
            )}
            <p style={s.shareInstagramHint}>
              <strong>Instagram tip:</strong> Click <em>Download Radar</em> above to save your radar graphic, then post it and tag{' '}
              <a
                href={SOCIAL_URLS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#718096' }}
              >
                @atlas.resilience
              </a>!
            </p>
          </section>
        )}

        {/* ── Invite Colleagues ─────────────────────────────────────── */}
        <section style={s.inviteSection} aria-labelledby="inviteHeading">
          <div style={s.inviteHeading} id="inviteHeading"><BrandIcon name="users" size={17} color="#667eea" /> Compare with Your Team</div>
          <p style={s.inviteDesc}>
            Invite a colleague to take the assessment and compare your Six Dimensions of Resilience profiles.
          </p>
          <form style={s.inviteForm} onSubmit={handleInviteColleague} noValidate>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              aria-label="Colleague email address"
              style={s.inviteInput}
              autoComplete="email"
            />
            <button
              type="submit"
              style={s.inviteBtn(inviteLoading)}
              disabled={inviteLoading}
              aria-busy={inviteLoading}
            >
              {inviteLoading ? '⏳ Sending…' : 'Send Invite'}
            </button>
          </form>
          {inviteStatus && (
            <p style={s.inviteStatus(inviteStatus.success)} aria-live="polite">
              {inviteStatus.message}
            </p>
          )}
        </section>

        {/* ── Privacy Guarantee ─────────────────────────────────────── */}
        <div style={s.privacyGuarantee} role="note" aria-label="Data privacy guarantee">
          <span style={s.privacyIcon}>
            <img src="/icons/lock.svg" alt="" aria-hidden="true" width={16} height={16} style={{ verticalAlign: 'middle' }} />
          </span>
          <p style={s.privacyText}>
            <strong style={{ color: '#2d3748' }}>You control your data.</strong>{' '}
            Delete your account and results anytime —{' '}
            <a href="/privacy" style={s.privacyLink}>Learn about data control</a>.
          </p>
        </div>

        {/* ── Footer Nav + Social Follow ─────────────────────────────── */}
        <nav style={s.quicklinksSection} aria-label="Quick links">
          <div style={s.quicklinksGrid}>
            <div style={s.quicklinksGroup}>
              <div style={s.quicklinksGroupHeading}>Assessment</div>
              <ul style={s.quicklinksGroupLinks}>
                <li><a href="/assessment.html" style={s.quicklinkAnchor}>About the Assessment</a></li>
                <li><a href="/quiz?retake=1" style={s.quicklinkAnchor}>Take the Quiz</a></li>
                <li><a href="/results" style={s.quicklinkAnchor}>My Results</a></li>
              </ul>
            </div>
            <div style={s.quicklinksGroup}>
              <div style={s.quicklinksGroupHeading}>Research</div>
              <ul style={s.quicklinksGroupLinks}>
                <li><a href="/research.html" style={s.quicklinkAnchor}>Foundations</a></li>
                <li><a href="/research.html#dimensions" style={s.quicklinkAnchor}>Six Dimensions</a></li>
              </ul>
            </div>
            <div style={s.quicklinksGroup}>
              <div style={s.quicklinksGroupHeading}>Programs</div>
              <ul style={s.quicklinksGroupLinks}>
                <li><a href="/teams" style={s.quicklinkAnchor}>For Teams</a></li>
                <li><a href="/kids.html" style={s.quicklinkAnchor}>For Kids</a></li>
                <li><a href="/iatlas" style={s.quicklinkAnchor}>IATLAS Curriculum</a></li>
              </ul>
            </div>
            <div style={s.quicklinksGroup}>
              <div style={s.quicklinksGroupHeading}>Company</div>
              <ul style={s.quicklinksGroupLinks}>
                <li><a href="/about.html" style={s.quicklinkAnchor}>About</a></li>
                <li><a href="/founder.html" style={s.quicklinkAnchor}>Our Founder</a></li>
                <li><a href="/research.html" style={s.quicklinkAnchor}>Research</a></li>
                <li><a href="/privacy" style={s.quicklinkAnchor}>Privacy &amp; Data</a></li>
              </ul>
            </div>
          </div>

          {/* Social follow row */}
          <div style={s.socialFollowRow}>
            <span style={s.socialFollowLabel}>Follow us</span>
            <SocialFollowLink label="LinkedIn" icon="in" href={SOCIAL_URLS.linkedin} bg="#0a66c2" />
            <SocialFollowLink label="X / Twitter" icon="𝕏" href={SOCIAL_URLS.twitter} bg="#000000" />
            <SocialFollowLink label="Facebook" icon="f" href={SOCIAL_URLS.facebook} bg="#1877f2" />
            <SocialFollowLink label="Instagram" icon={<img src="/icons/video.svg" alt="" width={14} height={14} style={{ verticalAlign: "middle", filter: "brightness(0) invert(1)" }} />} href={SOCIAL_URLS.instagram} bg="#e1306c" />
            <SocialFollowLink label="YouTube" icon="▶" href={SOCIAL_URLS.youtube} bg="#C41E3A" />
          </div>

          <div style={s.footerBottom}>
            <p><strong>The Resilience Atlas™ — Understand. Strengthen. Transform.</strong></p>
            <p>A research-based resilience assessment platform founded on published 2013 doctoral research.</p>
            <p>© 2026 The Resilience Atlas™ — a trademark of <strong>Janeen Molchany Ph.D., BCBA</strong>.</p>
            <p>For educational and self-reflection purposes only. Not a clinical assessment.</p>
          </div>
        </nav>

      </div>
      </div>
    </>
  );
}
