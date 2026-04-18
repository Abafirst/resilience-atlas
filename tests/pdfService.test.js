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

describe('pdfService cover logo', () => {
    beforeEach(() => {
        PDFDocument.__instances.length = 0;
    });

    test('uses logo-256x256.png and not compass icon on the cover', async () => {
        const report = buildComprehensiveReport({
            userId: 'u1',
            overall: 72,
            dominantType: 'Cognitive-Narrative',
            scores: {
                'Cognitive-Narrative': { raw: 50, max: 60, percentage: 83.33 },
                'Relational-Connective': { raw: 45, max: 60, percentage: 75.0 },
                'Agentic-Generative': { raw: 42, max: 60, percentage: 70.0 },
                'Emotional-Adaptive': { raw: 38, max: 60, percentage: 63.33 },
                'Spiritual-Reflective': { raw: 40, max: 60, percentage: 66.67 },
                'Somatic-Regulative': { raw: 36, max: 60, percentage: 60.0 },
            },
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
