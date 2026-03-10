/* global PaymentGating */
'use strict';

/**
 * upgrade-cards.js — Upgrade card UI components for Resilience Atlas.
 *
 * Renders tier comparison cards, locked-section overlays, and upgrade prompts.
 * Depends on payment-gating.js being loaded first (for PaymentGating.startCheckout).
 */
(function (window) {

    const DEEP_REPORT_FEATURES = [
        'Detailed explanation of all 6 resilience dimensions',
        'Deeper interpretation of your strengths',
        'Personalized narrative analysis',
        'Recommended growth strategies',
        'Expanded micro-practices for each dimension',
        'Downloadable PDF report',
    ];

    const ATLAS_PREMIUM_FEATURES = [
        'Everything in Deep Report',
        'Resilience evolution tracking (historical comparison)',
        'Historical assessment comparison',
        'Unlimited reassessments',
        'Personalized growth pathway',
        'Micro-practice progress tracking',
    ];

    /**
     * Render a single upgrade card for the given tier.
     * @param {'deep-report'|'atlas-premium'} tier
     * @returns {string} HTML string
     */
    function renderUpgradeCard(tier) {
        const isDeep = tier === 'deep-report';
        const title       = isDeep ? 'Deep Resilience Report' : 'Atlas Premium';
        const price       = isDeep ? '$14' : '$49';
        const features    = isDeep ? DEEP_REPORT_FEATURES : ATLAS_PREMIUM_FEATURES;
        const badgeText   = isDeep ? 'One-Time Purchase' : 'Lifetime Access';
        const badgeClass  = isDeep ? 'badge-blue' : 'badge-gold';
        const btnLabel    = isDeep ? 'Unlock Deep Report' : 'Upgrade to Atlas Premium';
        const description = isDeep
            ? 'Go deeper into your resilience profile with full dimension analysis and personalized strategies.'
            : 'Track your resilience journey over time and unlock all premium features.';

        return `
            <div class="upgrade-card upgrade-card--${tier}" role="article" aria-labelledby="upgrade-title-${tier}">
                <div class="upgrade-card__header">
                    <span class="upgrade-badge ${badgeClass}">${badgeText}</span>
                    <h3 id="upgrade-title-${tier}" class="upgrade-card__title">${escapeHtml(title)}</h3>
                    <p class="upgrade-card__price">${escapeHtml(price)}</p>
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
                    <span aria-hidden="true">&#128274;</span> Secure checkout via Stripe &nbsp;|&nbsp; No subscription required
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
                    ${renderUpgradeCard('deep-report')}
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
     * @param {'deep-report'|'atlas-premium'} tier
     * @returns {string} HTML string
     */
    function renderLockedOverlay(tier) {
        const label = tier === 'atlas-premium' ? 'Atlas Premium' : 'Deep Report';
        return `
            <div class="payment-overlay" role="region" aria-label="Premium content — locked">
                <div class="payment-overlay__inner">
                    <span class="payment-overlay__icon" aria-hidden="true">&#128274;</span>
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

    window.UpgradeCards = {
        renderUpgradeCard,
        renderComparisonCards,
        renderLockedOverlay,
    };

})(window);
