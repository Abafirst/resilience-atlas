/**
 * Root-level Jest mock for pdfkit.
 * Prevents native binary lookups when the package is not installed in tests.
 */
const EventEmitter = require('events');

class PDFDocument extends EventEmitter {
    constructor(opts) {
        super();
        this.y = 100;
        this.page = {
            height: 841.89,
            width: 595.28,
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
        };
    }
    // Text / font methods (chainable)
    fontSize() { return this; }
    font() { return this; }
    text() { return this; }
    moveDown() { return this; }
    heightOfString() { return 20; }
    // Drawing methods (chainable)
    rect() { return this; }
    roundedRect() { return this; }
    moveTo() { return this; }
    lineTo() { return this; }
    // Style methods (chainable)
    fill() { return this; }
    stroke() { return this; }
    fillAndStroke() { return this; }
    fillColor() { return this; }
    strokeColor() { return this; }
    // Page methods
    addPage() { return this; }
    switchToPage() { return this; }
    bufferedPageRange() { return { start: 0, count: 1 }; }
    // Finalise
    end() { setImmediate(() => this.emit('end')); return this; }
}

module.exports = PDFDocument;
