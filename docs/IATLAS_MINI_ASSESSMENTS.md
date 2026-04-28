# IATLAS Mini Assessments Guide

## Overview

Mini assessments are quick 3-question pulse checks for each of the six IATLAS resilience dimensions. They are designed for use between full assessments to track week-to-week progress.

## Purpose

- **For parents**: Quick way to share observations about their child's resilience at home
- **For practitioners**: Brief clinical check-in at session start or between sessions
- **For progress tracking**: Track trends over time across dimensions

## Dimensions Covered

1. **Emotional-Adaptive** — Emotion identification, regulation, and recovery
2. **Agentic-Generative** — Goal-setting, persistence, and self-efficacy
3. **Somatic-Regulative** — Body awareness and physiological regulation
4. **Cognitive-Narrative** — Thinking patterns and meaning-making
5. **Relational-Connective** — Social connection and empathy
6. **Spiritual-Existential** — Purpose, gratitude, and hope

## Scoring

Each question is rated 1–5 on a Likert scale.
- **Total score range**: 3–15
- **Low (3–7)**: Emerging skills — focus on foundational activities
- **Medium (8–11)**: Developing skills — build on existing strengths
- **High (12–15)**: Thriving — consider advancement and peer mentorship

## Two Versions

### Parent Version
- Accessible language for non-clinical caregivers
- Focuses on observable home behaviours
- Example: "My child can name their feelings when upset"

### Practitioner Version
- Clinical language for professional context
- Focuses on clinical observations
- Example: "Client demonstrates accurate emotion identification and labelling"

## Recommended Workflow

1. Parent completes mini assessment at home (weekly or bi-weekly)
2. Practitioner reviews results before session
3. Practitioner completes their version during session
4. Compare versions to identify home vs. session discrepancies
5. Use recommended activities to guide session planning

## Data Storage

Mini assessment results are saved to:
- **localStorage** (for immediate offline access)
- **Backend API** (`POST /api/iatlas/mini-assessments`) when authenticated

## API Endpoints

```
POST /api/iatlas/mini-assessments
  Body: { dimension, versionUsed, responses[], clientProfileId?, notes? }
  Returns: { miniAssessment }

GET /api/iatlas/mini-assessments?clientProfileId=&dimension=&limit=
  Returns: { miniAssessments[], count }

GET /api/iatlas/mini-assessments/:id
  Returns: { miniAssessment }
```

## React Components

- `MiniAssessment.jsx` — Interactive assessment form with scoring and recommendations
- `MiniAssessmentHistory.jsx` — Timeline view of past results
