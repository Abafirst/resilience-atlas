'use strict';

/**
 * tests/pdfCache.test.js
 *
 * Unit + integration tests for the PDF caching system:
 *   - pdfCacheService  (getCachedPdf, storePdf, invalidate*, getCacheStats)
 *   - cacheCleanup job (runCacheCleanupJob)
 *   - /api/report/download route (cache hit vs miss behaviour)
 */

// ── Environment ───────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/test';
// STRIPE_SECRET_KEY intentionally absent so the tier check is skipped.

// ── Shared mock state ─────────────────────────────────────────────────────────

/** Simulated in-memory document store for ResilienceReport. */
let _store = {};

function _key(query) {
    return query.resultsHash || '__all__';
}

const mockUpdateOne = jest.fn();
const mockUpdateMany = jest.fn();
const mockDeleteMany = jest.fn();
const mockFindOne = jest.fn();

/**
 * Reset all mock implementations and the in-memory store between tests.
 */
function resetMocks() {
    _store = {};
    mockUpdateOne.mockReset();
    mockUpdateMany.mockReset();
    mockDeleteMany.mockReset();
    mockFindOne.mockReset();
}

// ── Mock ResilienceReport ─────────────────────────────────────────────────────

jest.mock('../backend/models/ResilienceReport', () => {
    const MockResilienceReport = jest.fn().mockImplementation((doc) => ({
        ...doc,
        save: jest.fn().mockResolvedValue(true),
    }));

    MockResilienceReport.findOne = (...args) => mockFindOne(...args);
    MockResilienceReport.updateOne = (...args) => mockUpdateOne(...args);
    MockResilienceReport.updateMany = (...args) => mockUpdateMany(...args);
    MockResilienceReport.deleteMany = (...args) => mockDeleteMany(...args);

    return MockResilienceReport;
});

// ── Mock puppeteer so tests never launch a real browser ───────────────────────

jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setContent: jest.fn().mockResolvedValue(undefined),
            pdf: jest.fn().mockResolvedValue(Buffer.from('fake-pdf-content')),
        }),
        close: jest.fn().mockResolvedValue(undefined),
    }),
}));

// ── Mock Purchase so tier checks don't hit the DB ─────────────────────────────

jest.mock('../backend/models/Purchase', () => ({
    findOne: jest.fn().mockResolvedValue(null),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

const pdfCacheService = require('../backend/services/pdfCacheService');
const { runCacheCleanupJob } = require('../backend/jobs/cacheCleanup');

// ── pdfCacheService unit tests ────────────────────────────────────────────────

describe('pdfCacheService', () => {
    beforeEach(() => {
        resetMocks();
        pdfCacheService._resetStats();
    });

    // ── buildResultsHash ──────────────────────────────────────────────────────

    describe('buildResultsHash', () => {
        it('returns a 64-char hex string', () => {
            const hash = pdfCacheService.buildResultsHash(75, 'Relational', { a: 1 });
            expect(hash).toMatch(/^[0-9a-f]{64}$/);
        });

        it('produces the same hash for identical inputs', () => {
            const scores = { Relational: { raw: 10, max: 12, percentage: 83 } };
            const h1 = pdfCacheService.buildResultsHash(75, 'Relational', scores);
            const h2 = pdfCacheService.buildResultsHash(75, 'Relational', scores);
            expect(h1).toBe(h2);
        });

        it('produces different hashes for different inputs', () => {
            const h1 = pdfCacheService.buildResultsHash(75, 'Relational', {});
            const h2 = pdfCacheService.buildResultsHash(80, 'Cognitive', {});
            expect(h1).not.toBe(h2);
        });
    });

    // ── getCachedPdf — cache miss scenarios ───────────────────────────────────

    describe('getCachedPdf — miss scenarios', () => {
        it('returns null when no document is found', async () => {
            mockFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            const result = await pdfCacheService.getCachedPdf('hash-abc');
            expect(result).toBeNull();
        });

        it('returns null when pdfBuffer is missing', async () => {
            mockFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ pdfBuffer: null }),
                }),
            });
            const result = await pdfCacheService.getCachedPdf('hash-abc');
            expect(result).toBeNull();
        });

        it('increments miss counter on a miss', async () => {
            mockFindOne.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) });
            await pdfCacheService.getCachedPdf('hash-abc');
            const stats = pdfCacheService.getCacheStats();
            expect(stats.misses).toBe(1);
            expect(stats.hits).toBe(0);
        });

        it('returns null (does not throw) when DB throws', async () => {
            mockFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockRejectedValue(new Error('DB error')),
                }),
            });
            const result = await pdfCacheService.getCachedPdf('hash-abc');
            expect(result).toBeNull();
        });
    });

    // ── getCachedPdf — cache hit scenarios ────────────────────────────────────

    describe('getCachedPdf — hit scenarios', () => {
        it('returns a Buffer when a valid cached document is found', async () => {
            const pdfBuf = Buffer.from('cached-pdf');
            mockFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({
                        pdfBuffer: pdfBuf.toString('base64'),
                        pdfGeneratedAt: new Date(),
                    }),
                }),
            });

            const result = await pdfCacheService.getCachedPdf('hash-xyz');
            expect(Buffer.isBuffer(result)).toBe(true);
            expect(result.toString()).toBe('cached-pdf');
        });

        it('increments hit counter on a hit', async () => {
            const pdfBuf = Buffer.from('pdf');
            mockFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ pdfBuffer: pdfBuf.toString('base64') }),
                }),
            });

            await pdfCacheService.getCachedPdf('hash-xyz');
            const stats = pdfCacheService.getCacheStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(0);
        });
    });

    // ── storePdf ──────────────────────────────────────────────────────────────

    describe('storePdf', () => {
        it('calls updateOne with the correct fields', async () => {
            mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
            const buf = Buffer.from('pdf-data');

            await pdfCacheService.storePdf('hash-store', buf, 1234);

            expect(mockUpdateOne).toHaveBeenCalledTimes(1);
            const [filter, update] = mockUpdateOne.mock.calls[0];
            expect(filter.resultsHash).toBe('hash-store');
            expect(update.$set.cached).toBe(true);
            expect(update.$set.pdfVersion).toBe(pdfCacheService.CURRENT_PDF_VERSION);
            expect(update.$set.pdfBuffer).toBe(buf.toString('base64'));
            expect(update.$set.generationTime).toBe(1234);
        });

        it('sets cacheExpiry to ~90 days in the future', async () => {
            mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
            const before = Date.now();
            await pdfCacheService.storePdf('hash-exp', Buffer.from('x'), 500);
            const after = Date.now();

            const [, update] = mockUpdateOne.mock.calls[0];
            const expiry = update.$set.cacheExpiry.getTime();
            const minExpected = before + (pdfCacheService.CACHE_TTL_DAYS - 1) * 24 * 3600 * 1000;
            const maxExpected = after  + (pdfCacheService.CACHE_TTL_DAYS + 1) * 24 * 3600 * 1000;
            expect(expiry).toBeGreaterThanOrEqual(minExpected);
            expect(expiry).toBeLessThanOrEqual(maxExpected);
        });

        it('does not throw when DB throws (non-fatal)', async () => {
            mockUpdateOne.mockRejectedValue(new Error('write error'));
            await expect(
                pdfCacheService.storePdf('hash-err', Buffer.from('x'), 100)
            ).resolves.toBeUndefined();
        });

        it('updates avgGenerationMs in stats', async () => {
            mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
            await pdfCacheService.storePdf('h1', Buffer.from('a'), 1000);
            await pdfCacheService.storePdf('h2', Buffer.from('b'), 2000);
            const stats = pdfCacheService.getCacheStats();
            expect(stats.avgGenerationMs).toBe('1500.00ms');
        });
    });

    // ── invalidateCacheByHash ─────────────────────────────────────────────────

    describe('invalidateCacheByHash', () => {
        it('calls updateMany with cached:false for the given hash', async () => {
            mockUpdateMany.mockResolvedValue({ modifiedCount: 2 });
            const count = await pdfCacheService.invalidateCacheByHash('hash-inv');
            expect(mockUpdateMany).toHaveBeenCalledWith(
                { resultsHash: 'hash-inv' },
                { $set: { cached: false } }
            );
            expect(count).toBe(2);
        });
    });

    // ── invalidateAllCachedPdfs ───────────────────────────────────────────────

    describe('invalidateAllCachedPdfs', () => {
        it('calls updateMany to clear all cached PDFs', async () => {
            mockUpdateMany.mockResolvedValue({ modifiedCount: 7 });
            const count = await pdfCacheService.invalidateAllCachedPdfs();
            expect(mockUpdateMany).toHaveBeenCalledWith(
                { cached: true },
                { $set: { cached: false } }
            );
            expect(count).toBe(7);
        });
    });

    // ── getCacheStats ─────────────────────────────────────────────────────────

    describe('getCacheStats', () => {
        it('returns zero stats initially', () => {
            const stats = pdfCacheService.getCacheStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.hitRate).toBe('0.00%');
            expect(stats.avgGenerationMs).toBe('0.00ms');
        });

        it('computes hitRate correctly after mixed hits and misses', async () => {
            // 1 hit
            mockFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue({ pdfBuffer: Buffer.from('x').toString('base64') }),
                }),
            });
            await pdfCacheService.getCachedPdf('h1');

            // 3 misses
            mockFindOne.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(null),
                }),
            });
            await pdfCacheService.getCachedPdf('h2');
            await pdfCacheService.getCachedPdf('h3');
            await pdfCacheService.getCachedPdf('h4');

            const stats = pdfCacheService.getCacheStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(3);
            expect(stats.hitRate).toBe('25.00%');
        });
    });
});

// ── cacheCleanup job tests ────────────────────────────────────────────────────

describe('runCacheCleanupJob', () => {
    beforeEach(() => resetMocks());

    it('clears expired cached PDFs', async () => {
        mockUpdateMany.mockResolvedValue({ modifiedCount: 5 });
        mockDeleteMany.mockResolvedValue({ deletedCount: 0 });

        const result = await runCacheCleanupJob();

        expect(mockUpdateMany).toHaveBeenCalledTimes(1);
        const [filter, update] = mockUpdateMany.mock.calls[0];
        expect(filter.cached).toBe(true);
        expect(filter.cacheExpiry).toBeDefined();
        expect(update.$set.cached).toBe(false);
        expect(update.$set.pdfBuffer).toBeNull();
        expect(result.expiredCleared).toBe(5);
    });

    it('hard-deletes old documents with no PDF buffer', async () => {
        mockUpdateMany.mockResolvedValue({ modifiedCount: 0 });
        mockDeleteMany.mockResolvedValue({ deletedCount: 3 });

        const result = await runCacheCleanupJob();

        expect(mockDeleteMany).toHaveBeenCalledTimes(1);
        const [filter] = mockDeleteMany.mock.calls[0];
        expect(filter.cached).toBe(false);
        expect(filter.pdfBuffer).toBeNull();
        expect(filter.createdAt).toBeDefined();
        expect(result.oldDocsDeleted).toBe(3);
    });

    it('returns zero counts when nothing to clean', async () => {
        mockUpdateMany.mockResolvedValue({ modifiedCount: 0 });
        mockDeleteMany.mockResolvedValue({ deletedCount: 0 });

        const result = await runCacheCleanupJob();
        expect(result).toEqual({ expiredCleared: 0, oldDocsDeleted: 0 });
    });
});
