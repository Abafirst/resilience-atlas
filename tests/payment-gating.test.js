/**
 * @jest-environment jsdom
 */
'use strict';

/**
 * Tests for public/js/payment-gating.js
 *
 * Verifies the tier-hierarchy logic in applyGating():
 *  - free             → no sections unlocked
 *  - atlas-navigator  → atlas-navigator AND atlas-premium sections unlocked
 *  - atlas-premium    → atlas-navigator AND atlas-premium sections unlocked
 *  - business         → all sections (atlas-navigator, atlas-premium, business) unlocked
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Load payment-gating.js into the current jsdom window.
 * Called after setting up localStorage so the script sees the right tier.
 */
function loadGatingScript() {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../public/js/payment-gating.js'),
        'utf8'
    );
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', 'localStorage', src)(
        window, document, localStorage
    );
}

/**
 * Build a minimal DOM with gated sections and return references to them.
 */
function buildDOM() {
    document.body.innerHTML = `
        <section id="s-deep"    class="locked" data-tier="atlas-navigator">
            <div class="payment-overlay"></div>
        </section>
        <section id="s-atlas"   class="locked" data-tier="atlas-premium">
            <div class="payment-overlay"></div>
        </section>
        <section id="s-biz"     class="locked" data-tier="business">
            <div class="payment-overlay"></div>
        </section>
        <a class="business-dashboard-link" hidden>Team Dashboard</a>
    `;

    return {
        deepSection:   document.getElementById('s-deep'),
        atlasSection:  document.getElementById('s-atlas'),
        bizSection:    document.getElementById('s-biz'),
        dashboardLink: document.querySelector('.business-dashboard-link'),
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
    // Reset localStorage and DOM before each test.
    localStorage.clear();
    document.body.innerHTML = '';

    // Remove any previously attached PaymentGating from window.
    delete window.PaymentGating;
});

describe('applyGating() tier hierarchy', () => {
    test('free tier: all sections remain locked', () => {
        localStorage.setItem('resilience_tier', 'free');
        loadGatingScript();
        const { deepSection, atlasSection, bizSection } = buildDOM();

        window.PaymentGating.applyGating();

        expect(deepSection.classList.contains('locked')).toBe(true);
        expect(atlasSection.classList.contains('locked')).toBe(true);
        expect(bizSection.classList.contains('locked')).toBe(true);
    });

    test('atlas-navigator tier: atlas-navigator AND atlas-premium sections unlocked; business still locked', () => {
        localStorage.setItem('resilience_tier', 'atlas-navigator');
        loadGatingScript();
        const { deepSection, atlasSection, bizSection } = buildDOM();

        window.PaymentGating.applyGating();

        expect(deepSection.classList.contains('locked')).toBe(false);
        expect(atlasSection.classList.contains('locked')).toBe(false);
        expect(bizSection.classList.contains('locked')).toBe(true);
    });

    test('atlas-premium tier: atlas-navigator AND atlas-premium sections unlocked; business still locked', () => {
        localStorage.setItem('resilience_tier', 'atlas-premium');
        loadGatingScript();
        const { deepSection, atlasSection, bizSection } = buildDOM();

        window.PaymentGating.applyGating();

        expect(deepSection.classList.contains('locked')).toBe(false);
        expect(atlasSection.classList.contains('locked')).toBe(false);
        expect(bizSection.classList.contains('locked')).toBe(true);
    });

    test('business tier: all sections unlocked', () => {
        localStorage.setItem('resilience_tier', 'business');
        loadGatingScript();
        const { deepSection, atlasSection, bizSection } = buildDOM();

        window.PaymentGating.applyGating();

        expect(deepSection.classList.contains('locked')).toBe(false);
        expect(atlasSection.classList.contains('locked')).toBe(false);
        expect(bizSection.classList.contains('locked')).toBe(false);
    });

    test('atlas-navigator tier: payment overlays hidden for unlocked sections', () => {
        localStorage.setItem('resilience_tier', 'atlas-navigator');
        loadGatingScript();
        const { deepSection, atlasSection, bizSection } = buildDOM();

        window.PaymentGating.applyGating();

        const deepOverlay  = deepSection.querySelector('.payment-overlay');
        const atlasOverlay = atlasSection.querySelector('.payment-overlay');
        const bizOverlay   = bizSection.querySelector('.payment-overlay');

        expect(deepOverlay.hidden).toBe(true);
        expect(atlasOverlay.hidden).toBe(true);
        expect(bizOverlay.hidden).toBe(false);
    });

    test('business dashboard link shown only for business tier', () => {
        localStorage.setItem('resilience_tier', 'atlas-navigator');
        loadGatingScript();
        const { dashboardLink } = buildDOM();

        window.PaymentGating.applyGating();
        expect(dashboardLink.hidden).toBe(true);

        localStorage.setItem('resilience_tier', 'business');
        window.PaymentGating.applyGating();
        expect(dashboardLink.hidden).toBe(false);
    });
});

describe('tier helper functions', () => {
    test('isDeepReport() returns true for atlas-navigator, atlas-premium, and business', () => {
        loadGatingScript();

        ['atlas-navigator', 'atlas-premium', 'business'].forEach(tier => {
            localStorage.setItem('resilience_tier', tier);
            expect(window.PaymentGating.isDeepReport()).toBe(true);
        });

        localStorage.setItem('resilience_tier', 'free');
        expect(window.PaymentGating.isDeepReport()).toBe(false);
    });

    test('isAtlasPremium() returns true only for atlas-premium and business', () => {
        loadGatingScript();

        localStorage.setItem('resilience_tier', 'atlas-premium');
        expect(window.PaymentGating.isAtlasPremium()).toBe(true);

        localStorage.setItem('resilience_tier', 'business');
        expect(window.PaymentGating.isAtlasPremium()).toBe(true);

        localStorage.setItem('resilience_tier', 'atlas-navigator');
        expect(window.PaymentGating.isAtlasPremium()).toBe(false);

        localStorage.setItem('resilience_tier', 'free');
        expect(window.PaymentGating.isAtlasPremium()).toBe(false);
    });

    test('isBusiness() returns true only for business tier', () => {
        loadGatingScript();

        localStorage.setItem('resilience_tier', 'business');
        expect(window.PaymentGating.isBusiness()).toBe(true);

        ['atlas-navigator', 'atlas-premium', 'free'].forEach(tier => {
            localStorage.setItem('resilience_tier', tier);
            expect(window.PaymentGating.isBusiness()).toBe(false);
        });
    });
});
