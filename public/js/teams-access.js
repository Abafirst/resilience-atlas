/**
 * teams-access.js — Teams Purchase Verification & Resource Gating
 *
 * Checks whether the current visitor has a valid Teams-tier purchase and
 * progressively enhances the teams resource pages:
 *
 *  - teams-resources.html:    unlocks download buttons with real API URLs
 *  - teams-facilitation.html: reveals full facilitation guide content
 *  - teams-activities.html:   reveals full facilitation guides per activity
 *  - team.html:               shows post-purchase resource hub
 *
 * Depends on payment-gating.js being loaded first (for PaymentGating helpers).
 *
 * Security notes:
 *  - Content is hidden by default; only revealed after backend confirms access.
 *  - localStorage tier values are never trusted as access proof.
 *  - If the backend check fails, access is denied (fail-safe).
 *  - JWT Bearer token is forwarded for authenticated (org/team) users.
 */

/* global PaymentGating */
(function () {
    'use strict';

    var VERIFY_ENDPOINT    = '/api/teams/access';
    var DOWNLOAD_ENDPOINT  = '/api/teams/download';

    /** Tiers that grant Teams resource access. */
    function isTeamsTier(tier) {
        return tier === 'starter' || tier === 'pro' || tier === 'enterprise';
    }

    /* ── State ─────────────────────────────────────────────────────────────── */
    var accessState = {
        checked:   false,
        hasAccess: false,
        tier:      null,
    };

    /* ── Loading overlay ────────────────────────────────────────────────────── */

    /**
     * Show a loading overlay on the main content area while access is verified.
     * Content is hidden underneath to prevent premature disclosure.
     */
    function showLoadingOverlay() {
        var page = window.location.pathname;
        var contentSelector = null;

        if (page.includes('teams-facilitation')) {
            contentSelector = '.tf-content';
        } else if (page.includes('teams-activities')) {
            contentSelector = '.ta-main';
        } else if (page.includes('teams-resources')) {
            contentSelector = '.tr-main';
        }

        if (!contentSelector) return;

        var container = document.querySelector(contentSelector);
        if (!container) return;

        // Hide the content container while loading
        container.setAttribute('data-teams-loading', 'true');
        container.style.cssText = 'position:relative;min-height:120px';

        var overlay = document.createElement('div');
        overlay.id = 'teams-loading-overlay';
        overlay.setAttribute('aria-live', 'polite');
        overlay.setAttribute('aria-busy', 'true');
        overlay.style.cssText = [
            'position:absolute', 'inset:0', 'background:rgba(255,255,255,.92)',
            'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
            'gap:.75rem', 'z-index:100', 'border-radius:8px',
        ].join(';');
        overlay.innerHTML =
            '<div style="width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#4F46E5;' +
                'border-radius:50%;animation:teams-spin 0.7s linear infinite" aria-hidden="true"></div>' +
            '<p style="color:#475569;font-size:.9rem;margin:0">Verifying access…</p>';

        // Inject spin keyframes once
        if (!document.getElementById('teams-spin-style')) {
            var style = document.createElement('style');
            style.id = 'teams-spin-style';
            style.textContent = '@keyframes teams-spin{to{transform:rotate(360deg)}}';
            document.head.appendChild(style);
        }

        container.insertBefore(overlay, container.firstChild);
    }

    /** Remove the loading overlay once the access check completes. */
    function removeLoadingOverlay() {
        var overlay = document.getElementById('teams-loading-overlay');
        if (overlay) overlay.remove();

        var containers = document.querySelectorAll('[data-teams-loading]');
        containers.forEach(function (el) {
            el.removeAttribute('data-teams-loading');
            el.style.cssText = '';
        });
    }

    /* ── Access verification ────────────────────────────────────────────────── */

    /**
     * Return true if the user has any stored credentials that could prove purchase.
     */
    function hasStoredCredentials() {
        var sessionId = window.PaymentGating
            ? PaymentGating.getSessionId()
            : (localStorage.getItem('resilience_session_id') || '');
        var email = window.PaymentGating
            ? PaymentGating.getEmail()
            : (localStorage.getItem('resilience_email') || '');
        var token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        return !!(sessionId || email || token);
    }

    /**
     * Verify teams access with the backend.
     * Tries JWT Bearer token first, then session_id, then email.
     * Returns a promise that resolves to { valid, tier }.
     *
     * SECURITY: Never falls back to localStorage tier.
     * If the backend check fails, access is denied (fail-safe default).
     */
    function verifyAccess() {
        var sessionId = '';
        var email     = '';
        var token     = '';

        // Pull credentials from payment-gating.js if available
        if (window.PaymentGating) {
            sessionId = PaymentGating.getSessionId();
            email     = PaymentGating.getEmail();
        } else {
            // Fallback: read localStorage directly
            sessionId = localStorage.getItem('resilience_session_id') || '';
            email     = localStorage.getItem('resilience_email') || '';
        }

        // Include JWT token for authenticated (org/team) users
        token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';

        if (!sessionId && !email && !token) {
            return Promise.resolve({ valid: false, tier: null });
        }

        var params = new URLSearchParams();
        if (sessionId) params.set('session_id', sessionId);
        else if (email) params.set('email', email);

        var fetchOptions = { credentials: 'same-origin' };
        if (token) {
            fetchOptions.headers = { 'Authorization': 'Bearer ' + token };
        }

        return fetch(VERIFY_ENDPOINT + '?' + params.toString(), fetchOptions)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                return { valid: !!data.valid, tier: data.tier || null };
            })
            .catch(function (err) {
                console.warn('[TeamsAccess] Backend check failed:', err);
                // Fail-safe: deny access if backend is unreachable
                return { valid: false, tier: null };
            });
    }

    /* ── Download URL builder ───────────────────────────────────────────────── */

    function buildDownloadUrl(resourceId) {
        var params = new URLSearchParams();
        var sessionId = window.PaymentGating
            ? PaymentGating.getSessionId()
            : (localStorage.getItem('resilience_session_id') || '');
        var email = window.PaymentGating
            ? PaymentGating.getEmail()
            : (localStorage.getItem('resilience_email') || '');

        if (sessionId) {
            params.set('session_id', sessionId);
        } else if (email) {
            params.set('email', email);
        }

        return DOWNLOAD_ENDPOINT + '/' + encodeURIComponent(resourceId) +
               (params.toString() ? '?' + params.toString() : '');
    }

    /* ── Resources page (teams-resources.html) ──────────────────────────────── */

    function unlockResourcesPage() {
        // Remove "coming soon" banner
        var banner = document.querySelector('.tr-coming-soon-banner');
        if (banner) banner.remove();

        // Remove access gate if present
        var gate = document.getElementById('tr-teams-gate');
        if (gate) gate.remove();

        // Show access badge
        var hero = document.querySelector('.tr-hero');
        if (hero) {
            var badge = document.createElement('div');
            badge.style.cssText = [
                'display:inline-flex', 'align-items:center', 'gap:.5rem',
                'background:rgba(255,255,255,.15)', 'border:1px solid rgba(255,255,255,.3)',
                'color:#fff', 'border-radius:20px', 'padding:.35rem .9rem',
                'font-size:.8rem', 'font-weight:600', 'margin-top:.75rem',
            ].join(';');
            badge.innerHTML = '✓&nbsp; Teams Access Active — All resources available for download';
            hero.appendChild(badge);
        }

        // Update all download buttons with real URLs
        var cards = document.querySelectorAll('.tr-card');
        cards.forEach(function (card) {
            // Get resource ID from the data attribute or the download button
            var btn  = card.querySelector('.tr-card__download-btn');
            var idEl = card.querySelector('[data-resource-id]');
            var resourceId = (idEl && idEl.getAttribute('data-resource-id')) ||
                             (btn && btn.getAttribute('data-resource-id'));

            if (!resourceId || !btn) return;

            var url = buildDownloadUrl(resourceId);
            btn.href      = url;
            btn.download  = '';
            btn.classList.remove('tr-card__download-btn--soon');
            btn.removeAttribute('aria-disabled');
            btn.setAttribute('aria-label', 'Download ' + (btn.getAttribute('data-title') || resourceId));
            btn.innerHTML = '⬇ Download';
        });
    }

    function showResourcesGate() {
        // Replace "coming soon" banner with upgrade gate
        var banner = document.querySelector('.tr-coming-soon-banner');
        var gateEl = document.createElement('div');
        gateEl.id = 'tr-teams-gate';
        gateEl.setAttribute('role', 'alert');
        gateEl.style.cssText = [
            'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
            'padding:2rem 1.5rem', 'margin:2rem 0', 'text-align:center',
        ].join(';');
        gateEl.innerHTML =
            '<div style="font-size:2.5rem;margin-bottom:.75rem">🔒</div>' +
            '<h2 style="color:#1e40af;margin:0 0 .5rem;font-size:1.25rem">Teams Access Required</h2>' +
            '<p style="color:#475569;margin:0 0 .75rem;max-width:480px;margin-left:auto;margin-right:auto">' +
                'This resource is part of Teams Starter/Pro. Please purchase to unlock.' +
            '</p>' +
            '<p style="color:#475569;margin:0 0 1.25rem;max-width:480px;margin-left:auto;margin-right:auto;font-size:.9rem">' +
                'Purchase any Teams package to unlock all 31 resources instantly.' +
            '</p>' +
            '<div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">' +
                '<a href="/team.html#pricing" style="background:#4F46E5;color:#fff;border-radius:8px;' +
                    'padding:.65rem 1.5rem;font-weight:700;text-decoration:none;font-size:.95rem">' +
                    '🚀 View Teams Packages</a>' +
                '<a href="/team.html" style="background:#fff;color:#1e293b;border:1px solid #cbd5e1;' +
                    'border-radius:8px;padding:.65rem 1.5rem;font-weight:600;text-decoration:none;font-size:.95rem">' +
                    'Learn More</a>' +
            '</div>';

        if (banner) {
            banner.replaceWith(gateEl);
        } else {
            var main = document.querySelector('.tr-main');
            if (main) main.insertBefore(gateEl, main.firstChild);
        }

        // Dim download buttons
        document.querySelectorAll('.tr-card__download-btn').forEach(function (btn) {
            btn.classList.add('tr-card__download-btn--soon');
            btn.href = '#';
            btn.setAttribute('aria-disabled', 'true');
            btn.setAttribute('aria-label', 'Purchase a Teams package to unlock downloads');
            btn.onclick = function (e) {
                e.preventDefault();
                window.location.href = '/team.html#pricing';
            };
        });
    }

    /* ── Facilitation page (teams-facilitation.html) ─────────────────────────── */

    function unlockFacilitationPage() {
        // Remove gate overlay if present
        var gate = document.getElementById('tf-access-gate');
        if (gate) gate.remove();

        // Reveal the content area (hidden by default until access confirmed)
        var content = document.querySelector('.tf-content');
        if (content) content.removeAttribute('hidden');

        // Show access indicator
        var hero = document.querySelector('.tf-hero');
        if (hero) {
            var badge = document.createElement('div');
            badge.style.cssText = 'display:inline-flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:20px;padding:.35rem .9rem;font-size:.8rem;font-weight:600;margin-top:.75rem';
            badge.innerHTML = '✓&nbsp; Full facilitation guide unlocked';
            hero.appendChild(badge);
        }

        // Show all previously hidden expandable bodies
        document.querySelectorAll('.tf-expandable__body[data-gated]').forEach(function (el) {
            el.removeAttribute('data-gated');
        });
    }

    function showFacilitationGate() {
        // Keep .tf-content hidden — insert the gate outside/before it
        var layout = document.querySelector('.tf-layout');
        var content = document.querySelector('.tf-content');

        var gate = document.createElement('div');
        gate.id = 'tf-access-gate';
        gate.setAttribute('role', 'alert');
        gate.style.cssText = [
            'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
            'padding:2.5rem 2rem', 'margin:2rem 1.5rem', 'text-align:center',
        ].join(';');
        gate.innerHTML =
            '<div style="font-size:2.5rem;margin-bottom:.75rem">🔒</div>' +
            '<h2 style="color:#1e40af;margin:0 0 .5rem;font-size:1.25rem">Teams Access Required</h2>' +
            '<p style="color:#475569;margin:0 0 .75rem;max-width:540px;margin-left:auto;margin-right:auto">' +
                'This resource is part of Teams Starter/Pro. Please purchase to unlock.' +
            '</p>' +
            '<p style="color:#475569;margin:0 0 1.25rem;max-width:540px;margin-left:auto;margin-right:auto;font-size:.9rem">' +
                'The complete facilitation guide — including all scripts, interventions, and best practices — ' +
                'is available exclusively to Teams package holders.' +
            '</p>' +
            '<div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">' +
                '<a href="/team.html#pricing" style="background:#4F46E5;color:#fff;border-radius:8px;' +
                    'padding:.65rem 1.5rem;font-weight:700;text-decoration:none;font-size:.95rem">' +
                    '🚀 Unlock Full Guide</a>' +
                '<a href="/team.html" style="background:#fff;color:#1e293b;border:1px solid #cbd5e1;' +
                    'border-radius:8px;padding:.65rem 1.5rem;font-weight:600;text-decoration:none;font-size:.95rem">' +
                    'View Packages</a>' +
            '</div>';

        // Insert gate before the layout (content stays hidden)
        if (layout) {
            layout.parentNode.insertBefore(gate, layout);
        } else if (content) {
            content.parentNode.insertBefore(gate, content);
        } else {
            var main = document.getElementById('main-content');
            if (main) main.insertBefore(gate, main.firstChild);
        }

        // Ensure content remains hidden
        if (content) content.setAttribute('hidden', '');
    }

    /* ── Activities page (teams-activities.html) ─────────────────────────────── */

    function unlockActivitiesPage() {
        // Remove any activity gate overlay
        var gate = document.getElementById('ta-access-gate');
        if (gate) gate.remove();

        // Show access badge in hero
        var hero = document.querySelector('.ta-hero, [class*="ta-hero"]');
        if (!hero) hero = document.querySelector('section[aria-label="Page hero"]');
        if (hero) {
            var badge = document.createElement('div');
            badge.style.cssText = 'display:inline-flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:20px;padding:.35rem .9rem;font-size:.8rem;font-weight:600;margin-top:.75rem';
            badge.innerHTML = '✓&nbsp; Full activity facilitation guides unlocked';
            hero.appendChild(badge);
        }

        // Reveal all gated activity detail sections
        document.querySelectorAll('[data-activity-gated]').forEach(function (el) {
            el.removeAttribute('data-activity-gated');
            el.hidden = false;
        });
    }

    function showActivitiesGate() {
        // Find the activity grid/list container
        var grid = document.getElementById('ta-activities-grid') ||
                   document.querySelector('.ta-grid, [id*="activities"]');
        var main = document.querySelector('.ta-main');
        var insertTarget = grid || main;

        if (insertTarget) {
            var gate = document.createElement('div');
            gate.id = 'ta-access-gate';
            gate.setAttribute('role', 'alert');
            gate.style.cssText = [
                'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
                'padding:2rem 1.5rem', 'margin:0 0 2rem', 'text-align:center',
            ].join(';');
            gate.innerHTML =
                '<div style="font-size:2rem;margin-bottom:.5rem">🔒</div>' +
                '<h2 style="color:#1e40af;margin:0 0 .4rem;font-size:1.1rem">Teams Access Required</h2>' +
                '<p style="color:#475569;margin:0 0 .5rem;font-size:.9rem">' +
                    'This resource is part of Teams Starter/Pro. Please purchase to unlock.' +
                '</p>' +
                '<p style="color:#475569;margin:0 0 1rem;font-size:.9rem">Step-by-step instructions, facilitation tips, and reflection prompts are available to Teams package holders.</p>' +
                '<a href="/team.html#pricing" style="display:inline-block;background:#4F46E5;color:#fff;' +
                    'border-radius:8px;padding:.55rem 1.25rem;font-weight:700;text-decoration:none;font-size:.9rem">' +
                    '🚀 Unlock Full Guides</a>';
            insertTarget.insertBefore(gate, insertTarget.firstChild);
        }

        // Intercept "View Details" toggle clicks and redirect to purchase
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.ta-card__toggle');
            if (btn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                // Show inline notice on the card instead of a browser dialog
                var card = btn.closest('.ta-card');
                var existingNotice = card && card.querySelector('.ta-gate-notice');
                if (!existingNotice && card) {
                    var notice = document.createElement('p');
                    notice.className = 'ta-gate-notice';
                    notice.style.cssText = 'margin:.5rem 0 0;font-size:.85rem;color:#1e40af;background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:.4rem .75rem';
                    notice.innerHTML = '🔒 <strong>Teams package required.</strong> <a href="/team.html#pricing" style="color:#1e40af;font-weight:700">View packages →</a>';
                    btn.insertAdjacentElement('afterend', notice);
                }
            }
        }, true);
    }

    /* ── Login prompt gate (unauthenticated users) ───────────────────────────── */

    /**
     * Show a gate prompting the user to log in or purchase,
     * used when no stored credentials exist at all.
     */
    function showLoginGate() {
        var page = window.location.pathname;
        var returnTo = encodeURIComponent(page + window.location.search);

        var gateEl = document.createElement('div');
        gateEl.id = 'teams-login-gate';
        gateEl.setAttribute('role', 'alert');
        gateEl.style.cssText = [
            'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
            'padding:2.5rem 2rem', 'margin:2rem 1.5rem', 'text-align:center',
        ].join(';');
        gateEl.innerHTML =
            '<div style="font-size:2.5rem;margin-bottom:.75rem">🔒</div>' +
            '<h2 style="color:#1e40af;margin:0 0 .5rem;font-size:1.25rem">Sign In Required</h2>' +
            '<p style="color:#475569;margin:0 0 1.25rem;max-width:500px;margin-left:auto;margin-right:auto">' +
                'This resource is part of Teams Starter/Pro. Please sign in or purchase a Teams package to access this content.' +
            '</p>' +
            '<div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">' +
                '<a href="/login?returnTo=' + returnTo + '" style="background:#4F46E5;color:#fff;border-radius:8px;' +
                    'padding:.65rem 1.5rem;font-weight:700;text-decoration:none;font-size:.95rem">' +
                    '👤 Sign In</a>' +
                '<a href="/team.html#pricing" style="background:#fff;color:#1e293b;border:1px solid #cbd5e1;' +
                    'border-radius:8px;padding:.65rem 1.5rem;font-weight:600;text-decoration:none;font-size:.95rem">' +
                    '🚀 View Teams Packages</a>' +
            '</div>';

        // Apply the appropriate gate based on page
        if (page.includes('teams-facilitation')) {
            var layout = document.querySelector('.tf-layout');
            var content = document.querySelector('.tf-content');
            if (content) content.setAttribute('hidden', '');
            if (layout) layout.parentNode.insertBefore(gateEl, layout);
            else if (content) content.parentNode.insertBefore(gateEl, content);
        } else if (page.includes('teams-activities')) {
            var main = document.querySelector('.ta-main');
            if (main) main.insertBefore(gateEl, main.firstChild);
            // Intercept toggle clicks
            document.addEventListener('click', function (e) {
                if (e.target.closest('.ta-card__toggle')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.location.href = '/login?returnTo=' + returnTo;
                }
            }, true);
        } else if (page.includes('teams-resources')) {
            var trMain = document.querySelector('.tr-main');
            var banner = document.querySelector('.tr-coming-soon-banner');
            if (banner) banner.replaceWith(gateEl);
            else if (trMain) trMain.insertBefore(gateEl, trMain.firstChild);
            document.querySelectorAll('.tr-card__download-btn').forEach(function (btn) {
                btn.classList.add('tr-card__download-btn--soon');
                btn.href = '#';
                btn.setAttribute('aria-disabled', 'true');
                btn.onclick = function (e) {
                    e.preventDefault();
                    window.location.href = '/login?returnTo=' + returnTo;
                };
            });
        }
    }

    /* ── Teams home page (team.html) ─────────────────────────────────────────── */

    function showTeamPageResources() {
        var hub = document.getElementById('teams-resource-hub');
        if (hub) {
            hub.hidden = false;
        }
        var gateMsg = document.getElementById('teams-resource-gate-msg');
        if (gateMsg) {
            gateMsg.hidden = true;
        }
    }

    /* ── Main init ─────────────────────────────────────────────────────────── */

    function applyAccessState(valid) {
        accessState.hasAccess = valid;
        accessState.checked   = true;

        var page = window.location.pathname;

        if (page.includes('teams-resources')) {
            if (valid) {
                unlockResourcesPage();
            } else {
                showResourcesGate();
            }
        } else if (page.includes('teams-facilitation')) {
            if (valid) {
                unlockFacilitationPage();
            } else {
                showFacilitationGate();
            }
        } else if (page.includes('teams-activities')) {
            if (valid) {
                unlockActivitiesPage();
            } else {
                showActivitiesGate();
            }
        } else if (page.includes('team.html') || page === '/' || page.endsWith('/team')) {
            if (valid) {
                showTeamPageResources();
            }
        }
    }

    function init() {
        // Show loading overlay while verifying with the backend
        showLoadingOverlay();

        // For facilitation page, hide the content area immediately
        // (it also has the `hidden` attribute set in HTML, but this handles
        // dynamic navigation and ensures content stays hidden during the check)
        var facilitationContent = document.querySelector('.tf-content');
        if (facilitationContent) facilitationContent.setAttribute('hidden', '');

        // Verify access with the backend — no optimistic unlock, no localStorage trust
        verifyAccess().then(function (result) {
            removeLoadingOverlay();
            accessState.tier = result.tier;
            accessState.checked = true;

            if (!hasStoredCredentials()) {
                // No credentials at all — show login/purchase prompt
                showLoginGate();
            } else {
                applyAccessState(result.valid);
                if (result.valid && window.PaymentGating) {
                    PaymentGating.setTier(result.tier);
                } else if (!result.valid) {
                    // Server confirmed no access — reset local tier
                    if (window.PaymentGating) {
                        PaymentGating.setTier('free');
                    } else {
                        localStorage.setItem('resilience_tier', 'free');
                    }
                }
            }
        });
    }

    // Wait for DOM and payment-gating.js to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also listen for the paymentVerified event fired by payment-gating.js
    document.addEventListener('paymentVerified', function (e) {
        if (e.detail && isTeamsTier(e.detail.tier)) {
            applyAccessState(true);
            accessState.tier = e.detail.tier;
        }
    });

    // Public API
    window.TeamsAccess = {
        hasAccess:        function () { return accessState.hasAccess; },
        getTier:          function () { return accessState.tier; },
        buildDownloadUrl: buildDownloadUrl,
        verifyAccess:     verifyAccess,
    };

}());
