'use strict';

/**
 * payment-gating.js — Frontend payment gating for Resilience Atlas.
 *
 * Responsibilities:
 *  1. Read the user's current tier from localStorage.
 *  2. Handle post-payment redirect (?upgrade=success&session_id=...) by
 *     verifying the Stripe session with the backend and storing the tier.
 *  3. Apply or remove CSS locks on sections marked data-tier="atlas-navigator"
 *     or data-tier="atlas-premium".
 *  4. Initiate a Stripe Checkout session when the user clicks an upgrade button.
 *
 * No external dependencies.  Exposed as window.PaymentGating.
 */
(function (window) {

    const TIER_KEY       = 'resilience_tier';
    const EMAIL_KEY      = 'resilience_email';
    const SESSION_ID_KEY = 'resilience_session_id';

    /**
     * Tier hierarchy (lowest → highest access):
     *   free → atlas-starter → atlas-navigator → atlas-premium
     *                        → teams-starter → teams-pro → teams-enterprise
     *
     * Each tier inherits all features of the tiers below it.
     */
    const TIER_CONFIG = {
        'free': {
            name: 'Free',
            price: 0,
            billing: 'free',
            maxUsers: 1,
            maxTeams: 0,
            features: ['Basic assessment', 'Individual results', 'Radar chart'],
            dataRetention: '1 month',
        },
        'atlas-starter': {
            name: 'Atlas Starter',
            price: 999, // $9.99
            billing: 'one-time',
            maxUsers: 1,
            maxTeams: 0,
            features: ['Full PDF Report (1 report per purchase)', 'Gamification Access', 'Assessment History'],
            dataRetention: 'Unlimited',
        },
        'atlas-navigator': {
            name: 'Atlas Navigator (Lifetime)',
            price: 4999, // $49.99
            billing: 'one-time',
            maxUsers: 1,
            maxTeams: 0,
            features: ['Deep Report', 'Full dimension analysis', 'Personalized strategies', 'Lifetime access'],
            dataRetention: '1 year',
        },
        'atlas-premium': {
            name: 'Atlas Premium',
            price: 4999, // $49.99
            billing: 'one-time',
            maxUsers: 1,
            maxTeams: 0,
            features: ['All Deep Report features', 'Lifetime access', 'Unlimited reassessments'],
            dataRetention: 'Unlimited',
        },
        'teams-starter': {
            name: 'Atlas Teams Basic',
            price: 29900, // $299 one-time
            billing: 'one-time',
            maxUsers: 15,
            maxTeams: 1,
            features: ['Team dashboard', 'Basic reports', 'CSV export', '1 team'],
            dataRetention: '1 year',
        },
        'teams-pro': {
            name: 'Atlas Teams Premium',
            price: 69900, // $699 one-time
            billing: 'one-time',
            maxUsers: 30,
            maxTeams: 999,
            features: ['Advanced analytics', 'Facilitation tools', 'Multiple teams', 'Auto-generated reports'],
            dataRetention: '3 years',
        },
        'teams-enterprise': {
            name: 'Atlas Teams Enterprise',
            price: 249900, // Starting at $2,499 one-time
            billing: 'one-time',
            maxUsers: Infinity,
            maxTeams: Infinity,
            features: ['Unlimited users & teams', 'Org-managed custom branding', 'SSO/SAML self-service setup', 'Self-service data export', 'Everything in Premium', 'Self-custody: own your org data'],
            dataRetention: 'Self-managed (export anytime)',
        },
    };

    // -- Tier helpers ----------------------------------------------------------

    function getTier() {
        return localStorage.getItem(TIER_KEY) || 'free';
    }

    function setTier(tier) {
        localStorage.setItem(TIER_KEY, tier);
    }

    function isDeepReport() {
        const t = getTier();
        return t === 'atlas-navigator' || t === 'atlas-premium' ||
               t === 'teams-starter'  || t === 'teams-pro' || t === 'teams-enterprise' ||
               // Legacy tier names (backward compatibility for existing purchases)
               t === 'starter' || t === 'pro' || t === 'enterprise';
    }

    /**
     * True for Atlas Starter ($9.99 one-time) — grants access to the basic
     * PDF summary report.  Does NOT unlock deep-report sections (use
     * isDeepReport() for those), but does allow PDF download.
     */
    function isBasicReport() {
        const t = getTier();
        return t === 'atlas-starter';
    }

    /**
     * True for any individual paid tier that grants PDF download access:
     * atlas-starter (basic report) or atlas-navigator/premium (deep report).
     * Also true for all Teams tiers.
     */
    function isAnyPaidTier() {
        return isBasicReport() || isDeepReport();
    }

    function isAtlasPremium() {
        const t = getTier();
        return t === 'atlas-premium' ||
               t === 'teams-starter' || t === 'teams-pro' || t === 'teams-enterprise' ||
               // Legacy tier names (backward compatibility)
               t === 'starter' || t === 'pro' || t === 'enterprise';
    }

    function isBusiness() {
        const t = getTier();
        return t === 'teams-starter' || t === 'teams-pro' || t === 'teams-enterprise' ||
               // Legacy tier names (backward compatibility)
               t === 'starter' || t === 'pro' || t === 'enterprise';
    }

    // -- Teams tier helpers ----------------------------------------------------

    /** Atlas Teams Basic ($299 one-time): up to 15 users, 1 team, basic dashboard + CSV. */
    function isTeamsStarter() {
        const t = getTier();
        return t === 'teams-starter' || t === 'teams-pro' || t === 'teams-enterprise' ||
               // Legacy tier names (backward compatibility)
               t === 'starter' || t === 'pro' || t === 'enterprise';
    }

    /**
     * Atlas Teams Premium ($699 one-time): up to 30 users, unlimited teams.
     * Advanced analytics, auto-reports, facilitation tools, team management.
     */
    function isTeamsPro() {
        const t = getTier();
        return t === 'teams-pro' || t === 'teams-enterprise' ||
               // Legacy tier names (backward compatibility)
               t === 'pro' || t === 'enterprise';
    }

    /** Atlas Teams Enterprise (custom): unlimited users/teams, branding, webhooks, SSO. */
    function isEnterprise() {
        const t = getTier();
        return t === 'teams-enterprise' || t === 'enterprise';
    }

    /** True for any Teams tier. */
    function hasTeamsAccess() {
        const t = getTier();
        return t === 'teams-starter' || t === 'teams-pro' || t === 'teams-enterprise' ||
               // Legacy tier names (backward compatibility)
               t === 'starter' || t === 'pro' || t === 'enterprise';
    }

    // -- Click-interception guard ---------------------------------------------

    /**
     * Returns true when the click target (or any of its ancestors) belongs to
     * the PDF download button.  Any global or delegated click handler should
     * call this guard first and return immediately when it is true, so that the
     * React PDF-download pipeline is never hijacked by payment-gating logic.
     *
     * @param {Event} e  A DOM click (or similar) event.
     * @returns {boolean}
     */
    function _isPdfDownloadClick(e) {
        if (!e || !e.target) return false;
        var el = e.target.closest
            ? e.target.closest('[data-ignore-gating="true"], #downloadPdfReportBtn')
            : null;
        return Boolean(el);
    }

    // -- Apply/remove locks ---------------------------------------------------

    /**
     * Walk every element with a data-tier attribute and show or hide its
     * payment-overlay depending on the user's current tier.
     *
     * Elements with `data-ignore-gating` or `id="downloadPdfBtn"` are skipped
     * so that the PDF download button is never accidentally locked by this handler.
     */
    function applyGating() {
        document.querySelectorAll('[data-tier]').forEach(function (section) {
            // Never lock the PDF download button or any explicitly opted-out element.
            if (section.id === 'downloadPdfBtn' || section.hasAttribute('data-ignore-gating')) {
                return;
            }

            const required = section.getAttribute('data-tier');
            const unlocked =
                (required === 'atlas-starter'                                                          && isAnyPaidTier())   ||
                (required === 'atlas-navigator'                                                        && isDeepReport())    ||
                // atlas-premium sections unlocked for all atlas-navigator+ users
                (required === 'atlas-premium'                                                          && isDeepReport())    ||
                ((required === 'teams-starter' || required === 'starter')                              && isTeamsStarter())  ||
                ((required === 'teams-pro'     || required === 'pro')                                  && isTeamsPro())      ||
                ((required === 'teams-enterprise' || required === 'enterprise')                        && isEnterprise());

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

    // -- Post-payment verification ---------------------------------------------

    /**
     * Show the page's spinner overlay with an optional message.
     * Falls back gracefully if the overlay element is not present.
     */
    function _showSpinner(text) {
        var overlay = document.getElementById('spinnerOverlay');
        var label   = document.getElementById('spinnerText');
        if (!overlay) return;
        if (label) label.textContent = text || 'Verifying your payment…';
        overlay.classList.add('active');
    }

    /** Hide the page's spinner overlay. */
    function _hideSpinner() {
        var overlay = document.getElementById('spinnerOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    /**
     * Show a top-of-page notice banner (info/error/success).
     * @param {string} msg
     * @param {'info'|'success'|'error'} type
     */
    function _showNoticeBanner(msg, type) {
        var existing = document.getElementById('paymentNoticeBanner');
        if (existing) existing.remove();

        var banner = document.createElement('div');
        banner.id = 'paymentNoticeBanner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'assertive');
        banner.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'right:0',
            'z-index:10000',
            'padding:0.9rem 1.25rem',
            'font-size:0.95rem',
            'font-weight:600',
            'text-align:center',
            'box-shadow:0 2px 8px rgba(0,0,0,.15)',
        ].join(';');

        if (type === 'error') {
            banner.style.background = '#fee2e2';
            banner.style.color = '#991b1b';
            banner.style.borderBottom = '2px solid #fca5a5';
        } else if (type === 'success') {
            banner.style.background = '#dcfce7';
            banner.style.color = '#166534';
            banner.style.borderBottom = '2px solid #86efac';
        } else {
            banner.style.background = '#eff6ff';
            banner.style.color = '#1e40af';
            banner.style.borderBottom = '2px solid #93c5fd';
        }

        banner.textContent = msg;

        // Add a dismiss button.
        var btn = document.createElement('button');
        btn.setAttribute('aria-label', 'Dismiss');
        btn.style.cssText = 'margin-left:1rem;background:none;border:none;cursor:pointer;font-size:1.1rem;line-height:1;vertical-align:middle;opacity:.7';
        btn.textContent = '\u00d7';
        btn.addEventListener('click', function () { banner.remove(); });
        banner.appendChild(btn);

        document.body.insertBefore(banner, document.body.firstChild);

        // Auto-dismiss success/info banners after 8 seconds.
        if (type !== 'error') {
            setTimeout(function () { if (banner.parentNode) banner.remove(); }, 8000);
        }
    }

    /**
     * If the current URL contains ?upgrade=success&session_id=<id>, call the
     * backend to verify the session, persist the tier, then clean the URL.
     * Shows a spinner while verifying and clear feedback on success or failure.
     */
    async function handleUpgradeSuccess() {
        const params    = new URLSearchParams(window.location.search);
        const upgrade   = params.get('upgrade');
        const sessionId = params.get('session_id');

        // Accept both 'success' (standard Stripe redirect) and tier names as upgrade param.
        const isUpgradeRedirect = (upgrade === 'success' || upgrade === 'atlas-navigator' || upgrade === 'atlas-premium') && sessionId;

        if (!isUpgradeRedirect) {
            // Show a notice when the user cancelled their payment.
            if (upgrade === 'cancelled') {
                _cleanUrl();
                _showNoticeBanner(
                    'Your payment was cancelled. You can upgrade any time to unlock your full report.',
                    'info'
                );
            }
            return;
        }

        // Show a loading indicator so users know verification is in progress
        // and don't click the download button prematurely.
        _showSpinner('Verifying your payment…');

        try {
            var res  = await fetch('/api/payments/verify?session_id=' + encodeURIComponent(sessionId));
            var data = await res.json();

            if (data.success && data.tier) {
                setTier(data.tier);
                if (data.email) {
                    localStorage.setItem(EMAIL_KEY, data.email);
                }
                // Persist the Stripe session ID so teams pages can request
                // gated downloads without requiring re-verification.
                if (sessionId) {
                    localStorage.setItem(SESSION_ID_KEY, sessionId);
                }
                // Restore results from localStorage into window so the page can render them.
                if (!window.resilience_results) {
                    try {
                        const stored = localStorage.getItem('resilience_results');
                        if (stored) {
                            window.resilience_results = JSON.parse(stored);
                        }
                    } catch (e) {
                        console.warn('[PaymentGating] Could not restore results:', e);
                    }
                }
                _showSuccessBanner();
                applyGating();
                // Notify other scripts (e.g. results.js) that access is now unlocked.
                document.dispatchEvent(new CustomEvent('paymentVerified', {
                    detail: { tier: data.tier, email: data.email },
                }));
            } else if (!res.ok || (data && !data.success)) {
                // Payment verification returned a non-success response.
                var reason = (data && data.error) ? data.error : 'Payment could not be verified.';
                console.warn('[PaymentGating] Verification returned non-success:', reason);
                _showNoticeBanner(
                    'We could not confirm your payment access. Please refresh the page or contact support if the issue persists.',
                    'error'
                );
            }
        } catch (err) {
            console.error('[PaymentGating] Verification failed:', err);
            _showNoticeBanner(
                'There was a problem verifying your payment. Please refresh the page — if you completed payment your access will be restored. Contact support if the issue continues.',
                'error'
            );
        } finally {
            _hideSpinner();
        }

        _cleanUrl();
    }

    function _showSuccessBanner() {
        var REDIRECT_DELAY_MS = 3000;

        var banner = document.createElement('div');
        banner.className = 'payment-success-banner';
        banner.setAttribute('role', 'alert');
        banner.setAttribute('aria-live', 'polite');
        banner.style.setProperty('--banner-duration', (REDIRECT_DELAY_MS / 1000) + 's');

        var iconImg = document.createElement('img');
        iconImg.src = '/icons/success.svg';
        iconImg.alt = '';
        iconImg.setAttribute('aria-hidden', 'true');
        iconImg.className = 'icon icon-sm';
        banner.appendChild(iconImg);

        var textNode = document.createTextNode(' Payment successful! You will be redirected in a moment. Please be patient.');
        banner.appendChild(textNode);

        // Progress bar counts down to the redirect.
        var progressBar = document.createElement('div');
        progressBar.className = 'payment-success-progress';
        banner.appendChild(progressBar);

        // Fallback link shown in case the redirect is delayed.
        // Use pathname only (no query params or hash) so the page reloads cleanly
        // after _cleanUrl() has already stripped the Stripe session params.
        var fallback = document.createElement('a');
        fallback.className = 'payment-banner-fallback';
        fallback.textContent = 'If you are not redirected, click here to continue.';
        fallback.href = window.location.pathname;
        fallback.setAttribute('aria-label', 'Continue to your results');
        banner.appendChild(fallback);

        document.body.insertBefore(banner, document.body.firstChild);

        // Auto-redirect: reload the current page (without query params) so the
        // frontend fetches a fresh access status and removes any locked overlays.
        var redirectTimer = setTimeout(function () {
            if (banner.parentNode) banner.remove();
            window.location.href = window.location.pathname;
        }, REDIRECT_DELAY_MS);

        // If the user clicks the fallback link, cancel the timer so we don't
        // redirect twice.
        fallback.addEventListener('click', function () {
            clearTimeout(redirectTimer);
        });
    }

    function _cleanUrl() {
        var url = new URL(window.location.href);
        url.searchParams.delete('upgrade');
        url.searchParams.delete('session_id');
        var newUrl = url.pathname + (url.search === '?' ? '' : url.search);
        window.history.replaceState({}, '', newUrl);
    }

    // -- Checkout --------------------------------------------------------------

    /**
     * Start a Stripe Checkout session for the given tier.
     *
     * Flow:
     *  1. If AUTH0_DOMAIN is configured (server reports it via /config) and the
     *     user is not yet authenticated, redirect to Auth0 login first.  The
     *     return URL includes `?checkout=<tier>` so that after login the checkout
     *     is auto-started on this page.
     *  2. Otherwise, prompt for email (if not already stored) and initiate a
     *     Stripe Checkout session.
     *
     * @param {'atlas-starter'|'atlas-navigator'|'atlas-premium'|'teams-starter'|'teams-pro'|'teams-enterprise'} tier
     */
    async function startCheckout(tier) {
        // ── Step 1: Auth0 login gate ──────────────────────────────────────────
        // Fetch the server config once per page load to learn whether Auth0 is
        // configured.  Cache the result in a module-level variable.
        try {
            if (_auth0Config === undefined) {
                const cfgRes = await fetch('/config');
                _auth0Config = cfgRes.ok ? await cfgRes.json() : null;
            }
        } catch (_e) {
            _auth0Config = null;
        }

        if (_auth0Config && _auth0Config.auth0Domain) {
            // Ask the backend whether the user has an active Auth0 session.
            const authStatus = await _checkAuth0Session();
            if (!authStatus.authenticated) {
                // Not logged in — redirect to Auth0.  After login, Auth0 will
                // redirect back to this page via the configured callback.  We
                // pass `returnTo` so the user lands back here with the
                // checkout intent intact.
                var returnTo = window.location.pathname +
                    '?checkout=' + encodeURIComponent(tier);
                window.location.href = '/login?returnTo=' + encodeURIComponent(returnTo);
                return;
            }
            // Already authenticated — pre-fill email from Auth0 so the user
            // is taken directly to Stripe checkout without an email prompt.
            if (authStatus.email) {
                console.log('[PaymentGating] Auth0 session active; skipping login redirect for authenticated user.');
                localStorage.setItem(EMAIL_KEY, authStatus.email);
            }
        }

        // ── Step 2: Collect email & start Stripe Checkout ────────────────────
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
            var assessmentPayload = {};
            try {
                var storedResults = localStorage.getItem('resilience_results');
                if (storedResults) {
                    var parsedResults = JSON.parse(storedResults);
                    if (parsedResults && parsedResults.overall !== undefined && parsedResults.dominantType) {
                        assessmentPayload = {
                            overall:      parsedResults.overall,
                            dominantType: parsedResults.dominantType,
                            scores:       parsedResults.scores || null,
                        };
                    }
                }
            } catch (_parseErr) {
                // Assessment data is optional — proceed without it if localStorage is unavailable.
            }
            var res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.assign({ tier: tier, email: email }, assessmentPayload)),
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

    /**
     * Check whether the current user has an active Auth0 session.
     * Uses the backend's /api/auth/oidc-status endpoint (added for this flow).
     * Returns a Promise<{ authenticated: boolean, email: string|null, name: string|null }>.
     */
    async function _checkAuth0Session() {
        try {
            var r = await fetch('/api/auth/oidc-status', { credentials: 'include' });
            if (!r.ok) return { authenticated: false, email: null, name: null };
            var d = await r.json();
            return {
                authenticated: Boolean(d && d.authenticated),
                email: (d && d.email) || null,
                name:  (d && d.name)  || null,
            };
        } catch (_e) {
            return { authenticated: false, email: null, name: null };
        }
    }

    /** Cached /config response (undefined = not yet fetched, null = fetch failed). */
    var _auth0Config;

    // -- Auto-init -------------------------------------------------------------

    document.addEventListener('DOMContentLoaded', function () {
        handleUpgradeSuccess().then(function () {
            applyGating();
            // Auto-start checkout if the user was redirected back here after
            // Auth0 login with a ?checkout=<tier> query parameter.
            var params = new URLSearchParams(window.location.search);
            var checkoutTier = params.get('checkout');
            if (checkoutTier) {
                // Remove the param from the URL to avoid re-triggering on refresh.
                var cleanUrl = window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);
                // Allow the page to finish rendering before the checkout redirect.
                var PAGE_RENDER_DELAY_MS = 500;
                setTimeout(function () {
                    startCheckout(checkoutTier);
                }, PAGE_RENDER_DELAY_MS);
            }
        });
    });

    // -- Public API ------------------------------------------------------------

    window.PaymentGating = {
        TIER_CONFIG:          TIER_CONFIG,
        getTier:              getTier,
        setTier:              setTier,
        isDeepReport:         isDeepReport,
        isBasicReport:        isBasicReport,
        isAnyPaidTier:        isAnyPaidTier,
        isAtlasPremium:       isAtlasPremium,
        isBusiness:           isBusiness,
        isTeamsStarter:       isTeamsStarter,
        isTeamsPro:           isTeamsPro,
        isEnterprise:         isEnterprise,
        hasTeamsAccess:       hasTeamsAccess,
        getSessionId:         function () { return localStorage.getItem(SESSION_ID_KEY) || ''; },
        getEmail:             function () { return localStorage.getItem(EMAIL_KEY) || ''; },
        applyGating:          applyGating,
        startCheckout:        startCheckout,
        handleUpgradeSuccess: handleUpgradeSuccess,
        isPdfDownloadClick:   _isPdfDownloadClick,
    };

})(window);
