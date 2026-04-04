# Teams Tier Testing Guide

This guide explains how to run and interpret the automated Teams tier feature tests for Resilience Atlas.

## Overview

The Teams tier testing suite verifies that all advertised features for each pricing plan (Basic, Premium, Enterprise) are correctly implemented and gated across all layers of the application.

### Pricing Tiers Tested

| Tier | Price | Max Users | Max Teams | Key Features |
|------|-------|-----------|-----------|--------------|
| **Atlas Team Basic** (`starter`) | $299 one-time | 15 | 1 | Dashboard, CSV export, basic gamification |
| **Atlas Team Premium** (`pro`) | $699 one-time | 30 | Multiple | + Advanced analytics, facilitation guides, auto-reports |
| **Atlas Enterprise** (`enterprise`) | $2,499+ one-time | Unlimited | Unlimited | + Custom branding, SSO/SAML, data export, webhooks |

---

## Running the Tests

### Quick Start (All Tests)

```bash
# From the project root
./scripts/test-teams-features.sh
```

### Jest Unit Tests Only

```bash
npm test -- tests/teams-tier-verification.test.js
# or
./node_modules/.bin/jest --forceExit tests/teams-tier-verification.test.js
```

### Run Tests for a Specific Tier

```bash
./scripts/test-teams-features.sh --tier=basic
./scripts/test-teams-features.sh --tier=premium
./scripts/test-teams-features.sh --tier=enterprise
```

### Run with an HTML Report

```bash
./scripts/test-teams-features.sh --report
# Report saved to: test-results/teams-tier-report-<timestamp>.html
```

### Verbose Output

```bash
./scripts/test-teams-features.sh --verbose
```

### Full Run (Unit + E2E + HTML Report)

```bash
./scripts/test-teams-features.sh --e2e --report --verbose
```

---

## Test Files

| File | Purpose |
|------|---------|
| `tests/teams-tier-verification.test.js` | Main Jest test suite — 160+ unit/integration tests |
| `tests/teams-tier-e2e.spec.js` | Playwright E2E tests — full browser flows |
| `tests/setup/teams-test-data.js` | Shared test fixtures (mock purchases, orgs, users) |
| `scripts/test-teams-features.sh` | Shell runner — executes all tests and generates reports |

---

## What Is Tested

### 1. Tier Configuration (`TIER_CONFIG`)
- User limits per tier: 15 (Basic), 30 (Premium), Infinity (Enterprise)
- Team limits per tier: 1 (Basic), 999 (Premium), Infinity (Enterprise)
- Pricing: $299 / $699 / $2,499+
- Billing type: `one-time` for all Teams tiers
- Display names and `dataRetention` fields

### 2. Plan Aliases
- `teams-starter` → `starter` (Organization model alias)
- `teams-pro` → `pro` (Organization model alias)
- Both aliases behave identically to their canonical keys in feature checks

### 3. Feature Gate Matrix

| Gate | Basic | Premium | Enterprise |
|------|-------|---------|------------|
| `basic` | ✅ | ✅ | ✅ |
| `advanced` | ❌ | ✅ | ✅ |
| `multi-team` | ❌ | ✅ | ✅ |
| `facilitation` | ❌ | ✅ | ✅ |
| `branding` | ❌ | ❌ | ✅ |
| `webhooks` | ❌ | ❌ | ✅ |
| `sso` | ❌ | ❌ | ✅ |
| `data-export` | ❌ | ❌ | ✅ |

### 4. API Endpoints
- **`GET /api/tiers`** — returns correct limits (Infinity serialised as `null`), no internal gates exposed
- **`GET /api/teams/access`** — verifies purchases via `session_id`, `email`, and Bearer JWT
- **`GET /api/teams/download/:id`** — returns PDF for valid Teams purchasers, 403/401 for others

### 5. Advertised Features
- CSV export is mentioned in Basic features
- Facilitation tools are mentioned in Premium features
- Unlimited users/teams mentioned in Enterprise features
- Custom branding accessible only at Enterprise level

### 6. Tier Hierarchy
- Enterprise has strictly more gates than Premium
- Premium has strictly more gates than Basic
- User limits increase monotonically from Basic → Premium → Enterprise

---

## E2E Tests (Playwright)

E2E tests require additional setup:

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Install browsers
npx playwright install

# Ensure the dev server is running
npm run dev

# Run E2E tests
npx playwright test tests/teams-tier-e2e.spec.js

# Or run via the shell script
./scripts/test-teams-features.sh --e2e
```

### E2E Test Coverage

- Teams landing page: all tier cards displayed with correct prices
- Basic tier: dashboard accessible, facilitation shows upgrade gate
- Premium tier: facilitation accessible, advanced analytics shown
- Enterprise tier: branding/SSO accessible
- Unauthenticated: purchase/login gate shown on resource pages
- Checkout flow: clicking CTA initiates Stripe checkout (smoke test)
- Resource downloads: download buttons work per tier
- Team member invitation limits shown per tier

### Environment Variables for E2E

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | App base URL |
| `STRIPE_TEST_CARD` | `4242 4242 4242 4242` | Stripe test card number |

---

## Interpreting Test Results

### Passing Output

```
✅  All Teams tier tests passed!

  Unit tests:      PASS
  Existing tests:  PASS

  Tests run:       161
  Tests passed:    161
  Tests failed:    0
```

### Failing Output

If a test fails, the output will indicate which tier and feature is broken:

```
❌  Some tests failed

● Feature gate matrix — Premium (pro) › can access "facilitation"

  expect(received).toBe(expected)
  Expected: true
  Received: false
```

This means the `facilitation` gate was removed from the `pro` tier config — check `backend/config/tiers.js`.

---

## CI/CD Integration

The tests run automatically in GitHub Actions:

- **Trigger**: Push or PR to `main`
- **Workflow**: `.github/workflows/teams-tier-tests.yml`
- **Artifacts**: JSON and HTML reports uploaded as `teams-tier-test-results`

To view CI results:
1. Go to the repository on GitHub
2. Click **Actions** → **Teams Tier Tests**
3. Click a run to see the detailed output
4. Download the **teams-tier-test-results** artifact for the HTML report

---

## Adding New Tests

### Adding a New Feature Gate Test

1. Add the gate to `TIER_REQUIRED_GATES` or `TIER_FORBIDDEN_GATES` in `tests/setup/teams-test-data.js`
2. The matrix tests in `teams-tier-verification.test.js` will automatically pick it up

### Adding a New Tier Test

1. Add the new tier to the relevant test data in `tests/setup/teams-test-data.js`
2. Add specific feature assertions in `tests/teams-tier-verification.test.js`
3. Update the feature gate matrix in this document

### Adding an E2E Test

1. Open `tests/teams-tier-e2e.spec.js`
2. Add a new `test.describe` block following the existing pattern
3. Use `setTeamsTier(page, 'basic'|'premium'|'enterprise')` to simulate tier state

---

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
npm install
```

### Jest version compatibility error
```bash
# Check Jest version
./node_modules/.bin/jest --version

# If outdated:
npm install --save-dev jest@latest
```

### E2E tests fail with "browser not found"
```bash
npx playwright install
```

### E2E tests fail with "connection refused"
Ensure the dev server is running:
```bash
npm run dev
# Then in another terminal:
./scripts/test-teams-features.sh --e2e
```

### Individual plan incorrectly granted Teams access
Check `backend/routes/teams-resources.js` — the `TEAMS_TIERS` Set must only contain `starter`, `pro`, and `enterprise`.
