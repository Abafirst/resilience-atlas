---
title: IARF Gamification System — Overview
status: active
last_updated: 2026-04-25
---

# IARF Curriculum Gamification System

## Overview

The IARF (Integrated ABA Resilience Framework) curriculum gamification system is designed to drive engagement, skill acquisition, and measurable progress using a combination of behavioral (ABA) reinforcement principles and intrinsic motivation (ACT values). This document provides a comprehensive overview of all gamification features, design principles, and implementation guidance.

---

## Design Philosophy

### ACT-Aligned Gamification

The gamification system is grounded in Acceptance and Commitment Therapy (ACT) values-alignment principles:

| ✅ What We Do | ❌ What We Avoid |
|---|---|
| Focus on intrinsic motivation ("Why does this matter to you?") | Shaming users for low scores |
| Celebrate process over outcome ("You practiced 7 days straight!") | Forced peer comparisons |
| Celebrate ALL progress — shaping successive approximations | Perfectionism or all-or-nothing framing |
| Encourage self-compassion (streak forgiveness, growth mindset) | Punitive consequences for gaps |
| Frame setbacks as learning opportunities | Labeling missed practices as "failures" |

### ABA Reinforcement Principles

The system applies evidence-based behavioral principles:

- **Shaping**: Skills progress from Foundation → Building → Mastery using successive approximations
- **Differential Reinforcement**: Higher-value activities earn more XP to increase their frequency
- **Intermittent Reinforcement**: Streak milestones and badge unlocks create sustainable engagement
- **Stimulus Control**: Consistent practice contexts (daily micropractices) build behavioral habits
- **Behavioral Activation**: Earn XP simply by engaging, regardless of performance quality

---

## Core Features

### 1. Resilience XP System ⚡

Experience points (XP) are earned for every IARF curriculum activity.

#### XP Award Table

| Activity | XP Earned |
|---|---|
| Complete micropractice | 10 XP |
| Finish skill module | 50 XP |
| Weekly reflection | 25 XP |
| Retake Resilience Atlas | 100 XP |
| Dimensional improvement (+5%) | 150 XP |
| Help another user | 75 XP |
| Quest completion | 80 XP |
| Balance Bonus (all 6 dims within 15%) | 30 XP |

#### Level Tiers

| Level Range | Tier Name | XP Range |
|---|---|---|
| 1–10 | 🌱 Resilience Explorer | 0–999 XP |
| 11–20 | ⚡ Resilience Builder | 1,000–4,999 XP |
| 21–30 | 🏛️ Resilience Architect | 5,000–14,999 XP |
| 31+ | 👑 Resilience Master | 15,000+ XP |

**Technical Note:** The internal points system (1 point per practice) is scaled by 10x for XP display. Level computation is handled by `computeXPLevel()` in `gamificationContent.js`.

---

### 2. Dimensional Skill Trees 🌳

Each of the 6 IARF dimensions has a visual skill tree with three levels.

#### Dimension Overview

| Dimension | Emoji | Skill Focus |
|---|---|---|
| Agentic-Generative | 🎯 | Values, goals, purposeful action |
| Relational-Connective | 💬 | Connection, support, authentic relating |
| Somatic-Regulative | 🧘 | Body awareness, breath, nervous system |
| Cognitive-Narrative | 🔄 | Cognitive flexibility, narrative, reframing |
| Emotional-Adaptive | 💙 | Emotion naming, tolerance, adaptive response |
| Spiritual-Reflective | ✨ | Values alignment, meaning, purpose |

#### Skill Level Structure

Each dimension has three levels:

| Level | Name | Description | XP Reward |
|---|---|---|---|
| 1 | 🌱 Foundation | Core skills and initial competencies | 50 XP |
| 2 | ⚡ Building | Integrated practices and sustained engagement | 100 XP |
| 3 | 🏆 Mastery | Advanced applications and mentorship | 200 XP |

Full skill tree definitions are in `client/src/data/iarf-skill-trees.js`.

---

### 3. Micropractice Streaks 🔥

Daily and weekly streak tracking for dimension-specific micropractices.

#### Streak Badges

| Streak Length | Badge | Rarity | XP Bonus |
|---|---|---|---|
| 7 days | 🥉 Bronze | Common | +20 XP |
| 30 days | 🥈 Silver | Uncommon | +60 XP |
| 90 days | 🥇 Gold | Rare | +150 XP |
| 365 days | 💎 Diamond | Legendary | +500 XP |

#### Tracked Data (per dimension)

- `current`: Current streak length (days)
- `longest`: All-time longest streak
- `totalCount`: Total practice count for this dimension
- `lastPracticeDate`: Date of last practice

#### Streak Recovery (Grace Period)

Users receive **1 miss forgiveness per calendar month** per dimension. If a user misses exactly 1 day (2-day gap instead of 1), their streak is preserved, and the forgiveness token is consumed for that calendar month.

This is implemented in `updateDimensionalStreak()` in `gamificationService.js`.

---

### 4. Dimensional Balance Wheel 🎡

An animated SVG radar chart showing real-time balance across all 6 dimensions.

#### Special Path Rewards

| Path | Requirement | Visual Indicator |
|---|---|---|
| ⚖️ Balance Bonus | All 6 dims within 15% of each other | Green polygon + +30 XP |
| 🌈 Renaissance Path | All 6 dims at 70%+ | Gold polygon + Renaissance badge |
| 🎯 Specialist Path | One dim at 90%+ | Purple polygon + Specialist badge |

#### Accessibility

- Respects `prefers-reduced-motion` — disables animation when user prefers
- SVG includes `<title>` tooltips for each data point
- `role="figure"` + `aria-label` for screen reader support
- Color + text labels (not color alone) for dimension identification

Component: `client/src/components/gamification/DimensionalBalanceWheel.jsx`

---

### 5. Quest System 📜

Guided multi-step challenges integrating multiple IARF dimensions.

#### Quest Types

| Type | Duration | XP Multiplier | Description |
|---|---|---|---|
| 🌱 Foundation Quest | ~5 days | 1.0x | Beginner-friendly intro to IARF |
| ⚡ Sprint Quest | 7 days | 1.25x | Intensive single-dimension deep-dive |
| 🏔️ Epic Quest | 30–90 days | 1.5–1.75x | Multi-dimension transformational journey |
| 🎯 Dimensional Deep-Dive | 14 days | 1.5x | Focus mastery in one dimension |

#### Flagship Quest: 30-Day Resilience Foundation

```
Day 1–7:   Somatic-Regulative  → Establish daily breathwork
Day 8–14:  Cognitive-Narrative → Practice reframing
Day 15–21: Relational-Connective → Connect with support
Day 22–28: Emotional-Adaptive  → Emotion tracking
Day 29–30: Integration         → Reflect + plan
```

Rewards: 450 XP + 1.5x XP multiplier for the following week + **30-Day Transformer badge**

Quest definitions: `client/src/data/adultGames.js` (`IARF_LONG_QUESTS`)

---

### 6. Badge Collection System 🏅

#### Skill Badges (dimension-specific)

| Badge | Emoji | Dimension | Rarity |
|---|---|---|---|
| Goal Setter | 🎯 | Agentic-Generative | Common |
| Connection Keeper | 💬 | Relational-Connective | Common |
| Breath Master | 🧘 | Somatic-Regulative | Uncommon |
| Reframe Champion | 🔄 | Cognitive-Narrative | Uncommon |
| Emotion Navigator | 💙 | Emotional-Adaptive | Uncommon |
| Values Anchor | ✨ | Spiritual-Reflective | Uncommon |

#### Milestone Badges

| Badge | Emoji | Requirement | Rarity |
|---|---|---|---|
| First Micropractice | 🌟 | Complete first practice | Common |
| First Assessment | 📈 | Complete first Resilience Atlas | Common |
| First Re-Assessment | 🔄 | Retake Resilience Atlas | Uncommon |
| 30-Day Active User | 🎊 | 30 days of activity | Uncommon |
| 90-Day Transformer | 👑 | 90 days of activity | Rare |

#### Achievement Badges

| Badge | Emoji | Requirement | Rarity |
|---|---|---|---|
| Early Adopter | 🚀 | Among first users | Rare |
| Skill Completionist | 🎓 | All skills in one dimension | Rare |
| Rainbow Resilience | 🌈 | Active in all 6 dimensions | Rare |
| 100-Day Streak | 🔥 | 100-day practice streak | Legendary |
| Community Helper | 🤝 | Help another user | Uncommon |
| Dimension Specialist | 🎯 | One dim at 90%+ | Legendary |
| Renaissance Resilience | 🌟 | All dims at 70%+ | Legendary |

#### Rarity System

| Rarity | Approximate Earn Rate | Visual |
|---|---|---|
| Common | ~75% of users | Gray |
| Uncommon | ~40% of users | Blue |
| Rare | ~15% of users | Purple |
| Legendary | ~2% of users | Gold |

Badge definitions: `client/src/data/adultGames.js` (`IARF_SKILL_BADGES`)

---

## Data Models

### User Gamification Profile

```javascript
{
  userId: "user_abc123",

  // Points (internal) — displayed as XP × 10
  totalPoints: 345,          // → 3,450 XP displayed

  // Global streak
  currentStreak: {
    days: 14,
    startDate: "2026-04-11",
    lastPracticeDate: "2026-04-25"
  },
  longestStreak: 21,

  // Per-dimension streak tracking (IARF extension)
  dimensionalStreaks: [
    {
      dimension: "Somatic-Regulative",
      current: 14,
      longest: 21,
      lastPracticeDate: "2026-04-25",
      totalCount: 28,
      lastRecoveryMonth: null,
      lastRecoveryYear: null
    },
    // ... other dimensions
  ],

  // Skill pathway completions
  skillPathways: [
    { dimension: "Agentic-Generative", level: 1, completedAt: "2026-04-01" },
    { dimension: "Agentic-Generative", level: 2, completedAt: "2026-04-10" },
  ],

  // Badges earned
  badges: [
    { name: "Breath Master", rarity: "uncommon", icon: "/icons/somatic-regulative.svg", earnedAt: "2026-04-15" },
  ],

  // Active quests (IARF extension)
  activeQuests: [
    {
      questId: "iq-30-day-foundation",
      startedAt: "2026-04-01",
      currentDay: 24,
      totalDays: 30,
      stepsCompleted: ["somatic-phase", "cognitive-phase", "relational-phase"]
    }
  ],
  completedQuestIds: ["iq-first-steps"],

  // Activity log (IARF extension)
  activityLog: [
    {
      type: "micropractice_complete",
      dimension: "Somatic-Regulative",
      skillId: "mq-somatic",
      xpEarned: 10,
      timestamp: "2026-04-25T14:30:00Z",
      metadata: { duration: "5 minutes", userRating: 4 }
    }
  ]
}
```

### Activity Log Entry

```javascript
{
  type:      "micropractice_complete",  // see Activity Types below
  dimension: "Somatic-Regulative",
  skillId:   "mq-somatic",
  xpEarned:  10,
  timestamp: "2026-04-25T14:30:00Z",
  metadata:  {
    duration:   "5 minutes",
    userRating: 4,            // 1-5 "How did this feel?"
    questId:    null          // if completed as part of quest
  }
}
```

#### Activity Types

| Type | XP | Description |
|---|---|---|
| `micropractice_complete` | 10 | Completed a micropractice |
| `skill_module_complete` | 50 | Completed a skill pathway level |
| `weekly_reflection` | 25 | Submitted weekly reflection |
| `assessment_complete` | 100 | Completed Resilience Atlas |
| `dimensional_improvement` | 150 | +5% score improvement in a dimension |
| `help_user` | 75 | Helped another user |
| `quest_complete` | 80 | Completed a quest |
| `streak_milestone` | varies | Hit a streak badge milestone |

---

## Implementation Phases

### Phase 1: Foundation (MVP) ✅ Implemented

- [x] XP system with level tiers (Explorer/Builder/Architect/Master)
- [x] Skill completion tracking with dimensional progress bars
- [x] IARF-specific badge system (skill + milestone + achievement badges)
- [x] Progress dashboard with XP level display and dimensional balance
- [x] Database schemas extended with dimensional streaks, activity log, quest tracking
- [x] Dimensional skill tree data for all 6 dimensions
- [x] Dimensional Balance Wheel component (SVG radar chart)
- [x] IARF documentation (this document)

### Phase 2: Engagement Boosters (Planned)

- [ ] Streak tracking UI widgets per dimension (extend DailyCompassStreaks)
- [ ] Quest System UI with 30-Day Foundation Quest tracking
- [ ] Quest progress tracker component
- [ ] Streak recovery UI notification
- [ ] Confetti animations for level-up and badge unlock events

### Phase 3: Social & Advanced (Future)

- [ ] Opt-in leaderboard with values-aligned framing
- [ ] Community challenges (team-based)
- [ ] Peer mentorship system
- [ ] Assessment history with before/after Balance Wheel comparison

---

## File Reference

### Backend

| File | Purpose |
|---|---|
| `backend/models/GamificationProgress.js` | MongoDB schema — extended with dimensional streaks, activity log, quests |
| `backend/services/gamificationService.js` | Core logic — XP levels, dimensional streaks, streak recovery |
| `backend/routes/gamification.js` | API endpoints |

### Frontend Data

| File | Purpose |
|---|---|
| `client/src/data/gamificationContent.js` | XP level tiers, streak badges, tier helpers |
| `client/src/data/adultGames.js` | Skill pathways, quests, IARF badges, quest types |
| `client/src/data/iarf-skill-trees.js` | Skill tree definitions (Foundation/Building/Mastery per dimension) |

### Frontend Components

| Component | Purpose |
|---|---|
| `DimensionalBalanceWheel.jsx` | Animated SVG radar chart |
| `ProgressDashboard.jsx` | Extended with XP levels, dimensional streaks, balance wheel |
| `NavigatorSkillPaths.jsx` | Skill pathway completion UI |
| `NavigatorQuests.jsx` | Quest tracking UI |
| `BadgesWidget.jsx` | Badge collection display |
| `DailyCompassStreaks.jsx` | Global streak tracking |

---

## API Reference

### GET /api/gamification/progress

Returns full gamification profile including dimensional streaks, XP, badges, and active quests.

**Response includes:**
- `totalPoints` (raw) → multiply by 10 for displayed XP
- `dimensionalStreaks[]` — per-dimension streak data
- `activeQuests[]` — in-progress quests
- `activityLog[]` — recent activity history

### POST /api/gamification/practice

Record a micropractice completion. Updates global and dimensional streaks.

**Body:** `{ practiceId: string, dimension?: string }`

**Response:** `{ totalPoints, currentStreak, dimensionalStreakUpdated, newBadges }`

### POST /api/gamification/progress/quest-complete

Log completion of a quest step or micro-quest.

**Body:** `{ questId: string, dimension: string }`

### POST /api/gamification/progress/pathway-complete

Log completion of a skill pathway level.

**Body:** `{ dimension: string, level: number }`

---

## XP Level Computation

```javascript
import { computeXPLevel } from '../data/gamificationContent.js';

const xpData = computeXPLevel(progress.totalPoints);
// Returns:
// {
//   xp: 3450,           // displayed XP (totalPoints × 10)
//   level: 12,          // current level number
//   tierName: "Resilience Builder",
//   tierIcon: "⚡",
//   tierColor: "#3b82f6",
//   nextLevelXP: 4000,  // XP needed for next level
//   progressPct: 69     // % progress to next level
// }
```

---

## Dimensional Streak Logic

Dimensional streaks are tracked independently for each dimension. The algorithm in `gamificationService.updateDimensionalStreak()`:

1. **First practice**: Start streak at 1
2. **Same day**: Increment `totalCount` only (no streak change)
3. **Consecutive day**: Extend streak by 1
4. **2-day gap + no prior recovery this month**: Apply grace period — extend streak as if consecutive, consume monthly forgiveness
5. **Any other gap**: Reset streak to 1

```javascript
// Access dimensional streak data
const somatic = progress.dimensionalStreaks.find(d => d.dimension === 'Somatic-Regulative');
// { current: 14, longest: 21, totalCount: 28, lastPracticeDate: Date }
```

---

*This document is part of The Resilience Atlas™ IARF curriculum documentation.*
*Last reviewed: 2026-04-25 | Status: Active*
