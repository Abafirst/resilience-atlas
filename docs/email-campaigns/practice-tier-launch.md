# IATLAS Practice Tier Launch — Email Campaign Templates

## Overview

Three-email launch sequence for the IATLAS Practice tier.

**SendGrid setup:** Create a new single-send campaign for Email 1, a segment-targeted campaign for Email 2, and an automated trigger campaign for Email 3.

---

## SendGrid Merge Tags

The following dynamic merge tags are used in the email templates. Ensure they are populated from your contact list or event data:

| Tag | Description | Required In |
|-----|-------------|-------------|
| `{{first_name}}` | Subscriber's first name | Emails 1, 2, 3 |
| `{{trial_end_date}}` | Formatted trial expiry date (e.g. "May 5, 2026") | Email 3 |

In SendGrid, map these as **Custom Fields** on the contact record:
- `first_name` — populated from Auth0 profile on registration
- `trial_ends_at` — set when a trial is created; format as `MMMM D, YYYY` using [SendGrid Handlebars date helpers](https://docs.sendgrid.com/for-developers/sending-email/using-handlebars#format-date)

---

## A/B Testing Strategy

Split each send 50/50 on subject lines. Winning variant (highest open rate after 4 hours) is sent to the remaining list. Track with UTM parameters on all links.

## UTM Tracking Parameters

Append these to all links in each email:

| Email | `utm_source` | `utm_medium` | `utm_campaign` |
|-------|-------------|--------------|---------------|
| Email 1 – Launch | `sendgrid` | `email` | `practice_launch` |
| Email 2 – Upsell | `sendgrid` | `email` | `practice_upsell` |
| Email 3 – Trial Reminder | `sendgrid` | `email` | `trial_reminder` |

Example full URL:
```
https://theresilienceatlas.com/iatlas/practice/setup?utm_source=sendgrid&utm_medium=email&utm_campaign=practice_launch
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Open rate | ≥ 28% |
| Click-through rate | ≥ 4% |
| Conversion (new Practice signups) | ≥ 1.5% of sends |
| Unsubscribe rate | ≤ 0.2% |

---

## Contact List Segmentation

| Segment | SendGrid Tag | Description |
|---------|-------------|-------------|
| All registered users | `all_users` | For Email 1 |
| Practitioner subscribers | `iatlas_practitioner` | For Email 2 |
| Expiring trials | `trial_expiring_3d` | For Email 3 |

---

## Promo Code Setup (Stripe)

1. Go to **Stripe Dashboard → Products → Coupons**.
2. Create a new coupon:
   - **Name:** `LAUNCH50`
   - **Type:** Percentage discount — 50%
   - **Duration:** Once
   - **Redemption limit:** Optional (e.g. 200)
3. Copy the coupon ID and set `STRIPE_PROMO_CODE_LAUNCH50` in Railway.
4. In the checkout session creation, pass `discounts: [{ coupon: process.env.STRIPE_PROMO_CODE_LAUNCH50 }]`.

---

## Email 1: General Launch Announcement

**Target audience:** All registered users
**Send time:** Tuesday–Thursday, 10 am–2 pm local

### Subject Line A/B Test

- **A:** 🎉 New: IATLAS Practice Tier is live — manage your whole team
- **B:** Introducing IATLAS Practice: Group practice management for your clinical team

### Preview Text

Invite practitioners, track analytics, and collaborate — all in one place.

---

### Body

Hi {{first_name}},

We just launched something we've been building for months: **IATLAS Practice** — group practice management for multi-practitioner teams.

Whether you lead a small therapy group or a growing clinical organization, IATLAS Practice gives your whole team one unified workspace.

---

**What's included:**

| Tier | Price | Best For |
|------|-------|----------|
| **IATLAS Complete** | $99.99/mo | Families wanting the full curriculum + advanced analytics |
| **IATLAS Practitioner** | $149/mo | Solo practitioners delivering IATLAS-based clinical care |
| **IATLAS Practice** | $399+/mo | Group practices managing multiple practitioners & clients |

---

**IATLAS Practice includes everything in Practitioner, plus:**

- ✅ 5–25 practitioner seats (Practice-5, Practice-10, Practice-25)
- ✅ Group practice management dashboard
- ✅ Role-based permissions (Owner, Admin, Clinician, Therapist, Observer)
- ✅ Team collaboration tools
- ✅ Practice-wide analytics

---

**🎁 Launch offer — 50% off your first month**

Use code **`LAUNCH50`** at checkout.

[**Set Up Your Practice →**](https://theresilienceatlas.com/iatlas/practice/setup?utm_source=sendgrid&utm_medium=email&utm_campaign=practice_launch&promo=LAUNCH50)

[**View All Plans →**](https://theresilienceatlas.com/pricing?utm_source=sendgrid&utm_medium=email&utm_campaign=practice_launch)

---

Questions? Reply to this email or visit our [Help Center](https://theresilienceatlas.com/support/tickets?utm_source=sendgrid&utm_medium=email&utm_campaign=practice_launch).

The Resilience Atlas Team

---

## Email 2: Practitioner Upsell

**Target audience:** Existing Practitioner tier subscribers only
**Send time:** 3 days after Email 1

### Subject Line

**Upgrade to Practice & Invite Your Team**

### Preview Text

You've mastered solo practice. Now bring your whole team on board.

---

### Body

Hi {{first_name}},

You're already using IATLAS Practitioner to deliver outstanding clinical care. Now imagine what your team could accomplish together.

**IATLAS Practice** gives you everything you already love, plus the tools to collaborate, delegate, and grow.

---

**What you gain by upgrading:**

- 👥 **Multi-practitioner access** — invite 5, 10, or 25 colleagues
- 🗂️ **Team collaboration workspace** — share cases, notes, and tasks
- 📊 **Practice-wide analytics** — see outcomes across your entire team
- 🔐 **Role-based permissions** — control what each team member can access

---

**Limited-time offer: $200 off your first 3 months**

As a Practitioner subscriber, we're offering you a special upgrade rate.

[**Upgrade to Practice →**](https://theresilienceatlas.com/iatlas/practice/setup?utm_source=sendgrid&utm_medium=email&utm_campaign=practice_upsell)

[**See Plans & Pricing →**](https://theresilienceatlas.com/pricing?utm_source=sendgrid&utm_medium=email&utm_campaign=practice_upsell)

---

Not ready to upgrade yet? No problem — your Practitioner plan continues unchanged.

The Resilience Atlas Team

---

## Email 3: Trial Reminder

**Target audience:** Users with trials expiring in 3 days
**Trigger:** Automated — send when `trialEndsAt` is within 72 hours

### Subject Line

Your IATLAS Trial Expires in 3 Days

### Preview Text

Don't lose access to your assessments, session plans, and progress data.

---

### Body

Hi {{first_name}},

Your IATLAS free trial ends in **3 days** on **{{trial_end_date}}**.

After that, you'll lose access to:

- ❌ Clinical assessments & session plans
- ❌ Client worksheets & progress reports
- ❌ Your saved data and history

---

**Keep everything — subscribe today**

| Your Plan | Price | Action |
|-----------|-------|--------|
| IATLAS Individual | $19.99/mo | [Subscribe](https://theresilienceatlas.com/iatlas/subscribe?tier=individual&utm_source=sendgrid&utm_medium=email&utm_campaign=trial_reminder) |
| IATLAS Practitioner | $149/mo | [Subscribe](https://theresilienceatlas.com/iatlas/subscribe?tier=practitioner&utm_source=sendgrid&utm_medium=email&utm_campaign=trial_reminder) |
| IATLAS Practice | $399/mo | [Set Up Practice](https://theresilienceatlas.com/iatlas/practice/setup?utm_source=sendgrid&utm_medium=email&utm_campaign=trial_reminder) |

---

[**Continue My Subscription →**](https://theresilienceatlas.com/pricing?utm_source=sendgrid&utm_medium=email&utm_campaign=trial_reminder)

Questions? Reply to this email — we're happy to help.

The Resilience Atlas Team

---

## SendGrid Setup Instructions

### Single Send (Email 1)

1. Log in to SendGrid → **Email API → Single Sends → Create Single Send**.
2. Select or create the **All Users** contact list.
3. Set subject lines (A/B test):
   - Variant A: `🎉 New: IATLAS Practice Tier is live — manage your whole team`
   - Variant B: `Introducing IATLAS Practice: Group practice management for your clinical team`
4. Set preview text.
5. Paste HTML body (convert markdown above using a template editor).
6. Schedule for Tuesday–Thursday, 10 am–2 pm.
7. Enable click and open tracking.

### Automated Trigger (Email 3)

1. Go to **Automation → Create Automation → Custom Date**.
2. Trigger: `trial_ends_at` — 3 days before.
3. Add the trial reminder email as step 1.
4. Activate automation.
