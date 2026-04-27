# IATLAS Platform Roadmap

## Task #22: Practitioner Clinical Workflow

### #22a — Client Profile Management ✅ (PR #608)
Full HIPAA-compliant client profile CRUD with encryption and audit logging.

### #22b — Session Template Builder ✅ (PR #609)
Reusable session template library with encrypted content and public/private sharing.

### #22c — Session Notes Integration ✅
SOAP-format session notes for practitioners to document client sessions.

**Implementation details:**
- **Models:** `backend/models/SessionNote.js`, `backend/models/SessionNoteAuditLog.js`
- **Routes:** `backend/routes/clinical/sessionNotes.js`
  - `POST /api/clinical/session-notes` — Create draft note
  - `GET /api/clinical/session-notes?client_profile_id=` — List notes (summary, no SOAP decryption)
  - `GET /api/clinical/session-notes/:id` — Get single note (SOAP fields decrypted)
  - `PATCH /api/clinical/session-notes/:id` — Update / finalize note
  - `DELETE /api/clinical/session-notes/:id` — Soft-delete (drafts only)
  - `POST /api/clinical/session-notes/:id/activities` — Add activity link
  - `DELETE /api/clinical/session-notes/:id/activities/:activityLinkId` — Remove activity link

**Encryption approach:**
- SOAP fields (`subjective`, `objective`, `assessment`, `plan`) are encrypted at rest with AES-256-CBC.
- Encryption key provided via `SESSION_NOTES_ENCRYPTION_KEY` environment variable (hex-encoded 32-byte key).
- Ciphertext format: `enc:<iv_hex>:<ciphertext_hex>`.
- Falls back to plain-text storage in development when no key is configured.

**Audit logging:**
- Every `created`, `viewed`, `edited`, `finalized`, and `deleted` action is recorded in `SessionNoteAuditLog`.
- Log entries include: `sessionNoteId`, `practitionerId`, `action`, `ipAddress`, `userAgent`.
- Finalized notes are immutable (cannot be edited or deleted) to preserve the HIPAA audit trail.

**Access control:**
- Requires Practitioner, Practice, or Enterprise subscription tier.
- Practitioners can only access notes for client profiles they own.
- 403 returned on any cross-practitioner access attempt.

**SOAP note format reference:**
- **S**ubjective — Client's perspective and self-reported symptoms.
- **O**bjective — Practitioner's observations and measurable data.
- **A**ssessment — Clinical analysis and diagnosis.
- **P**lan — Treatment plan and next steps.

**Tests:** `tests/session-notes.test.js`

---

### #22d — Activity Selection by Client Profile ✅

Intelligent activity selection and recommendation system for practitioners.

**Implementation details:**

- **Models:**
  - `backend/models/ClientActivityFavorites.js` — Per-client activity favourites (one doc per practitioner+client pair; embedded array)
  - `backend/models/ClientActivityHistory.js` — Activity usage history with optional effectiveness ratings (1–5) and notes

- **Recommendation algorithm:** `backend/utils/activityRecommendations.js`
  - Scores activities 0–100 based on:
    - **Age appropriateness** (+20, hard gate — activities outside age range are excluded)
    - **Goal alignment** (+10 per matched goal, up to +30)
    - **Sensory preference match** (+10 per match, up to +20)
    - **Favourite boost** (+15)
    - **Historical effectiveness** (+rating × 3, up to +15)
    - **Recency penalty** (−10 when used < 7 days ago, to encourage variety)

- **Routes:** `backend/routes/clinical/clientActivities.js` mounted at `/api/clinical/clients/:id`
  - `GET  /recommended-activities`           — Smart ranked recommendations
  - `GET  /activity-favorites`              — List client's favourited activities
  - `POST /activity-favorites`              — Add activity to favourites
  - `DELETE /activity-favorites/:activityId` — Remove from favourites
  - `GET  /activity-history`               — List activity usage history
  - `POST /activity-history`               — Record activity usage
  - `PATCH /activity-history/:historyId`   — Update effectiveness rating / notes
  - `GET  /activity-stats`                 — Aggregated usage statistics

- **Effectiveness rating workflow:** Practitioners rate each activity 1–5 after a session via `PATCH /activity-history/:historyId`. Ratings feed back into future recommendations.

- **Access control:** Requires Practitioner, Practice, or Enterprise tier; every route enforces client-profile ownership.

- **Tests:** `tests/client-activity-selection.test.js` (35 tests)

### #22e — Progress Tracking Dashboard ✅
Practitioner view of client progress over time with dimension analytics, milestone tracking, and aggregate dashboard insights.

**Implementation details:**

- **Models:**
  - `backend/models/ClientProgressSnapshot.js` — Point-in-time resilience dimension score snapshots (manual or post-assessment)
  - `backend/models/ClientMilestone.js` — Milestone achievements (goal_achieved, skill_mastered, behavior_improved, session_count, custom)
  - `backend/models/PractitionerDashboardSettings.js` — Per-practitioner dashboard preferences (date range, favourite metrics, alert preferences)

- **Utility functions:**
  - `backend/utils/progressCalculations.js`
    - `calculateOverallProgress(baseline, current)` — Average improvement across 6 dimensions
    - `calculateProgressTrend(snapshots)` — `'improving'` / `'stable'` / `'declining'` based on score history
    - `calculateOverallScore(dimensionScores)` — Mean of all 6 dimension values
    - `calculateSessionFrequency(dates, rangeInDays)` — Sessions-per-week + consistency score
    - `buildTimelineDataPoints(snapshots, granularity)` — Daily / weekly / monthly data series for charting
    - `buildDimensionChanges(baseline, current)` — Per-dimension change objects
    - `dateRangeToCutoff(range)` — Convert `'30_days'` etc. to a `Date` cutoff
  - `backend/utils/clientAlerts.js`
    - `noRecentSessionAlert` — Fires when last session > 14 days ago
    - `decliningProgressAlert` — Fires when trend is `'declining'`
    - `goalAtRiskAlerts` — Fires for active goals with no update in 30+ days
    - `generateClientAlerts` — Aggregates all alert types for a single client

- **Routes:**
  - `backend/routes/clinical/clientProgress.js` mounted at `/api/clinical/clients/:id`
    - `GET  /progress-overview`             — Comprehensive progress summary (sessions, activities, goals, milestones, dimensions)
    - `GET  /progress-timeline`             — Time-series data points for charting (metric + granularity params)
    - `POST /progress-snapshots`            — Create a dimension-score snapshot
    - `GET  /progress-snapshots`            — List snapshots with trend analysis
    - `POST /milestones`                    — Record a client milestone
    - `GET  /milestones`                    — List milestones (newest first)
    - `GET  /activity-effectiveness-trends` — Per-activity and category effectiveness analysis
    - `GET  /session-frequency-analysis`    — Sessions per week/month + gap detection
    - `GET  /goal-progress-report`          — Goal breakdown with at-risk flags
  - `backend/routes/clinical/practitionerDashboard.js` mounted at `/api/clinical/dashboard`
    - `GET   /alerts`          — Cross-client alerts (no_recent_session, declining_progress, goal_at_risk)
    - `GET   /aggregate-stats` — Caseload-wide stats (active clients, sessions this month, avg progress, top activities)
    - `GET   /settings`        — Retrieve practitioner dashboard preferences
    - `PATCH /settings`        — Update dashboard preferences (date range, favourite metrics, alert prefs)

**Progress tracking methodology:**
- Snapshots record all 6 resilience dimension scores at a point in time
- Trend analysis compares the mean overall score of the older half vs. newer half of snapshots; >5 point difference signals improving/declining
- Activity effectiveness is rated 1–5 per session and averaged per activity over time
- Alert thresholds: no session in 14+ days = high priority; declining trend = medium; goal stale 30+ days = low

**Alert system logic:**
- Alerts are generated on-demand (not persisted) by comparing current state against thresholds
- `generateClientAlerts()` is pure (no DB access) and composable with any data source
- Dashboard `/alerts` aggregates across all active clients for a practitioner

**Access control:**
- Requires Practitioner, Practice, or Enterprise subscription tier
- All client-scoped routes verify `practitionerId` ownership before returning data
- Dashboard routes scope queries to the authenticated practitioner's clients only

**Tests:** `tests/progress-tracking.test.js` (59 tests covering utility functions, API routes, and access control)

### #22f — Client Outcome Reports ✅
Comprehensive outcome reporting system that generates professional PDF reports at session milestones, showing client progress across all 6 resilience dimensions with before/after comparisons, goal achievement documentation, and session highlights.

**Implementation details:**

- **Model:** `backend/models/OutcomeReport.js`
  - Stores generated report metadata (period, scores, goal counts, audit trail, email delivery log)
  - `practitionerId`, `clientProfileId`, `reportType`, `periodStart/End`, `totalSessions`, `baselineScores`, `currentScores`, `goalsAchieved`, `goalsInProgress`, `isAnonymized`, `accessedBy[]`, `sentToEmails[]`, `generatedAt`
  - Four report types: `insurance`, `family`, `school`, `summary`

- **Utility functions:** `backend/utils/outcomeReportUtils.js`
  - `computeBaselineScores(snapshots, n)` — average of first n snapshots
  - `computeCurrentScores(snapshots, n)` — average of last n snapshots
  - `buildDimensionProgress(baseline, current)` — per-dimension change objects with label, change, pctChange
  - `countGoalsByStatus(goals)` — counts achieved / in-progress / total
  - `topActivities(sessionNotes, limit)` — most-used activities ranked by usage count
  - `isMilestoneTrigger(totalSessions)` — true at 10, 20, 50, 100 sessions
  - `dimensionNarrative(dimProgress)` — auto-generated one-line summary per dimension
  - `changeColour(change)` — `'green'` / `'yellow'` / `'red'` indicator

- **Routes:** `backend/routes/clinical/outcomeReports.js` mounted at `/api/clinical/outcome-reports`
  - `POST /generate` — Generate new outcome report PDF (streams PDF, persists metadata, sets `X-Report-Id` header)
  - `GET /client/:clientId` — List all reports for a client (ownership-verified)
  - `GET /:reportId` — Retrieve report metadata + HIPAA audit log entry
  - `POST /:reportId/send` — Email report to recipient via SMTP (nodemailer)
  - `POST /bulk-generate` — Generate reports for multiple clients in one request

**Report content sections:**
- Confidential header/footer watermarks
- Client summary (name / anonymised ID, date range, total sessions, practitioner)
- Dimension progress analysis: baseline → current per dimension with colour indicators (green/yellow/red) and auto-narrative
- Goal achievement table: ✅ achieved, 🔄 in-progress, ⏸ other
- Session highlights: top activities by usage, key milestones
- Recommendations: focus areas based on lowest-change dimensions

**PDF generation:** pdfkit (already a dependency); PDF streamed directly in the HTTP response.

**Email delivery:** nodemailer with configurable SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`); gracefully falls back when SMTP is not configured.

**HIPAA compliance:**
- `accessedBy` array records every practitioner who retrieved a report
- `sentToEmails` records every delivery
- `isAnonymized` flag replaces client name with a short ID code
- All routes enforce practitioner-tier access + ownership verification

**Automated triggers:** `isMilestoneTrigger()` utility returns `true` at 10, 20, 50, and 100 sessions; callers (e.g. session-creation hooks) can invoke `/generate` when the count matches.

**Tests:** `tests/outcome-reports.test.js`

---

## Task #24 — Activity Search & Filter ✅ (PR #611)
IATLAS activity catalog search with keyword, category, and age-group filtering.
