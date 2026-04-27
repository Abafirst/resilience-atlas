'use strict';

/**
 * iatlas-parent.js — Parent dashboard routes for IATLAS Family tier.
 *
 * Provides parents with visibility into all their enrolled children's progress
 * WITHOUT exposing assessment scores or performance ratings.
 *
 * Endpoints:
 *   GET /api/iatlas/parent/children-progress          — All children + progress
 *   GET /api/iatlas/parent/suggested-activities/:childId — Personalised suggestions
 *   GET /api/iatlas/parent/progress-report/:childId   — Printable HTML report
 */

const express   = require('express');
const router    = express.Router();
const rateLimit = require('express-rate-limit');

const { authenticateJWT } = require('../middleware/auth');
const ChildProfile        = require('../models/ChildProfile');
const IATLASProgress      = require('../models/IATLASProgress');
const logger              = require('../utils/logger');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const parentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

router.use(parentLimiter);
router.use(authenticateJWT);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extract userId string from the verified JWT payload. */
function getUserId(req) {
  const raw = req.user?.userId || req.user?.sub || req.user?.id || null;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/**
 * Sanitize a childId (profileId) from route params.
 * Accepts only non-empty strings of alphanumeric characters, hyphens, and
 * underscores (UUIDs, short IDs).  Returns null for any other value.
 */
function sanitizeChildId(value) {
  if (!value || typeof value !== 'string') return null;
  return /^[a-zA-Z0-9_-]{1,128}$/.test(value) ? value : null;
}

/** Empty progress shape returned when no IATLASProgress document exists yet. */
function emptyIATLASProgress() {
  return {
    completedActivities: [],
    dimensionProgress: {
      'agentic-generative':    0,
      'somatic-regulative':    0,
      'cognitive-narrative':   0,
      'relational-connective': 0,
      'emotional-adaptive':    0,
      'spiritual-existential': 0,
    },
    unlockedBadges:  [],
    totalXP:         0,
    currentStreak:   0,
    longestStreak:   0,
    lastActivityDate: null,
    milestones:      [],
  };
}

// ── GET /children-progress ────────────────────────────────────────────────────

/**
 * Returns all non-archived child profiles for the authenticated parent, each
 * enriched with their IATLASProgress data (completions, badges, XP, streaks).
 *
 * Response:
 *   { children: Array<{ childId, name, ageGroup, avatar, progress }> }
 */
router.get('/children-progress', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }

  try {
    const profiles = await ChildProfile.find({
      userId:   userId.toString(),
      archived: false,
    }).lean();

    const children = await Promise.all(
      profiles.map(async (profile) => {
        const progressDoc = await IATLASProgress.findOne({
          userId:         userId.toString(),
          childProfileId: profile.profileId,
        }).lean();

        return {
          childId:  profile.profileId,
          name:     profile.name,
          ageGroup: profile.ageGroup || null,
          avatar:   profile.avatar   || '🧒',
          progress: progressDoc || emptyIATLASProgress(),
        };
      })
    );

    return res.json({ children });
  } catch (err) {
    logger.error('[iatlas-parent/children-progress] error:', err);
    return res.status(500).json({ error: 'Failed to load children progress.' });
  }
});

// ── GET /suggested-activities/:childId ───────────────────────────────────────

/**
 * Returns personalised activity suggestions for a specific child based on
 * which dimensions they have practised the least.
 *
 * The response contains up to 6 activity suggestions drawn from dimensions
 * with the lowest completion counts, prioritising variety across dimensions.
 *
 * Response:
 *   { suggestions: Array<{ dimension, activityId, title, description }> }
 */
router.get('/suggested-activities/:childId', async (req, res) => {
  const userId  = getUserId(req);
  const childId = sanitizeChildId(req.params.childId);

  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }
  if (!childId) {
    return res.status(400).json({ error: 'Invalid childId.' });
  }

  try {
    // Verify parent owns this child profile.
    const profile = await ChildProfile.findOne({
      profileId: childId,
      userId:    userId.toString(),
      archived:  false,
    }).lean();

    if (!profile) {
      return res.status(403).json({ error: 'Child profile not found or access denied.' });
    }

    const progressDoc = await IATLASProgress.findOne({
      userId:         userId.toString(),
      childProfileId: childId,
    }).lean();

    const progress = progressDoc || emptyIATLASProgress();

    // Sort dimensions by completion count ascending so we suggest under-
    // practised areas first.
    const dp = progress.dimensionProgress || {};
    const sortedDimensions = [
      'agentic-generative',
      'somatic-regulative',
      'cognitive-narrative',
      'relational-connective',
      'emotional-adaptive',
      'spiritual-existential',
    ].sort((a, b) => (dp[a] || 0) - (dp[b] || 0));

    const completedIds = new Set(
      (progress.completedActivities || []).map((a) => a.activityId)
    );

    // Build up to 6 suggestions — 1 per dimension from the least-practised
    // dimensions.  Each suggestion is a dimension-level prompt rather than
    // a specific activity ID, because the full activity catalogue lives on
    // the client.  The client uses the dimension + ageGroup to filter the
    // actual catalogue.
    const dimensionMeta = {
      'agentic-generative':    { title: 'Agentic-Generative',    emoji: '🎯' },
      'somatic-regulative':    { title: 'Somatic-Regulative',    emoji: '🧘' },
      'cognitive-narrative':   { title: 'Cognitive-Narrative',   emoji: '🧠' },
      'relational-connective': { title: 'Relational-Connective', emoji: '🤝' },
      'emotional-adaptive':    { title: 'Emotional-Adaptive',    emoji: '💚' },
      'spiritual-existential': { title: 'Spiritual-Existential', emoji: '✨' },
    };

    const suggestions = sortedDimensions.slice(0, 6).map((dim) => ({
      dimension:   dim,
      title:       dimensionMeta[dim]?.title || dim,
      emoji:       dimensionMeta[dim]?.emoji || '📚',
      completions: dp[dim] || 0,
      ageGroup:    profile.ageGroup || null,
      // Provide the browse URL the client can use to link directly to activities.
      browseUrl:   profile.ageGroup
        ? `/iatlas/kids/${profile.ageGroup}/${dim}`
        : `/iatlas/kids/catalog`,
      // Flag dimensions that have been completely untouched (priority = high).
      isPriority:  (dp[dim] || 0) === 0,
      // Exclude activity IDs that are already completed (informational only).
      completedCount: completedIds.size,
    }));

    return res.json({ suggestions });
  } catch (err) {
    logger.error('[iatlas-parent/suggested-activities] error:', err);
    return res.status(500).json({ error: 'Failed to generate suggestions.' });
  }
});

// ── GET /progress-report/:childId ────────────────────────────────────────────

/**
 * Generates a printable HTML progress report for a specific child.
 *
 * The report intentionally shows only COMPLETION-based data (activities done,
 * badges earned, streak) — no assessment scores or performance ratings.
 *
 * Response: text/html document with @media print CSS for clean printing.
 */
router.get('/progress-report/:childId', async (req, res) => {
  const userId  = getUserId(req);
  const childId = sanitizeChildId(req.params.childId);

  if (!userId) {
    return res.status(401).json({ error: 'User identity could not be determined.' });
  }
  if (!childId) {
    return res.status(400).json({ error: 'Invalid childId.' });
  }

  try {
    // Verify parent owns this child profile.
    const profile = await ChildProfile.findOne({
      profileId: childId,
      userId:    userId.toString(),
      archived:  false,
    }).lean();

    if (!profile) {
      return res.status(403).json({ error: 'Child profile not found or access denied.' });
    }

    const progressDoc = await IATLASProgress.findOne({
      userId:         userId.toString(),
      childProfileId: childId,
    }).lean();

    const progress = progressDoc || emptyIATLASProgress();
    const html     = buildProgressReportHTML(profile, progress);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Prevent caching of personal progress reports.
    res.setHeader('Cache-Control', 'no-store');
    return res.send(html);
  } catch (err) {
    logger.error('[iatlas-parent/progress-report] error:', err);
    return res.status(500).json({ error: 'Failed to generate report.' });
  }
});

// ── HTML report builder ───────────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildProgressReportHTML(profile, progress) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const name       = escapeHtml(profile.name  || 'Your child');
  const ageGroup   = escapeHtml(profile.ageGroup || '');
  const completed  = (progress.completedActivities  || []).length;
  const badges     = (progress.unlockedBadges        || []).length;
  const streak     = progress.currentStreak          || 0;
  const year       = new Date().getFullYear();

  const badgeRows = (progress.unlockedBadges || []).map((b) => `
    <div class="badge">
      <div class="badge-icon" aria-hidden="true">🏅</div>
      <p class="badge-name">${escapeHtml(b.badgeId || 'Badge')}</p>
      <p class="badge-date">${b.unlockedAt ? new Date(b.unlockedAt).toLocaleDateString() : ''}</p>
    </div>
  `).join('') || '<p class="empty-msg">No badges earned yet — keep exploring!</p>';

  const activityRows = (progress.completedActivities || [])
    .slice(-10)
    .reverse()
    .map((a) => `
      <li class="activity-item">
        <span class="activity-name">${escapeHtml(a.activityId || '')}${a.dimension ? ' &bull; ' + escapeHtml(a.dimension) : ''}</span>
        <span class="activity-date">${a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ''}</span>
      </li>
    `).join('') || '<li class="empty-msg">No activities completed yet.</li>';

  const dimensionMeta = {
    'agentic-generative':    'Agentic-Generative',
    'somatic-regulative':    'Somatic-Regulative',
    'cognitive-narrative':   'Cognitive-Narrative',
    'relational-connective': 'Relational-Connective',
    'emotional-adaptive':    'Emotional-Adaptive',
    'spiritual-existential': 'Spiritual-Existential',
  };

  const dp = progress.dimensionProgress || {};
  const dimensionRows = Object.entries(dimensionMeta).map(([key, label]) => {
    const count = dp[key] || 0;
    return `
      <div class="dim-row">
        <span class="dim-label">${escapeHtml(label)}</span>
        <span class="dim-count">${count} activit${count === 1 ? 'y' : 'ies'}</span>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}'s IATLAS Progress Report</title>
  <style>
    @media print {
      body { margin: 0; padding: 15mm; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      max-width: 820px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      background: #fff;
      color: #1e293b;
      line-height: 1.5;
    }
    h1 { font-size: 1.9rem; margin: 0 0 .3rem; color: #0891b2; }
    h2 { font-size: 1.15rem; margin: 2rem 0 .75rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: .4rem; }
    .meta { color: #64748b; font-size: .875rem; margin-bottom: 1.5rem; }
    .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1.5rem 0; }
    .stat-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 1.25rem 1rem; text-align: center; }
    .stat-value { font-size: 2.4rem; font-weight: 800; color: #0891b2; line-height: 1; }
    .stat-label { font-size: .78rem; color: #64748b; text-transform: uppercase; letter-spacing: .06em; margin-top: .35rem; }
    .badge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: .75rem; margin: 1rem 0; }
    .badge { background: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: .9rem .75rem; text-align: center; }
    .badge-icon { font-size: 1.8rem; line-height: 1; margin-bottom: .3rem; }
    .badge-name { font-size: .78rem; font-weight: 700; margin: 0 0 .15rem; color: #92400e; word-break: break-word; }
    .badge-date { font-size: .72rem; color: #b45309; margin: 0; }
    .activity-list { list-style: none; padding: 0; margin: 0; }
    .activity-item { display: flex; justify-content: space-between; align-items: baseline; padding: .6rem .5rem; border-bottom: 1px solid #f1f5f9; font-size: .85rem; }
    .activity-item:last-child { border-bottom: none; }
    .activity-name { color: #334155; flex: 1; padding-right: 1rem; }
    .activity-date { color: #94a3b8; white-space: nowrap; font-size: .8rem; }
    .dim-row { display: flex; justify-content: space-between; align-items: center; padding: .55rem .5rem; border-bottom: 1px solid #f1f5f9; font-size: .875rem; }
    .dim-row:last-child { border-bottom: none; }
    .dim-label { color: #334155; }
    .dim-count { font-weight: 700; color: #0891b2; }
    .empty-msg { color: #94a3b8; font-size: .875rem; font-style: italic; padding: .5rem 0; }
    .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: .78rem; }
    .footer strong { color: #64748b; }
    .print-btn {
      display: inline-block;
      background: #0891b2;
      color: #fff;
      border: none;
      padding: .7rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: .9rem;
      cursor: pointer;
      margin-top: 1.5rem;
      font-family: inherit;
    }
    .print-btn:hover { background: #0e7490; }
    @media (max-width: 600px) {
      .stat-grid { grid-template-columns: 1fr; }
      .badge-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <h1>${name}&rsquo;s IATLAS Progress Report</h1>
  <p class="meta">
    Generated on ${today}${ageGroup ? ' &bull; Age group: ' + escapeHtml(ageGroup) : ''}
    &bull; IATLAS&trade; Resilience Curriculum
  </p>

  <div class="stat-grid" role="region" aria-label="Summary statistics">
    <div class="stat-card">
      <div class="stat-value">${completed}</div>
      <div class="stat-label">Activities Completed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${badges}</div>
      <div class="stat-label">Badges Earned</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${streak}</div>
      <div class="stat-label">Day Streak</div>
    </div>
  </div>

  <h2>Dimension Activity Counts</h2>
  <div role="region" aria-label="Activities by dimension">
    ${dimensionRows}
  </div>

  <h2>Badges Earned</h2>
  <div class="badge-grid" role="list" aria-label="Earned badges">
    ${badgeRows}
  </div>

  <h2>Recent Activities <span style="font-size:.85rem;font-weight:400;color:#94a3b8">(last 10)</span></h2>
  <ul class="activity-list" role="list" aria-label="Recent activity history">
    ${activityRows}
  </ul>

  <footer class="footer">
    <strong>IATLAS&trade;</strong> &mdash; Integrated Applied Teaching and Learning Adaptive System<br>
    Progress tracking focuses on skills practised, not performance scores.<br>
    &copy; ${year} The Resilience Atlas&trade; &bull; theresilienceatlas.com
  </footer>

  <button class="no-print print-btn" onclick="window.print()" type="button">
    &#128424;&#65039; Print Report
  </button>
</body>
</html>`;
}

module.exports = router;
