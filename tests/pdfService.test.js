'use strict';

jest.mock('winston', () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
    return {
        createLogger: jest.fn(() => logger),
        format: {
            combine: jest.fn((...args) => args),
            timestamp: jest.fn(() => ({})),
            errors: jest.fn(() => ({})),
            splat: jest.fn(() => ({})),
            json: jest.fn(() => ({})),
            colorize: jest.fn(() => ({})),
            printf: jest.fn((fn) => fn),
        },
        transports: { Console: function () {}, File: function () {} },
    };
});

jest.mock('pdfkit', () => {
    const EventEmitter = require('events');
    const instances = [];

    class PDFDocument extends EventEmitter {
        constructor() {
            super();
            this.y = 0;
            this.page = { margins: { bottom: 45 } };
            this._pages = [this.page];
            this.image = jest.fn(() => this);
            instances.push(this);
        }

        addPage() {
            this.page = { margins: { bottom: 45 } };
            this._pages.push(this.page);
            return this;
        }

        bufferedPageRange() {
            return { start: 0, count: this._pages.length };
        }

        switchToPage(index) {
            this.page = this._pages[index] || this.page;
            return this;
        }

        heightOfString() {
            return 20;
        }

        text() {
            this.y += 10;
            return this;
        }

        end() {
            setImmediate(() => this.emit('end'));
            return this;
        }
    }

    const chainMethods = [
        'fontSize', 'font', 'moveDown', 'fillColor', 'strokeColor', 'rect', 'roundedRect',
        'fill', 'fillAndStroke', 'moveTo', 'lineTo', 'stroke', 'circle', 'lineWidth',
        'dash', 'undash', 'opacity', 'save', 'restore', 'translate', 'rotate', 'polygon',
    ];
    for (const method of chainMethods) {
        PDFDocument.prototype[method] = function () { return this; };
    }

    PDFDocument.__instances = instances;
    return PDFDocument;
});

const PDFDocument = require('pdfkit');
const { buildComprehensiveReport } = require('../backend/services/reportService');
const { buildPdfWithPDFKit } = require('../backend/services/pdfService');

const SAMPLE_SCORES = {
    'Cognitive-Narrative': { raw: 50, max: 60, percentage: 83.33 },
    'Relational-Connective': { raw: 45, max: 60, percentage: 75.0 },
    'Agentic-Generative': { raw: 42, max: 60, percentage: 70.0 },
    'Emotional-Adaptive': { raw: 38, max: 60, percentage: 63.33 },
    'Spiritual-Reflective': { raw: 40, max: 60, percentage: 66.67 },
    'Somatic-Regulative': { raw: 36, max: 60, percentage: 60.0 },
};

describe('pdfService cover logo', () => {
    beforeEach(() => {
        PDFDocument.__instances.length = 0;
    });

    test('uses logo-256x256.png and not compass icon on the cover', async () => {
        const report = buildComprehensiveReport({
            userId: 'u1',
            overall: 72,
            dominantType: 'Cognitive-Narrative',
            scores: SAMPLE_SCORES,
            resultsHash: 'abc',
            assessmentDate: new Date('2026-04-18T00:00:00.000Z'),
        });

        await buildPdfWithPDFKit(report, 72);

        const doc = PDFDocument.__instances[0];
        expect(doc).toBeDefined();
        expect(doc.image).toHaveBeenCalled();

        const imagePaths = doc.image.mock.calls.map(([imgPath]) => String(imgPath));
        expect(imagePaths.some((imgPath) => imgPath.includes('logo-256x256.png'))).toBe(true);
        expect(imagePaths.some((imgPath) => imgPath.includes('compass-icon'))).toBe(false);
    });
});

describe('pdfService page 2 - journey map layout', () => {
    beforeEach(() => {
        PDFDocument.__instances.length = 0;
    });

    test('renders without errors and does not use emoji in text calls', async () => {
        const report = buildComprehensiveReport({
            userId: 'u1',
            overall: 65,
            dominantType: 'Cognitive-Narrative',
            scores: SAMPLE_SCORES,
            resultsHash: 'abc',
            assessmentDate: new Date('2026-04-18T00:00:00.000Z'),
        });

        // Spy on text() to capture all text arguments
        const textArgs = [];
        PDFDocument.prototype.text = function (...args) {
            if (typeof args[0] === 'string') textArgs.push(args[0]);
            this.y += 10;
            return this;
        };

        await expect(buildPdfWithPDFKit(report, 65)).resolves.not.toThrow();

        // Skill level labels (not emojis alone) should appear in dimension rows
        const skillLabels = ['Developed Skill', 'Building Skill', 'Foundational Skill'];
        const hasSkillLabel = textArgs.some(t => skillLabels.some(l => t.includes(l)));
        expect(hasSkillLabel).toBe(true);
    });

    test('uses archetype name (not emoji) in stat tile', async () => {
        const report = buildComprehensiveReport({
            userId: 'u2',
            overall: 72,
            dominantType: 'Agentic-Generative',
            scores: SAMPLE_SCORES,
            resultsHash: 'def',
            assessmentDate: new Date('2026-04-18T00:00:00.000Z'),
        });

        const textArgs = [];
        PDFDocument.prototype.text = function (...args) {
            if (typeof args[0] === 'string') textArgs.push(args[0]);
            this.y += 10;
            return this;
        };

        await buildPdfWithPDFKit(report, 72);

        // The archetype name should be present (without "The " prefix and without emoji)
        const hasArchetype = textArgs.some(t => /^(Thinker|Connector|Navigator|Feeler|Guide|Regulator|Balanced)$/.test(t.trim()));
        expect(hasArchetype).toBe(true);

        // No standalone emoji should be used as the sole value in a stat tile
        const emojiOnlyTexts = textArgs.filter(t => /^[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(t.trim()));
        expect(emojiOnlyTexts).toHaveLength(0);
    });

    test('Growth Frontier tile shows skill level label not raw dimension name', async () => {
        const report = buildComprehensiveReport({
            userId: 'u3',
            overall: 55,
            dominantType: 'Cognitive-Narrative',
            scores: {
                'Cognitive-Narrative': { raw: 50, max: 60, percentage: 83.33 },
                'Relational-Connective': { raw: 45, max: 60, percentage: 75.0 },
                'Agentic-Generative': { raw: 42, max: 60, percentage: 70.0 },
                'Emotional-Adaptive': { raw: 38, max: 60, percentage: 63.33 },
                'Spiritual-Reflective': { raw: 40, max: 60, percentage: 66.67 },
                'Somatic-Regulative': { raw: 20, max: 60, percentage: 33.33 }, // lowest → Foundational Skill
            },
            resultsHash: 'ghi',
            assessmentDate: new Date('2026-04-18T00:00:00.000Z'),
        });

        const textArgs = [];
        PDFDocument.prototype.text = function (...args) {
            if (typeof args[0] === 'string') textArgs.push(args[0]);
            this.y += 10;
            return this;
        };

        await buildPdfWithPDFKit(report, 55);

        // The Growth Frontier tile should show "Foundational Skill" (skill level label)
        // for the dimension with 33.33% score
        expect(textArgs).toContain('Foundational Skill');
    });
});
