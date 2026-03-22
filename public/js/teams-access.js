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
 */

/* global PaymentGating */
(function () {
    'use strict';

    var VERIFY_ENDPOINT    = '/api/teams/access';
    var DOWNLOAD_ENDPOINT  = '/api/teams/download';

    /* ── State ─────────────────────────────────────────────────────────────── */
    var accessState = {
        checked:   false,
        hasAccess: false,
        tier:      null,
    };

    /* ── Access verification ────────────────────────────────────────────────── */

    /**
     * Verify teams access with the backend.
     * Tries session_id first, then email.
     * Returns a promise that resolves to { valid, tier }.
     */
    function verifyAccess() {
        var sessionId = '';
        var email     = '';

        // Pull credentials from payment-gating.js if available
        if (window.PaymentGating) {
            sessionId = PaymentGating.getSessionId();
            email     = PaymentGating.getEmail();
        } else {
            // Fallback: read localStorage directly
            sessionId = localStorage.getItem('resilience_session_id') || '';
            email     = localStorage.getItem('resilience_email') || '';
        }

        if (!sessionId && !email) {
            return Promise.resolve({ valid: false, tier: null });
        }

        var params = new URLSearchParams();
        if (sessionId) params.set('session_id', sessionId);
        else if (email) params.set('email', email);

        return fetch(VERIFY_ENDPOINT + '?' + params.toString())
            .then(function (res) { return res.json(); })
            .then(function (data) {
                return { valid: !!data.valid, tier: data.tier || null };
            })
            .catch(function (err) {
                console.warn('[TeamsAccess] Backend check failed:', err);
                // Graceful degradation: trust local tier as fallback
                var localTier = window.PaymentGating
                    ? PaymentGating.getTier()
                    : (localStorage.getItem('resilience_tier') || 'free');
                var teamsLocal = (localTier === 'starter' || localTier === 'pro' || localTier === 'enterprise');
                return { valid: teamsLocal, tier: teamsLocal ? localTier : null };
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
        gateEl.style.cssText = [
            'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
            'padding:2rem 1.5rem', 'margin:2rem 0', 'text-align:center',
        ].join(';');
        gateEl.innerHTML =
            '<div style="font-size:2.5rem;margin-bottom:.75rem">🔒</div>' +
            '<h2 style="color:#1e40af;margin:0 0 .5rem;font-size:1.25rem">Teams Access Required</h2>' +
            '<p style="color:#475569;margin:0 0 1.25rem;max-width:480px;margin-left:auto;margin-right:auto">' +
                'Download access is available exclusively to Teams package holders. ' +
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
        var content = document.querySelector('.tf-content');
        if (!content) return;

        var gate = document.createElement('div');
        gate.id = 'tf-access-gate';
        gate.style.cssText = [
            'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
            'padding:2.5rem 2rem', 'margin:2rem 0', 'text-align:center',
        ].join(';');
        gate.innerHTML =
            '<div style="font-size:2.5rem;margin-bottom:.75rem">🔒</div>' +
            '<h2 style="color:#1e40af;margin:0 0 .5rem;font-size:1.25rem">Teams Access Required</h2>' +
            '<p style="color:#475569;margin:0 0 1.25rem;max-width:540px;margin-left:auto;margin-right:auto">' +
                'The complete facilitation guide — including all expandable sections, ' +
                'scripts, interventions, and best practices — is available exclusively ' +
                'to Teams package holders.' +
            '</p>' +
            '<div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">' +
                '<a href="/team.html#pricing" style="background:#4F46E5;color:#fff;border-radius:8px;' +
                    'padding:.65rem 1.5rem;font-weight:700;text-decoration:none;font-size:.95rem">' +
                    '🚀 Unlock Full Guide</a>' +
                '<a href="/team.html" style="background:#fff;color:#1e293b;border:1px solid #cbd5e1;' +
                    'border-radius:8px;padding:.65rem 1.5rem;font-weight:600;text-decoration:none;font-size:.95rem">' +
                    'View Packages</a>' +
            '</div>' +
            '<p style="margin-top:1.25rem;font-size:.82rem;color:#64748b">Preview: Headers and section names are visible below. Full content unlocks after purchase.</p>';

        content.insertBefore(gate, content.firstChild);

        // Mark expandable bodies as gated (prevent them expanding to show content)
        document.querySelectorAll('.tf-expandable__body').forEach(function (el) {
            el.setAttribute('data-gated', 'true');
            el.hidden = true;
        });
        document.querySelectorAll('.tf-expandable__trigger').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var bodyId = btn.getAttribute('aria-controls');
                var body   = bodyId ? document.getElementById(bodyId) : null;
                if (body && body.getAttribute('data-gated')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    window.location.href = '/team.html#pricing';
                }
            }, true);
        });
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

        if (grid) {
            var gate = document.createElement('div');
            gate.id = 'ta-access-gate';
            gate.style.cssText = [
                'background:#eff6ff', 'border:2px solid #3b82f6', 'border-radius:12px',
                'padding:2rem 1.5rem', 'margin:0 0 2rem', 'text-align:center',
            ].join(';');
            gate.innerHTML =
                '<div style="font-size:2rem;margin-bottom:.5rem">🔒</div>' +
                '<h2 style="color:#1e40af;margin:0 0 .4rem;font-size:1.1rem">Full Activity Guides — Teams Access Required</h2>' +
                '<p style="color:#475569;margin:0 0 1rem;font-size:.9rem">Step-by-step instructions, facilitation tips, and reflection prompts are available to Teams package holders.</p>' +
                '<a href="/team.html#pricing" style="display:inline-block;background:#4F46E5;color:#fff;' +
                    'border-radius:8px;padding:.55rem 1.25rem;font-weight:700;text-decoration:none;font-size:.9rem">' +
                    '🚀 Unlock Full Guides</a>';
            grid.insertBefore(gate, grid.firstChild);
        }

        // Intercept "View Details" toggle clicks and redirect to purchase
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.ta-card__toggle');
            if (btn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.confirm('Full activity facilitation guides require a Teams package. View Teams packages?')) {
                    window.location.href = '/team.html#pricing';
                }
            }
        }, true);
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
        // Quick optimistic check via local tier (avoids flash of gated state for valid users)
        var localTier = window.PaymentGating
            ? PaymentGating.getTier()
            : (localStorage.getItem('resilience_tier') || 'free');
        var localAccess = (localTier === 'starter' || localTier === 'pro' || localTier === 'enterprise');

        if (localAccess) {
            // Optimistically unlock immediately, then verify in background
            applyAccessState(true);
        }

        // Always verify with the backend for security
        verifyAccess().then(function (result) {
            accessState.tier = result.tier;
            if (result.valid !== localAccess) {
                // Server result differs — apply authoritative result
                applyAccessState(result.valid);
                if (result.valid && window.PaymentGating) {
                    PaymentGating.setTier(result.tier);
                } else if (!result.valid && localAccess) {
                    // Local said yes, server said no → reset tier
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
        if (e.detail && (e.detail.tier === 'starter' || e.detail.tier === 'pro' || e.detail.tier === 'enterprise')) {
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
