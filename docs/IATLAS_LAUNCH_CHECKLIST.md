# IATLAS Launch Checklist

This checklist covers everything required before and after going live with IATLAS paid tiers.

---

## 1. Stripe Setup

> **Full reference:** See [`docs/IATLAS_STRIPE_SETUP.md`](./IATLAS_STRIPE_SETUP.md)

### Create Tier Products in Stripe Dashboard

- [ ] Create **IATLAS Individual** product — Recurring $19.99 USD/month
- [ ] Create **IATLAS Family** product — Recurring $39.99 USD/month
- [ ] *(Coming Soon)* Create **IATLAS Complete** product — Recurring $99.99 USD/month
- [ ] *(Coming Soon)* Create **IATLAS Practitioner** product — Recurring $149.00 USD/month
- [ ] *(Coming Soon)* Create **IATLAS Practice** product — Recurring $399.00 USD/month
- [ ] *(Coming Soon)* Create **IATLAS Enterprise** product — negotiated offline (no Stripe Price ID needed)

### Webhook Verification

- [ ] Webhook endpoint is configured in Stripe Dashboard:
  `https://your-domain.com/api/iatlas/stripe-webhook`
- [ ] Webhook listens for the following events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] `STRIPE_WEBHOOK_SECRET` environment variable is set (matches the signing secret from Stripe)
- [ ] Test a live webhook delivery from Stripe Dashboard → Developers → Webhooks → Send test webhook

---

## 2. Environment Variables

Set the following in Railway (or your hosting provider's environment config):

### Required for Stripe

| Variable | Example Value | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` | Use `sk_test_…` for staging |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | From Stripe Dashboard → Webhooks |
| `STRIPE_IATLAS_INDIVIDUAL_PRICE_ID` | `price_…` | Price ID from Stripe Dashboard |
| `STRIPE_IATLAS_FAMILY_PRICE_ID` | `price_…` | Price ID from Stripe Dashboard |
| `STRIPE_IATLAS_COMPLETE_PRICE_ID` | `price_…` | Set when Complete tier launches |
| `STRIPE_IATLAS_PRACTITIONER_PRICE_ID` | `price_…` | Set when Practitioner tier launches |
| `STRIPE_IATLAS_PRACTICE_PRICE_ID` | `price_…` | Set when Practice tier launches |

### Required for Auth0

| Variable | Example Value |
|---|---|
| `AUTH0_DOMAIN` | `dev-xxxx.us.auth0.com` |
| `AUTH0_CLIENT_ID` | `…` |
| `AUTH0_AUDIENCE` | `https://api.resilienceatlas.com` |
| `AUTH0_CLIENT_SECRET` | `…` |

### Verification Steps

- [ ] Run `railway variables` (or check Railway Dashboard) to confirm all required variables are set
- [ ] For Stripe keys, verify they are `live` keys in production and `test` keys in staging
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` matches the value shown in Stripe Dashboard

---

## 3. Testing

### End-to-End Checkout — Individual Tier

- [ ] Log in with a test user account
- [ ] Navigate to IATLAS content and click "Unlock" on a kids game
- [ ] Verify the modal shows **Individual** and **Family** plans with a Stripe checkout button
- [ ] Click "Subscribe — Family $39.99/mo" → confirm redirect to Stripe Checkout
- [ ] Complete checkout with Stripe test card `4242 4242 4242 4242`
- [ ] Confirm redirect back to app with `?upgrade_success=true`
- [ ] Verify `localStorage.getItem('iatlas_tier')` equals `'family'`
- [ ] Verify IATLAS content is now accessible

### End-to-End Checkout — Family Tier

- [ ] Repeat the checkout test selecting the **Family** tier directly
- [ ] Confirm up to 5 child profiles can be created

### "Coming Soon" Tiers — Waitlist Button

- [ ] Navigate to the IATLAS unlock modal for **professional** content
- [ ] Verify the primary CTA shows **"Join Waitlist — Practitioner"** (not a Stripe checkout button)
- [ ] Click the "Join Waitlist" button — confirm it opens the default email client
- [ ] Verify the email `To:` field is `support@resilienceatlas.com`
- [ ] Verify the email `Subject:` includes "IATLAS Practitioner Waitlist"
- [ ] Verify the **Coming Soon** badge appears next to the Practitioner, Practice, and Enterprise tier rows
- [ ] For the **kids** variant modal, verify **Complete** shows a "Coming Soon" badge but the **Family** checkout button remains active

### Tier Sync After Login

- [ ] Log out from the app
- [ ] Log back in with a user who holds an active Individual or Family subscription
- [ ] After login redirect, confirm `localStorage.getItem('iatlas_tier')` equals `'individual'` or `'family'`
- [ ] Log in with a user with no subscription — confirm `iatlas_tier` is either absent or `'free'`
- [ ] Simulate a backend error (disable the API temporarily) — confirm login still completes normally

---

## 4. Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables are set in Railway production environment
- [ ] Stripe keys are **live** keys (not test keys)
- [ ] All database migrations have been applied (if any)
- [ ] Build passes locally: `npm run build` in `client/`
- [ ] Backend starts without errors: `node server.js` or `npm start`

### Post-Deployment Verification

- [ ] Visit the production URL and confirm the app loads
- [ ] Open the IATLAS professional unlock modal — verify "Join Waitlist" button is shown
- [ ] Open the IATLAS kids unlock modal — verify Family checkout button is shown
- [ ] Complete a test purchase on production using a real card (then cancel/refund it)
- [ ] Confirm the Stripe webhook fires and the tier is written to the database
- [ ] Log out and log back in — confirm tier syncs correctly from backend

### Rollback Plan

If a critical issue is found after deployment:

1. In Railway Dashboard, click **Deployments → Rollback** to the previous build
2. Or push a hotfix commit and let Railway auto-deploy
3. If Stripe webhook is broken, disable it in Stripe Dashboard → Webhooks until the fix is deployed
4. Monitor Railway logs: `railway logs --tail` for real-time error tracking

---

## 5. Launch Communication

- [ ] Update in-app pricing page to reflect which tiers are live vs. "Coming Soon"
- [ ] Notify waitlist subscribers when Complete / Practitioner / Practice tiers launch
- [ ] Update this checklist when a "Coming Soon" tier goes live:
  - Set `comingSoon: false` in `client/src/utils/iatlasGating.js`
  - Add the Stripe Price ID environment variable
  - Rebuild and deploy
