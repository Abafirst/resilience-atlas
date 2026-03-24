/**
 * @jest-environment jsdom
 */
'use strict';

/**
 * Tests for public/js/upsell-system.js
 *
 * Covers:
 *  - Session ID and variant assignment
 *  - A/B variant copy selection
 *  - Cool-down enforcement
 *  - Modal injection and dismiss behaviour
 *  - Premium badge rendering
 *  - Feature lock overlay attachment
 *  - Promotional banner injection
 *  - Tracking (fire-and-forget fetch)
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadUpsellScript() {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../public/js/upsell-system.js'),
        'utf8'
    );
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', 'localStorage', 'navigator', src)(
        window, document, localStorage, navigator
    );
}

// Minimal PaymentGating stub
function stubPaymentGating(tier) {
    window.PaymentGating = {
        getTier:        () => tier,
        isDeepReport:   () => ['atlas-navigator', 'atlas-premium', 'business', 'starter', 'pro', 'enterprise'].includes(tier),
        isAtlasPremium: () => ['atlas-premium', 'business', 'starter', 'pro', 'enterprise'].includes(tier),
        startCheckout:  jest.fn(),
    };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    delete window.UpsellSystem;
    delete window.PaymentGating;

    // Mock fetch so tracking calls don't throw.
    global.fetch = jest.fn().mockResolvedValue({ json: jest.fn() });

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
        observe:    jest.fn(),
        disconnect: jest.fn(),
    }));
});

afterEach(() => {
    jest.clearAllMocks();
});

// ── Session ID ────────────────────────────────────────────────────────────────

describe('UpsellSystem.getSessionId()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('returns a stable session ID', () => {
        const id1 = window.UpsellSystem.getSessionId();
        const id2 = window.UpsellSystem.getSessionId();
        expect(id1).toBe(id2);
        expect(id1).toMatch(/^sess_/);
    });

    test('persists across page loads (localStorage)', () => {
        const id1 = window.UpsellSystem.getSessionId();
        // Re-load the script to simulate a new page load.
        loadUpsellScript();
        const id2 = window.UpsellSystem.getSessionId();
        expect(id1).toBe(id2);
    });
});

// ── A/B variant ───────────────────────────────────────────────────────────────

describe('UpsellSystem.getVariant()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('returns one of the valid variants', () => {
        const variant = window.UpsellSystem.getVariant();
        expect(['control', 'variant_a', 'variant_b', 'variant_c']).toContain(variant);
    });

    test('is stable across multiple calls', () => {
        const v1 = window.UpsellSystem.getVariant();
        const v2 = window.UpsellSystem.getVariant();
        expect(v1).toBe(v2);
    });
});

// ── Modal rendering ───────────────────────────────────────────────────────────

describe('UpsellSystem.showModal()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('injects modal backdrop into the DOM', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        expect(document.getElementById('upsell-modal-backdrop')).not.toBeNull();
    });

    test('does not show modal if user already owns the tier', () => {
        stubPaymentGating('atlas-navigator');
        // Reload so the PaymentGating stub is picked up correctly.
        loadUpsellScript();
        window.UpsellSystem.showModal('atlas-navigator', 'manual');
        expect(document.getElementById('upsell-modal-backdrop')).toBeNull();
    });

    test('respects cool-down period', () => {
        // Set cooldown to now (simulates a recent dismiss).
        localStorage.setItem('upsell_cooldown', String(Date.now()));
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        expect(document.getElementById('upsell-modal-backdrop')).toBeNull();
    });

    test('CTA button triggers PaymentGating.startCheckout', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        const cta = document.getElementById('upsell-cta');
        cta.click();
        expect(window.PaymentGating.startCheckout).toHaveBeenCalledWith('atlas-navigator');
    });

    test('dismiss button removes modal', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        document.getElementById('upsell-modal-dismiss').click();
        expect(document.getElementById('upsell-modal-backdrop')).toBeNull();
    });

    test('"Maybe later" button removes modal', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        document.getElementById('upsell-maybe-later').click();
        expect(document.getElementById('upsell-modal-backdrop')).toBeNull();
    });

    test('dismiss sets cool-down in localStorage', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        document.getElementById('upsell-modal-dismiss').click();
        expect(localStorage.getItem('upsell_cooldown')).not.toBeNull();
    });

    test('tracks impression event via fetch', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/upsell/event',
            expect.objectContaining({ method: 'POST' })
        );
    });

    test('tracks click event on CTA', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        document.getElementById('upsell-cta').click();
        // fetch called at least twice: impression + click
        expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(2);
        const bodies = global.fetch.mock.calls.map(([, opts]) => JSON.parse(opts.body));
        expect(bodies.some((b) => b.eventType === 'click')).toBe(true);
    });

    test('tracks dismiss event', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        document.getElementById('upsell-maybe-later').click();
        const bodies = global.fetch.mock.calls.map(([, opts]) => JSON.parse(opts.body));
        expect(bodies.some((b) => b.eventType === 'dismiss')).toBe(true);
    });

    test('shows atlas-premium modal for atlas-premium target', () => {
        window.UpsellSystem.showModal('atlas-premium', 'comparison_attempt');
        const backdrop = document.getElementById('upsell-modal-backdrop');
        expect(backdrop).not.toBeNull();
        expect(backdrop.innerHTML).toContain('atlas-premium');
    });

    test('removes any existing modal before showing a new one', () => {
        window.UpsellSystem.showModal('atlas-navigator', 'assessment_complete');
        window.UpsellSystem.showModal('atlas-navigator', 'timer');
        const modals = document.querySelectorAll('#upsell-modal-backdrop');
        expect(modals.length).toBe(1);
    });
});

// ── Promotional banner ────────────────────────────────────────────────────────

describe('UpsellSystem.showBanner()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('injects banner into the DOM', () => {
        window.UpsellSystem.showBanner({
            message:    '🎉 Special offer today!',
            ctaLabel:   'Get it now',
            targetTier: 'atlas-navigator',
        });
        expect(document.getElementById('upsell-promo-banner')).not.toBeNull();
    });

    test('does not show banner to atlas-premium users', () => {
        stubPaymentGating('atlas-premium');
        loadUpsellScript();
        window.UpsellSystem.showBanner({
            message:    'Upgrade today',
            ctaLabel:   'Go Premium',
            targetTier: 'atlas-premium',
        });
        expect(document.getElementById('upsell-promo-banner')).toBeNull();
    });

    test('close button removes banner', () => {
        window.UpsellSystem.showBanner({
            message:    'Special offer',
            ctaLabel:   'Claim',
            targetTier: 'atlas-navigator',
        });
        document.querySelector('.upsell-promo-banner__close').click();
        expect(document.getElementById('upsell-promo-banner')).toBeNull();
    });

    test('does not duplicate banner', () => {
        const opts = { message: 'Offer', ctaLabel: 'Claim', targetTier: 'atlas-navigator' };
        window.UpsellSystem.showBanner(opts);
        window.UpsellSystem.showBanner(opts);
        expect(document.querySelectorAll('#upsell-promo-banner').length).toBe(1);
    });
});

// ── Premium badge ─────────────────────────────────────────────────────────────

describe('UpsellSystem.renderPremiumBadge()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('renders badge HTML string', () => {
        const html = window.UpsellSystem.renderPremiumBadge('atlas-navigator');
        expect(html).toContain('upsell-premium-badge');
        expect(html).toContain('Deep Report');
    });

    test('renders atlas-premium badge', () => {
        const html = window.UpsellSystem.renderPremiumBadge('atlas-premium');
        expect(html).toContain('Atlas Premium');
        expect(html).toContain('atlas-premium');
    });

    test('renders generic premium badge', () => {
        const html = window.UpsellSystem.renderPremiumBadge('premium');
        expect(html).toContain('Premium');
    });
});

// ── Feature lock overlay ──────────────────────────────────────────────────────

describe('UpsellSystem.attachFeatureLock()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('adds locked class to element', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        window.UpsellSystem.attachFeatureLock(el, 'atlas-navigator', 'PDF Download');
        expect(el.classList.contains('upsell-feature-locked')).toBe(true);
    });

    test('injects lock overlay into element', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        window.UpsellSystem.attachFeatureLock(el, 'atlas-navigator', 'PDF Download');
        expect(el.querySelector('.upsell-feature-lock-overlay')).not.toBeNull();
    });

    test('overlay shows correct feature label', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        window.UpsellSystem.attachFeatureLock(el, 'atlas-premium', 'Growth Tracking');
        expect(el.innerHTML).toContain('Growth Tracking');
    });

    test('does nothing when element is null', () => {
        expect(() => window.UpsellSystem.attachFeatureLock(null, 'atlas-navigator', 'X')).not.toThrow();
    });
});

// ── isOfferActive ─────────────────────────────────────────────────────────────

describe('UpsellSystem.isOfferActive()', () => {
    beforeEach(() => {
        stubPaymentGating('free');
        loadUpsellScript();
    });

    test('returns a boolean', () => {
        const result = window.UpsellSystem.isOfferActive();
        expect(typeof result).toBe('boolean');
    });

    test('returns true within OFFER_EXPIRY_HOURS of first visit', () => {
        localStorage.setItem('first_visit_ts', String(Date.now()));
        loadUpsellScript();
        expect(window.UpsellSystem.isOfferActive()).toBe(true);
    });

    test('returns false when meta tag has past expiry', () => {
        const meta = document.createElement('meta');
        meta.name = 'upsell-offer';
        meta.setAttribute('data-expires', new Date(Date.now() - 1000).toISOString());
        document.head.appendChild(meta);
        loadUpsellScript();
        expect(window.UpsellSystem.isOfferActive()).toBe(false);
    });

    test('returns true when meta tag has future expiry', () => {
        const meta = document.createElement('meta');
        meta.name = 'upsell-offer';
        meta.setAttribute('data-expires', new Date(Date.now() + 60 * 60 * 1000).toISOString());
        document.head.appendChild(meta);
        loadUpsellScript();
        expect(window.UpsellSystem.isOfferActive()).toBe(true);
    });
});
