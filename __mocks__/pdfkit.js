/**
 * Root-level Jest mock for pdfkit.
 * Prevents native binary lookups when the package is not installed in tests.
 */
const EventEmitter = require('events');

class PDFDocument extends EventEmitter {
    constructor() { super(); }
    fontSize() { return this; }
    font() { return this; }
    text() { return this; }
    moveDown() { return this; }
    end() { setImmediate(() => this.emit('end')); return this; }
}

module.exports = PDFDocument;
