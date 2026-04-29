# IATLAS Practice Tier — Email Campaign Guide

## Campaign Overview & Goals

This campaign announces the launch of IATLAS Complete, Practitioner, and Practice tiers to all registered users, drives upgrades from existing subscribers, and converts active trial users before expiry.

**Goals:**
- Announce Practice tier availability to all registered users
- Drive upgrades from existing Practitioner subscribers
- Convert active trial users to paid subscriptions

**Success Metrics:**
- Email open rate: 20–30%
- Click-through rate: 5–10%
- Conversion rate (upgrade/signup): 2–5%
- Pricing page visits from email: 50+ in first 7 days
- Practice tier signups in first 7 days: 5–10

---

## UTM Tracking Parameters

All email links should include the following UTM parameters:

| Parameter | Value |
|-----------|-------|
| `utm_source` | `email` |
| `utm_medium` | `launch` / `upsell` / `trial` |
| `utm_campaign` | `practice_tier` |
| `utm_content` | `cta_primary` / `cta_secondary` |

**Example:**
```
https://your-app.com/pricing?utm_source=email&utm_medium=launch&utm_campaign=practice_tier&utm_content=cta_primary
```

---

## Promo Code Setup

**Stripe Coupon:**
- Code: `LAUNCH50`
- Discount: 50% off first month
- Max redemptions: 100
- Valid for: 7 days from campaign send date
- Applicable tiers: Complete, Practitioner, Practice-5, Practice-10, Practice-25

**To create in Stripe Dashboard:**
1. Go to **Products → Coupons → Create Coupon**
2. Set **Discount:** 50% off
3. Set **Duration:** Once
4. Set **Redemption Limits:** 100
5. Set coupon ID to `LAUNCH50`

---

## Email 1: General Launch Announcement

**Send To:** All registered users  
**Send Time:** Day 0 (launch day)

### Subject Lines (A/B Test)

- **Subject A:** 🎉 Introducing IATLAS Practice Tiers — Invite Your Team
- **Subject B:** New! Group Practice Management for IATLAS

### Preview Text

> Collaborate with your team, manage cases together, and track analytics—all in one place.

### Body

```
Hi [FirstName],

We're excited to announce that IATLAS Complete, Practitioner, and Practice tiers are now available!

### What's New:

✅ **IATLAS Complete** ($99.99/mo)
Full curriculum access + advanced analytics for individual practitioners

✅ **IATLAS Practitioner** ($149/mo)
Clinical tools, session planning, and client management for solo practitioners

✅ **IATLAS Practice** (starting at $399/mo)
Multi-practitioner group management with team collaboration

### Practice Tier Highlights:
- Invite up to 5, 10, or 25 practitioners
- Role-based access control (Owner, Admin, Clinician, Observer)
- Team analytics dashboard
- Shared client case management (coming soon)
- Centralized billing

### Special Launch Offer:
**Upgrade to any tier in the next 7 days and get 50% off your first month!**
Use code: LAUNCH50 at checkout

[View Pricing & Plans →]

Questions? Reply to this email or visit our Help Center.

Best,
The Resilience Atlas Team
```

### CTA Buttons

| Button | Label | URL |
|--------|-------|-----|
| Primary | View Pricing | `https://your-app.com/pricing?utm_source=email&utm_medium=launch&utm_campaign=practice_tier&utm_content=cta_primary` |
| Secondary | Learn More | `https://your-app.com/iatlas/practice/setup?utm_source=email&utm_medium=launch&utm_campaign=practice_tier&utm_content=cta_secondary` |

### A/B Testing Guidance

- **Subject line:** Split 50/50 between Subject A (emoji, explicit team invite) and Subject B (simpler, feature-focused)
- **Winning criteria:** Higher open rate after 4 hours; send winner to remaining 50% of list
- **CTA color:** Test indigo (#4f46e5) vs. green (#059669) primary button
- **Send time:** Test Tuesday 10 AM vs. Thursday 2 PM (recipient local time)

---

## Email 2: Practitioner Upsell

**Send To:** Existing Practitioner tier subscribers  
**Send Time:** Day 2 (2 days after Email 1)

### Subject Line

> Upgrade to Practice & Invite Your Team — Save $200/mo

### Preview Text

> You're already on Practitioner. Adding team members costs less than you think.

### Body

```
Hi [FirstName],

You're already using IATLAS Practitioner — great choice! But if you're working
with a team of clinicians, you could be getting a lot more value.

### Why Upgrade to Practice?

Your current Practitioner plan: $149/mo (1 seat)
Practice-5 plan: $399/mo (5 seats = $79.80/seat/mo)

**That's $200/mo less per practitioner when you add 4 colleagues.**

### What You Get:
- Everything in your current Practitioner plan
- 5 practitioner seats (expandable to 10 or 25)
- Team collaboration dashboard
- Role-based access (Owner, Admin, Clinician, Observer)
- Shared analytics across your whole practice

### Special Offer for Existing Subscribers:
**Upgrade in the next 7 days and get 50% off your first Practice month.**
Use code: LAUNCH50 at checkout

[Upgrade to Practice →]

Have questions about migrating your existing data? Reply to this email —
we'll help you make the switch smoothly.

Best,
The Resilience Atlas Team
```

### CTA Buttons

| Button | Label | URL |
|--------|-------|-----|
| Primary | Upgrade to Practice | `https://your-app.com/iatlas/practice/setup?utm_source=email&utm_medium=upsell&utm_campaign=practice_tier&utm_content=cta_primary` |
| Secondary | Compare Plans | `https://your-app.com/pricing?utm_source=email&utm_medium=upsell&utm_campaign=practice_tier&utm_content=cta_secondary` |

---

## Email 3: Trial Reminder

**Send To:** Active trial users (triggered 3 days before trial expiry)  
**Send Time:** Triggered — 3 days before `trialEndsAt`

### Subject Line

> Your IATLAS Trial Expires in 3 Days — Don't Lose Access

### Preview Text

> Keep your progress, assessments, and team features. Subscribe before [ExpiryDate].

### Body

```
Hi [FirstName],

Your IATLAS trial expires in **3 days** (on [ExpiryDate]).

After that, you'll lose access to:
- Your saved assessments and progress data
- All curriculum content and practice pathways
- Clinical tools and session plans (if applicable)
- Any team members you've invited

### Don't Lose Your Work

Subscribe now to keep everything exactly as it is.

**Your trial plan:** [CurrentPlan]
**Subscribe now:** [SubscribeLink]

### Save 50% on Your First Month
Use code **LAUNCH50** at checkout — valid for the next 3 days only.

[Subscribe & Keep Access →]

If you have questions or need help choosing a plan, reply to this email
and we'll get back to you within a few hours.

Best,
The Resilience Atlas Team
```

### CTA Buttons

| Button | Label | URL |
|--------|-------|-----|
| Primary | Subscribe & Keep Access | `https://your-app.com/pricing?utm_source=email&utm_medium=trial&utm_campaign=practice_tier&utm_content=cta_primary` |
| Secondary | View Plans | `https://your-app.com/pricing?utm_source=email&utm_medium=trial&utm_campaign=practice_tier&utm_content=cta_secondary` |

### Urgency Messaging Notes

- Use the word "expires" in subject line and first sentence
- Bold the expiry date
- List specific items they will lose access to
- Single, high-contrast CTA button
- Keep copy concise (under 200 words in body)

---

## SendGrid / Mailchimp Setup Instructions

### SendGrid

1. **Create a Dynamic Template** for each email variant
2. **Add substitution tags:** `{{FirstName}}`, `{{ExpiryDate}}`, `{{CurrentPlan}}`, `{{SubscribeLink}}`
3. **Create a Segment** for each audience:
   - All users: no filter
   - Practitioner subscribers: `subscription.tier == "practitioner"`
   - Active trials (3 days out): `trialEndsAt BETWEEN now AND now+3d`
4. **Schedule sends:**
   - Email 1: Immediately on launch day
   - Email 2: `sendAt = Email1.sentAt + 2 days`
   - Email 3: Automated trigger on `trialEndsAt - 3 days`
5. **Enable click tracking** and **open tracking** in the template settings
6. **Set reply-to:** `hello@theresilienceatlas.com`

### Mailchimp

1. **Create a Campaign** for each email
2. **Use merge tags:** `*|FNAME|*`, `*|EXPIRY_DATE|*`, `*|CURRENT_PLAN|*`
3. **Audience segmentation:** Use tags added to contacts during signup
4. **A/B test configuration:** Use Mailchimp's built-in A/B test wizard for subject lines
5. **Automation:** Set Email 3 as a date-based automation triggered on `trial_ends_at - 3 days` custom field

---

## Post-Campaign Monitoring

Track these metrics 24 hours, 48 hours, and 7 days after each send:

| Metric | Target | Tool |
|--------|--------|------|
| Open rate | 20–30% | SendGrid / Mailchimp |
| Click rate | 5–10% | SendGrid / Mailchimp |
| Pricing page visits (email source) | 50+ | Google Analytics |
| Practice tier signups | 5–10 | MongoDB / Stripe Dashboard |
| LAUNCH50 redemptions | ≤100 | Stripe Dashboard → Coupons |
| Unsubscribe rate | <0.5% | SendGrid / Mailchimp |
