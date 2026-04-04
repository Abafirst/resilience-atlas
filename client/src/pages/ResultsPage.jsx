import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import ResultsHistory from '../components/ResultsHistory.jsx';
import BrandCompass from '../components/BrandCompass.jsx';
import UnlockReportModal from '../components/UnlockReportModal.jsx';
import AssessmentHistory from '../components/AssessmentHistory.jsx';

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
      subtext:  'Track progress over time, compare results, and access unlimited reassessments with a lifetime Atlas Premium licence.',
      ctaLabel: 'Upgrade to Atlas Premium — $49.99',
      offer:    null,
    },
  },
  variant_a: {
    'atlas-navigator': {
      headline: "You're in the Top 20% — Unlock What's Holding You Back",
      subtext:  'Your free report shows your strengths. The Deep Report reveals your hidden growth edges with expert strategies for every dimension.',
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
      headline: '🎉 Complete Your Resilience Atlas',
      subtext:  "You've completed the assessment — now go deeper. Full dimension analysis, personalized strategies, and a beautiful PDF to keep forever.",
      ctaLabel: 'Get the Full Report — $49.99 Lifetime',
      offer:    { label: '🕐 Limited Offer: Founding Member Price', savingText: 'Lifetime access for just $49.99' },
    },
    'atlas-premium': {
      headline: '⭐ Lifetime Access — No Subscriptions Ever',
      subtext:  'One payment. Unlimited reassessments, evolution tracking, growth pathways, and priority support. No recurring charges.',
      ctaLabel: 'Unlock Atlas Premium — $49.99 Lifetime',
      offer:    { label: '🕐 Limited Offer: Founding Member Price', savingText: 'Lifetime access for just $49.99' },
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

// Value propositions catalogue
const UPSELL_VALUE_PROPS = {
  detailed_analytics:  { icon: '📊', text: 'Detailed analytics across all 6 resilience dimensions' },
  comparison:          { icon: '🔁', text: 'Side-by-side comparison with your previous assessments' },
  priority_support:    { icon: '🛟', text: 'Priority email support from our resilience coaches' },
  ad_free:             { icon: '🚫', text: 'Completely ad-free experience throughout the app' },
  pdf_download:        { icon: '📄', text: 'Beautiful downloadable PDF report you keep forever' },
  unlimited_retakes:   { icon: '🔄', text: 'Unlimited reassessments to track your growth' },
  growth_roadmap:      { icon: '🗺️', text: '30-day personalised growth roadmap' },
  benchmarking:        { icon: '📈', text: 'See how you rank against thousands of users' },
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
            ⭐ Premium
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
                <span className="upsell-value-prop__icon" aria-hidden="true">{p.icon}</span>
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
          🔒 Secure checkout · One-time payment · No recurring charges
        </p>
      </div>
    </div>
  );
}

// ── PromoBanner component ─────────────────────────────────────────────────
function PromoBanner({ message, ctaLabel, targetTier, trigger, onClose, onUpgrade }) {
  const tierRef    = useRef(targetTier);
  const triggerRef = useRef(trigger || 'banner');

  useEffect(() => {
    upsellTrack('impression', triggerRef.current, tierRef.current, {});
  }, []);

  function handleCta() {
    upsellTrack('click', trigger || 'banner', targetTier, {});
    onUpgrade(targetTier);
  }

  function handleClose() {
    upsellTrack('dismiss', trigger || 'banner', targetTier, {});
    upsellSetCooldown();
    onClose();
  }

  return (
    <div id="upsell-promo-banner" className="upsell-promo-banner" role="banner" aria-label="Special offer">
      <span className="upsell-promo-banner__text">{message}</span>
      <button className="upsell-promo-banner__cta" data-tier={targetTier} onClick={handleCta}>
        {ctaLabel}
      </button>
      <button className="upsell-promo-banner__close" aria-label="Dismiss banner" onClick={handleClose}>
        &#10005;
      </button>
    </div>
  );
}

// ── UpgradeCardsSection component ─────────────────────────────────────────
const STARTER_FEATURES   = [
  'Full PDF summary report',
  'Overall resilience score',
  'Top dimension highlights',
  'Actionable starter practices',
];
const NAVIGATOR_FEATURES = [
  'Detailed explanation of all 6 resilience dimensions',
  'Deeper interpretation of your strengths',
  'Personalized narrative analysis',
  'Recommended growth strategies',
  'Expanded micro-practices for each dimension',
  'Downloadable PDF report',
  'Lifetime access — one-time purchase, yours to keep forever',
];

function UpgradeCardsSection({ getPrice, onUpgrade, checkoutLoading }) {
  return (
    <div className="upgrade-comparison" role="region" aria-label="Upgrade options" id="upgradeCardsContainer">
      <h2 className="upgrade-comparison__title">Unlock Your Full Resilience Report</h2>
      <p className="upgrade-comparison__subtitle">
        Choose the option that fits you best — a concise PDF summary or a complete deep-dive report.
      </p>
      <div className="upgrade-cards-grid">
        {/* Atlas Starter */}
        <div className="upgrade-card upgrade-card--atlas-starter" role="article" aria-labelledby="upgrade-title-atlas-starter">
          <div className="upgrade-card__header">
            <span className="upgrade-badge badge-green">STARTER</span>
            <h3 id="upgrade-title-atlas-starter" className="upgrade-card__title">Atlas Starter</h3>
            <p className="upgrade-card__price" data-price-tier="atlas-starter">{getPrice('atlas-starter')}</p>
            <p className="upgrade-card__description">
              Get your personalised PDF summary with your overall score, top dimension highlights, and starter practices.
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
              ? '⏳ Redirecting…'
              : `Get Starter Report — ${getPrice('atlas-starter')}`}
          </button>
          <p className="upgrade-card__trust">
            🔒 Secure checkout via Stripe &nbsp;|&nbsp; No subscription required
          </p>
        </div>

        {/* Atlas Navigator */}
        <div className="upgrade-card upgrade-card--atlas-navigator" role="article" aria-labelledby="upgrade-title-atlas-navigator">
          <div className="upgrade-card__header">
            <span className="upgrade-badge badge-blue">POPULAR</span>
            <h3 id="upgrade-title-atlas-navigator" className="upgrade-card__title">Atlas Navigator (Lifetime)</h3>
            <p className="upgrade-card__price" data-price-tier="atlas-navigator">{getPrice('atlas-navigator')}</p>
            <p className="upgrade-card__description">
              Download your complete Deep Resilience Report as a beautiful PDF. One-time purchase, yours to keep forever.
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
              ? '⏳ Redirecting…'
              : `Get My Deep Report — ${getPrice('atlas-navigator')}`}
          </button>
          <p className="upgrade-card__trust">
            🔒 Secure checkout via Stripe &nbsp;|&nbsp; No subscription required
          </p>
        </div>
      </div>
      <p className="upgrade-comparison__disclaimer">
        For educational and self-reflection purposes only. Not a clinical diagnosis.
      </p>
    </div>
  );
}

// ── Dimension accent colours (mirror results.js / scoring.js) ─────────────
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
    'Full PDF summary report',
    'Overall resilience score',
    'Top dimension highlights',
    'Actionable starter practices',
  ],
  'atlas-navigator': [
    'Detailed explanation of all 6 resilience dimensions',
    'Deeper interpretation of your strengths',
    'Personalized narrative analysis',
    'Recommended growth strategies',
    'Expanded micro-practices for each dimension',
    'Downloadable PDF report',
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
    { icon: '/icons/dialogue.svg', title: 'Vulnerable Conversation', desc: 'Practice asking for support in a low-stakes situation to build comfort with relying on others.' },
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
};

function buildShareText(dominantDimension) {
  const dim = dominantDimension || 'Resilience';
  return (
    `My strongest resilience dimension is ${dim}. What\u2019s yours? ` +
    'Take the Resilience Atlas assessment to map your Six Dimensions of Resilience.'
  );
}

function shareLinkedIn(dominantDimension) {
  const url = encodeURIComponent(window.location.origin + '/quiz.html');
  const text = encodeURIComponent(buildShareText(dominantDimension));
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
    '_blank', 'width=600,height=520,noopener,noreferrer'
  );
}

function shareTwitter(dominantDimension) {
  const url  = encodeURIComponent(window.location.origin + '/quiz.html');
  const text = encodeURIComponent(buildShareText(dominantDimension));
  window.open(
    `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    '_blank', 'width=600,height=400,noopener,noreferrer'
  );
}

function shareFacebook() {
  window.open(SOCIAL_URLS.facebook, '_blank', 'noopener,noreferrer');
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

async function triggerPdfDownload(results, email) {
  const scoresStr = JSON.stringify(results.scores);
  const params = new URLSearchParams({
    overall: String(results.overall),
    dominantType: results.dominantType,
    scores: scoresStr,
  });
  if (email) params.set('email', email);

  const genRes = await fetch(`/api/report/generate?${params.toString()}`);
  if (!genRes.ok) {
    const body = await genRes.json().catch(() => ({}));
    const err = new Error(body.error || 'Failed to start report generation');
    if (genRes.status === 402) err.upgradeRequired = true;
    throw err;
  }
  const { hash } = await genRes.json();

  for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, POLLING_INTERVAL_MS));
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
    case 'atlas-navigator': return 'Atlas Navigator (Lifetime)';
    default:                return tierId || 'premium';
  }
}

// ── Returns true for any tier that grants paid report access ──────────────
function isPaidTier(tierId) {
  return tierId === 'atlas-starter' || tierId === 'atlas-navigator' || tierId === 'atlas-premium';
}

// ── Gamification helpers ───────────────────────────────────────────────────
const GAM_KEY = 'resilience_gamification';

const GAM_BADGE_DEFS = [
  { name: 'First Step',       icon: '/icons/badge.svg',           desc: 'Completed your first practice',                 test: (c)        => Object.keys(c).length >= 1  },
  { name: 'Week Warrior',     icon: '/icons/game-shield.svg',     desc: '5 practices completed',                         test: (c)        => Object.keys(c).length >= 5  },
  { name: 'Dimension Master', icon: '/icons/game-map.svg',        desc: '10 practices completed across dimensions',       test: (c)        => Object.keys(c).length >= 10 },
  { name: 'Champion',         icon: '/icons/kids-trophy.svg',     desc: 'All 12 practices completed!',                   test: (c)        => Object.keys(c).length >= 12 },
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

function calcGamBadges(completions, streak) {
  return GAM_BADGE_DEFS.filter(b => b.test(completions, streak)).map(b => ({ name: b.name, icon: b.icon, desc: b.desc }));
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
  const upgradeParam  = params.get('upgrade');   // 'success' | 'cancelled'
  const sessionId     = params.get('session_id');

  // ── Auth0 ──────────────────────────────────────────────────────────────
  const { user: auth0User, isAuthenticated, isLoading: auth0Loading } = useAuth0();

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
  // Tracks whether both tier checks (payments/status and report/access) have completed.
  // The download button is only shown once the backend has confirmed the tier, preventing
  // stale localStorage values from granting premature access.
  const [tierCheckComplete, setTierCheckComplete] = useState(false);
  // Whether the current assessment's PDF has been unlocked (either via Navigator or Starter).
  // null = not yet loaded from backend.
  const [isCurrentAssessmentUnlocked, setIsCurrentAssessmentUnlocked] = useState(null);
  // Whether user has unlock modal open (shown automatically for users without PDF access).
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // ── Upsell modal & promo-banner state ─────────────────────────────────
  const [upsellModal, setUpsellModal] = useState(null);   // null | { tier, trigger }
  const [promoBanner, setPromoBanner] = useState(null);   // null | { tier, trigger }

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
  }, []);

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

    // 5. Promo banner — show after 5 seconds if offer is active.
    let promoTimer;
    if (upsellIsOfferActive()) {
      promoTimer = setTimeout(() => {
        setPromoBanner({ tier: 'atlas-navigator', trigger: 'timer' });
      }, 5000);
    }

    return () => {
      clearTimeout(timerHandle);
      clearTimeout(promoTimer);
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
    if (upgradeParam === 'cancelled') {
      setBanner({ type: 'warning', message: 'Payment was cancelled. Your free results are still available below.' });
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
    fetch(`/api/payments/status?email=${encodeURIComponent(email)}`)
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
  useEffect(() => {
    if (auth0Loading) {
      // Auth0 is still initialising — hold off until we know the user's identity.
      return;
    }

    const email = getEffectiveEmail();
    if (!email) {
      // No email to check with — mark as complete so UI renders (tier stays 'free').
      setIsCurrentAssessmentUnlocked(false);
      setTierCheckComplete(true);
      return;
    }

    // Build URL with current assessment data so the backend can check per-assessment unlock.
    let accessUrl = `/api/report/access?email=${encodeURIComponent(email)}`;
    try {
      const raw = localStorage.getItem('resilience_results');
      if (raw) {
        const r = JSON.parse(raw);
        if (r.overall !== undefined && r.scores) {
          accessUrl += `&overall=${encodeURIComponent(String(r.overall))}`;
          accessUrl += `&dominantType=${encodeURIComponent(r.dominantType || '')}`;
          accessUrl += `&scores=${encodeURIComponent(JSON.stringify(r.scores))}`;
        }
      }
    } catch (_) { /* ignore */ }

    fetch(accessUrl)
      .then(r => r.json())
      .then(data => {
        // isCurrentAssessmentUnlocked: this specific assessment's PDF is accessible.
        const unlocked = data.isCurrentAssessmentUnlocked ?? (data.hasActiveAccess ?? data.hasAccess);
        setIsCurrentAssessmentUnlocked(!!unlocked);
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
  }, [auth0Loading, isAuthenticated, auth0User, results]);

  // ── Stripe checkout ────────────────────────────────────────────────────
  const handleUpgrade = useCallback(async (tierId) => {
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
    const email = getEffectiveEmail();
    setPdfLoading(true);
    setPdfError('');
    try {
      await triggerPdfDownload(results, email);
    } catch (err) {
      if (err && err.upgradeRequired) {
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
  }, [results, isAuthenticated, auth0User, getEffectiveEmail]);

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
    const link = window.location.origin + '/quiz.html';
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
      const data = await res.json();
      if (res.ok) {
        setEmailAlert({ success: true, message: '✅ Report sent! Check your inbox.' });
        setEmailInput('');
      } else {
        setEmailAlert({ success: false, message: data.error || 'Could not send report. Please try again.' });
      }
    } catch (_) {
      setEmailAlert({ success: false, message: 'Network error. Please try again.' });
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
    // The radar chart is rendered as a canvas by BrandCompass.
    const canvas = document.querySelector('canvas[aria-label="Animated resilience compass showing your six dimension scores"]');
    if (!canvas) {
      alert('Radar chart not found. Please wait for the chart to load.');
      return;
    }
    try {
      const link = document.createElement('a');
      link.download = 'resilience-atlas-radar.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      trackShareEvent('download_radar', (results && results.dominantType) || '');
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
      const badges = calcGamBadges(newCompletions, streak);
      return { completions: newCompletions, streak, lastDate: today, points, badges };
    });
  }, []);

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
  const isAtlasPremium   = tier === 'atlas-premium';

  const rankedDims = results
    ? Object.entries(results.scores).sort((a, b) => b[1].percentage - a[1].percentage)
    : [];

  const dominantType = rankedDims.length > 0 ? rankedDims[0][0] : '';

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
    if (auth0Loading) {
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
              <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="32" height="32" />
              The Resilience Atlas&#8482;
            </a>
            <nav style={s.headerNav} aria-label="Main navigation">
              <a href="/" style={s.navLink}>Home</a>
              <a href="/assessment.html" style={s.navLink}>Assessment</a>
              <a href="/research.html" style={s.navLink}>Research</a>
              <a href="/teams" style={s.navLink}>Teams</a>
              <a href="/kids.html" style={s.navLink}>Kids</a>
              <a href="/about.html" style={s.navLink}>About</a>
              {isPaidTier(tier) && (
                <a href="/gamification" style={s.journeyNavLink} aria-label="Resilience Journey — your practices and progress"><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{width:16,height:16,verticalAlign:"middle",marginRight:5}} />Resilience Journey</a>
              )}
              <a href="/quiz.html" style={s.retakeBtn}>Retake Quiz</a>
            </nav>
          </div>
        </header>
        <div style={s.page}>
          <div style={s.container}>
            {historyEmail ? (
              // Authenticated user (or has stored email): show their history
              // even when there are no current localStorage results.
              <>
                <div style={s.emptyCard}>
                  <div style={s.emptyIcon}>{isReturnFromPayment ? '✅' : '🧭'}</div>
                  <div style={s.emptyTitle}>
                    {isReturnFromPayment ? 'Payment confirmed!' : 'Your Assessment History'}
                  </div>
                  <p style={s.emptyDesc}>
                    {isReturnFromPayment
                      ? 'Thank you! Your payment was successful. Re-take the assessment to generate your latest PDF report, or download a prior report below.'
                      : 'Your assessment results and purchase history are shown below. Take a new assessment or download a prior report.'
                    }
                  </p>
                  <a href="/quiz.html" style={s.primaryBtn}>
                    {isReturnFromPayment ? 'Re-take Assessment' : 'Take New Assessment'}
                  </a>
                </div>
                <ResultsHistory email={historyEmail} />
                <AssessmentHistory
                  email={historyEmail}
                  onUnlock={(assessment) => {
                    try {
                      if (assessment.hash) {
                        sessionStorage.setItem('pending_unlock_hash', assessment.hash);
                      }
                    } catch (_) { /* ignore */ }
                  }}
                  checkoutLoading={checkoutLoading}
                />
              </>
            ) : (
              // No email available — show the original empty state.
              <div style={s.emptyCard}>
                <div style={s.emptyIcon}>{isReturnFromPayment ? '✅' : '🧭'}</div>
                <div style={s.emptyTitle}>
                  {isReturnFromPayment ? 'Payment confirmed!' : 'No assessment results found'}
                </div>
                <p style={s.emptyDesc}>
                  {isReturnFromPayment
                    ? 'Thank you! Your payment was successful. Your results could not be found in this browser — please re-take the assessment to generate your PDF report.'
                    : 'Complete the free assessment to see your personalised resilience profile.'
                  }
                </p>
                <a href="/quiz.html" style={s.primaryBtn}>
                  {isReturnFromPayment ? 'Re-take Assessment' : 'Start Free Assessment'}
                </a>
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

      {/* ── Promotional banner (flash offer for free users) ──────────── */}
      {promoBanner && (
        <PromoBanner
          message="🎉 Get your complete Deep Resilience Report PDF for just $49.99 — lifetime access"
          ctaLabel="Claim Offer"
          targetTier={promoBanner.tier}
          trigger={promoBanner.trigger}
          onClose={() => setPromoBanner(null)}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* ── Upsell modal (smart-triggered) ───────────────────────────── */}
      {upsellModal && !upsellIsOnCooldown() && (
        <UpsellModal
          targetTier={upsellModal.tier}
          trigger={upsellModal.trigger}
          onClose={() => setUpsellModal(null)}
          onUpgrade={handleUpgrade}
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

      {/* ── Site Header ──────────────────────────────────────────────── */}
      <header style={s.siteHeader} role="banner">
        <div style={s.headerInner}>
          <a href="/" style={s.headerLogo}>
            <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="32" height="32" />
            The Resilience Atlas&#8482;
          </a>
          <nav style={s.headerNav} aria-label="Main navigation">
            <a href="/" style={s.navLink}>Home</a>
            <a href="/assessment.html" style={s.navLink}>Assessment</a>
            <a href="/research.html" style={s.navLink}>Research</a>
            <a href="/teams" style={s.navLink}>Teams</a>
            <a href="/kids.html" style={s.navLink}>Kids</a>
            <a href="/about.html" style={s.navLink}>About</a>
            {isPaidTier(tier) && (
              <a href="/gamification" style={s.journeyNavLink} aria-label="Resilience Journey — your practices and progress"><img src="/icons/compass.svg" alt="" aria-hidden="true" style={{width:16,height:16,verticalAlign:"middle",marginRight:5}} />Resilience Journey</a>
            )}
            <a href="/quiz.html" style={s.retakeBtn}>Retake Quiz</a>
          </nav>
        </div>
      </header>

      <div style={s.page}>
      <div style={s.container}>

        {/* Banner */}
        {banner && (
          <div style={s.banner(banner.type)} role="alert">
            {banner.message}
          </div>
        )}

        {/* ── Results header / greeting ─────────────────────────────── */}
        <div style={s.scoreHero}>
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

        {/* ── Free Brief Report (snapshot — visible to all users) ──────── */}
        <div style={s.freeBriefReport} role="region" aria-label="Your Resilience Terrain">
          <div style={s.fbrHeading}><BrandIcon name="chart" size={17} color="#667eea" /> Your Resilience Terrain</div>
          {rankedDims.map(([dim, score]) => {
            const pct   = Math.round(score.percentage);
            const color = DIM_COLORS[dim] || '#667eea';
            return (
              <div key={dim} style={s.dimRow}>
                <span style={s.dimLabel}>{dim}</span>
                <div style={s.dimBarWrap}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${dim} ${pct}%`}
                >
                  <div style={s.dimBarFill(color, pct)} />
                </div>
                <span style={s.dimPct}>{pct}%</span>
              </div>
            );
          })}
          {!hasPremiumAccess && (
            <p style={s.fbrHint}>
              Unlock your full map for personalised insights &amp; growth compass points.
            </p>
          )}
        </div>

        {/* ── Primary Resilience Mode ───────────────────────────────── */}
        {dominantType && (
          <section style={s.primaryTypeCard} aria-labelledby="primaryTypeHeading">
            <div style={s.primaryTypeHeading} id="primaryTypeHeading">Your Primary Resilience Mode</div>
            <div style={s.primaryTypeName(DIM_COLORS[dominantType])}>
              {dominantType}
            </div>
            <p style={s.primaryTypeDesc}>
              {TYPE_DESCRIPTIONS[dominantType] || ''}
            </p>
          </section>
        )}

        {/* ── Resilience Compass (BrandCompass chart) ──────────────── */}
        <section style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '28px 20px 20px',
          marginBottom: 24,
          textAlign: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        }} aria-labelledby="radarHeading">
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2d3748', marginBottom: 4, letterSpacing: 0.3, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }} id="radarHeading">
            <BrandIcon name="compass" size={17} color="#667eea" /> Your Resilience Compass
          </div>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
            This compass visualizes the balance of your resilience system across six core dimensions.
          </p>
          <BrandCompass scores={results.scores} darkMode={false} />
          {dominantType && (
            <p style={{ fontSize: 13, color: '#718096', marginTop: 14 }}>
              Your strongest resilience dimension is:{' '}
              <strong style={{ color: DIM_COLORS[dominantType] || '#667eea' }}>{dominantType}</strong>
            </p>
          )}
        </section>

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
                  Start your Resilience Journey with values-aligned micro-practices tailored to your unique resilience profile.
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
          <UpgradeCardsSection
            getPrice={getPrice}
            onUpgrade={handleUpgrade}
            checkoutLoading={checkoutLoading}
          />
        )}

        {/* ── Deep Analysis (locked for free users) ────────────────── */}
        {!hasPremiumAccess && tierCheckComplete && (
          <section
            className="premium-preview card locked"
            data-tier="atlas-navigator"
            aria-labelledby="deepAnalysisHeading"
          >
            <h2 id="deepAnalysisHeading">Deep Resilience Analysis</h2>
            <div className="blur-preview" aria-hidden="true">
              <p>Comprehensive breakdown of all 6 resilience dimensions with personalized insights tailored to your unique profile.</p>
              <p>Discover the deeper meaning behind your scores and learn exactly how to leverage each dimension for lasting resilience.</p>
              <p>Includes recommended growth strategies, expanded micro-practices for each dimension, and a personalized development roadmap.</p>
            </div>
            <div className="premium-lock-message payment-overlay" role="region" aria-label="Premium content — locked">
              <div className="payment-overlay__inner">
                <span className="payment-overlay__icon" aria-hidden="true">🔒</span>
                <h3>Unlock Your Complete Resilience Map</h3>
                <p>Go deeper to understand the full structure of your resilience system.</p>
                <button
                  type="button"
                  className="btn btn-upgrade btn-sm"
                  onClick={() => setUpsellModal({ tier: 'atlas-navigator', trigger: 'manual' })}
                  disabled={!!checkoutLoading}
                  aria-label="Unlock Deep Report"
                >
                  {checkoutLoading === 'atlas-navigator' ? '⏳ Redirecting…' : 'Unlock Now'}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Prior Purchases / ResultsHistory ─────────────────────── */}
        <ResultsHistory
          email={getEffectiveEmail()}
        />

        {/* ── Assessment History with unlock status ────────────────── */}
        <AssessmentHistory
          email={getEffectiveEmail()}
          onUnlock={(assessment) => {
            // Store the assessment hash in sessionStorage so the checkout
            // success flow can link the purchase to this specific assessment.
            try {
              sessionStorage.setItem('pending_unlock_hash', assessment.hash || '');
            } catch (_) { /* ignore */ }
            setShowUnlockModal(true);
          }}
          checkoutLoading={checkoutLoading}
        />

        {/* ── PDF Download + Action Buttons ─────────────────────────── */}
        {hasPremiumAccess && (
          <div style={s.downloadSection}>
            <div style={s.downloadHeading}>
              🎉 Your Full Report is Ready
            </div>
            <p style={s.downloadDesc}>
              {isAtlasPremium
                ? 'Your Atlas Premium lifetime access lets you download this report any time.'
                : tier === 'atlas-starter'
                  ? 'Your Atlas Starter report is ready. Download your personalised PDF report now.'
                  : tier === 'atlas-navigator'
                    ? 'Your Atlas Navigator report is ready. Download your personalised PDF now.'
                    : 'Your report is ready. Download your personalised PDF now.'
              }
            </p>
            {pdfError && (
              <div style={{ color: '#fc8181', fontSize: 13, marginBottom: 12 }}>{pdfError}</div>
            )}
            <button
              type="button"
              style={s.downloadBtn(pdfLoading || tierLoading)}
              onClick={handleDownloadPdf}
              disabled={pdfLoading || tierLoading}
              aria-busy={pdfLoading}
            >
              {pdfLoading ? '⏳ Generating PDF…' : '⬇ Download PDF Report'}
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
                ⏳ Verifying your access…
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-locked btn-locked-pdf"
                onClick={() => setShowUnlockModal(true)}
                aria-label="Unlock PDF Download — requires Atlas Starter or Atlas Navigator"
              >
                🔒 Unlock PDF Download
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
              window.location.href = '/quiz.html';
            }}
          >
            ↺ Re-take the assessment
          </button>
        </div>

        {/* ── Email Report Section ──────────────────────────────────── */}
        <section style={s.emailSection} aria-labelledby="emailHeading">
          <div style={s.emailHeading} id="emailHeading"><BrandIcon name="mail" size={17} color="#0891B2" /> Email Your Report</div>
          <p style={s.emailDesc}>
            Send your resilience profile to your inbox for future reference.
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
              {emailLoading ? '⏳ Sending…' : '✉️ Send Report'}
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
              Practices across all 6 resilience dimensions —
              grounded in Acceptance and Commitment Therapy (ACT) and Applied Behavior Analysis (ABA).
            </p>

            {/* ── Gamification header (Atlas Starter+) ────────────────── */}
            {hasPremiumAccess && (() => {
              const allPracticeKeys = Object.values(EVIDENCE_PRACTICES).flat().map(p => p.title);
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
                      <span style={s.gamStatValue}><img src="/icons/games/star-earned.svg" alt="" aria-hidden="true" width="18" height="18" style={{ verticalAlign: 'middle', marginRight: 2 }} />{gamData.points}</span>
                      <span style={s.gamStatLabel}>Points</span>
                    </div>
                    <div style={s.gamStat}>
                      <span style={s.gamStatValue}>🔥 {gamData.streak}</span>
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
                          {b.icon && b.icon.startsWith('/icons/')
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

            {Object.entries(EVIDENCE_PRACTICES).map(([dim, practices]) => {
              const color = DIM_COLORS[dim] || '#667eea';
              const dimIcon = DIM_ICONS[dim];
              return (
                <div key={dim}>
                  <div style={s.practiceDimHeader(color)} aria-label={`${dim} practices`}>
                    {dimIcon && (
                      <img src={dimIcon} alt="" aria-hidden="true" width="20" height="20"
                        style={{ verticalAlign: 'middle', marginRight: 6, flexShrink: 0 }} />
                    )}
                    <span>{dim}</span>
                  </div>
                  {practices.map((practice) => {
                    const practiceKey = practice.title;
                    const isCompleted = !!(gamData.completions[practiceKey]);
                    const isTimerActive = timerData && timerData.practiceKey === practiceKey;
                    const timerFinished = isTimerActive && timerData.secondsLeft === 0;
                    const durSecs = parseDurationSecs(practice.duration);
                    return (
                      <div
                        key={practice.title}
                        style={{ ...s.practiceCard(color), ...(isCompleted ? s.gamCompleteCard : {}) }}
                      >
                        <div style={{ ...s.practiceCardHeader, justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <img src={practice.icon} alt="" aria-hidden="true" width="20" height="20" style={{ flexShrink: 0 }} />
                            <span style={{ ...s.practiceTitle, textDecoration: isCompleted ? 'line-through' : 'none' }}>{practice.title}</span>
                          </div>
                          {isCompleted && <span style={{ fontSize: 16 }} aria-label="Completed">✅</span>}
                        </div>
                        <div style={s.practiceTags}>
                          <span style={s.practiceTag}>⏱ {practice.duration}</span>
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
                            {/* Timer */}
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
                            {/* Mark complete */}
                            <button
                              type="button"
                              style={s.gamCompleteBtn(isCompleted)}
                              onClick={() => handleTogglePractice(practiceKey, isTimerActive)}
                              aria-pressed={isCompleted}
                              aria-label={isCompleted ? `Unmark ${practice.title} as complete` : `Mark ${practice.title} as complete`}
                            >
                              {isCompleted ? '✅ Completed!' : '☐ Mark Complete'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
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
                icon="📷"
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
                label={copyLabel}
                icon="🔗"
                bg="#4a5568"
                onClick={handleCopyLink}
              />
              <ShareButton
                label="Download Radar"
                icon="⬇"
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
              📷 <strong>Instagram tip:</strong> Click <em>Download Radar</em> above to save your radar graphic, then post it and tag{' '}
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
          <span style={s.privacyIcon}>🔒</span>
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
                <li><a href="/quiz.html" style={s.quicklinkAnchor}>Take the Quiz</a></li>
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
            <SocialFollowLink label="Instagram" icon="📷" href={SOCIAL_URLS.instagram} bg="#e1306c" />
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
