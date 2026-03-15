'use strict';

/**
 * payment-gating.js — Frontend payment gating for Resilience Atlas.
 *
 * Responsibilities:
 *  1. Read the user's current tier from localStorage.
 *  2. Handle post-payment redirect (?upgrade=success&session_id=...) by
 *     verifying the Stripe session with the backend and storing the tier.
 *  3. Apply or remove CSS locks on sections marked data-tier="deep-report"
 *     or data-tier="atlas-premium".
 *  4. Initiate a Stripe Checkout session when the user clicks an upgrade button.
 *
 * No external dependencies.  Exposed as window.PaymentGating.
 */
(function (window) {

    const TIER_KEY  = 'resilience_tier';
    const EMAIL_KEY = 'resilience_email';

    // ── Tier helpers ──────────────────────────────────────────────────────────

    function getTier() {
        return localStorage.getItem(TIER_KEY) || 'free';
    }

    function setTier(tier) {
        localStorage.setItem(TIER_KEY, tier);
    }

    function isDeepReport() {
        const t = getTier();
        return t === 'deep-report' || t === 'atlas-premium' || t === 'business' ||
               t === 'teams-starter' || t === 'teams-pro' || t === 'enterprise';
    }

    function isAtlasPremium() {
        const t = getTier();
        return t === 'atlas-premium' || t === 'business' ||
               t === 'teams-starter' || t === 'teams-pro' || t === 'enterprise';
    }

    function isBusiness() {
        const t = getTier();
        return t === 'business' || t === 'teams-starter' || t === 'teams-pro' || t === 'enterprise';
    }

    // ── Teams tier helpers ────────────────────────────────────────────────────

    /** Teams Starter ($99/mo): up to 25 users, 1 team, basic dashboard + CSV. */
    function isTeamsStarter() {
        const t = getTier();
        return t === 'teams-starter' || t === 'teams-pro' || t === 'enterprise';
    }

    /**
     * Teams Pro ($299/mo): up to 250 users, unlimited teams.
     * Advanced analytics, auto-reports, facilitation tools, team management.
     */
    function isTeamsPro() {
        const t = getTier();
        return t === 'teams-pro' || t === 'enterprise';
    }

    /** Enterprise (custom): unlimited users/teams, branding, webhooks, SSO. */
    function isEnterprise() {
        return getTier() === 'enterprise';
    }

    // ── Apply/remove locks ────────────────────────────────────────────────────

    /**
     * Walk every element with a data-tier attribute and show or hide its
     * payment-overlay depending on the user's current tier.
     */
    function applyGating() {
        document.querySelectorAll('[data-tier]').forEach(function (section) {
            const required = section.getAttribute('data-tier');
            const unlocked =
                (required === 'deep-report'     && isDeepReport())    ||
                (required === 'atlas-premium'    && isDeepReport())    ||
                (required === 'business'         && isBusiness())      ||
                (required === 'teams-starter'    && isTeamsStarter())  ||
                (required === 'teams-pro'        && isTeamsPro())      ||
                (required === 'enterprise'       && isEnterprise());

            const overlay = section.querySelector('.payment-overlay');
            if (unlocked) {
                section.classList.remove('locked');
                if (overlay) overlay.hidden = true;
            } else {
                section.classList.add('locked');
                if (overlay) overlay.hidden = false;
            }
        });

        // Show "View on Team Dashboard" link for business/teams users
        document.querySelectorAll('.business-dashboard-link').forEach(function (el) {
            el.hidden = !isBusiness();
        });

        // Show advanced analytics sections for Teams Pro+
        document.querySelectorAll('.teams-pro-feature').forEach(function (el) {
            el.hidden = !isTeamsPro();
        });

        // Show Enterprise-only features
        document.querySelectorAll('.enterprise-feature').forEach(function (el) {
            el.hidden = !isEnterprise();
        });
    }

    // ── Post-payment verification ─────────────────────────────────────────────

    /**
     * If the current URL contains ?upgrade=success&session_id=<id>, call the
     * backend to verify the session, persist the tier, then clean the URL.
     */
    async function handleUpgradeSuccess() {
        const params    = new URLSearchParams(window.location.search);
        const upgrade   = params.get('upgrade');
        const sessionId = params.get('session_id');

        if (upgrade !== 'success' || !sessionId) {
            // Show cancelled notice if needed.
            if (upgrade === 'cancelled') {
                _cleanUrl();
            }
            return;
        }

        try {
            var res  = await fetch('/api/payments/verify?session_id=' + encodeURIComponent(sessionId));
            var data = await res.json();
            if (data.success && data.tier) {
                setTier(data.tier);
                if (data.email) {
                    localStorage.setItem(EMAIL_KEY, data.email);
                }
                _showSuccessBanner(data.tier);
                applyGating();
            }
        } catch (err) {
            console.error('[PaymentGating] Verification failed:', err);
        }

        _cleanUrl();
    }

    function _showSuccessBanner(tier) {
        var messages = {
            'enterprise':     'Welcome to Enterprise! All features including custom branding and webhooks are unlocked.',
            'teams-pro':      'Welcome to Teams Pro! Advanced analytics, facilitation tools, and multi-team support are now unlocked.',
            'teams-starter':  'Welcome to Teams Starter! Your team dashboard and core features are now unlocked.',
            'business':       'Welcome to the Business tier! Team analytics and dashboard are now unlocked.',
            'atlas-premium':  'Welcome to Atlas Premium! All premium features are now unlocked.',
        };
        var msg = messages[tier] || 'Your Deep Resilience Report is now unlocked!';

        var banner = document.createElement('div');
        banner.className = 'payment-success-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'polite');

        var iconImg = document.createElement('img');
        iconImg.src = '/icons/success.svg';
        iconImg.alt = '';
        iconImg.setAttribute('aria-hidden', 'true');
        iconImg.className = 'icon icon-sm';

        var textNode = document.createTextNode(' ' + msg);
        banner.appendChild(iconImg);
        banner.appendChild(textNode);
        document.body.insertBefore(banner, document.body.firstChild);
        setTimeout(function () { banner.remove(); }, 7000);
    }

    function _cleanUrl() {
        var url = new URL(window.location.href);
        url.searchParams.delete('upgrade');
        url.searchParams.delete('session_id');
        var newUrl = url.pathname + (url.search === '?' ? '' : url.search);
        window.history.replaceState({}, '', newUrl);
    }

    // ── Checkout ──────────────────────────────────────────────────────────────

    /**
     * Start a Stripe Checkout session for the given tier.
     * Prompts for email if not already stored.
     * @param {'deep-report'|'atlas-premium'|'business'} tier
     */
    async function startCheckout(tier) {
        var email = localStorage.getItem(EMAIL_KEY) ||
            (window.resilience_results && window.resilience_results.email) ||
            '';

        if (!email) {
            var input = window.prompt(
                'Please enter your email address to unlock premium features:'
            );
            if (!input || !input.trim()) return;
            email = input.trim();
            localStorage.setItem(EMAIL_KEY, email);
        }

        try {
            var res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier: tier, email: email }),
            });
            var data = await res.json();

            if (!res.ok) {
                window.alert(data.error || 'Unable to start checkout. Please try again.');
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                window.alert('Unable to redirect to checkout. Please try again.');
            }
        } catch (err) {
            console.error('[PaymentGating] Checkout failed:', err);
            window.alert('Checkout failed. Please try again.');
        }
    }

    // ── Auto-init ─────────────────────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        handleUpgradeSuccess().then(function () {
            applyGating();
        });
    });

    // ── Public API ────────────────────────────────────────────────────────────

    window.PaymentGating = {
        getTier:              getTier,
        setTier:              setTier,
        isDeepReport:         isDeepReport,
        isAtlasPremium:       isAtlasPremium,
        isBusiness:           isBusiness,
        isTeamsStarter:       isTeamsStarter,
        isTeamsPro:           isTeamsPro,
        isEnterprise:         isEnterprise,
        applyGating:          applyGating,
        startCheckout:        startCheckout,
        handleUpgradeSuccess: handleUpgradeSuccess,
    };

})(window);
