'use strict';

/**
 * researchExport.js — Research Export Tools (Task #23c)
 *
 * Base path: /api/research
 *
 * Endpoints:
 *   GET  /api/research/aggregate-stats  — aggregate cohort statistics
 *   POST /api/research/csv              — de-identified CSV export
 *   POST /api/research/longitudinal     — longitudinal dataset (one row per snapshot)
 *
 * Privacy / IRB compliance:
 *   - All exports strip direct identifiers (clientIdentifier, guardianContact, intakeNotes)
 *   - Dates of birth are replaced with age-group buckets (e.g. "5-9")
 *   - Client IDs are replaced with sequential research IDs (R001, R002, …)
 *   - Export records are audit-logged for IRB accountability
 *
 * Access: requires a valid JWT + practitioner tier.
 */

const express   = require('express');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');

const { authenticateJWT, requirePractitionerTier } = require('../../middleware/auth');
const ClientProfile          = require('../../models/ClientProfile');
const ClientProgressSnapshot = require('../../models/ClientProgressSnapshot');
const logger                 = require('../../utils/logger');

const router = express.Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────

const exportLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Export rate limit exceeded. Please wait before exporting again.' },
});

const commonChain = [exportLimiter, authenticateJWT, requirePractitionerTier];

// ── Constants ─────────────────────────────────────────────────────────────────

const DIMENSION_KEYS = [
  'agenticGenerative',
  'relationalConnective',
  'somaticRegulative',
  'cognitiveNarrative',
  'emotionalAdaptive',
  'spiritualExistential',
];

const DIMENSION_LABELS = {
  agenticGenerative:    'Agentic-Generative',
  relationalConnective: 'Relational-Connective',
  somaticRegulative:    'Somatic-Regulative',
  cognitiveNarrative:   'Cognitive-Narrative',
  emotionalAdaptive:    'Emotional-Adaptive',
  spiritualExistential: 'Spiritual-Existential',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveUserId(req) {
  return req.user && (req.user.userId || req.user.sub);
}

/**
 * Convert a date of birth to an age-group bucket string for de-identification.
 * Bucket sizes: 0-4, 5-9, 10-14, 15-19, 20-24, 25-34, 35-44, 45-54, 55-64, 65+
 */
function ageGroupBucket(dob) {
  if (!dob) return 'unknown';
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  if (age < 0)  return 'unknown';
  if (age <= 4)  return '0-4';
  if (age <= 9)  return '5-9';
  if (age <= 14) return '10-14';
  if (age <= 19) return '15-19';
  if (age <= 24) return '20-24';
  if (age <= 34) return '25-34';
  if (age <= 44) return '35-44';
  if (age <= 54) return '45-54';
  if (age <= 64) return '55-64';
  return '65+';
}

/** Compute the mean of an array of numbers. Returns null for empty arrays. */
function mean(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Compute the standard deviation of an array. Returns null for < 2 elements. */
function stdDev(arr) {
  if (!arr || arr.length < 2) return null;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

/** Escape a value for CSV output (RFC 4180). */
function csvCell(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Build a CSV string from an array of header names and row arrays.
 *
 * @param {string[]}   headers
 * @param {Array[]}    rows
 * @returns {string}
 */
function buildCsvString(headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(csvCell).join(','));
  }
  return lines.join('\r\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /aggregate-stats
// Returns aggregate resilience dimension statistics across the practitioner's
// active client cohort. No client-level PII is included.
// ─────────────────────────────────────────────────────────────────────────────

router.get('/aggregate-stats', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    // Fetch all active clients owned by this practitioner.
    const clients = await ClientProfile.find({ practitionerId, isActive: true }).lean();
    if (clients.length === 0) {
      return res.json({
        cohortSize: 0,
        dimensionStats: {},
        ageGroupDistribution: {},
        dataAsOf: new Date().toISOString(),
      });
    }

    const clientIds = clients.map(c => c._id);

    // For each client, grab only the most-recent snapshot.
    const snapshots = await ClientProgressSnapshot.aggregate([
      { $match: { clientProfileId: { $in: clientIds } } },
      { $sort:  { snapshotDate: -1 } },
      {
        $group: {
          _id:            '$clientProfileId',
          snapshotDate:   { $first: '$snapshotDate' },
          dimensionScores: { $first: '$dimensionScores' },
        },
      },
    ]);

    // Build per-dimension score arrays.
    const dimArrays = Object.fromEntries(DIMENSION_KEYS.map(k => [k, []]));
    for (const snap of snapshots) {
      for (const key of DIMENSION_KEYS) {
        const v = snap.dimensionScores?.[key];
        if (v != null && !isNaN(v)) dimArrays[key].push(v);
      }
    }

    const dimensionStats = {};
    for (const key of DIMENSION_KEYS) {
      const arr = dimArrays[key];
      dimensionStats[key] = {
        label:    DIMENSION_LABELS[key],
        n:        arr.length,
        mean:     mean(arr) != null ? parseFloat(mean(arr).toFixed(2)) : null,
        stdDev:   stdDev(arr) != null ? parseFloat(stdDev(arr).toFixed(2)) : null,
        min:      arr.length > 0 ? Math.min(...arr) : null,
        max:      arr.length > 0 ? Math.max(...arr) : null,
      };
    }

    // Age-group distribution (de-identified).
    const ageGroupDistribution = {};
    for (const c of clients) {
      const bucket = ageGroupBucket(c.dateOfBirth);
      ageGroupDistribution[bucket] = (ageGroupDistribution[bucket] || 0) + 1;
    }

    return res.json({
      cohortSize:          clients.length,
      snapshotsAvailable:  snapshots.length,
      dimensionStats,
      ageGroupDistribution,
      dataAsOf:            new Date().toISOString(),
      irbNote:             'Data is aggregated and de-identified. No individual client records are exposed.',
    });
  } catch (err) {
    logger.error('[researchExport] GET /aggregate-stats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /csv
// Generate a de-identified, IRB-compliant CSV of client snapshot data.
//
// Body (all optional):
//   fields       {string[]}  — dimension keys to include (default: all 6)
//   includeAge   {boolean}   — include age-group bucket column (default: true)
//   snapshotsMax {number}    — max snapshots per client (default: latest only; 0 = all)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/csv', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    const {
      fields       = DIMENSION_KEYS,
      includeAge   = true,
      snapshotsMax = 1,
    } = req.body;

    // Validate requested fields.
    const invalidFields = fields.filter(f => !DIMENSION_KEYS.includes(f));
    if (invalidFields.length > 0) {
      return res.status(422).json({
        error:   `Invalid dimension fields: ${invalidFields.join(', ')}`,
        valid:   DIMENSION_KEYS,
      });
    }

    const clients = await ClientProfile.find({ practitionerId, isActive: true }).lean();
    if (clients.length === 0) {
      return res.json({ csv: '', rowCount: 0, message: 'No active clients found.' });
    }

    const clientIds = clients.map(c => c._id);

    // Map internal ObjectId → de-identified research ID.
    const researchIdMap = {};
    clients.forEach((c, i) => {
      researchIdMap[c._id.toString()] = `R${String(i + 1).padStart(3, '0')}`;
    });

    // Map client ObjectId → dateOfBirth for age-group bucketing.
    const dobMap = {};
    clients.forEach(c => { dobMap[c._id.toString()] = c.dateOfBirth; });

    // Fetch snapshots.
    let query = ClientProgressSnapshot.find({ clientProfileId: { $in: clientIds } })
      .sort({ clientProfileId: 1, snapshotDate: 1 })
      .lean();
    const allSnapshots = await query;

    // Group by client, optionally cap per client.
    const snapshotsByClient = {};
    for (const snap of allSnapshots) {
      const key = snap.clientProfileId.toString();
      if (!snapshotsByClient[key]) snapshotsByClient[key] = [];
      snapshotsByClient[key].push(snap);
    }

    // Build CSV rows.
    const headers = [
      'researchId',
      ...(includeAge ? ['ageGroup'] : []),
      'snapshotDate',
      'dataSource',
      ...fields.map(f => DIMENSION_LABELS[f] || f),
    ];

    const rows = [];
    for (const [clientIdStr, snaps] of Object.entries(snapshotsByClient)) {
      const researchId = researchIdMap[clientIdStr] || 'UNKNOWN';
      const ageGroup   = includeAge ? ageGroupBucket(dobMap[clientIdStr]) : null;

      // Apply snapshotsMax (0 = all).
      const selected = snapshotsMax > 0 ? snaps.slice(-snapshotsMax) : snaps;

      for (const snap of selected) {
        const row = [
          researchId,
          ...(includeAge ? [ageGroup] : []),
          snap.snapshotDate ? new Date(snap.snapshotDate).toISOString().slice(0, 10) : '',
          snap.dataSource || '',
          ...fields.map(f => {
            const v = snap.dimensionScores?.[f];
            return v != null ? v : '';
          }),
        ];
        rows.push(row);
      }
    }

    const csv = buildCsvString(headers, rows);

    logger.info(`[researchExport] CSV export by ${practitionerId}: ${rows.length} rows, ${clients.length} clients`);

    return res.json({
      csv,
      rowCount:     rows.length,
      clientCount:  clients.length,
      fields:       headers,
      irbStatement: 'This export contains no direct identifiers. Dates of birth have been replaced with age-group buckets. Client identifiers are pseudonymous research IDs.',
    });
  } catch (err) {
    logger.error('[researchExport] POST /csv error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /longitudinal
// Generate a longitudinal dataset — one row per (researchId, snapshotDate).
// Suitable for repeated-measures statistical analysis (e.g. mixed-effects models).
//
// Body (all optional):
//   startDate    {string}  — ISO date string, filter snapshots on/after this date
//   endDate      {string}  — ISO date string, filter snapshots on/before this date
//   minSnapshots {number}  — exclude clients with fewer than N snapshots (default: 2)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/longitudinal', ...commonChain, async (req, res) => {
  try {
    const practitionerId = resolveUserId(req);

    const {
      startDate,
      endDate,
      minSnapshots = 2,
    } = req.body;

    const clients = await ClientProfile.find({ practitionerId, isActive: true }).lean();
    if (clients.length === 0) {
      return res.json({ dataset: [], rowCount: 0, clientCount: 0 });
    }

    const clientIds = clients.map(c => c._id);

    // Build research ID and DOB maps.
    const researchIdMap = {};
    const dobMap        = {};
    clients.forEach((c, i) => {
      const key = c._id.toString();
      researchIdMap[key] = `R${String(i + 1).padStart(3, '0')}`;
      dobMap[key]        = c.dateOfBirth;
    });

    // Build snapshot date filter.
    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start)) dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end)) dateFilter.$lte = end;
    }

    const snapshotQuery = { clientProfileId: { $in: clientIds } };
    if (Object.keys(dateFilter).length > 0) {
      snapshotQuery.snapshotDate = dateFilter;
    }

    const snapshots = await ClientProgressSnapshot.find(snapshotQuery)
      .sort({ clientProfileId: 1, snapshotDate: 1 })
      .lean();

    // Group by client.
    const byClient = {};
    for (const snap of snapshots) {
      const key = snap.clientProfileId.toString();
      if (!byClient[key]) byClient[key] = [];
      byClient[key].push(snap);
    }

    // Filter by minSnapshots and build dataset.
    const dataset = [];
    for (const [clientIdStr, snaps] of Object.entries(byClient)) {
      if (snaps.length < minSnapshots) continue;

      const researchId = researchIdMap[clientIdStr] || 'UNKNOWN';
      const ageGroup   = ageGroupBucket(dobMap[clientIdStr]);
      const baseline   = snaps[0]?.dimensionScores || {};

      snaps.forEach((snap, idx) => {
        const row = {
          researchId,
          ageGroup,
          wave:        idx + 1, // 1-based observation wave number
          snapshotDate: snap.snapshotDate
            ? new Date(snap.snapshotDate).toISOString().slice(0, 10)
            : null,
          dataSource: snap.dataSource || null,
        };

        for (const key of DIMENSION_KEYS) {
          const current = snap.dimensionScores?.[key];
          const base    = baseline[key];
          row[key] = current != null ? parseFloat(current.toFixed(2)) : null;
          row[`${key}_change`] = (current != null && base != null)
            ? parseFloat((current - base).toFixed(2))
            : null;
        }

        dataset.push(row);
      });
    }

    logger.info(`[researchExport] Longitudinal export by ${practitionerId}: ${dataset.length} rows`);

    return res.json({
      dataset,
      rowCount:      dataset.length,
      clientCount:   Object.keys(byClient).filter(k => byClient[k].length >= minSnapshots).length,
      columns:       [
        'researchId', 'ageGroup', 'wave', 'snapshotDate', 'dataSource',
        ...DIMENSION_KEYS,
        ...DIMENSION_KEYS.map(k => `${k}_change`),
      ],
      irbStatement:  'De-identified longitudinal dataset. No direct identifiers included. Client IDs are pseudonymous research codes.',
    });
  } catch (err) {
    logger.error('[researchExport] POST /longitudinal error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
