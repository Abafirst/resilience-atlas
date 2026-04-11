# Teams Admin Guide — Internal Reference

_Last updated: 2026-04-11_

---

## 1. How Tiers Are Determined

Teams plan tiers are stored in the `Organization.plan` field. Valid values are:

| `org.plan` value | Canonical tier | Max users | Max teams | Key gates |
|---|---|---|---|---|
| `free` | free | 1 | 0 | — |
| `business` | business | 25 | 1 | basic |
| `teams-starter` | starter | **15** | 1 | basic |
| `teams-pro` | pro | **30** | unlimited | basic, advanced, multi-team, facilitation |
| `enterprise` | enterprise | **unlimited** | unlimited | basic, advanced, multi-team, facilitation, branding, sso, data-export, **org-gamification** |

The canonical tier (resolved via `PLAN_ALIASES` in `backend/config/tiers.js`) is used by `canAccessFeature(plan, gate)` in `backend/utils/tierUtils.js`.

> **Single source of truth:** Always read limits and gates from `backend/config/tiers.js`. Never hardcode plan names or seat limits in route handlers.

---

## 2. How Seat Limits Are Enforced

**Relevant file:** `backend/routes/organization.js` — `POST /api/org/:organizationId/invite`

### What counts as a "seat"

A seat is any user invited to or active in an org:
- **Active members** — `User.countDocuments({ organization_id: orgId })`
- **Pending invites** — `Invite.countDocuments({ organizationId: orgId, status: 'pending' })`
- **Legacy invited emails** — `org.invitedEmails.length` (tracked for backward compatibility)

The effective seat count is the maximum of these three values.

### Enforcement logic

1. When `POST /api/org/:orgId/invite` is called, the handler:
   - Resolves the tier via `getTierConfig(org.plan || org.tier)`.
   - Reads `maxUsers` from the tier config.
   - Counts current seats (as above).
   - Identifies **new** emails (not already in `org.invitedEmails`).
   - If `currentSeats + newEmails.length > maxUsers`, returns **HTTP 422** with:
     ```json
     {
       "error": "Seat limit reached. Your Atlas Team Basic allows up to 15 users…",
       "seats_used": 12,
       "seats_max": 15,
       "new_invites_requested": 4
     }
     ```
2. Re-inviting an existing email does **not** consume a new seat (upsert logic).
3. Enterprise plan has `maxUsers: Infinity` — the limit check is skipped.

---

## 3. Using the Admin UI for Teams + Gamification

### Self-service Team Management

**Route:** `/team-management/:orgId`

**Access:** Must be an org admin (appears in `org.admins` array).

**Features:**
- **View roster** — lists all users with `organization_id === orgId`.
- **Invite members** — enter emails one per line or comma-separated. Bulk supported. Seat limits are enforced server-side.
- **Assign roles** — toggle Admin / Member via `PUT /api/orgs-advanced/:orgId/roles/:userId`.
- **Pending invitations** — shows all emails in `org.invitedEmails` not yet accepted.

---

### Enterprise Full Gamification Suite

**Route:** `/org-gamification/:orgId`

**Access:** Enterprise plan required (`org-gamification` feature gate). Must be an org admin or member.

#### Custom Badges (Admin)

1. Go to the **Badges** tab.
2. Enter a name, optional description, and emoji icon.
3. Click **Create Badge** — creates a badge definition via `POST /api/org-gamification/:orgId/badges`.
4. To award a badge to a user: click **Award**, enter the user's Auth0 `sub` ID or email.
5. To retire a badge (soft-delete, preserves award history): click **Retire**.

**Endpoints:**
| Method | Path | Who |
|---|---|---|
| GET | `/api/org-gamification/:orgId/badges` | Admin + Member |
| POST | `/api/org-gamification/:orgId/badges` | Admin |
| PUT | `/api/org-gamification/:orgId/badges/:badgeId` | Admin |
| DELETE | `/api/org-gamification/:orgId/badges/:badgeId` | Admin (retires) |
| POST | `/api/org-gamification/:orgId/badges/:badgeId/award` | Admin |
| GET | `/api/org-gamification/:orgId/my-badges` | Authenticated member |

#### Unlimited Challenges (Admin + Member)

1. Go to the **Challenges** tab.
2. Admin: Enter title, description, optional resilience dimension, point value, and optional date window. Click **Create Challenge**.
3. Members: View active challenges, click **Mark Complete** to record completion.
4. Admin can **Deactivate** a challenge when it ends.

**Endpoints:**
| Method | Path | Who |
|---|---|---|
| GET | `/api/org-gamification/:orgId/challenges` | Admin + Member |
| POST | `/api/org-gamification/:orgId/challenges` | Admin |
| PUT | `/api/org-gamification/:orgId/challenges/:id` | Admin |
| DELETE | `/api/org-gamification/:orgId/challenges/:id` | Admin (deactivates) |
| POST | `/api/org-gamification/:orgId/challenges/:id/complete` | Member |

#### Org-Wide Leaderboard

1. Go to the **Leaderboard** tab.
2. Displays all org members ranked by total challenge completion points (descending).
3. Also shows badge count per user.

**Endpoint:** `GET /api/org-gamification/:orgId/leaderboard?limit=20`

---

## 4. How to Enable SSO for an Org

SSO/SAML is available on Enterprise plans and is **enabled by the ops/engineering team** — it is not self-serve.

### Process

1. **Customer submits Enterprise inquiry** via the Teams Landing Page form or contacts sales.
2. **Ops** creates an Auth0 connection (SAML/OIDC) for the customer's IdP (e.g. Okta, AzureAD).
3. **Ops** sets the environment variable `SSO_CONNECTION_<ORG_SLUG>` (or equivalent) to route the org's domain to the correct Auth0 connection.
4. **Customer** authenticates via `/api/sso/lookup?email=user@theirdomain.com` — the endpoint returns the Auth0 connection to use, and the client forces that connection on login.

### Domain routing

The `/api/sso/lookup` endpoint (`backend/routes/sso.js`) maps email domains to Auth0 connection names. This mapping is currently managed via environment variables or a config table — not via a self-serve admin UI.

> **Copy commitment:** The Teams Landing Page now says _"SSO/SAML available — enabled on request"_ which accurately reflects this ops-managed process.

---

## 5. Export Policy

| Plan | CSV export | PDF team report |
|---|---|---|
| Free | ❌ | ❌ |
| Teams Basic (teams-starter) | ✅ (`basic` gate) | ❌ |
| Teams Premium (teams-pro) | ✅ | ✅ (`advanced` gate) |
| Enterprise | ✅ | ✅ |

Both endpoints (`POST /api/organizations/:id/export/csv` and `POST /api/organizations/:id/export/pdf`) check `canAccessFeature(org.plan, gate)` server-side. Admin role is also required.

PDF is generated using **puppeteer** — renders an HTML template to a PDF buffer with `Content-Type: application/pdf`.

---

## 6. Marketing Claims — Truth Table

This section maps every claim on the Teams Landing Page to its implementation status.

| Claim | Plan | Implemented? | Notes |
|---|---|---|---|
| Up to 15 users | Basic | ✅ | Enforced in invite handler |
| Up to 30 users | Premium | ✅ | Enforced in invite handler |
| Unlimited users | Enterprise | ✅ | `maxUsers: Infinity` |
| Team badges, streaks, milestones | Basic | ✅ | Individual gamification system |
| Leaderboards, progress dashboards, member dashboards | Basic | ✅ | Dashboard + individual leaderboard |
| Self-service CSV & PDF export | Basic | ✅ (CSV) | Basic: CSV only; PDF requires Premium |
| Bulk email invitations | Basic | ✅ | `POST /api/org/:id/invite` |
| Advanced team challenges, achievement tracking | Premium | ✅ | Gamification service |
| Cross-team leaderboards, dimension breakdowns | Premium | ✅ | comparisons.js + analytics |
| Manager dashboards: team member tracking | Premium | ✅ | Org dashboard + team analytics |
| Advanced analytics (downloadable) | Premium | ✅ | CSV export |
| Auto-generated team reports (PDF) | Premium | ✅ | puppeteer PDF generation |
| Facilitation tools & resource library (30+ guides) | Premium | ✅ | Teams resources |
| Self-service team management | Premium | ✅ | `/team-management/:orgId` UI |
| Full Gamification Suite: custom badges, unlimited challenges, org-wide leaderboards | Enterprise | ✅ | `/org-gamification/:orgId` |
| Advanced manager/admin dashboards, up-to-date analytics | Enterprise | ✅ | Org dashboard + analytics |
| Org-managed branding (logos, colors) | Enterprise | ✅ | `branding` gate in org-advanced.js |
| SSO/SAML available — enabled on request | Enterprise | ✅ | Ops-managed, sso.js routing |
| Self-service data export | Enterprise | ✅ | CSV + PDF export endpoints |
| Self-custody: export and own your data | Enterprise | ✅ | Export endpoints + data download |
