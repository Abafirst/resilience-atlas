# IATLAS Parent-Reported Outcome (PRO) Forms Guide

## Overview

Parent-Reported Outcome (PRO) forms enable parents and caregivers to provide structured observations about their child's resilience between sessions. This data helps practitioners track real-world generalisation of skills.

## Forms Available

### Weekly Parent Check-In (~5 minutes)
Quick pulse check covering:
- This week's wins (multiselect)
- This week's challenges (checklist)
- Free-text observations
- Dimension quick-ratings (1–5 per dimension)
- Questions for the practitioner
- Weekly celebration

### Monthly Progress Summary (~15 minutes)
Deeper reflection covering:
- Overall progress rating
- Dimension-by-dimension progress ratings
- Biggest growth narrative
- Ongoing challenges
- Activities completed at home
- Goal review
- Caregiver wellbeing rating
- Focus areas for next month

## Purpose

1. **Bridge sessions**: Capture what's happening at home between appointments
2. **Progress data**: Provide practitioner with parent perspective on generalisation
3. **Goal alignment**: Ensure home and session goals are aligned
4. **Caregiver support**: Identify caregiver stress and provide appropriate support

## Implementation

### Frontend Components
- `ParentOutcomeForm.jsx` — Interactive form with weekly/monthly toggle

### Data File
- `client/src/data/iatlas/parentOutcomeForms.js` — Form definitions

### Backend
- Model: `backend/models/ParentOutcome.js`
- Route: `backend/routes/iatlas-parent-outcomes.js`

## API Endpoints

```
POST /api/iatlas/parent-outcomes
  Body: { formType, childProfileId?, wins[], challenges[], observations, dimensionRatings[], ... }
  Returns: { parentOutcome }

GET /api/iatlas/parent-outcomes?childProfileId=&formType=&limit=
  Returns: { parentOutcomes[], count }

GET /api/iatlas/parent-outcomes/:id
  Returns: { parentOutcome }

PATCH /api/iatlas/parent-outcomes/:id/review
  Body: { practitionerNotes }
  Returns: { parentOutcome }
```

## Privacy & Confidentiality

- Parent submissions are only visible to the parent and their assigned practitioner
- Practitioner notes are added after review and are visible to both parties
- All data is stored securely in MongoDB with standard encryption

## Recommended Cadence

- **Weekly**: Submit every Sunday evening before the upcoming week's session
- **Monthly**: Submit at the end of each calendar month
- **Milestone**: At key treatment milestones (3-month, 6-month reviews)
