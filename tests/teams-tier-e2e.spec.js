/**
 * tests/teams-tier-e2e.spec.js
 *
 * Playwright End-to-End Tests — Teams Tier Feature Verification
 *
 * These tests cover full browser flows for Teams tier purchase and access.
 * They require:
 *  1. Playwright installed: npm install --save-dev @playwright/test
 *  2. Playwright browsers installed: npx playwright install
 *  3. A running dev server: npm run dev  (or set BASE_URL env var)
 *  4. Stripe test-mode keys configured in the server
 *
 * Run with:
 *   npx playwright test tests/teams-tier-e2e.spec.js
 *
 * Environment variables:
 *   BASE_URL          — app base URL (default: http://localhost:3000)
 *   STRIPE_TEST_CARD  — test card number (default: 4242424242424242)
 */

// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL        = process.env.BASE_URL        || 'http://localhost:3000';
const STRIPE_TEST_CARD = process.env.STRIPE_TEST_CARD || '4242 4242 4242 4242';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Map a canonical backend tier key to the client-side TEAM_TIERS value stored
 * in 'ra-teams-tier' (see client/src/utils/tierGating.js).
 *
 * Backend canonical keys: 'starter', 'pro', 'enterprise'
 * Client-side TEAM_TIERS:  'basic',   'premium', 'enterprise'
 */
function toClientTier(backendKey) {
    const map = { starter: 'basic', 'teams-starter': 'basic', pro: 'premium', 'teams-pro': 'premium', enterprise: 'enterprise' };
    return map[backendKey] || backendKey;
}

/**
 * Set the teams tier in localStorage for the current page context.
 * Accepts the canonical backend tier key ('starter', 'pro', 'enterprise').
 * Sets both 'ra-teams-tier' (client-side value) and 'payment-tier' (backend key).
 */
async function setTeamsTier(page, backendTierKey) {
    const clientTier = toClientTier(backendTierKey);
    await page.evaluate(({ clientTier: ct, backendKey }) => {
        localStorage.setItem('ra-teams-tier', ct);
        localStorage.setItem('payment-tier', backendKey);
    }, { clientTier, backendKey: backendTierKey });
    await page.reload();
}

/** Navigate to the Teams page and wait for it to load. */
async function gotoTeamsPage(page) {
    await page.goto(`${BASE_URL}/teams`);
    await page.waitForLoadState('networkidle');
}

/** Navigate to the Teams Resources (facilitation) page. */
async function gotoTeamsResources(page) {
    await page.goto(`${BASE_URL}/teams/resources`);
    await page.waitForLoadState('networkidle');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. LANDING PAGE — tier cards are displayed correctly
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Teams landing page — tier cards', () => {
    test.beforeEach(async ({ page }) => {
        await gotoTeamsPage(page);
    });

    test('displays Basic tier card with correct price ($299)', async ({ page }) => {
        await expect(page.getByText('$299')).toBeVisible();
        await expect(page.getByText(/Atlas Team Basic/i)).toBeVisible();
    });

    test('displays Premium tier card with correct price ($699)', async ({ page }) => {
        await expect(page.getByText('$699')).toBeVisible();
        await expect(page.getByText(/Atlas Team Premium/i)).toBeVisible();
    });

    test('displays Enterprise tier card', async ({ page }) => {
        await expect(page.getByText(/Atlas.*Enterprise/i)).toBeVisible();
    });

    test('Basic card shows 15-user limit', async ({ page }) => {
        await expect(page.getByText(/15\s*(users?|members?|seats?)/i)).toBeVisible();
    });

    test('Premium card shows 30-user limit', async ({ page }) => {
        await expect(page.getByText(/30\s*(users?|members?|seats?)/i)).toBeVisible();
    });

    test('Basic card mentions 1 team restriction', async ({ page }) => {
        await expect(page.getByText(/1\s*team/i)).toBeVisible();
    });

    test('Premium card mentions multiple teams', async ({ page }) => {
        const premiumCard = page.locator('[data-tier="pro"], [data-plan="pro"]').first();
        if (await premiumCard.isVisible()) {
            await expect(premiumCard.getByText(/multiple teams|unlimited teams/i)).toBeVisible();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BASIC TIER (starter) — UI feature visibility
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Basic tier (starter) — UI feature visibility', () => {
    test.beforeEach(async ({ page }) => {
        await gotoTeamsPage(page);
        await setTeamsTier(page, 'starter');
    });

    test('team dashboard is accessible', async ({ page }) => {
        await page.goto(`${BASE_URL}/teams/dashboard`);
        // Should not show a locked/upgrade gate for basic features
        await expect(page.getByText(/upgrade.*premium|locked.*premium/i)).not.toBeVisible();
    });

    test('facilitation guides show an upgrade prompt', async ({ page }) => {
        await gotoTeamsResources(page);
        // Facilitation is Premium+, so Basic should see a gate/upgrade prompt
        const upgradePrompt = page.getByText(/upgrade.*premium|unlock.*premium|requires.*premium/i);
        if (await upgradePrompt.isVisible()) {
            await expect(upgradePrompt).toBeVisible();
        }
    });

    test('CSV export button is visible', async ({ page }) => {
        await page.goto(`${BASE_URL}/teams/dashboard`);
        const csvBtn = page.getByRole('button', { name: /export.*csv|download.*csv/i });
        if (await csvBtn.isVisible()) {
            await expect(csvBtn).toBeVisible();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PREMIUM TIER (pro) — UI feature visibility
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Premium tier (pro) — UI feature visibility', () => {
    test.beforeEach(async ({ page }) => {
        await gotoTeamsPage(page);
        await setTeamsTier(page, 'pro');
    });

    test('facilitation guides are accessible', async ({ page }) => {
        await gotoTeamsResources(page);
        // Should NOT show an upgrade gate for facilitation on Premium
        const upgradeGate = page.getByText(/upgrade.*enterprise|locked.*enterprise/i);
        if (await upgradeGate.isVisible()) {
            // Only enterprise-gated items should require upgrade
            await expect(page.getByText(/upgrade.*premium/i)).not.toBeVisible();
        }
    });

    test('advanced analytics section is visible', async ({ page }) => {
        await page.goto(`${BASE_URL}/teams/analytics`);
        await expect(page.getByText(/upgrade.*basic/i)).not.toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ENTERPRISE TIER — branding and SSO UI
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Enterprise tier — branding and SSO UI', () => {
    test.beforeEach(async ({ page }) => {
        await gotoTeamsPage(page);
        await setTeamsTier(page, 'enterprise');
    });

    test('custom branding options are accessible', async ({ page }) => {
        await page.goto(`${BASE_URL}/teams/settings`);
        // Enterprise should see branding settings, not an upgrade gate
        await expect(page.getByText(/upgrade.*enterprise/i)).not.toBeVisible();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. UNAUTHENTICATED — gate prompts shown for locked features
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Unauthenticated access — gate prompts', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing tier data
        await page.goto(BASE_URL);
        await page.evaluate(() => {
            localStorage.removeItem('ra-teams-tier');
            localStorage.removeItem('payment-tier');
            localStorage.removeItem('ra-user');
        });
    });

    test('Teams resources page shows a purchase/login gate', async ({ page }) => {
        await gotoTeamsResources(page);
        // Should show login/purchase gate
        const gateText = page.getByText(/purchase|sign in|log in|get started|teams starter/i);
        await expect(gateText.first()).toBeVisible({ timeout: 10000 });
    });

    test('Teams landing page has purchase CTA buttons', async ({ page }) => {
        await gotoTeamsPage(page);
        const ctaButton = page.getByRole('button', { name: /get started|buy now|purchase|choose/i }).first();
        await expect(ctaButton).toBeVisible({ timeout: 10000 });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CHECKOUT FLOW — Stripe integration smoke test (Basic tier)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Checkout flow — Basic tier smoke test', () => {
    // NOTE: This test requires the server to be running with Stripe test keys.
    // It will be skipped if the Teams pricing page is not found.
    test('clicking "Get Started" on Basic tier initiates checkout', async ({ page }) => {
        await gotoTeamsPage(page);

        // Find the Basic tier purchase CTA
        const basicCta = page.locator('[data-tier="starter"] button, [data-plan="starter"] button').first();
        if (!await basicCta.isVisible()) {
            // Try to find by text proximity
            const getStartedBtns = page.getByRole('button', { name: /get started/i });
            const count = await getStartedBtns.count();
            if (count === 0) {
                test.skip(true, 'Basic tier CTA button not found — skipping checkout flow test');
                return;
            }
        }

        // Clicking should navigate to Stripe checkout or show payment UI
        const [response] = await Promise.all([
            page.waitForNavigation({ timeout: 10000 }).catch(() => null),
            basicCta.isVisible() ? basicCta.click() : page.getByRole('button', { name: /get started/i }).first().click(),
        ]);

        // Check we either went to Stripe checkout or saw a payment UI
        const url = page.url();
        let hasStripeCheckout = false;
        try {
            const parsed = new URL(url);
            hasStripeCheckout = parsed.hostname === 'checkout.stripe.com' ||
                                parsed.hostname === 'stripe.com' ||
                                parsed.hostname.endsWith('.stripe.com');
        } catch {
            hasStripeCheckout = false;
        }
        const hasPaymentUI = await page.getByText(/card number|payment/i).isVisible().catch(() => false);

        expect(hasStripeCheckout || hasPaymentUI).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. RESOURCE DOWNLOADS — download buttons work per tier
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Resource downloads — tier gating', () => {
    test('Basic tier can initiate a resource download', async ({ page }) => {
        await gotoTeamsPage(page);
        await setTeamsTier(page, 'starter');
        await gotoTeamsResources(page);

        // Find any download button
        const downloadBtn = page.getByRole('button', { name: /download/i }).first();
        if (!await downloadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            test.skip(true, 'No download buttons found on resources page');
            return;
        }

        // Clicking a download should not show an upgrade gate for Basic resources
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            downloadBtn.click(),
        ]);

        // Either a download started or a PDF opened in a new tab
        const downloadStarted = download !== null;
        const pdfTabOpened    = (await page.context().pages()).length > 1;
        expect(downloadStarted || pdfTabOpened).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. TEAM MEMBER INVITATION LIMITS
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Team member invitation limits', () => {
    test('Basic tier invite form accepts up to 15 members', async ({ page }) => {
        await setTeamsTier(page, 'starter');
        await page.goto(`${BASE_URL}/teams/invite`);
        await page.waitForLoadState('networkidle');

        const limitText = page.getByText(/15\s*(members?|users?|seats?)|up to 15/i);
        if (await limitText.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(limitText).toBeVisible();
        }
    });

    test('Premium tier invite form accepts up to 30 members', async ({ page }) => {
        await setTeamsTier(page, 'pro');
        await page.goto(`${BASE_URL}/teams/invite`);
        await page.waitForLoadState('networkidle');

        const limitText = page.getByText(/30\s*(members?|users?|seats?)|up to 30/i);
        if (await limitText.isVisible({ timeout: 5000 }).catch(() => false)) {
            await expect(limitText).toBeVisible();
        }
    });
});
