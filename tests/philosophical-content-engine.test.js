'use strict';

/**
 * philosophical-content-engine.test.js
 *
 * Tests for:
 *  - philosophical-quotes.js  (quote library shape & coverage)
 *  - philosophical-content-engine.js  (selector & formatters)
 *  - /api/insights routes  (HTTP integration via supertest)
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

process.env.JWT_SECRET          = 'test-secret';
process.env.MONGODB_URI         = 'mongodb://localhost/test';
process.env.STRIPE_SECRET_KEY   = 'sk_test_placeholder';
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

const {
  PHILOSOPHICAL_QUOTES,
  DIMENSION_SUBTITLES,
} = require('../backend/data/philosophical-quotes');

const {
  TOTAL_QUOTES,
  getQuoteForDay,
  getQuoteForDimension,
  buildInsight,
  formatEmail,
  formatXPost,
  formatLinkedInPost,
  formatGraphicPrompt,
  formatVideoScript,
  generateContentBundle,
  getDailyBundle,
} = require('../backend/services/philosophical-content-engine');

// ── Quote library tests ───────────────────────────────────────────────────────

describe('philosophical-quotes library', () => {
  const VALID_DIMENSIONS = Object.keys(DIMENSION_SUBTITLES);

  it('contains at least 42 entries', () => {
    expect(PHILOSOPHICAL_QUOTES.length).toBeGreaterThanOrEqual(42);
  });

  it('every entry has the required fields', () => {
    PHILOSOPHICAL_QUOTES.forEach((q) => {
      expect(q.id).toBeTruthy();
      expect(q.resilienceDimension).toBeTruthy();
      expect(q.subtitle).toBeTruthy();
      expect(q.quoteText).toBeTruthy();
      expect(q.quoteAuthor).toBeTruthy();
      expect(q.microPractice).toBeTruthy();
      expect(q.reflectionQuestion).toBeTruthy();
    });
  });

  it('all IDs are unique', () => {
    const ids = PHILOSOPHICAL_QUOTES.map(q => q.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every entry belongs to a valid resilience dimension', () => {
    PHILOSOPHICAL_QUOTES.forEach((q) => {
      expect(VALID_DIMENSIONS).toContain(q.resilienceDimension);
    });
  });

  it('every subtitle matches the dimension subtitle mapping', () => {
    PHILOSOPHICAL_QUOTES.forEach((q) => {
      expect(q.subtitle).toBe(DIMENSION_SUBTITLES[q.resilienceDimension]);
    });
  });

  it('covers all six resilience dimensions', () => {
    const dims = new Set(PHILOSOPHICAL_QUOTES.map(q => q.resilienceDimension));
    VALID_DIMENSIONS.forEach(d => expect(dims).toContain(d));
  });

  it('DIMENSION_SUBTITLES contains all six dimensions', () => {
    expect(Object.keys(DIMENSION_SUBTITLES)).toHaveLength(6);
  });
});

// ── Content engine — selector tests ──────────────────────────────────────────

describe('philosophical-content-engine — selectors', () => {
  it('TOTAL_QUOTES matches the library size', () => {
    expect(TOTAL_QUOTES).toBe(PHILOSOPHICAL_QUOTES.length);
  });

  it('getQuoteForDay(1) returns the first quote', () => {
    expect(getQuoteForDay(1)).toBe(PHILOSOPHICAL_QUOTES[0]);
  });

  it('getQuoteForDay wraps after exhausting the library', () => {
    const q1   = getQuoteForDay(1);
    const qWrap = getQuoteForDay(TOTAL_QUOTES + 1);
    expect(qWrap).toBe(q1);
  });

  it('getQuoteForDay(N) returns the Nth library entry (1-based)', () => {
    const n = 5;
    expect(getQuoteForDay(n)).toBe(PHILOSOPHICAL_QUOTES[n - 1]);
  });

  it('getQuoteForDimension returns a quote for the given dimension', () => {
    const q = getQuoteForDimension('Relational-Connective', 1);
    expect(q.resilienceDimension).toBe('Relational-Connective');
  });

  it('getQuoteForDimension returns null for unknown dimension', () => {
    expect(getQuoteForDimension('Unknown-Dimension', 1)).toBeNull();
  });

  it('getQuoteForDimension cycles within the dimension pool', () => {
    const pool = PHILOSOPHICAL_QUOTES.filter(q => q.resilienceDimension === 'Cognitive-Narrative');
    const q1   = getQuoteForDimension('Cognitive-Narrative', 1);
    const qWrap = getQuoteForDimension('Cognitive-Narrative', pool.length + 1);
    expect(qWrap).toBe(q1);
  });
});

// ── Content engine — formatter tests ─────────────────────────────────────────

describe('philosophical-content-engine — formatters', () => {
  let insight;

  beforeEach(() => {
    insight = buildInsight(PHILOSOPHICAL_QUOTES[0]);
  });

  describe('buildInsight()', () => {
    it('includes all expected fields', () => {
      expect(insight).toMatchObject({
        dimension:          expect.any(String),
        subtitle:           expect.any(String),
        quoteText:          expect.any(String),
        quoteAuthor:        expect.any(String),
        microPractice:      expect.any(String),
        reflectionQuestion: expect.any(String),
        callToAction:       expect.stringContaining('Resilience Atlas'),
        quoteId:            expect.any(String),
      });
    });
  });

  describe('formatEmail()', () => {
    it('returns subject, html, and text', () => {
      const email = formatEmail(insight);
      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');
    });

    it('subject contains the dimension name', () => {
      const { subject } = formatEmail(insight);
      expect(subject).toContain(insight.dimension);
    });

    it('html contains the quote text', () => {
      const { html } = formatEmail(insight);
      expect(html).toContain(insight.quoteText);
    });

    it('text contains the call to action', () => {
      const { text } = formatEmail(insight);
      expect(text).toContain('Resilience Atlas');
    });
  });

  describe('formatXPost()', () => {
    it('returns a string', () => {
      expect(typeof formatXPost(insight)).toBe('string');
    });

    it('is within 280 characters', () => {
      expect(formatXPost(insight).length).toBeLessThanOrEqual(280);
    });

    it('contains #ResilienceAtlas hashtag', () => {
      expect(formatXPost(insight)).toContain('#ResilienceAtlas');
    });
  });

  describe('formatLinkedInPost()', () => {
    it('returns a string', () => {
      expect(typeof formatLinkedInPost(insight)).toBe('string');
    });

    it('contains the author attribution', () => {
      expect(formatLinkedInPost(insight)).toContain(insight.quoteAuthor);
    });

    it('contains the call to action', () => {
      expect(formatLinkedInPost(insight)).toContain(insight.callToAction);
    });
  });

  describe('formatGraphicPrompt()', () => {
    it('returns a non-empty string', () => {
      const prompt = formatGraphicPrompt(insight);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('references the dimension', () => {
      expect(formatGraphicPrompt(insight)).toContain(insight.dimension);
    });
  });

  describe('formatVideoScript()', () => {
    it('returns a string with the word SCRIPT', () => {
      expect(formatVideoScript(insight)).toContain('SCRIPT');
    });

    it('contains the quote text', () => {
      expect(formatVideoScript(insight)).toContain(insight.quoteText);
    });
  });

  describe('generateContentBundle()', () => {
    it('returns all platform keys', () => {
      const bundle = generateContentBundle(PHILOSOPHICAL_QUOTES[0]);
      expect(bundle).toHaveProperty('insight');
      expect(bundle).toHaveProperty('email');
      expect(bundle).toHaveProperty('xPost');
      expect(bundle).toHaveProperty('linkedIn');
      expect(bundle).toHaveProperty('graphicPrompt');
      expect(bundle).toHaveProperty('videoScript');
    });
  });

  describe('getDailyBundle()', () => {
    it('returns a valid bundle for day 1', () => {
      const bundle = getDailyBundle(1);
      expect(bundle.insight.quoteId).toBe(PHILOSOPHICAL_QUOTES[0].id);
    });
  });
});

// ── HTTP route tests ──────────────────────────────────────────────────────────

describe('GET /api/insights/today', () => {
  it('returns 200 with ok:true and a data bundle', async () => {
    const res = await request(app).get('/api/insights/today');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('insight');
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('xPost');
    expect(res.body.data).toHaveProperty('linkedIn');
  });
});

describe('GET /api/insights/day/:dayNumber', () => {
  it('returns 200 for a valid day number', async () => {
    const res = await request(app).get('/api/insights/day/1');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.insight.quoteId).toBe(PHILOSOPHICAL_QUOTES[0].id);
  });

  it('returns 400 for a non-positive day number', async () => {
    const res = await request(app).get('/api/insights/day/0');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for a non-numeric day', async () => {
    const res = await request(app).get('/api/insights/day/abc');
    expect(res.status).toBe(400);
  });

  it('wraps correctly for a day number beyond the library size', async () => {
    const res = await request(app).get(`/api/insights/day/${TOTAL_QUOTES + 1}`);
    expect(res.status).toBe(200);
    expect(res.body.data.insight.quoteId).toBe(PHILOSOPHICAL_QUOTES[0].id);
  });
});

describe('GET /api/insights/quotes', () => {
  it('returns paginated quotes', async () => {
    const res = await request(app).get('/api/insights/quotes');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data.quotes)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('respects the dimension filter', async () => {
    const res = await request(app).get('/api/insights/quotes?dimension=Relational');
    expect(res.status).toBe(200);
    res.body.data.quotes.forEach(q => expect(q.resilienceDimension).toBe('Relational-Connective'));
  });

  it('returns an empty array for an unknown dimension filter', async () => {
    const res = await request(app).get('/api/insights/quotes?dimension=FakeDimension');
    expect(res.status).toBe(200);
    expect(res.body.data.quotes).toHaveLength(0);
  });

  it('respects limit parameter', async () => {
    const res = await request(app).get('/api/insights/quotes?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data.quotes.length).toBeLessThanOrEqual(5);
  });
});

describe('GET /api/insights/quotes/:id', () => {
  it('returns a full bundle for a valid quote id', async () => {
    const id  = PHILOSOPHICAL_QUOTES[0].id;
    const res = await request(app).get(`/api/insights/quotes/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.insight.quoteId).toBe(id);
  });

  it('returns 404 for an unknown quote id', async () => {
    const res = await request(app).get('/api/insights/quotes/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/insights/dimension/:name', () => {
  it('returns an insight for a valid dimension', async () => {
    const res = await request(app).get('/api/insights/dimension/Relational');
    expect(res.status).toBe(200);
    expect(res.body.data.insight.dimension).toBe('Relational-Connective');
  });

  it('returns 400 for an unknown dimension', async () => {
    const res = await request(app).get('/api/insights/dimension/Unknown');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('dimensions');
  });
});

describe('GET /api/insights/dimensions', () => {
  it('returns all six dimensions with quote counts', async () => {
    const res = await request(app).get('/api/insights/dimensions');
    expect(res.status).toBe(200);
    expect(res.body.data.dimensions).toHaveLength(6);
    res.body.data.dimensions.forEach(d => {
      expect(d.quoteCount).toBeGreaterThan(0);
    });
    expect(res.body.data.totalQuotes).toBe(TOTAL_QUOTES);
  });
});
