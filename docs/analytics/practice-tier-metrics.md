# Practice Tier Analytics Metrics

## Overview

MongoDB aggregation queries for tracking key Practice tier business metrics.
Run these in MongoDB Compass, `mongosh`, or the MongoDB Atlas Data Explorer.

---

## 1. New Practice Signups (Last 30 Days)

```javascript
db.practices.aggregate([
  {
    $match: {
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
]);
```

---

## 2. Practice Plan Distribution

```javascript
db.practices.aggregate([
  {
    $group: {
      _id: "$plan",
      count: { $sum: 1 },
      totalSeats: { $sum: "$seatLimit" },
      usedSeats: { $sum: "$seatsUsed" }
    }
  }
]);
```

---

## 3. Invitation Acceptance Rate

```javascript
db.practitionerinvitations.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
]);

// Calculate: accepted / (accepted + pending + expired) * 100
```

---

## 4. Average Seat Utilization

```javascript
db.practices.aggregate([
  {
    $group: {
      _id: "$plan",
      avgSeatsUsed: { $avg: "$seatsUsed" },
      avgUtilization: {
        $avg: {
          $multiply: [
            { $divide: ["$seatsUsed", "$seatLimit"] },
            100
          ]
        }
      }
    }
  }
]);
```

---

## 5. Monthly Recurring Revenue by Plan

```javascript
db.practices.aggregate([
  {
    $lookup: {
      from: "iatlas_subscriptions",
      localField: "practiceId",
      foreignField: "practiceId",
      as: "subscription"
    }
  },
  {
    $unwind: "$subscription"
  },
  {
    $match: {
      "subscription.status": "active"
    }
  },
  {
    $group: {
      _id: "$plan",
      mrr: {
        $sum: {
          $switch: {
            branches: [
              { case: { $eq: ["$plan", "practice-5"] }, then: 399 },
              { case: { $eq: ["$plan", "practice-10"] }, then: 699 },
              { case: { $eq: ["$plan", "practice-25"] }, then: 1499 }
            ],
            default: 0
          }
        }
      },
      count: { $sum: 1 }
    }
  }
]);
```

---

## 6. Practices Approaching Seat Limit (≥ 80% Utilization)

```javascript
db.practices.aggregate([
  {
    $match: { seatLimit: { $gt: 0 } }
  },
  {
    $addFields: {
      utilization: {
        $multiply: [{ $divide: ["$seatsUsed", "$seatLimit"] }, 100]
      }
    }
  },
  {
    $match: { utilization: { $gte: 80 } }
  },
  {
    $project: {
      name: 1,
      plan: 1,
      seatsUsed: 1,
      seatLimit: 1,
      utilization: { $round: ["$utilization", 1] }
    }
  },
  { $sort: { utilization: -1 } }
]);
```

These practices are strong upgrade candidates. Consider triggering an automated upgrade nudge email.

---

## 7. Churn Risk — Practices With No Activity in 14 Days

```javascript
db.practices.aggregate([
  {
    $match: {
      updatedAt: { $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $lookup: {
      from: "iatlas_subscriptions",
      localField: "practiceId",
      foreignField: "practiceId",
      as: "subscription"
    }
  },
  {
    $match: { "subscription.status": "active" }
  },
  {
    $project: { name: 1, plan: 1, seatsUsed: 1, updatedAt: 1 }
  },
  { $sort: { updatedAt: 1 } }
]);
```

---

## Dashboard KPI Summary

Run weekly and pipe results to your analytics dashboard:

```javascript
db.practices.aggregate([
  {
    $facet: {
      totalPractices: [{ $count: "count" }],
      planBreakdown: [
        { $group: { _id: "$plan", count: { $sum: 1 } } }
      ],
      avgSeatUtil: [
        {
          $group: {
            _id: null,
            avg: {
              $avg: {
                $cond: [
                  { $gt: ["$seatLimit", 0] },
                  { $multiply: [{ $divide: ["$seatsUsed", "$seatLimit"] }, 100] },
                  0
                ]
              }
            }
          }
        }
      ]
    }
  }
]);
```
