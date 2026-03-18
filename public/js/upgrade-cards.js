/* global PaymentGating */
'use strict';

/**
 * upgrade-cards.js — Upgrade card UI components for Resilience Atlas.
 *
 * Renders tier comparison cards, locked-section overlays, and upgrade prompts.
 * Depends on payment-gating.js being loaded first (for PaymentGating.startCheckout).
 *
 * Pricing is fetched dynamically from /api/payments/tiers on initialisation.
 * Cards display a loading placeholder until prices arrive, then update in place.
 */
(function (window) {

    const ATLAS_NAVIGATOR_FEATURES = [
        'Detailed explanation of all 6 resilience dimensions',
        'Deeper interpretation of your strengths',
        'Personalized narrative analysis',
        'Recommended growth strategies',
        'Expanded micro-practices for each dimension',
        'Downloadable PDF report',
    ];

    const ATLAS_PREMIUM_FEATURES = [
        'Everything in Atlas Navigator',
        'Resilience evolution tracking (historical comparison)',
        'Unlimited reassessments',
        'Personalized growth pathway',
        'Micro-practice progress tracking',
    ];

    /** Human-readable tier titles keyed by tier id. */
    var TIER_TITLES = {
        'atlas-navigator': 'Atlas Navigator',
        'atlas-premium':   'Atlas Premium',
    };

    /** Fallback prices used when the backend is unreachable or fetch is unavailable. */
    var FALLBACK_PRICES = { 'atlas-navigator': '$9.99', 'atlas-premium': '$99' };

    /** Cache of fetched prices: { 'atlas-navigator': '$9.99', 'atlas-premium': '$99' } */
    var _prices = null;

    /**
     * Fetch pricing from the backend and update any rendered price elements.
     * Silently falls back to hardcoded defaults if the request fails.
     */
    function _fetchPrices() {
        return fetch('/api/payments/tiers')
            .then(function (res) {
                if (!res.ok) { throw new Error('HTTP ' + res.status); }
                return res.json();
            })
            .then(function (data) {
                var map = {};
                (data.tiers || []).forEach(function (tier) {
                    var price = Number(tier.price);
                    var formatted = Number.isInteger(price)
                        ? '$' + price
                        : '$' + price.toFixed(2);
                    map[tier.id] = formatted;
                });
                _prices = map;
                _updatePriceElements();
            })
            .catch(function () {
                // Fall back to hardcoded defaults so the UI remains usable.
                _prices = FALLBACK_PRICES;
                _updatePriceElements();
            });
    }

    /**
     * Update all price display elements and button aria-labels already in the
     * DOM once the prices have been loaded.
     */
    function _updatePriceElements() {
        if (!_prices) { return; }
        document.querySelectorAll('[data-price-tier]').forEach(function (el) {
            var tier = el.getAttribute('data-price-tier');
            if (_prices[tier]) {
                el.textContent = _prices[tier];
            }
        });
        document.querySelectorAll('button[data-tier]').forEach(function (btn) {
            var tier = btn.getAttribute('data-tier');
            if (_prices && _prices[tier]) {
                var title = TIER_TITLES[tier] || tier;
                btn.setAttribute('aria-label', 'Unlock ' + title + ' for ' + _prices[tier]);
            }
        });
    }

    /**
     * Render a single upgrade card for the given tier.
     * @param {'atlas-navigator'|'atlas-premium'} tier
     * @returns {string} HTML string
     */
    function renderUpgradeCard(tier) {
        const isNavigator = tier === 'atlas-navigator';
        const title       = TIER_TITLES[tier] || tier;
        const price       = (_prices && _prices[tier]) ? _prices[tier] : '\u2026'; // '…' while loading
        const features    = isNavigator ? ATLAS_NAVIGATOR_FEATURES : ATLAS_PREMIUM_FEATURES;
        const badgeText   = 'One-Time Purchase';
        const badgeClass  = isNavigator ? 'badge-blue' : 'badge-gold';
        const btnLabel    = isNavigator ? 'Unlock Atlas Navigator' : 'Upgrade to Atlas Premium';
        const description = isNavigator
            ? 'Go deeper into your resilience profile with full dimension analysis and personalized strategies.'
            : 'Track your resilience journey over time and unlock all premium features.';

        return `
            <div class="upgrade-card upgrade-card--${tier}" role="article" aria-labelledby="upgrade-title-${tier}">
                <div class="upgrade-card__header">
                    <span class="upgrade-badge ${badgeClass}">${badgeText}</span>
                    <h3 id="upgrade-title-${tier}" class="upgrade-card__title">${escapeHtml(title)}</h3>
                    <p class="upgrade-card__price" data-price-tier="${escapeHtml(tier)}">${escapeHtml(price)}</p>
                    <p class="upgrade-card__description">${escapeHtml(description)}</p>
                </div>
                <ul class="upgrade-card__features" aria-label="Features included in ${escapeHtml(title)}">
                    ${features.map(f => `<li><span aria-hidden="true">&#10003;</span> ${escapeHtml(f)}</li>`).join('')}
                </ul>
                <button
                    class="btn btn-upgrade"
                    data-tier="${escapeHtml(tier)}"
                    aria-label="Unlock ${escapeHtml(title)} for ${escapeHtml(price)}"
                    onclick="PaymentGating.startCheckout('${escapeHtml(tier)}')"
                >
                    ${escapeHtml(btnLabel)}
                </button>
                <p class="upgrade-card__trust">
                    <img src="/icons/lock.svg" alt="" aria-hidden="true" class="icon icon-xs"> Secure checkout via Stripe &nbsp;|&nbsp; No subscription required
                </p>
            </div>
        `;
    }

    /**
     * Render the full comparison section with both upgrade cards.
     * @returns {string} HTML string
     */
    function renderComparisonCards() {
        return `
            <div class="upgrade-comparison" role="region" aria-label="Upgrade options">
                <h2 class="upgrade-comparison__title">Unlock Your Full Resilience Atlas</h2>
                <p class="upgrade-comparison__subtitle">
                    Your free report gives you a powerful starting point.
                    Go deeper to transform your resilience journey.
                </p>
                <div class="upgrade-cards-grid">
                    ${renderUpgradeCard('atlas-navigator')}
                    ${renderUpgradeCard('atlas-premium')}
                </div>
                <p class="upgrade-comparison__disclaimer">
                    For educational and self-reflection purposes only. Not a clinical diagnosis.
                </p>
            </div>
        `;
    }

    /**
     * Render a small locked-overlay element to inject into premium sections.
     * @param {'atlas-navigator'|'atlas-premium'} tier
     * @returns {string} HTML string
     */
    function renderLockedOverlay(tier) {
        const label = tier === 'atlas-premium' ? 'Atlas Premium' : 'Atlas Navigator';
        return `
            <div class="payment-overlay" role="region" aria-label="Premium content — locked">
                <div class="payment-overlay__inner">
                    <span class="payment-overlay__icon" aria-hidden="true"><img src="/icons/lock.svg" alt="" class="icon icon-md"></span>
                    <p class="payment-overlay__message">
                        Unlock with <strong>${escapeHtml(label)}</strong>
                    </p>
                    <button
                        class="btn btn-upgrade btn-sm"
                        onclick="PaymentGating.startCheckout('${escapeHtml(tier)}')"
                        aria-label="Unlock ${escapeHtml(label)}"
                    >
                        Unlock Now
                    </button>
                </div>
            </div>
        `;
    }

    /** Simple HTML escaper used for inline attribute/content values. */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Kick off the price fetch immediately so prices are ready by the time the
    // results page renders the upgrade cards (or update them if already rendered).
    // If fetch is unavailable, apply fallback prices immediately.
    if (typeof window.fetch === 'function') {
        _fetchPrices();
    } else {
        _prices = FALLBACK_PRICES;
    }

    window.UpgradeCards = {
        renderUpgradeCard,
        renderComparisonCards,
        renderLockedOverlay,
    };

})(window);
