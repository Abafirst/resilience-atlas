# IATLAS Practice Tier — User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Invite Team Members](#invite-team-members)
3. [Manage Roles & Permissions](#manage-roles--permissions)
4. [Seat Management](#seat-management)
5. [Billing & Subscriptions](#billing--subscriptions)
6. [Team Analytics](#team-analytics)
7. [FAQs](#faqs)

---

## Getting Started

### How to Create a Practice

The Practice tier is designed for multi-practitioner clinical groups. Before you can invite team members, you need to set up your practice.

**Prerequisites:**
- An active IATLAS account
- A payment method ready for subscription

### 3-Step Setup Wizard

Navigate to [/iatlas/practice/setup](https://theresilienceatlas.com/iatlas/practice/setup) to begin.

#### Step 1 — Name Your Practice

Enter the official name of your group practice (e.g., "Green Valley Therapy Center"). This name will appear on all invitation emails sent to your team.

- Maximum 128 characters
- Press **Enter** or click **Continue →** to proceed

#### Step 2 — Select Your Plan

Choose the number of practitioner seats your practice needs:

| Plan | Seats | Price | Overage |
|------|-------|-------|---------|
| **Practice-5** | 5 practitioners | $399/mo | +$80/seat/mo |
| **Practice-10** | 10 practitioners | $699/mo | +$70/seat/mo |
| **Practice-25** | 25 practitioners | $1,499/mo | +$60/seat/mo |
| **Custom** | Unlimited | Contact us | — |

> **Tip:** Start with Practice-5 and upgrade at any time as your team grows.

Click **Continue →** to proceed.

#### Step 3 — Confirm & Subscribe

Review your practice name and selected plan. Click **Proceed to Checkout →** to be redirected to Stripe's secure checkout page.

After successful payment, you will be redirected to your **Practice Dashboard** at `/iatlas/practice/dashboard`.

---

## Invite Team Members

### Step-by-Step Invitation Process

1. Go to **Practice → Team** (`/iatlas/practice/team`).
2. Click **Invite Practitioner**.
3. Enter the practitioner's email address.
4. Select their role (see [Role Hierarchy](#role-hierarchy) below).
5. Click **Send Invitation**.

An email invitation is sent to the practitioner with a unique link. The link expires after **7 days**.

### Role Selection

When inviting a team member, choose the role that matches their responsibilities:

| Role | Description |
|------|-------------|
| **Owner** | Full access; can manage billing and delete the practice |
| **Admin** | Manage members and all clinical features; no billing access |
| **Clinician** | Full clinical access; cannot manage team members |
| **Therapist** | Clinical access focused on therapy workflows |
| **Observer** | Read-only access for supervisors or trainees |

### Email Invite Flow

1. Practitioner receives an invitation email from `noreply@theresilienceatlas.com`.
2. They click **Accept Invitation**.
3. If they don't have an account, they are prompted to create one.
4. After signing in, they are added to the practice with their assigned role.
5. The practice's **seatsUsed** count increments by 1.

---

## Manage Roles & Permissions

### Role Hierarchy

```
Owner
  └── Admin
        └── Clinician / Therapist
                └── Observer
```

Higher roles inherit all permissions of lower roles.

### How to Change Member Roles

1. Go to **Practice → Team → Members**.
2. Find the team member in the table.
3. Click **Edit Role** (pencil icon).
4. Select the new role from the dropdown.
5. Click **Save**.

### Permission Matrix

| Permission | Owner | Admin | Clinician | Therapist | Observer |
|------------|:-----:|:-----:|:---------:|:---------:|:--------:|
| View practice dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| View client list | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit clients | ✅ | ✅ | ✅ | ✅ | ❌ |
| Run assessments | ✅ | ✅ | ✅ | ✅ | ❌ |
| View team analytics | ✅ | ✅ | ✅ | ✅ | ✅ |
| Invite team members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove team members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete practice | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Seat Management

### Seat Limits by Plan

| Plan | Included Seats |
|------|---------------|
| Practice-5 | 5 |
| Practice-10 | 10 |
| Practice-25 | 25 |
| Custom | Unlimited |

The **Owner** account always occupies 1 seat.

### What Happens When Seats Are Full

When you attempt to invite a practitioner after reaching your seat limit:

- The invitation is blocked with the message: *"Your practice has reached its seat limit. Please upgrade your plan to invite more practitioners."*
- No invitation email is sent.
- Your team page shows a **Seat Limit Reached** warning with an upgrade prompt.

### How to Upgrade Plans

1. Go to **Practice → Billing** (`/iatlas/practice/billing`).
2. Click **Change Plan**.
3. Select a higher-tier plan.
4. Confirm the prorated billing change.

Alternatively, contact support at [hello@theresilienceatlas.com](mailto:hello@theresilienceatlas.com).

### How to Remove Members

1. Go to **Practice → Team → Members**.
2. Find the member in the table.
3. Click the **Remove** button (trash icon).
4. Confirm the removal.

The practitioner loses access immediately. The seat becomes available for a new invitation.

---

## Billing & Subscriptions

### Payment Method Management

1. Go to **Practice → Billing** (`/iatlas/practice/billing`).
2. Click **Manage Billing** to open the Stripe Customer Portal.
3. In the portal, you can:
   - Add or update a payment method
   - View and download invoices
   - Change your plan
   - Cancel your subscription

### How to Update Your Card

1. **Practice → Billing → Manage Billing** → Stripe Customer Portal.
2. Click **Payment Methods → Add payment method**.
3. Enter your new card details.
4. Set as default and remove the old card if desired.

### Cancellation Process

1. **Practice → Billing → Manage Billing** → Stripe Customer Portal.
2. Click **Cancel plan**.
3. Select a reason (optional) and confirm.
4. Access continues until the end of the current billing period.
5. After cancellation, all practice members lose access to Practice-tier features.

> **Note:** Practice data (clients, assessments, notes) is retained for 90 days after cancellation.

### Invoice Access

All invoices are available in the Stripe Customer Portal under **Billing History**. Invoices are also emailed automatically to the practice Owner after each billing cycle.

---

## Team Analytics

### How to View Practice-Wide Metrics

Go to **Practice → Analytics** (`/iatlas/practice/analytics`) to see:

- **Seat utilization** — seats used vs. available
- **Client outcomes** — aggregate resilience scores across all practitioners
- **Session frequency** — sessions per week by practitioner
- **Assessment completion rates** — percentage of clients with recent assessments

### Data Export Instructions

1. Go to **Practice → Analytics**.
2. Click **Export Data** (top-right).
3. Select date range and data type (CSV or JSON).
4. Click **Download**.

Exported files include anonymized client IDs, assessment scores, and timestamps.

---

## FAQs

### What's the difference between Practitioner and Practice tiers?

| Feature | Practitioner ($149/mo) | Practice ($399+/mo) |
|---------|----------------------|---------------------|
| Clinical assessments | ✅ | ✅ |
| Session plans | ✅ | ✅ |
| Client worksheets | ✅ | ✅ |
| Individual practice management | ✅ | ✅ |
| Multi-practitioner seats | ❌ | ✅ (5–25) |
| Team collaboration tools | ❌ | ✅ |
| Group practice dashboard | ❌ | ✅ |
| Role-based permissions | ❌ | ✅ |
| Team analytics | ❌ | ✅ |

### Can I upgrade or downgrade my plan?

**Upgrade:** Available at any time. You are charged the prorated difference immediately.

**Downgrade:** Available at the end of your billing period. If your current seat usage exceeds the lower plan's limit, you must remove members before downgrading.

### How do I handle the seat limit?

If you need more seats than your current plan allows:

1. Upgrade to the next plan tier, or
2. Remove inactive members to free up seats.

You cannot invite new members while at your seat limit.

### Can I transfer Practice ownership?

Currently, ownership transfer requires contacting support at [hello@theresilienceatlas.com](mailto:hello@theresilienceatlas.com). Automated ownership transfer is on the roadmap.

### What happens if I delete my practice?

Deleting a practice is permanent:

- All practitioners lose access immediately.
- All client data, assessments, and notes are permanently deleted after 90 days.
- The subscription is cancelled automatically.
- This action cannot be undone.

To delete your practice, contact [hello@theresilienceatlas.com](mailto:hello@theresilienceatlas.com).
