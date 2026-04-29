# IATLAS Practice Tier — Technical Documentation

## Overview

The IATLAS Practice tier is a multi-practitioner group management product built on top of the existing IATLAS Practitioner tier. It allows clinical group practices to invite multiple practitioners, manage roles, track team analytics, and collaborate on client cases — all gated behind a Stripe subscription.

---

## Architecture

### Backend Models

| Model | File | Description |
|-------|------|-------------|
| `Practice` | `backend/models/Practice.js` | Top-level practice entity (name, plan, seatLimit, seatsUsed, billing) |
| `PracticePractitioner` | `backend/models/PracticePractitioner.js` | Junction table linking users to practices with roles |
| `PractitionerInvitation` | `backend/models/PractitionerInvitation.js` | Pending/accepted/expired invitations |

#### Practice Schema (key fields)

```javascript
{
  name:       String,       // Practice display name
  ownerId:    ObjectId,     // Ref to User
  plan:       String,       // 'practice-5' | 'practice-10' | 'practice-25' | 'custom'
  seatLimit:  Number,       // Max practitioners (5 / 10 / 25 / 0 for unlimited)
  seatsUsed:  Number,       // Current active practitioners
  billing: {
    stripeCustomerId:     String,
    stripeSubscriptionId: String,
    status:               String,   // 'active' | 'trialing' | 'past_due' | 'canceled'
    currentPeriodEnd:     Date,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

#### PracticePractitioner Schema (key fields)

```javascript
{
  practiceId: ObjectId,   // Ref to Practice
  userId:     ObjectId,   // Ref to User
  role:       String,     // 'owner' | 'admin' | 'clinician' | 'therapist' | 'observer'
  status:     String,     // 'active' | 'invited' | 'removed'
  acceptedAt: Date,
}
```

#### PractitionerInvitation Schema (key fields)

```javascript
{
  practiceId:  ObjectId,
  invitedBy:   ObjectId,
  email:       String,
  role:        String,
  token:       String,    // Secure random token in invitation URL
  status:      String,    // 'pending' | 'accepted' | 'expired'
  expiresAt:   Date,      // 7 days from creation
}
```

---

### Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| `subscriptionAuth` | `backend/middleware/subscriptionAuth.js` | Verifies IATLAS subscription tier from JWT claims or DB lookup |
| `practiceAuth` | `backend/middleware/practiceAuth.js` | Verifies user is an active member of the requested practice |

#### subscriptionAuth Usage

```javascript
router.get('/protected-route', subscriptionAuth(['practitioner', 'practice', 'enterprise']), handler);
```

#### practiceAuth Usage

```javascript
router.get('/api/practices/:id/team', practiceAuth(['owner', 'admin', 'clinician']), handler);
```

---

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/practices` | Create a new practice |
| `GET` | `/api/practices/mine` | Get the current user's practice + role |
| `GET` | `/api/practices/:id/practitioners` | List all practitioners in a practice |
| `POST` | `/api/practices/:id/practitioners/invite` | Send an invitation email |
| `PATCH` | `/api/practices/:id/practitioners/:userId` | Change a practitioner's role |
| `DELETE` | `/api/practices/:id/practitioners/:userId` | Remove a practitioner |
| `POST` | `/api/iatlas/subscribe` | Create a Stripe Checkout session |
| `POST` | `/api/iatlas/webhook` | Handle Stripe webhook events |

---

### Stripe Webhooks

The webhook handler at `/api/iatlas/webhook` processes these events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activates subscription; sets `Practice.billing.status = 'active'` |
| `customer.subscription.updated` | Updates subscription status and period end |
| `customer.subscription.deleted` | Sets status to `canceled`; restricts access |
| `invoice.payment_failed` | Sets status to `past_due`; triggers dunning email |

Environment variables required:

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_IATLAS_PRACTICE_5_PRICE_ID
STRIPE_IATLAS_PRACTICE_10_PRICE_ID
STRIPE_IATLAS_PRACTICE_25_PRICE_ID
```

---

## Frontend

### Pages

| Page | Route | Description |
|------|-------|-------------|
| `PracticeSetupPage` | `/iatlas/practice/setup` | 3-step setup wizard |
| `PracticeDashboardPage` | `/iatlas/practice/dashboard` | Main practice overview |
| `PracticeTeamPage` | `/iatlas/practice/team` | Team management + collaboration |
| `PracticeAnalyticsPage` | `/iatlas/practice/analytics` | Practice-wide metrics |
| `PracticeBillingPage` | `/iatlas/practice/billing` | Billing management |
| `PracticeClientsPage` | `/iatlas/practice/clients` | Client list |
| `PracticeSchedulePage` | `/iatlas/practice/schedule` | Session scheduling |
| `IATLASPricingPage` | `/pricing` or `/iatlas/pricing` | Public pricing page |

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| `TeamMembersTable` | `components/Practice/TeamMembersTable.jsx` | Sortable table of practice members |
| `InvitePractitionerModal` | `components/Practice/InvitePractitionerModal.jsx` | Invite flow modal |
| `SeatUsageIndicator` | `components/Practice/SeatUsageIndicator.jsx` | Visual seat usage bar |
| `PaywallModal` | `components/PaywallModal.jsx` | Subscription gate modal |

---

## Payment Gating

Access to Practice tier features is enforced at two layers:

### 1. Backend Middleware

`subscriptionAuth(['practice', 'enterprise'])` is applied to all Practice API routes. It:

1. Extracts the Bearer token from the request.
2. Looks up the user's `iatlas_tier` in the database.
3. Returns `403` if the tier is not in the allowed list.

### 2. Frontend Gating

`requireActiveSubscription('practice', token)` in `client/src/utils/iatlasGating.js`:

1. Calls `GET /api/iatlas/subscription-status`.
2. Compares the returned tier against the required tier hierarchy.
3. Returns `{ allowed: false, currentTier, requiredTier }` if access is denied.
4. The calling page shows `PaywallModal` when access is denied.

---

## Seat Management

### Enforcement Logic

When a practitioner invitation is created (`POST /api/practices/:id/practitioners/invite`):

1. The backend loads the practice and checks `seatsUsed < seatLimit`.
2. If at limit: returns `400 { error: 'Seat limit reached' }`.
3. If under limit: creates a `PractitionerInvitation` record and sends the invitation email.

When an invitation is accepted:

1. `Practice.seatsUsed` is incremented by 1.
2. A `PracticePractitioner` record is created with `status: 'active'`.

When a member is removed:

1. `Practice.seatsUsed` is decremented by 1.
2. The `PracticePractitioner` record is updated to `status: 'removed'`.

### Upgrade Flow

1. User is shown upgrade prompt when seat limit is reached.
2. User clicks upgrade → redirected to `/iatlas/practice/billing`.
3. Billing page opens Stripe Customer Portal for plan change.
4. Stripe processes the upgrade → webhook updates `Practice.plan` and `Practice.seatLimit`.

---

## Role Hierarchy

```
owner > admin > clinician = therapist > observer
```

Roles are defined in `backend/config/practiceRoles.js`:

```javascript
export const ROLE_HIERARCHY = ['observer', 'therapist', 'clinician', 'admin', 'owner'];

export function hasMinimumRole(userRole, requiredRole) {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}
```

---

## Testing

### Unit Tests

- Backend model tests: `tests/models/practice.test.js`
- API route tests: `tests/routes/practices.test.js`
- Invitation flow tests: `tests/routes/invitations.test.js`

### Manual Testing Checklist

- [ ] Create practice → redirects to Stripe checkout
- [ ] Stripe test card `4242 4242 4242 4242` completes checkout
- [ ] Webhook activates subscription → redirected to dashboard
- [ ] Invite practitioner → invitation email received
- [ ] Accept invitation → practitioner appears in team list
- [ ] Seat limit enforcement → cannot invite beyond plan limit
- [ ] Role change → permissions update immediately
- [ ] Remove member → seat freed, member loses access
- [ ] Billing page → Stripe Customer Portal opens
- [ ] Paywall shown for non-practice users accessing practice routes

---

## Monitoring

### Key Metrics to Watch

- New practice signups per day
- Stripe webhook delivery success rate (check Stripe Dashboard → Webhooks)
- Invitation acceptance rate
- Seat utilization by plan
- `past_due` subscription count

### Error Logs

Watch Railway logs for:
```
[IATLAS Webhook] Error processing event
[Subscription] Stripe Price ID not configured
[Practice] Seat limit reached
```

---

## Deployment

### Required Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_IATLAS_PRACTICE_5_PRICE_ID=price_...
STRIPE_IATLAS_PRACTICE_10_PRICE_ID=price_...
STRIPE_IATLAS_PRACTICE_25_PRICE_ID=price_...

# Frontend analytics (optional)
VITE_ANALYTICS_ENABLED=true
```

### Deployment Steps

1. Ensure all Stripe price IDs are set in Railway environment variables.
2. Create/verify the Stripe webhook endpoint pointing to `https://yourdomain.com/api/iatlas/webhook`.
3. Subscribe webhook to: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
4. Deploy via Railway (`git push` triggers auto-deploy).
5. Verify webhook delivery in Stripe Dashboard → Webhooks → Recent deliveries.

---

## Future Enhancements

| Feature | Priority | Notes |
|---------|----------|-------|
| Ownership transfer UI | High | Currently requires support contact |
| Automated seat overage billing | High | Charge per seat beyond plan limit |
| Sub-practice (department) support | Medium | For large organizations |
| SAML/SSO | Medium | Enterprise tier requirement |
| Practice-level API keys | Low | For custom integrations |
| Audit log export | Low | Compliance use cases |
