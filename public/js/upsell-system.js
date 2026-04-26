/* global PaymentGating */
'use strict';

/**
 * upsell-system.js — Comprehensive upsell system for Resilience Atlas.
 *
 * Responsibilities:
 *  1. Smart trigger moments — show upgrade prompts at high-engagement points.
 *  2. Tiered messaging — different copy for free / trial / near-expired users.
 *  3. Value propositions — feature-specific "Upgrade to unlock" overlays.
 *  4. Limited-time offers — flash sales and seasonal promotions.
 *  5. A/B testing framework — randomise variant assignment per session.
 *  6. Dismissible modals with cool-down periods — no spam.
 *  7. Revenue tracking — POST events to /api/upsell/event.
 *  8. Success messaging — confirmed after checkout completes.
 *
 * Depends on payment-gating.js (window.PaymentGating).
 * Exposed as window.UpsellSystem.
 */
(function (window) {

    // ── Constants ─────────────────────────────────────────────────────────────

    const COOLDOWN_KEY        = 'upsell_cooldown';       // last dismiss timestamp
    const SESSION_ID_KEY      = 'upsell_session_id';     // stable session id
    const VARIANT_KEY         = 'upsell_ab_variant';     // assigned A/B variant
    const COOLDOWN_MS         = 24 * 60 * 60 * 1000;     // 24-hour cooldown
    const OFFER_EXPIRY_HOURS  = 48;                      // flash-sale window

    // ── A/B Variants ──────────────────────────────────────────────────────────

    const VARIANTS = ['control', 'variant_a', 'variant_b', 'variant_c'];

    /**
     * Messaging matrix — indexed by [variant][targetTier].
     * Each entry supplies headline, subtext, ctaLabel, and an optional offer.
     */
    const VARIANT_COPY = {
        control: {
            'atlas-navigator': {
                headline:  'Unlock Your Full Resilience Analysis',
                subtext:   'Get personalized insights for all 6 dimensions, a downloadable PDF report, and tailored growth strategies — one-time payment.',
                ctaLabel:  'Get Deep Report — $9.99',
                offer:     null,
            },
            'atlas-premium': {
                headline:  'Take Your Resilience Journey Further',
                subtext:   'Track progress over time, compare results, and access unlimited reassessments with a lifetime Atlas Premium license.',
                ctaLabel:  'Upgrade to Atlas Premium — $49.99',
                offer:     null,
            },
        },
        variant_a: {
            'atlas-navigator': {
                headline:  'You\'re in the Top 20% — Unlock What\'s Holding You Back',
                subtext:   'Your free report shows your strengths. The Deep Report reveals your hidden growth edges with expert strategies for every dimension.',
                ctaLabel:  'Unlock My Deep Report ($9.99)',
                offer:     null,
            },
            'atlas-premium': {
                headline:  'Most People See Results in 30 Days',
                subtext:   'Atlas Premium members track their resilience growth over time. Will you be one of them? Lifetime access, zero subscriptions.',
                ctaLabel:  'Start My Journey — $49.99',
                offer:     null,
            },
        },
        variant_b: {
            'atlas-navigator': {
                headline:  '🎉 Complete Your Resilience Atlas',
                subtext:   'You\'ve completed the assessment — now go deeper. Full dimension analysis, personalized strategies, and a beautiful PDF to keep.',
                ctaLabel:  'Get the Full Report — $9.99 One-Time',
                offer:     null,
            },
            'atlas-premium': {
                headline:  '⭐ Lifetime Access — No Subscriptions Ever',
                subtext:   'One payment. Unlimited reassessments, evolution tracking, growth pathways, and priority support. No recurring charges.',
                ctaLabel:  'Unlock Atlas Premium — $49.99 Lifetime',
                offer:     { label: '🕐 Limited Offer: Founding Member Price', code: 'FOUNDER49', savingText: 'Lifetime access for just $49.99' },
            },
        },
        variant_c: {
            'atlas-navigator': {
                headline:  'Your Resilience Profile Is Only Half Complete',
                subtext:   'The free report covers the basics. Upgrade to uncover the full picture: all 6 dimensions, your stress profile, and a 30-day action plan.',
                ctaLabel:  'Complete My Profile — $9.99',
                offer:     null,
            },
            'atlas-premium': {
                headline:  'Compare. Grow. Repeat.',
                subtext:   'Atlas Premium unlocks side-by-side comparisons, historical trends, and unlimited retakes — so you can measure real progress.',
                ctaLabel:  'Get Lifetime Access — $49.99',
                offer:     null,
            },
        },
    };

    // ── Value proposition catalog ───────────────────────────────────────────

    const VALUE_PROPS = {
        'detailed_analytics':   { icon: '📊', text: 'Detailed analytics across all 6 resilience dimensions' },
        'comparison':           { icon: '🔁', text: 'Side-by-side comparison with your previous assessments' },
        'priority_support':     { icon: '🛟', text: 'Priority email support from our resilience coaches' },
        'ad_free':              { icon: '🚫', text: 'Completely ad-free experience throughout the app' },
        'pdf_download':         { icon: '📄', text: 'Beautiful downloadable PDF report you keep forever' },
        'unlimited_retakes':    { icon: '🔄', text: 'Unlimited reassessments to track your growth' },
        'growth_roadmap':       { icon: '🗺️',  text: '30-day personalized growth roadmap' },
        'benchmarking':         { icon: '📈', text: 'See how you rank against thousands of users' },
    };

    // ── Session / variant helpers ─────────────────────────────────────────────

    function _getSessionId() {
        let id = localStorage.getItem(SESSION_ID_KEY);
        if (!id) {
            id = 'sess_' + Math.random().toString(36).slice(2, 10) +
                 Math.random().toString(36).slice(2, 10);
            localStorage.setItem(SESSION_ID_KEY, id);
        }
        return id;
    }

    function _getVariant() {
        let v = localStorage.getItem(VARIANT_KEY);
        if (!v || !VARIANTS.includes(v)) {
            // Deterministically assign based on session id hash
            const id = _getSessionId();
            const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            v = VARIANTS[hash % VARIANTS.length];
            localStorage.setItem(VARIANT_KEY, v);
        }
        return v;
    }

    function _getCopy(targetTier) {
        const variant = _getVariant();
        return (VARIANT_COPY[variant] || VARIANT_COPY.control)[targetTier] ||
               VARIANT_COPY.control[targetTier];
    }

    // ── Cool-down helpers ─────────────────────────────────────────────────────

    function _isOnCooldown() {
        const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0', 10);
        return Date.now() - last < COOLDOWN_MS;
    }

    function _setCooldown() {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
    }

    // ── Revenue / analytics tracking ──────────────────────────────────────────

    function _track(eventType, trigger, targetTier, extra) {
        const payload = {
            sessionId:  _getSessionId(),
            trigger,
            variant:    _getVariant(),
            targetTier,
            eventType,
            userTier:   (window.PaymentGating && window.PaymentGating.getTier()) || 'free',
            offerShown: Boolean(extra && extra.offerShown),
            campaign:   (extra && extra.campaign) || null,
            pageUrl:    window.location.pathname,
        };

        // Fire-and-forget — don't block the UI.
        fetch('/api/upsell/event', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        }).catch(function () { /* silently ignore network errors */ });

        // Also emit to custom analytics if available.
        if (window.ResilienceAnalytics && typeof window.ResilienceAnalytics.track === 'function') {
            window.ResilienceAnalytics.track('upsell_' + eventType, payload);
        }
    }

    // ── Flash-sale / limited-time offer helpers ───────────────────────────────

    function _isOfferActive() {
        // Seasonal/flash offers can be toggled server-side via a meta tag or
        // data attribute. We also respect a short client-side window.
        const offerMeta = document.querySelector('meta[name="upsell-offer"]');
        if (offerMeta) {
            const expires = offerMeta.getAttribute('data-expires');
            if (expires) {
                return Date.now() < new Date(expires).getTime();
            }
            return true;
        }
        // Fallback: show offer for OFFER_EXPIRY_HOURS after first session
        const firstVisit = parseInt(
            localStorage.getItem('first_visit_ts') || String(Date.now()), 10
        );
        if (!localStorage.getItem('first_visit_ts')) {
            localStorage.setItem('first_visit_ts', String(firstVisit));
        }
        return Date.now() - firstVisit < OFFER_EXPIRY_HOURS * 60 * 60 * 1000;
    }

    // ── HTML helpers ──────────────────────────────────────────────────────────

    function _esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // ── Modal builder ─────────────────────────────────────────────────────────

    /**
     * Build and inject the upsell modal into the DOM.
     * @param {'atlas-navigator'|'atlas-premium'} targetTier
     * @param {string} trigger  — for analytics
     * @param {string[]} [highlightProps]  — keys from VALUE_PROPS to emphasize
     */
    function showModal(targetTier, trigger, highlightProps) {
        // Only show to free users (or atlas-navigator upgrading to atlas-premium).
        if (window.PaymentGating) {
            const tier = window.PaymentGating.getTier();
            if (targetTier === 'atlas-navigator' && window.PaymentGating.isDeepReport()) return;
            if (targetTier === 'atlas-premium' && window.PaymentGating.isAtlasPremium()) return;
        }

        if (_isOnCooldown()) return;
        // Remove any existing modal first.
        _removeModal();

        const copy       = _getCopy(targetTier);
        const offerActive = _isOfferActive() && Boolean(copy.offer);
        const props      = (highlightProps || Object.keys(VALUE_PROPS).slice(0, 4))
            .map(function (k) { return VALUE_PROPS[k]; })
            .filter(Boolean);

        _track('impression', trigger, targetTier, { offerShown: offerActive });

        const offerHtml = offerActive && copy.offer ? `
            <div class="upsell-offer-badge">
                ${_esc(copy.offer.label)}
            </div>
            <p class="upsell-offer-saving">${_esc(copy.offer.savingText)}</p>
        ` : '';

        const propsHtml = props.map(function (p) {
            return `<li class="upsell-value-prop">
                <span class="upsell-value-prop__icon" aria-hidden="true">${_esc(p.icon)}</span>
                <span>${_esc(p.text)}</span>
            </li>`;
        }).join('');

        const html = `
            <div class="upsell-modal-backdrop" id="upsell-modal-backdrop" role="dialog"
                 aria-modal="true" aria-labelledby="upsell-modal-title">
                <div class="upsell-modal">
                    <button class="upsell-modal__close" id="upsell-modal-dismiss"
                            aria-label="Dismiss upgrade prompt">&#10005;</button>
                    ${offerHtml}
                    <div class="upsell-modal__header">
                        <span class="upsell-premium-badge">
                            <img src="/icons/star.svg" alt="" aria-hidden="true" class="icon icon-xs">
                            Premium
                        </span>
                        <h2 id="upsell-modal-title" class="upsell-modal__title">${_esc(copy.headline)}</h2>
                        <p class="upsell-modal__subtext">${_esc(copy.subtext)}</p>
                    </div>
                    <ul class="upsell-value-list" aria-label="Included features">
                        ${propsHtml}
                    </ul>
                    <div class="upsell-modal__actions">
                        <button class="btn upsell-cta-btn" id="upsell-cta"
                                data-tier="${_esc(targetTier)}"
                                aria-label="${_esc(copy.ctaLabel)}">
                            ${_esc(copy.ctaLabel)}
                        </button>
                        <button class="upsell-maybe-later" id="upsell-maybe-later">
                            Maybe later
                        </button>
                    </div>
                    <p class="upsell-trust-note">
                        <img src="/icons/lock.svg" alt="" aria-hidden="true" class="icon icon-xs">
                        Secure checkout · No subscription · Cancel anytime
                    </p>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper.firstElementChild);

        // Wire up actions
        document.getElementById('upsell-cta').addEventListener('click', function () {
            _track('click', trigger, targetTier, { offerShown: offerActive });
            _removeModal();
            if (window.PaymentGating) {
                window.PaymentGating.startCheckout(targetTier);
            }
        });

        const dismissBtns = [
            document.getElementById('upsell-modal-dismiss'),
            document.getElementById('upsell-maybe-later'),
        ];
        dismissBtns.forEach(function (btn) {
            if (btn) {
                btn.addEventListener('click', function () {
                    _track('dismiss', trigger, targetTier, { offerShown: offerActive });
                    _setCooldown();
                    _removeModal();
                });
            }
        });

        // Close on backdrop click
        document.getElementById('upsell-modal-backdrop').addEventListener('click', function (e) {
            if (e.target.id === 'upsell-modal-backdrop') {
                _track('dismiss', trigger, targetTier, { offerShown: offerActive });
                _setCooldown();
                _removeModal();
            }
        });

        // Trap Escape key
        function _keyHandler(e) {
            if (e.key === 'Escape') {
                _track('dismiss', trigger, targetTier, { offerShown: offerActive });
                _setCooldown();
                _removeModal();
                document.removeEventListener('keydown', _keyHandler);
            }
        }
        document.addEventListener('keydown', _keyHandler);
    }

    function _removeModal() {
        const existing = document.getElementById('upsell-modal-backdrop');
        if (existing) existing.remove();
    }

    // ── Promotional banner ────────────────────────────────────────────────────

    /**
     * Show a top-of-page promotional banner.
     * @param {object} opts
     * @param {string} opts.message
     * @param {string} opts.ctaLabel
     * @param {'atlas-navigator'|'atlas-premium'} opts.targetTier
     * @param {string} [opts.trigger]
     */
    function showBanner(opts) {
        if (window.PaymentGating && window.PaymentGating.isAtlasPremium()) return;
        if (document.getElementById('upsell-promo-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'upsell-promo-banner';
        banner.className = 'upsell-promo-banner';
        banner.setAttribute('role', 'banner');
        banner.setAttribute('aria-label', 'Special offer');
        banner.innerHTML = `
            <span class="upsell-promo-banner__text">${_esc(opts.message)}</span>
            <button class="upsell-promo-banner__cta" data-tier="${_esc(opts.targetTier)}">
                ${_esc(opts.ctaLabel)}
            </button>
            <button class="upsell-promo-banner__close" aria-label="Dismiss banner">&#10005;</button>
        `;

        document.body.insertBefore(banner, document.body.firstChild);

        banner.querySelector('.upsell-promo-banner__cta').addEventListener('click', function () {
            _track('click', opts.trigger || 'manual', opts.targetTier, {});
            if (window.PaymentGating) {
                window.PaymentGating.startCheckout(opts.targetTier);
            }
        });

        banner.querySelector('.upsell-promo-banner__close').addEventListener('click', function () {
            _track('dismiss', opts.trigger || 'manual', opts.targetTier, {});
            _setCooldown();
            banner.remove();
        });

        _track('impression', opts.trigger || 'manual', opts.targetTier, {});
    }

    // ── Feature lock overlay ──────────────────────────────────────────────────

    /**
     * Inject a "Upgrade to unlock" overlay into a locked element.
     * @param {Element} element  — the container element to overlay
     * @param {'atlas-navigator'|'atlas-premium'} targetTier
     * @param {string} featureLabel  — short description of the locked feature
     */
    function attachFeatureLock(element, targetTier, featureLabel) {
        if (!element) return;
        element.classList.add('upsell-feature-locked');

        const overlay = document.createElement('div');
        overlay.className = 'upsell-feature-lock-overlay';
        overlay.setAttribute('role', 'region');
        overlay.setAttribute('aria-label', 'Premium feature — locked');
        overlay.innerHTML = `
            <div class="upsell-feature-lock-overlay__inner">
                <span class="upsell-lock-icon" aria-hidden="true">
                    <img src="/icons/lock.svg" alt="" class="icon icon-md">
                </span>
                <p class="upsell-lock-label">
                    <strong>${_esc(featureLabel)}</strong>
                </p>
                <p class="upsell-lock-sublabel">Upgrade to unlock this feature</p>
                <button class="btn upsell-lock-btn" data-tier="${_esc(targetTier)}">
                    Upgrade to Unlock
                </button>
            </div>
        `;

        overlay.querySelector('.upsell-lock-btn').addEventListener('click', function () {
            showModal(targetTier, 'manual', null);
        });

        element.appendChild(overlay);
    }

    // ── Smart trigger system ──────────────────────────────────────────────────

    /**
     * Register all automatic upsell triggers.
     * Call once after the page finishes loading.
     */
    function initTriggers() {
        // 1. Assessment complete — listen for a custom event fired by the quiz.
        document.addEventListener('assessmentComplete', function () {
            setTimeout(function () {
                showModal('atlas-navigator', 'assessment_complete', [
                    'detailed_analytics',
                    'pdf_download',
                    'growth_roadmap',
                    'benchmarking',
                ]);
            }, 1200); // brief delay so results render first
        });

        // 2. PDF download attempt — listen for a custom event from the download button.
        document.addEventListener('pdfDownloadAttempt', function (e) {
            const tier = window.PaymentGating ? window.PaymentGating.getTier() : 'free';
            if (tier === 'free') {
                showModal('atlas-navigator', 'pdf_download_attempt', [
                    'pdf_download',
                    'detailed_analytics',
                    'growth_roadmap',
                    'unlimited_retakes',
                ]);
            }
        });

        // 3. Comparison attempt — fired when a free user tries to compare.
        document.addEventListener('comparisonAttempt', function () {
            showModal('atlas-premium', 'comparison_attempt', [
                'comparison',
                'unlimited_retakes',
                'detailed_analytics',
                'ad_free',
            ]);
        });

        // 4. History / timeline attempt.
        document.addEventListener('historyAttempt', function () {
            showModal('atlas-premium', 'history_attempt', [
                'comparison',
                'unlimited_retakes',
                'priority_support',
                'ad_free',
            ]);
        });

        // 5. Scroll-based trigger — when the user reaches the top-results section.
        _initScrollTrigger();

        // 6. Exit-intent trigger (desktop: mouse leaves viewport toward top).
        _initExitIntent();

        // 7. Time-based trigger — show after 90 s of engagement.
        _initTimerTrigger();

        // 8. Promotional banner for flash-sale sessions.
        if (_isOfferActive() && window.PaymentGating && !window.PaymentGating.isDeepReport()) {
            setTimeout(function () {
                showBanner({
                    message:    '🎉 Get your complete Deep Resilience Report PDF for just $9.99',
                    ctaLabel:   'Claim Offer',
                    targetTier: 'atlas-navigator',
                    trigger:    'timer',
                });
            }, 5000);
        }
    }

    function _initScrollTrigger() {
        var fired = false;
        var target = document.querySelector('[data-upsell-scroll-target]') ||
                     document.querySelector('#top-dimension') ||
                     document.querySelector('.results-section');
        if (!target) return;

        var observer = new IntersectionObserver(function (entries) {
            if (!fired && entries[0].isIntersecting) {
                fired = true;
                observer.disconnect();
                setTimeout(function () {
                    showModal('atlas-navigator', 'top_results_view', [
                        'detailed_analytics',
                        'benchmarking',
                        'pdf_download',
                        'growth_roadmap',
                    ]);
                }, 800);
            }
        }, { threshold: 0.5 });

        observer.observe(target);
    }

    function _initExitIntent() {
        if (!/Mobi|Android/i.test(navigator.userAgent)) {
            document.addEventListener('mouseleave', function _onMouseLeave(e) {
                if (e.clientY < 20) {
                    document.removeEventListener('mouseleave', _onMouseLeave);
                    showModal('atlas-navigator', 'exit_intent', [
                        'pdf_download',
                        'detailed_analytics',
                        'growth_roadmap',
                        'benchmarking',
                    ]);
                }
            });
        }
    }

    function _initTimerTrigger() {
        setTimeout(function () {
            showModal('atlas-navigator', 'timer', [
                'detailed_analytics',
                'pdf_download',
                'benchmarking',
                'unlimited_retakes',
            ]);
        }, 90 * 1000); // 90 seconds
    }

    // ── Premium badge helpers ─────────────────────────────────────────────────

    /**
     * Render a premium badge element.
     * @param {'atlas-navigator'|'atlas-premium'|'premium'} type
     * @returns {string} HTML
     */
    function renderPremiumBadge(type) {
        const labels = {
            'atlas-navigator':  'Deep Report',
            'atlas-premium': 'Atlas Premium',
            'premium':       'Premium',
        };
        const label = labels[type] || 'Premium';
        return `<span class="upsell-premium-badge upsell-premium-badge--${_esc(type)}"
                      aria-label="${_esc(label)} feature">
                    <img src="/icons/star.svg" alt="" aria-hidden="true" class="icon icon-xs">
                    ${_esc(label)}
                </span>`;
    }

    // ── Auto-init ─────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        initTriggers();

        // Attach feature-lock overlays to any elements that declare
        // data-upsell-lock="<tier>" data-upsell-label="<feature name>"
        document.querySelectorAll('[data-upsell-lock]').forEach(function (el) {
            const tier  = el.getAttribute('data-upsell-lock');
            const label = el.getAttribute('data-upsell-label') || 'Premium feature';
            if (window.PaymentGating) {
                const unlocked =
                    (tier === 'atlas-navigator'   && window.PaymentGating.isDeepReport()) ||
                    (tier === 'atlas-premium' && window.PaymentGating.isAtlasPremium());
                if (!unlocked) {
                    attachFeatureLock(el, tier, label);
                }
            }
        });
    });

    // ── Public API ────────────────────────────────────────────────────────────

    window.UpsellSystem = {
        showModal,
        showBanner,
        attachFeatureLock,
        renderPremiumBadge,
        initTriggers,
        track: _track,
        getVariant: _getVariant,
        getSessionId: _getSessionId,
        isOfferActive: _isOfferActive,
    };

})(window);
