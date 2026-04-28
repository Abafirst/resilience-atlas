# IATLAS Multi-Profile System — Parent Guide

**Version:** 1.0  
**Updated:** April 2026  
**Applies to:** IATLAS Family, Complete, Practitioner, Practice, and Enterprise plans

---

## Overview

The IATLAS multi-profile system lets a parent or caregiver manage separate resilience-building journeys for each child in their family — all from a single account. Each child gets their own:

- Named profile with a chosen avatar
- Age-appropriate curriculum and activities
- Isolated progress tracking (XP, badges, streaks)
- Dedicated view in the Shared Family Dashboard

---

## Profile Limits by Tier

| Tier | Max Child Profiles |
|------|--------------------|
| Free | 0 (no IATLAS access) |
| Individual ($19.99/mo) | 1 |
| **Family ($39.99/mo)** | **5** |
| Complete ($99.99/mo) | 5 |
| Practitioner ($149/mo) | 5 |
| Practice ($399/mo) | 5 |
| Enterprise (Custom) | 5 |

To increase your limit, upgrade your IATLAS subscription on the pricing page.

---

## Getting Started

### Step 1 — Create a Child Profile

1. Navigate to the **Kids** section of the IATLAS app.
2. Click the **＋ Add Child** button in the header or on the Family Dashboard.
3. Fill in the form:
   - **Name** — The child's first name or nickname (required, up to 64 characters)
   - **Age Group** — Select the range that matches your child's age:
     - Ages 5–7
     - Ages 8–10
     - Ages 11–14
     - Ages 15–18
   - **Avatar** — Pick an emoji avatar to represent this child
4. Click **Create Profile**.

The app will automatically switch to the new profile and take you to the age-appropriate activity catalog.

### Step 2 — Switch Between Profiles

Use the **profile switcher** dropdown in the Kids section header to move between your children's profiles. The current profile name and avatar are always visible at the top of the page.

Each time you switch profiles, the app loads that child's specific progress, badges, and streaks — no data is shared between profiles.

### Step 3 — View the Family Dashboard

The **Shared Family Dashboard** gives you a bird's-eye view of all your children at once:

- Each card shows the child's avatar, name, age group, total XP, and current streak
- Click any card to switch to that child's profile
- Click **View Progress** to see that child's full activity history and dimension progress
- Click **＋ Add Child** to create a new profile (up to your tier limit)

---

## Progress Isolation

Progress data for each child is stored independently using their unique `profileId`. This means:

- Completing an activity on Alex's profile does **not** affect Jordan's progress
- Badges and streaks are per-profile
- Switching profiles loads the correct history immediately

For families upgrading from Individual to Family tier, the first profile continues to use legacy progress data for backward compatibility.

---

## Managing Profiles

### Edit a Profile

Currently, profiles can be updated via the API (PUT `/api/iatlas/profiles/:profileId`). A dedicated **Edit Profile** UI will be added in a future sprint.

Fields you can update: name, avatar, age group, date of birth, gender, clinical notes, and learning preferences.

### Archive a Profile

Profiles are never permanently deleted — they are **archived** to preserve progress data for account recovery. To archive a profile:

1. From the Family Dashboard, open the profile you want to archive
2. Use the profile menu (coming in a future sprint) to archive it

An archived profile disappears from the switcher and dashboard but its data is retained.

---

## Troubleshooting

### "Profile Limit Reached" error

You've reached the maximum number of profiles for your current tier. Options:

- **Upgrade** your subscription to unlock up to 5 profiles (Family tier and above)
- **Archive** an existing profile you no longer need

### Progress not showing for a profile

1. Make sure the correct profile is selected in the switcher
2. Check that you are logged in (profile data requires authentication)
3. If progress is missing after upgrading, try refreshing the page — the app re-fetches all profiles on login

### "You must be logged in" message

Profile data is stored in the cloud and requires an Auth0 account. Log in to access your profiles and progress history.

---

## Data Privacy

- Child profile data (name, age group, avatar, progress) is stored in a MongoDB database associated with your parent account
- Profiles are access-controlled by your Auth0 user ID — no other user can read or modify your child's profiles
- Progress data is never sold or shared with third parties
- To request deletion of all data, contact support

---

## Next Steps

Once you have profiles set up, explore:

- **Age-specific activity catalogs** — each age group has tailored activities across 6 resilience dimensions
- **Printable worksheets** — print any activity as a clean, parent/teacher-friendly worksheet
- **Badges & XP** — children earn badges as they complete activities and build streaks
- **Parent Dashboard** — track notes and observations alongside your child's progress

---

*For technical support, use the in-app Help button or email support@resilience-atlas.com*
