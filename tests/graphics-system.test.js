'use strict';

/**
 * graphics-system.test.js
 *
 * Tests for:
 *   - design-system.js              (design tokens)
 *   - canvas-layout.js              (SVG helpers)
 *   - image-generator.js            (multi-format SVG card generation)
 *   - social-content-generator.js   (Instagram, Facebook, full bundle)
 *   - content-distributor.js        (orchestration layer)
 *   - graphic-generation-scheduler.js (daily scheduler)
 *   - /api/insights/:id/graphics    (HTTP endpoint)
 *   - /api/insights/:id/social-content (HTTP endpoint)
 *   - /api/insights/:id/download/:format (HTTP endpoint)
 *   - /api/insights/:id/publish     (HTTP endpoint)
 */

jest.mock('winston', () => {
  const loggerInstance = {
    info:  jest.fn(),
    warn:  jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    add:   jest.fn(),
  };
  return {
    createLogger: jest.fn(() => loggerInstance),
    format: {
      combine:   jest.fn((...args) => args),
      timestamp: jest.fn(() => ({})),
      errors:    jest.fn(() => ({})),
      splat:     jest.fn(() => ({})),
      json:      jest.fn(() => ({})),
      colorize:  jest.fn(() => ({})),
      printf:    jest.fn((fn) => fn),
    },
    transports: {
      Console: function ConsoleTransport() {},
      File:    function FileTransport() {},
    },
  };
});

process.env.JWT_SECRET            = 'test-secret';
process.env.MONGODB_URI           = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY     = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';

jest.mock('mongoose', () => {
  class Schema {
    constructor() {}
    pre()    { return this; }
    index()  { return this; }
    methods = {};
  }
  Schema.Types = { ObjectId: String, Mixed: {} };
  return {
    connect: jest.fn().mockResolvedValue({}),
    Schema,
    model:  jest.fn(),
    Types:  { ObjectId: { isValid: jest.fn().mockReturnValue(true) } },
  };
});

const request = require('supertest');
const app     = require('../backend/server');

const { PHILOSOPHICAL_QUOTES } = require('../backend/data/philosophical-quotes');
const { buildInsight, generateContentBundle } = require('../backend/services/philosophical-content-engine');

const { COLORS, TYPOGRAPHY, FORMATS, BRANDING, LAYOUT } = require('../backend/config/design-system');

const {
  wrapText,
  renderBackground,
  renderCompassWatermark,
  renderHeadline,
  renderQuote,
  renderPractice,
  renderDimensionBadge,
  renderFooter,
  _escapeSvg,
} = require('../backend/services/canvas-layout');

const {
  getHeadlineForDimension,
  generateGraphic,
  generateAllGraphics,
  getGraphicsMetadata,
  DIMENSION_HEADLINES,
} = require('../backend/services/image-generator');

const {
  formatInstagramCaption,
  formatInstagramAltText,
  formatFacebookPost,
  generateSocialContent,
  DIMENSION_EMOJIS,
} = require('../backend/services/social-content-generator');

const {
  buildDistributionPackage,
  distributeByQuoteId,
  distributeForDay,
  generateGraphicForQuote,
  generateAllGraphicsForQuote,
  publishToAllChannels,
} = require('../backend/services/content-distributor');

const {
  runGraphicGenerationJob,
  dayOfYear,
  isoDate,
} = require('../backend/jobs/graphic-generation-scheduler');

// ── Shared fixture ─────────────────────────────────────────────────────────────

const SAMPLE_ENTRY   = PHILOSOPHICAL_QUOTES[0];
const SAMPLE_INSIGHT = buildInsight(SAMPLE_ENTRY);
const SAMPLE_BUNDLE  = generateContentBundle(SAMPLE_ENTRY);

// ── design-system.js ──────────────────────────────────────────────────────────

describe('design-system', () => {
  it('COLORS has primary, secondary, tertiary', () => {
    expect(COLORS).toHaveProperty('primary');
    expect(COLORS).toHaveProperty('secondary');
    expect(COLORS).toHaveProperty('tertiary');
  });

  it('TYPOGRAPHY has headline, quote, author, practice, cta', () => {
    ['headline', 'quote', 'author', 'practice', 'cta'].forEach((key) => {
      expect(TYPOGRAPHY).toHaveProperty(key);
      expect(TYPOGRAPHY[key]).toHaveProperty('size');
      expect(TYPOGRAPHY[key]).toHaveProperty('family');
    });
  });

  it('FORMATS has square, story, feed entries', () => {
    expect(FORMATS).toHaveProperty('square');
    expect(FORMATS).toHaveProperty('story');
    expect(FORMATS).toHaveProperty('feed');
    expect(FORMATS.square.width).toBe(1080);
    expect(FORMATS.square.height).toBe(1080);
    expect(FORMATS.story.height).toBe(1920);
    expect(FORMATS.feed.width).toBe(1200);
  });

  it('BRANDING has name and url', () => {
    expect(BRANDING.name).toContain('Resilience');
    expect(BRANDING.url).toBeTruthy();
  });

  it('LAYOUT has expected pixel constants', () => {
    expect(LAYOUT.padding).toBeGreaterThan(0);
    expect(LAYOUT.quoteTop).toBeGreaterThan(LAYOUT.headlineTop);
    expect(LAYOUT.practiceTop).toBeGreaterThan(LAYOUT.quoteTop);
  });
});

// ── canvas-layout.js ──────────────────────────────────────────────────────────

describe('canvas-layout — wrapText()', () => {
  it('returns a single line for short text', () => {
    const lines = wrapText('Short', 50);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Short');
  });

  it('wraps long text at word boundaries', () => {
    const text = 'This is a fairly long sentence that should be wrapped across multiple lines';
    const lines = wrapText(text, 20);
    expect(lines.length).toBeGreaterThan(1);
    lines.forEach((line) => expect(line.length).toBeLessThanOrEqual(21));
  });

  it('handles a single very long word', () => {
    const lines = wrapText('Supercalifragilisticexpialidocious', 10);
    expect(lines).toHaveLength(1);
  });
});

describe('canvas-layout — _escapeSvg()', () => {
  it('escapes ampersands', () => {
    expect(_escapeSvg('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(_escapeSvg('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(_escapeSvg('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(_escapeSvg("it's")).toBe('it&apos;s');
  });

  it('converts non-string values to string', () => {
    expect(_escapeSvg(42)).toBe('42');
  });
});

describe('canvas-layout — SVG renderers', () => {
  const W = 1080, H = 1080, scale = 1;

  it('renderBackground returns SVG with defs and rect', () => {
    const svg = renderBackground(W, H, 'testGrad');
    expect(svg).toContain('<defs>');
    expect(svg).toContain('<rect');
    expect(svg).toContain('testGrad');
  });

  it('renderCompassWatermark returns SVG circles and polygons', () => {
    const svg = renderCompassWatermark(540, 200, 55);
    expect(svg).toContain('<circle');
    expect(svg).toContain('<polygon');
  });

  it('renderHeadline returns a text element with the headline', () => {
    const svg = renderHeadline('When stress feels overwhelming', W, scale);
    expect(svg).toContain('<text');
    expect(svg).toContain('When stress feels overwhelming');
  });

  it('renderQuote includes the quote text and author', () => {
    const svg = renderQuote(SAMPLE_INSIGHT.quoteText, SAMPLE_INSIGHT.quoteAuthor, W, scale);
    expect(svg).toContain('<text');
    expect(svg).toContain(SAMPLE_INSIGHT.quoteAuthor);
  });

  it('renderPractice includes the practice text and label', () => {
    const svg = renderPractice(SAMPLE_INSIGHT.microPractice, W, scale);
    expect(svg).toContain('PRACTICE');
    expect(svg).toContain('<rect');
  });

  it('renderDimensionBadge returns the dimension in uppercase', () => {
    const svg = renderDimensionBadge(SAMPLE_INSIGHT.dimension, SAMPLE_INSIGHT.subtitle, W, scale);
    expect(svg).toContain(SAMPLE_INSIGHT.dimension.toUpperCase());
  });

  it('renderFooter returns a line and CTA text', () => {
    const svg = renderFooter(W, H, scale);
    expect(svg).toContain('<line');
    expect(svg).toContain('resilienceatlas.com');
  });

  it('renderQuote wraps long quotes into tspan elements', () => {
    const longQuote = 'The impediment to action advances action. What stands in the way becomes the way. Marcus Aurelius said this and it is very long.';
    const svg = renderQuote(longQuote, 'Marcus Aurelius', W, scale);
    expect(svg).toContain('<tspan');
  });
});

// ── image-generator.js ────────────────────────────────────────────────────────

describe('image-generator — getHeadlineForDimension()', () => {
  it('returns a headline for each known dimension', () => {
    Object.keys(DIMENSION_HEADLINES).forEach((dim) => {
      const h = getHeadlineForDimension(dim);
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(0);
    });
  });

  it('returns a default headline for unknown dimensions', () => {
    const h = getHeadlineForDimension('Unknown-Dimension');
    expect(typeof h).toBe('string');
    expect(h.length).toBeGreaterThan(0);
  });
});

describe('image-generator — generateGraphic()', () => {
  it('generates a square format SVG buffer', () => {
    const result = generateGraphic(SAMPLE_INSIGHT, 'square');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe('image/svg+xml');
    expect(result.extension).toBe('svg');
    expect(result.format.width).toBe(1080);
    expect(result.format.height).toBe(1080);
  });

  it('generates a story format SVG buffer', () => {
    const result = generateGraphic(SAMPLE_INSIGHT, 'story');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.format.height).toBe(1920);
  });

  it('generates a feed format SVG buffer', () => {
    const result = generateGraphic(SAMPLE_INSIGHT, 'feed');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.format.width).toBe(1200);
  });

  it('throws for an unknown format key', () => {
    expect(() => generateGraphic(SAMPLE_INSIGHT, 'nonexistent')).toThrow();
  });

  it('produced SVG contains the author name', () => {
    const { buffer } = generateGraphic(SAMPLE_INSIGHT, 'square');
    const svg = buffer.toString('utf8');
    expect(svg).toContain(SAMPLE_INSIGHT.quoteAuthor);
  });

  it('produced SVG contains the branding URL', () => {
    const { buffer } = generateGraphic(SAMPLE_INSIGHT, 'square');
    const svg = buffer.toString('utf8');
    expect(svg).toContain('resilienceatlas.com');
  });

  it('produced SVG is well-formed (starts with XML declaration)', () => {
    const { buffer } = generateGraphic(SAMPLE_INSIGHT, 'square');
    const svg = buffer.toString('utf8');
    expect(svg).toMatch(/^<\?xml/);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('SVG contains accessible title and desc elements', () => {
    const { buffer } = generateGraphic(SAMPLE_INSIGHT, 'square');
    const svg = buffer.toString('utf8');
    expect(svg).toContain('<title>');
    expect(svg).toContain('<desc>');
  });
});

describe('image-generator — generateAllGraphics()', () => {
  it('returns one entry per format', () => {
    const graphics = generateAllGraphics(SAMPLE_INSIGHT);
    expect(Object.keys(graphics)).toEqual(['square', 'story', 'feed']);
    Object.values(graphics).forEach((g) => {
      expect(g.buffer).toBeInstanceOf(Buffer);
    });
  });
});

describe('image-generator — getGraphicsMetadata()', () => {
  it('returns metadata for all three formats', () => {
    const meta = getGraphicsMetadata(SAMPLE_INSIGHT);
    expect(meta).toHaveLength(3);
    meta.forEach((m) => {
      expect(m).toHaveProperty('key');
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('width');
      expect(m).toHaveProperty('height');
      expect(m).toHaveProperty('uses');
      expect(m).toHaveProperty('mimeType', 'image/svg+xml');
    });
  });
});

// ── social-content-generator.js ───────────────────────────────────────────────

describe('social-content-generator — formatInstagramCaption()', () => {
  it('returns a string', () => {
    const caption = formatInstagramCaption(SAMPLE_INSIGHT);
    expect(typeof caption).toBe('string');
    expect(caption.length).toBeGreaterThan(0);
  });

  it('contains the quote text', () => {
    const caption = formatInstagramCaption(SAMPLE_INSIGHT);
    expect(caption).toContain(SAMPLE_INSIGHT.quoteText);
  });

  it('contains the author', () => {
    const caption = formatInstagramCaption(SAMPLE_INSIGHT);
    expect(caption).toContain(SAMPLE_INSIGHT.quoteAuthor);
  });

  it('contains #ResilienceAtlas hashtag', () => {
    const caption = formatInstagramCaption(SAMPLE_INSIGHT);
    expect(caption).toContain('#ResilienceAtlas');
  });

  it('contains the micro-practice', () => {
    const caption = formatInstagramCaption(SAMPLE_INSIGHT);
    expect(caption).toContain(SAMPLE_INSIGHT.microPractice);
  });

  it('contains a link to resilienceatlas.com', () => {
    const caption = formatInstagramCaption(SAMPLE_INSIGHT);
    expect(caption).toContain('resilienceatlas.com');
  });
});

describe('social-content-generator — formatInstagramAltText()', () => {
  it('returns a concise string with the dimension and quote', () => {
    const altText = formatInstagramAltText(SAMPLE_INSIGHT);
    expect(typeof altText).toBe('string');
    expect(altText).toContain(SAMPLE_INSIGHT.dimension);
    expect(altText).toContain(SAMPLE_INSIGHT.quoteAuthor);
  });
});

describe('social-content-generator — formatFacebookPost()', () => {
  it('returns a string', () => {
    const post = formatFacebookPost(SAMPLE_INSIGHT);
    expect(typeof post).toBe('string');
  });

  it('contains the quote and author', () => {
    const post = formatFacebookPost(SAMPLE_INSIGHT);
    expect(post).toContain(SAMPLE_INSIGHT.quoteText);
    expect(post).toContain(SAMPLE_INSIGHT.quoteAuthor);
  });

  it('contains the dimension name', () => {
    const post = formatFacebookPost(SAMPLE_INSIGHT);
    expect(post).toContain(SAMPLE_INSIGHT.dimension);
  });

  it('contains a sharing call to action', () => {
    const post = formatFacebookPost(SAMPLE_INSIGHT);
    expect(post).toContain('resilienceatlas.com');
  });
});

describe('social-content-generator — generateSocialContent()', () => {
  it('returns a structured object with all platforms', () => {
    const content = generateSocialContent(SAMPLE_BUNDLE);
    expect(content).toHaveProperty('insight');
    expect(content).toHaveProperty('platforms');
    expect(content.platforms).toHaveProperty('twitter');
    expect(content.platforms).toHaveProperty('linkedin');
    expect(content.platforms).toHaveProperty('instagram');
    expect(content.platforms).toHaveProperty('facebook');
    expect(content.platforms).toHaveProperty('email');
    expect(content.platforms).toHaveProperty('videoScript');
  });

  it('twitter content respects the 280-char limit', () => {
    const content = generateSocialContent(SAMPLE_BUNDLE);
    expect(content.platforms.twitter.post.length).toBeLessThanOrEqual(280);
  });

  it('instagram caption contains alt text', () => {
    const content = generateSocialContent(SAMPLE_BUNDLE);
    expect(content.platforms.instagram).toHaveProperty('caption');
    expect(content.platforms.instagram).toHaveProperty('altText');
  });

  it('email content has subject, html, and text', () => {
    const content = generateSocialContent(SAMPLE_BUNDLE);
    const { email } = content.platforms;
    expect(email).toHaveProperty('subject');
    expect(email).toHaveProperty('html');
    expect(email).toHaveProperty('text');
  });

  it('includes generatedAt timestamp', () => {
    const content = generateSocialContent(SAMPLE_BUNDLE);
    expect(content).toHaveProperty('generatedAt');
    expect(new Date(content.generatedAt).getTime()).not.toBeNaN();
  });
});

describe('social-content-generator — DIMENSION_EMOJIS', () => {
  it('has an emoji for each known dimension', () => {
    const dims = Object.keys(DIMENSION_EMOJIS);
    expect(dims.length).toBeGreaterThanOrEqual(6);
    dims.forEach((d) => {
      expect(typeof DIMENSION_EMOJIS[d]).toBe('string');
      expect(DIMENSION_EMOJIS[d].length).toBeGreaterThan(0);
    });
  });
});

// ── content-distributor.js ────────────────────────────────────────────────────

describe('content-distributor — buildDistributionPackage()', () => {
  it('returns a distribution package with all expected keys', () => {
    const pkg = buildDistributionPackage(SAMPLE_ENTRY);
    expect(pkg).toHaveProperty('quoteId');
    expect(pkg).toHaveProperty('dimension');
    expect(pkg).toHaveProperty('insight');
    expect(pkg).toHaveProperty('graphics');
    expect(pkg).toHaveProperty('social');
    expect(pkg).toHaveProperty('generatedAt');
    expect(pkg.status).toBe('ready');
  });

  it('graphics metadata has totalFormats = 3', () => {
    const pkg = buildDistributionPackage(SAMPLE_ENTRY);
    expect(pkg.graphics.totalFormats).toBe(3);
  });
});

describe('content-distributor — distributeByQuoteId()', () => {
  it('returns a package for a valid quote id', () => {
    const pkg = distributeByQuoteId(SAMPLE_ENTRY.id);
    expect(pkg.quoteId).toBe(SAMPLE_ENTRY.id);
  });

  it('throws for an unknown quote id', () => {
    expect(() => distributeByQuoteId('does-not-exist')).toThrow(/not found/i);
  });
});

describe('content-distributor — distributeForDay()', () => {
  it('returns a package for day 1', () => {
    const pkg = distributeForDay(1);
    expect(pkg).toHaveProperty('quoteId');
    expect(pkg.status).toBe('ready');
  });
});

describe('content-distributor — generateGraphicForQuote()', () => {
  it('returns a graphic buffer for a valid quote and format', () => {
    const result = generateGraphicForQuote(SAMPLE_ENTRY.id, 'square');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('throws for an invalid quote id', () => {
    expect(() => generateGraphicForQuote('bad-id', 'square')).toThrow();
  });

  it('throws for an invalid format', () => {
    expect(() => generateGraphicForQuote(SAMPLE_ENTRY.id, 'badformat')).toThrow();
  });
});

describe('content-distributor — generateAllGraphicsForQuote()', () => {
  it('returns all three formats for a valid quote', () => {
    const graphics = generateAllGraphicsForQuote(SAMPLE_ENTRY.id);
    expect(Object.keys(graphics)).toEqual(['square', 'story', 'feed']);
  });

  it('throws for an invalid quote id', () => {
    expect(() => generateAllGraphicsForQuote('bad-id')).toThrow();
  });
});

describe('content-distributor — publishToAllChannels()', () => {
  it('returns an array of 5 channel results', async () => {
    const pkg     = buildDistributionPackage(SAMPLE_ENTRY);
    const results = await publishToAllChannels(pkg);
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r).toHaveProperty('channel');
      expect(r).toHaveProperty('status');
    });
  });

  it('all stub channels return status "stub"', async () => {
    const pkg     = buildDistributionPackage(SAMPLE_ENTRY);
    const results = await publishToAllChannels(pkg);
    results.forEach((r) => expect(r.status).toBe('stub'));
  });
});

// ── graphic-generation-scheduler.js ──────────────────────────────────────────

describe('graphic-generation-scheduler — dayOfYear()', () => {
  it('returns 1 for January 1st', () => {
    expect(dayOfYear(new Date('2025-01-01T00:00:00Z'))).toBe(1);
  });

  it('returns 32 for February 1st', () => {
    expect(dayOfYear(new Date('2025-02-01T00:00:00Z'))).toBe(32);
  });

  it('returns a positive integer for today', () => {
    const d = dayOfYear();
    expect(Number.isInteger(d)).toBe(true);
    expect(d).toBeGreaterThanOrEqual(1);
  });
});

describe('graphic-generation-scheduler — isoDate()', () => {
  it('returns YYYY-MM-DD format', () => {
    expect(isoDate(new Date('2025-06-15T00:00:00Z'))).toBe('2025-06-15');
  });

  it('returns a string for today', () => {
    const s = isoDate();
    expect(typeof s).toBe('string');
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe('graphic-generation-scheduler — runGraphicGenerationJob()', () => {
  it('returns a distribution package', () => {
    const pkg = runGraphicGenerationJob(new Date('2025-01-01T06:00:00Z'));
    expect(pkg).toHaveProperty('quoteId');
    expect(pkg).toHaveProperty('dimension');
    expect(pkg.status).toBe('ready');
  });

  it('is idempotent — same date returns same quote', () => {
    const date = new Date('2025-01-01T06:00:00Z');
    const pkg1 = runGraphicGenerationJob(date);
    const pkg2 = runGraphicGenerationJob(date);
    expect(pkg1.quoteId).toBe(pkg2.quoteId);
  });
});

// ── HTTP routes — graphics system ─────────────────────────────────────────────

const VALID_QUOTE_ID = PHILOSOPHICAL_QUOTES[0].id;

describe('GET /api/insights/:insightId/graphics', () => {
  it('returns 200 with graphics metadata for a valid insight id', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/graphics`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('insightId', VALID_QUOTE_ID);
    expect(res.body.data).toHaveProperty('formats');
    expect(Array.isArray(res.body.data.formats)).toBe(true);
    expect(res.body.data.formats).toHaveLength(3);
  });

  it('returns 404 for an unknown insight id', async () => {
    const res = await request(app).get('/api/insights/does-not-exist/graphics');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('each format entry has key, width, height, and mimeType', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/graphics`);
    res.body.data.formats.forEach((fmt) => {
      expect(fmt).toHaveProperty('key');
      expect(fmt).toHaveProperty('width');
      expect(fmt).toHaveProperty('height');
      expect(fmt).toHaveProperty('mimeType', 'image/svg+xml');
    });
  });
});

describe('GET /api/insights/:insightId/social-content', () => {
  it('returns 200 with all platform content for a valid insight id', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/social-content`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('platforms');
    ['twitter', 'linkedin', 'instagram', 'facebook', 'email', 'videoScript'].forEach((p) => {
      expect(res.body.data.platforms).toHaveProperty(p);
    });
  });

  it('returns 404 for an unknown insight id', async () => {
    const res = await request(app).get('/api/insights/does-not-exist/social-content');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/insights/:insightId/download/:format', () => {
  it('returns 200 with SVG content for square format', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/download/square`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/svg/);
    const body = res.text || res.body.toString('utf8');
    expect(body).toContain('<svg');
    expect(body).toContain('</svg>');
  });

  it('returns 200 for story format', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/download/story`);
    expect(res.status).toBe(200);
    const body = res.text || res.body.toString('utf8');
    expect(body).toContain('<svg');
  });

  it('returns 200 for feed format', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/download/feed`);
    expect(res.status).toBe(200);
    const body = res.text || res.body.toString('utf8');
    expect(body).toContain('<svg');
  });

  it('returns 404 for an unknown insight id', async () => {
    const res = await request(app).get('/api/insights/does-not-exist/download/square');
    expect(res.status).toBe(404);
  });

  it('returns 400 for an unknown format', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/download/poster`);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('formats');
  });

  it('response includes X-Graphic-Width and X-Graphic-Height headers', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/download/square`);
    expect(res.headers['x-graphic-width']).toBe('1080');
    expect(res.headers['x-graphic-height']).toBe('1080');
  });

  it('Content-Disposition header suggests a filename', async () => {
    const res = await request(app).get(`/api/insights/${VALID_QUOTE_ID}/download/square`);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('.svg');
  });
});

describe('POST /api/insights/:insightId/publish', () => {
  it('returns 200 with channel results for a valid insight', async () => {
    const res = await request(app).post(`/api/insights/${VALID_QUOTE_ID}/publish`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('channels');
    expect(Array.isArray(res.body.data.channels)).toBe(true);
    expect(res.body.data.channels).toHaveLength(5);
  });

  it('returns 404 for an unknown insight', async () => {
    const res = await request(app).post('/api/insights/does-not-exist/publish');
    expect(res.status).toBe(404);
  });

  it('all channels report stub status', async () => {
    const res = await request(app).post(`/api/insights/${VALID_QUOTE_ID}/publish`);
    res.body.data.channels.forEach((ch) => {
      expect(ch.status).toBe('stub');
    });
  });

  it('publishedAt is an ISO timestamp', async () => {
    const res = await request(app).post(`/api/insights/${VALID_QUOTE_ID}/publish`);
    expect(res.body.data).toHaveProperty('publishedAt');
    expect(new Date(res.body.data.publishedAt).getTime()).not.toBeNaN();
  });
});
