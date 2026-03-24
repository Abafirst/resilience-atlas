#!/usr/bin/env node
/**
 * generate-brand-assets.js
 * ========================
 * Converts the Resilience Atlas SVG master into PNG files at the
 * sizes required by the brand spec.
 *
 * Prerequisites:
 *   npm install --save-dev sharp
 *
 * Usage:
 *   node scripts/generate-brand-assets.js
 *
 * Output directory: brand/symbol/png/ and brand/symbol/web/
 */

const path = require('path');
const fs   = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch (_) {
  console.error(
    '\n  ERROR: "sharp" is not installed.\n' +
    '  Run:  npm install --save-dev sharp\n' +
    '  Then re-run this script.\n'
  );
  process.exit(1);
}

const ROOT       = path.resolve(__dirname, '..');
const SVG_MASTER = path.join(ROOT, 'brand/symbol/svg/symbol.svg');
const SVG_FAV    = path.join(ROOT, 'brand/symbol/web/favicon.svg');
const PNG_DIR    = path.join(ROOT, 'brand/symbol/png');
const WEB_DIR    = path.join(ROOT, 'brand/symbol/web');

// Ensure output directories exist
[PNG_DIR, WEB_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const svgMaster  = fs.readFileSync(SVG_MASTER);
const svgFavicon = fs.readFileSync(SVG_FAV);

/** @type {Array<{src: Buffer, file: string, dir: string, size: number}>} */
const jobs = [
  // Favicon sizes (from favicon SVG for best small-size rendering)
  { src: svgFavicon, dir: PNG_DIR, file: 'favicon-16x16.png',   size: 16  },
  { src: svgFavicon, dir: PNG_DIR, file: 'favicon-32x32.png',   size: 32  },
  { src: svgFavicon, dir: PNG_DIR, file: 'favicon-64x64.png',   size: 64  },

  // Icon sizes (from master SVG)
  { src: svgMaster, dir: PNG_DIR, file: 'icon-48x48.png',      size: 48  },
  { src: svgMaster, dir: PNG_DIR, file: 'icon-64x64.png',      size: 64  },
  { src: svgMaster, dir: PNG_DIR, file: 'icon-96x96.png',      size: 96  },
  { src: svgMaster, dir: PNG_DIR, file: 'icon-128x128.png',    size: 128 },
  { src: svgMaster, dir: PNG_DIR, file: 'icon-192x192.png',    size: 192 },
  { src: svgMaster, dir: PNG_DIR, file: 'icon-256x256.png',    size: 256 },

  // Logo sizes
  { src: svgMaster, dir: PNG_DIR, file: 'logo-256x256.png',    size: 256 },
  { src: svgMaster, dir: PNG_DIR, file: 'logo-512x512.png',    size: 512 },

  // Social media
  { src: svgMaster, dir: PNG_DIR, file: 'social-1080x1080.png', size: 1080 },
  { src: svgMaster, dir: PNG_DIR, file: 'social-400x400.png',   size: 400  },
  { src: svgMaster, dir: PNG_DIR, file: 'watermark-200x200.png', size: 200 },

  // Web / Apple touch icon
  { src: svgMaster, dir: WEB_DIR, file: 'apple-touch-icon.png', size: 180 },
];

async function run() {
  console.log('Generating Resilience Atlas brand PNG assets…\n');

  for (const job of jobs) {
    const dest = path.join(job.dir, job.file);
    await sharp(job.src)
      .resize(job.size, job.size)
      .png()
      .toFile(dest);
    console.log(`  ✓  ${path.relative(ROOT, dest)}  (${job.size}×${job.size})`);
  }

  console.log('\nDone. All PNG files written to brand/symbol/png/ and brand/symbol/web/');
}

run().catch(err => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});
