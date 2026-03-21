/**
 * render-social.js
 *
 * Renders all social-card HTML templates to 1080×1080 PNG files using Puppeteer.
 *
 * Usage:
 *   npm run social:build
 *   # or directly:
 *   node scripts/render-social.js
 *
 * Output: assets/social/generated/<template-name>.png  (12 files total)
 *
 * Requirements: Node ≥ 18, puppeteer (already in project dependencies).
 */

'use strict';

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.resolve(__dirname, '../assets/social/templates');
const OUTPUT_DIR = path.resolve(__dirname, '../assets/social/generated');
const CARD_SIZE = 1080;

async function renderTemplates() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.html'));

  if (files.length === 0) {
    console.error('No HTML templates found in', TEMPLATES_DIR);
    process.exit(1);
  }

  console.log(`Launching Puppeteer — rendering ${files.length} template(s) at ${CARD_SIZE}×${CARD_SIZE}…\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  });

  const errors = [];

  for (const file of files.sort()) {
    const templatePath = path.join(TEMPLATES_DIR, file);
    const outputFile = file.replace('.html', '.png');
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    try {
      const page = await browser.newPage();

      await page.setViewport({
        width: CARD_SIZE,
        height: CARD_SIZE,
        deviceScaleFactor: 1,
      });

      await page.goto(`file://${templatePath}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Wait for Google Fonts to load (if network is available) or fall back to web-safe fonts
      await page.evaluate(() => document.fonts.ready);

      await page.screenshot({
        path: outputPath,
        type: 'png',
        clip: { x: 0, y: 0, width: CARD_SIZE, height: CARD_SIZE },
      });

      await page.close();
      console.log(`  ✓  ${outputFile}`);
    } catch (err) {
      errors.push({ file, err });
      console.error(`  ✗  ${file}: ${err.message}`);
    }
  }

  await browser.close();

  console.log(`\nDone. ${files.length - errors.length} / ${files.length} PNG(s) written to:\n  ${OUTPUT_DIR}\n`);

  if (errors.length > 0) {
    console.error(`${errors.length} error(s) occurred. See above for details.`);
    process.exit(1);
  }
}

renderTemplates().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
