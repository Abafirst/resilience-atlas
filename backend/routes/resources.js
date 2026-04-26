'use strict';

/**
 * resources.js — Content Library & Resource Hub REST routes
 *
 * Public endpoints (no auth required):
 *   GET  /api/resources                  — list / search / filter published resources
 *   GET  /api/resources/categories       — available categories & types
 *   GET  /api/resources/featured         — featured/highlighted resources
 *   GET  /api/resources/rss              — RSS feed of latest published resources
 *   GET  /api/resources/:id              — single resource detail
 *
 * Authenticated user endpoints:
 *   POST   /api/resources/:id/bookmark   — toggle bookmark
 *   POST   /api/resources/:id/complete   — mark resource as completed / update progress
 *   POST   /api/resources/:id/review     — submit or update rating + review
 *   GET    /api/resources/me/bookmarks   — list user's bookmarked resources
 *   GET    /api/resources/me/completed   — list completed resources
 *   POST   /api/resources/submit         — community resource submission (queued as draft)
 *
 * Admin endpoints (require role === 'admin'):
 *   POST   /api/resources                — create resource
 *   PUT    /api/resources/:id            — update resource
 *   DELETE /api/resources/:id            — delete resource
 *   PUT    /api/resources/:id/publish    — publish / unpublish
 *   GET    /api/resources/admin/all      — list all resources incl. drafts
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const mongoose  = require('mongoose');

const { authenticateJWT, optionalJWT } = require('../middleware/auth');
const logger = require('../utils/logger');

const Resource                = require('../models/Resource');
const UserResourceInteraction = require('../models/UserResourceInteraction');

const router = express.Router();

// ── Rate limiting ─────────────────────────────────────────────────────────────

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      30,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function userId(req) {
  return req.user && (req.user.id || req.user.userId);
}

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!isAdmin(req)) return res.status(403).json({ error: 'Admin access required.' });
  next();
}

/** Attach user interaction data to an array of resources */
async function attachInteractions(resources, uid) {
  if (!uid || !resources.length) return resources;

  const ids = resources.map(r => r._id || r.id);
  const interactions = await UserResourceInteraction.find({
    userId: uid,
    resourceId: { $in: ids },
  }).lean();

  const map = {};
  interactions.forEach(i => { map[i.resourceId.toString()] = i; });

  return resources.map(r => {
    const key = (r._id || r.id).toString();
    const interaction = map[key] || {};
    return {
      ...r,
      bookmarked: !!interaction.bookmarked,
      completed:  !!interaction.completed,
      progress:   interaction.progress || 0,
      userRating: interaction.rating || null,
    };
  });
}

// ── Recalculate averageRating for a resource ──────────────────────────────────

async function recalcRating(resourceId) {
  const result = await UserResourceInteraction.aggregate([
    { $match: { resourceId: new mongoose.Types.ObjectId(resourceId), rating: { $ne: null } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg   = result.length ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length ? result[0].count : 0;
  await Resource.findByIdAndUpdate(resourceId, { averageRating: avg, reviewCount: count });
}

// ── Slug uniqueness helper ────────────────────────────────────────────────────

async function uniqueSlug(base) {
  let slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

  let exists = await Resource.findOne({ slug });
  let i = 1;
  while (exists) {
    slug = `${slug.slice(0, 95)}-${i}`;
    exists = await Resource.findOne({ slug });
    i++;
  }
  return slug;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/resources/categories ────────────────────────────────────────────

router.get('/categories', readLimiter, (req, res) => {
  res.json({
    categories: ['nutrition', 'exercise', 'meditation', 'sleep', 'relationships', 'career', 'general', 'clinician', 'caregiver'],
    types:      ['article', 'video', 'pdf', 'quiz', 'podcast', 'expert'],
    difficulties: ['beginner', 'intermediate', 'advanced'],
    dimensions: [
      'Cognitive-Narrative',
      'Emotional-Somatic',
      'Relational-Social',
      'Agentic-Generative',
      'Somatic-Regulative',
      'Spiritual-Reflective',
    ],
  });
});

// ── GET /api/resources/admin/all ─────────────────────────────────────────────

router.get('/admin/all', readLimiter, authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const {
      page  = 1,
      limit = 20,
      status,
      type,
      category,
    } = req.query;

    const query = {};
    if (status)   query.status   = status;
    if (type)     query.type     = type;
    if (category) query.category = category;

    const skip  = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));
    const lim   = Math.min(100, parseInt(limit, 10));
    const total = await Resource.countDocuments(query);
    const items = await Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim)
      .lean();

    res.json({ resources: items, total, page: parseInt(page, 10), limit: lim });
  } catch (err) {
    logger.error('resources/admin/all error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/featured ──────────────────────────────────────────────

router.get('/featured', readLimiter, optionalJWT, async (req, res) => {
  try {
    const items = await Resource.find({ status: 'published' })
      .sort({ viewCount: -1, averageRating: -1 })
      .limit(6)
      .lean();

    const uid = userId(req);
    const enriched = await attachInteractions(items, uid);
    res.json({ resources: enriched });
  } catch (err) {
    logger.error('resources/featured error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/rss ────────────────────────────────────────────────────

router.get('/rss', readLimiter, async (req, res) => {
  try {
    const items = await Resource.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(20)
      .lean();

    const baseUrl = process.env.APP_URL || 'https://resilience-atlas.com';
    const escape  = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const itemsXml = items.map(r => `
    <item>
      <title>${escape(r.title)}</title>
      <link>${baseUrl}/resources/${escape(r.slug || r._id)}</link>
      <description>${escape(r.excerpt || r.description || '')}</description>
      <pubDate>${new Date(r.publishedAt || r.createdAt).toUTCString()}</pubDate>
      <guid>${baseUrl}/resources/${escape(r.slug || r._id)}</guid>
      <category>${escape(r.category)}</category>
    </item>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Resilience Atlas Resource Library</title>
    <link>${baseUrl}/resources</link>
    <description>Curated resilience articles, videos, workbooks, and expert resources</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  } catch (err) {
    logger.error('resources/rss error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/me/bookmarks ──────────────────────────────────────────

router.get('/me/bookmarks', readLimiter, authenticateJWT, async (req, res) => {
  try {
    const uid = userId(req);
    const interactions = await UserResourceInteraction.find({ userId: uid, bookmarked: true })
      .sort({ bookmarkedAt: -1 })
      .lean();

    const resourceIds = interactions.map(i => i.resourceId);
    const resources   = await Resource.find({ _id: { $in: resourceIds }, status: 'published' }).lean();

    const ordered = resourceIds
      .map(id => resources.find(r => r._id.toString() === id.toString()))
      .filter(Boolean)
      .map(r => ({ ...r, bookmarked: true }));

    res.json({ resources: ordered });
  } catch (err) {
    logger.error('resources/me/bookmarks error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/me/completed ──────────────────────────────────────────

router.get('/me/completed', readLimiter, authenticateJWT, async (req, res) => {
  try {
    const uid = userId(req);
    const interactions = await UserResourceInteraction.find({ userId: uid, completed: true })
      .sort({ completedAt: -1 })
      .lean();

    const resourceIds = interactions.map(i => i.resourceId);
    const resources   = await Resource.find({ _id: { $in: resourceIds } }).lean();

    const ordered = resourceIds
      .map(id => resources.find(r => r._id.toString() === id.toString()))
      .filter(Boolean)
      .map(r => {
        const ix = interactions.find(i => i.resourceId.toString() === r._id.toString());
        return { ...r, completed: true, completedAt: ix && ix.completedAt };
      });

    res.json({ resources: ordered });
  } catch (err) {
    logger.error('resources/me/completed error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources ────────────────────────────────────────────────────────

router.get('/', readLimiter, optionalJWT, async (req, res) => {
  try {
    const {
      q,
      type,
      category,
      difficulty,
      dimension,
      tag,
      page  = 1,
      limit = 12,
      sort  = 'newest',
    } = req.query;

    const query = { status: 'published' };

    if (type)       query.type       = type;
    if (category)   query.category   = category;
    if (difficulty) query.difficulty = difficulty;
    if (dimension)  query.dimensions = dimension;
    if (tag)        query.tags       = tag;

    if (q && q.trim()) {
      query.$text = { $search: q.trim() };
    }

    const sortMap = {
      newest:    { publishedAt: -1 },
      oldest:    { publishedAt:  1 },
      popular:   { viewCount: -1 },
      rated:     { averageRating: -1 },
      shortest:  { timeCommitment: 1 },
    };
    const sortObj = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page,  10));
    const limNum  = Math.min(50, parseInt(limit, 10));
    const skip    = (pageNum - 1) * limNum;

    const [total, items] = await Promise.all([
      Resource.countDocuments(query),
      Resource.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limNum)
        .lean(),
    ]);

    // Increment view counts in background (fire-and-forget)
    Resource.updateMany(
      { _id: { $in: items.map(r => r._id) } },
      { $inc: { viewCount: 1 } }
    ).catch(() => {});

    const uid      = userId(req);
    const enriched = await attachInteractions(items, uid);

    res.json({
      resources: enriched,
      total,
      page:  pageNum,
      limit: limNum,
      pages: Math.ceil(total / limNum),
    });
  } catch (err) {
    logger.error('resources GET / error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/:id ────────────────────────────────────────────────────

router.get('/:id', readLimiter, optionalJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const resource = mongoose.Types.ObjectId.isValid(id)
      ? await Resource.findOne({ _id: id, status: 'published' }).lean()
      : await Resource.findOne({ slug: id, status: 'published' }).lean();

    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    // Fetch related resources (same category or overlapping dimensions)
    const related = await Resource.find({
      _id:    { $ne: resource._id },
      status: 'published',
      $or: [
        { category:   resource.category },
        { dimensions: { $in: resource.dimensions } },
      ],
    })
      .sort({ averageRating: -1 })
      .limit(4)
      .lean();

    // Fetch reviews
    const reviews = await UserResourceInteraction.find({
      resourceId: resource._id,
      rating:     { $ne: null },
    })
      .sort({ reviewedAt: -1 })
      .limit(10)
      .lean();

    const uid = userId(req);
    let userInteraction = null;
    if (uid) {
      userInteraction = await UserResourceInteraction.findOne({
        userId:     uid,
        resourceId: resource._id,
      }).lean();
    }

    res.json({
      resource: {
        ...resource,
        bookmarked: !!(userInteraction && userInteraction.bookmarked),
        completed:  !!(userInteraction && userInteraction.completed),
        progress:   userInteraction ? userInteraction.progress : 0,
        userRating: userInteraction ? userInteraction.rating : null,
      },
      related,
      reviews: reviews.map(r => ({
        rating:     r.rating,
        reviewText: r.reviewText,
        reviewedAt: r.reviewedAt,
      })),
    });
  } catch (err) {
    logger.error('resources GET /:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED USER ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── POST /api/resources/:id/bookmark ─────────────────────────────────────────

router.post('/:id/bookmark', writeLimiter, authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const resource = await Resource.findOne({ _id: id, status: 'published' });
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const uid = userId(req);
    const interaction = await UserResourceInteraction.findOneAndUpdate(
      { userId: uid, resourceId: id },
      [
        {
          $set: {
            bookmarked:   { $not: '$bookmarked' },
            bookmarkedAt: {
              $cond: [{ $not: '$bookmarked' }, new Date(), '$bookmarkedAt'],
            },
          },
        },
      ],
      { upsert: true, new: true }
    );

    // Update bookmarkCount on resource
    await Resource.findByIdAndUpdate(id, {
      bookmarkCount: await UserResourceInteraction.countDocuments({ resourceId: id, bookmarked: true }),
    });

    res.json({
      bookmarked: interaction.bookmarked,
      message:    interaction.bookmarked ? 'Resource bookmarked.' : 'Bookmark removed.',
    });
  } catch (err) {
    logger.error('resources/:id/bookmark error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/resources/:id/complete ─────────────────────────────────────────

router.post('/:id/complete', writeLimiter, authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const rawProgress = req.body.progress;
    const progress    = rawProgress !== undefined
      ? Math.min(100, Math.max(0, parseInt(rawProgress, 10)))
      : 100;
    const completed   = progress === 100;

    const uid = userId(req);
    const interaction = await UserResourceInteraction.findOneAndUpdate(
      { userId: uid, resourceId: id },
      {
        $set: {
          progress,
          completed,
          completedAt: completed ? new Date() : null,
        },
      },
      { upsert: true, new: true }
    );

    if (completed) {
      await Resource.findByIdAndUpdate(id, {
        completionCount: await UserResourceInteraction.countDocuments({ resourceId: id, completed: true }),
      });
    }

    res.json({
      progress:    interaction.progress,
      completed:   interaction.completed,
      completedAt: interaction.completedAt,
      message:     completed ? 'Resource marked as completed.' : 'Progress updated.',
    });
  } catch (err) {
    logger.error('resources/:id/complete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/resources/:id/review ───────────────────────────────────────────

router.post('/:id/review', writeLimiter, authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const resource = await Resource.findOne({ _id: id, status: 'published' });
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const rating = parseInt(req.body.rating, 10);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be an integer between 1 and 5.' });
    }

    const reviewText = (req.body.reviewText || '').toString().slice(0, 1000);

    const uid = userId(req);
    await UserResourceInteraction.findOneAndUpdate(
      { userId: uid, resourceId: id },
      { $set: { rating, reviewText, reviewedAt: new Date() } },
      { upsert: true }
    );

    await recalcRating(id);

    res.json({ message: 'Review submitted.', rating });
  } catch (err) {
    logger.error('resources/:id/review error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/resources/submit ────────────────────────────────────────────────

router.post('/submit', writeLimiter, authenticateJWT, async (req, res) => {
  try {
    const {
      title,
      type,
      url,
      description,
      category,
    } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required.' });
    if (!type)                    return res.status(400).json({ error: 'type is required.' });

    const VALID_TYPES = new Set(['article', 'video', 'pdf', 'quiz', 'podcast', 'expert']);
    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ error: `type must be one of: ${[...VALID_TYPES].join(', ')}.` });
    }

    const slug = await uniqueSlug(title.trim());
    const uid  = userId(req);

    const resource = await Resource.create({
      title:              title.trim(),
      slug,
      type,
      url:                url   || '',
      description:        description || '',
      category:           category    || 'general',
      status:             'draft',
      communitySubmitted: true,
      submittedBy:        uid,
    });

    res.status(201).json({
      message:  'Resource submitted for review. Thank you!',
      resource: { _id: resource._id, title: resource.title, slug: resource.slug },
    });
  } catch (err) {
    logger.error('resources/submit error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// ── POST /api/resources ───────────────────────────────────────────────────────

router.post('/', writeLimiter, authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      type,
      description,
      excerpt,
      content,
      url,
      videoProvider,
      videoId,
      pdfUrl,
      thumbnailUrl,
      category,
      tags,
      dimensions,
      difficulty,
      timeCommitment,
      authorName,
      expertName,
      expertTitle,
      expertBio,
      expertContactUrl,
      status,
      scheduledAt,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!title || !title.trim()) return res.status(400).json({ error: 'title is required.' });
    if (!type)                    return res.status(400).json({ error: 'type is required.' });

    const slug        = await uniqueSlug(title.trim());
    const publishedAt = status === 'published' ? new Date() : null;

    const resource = await Resource.create({
      title: title.trim(),
      slug,
      type,
      description:    description    || '',
      excerpt:        excerpt        || '',
      content:        content        || '',
      url:            url            || '',
      videoProvider:  videoProvider  || null,
      videoId:        videoId        || '',
      pdfUrl:         pdfUrl         || '',
      thumbnailUrl:   thumbnailUrl   || '',
      category:       category       || 'general',
      tags:           Array.isArray(tags)       ? tags       : [],
      dimensions:     Array.isArray(dimensions) ? dimensions : [],
      difficulty:     difficulty     || 'beginner',
      timeCommitment: timeCommitment || 5,
      authorName:     authorName     || '',
      author:         userId(req),
      expertName:     expertName     || '',
      expertTitle:    expertTitle    || '',
      expertBio:      expertBio      || '',
      expertContactUrl: expertContactUrl || '',
      status:         status         || 'draft',
      publishedAt,
      scheduledAt:    scheduledAt    || null,
      metaTitle:      metaTitle      || '',
      metaDescription: metaDescription || '',
    });

    res.status(201).json({ resource });
  } catch (err) {
    logger.error('resources POST / error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/resources/:id ────────────────────────────────────────────────────

router.put('/:id', writeLimiter, authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const allowed = [
      'title', 'description', 'excerpt', 'content', 'url',
      'videoProvider', 'videoId', 'pdfUrl', 'thumbnailUrl',
      'category', 'tags', 'dimensions', 'difficulty', 'timeCommitment',
      'authorName', 'expertName', 'expertTitle', 'expertBio', 'expertContactUrl',
      'scheduledAt', 'metaTitle', 'metaDescription', 'type',
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) resource[field] = req.body[field];
    });

    await resource.save();
    res.json({ resource });
  } catch (err) {
    logger.error('resources PUT /:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/resources/:id/publish ────────────────────────────────────────────

router.put('/:id/publish', writeLimiter, authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const publish = req.body.publish !== false;
    resource.status      = publish ? 'published' : 'draft';
    resource.publishedAt = publish ? (resource.publishedAt || new Date()) : null;
    await resource.save();

    res.json({
      resource,
      message: publish ? 'Resource published.' : 'Resource unpublished.',
    });
  } catch (err) {
    logger.error('resources PUT /:id/publish error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/resources/:id ─────────────────────────────────────────────────

router.delete('/:id', writeLimiter, authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid resource ID.' });
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    await resource.deleteOne();
    await UserResourceInteraction.deleteMany({ resourceId: id });

    res.json({ message: 'Resource deleted.' });
  } catch (err) {
    logger.error('resources DELETE /:id error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
