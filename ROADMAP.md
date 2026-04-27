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

### #22e — Progress Tracking Dashboard ⬜
Practitioner view of client progress over time.

### #22f — Client Outcome Reports ⬜
Completion-based outcome reporting.

---

## Task #24 — Activity Search & Filter ✅ (PR #611)
IATLAS activity catalog search with keyword, category, and age-group filtering.
