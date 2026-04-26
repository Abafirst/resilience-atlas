# Teams Section Migration: Legacy HTML → React SPA

## Overview

The Teams section has been fully migrated from legacy static HTML/JS files in
`public/` to the React SPA located in `client/src/pages/`.

## Canonical Routes

All Teams URLs are now served by the React SPA (`client/dist/index.html`) and
rendered by React Router:

| URL | React Component |
|-----|----------------|
| `/teams` | `TeamsLandingPage.jsx` |
| `/teams/activities` | `TeamsActivitiesPage.jsx` |
| `/teams/resources` | `TeamsResourcesPage.jsx` |
| `/teams/facilitation` | `TeamsFacilitationPage.jsx` |
| `/pricing-teams` | `PricingTeamsPage.jsx` |

## Routing Behavior

In `backend/server.js`, explicit routes for `/teams` and `/teams/*` are
registered **before** the `express.static(public)` middleware.  This guarantees
that the legacy HTML files in `public/` are never accidentally served for any
`/teams` path.

Legacy and flat paths are permanently redirected (HTTP 301):

| Old URL | Redirects to |
|---------|-------------|
| `/teams-activities.html` | `/teams/activities` |
| `/teams-resources.html` | `/teams/resources` |
| `/teams-facilitation.html` | `/teams/facilitation` |
| `/teams-activities` | `/teams/activities` |
| `/teams-resources` | `/teams/resources` |
| `/teams-facilitation` | `/teams/facilitation` |
| `/team` | `/teams` (pre-existing) |
| `/team.html` | `/teams` (pre-existing) |

## Legacy Files (Deprecated)

The following files remain in the repository for reference but are **not
reachable** via any active route:

- `public/teams-activities.html`
- `public/teams-resources.html`
- `public/teams-facilitation.html`
- `public/js/teams-activities.js`
- `public/js/teams-resources.js`
- `public/js/teams-facilitation.js`
- `public/js/teams-tracker.js`
- `public/js/teams-content.js`
- `public/js/teams-access.js`
- `public/css/teams-enhanced.css`

These files may be removed in a future clean-up PR once the migration is
confirmed stable in production.

## Where Teams Pages Live in React

```
client/src/pages/
  TeamsLandingPage.jsx      – /teams landing page
  TeamsActivitiesPage.jsx   – activities library
  TeamsResourcesPage.jsx    – resource downloads
  TeamsFacilitationPage.jsx – facilitation guides
  PricingTeamsPage.jsx      – /pricing-teams

client/src/data/
  teamsContent.js           – shared Teams content/data

client/src/styles/
  teams-enhanced.css        – Teams-specific styles (also imported in App.jsx)
```

## API Routes

Backend Teams API routes are mounted at `/api/teams` and remain unchanged:

- `GET /api/teams/access` – verify purchase/tier access
- `GET /api/teams/download/:resourceId` – stream PDF download for authorized users

## Tier Gating Rules

Tiers (internal strings): `starter` (Basic), `pro` (Premium), `enterprise` (Enterprise).
Access hierarchy: Enterprise ≥ Premium ≥ Basic.

| Resource category | IDs | Min tier |
|---|---|---|
| Workshop Guides | hand-001 – hand-006 | `pro` (Premium) |
| Templates | hand-007 – hand-009, hand-011, hand-016 | `starter` (Basic) |
| Discussion Prompt Sheets | hand-010 | `starter` (Basic) |
| Activity Cards | hand-014, hand-015 | `starter` (Basic) |
| Facilitation / Bonus | hand-012, hand-013, hand-017 | `starter` (Basic) |
| Visuals (basic) | vis-001, vis-002, vis-014 | `starter` (Basic) |
| Visuals (premium) | vis-003 – vis-012 | `pro` (Premium) |
| Visuals (enterprise) | vis-013 | `enterprise` (Enterprise) |

Per-resource enforcement is implemented in `backend/routes/teams-resources.js`
via the `RESOURCE_MIN_TIERS` map and `tierMeetsRequirement()` helper.
The frontend catalog at `client/src/data/teamsContent.js` mirrors these `minTier`
values for UI badge display.

## Regression Tests

Tests in `tests/server.test.js` verify:

1. Each legacy `.html` URL redirects (301) to the canonical `/teams/*` path.
2. Each flat `/teams-*` path redirects (301) to the canonical `/teams/*` path.
3. `/teams`, `/teams/activities`, `/teams/resources`, `/teams/facilitation` return
   the SPA HTML and **not** legacy HTML containing inline `teams-*.js` script tags.
