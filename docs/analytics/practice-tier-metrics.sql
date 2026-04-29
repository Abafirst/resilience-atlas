-- ============================================================
-- IATLAS Practice Tier — Key Metrics Aggregation Queries
-- MongoDB Aggregation Pipelines (via $aggregate)
-- ============================================================

-- NOTE: These are MongoDB aggregation pipelines written in a
-- SQL-style format for documentation purposes.
-- Execute them via the MongoDB shell, Compass, or your backend
-- analytics service using db.collection.aggregate([...]).
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. New Practice Signups (Last 30 Days)
-- ────────────────────────────────────────────────────────────
-- Collection: practices
-- Returns: count of new practices created in the last 30 days,
--          grouped by day.

db.practices.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    $group: {
      _id: {
        year:  { $year:  "$createdAt" },
        month: { $month: "$createdAt" },
        day:   { $dayOfMonth: "$createdAt" }
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
  },
  {
    $project: {
      _id: 0,
      date: {
        $dateFromParts: {
          year:  "$_id.year",
          month: "$_id.month",
          day:   "$_id.day"
        }
      },
      newPractices: "$count"
    }
  }
])


-- ────────────────────────────────────────────────────────────
-- 2. Practice Plan Distribution
-- ────────────────────────────────────────────────────────────
-- Collection: practices
-- Returns: count and percentage of practices on each plan
--          (practice-5, practice-10, practice-25, custom).

db.practices.aggregate([
  {
    $group: {
      _id:   "$plan",
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id:   null,
      plans: { $push: { plan: "$_id", count: "$count" } },
      total: { $sum: "$count" }
    }
  },
  {
    $unwind: "$plans"
  },
  {
    $project: {
      _id:        0,
      plan:       "$plans.plan",
      count:      "$plans.count",
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$plans.count", "$total"] }, 100] },
          1
        ]
      }
    }
  },
  {
    $sort: { count: -1 }
  }
])


-- ────────────────────────────────────────────────────────────
-- 3. Invitation Acceptance Rate
-- ────────────────────────────────────────────────────────────
-- Collection: practiceinvitations (or practitioners sub-docs)
-- Returns: total invitations sent, accepted, pending, expired,
--          and overall acceptance rate.

db.practiceinvitations.aggregate([
  {
    $group: {
      _id:     "$status",
      count:   { $sum: 1 }
    }
  },
  {
    $group: {
      _id:      null,
      statuses: { $push: { status: "$_id", count: "$count" } },
      total:    { $sum: "$count" }
    }
  },
  {
    $unwind: "$statuses"
  },
  {
    $project: {
      _id:        0,
      status:     "$statuses.status",
      count:      "$statuses.count",
      total:      "$total",
      percentage: {
        $round: [
          { $multiply: [{ $divide: ["$statuses.count", "$total"] }, 100] },
          1
        ]
      }
    }
  },
  {
    $sort: { count: -1 }
  }
])


-- ────────────────────────────────────────────────────────────
-- 4. Average Seats Used Per Practice
-- ────────────────────────────────────────────────────────────
-- Collection: practices
-- Returns: average, min, max, and distribution of seats used
--          across all active practices.

db.practices.aggregate([
  {
    $match: {
      "billing.status": "active"
    }
  },
  {
    $group: {
      _id:         null,
      avgSeatsUsed: { $avg: "$seatsUsed" },
      minSeatsUsed: { $min: "$seatsUsed" },
      maxSeatsUsed: { $max: "$seatsUsed" },
      totalPractices: { $sum: 1 }
    }
  },
  {
    $project: {
      _id:            0,
      avgSeatsUsed:   { $round: ["$avgSeatsUsed", 1] },
      minSeatsUsed:   1,
      maxSeatsUsed:   1,
      totalPractices: 1
    }
  }
])

-- Seat utilization by plan (average % of seats used per plan tier):
db.practices.aggregate([
  {
    $match: {
      "billing.status": "active",
      seatLimit: { $gt: 0 }
    }
  },
  {
    $project: {
      plan:        1,
      seatsUsed:   1,
      seatLimit:   1,
      utilization: {
        $multiply: [{ $divide: ["$seatsUsed", "$seatLimit"] }, 100]
      }
    }
  },
  {
    $group: {
      _id:            "$plan",
      avgUtilization: { $avg: "$utilization" },
      count:          { $sum: 1 }
    }
  },
  {
    $project: {
      _id:            0,
      plan:           "$_id",
      count:          1,
      avgUtilization: { $round: ["$avgUtilization", 1] }
    }
  },
  {
    $sort: { avgUtilization: -1 }
  }
])


-- ────────────────────────────────────────────────────────────
-- 5. Monthly Recurring Revenue (MRR) by Tier
-- ────────────────────────────────────────────────────────────
-- Collection: iatlassubscriptions
-- Returns: total MRR broken down by subscription tier,
--          for all active subscriptions.
-- Prices are stored in cents (Stripe convention).

db.iatlassubscriptions.aggregate([
  {
    $match: {
      status: "active"
    }
  },
  {
    $group: {
      _id:       "$tier",
      count:     { $sum: 1 },
      totalMRR:  { $sum: "$amountCents" }
    }
  },
  {
    $project: {
      _id:       0,
      tier:      "$_id",
      count:     1,
      mrrCents:  "$totalMRR",
      mrrDollars: { $divide: ["$totalMRR", 100] }
    }
  },
  {
    $sort: { mrrDollars: -1 }
  }
])

-- Total MRR (all tiers combined):
db.iatlassubscriptions.aggregate([
  {
    $match: { status: "active" }
  },
  {
    $group: {
      _id:          null,
      totalMRRCents: { $sum: "$amountCents" },
      subscriberCount: { $sum: 1 }
    }
  },
  {
    $project: {
      _id:             0,
      totalMRRDollars: { $divide: ["$totalMRRCents", 100] },
      subscriberCount: 1
    }
  }
])
