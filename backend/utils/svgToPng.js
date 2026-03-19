'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { Resvg } = require('@resvg/resvg-js');

/**
 * Render an SVG file to a PNG and cache it in os.tmpdir().
 *
 * Uses @resvg/resvg-js which works on Railway (Linux) without requiring
 * system-level packages such as librsvg or ImageMagick.
 *
 * @param {string} svgFilePath - Absolute path to the source SVG file.
 * @param {string} [cacheKey]  - Optional cache filename stem (no extension).
 *                               Defaults to a hash of the basename.
 * @returns {Promise<string>} Absolute path to the cached PNG file.
 */
async function svgToPng(svgFilePath, cacheKey) {
    const stem = cacheKey || ('ra-svg-' + path.basename(svgFilePath, '.svg'));
    const pngPath = path.join(os.tmpdir(), stem + '.png');

    // Reuse cached file if it already exists.
    if (fs.existsSync(pngPath)) {
        return pngPath;
    }

    const svgData = fs.readFileSync(svgFilePath);
    const resvg = new Resvg(svgData, {
        fitTo: { mode: 'width', value: 400 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    fs.writeFileSync(pngPath, pngBuffer);
    return pngPath;
}

module.exports = { svgToPng };
