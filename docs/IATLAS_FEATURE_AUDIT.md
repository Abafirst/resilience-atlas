# IATLAS Feature Audit & Development Roadmap

**Last Updated:** April 2026 (Sprint 3 complete — production polish)  
**Purpose:** Audit all advertised IATLAS features against current implementation, identify gaps, and prioritize the next 3 months of development.

---

## 1. Executive Summary

IATLAS is a separate subscription product from Atlas Start / Atlas Navigator. It offers six paid tiers across two tracks:

| Track | Tiers | Price Range |
|-------|-------|-------------|
| **Consumer** | Individual, Family, Complete | $19.99 – $99.99 / mo |
| **Professional** | Practitioner, Practice, Enterprise | $149 – Custom |

### High-Level Completion Status

| Tier | Advertised Features | ✅ Built | 🟡 Partial | ❌ Missing | Completion |
|------|--------------------|---------:|----------:|----------:|----------:|
| Individual | 5 | 4 | 1 | 0 | ~85% |
| Family | 4 (+Individual) | 5 | 0 | 0 | ✅ **100% — SELLABLE** |
| Complete | 4 (+Family) | 1 | 1 | 2 | ~30% |
| Practitioner | 5 | 1 | 2 | 2 | ~25% |
| Practice | 4 (+Practitioner) | 0 | 0 | 4 | ~0% |
| Enterprise | 4 (+Practice) | 0 | 0 | 4 | ~0% |

### Sprint 1 Completed (April 2026)

1. ✅ **Multi-child profile system** — `ChildProfile` model + `/api/iatlas/profiles` CRUD routes + tier enforcement
2. ✅ **Shared family dashboard** — `SharedFamilyDashboard.jsx` with per-profile progress cards
3. ✅ **ProfileSwitcher** — inline dropdown for Kids section header
4. ✅ **AddChildProfileModal** — guided profile creation with avatar grid + tier limit guard
5. ✅ **ProfileContext** — global React state for profile management, auto-sync on login
6. ✅ **Profile-namespaced progress** — `useKidsProgress.js` namespaces all localStorage keys by `profileId`
7. ✅ **Printable activity worksheets** — `PrintableActivitySheet.jsx` + `print.css` + "Print Worksheet" button in `KidsActivityCard`
8. ✅ **"Coming Soon" labels accurate** — `iatlasGating.js` updated; `family.comingSoon: false`

### Sprint 2 Completed (April 2026) — Family Tier Polish

1. ✅ **Caregiver Learning curriculum** — 15 evidence-based parent guides across all 6 resilience dimensions + cross-cutting topics; `CaregiverLearningPage.jsx` with filterable catalog, `CaregiverGuideViewer.jsx` with reading progress and "Mark as Read" (localStorage); gated with `hasCaregiverAccess()`
2. ✅ **Family Challenges UI polish** — dimension icon rendering fixed across all 3 pages (`FamilyChallengesPage.jsx`, `FamilyChallengeDetailPage.jsx`, `FamilyChallengePreview.jsx`); `DIMENSION_ICONS` corrected (somatic uses `somatic-regulative.svg`; spiritual-existential uses `spiritual-reflective.svg`); dimension badge added to `ChallengeCard`
3. ✅ **Parent Dashboard → Caregiver Learning link** — `ParentDashboardPage.jsx` now includes a Caregiver Learning card that navigates to `/iatlas/caregiver-learning`

### Sprint 3 Completed (April 2026) — Production Polish

1. ✅ **Server-side tier enforcement middleware** — `backend/middleware/iatlasAuth.js` with `requireIATLASTier(minTier)` hierarchy-based factory; applied to `/api/iatlas/parent` routes (Individual tier minimum); tier bypass via localStorage is no longer possible
2. ✅ **Edit Profile Modal wired** — `EditProfileModal.jsx` connected to `FamilyDashboard.jsx`; "⋯" button on every child card opens the full edit modal (name, avatar, age group, gender, clinical details, preferences); soft-delete confirmed via UI dialog
3. ✅ **Family Report CSV export** — `client/src/utils/familyReportExport.js` utility created; "📊 Export Report" button in Family Dashboard generates a dated CSV with per-child progress metrics
4. ✅ **Backend tier config `comingSoon` flags** — `backend/config/tiers.js` updated; `complete`, `practitioner`, `practice`, and `enterprise` tiers all carry `comingSoon: true`, matching the frontend `iatlasGating.js` configuration

### Remaining Priority Gaps

1. 🔴 **Critical:** Practice & Enterprise tier features — entirely absent
2. 🟠 **High:** Advanced progress analytics (Complete tier) — not built
3. 🟠 **High:** ABA protocol library UI (Practitioner) — content exists in IARF; no UI
4. 🟠 **High:** Clinical assessments & session plans (Practitioner) — not built

### Infrastructure Summary

- ✅ Stripe subscription checkout (`/api/iatlas/subscribe`)
- ✅ Webhook handler for IATLAS subscription lifecycle events
- ✅ MongoDB `iatlas_subscriptions` + `iatlas_payments` collections (auto-created by webhook)
- ✅ Auth gating utility (`iatlasGating.js`) with tier-aware access functions
- ✅ `ChildProfile` model + CRUD API (`/api/iatlas/profiles`) with tier enforcement
- ✅ React `ProfileContext` + `ProfileProvider` wrapping the app
- 🟡 Auth0 tier sync — stored in `localStorage`; no server-side session guard on content routes
- ❌ Enterprise price ID / contact-sales flow — no Stripe product needed, but contact form not wired

---

## 2. Feature Audit by Tier

### IATLAS Individual ($19.99/mo)

> Source: `client/src/utils/iatlasGating.js` lines 43–49

| # | Feature | Status | Evidence | What's Missing | Priority |
|---|---------|--------|----------|---------------|----------|
| 1 | All kids games & activities | ✅ Fully Built | `client/src/components/KidsGames/` (14 game components); `client/src/data/iatlas/kidsActivities.js` — 96 activities across 4 age groups & 6 dimensions | — | — |
| 2 | IATLAS curriculum (all ages) | ✅ Fully Built | `client/src/pages/IATLASCurriculumPage.jsx`; `client/src/data/iatlas/` — 49 adult skill modules across 6 dimensions & 3 levels; `client/src/pages/IATLASKidsLandingPage.jsx` — 4 age groups | — | — |
| 3 | Progress tracking | ✅ Fully Built | `client/src/hooks/useKidsProgress.js`; `client/src/components/IATLAS/ProgressTracker.jsx`; `client/src/components/IATLAS/Kids/KidsProgressDashboard.jsx`; `client/src/components/Gamification/IATLASProgressDashboard.jsx` | — | — |
| 4 | Printable resources | ✅ Fully Built | `client/src/components/IATLAS/Kids/PrintableActivitySheet.jsx` — print-optimised activity worksheets; `client/src/styles/print.css` — global print stylesheet; `CertificatePrinter.jsx` — achievement certificates; `PrintExportButton.jsx` + `PrintPreviewModal.jsx` — full PDF export | — | — |
| 5 | 1 child profile | ✅ Fully Built | Full `ChildProfile` model + CRUD API (`/api/iatlas/profiles`); `ProfileContext` + `ProfileSwitcher` + `AddChildProfileModal`; `useKidsProgress.js` namespaces progress by `profileId` | — | — |

**Overall Individual Tier:** ~85% complete. Core content, tracking, printable worksheets, and named profile creation are all functional.

---

### IATLAS Family ($39.99/mo) ✅ SELLABLE

> Source: `client/src/utils/iatlasGating.js` lines 51–63 (inherits Individual features)

| # | Feature | Status | Evidence | What's Missing | Priority |
|---|---------|--------|----------|---------------|----------|
| 1 | Everything in Individual | ✅ Fully Built | All Individual features now complete — see above | — | — |
| 2 | Up to 5 child profiles | ✅ Fully Built | `backend/models/ChildProfile.js` — full Mongoose model; `backend/routes/profiles.js` — CRUD at `/api/iatlas/profiles` with tier enforcement (family → max 5); `ProfileContext.jsx` + `AddChildProfileModal.jsx` + `ProfileSwitcher.jsx`; `useKidsProgress.js` keys namespaced by `profileId` | — | — |
| 3 | Caregiver resources & parent guides | ✅ Fully Built | `client/src/data/iatlas/caregiverGuides.js` — 15 structured guides across all 6 dimensions + cross-cutting; `CaregiverLearningPage.jsx` — filterable catalog at `/iatlas/caregiver-learning`; `CaregiverGuideViewer.jsx` — full reading view with "Mark as Read" (localStorage); gated with `hasCaregiverAccess()`; linked from `ParentDashboardPage.jsx` | — | — |
| 4 | Shared progress dashboard | ✅ Fully Built | `client/src/components/IATLAS/Kids/SharedFamilyDashboard.jsx` — grid of all child profile cards showing XP, streak, age group, and "View Progress" links; click to switch active profile | — | — |
| 5 | Family challenge activities | ✅ Fully Built | `client/src/data/iatlas/familyChallenges.js` — 18 challenges across 6 dimensions; `FamilyChallengesPage.jsx` — browsable catalog with dimension filter and badges; `FamilyChallengeDetailPage.jsx` — full detail view; `FamilyChallengePreview.jsx` — preview in Parent Dashboard; icon rendering fixed | — | — |

**Overall Family Tier:** ✅ **100% complete — SELLABLE NOW.** All five advertised features are fully built.

---

### IATLAS Complete ($99.99/mo)

> Source: `client/src/utils/iatlasGating.js` lines 65–77 (inherits Family features)

| # | Feature | Status | Evidence | What's Missing | Priority |
|---|---------|--------|----------|---------------|----------|
| 1 | Everything in Family | 🟡 Partial | Family tier is ~90% complete — multi-profile + shared dashboard built; family challenge activities still pending | Family challenge activities not yet built | 🟡 Medium |
| 2 | Full curriculum access | ✅ Fully Built | All 6 dimensions × 3 levels of adult modules are in `client/src/data/iatlas/`; gated by `hasIATLASAccess()` in `IATLASCurriculumPage.jsx` | — | — |
| 3 | Advanced progress analytics | ❌ Not Started | Basic progress tracking exists (`ProgressTracker.jsx`, `IATLASProgressDashboard.jsx`); no advanced analytics layer | No trend analysis, completion rate charts, dimension comparison over time, or exportable reports | 🟠 High |
| 4 | Priority support | ❌ Not Started | No support channel, ticket system, or priority routing configured | Needs a contact/support flow with tier detection to route Complete subscribers to priority queue | 🟡 Medium |

**Overall Complete Tier:** ~25% complete. The premium price point ($99.99) requires advanced analytics that don't exist. Selling Complete before Family is functional also undermines value prop.

---

### IATLAS Practitioner ($149/mo)

> Source: `client/src/utils/iatlasGating.js` lines 78–90

| # | Feature | Status | Evidence | What's Missing | Priority |
|---|---------|--------|----------|---------------|----------|
| 1 | Clinical assessments & session plans | ❌ Not Started | No clinical assessment component found; `IARF/curriculum/*/skills-inventory.md` and `aba-protocols.md` contain the content framework | No UI for creating/managing session plans; no clinical assessment flow (intake forms, progress notes, outcome tracking) | 🔴 Critical |
| 2 | Client resources & worksheets | 🟡 Partial | `client/src/components/IATLAS/WorksheetComponent.jsx` — interactive skill module worksheets exist; `backend/scripts/seedClinicianCaregiverResources.js` — 6 clinician resources seeded | Worksheets are tied to individual skill modules, not shareable with clients; no "client resource library" view, no sharing/export mechanism | 🟠 High |
| 3 | ABA protocol library | 🟡 Partial | `IARF/curriculum/*/aba-protocols.md` — ABA protocol markdown files exist for all 6 dimensions; `client/src/pages/IATLASCurriculumPage.jsx` references ABA in `comingSoon` arrays | No UI for browsing the ABA protocol library; markdown files not surfaced to practitioners in the app | 🟠 High |
| 4 | Progress & outcome reports | ❌ Not Started | Basic personal progress tracking exists; no report generation, PDF export, or outcome measurement | Need clinician-level reporting: client outcome summaries, session-by-session progress, export to PDF/CSV | 🔴 Critical |
| 5 | Individual practice | 🟡 Partial | `hasProfessionalAccess()` in `iatlasGating.js` gates professional tier; IATLASUnlockModal presents Practitioner as a valid tier | The "individual practice" concept is defined in gating logic but there is no practitioner workspace, client management, or practice-level account features | 🟠 High |

**Overall Practitioner Tier:** ~25% complete. The most differentiated features (clinical assessments, session plans, shareable client resources, outcome reports) are not built. The underlying content framework (IARF protocols) exists but lacks any practitioner-facing UI.

---

### IATLAS Practice ($399/mo)

> Source: `client/src/utils/iatlasGating.js` lines 92–103 (inherits Practitioner features)

| # | Feature | Status | Evidence | What's Missing | Priority |
|---|---------|--------|----------|---------------|----------|
| 1 | Everything in Practitioner | ❌ Not Started | Practitioner itself is ~25% complete | All Practitioner gaps apply | 🔴 Critical |
| 2 | Multi-practitioner access | ❌ Not Started | No multi-user practice account model; no invite system; no seat management | Organization model, practitioner seat limits, invite flow, role management | 🔴 Critical |
| 3 | Group practice management | ❌ Not Started | No group practice concept in codebase | Practice admin dashboard, shared client assignments, practitioner overview | 🔴 Critical |
| 4 | Team progress dashboard | ❌ Not Started | No team progress view for practices | Aggregate practitioner productivity, client outcome trends across practitioners | 🟠 High |

**Overall Practice Tier:** ~0% complete. This tier should not be advertised until Practitioner features are built and a multi-user account model exists.

---

### IATLAS Enterprise (Custom)

> Source: `client/src/utils/iatlasGating.js` lines 105–117 (inherits Practice features)

| # | Feature | Status | Evidence | What's Missing | Priority |
|---|---------|--------|----------|---------------|----------|
| 1 | Everything in Practice | ❌ Not Started | Practice tier is ~0% complete | All Practice gaps apply | 🔴 Critical |
| 2 | Custom onboarding | ❌ Not Started | No enterprise onboarding flow | Dedicated onboarding workflow, white-glove setup, org configuration | 🟡 Medium |
| 3 | Dedicated support | ❌ Not Started | No support tier routing | SLA-based support channel, dedicated account manager tooling | 🟡 Medium |
| 4 | Custom integrations | ❌ Not Started | No integration framework | API keys, webhook endpoints, EHR/LMS integration connectors | 🟢 Low |

**Overall Enterprise Tier:** ~0% complete. Enterprise is appropriately gated behind a "Contact Sales" model (no Stripe product needed per `IATLAS_STRIPE_SETUP.md`) but the contact-sales routing in the app UI is not confirmed as wired.

---

## 3. Detailed Findings

### Kids Curriculum

| Aspect | Status | Details |
|--------|--------|---------|
| Age groups (5–7, 8–10, 11–14, 15–18) | ✅ All 4 defined | `KIDS_AGE_GROUPS` in `client/src/data/iatlas/kidsActivities.js` lines 8–53 |
| 96+ activities claimed | ✅ Confirmed: exactly 96 | Counted programmatically from `KIDS_ACTIVITIES_BY_DIMENSION` — 4 activities × 4 age groups × 6 dimensions = 96 |
| 6 dimensions coverage | ✅ Complete | Agentic-Generative, Somatic-Regulative, Cognitive-Narrative (Interpretive), Relational-Connective, Emotional-Adaptive, Spiritual-Existential |
| Games (KidsGames hub) | ✅ Built | `client/src/components/KidsGames/KidsGamesHub.jsx`; 14 game/activity components: `ArenaBattles`, `BadgeQuestGame`, `BuilderBadges`, `MapCollector`, `NavigatorChallenges`, `NavigatorQuest`, `QuestLog`, `ResilienceMountain`, `TreasureExplorer`, etc. |
| Printable worksheets | 🟡 Partial | `CertificatePrinter.jsx` for achievement certificates; individual skill instructions are text-only; no print-optimized worksheet PDFs |
| Parent notes & tips | ✅ In data | Every activity in `kidsActivities.js` includes a `parentNote` field; `ParentDashboard.jsx` surfaces this |

### Adult Curriculum

| Aspect | Status | Details |
|--------|--------|---------|
| Foundation level modules | ✅ Present | All 6 dimensions have foundation-level modules |
| Building level modules | ✅ Present | All 6 dimensions have building-level modules |
| Mastery level modules | ✅ Present | All 6 dimensions have mastery-level modules |
| Total modules | ✅ 49 modules | Agentic: 9 · Somatic: 8 · Cognitive: 8 · Relational: 8 · Emotional: 8 · Spiritual: 8 |
| Interactive worksheets | ✅ Built | `WorksheetComponent.jsx` renders fillable forms; responses saved to `localStorage` |
| XP rewards per module | ✅ In data | Each module has `xpReward` field; integrated with `ProgressTracker.jsx` |
| Skill descriptions | ✅ Present | `learningObjective`, `whyItMatters` (with framework citations), `instructions` on every module |

### Caregiver Resources

| Aspect | Status | Details |
|--------|--------|---------|
| Seeded resources (DB) | ✅ 6 resources | `backend/scripts/seedClinicianCaregiverResources.js` — 6 caregiver resources (articles, videos, podcasts) |
| Parent dashboard | ✅ Built | `client/src/components/IATLAS/Kids/ParentDashboard.jsx` — shows child progress, badges, streaks |
| Parent guides (structured) | ❌ Not Started | No dedicated parent guide content type or curriculum; seed resources are general-purpose articles |
| Family challenge activities | ❌ Not Started | `kidsActivities.js` includes `parentNote` on every activity but no dedicated "family challenge" data type |

### Clinician Resources

| Aspect | Status | Details |
|--------|--------|---------|
| Seeded resources (DB) | ✅ 6 resources | `backend/scripts/seedClinicianCaregiverResources.js` — 6 clinician resources covering APA, ProQOL, Southwick, van der Kolk, Maslach, compassion satisfaction |
| Worksheet component | ✅ Built | `WorksheetComponent.jsx` renders interactive worksheets per skill module |
| ABA protocols (content) | ✅ In IARF | `IARF/curriculum/*/aba-protocols.md` present for all 6 dimensions |
| ABA protocols (UI) | ❌ Not Started | No practitioner-facing protocol browser or viewer in the app |
| Session plans | ❌ Not Started | No session plan builder, template system, or session note storage |
| Clinical assessment tools | ❌ Not Started | No intake forms, validated scales, or assessment administration flows |

---

## 4. Infrastructure Status

### Stripe Subscription Setup

| Component | Status | Evidence |
|-----------|--------|---------|
| IATLAS Stripe products (Individual–Practice) | 🟡 Requires setup | `IATLAS_STRIPE_SETUP.md` documents the manual setup steps; price IDs must be added to Railway env vars |
| Checkout session creation | ✅ Built | `backend/routes/iatlas-subscriptions.js` — `POST /api/iatlas/subscribe` |
| Subscription status endpoint | ✅ Built | `backend/routes/iatlas-subscriptions.js` — `GET /api/iatlas/subscription-status` |
| Cancel subscription endpoint | ✅ Built | `backend/routes/iatlas-subscriptions.js` — `POST /api/iatlas/cancel-subscription` |
| Webhook: `customer.subscription.created/updated` | ✅ Built | `backend/routes/payments.js` lines 655–679 — writes to `iatlas_subscriptions` |
| Webhook: `customer.subscription.deleted` | ✅ Built | `backend/routes/payments.js` lines 686–700 |
| Webhook: `invoice.payment_succeeded` | ✅ Built | `backend/routes/payments.js` lines 709–730 — writes to `iatlas_payments` |
| Webhook: `invoice.payment_failed` | ✅ Built | `backend/routes/payments.js` lines 733–750 — writes to `iatlas_payments` |
| Enterprise (contact sales) | 🟡 Partial | No Stripe product needed; contact-sales flow in IATLASUnlockModal needs verification |

Required Railway environment variables (not yet set):
```
STRIPE_IATLAS_INDIVIDUAL_PRICE_ID=price_xxx
STRIPE_IATLAS_FAMILY_PRICE_ID=price_xxx
STRIPE_IATLAS_COMPLETE_PRICE_ID=price_xxx
STRIPE_IATLAS_PRACTITIONER_PRICE_ID=price_xxx
STRIPE_IATLAS_PRACTICE_PRICE_ID=price_xxx
```

### MongoDB Collections

| Collection | Status | Schema Source |
|------------|--------|--------------|
| `iatlas_subscriptions` | ✅ Auto-created by webhook | `IATLAS_STRIPE_SETUP.md` lines 82–99; fields: `userId`, `tier`, `status`, `stripeSubscriptionId`, `stripeCustomerId`, `currentPeriodStart/End`, `cancelAtPeriodEnd` |
| `iatlas_payments` | ✅ Auto-created by webhook | `IATLAS_STRIPE_SETUP.md` lines 101–115; fields: `stripeInvoiceId`, `stripeSubscriptionId`, `amount`, `currency`, `status`, `paidAt/failedAt` |

### Auth0 / Tier Gating

| Component | Status | Evidence |
|-----------|--------|---------|
| Tier stored in localStorage | ✅ Built | `IATLAS_TIER_KEY = 'iatlas_tier'` in `iatlasGating.js` line 18 |
| `getIATLASTier()` | ✅ Built | `iatlasGating.js` lines 128–138 |
| `hasIATLASAccess()` | ✅ Built | `iatlasGating.js` lines 143–145 |
| `hasKidsAccess()` | ✅ Built | `iatlasGating.js` lines 151–161 — gates Individual+ tiers |
| `hasCaregiverAccess()` | ✅ Built | `iatlasGating.js` lines 167–175 — gates Family+ tiers |
| `hasProfessionalAccess()` | ✅ Built | `iatlasGating.js` lines 182–189 — gates Practitioner+ tiers |
| Server-side content gating | 🟡 Partial | JWT auth on subscription API routes; curriculum content itself served from client bundle (not server-gated) |
| Auth0 metadata sync for tier | 🟡 Partial | Subscription status endpoint (`/api/iatlas/subscription-status`) can be polled; no automatic localStorage hydration on login |

### API Routes (`/api/iatlas/*`)

| Route | Method | Status | File |
|-------|--------|--------|------|
| `/api/iatlas/subscribe` | POST | ✅ Built | `backend/routes/iatlas-subscriptions.js` |
| `/api/iatlas/subscription-status` | GET | ✅ Built | `backend/routes/iatlas-subscriptions.js` |
| `/api/iatlas/cancel-subscription` | POST | ✅ Built | `backend/routes/iatlas-subscriptions.js` |

Missing API routes:
- ❌ `/api/iatlas/profiles` — multi-child profile CRUD (Family tier)
- ❌ `/api/iatlas/family-dashboard` — aggregated family progress
- ❌ `/api/iatlas/clinical/assessments` — clinical assessment management
- ❌ `/api/iatlas/clinical/session-plans` — session plan CRUD
- ❌ `/api/iatlas/clinical/outcome-reports` — report generation
- ❌ `/api/iatlas/practice/members` — multi-practitioner seat management

---

## 5. Content Audit

### IARF Curriculum Directory (`IARF/curriculum/`)

All 6 dimensions have a consistent set of markdown files:

| File | All Dimensions | Status |
|------|---------------|--------|
| `README.md` | ✅ | Dimension overview, competencies, theoretical grounding |
| `skills-inventory.md` | ✅ | Full skills list across Foundation/Building/Mastery |
| `aba-protocols.md` | ✅ | ABA-informed protocols (shaping, reinforcement, self-monitoring) |
| `act-micropractices.md` | ✅ | ACT-based micro-practices for each dimension |
| `values-exercises.md` | ✅ | Values clarification and alignment exercises |
| `measurement.md` | ✅ | Validated scales and outcome measurement tools |

**Gap:** All 6 × 5 = 30 markdown files exist as practitioner content but **none are surfaced in the application UI**. A practitioner resource browser, protocol viewer, or session-planning tool must be built to expose this content.

### Kids Games Hub Components

All 14 components found in `client/src/components/KidsGames/`:

| Component | Description |
|-----------|-------------|
| `KidsGamesHub.jsx` | Main hub with age/category navigation |
| `ArenaBattles.jsx` | Competitive resilience challenges |
| `BadgeQuestGame.jsx` | Badge-earning quest game |
| `BadgeUnlockModal.jsx` | Badge unlock celebration |
| `BuilderBadges.jsx` | Badge collection display |
| `GameCard.jsx` | Individual game card component |
| `MapCollector.jsx` | World map exploration game |
| `NavigatorChallenges.jsx` | Challenge-based navigator activities |
| `NavigatorQuest.jsx` | Quest-based navigation adventures |
| `QuestLog.jsx` | Active quest tracking |
| `ResilienceMountain.jsx` | Mountain-climbing progress metaphor |
| `TreasureExplorer.jsx` | Treasure hunt resilience activities |
| `AgeSelector.jsx` | Age group picker |
| `CompassSpinner.jsx` | Loading/transition spinner |

### Gamification Data

| Item | File | Status |
|------|------|--------|
| Badges | `client/src/data/gamification/badges.js` | ✅ |
| Quests | `client/src/data/gamification/quests.js` | ✅ |
| Levels | `client/src/data/gamification/levels.js` | ✅ |
| Streak milestones | `client/src/data/gamification/streakMilestones.js` | ✅ |
| Kids badges | `client/src/data/kidsGameBadges.js`, `kidsBadges.js` | ✅ |
| Kids game quests | `client/src/data/kidsGameQuests.js` | ✅ |
| Kids game challenges | `client/src/data/kidsGameChallenges.js` | ✅ |
| Kids adventures | `client/src/data/kidsAdventures.js` | ✅ |
| Kids gamification rules | `client/src/data/kidsGamification.js` | ✅ |
| Kids video stories | `client/src/data/kidsVideoStories.js` | ✅ |

---

## 6. Gamification & Tracking

### Hooks

| Hook | File | Purpose | Status |
|------|------|---------|--------|
| `useKidsProgress` | `client/src/hooks/useKidsProgress.js` | Kids activity completion, star/level tracking | ✅ Built |
| `useKidsBadges` | `client/src/hooks/useKidsBadges.js` | Kids badge earning/display | ✅ Built |
| `useKidsStreaks` | `client/src/hooks/useKidsStreaks.js` | Kids daily streak tracking | ✅ Built |
| `useKidsAdventures` | `client/src/hooks/useKidsAdventures.js` | Adventure quest progress | ✅ Built |
| `useQuests` | `client/src/hooks/useQuests.js` | Adult quest tracking | ✅ Built |
| `useStreaks` | `client/src/hooks/useStreaks.js` | Adult streak tracking | ✅ Built |
| `useGamification` | `client/src/hooks/useGamification.js` | Adult gamification state | ✅ Built |
| `useBadges` | `client/src/hooks/useBadges.js` | Adult badge management | ✅ Built |
| `useXP` | `client/src/hooks/useXP.js` | XP accumulation and level-up | ✅ Built |
| `useUnlockPayment` | `client/src/hooks/useUnlockPayment.js` | Stripe checkout trigger | ✅ Built |

### Components

| Component | File | Status |
|-----------|------|--------|
| IATLAS Progress Dashboard | `client/src/components/Gamification/IATLASProgressDashboard.jsx` | ✅ Built |
| Streak Tracker | `client/src/components/Gamification/StreakTracker.jsx` | ✅ Built |
| XP Progress Bar | `client/src/components/Gamification/XPProgressBar.jsx` | ✅ Built |
| Badge Gallery (adult) | `client/src/components/Gamification/BadgeGallery.jsx` | ✅ Built |
| Badge Card | `client/src/components/Gamification/BadgeCard.jsx` | ✅ Built |
| Badge Unlock Modal | `client/src/components/Gamification/BadgeUnlockModal.jsx` | ✅ Built |
| Level Up Modal | `client/src/components/Gamification/LevelUpModal.jsx` | ✅ Built |
| Quest Board | `client/src/components/Gamification/QuestBoard.jsx` | ✅ Built |
| Stats Card | `client/src/components/Gamification/StatsCard.jsx` | ✅ Built |
| Activity Feed | `client/src/components/Gamification/ActivityFeed.jsx` | ✅ Built |
| Kids Progress Dashboard | `client/src/components/IATLAS/Kids/KidsProgressDashboard.jsx` | ✅ Built |
| Parent Dashboard | `client/src/components/IATLAS/Kids/ParentDashboard.jsx` | ✅ Built |
| Kids Dimension Progress | `client/src/components/IATLAS/Kids/DimensionProgress.jsx` | ✅ Built |
| Streak Flame | `client/src/components/IATLAS/Kids/StreakFlame.jsx` | ✅ Built |

**Gamification is one of the best-built areas** of IATLAS. XP, badges, streaks, quests, level-ups, and activity feeds are all implemented. The gap is in connecting this system to multi-profile (Family) and clinical reporting (Practitioner).

### Storage Architecture Note

All progress is currently stored in `localStorage` (client-only). This means:
- ✅ Works immediately without backend changes
- ❌ Progress is lost if a user clears their browser
- ❌ Progress cannot be accessed across devices
- ❌ Multi-child profiles require localStorage key namespacing or backend storage
- 🟠 For Practitioner tier, client outcome data **must** move to the backend

---

## 7. Development Priorities

### Tier 1 — Critical (Blocks Sales)

These gaps mean the advertised features simply don't exist. Advertising them creates customer disappointment and chargeback risk.

| Priority | Feature | Tier Affected | Estimated Effort | Recommended Sprint |
|----------|---------|--------------|-----------------|-------------------|
| 🔴 P1 | Multi-child profile system (up to 5 profiles) | Family | 2–3 weeks | Sprint 1 |
| 🔴 P2 | Shared / family progress dashboard | Family | 1–2 weeks | Sprint 1 |
| 🔴 P3 | Clinical assessment & session plan UI | Practitioner | 3–4 weeks | Sprint 2 |
| 🔴 P4 | Progress & outcome report generation | Practitioner | 2–3 weeks | Sprint 2 |
| 🔴 P5 | ABA protocol library browser (surface IARF content) | Practitioner | 1 week | Sprint 2 |
| 🔴 P6 | Multi-practitioner seat management (Practice) | Practice | 4–5 weeks | Sprint 3 |
| 🔴 P7 | Group practice admin dashboard | Practice | 3–4 weeks | Sprint 3 |

### Tier 2 — High (Expected for Customer Satisfaction)

These features are partially built or implied by the tier; customers will expect them early.

| Priority | Feature | Tier Affected | Estimated Effort | Recommended Sprint |
|----------|---------|--------------|-----------------|-------------------|
| 🟠 P8 | Printable worksheets for kids activities | Individual | 1 week | Sprint 1 |
| 🟠 P9 | Named child profile creation UI | Individual/Family | 1 week | Sprint 1 |
| 🟠 P10 | Advanced progress analytics (charts, trends) | Complete | 2 weeks | Sprint 2 |
| 🟠 P11 | Shareable / client-facing worksheet export | Practitioner | 1 week | Sprint 2 |
| 🟠 P12 | Parent guides as structured content (not just seed resources) | Family | 2 weeks | Sprint 2 |
| 🟠 P13 | Backend progress persistence (move from localStorage) | All paid | 3–4 weeks | Sprint 2–3 |
| 🟠 P14 | Auth0 login → automatic tier sync from backend | All paid | 1 week | Sprint 1 |

### Tier 3 — Medium / Low (Enhancement)

Nice-to-have features that improve the experience but aren't blockers.

| Priority | Feature | Tier Affected | Estimated Effort |
|----------|---------|--------------|-----------------|
| 🟡 P15 | Family challenge activities (dedicated content type) | Family | 1–2 weeks |
| 🟡 P16 | Priority support routing (Complete tier detection) | Complete | < 1 week |
| 🟡 P17 | Team progress dashboard (cross-practitioner view) | Practice | 2–3 weeks |
| 🟡 P18 | Enterprise contact-sales flow confirmation/wiring | Enterprise | < 1 week |
| 🟢 P19 | Custom integrations framework (API keys, webhooks) | Enterprise | 5+ weeks |
| 🟢 P20 | Custom onboarding workflow tooling | Enterprise | 3+ weeks |

---

## 8. Recommendations

### Features to Build Next (Next 3 Months)

**Month 1 — Unblock Family Tier**

1. **Multi-child profile system** — Design a `ChildProfile` model (name, avatar, age group, created date). Store profiles in `localStorage` namespaced by profile ID, with a backend sync API (`/api/iatlas/profiles`). Build a profile selector in the Kids landing page header. Cap at 5 profiles for Family tier (enforce in frontend gating).
2. **Named profile creation UI** — Simple "Add Child" modal with name, age group, and avatar picker.
3. **Shared progress dashboard** — Extend `ParentDashboard.jsx` to aggregate across all child profiles. Show total stars, current streaks, and dimension coverage per child in a grid.
4. **Printable worksheets** — Add a print stylesheet to `WorksheetComponent.jsx` and `ActivityCard` components. Generate a print-optimized view of each activity's instructions and materials list.
5. **Auth0 tier sync** — On user login, call `/api/iatlas/subscription-status` and write the result to `localStorage`. This ensures tier is server-verified on each session start.

**Month 2 — Build Practitioner Foundation**

6. **ABA protocol library UI** — Create a `PractitionerProtocolLibrary` page that renders the IARF markdown files (`IARF/curriculum/*/aba-protocols.md`) with dimension filtering, search, and a clean reading experience.
7. **Session plan builder** — Lightweight session plan template: client name/ID, date, session goals, selected activities/protocols from the library, notes. Store in MongoDB via a new `/api/iatlas/clinical/session-plans` route.
8. **Shareable worksheet export** — Add a "Share with Client" button to worksheet responses that generates a printable/PDF version. Use the browser `print()` API or a lightweight PDF library.
9. **Advanced progress analytics** — Build chart components (using Chart.js or Recharts — already likely in the dependency tree) for dimension completion over time, XP trend, and streak history. Gate behind Complete tier.
10. **Progress persistence to backend** — Create a `/api/iatlas/progress` endpoint to sync `localStorage` progress to MongoDB. Implement on module completion events.

**Month 3 — Practice Tier & Reporting**

11. **Clinical outcome reports** — Generate a structured PDF/HTML report summarizing a client's completed modules, XP earned, skills by dimension, and progress over time. Gate behind Practitioner+.
12. **Multi-practitioner account model** — Extend the User model with a `practiceId` reference. Build practice creation, practitioner invite flow, and seat management page. Cap at unlimited for Practice tier.
13. **Group practice management dashboard** — Admin view for practice owners: list of practitioners, their active clients, overall practice statistics.

### Features to Remove from Advertising Until Ready

Until these features are built, remove them from pricing pages and tier description modals to avoid customer disappointment:

| Feature | Tier | Action |
|---------|------|--------|
| Up to 5 child profiles | Family | 🚫 Remove or mark "Coming Soon" in `IATLAS_TIER_CONFIG` description |
| Shared progress dashboard | Family | 🚫 Remove or mark "Coming Soon" |
| Family challenge activities | Family | 🚫 Remove or mark "Coming Soon" |
| Advanced progress analytics | Complete | 🚫 Remove or mark "Coming Soon" |
| Clinical assessments & session plans | Practitioner | 🚫 Remove or mark "Coming Soon" |
| Progress & outcome reports | Practitioner | 🚫 Remove or mark "Coming Soon" |
| Multi-practitioner access | Practice | 🚫 Remove or mark "Coming Soon" |
| Group practice management | Practice | 🚫 Remove or mark "Coming Soon" |
| Team progress dashboard | Practice | 🚫 Remove or mark "Coming Soon" |
| All Practice & Enterprise features | Practice/Enterprise | 🚫 Mark entire tiers "Coming Soon" |

**Recommended interim copy for `IATLAS_TIER_CONFIG`:**
- Add a `comingSoon: true` flag to `practice` and `enterprise` tier configs
- Update `IATLASUnlockModal.jsx` to display a "Coming Soon — Join Waitlist" CTA for these tiers instead of a Stripe checkout button
- This prevents selling tiers that can't be fulfilled while keeping the pricing page visible for marketing awareness

### Estimated Dev Effort Summary

| Area | Estimated Effort |
|------|-----------------|
| Multi-child profile system (Family) | 2–3 weeks |
| Shared/family dashboard | 1–2 weeks |
| Printable resources + auth sync | 1 week |
| ABA protocol library UI | 1 week |
| Session plan builder | 2 weeks |
| Advanced analytics (Complete) | 2 weeks |
| Backend progress persistence | 3–4 weeks |
| Clinical outcome reports | 2–3 weeks |
| Multi-practitioner / Practice tier | 4–5 weeks |
| **Total (3-month roadmap)** | **~18–23 developer-weeks** |

---

*Document prepared from codebase analysis of commit state as of April 2026. File references use paths relative to the repository root.*
