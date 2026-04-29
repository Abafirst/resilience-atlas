# IATLAS Practice Tier — User Guide

## Overview

The IATLAS Practice tier allows group practices and clinics to manage multiple practitioners under a single billing account. This guide covers everything you need to get started, invite your team, manage roles, and handle billing.

---

## 1. Getting Started

### Creating Your Practice

1. **Navigate to Practice Setup:** Go to `/iatlas/practice/setup` or click **"Start Free Trial"** from the pricing page.
2. **Step 1 — Name Your Practice:** Enter your practice or clinic name (e.g., "Green Valley Therapy Center"). This is the name team members will see in their invitation emails.
3. **Step 2 — Select a Plan:** Choose from three seat-based plans:

| Plan | Seats | Monthly Price | Per-Seat Cost |
|------|-------|---------------|---------------|
| Practice-5 | Up to 5 practitioners | $399/mo | $79.80/seat |
| Practice-10 | Up to 10 practitioners | $699/mo | $69.90/seat |
| Practice-25 | Up to 25 practitioners | $1,499/mo | $59.96/seat |
| Custom | Unlimited | Contact us | Custom pricing |

4. **Step 3 — Subscribe:** Click **"Proceed to Checkout"** to complete payment through Stripe. You will be redirected back to your Practice Dashboard after a successful payment.

> **Note:** The practice owner's account counts as one of the seats included in your plan.

### Plan Selection Guide

- **Practice-5:** Best for small clinics or therapy groups with 2–5 clinicians.
- **Practice-10:** Ideal for growing practices that expect to add staff over time.
- **Practice-25:** Designed for larger multidisciplinary clinics or group practices.
- **Custom:** Contact `hello@theresilienceatlas.com` for organizations requiring 25+ seats, custom onboarding, or SSO.

### Stripe Checkout Process

1. After clicking **"Proceed to Checkout"**, you will be redirected to a Stripe-hosted payment page.
2. Enter your credit card details (Visa, Mastercard, American Express accepted).
3. Complete the purchase — Stripe handles all payment security (PCI compliant).
4. After payment, you are redirected to `/iatlas/practice/dashboard`.
5. Your subscription is immediately active and your seats are available.

---

## 2. Invite Team Members

### How to Send Invitations

1. Go to **Practice Dashboard → Team** tab (or navigate to `/iatlas/practice/team`).
2. Click the **"Invite Practitioner"** button.
3. Enter the team member's **email address**.
4. Select their **role** (see Role Descriptions below).
5. Click **"Send Invite"**.

The invited practitioner receives an email with a unique invitation link. The link is valid for **7 days**.

### Role Descriptions

| Role | Description |
|------|-------------|
| **Owner** | Full control. Can manage billing, invite/remove members, change roles, and delete the practice. Only one Owner per practice. |
| **Admin** | Can invite/remove team members and change roles (except Owner). Cannot access billing. |
| **Clinician / Therapist** | Can access client records, session plans, and clinical tools. Cannot manage team members. |
| **Observer** | Read-only access to the practice dashboard and analytics. Cannot create or modify records. |

### Email Invite Flow

1. The invited practitioner receives an email from `noreply@theresilienceatlas.com`.
2. They click the **"Accept Invitation"** link in the email.
3. If they don't have an account, they are prompted to create one (free).
4. After account creation or login, they are added to the practice automatically.
5. Their seat is marked as **occupied** immediately upon acceptance.

> **Tip:** If a team member doesn't receive their invitation, ask them to check their spam/junk folder, then resend from the Team page.

---

## 3. Manage Roles & Permissions

### Role Hierarchy

```
Owner
 └── Admin
      └── Clinician / Therapist
           └── Observer
```

Higher roles include all permissions of lower roles plus additional capabilities.

### How to Change a Member's Role

1. Navigate to **Team → Members** tab.
2. Find the team member in the list.
3. Click the **role badge** or the **Edit** button next to their name.
4. Select the new role from the dropdown.
5. Click **Save**.

> **Note:** Only the Owner can change Admin roles. Admins can change Clinician and Observer roles.

### Permission Matrix

| Action | Owner | Admin | Clinician | Observer |
|--------|-------|-------|-----------|----------|
| View practice dashboard | ✅ | ✅ | ✅ | ✅ |
| View client records | ✅ | ✅ | ✅ | ✅ (read) |
| Create/edit session plans | ✅ | ✅ | ✅ | ❌ |
| Invite team members | ✅ | ✅ | ❌ | ❌ |
| Remove team members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅* | ❌ | ❌ |
| View/manage billing | ✅ | ❌ | ❌ | ❌ |
| Delete practice | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |

*Admins cannot change Owner role or promote others to Owner.

---

## 4. Seat Management

### Seat Limits by Plan

| Plan | Maximum Practitioners |
|------|-----------------------|
| Practice-5 | 5 (including owner) |
| Practice-10 | 10 (including owner) |
| Practice-25 | 25 (including owner) |

### What Happens When You Reach the Seat Limit

- **Invitations are blocked:** The invite modal will display a warning that your practice is at capacity.
- **Existing members are unaffected:** Current team members retain full access.
- **Pending invitations remain active** but cannot be accepted until a seat is freed.

### How to Upgrade Your Plan

1. Go to **Practice Dashboard → Billing**.
2. Click **"Upgrade Plan"**.
3. Select the new plan (Practice-10 or Practice-25).
4. Stripe handles the proration — you pay only for the remaining days in your current billing period at the new rate.

### Seat Utilization Best Practices

- Assign the **Observer** role to stakeholders who only need to view reports — they still use a seat, but won't interact with client data.
- **Remove inactive members** promptly to free up seats for new hires.
- Monitor seat utilization in **Practice Dashboard → Analytics → Team Utilization**.

---

## 5. Billing & Subscriptions

### Payment Method Management

1. Go to **Practice Dashboard → Billing**.
2. Click **"Manage Payment Method"** — this opens the Stripe Customer Portal.
3. Add, remove, or update credit cards directly in the Stripe portal.
4. Changes take effect on the next billing cycle.

### Invoice Access

1. Go to **Practice Dashboard → Billing → Invoices**.
2. Click any invoice to download a PDF copy.
3. Invoices are also emailed to the Owner's address automatically each month.

### Cancellation Process

1. Go to **Practice Dashboard → Billing → Cancel Subscription**.
2. Confirm cancellation in the dialog.
3. Your practice remains active until the end of the current billing period.
4. After the period ends, the practice is deactivated and team members lose access.
5. Data is retained for 90 days after cancellation; contact support to request an export.

### Prorated Billing Explanation

When you **upgrade** mid-cycle:
- You are charged immediately for the prorated difference between your old and new plan prices.
- Your next regular invoice is at the new plan price.

When you **downgrade** mid-cycle:
- The difference is applied as a credit toward your next invoice.
- The downgrade takes effect at the end of the current billing period.

---

## 6. Team Analytics

### Available Metrics

| Metric | Description |
|--------|-------------|
| Seat Utilization | Percentage of seats filled vs. total available |
| Active Practitioners | Practitioners who logged in within the last 30 days |
| Session Plans Created | Total session plans across all practitioners |
| Client Records | Total active client profiles |
| Assessment Completions | Assessments completed by all practitioners' clients |
| Resilience Score Distribution | Aggregate score spread across all clients |

### How to Export Data

1. Go to **Practice Dashboard → Analytics**.
2. Set the desired date range.
3. Click **"Export CSV"** to download a spreadsheet of the selected metrics.
4. For custom reports, contact support at `hello@theresilienceatlas.com`.

### Reading the Dashboard

- **Top row:** Summary cards (seats, active practitioners, total sessions, avg. resilience score)
- **Charts:** Monthly trend lines for key metrics
- **Table:** Per-practitioner breakdown of sessions, clients, and completion rates
- **Filters:** Filter by practitioner, date range, or client age group

---

## 7. FAQs

### Practitioner vs. Practice Tier — What's the Difference?

| Feature | Practitioner ($149/mo) | Practice ($399+/mo) |
|---------|------------------------|---------------------|
| Practitioners | 1 (yourself) | 5, 10, or 25 |
| Team collaboration | ❌ | ✅ |
| Group analytics | ❌ | ✅ |
| Role-based access | ❌ | ✅ |
| Shared client records | ❌ | ✅ (coming soon) |
| Centralized billing | N/A | ✅ |

### How Do I Upgrade or Downgrade?

- Navigate to **Billing → Upgrade/Downgrade Plan**.
- Select the new plan.
- Stripe handles proration automatically (see Prorated Billing section above).

### What Happens If I Reach My Seat Limit?

- New invitations are blocked.
- Existing team members retain full access.
- Upgrade your plan from the **Billing** page to add more seats.

### Can I Transfer Practice Ownership to Someone Else?

1. Go to **Team → Members**.
2. Find the team member you want to promote.
3. Click **"Transfer Ownership"** next to their name (only visible to Owner).
4. The current Owner becomes an Admin; the selected member becomes the new Owner.

> **Warning:** This action is irreversible unless the new Owner transfers it back.

### How Do I Delete the Practice?

1. Go to **Practice Dashboard → Settings**.
2. Scroll to the **Danger Zone** section.
3. Click **"Delete Practice"** and confirm.
4. All team members will immediately lose access.
5. The Stripe subscription is cancelled automatically (no further charges).

> **Note:** Practice deletion is permanent. Contact support before deleting if you need a data export.

### What Happens to My Data If I Cancel?

- Data is retained for **90 days** after cancellation.
- You can request a full data export by emailing `hello@theresilienceatlas.com`.
- After 90 days, data is permanently deleted per our Privacy Policy.

### Can Practitioners Have Their Own Individual Subscriptions Within a Practice?

No. Practitioners added to a Practice account access all IATLAS features through the practice's subscription. They do not need (and cannot have) a separate individual subscription for the same features.

---

## Support

For help, contact us at:
- **Email:** `hello@theresilienceatlas.com`
- **Subject line:** `IATLAS Practice Tier Support`
- **Response time:** Within 1 business day (Priority support available on Complete+ tiers)
