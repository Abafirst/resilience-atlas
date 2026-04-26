# IATLAS Stripe Setup Guide

## Step 1: Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **+ Add Product**

For each IATLAS tier, create the following:

### IATLAS Individual
- **Name:** `IATLAS Individual`
- **Description:** `1 child profile — All kids games & activities, IATLAS curriculum, progress tracking`
- **Pricing:** Recurring → $19.99 USD / month
- Copy the **Price ID** (starts with `price_`)

### IATLAS Family *(Recommended)*
- **Name:** `IATLAS Family`
- **Description:** `Up to 5 child profiles — Everything in Individual + caregiver resources, shared dashboard`
- **Pricing:** Recurring → $39.99 USD / month
- Copy the **Price ID**

### IATLAS Complete
- **Name:** `IATLAS Complete`
- **Description:** `Full curriculum access — Everything in Family + advanced analytics, priority support`
- **Pricing:** Recurring → $99.99 USD / month
- Copy the **Price ID**

### IATLAS Practitioner
- **Name:** `IATLAS Practitioner`
- **Description:** `Individual practice — Clinical assessments, ABA protocols, progress reports`
- **Pricing:** Recurring → $149.00 USD / month
- Copy the **Price ID**

### IATLAS Practice
- **Name:** `IATLAS Practice`
- **Description:** `Group practice — Everything in Practitioner + multi-practitioner access, team dashboard`
- **Pricing:** Recurring → $399.00 USD / month
- Copy the **Price ID**

> **Enterprise:** No Stripe product needed — Enterprise is a custom quote. Direct users to Contact Sales.

---

## Step 2: Add Price IDs to Railway Variables

1. Go to your Railway project → Backend service → **Variables**
2. Add each Price ID:

```
STRIPE_IATLAS_INDIVIDUAL_PRICE_ID=price_xxx
STRIPE_IATLAS_FAMILY_PRICE_ID=price_xxx
STRIPE_IATLAS_COMPLETE_PRICE_ID=price_xxx
STRIPE_IATLAS_PRACTITIONER_PRICE_ID=price_xxx
STRIPE_IATLAS_PRACTICE_PRICE_ID=price_xxx
```

3. Redeploy the service

---

## Step 3: Configure Webhook

The existing webhook at `/api/payments/webhook` automatically handles IATLAS subscription events.

Ensure these events are enabled in [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

| Event | Purpose |
|-------|---------|
| `customer.subscription.created` | Record new subscription |
| `customer.subscription.updated` | Update tier / status changes |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.payment_succeeded` | Log successful renewal payments |
| `invoice.payment_failed` | Log failed payment attempts |
| `checkout.session.completed` | (existing) Handle one-time and subscription checkouts |

---

## Step 4: MongoDB Collections

The webhook handler automatically creates these collections:

### `iatlas_subscriptions`
Tracks active IATLAS subscriptions:

```js
{
  userId: String,             // Auth0 sub or legacy userId
  tier: String,               // 'individual' | 'family' | 'complete' | 'practitioner' | 'practice'
  status: String,             // 'active' | 'trialing' | 'canceled' | 'past_due'
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  createdAt: Date,
  updatedAt: Date,
  canceledAt: Date,           // set when status becomes 'canceled'
}
```

### `iatlas_payments`
Logs individual invoice payments:

```js
{
  stripeInvoiceId: String,
  stripeSubscriptionId: String,
  amount: Number,             // in dollars
  currency: String,
  status: String,             // 'paid' | 'failed'
  paidAt: Date,               // set for successful payments
  failedAt: Date,             // set for failed payments
  createdAt: Date,
}
```

---

## Step 5: Testing

### Use Stripe Test Mode

1. Switch the Stripe Dashboard to **Test Mode**
2. Create test products with the same names and pricing
3. Add test Price IDs to your local `.env` (or Railway staging variables)

### Test Card Numbers

| Card | Scenario |
|------|---------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

Use any future expiry date and any 3-digit CVC.

### Test Subscription Flow

1. Click an **Unlock** button in the IATLAS Kids or Curriculum page
2. Select a tier in the modal and click **Subscribe**
3. Complete checkout with a test card
4. Verify redirect to `/iatlas?upgrade_success=true`
5. Confirm the tier is updated in `localStorage` under the `iatlas_tier` key
6. Verify the `iatlas_subscriptions` collection in MongoDB

### Test Webhook Events

Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward events locally:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Then trigger test events:

```bash
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```
