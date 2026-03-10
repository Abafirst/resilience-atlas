# Resilience Atlas

> ⭐ **This is the official, canonical repository for Resilience Atlas.**
> All development, deployments, and issues should be managed here.
> Any other repositories with a similar name are outdated and should be **archived** — see the note at the bottom of this file for instructions.

A comprehensive digital assessment tool for measuring personal resilience across six dimensions.

## Overview

Resilience Atlas helps individuals understand their resilience profile through a science-backed 36-question assessment. Users receive personalized insights, visual reports, and actionable recommendations for growth.

## The Six Resilience Dimensions

1. **Cognitive-Narrative** — Meaning-making and reframing through narrative
2. **Relational** — Strength from connections and supportive relationships
3. **Agentic-Generative** — Purposeful action and creating change
4. **Emotional-Adaptive** — Flexibility in managing emotions
5. **Spiritual-Existential** — Purpose, values, and sense of meaning
6. **Somatic-Behavioral** — Body awareness and behavioral practices

## Scoring Model

- **36 questions** on a 1–5 Likert scale
- **6 dimensions** scored independently (6 questions each)
- **Overall score** calculated as the average across all questions
- **Percentages** normalized to 0–100 scale
- **Deterministic** algorithm ensures consistent, replicable results

## Architecture

### Frontend
- `public/quiz.html` — Assessment interface
- `public/results.html` — Results display with radar chart and narrative report
- `public/js/quiz.js` — Quiz logic and submission
- `public/js/results.js` — Results rendering, narrative generation, PDF download
- `public/js/visualizations.js` — Radar chart and bar chart visualization

### Backend
- `backend/scoring.js` — Core scoring algorithm
- `backend/routes/quiz.js` — Quiz API routes (questions + submission)
- `backend/routes/report.js` — PDF report generation (Puppeteer)
- `backend/models/ResilienceResult.js` — MongoDB persistence model

## API Routes

### Quiz
- `POST /api/quiz` — Submit answers and receive resilience scores
- `GET /api/quiz/questions` — Get all 36 questions

### Reports
- `GET /api/report/download` — Download results as PDF

### Auth
- `POST /auth/signup` / `POST /auth/login` — User authentication (JWT)

### Payments
- `POST /create-payment` *(requires JWT)* — Stripe payment intent
- `GET /payment/:id` *(requires JWT)* — Payment status

## Running the Project

### Prerequisites
- Node.js 18+
- MongoDB 4.0+ (optional — app works without it)

### Installation
```bash
git clone https://github.com/Abafirst/resilience-atlas.git
cd resilience-atlas
npm install
cp .env.example .env
# Edit .env — set JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, MONGODB_URI
npm start
```

### Testing
```bash
npm test
```

No database or Stripe credentials needed — all tests run with mocked values.

### Project Documentation

See the `docs/` directory for detailed setup, deployment, and contribution guides.

---

## Consolidating repositories — how to archive the old ones

If you have other GitHub repositories for this project that are no longer needed, **archiving** is the safest option instead of deleting:

- **Archived repos are read-only** — no one can accidentally push to them.
- **GitHub shows a clear "Archived" banner** on every page of the repo, so there is no confusion.
- **History and code are preserved** in case you ever need to reference something.
- **It is reversible** — you can unarchive at any time.

### Steps to archive a GitHub repository

1. Go to the repository on GitHub (e.g. `https://github.com/Abafirst/<repo-name>`)
2. Click **Settings** (top right of the repo page)
3. Scroll down to the **Danger Zone** section
4. Click **Archive this repository**
5. Confirm the action

Repeat for each of the other repositories. After archiving, add a short notice to their `README.md`:

```markdown
> ⚠️ **ARCHIVED** — This repository is no longer maintained.
> The active project has moved to: https://github.com/Abafirst/resilience-atlas
```

